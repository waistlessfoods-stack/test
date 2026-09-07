// No network requests, email delivery, database writes, or real charges.
import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

const baseLoad = sourceLoader({ 'server-only': {} });
const content = baseLoad('lib/service-invoice-content.ts');
const { parseServiceInvoice, parseInvoiceRequestKey, invoiceInputTotal } = content;
const input = { name: 'QA Customer', email: 'qa@example.com', service: 'private_chef', title: 'Dinner for six', eventDate: '2026-10-10', notes: 'Agreed dinner service.', daysUntilDue: 14, items: [{ description: 'Dinner guests', quantity: 6, unitAmount: 10000 }, { description: 'Preparation', quantity: 1, unitAmount: 15000 }] };

test('money validation uses integer cents and enforces a bounded positive total', () => {
  assert.equal(invoiceInputTotal(parseServiceInvoice(input)), 75000);
  for (const items of [[], [{ description: 'a', quantity: 1, unitAmount: 0 }], [{ description: 'a', quantity: 1, unitAmount: 1.5 }], [{ description: 'a', quantity: 0, unitAmount: 100 }], [{ description: 'a', quantity: 1, unitAmount: 10000000 }], Array(9).fill(input.items[0])]) assert.throws(() => parseServiceInvoice({ ...input, items }));
});
test('invalid recipients, controls, dates, payment terms, and service types are rejected', () => {
  for (const patch of [{ email: 'bad' }, { email: 'a@example.com\nBcc:evil@example.com' }, { title: '' }, { eventDate: '2026-02-30' }, { daysUntilDue: 0 }, { daysUntilDue: 91 }, { service: 'recipe' }, { notes: 'x'.repeat(1501) }]) assert.throws(() => parseServiceInvoice({ ...input, ...patch }));
  assert.equal(parseServiceInvoice({ ...input, email: 'QA@EXAMPLE.COM' }).email, 'qa@example.com');
});
test('expired submission keys cannot create duplicates after Stripe idempotency expires', () => {
  assert.ok(parseInvoiceRequestKey(`${Date.now()}-${randomUUID()}`));
  for (const key of [null, 'x', `${Date.now() - 86400000}-${randomUUID()}`, `${Date.now() + 300000}-${randomUUID()}`]) assert.throws(() => parseInvoiceRequestKey(key));
});

