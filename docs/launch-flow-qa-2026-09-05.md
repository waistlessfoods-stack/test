# Launch flow verification — September 5, 2026

Follow-up: administrator order notifications were implemented locally on
September 6; see [implementation and verification notes](admin-order-notifications-2026-09-06.md).
Google's 30-minute duration and required Budget Range were subsequently verified.
The findings below retain the original September 5 test results.

Tested the deployed website and a local build using dedicated, clearly labeled
QA addresses on the configured Workspace mailbox. Inbox checks used read-only
IMAP and were restricted to messages addressed to those QA aliases.

## Verified

| Check | Result |
| --- | --- |
| Production consultation form | HTTP 201; booking #12 saved in Admin as Complimentary Consultation, with event details and budget intact. |
| Consultation email | Customer confirmation received in the real inbox. Server reported both customer and admin sends successful. |
| Local corrected scheduling handoff | Booking #13 saved; confirmation received; browser opened the intended Google Appointment Schedule. |
| Newsletter welcome | Production signup created subscriber #11; the actual WaistLess Table welcome message arrived. |
| Unsubscribe | Followed the signed link from the delivered welcome email; endpoint returned success and deactivated the test subscriber. |
| Order email template | Delivered a clearly labeled zero-dollar preview through the protected production email endpoint. This was not a purchase. |
| Actual sandbox checkout | A dedicated Clerk QA user signed in. The paid recipe was inaccessible before purchase. Website checkout created a $1.08 sandbox session; Stripe's test card completed payment. |
| Webhook and order | Forwarded the actual sandbox completion event to the local webhook with a test signature. Order #7 became completed; the full recipe and Print / Save PDF became accessible. |
| Webhook replay | Repeated the same event. Both calls returned 200; the mailbox contained exactly one order #7 confirmation. |
| Live Stripe readiness | Account reports charges enabled, payouts enabled, and card payments active. Correct live webhook URL is enabled. |
| Production webhook secret | Unsigned request rejected with 400. A signed, nonpayment diagnostic event returned 200. No production order was changed by that probe. |
| Class capacity helper | Last seat allowed; excess quantity and sold-out requests rejected. Concurrent enrollment was not tested; public classes remain disabled. |

## Defects found and change made

The deployed consultation dialog saved leads but then displayed “Chef Amber will
contact you with scheduling details.” It contained no scheduling link. This
demonstrates that the deployed component had no usable booking URL, even though
the local `.env` contains one.

Added `lib/consultation-scheduling.ts` and connected it to the header. It uses the
configured HTTPS URL when valid and otherwise falls back to Amber's supplied
public booking page, `https://calendar.app.google/MYtW3RKs8Q12FqZA8`.
The change requires deployment. Missing/invalid configuration and a valid
override were checked; the corrected local form successfully redirected.

## Google Calendar actions still needed

- Appointment slots are **60 minutes**, but the description promises **30 minutes**.
  Set the schedule to the intended duration and keep the description consistent.
- **Event Details** and **Event Date(s)** are required.
- **Budget Range** exists but is **optional**. Mark it required.
- Google Meet is listed as being added after booking.
- Automated final booking attempts remained on the booking form without a
  confirmation. No invitation was found in the QA inbox. A browser request to
  Google was aborted; the exact cause was not established. Appointment creation,
  the organizer's calendar record, and the Meet invitation remain unverified.

An authenticated Calendar owner session is not available. SMTP/IMAP credentials
allow email testing but do not provide access to edit the appointment schedule.
Administrator email delivery was accepted by the sending server; the separate
administrator inbox was not accessible for receipt verification.

## Payment verification limits

The complete payment transaction ran in Stripe **test mode**, following
[Stripe's testing guidance](https://docs.stripe.com/testing). No live charge was
made. The sandbox has no registered webhook endpoint, so its actual event was
manually forwarded to the local handler. This verifies handler behavior but does
not establish automatic sandbox delivery or a completed live payment.

The current order confirmation helper sends the customer confirmation. It does
not send a separate administrator order email; consultation and newsletter
administrator notifications are separate flows.

## Cleanup

- Consultation test bookings #12 and #13 marked cancelled.
- Newsletter QA subscriber #11 unsubscribed using the delivered link.
- Sandbox order #7 refunded in Stripe test mode and marked refunded in the
  website database with QA metadata, excluding it from completed-order totals.
  This status change was test cleanup, not verification of refund webhooks.
- Temporary Clerk QA login deleted after verifying its exact identity.
- Test messages and cancelled/refunded records retained as evidence.

No general preview gate or public-class launch setting was changed.

## Code validation

- Production build (`pnpm build`) passed.
- Targeted ESLint checks for the changed header and scheduling helper passed.
- Missing, invalid, and valid configured scheduling URLs were checked.
- `git diff --check` passed.
