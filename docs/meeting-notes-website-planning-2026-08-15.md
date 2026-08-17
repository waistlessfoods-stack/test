# Website Planning Meeting Notes

Compiled: 2026-08-15  
Updated with Amber's follow-up email: 2026-08-15  
Meeting date: Not stated in the source transcript  
Project: WaistLess Foods

## Summary

The meeting focused on adding video to the website, choosing an email/newsletter approach, editing recipes in Contentful, refining homepage visuals and copy, collecting and moderating reviews, and deciding how cooking-class bookings should work.

The immediate direction is to keep the first version practical: host videos as unlisted YouTube uploads, make targeted website and Contentful improvements, and postpone a large custom cooking-class system until the business needs are clearer.

## Amber's Follow-Up Email Recap

Amber sent a written recap after the meeting. This is the clearest record of the agreed owners and immediate deliverables.

### Zul's Tasks

- Update **A Message from the Chef**:
  - desktop: photo on the left and copy on the right;
  - mobile: photo first and copy second.
- Update the Private Chef, Catering, and Cooking Class reviews after Amber supplies them.
- Add cooking-class videos after Amber supplies the links.
- Provide a quote for creating an **Events** tab. Amber will discuss this with John.
- Give Amber access in Contentful to update the image on the sign-up/sign-in page.
- Separate the Dessert and Breakfast images, which currently display the same image.
- Separate the secondary images used by Private Chef, Catering, and Cooking Classes. This request concerns the sub-images, not the thumbnail images.

### Amber's Tasks

- Supply reviews for Private Chef, Catering, and Cooking Classes.
- Create a WaistLess Foods YouTube channel using `chefamber@waistlessfoods.com`.
- Upload cooking-class videos when ready. These videos promote **public cooking classes**, not in-home cooking classes.
- Discuss third-party email-marketing options such as Mailchimp or Constant Contact with John.
- Provide the password for `info@waistlessfoods.com` and its Google Calendar access.
- Consider using Google Calendar availability for complimentary consultations and to show available dates when clients book a service.

### Follow-Up Status

- The Events tab is a quote/request for discussion, not yet an approved implementation.
- Reviews and cooking-class videos are blocked until Amber supplies the content and links.
- The email-marketing platform remains undecided pending Amber's discussion with John.
- The supplied email describes the Google Calendar use case more precisely than the transcript: consultation scheduling and service-date availability.

## Decisions and Agreed Direction

### Website Videos

- Use YouTube as the initial video host because it is accessible, familiar, and has a free option.
- Upload videos as **unlisted**, not private. Anyone with the link can watch an unlisted video, while a private video requires individually approved accounts.
- Use the existing branded Google Workspace account for the YouTube channel if it supports YouTube. A regular Gmail account is the fallback.
- Embed each supplied YouTube link on the appropriate website page.
- Videos may appear alongside images in the main media/highlight area. The interface should distinguish videos with a play control and let visitors choose which media to view.
- Public videos could also support marketing, but visibility can be decided per video.

### Email and Newsletter System

- A third-party service such as Mailchimp could be used to launch faster, but it still requires setup and learning.
- A custom website-based email system offers more control over subscriber data, branding, segmentation, and delivery monitoring, but takes longer to build and maintain.
- The preferred custom approach should let the site owner edit at least the body and subject of an email while keeping the header, footer, and technical template controlled.
- The system should eventually support:
  - welcome and automated email sequences;
  - subscriber interests or audience segments;
  - subscribe and unsubscribe handling;
  - test sends and previews;
  - delivery, bounce, and failure monitoring;
  - suppression of invalid or abusive addresses;
  - targeted campaigns so subscribers receive relevant content rather than every message.
- Email design must account for old and inconsistent email-client rendering. A single large image is not preferred because it can load slowly, be blocked, increase message size, or contribute to spam filtering.

### Contentful Recipe Editing

- Edit recipes from **Content**, filtering by the **Recipes** content type. Do not edit them from **Content Model**.
- Create a new recipe with **Add entry** instead of duplicating an existing recipe.
- Duplicating can preserve an old slug and cause incorrect URLs.
- Confirm that the slug is URL-safe and matches the new title. Spaces should become hyphens rather than encoded characters such as `%20`.
- Changes do not appear on the live website until the entry is published. A status of **Changed** means the update is still unpublished.
- The slug field was moved nearer the top of the recipe form to make this easier to check.

### Homepage and Visual Updates

