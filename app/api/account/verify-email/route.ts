import React from 'react';
import { randomBytes } from 'crypto';
import { auth, currentUser as getCurrentClerkUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { verification, user as userTable } from '@/lib/db/schema';
import { getCanonicalAppUrl } from '@/lib/app-url';
import { syncCurrentClerkUser } from '@/lib/clerk-user-sync';
import { sendEmail } from '@/lib/email/mailer';
import { hashVerificationToken } from '@/lib/email-verification-token';
import EmailVerificationEmail from '@/lib/email/templates/email-verification-email';
import {
  checkRateLimit,
  normalizeRateLimitEmail,
  rateLimitResponse,
} from '@/lib/rate-limit';
import { getRequestLogContext, logError, logInfo, maskEmail } from '@/lib/structured-log';
import { validateTextFieldLengths } from '@/lib/text-field-validation';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function generateVerificationId(): string {
  return `verify_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

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
 * POST /api/account/verify-email
 * Request email verification
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await getCurrentClerkUser();
    const email = normalizeRateLimitEmail(clerkUser?.primaryEmailAddress?.emailAddress);

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'You must be signed in to request email verification' },
        { status: 401 }
      );
    }

    const textFieldError = validateTextFieldLengths({ email }, {
      email: { label: 'Email', max: 254 },
    });
    if (textFieldError) {
      return NextResponse.json({ error: textFieldError }, { status: 400 });
    }

    const ipLimit = await checkRateLimit(request, {
      name: 'verify-email:ip',
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (ipLimit.limited) {
      return rateLimitResponse(ipLimit);
    }

    const emailLimit = await checkRateLimit(request, {
      name: 'verify-email:email',
      identifier: email,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (emailLimit.limited) {
      return rateLimitResponse(emailLimit);
    }

    await syncCurrentClerkUser();

    // Find the signed-in user only; never trust request-body email for this flow.
    const existingUser = await withDbRetry(() =>
      db
        .select()
        .from(userTable)
        .where(and(eq(userTable.id, userId), eq(userTable.email, email)))
        .limit(1)
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Signed-in user record was not found' },
        { status: 404 }
      );
    }

    const currentUser = existingUser[0];

    // If already verified, return message
    if (currentUser.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      );
    }

    // Clear any existing verification tokens for this email
    await withDbRetry(() =>
      db
        .delete(verification)
        .where(eq(verification.identifier, email))
    );

    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token in database
    await withDbRetry(() =>
      db.insert(verification).values({
        id: generateVerificationId(),
        identifier: email,
        value: hashVerificationToken(token),
        expiresAt,
      })
    );

    // Build verification link
    const baseUrl = getCanonicalAppUrl();
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // Send verification email
    const { data, error } = await sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      react: React.createElement(EmailVerificationEmail, {
        name: currentUser.name,
        verificationLink: verificationLink,
      }),
    });

    if (error) {
      logError('verify_email.email_failed', {
        ...getRequestLogContext(request),
        userId,
        email: maskEmail(email),
        error,
      });
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    logInfo('verify_email.requested', {
      ...getRequestLogContext(request),
      userId,
      email: maskEmail(email),
      emailId: data?.id ?? null,
    });

    return NextResponse.json(
      {
        message: 'Verification email sent',
        emailId: data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    logError('verify_email.request_failed', {
      ...getRequestLogContext(request),
      error,
    });

    if (isTransientDbError(error)) {
      return NextResponse.json(
        { error: 'Temporary database connection issue. Please try again in a few seconds.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to request verification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/account/verify-email
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    method: 'POST',
    description: 'Request email verification for the currently signed-in user',
    auth: 'Required',
    body: 'No body required; email is read from the authenticated user session.',
    response: {
      message: 'Verification email sent',
      emailId: 'string - email provider message ID',
    },
  });
}
