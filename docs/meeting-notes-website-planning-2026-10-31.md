# WaistLess Foods — Meeting Update Checklist

Meeting with Amber Fitzgerald · October 31, 2026 · Approximately 1 hour 40 minutes

Source: [Original meeting transcript](meeting-raw/meeting-with-amber-2026-10-31.srt).

This checklist records the requested updates and follow-ups from the meeting. Checked items have the local implementation/test evidence described below; they do not imply production deployment or Amber's final acceptance. Unchecked items retain any remaining implementation or external verification work.

November 1 post-push update: all project changes were pushed in `debe1cb`, and Vercel's automatic deployment succeeded. All 124 automated tests, the local build/type/lint checks, and the production form/access checks passed. The preview restriction and disabled public-class enrollment remain in place. See the [full audit and remaining requirements](post-push-meeting-audit-2026-11-01.md); real inbox/card tests and Amber's missing content remain open.

Amber's [October 31 written recap](amber-written-recap-2026-10-31.md) was retrieved from connected Gmail on November 1. It supplies the exact inquiry wording, extends the copy update to Cooking Class inquiries, and confirms `admin@waistlessfoods.com`. Use that written wording where it clarifies the transcript.

## Active goal

**Resolve and verify the agreed October 31 meeting updates so the website is ready for launch, then complete the newsletter workflow.**

Status: Active. This document is the progress checklist for the goal; creating the goal does not mark any implementation work complete.

Work order:

1. Audit the existing implementation and preserve unrelated changes already in the workspace.
2. Fix the booking field, notification recipients, service pricing, and inquiry-record completeness.
3. Complete the agreement, invoice, and payment workflow; verify the technical flow and prepare Amber's customer walkthroughs.
4. Apply approved copy, configure Amber's confirmed administrator account, and verify content readiness as the required inputs become available.
5. Complete newsletter editing and test-send capabilities, then demonstrate independent use and settle the archive format.
6. Prepare the additional-development and monthly-retainer proposals for review.

Track Amber's supplied copy, administrator email, contract PDF, content, and payment walkthroughs as dependencies. Do not substitute invented content or treat missing inputs as completed work. Record implementation evidence and test results alongside completed items; keep production email delivery and live payments pending until actually verified. External messages and real-money charges require the relevant explicit authorization.

The future possibilities at the end of this document remain deferred and are not prerequisites for completing the agreed launch work.

## Launch priorities

Payments and the contract workflow are the primary launch priorities. The newsletter can continue in the background after launch.

- **November 2026:** Target public launch, ideally mid-to-late November, subject to completing the remaining work and testing.
- **December 2026:** Begin promoting public cooking classes.
- **January 2027:** Begin hosting public classes.
- **December or January:** Potential first newsletter; the newsletter does not need to delay launch.

Reference: 01:35:03–01:37:27.

## Website fixes and content updates — Zul

- [x] **Fix the guest-count input styling.** Added explicit black text, readable selection/autofill styles, and keyboard-accessible increment/decrement buttons. Desktop/mobile browser checks passed for all three inquiry pages at 1, 10, 49, 50, and invalid 51 guests; the original screenshot was not available. Local verification: November 1. Reference: 06:00–06:26.
- [ ] **Correct business inquiry notification recipients.** Send notifications to `info@waistlessfoods.com` instead of the old Gmail address. Check both complimentary consultations and Private Chef/Catering inquiries, then retest delivery. The outdated recipient was the likely cause identified in the meeting, not a confirmed fix. Reference: 06:27–09:09; 18:17–18:57.
- [x] **Update the inquiry introductions.** Applied Amber's exact emailed introduction and agreement/payment notice to Private Chef, Catering, and Cooking Class forms. Browser verified November 1. Reference: 05:24–05:59; 11:09–13:07; written recap.
- [x] **Update Event Details placeholders.** Applied the supplied Private Chef/Catering wording and separate Cooking Class wording. Browser verified November 1. Reference: 13:09–13:20; written recap.
- [x] **Remove displayed standard service pricing.** Removed the price badge from all service-detail pages; browser verified Private Chef, Catering, and Cooking Classes. Purchasable shop/class/recipe pricing code was not changed. Local verification: November 1. Reference: 13:22–14:24.
- [ ] **Configure Amber's administrator access.** Use her chosen email address; she indicated she would probably use her admin email and would confirm it. Verify login and access to booking requests, paid-recipe editing, and paid-recipe previews without purchasing. Reference: 20:35–23:17; 01:15:03–01:16:34.
- [x] **Cross-check booking request details in admin against the inquiry form.** Source inspection and mocked-handler tests verified names, normalized email, phone, guest count, both dates, and combined budget/event notes survive the save and admin response. Admin displays those fields, with budget and event details together under Notes. This is local code/handler evidence, not a live customer submission. Reference: 19:46–20:30.

