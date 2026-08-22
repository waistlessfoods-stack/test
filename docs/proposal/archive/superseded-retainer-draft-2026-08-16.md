# WaistLess Foods Retainer Proposal — Working Draft

Created: 2026-08-16  
Status: Superseded pricing draft; retained for historical context and not for sending  
Prepared for: Muhammad Zulzidan (Zul)

> **Superseded August 17, 2026:** This working draft predates review of the original $700 website proposal. Its $750-per-month recommendation and broader Events/email assumptions have been replaced by the smaller options in [the current client proposal](../client-proposal.md). Do not send pricing from this file to Amber or John.

## Purpose

This document preserves the current thinking about formally completing the original WaistLess Foods website project and proposing a paid ongoing development partnership. It is intended to be revisited and refined before anything is sent to the client.

The recommended commercial structure is:

1. Agree on and complete a final punch list for the original website.
2. Formally close the original website scope.
3. Offer a separately scoped Events project or include its phased development in a fixed-term retainer.
4. Offer a monthly retainer covering the Events roadmap, email system, maintenance, Contentful support, smaller improvements, and one scheduled meeting each month.

## Documented Project Start

The strongest available evidence supports the following timeline:

- **September 8, 2025:** earliest documented project email, titled `Happy Birthday & Welcome to WaistLess Foods' Next Chapter!`.
- **October 25, 2025:** earliest verified Figma activity in the supplied Figma export.
- **November 4, 2025:** initial commit in the website repository.

September 8, 2025 is therefore the best documented project starting date unless an earlier agreement, invoice, deposit, or kickoff message is found.

As of August 16, 2026, the engagement has lasted approximately 11 months. Its first documented anniversary will be September 8, 2026.

## Interpretation of the Last Meeting

Amber did not clearly reject a retainer. However, the retainer was described indirectly through an example of another client relationship rather than presented as a formal offer requiring a decision.

In the transcript, Zul explained that another engagement:

> started as a website

and later became:

> basically a retainer

That example included ongoing website features, email management, content, and social media. Because there was no direct question, price, term, list of included services, or requested decision, Amber may not have understood it as a proposal for WaistLess Foods.

The transcript also records Zul explaining that a complete Events flow would involve:

> more pages than we agreed on

Amber's short acknowledgments in the automatic transcript are not sufficient evidence that she approved an additional fee. They only indicate that the scope concern was discussed.

Amber's written follow-up is clearer:

> Provide a quote for creating an Events Tab (will talk to John about this)

This indicates interest and permission to prepare a quote. It is not approval to implement the feature, but it also is not a rejection.

### Working Interpretation

- Amber appears interested in continuing development.
- She is cautious about cost and large upfront commitments.
- She prefers to start small rather than build features the business does not yet need.
- She expects to discuss material financial decisions with John.
- She requested an Events quote, which confirms that the Events work should not be assumed to be free or part of the original scope.
- The retainer needs to be presented directly and clearly before her reaction can be evaluated.

## Recommended Positioning

Use **affordable**, **cost-conscious**, or **long-term development partner** instead of **cheap**.

The value proposition should be:

- predictable monthly costs;
- one developer who already understands the business, codebase, CMS, and history;
- ongoing development rather than maintenance alone;
- an Events platform and email system delivered progressively;
- regular planning and accountability;
- a substantially lower commitment than hiring separate developers, agencies, or an internal employee;
- direct access and continuity without repeatedly onboarding new vendors.

The proposal should not promise unlimited work. Use the phrase:

> Included within the agreed roadmap and monthly capacity.

## Recommended Retainer Structure

Initial commercial recommendation:

- **Monthly fee:** USD $750
- **Initial term:** 12 months
- **Reserved capacity:** approximately 12–15 hours per month
- **Meeting:** one scheduled strategy and progress meeting per month
- **Billing:** monthly in advance
- **Additional work:** requires written approval before work begins
- **Third-party costs:** paid separately by the client
- **Renewal:** renew, move to a smaller maintenance plan, or conclude with handover after the initial term

Do not price this scope much below USD $600 per month without materially reducing deliverables or monthly capacity. The final price should be adjusted after reviewing the original contract, current compensation, realistic delivery hours, and the amount required to make the arrangement sustainable.

### Possible Alternative Structure

If Amber and John do not want a 12-month commitment:

- quote the Events platform as a separate fixed-price project;
- quote the initial email-system setup separately;
- offer a smaller maintenance/support retainer after those projects launch;
- charge future requests individually through written change orders.

## Included Work

### 1. Completion of the Current Website

