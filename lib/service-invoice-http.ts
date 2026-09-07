import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { ServiceInvoiceError } from "@/lib/service-invoice-content";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
export function invoiceJson(data: unknown, status = 200) { return NextResponse.json(data, { status, headers }); }
export function invoiceAdminGuard(request: NextRequest) {
  const denied = requireAdminSession(request);
  if (denied) return denied;
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) return invoiceJson({ error: "A same-origin request is required." }, 403);
  return null;
}
export async function invoiceBody(request: NextRequest): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > 16000) throw new ServiceInvoiceError("Request is too large.");
  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new ServiceInvoiceError("Invalid JSON request."); }
}
export function invoiceError(error: unknown) {
  if (error instanceof ServiceInvoiceError) return invoiceJson({ error: error.message }, error.status);
  const stripeError = error as { type?: string; code?: string };
  if (stripeError?.code === "resource_missing") return invoiceJson({ error: "Invoice not found." }, 404);
  if (stripeError?.type === "StripeIdempotencyError") return invoiceJson({ error: "This submission was already used with different details. Refresh and check existing invoices before trying again." }, 409);
  console.error("Service invoice operation failed", stripeError?.type || "UnknownError");
  return invoiceJson({ error: "Stripe could not complete this request. Refresh the invoice list before retrying. Check Stripe configuration if the problem persists." }, 502);
}
