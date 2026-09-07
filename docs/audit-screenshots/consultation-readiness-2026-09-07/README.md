# Consultation readiness — September 7, 2026

Read-only Playwright check against the deployed website and public Google booking page.

Verified:

- The live homepage opens the consultation form with event and contact fields.
- The deployed client redirects to Amber's Google schedule after a **simulated** successful lead response. The browser intercepted `/api/bookings`; no lead or email was created.
- The target is WaistLess Foods Complimentary Consultation, with 30-minute appointments and Google Meet listed.
- Opening an available slot shows required Event Details, Event Date(s), and Budget Range inputs.

The Google Book button was **not** clicked. This is not a completed end-to-end booking test. Appointment creation, confirmation email, actual Meet link, and cancellation remain unverified. Previous September 6 final submissions failed; this run does not prove that failure has been resolved.

Next: agree a QA recipient and temporary appointment slot, complete one booking, verify its invitation and Meet pre-join page, then cancel the test. No need to join a meeting. Newsletter broadcasts remain dependent on a sending-provider decision; none were enabled or sent.

Evidence:

- [Website form](01-website-consultation.png)
- [Google schedule](02-google-schedule.png)
- [Required Google questions](03-google-required-questions.png)
- [Results](results.json)

Repeat: `node scripts/qa-consultation-readiness.mjs`. Targeted ESLint passed. No application code, hosting configuration, calendar settings, or customer records were changed.
