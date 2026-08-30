# Proposal for the WaistLess Foods Events MVP

## Events, Newsletter, and Ongoing Support Options

**Prepared for:** WaistLess Foods — Amber Fitzgerald and John  
**Prepared by:** Muhammad Zulzidan M, Web Developer  
**Proposal date:** August 17, 2026  
**Proposal validity:** 30 days  
**Status:** Submitted for review and written approval

---

## Executive Summary

WaistLess Foods has developed from an Instagram-led presence into a broader digital platform where visitors can discover Chef Amber's services, recipes, products, and culinary philosophy. The next proposed phase is to give events and cooking experiences a permanent, professionally managed place within that platform.

The original website proposal anticipated a basic Events and Classes calendar as part of the site's long-term foundation. This proposal defines the focused work required to turn that concept into a reusable public Events section that Chef Amber can manage through Contentful without requiring a code deployment for routine event updates.

The recommended starting point is a **Small Events MVP at a fixed investment of USD $400**. This version includes an Events navigation item, an event listing page, a reusable event-detail page, Contentful management, and a clear registration call to action. Registration will be completed through an established external service such as Eventbrite, allowing the first release to remain practical and affordable while avoiding the cost and operational complexity of building a custom ticketing platform.

Optional newsletter and ongoing-support packages are also included for consideration. These are independent options and are not required in order to approve the Events MVP.

## Proposal Summary

| Recommended package | Investment | Estimated delivery | Payment schedule |
| --- | ---: | --- | --- |
| Small Events MVP | **USD $400 fixed** | 1–2 weeks | 50% to schedule; 50% before launch |

The recommended package includes one consolidated revision round and 14 calendar days of post-launch correction support for defects within the approved scope.

## Current Digital Context

The original WaistLess Foods website package was priced at USD $700 and was intentionally structured as an accessible foundation for future growth. Since that initial proposal, the website has developed into a substantially broader custom platform, including Contentful-managed content, service and recipe pages, authentication, payment foundations, bookings, reviews, email functionality, and administrative tools.

This proposal does not reprice or recreate that existing platform. It defines a contained extension that reuses the current website architecture and advances a feature already identified in the original digital strategy. The investment has therefore been positioned as a relationship-based add-on price, provided that the scope remains limited to the deliverables stated in this document.

## Client Clarification Received After This Proposal Was Prepared

Amber subsequently clarified that the desired membership and email experience is broader than newsletter campaign preparation alone. The expected workflow is that all eligible current members receive the same newly issued newsletter, regardless of when they joined, and signed-in members can visit a protected members page to download prior newsletters.

That clarification introduces work not expressly included in Option B below: a protected newsletter archive, archive publishing and file management, membership-based access rules, and a reliable relationship between authenticated member accounts and the email recipient list. It also requires confirmation of who qualifies as a member, whether existing newsletter subscribers automatically become members, how unsubscribe and marketing-consent choices affect delivery, and whether archived issues are downloadable files, web pages, or both.

Amber also asked whether the Events experience can synchronize with Google Calendar and requested a screen-share walkthrough. Calendar synchronization is excluded from the current Small Events MVP. Before it can be estimated, the intended behavior must be selected—for example, an **Add to Google Calendar** action for visitors, a public calendar display, Chef Amber's availability, automatic creation of internal calendar entries, or two-way booking synchronization. These options solve different problems and have different access, privacy, and implementation requirements.

The statements above record the latest client expectation for discussion. They do not add those capabilities to the fixed-price scope unless the proposal is revised and approved in writing.

## Project Objectives

The Events MVP is intended to:

- create one clear destination for upcoming WaistLess Foods events;
- allow Chef Amber to publish and update event information through Contentful;
- provide visitors with a direct path from event discovery to registration;
- present events consistently across desktop, tablet, and mobile devices;
- support images and optional externally hosted video content; and
- establish a reusable foundation that can be expanded later if actual event activity justifies additional functionality.

## Proposed Solution and Scope of Work

### 1. Events Navigation and Discovery

- Add an **Events** item to the primary desktop navigation.
- Add the corresponding Events item to the mobile navigation.
- Build a dedicated Events listing page for published event entries.
- Present the essential event information needed for discovery, including the event title, date, summary, and featured image.
- Distinguish upcoming events from past events using the event date.

### 2. Reusable Event-Detail Experience

- Build one reusable event-detail page template.
- Display the event title, description, date, time, location, featured image, and approved supporting media.
- Support an optional externally hosted video link where appropriate.
- Include a prominent registration call to action.
- Apply the existing WaistLess Foods visual identity and responsive design system.

### 3. Contentful Content Management

- Create and configure a focused **Events** content type in Contentful.
- Provide editable fields for:
  - event title;
  - short summary;
  - full description;
  - date and time;
  - location;
  - featured image;
  - optional video link; and
  - external registration URL.
