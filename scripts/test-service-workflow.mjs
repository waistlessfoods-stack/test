// No Stripe/Clerk requests or SMTP. --integration uses only PostgreSQL TEMP
// tables inside a rolled-back transaction, never permanent customer records.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@react-email/render';
import Stripe from 'stripe';
import pg from 'pg';
import { sourceLoader } from './lib/load-typescript.mjs';
import { NextRequest } from 'next/server.js';

const load = sourceLoader({ 'server-only': {} });
const contentModule = load('lib/service-agreement-content.ts');
const { parseAgreementContent, assertAgreementReady, canonicalAgreement } = contentModule;
const sample = { name: 'QA Test Customer', email: 'qa@example.com', phone: '555-0100', service: 'private_chef', title: 'QA TEST ONLY — Fictional agreement', eventDate: '2027-01-20', endDate: '', location: 'Fictional test venue', guests: 8, amount: 20000, details: 'QA fixture. Not a real event.', terms: 'QA TEST ONLY. Fictional terms used to test electronic signing. Do not send or use for a real service.', source: 'QA fixture; not Amber\'s contract' };

test('agreement validation, immutable canonical representation, and explicit owner review', () => {
  assert.deepEqual(parseAgreementContent(sample), sample);
  assert.equal(canonicalAgreement(Object.fromEntries(Object.entries(sample).reverse())), canonicalAgreement(sample));
  for (const patch of [{ eventDate: '2027-02-30' }, { endDate: '2026-01-20' }, { email: 'invalid' }, { title: 'Title\nBcc: evil' }, { amount: 10.5 }, { guests: 0 }, { service: 'cooking_class' }]) assert.throws(() => parseAgreementContent({ ...sample, ...patch }));
  for (const patch of [{ terms: '' }, { source: '' }, { eventDate: '' }, { amount: 0 }]) assert.throws(() => assertAgreementReady({ ...sample, ...patch }, true));
  assert.throws(() => assertAgreementReady(sample, false));
  assertAgreementReady(sample, true);
});

