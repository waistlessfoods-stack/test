# Newsletter Studio browser evidence

Captured September 6, 2026 against the local development server using Playwright. This is local verification, not evidence of a Vercel deployment.

The pictured newsletter is QA copy, not approved content from Amber. The temporary issue, filtered QA subscriber, and Clerk member were removed after the run. No newsletter emails were sent.

## Screenshots

- [Editor: desktop](01-editor-desktop.png)
- [Editor: mobile](02-editor-mobile.png)
- [Saved email preview](03-email-preview.png)
- [Member archive](04-member-archive.png)
- [Member issue: desktop](05-member-issue.png)
- [Member issue: mobile](06-member-mobile.png)
- [Subscriber controls, filtered to the QA record](07-subscriber-controls.png)
- [Newsletter Studio dashboard](08-newsletter-studio.png)
- [Generated PDF sample](newsletter-preview.pdf)

[Machine-readable results](results.json) record all six browser checks and cleanup outcomes as passing. Checks cover anonymous API protection, administrator PDF download/publication, signed-in member read/download, revocation after unpublishing, and subscriber opt-out.

The general preview gate was unlocked only in the dedicated browser test session; the application's gate was not removed. The Next.js development indicator visible in screenshots is not part of the production design.
