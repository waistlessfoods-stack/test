# Amber Blog and “Chef’s Guide to Herbs” Implementation Tracker

Last updated: 2026-07-25  
Request owner: Amber  
Implementation owner: Zul  
Primary content source: [`public/chefs_guide_to_herbs.pdf`](../public/chefs_guide_to_herbs.pdf)

## Purpose

This document turns Amber’s blog feedback and the attached herb article into a concrete implementation checklist. Keep it updated as work is completed so it remains the source of truth for the change.

## Status Legend

- `[x]` Complete
- `[ ]` Not started
- `[-]` In progress
- `[!]` Blocked or needs a decision
- `[N/A]` No developer action required

## Current-State Audit

### Repository

- [x] The PDF is present and readable at `public/chefs_guide_to_herbs.pdf`.
- [x] The PDF contains 3 pages and approximately 1,023 words.
- [x] The existing rich-text renderer already supports the three-column table format used by the previous storage-guide article.
- [x] Blog categories are read from the Contentful `category` field and automatically populate the category filter.
- [x] The audit found blog-card descriptions cut off with a three-line `WebkitLineClamp`; the clamp has now been removed.
- [x] The audit found the answer heading hard-coded as `Trivia Answer: B — Did you guess correctly?`; it is now driven by Contentful with a neutral fallback.
- [x] The audit found a normal `|` text character between “Something to Chew On” and “Trivia”; it is now a taller decorative divider.
- [x] The `slug` is used as the public URL identifier in `/blog/[slug]`.

### Published Contentful Data

The Contentful delivery API currently returns three published `blogPost` entries:

| Article | Current category | Current slug | Content status |
| --- | --- | --- | --- |
| The Chef’s Guide to Herbs: How to Layer Flavors & Elevate Everyday Meals | Chef Inspiration | `the-chefs-guide-to-herbs` | Complete and published; sort order 1 |
| Zero Waste Kitchen: A Beginner’s Guide | Sustainable Cooking & Kitchen Tips | `zero-waste-kitchen-guide` | Complete and published; sort order 2 |
| The 3 Knives Every Home Cook Actually Needs | Culinary Skills & Techniques | `the-3-knives-every-home-cook-actually-needs` | Complete and published; sort order 3 |

The existing herb entry `65WfAMZYisXg3EU1F7nj3h` was updated in place. The delivery API returns exactly three blog entries, one herb entry at the final slug, and zero entries at the legacy slug.

### Current CMS Access

- [x] Read-only Contentful delivery access works.
- [x] Contentful management access is restored.
- [x] Both `CMA_CONTENTFUL` and `CONTENTFUL_MANAGEMENT_TOKEN` were tested independently and are valid.
- [x] A read-only management audit was completed before the CMS changes.
- [x] All CMS writes were fetched back independently through the delivery API after publication.

Do not record any Contentful write as complete until it has been fetched back from the delivery API after publication.

## Implementation Progress — 2026-07-25

Completed locally:

- The website maps an optional `triviaAnswerHeading` field and no longer hard-codes answer `B`.
- Legacy answer headings embedded in rich text are used as a compatibility fallback and removed from the rendered answer body to avoid duplicate headings.
- Legacy trivia wrapper copy embedded in rich text is removed before rendering to avoid duplicate “Something to Chew On” sections.
- The known `Chef-Inspiration` value is normalized to Amber’s approved `Chef Inspiration` spelling.
- Unknown/missing categories fall back to `Chef Inspiration` instead of the obsolete `Healthy Living`.
- The final herb URL temporarily falls back to the legacy-slug Contentful entry, preventing a broken link if code and CMS changes are deployed at different times.
- Blog-card excerpts display in full.
- The trivia separator is a decorative vertical element that extends beyond the text height.
- `/blog/5-easy-meal-prep-ideas` permanently redirects to `/blog/the-chefs-guide-to-herbs`.
- Repeat-safe schema and content scripts are ready under `scripts/contentful/`.
- The complete herb article rich text, including 6 woody-herb rows and 7 tender-herb rows, passes Contentful rich-text validation.
- Targeted ESLint, TypeScript, and the production build pass.
- Desktop/mobile browser evidence is saved in `docs/audit-screenshots/amber-blog-herbs-2026-07-25/`.

