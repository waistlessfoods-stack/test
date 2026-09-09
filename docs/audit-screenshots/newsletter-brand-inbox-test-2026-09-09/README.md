# Approved newsletter design inbox test — September 9, 2026

Vercel reported successful deployment of commit `99301990e0012ac6e6b24f13a002f6d645ef0c02` before the test. The local template matched that commit. The authenticated live newsletter list had no saved issues, so no live issue HTML preview was available. No draft or campaign was created to work around this.

One email was sent to the exact user-approved Gmail recipient using the shared Gmail mailer locally, with the template from that deployed commit. Gmail accepted it at 03:41 UTC. Subject: **[TEST] WaistLess Foods — updated logo & newsletter design**. This does not verify a campaign send through Vercel or confirm inbox delivery.

The logo loaded from the live website in all four browser previews. Mobile overflow, the website link, and the signed unsubscribe confirmation page passed. No unsubscribe was submitted, and existing subscription status remained unchanged. No subscriber broadcast occurred.

- [Desktop light](desktop-light.png)
- [Mobile light](mobile-light.png)
- [Desktop dark](desktop-dark.png)
- [Mobile dark](mobile-dark.png)

These screenshots show the exact test HTML in Chromium, not the recipient's inbox. Apple Mail/Gmail rendering and delivery require recipient confirmation. The durable `send-result.json` marker prevents accidental resend; do not remove it to retry.
