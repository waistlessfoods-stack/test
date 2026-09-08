# Newsletter placeholder deployment verification

Commit `e7f64bf` was pushed to `upstream/main`. Vercel reported success:
[deployment](https://vercel.com/waistlessfoods-projects/test/8PYFNctVXDJy6Pkh756XsveFktva).

Verified on `https://www.waistlessfoods.com` September 8, 2026:

- Anonymous campaign API access denied; authenticated database read succeeds.
- Subscriber sending disabled and placeholder mode active.
- Actual administrator email preview contains the labelled placeholder.
- Actual PDF preview returns a PDF successfully.
- Live campaign controls render on desktop and mobile without horizontal overflow.
- One-click unsubscribe GET cannot mutate subscriptions.
- One private QA draft was created because the newsletter list was empty, then removed after verification. It was never published or emailed; no campaign was created.

All nine checks passed. [Results](results.json), [desktop](desktop.png), [mobile](mobile.png).
Screenshots focus on the live campaign panel; the floating storefront header was
hidden only during capture. No app header behavior was changed.

Repeat with `node scripts/qa-newsletter-deployment.mjs`. When no saved issue
exists, the explicit `--create-qa-draft` flag permits creating and cleaning up one
private QA draft for the preview/PDF checks. No mail is sent by this harness.
