# WaistLess Foods Production QA Report

Date: August 17, 2026  
Environment: `https://www.waistlessfoods.com`  
Verdict: **Conditional pass — do not formally close the punch list yet**

## Executive Result

The deployed code is live and the main implementation work is functioning. Responsive layouts, Contentful asset independence, managed authentication-page content, review submission controls, and the newsletter subscribe/unsubscribe lifecycle were verified in production.

The site still has three launch blockers or required launch decisions:

1. The Yelp footer icon is broken because the Next.js image-optimizer request returns HTTP 502.
2. Published test content remains visible on Sign In.
3. All routes except the homepage and unsubscribe page are still covered by the site-wide admin preview gate. This is acceptable only while the site intentionally remains in private review.

Final email inbox rendering remains outstanding.

## QA Coverage and Results

### Routes and responsive layouts — Pass with one asset defect

- 23 required and sitemap-discovered production routes returned non-error HTTP responses.
- 22 browser combinations were checked across:
  - desktop: 1440 × 1000;
  - tablet: 1024 × 1366; and
  - mobile: 390 × 844.
- Tested pages included Home, About, all three service details, Recipes, Shop, Sign In, and Sign Up.
- No tested page had horizontal overflow or an application runtime error.
- The only reproducible broken image was the Yelp footer icon.

Important preview condition: the automated browser unlocked the existing `sessionStorage` preview gate so that the actual pages could be inspected. A normal visitor can currently view the homepage and unsubscribe page, but encounters **Enter Admin Password** on the other tested routes.

### Homepage “A Message from the Chef” — Pass

- Desktop places Amber’s image on the left and the copy on the right.
- Mobile places the image before the copy.
- The portrait asset loads correctly and keeps Amber centered in the frame.
- The signature is no longer oversized.
- The warm neutral background and thin border render consistently without horizontal overflow.

Focused screenshots:

- `output/production-qa-2026-08-17/screenshots/desktop-home-chef-section.png`
- `output/production-qa-2026-08-17/screenshots/mobile-home-chef-section.png`

### About-page sticky portrait — Pass

- The desktop header remained at the top after scrolling.
- The sticky portrait’s measured top position stayed below the sticky header boundary.
- No sticky portrait behavior was forced onto the mobile layout.

### Contentful image independence — Pass

- Breakfast and Dessert resolve to different published Contentful asset IDs.
- Private Chef, Catering, and Cooking Classes each resolve three secondary images.
- All nine secondary service image links use unique asset IDs.
- The thumbnail-image field was not included in the secondary-image independence check.

### Sign In and Sign Up managed content — Functional; published copy cleanup required

- Both desktop pages render their separately managed Contentful images and copy.
- Mobile collapses to the form-first layout without horizontal overflow.
- The live Sign In page proves Contentful changes are rendering, but it currently contains test text:
  - `TASTE MORE. TEST`
  - supporting copy ending in `test`
- Sign Up displays its intended managed image and copy.

Before launch, remove the Sign In test suffixes and republish **Sign In & Sign Up Page Content** in Contentful.

### Reviews — Pass

- **Write a review** opens a working modal on mobile.
- The production modal includes five rating choices, Name, Email, Review, and the moderation notice.
- Invalid API input is rejected.
- A valid API submission returns success, enters the moderation list as `pending`, and is hidden from the public service page.
- The production admin endpoint authenticates and lists moderation records.
- An administrator can approve the pending review and the approved review then appears publicly.
- Returning the approved review to pending hides it from the public page again.
- Individually managed reviews can be deleted through the production admin endpoint.
- All QA-created review records were removed after testing.

The complete production sequence of **submit → pending → hidden → approve → display → return to pending → hidden → delete** passed. The runner was corrected to compare against the lowercase email normalization used by the endpoint, and its QA-only records and rate-limit artifacts were removed.

Only three approved reviews currently render per service, so the production dataset is not large enough to exercise **Load more reviews** and **Back to reviews** visually. Their behavior remains present in the deployed code.

### Newsletter and unsubscribe — Pass at endpoint/database level

- Invalid email input was rejected.
- A uniquely labeled new subscriber was accepted.
- An active duplicate was handled without creating a second record.
- An invalid unsubscribe signature was rejected.
- A valid signed unsubscribe deactivated the subscriber and set the unsubscribe timestamp.
- The QA subscriber and email-specific rate-limit record were removed afterward.

The live endpoint attempted the branded welcome email. Its HTTP success response does not prove inbox placement because sending failures are logged server-side without failing subscriber creation. Gmail, Outlook, and Apple Mail delivery/rendering must still be checked with real connected inboxes.

### Contentful-managed service pricing — Pass

- Private Chef and Catering each render their own Contentful-managed price text.
- The currently published `$xxx` values can be replaced and published independently without a code deployment.
- Final price values are an editorial/content decision rather than missing development work.

### Published content needing cleanup — Editorial follow-up

- Sign In contains the published test suffixes described above.
- Existing imported service reviews remain visible as approved records. They are now removable or movable to pending in `/admin/reviews`; Amber should decide which are real client reviews before the public launch.

### Yelp icon — Fail

- Original SVG: `https://cdn.simpleicons.org/yelp/ffffff` returns HTTP 200.
- Production optimized image request under `/_next/image` returns HTTP 502.
- The failure reproduced on repeated mobile homepage runs.

Recommended correction: store the Yelp icon locally or render the trusted SVG without Next.js image optimization, then rerun the mobile homepage/footer image check.

## Remaining Closeout Checklist

- [ ] Fix the Yelp icon and rerun the responsive image check.
- [ ] Remove Sign In test copy in Contentful and republish.
- [ ] Confirm which imported reviews should remain approved.
- [ ] Test the welcome email in Gmail, Outlook, and Apple Mail.
- [ ] Remove the site-wide admin preview gate when Amber and John approve public launch.
- [ ] Perform one final public, logged-out navigation pass after the preview gate is removed.

## Evidence

- Repeatable runner: `scripts/production-qa.mjs`
- Automated result: `output/production-qa-2026-08-17/results.json`
- Unlocked responsive result: `output/production-qa-2026-08-17/results-browser.json`
- Review/newsletter lifecycle result: `output/production-qa-2026-08-17/results-lifecycle.json`
- Screenshots: `output/production-qa-2026-08-17/screenshots/`

No real customer review or subscriber record was changed by this QA pass. All uniquely labeled production test records were removed.
