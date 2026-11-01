# Recipe administration verification - November 1, 2026

`node scripts/qa-recipe-administration.mjs` performs read-only checks against the rebuilt local production app and current published Contentful content. It uses a signed local admin session. No real account, order, CMS recipe, publication, or editing permission is changed.

The administrator sees Contentful edit links, complete paid recipe previews, and the full storefront recipe without placing an order. A 390px full recipe fits the viewport. Anonymous full-page access redirects to the purchase preview; anonymous admin access presents the sign-in gate. Recipe/shop public HTML excludes protected recipe field names. Fake-marker serialization and purchaser/non-purchaser access are additionally verified in `scripts/test-recipe-administration.mjs`.

- [Results](results.json).
- [Administrator recipe list](admin-recipes-desktop.png).
- [Administrator full recipe on mobile](admin-full-recipe-mobile.png).
- [Anonymous purchase preview](public-paid-recipe-preview.png).

Two early harness expectations were corrected: Next/admin layout can return a streamed HTTP 200 sign-in gate rather than a 307, and the browser must verify rendered access boundaries. The final browser run passed. Amber's own account/CMS editing walkthrough remains pending.
