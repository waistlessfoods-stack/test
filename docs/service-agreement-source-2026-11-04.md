# Amber's original contract integration - November 4, 2026

Prepared for the November 4 GitHub push. Implementation and local verification are complete; live deployment has not yet been verified.

Screenshot review: [30-image gallery](../output/screenshots/waistless-agreement-updates-2026-11-04/index.html) · [Download all screenshots](../output/screenshots/waistless-agreement-updates-2026-11-04.zip). Captures use fictional example data; print pages come from the previously verified print fixture.

## Profile prefill and signature options update

The agreement admin, customer signing, and member agreement controls now use the project's shadcn Button, Input, Textarea, Label, Select, Checkbox, and Dialog components. The `.agreement-theme` scope applies exact primary teal `#00676E`, secondary teal `#388082`, dark ink, and pale green surfaces through semantic CSS variables. Portalled Select menus and confirmation dialogs receive the same theme. Native browser action confirmations were replaced with shadcn dialogs; the unsaved-page browser warning remains a browser feature. The drawing surface is a canvas controlled through shadcn buttons.

Brand verification passed for the primary color, hover, keyboard focus, checkboxes, dropdown selection, textarea sizing, and dialog Cancel/Continue behavior, alongside the existing signing, mobile, print, and invoice walkthrough. TypeScript, targeted ESLint, and production build passed. Current evidence: [signature controls](audit-screenshots/shadcn-agreements-2026-11-04/customer-typed-option.png), [select menu](audit-screenshots/shadcn-agreements-2026-11-04/service-select-menu.png), and [confirmation dialog](audit-screenshots/shadcn-agreements-2026-11-04/chef-confirmation-dialog.png).

The booking request now prefills the signed-in Clerk user's available first name, last name, primary email, and primary phone. Fields remain editable; profile loading cannot overwrite an edit or a deliberately cleared field. Existing booking-to-agreement reuse carries the contact information forward.

The customer's signing name defaults to the booking name. A signed-in Clerk profile supplies its name only when its verified primary email matches the agreement recipient. Guest signing remains available through the private link. The Chef name also defaults from the signed-in administrator's profile when available. A name is still recorded with drawn and uploaded signatures to identify the signer.

Both Chef and Client can choose **Type name**, **Draw**, or **Upload image**. Drawing supports pointer input; uploads accept PNG/JPEG files up to 1 MB and are converted into a bounded PNG. The server validates dimensions, PNG structure/CRC, and visible ink, then removes image metadata before storing the result. Images are stored in the existing agreement JSON; no migration or external upload service is needed.

Chef image proof is included in the frozen document hash. Client image proof is saved with name, consent, server timestamp, document hash, and an integrity hash. Retries must match the original signature and cannot replace a signed image. Legacy typed signatures and their consent text/hashes remain readable.

Only contact information actually available from Clerk is reused. The current Clerk profile does not collect the contract's address, birth date, allergies, dietary goals, event schedule, or business-policy settings; these remain reviewed agreement details. No private or custom Clerk metadata is copied, and this update does not change profile information or reuse a saved signature automatically.

Current UI evidence: [Chef drawing](audit-screenshots/signature-options-2026-11-04/chef-drawn-signature.png), [customer signature choices](audit-screenshots/signature-options-2026-11-04/customer-typed-option.png), [image upload](audit-screenshots/signature-options-2026-11-04/customer-upload-option.png), and [saved image signatures](audit-screenshots/signature-options-2026-11-04/13-both-signatures-1.png). The earlier 30-image gallery and PDF predate these signature choices.

Validation: 4 profile/image tests and 16 agreement/workflow tests passed; targeted ESLint and production build passed. The browser harness exercised Chef drawing, customer upload, rejection of a blank upload, name prefill from the booking, desktop/mobile saved images, print styles retaining both signature images, and the linked invoice workflow. SMTP and Stripe were mocked; SQL used temporary records and rollback. No real agreement, signature, email, or payment was created.

