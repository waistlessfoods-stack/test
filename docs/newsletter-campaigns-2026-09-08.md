# Gmail newsletter campaigns — September 8, 2026

Implemented using the existing `Email` / `AppPassword` Gmail connection. No new sending provider, dependency, VPS, cron schedule, or unattended worker is required. **No subscriber email was sent during implementation or testing.** At the owner's request, the mailing-address blocker is removed and production sending is available with explicit batch confirmation.

## Amber's workflow

### Mailing address deferred

The address is optional in the application for now. Missing addresses and known
placeholders are omitted from both previews and subscriber emails. Campaigns can
be prepared and sent without them. Unsubscribe links remain in subscriber emails.
Add `NEWSLETTER_MAILING_ADDRESS` later to include it in future campaign snapshots.
This is an owner-requested application change, not an assessment of marketing-email
compliance or a guarantee of inbox delivery.

1. Open an issue in **Admin → Newsletter studio**. Save changes and use the existing administrator-only preview test.
2. Under **Send to subscribers**, choose **Prepare saved issue & audience**. This freezes the saved subject, content, mailing address, and current active subscriber list. Preparation sends nothing. Publication to the member archive is independent and still sends nothing.
3. Review **Frozen email content & footer**, counts, and version. Later editor changes do not change this campaign. Each issue has at most one campaign, including after cancellation; create a new issue for a genuinely new mailing, not to retry an uncertain recipient.
4. Choose **Send next 5 subscribers** and confirm. These are real emails. The browser makes up to five separate one-email requests, with a ten-second gap. Keep the page open for that batch. Stop after the current email or close the page to stop further requests; an in-flight email cannot be recalled.
5. Refresh and repeat for the next batch. Progress survives closing the browser or deployment. Cancel remaining recipients if the campaign should stop permanently.

## Delivery safeguards and boundaries

- Only existing active subscribers with no unsubscribe timestamp enter the snapshot. Membership or purchase does not add a recipient. Emails are normalized/deduplicated; each receives an individual email, never a visible shared recipient list.
- Consent and email identity are checked again at reservation and immediately before SMTP. Opt-outs before dispatch are skipped. A message already in flight cannot be recalled.
- A shared database lock serializes reservations across campaigns and server instances. One in-flight email is allowed, with a two-minute claim lifetime and ten-second cooldown. Each HTTP request has a 60-second Vercel budget; no unawaited background send is used.
- Default/hard maximum newsletter cap: **100 attempts per rolling 24 hours**, across campaigns. `NEWSLETTER_DAILY_LIMIT` can lower this to an integer from 1–100. Failed/interrupted attempts count conservatively. Ordinary Gmail usage, welcome/consultation/order emails, and preview sends are not measured by this campaign ledger; its cap does not guarantee mailbox quota remains available.
- `accepted` means Gmail accepted SMTP, **not confirmed inbox delivery**. No opens/clicks, automatic bounce suppression, spam complaint feed, or Gmail inbox-delivery tracking is claimed.
- SMTP errors and interrupted sends become `uncertain`; they are never automatically retried. The campaign pauses. Review those recipients in Gmail, then explicitly resume only never-attempted recipients. A crash after SMTP acceptance but before recording success may also require review. This favors avoiding duplicate emails; it cannot promise exactly-once SMTP delivery.
- Per-recipient signed unsubscribe link and RFC 8058 headers are included. The new one-click POST route validates the token and payload, requires no login, and has no mutating GET. Existing browser unsubscribe confirmation remains unchanged. Gmail's displayed one-click unsubscribe UI and DKIM header coverage must still be verified on a real received campaign message.
- Mailing addresses are optional; placeholders are never presented as real addresses. No address has been invented or taken from private sources.
- Vercel Preview deployments are blocked from sending even if the enable flag is present. Local sending also defaults off. Administrator authentication and same-origin mutation checks remain required.
- Public classes, preview gate, invoices, and automatic order-email behavior are unchanged.

## Setup and deployment

The additive migration created three campaign tables in the database configured by the local environment. No existing subscriber, issue, order, or customer record was altered. If Vercel uses a different database, run this against that database before deployment:

```sh
pnpm db:migrate-newsletter-campaigns
```

Keep the existing `Email` and `AppPassword` on the server. Production sending is now enabled by default when `VERCEL_ENV=production` and those credentials are present. Optional configuration:

```text
NEWSLETTER_DAILY_LIMIT=100
NEWSLETTER_SENDING_ENABLED=true
```

`NEWSLETTER_SENDING_ENABLED=false` is an explicit kill switch. Local development still requires explicit `true`; Vercel Preview deployments cannot send. No campaign runs automatically: an authenticated administrator must prepare it and confirm each batch. Verify the approved sender, domain authentication, mailbox limits, and approved test-recipient delivery separately. Do not place these settings or credentials in `NEXT_PUBLIC_` variables.

Automatic scheduling is not implemented in this manual first version. Vercel Hobby cron is daily with imprecise timing, so it is not used as a short-interval mail queue. See [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing). Google account limits still apply: [Workspace sending limits](https://support.google.com/a/answer/166852) and [email sender guidance](https://support.google.com/mail/answer/81126).

## Verification

- 15 campaign tests: configuration guardrails, frozen/deduplicated audience, preparation idempotency, disabled sends, optional-address preparation/sending, placeholder omission, unsubscribe recheck, in-flight exclusion, cooldown, rolling cap, ambiguous SMTP outcomes, stale claims, cancellation, empty audience, signed one-click opt-out, admin and origin guards, and actual template rendering.
- Campaign database tests used PostgreSQL TEMP tables inside a rolled-back transaction with a mocked SMTP callback. Concurrent service calls were exercised through a serialized test transaction adapter; this is not a distributed load test.
- 15 existing newsletter tests and 17 order-notification regression tests passed, without real emails.
- Production build, TypeScript, and targeted ESLint passed.
- 11 browser checks passed against a local production build, including preparation without an address. The real authenticated campaign database read passed and confirmed local sending is disabled. Populated issue/campaign interactions use browser-only fixtures, not production records.
- Live campaign email/inbox delivery is **not** verified. No customer campaign was prepared or sent.

Repeat checks:

```sh
node --env-file=.env scripts/test-newsletter-campaigns.mjs --integration
node --env-file=.env scripts/test-newsletters.mjs --integration
node --env-file=.env scripts/test-order-notifications.mjs --integration
pnpm exec tsc --noEmit
pnpm build
```

Browser QA: with the local server on port 3010 and sending disabled, run `node scripts/qa-newsletter-campaigns.mjs`.

Screenshots: [desktop](audit-screenshots/newsletter-sending-2026-09-08/01-campaign-desktop.png), [mobile](audit-screenshots/newsletter-sending-2026-09-08/02-campaign-mobile.png), [paused](audit-screenshots/newsletter-sending-2026-09-08/03-paused-campaign-mobile.png). These are focused panel captures with sample data; the floating storefront header is hidden only during capture so it cannot obscure a tall screenshot. Application header behavior is unchanged.
