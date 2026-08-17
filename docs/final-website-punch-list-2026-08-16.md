# WaistLess Foods Website — Final Punch List

Created: August 16, 2026  
Status: Working handoff document  
Project: WaistLess Foods

## Purpose

This document consolidates the remaining website work identified during the latest website-planning meeting, Amber's follow-up email, the saved correspondence history, and a review of the current codebase.

There is enough information to begin the unblocked development work. Some items cannot be completed until Amber or John supplies content, access, decisions, or approval.

## Immediate Development Work

### 1. Update “A Message from the Chef” — Completed August 17, 2026

- [x] Desktop layout: place Chef Amber's photo on the left and the copy on the right.
- [x] Mobile layout: place the photo first and the copy second.
- [x] Ensure more of Chef Amber is visible without awkward cropping.
- [x] Keep the composition responsive rather than forcing the same arrangement at every screen size.
- [x] Verify the final layout on desktop, tablet, and mobile.

Completion note: the overlapping portrait/background treatment was replaced with a responsive split layout. The Contentful-managed portrait uses contained, bottom-aligned positioning so the available image remains visible without forced cropping. The section was visually checked at phone, tablet, and desktop widths.

### 2. Make the Sign-In and Sign-Up Images Editable — Completed August 17, 2026

- [x] Add an appropriate Contentful field or content entry for the authentication-page image.
- [x] Connect the sign-in and sign-up pages to the managed image.
- [x] Give Amber access to update the image through Contentful.
- [x] Decide whether both pages share one managed image or have independent images.
- [x] Preserve a safe fallback image if Contentful has no published image.

Completion note: the published Contentful model is named `Sign In & Sign Up Pages`, with one entry named `Sign In & Sign Up Page Content`. Sign In and Sign Up each have their own clearly prefixed background image, image description, image heading, image supporting text, form heading, and form supporting text. The two images previously bundled with the website have been uploaded as separate published Contentful assets and attached to the matching fields. Security-sensitive form labels, validation messages, verification copy, and authentication behavior remain controlled by the application. If either managed image is missing or unpublished, Sign In safely falls back to `/about/food-img.png` and Sign Up falls back to `/highlight/recipe.png`.

Amber can update the pages under **Content > Sign In & Sign Up Pages > Sign In & Sign Up Page Content**. Fields beginning with **SIGN IN** control the Sign In page, and fields beginning with **SIGN UP** control the Sign Up page. Publish newly uploaded assets and then publish the page-content entry. The changes will appear after revalidation or within the five-minute cache window.

### 3. Separate the Breakfast and Dessert Images — Completed August 17, 2026

- [x] Confirm that Breakfast and Dessert link to independent Contentful assets.
- [x] Ensure changing one image no longer changes the other.
- [x] Publish the corrected entries.
- [x] Verify the images on every affected page, including the homepage, Recipes, and Shop where applicable.

Completion note: the published Breakfast and Dessert `recipeCategory` entries were still sharing one Contentful asset. The visible Breakfast artwork was cloned into a separately published `Breakfast Category Image` asset and linked to Breakfast, while the original asset was retained and renamed `Dessert Category Image`. The category assets now have different IDs, so replacing either asset cannot change the other category. Recipes and Shop were verified locally and in production using the independent assets. Homepage currently displays Dessert but not Breakfast; its Dessert card already uses a third independent `Dessert Recipes` featured asset and was verified in both environments.

### 4. Separate Service Secondary Images — Completed August 17, 2026

- [x] Give Private Chef, Catering, and Cooking Classes independent secondary/sub-images.
- [x] Do not change or combine the service thumbnail images as part of this task.
- [x] Confirm each service can be edited independently in Contentful.
- [x] Publish and verify the gallery/sub-images on each service-detail page.

