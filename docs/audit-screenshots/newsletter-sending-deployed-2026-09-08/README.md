# Newsletter sending enabled — live verification

Vercel successfully deployed commit `fdbf936`:
[deployment](https://vercel.com/waistlessfoods-projects/test/36f5tkzyEPqdAawLuGGzweMmeSWt).

The live site reports sending enabled without a mailing address. Actual preview
HTML omits the placeholder; PDF preview works. A private QA issue was created,
and the actual campaign preparation action successfully froze its content and
audience without an address. The send button's enabled state matched the pending
audience. **The send button was not clicked and no SMTP send was requested.**

The private QA issue, unsent campaign, and its pending delivery rows were removed
after checking their exact identity and verifying there had been no send attempts.
Existing subscriber records were not changed. All 12 checks passed, including
cleanup. This verifies deployment and preparation, not real inbox delivery.

[Results](results.json) · [Desktop](desktop.png) · [Mobile](mobile.png)

Screenshots show the actual live QA campaign panel. The floating storefront
header is hidden only during panel capture; application header behavior is unchanged.
