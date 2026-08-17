import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { isValidNewsletterUnsubscribeToken } from "@/lib/newsletter-unsubscribe";
import {
  getRequestLogContext,
  logError,
  logInfo,
  maskEmail,
} from "@/lib/structured-log";

function redirectToStatus(request: NextRequest, status: string) {
  const url = new URL("/unsubscribe", request.url);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const subscriberId = Number(formData.get("subscriber"));
    const token = String(formData.get("token") ?? "");

    if (!Number.isInteger(subscriberId) || subscriberId < 1 || !token) {
      return redirectToStatus(request, "invalid");
    }

    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, subscriberId))
      .limit(1);

    if (
      !subscriber ||
      !isValidNewsletterUnsubscribeToken(
        subscriber.id,
        subscriber.email,
        token
      )
    ) {
      return redirectToStatus(request, "invalid");
    }

    if (subscriber.active) {
      const now = new Date();
      await db
        .update(subscribers)
        .set({
          active: false,
          updatedAt: now,
          unsubscribedAt: now,
        })
        .where(eq(subscribers.id, subscriber.id));
    }

    logInfo("newsletter.unsubscribed", {
      ...getRequestLogContext(request),
      subscriberId: subscriber.id,
      email: maskEmail(subscriber.email),
    });

    return redirectToStatus(request, "success");
  } catch (error) {
    logError("newsletter.unsubscribe_failed", {
      ...getRequestLogContext(request),
      error,
    });
    return redirectToStatus(request, "error");
  }
}