Completion note: all three published service entries were sharing the same three `subImages` assets. Catering retained the original assets, while Private Chef and Cooking Classes each received three separately published copies of the same visible artwork. The nine secondary-image links now use nine unique Contentful asset IDs, so each service can be edited independently without changing another service. The existing service thumbnail asset IDs were verified unchanged. All three service-detail pages were then verified on localhost and production with the expected main thumbnail and independent gallery assets.

### 5. Make the Homepage Message Editable — Completed Locally August 17, 2026

- [x] Confirm the intended homepage headline and supporting message from Amber's published entry and written feedback.
- [x] Add or reuse Contentful fields for the headline and subheadline.
- [x] Connect the fields to the homepage frontend.
- [x] Preserve sensible fallback copy when fields are empty.
- [x] Verify copy such as `Waste Less, Taste More` and `Join our community for exclusive recipes...` can be changed without a code deployment after this frontend release is deployed.

Completion note: the existing `heroTitle` and `heroSubtitle` fields were already present, but the frontend replaced their values with hard-coded copy whenever the headline mentioned Private Dining & Catering. That override was removed. The Contentful model now presents three clearly labeled, optional fields: `HOMEPAGE — Eyebrow`, `HOMEPAGE — Main Headline`, and `HOMEPAGE — Supporting Message`. The active combined title was separated while preserving Amber's published presentation: `BOLD. SEASONAL. ARTFUL.` above `PRIVATE DINING & CATERING`, followed by the published supporting message. Empty or missing values use safe frontend fallbacks. Localhost was revalidated and verified against the published Contentful values. The public site still runs the earlier hard-coded frontend build, so this code must be included in the next deployment; after that one deployment, future copy changes only require editing and publishing the Homepage entry in Contentful.

### 6. Complete the Review Workflow — Completed Locally August 17, 2026

- [x] Make the **Write a review** button open a working form or modal.
- [x] Collect the reviewer's name, email address, rating, and review text.
- [x] Validate submissions and include spam/abuse protection.
- [x] Do not publish submitted reviews automatically.
- [x] Store or route reviews for administrator moderation and approval.
- [x] Decide whether moderation will happen in Contentful, the custom admin area, or through an email-assisted workflow.
- [x] Display only approved reviews.
- [x] Keep the existing progressive **Load more reviews** behavior.
- [x] Add a convenient way to return to the top when a long review list is expanded.
- [x] Treat existing testimonials and service-review submissions as separate content where appropriate.

Completion note: moderation now uses the existing custom admin area at `/admin/reviews`. The **Write a review** modal collects the reviewer's name, private email address, one-to-five-star rating, and review text. The public submission endpoint validates allowed services, field lengths, email format, rating, minimum review length, and excessive links; it also uses a hidden honeypot plus per-IP and per-email rate limits. Every accepted submission is stored in the `service_reviews` database table with `pending` status and cannot appear publicly until an administrator approves it. Administrators can filter pending, approved, and rejected reviews; approve, reject, or return any review to pending; and permanently delete a review after confirmation. The nine reviews previously embedded in the three published Contentful service entries were imported as individually managed records. Service pages now use only approved database reviews, and the displayed average and count are calculated only from those visible records—the old shared `4.8 / 27 reviews` placeholder aggregate is ignored. Contentful imports are idempotent and identified in the admin area, while homepage testimonials remain a separate content type. Progressive **Load more reviews** remains in place, with a **Back to reviews** control after expansion. The database migrations were applied, and pending visibility, approval restoration, permanent deletion, TypeScript, ESLint, and a clean production build were verified; all nine imported records were restored to approved after testing and no temporary review remains. The frontend and admin additions still require the next normal deployment before they are available on the public site.

### 7. Connect the New Welcome Email to Subscriptions — Implemented Locally; Inbox Matrix Pending

