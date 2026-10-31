# Website walkthrough screenshots and checks

The admin walkthrough includes 44 screenshots across seven workflows. Captions
identify live screens, browser-only sample data, simulated UI tests, and one
earlier member-archive reference from September 6. Another 35 images were
captured on October 30, 2026, and eight local sample-roster walkthrough images
were captured on October 31. Every image is served through an authenticated,
allow-listed admin endpoint with private/no-store caching. Full paid-recipe
images are not published under `public/`.

The screenshots are visual guidance, not public-launch sign-off. No production
booking, newsletter, subscriber, invoice, payment, review, or CMS content was
created or changed. Google appointment questions were inspected without clicking
Book. Application submissions were intercepted in the browser and fulfilled
with clearly labelled synthetic responses. No real email or payment was sent.

## Checks performed

- Consultation form entry, simulated confirmation, Google schedule handoff,
  and required Event Details, Event Date(s), and Budget Range questions.
- Private Chef, Catering and private-class required-field validation and
  confirmation states using synthetic responses.
- Live public-class unavailable state and a synthetic sandbox roster.
- Protected paid-recipe preview, complete recipe layout, and print styling.
- Newsletter save, branded preview, publish, and campaign preparation using
  browser fixtures. Publishing did not prepare or send a campaign.
- Invoice preparation, draft save, and issuing controls using a simulated
  Stripe response. Sample payment links cannot charge a customer.
- Admin navigation, synthetic review moderation screen, Contentful sign-in,
  published homepage, and read-only storefront settings.
- Every gallery selector and image, full-size viewing, verification notes,
  review ticks, mobile overflow, anonymous rejection, filename allow-listing,
  and image cache headers.
- Existing invoice, newsletter, campaign, roster, order-notification and email
  design checks passed. The combined Node test run reported 30 passes and three
  opt-in integration skips; campaign and visual-design scripts also passed.
- Newsletter API/database integration: 15 passes, zero failures, with isolated
  temporary tables and a mocked mailer. Class-roster integration: 16 passes,
  zero failures. Both database transactions were rolled back.

## Remaining verification

The October 31 update adds shared navigation to all authenticated admin pages
and a built-in **Sample walkthrough** option in Class registrations. It contains
one fictional Alex Sample order for two seats in **SAMPLE - Fresh Pasta Workshop**.
The sample is generated separately from database orders, requires admin access,
and supports the same search, status filters, and CSV export. No customer,
registration, charge, email, or seat reservation is created. Actual Test / QA
orders remain separate. The empty state also links directly to the sample.

Eight new screenshots cover opening registrations from the admin portal,
selecting the sample, reviewing seats versus orders, searching, downloading the
filtered sample CSV, filtering/resetting, mobile use, and returning to live
orders. These are captures of the working local application, not browser response
fixtures. Production deployment of commit `41e9239` and read-only verification
completed on October 31 at `https://www.waistlessfoods.com`. All 36 unique Admin
navigation and guide destinations returned success, and the guide anchors exist.
The live sample flow, two seats in one order, search, status reset, sample CSV,
mobile layout, and return to live orders passed. All 44 protected images and
gallery controls passed, including anonymous rejection and no-store headers.
The live reports are saved in `.runtime/walkthrough-evidence/admin-links-qa.json`
and `.runtime/walkthrough-evidence/gallery-qa.json`.

October 31 validation: the sample flow and all 44 gallery images passed browser
checks, including mobile overflow, protected image delivery, and restored public
header/footer when navigating out of Admin. Lint and TypeScript passed. Roster
tests reported 11 passes and one opt-in integration skip. The Webpack production
build passed (`pnpm exec next build --webpack`); the default Turbopack build hit
a Google Manrope font-resolution error in the root layout.

Real lead persistence and inbox delivery, Google appointment creation and Meet
invitation, customer purchase/unlock, live invoice payment reconciliation,
public-class enrollment, a fresh signed-in member archive/download session,
Contentful editing/publishing, and final launch approval remain separate checks.
The September member-archive screenshot is historical sample evidence.

Content review finding: the Catering page still displays `$XXX` as its starting
price. Amber should confirm the intended copy before launch. No price was invented.

## Reproduce

```powershell
node scripts/capture-walkthrough-evidence.mjs
node scripts/capture-walkthrough-evidence.mjs --stage=reference-fixes
node scripts/capture-walkthrough-evidence.mjs --stage=calendar-details
python scripts/build-walkthrough-evidence.py
node --env-file=.env --test scripts/test-service-invoices.mjs scripts/test-newsletters.mjs scripts/test-newsletter-campaigns.mjs scripts/test-class-rosters.mjs scripts/test-order-notifications.mjs scripts/test-newsletter-design.mjs
node --env-file=.env scripts/test-newsletters.mjs --integration
node --env-file=.env scripts/test-class-rosters.mjs --integration
node scripts/qa-walkthrough-screenshots.mjs
node scripts/capture-class-roster-guide.mjs
```

The capture script uses the existing admin session signing configuration without
printing credentials. It never clicks Google Book or confirms an actual send.
`WALKTHROUGH_BASE_URL` overrides the gallery-check destination; its default is
`http://localhost:3015`. The source capture targets the live website deliberately.
`capture-report.json` records per-image provenance. `lib/walkthrough-evidence.json`
is generated metadata and includes image dimensions and workflow-specific limits.
