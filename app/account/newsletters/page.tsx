import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterIssues } from "@/lib/db/schema";

export default async function NewsletterArchivePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await auth()).userId) redirect("/signin?redirect_url=%2Faccount%2Fnewsletters");
  const requested = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 10000 ? requested : 1;
  const issues = await db.select({ id: newsletterIssues.id, title: newsletterIssues.title, previewText: newsletterIssues.previewText, publishedAt: newsletterIssues.publishedAt }).from(newsletterIssues).where(eq(newsletterIssues.status, "published")).orderBy(desc(newsletterIssues.publishedAt), desc(newsletterIssues.id)).limit(13).offset((page - 1) * 12);
  return (
    <main className="min-h-screen bg-[#f3f7f5] px-4 py-12 sm:px-8"><div className="mx-auto max-w-5xl">
      <Link href="/account" className="text-sm text-[#367577] hover:underline">← My account</Link>
      <header className="mb-10 mt-8 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#367577]">Your member collection</p><h1 className="mt-3 font-serif text-4xl text-[#173d40] sm:text-5xl">The WaistLess Table</h1><p className="mt-5 text-base leading-7 text-slate-600">Fresh ideas worth keeping. Read previous newsletters and download a personal PDF copy, whenever you need a little inspiration.</p><p className="mt-3 text-sm text-slate-500">Your archive access is separate from your email subscription.</p></header>
      {issues.length ? <div className="grid gap-5 sm:grid-cols-2">{issues.slice(0, 12).map(issue => <article key={issue.id} className="flex flex-col rounded-2xl border border-[#dce8e5] bg-white p-6 sm:p-8"><p className="text-xs font-medium uppercase tracking-wider text-[#367577]">{issue.publishedAt?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p><h2 className="mt-4 break-words text-2xl font-semibold text-[#173d40]">{issue.title}</h2><p className="mb-6 mt-3 break-words text-sm leading-7 text-slate-600">{issue.previewText || "An issue from Chef Amber’s newsletter collection."}</p><div className="mt-auto flex flex-wrap gap-4"><Link href={`/account/newsletters/${issue.id}`} className="font-medium text-[#086b70] hover:underline">Read issue →</Link><a href={`/api/newsletters/${issue.id}/download`} className="text-sm text-[#687775] underline">Download PDF</a></div></article>)}</div> : <div className="rounded-2xl border border-[#dce8e5] bg-white p-10 text-center"><h2 className="text-xl font-semibold text-[#173d40]">Your collection is getting started</h2><p className="mt-3 text-sm leading-7 text-slate-600">Published newsletters will appear here. There’s nothing to download just yet.</p></div>}
      <nav aria-label="Newsletter archive pages" className="mt-8 flex justify-between text-sm text-[#086b70]">{page > 1 ? <Link href={`?page=${page - 1}`}>← Newer issues</Link> : <span />}{issues.length > 12 && <Link href={`?page=${page + 1}`}>Older issues →</Link>}</nav>
    </div></main>
  );
}