- [x] Use Amber's August 14 revised `The WaistLess Table` copy.
- [x] Use the prepared branded React Email template and WaistLess Foods logo.
- [x] Connect the new template to the newsletter-subscription endpoint.
- [x] Replace the older generic subscriber confirmation email.
- [x] Use Amber's supplied subject line: `Welcome to The WaistLess Table!`.
- [x] Verify the website URL and unsubscribe URL.
- Send test messages to major email clients before production use.
- [x] Confirm that the email remains readable when images are blocked.
- [x] Verify failure logging and duplicate-subscription behavior.

Completion note: the newsletter endpoint now sends the August 14 branded React Email template with the WaistLess Foods logo and a generated plain-text alternative. The default subject is Amber's previously supplied `Welcome to The WaistLess Table!`; `NEWSLETTER_WELCOME_SUBJECT` can override it without changing the template. The canonical website and logo URLs at `https://www.waistlessfoods.com` returned HTTP 200. Each message receives a signed, subscriber-specific `/unsubscribe` URL, and the new public unsubscribe page updates active subscription status without exposing an email address in the link. Resubscription reactivates the existing record and sends a fresh welcome message. Active duplicates return the existing generic success response without sending another welcome email, including concurrent insert conflicts. SMTP connection, greeting, and socket timeouts were added, and delivery/configuration failures continue to emit structured masked logs. HTML and plain-text exports contain the complete revised copy, all four benefit sections, website/unsubscribe links, and descriptive logo alt text, so the message remains understandable when images are blocked. The database migration and subscribe → duplicate → invalid-token rejection → unsubscribe → resubscribe lifecycle passed against a clean production build, and the test subscriber was removed. Final inbox rendering/delivery checks in Gmail, Outlook, and Apple Mail remain a pre-production manual step: the connected Gmail app requires reauthentication, the alternate mailbox connector was unavailable, and no Outlook or Apple Mail test inbox is connected.

### 8. Prepare the Events Tab Quote — Proposal Prepared August 17, 2026; Approval Pending

- [x] Define a small Events MVP before pricing it.
- [x] Include an Events navigation tab, listing page, event-detail page, Contentful editing, images or videos, dates, and a registration call to action.
- [x] State whether the first version uses an external registration service or on-site registration.
- [x] Separate optional features such as payments, capacity, waitlists, reminders, cancellations, and attendee administration.
- [x] Present the Events work as a separate approved project or as part of a defined retainer roadmap.
- [x] Do not implement the Events tab until Amber and John approve the scope and price.

Completion note: a client-facing proposal now defines a small Events MVP using Contentful-managed event pages and an external Eventbrite registration call to action. After reviewing the original $700 website proposal—which already mentioned a basic Events and Classes calendar—the Events add-on was reduced to a relationship-based USD $400 fixed price and a one-to-two-week delivery estimate. Custom website registration, payments, capacity, waitlists, reminders, cancellations, and attendee administration are explicitly deferred. The proposal also offers a USD $400 basic WaistLess-managed newsletter workflow, a USD $700 combined option, and a smaller USD $300-per-month six-month retainer with approximately five to six reserved hours per month. A separate internal context memo and copy-ready email to Amber and John have been updated. No Events code or Contentful Events model was created; implementation remains blocked until Amber and John approve the scope, price, registration approach, and schedule in writing.

### 9. Final Production Verification

- Review all agreed fixes on the production website.
- Check desktop, tablet, and mobile layouts.
- Verify Contentful edits are published and rendered correctly.
- Check image independence across homepage categories and service pages.
- Test the subscription and welcome-email flow.
- Test review submission and moderation after implementation.
- Check important navigation, recipe slugs, authentication, and service-detail pages.
- Record the final handoff state and formally close the original website punch list.

## Content and Access Needed from Amber or John

### Service Reviews

Amber needs to supply separate approved reviews for:

- Private Chef
- Catering
- Cooking Classes

Development can prepare the display and moderation workflow, but the final service-specific review content cannot be populated until it is supplied.

### Cooking-Class Videos

Amber needs to:

