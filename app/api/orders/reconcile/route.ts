import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { syncCurrentClerkUser } from "@/lib/clerk-user-sync";

const stripeSecretKey =
  process.env.sandbox_secret_key_stripe || process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

export async function POST() {
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

    const pendingOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, "pending")))
      .orderBy(desc(orders.createdAt));

    let updatedCount = 0;

    for (const order of pendingOrders) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

        if (session.payment_status === "paid") {
          const previousMetadata =
            typeof order.metadata === "object" && order.metadata !== null
              ? (order.metadata as Record<string, unknown>)
              : {};

          await db
            .update(orders)
            .set({
              status: "completed",
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,
              updatedAt: new Date(),
              metadata: {
                ...previousMetadata,
                paymentStatus: session.payment_status,
                amountTotal: session.amount_total,
                customerDetails: session.customer_details,
                reconciledAt: new Date().toISOString(),
                checkoutSessionId: session.id,
              },
            })
            .where(eq(orders.id, order.id));

          updatedCount += 1;
        }
      } catch (error) {
        console.warn("[Orders Reconcile] Could not verify Stripe session", {
          orderId: order.id,
          stripeSessionId: order.stripeSessionId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log("[Orders Reconcile] Completed", {
      userId: userId.slice(0, 8),
      pendingChecked: pendingOrders.length,
      updatedCount,
    });

    return NextResponse.json({
      checked: pendingOrders.length,
      updated: updatedCount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reconcile orders.";
    console.error("[Orders Reconcile] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
