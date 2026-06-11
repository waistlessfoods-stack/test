import { NextRequest, NextResponse } from "next/server";
import { getServerSalesTaxRate, setServerSalesTaxRate } from "@/lib/tax-settings";
import { normalizeSalesTaxRate } from "@/lib/pricing";
import { requireAdminSession } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const taxRate = await getServerSalesTaxRate();
    return NextResponse.json({ taxRate }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const authError = requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const inputRate = body?.taxRate;
    const normalizedRate = normalizeSalesTaxRate(inputRate, -1);

    if (normalizedRate < 0 || normalizedRate > 1) {
      return NextResponse.json(
        { error: "Tax rate must be between 0 and 100." },
        { status: 400 },
      );
    }

    const taxRate = await setServerSalesTaxRate(inputRate);
    return NextResponse.json({ taxRate }, { status: 200 });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