Completed in Contentful:

- Published the approved category validation and editor controls.
- Published editable answer headings for all three existing posts.
- Updated and published the existing herb placeholder without creating a duplicate.
- Verified the final entry through the delivery API.
- Verified the final route, metadata, JSON-LD, answer reveal, and both article tables on desktop and mobile.

### CMS Completion Runbook

Executed successfully after management access was restored:

```powershell
node scripts/contentful/migrate-blog-editorial-fields.mjs --dry-run
node scripts/contentful/migrate-blog-editorial-fields.mjs
node scripts/contentful/migrate-blog-editorial-fields.mjs --dry-run

node scripts/contentful/publish-chefs-guide-to-herbs.mjs --dry-run
node scripts/contentful/publish-chefs-guide-to-herbs.mjs
node scripts/contentful/publish-chefs-guide-to-herbs.mjs --dry-run
```

The second dry run for each script reported no pending changes. The publication script verified the final herb entry through the delivery API on its first attempt.

After publication, trigger the existing Contentful revalidation webhook for content type `blogPost`, or allow the 300-second cache window to expire before final browser verification.

## Agreed Content and Editorial Decisions

### New/Updated Herb Article

Use the following Contentful values:

| Field | Required value |
| --- | --- |
| Title | `The Chef’s Guide to Herbs: How to Layer Flavors & Elevate Everyday Meals` |
| Slug | `the-chefs-guide-to-herbs` |
| Category | `Chef Inspiration` |
| Read Time Minutes | `5` |
| Excerpt | `Learn when to add woody and tender herbs, how to layer their flavors, and how to turn leftover herbs into a vibrant, waste-reducing herb oil.` |
| Sort Order | `1` |
| Cover Image | Keep the current image until Amber replaces it |

The PDF calls this part of the “Chef-Inspiration Series,” but the Contentful category must use Amber’s exact category spelling: `Chef Inspiration` without a hyphen.

### Trivia Copy Override

The PDF says:

> Before we dive into the flavor, let’s test your Culinary IQ!

Per Amber’s instruction, disregard that sentence and use:

> Before you read on, let’s test your Food IQ!

Keep the PDF’s trivia question and choices:

> You’re finishing a delicate summer pasta dish and want to add fresh basil. Which common preparation method actually causes delicate herbs like basil and mint to bruise, oxidize, and turn dark brown on your cutting board within minutes?

- A) Tearing the leaves by hand instead of cutting
- B) Dull knife blades or a saw-like dragging motion across the leaves
- C) Chiffonading the leaves while they are slightly damp
- D) Storing the cut herbs in cold water before garnishing

Recommended editable answer heading:

> Trivia Answer: B — Did you guess correctly?

Recommended answer body:

> Dull knife blades! When you slice herbs with a dull knife—or drag the blade back and forth in a saw-like motion—you crush the plant cells instead of cleanly severing them. This releases internal enzymes, causing them to react with oxygen and turn black or dark brown on the cutting board.

> **Chef’s Pro Tip:** Always use your sharpest chef’s knife. Roll soft leaves like basil tightly for a chiffonade, then make one clean, single-pass slice through the herbs.

### Article Body Structure

Build the Contentful `Article Body` rich-text field in this order:

1. Introduction
2. The Core Technique: Hard vs. Soft Herbs
   - Woody & Hard Herbs (The Infusers)
   - Tender & Soft Herbs (The Finishers)
3. The Complete Herb Profile & Flavor Matrix
   - Woody & Hard Herbs (Add Early)
   - Tender & Soft Herbs (Add Late / Finishing)