test('customer agreement document escapes contract/customer text and identifies signature proof', () => {
  const Component = load('components/service-agreement-document.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Component, { agreement: { id: 'qa-reference', content: { ...sample, name: '<script>bad</script>' }, status: 'signed', documentHash: 'abc123', signature: { name: 'QA Signer', consent: contentModule.SIGNATURE_CONSENT, signedAt: '2026-11-01T12:00:00Z', documentHash: 'abc123' } } }));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  for (const text of ['QA Signer', 'Document SHA-256', 'abc123', '$200.00']) assert.ok(html.includes(text), text);
});

test('business payment notification uses info, escaped invoice details, and a clear sandbox warning', async () => {
  const sends = [];
  const modules = sourceLoader({ 'server-only': {}, '@/lib/email/mailer': { sendEmail: async value => { sends.push(value); return { error: null }; } } });
  const mail = modules('lib/email/service-invoice-payment.tsx');
  const invoice = { id: 'in_qatest123', number: 'QA-0001', title: 'QA TEST invoice', name: '<script>test</script>', email: 'qa@example.com', live: false, paid: 5000, remaining: 0, currency: 'usd', bookingId: 1 };
  await mail.sendServiceInvoicePayment(invoice);
  assert.equal(sends[0].to, 'info@waistlessfoods.com'); assert.equal(sends[0].replyTo, 'qa@example.com'); assert.ok(sends[0].subject.startsWith('[TEST]'));
  const html = await render(sends[0].react);
  assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;'));
  for (const text of ['TEST PAYMENT', 'Do not fulfill', '$50.00', 'QA-0001']) assert.ok(html.includes(text), text);
});

test('agreement APIs protect admin mutations, customer identities, and same-origin signing', async t => {
  const oldPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD ||= 'qa-workflow-only';
  t.after(() => { if (oldPassword === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = oldPassword; });
  let identity = null; let reads = 0; let memberEmail = null;
  const modules = sourceLoader({
    'server-only': {},
    '@clerk/nextjs/server': { currentUser: async () => identity },
    '@/lib/service-workflow-store': { agreements: {
      list: async () => { reads++; return []; },
      read: async () => { reads++; return {}; },
      review: async () => { reads++; return {}; },
      memberList: async email => { memberEmail = email; return []; },
    } },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ limited: false }) },
    '@/lib/email/mailer': { sendEmail: async () => { throw new Error('No email should be sent by guard tests.'); } },
  });
  const token = modules('lib/admin-session.ts').createAdminSessionToken();
  const request = (url, method = 'GET', admin = false, origin = 'https://qa.example.com', body = {}) => new NextRequest(`https://qa.example.com${url}`, { method, headers: { origin, ...(admin ? { cookie: `wlf_admin_session=${token}` } : {}) }, ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}) });
  const list = modules('app/api/admin/service-agreements/route.ts');
  const detail = modules('app/api/admin/service-agreements/[id]/route.ts');
  const context = { params: Promise.resolve({ id: '00000000-0000-4000-8000-000000000001' }) };
  for (const [handler, method] of [[list.GET, 'GET'], [list.POST, 'POST'], [detail.GET, 'GET'], [detail.PATCH, 'PATCH'], [detail.POST, 'POST']]) assert.equal((await handler(request('/api/admin/service-agreements', method), context)).status, 401);
  assert.equal((await detail.PATCH(request('/api/admin/service-agreements', 'PATCH', true, 'https://evil.test'), context)).status, 403);
  assert.equal(reads, 0);
  const member = modules('app/api/account/service-agreements/route.ts');
  assert.equal((await member.GET()).status, 401);
  identity = { primaryEmailAddressId: 'e1', emailAddresses: [{ id: 'e1', emailAddress: 'QA@example.com', verification: { status: 'unverified' } }] };
  assert.equal((await member.GET()).status, 403);
  identity.emailAddresses[0].verification.status = 'verified';
  assert.equal((await member.GET()).status, 200); assert.equal(memberEmail, 'qa@example.com');
  const publicRoute = modules('app/api/service-agreements/route.ts');
  assert.equal(publicRoute.GET, undefined);
  assert.equal((await publicRoute.POST(request('/api/service-agreements', 'POST', false, 'https://evil.test', { action: 'review', token: 'fake' }))).status, 403);
  assert.equal(reads, 0);
  const response = await publicRoute.POST(request('/api/service-agreements', 'POST', false, 'https://qa.example.com', { action: 'review', token: 'fake' }));
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/); assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
});

function stripeFixture() {
  const invoices = new Map(); const customers = new Map(); const cache = new Map();
  const copy = value => structuredClone(value);
  async function once(options, work) { const key = options?.idempotencyKey; if (cache.has(key)) return copy(cache.get(key)); const result = await work(); if (key) cache.set(key, copy(result)); return copy(result); }
  const stripe = {
    customers: { create: (input, options) => once(options, () => { const customer = { id: `cus_fixture${customers.size}`, ...input }; customers.set(customer.id, customer); return customer; }) },
    invoices: {
      create: (input, options) => once(options, () => { const customer = customers.get(input.customer); const invoice = { id: `in_fixture${invoices.size}`, ...input, customer_name: customer.name, customer_email: customer.email, status: 'draft', total: 0, amount_paid: 0, amount_remaining: 0, number: null, due_date: null, created: 1793520000, livemode: false, status_transitions: { paid_at: null }, lines: { data: [], has_more: false } }; invoices.set(invoice.id, invoice); return invoice; }),
      retrieve: async id => copy(invoices.get(id)),
      update: (id, input, options) => once(options, () => { const invoice = invoices.get(id); invoice.metadata = { ...invoice.metadata, ...input.metadata }; return invoice; }),
    },
    invoiceItems: { create: (input, options) => once(options, () => { const invoice = invoices.get(input.invoice); invoice.lines.data.push({ description: input.description, quantity: input.quantity, amount: input.quantity * input.unit_amount }); invoice.total += input.quantity * input.unit_amount; invoice.amount_remaining = invoice.total; return { id: `ii_fixture${invoice.lines.data.length}` }; }) },
    webhooks: new Stripe('sk_test_fixture', { apiVersion: '2024-06-20' }).webhooks,
  };
  return { stripe, invoices };
}

