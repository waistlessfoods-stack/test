import React from 'react';
import { db } from '@/lib/db';
import { verification, user as userTable } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email/resend';
import EmailVerificationEmail from '@/lib/email/templates/email-verification-email';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
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
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const existingUser = await withDbRetry(() =>
      db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1)
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
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
        id: `verify_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        identifier: email,
        value: token,
        expiresAt,
      })
    );

    // Build verification link
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // Send verification email using Resend
    const { data, error } = await sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      react: React.createElement(EmailVerificationEmail, {
        name: currentUser.name,
        verificationLink: verificationLink,
      }),
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Verification email sent',
        emailId: data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error requesting email verification:', error);

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
    description: 'Request email verification for current user',
    body: {
      email: 'string (required) - email address to verify',
    },
    response: {
      message: 'Verification email sent',
      emailId: 'string - Resend email ID',
    },
  });
}
