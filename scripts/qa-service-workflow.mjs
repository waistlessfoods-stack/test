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

const base = 'http://localhost:3010';
const output = 'docs/audit-screenshots/service-agreements-2026-11-01';
await mkdir(output, { recursive: true });
await mkdir('output/pdf', { recursive: true });
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
  assert.equal(await page.getByLabel('Approved agreement terms', { exact: true }).inputValue(), '');
  await page.getByLabel('Agreed total (USD)', { exact: true }).fill('200.00');
  await page.getByLabel('Approved contract source / filename', { exact: true }).fill('QA fixture only; not Amber contract');
  await page.getByLabel('Approved agreement terms', { exact: true }).fill(Array.from({ length: 12 }, (_, index) => `QA TEST ONLY - Section ${index + 1}. This fictional paragraph verifies agreement layout and electronic-signing behavior. It is not a customer contract and must not be sent for a real service. The approved source text is still required.`).join('\n\n'));
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('checkbox', { name: /I have reviewed/ }).check();
  await page.getByRole('button', { name: 'Create signing link', exact: true }).click();
  const signingLink = await page.getByLabel('Private signing link', { exact: true }).inputValue();
  assert.ok(signingLink.startsWith(base + '/agreements/sign#'));
  await page.getByRole('button', { name: 'Email signing link to customer' }).click();
  await page.getByRole('status').filter({ hasText: 'mail server accepted' }).waitFor();
  assert.equal(sends.length, 1); assert.equal(sends[0].to, 'qa@example.com');
  report.checks.push('Real admin UI creates a draft from the inquiry, edits approved-text fixture, freezes the preview, and sends only through mocked SMTP.');
  await page.screenshot({ path: `${output}/admin-agreement-desktop.png`, fullPage: true });
  const customer = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await customer.route('**/api/service-agreements', bridge);
  const signer = await customer.newPage(); signer.setDefaultTimeout(30000); signer.on('dialog', dialog => dialog.accept());
  await signer.goto(signingLink, { timeout: 120000 });
  await signer.getByLabel('Your full name', { exact: true }).fill('QA Test Signer');
  await signer.getByRole('checkbox', { name: /I have read this agreement/ }).check();
  await signer.getByRole('button', { name: 'Sign agreement', exact: true }).click();
  await signer.getByRole('status').filter({ hasText: 'signed agreement has been saved' }).waitFor();
  await signer.screenshot({ path: `${output}/signed-agreement-desktop.png`, fullPage: true });
  await signer.setViewportSize({ width: 390, height: 844 });
  assert.ok(await signer.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await signer.screenshot({ path: `${output}/signed-agreement-mobile.png`, fullPage: true });
  await signer.emulateMedia({ media: 'print' });
  assert.equal(await signer.locator('.agreement-controls').first().isVisible(), false);
  const pdf = await signer.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' } });
  const pdfDocument = await PDFDocument.load(pdf);
  assert.ok(pdfDocument.getPages().length >= 2);
  await writeFile('output/pdf/qa-service-agreement-2026-11-01.pdf', pdf);
  report.pdfPages = pdfDocument.getPages().length;
  report.checks.push('Anonymous private-link review/signing saves immutable proof, fits 390px, and prints a multi-page signed copy without navigation or action controls.');
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
  console.log(JSON.stringify(report, null, 2));
} catch (error) { report.failure = error.message; throw error; }
finally {
  await browser.close();
  try { await client.query('ROLLBACK'); } catch {} finally { await client.end(); }
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
}
