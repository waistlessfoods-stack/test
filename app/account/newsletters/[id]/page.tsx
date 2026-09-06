import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterIssues } from "@/lib/db/schema";
import NewsletterArticle from "@/components/newsletter-article";

export default async function MemberNewsletterPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await auth()).userId) redirect("/signin?redirect_url=%2Faccount%2Fnewsletters");
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) > 2147483647 || Number(id) < 1) notFound();
  const [issue] = await db.select().from(newsletterIssues).where(and(eq(newsletterIssues.id, Number(id)), eq(newsletterIssues.status, "published"))).limit(1);
  if (!issue) notFound();
  return <main className="min-h-screen bg-[#f3f7f5] px-4 py-10"><div className="mx-auto max-w-3xl"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><Link href="/account/newsletters" className="text-sm text-[#367577] hover:underline">← Member archive</Link><a href={`/api/newsletters/${issue.id}/download`} className="rounded-lg bg-[#086b70] px-4 py-2.5 text-sm font-medium text-white">Download PDF</a></div><NewsletterArticle issue={issue} /></div></main>;
}
