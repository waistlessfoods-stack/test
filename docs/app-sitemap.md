# App Sitemap

Date: 2026-06-19
Project: `waitslessfood.com`

## Purpose

This is the current route map for the app, with emphasis on:

- public crawlable pages
- private or non-indexable surfaces
- legacy and redirect behavior
- app-internal API surface

## Public Crawlable Surface

These are the routes currently intended to be publicly accessible and part of the SEO surface.

```text
/
|-- /about
|-- /services
|   |-- /services/[slug]
|   |   |-- /services/[slug]/book
|-- /shop
|-- /recipes
|   |-- /recipes/detail/[slug]
|   |   |-- /recipes/detail/[slug]/full
|-- /blog
|   |-- /blog/[slug]
|-- /links
```

Public route notes:

- `/recipes/detail/[slug]` is the canonical recipe detail or preview route.
- `/recipes/detail/[slug]/full` is accessible for free recipes, but paid full-content routes should remain non-indexed.
- `/services/[slug]/book` is publicly reachable, but it is not an SEO target page.

## Non-Indexable or Private Surface

These routes exist in the app but should not be treated as public SEO targets.

```text
/signin
/signup
/sso-callback/[[...sso-callback]]
/account
/orders
/admin
|-- /admin/dashboard
|-- /admin/accounts
|-- /admin/bookings
|-- /admin/settings
/stripe-test
```

Notes:

- `/signin`, `/signup`, and `/sso-callback/*` are public auth routes but should stay out of search.
- `/account` and `/orders` require a signed-in user session.
- `/admin/*` requires the separate admin session flow.
- `/stripe-test` is an internal test surface and should stay non-indexed.

## Redirect and Legacy Routes

```text
/blogs                  -> /blog
/recipes/[category]     -> /recipes?category=...
```

Notes:

- `/blogs` is a legacy alias and should permanently redirect to `/blog`.
- `/recipes/[category]` is no longer the primary recipe category experience and should be treated as legacy redirect behavior.

## Route Inventory

### Marketing and content

- `/`
  - Homepage
  - Contentful-backed
  - Public and indexable

- `/about`
  - Brand and about page
  - Contentful-backed
  - Public and indexable

- `/blog`
  - Blog index
  - Contentful-backed
  - Public and indexable

- `/blog/[slug]`
  - Blog detail page
  - Contentful-backed
  - Public and indexable

- `/links`
  - Standalone links page
  - Public and currently treated as indexable

### Services

- `/services`
  - Services listing page
  - Contentful-backed
  - Public and indexable

- `/services/[slug]`
  - Service detail page
  - Contentful-backed
  - Public and indexable

- `/services/[slug]/book`
  - Service booking page
  - Uses the service booking flow
  - Publicly reachable, but not an SEO target

### Recipes and shop

- `/recipes`
  - Recipe index and filtering page
  - Contentful-backed
  - Public and indexable

- `/recipes/detail/[slug]`
  - Recipe detail or paid preview page
  - Canonical recipe route
  - Public and indexable

- `/recipes/detail/[slug]/full`
  - Full recipe content
  - Free recipes may resolve here
  - Paid full routes should remain non-indexed

- `/shop`
  - Premium recipe storefront
  - Public and indexable

- `/orders`
  - Order history and payment recovery
  - Signed-in user route
  - Non-indexable

### Authentication and account

- `/signin`
  - Clerk-based sign-in flow
  - Public but non-indexable

- `/signup`
  - Clerk-based sign-up flow
  - Public but non-indexable

- `/sso-callback/[[...sso-callback]]`
  - OAuth or SSO callback route
  - Public but non-indexable

- `/account`
  - User account settings
  - Signed-in user route
  - Non-indexable

### Admin

- `/admin`
- `/admin/dashboard`
- `/admin/accounts`
- `/admin/bookings`
- `/admin/settings`

All admin routes require the admin session flow and should remain non-indexable.

## Functional Flow Map

### Visitor flow

```text
/ -> /about
   -> /services -> /services/[slug] -> /services/[slug]/book
   -> /recipes -> /recipes/detail/[slug] -> /recipes/detail/[slug]/full
   -> /shop
   -> /blog -> /blog/[slug]
   -> /links
```

### Commerce flow

```text
/shop
-> add items to cart
-> checkout
-> /signin?redirect=/shop (if not authenticated)
-> Stripe checkout
-> /orders?success=1
-> /recipes/detail/[slug]/full (for purchased recipe access)
```

### Service booking flow

```text
/services
-> /services/[slug]
-> /services/[slug]/book
-> POST /api/bookings
```

## API Surface

These are app-internal routes and not user-facing sitemap entries.

### Auth, account, and webhooks

- `/api/account/verify-email`
- `/api/auth/verify-email`
- `/api/webhooks/clerk`

### Admin APIs

- `/api/admin/verify`
- `/api/admin/logout`
- `/api/admin/dashboard`
- `/api/admin/accounts`
- `/api/admin/bookings`
- `/api/admin/settings`

### Commerce and orders

- `/api/stripe/checkout`
- `/api/stripe/webhook`
- `/api/orders`
- `/api/orders/[id]/checkout`
- `/api/orders/reconcile`
- `/api/settings/tax`

### Leads, booking, and messaging

- `/api/bookings`
- `/api/enquiries`
- `/api/newsletter`
- `/api/email/send`

### CMS revalidation

- `/api/revalidate/contentful`
- `/api/revalidate/header-settings`

## Related Docs

- SEO handoff and remaining rollout work: [docs/seo-roadmap.md](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/docs/seo-roadmap.md)
- Search Console rollout checklist: [docs/search-console-checklist.md](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/docs/search-console-checklist.md)
