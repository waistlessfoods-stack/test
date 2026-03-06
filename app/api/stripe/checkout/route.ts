import Stripe from "stripe";
import { NextResponse } from "next/server";

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${origin}/stripe-test?success=1`,
      cancel_url: `${origin}/stripe-test?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