Notification routing is implemented for both `/api/bookings` and legacy `/api/enquiries`, independently of the outdated generic `ADMIN_EMAIL` setting. Six mocked-handler tests passed; real business-inbox delivery remains unverified, so its checklist item stays open.

Administrator account authorization is implemented for the verified `admin@waistlessfoods.com` Clerk identity. Admin entry now offers account sign-in alongside existing password access. Two identity/route tests passed, including rejection of unverified, spoofed, unrelated, and cross-origin requests. Recipe management now links each paid recipe to its Contentful editor and provides a refresh control plus full admin previews without purchasing. Browser and route checks passed; Amber's own login and CMS editing permissions still need a walkthrough, so that checklist item stays open. The optional server setting `ADMIN_ACCOUNT_EMAIL` overrides the confirmed default; it is separate from notification recipients. See [implementation evidence](newsletter-media-and-recipe-management-2026-11-01.md) and [Clerk server identity documentation](https://clerk.com/docs/reference/nextjs/app-router/current-user).

For the two form-copy changes, direct code updates were accepted for now. Making those fields editable in Contentful is a future improvement, not a launch requirement. Reference: 12:24–13:07.

## Contracts, custom invoices, and payments — Zul, with Amber testing

- [ ] **Build the Private Chef/Catering contract workflow using Amber's PDF.** These custom invoices are for Private Chef and Catering; public cooking classes use the shop/cart checkout. Reference: 01:24:06–01:24:58.
  - [x] Reuse inquiry details where available rather than asking customers to enter them again. Implemented and verified with isolated SQL/browser tests.
  - [x] Allow Amber to fill in or update agreed amounts, dates, and other event-specific details before sending. Draft edits are versioned; issued content is frozen.
  - [ ] Produce a preview for Amber to review against her existing agreement.
  - [x] Let the customer review and sign digitally without printing and returning a document. Consent, server timestamp, and document hash were verified using fictional test terms; Amber's actual terms are still pending.
  - [x] Settle the access method: a private 30-day signing link plus verified-email account access to issued/signed copies. Replaced links stop working; signing retries cannot overwrite proof.
  - [x] Provide Print / Save PDF for the saved agreement and signature record. Final two-page fictional QA copy rendered and visually checked.
  - Reference: 01:25:03–01:33:19; 01:39:33–01:39:58.
- [ ] **Connect service requests, contracts, and custom invoices into a clear workflow.** The existing invoice feature was demonstrated, but its connection to the wider process was not complete. Reference: 01:19:04–01:25:56.
  - [x] Create a customized invoice from a signed agreement. Customer/service/date are checked; deposit/balance invoice totals are bounded by the signed total.
  - [x] Provide explicit invoice email/share actions and a Stripe payment link. Browser/handler tests used a Stripe fixture; actual email delivery remains unverified.
  - [x] Implement website invoice/payment synchronization from current Stripe state, with verified-signature webhook and replay tests. Code deployment is verified; live invoice event configuration remains pending.
  - [x] Implement a deduplicated business payment notification to `info@waistlessfoods.com`, with visible uncertainty and an explicit reviewed retry. Mocked delivery passed; live inbox delivery remains pending.
  - [x] Add member agreements alongside the existing member invoices. APIs use the account's verified primary email; ordinary shop orders stay in My Orders.
  - Reference: 01:19:34–01:22:56; 01:26:32–01:27:37; 01:33:21–01:33:56.
