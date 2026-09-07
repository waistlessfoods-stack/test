# Class registration UI revision — September 7, 2026

Updated after the user's visual review. These are local browser screenshots using labelled sample classes and fictional purchaser contacts, not real registrations.

- [Desktop](01-class-roster-desktop.png)
- [Mobile](02-class-roster-mobile.png)
- [Tablet](05-class-roster-tablet.png)
- [Pending/refunded history](03-all-statuses-mobile.png)
- [Test-mode warning](04-test-mode-mobile.png)
- [Filtered sample CSV](sample-filtered-roster.csv)
- [Verification results](results.json)

The redesigned workspace replaces the storefront header/footer on `/admin/class-rosters` only. It adds a compact admin header, desktop class-selection sidebar, aligned purchaser rows, compact seat totals, a mobile selector/card layout, and expandable explanatory notes. Public pages and other admin pages keep their existing site layout. Client-side navigation out of the workspace restores the storefront layout.

All 15 browser checks passed, including authenticated/anonymous access, filters, CSV export, mode isolation, empty/error states, expandable notes, and overflow checks at 768px, 390px, and 320px. Production build, TypeScript, and targeted lint passed. Data aggregation, API authorization, public-class availability, and the site preview gate were not changed.

Earlier screenshots are preserved in `../class-rosters-2026-09-07/` for comparison. No customer data, payment, email, or deployment mutation was performed during this UI revision.
