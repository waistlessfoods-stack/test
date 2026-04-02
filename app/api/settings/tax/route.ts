import { NextResponse } from "next/server";
import { getServerSalesTaxRate } from "@/lib/tax-settings";

export async function GET() {
  const taxRate = await getServerSalesTaxRate();
  return NextResponse.json({ taxRate }, { status: 200 });
}