References: [Clerk user data](https://clerk.com/docs/nextjs/guides/users/reading), [currentUser and privacy guidance](https://clerk.com/docs/reference/nextjs/app-router/current-user), [PNG decoder](https://github.com/pngjs/pngjs).

## Source and coverage

Amber supplied the missing six-page Personal Chef PDF. The unchanged source is packaged at `private/contracts/amber-personal-chef-2026-11.pdf` and available to authenticated administrators through **View Amber's original contract PDF** on the agreements page. It is not served from `public/`.

Source SHA-256: `801b13bf47dd2f3a2b6dbe940a35140b05c35fec16226360f7fec130b8e8164d`.

`lib/service-agreement-original.ts` transcribes all 25 sections and the closing declaration from pages 2-6. Paragraph order, whitespace, and apostrophes are normalized. Repeated placeholder labels are distinguished by purpose; substantive wording, including the source's section-25 spelling, is retained. A comparison against the PDF extraction passed after whitespace, apostrophe, and placeholder-label normalization.

The intake covers address, state, ZIP, optional birth date, preferred contact method, mailing-list preference, event type/theme, event and Chef times, time zone, dietary restrictions, allergies, cuisine, and nutritional goals. Mailing-list preference is a record only; it does not subscribe the customer.

## Administrator workflow

1. Create a draft from a Private Chef or Catering booking request. The original terms and filename are prefilled; policy values start empty. Existing drafts can explicitly load the original template after confirming replacement of their terms.
2. Confirm customer/event details and complete intake. Confirm allergies and dietary restrictions before entering `None`.
3. Complete contract settings: Chef business name, agreement date, deposit percentage, balance due date, payment method, daily late fee, each notice period, additional guest fee, travel threshold/rate, governing state, and business phone. Monetary settings use USD; day counts are rendered with their units.
4. Resolve the phone discrepancy with Amber: the PDF says **409-543-7266**; the website previously used **281-436-9245**. No business phone is preselected.
5. For Catering, explicitly confirm Amber has approved this Personal Chef contract for the event. Cooking Class agreements remain outside the existing supported workflow.
6. Save and review the customer preview against the original PDF. Customer, event, dates, amount, and contract fields fill the template automatically. Unresolved placeholders and required settings block issuance on the server and in the UI.
7. Check the review box, type the authorized Chef signer's full name, accept Chef signing consent, and create the signing link. This action records the Chef signature and server timestamp, resolves and freezes the terms, and hashes the full content. It does not email the link automatically.
8. Share/email the private link through the existing explicit actions. The customer reviews and signs the frozen copy. Both signatures appear in the customer view and printable copy. Continue to linked invoicing after customer signing.

Intake, template settings, and Chef proof are stored in the existing agreement JSON content. No schema migration is needed. New optional keys are omitted when canonicalizing legacy content, preserving existing issued hashes. Saving a draft cannot inject a Chef signature; only issuing through the protected administrator action records it.

Contract settings are document terms, not automatic billing rules. The existing invoice workflow still requires an administrator to enter the amount due; deposits, late fees, travel, and grocery reimbursements are not automatically calculated or charged. The existing cap on linked invoice totals remains in force.

## Verification

- Agreement/workflow suite: **15 passed**, including isolated SQL, Chef consent, forged-signature rejection, frozen content, legacy hash compatibility, customer signing, linked invoices, and notification behavior.
- Existing invoice suite: **13 passed**.
- TypeScript (through production build), targeted ESLint, and production build passed.
- Source-download tests confirm anonymous rejection, authenticated PDF access, and private/no-store caching. Production build tracing includes the source PDF.
- Browser harness checks draft preparation, required settings, Chef signing, customer signing, 390px layouts, printable copies, and linked invoice/payment-status behavior. Results and screenshots: `docs/audit-screenshots/service-agreements-2026-11-04/`.
- Final six-page print fixture was rendered with Poppler and all pages visually inspected. It contains all 25 sections, both signatures, notice units, reference/hash, and no unresolved placeholders. Intake rows can split across pages; headings remain with their following text. The QA PDF remains under `tmp/pdfs/` and is not a customer contract.
- Browser and SQL verification use temporary tables in a rolled-back transaction. SMTP and Stripe are mocked; no customer agreement, live invoice, payment, or real email was created.

Amber's actual policy values, confirmed business phone, Catering applicability, and review of the completed customer document remain acceptance inputs. Deployment and the previously outstanding real inbox/payment walkthrough are separate from these local checks.
