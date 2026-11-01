# Newsletter image verification - November 1, 2026

`node scripts/qa-newsletter-media.mjs` uses the rebuilt local production app, actual API handlers, and isolated PostgreSQL TEMP tables. SMTP is mocked and image downloads use local website fixtures. All temporary records are rolled back; no real newsletter is published or sent.

Verified header, body, and footer images; alt descriptions; optional image links; paragraph placement; save/dirty-state behavior; administrator-only test routing; saved email preview; PDF download; frozen campaign image/link content; and archive publication independent of sending. See [results](results.json).

Screenshots were visually checked at desktop/mobile widths and in light/dark modes:

- [Archive desktop](archive-desktop.png) and [mobile](archive-mobile.png).
- Email [desktop light](email-light-900.png), [mobile light](email-light-390.png), [desktop dark](email-dark-900.png), and [mobile dark](email-dark-390.png).

The fictional [QA PDF](../../../output/pdf/qa-newsletter-media-2026-11-01.pdf) was rendered with Poppler. Every final page was visually inspected for margins, wrapping, images, and page numbering. Rendered pages are in this directory. This is layout evidence, not Amber's newsletter content or inbox-delivery confirmation.
