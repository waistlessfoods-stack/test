import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { invoiceAdminGuard } from "@/lib/service-invoice-http";
import { agreementError, agreementHeaders } from "@/lib/service-agreement-http";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const denied = invoiceAdminGuard(request); if (denied) return denied;
  try {
    const bytes = await readFile(path.join(process.cwd(), "private/contracts/amber-personal-chef-2026-11.pdf"));
    return new NextResponse(new Uint8Array(bytes), { headers: {
      ...agreementHeaders, "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Amber-original-personal-chef-contract.pdf"',
    } });
  } catch (error) { return agreementError(error); }
}
