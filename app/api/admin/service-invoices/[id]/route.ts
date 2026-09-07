import { NextRequest } from "next/server";
import { invoiceAdminGuard, invoiceBody, invoiceError, invoiceJson } from "@/lib/service-invoice-http";
import { parseInvoiceId } from "@/lib/service-invoice-content";
import { actOnServiceInvoice, getServiceInvoice, invoiceView, serviceStripe } from "@/lib/service-invoices";

export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try { return invoiceJson({ invoice: invoiceView(await getServiceInvoice(serviceStripe(), parseInvoiceId((await context.params).id))) }); }
  catch (error) { return invoiceError(error); }
}
export async function POST(request: NextRequest, context: Context) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const body = await invoiceBody(request);
    return invoiceJson({ invoice: await actOnServiceInvoice(serviceStripe(), parseInvoiceId((await context.params).id), String(body.action), body.expectedTotal) });
  } catch (error) { return invoiceError(error); }
}
