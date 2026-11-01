# Newsletter images and recipe management - November 1, 2026

Implemented locally for the [October 31 meeting checklist](meeting-notes-website-planning-2026-10-31.md). The website code has not been deployed in this work. Amber's own sign-in, CMS editing permissions, first newsletter, received test email, and independent walkthrough remain acceptance checks.

## Newsletter authoring

Open **Admin -> Newsletters**, create an issue, and write its title, subject, introduction, body, and optional button. Blank lines separate paragraphs.

Under **Newsletter images**, add an optional header, up to six body photos, and an optional footer image. Publish photos in Contentful's media library and paste their published asset URLs. Website JPG/PNG URLs also work. Each image needs a short description; an optional HTTPS link makes the image clickable. Choose the paragraph after which each body photo appears, or place it before the first paragraph. Removing paragraphs moves affected images to the last remaining position.

Save before using **Email preview**, **Download PDF preview**, **Send admin test**, or preparing the campaign. Unsaved changes disable those actions. Tests go only to `admin@waistlessfoods.com`, unless `ADMIN_ACCOUNT_EMAIL` explicitly overrides the confirmed account identity. There is a one-minute cooldown. Newsletter tests no longer derive their recipient from the generic order-notification setting or sender.

The email keeps the existing branded masthead, logo, footer, mobile layout, and light/dark styling. Images retain their proportions. The member web issue and PDF use the same saved text, image order, descriptions, and image links. PDF photos fit inside the page margins; footer art is smaller to avoid a separate page containing only a closing logo. PDF text still supports standard Latin text and punctuation; unsupported emoji are flagged before publication.

**Publish to archive** makes the issue available to signed-in members and sends no email. **Prepare saved issue & audience** freezes text, images, links, and recipients for a separate campaign. Subsequent issue edits do not alter that frozen campaign. Existing opt-out, uncertainty, daily limits, and manual send controls remain in place. Local browser verification never sent to real subscribers.

Images must be published HTTPS assets from Contentful or JPG/PNG files on the website. Contentful images in other formats receive a JPEG rendition URL. The PDF loader rejects redirects, credentials, unsupported bytes, oversized files above 3 MB, and unavailable images. Use a smaller Contentful rendition if needed. Publishing checks that the PDF can be generated; broken resources return an explicit error. Remote images can become unavailable after publication, so keep referenced assets published.

## Paid recipes

Open **Admin -> Recipe management**. Each paid recipe now has **Edit recipe in Contentful** and **Preview** links. Edit text/photos in the existing Contentful entry, publish the entry there, then select **Refresh published recipes** on the website. The refresh clears the recipe/shop caches; it does not publish CMS drafts. Contentful still controls who can edit and publish. No new website-based recipe editor or CMS permission changes were introduced.

The administrator can inspect complete paid recipes from admin and the storefront full view without buying them. Existing purchaser authorization remains in place. Anonymous visitors are directed to the purchase preview, and unauthenticated admin visitors see the administrator sign-in gate.

The audit also found full paid recipe fields being passed into public client components. Public recipe/shop lists and purchase previews now receive an explicit set of marketing fields. Ingredients, tools, instruction steps, full rich text, and private section-image fields are excluded from those responses. Full content is supplied only on authorized full views or genuinely free recipes.

## Published content readiness

A read-only Contentful check found five published recipes, each with ingredients, instructions, a photo, cook time, and serving size. Four are paid and appear in Recipe management; the remaining recipe is free. Existing content has not been rewritten or published by this work.

Four category filters still have no published recipes: **Beef, Fish & Seafood, Chef Spotlight, and Poultry**. See the [machine-readable audit](content-readiness/2026-11-01.json) for counts. Amber still needs to provide or finalize those recipes. All three services have six How to Book steps and two detail sections; that confirms their presence, not editorial approval. Testimonials, service instructions, and Cooking Classes information boxes still need her review.

## Deployment and verification

The additive `drizzle/0014_newsletter_media.sql` migration was applied to the database configured locally; a read-only check confirmed `newsletter_issues.media` is JSONB. Existing text, subscriber state, and campaign snapshots were retained. If deployment uses another database, apply `pnpm db:migrate-newsletter-media` there before deploying the new editor.

Focused verification:

- `node --env-file=.env scripts/test-newsletters.mjs --integration`: 16 passed, including image save/publication/member PDF access and broken-image rejection.
- `node --env-file=.env scripts/test-newsletter-campaigns.mjs --integration`: 16 passed, including immutable image/link snapshots.
- `node scripts/test-newsletter-media.mjs`: 4 passed for validation, shared rendering, PDF image/link embedding, and download bounds.
- `node scripts/test-recipe-administration.mjs`: 4 passed for public serialization, admin/purchaser authorization, refresh guards, signed sessions, and CMS links.
- `node scripts/test-admin-identity.mjs`: 2 passed.
- TypeScript, production compilation, and full lint passed; lint has 25 pre-existing warnings and zero errors.

The actual production React UI and actual newsletter route handlers were exercised against isolated PostgreSQL TEMP tables, with image bytes from local fixtures and SMTP replaced. The transaction was rolled back; no real issue, campaign, subscriber email, or CMS publication was created. Read-only recipe browser checks used the current published content and a signed local administrator session, not Amber's Clerk account.

See [newsletter evidence](audit-screenshots/newsletter-media-2026-11-01/README.md) and [recipe evidence](audit-screenshots/recipe-administration-2026-11-01/README.md). The sample newsletter/PDF contains clearly fictional QA text, not the first newsletter Amber will send.
