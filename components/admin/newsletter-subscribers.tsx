"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Subscriber = { id: number; email: string; active: boolean; createdAt: string; unsubscribedAt: string | null };

export default function NewsletterSubscribers() {
  const [rows, setRows] = useState<Subscriber[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const response = await fetch(`/api/admin/newsletter-subscribers?${new URLSearchParams({ q: search, status, page: String(page) })}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setRows(data.subscribers); setTotal(data.total);
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load subscribers."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [page, search, status, revision]);
  async function unsubscribe(subscriber: Subscriber) {
    if (!window.confirm(`Unsubscribe ${subscriber.email}? This does not delete their account or archive access.`)) return;
    setBusy(subscriber.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/newsletter-subscribers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: subscriber.id, action: "unsubscribe" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice(data.message); setRevision(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not unsubscribe."); } finally { setBusy(null); }
  }
  return (
    <main className="min-h-screen bg-[#f3f7f5] px-4 py-10 sm:px-8"><div className="mx-auto max-w-6xl">
      <Link href="/admin/newsletters" className="text-sm text-[#367577] hover:underline">← Newsletter studio</Link>
      <div className="my-7 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold text-[#173d40]">Newsletter subscribers</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Marketing subscriptions are separate from website accounts. An unsubscribe stops newsletter eligibility, not member archive access.</p></div><a href="/api/admin/newsletter-subscribers?format=csv" className="rounded-xl border border-[#367577] bg-white px-4 py-3 text-sm font-medium text-[#086b70]">Export all active subscribers</a></div>
      <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Exports contain email addresses. Keep them private, use them only for the agreed newsletter, and honor subsequent opt-outs before sending. Unsubscribed addresses cannot be reactivated here.</p>
      <section className="rounded-2xl border border-[#dce8e5] bg-white p-5 sm:p-7">
        <form onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setPage(1); }} className="mb-6 flex flex-wrap gap-3"><label className="min-w-0 flex-1 text-sm text-slate-600">Search email<input value={query} onChange={event => setQuery(event.target.value)} maxLength={120} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Find a subscriber" /></label><label className="text-sm text-slate-600">Status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="mt-2 block rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="all">All</option><option value="active">Active</option><option value="inactive">Unsubscribed</option></select></label><button className="self-end rounded-lg bg-[#086b70] px-4 py-2 text-white">Search</button></form>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg bg-teal-50 p-4 text-sm text-teal-900">{notice}</p>}
        <p className="mb-3 text-sm text-slate-500">{total} matching subscribers</p>
        {loading ? <p className="py-10 text-center text-slate-500">Loading subscribers…</p> : !rows.length ? <p className="py-10 text-center text-slate-500">No subscribers match this view.</p> : <ul className="divide-y divide-[#e5eeeb]">{rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="break-all text-sm font-medium text-[#173d40]">{row.email}</p><p className="mt-1 text-xs text-slate-500">Subscribed {new Date(row.createdAt).toLocaleDateString()}{row.unsubscribedAt ? ` · Unsubscribed ${new Date(row.unsubscribedAt).toLocaleDateString()}` : ""}</p></div><div className="flex items-center gap-4"><span className={`rounded-full px-3 py-1 text-xs ${row.active ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-500"}`}>{row.active ? "Active" : "Unsubscribed"}</span>{row.active && <button onClick={() => unsubscribe(row)} disabled={busy !== null} className="text-sm text-red-700 underline disabled:opacity-40">{busy === row.id ? "Updating…" : "Unsubscribe"}</button>}</div></li>)}</ul>}
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#dce8e5] pt-5"><button disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="text-sm text-[#086b70] disabled:opacity-40">← Previous</button><span className="text-sm text-slate-500">Page {page} of {Math.max(1, Math.ceil(total / 50))}</span><button disabled={page * 50 >= total || loading} onClick={() => setPage(value => value + 1)} className="text-sm text-[#086b70] disabled:opacity-40">Next →</button></div>
      </section>
    </div></main>
  );
}
