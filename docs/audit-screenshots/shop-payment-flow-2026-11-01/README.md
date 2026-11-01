# Shop payment verification - November 1, 2026

The [implementation and release handoff](../../shop-payment-readiness-2026-11-01.md) describes the checkout corrections and remaining live checks.

`scripts/test-shop-checkout.mjs --integration` passed 13 tests, including two actual database connections competing for the final seat. A uniquely named isolated QA schema was used and removed. `scripts/test-order-notifications.mjs --integration` passed 19 tests, and the contract/invoice regression suite passed 14.

`scripts/qa-shop-payment-flow.mjs` runs the actual Orders React component, actual create/resume/reconcile/order/webhook handlers, and shared services. Only browser identity/Next adapters, Stripe, and SMTP are replaced. All SQL records are in TEMP tables inside a rolled-back transaction. No real class, checkout, order, payment, email, or CMS publication is created.

- [Results](results.json).
- [Captured test/build/lint totals and source fingerprints](verification.json).
- [Owner-confirmed paid-order recipient follow-up](paid-order-recipient.json): 19 notification tests and 13 checkout tests passed again with business mail routed to `info@waistlessfoods.com`, including webhook/reconciliation paths, failures, retries, and the obsolete/missing `ADMIN_EMAIL` cases. TypeScript, targeted lint, and production build passed; no actual email was sent.
- [Pending order after returning from checkout](pending-desktop.png).
- [Confirmed order on desktop](paid-desktop.png) and [mobile](paid-mobile.png).
- [Read-only readiness](readiness.json) reports configuration booleans and aggregate counts, without secrets or customer details.
- [Production-build access guards](production-guards.json) and [administrator checkout-verification page](admin-checkout-verification.png).

Visually inspected pending desktop and paid desktop/mobile layouts. The UI was checked for horizontal overflow at 1440, 390, and 320px. The return URL alone does not show payment success; a failed provider lookup shows an error and creates no second link. Actual fixture payment reconciliation confirms the order and two roster seats; a signed webhook replay sends no duplicate mocked messages.

An early browser fixture used separate module-loader instances for the same error class, so it displayed the generic provider error instead of the typed message. The fixture was corrected to share that export; the final run passed. This was a harness correction, not a production authentication change.
