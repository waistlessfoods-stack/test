import "server-only";

type StripeMode = "live" | "test";

function clean(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

export function getStripeMode(): StripeMode {
  const configuredMode = clean(process.env.STRIPE_MODE)?.toLowerCase();
  if (configuredMode === "live" || configuredMode === "test") {
    return configuredMode;
  }

  return process.env.VERCEL_ENV === "production" ? "live" : "test";
}

export function getStripeSecretKey(): string | null {
  const standardKey = clean(process.env.STRIPE_SECRET_KEY);
  if (standardKey) return standardKey;

  return getStripeMode() === "live"
    ? clean(process.env.secret_key_stripe)
    : clean(process.env.sandbox_secret_key_stripe);
}

export function getStripeWebhookSecret(): string | null {
  return getStripeMode() === "live"
    ? clean(process.env.STRIPE_LIVE_WEBHOOK_SECRET) ||
        clean(process.env.STRIPE_WEBHOOK_SECRET)
    : clean(process.env.STRIPE_TEST_WEBHOOK_SECRET) ||
        clean(process.env.STRIPE_WEBHOOK_SECRET);
}
