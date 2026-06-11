import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { sendEmail, fromEmail } from "@/lib/email/mailer";
import {
  enquiryConfirmationTemplate,
  enquiryNotificationTemplate,
} from "@/lib/email/templates";
import {
  checkRateLimit,
  normalizeRateLimitEmail,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { isHoneypotFilled } from "@/lib/honeypot";
import { validateTextFieldLengths } from "@/lib/text-field-validation";
import { NextRequest, NextResponse } from "next/server";

// Helper to detect transient database errors
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

// Retry wrapper for database operations with exponential backoff
async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!isTransientDbError(error) || attempt >= maxAttempts - 1) {
        throw lastError;
      }

      // Exponential backoff: 250ms, 500ms, etc.
      const delay = 250 * Math.pow(2, attempt);
      console.log(
        `[DB Retry] Enquiry endpoint - Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
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
      return NextResponse.json(
        { success: true, data: null },
        { status: 202 }
      );
    }

    const textFieldError = validateTextFieldLengths(body, {
      type: { label: "Enquiry type", max: 40 },
      name: { label: "Name", max: 120 },
      email: { label: "Email", max: 254 },
      phone: { label: "Phone", max: 40 },
      message: { label: "Message", max: 2000 },
    });
    if (textFieldError) {
      return NextResponse.json({ error: textFieldError }, { status: 400 });
    }

    const { type, name, email, phone, message } = body;
    const normalizedEmail = normalizeRateLimitEmail(email);

    // Validate required fields
    if (!type || !name || !normalizedEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const ipLimit = checkRateLimit(request, {
      name: "enquiries:ip",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (ipLimit.limited) {
      return rateLimitResponse(ipLimit);
    }

    const emailLimit = checkRateLimit(request, {
      name: "enquiries:email",
      identifier: normalizedEmail,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (emailLimit.limited) {
      return rateLimitResponse(emailLimit);
    }

    // Insert into database with retry logic
    const result = await withDbRetry(() =>
      db
        .insert(enquiries)
        .values({
          type,
          name,
          email: normalizedEmail,
          phone: phone || null,
          message: message || null,
        })
        .returning()
    );

    const enquiry = result[0];
    const adminEmail = process.env.ADMIN_EMAIL || fromEmail;

    const [confirmationEmail, notificationEmail] = await Promise.all([
      sendEmail({
        to: normalizedEmail,
        subject: "We received your WaistLess Foods enquiry",
        html: enquiryConfirmationTemplate({
          name,
          type,
          message,
        }),
      }),
      sendEmail({
        to: adminEmail,
        subject: `New ${String(type).replaceAll("_", " ")} enquiry`,
        replyTo: normalizedEmail,
        html: enquiryNotificationTemplate({
          name,
          email: normalizedEmail,
          phone,
          type,
          message,
          enquiryId: enquiry.id,
        }),
      }),
    ]);

    if (confirmationEmail.error || notificationEmail.error) {
      console.error("Enquiry email send failed:", {
        confirmation: confirmationEmail.error,
        notification: notificationEmail.error,
      });
    }

    return NextResponse.json(
      { success: true, data: enquiry },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Temporary database")) {
      return NextResponse.json(
        { error: "Database connection issue. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    console.error("Error creating enquiry:", error);
    return NextResponse.json(
      { error: "Failed to create enquiry" },
      { status: 500 }
    );
  }
}
