// Explicit local-only Stripe TEST-mode browser QA. Creates test invoices and
// a temporary Clerk user; never uses the live key or a real payment method.
// Finalized Stripe test invoices remain as labelled QA audit records.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import Stripe from 'stripe';

if (!process.argv.includes('--run-test-qa')) throw new Error('Pass --run-test-qa to create sandbox QA records.');
const base = 'http://localhost:3010';
const key = process.env.sandbox_secret_key_stripe;
assert.ok(key?.startsWith('sk_test_'), 'A Stripe test key is required');
const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
const run = Date.now();
const email = `service-qa-${run}@example.com`;
const directory = `docs/audit-screenshots/service-invoices-${new Date().toISOString().slice(0, 10)}`;
await mkdir(directory, { recursive: true });
const report = { localOnly: true, stripeMode: 'test', checks: {}, screenshots: [], cleanup: {}, testInvoiceIds: [] };
const payload = `${Date.now() + 3600000}.${randomBytes(16).toString('hex')}`;
const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
assert.ok(secret);
const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
const browser = await chromium.launch({ headless: true });
const admin = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
await admin.addCookies([{ name: 'wlf_admin_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' }]);
let clerkUserId;
const createdCustomers = new Set();
async function clerk(path, method, body) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, { method, headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(`Clerk ${method} ${path.split('/')[1]} failed (${response.status})`);
  return response.json();
}
async function shot(page, filename) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => window.scrollY === 0);
  await page.screenshot({ path: `${directory}/${filename}`, fullPage: true, animations: 'disabled' });
  report.screenshots.push(filename);
}
try {
  const configuration = await admin.request.get(base + '/api/admin/service-invoices');
  assert.equal(configuration.status(), 200);
  assert.equal((await configuration.json()).mode, 'test', 'Refusing to create QA invoices on a live-configured server');
  const anon = await browser.newContext();
  for (const url of ['/api/admin/service-invoices', '/api/account/service-invoices']) assert.equal((await anon.request.get(base + url)).status(), 401);
  report.checks.anonymousProtected = true;
  await anon.close();
  const memberUser = await clerk('/users', 'POST', { email_address: [email], first_name: 'QA', last_name: 'Service Invoice', skip_password_requirement: true });
  clerkUserId = memberUser.id;
  const ticket = await clerk('/sign_in_tokens', 'POST', { user_id: clerkUserId, expires_in_seconds: 600 });
  const page = await admin.newPage();
  await page.goto(base + '/admin/service-invoices');
  await page.getByRole('heading', { level: 1, name: 'Service invoices' }).waitFor();
  await page.getByRole('button', { name: 'New invoice draft' }).click();
  await page.getByLabel('Customer name', { exact: true }).fill('QA TEST — DO NOT FULFILL');
  await page.getByLabel('Customer email', { exact: true }).fill(email);
  await page.getByLabel('Invoice title', { exact: true }).fill(`QA Private Dinner ${run}`);
  await page.getByLabel('Event date (optional)').fill('2026-10-10');
  await page.getByLabel('Description 1', { exact: true }).fill('Seasonal private dinner — six guests');
  await page.getByLabel('Quantity', { exact: true }).fill('6');
  await page.getByLabel('Unit price (USD)', { exact: true }).fill('100.00');
  await page.getByRole('button', { name: '+ Add line (up to 8)', exact: true }).click();
  await page.getByLabel('Description 2', { exact: true }).fill('Menu planning and preparation');
  await page.getByLabel('Unit price (USD)', { exact: true }).nth(1).fill('150.00');
  await page.getByLabel('Customer-facing service details & notes').fill('QA TEST ONLY — no service or real payment.\n\nA seasonal menu prepared in your kitchen. Includes menu planning, ingredients, dinner service, and cleanup.');
  await shot(page, '01-invoice-editor-desktop.png');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot(page, '02-invoice-editor-mobile.png');
  await page.setViewportSize({ width: 1440, height: 1080 });
  const saved = page.waitForResponse(response => response.url().endsWith('/api/admin/service-invoices') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save draft in Stripe', exact: true }).click();
  const savedResponse = await saved;
  assert.equal(savedResponse.status(), 201);
  const draft = (await savedResponse.json()).invoice;
  assert.equal(draft.live, false, 'Refusing to operate on a live invoice');
  report.testInvoiceIds.push(draft.id);
  const stripeDraft = await stripe.invoices.retrieve(draft.id);
  createdCustomers.add(stripeDraft.customer);
  assert.equal(stripeDraft.status, 'draft'); assert.equal(stripeDraft.auto_advance, false); assert.equal(draft.total, 75000);
  const savedRequest = savedResponse.request();
  const retried = await admin.request.post(base + '/api/admin/service-invoices', { headers: { origin: base, 'Idempotency-Key': savedRequest.headers()['idempotency-key'] }, data: savedRequest.postDataJSON() });
  assert.equal(retried.status(), 201); assert.equal((await retried.json()).invoice.id, draft.id);
  report.checks.realStripeDraftAndIdempotency = true;
  await page.getByText('Draft saved in Stripe. Nothing was emailed or charged.', { exact: true }).waitFor();
  await shot(page, '03-draft-review.png');
  page.on('dialog', dialog => dialog.accept());
  const finalized = page.waitForResponse(response => response.url().endsWith(`/api/admin/service-invoices/${draft.id}`) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Issue invoice & payment link', exact: true }).click();
  const finalResponse = await finalized;
  assert.equal(finalResponse.status(), 200);
  const issued = (await finalResponse.json()).invoice;
  assert.equal(issued.status, 'open'); assert.ok(issued.hostedUrl); assert.ok(issued.pdfUrl);
  await page.getByText('Invoice issued. You can copy its payment link or explicitly email it below.', { exact: true }).waitFor();
  await shot(page, '04-issued-invoice.png');
  const pdf = await fetch(issued.pdfUrl); assert.ok(pdf.ok);
  const bytes = Buffer.from(await pdf.arrayBuffer()); assert.equal(bytes.subarray(0, 4).toString(), '%PDF');
  await writeFile(`${directory}/test-invoice.pdf`, bytes);
  report.checks.stripeHostedInvoiceAndPdf = true;
  const send = await admin.request.post(`${base}/api/admin/service-invoices/${draft.id}`, { headers: { origin: base }, data: { action: 'send' } });
  assert.equal(send.status(), 200);
  report.checks.testSendAcceptedNoEmailDelivered = true;

  const member = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  await member.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
  const memberPage = await member.newPage();
  await memberPage.goto(base + '/signin');
  await memberPage.waitForFunction(() => window.Clerk?.loaded, { timeout: 30000 });
  await memberPage.evaluate(async value => { const result = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket: value }); await window.Clerk.setActive({ session: result.createdSessionId }); }, ticket.token);
  await memberPage.goto(base + '/account/service-invoices');
  await memberPage.getByRole('heading', { level: 2, name: `QA Private Dinner ${run}` }).waitFor();
  await shot(memberPage, '05-member-invoice-desktop.png');
  await memberPage.setViewportSize({ width: 390, height: 844 });
  assert.ok(await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot(memberPage, '06-member-invoice-mobile.png');
  report.checks.verifiedMemberRead = true;
  const method = await stripe.paymentMethods.attach('pm_card_visa', { customer: stripeDraft.customer });
  const paid = await stripe.invoices.pay(draft.id, { payment_method: method.id });
  assert.equal(paid.livemode, false); assert.equal(paid.status, 'paid'); assert.equal(paid.amount_remaining, 0);
  await memberPage.getByRole('button', { name: 'Refresh payment status', exact: true }).click();
  await memberPage.getByText('paid', { exact: true }).waitFor();
  await shot(memberPage, '07-member-paid-mobile.png');
  const tracked = await admin.request.get(`${base}/api/admin/service-invoices/${draft.id}`);
  const trackedInvoice = (await tracked.json()).invoice;
  assert.equal(trackedInvoice.status, 'paid'); assert.equal(trackedInvoice.remaining, 0); assert.equal(trackedInvoice.paid, 75000);
  await page.getByRole('button', { name: 'Refresh payment status', exact: true }).click();
  await page.getByText('paid', { exact: true }).first().waitFor();
  await shot(page, '08-admin-paid-tracking.png');
  report.checks.realTestPaymentAndTracking = true;
  const refuseVoid = await admin.request.post(`${base}/api/admin/service-invoices/${draft.id}`, { headers: { origin: base }, data: { action: 'void' } });
  assert.equal(refuseVoid.status(), 409);
  report.checks.paidInvoiceCannotBeVoided = true;
  const voidDraft = await admin.request.post(base + '/api/admin/service-invoices', { headers: { origin: base, 'Idempotency-Key': `${Date.now()}-${crypto.randomUUID()}` }, data: { ...savedRequest.postDataJSON(), title: `QA VOID CHECK ${run}` } });
  assert.equal(voidDraft.status(), 201);
  const toVoid = (await voidDraft.json()).invoice; assert.equal(toVoid.live, false); report.testInvoiceIds.push(toVoid.id);
  createdCustomers.add((await stripe.invoices.retrieve(toVoid.id)).customer);
  assert.equal((await admin.request.post(`${base}/api/admin/service-invoices/${toVoid.id}`, { headers: { origin: base }, data: { action: 'finalize', expectedTotal: toVoid.total } })).status(), 200);
  const voidResponse = await admin.request.post(`${base}/api/admin/service-invoices/${toVoid.id}`, { headers: { origin: base }, data: { action: 'void' } });
  assert.equal(voidResponse.status(), 200); assert.equal((await voidResponse.json()).invoice.status, 'void');
  report.checks.realStripeVoid = true;
} finally {
  if (clerkUserId) { await clerk(`/users/${clerkUserId}`, 'DELETE'); report.cleanup.temporaryClerkUserRemoved = true; }
  for (const id of report.testInvoiceIds) {
    const invoice = await stripe.invoices.retrieve(id);
    if (invoice.status === 'open') await stripe.invoices.voidInvoice(id);
    else if (invoice.status === 'draft') await stripe.invoices.del(id);
  }
  report.cleanup.noPayableQaInvoicesRemain = true;
  // Stripe retains finalized test invoices for audit. Keep their test customers
  // so those records remain inspectable; never delete unrelated customer data.
  report.cleanup.labelledStripeTestCustomersRetained = createdCustomers.size;
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