- Agree on a final punch list.
- Complete the remaining mutually agreed website items.
- Resolve remaining shared-image and Contentful issues.
- Finalize responsive layouts.
- Verify the production website.
- Document the final handover state.
- Formally close the original project scope.

### 2. Events Platform

The Events system can be built without a VPS. The existing project already uses Next.js/Vercel, Contentful, serverless API routes, Neon Postgres, authentication, email functionality, booking records, and administration.

Potential Events deliverables:

- Events navigation tab.
- Events listing page.
- Individual event-detail pages.
- Contentful event management.
- Event titles, descriptions, dates, times, locations, images, videos, pricing, and status.
- YouTube video embedding.
- External registration links or on-site registration.
- Attendee confirmation emails.
- Basic event and attendee administration.
- Capacity, waitlist, payment, cancellation, and reminder functionality when prioritized.

The first version should remain focused. A suitable MVP may use Contentful for event content and link registration to Google Calendar, Eventbrite, Stripe Checkout, or another selected service. On-site registration can be introduced later using the existing serverless database and booking infrastructure.

### 3. Email and Audience System

Potential email-system deliverables:

- Subscriber management.
- Branded, editable email templates.
- Editable email subject and body content.
- Welcome-email sequence.
- Audience interests and segmentation.
- Subscribe and unsubscribe handling.
- Test messages and previews.
- Delivery, failure, and bounce monitoring.
- Suppression of invalid or abusive addresses.
- Targeted campaign support.
- Basic campaign reporting.

WaistLess Foods can retain control of its subscriber data and administration while a professional provider handles message delivery. Possible providers include Resend, Mailchimp, or Constant Contact. The provider choice and associated subscription/sending fees are not yet decided.

The retainer must distinguish between:

- building and maintaining the email system;
- preparing a reasonable number of templates or campaigns;
- unlimited copywriting, content production, or daily campaign management, which is not automatically included.

### 4. Ongoing Website Support

- Contentful assistance.
- Minor content and design updates.
- Bug fixes.
- Dependency and security maintenance.
- Performance and availability checks.
- Technical recommendations.
- Small feature improvements within monthly capacity.
- One monthly strategy and progress meeting.
- A short monthly summary of completed work, blockers, and next priorities.

## Suggested Twelve-Month Roadmap

This roadmap is provisional and depends on client content, access, feedback, and selected priorities.

### Months 1–2: Current Website Completion

- Confirm the final punch list.
- Complete remaining website items.
- Resolve Contentful access and shared-image issues.
- Verify desktop and mobile behavior.
- Formally close the original website scope.

### Months 2–4: Events MVP

- Define the event content model and customer flow.
- Build the Events listing and detail pages.
- Add Contentful editing.
- Add event images, public cooking-class videos, dates, and registration calls to action.

### Months 4–6: Registration and Administration

- Connect the chosen registration method.
- Add confirmations and notifications.
- Add attendee administration where required.
- Evaluate payments, capacity, cancellation, and waitlist needs.

### Months 6–9: Email and Subscriber System

- Confirm the delivery provider.
- Build the subscriber-management foundation.
- Implement branded templates and welcome automation.
- Add unsubscribe and delivery-management controls.

### Months 9–12: Segmentation and Refinement

- Add audience interests and targeted communications.
- Improve campaign workflows and previews.
- Refine Events and email behavior based on real usage.
- Continue maintenance, small improvements, and monthly planning.

Priorities may be reordered by mutual agreement during the monthly meeting, provided the work remains within the roadmap and reserved capacity.

## Important Boundaries

The proposal should state that the following are not automatically included:

- unlimited development or revisions;
- unlimited email copywriting or campaign production;
- daily social-media management;
- third-party subscriptions, usage charges, domains, hosting, transaction fees, or advertising;
- major new systems outside the approved roadmap;
- emergency or after-hours support unless separately agreed;
- work exceeding the monthly capacity;
- client delays, missing content, or missing access being treated as developer delivery time.

Other terms to decide before sending:

- whether unused hours expire or may roll over for one month;
- the preapproved overage rate;
- the response-time commitment;
- the payment due date;
- the notice required for cancellation after the initial term;
- ownership and handover of code, accounts, and data;
- whether the monthly meeting counts toward reserved hours;
- exact delivery milestones for Events and email.

## Personal Positioning

The personal story should appear after the professional value has been established. It should be sincere and concise rather than used as the primary reason for payment.

Recommended wording:

