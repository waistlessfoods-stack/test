# Contentful Integration Audit

Date: 2026-06-08
Project: `waistlessfood.com`
Scope: Review of how the web app reads, caches, revalidates, and serves Contentful-backed content across shared layout, page routes, and supporting utilities.

## Executive Summary

The site is clearly using Contentful as a primary CMS for core page content, but the integration is not equally mature across all areas. The homepage, about, shop, recipes, services, blog, links, and shared header/footer all pull from Contentful, yet they do so through three separate fetch layers with inconsistent assumptions:

- `lib/contentful-management.ts`
- `lib/contentful-links.ts`
- `lib/contentful-blog.ts`

The strongest parts of the integration are:

- Most top-level page routes are wired to server-side Contentful fetchers.
- Pages use ISR with a 5-minute revalidation interval.
- Shared fetchers already use `unstable_cache` tags.
- The homepage and recipes/shop fetchers handle linked assets reasonably well.

The weakest parts are:

- Shared layout availability depends on the `linksPage` entry.
- Blog reads are coupled to the Contentful Management API and may mutate Contentful during page requests.
- Cache invalidation is only partially implemented.
- Contentful env/config naming is inconsistent and currently appears misconfigured in `.env`.
- Some page families still rely on legacy string fields or mock data instead of stable Contentful modeling.

If this app needs predictable CMS publishing, reliable uptime, and low-maintenance editor workflows, the Contentful layer should be treated as a stabilization project rather than “already done.”

## Audit Method

This audit reviewed:

- Contentful fetch/config code
- Shared layout dependencies
- Contentful-backed page routes
- Caching and revalidation behavior
- Content model assumptions in mapping logic
- Environment variable usage
- Fallback and failure behavior

Primary files reviewed:

- `lib/contentful-management.ts`
- `lib/contentful-links.ts`
- `lib/contentful-blog.ts`
- `lib/social-links.ts`
- `components/layout/layout-shell.tsx`
- `app/page.tsx`
- `app/about/page.tsx`
- `app/services/page.tsx`
- `app/services/[slug]/page.tsx`
- `app/services/[slug]/book/page.tsx`
- `app/shop/page.tsx`
- `app/recipes/page.tsx`
- `app/recipes/detail/[slug]/page.tsx`
- `app/recipes/detail/[slug]/full/page.tsx`
- `app/blog/page.tsx`
- `app/blog/[slug]/page.tsx`
- `app/links/page.tsx`
- `app/api/revalidate/header-settings/route.ts`

## Current Architecture

### 1. Shared layout dependencies

All non-`/links` pages render through `components/layout/layout-shell.tsx`, which eagerly fetches:

- social links from `getSocialLinks()`
- header settings from `fetchHeaderSettingsFromContentful()`
- footer settings from `fetchFooterSettingsFromContentful()`

This means most of the site depends on:

- `linksPage`
- `headerSettings`
- `footerSettings`

before page content even renders.

### 2. Main content fetch layers

There are three separate Contentful modules:

1. `lib/contentful-management.ts`
   - homepage
   - about page
   - recipes page
   - shop page
   - services
   - header/footer settings

2. `lib/contentful-links.ts`
   - links page
   - social links used by shared layout

3. `lib/contentful-blog.ts`
   - blog index
   - blog detail
   - Contentful Management API setup logic

These modules share similar config logic but do not share a single source of truth for:

- env var parsing
- client creation
- error handling
- data validation

### 3. Page serving model

Most CMS routes use server-rendered page components with:

- `export const revalidate = 300`
- cached fetchers via `unstable_cache`

This gives ISR behavior, but on-demand invalidation is only partially implemented.

## Findings

### 1. High: shared layout availability is tightly coupled to the `linksPage` entry

Files:

- `components/layout/layout-shell.tsx`
- `lib/social-links.ts`
- `lib/contentful-links.ts`

Details:

- `LayoutShell` fetches `socialLinks`, `headerSettings`, and `footerSettings` before rendering all non-`/links` pages.
- `getSocialLinks()` throws if `fetchLinksPageFromContentful()` fails.
- `fetchLinksPageFromContentful()` throws when `linksPage` is missing, malformed, or inaccessible.

Impact:

- A failure in `linksPage` can break homepage, about, recipes, shop, services, blog, account/order pages, and any other normal route that renders the standard header/footer.
- This creates a single-content-entry blast radius that is much larger than necessary.

Evidence:

- `components/layout/layout-shell.tsx:21-23`
- `lib/social-links.ts:23-43`
- `lib/contentful-links.ts:118-168`

Recommendation:

