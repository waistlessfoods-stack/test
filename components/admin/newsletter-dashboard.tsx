"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Users } from "lucide-react";

type Issue = { id: number; title: string; subject: string; status: string; updatedAt: string };

export default function NewsletterDashboard() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/newsletters", { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setIssues(data.issues);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function create() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/newsletters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Untitled newsletter", subject: "The WaistLess Table", previewText: "", body: "", ctaLabel: "", ctaUrl: "" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(`/admin/newsletters/${data.issue.id}`);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not create a draft."); setBusy(false); }
  }
  const published = issues.filter(issue => issue.status === "published").length;
  const visible = issues.filter(issue => filter === "all" || issue.status === filter);
  return (
    <main className="min-h-screen bg-[#f3f7f5] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-[#367577] hover:underline">← Admin portal</Link>
        <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#367577]">The WaistLess Table</p><h1 className="mt-2 text-3xl font-semibold text-[#173d40]">Newsletter studio</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">A place to prepare your next issue and build a collection your members can return to.</p></div>
          <button onClick={create} disabled={busy || loading} className="inline-flex items-center gap-2 rounded-xl bg-[#086b70] px-5 py-3 font-medium text-white disabled:opacity-50"><Plus size={18} />{busy ? "Creating…" : "New draft"}</button>
        </div>
        <div className="my-7 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"><strong>Archive publishing is ready. Broadcast sending is not enabled.</strong> Publishing makes an issue available to signed-in members; it does not email anyone. A sending provider is still needed for campaigns, scheduling, and delivery reporting.</div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Draft issues", number: issues.length - published, icon: FileText }, { label: "In member archive", number: published, icon: FileText }].map(item => <div key={item.label} className="rounded-2xl border border-[#dce8e5] bg-white p-6"><item.icon size={21} className="text-[#367577]" /><p className="mt-3 text-3xl font-semibold text-[#173d40]">{loading ? "—" : item.number}</p><p className="mt-1 text-sm text-slate-600">{item.label}</p></div>)}
          <Link href="/admin/newsletters/subscribers" className="rounded-2xl border border-[#dce8e5] bg-white p-6 hover:border-[#367577]"><Users size={21} className="text-[#367577]" /><h2 className="mt-4 font-semibold text-[#173d40]">Subscriber management</h2><p className="mt-2 text-sm leading-6 text-slate-600">Search subscribers, honor opt-outs, and export the active list.</p><span className="mt-3 inline-block text-sm font-medium text-[#086b70]">Manage subscribers →</span></Link>
        </div>
        <section className="mt-8 rounded-2xl border border-[#dce8e5] bg-white p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold text-[#173d40]">Your issues</h2><label className="text-sm text-slate-600">Show <select value={filter} onChange={event => setFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="all">All issues</option><option value="draft">Drafts</option><option value="published">Published to archive</option></select></label></div>
          {error && <p role="alert" className="my-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {loading ? <p className="py-12 text-center text-slate-500">Loading your issues…</p> : visible.length ? <div className="divide-y divide-[#e5eeeb]">{visible.map(issue => <Link key={issue.id} href={`/admin/newsletters/${issue.id}`} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0"><h3 className="break-words font-semibold text-[#173d40]">{issue.title}</h3><p className="mt-1 break-words text-sm text-slate-500">{issue.subject}</p><p className="mt-2 text-xs text-slate-500">Updated {new Date(issue.updatedAt).toLocaleDateString()}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${issue.status === "published" ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>{issue.status === "published" ? "In member archive" : "Draft"}</span></Link>)}</div> : <div className="py-12 text-center"><FileText className="mx-auto text-[#91aaa3]" size={32} /><h3 className="mt-4 font-semibold text-[#173d40]">{filter === "all" ? "Your first issue starts here" : "No issues in this view"}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Save your ideas as a draft. Nothing becomes visible to members until you choose to publish it.</p></div>}
          {issues.length === 200 && <p className="mt-4 text-sm text-slate-500">Showing the 200 most recently updated issues.</p>}
        </section>
      </div>
    </main>
  );
}
