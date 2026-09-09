# Approved one-recipient newsletter test

One email was sent to the address explicitly supplied by the user on September 8,
2026. Gmail SMTP accepted it at 13:59 UTC. No subscriber broadcast was prepared or
sent, and the recipient's existing subscription status was left unchanged.

Subject: `[TEST] WaistLess Foods newsletter — inbox check`

The message uses the actual newsletter campaign template and existing Gmail mailer,
with one-time-test wording replacing the standard subscription explanation. It
includes the normal signed unsubscribe URL, one-click headers, and a homepage CTA.
The homepage and unsubscribe confirmation page opened successfully. The unsubscribe
confirmation was **not** submitted, to avoid changing an existing preference.

The screenshots are browser renderings of the exact HTML sent, not Gmail inbox
screenshots. Gmail acceptance does not prove inbox delivery or spam placement.
Recipient confirmation is still required. This direct one-recipient mail test does
not exercise the campaign queue or its progress counters.

- [Mobile HTML rendering](rendered-email-mobile.png)
- [Desktop HTML rendering](rendered-email-desktop.png)
- [Send result](send-result.json)

The send script records an attempt marker before SMTP and refuses automatic reruns.
Do not remove that marker or resend without new recipient authorization.
