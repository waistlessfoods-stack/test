import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(sql`${subscribers.email} = ${email}`)
      .limit(1);

    if (existingSubscriber.length > 0) {
      return NextResponse.json(
        { error: "This email is already subscribed" },
        { status: 409 }
      );
    }

    // Insert into database
    const result = await db
      .insert(subscribers)
      .values({
        email: email.toLowerCase().trim(),
      })
      .returning();

    return NextResponse.json(
      { success: true, message: "Successfully subscribed to newsletter", data: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
