import { NextRequest } from "next/server";
import { invoiceAdminGuard } from "@/lib/service-invoice-http";
import { agreementBody, agreementError, agreementJson } from "@/lib/service-agreement-http";
import { ServiceInvoiceError } from "@/lib/service-invoice-content";
import { agreements } from "@/lib/service-workflow-store";

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try { return agreementJson({ agreements: await agreements.list() }); }
  catch (error) { return agreementError(error); }
}
export async function POST(request: NextRequest) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const { bookingId } = await agreementBody(request);
    if (!Number.isSafeInteger(bookingId) || Number(bookingId) < 1) throw new ServiceInvoiceError("Choose a booking request first.");
    return agreementJson({ agreement: await agreements.createFromBooking(Number(bookingId)) }, 201);
  } catch (error) { return agreementError(error); }
}
