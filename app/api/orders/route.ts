import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { syncCurrentClerkUser } from "@/lib/clerk-user-sync";
import { eq, desc } from "drizzle-orm";

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
  maxAttempts: number = 4
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

      // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
      const delay = 500 * Math.pow(2, attempt);
      console.log(
        `[DB Retry] Orders endpoint - Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    await syncCurrentClerkUser();

    // Fetch user's orders with retry logic
    const userOrders = await withDbRetry(() =>
      db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
    );

    console.log("[Orders API] Fetched user orders", {
      userId: userId.slice(0, 8),
      count: userOrders.length,
      orders: userOrders,
    });

    return NextResponse.json({ orders: userOrders });
  } catch (error) {
    const errorWithCause = error as Error & {
      cause?: { code?: string };
      code?: string;
    };

    const timeoutLike =
      (error instanceof Error && isTransientDbError(error)) ||
      errorWithCause?.code === "ETIMEDOUT" ||
      errorWithCause?.cause?.code === "ETIMEDOUT";

    if (timeoutLike) {
      return NextResponse.json(
        { error: "Database connection timeout. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message.includes("Temporary database")) {
      return NextResponse.json(
        { error: "Database connection issue. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch orders";
    console.error("Orders fetch error:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
      cause: errorWithCause?.cause,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
