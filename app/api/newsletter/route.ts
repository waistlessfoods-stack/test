import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { sendEmail, fromEmail } from "@/lib/email/mailer";
import {
  newsletterConfirmationTemplate,
  newsletterNotificationTemplate,
} from "@/lib/email/templates";
import {
  checkRateLimit,
  normalizeRateLimitEmail,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { isHoneypotFilled } from "@/lib/honeypot";
import { getRequestLogContext, logError, logInfo, maskEmail } from "@/lib/structured-log";
import { validateTextFieldLengths } from "@/lib/text-field-validation";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

const NEWSLETTER_SUCCESS_MESSAGE = "Successfully subscribed to newsletter";

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
        `[DB Retry] Newsletter endpoint - Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
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
      logInfo("newsletter.honeypot_triggered", {
        ...getRequestLogContext(request),
      });
      return NextResponse.json(
        { success: true, message: NEWSLETTER_SUCCESS_MESSAGE },
        { status: 202 }
      );
    }

    const textFieldError = validateTextFieldLengths(body, {
      email: { label: "Email", max: 254 },
    });
    if (textFieldError) {
      return NextResponse.json({ error: textFieldError }, { status: 400 });
    }

    const rawEmail = normalizeRateLimitEmail(body?.email);

    // Validate email
    if (!rawEmail || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const ipLimit = await checkRateLimit(request, {
      name: "newsletter:ip",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (ipLimit.limited) {
      return rateLimitResponse(ipLimit);
    }

    const emailLimit = await checkRateLimit(request, {
      name: "newsletter:email",
      identifier: rawEmail,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (emailLimit.limited) {
      return rateLimitResponse(emailLimit);
    }

    // Check if email already exists with retry logic
    const existingSubscriber = await withDbRetry(() =>
      db
        .select()
        .from(subscribers)
        .where(sql`${subscribers.email} = ${rawEmail}`)
        .limit(1)
    );

    if (existingSubscriber.length > 0) {
      logInfo("newsletter.duplicate_submission", {
        ...getRequestLogContext(request),
        email: maskEmail(rawEmail),
      });
      return NextResponse.json(
        { success: true, message: NEWSLETTER_SUCCESS_MESSAGE, data: null },
        { status: 200 }
      );
    }

    // Insert into database with retry logic
    const result = await withDbRetry(() =>
      db
        .insert(subscribers)
        .values({
          email: rawEmail,
        })
        .returning()
    );

    const subscriber = result[0];
    const adminEmail = process.env.ADMIN_EMAIL || fromEmail;

    const [confirmationEmail, notificationEmail] = await Promise.all([
      sendEmail({
        to: rawEmail,
        subject: "Welcome to WaistLess Foods",
        html: newsletterConfirmationTemplate({ email: rawEmail }),
      }),
      sendEmail({
        to: adminEmail,
        subject: "New Newsletter Subscriber",
        replyTo: rawEmail,
        html: newsletterNotificationTemplate({
          email: rawEmail,
          subscriberId: subscriber.id,
        }),
      }),
    ]);

    if (confirmationEmail.error || notificationEmail.error) {
      logError("newsletter.email_failed", {
        ...getRequestLogContext(request),
        email: maskEmail(rawEmail),
        subscriberId: subscriber.id,
        confirmation: confirmationEmail.error,
        notification: notificationEmail.error,
      });
    }

    logInfo("newsletter.subscribed", {
      ...getRequestLogContext(request),
      email: maskEmail(rawEmail),
      subscriberId: subscriber.id,
      emailSent: !confirmationEmail.error && !notificationEmail.error,
    });

    return NextResponse.json(
      { success: true, message: NEWSLETTER_SUCCESS_MESSAGE, data: subscriber },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Temporary database")) {
      return NextResponse.json(
        { error: "Database connection issue. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    logError("newsletter.subscribe_failed", {
      ...getRequestLogContext(request),
      error,
    });
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
