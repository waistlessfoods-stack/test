# Recipe Print / Save PDF QA — September 4, 2026

Playwright verification ran against a local production build using the protected
admin paid-recipe preview.

## Results

- Admin authentication returned HTTP 200.
- The paid-recipe preview returned HTTP 200.
- The Print / Save PDF control appeared and invoked the browser print action.
- The print layout uses one hero image and omits repeated ingredient, tool, and
  instruction photos to conserve paper.
- Ingredients and tools render in a balanced two-column layout.
- The recipe content has consistent 0.25-inch inner padding on both sides, in
  addition to the printer page margins.
- The tested short recipe fits on one Letter-sized PDF page.
- The mobile page had no horizontal overflow at 390 px.
- Print mode displayed the WaistLess Foods branding, ingredients, instructions,
  and personal-use notice.
- Print mode removed site navigation, the site footer, admin-preview controls,
  interactive recipe controls, and the temporary public-site preview gate.
- Admin preview pages still require a valid server-side admin session; a
  signed-out request rendered the admin login without recipe content.
- A signed-out visitor requesting the paid full-recipe URL was redirected to the
  paid recipe detail page, so the full content remained protected.
- No unexpected browser console errors were recorded.

## Screenshots

- [Desktop paid-recipe preview](paid-recipe-desktop.png)
- [Mobile paid-recipe preview](paid-recipe-mobile.png)
- [Print layout](paid-recipe-print-layout.png)
- [Actual Letter-size PDF](paid-recipe-print-layout.pdf)

## Existing Content Note

The screenshots reproduce the currently published Contentful record. Its title
and detailed recipe content are mismatched. That source-data issue is separate
from the print layout.