- [ ] **Test live Stripe payments with Amber.** Previous testing used the Stripe sandbox; real-money payments still needed verification. Reference: 01:02:54–01:04:40; 01:34:03–01:34:24.
  - [x] Verify the local public-class checkout path, server-priced ticket quantities/dates, concurrent seat availability, payment-state handling, confirmation templates, and roster counts with isolated SQL and mocked Stripe/SMTP. Actual last-seat contention and signed webhook replay checks passed November 1.
  - [ ] Test a custom Private Chef/Catering invoice as a customer.
  - [ ] Test a public cooking-class purchase through the shop/cart.
  - [ ] Verify customer confirmation emails, admin records, ticket quantities, and payment status as part of the purchase walkthrough.
  - Reference for class purchase expectations: 28:46–31:43.

Contract delivery/open tracking was discussed as potentially useful, but Amber identified collecting the digital signature as the most important requirement. The final tracking scope remains undecided. Reference: 01:27:41–01:28:26.

The [agreement/invoice implementation and runbook](service-agreements-2026-11-01.md) records verification and remaining acceptance checks. Code deployment and production protected reads passed. The overall contract/invoice items remain open because Amber's actual PDF, live webhook setup, and real delivery/payment walkthroughs are not complete.

A read-only Stripe account inspection found that the live website webhook currently has **no invoice events enabled**, and the test account has no registered endpoints. A guarded configuration script prepares the exact additions; live settings were not changed. See [inspection evidence](audit-screenshots/service-agreements-2026-11-01/readiness.json).

The [shop/class payment handoff](shop-payment-readiness-2026-11-01.md) records corrected date/mode-specific seat holds, matching-checkout reuse, safe resumption, verified totals, and truthful customer status. The published Shop has no public classes and enrollment remains disabled. A concrete joint test sequence is prepared; no hosted test/live payment or real email was performed. The user confirmed on November 1 that paid shop/public-class order notifications should also go to `info@waistlessfoods.com`; that routing is deployed independently of the old `ADMIN_EMAIL`, alongside the already corrected booking/consultation and service-invoice routes. Customer receipts retain the purchaser's address. Code deployment is verified; inbox delivery remains unverified.

## Newsletter — can continue after launch

- [x] **Finish a reusable branded newsletter template.** Added optional header/footer images, up to six body images with paragraph placement, accessible descriptions, and optional HTTPS links across email, archive, and PDF. Existing branding and light/dark mobile layout were retained. Saved-content, frozen-campaign, actual UI/handler/SQL, and rendered PDF checks passed locally November 1; production/inbox/Amber acceptance remain separate. Reference: 59:26–01:01:49; 01:16:41–01:17:54.
- [ ] **Demonstrate the full newsletter workflow with Amber's first newsletter.** Use her content, send a test email, inspect the received result, and walk her through creating and sending from admin. Reference: 01:01:28–01:01:56; 01:11:29–01:12:48.
- [ ] **Ensure Amber can create and send newsletters independently.** Admin authoring, image controls, previews, administrator tests, and explicit subscriber campaigns are implemented and locally verified. Her own login and first-content/inbox walkthrough remain pending. She explicitly wants access without needing to coordinate every send with Zul. Reference: 41:47–42:25.
- [x] **Verify the existing member archive and PDF format.** Existing code already supports member-only web issues plus downloadable PDFs, with explicit admin publication separate from email sending. Integration tests passed for publication, signed-in access, PDF downloads, and access revocation after unpublishing. Automatic publication after sending is not implemented or claimed. Amber's content/demo remains open. Reference: 50:06–55:50.

Scheduling and more advanced automation were discussed as future improvements. The previously supplied welcome email was described as already automated; it is separate from the first newsletter. Reference: 45:10–46:06; 01:11:43–01:12:39.

See the [current newsletter authoring and recipe-management handoff](newsletter-media-and-recipe-management-2026-11-01.md). Newsletter previews now use the confirmed administrator identity, rather than the old generic notification setting. The additive image-storage migration and code deployment are verified; production protected reads passed. Amber's content/inbox walkthrough remains pending.

## Content and information needed from Amber