> We have been working together since September 2025, and I genuinely value the trust you have placed in me throughout this process. I have worked hard to remain an affordable development partner while continuing to provide custom solutions that would normally require several separate services. I also want to share candidly that, as the only son in my family, this work plays an important role in helping me support them. A monthly partnership would allow me to reserve consistent time for WaistLess Foods while keeping the cost more accessible than engaging separate developers or agencies for each new requirement.

A shorter and more business-focused alternative:

> I have worked hard to keep my services affordable throughout the project. Because this work is also how I support myself and my family, I now need to make sure ongoing requests are covered by a clear and sustainable paid arrangement.

Avoid making family circumstances the basis for the fee. The commercial justification should remain the ongoing time, responsibility, specialist work, continuity, and business value provided.

## Draft Client Proposal

### WaistLess Foods Digital Growth Partnership

The original WaistLess Foods website has developed into more than a standard website project. It now includes Contentful content management, customer bookings, authentication, payments, recipes, email communication, and administrative functionality.

As the business continues to grow, I propose transitioning from an open-ended website project into a structured monthly development partnership.

Under this arrangement, I will complete the current website, build the Events and email systems progressively, provide ongoing technical support, and meet with Amber once each month to review priorities and progress.

#### Monthly Investment

**USD $750 per month for 12 months**

This includes:

- approximately 12–15 hours of reserved development and support each month;
- one scheduled monthly strategy and progress meeting;
- the phased Events platform;
- the phased email and subscriber system;
- website maintenance and bug fixes;
- Contentful support;
- minor design and content updates;
- monthly progress reporting.

Development will follow a jointly approved roadmap. Work exceeding the monthly capacity, major new systems outside the roadmap, and third-party service fees will be quoted separately and will not begin without approval.

After the initial 12-month period, the parties may renew the development partnership, move to a smaller maintenance plan, or conclude the engagement with a complete handover.

#### Partnership Context

We have been working together since September 2025, and I genuinely value the trust placed in me throughout this process. I have worked hard to remain an affordable development partner while providing custom solutions that would otherwise require several separate services.

As the only son in my family, this work also plays an important role in helping me support them. A monthly partnership would allow me to reserve consistent time for WaistLess Foods while giving the business predictable access to ongoing development and support at an accessible cost.

## Draft Follow-Up Email

**Subject: WaistLess Foods Website — Finalization and Ongoing Partnership**

Hi Amber and John,

Thank you again for trusting me with the WaistLess Foods website. Based on our earliest correspondence, we began this project around September 8, 2025, so we are approaching one full year of working together.

During that time, the project has grown beyond the initial website into ongoing design revisions, Contentful management, booking functionality, email preparation, recipes, service pages, administrative tools, and continued technical support. I am grateful for the opportunity to help build and develop the platform.

One business item I may not have explained clearly during our latest meeting is how we should handle continued work after the current website is completed. I would like us to define a clear next phase so expectations remain comfortable and sustainable for everyone.

I suggest that we first agree on a final punch list and formally complete the original website project. After that, I can offer two paths:

1. Future features, including Events and the email system, can be handled as separately quoted projects.
2. We can continue through a monthly development partnership that includes the phased Events and email roadmaps, ongoing website support, and one scheduled planning meeting each month.

I have worked hard to keep my services affordable throughout the project. Because this work is also how I support myself and my family, I now need to ensure that ongoing requests are covered by a clear and sustainable arrangement.

Since Amber mentioned discussing the Events tab and email-marketing options with John, I can prepare a concise final proposal showing the scope, roadmap, monthly investment, and alternative project-based option for both of you to review. There is no obligation; I want to make the choices and costs clear before beginning additional work.

Thank you again for allowing me to be part of the WaistLess Foods journey.

Best,  
Zul

## Decisions Required Before Sending

- Confirm the final monthly price.
- Confirm the monthly reserved hours.
- Decide whether to require a 6- or 12-month initial term.
- Decide whether to show both project-based and retainer pricing.
- Define the Events MVP precisely.
- Confirm whether event registration will be external or on-site.
- Confirm whether payments are part of the initial Events scope.
- Choose the intended email-delivery provider.
- Define how much campaign creation or copywriting is included.
- Decide whether unused hours expire or roll over.
- Choose an overage rate.
- Review the original agreement and payments before describing any remaining item as included or out of scope.
- Decide whether the personal family paragraph should appear in the written proposal or be shared only during a conversation.

## Related Documents

- `docs/meeting-notes-website-planning-2026-08-15.md`
- `docs/amber-email-correspondence-context-2025-09-to-2026-08.md`
- `docs/app-sitemap.md`
- `docs/input-surface-audit.md`