- Make social/header/footer fetches resilient with safe fallbacks.
- Treat `linksPage` failure as a header/footer degradation, not as a full-page fatal error.
- Move shared layout data into a hardened wrapper that catches Contentful failures and returns defaults.

### 2. High: blog page reads depend on the Contentful Management API and may mutate Contentful

Files:

- `lib/contentful-blog.ts`

Details:

- Every blog fetch runs `ensureBlogPostContentType()`.
- That function uses the Contentful Management API to check whether `blogPost` exists and may create/publish the content type during a page read.
- Public page delivery is therefore coupled to CMA credentials and permissions.

Impact:

- A normal page request can trigger CMS write logic.
- Blog page availability depends on both Delivery API and Management API configuration.
- This is operationally risky and difficult to reason about in production.
- It violates a clean separation between content serving and content provisioning.

Evidence:

- `lib/contentful-blog.ts:134-198`
- `lib/contentful-blog.ts:200-201`

Recommendation:

- Remove content-type creation from runtime page fetches.
- Provision content types through scripts, migrations, or manual setup only.
- Keep page reads Delivery-API-only.

### 3. High: Contentful env configuration is inconsistent and appears partially miswired

Files:

- `.env`
- `lib/contentful-management.ts`
- `lib/contentful-links.ts`
- `lib/contentful-blog.ts`

Details:

- The code accepts multiple variable names:
  - `Contentful_space_id`
  - `CONTENTFUL_SPACE_ID`
  - `Contentful_environment`
  - `CONTENTFUL_ENVIRONMENT`
  - `CONTENTFUL_DELIVERY_TOKEN`
  - `NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN`
  - `CMA_CONTENTFUL`
  - `CONTENTFUL_MANAGEMENT_TOKEN`
- The current `.env` contains mixed naming conventions and a `NEXT_PUBLIC_CONTENTFUL_SPACE_ID` value that does not match the expected role of a space ID.
- The main runtime fetchers do not use `NEXT_PUBLIC_CONTENTFUL_SPACE_ID`, but at least one script falls back to it.

Impact:

- Different scripts and runtime paths may read different sources of truth.
- Environment setup is harder to validate and easier to break during deployment.
- Public-prefixed Contentful variables increase the chance of accidental exposure patterns.

Evidence:

- `lib/contentful-management.ts:11-16`
- `lib/contentful-links.ts:11-16`
- `lib/contentful-blog.ts:50-58`
- `scripts/contentful/update-homepage-feature-links.mjs:10-12`

Recommendation:

- Standardize on one env naming scheme:
  - `CONTENTFUL_SPACE_ID`
  - `CONTENTFUL_ENVIRONMENT`
  - `CONTENTFUL_DELIVERY_TOKEN`
  - `CONTENTFUL_MANAGEMENT_TOKEN`
- Remove `NEXT_PUBLIC_*` fallbacks for secrets or server-only identifiers.
- Add a startup validation helper for required CMS configuration.

### 4. High: only one revalidation endpoint exists, so most Contentful edits remain stale for up to 5 minutes

Files:

- `app/api/revalidate/header-settings/route.ts`
- `app/page.tsx`
- `app/about/page.tsx`
- `app/services/page.tsx`
- `app/shop/page.tsx`
- `app/recipes/page.tsx`
- `app/blog/page.tsx`
- `app/links/page.tsx`
- `lib/contentful-management.ts`
- `lib/contentful-links.ts`
- `lib/contentful-blog.ts`

Details:

- Most pages rely on `revalidate = 300`.
- Fetchers define tags like `homepage`, `services`, `recipes-page`, `shop-page`, `links-page`, `blog-page`, `header-settings`, `footer-settings`.
- Only `header-settings` has an API route that calls `revalidateTag`.

Impact:

- Content changes are not invalidated immediately for most page types.
- Publish latency will feel inconsistent to editors.
- The tagging architecture exists but is not fully used.

Evidence:

- `app/api/revalidate/header-settings/route.ts:28-31`
- `lib/contentful-management.ts:760-813`
- `lib/contentful-links.ts:174-177`
- `lib/contentful-blog.ts:261-263`

Recommendation:

- Add a general Contentful webhook revalidation route.
- Revalidate tags for homepage, about, services, shop, recipes, blog, links, header, and footer.
- Optionally support path-based revalidation for detail routes.

### 5. Medium: recipe URLs ignore any CMS slug field and are regenerated from title

Files:

- `lib/contentful-management.ts`
- `app/recipes/detail/[slug]/page.tsx`
- `app/recipes/detail/[slug]/full/page.tsx`

Details:

