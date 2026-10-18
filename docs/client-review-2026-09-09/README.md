# Amber's screenshot attachment

Attach **WaistLess-Foods-Website-Review-2026-09-09.pdf** to the reply to Amber. It contains a branded cover and 33 feature screenshots (34 pages, approximately 8.2 MB). The PDF is prepared for on-screen review; long screenshots have taller pages so they remain readable at fit-width.

Coverage: consultation form and Google questions, current service request actions, protected paid recipe and print layout, class Shop cards/details, class registration administration, refreshed light/dark newsletter design, newsletter editor/archive/campaign controls, and sandbox service invoices.

Latest relevant desktop/mobile examples are included. Duplicate or superseded screenshots, logs, mailbox screenshots with private addresses, and private payment links are excluded. Sample purchaser/contact addresses visible in the administration examples use synthetic example.com data. No credentials are included. Source captions distinguish live captures, browser fixtures, and sandbox tests; the cover explicitly states this is not launch sign-off.

Fresh live captures on September 9 were read-only. The newsletter editor used browser-intercepted sample GET responses and the real local email template; no draft was created, saved, published, or sent. The preview gate was unlocked only within the dedicated QA browser session. The sticky header was hidden only for focused screenshot capture to avoid obscuring content. No website setting changed.

Source manifest: `screenshot-index.json`. Build script: `scripts/build-amber-review-pdf.mjs` (add `--capture` to refresh the read-only live captures). `inspection-*.png` and `pdf-check-page-*.png` are internal visual checks and are not extra attachments.

Validation: all 34 pages load, contain captions and images, and keep all image/text bounds within their pages. Selected pages were rendered from the actual PDF and visually inspected. The PDF checker uses PyMuPDF installed separately in a temporary tooling directory, not an application dependency.

Suggested email sentence:

> I've attached a screenshot walkthrough of the updates, including desktop and mobile views. Sample class and invoice screens are labelled, along with the final checks still needed before launch.

The email has not been sent by this task.
