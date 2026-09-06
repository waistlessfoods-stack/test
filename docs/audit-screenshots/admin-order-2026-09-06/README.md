# Administrator order email screenshot test — September 6, 2026

Tested commit `408c43a` locally using Stripe sandbox keys. Production remained
configured for live payments and was not switched to test mode. No real charge
was made; see [Stripe's sandbox testing guidance](https://docs.stripe.com/testing).

## Verified

- Dedicated QA customer completed a real sandbox Checkout transaction for
  Triple Berry French Toast: order #8, $1.08 USD order total including tax.
- The actual sandbox completion event was manually forwarded to the local
  webhook using the test signing secret (no automatic sandbox endpoint exists).
- Order became completed; full recipe access was available.
- Customer and administrator notification sent timestamps were recorded.
- Replaying the event returned 200. Exactly one customer receipt was found in
  the QA inbox and one administrator notification in the sending mailbox's Sent
  folder. Mail searches were restricted to the exact QA recipient and subject,
  and used read-only access without marking messages read.
- The administrator notification was addressed to the configured `ADMIN_EMAIL`,
  with a `[TEST]` subject and a do-not-fulfill warning.

## Screenshots

- [Stripe sandbox checkout](01-sandbox-checkout.png)
- [Completed order, before cleanup](02-completed-order.png)
- [Unlocked recipe](03-unlocked-recipe.png)
- [Actual administrator email, Sent copy](04-admin-email-sent-copy.png)
- [Actual customer email, received in QA inbox](05-customer-email-received.png)

Email screenshots render the actual HTML MIME body retrieved from the mailbox,
with an added evidence label. They are not screenshots of Gmail's interface.
The administrator Sent copy proves dispatch, **not receipt in Amber's separate
inbox**, which remains inaccessible. This test does not prove production checkout
or automatic live webhook delivery.

## Cleanup

Sandbox payment refunded successfully; order #8 marked refunded with QA metadata
to exclude it from completed-order totals. Dedicated Clerk QA user deleted.
Test email copies and the refunded audit row retained. General preview gate and
public-class settings unchanged. No application code was changed in this test.

Machine-readable results: [results.json](results.json).
