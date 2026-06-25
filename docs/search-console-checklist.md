# Search Console Checklist

Date: 2026-06-18
Project: `waitslessfood.com`

## Purpose

Use this checklist after deployment to verify that the SEO work in the app is actually being recognized by Google.

## Before You Start

- [ ] Confirm the production site is live.
- [ ] Confirm `robots.txt` loads at `/robots.txt`.
- [ ] Confirm the sitemap loads at `/sitemap.xml`.
- [ ] Confirm `/` is accessible without the old site password modal.
- [ ] Confirm all other app UI routes show the site password modal before use.
- [x] Recipe slug migration completed successfully.

## Search Console Setup

- [ ] Open Google Search Console.
- [ ] Add the production domain property if it is not already verified.
- [ ] Verify ownership for the correct production domain.

## Sitemap Submission

- [ ] Go to `Sitemaps`.
- [ ] Submit `https://YOUR_DOMAIN/sitemap.xml`.
- [ ] Confirm the sitemap is accepted without fetch or parsing errors.

## URL Inspection Checks

Inspect at least one URL from each important public route group.

### Core pages

- [ ] `/`
- [ ] `/about`
- [ ] `/services`
- [ ] `/shop`
- [ ] `/recipes`
- [ ] `/blog`
- [ ] `/links`

### Detail pages

- [ ] One `/services/[slug]`
- [ ] One paid `/recipes/detail/[slug]`
- [ ] One free `/recipes/detail/[slug]/full`
- [ ] One `/blog/[slug]`

For each inspected URL, confirm:

- [ ] Google can access the page.
- [ ] The canonical URL is the expected one.
- [ ] The page is indexable when it should be.
- [ ] The page is not blocked unexpectedly by `robots.txt`.
- [ ] The rendered HTML contains the expected metadata.

## Non-Indexable Route Checks

Confirm the following route types are excluded from indexing as intended.

- [ ] `/admin/*`
- [ ] `/account`
- [ ] `/orders`
- [ ] `/signin`
- [ ] `/signup`
- [ ] `/sso-callback/*`
- [ ] `/stripe-test`
- [ ] `/recipes/[category]` old path behavior
- [ ] Paid `/recipes/detail/[slug]/full`

For these checks, confirm:

- [ ] `noindex` is present where expected.
- [ ] Canonicals do not point to the wrong route.
- [ ] Redirect behavior is working for legacy URLs.

## Redirect Checks

- [ ] `/blogs` redirects permanently to `/blog`.
- [ ] Legacy recipe title-derived URLs redirect to the canonical CMS slug route when applicable.
- [ ] `/recipes/[category]` redirects to `/recipes?category=...`.

## Metadata Checks

Spot-check the live page source or URL inspection output for:

- [ ] unique title tags
- [ ] unique meta descriptions
- [ ] canonical tags
- [ ] Open Graph image
- [ ] Twitter image
- [ ] structured data presence on detail pages
- [ ] breadcrumb schema on service, recipe, and blog detail pages

## Ongoing Monitoring

### Coverage

- [ ] Review `Pages` / indexing coverage after Google recrawls.
- [ ] Note which pages are indexed, excluded, or crawled but not indexed.

### Canonicals

- [ ] Watch for “Duplicate, Google chose different canonical than user.”
- [ ] Watch for unexpected canonicals on filtered recipe states.

### Errors

- [ ] Review 404 reports.
- [ ] Review soft-404 reports.
- [ ] Review redirect issues.

### Enhancements

- [ ] Check whether structured data enhancements appear for articles/recipes/breadcrumbs.

## Expected Good Outcomes

- `/` is crawlable and indexable without gated UX interference.
- Private and transactional routes remain excluded.
- Filtered recipe query states do not create duplicate indexed pages.
- Legacy route variants consolidate to canonical routes.
- Shared previews use the branded OG image when a stronger page image is not available.

## Current Known Follow-Up

- Contentful recipe slug migration is complete.
- The migration script supports `--dry-run`, paginates through all recipe entries, and auto-resolves duplicate generated slugs with numeric suffixes.
