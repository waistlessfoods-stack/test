import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { syncCurrentClerkUser } from '@/lib/clerk-user-sync';
import { getCanonicalAppUrl } from '@/lib/app-url';
import { createOrderCheckoutSnapshot } from '@/lib/order-checkout-snapshot';
import { calculateCartTotals } from '@/lib/pricing';
import { getServerSalesTaxRate } from '@/lib/tax-settings';
import { fetchShopPageFromContentful } from '@/lib/contentful-management';
import { arePublicCookingClassesEnabled } from '@/lib/public-cooking-classes';
import { getStripeSecretKey } from '@/lib/stripe-config';
import { CheckoutError, checkoutKeyMode, resolveCheckoutItems } from '@/lib/checkout-content';
import { shopCheckout } from '@/lib/shop-checkout-store';

export const maxDuration = 60;
const key = getStripeSecretKey();
const stripe = key ? new Stripe(key, { apiVersion: '2024-06-20', timeout: 8000, maxNetworkRetries: 0 }) : null;
const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: Request) {
  if (!stripe || !key) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503, headers });
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'A same-origin request is required.' }, { status: 403, headers });
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user?.primaryEmailAddress?.emailAddress) throw new CheckoutError('Please sign in or create an account before checking out.', 401);
    const identity = await syncCurrentClerkUser();
    const ownerId = identity && !identity.skipped ? identity.userId : userId;
    let body: { items?: unknown };
    try { body = await request.json(); } catch { throw new CheckoutError('Check your cart and try again.'); }
    const catalogue = await fetchShopPageFromContentful();
    const items = resolveCheckoutItems(body?.items, catalogue.recipes, arePublicCookingClassesEnabled());
    const taxRate = await getServerSalesTaxRate();
    const totals = calculateCartTotals(items, taxRate);
    const snapshot = createOrderCheckoutSnapshot({ currency: 'usd', items, ...totals, taxRate });
    const result = await shopCheckout.create({ stripe, mode: checkoutKeyMode(key), appUrl: getCanonicalAppUrl(), userId: ownerId, email: user.primaryEmailAddress.emailAddress, snapshot });
    return NextResponse.json(result, { headers });
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    console.error('[Checkout] Could not prepare checkout', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Checkout could not be prepared. Please retry shortly or contact support.' }, { status: 503, headers });
  }
}
