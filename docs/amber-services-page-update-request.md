# Amber Services Page Update Request

This document summarizes Amber's requested updates for the WaistLess Foods services pages.

## High-Level Summary

Amber is asking for the Services area of the website to be updated so it feels more polished, content-rich, and consistent with the recently updated About Me page.

Canonical content source:

- Use `docs/WF-OurServicesPageS.md` as the source document for the Services content migration.
- The duplicate root-level file `WF - Our Services PageS.md` has the same content, but the `docs/` file should be treated as the project source of truth.
- In that source document, labels like `DESCRIPTION`, `(Title - Black)`, `(Subtitle - turquoise)`, and `Our Service > ... Page` are editorial/style instructions, not final visible page copy.
- The Contentful schema update is documented in `docs/contentful-service-detail-sections-schema.md`.

The main visual direction is:

- Use black for main section titles.
- Use turquoise for individual item subtitles.
- Remove generic labels like "Description."
- Replace generic headings like "Benefits" and "Includes" with her custom section titles.
- Remove the "How to Book" section from each individual service page.

## Implemented Status - 2026-07-05

The Services update is implemented and ready for visual review.

| Area | Implemented | Where |
| --- | --- | --- |
| Main Services page | Changed heading to `Our Services`, added Amber's intro copy, removed the overview-card `Benefits:` label, corrected card names to `Private Chef`, `Catering`, and `Cooking Classes`, and restyled highlights with turquoise accent bullets. | `app/services/services-client.tsx`, `app/services/page.tsx` |
| Individual service pages | Removed visible `Description`, `Benefits`, `Includes`, and `How to Book` headings when new structured content exists. Added black custom section titles, turquoise item subtitles, body copy, and plain planning/class detail lists. | `app/services/[slug]/page.tsx`, `app/services/[slug]/service-detail-client.tsx` |
| Contentful schema | Added optional `detailSections` Object field to the `service` content type. | Contentful `master` environment, `scripts/contentful/migrate-service-detail-sections.mjs` |
| Contentful content | Populated `detailSections` for Private Chef, Catering, and Cooking Classes using `docs/WF-OurServicesPageS.md` as the source. Also removed the Catering legacy `tes` item. | `scripts/contentful/populate-service-detail-sections.mjs` |
| Navigation and URLs | Updated header service labels and links. Added permanent redirect from `/services/cooking-class` to `/services/cooking-classes`. Updated Contentful links page URL. | `components/header.tsx`, `next.config.ts`, `scripts/contentful/seed-links.mjs` |
| Fallback behavior | Old fields remain available only as fallback if a service entry does not have `detailSections`. | `lib/contentful-management.ts`, service detail UI |
| Verification | `pnpm build` passes. Local route checks pass for `/services`, `/services/private`, `/services/catering`, `/services/cooking-classes`, and the legacy redirect. Playwright screenshot verification also passes on desktop and mobile. | Local `next start` on `http://localhost:3002`; screenshots in `docs/audit-screenshots/amber-services-2026-07-05/` |

Last local verification URL:

```text
http://localhost:3002/services
```

## Follow-Up Status - 2026-07-09

Amber approved the previous services updates and requested a small refinement to the main `Our Services` page because the introductory description created a lot of white space before the service cards.

Implemented follow-up:

- Kept Amber's intro copy unchanged.
- Made the overview intro more compact with smaller body text and tighter spacing.
- Kept the intro centered above the service cards while using a wider, tighter text block to reduce vertical whitespace.

Pending:

- Amber also mentioned homepage comments in Figma. Those comments are not captured in this repo yet, so homepage changes still need the Figma comment details before implementation.

## Main Services Page

Status: implemented in `app/services/services-client.tsx`.

The main services page heading has been changed from:

```text
Our Service
```

to:

```text
Our Services
```

The long introductory text section has also been added under the "Our Services" title.

### Requested Intro Copy

Redefine the way you experience dining with elevated culinary services that bring artfully prepared cuisine and chef-driven experiences directly to you. Whether you're looking to refine your culinary techniques through our cooking classes, enjoy a stress-free gathering with professional catering, or create an intimate private chef dining experience, we offer something for every occasion. We create spaces where beautifully composed food, connection, and celebration are shared with the ones who matter most.

Though we proudly serve the Houston area and surrounding communities, we are also available for travel across the United States for private chef services and catering.

