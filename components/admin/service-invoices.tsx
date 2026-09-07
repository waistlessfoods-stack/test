"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ServiceInvoiceCard } from "@/components/service-invoice-card";
import { parseServiceInvoice, serviceMoney, type ServiceInvoiceView } from "@/lib/service-invoice-content";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#086b70] focus:outline-none focus:ring-2 focus:ring-[#086b70]/15 disabled:bg-slate-100";
const buttonClass = "rounded-lg bg-[#086b70] px-5 py-3 text-sm font-semibold text-white hover:bg-[#07585c] disabled:cursor-wait disabled:opacity-50";
const blank = { name: "", email: "", service: "private_chef", title: "", eventDate: "", notes: "", daysUntilDue: 14 };
type Line = { description: string; quantity: string; price: string };

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load invoices.");
  return data;
}

export default function AdminServiceInvoices() {
  const [invoices, setInvoices] = useState<ServiceInvoiceView[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<ServiceInvoiceView | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(blank);
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: "1", price: "" }]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [locked, setLocked] = useState(false);
  const pending = useRef<{ key: string; body: string } | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const total = lines.reduce((sum, line) => sum + Math.round(Number(line.price) * 100) * Number(line.quantity), 0);

  const load = useCallback(async (after?: string) => {
    setLoading(true);
    try { const data = await api(`/api/admin/service-invoices${after ? `?after=${after}` : ""}`); setInvoices(previous => after ? [...previous, ...data.invoices] : data.invoices); setNext(data.next); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load invoices."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    void api("/api/admin/service-invoices").then(data => { if (active) { setInvoices(data.invoices); setNext(data.next); } }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load invoices."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!creating) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [creating]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    if (!pending.current) {
      if (lines.some(line => !/^\d+(\.\d{1,2})?$/.test(line.price))) { setError("Enter prices with no more than two decimal places."); return; }
      try {
        const validated = parseServiceInvoice({ ...form, items: lines.map(line => ({ description: line.description, quantity: Number(line.quantity), unitAmount: Math.round(Number(line.price) * 100) })) });
        pending.current = { key: `${Date.now()}-${crypto.randomUUID()}`, body: JSON.stringify(validated) };
      } catch (e) { setError(e instanceof Error ? e.message : "Check the invoice details."); return; }
    }
    setBusy(true); setLocked(true);
    try {
      const data = await api("/api/admin/service-invoices", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": pending.current.key }, body: pending.current.body });
      setSelected(data.invoice); setCreating(false); pending.current = null; setLocked(false); setForm(blank); setLines([{ description: "", quantity: "1", price: "" }]); setNotice("Draft saved in Stripe. Nothing was emailed or charged."); await load();
    } catch (e) { setError(`${e instanceof Error ? e.message : "Unable to save."} Retry keeps the same submission to avoid duplicates. To change details, first check the invoice list.`); }
    finally { setBusy(false); }
  }
  async function review(id: string) {
    setBusy(true); setError(""); setNotice("");
    try { const data = await api(`/api/admin/service-invoices/${id}`); setSelected(data.invoice); setInvoices(previous => previous.map(invoice => invoice.id === id ? data.invoice : invoice)); setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load invoice."); }
    finally { setBusy(false); }
  }
  async function act(action: "finalize" | "send" | "void") {
    if (!selected) return;
    const message = action === "finalize" ? `Issue ${serviceMoney(selected.total)} to ${selected.email}? This locks the draft and creates a payment link. No email is sent by this action. Confirm the customer, service scope, and any agreed fees/taxes are correct.` : action === "send" ? `${selected.live ? "Send a real invoice email" : "Test the send action (Stripe does not deliver test-mode invoice emails)"} to ${selected.email}?` : "Void this unpaid invoice? The payment link will no longer accept payment. This cannot be undone.";
    if (!window.confirm(message)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await api(`/api/admin/service-invoices/${selected.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, expectedTotal: selected.total }) });
      setSelected(data.invoice);
      setNotice(action === "finalize" ? "Invoice issued. You can copy its payment link or explicitly email it below." : action === "send" ? (data.invoice.live ? "Stripe accepted the email request. Check Stripe for delivery information." : "Test send accepted. Stripe does not deliver invoice emails in test mode.") : "Invoice voided. No refund was issued."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f3f7f5] px-4 py-9 sm:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/admin" className="text-sm text-[#367577] hover:underline">← Admin portal</Link>
    <header className="mb-7 mt-6 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#367577]">Private Chef · Catering</p><h1 className="mt-3 font-serif text-4xl text-[#173d40]">Service invoices</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">A personal service deserves a personal invoice. Prepare the details, review together, and give your customer one secure place to pay.</p></div><button className={buttonClass} disabled={busy || creating} onClick={() => { setCreating(true); setSelected(null); setError(""); setNotice(""); }}>New invoice draft</button></header>
    <div className="mb-7 rounded-xl border border-[#d6e4df] bg-white px-5 py-4 text-sm leading-6 text-slate-600"><strong className="text-[#173d40]">Draft → Issue → Email or share → Track payment.</strong> Drafts never charge or email customers. Amounts are USD; taxes, discounts, deposits, and remaining contract balances are not calculated automatically. Enter the agreed amount for this invoice. Contracts and date confirmation stay with Amber.</div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
    {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{notice}</p>}
    {creating && <form onSubmit={save} className="mb-8 rounded-2xl border border-[#d6e4df] bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-semibold text-[#173d40]">Prepare a draft</h2><p className="mt-2 text-sm text-slate-500">Review before saving. Saved draft revisions are managed in Stripe; issuing requires a separate confirmation.</p>
      <fieldset disabled={busy || locked} className="mt-6 space-y-5 disabled:opacity-70"><legend className="sr-only">Invoice details</legend><div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Customer name<input required maxLength={100} className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-sm font-medium">Customer email<input required type="email" maxLength={254} className={inputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label className="text-sm font-medium">Service<select className={inputClass} value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}><option value="private_chef">Private Chef</option><option value="catering">Catering</option></select></label>
        <label className="text-sm font-medium">Event date (optional)<input type="date" className={inputClass} value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} /></label>
        <label className="text-sm font-medium">Invoice title<input required maxLength={120} placeholder="Private dinner for six" className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label className="text-sm font-medium">Days to pay after issue<input type="number" min={1} max={90} required className={inputClass} value={form.daysUntilDue} onChange={e => setForm({ ...form, daysUntilDue: Number(e.target.value) })} /></label>
      </div><div className="rounded-xl bg-[#f3f7f5] p-4 sm:p-5"><h3 className="font-semibold text-[#173d40]">Itemized services</h3><div className="mt-4 space-y-4">{lines.map((line, index) => <div key={index} className="grid gap-3 border-b border-[#d6e4df] pb-4 sm:grid-cols-[1fr_80px_130px_auto]">
        <label className="text-xs font-medium">Description {index + 1}<input required maxLength={200} className={inputClass} value={line.description} onChange={e => setLines(lines.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} /></label>
        <label className="text-xs font-medium">Quantity<input required type="number" min={1} max={1000} step={1} className={inputClass} value={line.quantity} onChange={e => setLines(lines.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item))} /></label>
        <label className="text-xs font-medium">Unit price (USD)<input required inputMode="decimal" placeholder="0.00" className={inputClass} value={line.price} onChange={e => setLines(lines.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} /></label>
        <button type="button" aria-label={`Remove line ${index + 1}`} disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, i) => i !== index))} className="self-end rounded-lg border border-slate-300 px-3 py-3 text-xs disabled:opacity-40">Remove</button>
      </div>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-4"><button type="button" disabled={lines.length >= 8} onClick={() => setLines([...lines, { description: "", quantity: "1", price: "" }])} className="text-sm font-semibold text-[#086b70] disabled:opacity-40">+ Add line (up to 8)</button><p className="text-lg font-semibold text-[#173d40]">Total {serviceMoney(Number.isFinite(total) ? total : 0)}</p></div></div>
      <label className="block text-sm font-medium">Customer-facing service details & notes<textarea rows={4} maxLength={1500} className={inputClass} placeholder="Agreed menu, service scope, or reference to your separate agreement. Do not include private internal notes." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label></fieldset>
      <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} className={buttonClass}>{busy ? "Saving…" : locked ? "Retry same submission" : "Save draft in Stripe"}</button><button type="button" disabled={busy} className="rounded-lg border border-slate-300 px-5 py-3 text-sm" onClick={() => { if (window.confirm(locked ? "The draft may already exist in Stripe. Close this form and check the list before creating another?" : "Discard this unsaved draft?")) { setCreating(false); setLocked(false); pending.current = null; void load(); } }}>Close draft</button></div>
    </form>}
    {selected && <div ref={detailRef} className="mb-9 grid scroll-mt-8 gap-5 lg:grid-cols-[1fr_300px]"><ServiceInvoiceCard invoice={selected} /><aside className="h-fit rounded-2xl border border-[#d6e4df] bg-white p-6"><h3 className="font-semibold text-[#173d40]">Invoice actions</h3><p className="mt-3 text-sm leading-6 text-slate-500">Status and balances are read directly from Stripe. Refresh after the customer pays.</p><div className="mt-5 flex flex-col gap-3">
      <button disabled={busy} className="rounded-lg border border-slate-300 px-4 py-3 text-sm" onClick={() => review(selected.id)}>Refresh payment status</button>
      {selected.status === "draft" && <button disabled={busy || !selected.ready} className={buttonClass} onClick={() => act("finalize")}>Issue invoice & payment link</button>}
      {selected.status === "draft" && !selected.ready && <p className="text-sm text-amber-800">Incomplete draft. Retry the original submission or review it in Stripe. Do not issue it manually until all lines are verified.</p>}
      {selected.status === "open" && <><button disabled={busy} className={buttonClass} onClick={() => act("send")}>Email invoice to customer</button><button disabled={busy} className="rounded-lg border border-red-200 px-4 py-3 text-sm text-red-700" onClick={() => act("void")}>Void unpaid invoice</button></>}
      {selected.hostedUrl && <button className="rounded-lg border border-slate-300 px-4 py-3 text-sm" onClick={async () => { try { await navigator.clipboard.writeText(selected.hostedUrl!); setNotice("Payment link copied. Share it only with this customer."); } catch { setError("Could not copy. Open the Stripe invoice and copy its address."); } }}>Copy secure invoice link</button>}
      <a href={`https://dashboard.stripe.com/${selected.live ? "" : "test/"}invoices/${selected.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm">Manage in Stripe ↗</a>
    </div><p className="mt-5 text-xs leading-6 text-slate-500">Edit drafts, manage reminders, or handle refunds in Stripe. If you change a saved draft amount there, issue it there after review. Refunds are not the same as voiding an unpaid invoice.</p></aside></div>}
    <section className="rounded-2xl border border-[#d6e4df] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-[#173d40]">Invoice history</h2><p className="mt-2 text-xs leading-6 text-slate-500">Only invoices created by this service workflow. Load older records to continue through Stripe history.</p></div><button disabled={loading} onClick={() => { setError(""); void load(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">{loading ? "Loading…" : "Refresh list"}</button></div>
      {!loading && invoices.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No service invoices on this page. Create your first draft or load older records.</p>}
      <div className="mt-5 divide-y divide-slate-100">{invoices.map(invoice => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0 flex-1"><p className="break-words font-semibold text-[#173d40]">{invoice.title}</p><p className="mt-1 break-all text-sm text-slate-500">{invoice.name} · {invoice.email}</p><p className="mt-2 text-xs text-slate-500">{invoice.number || "Draft"} · {invoice.status} {!invoice.live && "· TEST"}</p></div><div className="text-right"><p className="text-sm font-semibold">{serviceMoney(invoice.total, invoice.currency)}</p><button disabled={busy} onClick={() => review(invoice.id)} className="mt-2 text-sm font-semibold text-[#086b70] hover:underline">Review invoice →</button></div></div>)}</div>
      {next && <button disabled={loading} onClick={() => load(next)} className="mt-5 rounded-lg border border-slate-300 px-4 py-3 text-sm">Load older records</button>}
    </section>
  </div></main>;
}
