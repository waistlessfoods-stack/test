import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getClerkUserIdentityIds, syncCurrentClerkUser } from '@/lib/clerk-user-sync';
import { getCanonicalAppUrl } from '@/lib/app-url';
import { fetchShopPageFromContentful } from '@/lib/contentful-management';
import { arePublicCookingClassesEnabled } from '@/lib/public-cooking-classes';
import { getStripeSecretKey } from '@/lib/stripe-config';
import { CheckoutError, checkoutKeyMode } from '@/lib/checkout-content';
import { shopCheckout } from '@/lib/shop-checkout-store';

export const maxDuration = 60;
const key = getStripeSecretKey();
const stripe = key ? new Stripe(key, { apiVersion: '2024-06-20', timeout: 8000, maxNetworkRetries: 0 }) : null;
const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!stripe || !key) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503, headers });
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'A same-origin request is required.' }, { status: 403, headers });
  try {
    const { userId } = await auth();
    if (!userId) throw new CheckoutError('Please sign in to continue.', 401);
    const { id } = await context.params;
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) throw new CheckoutError('Invalid order ID.');
    const identity = await syncCurrentClerkUser();
    const catalogue = await fetchShopPageFromContentful();
    const result = await shopCheckout.resume({ stripe, mode: checkoutKeyMode(key), appUrl: getCanonicalAppUrl(), orderId: Number(id), ownerIds: getClerkUserIdentityIds(userId, identity), catalogue: catalogue.recipes, classesEnabled: arePublicCookingClassesEnabled() });
    return NextResponse.json(result, { headers });
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    console.error('[Checkout] Could not resume checkout', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'The payment could not be checked. Refresh your orders and retry shortly.' }, { status: 503, headers });
  }
}