function stripeMock() {
  const invoices = new Map(); const customers = new Map(); const cache = new Map(); const calls = []; let failureLine = false;
  async function once(name, args, options, run) {
    calls.push({ name, args, options });
    const key = options?.idempotencyKey;
    if (key && cache.has(key)) { const cached = cache.get(key); if (cached.args !== JSON.stringify(args)) throw Object.assign(new Error('changed'), { type: 'StripeIdempotencyError' }); return structuredClone(cached.result); }
    const result = await run(); if (key) cache.set(key, { args: JSON.stringify(args), result: structuredClone(result) }); return structuredClone(result);
  }
  const stripe = {
    customers: {
      create: (args, opts) => once('customer.create', args, opts, () => { const c = { id: `cus_test${customers.size}`, ...args }; customers.set(c.id, c); return c; }),
      list: async args => { calls.push({ name: 'customer.list', args }); return { data: [...customers.values()].filter(c => c.email === args.email), has_more: false }; },
    },
    invoices: {
      create: (args, opts) => once('invoice.create', args, opts, () => { const c = customers.get(args.customer); const i = { id: `in_test${invoices.size}`, ...args, customer_name: c.name, customer_email: c.email, currency: 'usd', status: 'draft', total: 0, amount_paid: 0, amount_remaining: 0, number: null, due_date: null, created: 1788800000, livemode: false, status_transitions: { paid_at: null }, lines: { data: [], has_more: false } }; invoices.set(i.id, i); return i; }),
      retrieve: async id => structuredClone(invoices.get(id)),
      update: (id, args, opts) => once('invoice.update', args, opts, () => { const i = invoices.get(id); i.metadata = { ...i.metadata, ...args.metadata }; return i; }),
      finalizeInvoice: (id, args, opts) => once('invoice.finalize', args, opts, () => { const i = invoices.get(id); i.status = 'open'; i.number = 'QA-0001'; i.hosted_invoice_url = 'https://invoice.stripe.com/test'; return i; }),
      sendInvoice: (id, args, opts) => once('invoice.send', args, opts, () => invoices.get(id)),
      voidInvoice: (id, args, opts) => once('invoice.void', args, opts, () => { const i = invoices.get(id); i.status = 'void'; return i; }),
      list: async args => ({ data: [...invoices.values()].filter(i => !args.customer || i.customer === args.customer), has_more: false }),
    },
    invoiceItems: { create: (args, opts) => once('item.create', args, opts, () => { if (failureLine) { failureLine = false; throw new Error('simulated interruption'); } const i = invoices.get(args.invoice); i.lines.data.push({ description: args.description, quantity: args.quantity, amount: args.quantity * args.unit_amount }); i.total += args.quantity * args.unit_amount; i.amount_remaining = i.total; return { id: `ii_${i.lines.data.length}` }; }) },
  };
  return { stripe, invoices, customers, calls, failNextLine: () => { failureLine = true; } };
}
const service = baseLoad('lib/service-invoices.ts');
test('draft creation excludes pending items and disables automatic collection and delivery', async () => {
  const { stripe, calls } = stripeMock();
  const draft = await service.createServiceInvoice(stripe, input, 'key1');
  assert.equal(draft.status, 'draft'); assert.equal(draft.total, 75000); assert.equal(draft.ready, true);
  const creation = calls.find(c => c.name === 'invoice.create').args;
  assert.equal(creation.auto_advance, false); assert.equal(creation.pending_invoice_items_behavior, 'exclude'); assert.equal(creation.collection_method, 'send_invoice');
  assert.deepEqual(creation.default_tax_rates, []); assert.deepEqual(creation.discounts, []);
  assert.ok(calls.filter(c => c.name === 'item.create').every(c => c.args.invoice === draft.id));
  assert.equal(calls.filter(c => /send|finalize/.test(c.name)).length, 0);
});
test('identical submission retry does not duplicate customers, invoices, or line amounts', async () => {
  const { stripe, invoices, customers } = stripeMock();
  const first = await service.createServiceInvoice(stripe, input, 'key');
  const second = await service.createServiceInvoice(stripe, input, 'key');
  assert.equal(first.id, second.id); assert.equal(second.total, 75000); assert.equal(invoices.size, 1); assert.equal(customers.size, 1);
  await assert.rejects(() => service.createServiceInvoice(stripe, { ...input, items: [{ ...input.items[0], description: 'Changed' }, input.items[1]] }, 'key'));
});
test('interrupted assembly cannot be issued, and retry completes the same draft', async () => {
  const mock = stripeMock(); mock.failNextLine();
  await assert.rejects(() => service.createServiceInvoice(mock.stripe, input, 'key'));
  const id = [...mock.invoices.keys()][0];
  await assert.rejects(() => service.actOnServiceInvoice(mock.stripe, id, 'finalize', 75000), /incomplete/);
  const complete = await service.createServiceInvoice(mock.stripe, input, 'key');
  assert.equal(complete.total, 75000); assert.equal(complete.ready, true); assert.equal(mock.invoices.size, 1);
});
test('issuing validates displayed amount, and only explicit send requests deliver', async () => {
  const mock = stripeMock(); const draft = await service.createServiceInvoice(mock.stripe, input, 'key');
  await assert.rejects(() => service.actOnServiceInvoice(mock.stripe, draft.id, 'finalize', 74999), /amount changed/);
  const issued = await service.actOnServiceInvoice(mock.stripe, draft.id, 'finalize', draft.total);
  assert.equal(issued.status, 'open'); assert.ok(issued.hostedUrl);
  assert.equal(mock.calls.filter(c => c.name === 'invoice.send').length, 0);
  await service.actOnServiceInvoice(mock.stripe, draft.id, 'send');
  assert.equal(mock.calls.filter(c => c.name === 'invoice.send').length, 1);
});
test('paid invoices cannot be emailed as unpaid or voided; unknown actions rejected', async () => {
  const mock = stripeMock(); const draft = await service.createServiceInvoice(mock.stripe, input, 'key');
  mock.invoices.get(draft.id).status = 'paid';
  for (const action of ['finalize', 'send', 'void', 'mark_paid']) await assert.rejects(() => service.actOnServiceInvoice(mock.stripe, draft.id, action, draft.total));
});
test('unrelated Stripe invoices cannot be read or mutated through service APIs', async () => {
  const mock = stripeMock(); const draft = await service.createServiceInvoice(mock.stripe, input, 'key');
  mock.invoices.get(draft.id).metadata.source = 'other';
  await assert.rejects(() => service.getServiceInvoice(mock.stripe, draft.id), /not found/);
  assert.equal((await service.listServiceInvoices(mock.stripe)).invoices.length, 0);
});
test('member list hides drafts, other billing emails, and unrelated Stripe invoices', async () => {
  const mock = stripeMock(); const draft = await service.createServiceInvoice(mock.stripe, input, 'key');
  assert.equal((await service.listMemberServiceInvoices(mock.stripe, input.email)).invoices.length, 0);
  await service.actOnServiceInvoice(mock.stripe, draft.id, 'finalize', draft.total);
  assert.equal((await service.listMemberServiceInvoices(mock.stripe, input.email)).invoices.length, 1);
  assert.equal((await service.listMemberServiceInvoices(mock.stripe, 'other@example.com')).invoices.length, 0);
  mock.invoices.get(draft.id).customer_email = 'other@example.com';
  assert.equal((await service.listMemberServiceInvoices(mock.stripe, input.email)).invoices.length, 0);
});
test('void is reflected directly in tracking, with no recipe order writes', async () => {
  const mock = stripeMock(); const draft = await service.createServiceInvoice(mock.stripe, input, 'key');
  await service.actOnServiceInvoice(mock.stripe, draft.id, 'finalize', draft.total);
  assert.equal((await service.actOnServiceInvoice(mock.stripe, draft.id, 'void')).status, 'void');
});
test('invoice view reports paid and overdue states from Stripe balances', async () => {
  const mock = stripeMock(); const draft = await service.createServiceInvoice(mock.stripe, input, 'key');
  const i = mock.invoices.get(draft.id); i.status = 'open'; i.due_date = 1;
  assert.equal(service.invoiceView(i).overdue, true);
  i.status = 'paid'; i.amount_paid = i.total; i.amount_remaining = 0;
  const view = service.invoiceView(i); assert.equal(view.overdue, false); assert.equal(view.paid, i.total); assert.equal(view.remaining, 0);
});