## Individual Service Pages

Amber wants the individual service pages updated for:

- Private Chef
- Catering
- Cooking Classes

Each page should include:

- A main service description.
- Custom section headings.
- Black section titles.
- Turquoise item subtitles.
- Service inclusions and additional details from her attachment.
- No visible "Description" heading.
- No "How to Book" section.

## Private Chef Page

### Main Description

WaistLess Foods Signature Private Chef Experience is an immersive, multi-course dining journey prepared entirely on-site and designed to bring fine dining directly into your home. Each experience is built as a cohesive culinary progression, thoughtfully guiding guests through layered flavors, textures, and techniques that unfold with each course. Because everything is prepared from scratch on-site, we provide dietary inclusivity without compromise, ensuring every guest enjoys a thoughtful, beautifully executed plate without ever feeling like an afterthought. Every detail-from preparation to plating-is executed with precision and artistry, creating an elevated dining experience that is both intimate and unforgettable.

### Section: Your Private Chef Experience Includes

This should be a black title.

The following should be turquoise subtitles with descriptive text beneath each one.

#### Private In-Home Dining Experience

A fully immersive dining experience featuring chef-prepared cuisine and elevated hospitality, designed to deliver an intimate, exclusive fine dining setting within the comfort of your home.

#### Curated Multi-Course Menu

Choose from a chef-designed 3, 4, or 5-course menu featuring selections such as an amuse-bouche, intermezzo, appetizer, entree, and dessert. Each experience is paced over approximately 3 hours, allowing every course to be enjoyed at its intended temperature, texture, and presentation.

#### Custom Table Styling & Decor

Personalized table decor curated around your selected theme and color palette, with options ranging from romantic and feminine to bold and masculine, or elegant, refined styling.

#### Elevated, Artful Plating

Intentional, artful plating designed to create visually striking, beautifully composed dishes that elevate the overall dining experience.

#### Guided Tasting With Chef Insights

Each course is introduced with insight into its inspiration, ingredients, and flavor profile, creating a more engaging and immersive dining experience.

#### Hands-On Plating Session

Enjoy a hands-on plating moment during a featured course, where guests learn plating techniques and tap into their creativity to beautifully plate a dish.

### Section: Planning Your Event

This should be a black title.

Details to include:

- Ideal for intimate dining for up to 12 guests.
- Each menu is custom designed during the planning process.
- Pricing is customized based on guest count, menu selection, and service style.
- Personalized menus are available for every event.
- Sample menus are available upon request.
- Proudly serving Houston and the surrounding areas.
- Travel is available for select events.

## Catering Page

### Main Description

WaistLess Foods catering offers elevated, ready-to-serve cuisine designed to enhance private events, corporate functions, and special celebrations. Each menu is thoughtfully prepared off-site using fresh, seasonal ingredients and curated to reflect your vision, event style, and dietary preferences. From buffet-style service and curated hors d'oeuvres to custom presentations, we create beautifully styled food experiences that align seamlessly with your occasion. Whether you're hosting a business luncheon, team celebration, holiday gathering, or private event, our catering provides seamless execution and attentive service so you can focus on your guests while we handle every culinary detail.

### Section: Your Catering Experience Includes

This should be a black title.

The following should be turquoise subtitles with descriptive text beneath each one.

#### Menu Planning Consultation

Personalized consultation to design a menu tailored to your preferences, dietary needs, and event vision.

#### Fresh Ingredient Sourcing

Carefully selected, high-quality ingredients focused on freshness, seasonality, and intentional preparation.

#### Elevated Food Presentation

Professionally styled food displays designed to highlight each dish with balance, elegance, and visual appeal.

#### Custom Table Styling

Coordinated decor and buffet styling aligned with your event aesthetic for a cohesive guest experience.

#### Flexible Service Styles

Versatile service options including buffet presentation, curated hors d'oeuvres, and interactive food stations.

#### Service Equipment & Essentials

All necessary serving equipment is provided, with optional tableware and dining essentials available as add-ons upon request.

#### Full-Service Setup & Cleanup

Complete on-site setup, breakdown, and cleanup for a seamless, stress-free hosting experience.

### Section: Planning Your Event

This should be a black title.

Details to include:

