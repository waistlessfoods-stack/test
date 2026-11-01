import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { agreementView, type WorkflowDatabase, type WorkflowQuery } from "@/lib/service-agreements";
import { createServiceInvoice, getServiceInvoice, invoiceView } from "@/lib/service-invoices";
import { invoiceInputTotal, ServiceInvoiceError, type ServiceInvoiceInput, type ServiceInvoiceView } from "@/lib/service-invoice-content";

export type InvoiceNotification = { status: "pending" | "sending" | "sent" | "needs_review"; sentAt: string | null };
export async function storeInvoiceSnapshot(query: WorkflowQuery, invoice: ServiceInvoiceView, requestKey: string | null = null, requestHash: string | null = null) {
  await query(`INSERT INTO service_invoice_records(invoice_id,agreement_id,booking_id,live,status,total,paid,remaining,request_key,request_hash)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT(invoice_id) DO UPDATE SET status=excluded.status,total=excluded.total,paid=excluded.paid,remaining=excluded.remaining,request_key=coalesce(service_invoice_records.request_key,excluded.request_key),request_hash=coalesce(service_invoice_records.request_hash,excluded.request_hash),updated_at=now()`,
  [invoice.id, invoice.agreementId || null, invoice.bookingId || null, invoice.live, invoice.status, invoice.total, invoice.paid, invoice.remaining, requestKey, requestHash]);
}

export function createInvoiceWorkflow(database: WorkflowDatabase) {
  async function create(stripe: Stripe, input: ServiceInvoiceInput, key: string) {
    if (!input.agreementId) return createServiceInvoice(stripe, input, key);
    return database.transaction(async query => {
      const [row] = await query("SELECT * FROM service_agreements WHERE id=$1 FOR UPDATE", [input.agreementId!]);
      if (!row || row.status !== "signed") throw new ServiceInvoiceError("A signed agreement is required before creating its invoice.", 409);
      const agreement = agreementView(row);
      if (input.email !== agreement.content.email || input.service !== agreement.content.service || input.eventDate !== agreement.content.eventDate) throw new ServiceInvoiceError("The invoice customer, service, and date must match the signed agreement.", 409);
      const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
      const [existing] = await query("SELECT * FROM service_invoice_records WHERE request_key=$1", [key]);
      if (existing) {
        if (existing.request_hash !== hash || existing.agreement_id !== agreement.id) throw new ServiceInvoiceError("This submission already has different invoice details.", 409);
        return invoiceView(await getServiceInvoice(stripe, String(existing.invoice_id)));
      }
      const [reserved] = await query("SELECT coalesce(sum(total),0)::int AS total FROM service_invoice_records WHERE agreement_id=$1 AND status NOT IN ('void','deleted')", [agreement.id]);
      if (Number(reserved.total) + invoiceInputTotal(input) > agreement.content.amount) throw new ServiceInvoiceError("This invoice would exceed the signed total, including other active invoices. Review existing invoices or void an incorrect unpaid invoice first.", 409);
      const invoice = await createServiceInvoice(stripe, { ...input, ...(agreement.bookingId ? { bookingId: agreement.bookingId } : {}) }, key);
      await storeInvoiceSnapshot(query, invoice, key, hash);
      return invoice;
    });
  }
  async function sync(stripe: Stripe, id: string) {
    return database.transaction(async query => {
      // Serialize provider reads per invoice so a slower older request cannot
      // overwrite a later paid/void state with an earlier snapshot.
      await query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [id]);
      const invoice = invoiceView(await getServiceInvoice(stripe, id));
      await storeInvoiceSnapshot(query, invoice);
      return invoice;
    });
  }
  async function notification(id: string): Promise<InvoiceNotification> {
    const [row] = await database.query("SELECT notification_claimed_at,notified_at,notification_error FROM service_invoice_records WHERE invoice_id=$1", [id]);
    if (row?.notified_at) return { status: "sent", sentAt: new Date(String(row.notified_at)).toISOString() };
    if (row?.notification_error || (row?.notification_claimed_at && new Date(String(row.notification_claimed_at)).getTime() < Date.now() - 120000)) return { status: "needs_review", sentAt: null };
    return { status: row?.notification_claimed_at ? "sending" : "pending", sentAt: null };
  }
  async function notify(invoice: ServiceInvoiceView, send: (invoice: ServiceInvoiceView) => Promise<void>) {
    if (invoice.status !== "paid") return notification(invoice.id);
    const [claim] = await database.query("UPDATE service_invoice_records SET notification_claimed_at=now(),notification_error=NULL WHERE invoice_id=$1 AND status='paid' AND notification_claimed_at IS NULL AND notified_at IS NULL RETURNING invoice_id", [invoice.id]);
    if (!claim) return notification(invoice.id);
    try {
      await send(invoice);
      await database.query("UPDATE service_invoice_records SET notified_at=now(),notification_error=NULL WHERE invoice_id=$1", [invoice.id]);
    } catch {
      // SMTP may have accepted a message before disconnecting. Do not silently
      // resend on webhook retries; expose the uncertain result to the admin.
      await database.query("UPDATE service_invoice_records SET notification_error='Delivery uncertain; review inbox before retrying.' WHERE invoice_id=$1 AND notified_at IS NULL", [invoice.id]);
    }
    return notification(invoice.id);
  }
  async function retryNotification(invoice: ServiceInvoiceView, send: (invoice: ServiceInvoiceView) => Promise<void>) {
    if (invoice.status !== "paid") throw new ServiceInvoiceError("Only a paid invoice has a payment notification.", 409);
    await database.query("UPDATE service_invoice_records SET notification_claimed_at=NULL,notification_error=NULL WHERE invoice_id=$1 AND notified_at IS NULL AND (notification_error IS NOT NULL OR notification_claimed_at < now()-interval '2 minutes')", [invoice.id]);
    return notify(invoice, send);
  }
  async function deleted(id: string) {
    await database.query("UPDATE service_invoice_records SET status='deleted',updated_at=now() WHERE invoice_id=$1 AND status='draft'", [id]);
  }
  return { create, sync, notification, notify, retryNotification, deleted };
}
