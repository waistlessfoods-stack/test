# Google appointment booking check — September 6, 2026

Attempted two clearly labeled QA bookings through the public Google Appointment
Schedule, using a dedicated alias on the accessible QA mailbox. No website
consultation lead or payment was created during this check.

## Results

- Schedule shows 30-minute appointments and Google Meet conferencing.
- Event Details, Event Date(s), and Budget Range are required; all were filled.
- Attempted September 7, 10:00–10:30pm and 10:30–11:00pm, in the browser's
  GMT+08:00 Central Indonesia time zone.
- Both submissions returned **“Failed to book the slot.”** The booking form
  remained open. Native input validation reported no errors.
- Both attempts observed a failed fetch to `www.google.com` with
  `net::ERR_ABORTED`. This does not establish the underlying cause; neither a
  CAPTCHA requirement nor a schedule-wide failure has been proven.
- Read-only IMAP checks restricted to the dedicated QA recipient found zero
  messages after both attempts: no verification email, invitation, or Meet link.
- No appointment creation was confirmed. There was no confirmed booking or
  cancellation link to use for cleanup; the organizer's calendar was not accessible.

## Evidence

- [First completed form](01-filled-booking-form.png)
- [First post-submission screen](02-after-booking-submit.png)
- [Second post-submission screen](attempt2-02-after-booking-submit.png)
- [First browser results](results.json)
- [Second browser results](attempt2-results.json)

The error text appears in the captured page text; the screenshots show the form
that remained open, not a successful confirmation.

## Next check

Complete one clearly labeled test booking in a normal browser using an email
account other than the schedule organizer's. Verify the confirmation, the
appointment's date/time and time zone, and that its Meet link opens the pre-join
screen. No meeting needs to be joined. Cancel the test afterward and confirm the
slot is released. If the same error occurs manually, capture it for further
Google Calendar troubleshooting. Do not mark this flow verified yet.
