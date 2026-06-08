import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { syncCurrentClerkUser } from "@/lib/clerk-user-sync";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagePath?: string;
};

const stripeSecretKey =
  process.env.sandbox_secret_key_stripe || process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

function isOrderItems(value: unknown): value is OrderItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as OrderItem).name === "string" &&
        typeof (item as OrderItem).price === "number" &&
        typeof (item as OrderItem).quantity === "number"
    )
  );
}

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

    await syncCurrentClerkUser();

    const { id } = await context.params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
    }

    const existingOrder = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
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

    const origin = request.headers.get("origin") || "http://localhost:3000";

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

    if (!isOrderItems(existingOrder.items) || existingOrder.items.length === 0) {
      return NextResponse.json(
        { error: "Order items are invalid. Please contact support." },
        { status: 400 }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      existingOrder.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: existingOrder.currency,
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            ...(item.imagePath && { images: [item.imagePath] }),
          },
        },
      }));

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: existingOrder.customerEmail || undefined,
      metadata: {
        userId,
        orderId: String(existingOrder.id),
      },
      success_url: `${origin}/orders?success=1`,
      cancel_url: `${origin}/orders?resume=1`,
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