- [ ] **Shorten/finalize homepage testimonials.** Amber said they were too wordy. Confirm the final published wording. Reference: 05:06–05:24.
- [ ] **Verify the revised Private Chef/Catering How to Book content.** Amber reported updating these service-page instructions already. Reference: 05:24–05:38.
- [x] **Provide exact inquiry-form wording.** Retrieved from Amber's October 31 written recap, including Cooking Class copy, and implemented locally. Reference: 05:38–05:59; 13:09–13:20; written recap.
- [ ] **Send bug screenshots and any remaining minor corrections.** Reference: 06:22–06:26; 01:38:52–01:39:30.
- [x] **Confirm administrator and request-notification emails.** Written recap confirms `admin@waistlessfoods.com` for account access and `info@waistlessfoods.com` for website requests. On November 1, the user also explicitly confirmed `info@waistlessfoods.com` for paid shop/public-class order notifications; the shared sender now uses that address. Newsletter administrator tests retain the separate administrator identity. Reference: 22:16–23:17; 01:18:39–01:19:03; written recap and November 1 recipient clarification.
- [ ] **Send the existing customer contract PDF.** Reference: 01:30:40–01:30:50; 01:39:33–01:39:58.
- [ ] **Update the Cooking Classes page's gray information boxes and related copy.** Reference: 14:41–15:02; 01:18:18–01:18:28.
- [ ] **Finalize recipes, ideally at least one per category.** This ensures a category filter has at least one recipe to show. Reference: 01:02:11–01:02:43.
- [ ] **Participate in live invoice and cooking-class payment testing once ready.** Reference: 01:34:03–01:34:24.
- [ ] **Supply first newsletter content and review the template/test email.** Reference: 01:12:27–01:12:48.

A November 1 read-only [published-content audit](content-readiness/2026-11-01.json) found five recipes with ingredients/instructions, photos, cook time, and serving size. **Beef, Fish & Seafood, Chef Spotlight, and Poultry** still have zero published recipes. All three service pages have six How to Book steps and two detail sections. Presence is verified; Amber's final wording and category content remain her review tasks.

## Separate commercial follow-ups — Zul

- [ ] **Send a proposed amount for development beyond the original agreement.** No amount was agreed during the meeting.
- [ ] **Send a separate monthly retainer proposal.** Define maintenance/support scope and price; newsletter assistance and other ongoing services can be scoped separately.

Prepared for Zul's review on November 1; neither document has been sent, agreed, or invoiced:

- [x] [Additional development compensation draft](proposal/additional-development-compensation-2026-11-01.md) — proposed USD $600, with original-scope corrections excluded and new contract-work scope still to be settled.
- [x] [Monthly maintenance draft](proposal/monthly-maintenance-2026-11-01.md) — proposed USD $300/month for five hours, with scope and response-time boundaries.

Reference: 01:08:33–01:09:35; 01:34:31–01:34:59.

## Verification evidence — November 1, 2026

