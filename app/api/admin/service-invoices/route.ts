import { NextRequest } from "next/server";
import { invoiceAdminGuard, invoiceBody, invoiceError, invoiceJson } from "@/lib/service-invoice-http";
import { parseInvoiceId, parseInvoiceRequestKey, parseServiceInvoice } from "@/lib/service-invoice-content";
import { createServiceInvoice, listServiceInvoices, serviceStripe, serviceStripeMode } from "@/lib/service-invoices";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const after = request.nextUrl.searchParams.get("after");
    return invoiceJson({ ...await listServiceInvoices(serviceStripe(), after ? parseInvoiceId(after) : undefined), mode: serviceStripeMode() });
  } catch (error) { return invoiceError(error); }
}
export async function POST(request: NextRequest) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const key = parseInvoiceRequestKey(request.headers.get("idempotency-key"));
    const input = parseServiceInvoice(await invoiceBody(request));
    return invoiceJson({ invoice: await createServiceInvoice(serviceStripe(), input, key) }, 201);
  } catch (error) { return invoiceError(error); }
}