- `mapRecipesOrShopPage()` sets `slug` using `generateSlug(title)`.
- It does not read a dedicated `slug` field from Contentful.
- Detail pages use this generated slug to resolve records.

Impact:

- Renaming a recipe title changes its route.
- Existing links can break unexpectedly.
- Editors do not have independent control over slugs.

Evidence:

- `lib/contentful-management.ts:224-238`
- `app/recipes/detail/[slug]/page.tsx:17-22`
- `app/recipes/detail/[slug]/page.tsx:41-44`
- `app/recipes/detail/[slug]/full/page.tsx:87-88`

Recommendation:

- Add and use a dedicated `slug` field for recipes.
- Fall back to generated slug only for legacy entries during migration.

### 6. Medium: services still rely on legacy string-based image fields instead of linked asset resolution

Files:

- `lib/contentful-management.ts`
- `app/services/page.tsx`
- `app/services/[slug]/page.tsx`
- `app/services/[slug]/book/page.tsx`

Details:

- `mapServiceFields()` reads `imagePath`, `mainImagePath`, and `galleryImagePaths` as strings.
- It does not resolve linked assets the way homepage, recipes, shop, and links do.

Impact:

- Services are modeled differently from the rest of the CMS.
- Editors are more likely to break service imagery if the content model evolves toward assets.
- Migration work already exists in scripts, which suggests this is legacy debt.

Evidence:

- `lib/contentful-management.ts:316-328`
- `app/services/page.tsx:34-39`
- `app/services/[slug]/page.tsx:65-69`
- `app/services/[slug]/book/page.tsx:20-21`

Recommendation:

- Migrate services to linked asset fields.
- Resolve service images through the same helper pattern used elsewhere.

### 7. Medium: service detail rendering can fail hard on missing reviews instead of degrading gracefully

Files:

- `app/services/[slug]/page.tsx`

Details:

- `toServiceDetail()` throws if `reviews` is missing.
- The page already handles “missing service” with `notFound()`, but incomplete review data causes an exception instead.

Impact:

- A partially populated service entry can 500 the page.
- Editors must satisfy a stricter data contract than the UI actually needs.

Evidence:

- `app/services/[slug]/page.tsx:53-55`

Recommendation:

- Make reviews optional in rendering.
- Use a sane empty-state model instead of throwing.

### 8. Medium: the recipe category route is not connected to Contentful and still serves mock data

Files:

- `app/recipes/[category]/page.tsx`

Details:

- This route is a client component with hardcoded mock recipe data.
- It does not fetch Contentful content at all.

Impact:

- The route is inconsistent with the rest of the recipes experience.
- It can show content that disagrees with the CMS-backed recipes pages.
- It creates confusion about which routes are truly driven by Contentful.

Evidence:

- `app/recipes/[category]/page.tsx:18-33`

Recommendation:

- Either connect it to `fetchRecipesPageFromContentful()` and filter by category, or remove/redirect it.

### 9. Medium: blog detail pages fetch the entire blog index payload to render one post

Files:

- `app/blog/[slug]/page.tsx`
- `lib/contentful-blog.ts`

Details:

- Blog detail pages call `fetchBlogPageFromContentful()` and filter in memory.
- There is no dedicated single-post fetch by slug.

Impact:

- Detail page availability depends on the entire blog feed fetch succeeding.
- Fetch cost grows with post count.
- It complicates future metadata generation and targeted revalidation.

Evidence:

- `app/blog/[slug]/page.tsx:15-16`

Recommendation:

- Add a dedicated `fetchBlogPostBySlugFromContentful(slug)` path.
- Keep list and detail fetching separate.

### 10. Medium: social links are cached twice with two separate caching strategies

Files:

- `lib/social-links.ts`
- `lib/contentful-links.ts`

Details:

- `fetchLinksPageFromContentful()` already uses `unstable_cache`.
- `getSocialLinks()` adds an in-memory 5-minute cache on top of that.

Impact:

- Revalidation becomes harder to reason about.
- A future tag revalidation may not flush the in-memory cache immediately.
- Behavior can differ between instances/processes.

Evidence:

- `lib/contentful-links.ts:174-177`
- `lib/social-links.ts:18-37`

Recommendation:

- Remove the ad hoc in-memory cache.
- Let Next caching and tag invalidation be the single caching strategy.

### 11. Medium: runtime Contentful fetchers use broad `any` mapping with little structural validation

Files:

- `lib/contentful-management.ts`
- `lib/contentful-links.ts`
- `lib/contentful-blog.ts`

Details:

- Mapping relies heavily on `as any` and coercion with `String(...)`, `Boolean(...)`, and array casts.
- Some fields have smart normalization helpers, but coverage is inconsistent.

