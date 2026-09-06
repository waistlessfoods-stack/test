import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterIssues } from "@/lib/db/schema";
import { parsePositiveInteger } from "@/lib/newsletter-content";
import { newsletterError, privateHeaders } from "@/lib/newsletter-http";
import { createNewsletterPdf } from "@/lib/newsletter-pdf";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth()).userId) return NextResponse.json({ error: "Sign in to download newsletters." }, { status: 401, headers: privateHeaders });
  try {
    const id = parsePositiveInteger((await params).id);
    const [issue] = await db.select().from(newsletterIssues).where(and(eq(newsletterIssues.id, id), eq(newsletterIssues.status, "published"))).limit(1);
    if (!issue) return NextResponse.json({ error: "Newsletter not found." }, { status: 404, headers: privateHeaders });
    const bytes = await createNewsletterPdf(issue);
    return new NextResponse(Buffer.from(bytes), { headers: { ...privateHeaders, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="waistless-table-${id}.pdf"`, "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return newsletterError(error); }
}
