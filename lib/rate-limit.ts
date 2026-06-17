import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimitBuckets } from "@/lib/db/schema";
import { getRequestLogContext, logWarn } from "@/lib/structured-log";

type RateLimitOptions = {
  name: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

type RateLimitResult = {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  return cfIp || realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("epipe") ||
    message.includes("connection reset") ||
    message.includes("timeout")
  );
}

async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
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

      const delay = 250 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

async function cleanupExpiredBuckets(now: Date) {
  try {
    await withDbRetry(() =>
      db
        .delete(rateLimitBuckets)
        .where(sql`${rateLimitBuckets.resetAt} <= ${now}`),
    );
  } catch (error) {
    logWarn("rate_limit.cleanup_failed", {
      now: now.toISOString(),
      error,
    });
  }
}

export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const nowDate = new Date(now);
  const identifier = options.identifier?.trim() || getClientIp(request);
  const key = `${options.name}:${identifier}`;
  const resetAt = new Date(now + options.windowMs);

  void cleanupExpiredBuckets(nowDate);

  const result = await withDbRetry(() =>
    db.execute(sql`
      INSERT INTO ${rateLimitBuckets} ("key", "count", "reset_at", "updated_at")
      VALUES (${key}, 1, ${resetAt}, ${nowDate})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN ${rateLimitBuckets.resetAt} <= ${nowDate} THEN 1
          ELSE ${rateLimitBuckets.count} + 1
        END,
        "reset_at" = CASE
          WHEN ${rateLimitBuckets.resetAt} <= ${nowDate} THEN ${resetAt}
          ELSE ${rateLimitBuckets.resetAt}
        END,
        "updated_at" = ${nowDate}
      RETURNING "count", "reset_at"
    `),
  );

  const row = result.rows[0] as
    | { count: number | string; reset_at: Date | string }
    | undefined;

  if (!row) {
    throw new Error("Rate limit store did not return a bucket row.");
  }

  const count =
    typeof row.count === "number" ? row.count : Number.parseInt(row.count, 10);
  const resolvedResetAt =
    row.reset_at instanceof Date
      ? row.reset_at.getTime()
      : new Date(row.reset_at).getTime();
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((resolvedResetAt - now) / 1000),
  );
  const remaining = Math.max(options.limit - count, 0);
  const limited = count > options.limit;

  if (limited) {
    logWarn("rate_limit.exceeded", {
      ...getRequestLogContext(request),
      bucketName: options.name,
      bucketIdentifier: identifier,
      limit: options.limit,
      count,
      resetAt: new Date(resolvedResetAt).toISOString(),
      retryAfterSeconds,
    });
  }

  return {
    limited,
    limit: options.limit,
    remaining,
    resetAt: resolvedResetAt,
    retryAfterSeconds,
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

export function normalizeRateLimitEmail(value: unknown): string {
  return String(value ?? "").toLowerCase().trim();
}
