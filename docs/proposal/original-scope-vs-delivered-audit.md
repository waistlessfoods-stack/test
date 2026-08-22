# WaistLess Foods Original Proposal vs. Delivered Scope Audit

Prepared: August 17, 2026  
Audience: Internal  
Status: Evidence-based working assessment; not legal advice or an invoice

## Executive Conclusion

The original WaistLess Foods proposal was priced at **$700 one time**, with payment milestones of 30% / 30% / 40% and an estimated delivery period of **four to six weeks**. The current overall website investment is understood to be approximately **$1,000**, subject to confirmation against invoices and payment records.

The documented relationship has instead continued from September 8, 2025 through August 17, 2026: **343 days, approximately 49 weeks or 11.3 months**. The repository contains 99 commits through August 5, 2026, followed by substantial current completion work that has not yet been committed. The Figma export records 257 comments across 123 root threads and 134 replies between October 2025 and July 2026.

This does not mean every change can automatically be invoiced retroactively. The original proposal was unusually broad and contained several ambiguous or conflicting promises. It did, however, describe a short website build—not an eleven-month, open-ended design, development, CMS-management, content, troubleshooting, and support arrangement.

The conservative conclusion is:

- much of the original website foundation has been delivered;
- several expressly named original features remain incomplete or were replaced by a different implementation;
- several large systems and extensive ongoing revisions were delivered beyond what the proposal specifically described; and
- future work should now require either a written fixed-scope add-on or a clearly bounded retainer.

## Evidence Used

This assessment uses:

- the original proposal text supplied on August 17, 2026;
- the email correspondence summary covering September 2025 through August 13, 2026;
- the meeting notes and Amber's written follow-up;
- the Figma export dated August 14, 2026;
- the repository history and current working tree;
- the current route, API, database, CMS, and integration inventory; and
- the final website punch list.

The original proposal text does not show its own creation or acceptance date, and the repository cannot prove time worked. Payment records, signed acceptance, invoices, private conversations, and attachments not in the workspace may change the commercial interpretation.

## Original Commercial Baseline

### Price and delivery model

- One-time website fee: **$700**.
- No monthly retainer.
- Payment milestones: 30% before kickoff, 30% mid-project, and 40% before launch.
- Estimated timeline: four to six weeks, depending on content readiness.
- Additional requests outside the package were to be quoted separately.
- Weekly Tuesday meetings, optional Friday check-ins, email updates, and final CMS training were proposed during the project period.

### Important ambiguity in the original package

The package combined a “lean” launch description with a much broader feature list. It simultaneously mentioned:

- basic authentication with “no payments yet”; and
- Stripe integration for digital product sales and bookings;
- a basic recipe hub with no filters; and
- a full recipe hub with filters;
- a basic Events and Classes calendar; and
- booking forms and class-ticket payments;
- newsletter signup; and
- a broader strategic newsletter and engagement system.

There were no precise acceptance criteria, supported user roles, number of content entries, revision limit, post-launch support period, definition of “calendar,” definition of “booking,” or boundary between CMS setup and ongoing content management.

This ambiguity makes retroactive “in scope / out of scope” claims less certain. The audit therefore uses four classifications:

- **Delivered:** the original promise is substantially present.
- **Expanded:** the original idea was present, but the delivered implementation became materially deeper.
- **Partial or changed:** some of the promise exists, but important portions do not.
- **Missing or unverified:** no implementation evidence was found or required client input is still unavailable.

## Original Proposal Line-by-Line Assessment

