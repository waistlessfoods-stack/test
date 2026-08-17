import "server-only";

import React from "react";
import { getBaseUrl } from "@/lib/seo";
import { createNewsletterUnsubscribeUrl } from "@/lib/newsletter-unsubscribe";
import WaistlessTableWelcomeEmail from "@/lib/email/templates/waistless-table-welcome-email";

export function getNewsletterWelcomeSubject(): string {
  return (
    process.env.NEWSLETTER_WELCOME_SUBJECT?.trim() ||
    "Welcome to The WaistLess Table!"
  );
}

export function createNewsletterWelcomeEmail({
  subscriberId,
  email,
}: {
  subscriberId: number;
  email: string;
}): React.ReactElement {
  const siteUrl = getBaseUrl();
  const logoUrl = new URL("/logo.png", siteUrl).toString();
  const unsubscribeUrl = createNewsletterUnsubscribeUrl({
    subscriberId,
    email,
    siteUrl,
  });

  return React.createElement(WaistlessTableWelcomeEmail, {
    logoUrl,
    siteUrl,
    unsubscribeUrl,
  });
}
