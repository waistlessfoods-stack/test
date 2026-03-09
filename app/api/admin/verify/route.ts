import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/verify
 * Verifies admin password
 */
export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ authenticated: true }, { status: 200 });
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
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    method: 'POST',
    description: 'Verify admin password for portal access',
    body: {
      password: 'string (required) - admin password from ADMIN_PASSWORD env var',
    },
  });
}
