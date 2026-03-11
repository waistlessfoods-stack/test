import Stripe from "stripe";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

const stripeSecretKey =
    process.env.sandbox_secret_key_stripe || process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

// Helper to detect transient database errors
function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("epipe") ||
    message.includes("connection reset") ||
    message.includes("timeout")
  );
}

// Retry wrapper for database operations with exponential backoff
async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!isTransientDbError(error) || attempt >= maxAttempts - 1) {
        throw lastError;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delay = 500 * Math.pow(2, attempt);
      console.log(
        `[DB Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const REQUEST_TIMEOUT = 5000; // 5 second timeout for entire request
  console.log("[Checkout] Request started");

  if (!stripe) {
    console.error("[Checkout] Stripe not configured");
    return NextResponse.json(
      { error: "Stripe secret key is not configured." },
      { status: 500 },
    );
  }

  // Helper to check if we've exceeded timeout
  const checkTimeout = (phase: string) => {
    const elapsed = Date.now() - startTime;
    if (elapsed > REQUEST_TIMEOUT) {
      console.error(`[Checkout] Timeout exceeded in ${phase}: ${elapsed}ms > ${REQUEST_TIMEOUT}ms`);
      throw new Error(`Request timeout in ${phase} (${elapsed}ms)`);
    }
  };

  try {
    // Check authentication
    console.log("[Checkout] Checking authentication...");
    const authStart = Date.now();
    const { userId } = await auth();
    const user = await currentUser();
    const authDuration = Date.now() - authStart;
    console.log(`[Checkout] Auth check completed in ${authDuration}ms`, {
      sessionExists: !!userId,
      userId: userId?.slice(0, 8),
    });
    
    // Warn if auth is taking too long (might indicate database issues)
    if (authDuration > 2000) {
      console.warn(
        `[Checkout] ⚠️  Auth check took ${authDuration}ms (>2000ms threshold) - database may be slow`
      );
    }

    if (!userId || !user?.primaryEmailAddress?.emailAddress) {
      console.warn("[Checkout] Not authenticated");
      return NextResponse.json(
        { error: "You must be signed in to checkout. Please sign in or create an account." },
        { status: 401 },
      );
    }

    const customerEmail = user.primaryEmailAddress.emailAddress;

    console.log("[Checkout] Parsing request body...");
    const bodyStart = Date.now();
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const body = await request.json();
    const { items } = body;
    console.log(`[Checkout] Body parsed in ${Date.now() - bodyStart}ms`, {
      itemCount: items?.length || 0,
      totalPrice: items?.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) || 0,
    });

    // If no items provided, use test item (for stripe-test page)
    console.log("[Checkout] Building line items...");
    const lineItemsStart = Date.now();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      items && items.length > 0
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
    console.log(`[Checkout] Line items built in ${Date.now() - lineItemsStart}ms`, {
      lineItemCount: lineItems.length,
    });

    // Calculate total amount
    const totalAmount = items && items.length > 0
      ? items.reduce(
          (sum: number, item: any) => sum + Math.round(item.price * 100) * item.quantity,
          0
        )
      : 500;
    console.log("[Checkout] Total amount:", totalAmount, "cents");

    // Generate idempotency key from user + items to prevent duplicate charges on retries
    console.log("[Checkout] Generating idempotency key...");
    const idempotencyPayload = `${userId}:${JSON.stringify(items || [])}:${totalAmount}`;
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(idempotencyPayload)
      .digest("hex")
      .slice(0, 32); // Stripe idempotency keys must be <= 32 chars
    console.log("[Checkout] Idempotency key generated:", idempotencyKey);

    // Create Stripe session with idempotency key to prevent double-charging on network retries
    // (Stripe handles duplicate prevention, so we don't need database dedup check)
    console.log("[Checkout] Creating Stripe checkout session...");
    const stripeStart = Date.now();
    const stripeSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        customer_email: customerEmail,
        metadata: {
          userId,
        },
        success_url: `${origin}/orders?success=1`,
        cancel_url: `${origin}/shop?canceled=1`,
      },
      {
        idempotencyKey, // Prevents duplicate charges if request is retried
      }
    );
    console.log(`[Checkout] Stripe session created in ${Date.now() - stripeStart}ms`, {
      sessionId: stripeSession.id.slice(0, 8),
      url: !!stripeSession.url,
    });

    // Create pending order in database with retry logic
    console.log("[Checkout] Inserting order into database...");
    const dbStart = Date.now();
    await withDbRetry(
      () =>
        db.insert(orders).values({
          userId,
          stripeSessionId: stripeSession.id,
          status: "pending",
          amount: totalAmount,
          currency: "usd",
          items: items || [],
          customerEmail: customerEmail,
          metadata: {
            sessionUrl: stripeSession.url,
          },
        })
    );
    console.log(`[Checkout] Order inserted in ${Date.now() - dbStart}ms`);

    const successTime = Date.now() - startTime;
    console.log("[Checkout] Request completed successfully in", successTime, "ms", {
      sessionUrl: stripeSession.url?.slice(0, 50),
    });
    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error("[Checkout] Error after", elapsedTime, "ms:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const isTimeoutError = 
      error instanceof Error && 
      (error.message.includes("timeout") || 
       error.message.includes("ETIMEDOUT") ||
       error.message.includes("Failed query"));

    // Return 503 for transient database issues (suggest retry)
    if (isTimeoutError) {
      console.error(
        `[Checkout] Timeout error after ${elapsedTime}ms - returning 503 for retry`
      );
      return NextResponse.json(
        { error: "Database connection timeout. Please try again." },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes("Temporary database")) {
      return NextResponse.json(
        { error: "Database connection issue. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to create session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