Impact:

- Broken or renamed fields will often fail late or silently degrade to empty strings.
- Editor mistakes are harder to distinguish from true empty content.

Evidence:

- `lib/contentful-management.ts` throughout mapping functions
- `lib/contentful-links.ts:136-163`
- `lib/contentful-blog.ts:219-242`

Recommendation:

- Introduce schema validation or typed mapping guards per content type.
- Log structured validation errors when required fields are missing.

### 12. Low: page-level error handling is inconsistent across Contentful-backed routes

Files:

- `app/recipes/detail/[slug]/page.tsx`
- `app/recipes/detail/[slug]/full/page.tsx`
- `app/services/[slug]/page.tsx`
- `app/blog/[slug]/page.tsx`

Details:

- Some routes use `notFound()`.
- Some return custom “not found” UI instead of true route-level 404 behavior.
- Some throw on missing optional data.

Impact:

- User-facing behavior is inconsistent.
- Search engines and monitoring may see different outcomes for equivalent data failures.

Evidence:

- `app/services/[slug]/page.tsx:81-83`
- `app/blog/[slug]/page.tsx:18-19`
- `app/recipes/detail/[slug]/page.tsx:46-63`
- `app/recipes/detail/[slug]/full/page.tsx:90-105`

Recommendation:

- Standardize on `notFound()` for absent entries.
- Reserve exceptions for infrastructure failures, not empty content.

## Page Coverage Matrix

### Fully Contentful-backed

- `/`
- `/about`
- `/services`
- `/services/[slug]`
- `/services/[slug]/book`
- `/shop`
- `/recipes`
- `/recipes/detail/[slug]`
- `/recipes/detail/[slug]/full`
- `/blog`
- `/blog/[slug]`
- `/links`

### Partially or indirectly Contentful-backed

- Most normal pages via shared `LayoutShell`
- Header/footer/social links on almost all routes

### Not truly Contentful-backed / inconsistent

- `/recipes/[category]` uses mock data
- `app/about/page.tsx.backup` is stale non-Contentful code left in the repo

## Risk Summary

### Availability risk

High

Reasons:

- Shared layout depends on `linksPage`
- blog fetch path depends on CMA
- several routes do not degrade gracefully

### Content freshness risk

High

Reasons:

- only one tag revalidation route exists
- most content depends on a fixed 5-minute ISR window

### Editor experience risk

Medium to High

Reasons:

- recipe slugs derive from title
- services still use legacy string image fields
- inconsistent field coercion and validation

### Configuration drift risk

High

Reasons:

- mixed env names
- mixed public/private fallback behavior
- scripts and runtime do not share one config contract

## Recommended Remediation Plan

### Phase 1: stabilize production reads

1. Remove CMA write/setup logic from `lib/contentful-blog.ts`.
2. Add safe fallbacks in `LayoutShell` for social links, header settings, and footer settings.
3. Standardize `notFound()` and non-fatal empty-state behavior on detail routes.
4. Remove the extra in-memory social-links cache.

### Phase 2: fix correctness and editorial control

1. Add dedicated recipe slug fields and migrate route resolution.
2. Migrate services to linked Contentful assets.
3. Add dedicated blog post fetch by slug.
4. Connect or remove `/recipes/[category]`.

### Phase 3: normalize config and invalidation

1. Standardize env vars and delete legacy aliases.
2. Add a shared Contentful config/client helper.
3. Implement a generic Contentful webhook revalidation route for all tags.
4. Validate required env vars at startup.

### Phase 4: improve maintainability

1. Add typed field validators per content type.
2. Consolidate duplicate Contentful helper logic across the three modules.
3. Add smoke tests for each Contentful-backed route.

## Suggested Immediate Quick Wins

These would give the best reliability improvement with the least code churn:

1. Make `LayoutShell` resilient when `linksPage` fails.
2. Stop calling the Contentful Management API during blog page reads.
3. Add a webhook revalidation route for all page tags.
4. Stop deriving recipe slugs solely from title.

## Final Assessment

The app is genuinely connected to Contentful across most of the public site, but the integration is still in a transitional state. It mixes stable CMS-backed rendering with legacy field assumptions, partial revalidation, duplicated config patterns, and one especially risky blog read path that can mutate the CMS.

In short:

- Contentful is powering the site.
- The site is not yet hardened around Contentful.
- The biggest risks are shared-layout coupling, stale content, runtime CMS mutation, and configuration drift.

This is fixable without a rewrite, but it needs a focused hardening pass rather than one-off tweaks.
