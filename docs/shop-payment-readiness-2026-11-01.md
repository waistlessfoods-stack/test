# Shop and public-class payment readiness - November 1, 2026

This continuation addresses the [October 31 meeting checklist](meeting-notes-website-planning-2026-10-31.md). The code was pushed and automatically deployed on November 1; production checkout guards and live-mode invoice reads passed. Checkout, customer order status, signed payment events, confirmation templates, and class rosters passed isolated local checks. Real card payments, received emails, invoice webhook configuration, and Amber's walkthrough remain open. No real checkout, charge, customer order, class publication, or email was created by these checks. See the [post-push audit](post-push-meeting-audit-2026-11-01.md).

## Checkout corrections

The previous availability check counted completed purchases across payment environments and dates. It ignored pending Stripe checkouts, so two customers could obtain payment links for the same remaining seats. It also allowed a payment-status lookup failure to create another link when resuming an order.

The shared create/resume checkout service now:

- Resolves titles, prices, class dates, and capacity from published shop content. Client-supplied prices and limits are ignored. Invalid quantities, unavailable items, unannounced classes, and disabled enrollment are rejected rather than silently changing the basket.
- Takes PostgreSQL transaction locks for the customer and each class/date, in a stable order. It holds those locks through Stripe session creation and saving the pending order. Competing requests use the same path.
- Counts completed purchases and still-payable or processing Stripe sessions for the same class/date and actual key environment. Test purchases do not consume live seats; a different class date does not consume this date's seats. Legacy class rows without a date conservatively consume capacity until reviewed.
- Releases a pending hold only after Stripe reports its checkout expired. A paid checkout still consumes seats while its webhook is delayed. Lookup failures return a retryable error and do not free seats or create another payable link.
- Reuses an existing matching open checkout on a repeated cart request. A completed/processing checkout directs the customer back to My Orders. Repeated resume requests reuse the current open session.
- Gives new class sessions a roughly 31-minute checkout window. A confirmed expired session can be replaced only after rechecking the current class release, date, and remaining capacity. The stored order price/tax snapshot remains the amount due when resuming; changing the published price does not silently reprice that order.
- Checks order ownership and payment environment on resume. Older class snapshots cannot bypass class checks by omitting their product kind, and missing booked dates require review rather than guessing today's class.
- Attempts to expire a newly created but inaccessible Stripe session if saving its order fails. No checkout URL is returned on that failure. Uncertain provider outcomes do not authorize fulfillment.

The service uses the existing `orders` table and requires no new table migration. The database connection must support transactions and advisory locks. Lock waits are limited to 10 seconds and individual statements to 45 seconds; both settings were verified on the actual postgres.js adapter without table mutations. Reservations are represented by pending orders plus their Stripe state; the code does not depend on an expiration webhook to release them. Public class inventory is checked during checkout, not guaranteed by the static class card/cart display. Keep a published class's date stable once sales start; use a separate entry for another occurrence. If the date or capacity must change after links have been issued, review/expire outstanding links before reopening sales.