- Adjust the chef portrait/hero composition so more of the subject is visible and the text box sits lower, closer to the bottom of the image.
- Desktop can retain a side-by-side composition. Mobile should stack the image and message because a side-by-side layout is too narrow.
- The developer will prepare or compare layout options, including left/right positioning, without forcing the same order on desktop and mobile.
- The portrait may need to be separated from its background to crop and position it cleanly.
- Make the homepage message editable in Contentful, including copy such as:
  - `Waste Less, Taste More`
  - `Join our community for exclusive recipes...`

### Reviews and Testimonials

- Add a review form/modal that collects the reviewer's name, email address, and review.
- Do not publish submitted reviews immediately. Send or store them for admin moderation and approval first.
- Show a limited initial set of reviews, with a **Load more** interaction for additional reviews.
- Add a convenient way to return to the top if expanding reviews makes the page long.
- Existing testimonials and new user-submitted reviews are different content types and may need separate handling.

### Cooking Classes and Events

- The original calendar-style concept did not fully match the actual cooking-class flow.
- A class needs an event-style detail experience that can explain the class, date, audience, value, imagery, and registration path.
- Google Calendar booking pages may work for simple availability, but they are not a complete event presentation or discovery experience.
- Eventbrite is a possible short-term option because it handles event registration, but it introduces tradeoffs:
  - customers may register outside the WaistLess Foods site;
  - subscriber and attendee data may need to be exported or synchronized;
  - attendees may receive promotions for unrelated events;
  - the business has less control over the customer experience and data.
- A custom system could eventually support on-site registration, confirmation emails, attendee accounts, and registration history, but this is more scope than originally agreed.
- Current decision: do not build a large cooking-class platform yet. Start small and revisit the full system when classes become an active priority.
- Longer term, consider turning cooking classes into reusable digital content or a repeatable program rather than treating each class as a one-time event.

## Action Items

### Site Owner / Client

- Create a WaistLess Foods YouTube channel using `chefamber@waistlessfoods.com`.
- Upload the public cooking-class promotional videos and send their links when ready. Use **unlisted** visibility unless Amber decides a video should be publicly discoverable for marketing.
- Supply separate reviews for Private Chef, Catering, and Cooking Classes.
- Discuss Mailchimp, Constant Contact, or another email-marketing option with John.
- Provide the credentials/access needed for `info@waistlessfoods.com` and Google Calendar.
- Confirm whether Google Calendar will support complimentary consultations, service-date availability, or both.
- Continue adding recipes as new Contentful entries, verify the slug, and publish each entry.

### Developer

- Update **A Message from the Chef** with the photo on the left and copy on the right for desktop, then photo first and copy second for mobile.
- Add the supplied public cooking-class videos and visually distinguish videos from images.
- Update the Private Chef, Catering, and Cooking Class reviews after Amber supplies them.
- Provide a quote for an Events tab; do not implement it until scope and approval are confirmed.
- Enable Amber to update the sign-up/sign-in page image through Contentful.
- Separate the shared Dessert and Breakfast images.
- Separate the shared Private Chef, Catering, and Cooking Class sub-images without changing their thumbnails.
- Add the homepage headline/subheadline fields to Contentful if they are not already editable.
- Implement the review submission and moderation flow, including progressive loading for approved reviews.
- Continue planning the newsletter system, documenting the choice between a faster third-party launch and a more controlled custom implementation.
- Defer the expanded cooking-class/event architecture until the client confirms it is needed.

## Open Questions

- Which exact website page or section should receive each video?
- Should any videos be public for marketing, or should all remain unlisted?
- Is the newsletter launch priority speed (third-party service) or ownership/control (custom system)?
- What scope and price should be proposed for the Events tab?
- Should Google Calendar show consultation availability, service-booking availability, or separate booking pages for each?
- Where should review submissions be managed: Contentful, a custom admin area, or email-assisted moderation?
- When cooking classes resume, should registration begin with Eventbrite, Google booking pages, or a custom on-site flow?

## Terminology Clarifications

- **Unlisted YouTube video:** viewable by anyone with its link but not normally discoverable through the channel or search.
- **Slug:** the URL-friendly identifier for an entry, for example `mango-mint-chia`.
- **Changed in Contentful:** saved as a draft change but not yet published to the live website.
- **VPS:** a server environment that can support custom backend features beyond what a content-only platform provides.

## Source Note

These notes were condensed from an informal, automatically transcribed conversation and Amber's follow-up recap email. Repetition and conversational filler were removed, and unclear product names were normalized where the context was strong (for example, Contentful, Mailchimp, Eventbrite, and VPS). Amber's written assignment of tasks is treated as the authoritative source for immediate ownership. Items that were not definitively settled remain under **Open Questions**.
