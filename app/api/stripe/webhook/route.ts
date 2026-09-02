import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendOrderConfirmationOnce } from "@/lib/email/send-order-confirmation";

const stripeSecretKey =
  process.env.sandbox_secret_key_stripe || process.env.STRIPE_SECRET_KEY;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided." },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errorMessage);
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    console.log("[Stripe Webhook] Event received:", event.type);

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadataOrderId = Number(session.metadata?.orderId);

      let updated: Array<{ id: number }> = [];

      // Primary match by session id.
      updated = await db
        .update(orders)
        .set({
          status: "completed",
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          updatedAt: new Date(),
          metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || ${JSON.stringify({
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total,
            customerDetails: session.customer_details,
            checkoutSessionId: session.id,
          })}::jsonb`,
        })
        .where(eq(orders.stripeSessionId, session.id))
        .returning({ id: orders.id });

      // Fallback match by explicit orderId metadata when session id did not match.
      if (updated.length === 0 && Number.isInteger(metadataOrderId) && metadataOrderId > 0) {
        updated = await db
          .update(orders)
          .set({
            status: "completed",
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            updatedAt: new Date(),
            metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || ${JSON.stringify({
              paymentStatus: session.payment_status,
              amountTotal: session.amount_total,
              customerDetails: session.customer_details,
              checkoutSessionId: session.id,
            })}::jsonb`,
          })
          .where(eq(orders.id, metadataOrderId))
          .returning({ id: orders.id });
      }

      if (updated.length === 0) {
        console.warn("[Stripe Webhook] No order row matched checkout.session.completed", {
          sessionId: session.id,
          metadataOrderId: session.metadata?.orderId,
        });
      } else {
        for (const order of updated) {
          await sendOrderConfirmationOnce({
            orderId: order.id,
            customerName: session.customer_details?.name,
          });
        }

        console.log("[Stripe Webhook] Order marked completed", {
          orderIds: updated.map((row) => row.id),
          sessionId: session.id,
        });
      }
    }

    // Handle payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("[Stripe Webhook] Payment intent succeeded", {
        paymentIntentId: paymentIntent.id,
      });
    }

    // Handle payment_intent.payment_failed event
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update order status to failed
      const updated = await db
        .update(orders)
        .set({
          status: "failed",
          stripePaymentIntentId: paymentIntent.id,
          updatedAt: new Date(),
        })
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
        .returning({ id: orders.id });

      console.log("[Stripe Webhook] Payment failed", {
        paymentIntentId: paymentIntent.id,
        affectedOrders: updated.map((row) => row.id),
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Webhook handler error:", message);
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 }
    );
  }
}