Stripe documents expiration of Checkout Sessions for [limited inventory](https://docs.stripe.com/payments/checkout/managing-limited-inventory) and recommends fulfillment from verified server-side payment state rather than the return page alone in its [fulfillment guide](https://docs.stripe.com/checkout/fulfillment).

## Customer confirmation and payment events

The return link now includes Stripe's session reference. My Orders shows **Payment confirmed** only when that returned session matches the customer's completed order. A return URL alone shows **Review your payment status**. Customers can explicitly refresh payment status, see failures to verify a payment, inspect the booked class date and quantity, and continue an unpaid order without starting another checkout after an uncertain provider lookup.

Verified payment events must match the stored amount, currency, and payment environment. A metadata fallback is restricted to an owned pending order and its immediately replaced session; an unrelated checkout cannot attach itself just by carrying an order ID. An old payment-failed event cannot demote a completed/refunded order. Reconciliation also verifies session identity, totals, currency, and environment before changing an order to completed.

The existing receipt/business-email claims remain in place. Tests verify two purchased seats, the booked date, the stored total, one mocked email per audience, no duplicate email on webhook replay, and two confirmed roster seats. The storefront class link remains separate from the paid recipe unlock link.

The internal `/stripe-test` page now requires administrator access and displays the active payment environment and class release state. It directs testing through Shop/My Orders; it no longer offers an unrelated generic payment disconnected from a published product.

## Current release dependencies

The [read-only local readiness check](audit-screenshots/shop-payment-flow-2026-11-01/readiness.json) found:

- Local key mode is **test** and matches its configured mode; a webhook secret is configured. This is configuration evidence, not proof that Stripe can deliver to a local endpoint.
- Public class enrollment is **disabled**, and the published Shop has **zero public classes**. No class/date/price has been invented or published for this work. Keep the unavailable message until Amber supplies and approves the actual class.
- No stored class orders were found, and no isolated checkout-test schemas remained after cleanup.
- On November 1, the user confirmed that **paid shop and public-class order notifications also belong at `info@waistlessfoods.com`**. The deployed shared order-confirmation sender uses that address independently of the old `ADMIN_EMAIL` setting and SMTP sender. Customer receipts still go to the purchaser. The same routing applies to webhook and customer reconciliation paths; existing sent markers prevent old notifications from being resent automatically. Real inbox delivery remains pending.

The post-deployment [Stripe inspection](audit-screenshots/service-agreements-2026-11-01/readiness.json) still found no test-account endpoints and no invoice lifecycle events on the live website endpoint. The code is deployed; configure the appropriate endpoint before claiming end-to-end provider delivery. Class enrollment and the general preview restriction were retained.

## Local evidence

- `node --env-file=.env scripts/test-shop-checkout.mjs --integration`: **13 passed**. Includes actual create/resume route handlers, server-priced snapshots, environment/date isolation, pending/expired/paid holds, ownership, legacy class snapshots, provider errors, failed persistence cleanup, a real signed Stripe-format event, confirmations, and roster counts.
- The last-seat test used **two independent PostgreSQL connections with committed transactions** in one uniquely named isolated QA schema. The second backend was observed waiting on the advisory lock. Only one checkout/order was created. The table/schema were removed afterward; application customer records were not used.
- `node --env-file=.env scripts/test-order-notifications.mjs --integration`: **19 passed**, including mismatched payment data and stale failure-event handling.
- `node --env-file=.env scripts/test-service-workflow.mjs --integration`: **14 passed**, retaining the separate contract/invoice event path.
- `node --env-file=.env scripts/test-class-rosters.mjs --integration`: **17 passed**.
- `node scripts/qa-shop-payment-flow.mjs`: passed. The actual production Orders React component and actual APIs/services ran with a fictional browser identity, temporary SQL records, mocked Stripe/SMTP, and adapted Next navigation/images. This is not a real customer/Stripe-hosted checkout or inbox test.
- The final production build, TypeScript, and lint passed. Lint retains 25 pre-existing warnings and zero errors.
- `node scripts/qa-shop-release-guards.mjs`: passed against the rebuilt local production app, including anonymous/cross-origin checkout rejection and the protected administrator verification page.

See [browser screenshots and results](audit-screenshots/shop-payment-flow-2026-11-01/README.md). All screenshots use fictional QA content.

## Joint test with Amber

Before a live test, confirm the exact invoice/class, recipient accounts, amount, who will pay, and any refund arrangement. The following sequence is prepared; no transaction is authorized merely by this document.

1. Confirm the deployed production database, key mode, webhook signature secret, and enabled event types, retaining the preview restriction and class release flag. The November 1 code deployment and protected reads passed; invoice events still need configuration. If a future deployment uses another database, apply the agreement/newsletter migrations already documented.
2. Obtain and review Amber's actual agreement PDF. Prepare the real event's agreement from its inquiry and verify every imported term and event field before sending. Review customer private-link signing and account copy access.
3. For the agreed Private Chef/Catering test, issue the specifically approved deposit/full invoice, verify the customer invoice/link and account access, and make the authorized transaction together. Check Stripe state, the website invoice record, the customer's receipt, and `info@waistlessfoods.com` payment notification. Inbox arrival must be checked independently of SMTP acceptance.
4. Prepare Amber's actual public class with its approved date/time zone, per-seat price, description, and capacity. Review it before enabling public enrollment. In test mode first, buy multiple seats and inspect the actual hosted checkout, receipt, order history, and test roster. Run the separately approved live transaction only after agreeing its amount/quantity.
5. Confirm the live roster shows the correct purchaser and ticket quantity, sandbox data stays separate, the event date and paid amount match, and replay/refresh does not duplicate notifications. Record Stripe/order references privately; do not paste customer/card details into public evidence.
6. Confirm booking/consultation messages arrive at the business inbox and complete Amber's own admin/CMS/newsletter walkthrough. Public launch still needs her content review and approval to remove the preview restriction.

Sending a proposal, customer agreement, invoice, newsletter, test message, or real payment remains a separate explicit action; none was performed by this implementation work.