- Connect published Events entries to the public website.
- Configure one initial event using final approved content supplied by WaistLess Foods.

### 4. Registration Integration

The first release will use **external registration**. Eventbrite is the recommended provider, although another mutually approved registration service may be used.

The WaistLess Foods website will promote the event and direct visitors to the registration URL stored in Contentful. The selected provider will remain responsible for registration records, payments, ticket delivery, capacity controls, waitlists, reminders, cancellations, refunds, and attendee administration where those services are required.

This approach provides a professional customer journey without introducing the cost, risk, and maintenance requirements of a custom ticketing system during the MVP phase.

### 5. Responsive Quality Assurance and Launch

- Verify the Events listing and event-detail pages on representative desktop, tablet, and mobile sizes.
- Confirm navigation, imagery, text presentation, date states, and registration links.
- Correct defects identified during the agreed review cycle.
- Deploy the approved Events experience to production.
- Provide a concise Contentful handoff for routine event updates.

## Deliverables

| No. | Deliverable | Completion standard |
| ---: | --- | --- |
| 1 | Events navigation | Available in desktop and mobile navigation |
| 2 | Events listing page | Displays published events and appropriate date state |
| 3 | Event-detail template | Reusable across future Contentful event entries |
| 4 | Contentful Events model | Editable fields connected to the website |
| 5 | External registration action | Each event can link to its approved registration page |
| 6 | Initial event setup | One client-supplied event entered and verified |
| 7 | Responsive QA | Reviewed on desktop, tablet, and mobile |
| 8 | Handoff | Basic publishing and editing guidance provided |

## Execution Model and Workflow

### Phase 1 — Approval, Access, and Content Confirmation

- Confirm the approved package and authorized decision-maker.
- Confirm the external registration provider and account ownership.
- Receive required access and complete content for the first event.
- Confirm the target launch date.

### Phase 2 — Content Model and Frontend Development

- Configure the Contentful Events model.
- Build the Events listing and reusable detail experience.
- Connect Contentful content and external registration links.
- Complete internal functional and responsive checks.

### Phase 3 — Client Review and Consolidated Revision

- Present the first complete review build.
- Receive one consolidated set of feedback from the authorized approver.
- Complete one revision round within the approved scope.

### Phase 4 — Production Launch and Correction Support

- Receive final approval and the remaining project payment.
- Publish the approved work to production.
- Provide 14 calendar days of correction support for defects within the approved scope.

## Estimated Schedule

The estimated delivery period is **one to two weeks** after all of the following have been received:

- written approval;
- the initial payment;
- required Contentful, website, and registration access; and
- complete approved content for the first event.

The schedule may be adjusted if content, access, feedback, or approval is delayed. Requests that materially change the approved scope may also require a revised schedule.

## Expected Outcomes

Upon completion, WaistLess Foods will have:

- a professional Events destination within the existing website;
- a reusable event publishing process managed through Contentful;
- a clear registration journey for visitors;
- reduced dependence on code changes for ordinary event updates;
- a consistent experience across common screen sizes; and
- a measured foundation for future event-related investment.

## Investment and Commercial Terms

### Small Events MVP

**Fixed project investment: USD $400**

- **Initial payment:** 50% to approve and schedule the project.
- **Final payment:** 50% after final approval and before production launch.
- **Revision allowance:** One consolidated revision round following delivery of the first complete review build.
- **Correction period:** 14 calendar days after launch for defects within the approved scope.
- **Change control:** Client-requested additions, new functionality, or material scope changes require written approval and may require a separate estimate.
- **Third-party costs:** Contentful, Eventbrite, hosting, payment processing, video hosting, and other third-party charges are not included.

Work created specifically for the approved project will be integrated into the WaistLess Foods website following full payment. Third-party products, services, and licensed assets remain subject to their respective providers' terms.

## Client Responsibilities

WaistLess Foods will:

- identify one authorized approver for scope, review, and launch decisions;
- provide timely access to the required website, Contentful, and registration accounts;
- provide or approve final event copy, dates, locations, imagery, media links, and registration URLs;
- confirm whether each event is free or paid;
- maintain accurate registration, cancellation, refund, privacy, and marketing-consent information;
- provide consolidated feedback within the agreed review period; and
- pay third-party service charges directly where applicable.

## Scope Exclusions

The Events MVP does not include:

- registration forms or attendee records stored directly on the WaistLess Foods website;
- custom event checkout or Stripe ticket payments;
- website-managed capacity, waitlists, reminders, cancellations, or refunds;
- ticket tiers, promotional codes, assigned seating, check-in tools, or calendar synchronization;
- a custom event administration dashboard;
- multiple custom event-detail layouts;
- custom video hosting, photography, videography, or event copywriting; or
- functionality not expressly listed under the approved scope of work.

