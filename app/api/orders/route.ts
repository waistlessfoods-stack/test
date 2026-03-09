import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Fetch user's orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.user.id))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: userOrders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch orders";
    console.error("Orders fetch error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
