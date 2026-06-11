import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { requireAdminSession } from '@/lib/admin-session';
import { NextRequest, NextResponse } from 'next/server';

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
        `[DB Retry] Admin accounts - Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * POST /api/admin/accounts
 * Returns all user accounts for an authenticated admin session.
 */
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminSession(request);
    if (authError) {
      return authError;
    }

    // Fetch all users with retry logic
    const accounts = await withDbRetry(() =>
      db.select().from(user).orderBy(user.createdAt)
    );

    return NextResponse.json(
      { 
        accounts: accounts.map(acc => ({
          id: acc.id,
          name: acc.name,
          email: acc.email,
          emailVerified: acc.emailVerified,
          image: acc.image,
          createdAt: acc.createdAt,
          updatedAt: acc.updatedAt,
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Temporary database")) {
      return NextResponse.json(
        { error: "Database connection issue. Please try again in a few seconds." },
        { status: 503 }
      );
    }

    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/accounts
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    method: 'POST',
    description: 'Retrieve all user accounts with an authenticated admin session cookie',
    auth: 'Requires httpOnly admin session cookie from /api/admin/verify',
    example: {
      request: {
        method: 'POST',
        url: '/api/admin/accounts',
      },
      response: {
        accounts: [
          {
            id: 'user-id',
            name: 'John Doe',
            email: 'john@example.com',
            emailVerified: true,
            image: null,
            createdAt: '2026-03-09T10:00:00Z',
            updatedAt: '2026-03-09T10:00:00Z',
          },
        ],
      },
    },
  });
}