test('HTTP guards protect every admin endpoint and require verified member identity', async () => {
  process.env.ADMIN_PASSWORD ||= 'unit-test-only';
  let identity = null; let reads = 0;
  const mock = stripeMock();
  const load = sourceLoader({ 'server-only': {}, '@clerk/nextjs/server': { currentUser: async () => identity }, '@/lib/service-invoices': { ...service, serviceStripe: () => mock.stripe, listMemberServiceInvoices: async (_stripe, email) => { reads++; return { invoices: [], email, next: null }; } } });
  const list = load('app/api/admin/service-invoices/route.ts');
  const detail = load('app/api/admin/service-invoices/[id]/route.ts');
  const member = load('app/api/account/service-invoices/route.ts');
  const token = load('lib/admin-session.ts').createAdminSessionToken();
  const context = { params: Promise.resolve({ id: 'in_test123' }) };
  const request = (url, method = 'GET', admin = false, origin = 'https://qa.example.com', body = {}) => new NextRequest(`https://qa.example.com${url}`, { method, headers: { origin, ...(admin ? { cookie: `wlf_admin_session=${token}` } : {}) }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
  assert.equal((await list.GET(request('/api/admin/service-invoices'))).status, 401);
  assert.equal((await list.POST(request('/api/admin/service-invoices', 'POST'))).status, 401);
  assert.equal((await detail.GET(request('/api/admin/service-invoices/in_test123'), context)).status, 401);
  assert.equal((await detail.POST(request('/api/admin/service-invoices/in_test123', 'POST'), context)).status, 401);
  assert.equal((await list.POST(request('/api/admin/service-invoices', 'POST', true, 'https://evil.example.com'))).status, 403);
  assert.equal((await detail.POST(request('/api/admin/service-invoices/in_test123', 'POST', true, 'https://evil.example.com'), context)).status, 403);
  assert.equal((await member.GET(request('/api/account/service-invoices'))).status, 401);
  identity = { primaryEmailAddressId: 'e1', emailAddresses: [{ id: 'e1', emailAddress: input.email, verification: { status: 'unverified' } }] };
  assert.equal((await member.GET(request('/api/account/service-invoices'))).status, 403); assert.equal(reads, 0);
  identity.emailAddresses[0].verification.status = 'verified';
  const response = await member.GET(request('/api/account/service-invoices?email=victim@example.com'));
  assert.equal(response.status, 200); assert.equal((await response.json()).email, input.email);
  assert.match(response.headers.get('cache-control'), /no-store/);
});
