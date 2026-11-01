import StripeTestContent from "./stripe-test-content";
import { requireAdminPageSession } from '@/lib/admin-page-session';
import { getStripeSecretKey } from '@/lib/stripe-config';
import { checkoutKeyMode } from '@/lib/checkout-content';
import { arePublicCookingClassesEnabled } from '@/lib/public-cooking-classes';

export default async function StripeTestPage() {
  await requireAdminPageSession();
  let mode: 'live' | 'test' | 'unconfigured' = 'unconfigured';
  try { const key = getStripeSecretKey(); if (key) mode = checkoutKeyMode(key); } catch { /* Show configuration status without secrets. */ }
  return <StripeTestContent mode={mode} classesEnabled={arePublicCookingClassesEnabled()} />;
}
