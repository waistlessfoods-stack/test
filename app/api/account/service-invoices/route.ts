import { currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { invoiceError, invoiceJson } from "@/lib/service-invoice-http";
import { ServiceInvoiceError } from "@/lib/service-invoice-content";
import { listMemberServiceInvoices, serviceStripe } from "@/lib/service-invoices";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return invoiceJson({ error: "Sign in to view your invoices." }, 401);
    const primary = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
    if (!primary || primary.verification?.status !== "verified") return invoiceJson({ error: "Verify your primary account email to view invoices." }, 403);
    const after = request.nextUrl.searchParams.get("after") || undefined;
    if (after && !/^cus_[A-Za-z0-9]{5,100}$/.test(after)) throw new ServiceInvoiceError("Invalid page cursor.");
    return invoiceJson(await listMemberServiceInvoices(serviceStripe(), primary.emailAddress.trim().toLowerCase(), after));
  } catch (error) { return invoiceError(error); }
}
