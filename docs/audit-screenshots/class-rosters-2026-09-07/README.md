# Class roster browser evidence

Captured locally on September 7, 2026. Populated screenshots use synthetic **QA SAMPLE** classes and `example.com` purchaser contacts, supplied only through Playwright response interception. They are not real live registrations, even where the UI's live-mode filter is being demonstrated.

- [Desktop roster](01-class-roster-desktop.png)
- [Mobile roster](02-class-roster-mobile.png)
- [Pending and refunded history](03-all-statuses-mobile.png)
- [Separated test-mode roster](04-test-mode-mobile.png)
- [Filtered sample CSV: Morgan only, three seats](sample-filtered-roster.csv)
- [Machine-readable checks](results.json)

The final run passed all ten checks. Anonymous JSON/CSV rejection, the administrator login gate, and an authenticated database read were verified against the real local application before fixtures were intercepted. Database filtering/export behavior was independently verified against isolated PostgreSQL temporary tables by the automated integration suite.

The initial harness incorrectly expected the anonymous browser URL to redirect; the existing admin layout instead showed its login screen at the requested URL. The assertion was corrected to check the visible login gate and absence of roster content. Dropdown locators were also corrected to use accessible combobox names. No authentication behavior was weakened to accommodate testing.

No production order, attendee, customer, subscriber, or CMS record was modified. No account was created, no email was sent, and no payment was attempted. The screenshot's Next.js development indicator is not production UI. This evidence does not verify a Vercel deployment or a real class checkout.
