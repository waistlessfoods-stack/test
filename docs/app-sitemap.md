# App Sitemap

Date: 2026-06-17
Project: `waitslessfood.com`

## Access model

The app currently has three separate access layers:

1. Public routes
   - Accessible without unlocking the site.
   - Includes `/`, `/links`, `/signin`, `/signup`, and `/sso-callback/*`.

2. Site-locked routes
   - Most non-public pages render inside `SiteAccessGate`.
   - Users must enter the admin password once per session to view them.

3. Authenticated or admin-only routes
   - `/account` and `/orders` also require a signed-in user session.
   - `/admin/*` requires the separate admin session flow.

## Primary sitemap

```text
/
|-- /about
|-- /services
|   |-- /services/[slug]
|   |   |-- /services/[slug]/book
|-- /shop
|-- /recipes
|   |-- /recipes/[category]                    (legacy/mock category route)
|   |-- /recipes/detail/[slug]
|   |   |-- /recipes/detail/[slug]/full
|-- /blog
|   |-- /blog/[slug]
|-- /blogs                                    (redirects to /blog)
|-- /links
|-- /signin
|-- /signup
|-- /sso-callback/[[...sso-callback]]
|-- /account
|-- /orders
|-- /admin
|   |-- /admin/dashboard
|   |-- /admin/accounts
|   |-- /admin/bookings
|   |-- /admin/settings
|-- /stripe-test                              (internal test page)
```

## Route inventory

### Public marketing and content

- `/`
  - Homepage.
  - Contentful-backed.
  - Public.

- `/links`
  - Standalone links page with enquiry actions and social/profile links.
  - Contentful-backed.
  - Public.

- `/blog`
  - Blog index.
  - Contentful-backed.
  - Site-locked.

- `/blog/[slug]`
  - Blog detail page.
  - Contentful-backed.
  - Site-locked.

- `/blogs`
  - Legacy alias route.
  - Redirects to `/blog`.

### Brand and service discovery

- `/about`
  - About/brand page.
  - Contentful-backed.
  - Site-locked.

- `/services`
  - Services listing page.
  - Contentful-backed.
  - Site-locked.

- `/services/[slug]`
  - Service detail page.
  - Expected slugs appear to include `private`, `catering`, and `cooking-class`.
  - Contentful-backed.
  - Site-locked.

- `/services/[slug]/book`
  - Booking form for a specific service.
  - Submits to bookings API.
  - Site-locked.

### Recipes and commerce

- `/recipes`
  - Recipe index and category filtering.
  - Contentful-backed.
  - Site-locked.

- `/recipes/[category]`
  - Separate category route still using mock data.
  - Does not appear aligned with the main Contentful recipe flow.
  - Site-locked.

- `/recipes/detail/[slug]`
  - Recipe detail/preview page.
  - If the recipe is free, it redirects to `/recipes/detail/[slug]/full`.
  - Site-locked.

- `/recipes/detail/[slug]/full`
  - Full recipe content.
  - Free recipes are open after site unlock.
  - Paid recipes require a matching completed order for access.
  - Site-locked.

- `/shop`
  - Premium recipe storefront.
  - Cart and checkout entry point.
  - Contentful-backed.
  - Site-locked.

- `/orders`
  - Order history and payment recovery.
  - Requires user sign-in.
  - Also site-locked.

### Authentication and account

- `/signin`
  - Clerk-based sign-in flow.
  - Public.

- `/signup`
  - Clerk-based sign-up flow.
  - Public.

- `/sso-callback/[[...sso-callback]]`
  - OAuth/SSO callback handler route.
  - Public.

- `/account`
  - User account settings and embedded Clerk profile manager.
  - Requires user sign-in.
  - Also site-locked.

### Admin

- `/admin`
  - Admin portal landing page.
  - Requires admin session.

- `/admin/dashboard`
  - Dashboard for orders, accounts, enquiries, and subscribers.
  - Requires admin session.

- `/admin/accounts`
  - Registered user accounts list.
  - Requires admin session.

- `/admin/bookings`
  - Booking management UI.
  - Requires admin session.

- `/admin/settings`
  - Storefront tax/settings UI.
  - Requires admin session.

### Internal/testing

- `/stripe-test`
  - Stripe checkout test page.
  - Should likely remain non-indexed or development-only.
  - Site-locked.

## Functional flow map

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

### Admin flow

```text
/admin
-> /admin/dashboard
-> /admin/accounts
-> /admin/bookings
-> /admin/settings
```

## API sitemap

These are app-internal routes, not user-facing pages, but they are part of the full surface area.

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

## Notes

- The main navigable app is split across content pages, recipe commerce, service booking, user account/order history, and a separate admin portal.
- `/recipes/[category]` looks like a legacy route that still serves mock data and should probably be treated carefully in navigation and SEO decisions.
- Because of `SiteAccessGate`, the practical public sitemap is much smaller than the route tree suggests.
- If you want, the next useful step is for me to turn this into either:
  - an SEO-focused XML/`app/sitemap.ts` sitemap for crawlable pages, or
  - a visual flowchart version for docs/stakeholders.
