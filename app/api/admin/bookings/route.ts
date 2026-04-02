import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/bookings
 * Returns all bookings, requires admin password in body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
 * Update booking status — requires admin password + bookingId + status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, bookingId, status } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