- Ideal for events of up to 120 guests.
- Clients should contact WaistLess Foods to discuss larger events.
- Pricing is customized based on guest count, menu selection, and service style.
- Personalized menus are available for every event.
- Sample menus are available upon request.
- Proudly serving Houston and the surrounding areas.
- Travel is available for select events.

## Cooking Classes Page

Amber mentioned that she accidentally changed something in Contentful and the Cooking Classes page no longer displays. This page likely needs both a content update and a display/debugging fix.

### Main Description

Build confidence in the kitchen through a fun, interactive cooking experience designed for every skill level. From mastering professional techniques and thoughtful ingredient preparation to creating beautifully plated dishes, each class equips you with practical skills and chef-inspired knowledge you can recreate long after the experience ends.

### Section: What You'll Experience

This should be a black title.

The following should be turquoise subtitles with descriptive text beneath each one.

#### Hands-On Chef-Led Instruction

Enjoy a step-by-step, chef-led cooking experience designed to guide you through each stage of preparation with clarity and ease, while participating in interactive instruction that builds essential skills.

#### Artful Plating & Presentation Techniques

Master professional plating and presentation techniques that transform everyday dishes into beautifully composed plates using balance, creativity, and thoughtful visual presentation.

#### Waste-Reducing Kitchen Tips

Discover practical techniques to reduce food waste, maximize the use of every ingredient, and transform everyday kitchen scraps into flavorful additions that elevate your cooking.

#### Take-Home Recipe Collection

Receive recipe cards from your session to continue practicing and recreating elevated dishes in your own kitchen.

#### Curated Beverage Pairing

Sip and savor thoughtfully selected beverages, including wine for adult classes or non-alcoholic refreshments, curated to complement the featured menu.

### Section: Find Your Perfect Class

This should be a black title.

Class types to include:

- Multi-Course Culinary Experience
- Plant-Based & Dairy-Free Cuisine
- Seasonal Salads & Homemade Dressings
- The Art of Sauce Making
- Artful Plating & Presentation

Additional details to include:

- Guests must be ages 6 and older.
- Classes typically last 3-5 hours, depending on the selected class and the complexity of the menu.
- No BYOB.
- Complimentary beverages are provided for adult classes only.

## Wording Updates

Amber requested the following small wording changes:

| Current Text | Requested Text | Likely Location |
| --- | --- | --- |
| Our Service | Our Services | Chef Services page heading |
| Cooking Class | Cooking Classes | Dropdown/menu item |

## Implementation Notes

- Match the styling pattern used on the updated About Me page.
- Black titles should be used for major content sections.
- Turquoise subtitles should be used for individual service inclusion names.
- Remove visible "Description" labels from service pages.
- Remove "How to Book" sections from individual service pages.
- Check the Cooking Classes page data in Contentful or the local rendering logic because Amber says it no longer displays.

## Website and Contentful Audit - 2026-07-05

This audit now documents the completed Services content migration and the final verified state after implementation.

### Audit Scope

Checked:

- Local service overview route: `/services`
- Local service detail routes:
  - `/services/private`
  - `/services/catering`
  - `/services/cooking-class`
  - `/services/cooking-classes`
- Service page React components.
- Header service dropdown links.
- Contentful `service` content type schema.
- Published Contentful `service` entries in the `master` environment.
- Contentful `linksPage` entry because it contains a Cooking Classes link.

Verification notes:

- `pnpm build` passes after the Contentful schema, data, UI, redirect, and docs updates.
- `pnpm lint` currently fails because of existing repo-wide lint issues unrelated to this audit, including `any` usage, React hook lint rules, and unescaped apostrophes in other files.
- Playwright screenshot verification passes on desktop and mobile.
- Playwright screenshots and assertion results are saved in `docs/audit-screenshots/amber-services-2026-07-05/`.
- Route checks were performed against `next start` on `http://localhost:3002`.
- When starting the server for local route checks, bind to `localhost`, not only `127.0.0.1`; otherwise the app request path can fail while proxying internally to `http://localhost:3002`.
- The Main Services page heading and intro paragraph are implemented in `app/services/services-client.tsx`.
- The individual service pages now render Contentful `detailSections` from the published Contentful `service` entries.
- A shorter current audit is available in `docs/amber-services-short-audit-2026-07-05.md`.

### Executive Summary

The Services website update now matches Amber's requested structure.

Completed:

- The main Services page says `Our Services` and includes Amber's long intro copy.
- The main Services page overview cards no longer show the generic `Benefits:` label.
- The main Services page overview cards use final service names: `Private Chef`, `Catering`, and `Cooking Classes`.
- Contentful now has a structured `detailSections` field on the `service` content type.
- The published Contentful entries for Private Chef, Catering, and Cooking Classes have populated `detailSections`.
- The service detail UI renders the custom headings:
  - "Your Private Chef Experience Includes"
  - "Your Catering Experience Includes"
  - "What You'll Experience"
  - "Planning Your Event"
  - "Find Your Perfect Class"
- The visible generic headings `Description`, `Benefits`, `Includes`, and `How to Book` are removed from service detail pages when `detailSections` exists.
- Header service links now use `Private Chef`, `Catering`, and `Cooking Classes`.
- The stale `/services/cooking-class` URL redirects to `/services/cooking-classes`.
- The Contentful links page Cooking Classes URL has been updated to `/services/cooking-classes`.
- The legacy Catering `includes` test item `tes` has been removed.

Legacy fields such as `detailBenefits`, `includes`, and `howToBook` still exist in Contentful as fallback data, but they are no longer the primary visible page structure for the migrated service entries.

### Route Audit

| Route | Result | Current State | Issue |
| --- | --- | --- | --- |
| `/services` | 200 | Shows "Our Services," Amber's overview paragraph, final service card names, and no `Benefits:` card label. | No blocking issue found. |
| `/services/private` | 200 | Renders `Your Private Chef Experience Includes` and `Planning Your Event` from Contentful `detailSections`. | Verified old generic headings are not rendered. |
| `/services/catering` | 200 | Renders `Your Catering Experience Includes` and `Planning Your Event` from Contentful `detailSections`. | Verified old generic headings are not rendered. |
| `/services/cooking-class` | 308 | Permanently redirects to `/services/cooking-classes`. | Legacy singular URL is protected. |
| `/services/cooking-classes` | 200 | Renders `What You'll Experience` and `Find Your Perfect Class` from Contentful `detailSections`. | Verified old generic headings are not rendered. |

### Code Findings

#### Main Services Page

File: `app/services/services-client.tsx`

Status:

- The heading has been changed from `Our Service` to `Our Services`.
- Amber's overview paragraph has been added under the heading.
- The service-data `console.log` has been removed.

Additional overview cleanup:

- The overview card `Benefits:` label has been removed for consistency with Amber's direction.
- The overview cards now use the final service names `Private Chef`, `Catering`, and `Cooking Classes`.
- The service highlights render as a clean turquoise-accented list instead of a generic labeled block.

#### Service Detail Pages

Files:

- `app/services/[slug]/page.tsx`
- `app/services/[slug]/service-detail-client.tsx`

Status:

- `app/services/[slug]/page.tsx` now passes Contentful `detailSections` into the service detail client.
- `app/services/[slug]/service-detail-client.tsx` now renders:
  - Main description body copy without a visible `Description` label.
  - Black section titles from `detailSections.sections[].title`.
  - Turquoise item subtitles from `detailSections.sections[].items[].subtitle`.
  - Body copy under each subtitle.
  - Plain detail lists for planning/class details.
- The old `Benefits`, `Includes`, and `How to Book` sections remain only as a fallback when a service entry has no populated `detailSections`.
- The breadcrumb link now says `Our Services`.
- The service-detail Contentful cache key was versioned so the production build does not reuse stale pre-migration service data.

#### Header Navigation

File: `components/header.tsx`

Status:

- Header service links have been updated to:
  - `Private Chef` -> `/services/private`
  - `Catering` -> `/services/catering`
  - `Cooking Classes` -> `/services/cooking-classes`
- A permanent redirect sends `/services/cooking-class` to `/services/cooking-classes`.

### Contentful Schema Findings

Content type: `service`

Current relevant fields:

- `slug`
- `title`
- `description`
- `detailDescription`
- `detailSections`
- `benefits`
- `detailBenefits`
- `includes`
- `howToBook`
- `breadcrumbLabel`
- `priceText`
- `reviews`
- image fields
- `sortOrder`

Schema status:

The original schema was list-based, not section-based. It could store a main description and simple arrays, but it could not cleanly store Amber's structure:

```text
Black section title
Turquoise subtitle
Subtitle description/body
```

That has been resolved by adding an optional `detailSections` Object field to the `service` content type.

Implemented structured shape:

```ts
type ServiceDetailSection = {
  id?: string;
  title: string;
  variant?: "feature-list" | "detail-list";
  items: {
    subtitle?: string;
    body?: string;
  }[];
};
```

The schema and migration details are documented in `docs/contentful-service-detail-sections-schema.md`.

### Contentful Entry Audit

#### Private Chef

Current Contentful state:

- Slug: `private`
- Title: `Private Chef`
- Breadcrumb label: `Private Chef`
- Main detail description has been updated from `docs/WF-OurServicesPageS.md`.
- `detailSections` is populated with:
  - `Your Private Chef Experience Includes`
  - `Planning Your Event`
- Legacy `detailBenefits`, `includes`, and `howToBook` fields still exist as fallback data, but the migrated page does not render them while `detailSections` is present.

#### Catering

Current Contentful state:

- Slug: `catering`
- Title: `Catering`
- Breadcrumb label: `Catering`
- Main detail description has been updated from `docs/WF-OurServicesPageS.md`.
- `detailSections` is populated with:
  - `Your Catering Experience Includes`
  - `Planning Your Event`
- The legacy `includes` test item `tes` has been removed.
- Legacy `detailBenefits`, `includes`, and `howToBook` fields still exist as fallback data, but the migrated page does not render them while `detailSections` is present.

#### Cooking Classes

Current Contentful state:

- Slug: `cooking-classes`
- Title: `Cooking Classes`
- Breadcrumb label: `Cooking Classes`
- Main detail description has been updated from `docs/WF-OurServicesPageS.md`.
- `detailSections` is populated with:
  - `What You'll Experience`
  - `Find Your Perfect Class`
- Header and links page URLs now point to `/services/cooking-classes`.
- The legacy singular route `/services/cooking-class` redirects to `/services/cooking-classes`.
- Legacy `detailBenefits`, `includes`, and `howToBook` fields still exist as fallback data, but the migrated page does not render them while `detailSections` is present.

### Contentful Links Page Finding

The Contentful `linksPage` entry has a visible link:

```text
Cooking Classes -> /services/cooking-classes
```

This has been updated from the stale singular URL. The seed script now also uses the plural URL.

### Data vs Code Decision

Use `docs/WF-OurServicesPageS.md` as the source document for the individual service page content migration.

Chosen approach:

- Add a structured `detailSections` Object field to the Contentful `service` content type.
- Populate that field for Private Chef, Catering, and Cooking Classes.
- Render that field in the service detail UI.
- Keep old fields as fallback data.

Pros:

- Amber's content lives in Contentful instead of being hard-coded by slug.
- The UI can cleanly support black section titles, turquoise item subtitles, and body copy.
- The existing service data remains available as fallback during rollout.

Tradeoff:

- `detailSections` is a JSON Object field, so it is flexible but less editor-guided than separate section/item content types.
- A future CMS polish pass could replace the Object field with dedicated linked entries if Amber needs a more guided editing workflow.

### Priority Fix List

Completed:

1. Main services heading changed to `Our Services`.
2. Main services intro paragraph added.
3. Service overview `console.log` removed.
4. Contentful `service.detailSections` schema field added.
5. `detailSections` populated for Private Chef, Catering, and Cooking Classes.
6. Service detail UI updated to render `detailSections`.
7. Visible `Description`, `Benefits`, `Includes`, and `How to Book` headings removed from migrated individual service pages.
8. Old detail fields kept as fallback when `detailSections` is missing.
9. Header dropdown labels and hrefs updated.
10. `/services/cooking-class` redirects to `/services/cooking-classes`.
11. Contentful links page Cooking Classes URL updated.
12. Catering legacy `includes` test item `tes` removed.
13. `pnpm build` passes.
14. Local route checks pass on `http://localhost:3002`.
15. Main Services overview card `Benefits:` label removed.
16. Main Services overview card titles corrected to `Private Chef`, `Catering`, and `Cooking Classes`.
17. Playwright screenshot verification passes on desktop and mobile, with artifacts saved in `docs/audit-screenshots/amber-services-2026-07-05/`.

Latest overview cleanup:

- The main services overview cards no longer use the `Benefits:` label.
- The `Private Service` and `Cooking Class` overview names have been corrected to `Private Chef` and `Cooking Classes`.
- The service overview cache key was versioned so the updated Contentful titles display in the local/production build.