4. Chef’s Secret Technique: The Blanched Herb Oil
5. The Takeaway

Clean obvious PDF extraction/layout artifacts while preserving Amber’s meaning:

- Change `When to Add:Early` to `When to Add: Early`.
- Change `When to Add:At the very end` to `When to Add: At the very end`.
- Preserve curly apostrophes and em dashes consistently.
- Do not paste PDF page headers, page numbers, emoji icons, or editorial labels into the body unless they are part of the web component.

### Herb Table Content

Render these as two Contentful rich-text tables using the existing table style in `components/blog-rich-text.tsx`.

#### Woody & Hard Herbs (Add Early)

| Herb | Flavor Profile | Best Culinary Role |
| --- | --- | --- |
| Thyme | Earthy, subtle mint and lemon undertones | A universal workhorse. Infuses deep savory richness into pan juices, roasted roots, and braises. |
| Rosemary | Piney, resinous, woodsy, and bold | Extremely potent. Excellent for high-heat roasting, infused fats, and hearty meats. |
| Sage | Savory, peppery, with warm, eucalyptus notes | Loves rich, buttery dishes, poultry, brown butter sauces, and autumnal root veggies. |
| Oregano | Robust, pungent, slightly bitter, and peppery | Core flavor in Mediterranean and Latin dishes; thrives in tomato sauces and marinades. |
| Bay Leaves | Subtle floral, herbal, and tea-like aroma | Slow-release flavor enhancer. Must be simmered in stews, stocks, braises, and grains. |
| Winter Savory | Peppery, piney, and intensely savory | Stronger than summer savory; ideal for heavy bean dishes, lentil soups, and gamey meats. |

#### Tender & Soft Herbs (Add Late / Finishing)

| Herb | Flavor Profile | Best Culinary Role |
| --- | --- | --- |
| Basil | Sweet, pepper-forward, subtle clove notes | Pairs effortlessly with tomatoes, garlic, and summer produce. Best added raw or as a warm finish. |
| Cilantro | Citrusy, pungent, sharp, and clean | Cuts through rich, fatty, or spicy foods like a charm. Always use raw as a finishing burst. |
| Flat-Leaf Parsley | Grassy, slightly bitter, fresh, and bright | The ultimate balancing act. Acts as a natural palate cleanser to cut through heavy cream or butter. |
| Mint | Cooling, sweet, sharp, and aromatic | Cuts heaviness in roasted meats such as lamb, and elevates grain salads, cool yogurt dips, and fruit dressings. |
| Dill | Feathery, anise-like, citrusy, and tangy | Perfect partner for fish, pickles, potato salads, acidic dressings, and sour cream bases. |
| Chives | Mild onion, delicate garlic sweetness | Provides a subtle onion aroma without the harsh bite of raw onions. Ideal garnish for eggs, potatoes, and soups. |
| Tarragon | Distinct licorice/anise, bittersweet, elegant | Classic French herb; shines in poultry dishes, cream sauces, egg preparations, and vinaigrettes. |

## Category Rules

Only these category values should be available in Contentful:

1. `Chef Inspiration`
2. `Culinary Skills & Techniques`
3. `Sustainable Cooking & Kitchen Tips`

Recommended implementation:

- Add an allowed-values validation to the Contentful `blogPost.category` Symbol field.
- Correct the herb entry from `Chef-Inspiration` to `Chef Inspiration`.
- Keep the current knife and zero-waste categories; they already match Amber’s list.
- Update the code fallback in `lib/contentful-blog.ts` so it no longer introduces the obsolete `Healthy Living` category.
- Confirm the blog filter displays exactly the three categories once the updated entry is published.

## Slug Guidance for Amber

A slug is the URL-safe identifier after `/blog/`.

Example:

```text
Title: The Chef’s Guide to Herbs
Slug:  the-chefs-guide-to-herbs
URL:   /blog/the-chefs-guide-to-herbs
```

