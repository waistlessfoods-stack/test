import "server-only";
import Stripe from "stripe";
import { createHash } from "node:crypto";
import { getStripeSecretKey } from "@/lib/stripe-config";
import { invoiceInputTotal, SERVICE_INVOICE_SOURCE, ServiceInvoiceError, type ServiceInvoiceInput, type ServiceInvoiceView } from "@/lib/service-invoice-content";

export function serviceStripe() {
  const key = getStripeSecretKey();
  if (!key) throw new ServiceInvoiceError("Stripe is not configured.", 503);
  return new Stripe(key, { apiVersion: "2024-06-20", maxNetworkRetries: 2, timeout: 15000 });
}

export function serviceStripeMode(): "test" | "live" {
  const key = getStripeSecretKey();
  if (/^(sk|rk)_test_/.test(key || "")) return "test";
  if (/^(sk|rk)_live_/.test(key || "")) return "live";
  throw new ServiceInvoiceError("Stripe is not configured with a recognized secret key.", 503);
}

export function ownsServiceInvoice(invoice: Stripe.Invoice) {
  return invoice.metadata?.source === SERVICE_INVOICE_SOURCE;
}

export function invoiceView(invoice: Stripe.Invoice): ServiceInvoiceView {
  return {
    id: invoice.id, number: invoice.number, status: invoice.status || "unknown",
    name: invoice.customer_name || invoice.metadata?.customer_name || "",
    email: invoice.customer_email || invoice.metadata?.customer_email || "",
    service: invoice.metadata?.service || "", title: invoice.metadata?.title || "Service invoice",
    eventDate: invoice.metadata?.event_date || "", notes: invoice.description || "",
    total: invoice.total, paid: invoice.amount_paid, remaining: invoice.amount_remaining,
    currency: invoice.currency, created: invoice.created, dueDate: invoice.due_date,
    paidAt: invoice.status_transitions.paid_at, hostedUrl: invoice.hosted_invoice_url || null,
    pdfUrl: invoice.invoice_pdf || null, live: invoice.livemode, ready: invoice.metadata?.assembly === "ready",
    overdue: invoice.status === "open" && Boolean(invoice.due_date && invoice.due_date * 1000 < Date.now()),
    items: invoice.lines.data.map(line => ({ description: line.description || "Service", quantity: line.quantity || 1, amount: line.amount })),
    ...(invoice.metadata?.agreement_id ? { agreementId: invoice.metadata.agreement_id } : {}),
    ...(invoice.metadata?.booking_id ? { bookingId: Number(invoice.metadata.booking_id) } : {}),
  };
}

export async function createServiceInvoice(stripe: Stripe, input: ServiceInvoiceInput, key: string) {
  // A dedicated customer per submission keeps retries deterministic and avoids
  // applying another customer's stored balance or altering an existing record.
  const customer = await stripe.customers.create({ name: input.name, email: input.email, metadata: { source: SERVICE_INVOICE_SOURCE } }, { idempotencyKey: `service-${key}-customer` });
  const invoice = await stripe.invoices.create({
    customer: customer.id, currency: "usd", collection_method: "send_invoice",
    days_until_due: input.daysUntilDue, auto_advance: false,
    pending_invoice_items_behavior: "exclude", automatic_tax: { enabled: false },
    default_tax_rates: [], discounts: [],
    payment_settings: { payment_method_types: ["card"] },
    description: input.notes ? `${input.title}\n\n${input.notes}` : input.title,
    custom_fields: [{ name: "Service", value: input.service === "private_chef" ? "Private Chef" : "Catering" }, ...(input.eventDate ? [{ name: "Event date", value: input.eventDate }] : [])],
    metadata: { source: SERVICE_INVOICE_SOURCE, service: input.service, title: input.title, event_date: input.eventDate, customer_name: input.name, customer_email: input.email, expected_total: String(invoiceInputTotal(input)), input_hash: createHash("sha256").update(JSON.stringify(input)).digest("hex"), assembly: "building", ...(input.agreementId ? { agreement_id: input.agreementId } : {}), ...(input.bookingId ? { booking_id: String(input.bookingId) } : {}) },
  }, { idempotencyKey: `service-${key}-invoice` });
  const current = await stripe.invoices.retrieve(invoice.id);
  if (current.status !== "draft" || current.metadata?.assembly === "ready") return invoiceView(current);
  for (const [index, item] of input.items.entries()) {
    await stripe.invoiceItems.create({ customer: customer.id, invoice: invoice.id, currency: "usd", description: item.description, quantity: item.quantity, unit_amount: item.unitAmount, discountable: false, tax_rates: [] }, { idempotencyKey: `service-${key}-line-${index}` });
  }
  const ready = await stripe.invoices.update(invoice.id, { metadata: { assembly: "ready" } }, { idempotencyKey: `service-${key}-ready` });
  return invoiceView(ready);
}

