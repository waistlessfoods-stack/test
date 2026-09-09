# Cooking classes in Shop — September 9, 2026

Implemented a distinct class-shopping experience using the existing Shop catalogue, cart, checkout, and public-class launch flag. No separate Events system or Calendar synchronization was added.

## Experience

- All / Recipes / Cooking classes filters, including the existing `/shop?category=cooking-classes` link. Class filtering works even when a Cooking Classes CMS category exists.
- A dedicated warm-cream class section, larger two-column cards, public-class badges, date/time, duration, total class capacity, per-seat pricing, and View class links.
- Recipe cards remain in their own section. Classes never receive a recipe “unlocked” badge in Shop.
- Class detail pages use a dedicated layout and Add seat to cart action. Existing cart quantity controls and server checkout validation remain in use. Buying a class does not redirect to an unlocked recipe.
- Missing dates display “Schedule to be announced”; unknown optional metadata is omitted. Dates remain as supplied by the CMS, without guessing a timezone. Capacity is labelled “Up to N participants,” not seats remaining.
- When enrollment is disabled or there are no published classes, visitors see the unavailable message and a private-class service link. Search with no matches has its own reset action.

## Content and release

The existing catalogue identifies classes through its Cooking Classes category or a title containing “cooking class.” Keep using that existing classification. This task did not change the Contentful schema, publish sample classes, or alter CMS records. Before enrollment opens, review the actual class title, price, imagery, description, date/time/timezone, duration, and capacity. The screenshots contain synthetic QA classes only.

`PUBLIC_COOKING_CLASSES_ENABLED` is unchanged. Server-side Shop/detail/checkout restrictions and the general preview gate are retained. These changes must be pushed and deployed; public enrollment still requires approval and real class content.

## Verification

- Production build and TypeScript passed. The first build failed to download the existing Google Fonts; subsequent builds passed without changing font configuration.
- Targeted ESLint and `git diff --check` passed.
- `node scripts/qa-shop-classes.mjs`: six catalogue/filter assertions plus Playwright interactions covering mixed content, product types, date search, no-results/reset, category deep links, 320/390/768px layouts, unavailable classes, detail navigation, actual cart insertion, missing metadata, and browser runtime errors.
- The isolated harness renders the actual Shop/detail/filter/cart components with synthetic data and the app stylesheet. It adapts Next image/navigation and unauthenticated session hooks; it is not a real checkout or authenticated purchase test. Screenshots use fallback fonts and local sample photographs, without storefront chrome.
- `node scripts/qa-shop-classes.mjs --local-production` additionally checked the real production build on localhost:3010: the class deep link, unavailable state, and preview gate. Only the dedicated QA browser session unlocked the gate. No site setting changed. Header visibility was suppressed only for the focused section screenshot.
- No email, payment, CMS write, customer record change, or Calendar mutation occurred.
- The local server also logged Clerk session-refresh warnings and a tax-settings database fallback. The storefront checks passed, but authenticated checkout was not retested or certified by this UI task; review those environment warnings before an end-to-end payment test.

Screenshots:

- [Class cards — desktop](audit-screenshots/shop-classes-2026-09-09/classes-desktop.png)
- [Class cards — mobile](audit-screenshots/shop-classes-2026-09-09/classes-mobile.png)
- [Class detail — desktop](audit-screenshots/shop-classes-2026-09-09/class-detail-desktop.png)
- [Class detail — mobile](audit-screenshots/shop-classes-2026-09-09/class-detail-mobile.png)
- [Actual local production unavailable state](audit-screenshots/shop-classes-2026-09-09/local-production-unavailable.png)
