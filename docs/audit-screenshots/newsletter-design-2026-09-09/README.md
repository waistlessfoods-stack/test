# Newsletter brand refresh — September 9, 2026

Updated the shared newsletter issue template with the existing public WaistLess Foods logo, website primary teal (#00676e), secondary teal (#388082), warm cream framing, an editorial masthead, consistent content padding, and an email button. A white logo tile keeps the artwork readable against the intentional dark palette.

Screenshots use synthetic design-preview copy, not a published issue or subscriber broadcast:

- [Desktop light](desktop-light.png)
- [Mobile light](mobile-light.png)
- [Desktop dark](desktop-dark.png)
- [Mobile dark](mobile-dark.png)

Reproduce with `node scripts/test-newsletter-design.mjs`. No environment credentials are required. This script renders the actual React Email template in Chromium, loads the real public HTTPS logo, and checks light/dark backgrounds, CTA destination, one main heading, narrow-screen overflow, long content, escaped HTML, optional CTA, and the inline-style fallback. It makes no SMTP calls or database writes.

The existing newsletter and campaign tests cover preview labeling, optional-address/placeholder handling, unsubscribe links, content escaping, and sending safeguards. TypeScript and targeted ESLint also passed.

These are browser previews, not screenshots from Apple Mail, Gmail, or Outlook. Email clients can block remote images, substitute fonts, or alter dark-mode colors. Actual inbox rendering requires a separately approved new test. The earlier received email will not change. No new email was sent, and this design has not been deployed by this task.
