# SEO Roadmap

Date: 2026-06-19
Project: `waitslessfood.com`

## Goal

Keep the public site crawlable, canonical, and metadata-complete while keeping private, gated, transactional, and admin routes out of search.

## Current State

SEO foundation is largely complete in app code.

Already in place:

- Global metadata in [app/layout.tsx](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/app/layout.tsx)
- Sitemap in [app/sitemap.ts](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/app/sitemap.ts)
- Robots policy in [app/robots.ts](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/app/robots.ts)
- Route-level metadata, canonicals, Open Graph, and Twitter metadata across the main public routes
- `noindex` coverage for auth, account, admin, orders, test, and legacy surfaces
- Structured data for homepage, service detail, recipe detail, recipe full, and blog detail
- Breadcrumb schema for service, recipe, and blog detail pages
- Public SEO routes accessible without the `SiteAccessGate` password modal
- `/blogs` permanent redirect to `/blog`
- Blog detail fetch by slug instead of filtering the full post list in memory
- Recipe detail support for dedicated CMS slugs with legacy title-slug fallback and redirect behavior
- Legacy `/recipes/[category]` retired into redirect behavior
- Filtered recipe states canonicalized to `/recipes` and marked `noindex` when appropriate
- Branded default Open Graph and Twitter image fallback
- Internal crawl-path improvements on homepage, service detail, and blog detail pages
- Initial image-performance cleanup on homepage, shop, and recipes pages
- Search Console handoff checklist in [docs/search-console-checklist.md](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/docs/search-console-checklist.md)

## Public SEO Surface

Intended indexable routes:

- `/`
- `/about`
- `/services`
- `/services/[slug]`
- `/shop`
- `/recipes`
- `/recipes/detail/[slug]`
- `/blog`
- `/blog/[slug]`
- `/links`

Intended non-indexable routes:

- `/admin/*`
- `/account`
- `/orders`
- `/signin`
- `/signup`
- `/sso-callback/*`
- `/stripe-test`
- `/api/*`
- `/recipes/detail/[slug]/full` for paid content
- `/blogs` redirect alias
- legacy `/recipes/[category]`

## Remaining Actions

Only three meaningful SEO tasks remain:

1. Submit `/sitemap.xml` in Google Search Console.
2. Verify live indexation, canonicals, redirects, and exclusions after deployment.

## Open Blockers

### Recipe slug migration

App code and Contentful content are now aligned on dedicated CMS recipe slugs.

Notes:

- Dry-run succeeded.
- The live migration succeeded.
- The `slug` field was added to the recipe content type.
- 6 recipe entries were populated successfully.
- Result: `Updated=6 Skipped=0 Errors=0`

### Search Console rollout

After the slug migration and deploy:

1. Submit `https://YOUR_DOMAIN/sitemap.xml`
2. Inspect key public URLs
3. Confirm excluded routes remain excluded
4. Check redirects and canonical selection
5. Monitor 404s, coverage, and duplicate-canonical issues

Use [docs/search-console-checklist.md](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/docs/search-console-checklist.md).

## Quick Checklist

- [x] Define the intended public SEO surface
- [x] Remove password-gate blocking from intended crawlable routes
- [x] Add page-level metadata across public routes
- [x] Add canonical URLs across public routes
- [x] Add `noindex` coverage for private and legacy routes
- [x] Add route-specific Open Graph and Twitter metadata
- [x] Add structured data and breadcrumbs where relevant
- [x] Add redirect normalization, including `/blogs -> /blog`
- [x] Add staging/non-production `noindex` protection
- [x] Retire legacy `/recipes/[category]` behavior
- [x] Improve default OG image strategy
- [x] Populate Contentful recipe slugs
- [ ] Submit sitemap in Google Search Console
- [ ] Monitor live indexing and crawl health

## Success Criteria

- Public marketing and content routes are crawlable without gated UX interference.
- Every intended indexable route has unique metadata and a canonical URL.
- Private, transactional, admin, and legacy routes are excluded consistently.
- Recipe detail routes resolve to stable CMS-driven slugs.
- Search Console accepts the sitemap and shows low duplication noise.

## Post-Launch Validation

Once the slug migration, deploy, and Search Console submission are complete, validate the rollout in this order:

1. Confirm `/robots.txt` and `/sitemap.xml` load correctly in production.
2. Inspect `/`, `/services`, `/recipes`, `/shop`, `/blog`, and one detail page from each content type.
3. Confirm paid `/recipes/detail/[slug]/full` routes remain non-indexed.
4. Confirm `/blogs` and legacy recipe category paths redirect correctly.
5. Review Search Console coverage after Google recrawls.

## Monitoring Targets

Track these signals for the first few weeks after rollout:

- Indexed page count for the intended public surface
- Excluded page count for auth, admin, account, orders, and paid full recipe routes
- Canonical mismatches, especially on filtered recipe states
- 404s caused by old recipe title-based URLs
- Soft-404 or duplicate-content warnings on thin or redirected routes

## Phase 2 SEO Opportunities

After the current rollout is stable, the next meaningful SEO improvements are:

### 1. CMS-driven meta descriptions

