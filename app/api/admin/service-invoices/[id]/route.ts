import { NextRequest } from "next/server";
import { invoiceAdminGuard, invoiceBody, invoiceError, invoiceJson } from "@/lib/service-invoice-http";
import { parseInvoiceId } from "@/lib/service-invoice-content";
import { actOnServiceInvoice, serviceStripe } from "@/lib/service-invoices";
import { invoiceWorkflow } from "@/lib/service-invoice-workflow-store";
import { sendServiceInvoicePayment } from "@/lib/email/service-invoice-payment";

export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const id = parseInvoiceId((await context.params).id);
    const invoice = await invoiceWorkflow.sync(serviceStripe(), id);
    return invoiceJson({ invoice, notification: await invoiceWorkflow.notification(id) });
  }
  catch (error) { return invoiceError(error); }
}
export async function POST(request: NextRequest, context: Context) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const body = await invoiceBody(request);
    const id = parseInvoiceId((await context.params).id);
    if (body.action === "retry_notification") {
      if (body.inboxReviewed !== true) return invoiceJson({ error: "Review the business inbox before retrying this notification." }, 400);
      const invoice = await invoiceWorkflow.sync(serviceStripe(), id);
      return invoiceJson({ invoice, notification: await invoiceWorkflow.retryNotification(invoice, sendServiceInvoicePayment) });
    }
    await actOnServiceInvoice(serviceStripe(), id, String(body.action), body.expectedTotal);
    const invoice = await invoiceWorkflow.sync(serviceStripe(), id);
    return invoiceJson({ invoice, notification: await invoiceWorkflow.notification(id) });
  } catch (error) { return invoiceError(error); }
}
