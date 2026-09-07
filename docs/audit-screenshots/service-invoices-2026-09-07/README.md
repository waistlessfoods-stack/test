# Service invoice QA — September 7, 2026

Local implementation evidence; not a deployed-production test. All pictured customers and amounts are QA samples. No real money was charged and no invoice email was delivered to a real inbox.

## Recommended screenshots

- [Invoice editor — desktop](10-invoice-editor-desktop.png)
- [Invoice editor — mobile](11-invoice-editor-mobile.png)
- [Admin paid-status tracking](09-admin-paid-tracking-desktop.png)
- [Customer invoice — mobile](06-member-invoice-mobile.png)
- [Customer paid status — mobile](07-member-paid-mobile.png)
- [Stripe-generated test invoice PDF](test-invoice.pdf)

[Results](results.json) show eight passing browser/API checks. The test used a verified temporary Clerk customer and Stripe's attached Visa test payment method. Payment was made through the Stripe test API; customer browser card entry and real-inbox delivery were not tested.

Files 01–08 are the initial full-flow captures. Some desktop captures contain the existing fixed site header at the scroll position during capture. Files 09–11 were recaptured at the page top, with no new invoice/payment mutations. The final capture also verified that refreshing the paid invoice updates its history row.

Temporary Clerk accounts were removed. Finalized Stripe test invoice/customer records are retained for audit. The final run left one paid test invoice and one void test invoice, identified in `results.json`. Two earlier interrupted runs left these additional void test invoices:

- `in_1UCwNQFayO2LBJqW8KkXTfha` — test payment method needed attachment before payment.
- `in_1UCwOIFayO2LBJqW8WnYQKlm` — transient Clerk connection timeout.

The unsaved editor sample in files 10–11 was not submitted. The general preview gate was unlocked only in the dedicated customer browser session; application access settings were not changed.
