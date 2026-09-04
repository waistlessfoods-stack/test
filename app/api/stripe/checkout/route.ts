import Stripe from "stripe";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { syncCurrentClerkUser } from "@/lib/clerk-user-sync";
import { getCanonicalAppUrl } from "@/lib/app-url";
import {
  buildStripeLineItemsFromSnapshot,
  createOrderCheckoutSnapshot,
} from "@/lib/order-checkout-snapshot";
import { calculateCartTotals } from "@/lib/pricing";
import { getServerSalesTaxRate } from "@/lib/tax-settings";
import {
  fetchShopPageFromContentful,
  isCookingClassProduct,
} from "@/lib/contentful-management";
import { arePublicCookingClassesEnabled } from "@/lib/public-cooking-classes";
import { getStripeSecretKey } from "@/lib/stripe-config";
import { getCookingClassAvailabilityError } from "@/lib/cooking-class-capacity";
import { eq } from "drizzle-orm";

const stripeSecretKey = getStripeSecretKey();

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

type CheckoutItem = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  quantity: number;
  imagePath?: string;
  kind?: "recipe" | "cooking_class";
  capacity?: number;
  eventDate?: string;
};

type CheckoutItemRequest = {
  id?: string;
  slug?: string;
  quantity: number;
};

function toCheckoutItemRequest(item: unknown): CheckoutItemRequest | null {
  if (!item || typeof item !== "object") return null;

  const maybeItem = item as {
    id?: unknown;
    slug?: unknown;
    quantity?: unknown;
  };

  const id =
    typeof maybeItem.id === "string" && maybeItem.id.trim().length > 0
      ? maybeItem.id.trim()
      : undefined;
  const slug =
    typeof maybeItem.slug === "string" && maybeItem.slug.trim().length > 0
      ? maybeItem.slug.trim()
      : undefined;
  const quantity = Number(maybeItem.quantity);

  if ((!id && !slug) || !Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  return {
    id,
    slug,
    quantity: Math.min(quantity, 20),
  };
}

function parseRecipePrice(price: string): number | null {
  const normalized = price.trim().toLowerCase();

  if (!normalized || normalized === "free") {
    return null;
  }

  const parsed = Number(normalized.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

async function resolveCheckoutItems(rawItems: unknown): Promise<CheckoutItem[]> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return [];
  }

  const requestedItems = rawItems
    .map(toCheckoutItemRequest)
    .filter((item): item is CheckoutItemRequest => Boolean(item));

  if (requestedItems.length === 0) {
    return [];
  }

  const shopData = await fetchShopPageFromContentful();
  const paidRecipes = shopData.recipes
    .filter(
      (recipe) =>
        arePublicCookingClassesEnabled() || !isCookingClassProduct(recipe)
    )
    .map((recipe) => ({
      ...recipe,
      numericPrice: parseRecipePrice(recipe.price),
    }))
    .filter((recipe) => recipe.numericPrice !== null);

  const byId = new Map(paidRecipes.map((recipe) => [recipe.id, recipe]));
  const bySlug = new Map(paidRecipes.map((recipe) => [recipe.slug, recipe]));
  const resolvedItems = new Map<string, CheckoutItem>();
  const completedOrderItems = paidRecipes.some(
    (recipe) => recipe.productKind === "cooking_class"
  )
    ? await db
        .select({ items: orders.items })
        .from(orders)
        .where(eq(orders.status, "completed"))
    : [];
  const cookingClassTitleById = new Map(
    paidRecipes
      .filter((recipe) => recipe.productKind === "cooking_class")
      .map((recipe) => [recipe.id, recipe.title.trim().toLowerCase()])
  );
  const soldQuantityByProductId = new Map<string, number>();

  for (const order of completedOrderItems) {
    if (!Array.isArray(order.items)) continue;

    for (const storedItem of order.items) {
      if (!storedItem || typeof storedItem !== "object") continue;
      const item = storedItem as {
        id?: unknown;
        name?: unknown;
        quantity?: unknown;
        kind?: unknown;
      };
      if (typeof item.id !== "string") continue;
      const currentClassTitle = cookingClassTitleById.get(item.id);
      const storedTitle =
        typeof item.name === "string" ? item.name.trim().toLowerCase() : "";
      const belongsToCurrentClass =
        item.kind === "cooking_class" ||
        (Boolean(currentClassTitle) && storedTitle === currentClassTitle);
      if (!belongsToCurrentClass) continue;

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) continue;

      soldQuantityByProductId.set(
        item.id,
        (soldQuantityByProductId.get(item.id) ?? 0) + quantity
      );
    }
  }

  for (const item of requestedItems) {
    const recipe =
      (item.id ? byId.get(item.id) : undefined) ||
      (item.slug ? bySlug.get(item.slug) : undefined);

    if (!recipe || recipe.numericPrice === null) {
      throw new Error("One or more cart items are no longer available.");
    }

    const existing = resolvedItems.get(recipe.id);
    const nextQuantity = (existing?.quantity ?? 0) + item.quantity;
    const capacity =
      recipe.productKind === "cooking_class" ? recipe.capacity ?? 10 : 20;
    const soldQuantity = soldQuantityByProductId.get(recipe.id) ?? 0;
    if (recipe.productKind === "cooking_class") {
      const availabilityError = getCookingClassAvailabilityError({
        title: recipe.title,
        capacity,
        soldQuantity,
        requestedQuantity: nextQuantity,
      });

      if (availabilityError) {
        throw new Error(availabilityError);
      }
    }

    if (nextQuantity > capacity) {
      throw new Error(`The maximum quantity for ${recipe.title} is ${capacity}.`);
    }

    resolvedItems.set(recipe.id, {
      id: recipe.id,
      name: recipe.title,
      slug: recipe.slug,
      price: recipe.numericPrice,
      quantity: nextQuantity,
      imagePath: recipe.imagePath ?? undefined,
      kind: recipe.productKind,
      capacity:
        recipe.productKind === "cooking_class" ? capacity : undefined,
      eventDate: recipe.eventDate,
    });
  }

  return [...resolvedItems.values()];
}

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
  console.log("[Checkout] Request started");

  if (!stripe) {
    console.error("[Checkout] Stripe not configured");
    return NextResponse.json(
      { error: "Stripe secret key is not configured." },
      { status: 500 },
    );
  }

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

    const syncResult = await syncCurrentClerkUser();
    const orderOwnerId = syncResult.skipped ? userId : syncResult.userId;

    const customerEmail = user.primaryEmailAddress.emailAddress;
    const appUrl = getCanonicalAppUrl();

    console.log("[Checkout] Parsing request body...");
    const bodyStart = Date.now();
    let body: { items?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const rawItems = body?.items;
    const items = await resolveCheckoutItems(rawItems);
    console.log(`[Checkout] Body parsed in ${Date.now() - bodyStart}ms`, {
      itemCount: items?.length || 0,
      totalPrice:
        items?.reduce(
          (sum: number, item: CheckoutItem) =>
            sum + item.price * item.quantity,
          0
        ) || 0,
    });

    const taxRate = await getServerSalesTaxRate();
    const totals = calculateCartTotals(items, taxRate);
    const checkoutSnapshot = createOrderCheckoutSnapshot({
      currency: "usd",
      items,
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      taxRate,
    });

    const allowTestCheckout =
      items.length === 0 && process.env.NODE_ENV !== "production";

    if (items.length === 0 && !allowTestCheckout) {
      return NextResponse.json(
        { error: "Your cart is empty or contains unavailable items." },
        { status: 400 },
      );
    }

    // If no items provided in development, use test item (for stripe-test page)
    console.log("[Checkout] Building line items...");
    const lineItemsStart = Date.now();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      items.length > 0
        ? buildStripeLineItemsFromSnapshot(checkoutSnapshot)
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
    const totalAmount = items.length > 0 ? totals.totalCents : 500;
    console.log("[Checkout] Amount breakdown:", {
      subtotal: totals.subtotalCents,
      tax: totals.taxCents,
      total: totalAmount,
      taxRate,
    });

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
          userId: orderOwnerId,
          subtotalCents: String(totals.subtotalCents),
          taxCents: String(totals.taxCents),
        },
        success_url: `${appUrl}/orders?success=1`,
        cancel_url: `${appUrl}/shop?canceled=1`,
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
          userId: orderOwnerId,
          stripeSessionId: stripeSession.id,
          status: "pending",
          amount: totalAmount,
          currency: "usd",
          items: items || [],
          customerEmail: customerEmail,
          metadata: {
            sessionUrl: stripeSession.url,
            checkoutSnapshot,
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
