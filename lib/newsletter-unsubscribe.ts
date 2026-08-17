import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function getSigningSecret(): string {
  const secret =
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD;

  if (!secret) {
    throw new Error(
      "NEWSLETTER_UNSUBSCRIBE_SECRET or ADMIN_SESSION_SECRET must be configured."
    );
  }

  return secret;
}

function signaturePayload(subscriberId: number, email: string): string {
  return `${subscriberId}:${email.trim().toLowerCase()}`;
}

export function createNewsletterUnsubscribeToken(
  subscriberId: number,
  email: string
): string {
  return createHmac("sha256", getSigningSecret())
    .update(signaturePayload(subscriberId, email))
    .digest("hex");
}

export function isValidNewsletterUnsubscribeToken(
  subscriberId: number,
  email: string,
  token: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(token)) return false;

  const expected = createNewsletterUnsubscribeToken(subscriberId, email);
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(token, "hex");

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export function createNewsletterUnsubscribeUrl({
  subscriberId,
  email,
  siteUrl,
}: {
  subscriberId: number;
  email: string;
  siteUrl: string;
}): string {
  const url = new URL("/unsubscribe", siteUrl);
  url.searchParams.set("subscriber", String(subscriberId));
  url.searchParams.set(
    "token",
    createNewsletterUnsubscribeToken(subscriberId, email)
  );
  return url.toString();
}