test('agreement and invoice workflow with isolated SQL and verified webhook events', { skip: !process.argv.includes('--integration') && 'Pass --integration with DATABASE_URL' }, async t => {
  assert.ok(process.env.DATABASE_URL);
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname.endsWith('.neon.tech')) url.hostname = url.hostname.replace(/-pooler(?=\.)/, '');
  url.searchParams.set('sslmode', 'verify-full');
  const client = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 15000 });
  await client.connect();
  client.on('error', () => {}); // A terminated session is reported by the failing query.
  t.after(async () => { try { await client.query('ROLLBACK'); } catch {} finally { await client.end(); } });
  await client.query('BEGIN');
  await client.query('SET LOCAL search_path TO pg_temp');
  await client.query('CREATE TEMP TABLE bookings (id integer PRIMARY KEY, service_slug text, first_name text,last_name text,email text,phone text,guests integer,preferred_date text,alternative_date text,notes text)');
  const migration = await readFile(new URL('../drizzle/0013_service_agreements.sql', import.meta.url), 'utf8');
  await client.query(migration.replaceAll('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE'));
  const { rows: tables } = await client.query("SELECT relnamespace=pg_my_temp_schema() AS isolated FROM pg_class WHERE oid IN ('bookings'::regclass,'service_agreements'::regclass,'service_invoice_records'::regclass)");
  assert.equal(tables.length, 3); assert.ok(tables.every(row => row.isolated));
  await client.query("INSERT INTO bookings VALUES (1,'private','QA Test','Customer','qa@example.com','555-0100',8,'January 20th, 2027','January 21st, 2027','Budget range: $200\n\nEvent details:\nQA fixture only.'),(2,'complimentary-consultation','QA','Other','other@example.com','555-0101',2,'2027-01-20',null,'QA consultation')");
  const query = async (sql, values = []) => (await client.query(sql, values)).rows;
  // Model complete transaction boundaries on the single TEMP-table session.
  // Production uses separate committed postgres.begin transactions and row locks.
  let tail = Promise.resolve();
  const database = { query, transaction: work => { const operation = tail.then(() => work(query)); tail = operation.catch(() => {}); return operation; } };
  const agreements = load('lib/service-agreements.ts').createAgreementService(database);
  const workflow = load('lib/service-invoice-workflow.ts').createInvoiceWorkflow(database);
  let draft; let issued;

  await t.test('draft reuses inquiry fields and never invents terms; repeated creation reuses the draft', async () => {
    draft = await agreements.createFromBooking(1);
    assert.equal(draft.content.name, sample.name); assert.equal(draft.content.eventDate, '2027-01-20');
    assert.equal(draft.content.email, sample.email); assert.equal(draft.content.guests, 8);
    assert.ok(draft.content.details.includes('January 21st, 2027')); assert.ok(draft.content.details.includes('Budget range: $200'));
    assert.equal(draft.content.terms, ''); assert.equal(draft.content.amount, 0);
    assert.equal((await agreements.createFromBooking(1)).id, draft.id);
    await assert.rejects(() => agreements.createFromBooking(2), /Private Chef and Catering/);
    await assert.rejects(() => agreements.issue(draft.id, draft.version, true), /approved contract/);
  });
  await t.test('optimistic saves reject stale changes; issuing requires reviewed saved content', async () => {
    draft = await agreements.save(draft.id, draft.version, sample);
    await assert.rejects(() => agreements.save(draft.id, draft.version - 1, sample), /changed/);
    await assert.rejects(() => agreements.issue(draft.id, draft.version, false), /Review/);
    issued = await agreements.issue(draft.id, draft.version, true);
    assert.equal(issued.agreement.status, 'issued'); assert.equal(issued.token.length, 43);
    const [stored] = await query('SELECT token_hash FROM service_agreements WHERE id=$1', [draft.id]);
    assert.notEqual(stored.token_hash, issued.token); assert.equal(stored.token_hash.length, 64);
    await assert.rejects(() => agreements.save(draft.id, issued.agreement.version, sample), /editable draft/);
  });
  await t.test('replacement links invalidate old links; expired and malformed links reveal nothing', async () => {
    const previous = issued.token;
    issued = await agreements.renewLink(draft.id, issued.agreement.version);
    await assert.rejects(() => agreements.review(previous), /unavailable/);
    await assert.rejects(() => agreements.review('invalid'), /unavailable/);
    await query("UPDATE service_agreements SET expires_at=now()-interval '1 second' WHERE id=$1", [draft.id]);
    await assert.rejects(() => agreements.review(issued.token), /expired/);
    await query("UPDATE service_agreements SET expires_at=now()+interval '30 days' WHERE id=$1", [draft.id]);
    assert.ok((await agreements.review(issued.token)).viewedAt);
  });
  await t.test('signature binds the exact preview, requires consent, and cannot be overwritten', async () => {
    await assert.rejects(() => agreements.sign(issued.token, issued.agreement.documentHash, 'QA Signer', false), /Confirm/);
    await assert.rejects(() => agreements.sign(issued.token, 'changed', 'QA Signer', true), /preview/);
    const [first, retry] = await Promise.all([agreements.sign(issued.token, issued.agreement.documentHash, 'QA Signer', true), agreements.sign(issued.token, issued.agreement.documentHash, 'QA Signer', true)]);
    assert.equal(first.status, 'signed'); assert.deepEqual(first.signature, retry.signature);
    await assert.rejects(() => agreements.sign(issued.token, issued.agreement.documentHash, 'Another Signer', true), /already been signed/);
    await assert.rejects(() => agreements.voidAgreement(first.id, first.version), /unsigned/);
    assert.equal((await agreements.memberList('other@example.com')).length, 0);
    assert.equal((await agreements.memberList('qa@example.com'))[0].id, first.id);
    await query("UPDATE service_agreements SET content=jsonb_set(content,'{details}','\"Altered after signing\"') WHERE id=$1", [first.id]);
    await assert.rejects(() => agreements.read(first.id), /does not match its issued copy/);
    await query('UPDATE service_agreements SET content=$2::jsonb WHERE id=$1', [first.id, JSON.stringify(first.content)]);
  });
  await t.test('voiding an unsigned agreement invalidates its token and a new draft can be created', async () => {
    const nextDraft = await agreements.createFromBooking(1);
    const saved = await agreements.save(nextDraft.id, nextDraft.version, sample);
    const nextIssued = await agreements.issue(saved.id, saved.version, true);
    await agreements.voidAgreement(saved.id, nextIssued.agreement.version);
    await assert.rejects(() => agreements.review(nextIssued.token), /unavailable/);
    const newDraft = await agreements.createFromBooking(1);
    assert.notEqual(newDraft.id, nextDraft.id);
    assert.equal((await agreements.memberList(sample.email)).length, 1);
  });
  const mock = stripeFixture();
  const invoiceInput = { name: sample.name, email: sample.email, service: sample.service, title: 'QA TEST invoice', eventDate: sample.eventDate, notes: '', daysUntilDue: 14, agreementId: draft.id, items: [{ description: 'QA TEST deposit', quantity: 1, unitAmount: 5000 }] };
  let deposit; let balance; let correctedBalance;
  await t.test('signed agreement data flows to Stripe; same-submission retries reuse the invoice', async () => {
    deposit = await workflow.create(mock.stripe, invoiceInput, 'qa-first');
    assert.equal(deposit.agreementId, draft.id); assert.equal(deposit.bookingId, 1);
    assert.equal((await workflow.create(mock.stripe, invoiceInput, 'qa-first')).id, deposit.id);
    assert.equal(mock.invoices.size, 1);
    await assert.rejects(() => workflow.create(mock.stripe, { ...invoiceInput, email: 'other@example.com' }, 'qa-wrong'), /must match/);
    await assert.rejects(() => workflow.create(mock.stripe, { ...invoiceInput, eventDate: '2027-01-21' }, 'qa-wrongdate'), /must match/);
    await assert.rejects(() => workflow.create(mock.stripe, { ...invoiceInput, title: 'Changed' }, 'qa-first'), /different invoice/);
  });
  await t.test('deposit/balance invoices cannot exceed the signed total; voided drafts release their amount', async () => {
    balance = await workflow.create(mock.stripe, { ...invoiceInput, items: [{ description: 'QA TEST balance', quantity: 1, unitAmount: 15000 }] }, 'qa-balance');
    await assert.rejects(() => workflow.create(mock.stripe, invoiceInput, 'qa-too-much'), /exceed the signed total/);
    mock.invoices.get(balance.id).status = 'void'; await workflow.sync(mock.stripe, balance.id);
    correctedBalance = await workflow.create(mock.stripe, { ...invoiceInput, items: [{ description: 'QA TEST corrected balance', quantity: 1, unitAmount: 15000 }] }, 'qa-new-balance');
  });
  await t.test('verified webhook reads current Stripe status, marks the website paid, and deduplicates business notification', async () => {
    const invoice = mock.invoices.get(deposit.id); invoice.status = 'paid'; invoice.amount_paid = invoice.total; invoice.amount_remaining = 0;
    const sends = [];
    const webhookSecret = 'whsec_workflow_qa_only';
    const webhookLoad = sourceLoader({
      'server-only': {}, stripe: function StripeFixture() { return mock.stripe; },
      '@/lib/db': { db: {} }, '@/lib/stripe-config': { getStripeSecretKey: () => 'sk_test_qa', getStripeWebhookSecret: () => webhookSecret },
      '@/lib/service-invoice-workflow-store': { invoiceWorkflow: workflow },
      '@/lib/email/service-invoice-payment': { sendServiceInvoicePayment: async value => sends.push(value) },
      '@/lib/email/send-order-confirmation': { sendOrderConfirmationOnce: async () => {} },
    });
    const handler = webhookLoad('app/api/stripe/webhook/route.ts').POST;
    const payload = JSON.stringify({ id: 'evt_qa_paid', object: 'event', api_version: '2024-06-20', type: 'invoice.paid', data: { object: { ...invoice, status: 'open', amount_paid: 0 } } });
    const signature = mock.stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
    const request = sig => new Request('https://qa.example.com/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': sig }, body: payload });
    assert.equal((await handler(request('invalid'))).status, 400); assert.equal(sends.length, 0);
    assert.equal((await handler(request(signature))).status, 200);
    assert.equal((await handler(request(signature))).status, 200);
    assert.equal(sends.length, 1); assert.equal(sends[0].status, 'paid');
    const [stored] = await query('SELECT status,paid,remaining,notified_at FROM service_invoice_records WHERE invoice_id=$1', [deposit.id]);
    assert.equal(stored.status, 'paid'); assert.equal(stored.paid, 5000); assert.equal(stored.remaining, 0); assert.ok(stored.notified_at);
  });
  await t.test('ambiguous email failures are visible and never automatically resent; explicit reviewed retry recovers', async () => {
    const invoice = mock.invoices.get(correctedBalance.id); invoice.status = 'paid'; invoice.amount_paid = invoice.total; invoice.amount_remaining = 0;
    const view = await workflow.sync(mock.stripe, correctedBalance.id);
    let attempts = 0;
    const fail = async () => { attempts++; throw new Error('QA SMTP ambiguous disconnect'); };
    assert.equal((await workflow.notify(view, fail)).status, 'needs_review');
    assert.equal((await workflow.notify(view, fail)).status, 'needs_review'); assert.equal(attempts, 1);
    assert.equal((await workflow.retryNotification(view, async () => { attempts++; })).status, 'sent'); assert.equal(attempts, 2);
    await workflow.retryNotification(view, async () => { attempts++; }); assert.equal(attempts, 2);
  });
});
