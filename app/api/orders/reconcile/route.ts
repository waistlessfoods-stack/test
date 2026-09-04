import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
  getClerkUserIdentityIds,
  syncCurrentClerkUser,
} from "@/lib/clerk-user-sync";
import { sendOrderConfirmationOnce } from "@/lib/email/send-order-confirmation";
import { getStripeSecretKey } from "@/lib/stripe-config";

const stripeSecretKey = getStripeSecretKey();

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

    const syncResult = await syncCurrentClerkUser();
    const ownerIds = getClerkUserIdentityIds(userId, syncResult);

    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(inArray(orders.userId, ownerIds), eq(orders.status, "pending"))
      )
      .orderBy(desc(orders.createdAt));

    let updatedCount = 0;
    let confirmationFailures = 0;

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

          try {
            await sendOrderConfirmationOnce({
              orderId: order.id,
              customerName: session.customer_details?.name,
            });
          } catch (emailError) {
            confirmationFailures += 1;
            console.warn("[Orders Reconcile] Confirmation email failed", {
              orderId: order.id,
              message:
                emailError instanceof Error
                  ? emailError.message
                  : String(emailError),
            });
          }
        }
      } catch (error) {
        console.warn("[Orders Reconcile] Could not verify Stripe session", {
          orderId: order.id,
          stripeSessionId: order.stripeSessionId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const retryableConfirmations = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          inArray(orders.userId, ownerIds),
          eq(orders.status, "completed"),
          sql`${orders.metadata}->>'orderConfirmationError' is not null`
        )
      )
      .orderBy(desc(orders.createdAt));

    for (const order of retryableConfirmations) {
      try {
        await sendOrderConfirmationOnce({ orderId: order.id });
      } catch {
        confirmationFailures += 1;
      }
    }

    console.log("[Orders Reconcile] Completed", {
      userId: userId.slice(0, 8),
      pendingChecked: pendingOrders.length,
      updatedCount,
      confirmationFailures,
    });

    return NextResponse.json({
      checked: pendingOrders.length,
      updated: updatedCount,
      confirmationFailures,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reconcile orders.";
    console.error("[Orders Reconcile] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