Excluded capabilities may be evaluated as a later phase after the Events MVP has been used and the operational need is clear.

## Optional Services

### Option B — WaistLess-Managed Newsletter Workflow

**Fixed project investment: USD $400**

The current website already includes newsletter signup, a branded welcome email, unsubscribe handling, and duplicate-subscription protection. This optional project would add a focused internal workflow for preparing and sending a standard WaistLess Foods newsletter through an approved professional email-delivery provider.

The scope includes:

- one reusable branded newsletter template based on the approved email design;
- editable subject line, preview text, headline, body content, image, and call-to-action link;
- a protected newsletter preparation workflow;
- a test-send step before distribution;
- sending to active WaistLess Foods subscribers through the selected provider;
- existing unsubscribe and duplicate protections;
- basic delivery success and failure logging; and
- one initial newsletter setup and one consolidated revision round.

This option excludes advanced segmentation, multi-step automation, drag-and-drop campaign building, detailed campaign analytics, unlimited design or copywriting, unspecified subscriber migration, guaranteed inbox placement, and third-party sending charges.

**Scope alignment note:** This option covers campaign preparation and sending only. It does not include the subsequently requested members-only page, downloadable archive of prior newsletters, account-to-membership entitlement logic, or migration of existing newsletters into an archive. Those items require a revised scope and estimate after the member and archive workflow is confirmed.

### Option C — Combined Events and Newsletter Project

**Combined fixed investment: USD $700**

This option includes the complete Events MVP and newsletter workflow scopes described above when approved together.

- **Payment schedule:** 30% to schedule the project, 30% after the Events review build, and 40% before production launch.
- **Estimated delivery:** Three to five weeks after required access and content are received.
- **Revision allowance:** One consolidated revision round for each defined workstream.
- **Scope condition:** The combined price applies only to the deliverables expressly stated in this proposal.

### Option D — Ongoing Website Support Retainer

**Monthly investment: USD $300 per month for an initial six-month term**

This option is intended for ongoing Contentful assistance, website maintenance, small enhancements, and gradual Events or email improvements after current launch priorities are agreed.

The retainer includes:

- approximately five to six reserved service hours per month;
- one monthly planning and progress meeting of up to 30 minutes;
- a concise written update covering completed work and the next agreed priority;
- Contentful assistance, defect correction, maintenance, and small website changes within the available monthly capacity; and
- gradual delivery of agreed Events and newsletter improvements where those items fit within the reserved capacity.

Reserved capacity is not unlimited development. The monthly meeting counts toward the available hours, unused time expires at the end of each month unless otherwise agreed in writing, and work beyond the available capacity requires approval. Third-party subscriptions, transaction fees, advertising, content production, and emergency support are excluded.

## Commercial Options at a Glance

| Option | Scope | Investment |
| --- | --- | ---: |
| A — Recommended | Small Events MVP | **USD $400 fixed** |
| B | WaistLess-managed newsletter workflow | **USD $400 fixed** |
| C | Events and newsletter projects combined | **USD $700 fixed** |
| D | Ongoing website support retainer | **USD $300/month for 6 months** |

## Approval Requirements

Before work begins, WaistLess Foods will confirm in writing:

1. The selected option: A, B, C, or D.
2. Whether Eventbrite or another external registration service will be used.
3. Whether the first event is free or paid.
4. The complete content and desired launch date for the first event.
5. The person authorized to provide consolidated feedback and final launch approval.
6. Whether Google Calendar is required and, if so, the exact visitor and administrator workflow it must support.
7. Whether the requested member newsletter archive should be scoped now, including the member definition, access rules, archive format, and treatment of existing subscribers and past issues.

No Events implementation or Contentful Events model will be created until the scope and investment are approved in writing.

## Proposal Validity

This proposal is valid for 30 days from August 17, 2026. After that date, scope, schedule, availability, and pricing may be reconfirmed before work is scheduled.

## Closing Statement

The Small Events MVP is designed to provide WaistLess Foods with a polished, maintainable Events presence while protecting the business from unnecessary custom-platform costs during the first phase. It builds on the existing website investment, keeps routine event management in Chef Amber's hands, and leaves a clear path for expansion when audience demand and operational needs support it.

Thank you for the opportunity to continue supporting the WaistLess Foods platform. Work can be scheduled once the selected option, required access, initial content, and payment terms have been confirmed.

## Acceptance

**Selected option:** ______________________________________________  

**Authorized name:** _____________________________________________  

**Signature:** ___________________________________________________  

**Date:** ________________________________________________________

## Current Third-Party References

- [Eventbrite pricing and plans](https://www.eventbrite.com/help/en-us/articles/193833/)
- [Eventbrite ticketing fees](https://www.eventbrite.com/help/en-us/articles/755615/how-much-does-it-cost-for-organizers-to-use-eventbrite/)
- [Resend pricing](https://resend.com/pricing)