Slug rules:

- Use lowercase letters and hyphens.
- Do not include apostrophes, punctuation, or spaces.
- Keep it short, descriptive, and unique.
- Avoid changing it after publication because existing links will stop working unless a redirect is added.

Recommended Contentful help text:

> Used in the public blog URL. Use lowercase words separated by hyphens, and avoid changing this value after publication.

Because the published placeholder currently uses `5-easy-meal-prep-ideas`, add a permanent redirect:

```text
/blog/5-easy-meal-prep-ideas
→ /blog/the-chefs-guide-to-herbs
```

## UI Decisions

### “Something to Chew On | Trivia” Divider

Interpret Amber’s “division line” as the vertical separator between the two phrases, not the turquoise accent on the left side of the card.

Implementation:

- Replace the literal `|` character with a decorative element.
- Make the divider extend slightly above and below the text.
- Hide the decorative line from screen readers.
- Preserve a natural accessible heading such as `Something to Chew On — Trivia`.
- Verify the heading wraps cleanly on small screens.

If Amber’s red markup refers to another line, confirm against her annotated screenshot before closing this item.

### Editable Answer Reveal

Add an optional short-text field to `blogPost`:

```text
Field name: Trivia Answer Heading
Field ID: triviaAnswerHeading
Type: Short text / Symbol
```

Implementation behavior:

- Render `triviaAnswerHeading` when populated.
- Use the neutral fallback `Trivia Answer — Did you guess correctly?`.
- Remove the hard-coded `B` from the React component.
- Put the correct answer letter/text in Contentful for each article.

This lets Amber edit each answer heading and prevents future articles from incorrectly showing “B.”

### Full Blog-Card Descriptions

Recommendation: display the complete Contentful excerpt.

Reasons:

- Amber writes each excerpt as a complete sentence.
- The current three-line clamp cuts some sentences mid-thought.
- The cards already stretch to the row height, so small excerpt-length differences are acceptable.

Implementation:

- Remove the three-line `WebkitLineClamp` styles from `app/blog/blog-page-client.tsx`.
- Keep excerpts editorially concise, ideally one sentence and roughly 120–180 characters.
- Verify that unusually long excerpts do not break the desktop or mobile grid.

## Implementation Checklist

### Phase 1 — CMS Schema and Editorial Controls

- [x] `CMS-01` Refreshed the Contentful management token and confirmed read/write access.
- [x] `CMS-02` Published the three allowed category values on the `category` field validation.
- [x] `CMS-03` Published help text and the slug editor control for the `slug` field.
- [x] `CMS-04` Added and published the optional `triviaAnswerHeading` field.
- [x] `CMS-05` Published `blogPost` content type version 8 and independently fetched the resulting schema.
- [x] `CMS-06` Created the idempotent migration script at `scripts/contentful/migrate-blog-editorial-fields.mjs`.

Acceptance criteria:

- Editors can choose only the three approved categories.
- Editors understand how the slug affects the URL.
- Editors can set a unique answer heading for every post.
- Running the migration more than once does not duplicate fields or corrupt content.

### Phase 2 — Herb Article Content

- [x] `CONTENT-01` Updated existing entry `65WfAMZYisXg3EU1F7nj3h`; no duplicate was created.
- [x] `CONTENT-02` Published slug `the-chefs-guide-to-herbs`; the delivery API returns zero entries at the legacy slug.
- [x] `CONTENT-03` Published category `Chef Inspiration`.
- [x] `CONTENT-04` Published the approved herb excerpt.
- [x] `CONTENT-05` Published read time `5`.
- [x] `CONTENT-06` Use newest-first placement: herb article `1`, zero-waste article `2`, and knives article `3`.
- [x] `CONTENT-07` Published `Trivia Question` using the Food IQ override in this document.
- [x] `CONTENT-08` Published the complete article body with 2 tables, 6 woody-herb rows, and 7 tender-herb rows.
- [x] `CONTENT-09` Published `Trivia Answer: B — Did you guess correctly?`.
- [x] `CONTENT-10` Published the dull-knife explanation and chef’s pro tip.
- [x] `CONTENT-11` Validated all three rich-text documents with `node scripts/contentful/publish-chefs-guide-to-herbs.mjs --validate-only`.
- [x] `CONTENT-12` Published the entry and verified it through the delivery API on the first attempt.
- [x] `CONTENT-13` Created the idempotent content script at `scripts/contentful/publish-chefs-guide-to-herbs.mjs`.

