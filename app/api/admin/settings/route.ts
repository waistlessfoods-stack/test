import { NextRequest, NextResponse } from "next/server";
import { getServerSalesTaxRate, setServerSalesTaxRate } from "@/lib/tax-settings";
import { normalizeSalesTaxRate } from "@/lib/pricing";

function isAuthorized(password: string | undefined): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  return Boolean(adminPassword && password && password === adminPassword);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 500 },
      );
    }

    if (!isAuthorized(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
    const password = typeof body?.password === "string" ? body.password : "";

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 500 },
      );
    }

    if (!isAuthorized(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
