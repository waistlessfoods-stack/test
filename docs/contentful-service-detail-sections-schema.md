# Contentful Service Detail Sections Schema

This document explains the new Contentful schema field added for Amber's Services page update.

## Status

Implemented, populated, and verified as of 2026-07-05 with route checks, Contentful Delivery API checks, and Playwright screenshots.

The Contentful `service` content type in the `master` environment now includes this optional field:

```text
Field ID: detailSections
Name: Detail Sections
Type: Object
Required: false
Localized: false
Disabled: false
Omitted: false
```

The migration script is:

```bash
pnpm contentful:migrate-service-detail-sections
```

The content population script is:

```bash
pnpm contentful:populate-service-detail-sections
```

The source document for the service content migration is:

```text
docs/WF-OurServicesPageS.md
```

## Why This Field Exists

Amber's requested service pages need more structure than the old fields can provide.

The old service fields are mostly simple text arrays:

```text
detailDescription
detailBenefits
includes
howToBook
```

Those fields cannot cleanly represent this pattern:

```text
Black section title
Turquoise subtitle
Body copy under the subtitle
```

The new `detailSections` JSON field gives each service page a structured place for the new sections, subtitles, and body copy.

## JSON Shape

Use this shape inside the `detailSections` Object field:

```json
{
  "sections": [
    {
      "id": "section-id",
      "title": "Section Title",
      "variant": "feature-list",
      "items": [
        {
          "subtitle": "Turquoise Subtitle",
          "body": "Body copy for this subtitle."
        }
      ]
    }
  ]
}
```

## Field Rules

### `sections`

Required inside the JSON object.

This is an array of service page sections.

### `sections[].id`

Optional but recommended.

Use a stable lowercase kebab-case ID, for example:

```text
private-chef-experience-includes
planning-your-event
what-youll-experience
find-your-perfect-class
```

### `sections[].title`

Required.

This is the black section title shown on the page.

Examples:

```text
Your Private Chef Experience Includes
Your Catering Experience Includes
What You'll Experience
Planning Your Event
Find Your Perfect Class
```

### `sections[].variant`

Optional.

Supported values:

```text
feature-list
detail-list
```

Use `feature-list` when items have turquoise subtitles plus body text.

Use `detail-list` when items are simple event/class details without subtitles.

### `sections[].items`

Required.

This is an array of section items.

For `feature-list`, each item should usually have both:

```json
{
  "subtitle": "Private In-Home Dining Experience",
  "body": "A fully immersive dining experience..."
}
```

For `detail-list`, each item can use only `body`:

```json
{
  "body": "Ideal for intimate dining for up to 12 guests."
}
```

## Mapping From `WF-OurServicesPageS.md`

Use the source doc this way:

### Services Overview Page

The `Our Services Page` description maps to the main `/services` page intro.

This part has already been implemented in:

```text
app/services/services-client.tsx
```

### Individual Service Pages

For each service:

- The paragraph after the service page heading maps to `detailDescription`.
- The bold section title maps to `detailSections.sections[].title`.
- `(Title - Black)` is an instruction, not visible copy.
- Each bold bullet label maps to `detailSections.sections[].items[].subtitle`.
- `(Subtitle - turquoise)` is an instruction, not visible copy.
- The paragraph under each bullet maps to `detailSections.sections[].items[].body`.
- Simple planning/class detail lines map to a `detail-list` section.

## Populated Content

The `detailSections` field has been populated and published for these `service` entries in the Contentful `master` environment:

| Slug | Title | Breadcrumb Label | Sections |
| --- | --- | --- | --- |
| `private` | Private Chef | Private Chef | `Your Private Chef Experience Includes`, `Planning Your Event` |
| `catering` | Catering | Catering | `Your Catering Experience Includes`, `Planning Your Event` |
| `cooking-classes` | Cooking Classes | Cooking Classes | `What You'll Experience`, `Find Your Perfect Class` |

The same population script also removes the legacy Catering `includes` test item `tes`.

## Example: Private Chef

```json
{
  "sections": [
    {
      "id": "private-chef-experience-includes",
      "title": "Your Private Chef Experience Includes",
      "variant": "feature-list",
      "items": [
        {
          "subtitle": "Private In-Home Dining Experience",
          "body": "A fully immersive dining experience featuring chef-prepared cuisine and elevated hospitality, designed to deliver an intimate, exclusive fine dining setting within the comfort of your home."
        },
        {
          "subtitle": "Curated Multi-Course Menu",
          "body": "Choose from a chef-designed 3, 4, or 5-course menu featuring selections such as an amuse-bouche, intermezzo, appetizer, entree, and dessert. Each experience is paced over approximately 3 hours, allowing every course to be enjoyed at its intended temperature, texture, and presentation."
        }
      ]
    },
    {
      "id": "planning-your-event",
      "title": "Planning Your Event",
      "variant": "detail-list",
      "items": [
        {
          "body": "Ideal for intimate dining for up to 12 guests."
        },
        {
          "body": "Each menu is custom designed during the planning process."
        }
      ]
    }
  ]
}
```

## Local Code Updates

The repo now knows about this field in:

```text
lib/contentful-management.ts
```

New exported types:

```ts
ServiceDetailSectionItem
ServiceDetailSection
ServiceDetailSectionsData
```

The existing `ServiceDetailEntry` type now includes:

```ts
detailSections: ServiceDetailSectionsData | null;
```

The Contentful seed script also includes the field definition:

```text
scripts/contentful/seed-services.mjs
```

The service detail UI renders this field in:

```text
app/services/[slug]/page.tsx
app/services/[slug]/service-detail-client.tsx
```

The service detail cache key was versioned in:

```text
lib/contentful-management.ts
```

This forces the production build to use the newly populated `detailSections` payload instead of stale cached service detail data.

## Verification

Verified on 2026-07-05:

- `pnpm build` passes.
- `/services` renders `Our Services`, the intro copy, final service card names, and no overview-card `Benefits:` label.
- `/services/private` renders `Your Private Chef Experience Includes` and `Planning Your Event`.
- `/services/catering` renders `Your Catering Experience Includes` and `Planning Your Event`.
- `/services/cooking-classes` renders `What You'll Experience` and `Find Your Perfect Class`.
- The old visible headings `Description`, `Benefits`, `Includes`, and `How to Book` no longer render on service pages that have `detailSections`.
- `/services/cooking-class` returns a permanent redirect to `/services/cooking-classes`.
- Published Contentful Delivery API data returns `detailSections` for all three service entries.
- Playwright screenshot verification passes on desktop and mobile.
- Screenshots and assertion results are saved in `docs/audit-screenshots/amber-services-2026-07-05/`.

## Maintenance Note

Keep the old service fields as fallback data for now:

```text
detailBenefits
includes
howToBook
```

The new UI prefers `detailSections` when present. It only renders the old fields when a service entry does not have populated `detailSections`.
