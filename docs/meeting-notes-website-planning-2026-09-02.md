# WaistLess Foods Website Planning — Final Decision Record

Meeting date: September 2, 2026  
Final source: Chef Amber's written recap sent after the meeting  
Status: Website changes implemented in the working tree; external setup and
content cleanup remain

Amber's written recap is the final authority where it differs from the automatic
meeting transcript.

## Final Website Instructions

### Complimentary consultation

- Collect the prospect's information on the website before scheduling.
- The website form includes contact details, expected guests, preferred and
  alternative event dates, event details, and budget range.
- Save the submission as a **Complimentary Consultation** request in the website
  admin, then send the visitor to Chef Amber's public Google Appointment Schedule
  to select a Google Meet time.
- The Google booking form should also contain required custom questions named
  **Event Details**, **Event Date(s)**, and **Budget Range**. Re-entry is accepted
  because the website request and calendar appointment are separate records.

### Private Chef and Catering

- Chef Amber will update the gray **How to Book** content in Contentful.
- The service-page button reads **Request to Book**.
- The inquiry page titles read **Request Private Chef** and **Request Catering**.
- The inquiry form button reads **Submit Request**.
- The inquiry language makes clear that a request does not confirm availability,
  pricing, or the event date.

### Cooking Classes

- The service page has two actions:
  - **Request a Private Class** opens the in-home cooking-class inquiry form.
  - **Explore Public Classes** displays the existing unavailable notice before
    allowing the visitor to continue to Shop.
- The inquiry title is **Request Cooking Class** and its button reads
  **Submit Request**.
- Amber's phrase `Request Cooking C donkey lass` is treated as a transcription or
  dictation error and normalized to **Request Cooking Class**.
- The notice remains: **No public classes are currently available. In-home
  cooking classes are available for booking.**

## Answers to Amber's Additional Questions

### Previewing a paid recipe

The admin portal now includes **Paid Recipe Previews**. After signing in at
`/admin`, Amber can open that section, select a paid recipe, and inspect the full
post-purchase layout without buying it. The preview is protected by the existing
admin session and does not unlock the recipe for ordinary visitors.

### Recipe downloads

The current customer experience unlocks paid recipes for online viewing after a
completed purchase; it does not yet generate a downloadable file. A protected
**Download PDF** or **Print / Save PDF** option can be added as a separately
confirmed enhancement. A downloadable file is easier to keep, print, and share,
so the preferred access rules and branding or watermarking should be agreed first.

### E-book format

A branded PDF is the best first format for a visual recipe e-book because it
preserves layout, photography, and typography and is easy to sell or download.
An EPUB edition can be added later if reflowable text and dedicated e-reader
support become important.

### Newsletter ownership

Yes, Amber can own the newsletter workflow if a reusable template and editor are
built in the chosen back end. The current website has subscriber collection,
welcome email, unsubscribe handling, and admin subscriber counts, but it does not
yet have a campaign editor, test-send, scheduling, broadcast sending, archive
publishing, or campaign analytics. Those features remain the separately proposed
newsletter workflow and require a provider and scope decision.

## Completed Code Changes

- Enriched complimentary-consultation lead capture and scheduling handoff.
- Consultation requests distinguished from service requests in admin.
- Exact service and cooking-class button/form copy from the written recap.
- Protected paid-recipe preview area in admin.
- Shop generalized to support recipes and future public cooking classes.
- Public cooking classes hidden and blocked by default until their launch flag is
  explicitly enabled.
- Cooking-class capacity checks, class-aware order behavior, and paid-order email.
- Shop price clipping corrected.

## External or Client-Owned Actions Still Needed

- Chef Amber: update the gray service-page booking-process content in Contentful.
- Google Calendar owner: add the three required booking-form custom questions.
- Supply the public Google Appointment Schedule URL for
  `NEXT_PUBLIC_GOOGLE_BOOKING_URL`, redeploy, and complete an end-to-end test.
- Unpublish or correct the current Pasta Making test entry before launch. It is
  published in Contentful even though the final instruction says that no public
  classes are currently available.
- Decide whether customer recipe downloads should be added and, if so, whether
  the output is print-only, PDF, or watermarked PDF.
- Select the newsletter provider and approve the owner-managed campaign workflow.

## Published Contentful Test-Class Cleanup

The Pasta Making entry is currently published and still contains reused recipe
content:

- category **Vegan**, not **Cooking Classes**;
- stored slug `sweet-potato-chickpea`;
- `3 servings`, currently interpreted as a three-seat class capacity;
- `40 mins`, presented as the duration; and
- the older potato image.

Because Amber's written recap says no public classes are currently available, the
safest launch action is to unpublish this test entry. The Contentful Management
API credential available during implementation was rejected, so production
content was not changed automatically. The website also keeps public classes
hidden and unavailable for checkout unless
`PUBLIC_COOKING_CLASSES_ENABLED=true` is set in the deployment environment.
