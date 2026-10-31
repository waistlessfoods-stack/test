"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ChefHat, ChevronRight, Download, Info, LockKeyhole, RefreshCw, Search, UsersRound } from "lucide-react";
import type { RosterData, RosterMode, RosterStatus } from "@/lib/class-roster";

const control = "h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:opacity-50";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50";

export default function ClassRosterAdmin() {
  const [mode, setMode] = useState<RosterMode>("live");
  const [sample, setSample] = useState(false);
  const [loadedSample, setLoadedSample] = useState(false);
  const [status, setStatus] = useState<RosterStatus>("completed");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [data, setData] = useState<RosterData | null>(null);
  const [loadedMode, setLoadedMode] = useState<RosterMode | null>(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/admin/class-rosters?mode=${mode}${sample ? "&sample=1" : ""}`, { cache: "no-store", signal: controller.signal });
        const next = await response.json();
        if (!response.ok) throw new Error(next.error || "Unable to load registrations.");
        if (!controller.signal.aborted) { setData(next); setLoadedMode(mode); setLoadedSample(sample); setError(""); }
      } catch (e) {
        if (!controller.signal.aborted) { setData(null); setError(e instanceof Error ? e.message : "Unable to load registrations."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [mode, sample, reload]);

  const current = loadedMode === mode && loadedSample === sample && !loading ? data : null;
  const group = current?.classes.find(group => group.key === selectedKey) || current?.classes[0];
  const needle = query.trim().toLowerCase().replace(/^#(?=\d)/, "");
  const rows = group?.registrations.filter(row => (status === "all" || row.status === status) && (!needle || [String(row.orderId), row.name, row.email, row.phone].some(value => value.toLowerCase().includes(needle)))) || [];

  function selectClass(key: string) { setSelectedKey(key); setQuery(""); setNotice(""); }
  function changeMode(value: RosterMode | "sample") {
    setSample(value === "sample"); setMode(value === "sample" ? "test" : value); setSelectedKey(""); setQuery(""); setStatus("completed"); setLoading(true); setError(""); setNotice("");
  }
  async function download() {
    if (!group) return;
    setExporting(true); setError(""); setNotice("");
    try {
      const params = new URLSearchParams({ mode, status, class: group.key, q: query, format: "csv" });
      if (sample) params.set("sample", "1");
      const response = await fetch(`/api/admin/class-rosters?${params}`, { cache: "no-store" });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Export failed."); }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `class-roster-${sample ? "sample" : mode}-${group.key.slice(0, 12)}-${status}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(sample ? "Sample CSV downloaded. These are fictional details, not a live registration." : "CSV downloaded with your current filters. Keep customer contact details private.");
    } catch (e) { setError(e instanceof Error ? e.message : "Export failed."); }
    finally { setExporting(false); }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#086b70] text-white"><ChefHat size={21} aria-hidden="true" /></span>
            <span className="text-sm font-bold tracking-tight text-[#173d40]">WaistLess Foods <span className="ml-2 hidden border-l border-slate-200 pl-3 font-medium text-slate-400 sm:inline">Admin</span></span>
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700">View site <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-5 sm:px-8 sm:pt-7">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin" className="inline-flex min-h-8 items-center gap-1.5 hover:text-teal-700"><ArrowLeft size={13} aria-hidden="true" /> Admin portal</Link>
          <ChevronRight size={12} aria-hidden="true" /><span className="font-medium text-slate-700">Cooking classes</span>
        </nav>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight text-[#173d40] sm:text-[30px]">Class registrations</h1><p className="mt-1.5 text-sm leading-6 text-slate-500">Your classes, purchasers, and confirmed seats in one place.</p></div>
          <button aria-label="Refresh registrations" disabled={loading} onClick={() => { setLoading(true); setError(""); setNotice(""); setReload(value => value + 1); }} className={secondaryButton}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />{loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {sample && <p className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">SAMPLE WALKTHROUGH — Alex Sample demonstrates one order for two seats. No customer, payment, registration, or reserved seat has been created. Select Live registrations to return to actual orders.</p>}
        {!sample && mode !== "live" && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">{mode === "test" ? "TEST / QA ONLY — These registrations do not belong on a live class roster." : "UNCLASSIFIED — Verify the payment environment before treating these as live registrations."}</p>}
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {!!current?.invalidLines && <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{current.invalidLines} malformed item(s) were excluded. Review the original orders before relying on these totals.</p>}

        <div className="grid items-start gap-5 lg:grid-cols-[256px_minmax(0,1fr)]">
          <aside aria-label="Class selection" className="min-w-0 rounded-xl border border-slate-200 bg-white lg:sticky lg:top-6">
            <div className="border-b border-slate-100 p-4">
              <label htmlFor="roster-mode" className="mb-2 block text-xs font-semibold text-slate-500">Order environment</label>
              <select id="roster-mode" className={control} value={sample ? "sample" : mode} onChange={event => changeMode(event.target.value as RosterMode | "sample")}>
                <option value="live">Live registrations</option><option value="test">Test / QA registrations</option><option value="unknown">Unclassified orders</option>
                <option value="sample">Sample walkthrough</option>
              </select>
            </div>
            <div className="p-4 lg:hidden">
              <label htmlFor="roster-class" className="mb-2 block text-xs font-semibold text-slate-500">Class & date</label>
              <select id="roster-class" disabled={!current?.classes.length} className={control} value={group?.key || ""} onChange={event => selectClass(event.target.value)}>
                <option value="" disabled>{loading ? "Loading classes…" : "No classes available"}</option>
                {current?.classes.map(item => <option key={item.key} value={item.key}>{item.title} · {item.eventDate || "Date not recorded"}</option>)}
              </select>
            </div>
            <div className="hidden lg:block">
              <div className="flex items-center justify-between px-4 pb-2 pt-4"><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your classes</h2><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{current?.classes.length || 0}</span></div>
              <div className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
                {current?.classes.map(item => <button key={item.key} aria-pressed={group?.key === item.key} aria-label={`Select ${item.title}, ${item.eventDate || "date not recorded"}`} onClick={() => selectClass(item.key)} className={`w-full rounded-lg border px-3 py-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-teal-700 ${group?.key === item.key ? "border-teal-200 bg-[#edf7f5]" : "border-transparent hover:bg-slate-50"}`}>
                  <span className="flex items-start gap-2"><span className={`min-w-0 flex-1 break-words text-sm font-semibold leading-5 ${group?.key === item.key ? "text-[#086b70]" : "text-slate-700"}`}>{item.title}</span>{group?.key === item.key && <Check size={15} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />}</span>
                  <span className="mt-2 block text-xs leading-5 text-slate-500">{item.eventDate || "Date not recorded"}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><UsersRound size={12} aria-hidden="true" />{item.confirmedSeats} confirmed {item.confirmedSeats === 1 ? "seat" : "seats"}</span>
                </button>)}
                {!current?.classes.length && <p className="px-3 py-5 text-xs leading-6 text-slate-400">{loading ? "Loading your classes…" : "Classes appear here once an order is placed."}</p>}
              </div>
              <p className="border-t border-slate-100 px-4 py-3 text-[11px] leading-5 text-slate-400">Classes with order history only.</p>
            </div>
          </aside>

          <div className="min-w-0">
            {loading && <div role="status" className="rounded-xl border border-slate-200 bg-white p-6"><span className="sr-only">Loading registrations</span><div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" /><div className="mb-8 mt-4 h-4 w-1/2 animate-pulse rounded bg-slate-100" />{[1, 2, 3].map(i => <div key={i} className="mt-3 h-16 animate-pulse rounded-lg bg-slate-50" />)}</div>}
            {group && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
              <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-5 pt-6 sm:px-6">
                <div className="min-w-0 flex-1 basis-full sm:basis-0"><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-teal-700"><CalendarDays size={13} aria-hidden="true" />Class roster</div><h2 className="break-words text-xl font-bold leading-7 tracking-tight text-[#173d40]">{group.title}</h2><p className="mt-1.5 text-sm leading-6 text-slate-500">{group.eventDate || "Event date not recorded"}</p></div>
                <button aria-label="Export filtered CSV" disabled={exporting || !rows.length} onClick={download} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#086b70] px-4 text-sm font-semibold text-white transition hover:bg-[#07585c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50 sm:w-auto"><Download size={15} aria-hidden="true" />{exporting ? "Exporting…" : "Export CSV"}</button>
              </div>

              <section aria-label="Class totals" className="mx-5 grid grid-cols-3 divide-x divide-[#dce8e4] rounded-lg border border-[#dce8e4] bg-[#f4f9f7] py-4 sm:mx-6">
                {[{ label: "Confirmed seats", value: group.confirmedSeats }, { label: "Confirmed orders", value: group.confirmedOrders }, { label: "Pending-order seats", value: group.pendingSeats }].map(item => <div key={item.label} className="min-w-0 px-3 sm:px-5"><p className="min-h-8 text-[11px] font-medium leading-4 text-slate-500 sm:min-h-0 sm:text-xs">{item.label}</p><p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#173d40] sm:text-[28px]">{item.value}</p></div>)}
              </section>
              <p className="mx-5 mb-5 mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500 sm:mx-6"><Info size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />Purchasers and seat quantities. Individual guest names are not collected.</p>

              <div className="grid gap-3 border-y border-slate-100 bg-slate-50/70 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:px-6">
                <div className="relative"><label htmlFor="roster-search" className="sr-only">Find purchaser or order</label><Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true" /><input id="roster-search" maxLength={150} placeholder="Search name, email or order…" className={`${control} pl-10`} value={query} onChange={event => { setQuery(event.target.value); setNotice(""); }} /></div>
                <div><label htmlFor="roster-status" className="sr-only">Order status</label><select id="roster-status" className={control} value={status} onChange={event => { setStatus(event.target.value as RosterStatus); setNotice(""); }}><option value="completed">Confirmed / paid</option><option value="pending">Pending payment</option><option value="refunded">Refunded</option><option value="failed">Failed</option><option value="all">All statuses</option></select></div>
              </div>

              <div className="hidden grid-cols-[minmax(0,1.5fr)_64px_130px_100px] gap-3 border-b border-slate-100 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 xl:grid"><span>Purchaser</span><span>Seats</span><span>Status</span><span>Order placed</span></div>
              <div className="divide-y divide-slate-100">{rows.map(row => <article key={row.orderId} className="grid gap-3 px-5 py-4 transition hover:bg-slate-50/60 sm:px-6 xl:grid-cols-[minmax(0,1.5fr)_64px_130px_100px] xl:items-center">
                <div className="flex min-w-0 items-start gap-3"><span aria-hidden="true" className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf3f2] text-xs font-bold text-[#367577]">{row.name ? row.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("") : <UsersRound size={15} />}</span><div className="min-w-0"><h3 className="break-words text-sm font-semibold text-slate-800">{row.name || "Name not recorded"}</h3><p className="mt-1 break-all text-xs leading-5 text-slate-500">{row.email || "Email not recorded"}</p>{row.phone && <p className="break-all text-xs leading-5 text-slate-400">{row.phone}</p>}</div></div>
                <div className="ml-12 flex items-center justify-between gap-3 xl:ml-0 xl:block"><p className="text-sm font-semibold tabular-nums text-slate-700">{row.seats}<span className="ml-1 font-normal text-slate-500 xl:hidden">{row.seats === 1 ? "seat" : "seats"}</span></p><p className="mt-0.5 text-[11px] text-slate-400 xl:hidden">Order #{row.orderId}</p></div>
                <div className="ml-12 flex items-center justify-between gap-3 xl:ml-0 xl:block"><span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ${row.status === "completed" ? "bg-emerald-50 text-emerald-700" : row.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{row.status === "completed" ? "Confirmed / paid" : row.status}</span><span className="text-[11px] text-slate-400 xl:hidden">{new Date(row.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} UTC</span></div>
                <div className="hidden text-xs text-slate-500 xl:block"><p>{new Date(row.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</p><p className="mt-1.5 text-[11px] text-slate-400">#{row.orderId} · UTC</p></div>
              </article>)}</div>
              {!rows.length && <div className="px-5 py-12 text-center"><Search size={24} className="mx-auto text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-slate-600">No registrations match these filters.</p><button onClick={() => { setQuery(""); setStatus("completed"); }} className="mt-3 min-h-10 text-sm font-semibold text-teal-700 hover:underline">Reset filters</button></div>}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-[11px] leading-5 text-slate-400 sm:px-6"><span>{rows.length} registration order{rows.length === 1 ? "" : "s"} shown · totals are before filters</span><span className="inline-flex items-center gap-1.5"><LockKeyhole size={11} aria-hidden="true" />Private roster</span></div>
            </section>}

            {!loading && current && !group && <section className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center"><UsersRound size={30} className="mx-auto text-teal-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold text-[#173d40]">No class registrations yet</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">Classes appear after an order contains a cooking-class item. Private-class enquiries remain in Booking Requests.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button onClick={() => changeMode("sample")} className={secondaryButton}>View sample registration</button><Link href="/admin/bookings" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-700">View booking requests <ArrowUpRight size={15} aria-hidden="true" /></Link></div></section>}

            <details className="mt-4 rounded-lg border border-slate-200/80 bg-white/60 text-xs text-slate-500">
              <summary className="cursor-pointer rounded-lg px-4 py-3.5 font-medium outline-teal-700">About these counts & CSV privacy</summary>
              <div className="space-y-2 border-t border-slate-100 px-4 py-4 leading-6"><p>Only completed website orders count as confirmed. Pending, failed, and refunded orders do not; pending seats are not reserved. Payment and refund status must be synchronized to the website order records.</p><p>Purchaser details and seat quantities are recorded at checkout, not individual guest names. CSV contact details are private operational data, not marketing consent.</p>{group && <p>Capacity recorded at checkout: {group.recordedCapacities.length ? [...group.recordedCapacities].sort((a, b) => a - b).join(" / ") : "not recorded"}. This is historical information, not current availability. Dates are shown as booked, without time-zone conversion.<span className="mt-1 block break-all">Product: {group.productId}</span></p>}<p>This workspace is read-only. Public class availability and checkout settings are unchanged.</p></div>
            </details>
            {current && <p className="mt-3 text-right text-[11px] text-slate-400">Last updated {new Date(current.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })} UTC</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
