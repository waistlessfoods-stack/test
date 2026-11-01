# Service agreements and linked invoices — November 1, 2026

The application now supports booking request → reviewed agreement → private-link signature → linked invoice → Stripe payment-status synchronization and a business payment notification. The code was pushed and automatically deployed on November 1; production protected API reads passed. Amber's actual contract PDF, webhook-event setup, and live customer/payment walkthroughs are still pending. See the [post-push audit](post-push-meeting-audit-2026-11-01.md).

## Administrator workflow

1. Open **Admin → Booking requests**, expand a Private Chef or Catering request, and choose **Prepare service agreement**. Alternatively, open **Admin → Service agreements** and enter the request ID.
2. Create a draft. The customer's contact details, guest count, requested dates, budget/event notes, and service carry over. Approved contract terms and the agreed amount start empty; no terms are invented.
3. Set the confirmed event date, end date if needed, location, agreed total, event details, approved contract source/filename, and contract text. This version accepts reviewed text pasted from the source PDF; it does not upload or store the original PDF. The source must be checked before a real agreement is issued.
4. Save and inspect the customer preview. Confirm the review checkbox, then choose **Create signing link**. The issued text is frozen. The action does not email anyone or charge a card.
5. Copy the private link or explicitly choose **Email signing link to customer**. Only a fingerprint of the random 256-bit token is stored. The token is in the URL fragment and is sent to the API in the request body, not in server request URLs. The link expires after 30 days. Generating a replacement invalidates the old link.
6. The customer reviews the agreement, types their full name, accepts the electronic-signing consent, and confirms. The app stores the name, consent, server timestamp, and SHA-256 of the frozen content. Identical retries reuse the saved signature; another name or changed document cannot overwrite it. A signed record cannot be edited or voided through the app.
7. Refresh the saved agreement in admin. Choose **Prepare invoice from signed agreement** to prefill the billing details. The customer email, service, and event date must match the agreement.
8. Enter the amount due now, including a deposit if agreed. Active draft/open/paid invoice totals cannot exceed the signed total. Void an incorrect unpaid invoice before replacing it. Draft deletion/void events release the recorded amount when synchronized.
9. Save the draft, issue it, and explicitly email/share its Stripe payment link. Status and balances continue to come from Stripe; lifecycle events synchronize the website's invoice record. An invoice marked paid can trigger one business notification to `info@waistlessfoods.com`.

The signature is collected through possession of the private link; the signer is not independently identity-verified. The stored proof and printable copy describe the electronic signing record. A browser-generated PDF is not a certificate-signed PDF, and no legal-validity assessment is claimed.

## Customer access and copies

- The signing page is accessible while the general site-preview gate remains enabled. Customer data still requires the private token; the page itself contains no embedded agreement data.
- The account page now links to **Your agreements**. The API matches the account's verified primary Clerk email and exposes only issued/signed agreements for that email. Drafts, void agreements, and another customer's agreements are excluded.
- Signing uses the private link from the email. The account area provides read-only review and copies.
- **Print / Save PDF** includes the reviewed agreement, signature, timestamp, reference, and document hash. Navigation and action controls are excluded. A two-page fictional QA copy was rendered and visually checked; it is not Amber's contract.

## Payment notification behavior

- Only this application's managed service invoices enter this workflow. Shop orders retain their existing handling.
- Each invoice synchronization retrieves its current Stripe object under a per-invoice database lock. An older event payload cannot directly replace a newer provider state.
- An atomic notification claim prevents a normal event replay from sending the business notification again. Test-mode notifications are clearly labelled **TEST PAYMENT — Do not fulfill**.
- SMTP acceptance is reported separately from inbox delivery. A disconnected/failed attempt becomes **delivery uncertain** and is not automatically resent on webhook replay.
- Admin can review `info@waistlessfoods.com` and explicitly retry a missing notification. Fresh in-flight claims cannot be reset; a stale claim or recorded error requires review. Successfully recorded sends cannot be resent through this action.

