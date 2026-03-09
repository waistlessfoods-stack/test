import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

const stripeSecretKey =
    process.env.sandbox_secret_key_stripe || process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe secret key is not configured." },
      { status: 500 },
    );
  }

  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to checkout. Please sign in or create an account." },
        { status: 401 },
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const body = await request.json();
    const { items } = body;

    // If no items provided, use test item (for stripe-test page)
    const lineItems = items && items.length > 0
      ? items.map((item: any) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(item.price * 100), // Convert to cents
            product_data: {
              name: item.name,
              ...(item.imagePath && { images: [item.imagePath] }),
            },
          },
        }))
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: 500,
              product_data: {
                name: "Stripe Test Item",
                description: "One-time test payment",
              },
            },
          },
        ];

    // Calculate total amount
    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.price_data.unit_amount,
      0
    );

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
      success_url: `${origin}/orders?success=1`,
      cancel_url: `${origin}/shop?canceled=1`,
    });

    // Create pending order in database
    await db.insert(orders).values({
      userId: session.user.id,
      stripeSessionId: stripeSession.id,
      status: "pending",
      amount: totalAmount,
      currency: "usd",
      items: items || [],
      customerEmail: session.user.email,
      metadata: {
        sessionUrl: stripeSession.url,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
