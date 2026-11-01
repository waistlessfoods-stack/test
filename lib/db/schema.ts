import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { NewsletterMedia } from "@/lib/newsletter-content";

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'private_chef', 'cooking_class', 'blog'
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

// Archive publication is deliberately separate from email delivery.
export const newsletterIssues = pgTable("newsletter_issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text").notNull().default(""),
  body: text("body").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  ctaUrl: text("cta_url").notNull().default(""),
  media: jsonb("media").$type<NewsletterMedia>().notNull().default({ header: null, footer: null, images: [] }),
  status: text("status").notNull().default("draft"),
  version: integer("version").notNull().default(1),
  publishedAt: timestamp("published_at"),
  lastTestAt: timestamp("last_test_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("newsletter_issues_archive_idx").on(table.status, table.publishedAt),
  check("newsletter_issues_status_check", sql`${table.status} in ('draft', 'published')`),
]);

export type NewsletterIssue = typeof newsletterIssues.$inferSelect;

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull().unique().references(() => newsletterIssues.id),
  issueVersion: integer("issue_version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  mailingAddress: text("mailing_address").notNull(),
  status: text("status").notNull().default("ready"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [check("newsletter_campaigns_status_check", sql`${table.status} in ('ready','paused','completed','cancelled')`)]);

export const newsletterDeliveries = pgTable("newsletter_deliveries", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => newsletterCampaigns.id),
  subscriberId: integer("subscriber_id").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }),
  messageId: text("message_id"),
}, table => [
  uniqueIndex("newsletter_deliveries_campaign_id_email_key").on(table.campaignId, table.email),
  index("newsletter_deliveries_queue_idx").on(table.campaignId, table.status, table.id),
  index("newsletter_deliveries_attempt_idx").on(table.attemptedAt),
  check("newsletter_deliveries_status_check", sql`${table.status} in ('pending','sending','accepted','uncertain','skipped')`),
]);

export const newsletterDispatchLock = pgTable("newsletter_dispatch_lock", {
  id: integer("id").primaryKey(),
  nextAt: timestamp("next_at", { withTimezone: true }).notNull().defaultNow(),
  busyUntil: timestamp("busy_until", { withTimezone: true }).notNull().defaultNow(),
}, table => [check("newsletter_dispatch_lock_id_check", sql`${table.id} = 1`)]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'refunded'
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("usd"),
  items: jsonb("items").notNull(), // JSON array of purchased items
  customerEmail: text("customer_email"),
  metadata: jsonb("metadata"), // Additional Stripe metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  serviceSlug: text("service_slug").notNull(),
  serviceTitle: text("service_title").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  guests: integer("guests").notNull(),
  preferredDate: text("preferred_date").notNull(),
  alternativeDate: text("alternative_date"),
  notes: text("notes").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export const serviceReviews = pgTable(
  "service_reviews",
  {
    id: serial("id").primaryKey(),
    serviceSlug: text("service_slug").notNull(),
    serviceTitle: text("service_title").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    rating: integer("rating"),
    reviewText: text("review_text").notNull(),
    status: text("status").notNull().default("pending"),
    source: text("source").notNull().default("customer-submission"),
    sourceKey: text("source_key").unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    moderatedAt: timestamp("moderated_at"),
  },
  (table) => [
    index("service_reviews_service_status_idx").on(
      table.serviceSlug,
      table.status
    ),
    index("service_reviews_status_created_idx").on(
      table.status,
      table.createdAt
    ),
  ]
);

export type ServiceReview = typeof serviceReviews.$inferSelect;
export type NewServiceReview = typeof serviceReviews.$inferInsert;

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
export type NewRateLimitBucket = typeof rateLimitBuckets.$inferInsert;

export const serviceAgreements = pgTable("service_agreements", {
  id: text("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"),
  content: jsonb("content").notNull(),
  documentHash: text("document_hash"),
  tokenHash: text("token_hash").unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  signature: jsonb("signature"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("service_agreements_booking_idx").on(table.bookingId, table.createdAt),
  check("service_agreements_status_check", sql`${table.status} in ('draft','issued','signed','void')`),
]);

export const serviceInvoiceRecords = pgTable("service_invoice_records", {
  invoiceId: text("invoice_id").primaryKey(),
  agreementId: text("agreement_id").references(() => serviceAgreements.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  live: boolean("live").notNull(),
  status: text("status").notNull(),
  total: integer("total").notNull(),
  paid: integer("paid").notNull(),
  remaining: integer("remaining").notNull(),
  notificationClaimedAt: timestamp("notification_claimed_at", { withTimezone: true }),
  requestKey: text("request_key").unique(),
  requestHash: text("request_hash"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  notificationError: text("notification_error"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