Acceptance criteria:

- `/blog/the-chefs-guide-to-herbs` loads the complete article.
- The old meal-prep slug and excerpt are no longer shown as herb article metadata.
- Both tables match the previous article’s table styling and scroll horizontally on narrow screens.
- The trivia introduction uses `Before you read on, let’s test your Food IQ!`.
- The PDF’s “Culinary IQ” introduction is not displayed.

### Phase 3 — Website UI

- [x] `UI-01` Extended `BlogPost` in `lib/contentful-blog.ts` with `triviaAnswerHeading`.
- [x] `UI-02` Mapped the new Contentful field in `mapEntryToBlogPost`.
- [x] `UI-03` Removed the hard-coded answer `B` from `app/blog/[slug]/page.tsx`.
- [x] `UI-04` Replaced the trivia heading’s literal pipe with a longer decorative divider.
- [x] `UI-05` Removed blog-card excerpt line clamping.
- [x] `UI-06` Replaced the obsolete `Healthy Living` category fallback and normalized the known hyphenated legacy value.
- [x] `UI-07` Added the old-to-new herb slug redirect in `next.config.ts`.
- [x] `UI-08` Confirmed `blogPost` maps to the `blog-page` revalidation tag; the existing Contentful webhook can invalidate it, with the existing 300-second fallback still in place.

Acceptance criteria:

- Different articles can display different answer headings.
- No answer letter is hard-coded in the page component.
- The trivia divider extends slightly above and below the words.
- Full excerpt sentences display on the blog listing.
- The category filter contains only Amber’s three categories.
- The old herb placeholder URL redirects permanently to the final URL.

### Phase 4 — Verification

- [x] `QA-01` Targeted ESLint and `pnpm exec tsc --noEmit` pass.
- [x] `QA-02` `pnpm build` passes with Next.js 16.1.6.
- [x] `QA-03` Verified `/blog` on desktop and mobile.
- [x] `QA-04` Verified the complete `/blog/the-chefs-guide-to-herbs` article on desktop and mobile.
- [x] `QA-05` The old slug returns a `308` redirect to `/blog/the-chefs-guide-to-herbs`.
- [x] `QA-06` The category selector displays the three approved categories and no `Chef-Inspiration` legacy label.
- [x] `QA-07` Both herb tables are keyboard focusable, horizontally scrollable at 390px, and do not cause document-level horizontal overflow.
- [x] `QA-08` Computed `webkitLineClamp` is `none` for all three cards, and desktop/mobile screenshots show the complete excerpts.
- [x] `QA-09` The trivia divider exceeds the adjacent “Trivia” word height on desktop (`40.5px > 37.5px`) and mobile (`32.39px > 30px`).
- [x] `QA-10` Verified answer headings for all posts: herbs `B`, zero-waste `B`, and knives `A`.
- [x] `QA-11` Verified final title, excerpt, canonical URL, Open Graph data, and BlogPosting JSON-LD title, description, category, and URL.
- [x] `QA-12` Screenshots and machine-readable results are saved in `docs/audit-screenshots/amber-blog-herbs-2026-07-25/`.

## Photo Ownership

