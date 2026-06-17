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

The audit items identified in the earlier pass are now fixed in the current codebase.

## Critical Findings

### 1. Resume Checkout Can Undercharge Pending Orders

File: `app/api/orders/[id]/checkout/route.ts`

Risk: Critical

Status: Fixed on 2026-06-17.

The initial checkout route now stores a server-owned `checkoutSnapshot` in order metadata, including subtotal, tax, total, currency, and line-item source data. Resume checkout rebuilds the Stripe session from that snapshot instead of from recipe items alone. For older pending orders that do not yet have a snapshot, the route derives a server-owned fallback snapshot from the stored order amount and item subtotal so tax is not silently dropped.

Relevant code:

- Snapshot helper: `lib/order-checkout-snapshot.ts`
- Snapshot creation during initial checkout: `app/api/stripe/checkout/route.ts`
- Snapshot-based rebuild during resume checkout: `app/api/orders/[id]/checkout/route.ts`

## High Findings

### 2. Stripe Redirect URLs Trust the Request `Origin` Header

Files:

- `app/api/stripe/checkout/route.ts`
- `app/api/orders/[id]/checkout/route.ts`

Risk: High

Status: Fixed on 2026-06-17.

Both checkout routes now build Stripe `success_url` and `cancel_url` from a server-owned canonical base URL helper instead of the incoming request `Origin` header. The helper resolves `NEXT_PUBLIC_APP_URL`, `APP_URL`, or `BETTER_AUTH_URL`, with `http://localhost:3000` only as a local fallback.

Relevant code:

- Canonical base URL helper: `lib/app-url.ts`
- Initial checkout route: `app/api/stripe/checkout/route.ts`
- Resume checkout route: `app/api/orders/[id]/checkout/route.ts`

## Medium Findings

### 3. Public Route Rate Limiting Is In-Memory Only

File: `lib/rate-limit.ts`

Risk: Medium

Status: Fixed on 2026-06-17.

The app now enforces rate limiting through a shared Postgres-backed `rate_limit_buckets` table instead of a process-local in-memory `Map`. This makes the limit state consistent across instances and restarts, assuming the migration has been applied.

Relevant code:

- Shared limiter implementation: `lib/rate-limit.ts`
- Shared-store schema: `lib/db/schema.ts`
- Migration: `drizzle/0006_rate_limit_buckets.sql`

Affected flows:

- `POST /api/newsletter`
- `POST /api/enquiries`
- `POST /api/bookings`
- `POST /api/account/verify-email`
- `POST /api/admin/verify`

Recommended fix:

- Apply the `rate_limit_buckets` migration in each environment before deployment.
- Keep the current response headers, now backed by shared infrastructure.

### 4. Booking Guest Count Is Not Validated as a Positive Bounded Integer

File: `app/api/bookings/route.ts`

Risk: Medium

Status: Fixed on 2026-06-17.

The booking route now parses `guests` explicitly and requires a whole number between `1` and `50` before proceeding. The booking form also applies matching client-side `min`, `max`, and integer-only checks to reduce invalid submissions before they reach the server.

Relevant code:

- Server validation: `app/api/bookings/route.ts`
- Booking form bounds and input checks: `app/services/[slug]/book/booking-page-client.tsx`

## Low Findings

### 5. Newsletter Endpoint Reveals Subscription Status

File: `app/api/newsletter/route.ts`

Risk: Low

Status: Fixed on 2026-06-17.

The endpoint now returns the same success-shaped response for both new and already-subscribed email addresses, with a successful HTTP status in both cases.

Relevant code:

- `app/api/newsletter/route.ts`

### 6. Email Verification Tokens Are Stored in Plaintext

Files:

- `app/api/account/verify-email/route.ts`
- `lib/db/schema.ts`

Risk: Low

Status: Fixed on 2026-06-17.

Verification tokens are now hashed with SHA-256 before storage. Verification compares the incoming token's hash against the stored value. A temporary plaintext fallback remains in the verification route so older links that were issued before this change can still complete during the transition.

Relevant code:

- Token hash helper: `lib/email-verification-token.ts`
- Hashed token storage: `app/api/account/verify-email/route.ts`
- Hashed token verification with plaintext fallback: `app/api/auth/verify-email/route.ts`

## Fixed Since The Prior Audit

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

Status: Partially fixed and improved.

Newsletter, enquiry, and booking submissions now have:

- Honeypot checking
- Text length caps
- IP and email-based rate limiting

Relevant code:

- `app/api/newsletter/route.ts`
- `app/api/enquiries/route.ts`
- `app/api/bookings/route.ts`
- `lib/honeypot.ts`
- `lib/rate-limit.ts`
- `lib/text-field-validation.ts`

Remaining gap: none for storage locality once the migration is applied.

### 7. Structured Logging For Forms, Rate Limits, And Email Failures

Files:

- `lib/structured-log.ts`
- `lib/rate-limit.ts`
- `lib/email/mailer.ts`
- `app/api/enquiries/route.ts`
- `app/api/newsletter/route.ts`
- `app/api/bookings/route.ts`
- `app/api/account/verify-email/route.ts`

Risk: Low

Status: Fixed on 2026-06-17.

The app now emits structured JSON logs for:

- Public form submissions
- Honeypot-triggered requests
- Rate-limit exceed events
- Email send failures
- Verification email requests

Relevant code:

- Structured log helper: `lib/structured-log.ts`
- Rate-limit event logging: `lib/rate-limit.ts`
- Email transport logging: `lib/email/mailer.ts`
- Route-level submission and failure logging in the public write routes

### Admin Password Storage In The Browser

Status: Fixed.

Admin auth now uses an httpOnly cookie-backed signed session instead of storing the raw password in `sessionStorage`.

Relevant code:

- `components/admin/admin-auth.tsx`
- `app/api/admin/verify/route.ts`
- `app/api/admin/logout/route.ts`
- `lib/admin-session.ts`

### Admin Login Brute Force Protection

Status: Fixed, with the same shared-state caveat as other rate limiting.

`POST /api/admin/verify` now applies IP-based rate limiting before password verification.

Relevant code:

- `app/api/admin/verify/route.ts:18-25`

### Email Verification Flow Hardening

Status: Largely fixed.

The request endpoint now:

- Requires the current authenticated user
- Uses the signed-in user's email only
- Uses `crypto.randomBytes()`
- Applies rate limiting

Relevant code:

- `app/api/account/verify-email/route.ts`

Remaining gap: none.

### Booking Email Delivery Accuracy

Status: Fixed.

The booking route now checks both email send results and returns `emailSent`, `confirmationEmailSent`, and `notificationEmailSent`.

Relevant code:

- `app/api/bookings/route.ts:158-208`

### Structured Logging

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
| `POST /api/newsletter` | Footer newsletter form | `subscribers` | Yes, subscriber and admin | Low |
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
| `POST /api/admin/verify` | Password -> signed session cookie | Verifies admin access | Low |
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
