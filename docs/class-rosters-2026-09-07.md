# Cooking-class registrations — September 7, 2026

Implemented a read-only purchaser/seat roster at `/admin/class-rosters`, linked from **Admin Portal → Class Registrations**. It uses existing website orders; there is no database migration or new service dependency.

## What Amber can do

- Select a class and its booked date.
- See confirmed seats, confirmed order count, and pending-order seats separately.
- Inspect purchaser names, emails, phone numbers when recorded, quantities, order numbers, statuses, and order-placement dates.
- Search by purchaser/contact detail or order number and filter confirmed, pending, refunded, failed, or all orders.
- Download a private CSV for the selected class, environment, status, and search filters.
- Switch between live registrations, test/QA registrations, and unclassified legacy orders. The default is live, confirmed orders.

## What the data means

This is a purchaser roster, not a list of every guest's name. Checkout records the purchaser and quantity; the feature does not invent names for additional seats. Missing names/contact details are identified as unrecorded.

Classes are grouped by stored product ID plus the event-date string recorded at checkout, not by editable titles. The newest stored title is displayed. Renaming a class does not split its roster; separate booked dates do. Repeated lines for the same class/date in one order combine into one purchaser row. Separate orders from the same purchaser remain separate.

Only `completed` orders count toward confirmed seats. Pending, failed, and refunded orders do not. Pending-order seats are not reservations. Status reflects the website database, not a new live Stripe lookup. Payment/refund updates must already be synchronized into the order record. This feature does not change that synchronization.

Only items explicitly marked `kind=cooking_class` are recognized. Recipe titles are never used to guess class membership. Classes with no orders are not listed, and deleted/unpublished CMS entries do not erase the stored order history. Private-class enquiries remain in Booking Requests.

Capacity values are historical checkout snapshots, not current availability. No concurrent-seat reservation or overselling fix is included. Public classes remain disabled unless separately enabled through the existing setting; the general preview gate is unchanged.

## Privacy and operational safeguards

- Both the page and API require existing administrator authentication. CSV access is protected too. Responses are private, non-cacheable, and excluded from indexing.
- The endpoint is GET-only. There are no order/subscriber/CMS updates, refunds, emails, or check-in actions.
- Test sessions (`cs_test_`) and live sessions (`cs_live_`) are separated. Unrecognized identifiers appear only in the explicitly selected unclassified mode.
- CSV values are quoted/escaped and spreadsheet-formula prefixes are neutralized, including `+` phone-number prefixes. Exports use a UTF-8 BOM for spreadsheet compatibility.
- Export requests re-read current data and enforce the same class/status/search filters. They may reflect newer order changes than an already-open screen.
- Malformed class lines are flagged rather than included in seat totals. If more than 5,000 class-containing orders exist in one environment, the read/export fails explicitly instead of showing truncated totals. Add date-range pagination before that threshold becomes relevant.
- CSV contact details are private operational data, not marketing consent. Purchasers are not automatically subscribed to newsletters.

## Verification

- 16 automated tests passed, including real PostgreSQL integration against temporary tables inside a rolled-back transaction.
- Tests cover seat arithmetic, states, environment isolation, product/date grouping, mixed recipe baskets, duplicate lines, malformed records, missing details, filters, safe CSV cells, authorization, actual SQL filtering, and the overflow safeguard.
- Local Playwright checks passed for anonymous protection, authenticated database reads, populated roster filtering/counts, mobile overflow, CSV download, pending/refunded history, mode separation, empty state, and read-error handling.
- Populated browser screenshots use clearly labelled in-browser QA fixtures. No production class orders or attendees were inserted to obtain screenshots. The unmocked authenticated API/database read was verified separately before fixture interception.
- Production build and TypeScript passed. Full lint: zero errors, 21 pre-existing warnings. `git diff --check` passed.
- No real orders, registrations, subscriber records, CMS entries, or account records were changed; no emails or payment requests were made.

Repeat checks:

```sh
node --env-file=.env scripts/test-class-rosters.mjs --integration
pnpm lint
pnpm build
```

For browser checks, start a local server on port 3010 and run `node scripts/qa-class-rosters.mjs`. The browser harness performs authenticated read-only API checks, then injects sample responses only inside its own browser context. It does not enable public classes.

## Deployment

Commit/push and redeploy to Vercel. No deployment was performed by the assistant. No new environment variables or database migrations are required. After deployment, verify Admin Portal → Class Registrations and protected export access. An empty live roster is expected while no real cooking-class orders exist.

[Screenshots and sample CSV](audit-screenshots/class-rosters-2026-09-07/README.md)

## UI revision after visual review

The roster now uses a compact admin-only presentation on this route: storefront header/footer removed, desktop class sidebar, tighter aligned registration rows, compact totals, mobile-friendly cards/selectors, and expandable notes. Authentication and all data/export behavior remain intact. Other pages retain their existing storefront layout, including after client-side navigation. The updated browser harness saves to `class-rosters-ui-2026-09-07` and passed 15 checks, including 320px/390px/768px overflow and storefront-navigation restoration.

[Updated UI screenshots](audit-screenshots/class-rosters-ui-2026-09-07/README.md)