- [Browser results and desktop/mobile screenshots](audit-screenshots/meeting-fixes-2026-11-01/README.md).
- `node scripts/test-booking-requests.mjs`: 6 passed, with database/SMTP replaced; no real requests or emails created.
- `node scripts/test-admin-identity.mjs`: 2 passed, with Clerk replaced; no account changes.
- `node scripts/test-service-invoices.mjs`: 13 passed with Stripe replaced; no charges or invoice emails.
- `node --env-file=.env scripts/test-newsletters.mjs --integration`: 16 passed after newsletter media updates.
- `node --env-file=.env scripts/test-newsletter-campaigns.mjs --integration`: 16 passed after image/link snapshot coverage.
- `node scripts/test-newsletter-media.mjs`: 4 passed.
- `node scripts/test-recipe-administration.mjs`: 4 passed.
- `node --env-file=.env scripts/test-class-rosters.mjs --integration`: 17 passed.
- `node --env-file=.env scripts/test-order-notifications.mjs --integration`: 19 passed after checkout payment-state guards.
- `node --env-file=.env scripts/test-shop-checkout.mjs --integration`: 13 passed, including two independent SQL transactions competing for the final seat.
- Integration checks used isolated temporary tables/rolled-back transactions and mocked email delivery.
- `pnpm exec tsc --noEmit`: passed after the code changes.
- `pnpm lint`: passed with 0 errors and 25 warnings in existing scripts/runtime files.
- `pnpm build`: passed, including production compilation, TypeScript, and page generation. Existing edge-runtime/static-generation notice remains.
- Agreement/invoice continuation: `node --env-file=.env scripts/test-service-workflow.mjs --integration` passed 14 tests; actual UI/route/service browser walkthrough against a local production build passed with temporary SQL records and mocked Stripe/SMTP. A final two-page printed agreement was visually verified. The production build and TypeScript passed again, and lint retained 0 errors / 25 existing warnings. See [evidence](audit-screenshots/service-agreements-2026-11-01/README.md).
- Newsletter/recipe continuation: actual UI/handler/temporary SQL walkthrough passed, with local image fixtures and mocked SMTP. Saved-image placement, mobile/light/dark email previews, archive publication independent of sending, frozen campaign media, and the final rendered PDF were verified. Read-only browser checks confirmed paid admin previews and protected public responses. See [newsletter evidence](audit-screenshots/newsletter-media-2026-11-01/README.md) and [recipe evidence](audit-screenshots/recipe-administration-2026-11-01/README.md).
- Shop/class continuation: actual checkout/resume/reconciliation/webhook/roster code passed isolated SQL tests; the production Orders React UI passed a fictional browser walkthrough at desktop/mobile widths. Checkout retries reuse a payable session, unknown provider outcomes do not create a second link, and the return URL alone cannot show a confirmed payment. Contract/invoice regression tests remain 14 passed. See [evidence and release guards](audit-screenshots/shop-payment-flow-2026-11-01/README.md).
- Paid-order recipient clarification: after the user confirmed `info@waistlessfoods.com`, the 19 notification tests and 13 checkout tests passed again with that address asserted. TypeScript, targeted lint, and production build passed. See [recipient evidence](audit-screenshots/shop-payment-flow-2026-11-01/paid-order-recipient.json). SMTP was mocked; the subsequent deployment is verified, while inbox delivery remains pending.
- Post-push audit: all 124 tests across 11 suites passed again on `debe1cb`, together with seven browser harness runs, additional production recipe/access/release checks, TypeScript, full lint, and production build. Vercel deployment succeeded. Required schema fields and production protected reads passed; real payments/email and missing content remain open. See [results](audit-screenshots/post-push-2026-11-01/results.json).

The browser harness initially used a guessed Private Chef slug, then encountered the existing client preview gate. It was corrected to the actual `/services/private` route and given the existing test-only session-storage unlock. The final run passed. The application's preview restriction was left enabled.

## Remaining implementation and external dependencies

- Contract signing and request-to-contract-to-invoice linkage are implemented and locally verified. The actual agreement PDF is still missing: Amber's recap mentions it, but its available attachments contain only inline checkbox images, and a targeted follow-up search found no separate agreement attachment. The user also confirmed on November 1 that they do not think they have a copy. No real agreement has been prepared or sent.
- The paid-service-invoice notification/webhook path is deployed and tested with verified webhook signatures and mocked delivery. Enabling invoice events on the live Stripe webhook and approved real-inbox verification remain outstanding.
- The newsletter now supports deployed header/footer/body image and link editing alongside text, test sends, manual campaigns, archive, and PDFs. First newsletter content, real received-email inspection, and Amber's independent walkthrough remain pending.
- Paid-recipe management now links to the existing Contentful editor and refreshes published content; admin full previews and ordinary storefront access boundaries passed local checks. Amber's own CMS permissions and edit/publish walkthrough remain pending. Public purchase previews no longer serialize full ingredients/instructions into client props.
- The requested Git push triggered a successful automatic production deployment. Verification did not send external email, make live-card payments, confirm real inbox delivery, publish customer content, or change Stripe webhook settings. The site preview restriction and disabled public classes were retained.
- The [written follow-up](amber-written-recap-2026-10-31.md) also reports a service-gallery/Contentful issue and requests more photos. Track that separately from the transcript's original checklist.

## Future possibilities, not confirmed launch requirements

- Make the remaining hardcoded inquiry-form text editable in Contentful. Reference: 12:24–13:07.
- Import Google/Yelp reviews. The existing manual submission and moderation flow was accepted as sufficient for now. Reference: 24:34–27:15.
- Add newsletter scheduling and advanced automation. Reference: 45:10–46:06; 57:26–57:46.
- Embed videos after Amber prepares a business YouTube presence and video assets. Reference: 01:07:29–01:08:01.
- Consider social media, blog/SEO, and other marketing support under a separately agreed scope. Reference: 38:29–41:12; 01:05:00–01:07:21.
