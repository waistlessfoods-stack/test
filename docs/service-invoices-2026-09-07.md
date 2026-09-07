# Private Chef / Catering invoice workflow

Implemented September 7, 2026 from Amber's September 1 meeting discussion: agree the service scope, generate a personalized Stripe invoice, email a payment link, and track payment. This is an invoice workflow, not a formal quote-acceptance or contract-signing system.

## Using it

1. Open **Admin Portal → Service Invoices** (`/admin/service-invoices`).
2. Create a draft with the customer's name and billing email, service, event date, title, payment terms, itemized amounts, and customer-facing notes. Saving does not email or charge the customer.
3. Review the saved draft. **Issue invoice & payment link** requires confirmation and finalizes the Stripe invoice. Stripe supplies an invoice number, hosted payment page, and PDF. Issuing through this workflow does not request an invoice email.
4. Explicitly choose **Email invoice to customer**, or copy and privately share the secure Stripe link. The email recipient comes from the Stripe invoice, not an arbitrary recipient supplied by the browser.
5. Refresh payment status after payment. Both the selected invoice and its history row update. Open invoices past their due date are labelled overdue.
6. Void an unpaid open invoice if it must no longer be payable. Paid invoices cannot be voided here. Handle refunds, credit notes, reminders, and saved-draft revisions through **Manage in Stripe**.

Customers can also open **My account → Private Chef & Catering Invoices** (`/account/service-invoices`). Only non-draft invoices whose billing email matches their verified primary Clerk email are returned. A customer does not need a website account to use the private Stripe-hosted link.

## Architecture and safeguards

- Stripe is the invoice/payment source of truth. Each read retrieves current Stripe data; there is no local invoice-status mirror, background worker, or additional webhook dependency. Recipe checkout, order emails, and existing webhooks are unchanged.
- No new database migration or dependency is required. Existing Stripe key selection and signed administrator sessions are reused. Routes have a 60-second execution budget.
- Each submission creates a dedicated Stripe customer and invoice. This avoids editing existing customer records or carrying their account balances into a new service invoice. Member history pages through matching customers; administration pages through Stripe invoice history.
- Only invoices marked `source=waistless-service-v1` are exposed by this workflow. Existing manually-created or unrelated Stripe invoices are not imported automatically.
- All administrator mutations require authentication and same-origin requests. Customer APIs require server-verified primary email ownership. Responses are private and non-cacheable.
- Invoices begin as manual-collection drafts with automatic advancement disabled. Pending invoice items, customer discounts, and automatic tax are excluded. Each line is attached to its specific invoice.
- Submission-step idempotency keys protect customer, invoice, and item creation. The full input is fingerprinted. Failed requests retry unchanged; the form warns users to check existing drafts before abandoning a submission. Keys older than 20 hours are rejected rather than replayed beyond Stripe's retention window.
- Interrupted drafts remain marked incomplete and cannot be issued through the site. Issuing checks assembly state, currency, the reviewed total, and the original expected total. If you edit amounts directly in Stripe, review and issue the amended draft there.
- Email dispatch and voiding require separate confirmation. Dispatch retries reuse a stable Stripe idempotency key; additional reminders are managed in Stripe. An accepted send request does not establish inbox delivery.
- Hosted invoice/PDF links grant access to their invoice. Share them only with the intended customer; do not post them publicly.
- The existing site preview gate remains unchanged. It still applies to the member portal; Stripe-hosted links are independent of it. Removing that gate still requires Amber's approval.

Stripe's documented [draft/finalization controls](https://docs.stripe.com/api/invoices/finalize?api-version=2024-06-20) and [invoice email API](https://docs.stripe.com/api/invoices/send?api-version=2024-06-20) support the explicit issue/send separation. Stripe does not deliver invoice emails in test mode, even when the send API succeeds.

## Current boundaries

- USD only, one to eight positive itemized lines, whole-number quantities, total $0.50–$99,999.99, and payment terms of 1–90 days after issue.
- Amber supplies the agreed amounts. No automatic tax calculation, discounts, installment schedule, or total-contract balance accounting is added. A separately agreed deposit can be invoiced as its own clearly-described amount; the site does not calculate the later balance.
- Event confirmation, contract signing, formal quote acceptance, and changes to service scope remain separate from payment.
- Paid status and paid/remaining balances reflect the invoice record, not a net-refund ledger. Review refunds and credit notes in Stripe. No new automatic administrator payment email or customer receipt template was added for service invoices; review Stripe receipt/notification settings separately.
- Stripe may charge processing/Invoicing fees. Review the account's applicable pricing and invoice branding/email settings before sending the first live invoice.

## Verification

- 13 service-invoice automated tests passed: validation, idempotency, interrupted assembly recovery, issue/send separation, paid/void state restrictions, metadata scope, member privacy, and HTTP guards.
- 17 existing order-email/database/webhook regression tests passed using isolated temporary tables and mocked mail delivery.
- Production build and TypeScript passed. Full lint had zero errors and 21 pre-existing warnings after removing the new test's unused import.
- Local Playwright desktop and 390px mobile verification used the actual admin UI, Stripe test API, and a temporary real Clerk account.
- A $750 sandbox invoice was created and issued; its PDF downloaded successfully. The verified customer saw it in their account. Stripe's attached Visa test payment method paid it, and both admin/member views showed paid and $0 remaining. This verifies Stripe test payment and tracking, not a real-card charge or a full hosted card-entry browser run.
- Sending the test invoice was accepted by Stripe, without email delivery. A separate unpaid test invoice was voided; trying to void the paid invoice returned 409.
- The temporary Clerk accounts were removed. All unpaid finalized QA invoices were voided. Labelled Stripe test invoices/customers remain as audit records; no real charges or real customer invoice emails were made.
- An initial test-card attachment mistake and a subsequent transient Clerk connection timeout were corrected/retried. Their invoices were voided. The final run passed all eight browser checks.

Repeat safe automated tests:

```sh
node scripts/test-service-invoices.mjs
node --env-file=.env scripts/test-order-notifications.mjs --integration
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

`scripts/qa-service-invoices.mjs --run-test-qa` is an explicit, local-only integration harness. It expects a local server on port 3010 configured with `STRIPE_SECRET_KEY` set to the sandbox key and `STRIPE_MODE=test`. It creates labelled sandbox invoice/customer records and a temporary Clerk user; do not point a live-configured server at this harness. Never print credentials while setting up the test environment.

## Deployment / live follow-up

Push and redeploy these changes. No deployment was performed by the assistant. Check the deployed admin/customer routes, production Stripe configuration, invoice branding, and notification settings. Before treating delivery as verified, send an explicitly approved live invoice to an approved recipient and check its inbox/payment flow. No live invoice should be sent just to validate this deployment without that approval.

See [screenshots, test PDF, and browser results](audit-screenshots/service-invoices-2026-09-07/README.md).