| Original promise | Status | Current evidence and interpretation |
| --- | --- | --- |
| Central website for recipes, services, events, and lifestyle storytelling | Partial | Recipes, services, About, Blog, Shop, and homepage exist. A public Events section does not. |
| Home page | Delivered and expanded | Contentful-managed hero, carousel, features, categories, testimonials, editable message, multiple visual refinements, and responsive behavior exist. |
| About Chef Amber | Delivered and expanded | The About page is Contentful-backed and received multiple layout, copy, image, and sticky-position revisions. |
| Services page | Delivered and expanded | A service listing plus separate reusable detail pages, galleries, structured sections, reviews, booking links, and extensive Contentful fields exist. |
| Contact page | Partial / changed | No standalone `/contact` route exists. Contact details, enquiry dialogs, email links, and service booking flows provide contact behavior. |
| Basic recipe hub with Vegan / Pescatarian / Chicken categories | Delivered in a changed form | The recipe hub uses Contentful categories, multi-category recipes, search, and filters. Current categories extend beyond the original three. |
| Full recipe hub with filters | Delivered | Search and multi-category filtering exist on Recipes and Shop. |
| “Waste-Less Tip” block in recipe details | Missing | No recipe-specific Waste-Less Tip field or rendered block was found in the current recipe implementation. |
| Clerk authentication with basic login | Delivered and expanded | Sign-in, sign-up, SSO callback, account management, user synchronization, email verification, protected purchase flows, and admin account visibility exist. |
| Newsletter signup | Delivered and expanded | Subscription storage, duplicate protection, branded welcome email, plain-text fallback, signed unsubscribe flow, re-subscription behavior, rate limiting, and failure logging exist. A campaign-management system is not yet present. |
| Instagram and Facebook feed strips or embeds | Missing / changed | Managed social profile links and icons exist, but no live Instagram or Facebook feed embed was found. |
| YouTube playlist and single-video embeds | Missing / client-content blocked | No YouTube embed implementation was found. The meeting record says channel creation, uploads, links, and placement are still required from Amber. |
| Snapchat profile/share actions and Snap Pixel | Missing | No Snapchat integration or Snap Pixel was found. |
| Unified Facebook / Instagram / X share buttons | Missing | No public share-action implementation was found. |
| Clean Open Graph and Twitter previews | Delivered and expanded | Canonical metadata, Open Graph, Twitter images, robots rules, sitemap support, and structured data exist. |
| Mobile-first responsive design | Delivered with extensive iteration | Responsive layouts exist across the principal pages and have been repeatedly revised for desktop, tablet, and mobile behavior. |
| Contentful for recipes, services, and updates | Delivered and materially expanded | Contentful now manages numerous page types, settings, categories, assets, authentication-page content, header/footer content, blog editorial fields, service details, and homepage sections. The repo includes extensive migration, seed, revalidation, and asset-management tooling. |
| Events and Classes calendar with booking forms | Partial | Service and cooking-class booking forms exist, including preferred and alternative dates. There is no public Events listing, event-detail system, or event Contentful model. |
| Blog for recipes, eco tips, health, press, and lifestyle | Delivered and expanded | Blog index/detail pages, Contentful rich text, categories, trivia, reveal sections, responsive tables, excerpts, slug handling, and article publishing workflows exist. |
| Blog comments and reactions | Missing | No blog-comment or reaction workflow was found. Service reviews are a separate later system. |
| “Products We Love” affiliate-ready grid | Missing / replaced | No affiliate-products implementation was found. The current Shop sells premium recipe content instead. |
| Stripe for digital products | Delivered and expanded | Premium recipe checkout, order records, webhooks, reconciliation, access checks, order history, and payment recovery exist. |
| Stripe for service bookings or class tickets | Missing | The service booking flow stores enquiries/bookings but does not take booking or class-ticket payment. |
| Booking inquiry forms | Delivered and expanded | General enquiries and service-specific bookings are database-backed, validated, emailed, and manageable through protected admin routes. |
| GA4 analytics | Partial / unverified | The conference links page can emit a `gtag` event if GA is already present, but no repository evidence of a GA loader or complete site-wide setup was found. Production configuration should be verified separately. |
| Meta Pixel | Missing | No Meta Pixel implementation was found. |
| AI-enhanced launch visuals | Unverified | Image assets exist, but the repository cannot reliably distinguish AI-generated, stock, commissioned, or client-supplied images. Amber also explicitly preferred supplied photography in later feedback. |
| Flexible custom landing pages | Delivered at least once | A conference-oriented `/links` page, Contentful management, UTM handling, and QR support were created. The original phrase was open-ended, so additional unlimited landing pages should not be assumed. |
| Final CMS training | Partially evidenced | Repeated Contentful guidance and field-label improvements are documented. A single formal final handoff session is not clearly recorded as complete. |
| GA4 and Meta analytics-driven decision support | Incomplete | Metadata and some campaign-link tracking exist, but the promised analytics stack is not fully evidenced. |

## Work That Materially Exceeded the Express Original Feature List

The following systems or responsibilities were not clearly specified as deliverables in the original package. Some support an original feature, but their breadth represents a material expansion.

### 1. Protected custom administration area

The application includes protected administration for:

- dashboard statistics;
- customer accounts;
- service bookings;
- site settings and tax configuration; and
- service-review moderation.

The original proposal mentioned Contentful and integrations, not a separate custom operational admin product.

### 2. Service-review submission and moderation system

The delivered workflow includes:

- a public review modal;
- name, private email, rating, and review collection;
- validation, honeypot, excessive-link checks, and rate limiting;
- pending, approved, and rejected states;
- admin approval, rejection, return-to-pending, and deletion;
- migration of legacy Contentful reviews;
- approved-only public display and recalculated aggregates; and
- progressive loading and navigation back to the review heading.

The original package mentioned customer-review controls in later design feedback, but did not define a database-backed moderation product.

### 3. Order-management and recovery infrastructure

Beyond a simple Stripe button, the application includes:

- persistent orders;
- Stripe sessions and payment-intent tracking;
- webhook handling;
- checkout snapshots;
- order reconciliation;
- failed or interrupted checkout recovery;
- signed-in order history;
- premium-content access checks; and
- adjustable tax settings.

