# Agreement/invoice workflow evidence

November 1, 2026. Final browser run used a local production build at `http://localhost:3010`.

- [Browser results](results.json)
- [Read-only schema and Stripe endpoint inspection](readiness.json)
- [Administrator agreement editor](admin-agreement-desktop.png)
- [Signed agreement, desktop](signed-agreement-desktop.png)
- [Signed agreement, mobile](signed-agreement-mobile.png)
- [Linked paid invoice, desktop](linked-paid-invoice-desktop.png)
- [Linked paid invoice, mobile](linked-paid-invoice-mobile.png)
- [Printed copy, page 1](printed-agreement-1.png)
- [Printed copy, page 2](printed-agreement-2.png)
- [Extracted print text](printed-agreement.txt)
- [Fictional QA PDF](../../../output/pdf/qa-service-agreement-2026-11-01.pdf)

These use clearly labelled fictional contract text and an example.com customer. The browser called actual route handlers and workflow services through an in-process bridge with isolated PostgreSQL TEMP tables. Stripe and email were mocked. The transaction was rolled back. Private fixture links appearing in screenshots no longer refer to a stored agreement.

Both final PDF pages were rendered with Poppler and visually checked. The final copy contains the signature, consent, timestamp, reference, and document hash together without the earlier orphaned hash page. This is a QA artifact, not Amber's actual agreement or proof of a real customer's signature/payment.

The live Stripe endpoint inspection was read-only and found missing invoice events. No endpoint setting, real customer, invoice, charge, or email was changed by that inspection.