export async function getServiceInvoice(stripe: Stripe, id: string) {
  const invoice = await stripe.invoices.retrieve(id);
  if (!ownsServiceInvoice(invoice)) throw new ServiceInvoiceError("Invoice not found.", 404);
  return invoice;
}

export async function actOnServiceInvoice(stripe: Stripe, id: string, action: string, expectedTotal: unknown) {
  let invoice = await getServiceInvoice(stripe, id);
  if (action === "finalize") {
    if (invoice.status !== "draft") throw new ServiceInvoiceError("Only drafts can be issued. Refresh to see the latest status.", 409);
    if (invoice.metadata?.assembly !== "ready" || invoice.currency !== "usd" || invoice.total !== Number(invoice.metadata?.expected_total) || invoice.total !== expectedTotal || invoice.total < 50 || invoice.lines.has_more) throw new ServiceInvoiceError("The draft is incomplete or its amount changed. Review it in Stripe before issuing.", 409);
    invoice = await stripe.invoices.finalizeInvoice(id, { auto_advance: false }, { idempotencyKey: `service-${id}-finalize` });
  } else if (action === "send") {
    if (invoice.status !== "open") throw new ServiceInvoiceError("Only an issued, unpaid invoice can be emailed.", 409);
    // One dispatch request per invoice; retries within Stripe's idempotency
    // window reuse the result. Additional reminders are managed in Stripe.
    invoice = await stripe.invoices.sendInvoice(id, {}, { idempotencyKey: `service-${id}-send` });
  } else if (action === "void") {
    if (invoice.status !== "open") throw new ServiceInvoiceError("Only an unpaid, open invoice can be voided. Refund paid invoices through Stripe.", 409);
    invoice = await stripe.invoices.voidInvoice(id, {}, { idempotencyKey: `service-${id}-void` });
  } else throw new ServiceInvoiceError("Unknown invoice action.");
  return invoiceView(invoice);
}

export async function listServiceInvoices(stripe: Stripe, after?: string) {
  const result = await stripe.invoices.list({ limit: 100, ...(after ? { starting_after: after } : {}) });
  return { invoices: result.data.filter(ownsServiceInvoice).map(invoiceView), next: result.has_more ? result.data.at(-1)?.id : null };
}

// Exact email matching is performed only after Clerk verifies the account email.
// A cursor pages Stripe customers (one per submission), keeping each request bounded.
export async function listMemberServiceInvoices(stripe: Stripe, email: string, after?: string) {
  const customers = await stripe.customers.list({ email, limit: 10, ...(after ? { starting_after: after } : {}) });
  const batches = await Promise.all(customers.data.filter(customer => customer.metadata.source === SERVICE_INVOICE_SOURCE).map(async customer => {
    const result = await stripe.invoices.list({ customer: customer.id, limit: 100 });
    if (result.has_more) throw new ServiceInvoiceError("Please contact Amber for your complete invoice history.", 409);
    return result.data.filter(invoice => ownsServiceInvoice(invoice) && invoice.status !== "draft" && (invoice.customer_email || "").toLowerCase() === email).map(invoiceView);
  }));
  return { invoices: batches.flat().sort((a, b) => b.created - a.created), next: customers.has_more ? customers.data.at(-1)?.id : null };
}