- Create the WaistLess Foods YouTube channel using `chefamber@waistlessfoods.com` if the account supports YouTube.
- Upload the public cooking-class promotional videos.
- Use **unlisted** visibility unless a video should be publicly discoverable for marketing.
- Supply each YouTube link.
- Confirm the website page or section where each video should appear.

These videos are intended to promote public cooking classes, not in-home cooking classes.

### Email-Marketing Decision

Amber and John need to decide whether the initial newsletter approach prioritizes:

- a faster third-party launch using Mailchimp, Constant Contact, or a similar service; or
- a more controlled custom/provider-backed system with subscriber ownership, segmentation, automation, and delivery monitoring.

The choice affects the final implementation scope, operating cost, and administration workflow.

### Email and Calendar Access

Amber or John needs to provide the appropriate authorized access for:

- `info@waistlessfoods.com`;
- the related Google Workspace or sending account; and
- Google Calendar configuration.

Credentials should be provided through an appropriate secure access method rather than copied into project documentation.

### Google Calendar Use Case

Amber needs to confirm whether Google Calendar should support:

- complimentary consultation scheduling;
- service-date availability;
- both use cases through separate booking pages; or
- another specifically defined workflow.

### Events Approval

Amber and John need to review and approve:

- the Events MVP scope;
- the registration approach;
- whether payments are included;
- the quoted price or retainer arrangement; and
- the delivery priority.

### Recipes and Final Images

Amber needs to:

- continue adding recipes as new Contentful entries;
- verify each recipe slug is URL-safe;
- publish completed entries;
- supply or select any remaining final replacement images; and
- complete the final visual review across the site.

## Open Decisions

- Where should review submissions be moderated?
- Which subject line should be used for the welcome email?
- Which email-marketing or delivery provider should be used?
- Should all cooking-class videos remain unlisted, or should selected videos be public?
- Which page or section should receive each cooking-class video?
- Should Google Calendar handle consultations, service availability, or both?
- What is the precise Events MVP and client-approved price?
- Will Events registration begin with Google Calendar, Eventbrite, another external provider, or an on-site flow?

## Readiness Summary

### Ready to Start

- Responsive “A Message from the Chef” redesign. Completed August 17, 2026.
- Contentful-managed authentication-page image work. Completed August 17, 2026.
- Breakfast/Dessert asset verification and separation. Completed August 17, 2026.
- Service secondary-image separation. Completed August 17, 2026.
- Homepage editable-message fields. Completed locally August 17, 2026; pending deployment.
- Review form and moderation workflow. Completed locally August 17, 2026; pending deployment.
- Welcome-email integration work.
- Events MVP scoping and quotation. Proposal prepared August 17, 2026; awaiting client approval.
- Production verification planning.

### Blocked or Partially Blocked

- Final service reviews: awaiting content from Amber.
- Cooking-class video embedding: awaiting the channel, uploads, links, and placement decisions.
- Final newsletter architecture: awaiting the provider/platform decision.
- Email and scheduling integration: awaiting authorized account access and Calendar decisions.
- Events implementation: awaiting scope and commercial approval.
- Final recipe and image population: awaiting remaining content from Amber.

## Access Note

The live Gmail connector currently requires reauthentication. The saved correspondence history and Amber's written follow-up recap are sufficient for this punch list, but Gmail should be reconnected before relying on the mailbox for newer instructions or messages.

## Source Documents

- `docs/meeting-notes-website-planning-2026-08-15.md`
- `docs/amber-email-correspondence-context-2025-09-to-2026-08.md`
- `docs/amber-welcome-email-copy-2026-08-14.md`
- `docs/figma-comments-export-2026-08-14.md`
- `docs/waistless-foods-retainer-proposal-draft-2026-08-16.md`
- `lib/email/templates/waistless-table-welcome-email.tsx`
- `app/api/newsletter/route.ts`
- `app/homepage-client.tsx`
- `app/signin/page.tsx`
- `app/signup/page.tsx`
- `app/services/[slug]/service-detail-client.tsx`
