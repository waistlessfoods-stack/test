import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, email, phone, message } = body;

    // Validate required fields
    if (!type || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert into database
    const result = await db
      .insert(enquiries)
      .values({
        type,
        name,
        email,
        phone: phone || null,
        message: message || null,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating enquiry:", error);
    return NextResponse.json(
      { error: "Failed to create enquiry" },
      { status: 500 }
    );
  }
}