These are production commerce operations, not merely a visual shop grid.

### 4. Expanded authentication and account lifecycle

Work extends beyond “basic logins” to include:

- OAuth/SSO callbacks;
- user webhooks and database synchronization;
- email-verification tokens and templates;
- account management;
- checkout redirects and protected content; and
- admin account inspection.

### 5. Email infrastructure beyond newsletter signup

The project now contains:

- email transport abstraction;
- verification, welcome, order, booking, enquiry, and subscriber templates;
- a branded React Email welcome message;
- HTML and plain-text rendering;
- signed unsubscribe URLs and status persistence;
- duplicate and re-subscription handling;
- delivery failure logging and SMTP timeouts; and
- manual client-matrix verification planning.

The original package promised newsletter signup, not this complete transactional-email lifecycle.

### 6. CMS engineering and content operations

The repository currently contains 47 Contentful scripts for seeding, migrations, schema changes, asset uploads, category fixes, shared-asset separation, content population, and verification.

Documented work includes:

- separating overview and detail content;
- splitting unintentionally shared assets;
- making homepage, header, footer, authentication, blog, recipe, service, and links content editable;
- adding fallbacks and five-minute caching;
- creating webhook revalidation; and
- repeatedly publishing or correcting content entries.

The original proposal promised an editable CMS. It did not define nearly a year of developer-managed CMS restructuring and content operations.

### 7. Security, abuse prevention, and operational hardening

Added safeguards include:

- database-backed rate-limit buckets;
- honeypot protection;
- structured, privacy-aware logging;
- signed unsubscribe tokens;
- admin session handling;
- site access gating during development;
- validation across enquiries, bookings, reviews, email, and checkout; and
- idempotency or duplicate protection in several workflows.

Some security is always implicit in a professional build, but the quantity of protected workflows grew with the expanded application scope.

### 8. Detailed SEO and production-readiness work

The current project includes:

- canonical URLs;
- dynamic metadata;
- Open Graph and Twitter images;
- robots and sitemap generation;
- structured data for key content;
- no-index handling for private routes;
- slug migration and legacy-route handling; and
- production URL correction and verification.

The original proposal mentioned clean social previews and analytics but did not define this broader SEO implementation.

### 9. Conference landing experience

The February work added:

- a dedicated `/links` experience for the Feed The Soul Culinary Conference;
- a printable QR code;
- Contentful-managed links and imagery;
- event-specific messaging;
- UTM-aware link handling; and
- conditional hiding of unfinished areas.

The proposal mentioned flexibility for custom landing pages, so one landing page may be arguable as included. The event-specific content, QR deliverable, tracking, and rapid conference support still demonstrate how the work expanded beyond the core site build.

### 10. Repeated redesign, content, and support cycles

The correspondence documents substantial work after the initial design and build phases:

- recurring Figma review from October 2025 onward;
- 257 Figma comments, comprising 123 root threads and 134 replies;
- a conference-specific launch experience;
- a broad May redesign list;
- CMS restructuring in June;
- service and blog reconstruction in July;
- final homepage, image, footer, category, review, authentication, and email work in August; and
- repeated Contentful walkthroughs, content fixes, production checks, and troubleshooting.

The clearest expansion is the **duration and ongoing service model**. Weekly project collaboration intended for a four-to-six-week build became an approximately eleven-month working relationship without a defined revision cap, maintenance agreement, or monthly capacity.

## Current Product Scale

The following counts are implementation indicators, not measures of hours or commercial value:

- 27 Next.js page files.
- 24 API route files.
- 10 SQL database migrations.
- 47 Contentful migration, seed, update, and verification scripts.
- 207 TypeScript, TSX, JavaScript migration, and SQL source files across the application, components, library, scripts, and database folders.
- Approximately 28,194 lines across those source files.
- 99 commits from November 4, 2025 through August 5, 2026, plus the current uncommitted completion work.

This is materially more than a static marketing website, although raw counts should never be used as a substitute for scope, quality, or time records.

## What Is Still Missing or Requires Confirmation

### Expressly named original items not fully delivered

- Public Events listing and event-detail experience.
- A true Events and Classes calendar.
- Event or class ticket payment.
- Standalone Contact page, if still desired instead of the current contact and enquiry paths.
- Recipe-specific Waste-Less Tip block.
- Instagram and Facebook feed embeds.
- YouTube playlist or video embeds.
- Snapchat touchpoints and Snap Pixel.
- Unified social share actions.
- Blog comments and reactions.
- Products We Love affiliate grid.
- Complete GA4 installation and verification.
- Meta Pixel.

### Current client-dependent or approval-dependent items

