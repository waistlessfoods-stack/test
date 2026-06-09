import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { sendEmail, fromEmail } from "@/lib/email/resend";
import { bookingConfirmationTemplate, bookingNotificationTemplate } from "@/lib/email/templates";
import {
  checkRateLimit,
  normalizeRateLimitEmail,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("epipe") ||
    message.includes("connection reset") ||
    message.includes("timeout")
  );
}

async function withDbRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isTransientDbError(error) || attempt >= maxAttempts - 1) {
        throw lastError;
      }

      const delay = 250 * Math.pow(2, attempt);
      console.log(
        `[DB Retry] Bookings endpoint - Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceSlug,
      serviceTitle,
      firstName,
      lastName,
      email,
      phone,
      guests,
      preferredDate,
      alternativeDate,
      notes,
    } = body;
    const normalizedEmail = normalizeRateLimitEmail(email);

    // Validate required fields
    if (
      !serviceSlug ||
      !serviceTitle ||
      !firstName ||
      !lastName ||
      !normalizedEmail ||
      !phone ||
      !guests ||
      !preferredDate ||
      !notes
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const ipLimit = checkRateLimit(request, {
      name: "bookings:ip",
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (ipLimit.limited) {
      return rateLimitResponse(ipLimit);
    }

    const emailLimit = checkRateLimit(request, {
      name: "bookings:email",
      identifier: normalizedEmail,
      limit: 2,
      windowMs: 60 * 60 * 1000,
    });
    if (emailLimit.limited) {
      return rateLimitResponse(emailLimit);
    }

    // Insert booking into database
    const result = await withDbRetry(() =>
      db
        .insert(bookings)
        .values({
          serviceSlug,
          serviceTitle,
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          guests: Number(guests),
          preferredDate,
          alternativeDate: alternativeDate || null,
          notes,
          status: "pending",
        })
        .returning()
    );

    const booking = result[0];

    // Send confirmation email to the customer
    await sendEmail({
      to: normalizedEmail,
      subject: `Booking Request Received – ${serviceTitle}`,
      html: bookingConfirmationTemplate({
        firstName,
        serviceTitle,
        preferredDate,
        alternativeDate,
        guests: Number(guests),
        notes,
      }),
    });

    // Send notification email to the business
    const adminEmail = process.env.ADMIN_EMAIL || fromEmail;
    await sendEmail({
      to: adminEmail,
      subject: `New Booking Request – ${serviceTitle}`,
      replyTo: normalizedEmail,
      html: bookingNotificationTemplate({
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        serviceTitle,
        preferredDate,
        alternativeDate,
        guests: Number(guests),
        notes,
        bookingId: booking.id,
      }),
    });

    return NextResponse.json({ success: true, bookingId: booking.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Temporary database")) {
      return NextResponse.json(
        { error: "Database connection issue. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
