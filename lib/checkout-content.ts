import type Stripe from "stripe";
import type { Recipe } from "@/lib/contentful-management";
import type { StoredOrderItem } from "@/lib/order-checkout-snapshot";

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type CheckoutMode = "test" | "live";
export function checkoutKeyMode(key: string): CheckoutMode {
  if (/^[sr]k_test_/.test(key)) return "test";
  if (/^[sr]k_live_/.test(key)) return "live";
  throw new CheckoutError("The payment configuration needs review. Please contact support.", 503);
}

// Prices, titles, dates, and limits always come from the published catalogue.
export function resolveCheckoutItems(raw: unknown, catalogue: Recipe[], classesEnabled: boolean): StoredOrderItem[] {
  if (!Array.isArray(raw) || !raw.length || raw.length > 40) throw new CheckoutError("Choose between 1 and 40 cart items.");
  const items = new Map<string, StoredOrderItem>();
  for (const value of raw) {
    if (!value || typeof value !== "object") throw new CheckoutError("Check your cart items.");
    const request = value as Record<string, unknown>;
    if (!Number.isSafeInteger(request.quantity) || Number(request.quantity) < 1 || Number(request.quantity) > 20) throw new CheckoutError("Choose a quantity from 1 to 20 for each cart item.");
    const recipe = catalogue.find(recipe => (typeof request.id === 'string' && request.id === recipe.id) || (typeof request.slug === 'string' && request.slug === recipe.slug));
    if (!recipe || (request.id && request.slug && (request.id !== recipe.id || request.slug !== recipe.slug))) throw new CheckoutError("One or more cart items are no longer available.");
    const isClass = recipe.productKind === 'cooking_class';
    if (isClass && !classesEnabled) throw new CheckoutError("Public cooking classes are not currently available.");
    const price = Number(recipe.price.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(price) || price <= 0 || !Number.isSafeInteger(Math.round(price * 100))) throw new CheckoutError("This item is not available for checkout.");
    const quantity = (items.get(recipe.id)?.quantity || 0) + Number(request.quantity);
    const capacity = isClass ? recipe.capacity : 20;
    if (!Number.isSafeInteger(capacity) || Number(capacity) < 1 || (isClass && !recipe.eventDate?.trim())) throw new CheckoutError("This class is not open for booking yet.");
    if (quantity > Math.min(Number(capacity), 20)) throw new CheckoutError(`The maximum quantity for ${recipe.title} is ${Math.min(Number(capacity), 20)}.`);
    items.set(recipe.id, { id: recipe.id, name: recipe.title, slug: recipe.slug, price, quantity,
      imagePath: recipe.imagePath || undefined, kind: isClass ? 'cooking_class' : 'recipe',
      ...(isClass ? { capacity, eventDate: recipe.eventDate!.trim() } : {}) });
  }
  return [...items.values()].sort((a, b) => a.id.localeCompare(b.id));
}

// A provider lookup failure is never permission to create another payable link.
export function checkoutSessionState(session: Stripe.Checkout.Session, mode: CheckoutMode): 'open' | 'expired' | 'paid' | 'processing' {
  if (session.livemode !== (mode === 'live') || !session.id.startsWith(`cs_${mode}_`)) throw new CheckoutError("This checkout belongs to another payment environment.", 409);
  if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') return 'paid';
  if (session.status === 'expired') return 'expired';
  if (session.status === 'open' && session.url) return 'open';
  if (session.status === 'complete') return 'processing';
  throw new CheckoutError("The payment status could not be confirmed. Refresh your orders before trying again.", 503);
}