- `[N/A]` Amber said she will update the photos.
- Developer action is limited to confirming that the current cover-image field continues to render and that a replacement Contentful asset will work without code changes.
- Optional editorial cleanup: the current herb cover asset has the title `breakfast` and no description. Amber should provide a meaningful asset title/description when replacing it.

## Files Expected to Change

| File | Expected change |
| --- | --- |
| `lib/contentful-blog.ts` | Map `triviaAnswerHeading`; update category fallback |
| `app/blog/[slug]/page.tsx` | Dynamic answer heading; improved trivia divider |
| `app/blog/blog-page-client.tsx` | Display complete excerpts |
| `next.config.ts` | Redirect the incorrect placeholder slug |
| `scripts/contentful/migrate-blog-editorial-fields.mjs` | Category validation, slug help text, answer-heading field |
| `scripts/contentful/publish-chefs-guide-to-herbs.mjs` | Idempotently populate and publish the herb article |
| `docs/amber-blog-herbs-implementation-tracker.md` | Track status and verification evidence |
| `docs/audit-screenshots/amber-blog-herbs-2026-07-25/` | Desktop/mobile screenshots and browser-test results |

## Implementation Log

| Date | Item | Result | Evidence/notes |
| --- | --- | --- | --- |
| 2026-07-25 | Initial audit | Complete | PDF extracted; repository and published delivery data inspected |
| 2026-07-25 | Contentful management check | Blocked | Local management token returned `401 AccessTokenInvalid`; delivery API remained readable |
| 2026-07-25 | Contentful credential recheck | Still blocked | Tested `CMA_CONTENTFUL` and `CONTENTFUL_MANAGEMENT_TOKEN` independently; both are identical and invalid, and no connected Contentful write tool is available |
| 2026-07-25 | Final blocker audit | Blocked | Third consecutive goal audit confirmed both configured management-token variables still return `AccessTokenInvalid`; user/external credential replacement is required |
| 2026-07-25 | Website implementation | Complete locally | Dynamic answer headings, legacy rich-text cleanup, approved-category normalization, full excerpts, taller divider, and permanent slug redirect |
| 2026-07-25 | Contentful automation | Ready to run | Added repeat-safe schema/editor migration and existing-entry publication scripts; no CMS writes were attempted with the invalid token |
| 2026-07-25 | Rich-text validation | Pass | 6 woody-herb rows, 7 tender-herb rows, trivia question, body, and answer validated |
| 2026-07-25 | Static verification | Pass | Targeted ESLint, `pnpm exec tsc --noEmit`, and `pnpm build` |
| 2026-07-25 | Browser verification | Partial pass | `/blog`, full excerpts, categories, trivia divider, answer A behavior, existing mobile tables, and 308 redirect verified; final herb route remains CMS-dependent |
| 2026-07-25 | Contentful access restored | Pass | Both configured management-token variables successfully read the `blogPost` content type |
| 2026-07-25 | Editorial schema migration | Complete | Published content type version 8, category validation, slug/category editor controls, answer-heading field, and three entry headings; second dry run found no changes |
| 2026-07-25 | Herb article publication | Complete | Updated existing entry `65WfAMZYisXg3EU1F7nj3h`, published final slug/content/sort orders, and verified through the delivery API; second dry run found no changes |
| 2026-07-25 | Final browser verification | Pass | Complete herb route, three filters, two responsive tables, Food IQ override, divider, answer headings, metadata, JSON-LD, full excerpts, and 308 redirect pass with zero assertion failures |
|  |  |  |  |

## Final Sign-Off

- [x] All CMS, content, UI, and QA implementation checklist items are complete.
- [ ] Amber has reviewed the herb article, category labels, trivia divider, answer reveal, and full excerpts.
- [ ] Production deployment is verified.
- [x] This tracker contains the final URL, desktop/mobile screenshots, test results, and the current deployment status.

External sign-off remaining:

- Amber review has not been represented as complete because no approval has been received in this thread.
- Production deployment was not performed because the user has not yet authorized a production release.
