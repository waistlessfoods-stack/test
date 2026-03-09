import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Update order status to completed
      await db
        .update(orders)
        .set({
          status: "completed",
          stripePaymentIntentId: session.payment_intent as string,
          updatedAt: new Date(),
          metadata: {
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total,
            customerDetails: session.customer_details,
          },
        })
        .where(eq(orders.stripeSessionId, session.id));

      console.log(`Order completed for session: ${session.id}`);
    }

    // Handle payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment succeeded: ${paymentIntent.id}`);
    }

    // Handle payment_intent.payment_failed event
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update order status to failed
      await db
        .update(orders)
        .set({
          status: "failed",
          stripePaymentIntentId: paymentIntent.id,
          updatedAt: new Date(),
        })
        .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

      console.log(`Payment failed: ${paymentIntent.id}`);
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
