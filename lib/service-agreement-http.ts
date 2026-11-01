import { NextRequest, NextResponse } from "next/server";
import { ServiceInvoiceError } from "@/lib/service-invoice-content";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const agreementHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
export function agreementJson(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: agreementHeaders }); }
export async function agreementBody(request: NextRequest): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > 60000) throw new ServiceInvoiceError("Agreement request is too large.");
  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new ServiceInvoiceError("Invalid agreement request."); }
}
export function agreementError(error: unknown) {
  if (error instanceof ServiceInvoiceError) return agreementJson({ error: error.message }, error.status);
  console.error("Agreement operation failed", error instanceof Error ? error.name : "UnknownError");
  return agreementJson({ error: "The agreement could not be loaded or saved. Please retry; contact Chef Amber if the problem continues." }, 503);
}
export async function publicAgreementGuard(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return agreementJson({ error: "A same-origin request is required." }, 403);
  const limit = await checkRateLimit(request, { name: "agreements:ip", limit: 60, windowMs: 15 * 60 * 1000 });
  return limit.limited ? rateLimitResponse(limit) : null;
}
