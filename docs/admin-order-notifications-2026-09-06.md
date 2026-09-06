# Administrator order notifications — September 6, 2026

Implemented locally; requires pushing and deploying to take effect.

## Behavior

- Successful order processing sends a separate administrator email, addressed to
  `ADMIN_EMAIL` (falling back to the configured sender, like other notifications).
- Includes order number, customer name/email, item names, quantities, unit prices,
  total paid, class dates where present, and an authenticated admin dashboard link.
- Reply-To is the customer's email. Customer receipts remain separate.
- Sandbox orders have a `[TEST]` subject prefix and a do-not-fulfill warning.
- Customer and administrator sends use separate atomic database claims, sent
  timestamps, and error markers. A failure is retryable without resending the
  other recipient's successfully recorded email.
- Both Stripe webhooks and authenticated order reconciliation use this behavior.
  Reconciliation retries administrator errors and merges metadata without erasing
  email markers. Existing completed orders are not bulk-emailed by a migration.
- Unpaid checkout completion no longer marks an order completed or sends emails.
  Delayed payment success is handled using `checkout.session.async_payment_succeeded`,
  following [Stripe's fulfillment guidance](https://docs.stripe.com/checkout/fulfillment).
- Replayed completion cannot change a refunded order back to completed.

No new environment variable or database migration is required. The general
preview gate, admin authentication, and public-class settings are unchanged.

## Reproducible verification

```powershell
node --env-file=.env scripts/test-order-notifications.mjs --integration
pnpm lint
pnpm build
```

The test harness compiles the actual source and exercises the notification,
webhook, and reconciliation code with real PostgreSQL queries. SMTP, Stripe, and
Clerk interactions are substituted with controlled fixtures. Database checks use
a direct connection, a temporary orders table, and a rollback transaction; they
do not mutate permanent orders or sequences. Without `--integration`, only the
email rendering test runs and the database suite is explicitly skipped.

Coverage includes HTML escaping and plain-text rendering, independent recipients,
reply-to, preserved metadata, duplicate/concurrent calls, failures and retries,
existing customer receipts, order-status guards, fresh/stale claims, invalid data,
sender fallback, sandbox labeling, unpaid/delayed payment handling, refunded-order
replay, and reconciliation.

Results: all 17 reported tests passed (no skips), production build passed,
targeted ESLint passed, and full-repository lint passed with zero errors and
21 pre-existing warnings in unrelated scripts. `git diff --check` passed.

## Limits and deployment check

- No new real emails or payments were sent during these tests. Receipt of the
  new notification in Amber's actual administrator inbox remains unverified.
- SMTP cannot guarantee exactly-once delivery across a crash after SMTP accepts
  a message but before its sent marker is saved. Normal duplicate events and
  retry paths are covered; this is not a durable email-outbox implementation.
- After deployment, verify the administrator notification during the next
  authorized checkout test, and confirm the customer receipt is not duplicated.
- Google Calendar's 30-minute duration and required Budget Range were separately
  verified after the user updated them. Final booking/Meet invitation receipt
  remains the outstanding scheduling check.