Add or refine description fields in Contentful so recipes, services, and blog posts can ship stronger page-specific metadata without code edits.

### 2. Stronger internal linking

Expand cross-linking between:

- services and related blog posts
- recipes and shop
- blog posts and relevant service or recipe pages

### 3. Richer social preview images

Move from the branded default fallback toward stronger page-level OG images, especially for:

- service detail pages
- recipe detail pages
- blog posts

### 4. Performance measurement pass

Run a production performance review focused on:

- homepage Largest Contentful Paint
- recipe and blog detail image loading
- layout shift around carousels and media
- unnecessary script weight on public pages

### 5. Content expansion strategy

Once the technical SEO base is stable, growth depends more on content depth than metadata work alone. Likely next levers:

- more service landing pages if service offerings expand
- more blog coverage around food, nutrition, and chef expertise
- clearer recipe category landing-page strategy if category pages are ever rebuilt intentionally

## Ownership Notes

This roadmap is a handoff document, not a runtime dependency.

Operational follow-up needed outside app code:

- production deploy after the recipe slug migration
- Google Search Console access for sitemap submission and live inspection

## Execution Plan

### Phase 1: Rollout Completion

Goal:

- Finish the remaining foundation tasks so the current technical SEO work is fully live and verified.

Actions:

1. Obtain a valid Contentful CMA token.
2. Run `pnpm contentful:add-recipe-slugs -- --dry-run`.
3. Run `pnpm contentful:add-recipe-slugs`.
4. Deploy production.
5. Submit `/sitemap.xml` in Google Search Console.
6. Complete the checks in [docs/search-console-checklist.md](/Volumes/samsung_980_500gb/code/macbook-m1/waitslessfood.com/docs/search-console-checklist.md).

Exit criteria:

- Existing recipe entries have populated CMS slugs.
- Production sitemap is submitted successfully.
- No major canonical, redirect, or exclusion regressions appear in the first validation pass.

### Phase 2: Stabilization

Goal:

- Confirm the new SEO foundation behaves correctly under real crawl conditions.

Actions:

1. Review Search Console coverage after recrawl.
2. Check for unexpected excluded or duplicate pages.
3. Check for 404s caused by legacy URLs.
4. Verify canonical behavior on recipes filtering states.
5. Spot-check structured data results on public detail pages.

Exit criteria:

- Intended public routes are indexable.
- Intended private and legacy routes stay excluded.
- Canonical behavior is consistent.
- No material redirect or slug-migration breakage remains.

### Phase 3: Content and CTR Improvements

Goal:

- Improve search appearance and relevance now that the crawl/index foundation is stable.

Actions:

1. Add richer CMS-driven descriptions for services, recipes, and blog posts.
2. Improve page-specific social preview images.
3. Expand internal linking between services, recipes, shop, and blog content.
4. Reassess whether `/links` should stay indexable long-term.

Exit criteria:

- Higher-quality snippets and social previews on public routes.
- Better internal crawl paths between commercial and editorial pages.
- Cleaner intent separation between indexable and utility pages.

### Phase 4: Growth SEO

Goal:

- Use content strategy and landing-page depth to grow discoverability beyond the technical foundation.

Actions:

1. Add new service landing pages if offerings expand.
2. Publish more blog content around chef expertise, nutrition, and recipe intent.
3. Decide whether recipe-category landing pages should be rebuilt intentionally from real data.
4. Review whether additional schema opportunities should be added for richer results.

Exit criteria:

- The site has a clearer path for topic expansion.
- SEO work shifts from technical cleanup to sustainable content growth.

## Suggested Owners

- Engineering:
  - Contentful slug migration
  - deploy
  - production validation for metadata, canonicals, redirects, and structured data

- Marketing or content:
  - meta description quality
  - social preview image quality
  - blog and landing-page expansion

- Operations or whoever has platform access:
  - Google Search Console submission
  - ownership verification
  - post-launch monitoring

## Task Board

| Task | Owner | Status | Dependency |
| --- | --- | --- | --- |
| Obtain valid Contentful CMA token | Operations | Complete | Contentful admin access |
| Run `pnpm contentful:add-recipe-slugs -- --dry-run` | Engineering | Complete | Valid CMA token |
| Run `pnpm contentful:add-recipe-slugs` | Engineering | Complete | Successful dry-run |
| Deploy production after slug migration | Engineering | Pending | Slug migration complete |
| Submit `/sitemap.xml` in Google Search Console | Operations | Pending | Production deploy |
| Complete Search Console rollout checklist | Engineering + Operations | Pending | Sitemap submitted |
| Review initial coverage and canonical behavior | Operations | Pending | Google recrawl |
| Investigate 404s or duplicate-canonical issues | Engineering | Pending | Search Console findings |
| Add CMS-driven meta description improvements | Marketing + Engineering | Pending | Phase 1 stable |
| Improve page-level social preview images | Marketing + Engineering | Pending | Phase 1 stable |
| Expand internal linking between services, recipes, shop, and blog | Marketing + Engineering | Pending | Phase 1 stable |
| Decide long-term indexation policy for `/links` | Marketing | Pending | Phase 1 stable |
| Plan new service and content landing-page expansion | Marketing | Pending | Phase 2 stable |
