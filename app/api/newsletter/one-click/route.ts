import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { isValidNewsletterUnsubscribeToken } from '@/lib/newsletter-unsubscribe';

// RFC 8058 endpoint: possession of the signed token authorizes only opt-out.
// GET/link scanners cannot change subscription state. No session is required.
export async function POST(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const id = Number(request.nextUrl.searchParams.get('subscriber'));
    const token = request.nextUrl.searchParams.get('token') || '';
    if (!Number.isSafeInteger(id) || id < 1) return new NextResponse(null, { status: 400, headers });
    const text = await request.text();
    if (text.length > 200 || new URLSearchParams(text).get('List-Unsubscribe') !== 'One-Click') return new NextResponse(null, { status: 400, headers });
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.id, id)).limit(1);
    if (!subscriber || !isValidNewsletterUnsubscribeToken(id, subscriber.email, token)) return new NextResponse(null, { status: 400, headers });
    await db.update(subscribers).set({ active: false, unsubscribedAt: new Date(), updatedAt: new Date() }).where(and(eq(subscribers.id, id), eq(subscribers.email, subscriber.email)));
    return new NextResponse(null, { status: 200, headers });
  } catch { return new NextResponse(null, { status: 503, headers }); }
}
