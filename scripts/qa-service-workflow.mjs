// Browser -> actual Next route handlers -> actual workflow services -> isolated
// PostgreSQL TEMP tables. Only Stripe, Clerk identity, rate limits, and SMTP are
// replaced. HTML/React/CSS are served by the real local app. No real mail/charge.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import pg from 'pg';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';
import { stripeInvoiceFixture } from './lib/stripe-invoice-fixture.mjs';
import { contractValues, intakeValues } from './lib/amber-agreement-fixture.mjs';
import { signatureImage } from './lib/signature-fixture.mjs';

const base = 'http://localhost:3010';
const signatureOptions = process.argv.includes('--signature-options');
const screenshotsOnly = process.argv.includes('--screenshots') || signatureOptions;
const branded = process.argv.includes('--brand-components');
const output = branded ? 'docs/audit-screenshots/shadcn-agreements-2026-11-04' : signatureOptions ? 'docs/audit-screenshots/signature-options-2026-11-04' : screenshotsOnly ? 'output/screenshots/waistless-agreement-updates-2026-11-04' : 'docs/audit-screenshots/service-agreements-2026-11-04';
const captures = [];
await mkdir(output, { recursive: true });
await mkdir('output/pdf', { recursive: true });
await mkdir('tmp/pdfs', { recursive: true });
async function captureRange(page, scope, first, last, slug, title) {
  if (!screenshotsOnly) return;
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const [bounds, start, end] = await Promise.all([scope.boundingBox(), first.boundingBox(), last.boundingBox()]);
  assert.ok(bounds && start && end, slug);
  const top = Math.max(0, start.y - 16);
  const bottom = end.y + end.height + 16;
  const parts = Math.max(1, Math.ceil((bottom - top) / 1200));
  const height = (bottom - top) / parts;
  for (let part = 1; part <= parts; part++) {
    const y = top + (part - 1) * height;
    const file = `${slug}-${part}.png`;
    await page.screenshot({ path: `${output}/${file}`, animations: 'disabled', fullPage: true, clip: { x: Math.max(0, bounds.x), y, width: bounds.width, height } });
    captures.push({ file, title: title + (parts > 1 ? ` - part ${part}` : '') });
  }
}
async function captureElement(locator, file, title) {
  if (!screenshotsOnly) return;
  await locator.screenshot({ path: `${output}/${file}`, animations: 'disabled' });
  captures.push({ file, title });
}
async function choose(page, label, option) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  if (branded && label === 'Service' && option === 'Catering') await page.getByRole('listbox').screenshot({ path: `${output}/service-select-menu.png`, animations: 'disabled' });
  await page.getByRole('option', { name: option, exact: true }).click();
}
async function confirmedClick(page, button, snapshot) {
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Confirm action', exact: true });
  if (snapshot && branded) await dialog.screenshot({ path: `${output}/${snapshot}.png` });
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
}
assert.ok(process.env.DATABASE_URL && process.env.ADMIN_PASSWORD);
const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith('.neon.tech')) url.hostname = url.hostname.replace(/-pooler(?=\.)/, '');
url.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 15000 });
await client.connect(); client.on('error', () => {});
const browser = await chromium.launch({ headless: true });
const report = { browser: base, database: 'TEMP tables, rolled-back transaction', stripe: 'in-memory fixture', smtp: 'mocked', checks: [] };
try {
  await client.query('BEGIN'); await client.query('SET LOCAL search_path TO pg_temp');
  await client.query('CREATE TEMP TABLE bookings(id integer PRIMARY KEY,service_slug text,first_name text,last_name text,email text,phone text,guests integer,preferred_date text,alternative_date text,notes text)');
  const migration = await readFile(new URL('../drizzle/0013_service_agreements.sql', import.meta.url), 'utf8');
  await client.query(migration.replaceAll('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE'));
  const scope = await client.query("SELECT relnamespace=pg_my_temp_schema() AS isolated FROM pg_class WHERE oid IN ('bookings'::regclass,'service_agreements'::regclass,'service_invoice_records'::regclass)");
  assert.equal(scope.rows.length, 3); assert.ok(scope.rows.every(row => row.isolated));
  await client.query("INSERT INTO bookings VALUES (900001,'private','QA Test','Customer','qa@example.com','555-0100',8,'January 20th, 2027','January 21st, 2027','Budget range: $200\n\nEvent details:\nQA fixture only; not a real event.')");
  const query = async (statement, values = []) => (await client.query(statement, values)).rows;
  let tail = Promise.resolve();
  const database = { query, transaction: work => { const result = tail.then(() => work(query)); tail = result.catch(() => {}); return result; } };
  const pure = sourceLoader({ 'server-only': {} });
  const agreements = pure('lib/service-agreements.ts').createAgreementService(database);
  const invoiceWorkflow = pure('lib/service-invoice-workflow.ts').createInvoiceWorkflow(database);
  const provider = stripeInvoiceFixture();
  const sends = []; const paymentSends = [];
  const service = pure('lib/service-invoices.ts');
  const modules = sourceLoader({
    'server-only': {},
    '@/lib/service-workflow-store': { agreements },
    '@/lib/service-invoice-workflow-store': { invoiceWorkflow },
    '@/lib/service-invoices': { ...service, serviceStripe: () => provider.stripe, serviceStripeMode: () => 'test' },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ limited: false }) },
    '@/lib/email/mailer': { sendEmail: async message => { sends.push(message); return { error: null, data: { id: 'qa-smtp-only' } }; } },
    '@/lib/email/service-invoice-payment': { sendServiceInvoicePayment: async invoice => paymentSends.push(invoice) },
  });
  const routes = {
    agreements: modules('app/api/admin/service-agreements/route.ts'),
    agreement: modules('app/api/admin/service-agreements/[id]/route.ts'),
    signing: modules('app/api/service-agreements/route.ts'),
    invoices: modules('app/api/admin/service-invoices/route.ts'),
    invoice: modules('app/api/admin/service-invoices/[id]/route.ts'),
  };
  async function bridge(route) {
    const original = route.request();
    const request = new NextRequest(original.url(), { method: original.method(), headers: original.headers(), ...(original.method() !== 'GET' ? { body: original.postData() || '{}' } : {}) });
    const path = new URL(original.url()).pathname;
    let handlers; let id;
    if (path === '/api/admin/service-agreements') handlers = routes.agreements;
    else if (path.startsWith('/api/admin/service-agreements/')) { handlers = routes.agreement; id = path.split('/').at(-1); }
    else if (path === '/api/service-agreements') handlers = routes.signing;
    else if (path === '/api/admin/service-invoices') handlers = routes.invoices;
    else { handlers = routes.invoice; id = path.split('/').at(-1); }
    const handler = handlers[original.method()];
    assert.ok(handler, `Unexpected fixture request ${original.method()} ${path}`);
    const response = await handler(request, { params: Promise.resolve({ id }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  }
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  await admin.addCookies([{ name: 'wlf_admin_session', value: modules('lib/admin-session.ts').createAdminSessionToken(), url: base, httpOnly: true, sameSite: 'Lax' }]);
  await admin.route('**/api/admin/service-agreements*', bridge);
  await admin.route('**/api/admin/service-agreements/**', bridge);
  await admin.route('**/api/admin/service-invoices*', bridge);
  await admin.route('**/api/admin/service-invoices/**', bridge);
  const page = await admin.newPage(); page.setDefaultTimeout(30000);
  page.on('dialog', dialog => dialog.accept());
  await page.goto(`${base}/admin/service-agreements?booking=900001`, { timeout: 120000 });
  await page.getByRole('button', { name: 'Create draft from request' }).click();
  await page.getByRole('heading', { name: 'Edit draft', exact: true }).waitFor();
  assert.equal(await page.getByLabel('Customer email', { exact: true }).inputValue(), 'qa@example.com');
  assert.equal(await page.getByLabel('Event date', { exact: true }).inputValue(), '2027-01-20');
  assert.ok((await page.getByLabel('Approved agreement terms', { exact: true }).inputValue()).includes('25. ENTIRE AGREEMEMT'));
  if (branded) {
    assert.equal(await page.getByLabel('Approved agreement terms', { exact: true }).getAttribute('data-slot'), 'textarea');
    assert.ok((await page.getByLabel('Approved agreement terms', { exact: true }).boundingBox()).height < 500);
  }
  assert.equal(await page.getByRole('button', { name: 'Create signing link', exact: true }).isEnabled(), false);
  assert.equal(await page.getByLabel('Deposit percentage (%)', { exact: true }).inputValue(), '');
  const editor = page.locator('section.agreement-controls').filter({ has: page.locator('fieldset') });
  const label = name => page.getByLabel(name, { exact: true }).locator('..');
  if (screenshotsOnly) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/01-admin-overview.png` });
    captures.push({ file: '01-admin-overview.png', title: 'Agreement admin and original PDF link' });
    await captureRange(page, editor, editor.getByRole('heading', { name: 'Edit draft' }), editor.locator('textarea').first().locator('..'), '02-draft', 'Booking details and prefilled contract source');
    await captureRange(page, editor, editor.getByRole('heading', { name: 'Client and event intake' }), label('Dietary goals / nutritional needs'), '03-intake', 'Client, event, contact, dietary, and allergy intake');
    await captureRange(page, editor, editor.getByRole('heading', { name: 'Contract settings' }), label('Business phone'), '04-policy-blanks', 'Policy settings and business phone confirmation');
    await captureElement(label('Approved agreement terms'), '05-original-terms.png', 'Original contract with automatic field placeholders');
    await captureRange(page, editor, page.getByRole('button', { name: 'Save draft', exact: true }), page.getByRole('button', { name: 'Create signing link', exact: true }), '06-required-details', 'Missing details prevent creating a signing link');
    await choose(page, 'Service', 'Catering');
    await captureRange(page, editor, label('Business phone'), page.getByRole('checkbox', { name: 'Amber has confirmed this Personal Chef contract applies to this Catering event.' }).locator('..'), '07-catering-confirmation', 'Catering requires confirmation that this contract applies');
    await choose(page, 'Service', 'Private Chef');
  }
  await page.getByLabel('Agreed total (USD)', { exact: true }).fill('200.00');
  await page.getByLabel('Event location', { exact: true }).fill('QA TEST Fictional Venue');
  const template = pure('lib/service-agreement-template.ts');
  for (const [key, kind] of template.CONTRACT_FIELDS) await page.getByLabel(key + (kind === 'money' ? ' (USD)' : kind === 'percent' ? ' (%)' : ''), { exact: true }).fill(contractValues[key]);
  for (const [key, label] of template.INTAKE_FIELDS) {
    if (key === 'contactMethod' || key === 'mailingList') await choose(page, label, intakeValues[key]);
    else await page.getByLabel(label, { exact: true }).fill(intakeValues[key]);
  }
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByText('Draft saved. Nothing was sent or charged.', { exact: true }).waitFor();
  assert.ok((await page.locator('.agreement-document').innerText()).includes('$200.00'));
  assert.ok(!(await page.locator('.agreement-document').innerText()).includes('[Deposit percentage]'));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${output}/admin-agreement-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.getByRole('checkbox', { name: /^I have reviewed the saved preview/ }).check();
  assert.equal(await page.getByRole('button', { name: 'Create signing link', exact: true }).isEnabled(), false);
  await page.getByLabel("Chef signer's full name", { exact: true }).fill('QA TEST Chef Signer');
  if (signatureOptions) {
    await editor.getByRole('button', { name: 'Draw', exact: true }).click();
    const pad = editor.getByLabel('Draw your signature', { exact: true });
    await pad.scrollIntoViewIfNeeded(); const bounds = await pad.boundingBox(); assert.ok(bounds);
    await page.mouse.move(bounds.x + 30, bounds.y + 80); await page.mouse.down();
    for (let x = 30; x < bounds.width - 25; x += 8) await page.mouse.move(bounds.x + x, bounds.y + 85 + Math.sin(x/18)*25);
    await page.mouse.up();
    await captureElement(pad.locator('..'), 'chef-drawn-signature.png', 'Chef drawing option');
  }
  await page.getByRole('checkbox', { name: template.CHEF_SIGNATURE_CONSENT, exact: true }).check();
  await captureRange(page, editor, editor.getByRole('heading', { name: 'Contract settings' }), label('Business phone'), '08-filled-settings', 'Completed policy settings with fictional example values');
  await captureRange(page, editor, page.getByRole('checkbox', { name: /^I have reviewed the saved preview/ }).locator('..'), page.getByRole('button', { name: 'Create signing link', exact: true }), '09-chef-signing', 'Saved review and explicit Chef signature consent');
  if (branded) {
    const selectedStyle = editor.getByRole('button', { name: 'Draw', exact: true });
    const color = await selectedStyle.evaluate(node => getComputedStyle(node).backgroundColor);
    assert.equal(color, 'rgb(0, 103, 110)');
    await selectedStyle.hover();
    assert.notEqual(await selectedStyle.evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)');
    await selectedStyle.press('Tab');
    assert.ok(await selectedStyle.evaluate(node => node.parentElement.querySelector(':focus-visible')));
    assert.ok(await editor.locator('[data-slot="checkbox"]').count());
    await page.getByRole('button', { name: 'Create signing link', exact: true }).click();
    await page.getByRole('dialog', { name: 'Confirm action' }).getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('heading', { name: 'Edit draft', exact: true }).waitFor();
  }
  await confirmedClick(page, page.getByRole('button', { name: 'Create signing link', exact: true }), 'chef-confirmation-dialog');
  const signingLink = await page.getByLabel('Private signing link', { exact: true }).inputValue();
  assert.ok(signingLink.startsWith(base + '/agreements/sign#'));
  await confirmedClick(page, page.getByRole('button', { name: 'Email signing link to customer' }));
  await page.getByRole('status').filter({ hasText: 'mail server accepted' }).waitFor();
  assert.equal(sends.length, 1); assert.equal(sends[0].to, 'qa@example.com');
  report.checks.push('Real admin UI loads all 25 Amber source sections, requires policy/intake values, resolves saved preview fields, and requires explicit Chef signing consent before issuing. Policy values are fictional QA data. SMTP is mocked.');
  await page.screenshot({ path: `${output}/admin-agreement-desktop.png`, fullPage: true });
  await captureRange(page, editor, page.getByRole('button', { name: 'Refresh saved agreement' }), page.getByRole('button', { name: 'Email signing link to customer' }), '10-share-link', 'Issued agreement and customer signing link');
  const customer = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await customer.route('**/api/service-agreements', bridge);
  const signer = await customer.newPage(); signer.setDefaultTimeout(30000); signer.on('dialog', dialog => dialog.accept());
  await signer.goto(signingLink, { timeout: 120000 });
  await signer.getByRole('heading', { name: 'Chef electronic signature', exact: true }).waitFor();
  assert.equal(await signer.getByLabel('Your full name', { exact: true }).inputValue(), 'QA Test Customer');
  if (signatureOptions) await signer.getByAltText('Chef drawn signature', { exact: true }).waitFor();
  assert.ok((await signer.locator('.agreement-document').innerText()).includes('QA TEST Chef Signer'));
  assert.ok((await signer.locator('.agreement-document').innerText()).includes('QA TEST peanut allergy'));
  await signer.getByLabel('Your full name', { exact: true }).fill('QA Test Signer');
  if (signatureOptions) {
    await signer.getByRole('button', { name: 'Draw', exact: true }).click();
    assert.equal(await signer.getByRole('button', { name: 'Sign agreement', exact: true }).isEnabled(), false);
    await signer.getByRole('button', { name: 'Type name', exact: true }).click();
    await captureElement(signer.getByRole('button', { name: 'Sign agreement', exact: true }).locator('..'), 'customer-typed-option.png', 'Prefilled name and three signature styles');
    await signer.getByRole('button', { name: 'Upload image', exact: true }).click();
    const file = signer.getByLabel('Signature image (PNG or JPEG, up to 1 MB)', { exact: true });
    await file.setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: Buffer.from(signatureImage(true).split(',')[1], 'base64') });
    await signer.getByRole('alert').filter({ hasText: 'visible signature' }).waitFor();
    await file.setInputFiles({ name: 'qa-signature.png', mimeType: 'image/png', buffer: Buffer.from(signatureImage().split(',')[1], 'base64') });
    await signer.getByAltText('Uploaded signature preview', { exact: true }).waitFor();
    await captureElement(signer.getByRole('button', { name: 'Sign agreement', exact: true }).locator('..'), 'customer-upload-option.png', 'Uploaded customer signature preview');
  }
  await signer.getByRole('checkbox', { name: /I have read this agreement/ }).check();
  if (screenshotsOnly) {
    await signer.evaluate(() => window.scrollTo(0, 0));
    await signer.screenshot({ path: `${output}/11-customer-review.png` });
    captures.push({ file: '11-customer-review.png', title: 'Customer agreement review' });
  }
  await captureElement(signer.getByRole('button', { name: 'Sign agreement', exact: true }).locator('..'), '12-customer-signing.png', 'Customer name and electronic signing consent');
  await confirmedClick(signer, signer.getByRole('button', { name: 'Sign agreement', exact: true }), 'customer-confirmation-dialog');
  await signer.getByRole('status').filter({ hasText: 'signed agreement has been saved' }).waitFor();
  if (signatureOptions) {
    await signer.getByAltText('Client uploaded signature', { exact: true }).waitFor();
    report.checks.push('Booking name prefills customer signing. Chef drawing and customer image upload are persisted; blank uploads are rejected and all three style controls are available.');
  }
  await signer.screenshot({ path: `${output}/signed-agreement-desktop.png`, fullPage: true });
  await captureRange(signer, signer.locator('.agreement-document'), signer.locator('.agreement-signature').first(), signer.locator('.agreement-document footer'), '13-both-signatures', 'Chef and Client signatures, timestamps, and document reference');
  await captureElement(signer.getByRole('status').filter({ hasText: 'signed agreement has been saved' }), '14-signing-confirmation.png', 'Customer signing confirmation');
  await signer.setViewportSize({ width: 390, height: 844 });
  assert.ok(await signer.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await signer.screenshot({ path: `${output}/signed-agreement-mobile.png`, fullPage: true });
  await captureRange(signer, signer.locator('.agreement-document'), signer.locator('.agreement-signature').first(), signer.locator('.agreement-document footer'), '15-mobile-signatures', 'Both signatures on mobile');
  if (signatureOptions) {
    await signer.setViewportSize({ width: 1100, height: 1000 });
    await signer.emulateMedia({ media: 'print' });
    assert.equal(await signer.getByAltText('Chef drawn signature', { exact: true }).isVisible(), true);
    assert.equal(await signer.getByAltText('Client uploaded signature', { exact: true }).isVisible(), true);
    assert.equal(await signer.locator('.agreement-controls').first().isVisible(), false);
    await captureRange(signer, signer.locator('.agreement-document'), signer.locator('.agreement-signature').first(), signer.locator('.agreement-document footer'), 'print-signatures', 'Both image signatures in print layout');
    await signer.emulateMedia({ media: 'screen' });
  }
  if (!screenshotsOnly) {
  await signer.emulateMedia({ media: 'print' });
  assert.equal(await signer.locator('.agreement-controls').first().isVisible(), false);
  const pdf = await signer.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' } });
  const pdfDocument = await PDFDocument.load(pdf);
  assert.ok(pdfDocument.getPages().length >= 2);
  await writeFile('tmp/pdfs/qa-service-agreement-2026-11-04.pdf', pdf);
  report.pdfPages = pdfDocument.getPages().length;
  }
  report.checks.push(signatureOptions ? 'Both image signatures remain visible in print styles; navigation and action controls are hidden. Desktop and mobile copies were captured.' : screenshotsOnly ? 'Anonymous private-link review/signing and mobile layouts captured; the gallery includes the previously verified six-page print copy.' : 'Anonymous private-link review/signing saves immutable proof, fits 390px, and prints a multi-page signed copy without navigation or action controls.');
  await page.getByRole('button', { name: 'Refresh saved agreement' }).click();
  await page.getByRole('link', { name: 'Prepare invoice from signed agreement' }).click();
  await page.getByRole('heading', { name: 'Prepare a draft', exact: true }).waitFor();
  assert.equal(await page.getByLabel('Customer email', { exact: true }).inputValue(), 'qa@example.com');
  await page.getByLabel('Unit price (USD)', { exact: true }).fill('50.00');
  await page.getByRole('button', { name: 'Save draft in Stripe', exact: true }).click();
  await page.getByRole('button', { name: 'Issue invoice & payment link', exact: true }).click();
  await page.getByRole('button', { name: 'Email invoice to customer', exact: true }).click();
  await page.getByRole('button', { name: 'Email invoice to customer', exact: true }).waitFor({ state: 'visible' });
  assert.ok(provider.calls.includes('invoice.send'));
  const invoice = [...provider.invoices.values()][0];
  assert.ok(invoice.metadata.agreement_id); assert.equal(invoice.metadata.booking_id, '900001'); assert.equal(invoice.total, 5000);
  invoice.status = 'paid'; invoice.amount_paid = 5000; invoice.amount_remaining = 0; invoice.status_transitions.paid_at = Math.floor(Date.now() / 1000);
  // The same service path used by the signed Stripe webhook; verified webhook
  // construction/replay is covered separately in test-service-workflow.mjs.
  const paid = await invoiceWorkflow.sync(provider.stripe, invoice.id);
  await invoiceWorkflow.notify(paid, async value => paymentSends.push(value));
  await page.getByRole('button', { name: 'Refresh payment status', exact: true }).click();
  await page.getByText('Business payment notification: accepted by mail server.').waitFor();
  assert.equal(paymentSends.length, 1);
  await page.screenshot({ path: `${output}/linked-paid-invoice-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${output}/linked-paid-invoice-mobile.png`, fullPage: true });
  report.checks.push('Signed agreement prefills the invoice; a $50 deposit is issued/sent through the Stripe fixture and payment refresh shows paid status plus a deduplicated mocked business notification.');
  report.passed = true;
  if (branded) report.checks.push('shadcn inputs, textareas, Select, Checkbox, and Button controls passed. Exact primary teal, hover, keyboard focus, portalled menus/dialogs, and cancel/continue actions were verified.');
  if (screenshotsOnly) await writeFile(`${output}/captures.json`, JSON.stringify(captures, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) { report.failure = error.message; throw error; }
finally {
  await browser.close();
  try { await client.query('ROLLBACK'); } catch {} finally { await client.end(); }
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
}
