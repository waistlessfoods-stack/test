import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterIssues } from "@/lib/db/schema";
import { parseNewsletterContent } from "@/lib/newsletter-content";
import { newsletterAdminGuard, newsletterError, newsletterJson, privateHeaders } from "@/lib/newsletter-http";

export async function GET(request: NextRequest) {
  const denied = newsletterAdminGuard(request);
  if (denied) return denied;
  try {
    const issues = await db.select({ id: newsletterIssues.id, title: newsletterIssues.title, subject: newsletterIssues.subject, status: newsletterIssues.status, version: newsletterIssues.version, updatedAt: newsletterIssues.updatedAt, publishedAt: newsletterIssues.publishedAt }).from(newsletterIssues).orderBy(desc(newsletterIssues.updatedAt)).limit(200);
    return NextResponse.json({ issues, broadcastEnabled: false }, { headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}

export async function POST(request: NextRequest) {
  const denied = newsletterAdminGuard(request);
  if (denied) return denied;
  try {
    const content = parseNewsletterContent(await newsletterJson(request));
    const [issue] = await db.insert(newsletterIssues).values(content).returning();
    return NextResponse.json({ issue }, { status: 201, headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}
