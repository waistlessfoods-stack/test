import { and, count, desc, eq, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { csvCell, NewsletterInputError, parsePositiveInteger } from "@/lib/newsletter-content";
import { newsletterAdminGuard, newsletterError, newsletterJson, privateHeaders } from "@/lib/newsletter-http";

export async function GET(request: NextRequest) {
  const denied = newsletterAdminGuard(request);
  if (denied) return denied;
  try {
    const params = request.nextUrl.searchParams;
    if (params.get("format") === "csv") {
      const rows = await db.select({ email: subscribers.email, joined: subscribers.createdAt }).from(subscribers).where(eq(subscribers.active, true)).orderBy(desc(subscribers.createdAt)).limit(5001);
      if (rows.length > 5000) throw new NewsletterInputError("This export exceeds 5,000 subscribers. Arrange a provider import instead.");
      const csv = "email,subscribed_at\r\n" + rows.map(row => `${csvCell(row.email)},${csvCell(row.joined.toISOString())}`).join("\r\n");
      return new NextResponse(csv, { headers: { ...privateHeaders, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="active-newsletter-subscribers.csv"' } });
    }
    const page = parsePositiveInteger(params.get("page") || 1);
    if (page > 10000) throw new NewsletterInputError("Page is out of range.");
    const search = (params.get("q") || "").trim().slice(0, 120).replace(/[\\%_]/g, "\\$&");
    const status = params.get("status") || "all";
    if (!["all", "active", "inactive"].includes(status)) throw new NewsletterInputError("Invalid subscriber status.");
    const where = and(search ? ilike(subscribers.email, `%${search}%`) : undefined, status === "all" ? undefined : eq(subscribers.active, status === "active"));
    const [rows, totals] = await Promise.all([
      db.select().from(subscribers).where(where).orderBy(desc(subscribers.createdAt), desc(subscribers.id)).limit(50).offset((page - 1) * 50),
      db.select({ total: count() }).from(subscribers).where(where),
    ]);
    return NextResponse.json({ subscribers: rows, total: totals[0].total, page }, { headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}

export async function PATCH(request: NextRequest) {
  const denied = newsletterAdminGuard(request);
  if (denied) return denied;
  try {
    const input = await newsletterJson(request);
    if (input.action !== "unsubscribe") throw new NewsletterInputError("Only unsubscribe is supported. Customers must opt in themselves to reactivate.");
    const id = parsePositiveInteger(input.id);
    const [subscriber] = await db.update(subscribers).set({ active: false, unsubscribedAt: new Date(), updatedAt: new Date() }).where(eq(subscribers.id, id)).returning({ id: subscribers.id });
    if (!subscriber) return NextResponse.json({ error: "Subscriber not found." }, { status: 404, headers: privateHeaders });
    return NextResponse.json({ message: "Subscriber unsubscribed. Their website account and archive access are unchanged." }, { headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}
