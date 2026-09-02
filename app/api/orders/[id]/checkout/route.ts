import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
  getClerkUserIdentityIds,
  syncCurrentClerkUser,
} from "@/lib/clerk-user-sync";
import { getCanonicalAppUrl } from "@/lib/app-url";
import {
  buildStripeLineItemsFromSnapshot,
  resolveOrderCheckoutSnapshot,
} from "@/lib/order-checkout-snapshot";
import { arePublicCookingClassesEnabled } from "@/lib/public-cooking-classes";

const stripeSecretKey =
  process.env.sandbox_secret_key_stripe || process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe secret key is not configured." },
      { status: 500 }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const syncResult = await syncCurrentClerkUser();
    const ownerIds = getClerkUserIdentityIds(userId, syncResult);
    const appUrl = getCanonicalAppUrl();

    const { id } = await context.params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
    }

    const existingOrder = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), inArray(orders.userId, ownerIds)),
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (existingOrder.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be paid." },
        { status: 400 }
      );
    }

    const checkoutSnapshot = resolveOrderCheckoutSnapshot({
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      items: existingOrder.items,
      metadata: existingOrder.metadata,
    });

    if (!checkoutSnapshot) {
      return NextResponse.json(
        { error: "Order checkout data is invalid. Please contact support." },
        { status: 400 }
      );
    }

    if (
      !arePublicCookingClassesEnabled() &&
      checkoutSnapshot.items.some((item) => item.kind === "cooking_class")
    ) {
      return NextResponse.json(
        { error: "Public cooking classes are not currently available." },
        { status: 400 }
      );
    }

    // Reuse existing open checkout session if Stripe still has a valid URL.
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        existingOrder.stripeSessionId
      );
      if (existingSession.status === "open" && existingSession.url) {
        return NextResponse.json({ url: existingSession.url, reused: true });
      }
    } catch {
      // If retrieval fails, we create a new session below.
    }

    const lineItems = buildStripeLineItemsFromSnapshot(checkoutSnapshot);

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: existingOrder.customerEmail || undefined,
      metadata: {
        userId: existingOrder.userId,
        orderId: String(existingOrder.id),
      },
      success_url: `${appUrl}/orders?success=1`,
      cancel_url: `${appUrl}/orders?resume=1`,
    });

    const previousMetadata =
      typeof existingOrder.metadata === "object" && existingOrder.metadata !== null
        ? (existingOrder.metadata as Record<string, unknown>)
        : {};

    await db
      .update(orders)
      .set({
        stripeSessionId: stripeSession.id,
        updatedAt: new Date(),
        metadata: {
          ...previousMetadata,
          checkoutSnapshot,
          previousStripeSessionId: existingOrder.stripeSessionId,
          sessionUrl: stripeSession.url,
          resumedAt: new Date().toISOString(),
        },
      })
      .where(eq(orders.id, existingOrder.id));

    return NextResponse.json({ url: stripeSession.url, reused: false });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resume checkout.";
    console.error("Resume checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
