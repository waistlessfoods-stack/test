import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  isValidAdminSessionToken,
  setAdminSessionCookie,
} from '@/lib/admin-session';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const ADMIN_LOGIN_LIMIT = 5;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * POST /api/admin/verify
 * Verifies admin password and creates an httpOnly admin session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const loginLimit = checkRateLimit(request, {
      name: 'admin-login:ip',
      limit: ADMIN_LOGIN_LIMIT,
      windowMs: ADMIN_LOGIN_WINDOW_MS,
    });
    if (loginLimit.limited) {
      return rateLimitResponse(loginLimit);
    }

    const body = await request.json();
    const { password } = body;

    // Verify admin password
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin access not configured' },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Admin access not configured' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ authenticated: true }, { status: 200 });
    setAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/verify
 * Returns current admin session status
 */
export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { authenticated: false, error: 'Admin access not configured' },
      { status: 500 }
    );
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return NextResponse.json({
    authenticated: isValidAdminSessionToken(token),
  });
}
