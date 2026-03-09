import { db } from '@/lib/db';
import { verification, user as userTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as { code?: string; cause?: { code?: string }; message?: string };
  const code = err.code || err.cause?.code;
  const message = (err.message || '').toLowerCase();

  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    message.includes('econnreset') ||
    message.includes('connection terminated') ||
    message.includes('connection reset')
  );
}

async function withDbRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === retries) {
        throw error;
      }

      const delayMs = 250 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
    }
  }

  throw lastError;
}

/**
 * GET /api/auth/verify-email
 * Verify email address using token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verificationRecords = await withDbRetry(() =>
      db
        .select()
        .from(verification)
        .where(
          and(
            eq(verification.identifier, email),
            eq(verification.value, token)
          )
        )
        .limit(1)
    );

    if (verificationRecords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 401 }
      );
    }

    const verificationRecord = verificationRecords[0];

    // Check if token has expired
    if (new Date() > new Date(verificationRecord.expiresAt)) {
      // Delete expired token
      await withDbRetry(() =>
        db
          .delete(verification)
          .where(eq(verification.id, verificationRecord.id))
      );

      return NextResponse.json(
        { error: 'Verification link has expired' },
        { status: 401 }
      );
    }

    // Find the user
    const users = await withDbRetry(() =>
      db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1)
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's email verification status
    await withDbRetry(() =>
      db
        .update(userTable)
        .set({
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, users[0].id))
    );

    // Delete the used verification token
    await withDbRetry(() =>
      db
        .delete(verification)
        .where(eq(verification.id, verificationRecord.id))
    );

    // Redirect to account page with success message
    return NextResponse.redirect(
      new URL('/account?verified=true', request.nextUrl.origin)
    );
  } catch (error) {
    console.error('Error verifying email:', error);

    if (isTransientDbError(error)) {
      return NextResponse.json(
        { error: 'Temporary database connection issue. Please try again in a few seconds.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
