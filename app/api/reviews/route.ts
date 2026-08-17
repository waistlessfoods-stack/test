import { db } from "@/lib/db";
import { serviceReviews } from "@/lib/db/schema";
import { isHoneypotFilled } from "@/lib/honeypot";
import {
  checkRateLimit,
  normalizeRateLimitEmail,
  rateLimitResponse,
} from "@/lib/rate-limit";
import {
  getRequestLogContext,
  logError,
  logInfo,
  maskEmail,
} from "@/lib/structured-log";
import { validateTextFieldLengths } from "@/lib/text-field-validation";
import { NextRequest, NextResponse } from "next/server";

const SERVICE_TITLES: Record<string, string> = {
  private: "Private Chef",
  catering: "Catering",
  "cooking-classes": "Cooking Classes",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /https?:\/\/|www\./gi;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isHoneypotFilled(body)) {
      logInfo("service_review.honeypot_triggered", {
        ...getRequestLogContext(request),
      });
      return NextResponse.json(
        {
          success: true,
          message: "Thank you. Your review was submitted for moderation.",
        },
        { status: 202 }
      );
    }

    const lengthError = validateTextFieldLengths(body, {
      serviceSlug: { label: "Service", max: 80 },
      name: { label: "Name", max: 120 },
      email: { label: "Email", max: 254 },
      reviewText: { label: "Review", max: 2000 },
    });
    if (lengthError) {
      return NextResponse.json({ error: lengthError }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const serviceSlug = String(values.serviceSlug ?? "").trim();
    const serviceTitle = SERVICE_TITLES[serviceSlug];
    const name = String(values.name ?? "").trim();
    const email = normalizeRateLimitEmail(values.email);
    const reviewText = String(values.reviewText ?? "").trim();
    const rating = Number(values.rating);

    if (!serviceTitle) {
      return NextResponse.json({ error: "Invalid service." }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Please choose a rating from 1 to 5 stars." },
        { status: 400 }
      );
    }
    if (reviewText.length < 20) {
      return NextResponse.json(
        { error: "Your review must be at least 20 characters." },
        { status: 400 }
      );
    }
    if ((reviewText.match(URL_PATTERN) ?? []).length > 2) {
      return NextResponse.json(
        { error: "Please remove extra links from your review." },
        { status: 400 }
      );
    }

    const ipLimit = await checkRateLimit(request, {
      name: "service_reviews:ip",
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (ipLimit.limited) {
      return rateLimitResponse(ipLimit);
    }

    const emailLimit = await checkRateLimit(request, {
      name: "service_reviews:email",
      identifier: email,
      limit: 2,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (emailLimit.limited) {
      return rateLimitResponse(emailLimit);
    }

    const [review] = await db
      .insert(serviceReviews)
      .values({
        serviceSlug,
        serviceTitle,
        name,
        email,
        rating,
        reviewText,
        status: "pending",
      })
      .returning({ id: serviceReviews.id });

    logInfo("service_review.submitted", {
      ...getRequestLogContext(request),
      reviewId: review.id,
      serviceSlug,
      email: maskEmail(email),
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you. Your review was submitted and will appear after approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    logError("service_review.submit_failed", {
      ...getRequestLogContext(request),
      error,
    });
    return NextResponse.json(
      { error: "We could not submit your review. Please try again." },
      { status: 500 }
    );
  }
}
