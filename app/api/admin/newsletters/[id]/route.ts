import React from "react";
import { and, eq, sql } from "drizzle-orm";
import { render } from "@react-email/render";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterIssues } from "@/lib/db/schema";
import { assertNewsletterReady, NewsletterInputError, parseNewsletterContent, parsePositiveInteger } from "@/lib/newsletter-content";
import { newsletterAdminGuard, newsletterError, newsletterJson, privateHeaders } from "@/lib/newsletter-http";
import { createNewsletterPdf } from "@/lib/newsletter-pdf";
import { fromEmail, sendEmail } from "@/lib/email/mailer";
import NewsletterIssueEmail from "@/lib/email/templates/newsletter-issue-email";

type Context = { params: Promise<{ id: string }> };
const missing = () => NextResponse.json({ error: "Issue not found." }, { status: 404, headers: privateHeaders });

export async function GET(request: NextRequest, context: Context) {
  const denied = newsletterAdminGuard(request);
  if (denied) return denied;
  try {
    const id = parsePositiveInteger((await context.params).id);
    const [issue] = await db.select().from(newsletterIssues).where(eq(newsletterIssues.id, id)).limit(1);
    if (!issue) return missing();
    if (request.nextUrl.searchParams.get("format") === "pdf") {
      const bytes = await createNewsletterPdf(issue);
      return new NextResponse(Buffer.from(bytes), { headers: { ...privateHeaders, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="newsletter-${id}-preview.pdf"` } });
    }
    if (request.nextUrl.searchParams.get("format") === "email") {
      const html = await render(React.createElement(NewsletterIssueEmail, { issue }));
      return new NextResponse(html, { headers: { ...privateHeaders, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; frame-ancestors 'self'; sandbox" } });
    }
    return NextResponse.json({ issue }, { headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  const denied = newsletterAdminGuard(request);
  if (denied) return denied;
  try {
    const id = parsePositiveInteger((await context.params).id);
    const input = await newsletterJson(request);
    const version = parsePositiveInteger(input.version);
    const content = parseNewsletterContent(input);
    if (input.status !== "draft" && input.status !== "published") throw new NewsletterInputError("Status must be draft or published.");
    if (input.status === "published") {
      assertNewsletterReady(content);
      await createNewsletterPdf(content); // Verify the member download before publication.
    }
    const [issue] = await db.update(newsletterIssues).set({
      ...content, status: input.status, updatedAt: new Date(), version: sql`${newsletterIssues.version} + 1`,
      publishedAt: input.status === "published" ? sql`coalesce(${newsletterIssues.publishedAt}, now())` : null,
    }).where(and(eq(newsletterIssues.id, id), eq(newsletterIssues.version, version))).returning();
    if (!issue) return NextResponse.json({ error: "This issue changed in another tab or no longer exists. Reload before saving; your edits have not been applied." }, { status: 409, headers: privateHeaders });
    return NextResponse.json({ issue }, { headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}

// A test is a single administrator preview, never a subscriber broadcast.
export async function POST(request: NextRequest, context: Context) {
  const denied = newsletterAdminGuard(request);
  if (denied) return denied;
  try {
    const id = parsePositiveInteger((await context.params).id);
    const version = parsePositiveInteger((await newsletterJson(request)).version);
    const [issue] = await db.select().from(newsletterIssues).where(eq(newsletterIssues.id, id)).limit(1);
    if (!issue) return missing();
    if (issue.version !== version) return NextResponse.json({ error: "Save or reload the latest issue before sending a test." }, { status: 409, headers: privateHeaders });
    assertNewsletterReady(issue);
    const [claimed] = await db.update(newsletterIssues).set({ lastTestAt: new Date() }).where(and(
      eq(newsletterIssues.id, id), eq(newsletterIssues.version, version),
      sql`(${newsletterIssues.lastTestAt} is null or ${newsletterIssues.lastTestAt} < now() - interval '60 seconds')`,
    )).returning();
    if (!claimed) return NextResponse.json({ error: "Wait one minute between tests, or reload if the issue changed." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "60" } });
    const result = await sendEmail({ to: process.env.ADMIN_EMAIL?.trim() || fromEmail, subject: `[PREVIEW] ${claimed.subject}`, react: React.createElement(NewsletterIssueEmail, { issue: claimed }) });
    if (result.error) return NextResponse.json({ error: "The mail service could not send the preview. Check email configuration and retry in one minute." }, { status: 502, headers: privateHeaders });
    return NextResponse.json({ message: "Preview sent to the configured administrator address. No subscribers were emailed." }, { headers: privateHeaders });
  } catch (error) { return newsletterError(error); }
}