- Cooking-class channel, videos, links, and placement decisions.
- Final service reviews supplied or approved by Amber.
- Final recipe population, slugs, and images.
- Email-provider and inbox-testing access.
- Google Workspace and Calendar decisions.
- Events MVP registration choice, content, price, and written approval.
- Final production-wide desktop, tablet, and mobile acceptance.

## Work That Should Not Be Characterized as Extra Without More Evidence

For a fair client conversation, avoid claiming all implementation effort as out of scope. The original proposal expressly named several broad outcomes:

- Contentful CMS;
- recipes and filtering;
- authentication;
- bookings;
- Stripe and digital products;
- Events and Classes;
- Blog;
- newsletter signup;
- responsive design;
- analytics and social previews; and
- custom landing-page flexibility.

Technical work reasonably necessary to make those promised features functional may be treated as part of the original commitment unless a signed agreement narrowed them. Defect correction and completing an expressly promised feature should also not be reframed as new work merely because it was difficult.

The strongest examples of expansion are instead:

- custom administration not named in the proposal;
- service-review moderation;
- advanced order recovery and operations;
- the deeper authentication/account lifecycle;
- branded transactional email and unsubscribe operations beyond signup;
- extensive CMS content operations after the system was established;
- later requested design and content changes;
- repeated production and troubleshooting support; and
- the shift from a four-to-six-week project into an eleven-month working arrangement.

## Why the Engagement Expanded

The available evidence suggests multiple contributing causes rather than one party being solely responsible:

- the original scope was too broad for the price and timeline;
- lean and advanced feature promises were combined without prioritization;
- acceptance criteria and revision limits were absent;
- content and final images arrived over a long period;
- some features depended on client accounts, credentials, copy, videos, or decisions;
- ongoing review introduced new requirements and visual refinements;
- the developer continued implementing and supporting requests without consistently issuing change orders; and
- the site evolved from a marketing website into a small business application.

This framing is more defensible and constructive than saying the delay or expansion was entirely the client's fault.

## Commercial Interpretation

### What the original payment reasonably covers

The original payment should be treated as covering the broad initial website foundation and the expressly named core features, subject to completing or mutually closing the remaining original items.

### What the original payment did not reasonably establish

It did not create a sustainable agreement for:

- unlimited revisions;
- unlimited CMS restructuring or content entry;
- continuous feature requests for almost a year;
- ongoing account and provider troubleshooting;
- monthly production support;
- unlimited custom admin tooling;
- recurring campaign production; or
- new large workflows without written approval.

### Financial context

If the total paid to date is approximately $1,000, spread across an 11.3-month active relationship, it represents roughly $88 per calendar month of engagement. This is **not** an hourly-rate calculation and should not be presented as an invoice. It simply illustrates the mismatch between a one-time short-project price and the sustained service model that developed.

Retroactive fees should not be invented without prior agreement. The practical remedy is to close the original scope clearly and price all future work prospectively.

## Recommended Next Step

### 1. Confirm the historical record

Before sending a commercial statement, verify:

- the signed or accepted proposal version;
- exact payments and dates;
- any written changes to scope or price;
- any verbal commitments documented in follow-up emails;
- whether the original project was ever formally accepted or launched; and
- which remaining original features Amber and John still expect.

### 2. Close the original website with a written matrix

Agree on one final list containing:

- items to complete as part of the original package;
- items accepted in their current alternative form;
- items removed by mutual agreement;
- client-content or access dependencies; and
- newly requested work requiring a separate approval.

### 3. Use prospective pricing only

After closure:

- quote the small Events MVP separately;
- quote the basic internal newsletter workflow separately;
- offer the combined add-on or the small retainer;
- define revision counts, response times, ownership, third-party costs, and support periods; and
- do not begin additional features without written scope and payment approval.

## Recommended Client-Facing Summary

> The original website proposal was designed as an affordable four-to-six-week foundation and included a broad set of website features. Over the past year, the project evolved into a much larger platform with custom administration, account and order workflows, database-backed bookings and reviews, expanded Contentful management, email automation, SEO, security, and many rounds of design and content refinement. I also recognize that some items named in the original proposal are still incomplete or were implemented differently. I would like us to agree on one final original-scope checklist, close that phase fairly, and use written fixed-price add-ons or a small retainer for all future work. This will make costs, priorities, and delivery expectations clear for everyone.

## Related Documents

- [Current client proposal](client-proposal.md)
- [Internal pricing and scope notes](internal-pricing-and-scope-notes.md)
- [Superseded retainer draft](archive/superseded-retainer-draft-2026-08-16.md)
- `docs/final-website-punch-list-2026-08-16.md`
- `docs/amber-email-correspondence-context-2025-09-to-2026-08.md`
- `docs/meeting-notes-website-planning-2026-08-15.md`
- `docs/figma-comments-export-2026-08-14.md`
- `docs/app-sitemap.md`
