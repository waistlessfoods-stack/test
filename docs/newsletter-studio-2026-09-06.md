# Newsletter Studio: first-version handoff

Implemented and locally verified on September 6, 2026. These changes have not been pushed or deployed by the assistant.

## What Amber can do

1. Open `/admin/newsletters` from the admin dashboard and create a draft.
2. Write the title, email subject, short introduction, body, and optional HTTPS call-to-action link.
3. Save, inspect the article/email previews, and download the saved PDF preview.
4. Optionally send a clearly labelled preview to the configured administrator email only. This does not send to subscribers. There is a 60-second per-issue cooldown.
5. Publish the issue to `/account/newsletters`, or unpublish it later. Publication does not send any email. Saving an already-published issue updates its member-facing content.
6. Open `/admin/newsletters/subscribers` to search subscribers, mark a subscriber unsubscribed, or export active subscribers as CSV.

The editor detects stale versions instead of silently overwriting another editor's changes. Preview downloads and test emails use the saved version.

## Access and delivery boundaries

- Existing signed-in customer accounts can access published issues and download their PDFs. Anonymous users cannot download them; drafts and unpublished issues are excluded.
- Unsubscribing from email does not remove member archive access. Creating an account does not automatically opt someone into marketing emails.
- No newsletter broadcasts, scheduling, delivery analytics, or provider integration are enabled. A sending-service decision is still needed. The administrator preview template must not be used unchanged for a real campaign.
- Subscriber reactivation/import is not provided; customers must opt in themselves. Treat CSV exports as private personal data. Before a future campaign, reconcile fresh consent and unsubscribe/suppression data rather than sending to an old export.
- The first editor supports plain-text paragraphs and one optional link, not image uploads or a rich visual campaign builder.
- PDFs use standard Helvetica fonts. Unsupported characters such as emoji receive an explicit error before publication; text is not silently removed. PDFs have Letter-sized pages, side margins, wrapping, and automatic pagination.
- PDFs are generated on demand in memory with `pdf-lib`; there is no VPS requirement or persistent local-file dependency.
- Existing admin authentication, the general site preview gate, and disabled public-class settings are unchanged.

## Deployment

The additive `newsletter_issues` table migration has been applied to the database configured in the local environment and successfully replayed. No newsletters were left published and no existing subscriber records were changed during verification.

Push the code and redeploy to Vercel. If Vercel uses a different database, apply the migration to that database before using these routes:

```sh
pnpm db:migrate-newsletter-issues
```

Use the correct environment's `DATABASE_URL`; do not paste credentials into documentation. Existing Clerk, administrator authentication, database, and email configuration are reused. `ADMIN_EMAIL`, falling back to the configured sender, is the only preview-send recipient.

After deployment, smoke-test the admin dashboard and the member archive on the deployed site. Local browser verification does not establish that the deployment is live.

## Verification

- Production build and TypeScript checks passed.
- Full lint: zero errors; 21 existing warnings.
- Newsletter tests: 15 passed, including database-backed integration tests.
- Existing order-notification regression tests: 17 passed.
- Playwright desktop and 390px mobile checks passed: editor, saved email preview, PDF download, publication, actual Clerk-authenticated member read/download, unpublication, and subscriber opt-out.
- Anonymous API protection and draft/unpublished download restrictions passed. The unpublish browser check verified the not-found UI and absence of the protected article, as well as HTTP 404 from the download API; Next.js can stream a not-found page with HTTP 200.
- All temporary QA newsletter, subscriber, and Clerk user records were removed. No newsletter email was sent. Preview-send integration tests used a mocked mailer; real-inbox newsletter preview delivery remains a separate check.

Repeat automated checks:

```sh
node --env-file=.env scripts/test-newsletters.mjs --integration
node --env-file=.env scripts/test-order-notifications.mjs --integration
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Database integration tests use temporary tables inside rolled-back transactions, not production campaign or subscriber records.

See [browser evidence and sample PDF](audit-screenshots/newsletter-studio-2026-09-06/README.md).
