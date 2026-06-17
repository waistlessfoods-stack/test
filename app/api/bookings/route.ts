import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { sendEmail, fromEmail } from "@/lib/email/mailer";
import { bookingConfirmationTemplate, bookingNotificationTemplate } from "@/lib/email/templates";
import {
  checkRateLimit,
  normalizeRateLimitEmail,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { isHoneypotFilled } from "@/lib/honeypot";
import { getRequestLogContext, logError, logInfo, maskEmail } from "@/lib/structured-log";
import { validateTextFieldLengths } from "@/lib/text-field-validation";
import { NextRequest, NextResponse } from "next/server";

const MIN_BOOKING_GUESTS = 1;
const MAX_BOOKING_GUESTS = 50;

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

    if (isHoneypotFilled(body)) {
      logInfo("booking.honeypot_triggered", {
        ...getRequestLogContext(request),
      });
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const textFieldError = validateTextFieldLengths(body, {
      serviceSlug: { label: "Service slug", max: 160 },
      serviceTitle: { label: "Service title", max: 160 },
      firstName: { label: "First name", max: 120 },
      lastName: { label: "Last name", max: 120 },
      email: { label: "Email", max: 254 },
      phone: { label: "Phone", max: 40 },
      preferredDate: { label: "Preferred date", max: 80 },
      alternativeDate: { label: "Alternative date", max: 80 },
      notes: { label: "Notes", max: 3000 },
    });
    if (textFieldError) {
      return NextResponse.json({ error: textFieldError }, { status: 400 });
    }

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
    const parsedGuests =
      typeof guests === "number"
        ? guests
        : typeof guests === "string"
          ? Number(guests.trim())
          : Number.NaN;

    // Validate required fields
    if (
      !serviceSlug ||
      !serviceTitle ||
      !firstName ||
      !lastName ||
      !normalizedEmail ||
      !phone ||
      guests === undefined ||
      guests === null ||
      guests === "" ||
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

    if (
      !Number.isInteger(parsedGuests) ||
      parsedGuests < MIN_BOOKING_GUESTS ||
      parsedGuests > MAX_BOOKING_GUESTS
    ) {
      return NextResponse.json(
        {
          error: `Number of guests must be a whole number between ${MIN_BOOKING_GUESTS} and ${MAX_BOOKING_GUESTS}.`,
        },
        { status: 400 }
      );
    }

    const ipLimit = await checkRateLimit(request, {
      name: "bookings:ip",
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (ipLimit.limited) {
      return rateLimitResponse(ipLimit);
    }

    const emailLimit = await checkRateLimit(request, {
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
          guests: parsedGuests,
          preferredDate,
          alternativeDate: alternativeDate || null,
          notes,
          status: "pending",
        })
        .returning()
    );

    const booking = result[0];

    const adminEmail = process.env.ADMIN_EMAIL || fromEmail;

    const [confirmationEmail, notificationEmail] = await Promise.all([
      sendEmail({
        to: normalizedEmail,
        subject: `Booking Request Received - ${serviceTitle}`,
        html: bookingConfirmationTemplate({
          firstName,
          serviceTitle,
          preferredDate,
          alternativeDate,
          guests: parsedGuests,
          notes,
        }),
      }),
      sendEmail({
        to: adminEmail,
        subject: `New Booking Request - ${serviceTitle}`,
        replyTo: normalizedEmail,
        html: bookingNotificationTemplate({
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          serviceTitle,
          preferredDate,
          alternativeDate,
          guests: parsedGuests,
          notes,
          bookingId: booking.id,
        }),
      }),
    ]);

    const confirmationEmailSent = !confirmationEmail.error;
    const notificationEmailSent = !notificationEmail.error;
    const emailSent = confirmationEmailSent && notificationEmailSent;
    if (!emailSent) {
      logError("booking.email_failed", {
        ...getRequestLogContext(request),
        bookingId: booking.id,
        email: maskEmail(normalizedEmail),
        confirmation: confirmationEmail.error,
        notification: notificationEmail.error,
      });
    }

    logInfo("booking.submitted", {
      ...getRequestLogContext(request),
      bookingId: booking.id,
      serviceSlug,
      guests: parsedGuests,
      email: maskEmail(normalizedEmail),
      emailSent,
    });

    return NextResponse.json(
      {
        success: true,
        bookingId: booking.id,
        emailSent,
        confirmationEmailSent,
        notificationEmailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Temporary database")) {
      return NextResponse.json(
        { error: "Database connection issue. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    logError("booking.submit_failed", {
      ...getRequestLogContext(request),
      error,
    });
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