This follows Stripe's documented [invoice state transitions](https://docs.stripe.com/invoicing/integration/workflow-transitions) and [webhook verification/retry guidance](https://docs.stripe.com/webhooks). Stripe email delivery and real card payments have not been tested in this work.

## Schema and deployment

`drizzle/0013_service_agreements.sql` adds `service_agreements` and `service_invoice_records`. The additive migration was applied to the database configured by `.env`; the read-only check afterward found zero agreement and invoice-workflow rows. No existing customer data was changed.

For another deployment database:

```sh
pnpm db:migrate-service-agreements
```

The existing administrator authentication, database, Google Workspace mailer, Stripe keys, and customer/member identity checks are reused. No new provider or secret was provisioned. Keep the general site-preview restriction in place until the launch checks and release decision are complete.

## Confirmed Stripe configuration gap

The [read-only account inspection](audit-screenshots/service-agreements-2026-11-01/readiness.json) found:

- The live website webhook is enabled and receives checkout/payment-intent events, but **no invoice events**.
- The test account has no registered webhook endpoints.
- Both account modes were inspected through read-only API calls. No webhook or account setting was changed.

After deploying the new handler, add the invoice lifecycle events while retaining the existing checkout events and signing secret:

```sh
# Read-only plan; already verified locally.
node scripts/configure-service-invoice-webhooks.mjs --mode live

# Applies only after the new protected agreement API is reachable on the website.
node scripts/configure-service-invoice-webhooks.mjs --mode live --apply
```

The script refuses to update an ambiguous/missing endpoint or a site that does not expose the new protected agreement API. It preserves the existing endpoint API version and adds, rather than replaces, events. The live `--apply` command has **not** been run. For sandbox delivery tests, use an approved test endpoint or local Stripe CLI forwarding; do not interpret mocked webhook tests as proof of delivery from Stripe.

## Verification

- `node --env-file=.env scripts/test-service-workflow.mjs --integration`: **14 passed**. Covers validation, safe rendering, admin/origin/member guards, inquiry reuse, stale edits, required owner review, frozen hashes, replaced/expired links, consent, repeated signing, tamper detection, void rules, customer isolation, linked-invoice idempotency and amount limits, real Stripe webhook signature validation, current-state synchronization, and notification deduplication/recovery.
- SQL tests used TEMP tables in a rolled-back transaction. Transaction boundaries are serialized on one test session; they are not a distributed load test. Production uses committed transactions and row/advisory locks.
- `node scripts/qa-service-workflow.mjs`: passed against a local production build. The real React UI called the actual route handlers and workflow services through a browser bridge backed by TEMP tables. Stripe, Clerk identity, rate limits, and SMTP were replaced. No production agreement, invoice, signature, email, or charge was created.
- The browser covered draft creation/edit/review, private-link signing, signature refresh, invoice prefill, a $50 deposit invoice, and paid-status/business-notification display. Mobile width: 390px.
- Print layout: final two-page Letter PDF rendered with Poppler; both pages inspected. The earlier orphaned hash/page was corrected before final verification.
- Existing invoice tests: **13 passed**. Existing order-notification/webhook integration tests: **17 passed** after isolating the new service-invoice dependency in the checkout fixture.
- TypeScript, production build, and lint passed. Full lint retains the 25 existing script/runtime warnings.

Evidence: [browser results, screenshots, and print renders](audit-screenshots/service-agreements-2026-11-01/README.md).

## Remaining acceptance work

- Obtain Amber's actual contract PDF, import/review its complete wording, and verify every event-specific field against it.
- Review the prepared customer agreement with Amber.
- Deploy the handler and enable/verify invoice lifecycle events.
- Confirm actual signing-email and business-payment-notification inbox delivery with an approved recipient.
- Walk through a real service invoice payment and cooking-class payment with Amber, with explicit authorization for the chosen transactions.
- Newsletter-image/editor and paid-recipe administration are now locally implemented and verified; see the [current handoff](newsletter-media-and-recipe-management-2026-11-01.md). Amber's own content/login walkthrough remains pending.
- See [shop payment readiness](shop-payment-readiness-2026-11-01.md) for the class checkout corrections and prepared joint test sequence.
