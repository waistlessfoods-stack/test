import Stripe from 'stripe';

// In-memory provider for browser/SQL tests. Never calls Stripe or sends mail.
export function stripeInvoiceFixture() {
  const invoices = new Map(); const customers = new Map(); const cache = new Map(); const calls = [];
  const copy = value => structuredClone(value);
  async function once(name, options, work) { const key = options?.idempotencyKey; calls.push(name); if (cache.has(key)) return copy(cache.get(key)); const result = await work(); if (key) cache.set(key, copy(result)); return copy(result); }
  const stripe = {
    customers: {
      create: (input, options) => once('customer.create', options, () => { const customer = { id: `cus_fixture${customers.size}`, ...input }; customers.set(customer.id, customer); return customer; }),
      list: async input => ({ data: [...customers.values()].filter(customer => customer.email === input.email), has_more: false }),
    },
    invoices: {
      create: (input, options) => once('invoice.create', options, () => { const customer = customers.get(input.customer); const invoice = { id: `in_fixture${invoices.size}`, ...input, customer_name: customer.name, customer_email: customer.email, status: 'draft', total: 0, amount_paid: 0, amount_remaining: 0, number: null, due_date: null, created: 1793520000, livemode: false, status_transitions: { paid_at: null }, lines: { data: [], has_more: false } }; invoices.set(invoice.id, invoice); return invoice; }),
      retrieve: async id => copy(invoices.get(id)),
      list: async input => ({ data: copy([...invoices.values()].filter(invoice => !input.customer || invoice.customer === input.customer)), has_more: false }),
      update: (id, input, options) => once('invoice.update', options, () => { const invoice = invoices.get(id); invoice.metadata = { ...invoice.metadata, ...input.metadata }; return invoice; }),
      finalizeInvoice: (id, _input, options) => once('invoice.finalize', options, () => { const invoice = invoices.get(id); invoice.status = 'open'; invoice.number = 'QA-0001'; invoice.hosted_invoice_url = 'https://invoice.stripe.com/qa-fixture-only'; return invoice; }),
      sendInvoice: (id, _input, options) => once('invoice.send', options, () => invoices.get(id)),
      voidInvoice: (id, _input, options) => once('invoice.void', options, () => { const invoice = invoices.get(id); invoice.status = 'void'; return invoice; }),
    },
    invoiceItems: { create: (input, options) => once('invoice.line', options, () => { const invoice = invoices.get(input.invoice); invoice.lines.data.push({ description: input.description, quantity: input.quantity, amount: input.quantity * input.unit_amount }); invoice.total += input.quantity * input.unit_amount; invoice.amount_remaining = invoice.total; return { id: `ii_fixture${invoice.lines.data.length}` }; }) },
    webhooks: new Stripe('sk_test_fixture', { apiVersion: '2024-06-20' }).webhooks,
  };
  return { stripe, invoices, customers, calls };
}
