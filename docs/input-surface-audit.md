# Input Surface Audit

Date: 2026-06-17

This is a fresh audit of the app's current user-facing and external input/write surfaces. It replaces the 2026-06-09 pass and reflects the code as it exists on 2026-06-17.

## Executive Summary

The strongest fixes from the earlier audit are now in place:

- Stripe checkout now resolves paid recipe pricing server-side.
- `/api/email/send` is secret-gated.
- Public forms now have honeypot fields, text length caps, and basic rate limiting.
- Admin access now uses an httpOnly session cookie instead of storing the raw password in browser storage.
- Email verification now requires an authenticated user and uses secure random tokens.

Most of the earlier audit items are now fixed, but a few residual risks remain in the current codebase.

## Low Findings

### 1. Admin Session Signing Still Falls Back To `ADMIN_PASSWORD`

File: `lib/admin-session.ts`

Risk: Low

Status: Open on 2026-06-17.

Admin session signing still uses `ADMIN_SESSION_SECRET || ADMIN_PASSWORD`, so the session-signing secret falls back to the admin login credential when a dedicated secret is not configured.

Relevant code:

- `lib/admin-session.ts`

Why this matters:

- Session integrity depends on a credential that may be rotated or chosen for human memorability rather than cryptographic strength.
- It is better secret hygiene to separate authentication secrets from cookie-signing secrets.

Recommended fix:

- Require `ADMIN_SESSION_SECRET` in production.
- Treat fallback to `ADMIN_PASSWORD` as development-only if it remains at all.

### 2. Newsletter Duplicate Handling Is Not Race-Safe

File: `app/api/newsletter/route.ts`

Risk: Low

Status: Open on 2026-06-17.

The route checks for an existing subscriber and then inserts in a separate step. Concurrent requests for the same email can both pass the read step and then race into the unique constraint on insert.

Relevant code:

- `app/api/newsletter/route.ts`

Why this matters:

- One request can still return a 500 from the unique constraint instead of the intended generic success response.
- That weakens reliability and partially undermines the duplicate-handling hardening.

Recommended fix:

- Switch to a single insert-with-conflict-handling flow.
- Treat unique constraint conflicts as the same generic success response.

## Fixed Since The Prior Audit

### Resume Checkout Amount Integrity

Status: Fixed.

Resume checkout now rebuilds Stripe sessions from a server-owned checkout snapshot that includes tax, instead of reconstructing from item rows alone.

Relevant code:

- `lib/order-checkout-snapshot.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/orders/[id]/checkout/route.ts`

### Stripe Redirect URL Trust

Status: Fixed.

Checkout and resume checkout now build redirect URLs from a server-owned canonical URL helper rather than the request `Origin` header.

Relevant code:

- `lib/app-url.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/orders/[id]/checkout/route.ts`

### Shared Rate Limiting Store

Status: Fixed, assuming migration applied.

Rate limiting now uses the shared `rate_limit_buckets` Postgres table instead of an in-memory `Map`.

Relevant code:

- `lib/rate-limit.ts`
- `lib/db/schema.ts`
- `drizzle/0006_rate_limit_buckets.sql`

### Booking Guest Validation

Status: Fixed.

Booking submissions now require an integer guest count between `1` and `50`, with matching client-side bounds.

Relevant code:

- `app/api/bookings/route.ts`
- `app/services/[slug]/book/booking-page-client.tsx`

### Newsletter Enumeration Response

Status: Fixed.

Newsletter duplicates now return the same success-shaped response as first-time subscriptions.

Relevant code:

- `app/api/newsletter/route.ts`

### Hashed Verification Tokens

Status: Fixed, with temporary backward-compatibility fallback.

Verification tokens are hashed at rest, and verification prefers hashed lookup while still accepting older plaintext-issued links.

Relevant code:

- `lib/email-verification-token.ts`
- `app/api/account/verify-email/route.ts`
- `app/api/auth/verify-email/route.ts`

### Verification Email Link Base URL

Status: Fixed.

Verification emails now use the same canonical app URL helper as checkout, rather than depending directly on `BETTER_AUTH_URL`.

Relevant code:

- `lib/app-url.ts`
- `app/api/account/verify-email/route.ts`

### Server-Authoritative Stripe Pricing

Status: Fixed.

`POST /api/stripe/checkout` now accepts item identifiers, resolves the recipe catalog server-side, and ignores client-supplied price/name/image values.

Relevant code:

- `app/api/stripe/checkout/route.ts:27-117`

### Public Email Relay Protection

Status: Fixed.

`POST /api/email/send` now requires `EMAIL_SEND_API_SECRET` via `Authorization: Bearer <secret>` or `x-email-send-secret`, and returns `404` when the secret is not configured.

Relevant code:

- `app/api/email/send/route.ts:8-38`

### Public Form Abuse Controls

Status: Mostly fixed.

Newsletter, enquiry, and booking submissions now have:

- Honeypot checking
- Text length caps
- Shared-store rate limiting

Relevant code:

- `app/api/newsletter/route.ts`
- `app/api/enquiries/route.ts`
- `app/api/bookings/route.ts`
- `lib/honeypot.ts`
- `lib/rate-limit.ts`
- `lib/text-field-validation.ts`

Newsletter duplicate handling now uses a conflict-aware insert. Concurrent requests for the same active address return the same generic success shape without sending duplicate welcome emails.

### Structured Logging For Forms, Rate Limits, And Email Failures

Status: Fixed.

Form routes, rate-limit events, and email failures now emit structured JSON logs with consistent event names and request context.

Relevant code:

- `lib/structured-log.ts`
- `lib/rate-limit.ts`
- `lib/email/mailer.ts`
- `app/api/enquiries/route.ts`
- `app/api/newsletter/route.ts`
- `app/api/bookings/route.ts`
- `app/api/account/verify-email/route.ts`

