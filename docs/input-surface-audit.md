# Input Surface Audit

Date: 2026-06-09

This document tracks every user-facing or external write/input surface found in the app, with the main risks and recommended fixes.

## Executive Summary

The highest-priority risks are payment pricing, public email sending, and abuse protection for public forms.

Fix order:

1. Stop trusting client-sent prices in Stripe checkout. Completed on 2026-06-09.
2. Lock or remove the public `/api/email/send` endpoint. Completed on 2026-06-09.
3. Add rate limiting and spam protection to public forms and admin password checks. Public write route rate limiting completed on 2026-06-09.
4. Replace raw admin password storage with a server-issued httpOnly session.
5. Improve email verification token generation and access control.

## Critical Findings

### 1. Stripe Checkout Trusts Client Prices

File: `app/api/stripe/checkout/route.ts`

Risk: Critical

Status: Fixed on 2026-06-09. The route now requires `EMAIL_SEND_API_SECRET` via `Authorization: Bearer <secret>` or `x-email-send-secret`. If the secret is not configured, the route is disabled with a 404 response.

Status: Fixed on 2026-06-09. Checkout now resolves cart items against Contentful shop recipes server-side and ignores client-provided price/name/image values.

The checkout route accepts cart items from the browser and uses `item.price` from the request body to create Stripe line items. A user can modify the request payload and pay an arbitrary price.

Relevant code:

- `toCheckoutItem()` reads `price` from request body.
- Stripe line items use `unit_amount: Math.round(item.price * 100)`.

Recommended fix:

- Accept only product IDs, recipe IDs, or slugs from the client.
- Fetch product/recipe prices server-side from Contentful or the database.
- Reject unknown products, invalid quantities, and negative/zero prices.
- Store the server-calculated cart snapshot in the order.

### 2. Public Email Sending Endpoint

File: `app/api/email/send/route.ts`

Risk: Critical

The endpoint accepts arbitrary `type`, `to`, and `data` with no authentication or secret. Anyone who discovers the endpoint can send emails through the configured Gmail account.

Recommended fix:

- Remove the route if unused.
- If needed for admin/internal tooling, protect it with admin auth or a server-only API secret.
- Do not allow arbitrary recipients from unauthenticated requests.
- Add rate limiting and logging.

## High Findings

### 3. Public Forms Have No Abuse Protection

Affected routes:

- `app/api/enquiries/route.ts`
- `app/api/newsletter/route.ts`
- `app/api/bookings/route.ts`

Risk: High

Status: Partially fixed on 2026-06-09. Public write routes now have in-memory IP and email-based rate limiting. Honeypot/CAPTCHA and admin password rate limiting remain open.

These routes are intentionally public, but they can be spammed. Since they now send emails, abuse could create email volume, database noise, and admin inbox spam.

Recommended fix:

- Add rate limiting by IP and email.
- Add a honeypot field to forms.
- Consider Cloudflare Turnstile or CAPTCHA for repeated failures.
- Cap input lengths server-side.
- Log abnormal volume.

### 4. Email Verification Can Be Abused

File: `app/api/account/verify-email/route.ts`

Risk: High

The route accepts any email address and sends a verification email if the user exists. It also reveals whether a user exists and uses `Math.random()` for token generation.

Recommended fix:

- Require the current authenticated user.
- Only allow verification for the signed-in user's own email.
- Use `crypto.randomBytes()` or `crypto.randomUUID()` for secure tokens.
- Return the same generic response whether an email exists or not.
- Add rate limiting by user and IP.

## Medium Findings

### 5. Admin Password Stored in Session Storage

File: `components/admin/admin-auth.tsx`

Risk: Medium

The raw admin password is stored in `sessionStorage`, restored on page load, and sent repeatedly to admin APIs.

Recommended fix:

- Replace with `/api/admin/login`.
- Set an httpOnly, sameSite cookie after successful password verification.
- Have admin routes read the cookie server-side.
- Add `/api/admin/logout` to clear the cookie.

### 6. Admin Password Has No Brute Force Protection

Affected routes:

- `app/api/admin/verify/route.ts`
- `app/api/admin/accounts/route.ts`
- `app/api/admin/dashboard/route.ts`
- `app/api/admin/bookings/route.ts`
- `app/api/admin/settings/route.ts`

Risk: Medium

Status: Fixed on 2026-06-10. Admin login now has IP-based rate limiting on `/api/admin/verify`.

Admin password checks previously had no rate limiting or lockout behavior.

Recommended fix:

