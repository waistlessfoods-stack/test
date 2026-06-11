import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { requireAdminSession } from "@/lib/admin-session";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/bookings
 * Returns all bookings for an authenticated admin session.
 */
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const allBookings = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json({ bookings: allBookings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bookings
 * Update booking status for an authenticated admin session.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status } = body;

    const authError = requireAdminSession(request);
    if (authError) {
      return authError;
    }

    const validStatuses = ["pending", "confirmed", "cancelled"];
    if (!bookingId || !status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid bookingId or status" },
        { status: 400 }
      );
    }

    const { eq } = await import("drizzle-orm");
    const updated = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, Number(bookingId)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: updated[0] }, { status: 200 });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