### Admin Password Storage In The Browser

Status: Fixed.

Admin auth now uses an httpOnly cookie-backed signed session instead of storing the raw password in `sessionStorage`.

Relevant code:

- `components/admin/admin-auth.tsx`
- `app/api/admin/verify/route.ts`
- `app/api/admin/logout/route.ts`
- `lib/admin-session.ts`

### Admin Login Brute Force Protection

Status: Fixed, with shared-store enforcement and one secret-hygiene gap.

`POST /api/admin/verify` now applies IP-based rate limiting before password verification.

Relevant code:

- `app/api/admin/verify/route.ts`
- `lib/rate-limit.ts`

Remaining gap:

- `lib/admin-session.ts` still falls back to `ADMIN_PASSWORD` when `ADMIN_SESSION_SECRET` is not configured.

### Email Verification Flow Hardening

Status: Mostly fixed.

The request endpoint now:

- Requires the current authenticated user
- Uses the signed-in user's email only
- Uses `crypto.randomBytes()`
- Applies rate limiting
- Stores hashed verification tokens

Relevant code:

- `app/api/account/verify-email/route.ts`
- `app/api/auth/verify-email/route.ts`
- `lib/email-verification-token.ts`

Remaining gap:

- None.

### Booking Email Delivery Accuracy

Status: Fixed.

The booking route now checks both email send results and returns `emailSent`, `confirmationEmailSent`, and `notificationEmailSent`.

Relevant code:

- `app/api/bookings/route.ts`

## Good Existing Controls

- Stripe checkout pricing is resolved server-side from Contentful shop data.
- Stripe webhook verifies the Stripe signature before updating orders.
- Clerk webhook verifies Svix signatures.
- Contentful revalidation requires `CONTENTFUL_REVALIDATE_SECRET`.
- User order listing is authenticated and scoped to the current `userId`.
- Resume checkout is authenticated and scoped to the current `userId`.
- Admin routes now require a signed httpOnly admin session cookie.
- Public forms now include honeypot fields and server-side text length caps.

## Route Inventory

### Public User Forms

| Route | Source UI | Stores Data | Sends Email | Current Main Risk |
| --- | --- | --- | --- | --- |
| `POST /api/newsletter` | Footer newsletter form | `subscribers` | Yes, subscriber and admin | Duplicate handling is not race-safe under concurrency |
| `POST /api/enquiries` | Consultation/enquiry dialogs | `enquiries` | Yes, customer and admin | Low |
| `POST /api/bookings` | Chef service booking form | `bookings` | Yes, customer and admin | Low |

### Payment and Orders

| Route | Auth | Purpose | Current Main Risk |
| --- | --- | --- | --- |
| `POST /api/stripe/checkout` | Required | Creates checkout session and pending order | Low |
| `POST /api/orders/reconcile` | Required | Rechecks pending Stripe sessions | Low |
| `POST /api/orders/[id]/checkout` | Required | Resumes pending checkout | Low |
| `GET /api/orders` | Required | Lists current user orders | Low |
| `POST /api/stripe/webhook` | Stripe signature | Marks orders completed/failed | Good signature control |

### Email and Auth

| Route | Auth | Purpose | Current Main Risk |
| --- | --- | --- | --- |
| `POST /api/email/send` | `EMAIL_SEND_API_SECRET` | Sends template emails | Secret exposure would allow internal relay abuse |
| `POST /api/account/verify-email` | Required | Sends verification email for signed-in user | Low |
| `GET /api/auth/verify-email` | Token link | Verifies email | Depends on token secrecy until expiry |
| `POST /api/webhooks/clerk` | Svix signature | Syncs Clerk users | Good signature control |

### Admin

| Route | Auth Model | Purpose | Current Main Risk |
| --- | --- | --- | --- |
| `POST /api/admin/verify` | Password -> signed session cookie | Verifies admin access | Session signing still falls back to `ADMIN_PASSWORD` without `ADMIN_SESSION_SECRET` |
| `POST /api/admin/accounts` | Signed admin session | Lists accounts | Low |
| `POST /api/admin/dashboard` | Signed admin session | Dashboard stats | Low |
| `POST /api/admin/bookings` | Signed admin session | Lists bookings | Low |
| `PATCH /api/admin/bookings` | Signed admin session | Updates booking status | Low |
| `POST /api/admin/settings` | Signed admin session | Reads settings | Low |
| `PATCH /api/admin/settings` | Signed admin session | Updates tax settings | Low |

### Content and Settings

| Route | Auth | Purpose | Current Main Risk |
| --- | --- | --- | --- |
| `POST /api/revalidate/contentful` | Shared secret | Revalidates cache tags/paths | Low |
| `POST /api/revalidate/header-settings` | Shared secret forwarded | Header settings revalidation helper | Low |
| `GET /api/settings/tax` | Public | Reads tax rate | Low |

## Recommended Fix Checklist

- [x] Rebuild resumed Stripe sessions from a full server-owned order snapshot, including tax.
- [x] Stop building Stripe redirect URLs from the request `Origin` header.
- [x] Move rate limiting to a shared store.
- [x] Add strict numeric validation and bounds for booking `guests`.
- [x] Return a generic success-shaped response for already-subscribed newsletter emails.
- [x] Hash verification tokens at rest.
- [x] Add structured logging for form submissions, rate-limit events, and email failures.
- [x] Mask or hash email-based rate-limit identifiers before logging them.

## Current Open Fixes

- [ ] Require a dedicated `ADMIN_SESSION_SECRET` in production.
- [x] Make newsletter duplicate handling race-safe with conflict-aware insert logic.