- Add IP-based rate limiting to `/api/admin/verify`.
- Prefer session-cookie auth for subsequent admin requests.
- Consider logging failed attempts.

### 7. Booking Email Failures Are Not Surfaced

File: `app/api/bookings/route.ts`

Risk: Medium

Status: Fixed on 2026-06-10. The booking route now checks both customer and admin email results and returns `emailSent`.

`sendEmail()` returns `{ data, error }`, but the booking route does not inspect the result. The UI can say a confirmation was sent even when Gmail failed.

Recommended fix:

- Check both customer and admin email results.
- Include an `emailSent` status in the API response.
- Consider preserving booking success even if email fails, but show an accurate message.

## Good Existing Controls

- Stripe webhook verifies the Stripe signature before updating orders.
- Clerk webhook verifies Svix signatures.
- Contentful revalidation requires `CONTENTFUL_REVALIDATE_SECRET`.
- User order listing is authenticated and scoped to the current `userId`.
- Resume checkout is authenticated and scoped to the current `userId`.
- Admin routes do require the configured admin password, even though the session model should be improved.

## Route Inventory

### Public User Forms

| Route | Source UI | Stores Data | Sends Email | Main Risk |
| --- | --- | --- | --- | --- |
| `POST /api/newsletter` | Footer newsletter form | `subscribers` | Yes, subscriber and admin | Spam, email abuse |
| `POST /api/enquiries` | Complimentary consultation/enquiry dialogs | `enquiries` | Yes, customer and admin | Spam, email abuse |
| `POST /api/bookings` | Chef service booking form | `bookings` | Yes, customer and admin | Spam, weak validation |

### Payment and Orders

| Route | Auth | Purpose | Main Risk |
| --- | --- | --- | --- |
| `POST /api/stripe/checkout` | Required | Creates checkout session and pending order | Trusts client prices |
| `POST /api/orders/reconcile` | Required | Rechecks pending Stripe sessions | Low |
| `POST /api/orders/[id]/checkout` | Required | Resumes pending checkout | Uses stored order data |
| `GET /api/orders` | Required | Lists current user orders | Low |
| `POST /api/stripe/webhook` | Stripe signature | Marks orders completed/failed | Good signature control |

### Email and Auth

| Route | Auth | Purpose | Main Risk |
| --- | --- | --- | --- |
| `POST /api/email/send` | `EMAIL_SEND_API_SECRET` | Sends template emails | Secret-gated internal email relay |
| `POST /api/account/verify-email` | None | Sends verification email | Enumeration, spam, weak token |
| `GET /api/auth/verify-email` | Token link | Verifies email | Depends on token strength |
| `POST /api/webhooks/clerk` | Svix signature | Syncs Clerk users | Good signature control |

### Admin

| Route | Auth Model | Purpose | Main Risk |
| --- | --- | --- | --- |
| `POST /api/admin/verify` | Raw admin password | Verifies admin access | Brute force, raw password reuse |
| `POST /api/admin/accounts` | Raw admin password | Lists accounts | Raw password reuse |
| `POST /api/admin/dashboard` | Raw admin password | Dashboard stats | Raw password reuse |
| `POST /api/admin/bookings` | Raw admin password | Lists bookings | Raw password reuse |
| `PATCH /api/admin/bookings` | Raw admin password | Updates booking status | Raw password reuse |
| `POST /api/admin/settings` | Raw admin password | Reads settings | Raw password reuse |
| `PATCH /api/admin/settings` | Raw admin password | Updates tax settings | Raw password reuse |

### Content and Settings

| Route | Auth | Purpose | Main Risk |
| --- | --- | --- | --- |
| `POST /api/revalidate/contentful` | Secret | Revalidates cache tags/paths | Good secret control |
| `POST /api/revalidate/header-settings` | Secret forwarded | Header settings revalidation helper | Depends on shared revalidate secret |
| `GET /api/settings/tax` | Public | Reads tax rate | Low |

## Recommended Fix Checklist

- [x] Replace client-sent checkout prices with server-authoritative pricing.
- [x] Remove or protect `/api/email/send`.
- [x] Add rate limiting to public write routes.
- [x] Add honeypot fields to newsletter, enquiry, and booking forms.
- [x] Add server-side max length checks for all public text fields.
- [x] Use secure random tokens for email verification.
- [x] Require auth for requesting email verification.
- [x] Move admin auth to an httpOnly session cookie.
- [x] Add brute force protection to admin login.
- [x] Check `sendEmail()` results in `/api/bookings`.
- [ ] Add structured logging for form submissions and email failures.
