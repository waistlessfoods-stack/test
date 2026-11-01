"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ServiceAgreementDocument from "@/components/service-agreement-document";
import type { AgreementContent, AgreementView } from "@/lib/service-agreement-content";

const fieldClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900";
const buttonClass = "rounded-lg bg-[#086b70] px-4 py-3 text-sm font-medium text-white disabled:opacity-50";
async function api(path: string, body?: unknown, method = "POST") {
  const response = await fetch(path, body === undefined ? { cache: "no-store" } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load agreements."); return data;
}

export default function AdminServiceAgreements({ initialBookingId = "", initialAgreementId = "" }: { initialBookingId?: string; initialAgreementId?: string }) {
  const [items, setItems] = useState<AgreementView[]>([]);
  const [selected, setSelected] = useState<AgreementView | null>(null);
  const [form, setForm] = useState<AgreementContent | null>(null);
  const [amount, setAmount] = useState("");
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [reviewed, setReviewed] = useState(false);
  const [signingUrl, setSigningUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = Boolean(selected && form && (JSON.stringify(selected.content) !== JSON.stringify(form) || (selected.content.amount ? String(selected.content.amount / 100) : "") !== amount));
  function select(agreement: AgreementView) {
    setSelected(agreement); setForm(agreement.content); setAmount(agreement.content.amount ? String(agreement.content.amount / 100) : ""); setReviewed(false); setSigningUrl("");
  }
  useEffect(() => {
    let active = true;
    void api("/api/admin/service-agreements").then(async data => {
      if (!active) return; setItems(data.agreements);
      if (initialAgreementId) { const detail = await api(`/api/admin/service-agreements/${encodeURIComponent(initialAgreementId)}`); if (active) select(detail.agreement); }
    }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [initialAgreementId]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(key: keyof AgreementContent, value: string | number) { setForm(previous => previous ? { ...previous, [key]: value } : null); setReviewed(false); }
  async function run(work: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await work(); const data = await api("/api/admin/service-agreements"); setItems(data.agreements); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to save agreement."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!selected || !form) return;
    await run(async () => {
      if (amount && !/^\d+(\.\d{1,2})?$/.test(amount)) throw new Error("Enter an agreed amount with no more than two decimal places.");
      const data = await api(`/api/admin/service-agreements/${selected.id}`, { content: { ...form, amount: amount ? Math.round(Number(amount) * 100) : 0 }, version: selected.version }, "PATCH");
      select(data.agreement); setNotice("Draft saved. Nothing was sent or charged.");
    });
  }
  async function act(action: "issue" | "renew_link" | "void" | "email") {
    if (!selected || dirty) return;
    const confirmation = action === "issue" ? "Freeze this reviewed agreement and create a private signing link? Nothing will be emailed yet." : action === "renew_link" ? "Replace the signing link? The previous link will stop working. The frozen agreement text stays the same." : action === "email" ? `Send a real signing email to ${selected.content.email}?` : "Void this unsigned agreement? Its signing link will stop working.";
    if (!window.confirm(confirmation)) return;
    await run(async () => {
      const token = signingUrl.split("#")[1];
      const data = await api(`/api/admin/service-agreements/${selected.id}`, { action, version: selected.version, reviewed, token });
      if (data.agreement) select(data.agreement);
      if (data.signingUrl) setSigningUrl(data.signingUrl);
      setNotice(data.message || (action === "void" ? "Agreement voided." : "Signing link created. Keep it private. No email was sent."));
    });
  }
  return <main className="agreement-page min-h-screen bg-[#f3f7f5] px-4 py-9 sm:px-8"><div className="mx-auto max-w-7xl">
    <div className="agreement-controls"><Link href="/admin" className="text-sm text-[#367577]">← Admin portal</Link><h1 className="mt-6 font-serif text-4xl text-[#173d40]">Service agreements</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Prepare an agreement from a Private Chef or Catering request. Add the approved text from your contract PDF and review all event details before creating a signing link. Issued text cannot be edited; void an unsigned copy and create a new draft if details change.</p>
      {error && <p role="alert" className="my-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="my-5 rounded-lg bg-teal-50 p-4 text-sm text-teal-900">{notice}</p>}
      <form onSubmit={event => { event.preventDefault(); if (dirty && !window.confirm("Leave unsaved changes?")) return; void run(async () => { const data = await api("/api/admin/service-agreements", { bookingId: Number(bookingId) }); select(data.agreement); }); }} className="my-7 flex flex-wrap items-end gap-3 rounded-xl border border-[#d6e4df] bg-white p-5">
        <label className="text-sm font-medium">Booking request ID<input type="number" min={1} step={1} required className={fieldClass} value={bookingId} onChange={event => setBookingId(event.target.value)} /></label><button className={buttonClass} disabled={busy}>Create draft from request</button><Link href="/admin/bookings" className="py-3 text-sm text-[#086b70] underline">Find a request</Link>
      </form>
    </div>
    {selected && form && <div className="grid items-start gap-7 lg:grid-cols-2">
      <section className="agreement-controls rounded-xl border border-[#d6e4df] bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold text-[#173d40]">{selected.status === "draft" ? "Edit draft" : "Frozen agreement"}</h2>
        <p className="mt-2 text-sm text-slate-500">Request #{selected.bookingId} · {selected.status} · {dirty ? "Unsaved changes" : "Saved"}</p>
        <fieldset disabled={busy || selected.status !== "draft"} className="mt-5 grid gap-4 disabled:opacity-70">
          {([['name','Customer name'],['email','Customer email'],['phone','Phone'],['title','Agreement title'],['location','Event location'],['source','Approved contract source / filename']] as const).map(([key, label]) => <label key={key} className="text-sm font-medium">{label}<input className={fieldClass} value={form[key]} onChange={event => change(key, event.target.value)} /></label>)}
          <label className="text-sm font-medium">Service<select className={fieldClass} value={form.service} onChange={event => change("service", event.target.value)}><option value="private_chef">Private Chef</option><option value="catering">Catering</option></select></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Event date<input type="date" className={fieldClass} value={form.eventDate} onChange={event => change("eventDate", event.target.value)} /></label><label className="text-sm font-medium">End date (optional)<input type="date" className={fieldClass} value={form.endDate} onChange={event => change("endDate", event.target.value)} /></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Guests<input type="number" min={1} max={10000} className={fieldClass} value={form.guests} onChange={event => change("guests", Number(event.target.value))} /></label><label className="text-sm font-medium">Agreed total (USD)<input inputMode="decimal" className={fieldClass} value={amount} onChange={event => { setAmount(event.target.value); setReviewed(false); }} placeholder="0.00" /></label></div>
          <label className="text-sm font-medium">Event details<textarea rows={6} className={fieldClass} value={form.details} onChange={event => change("details", event.target.value)} /></label>
          <label className="text-sm font-medium">Approved agreement terms<textarea rows={16} maxLength={40000} className={fieldClass} value={form.terms} placeholder="Paste the approved text from Amber's contract. No default contract terms are supplied." onChange={event => change("terms", event.target.value)} /></label>
        </fieldset>
        <div className="mt-6 space-y-4">{selected.status === "draft" && <><button type="button" className={buttonClass} disabled={busy || !dirty} onClick={save}>Save draft</button><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={reviewed} disabled={dirty || busy} onChange={event => setReviewed(event.target.checked)} className="mt-1.5" /><span>I have reviewed the saved preview against the approved contract and confirmed the customer, dates, event details, and amount.</span></label><button type="button" className={buttonClass} disabled={dirty || busy || !reviewed || !form.terms || !form.source} onClick={() => act("issue")}>Create signing link</button></>}
          <button type="button" disabled={busy} className="block text-sm text-[#086b70] underline" onClick={() => { if (dirty && !window.confirm("Discard unsaved changes and reload the saved agreement?")) return; void run(async () => { const data = await api(`/api/admin/service-agreements/${selected.id}`); select(data.agreement); }); }}>Refresh saved agreement</button>
          {selected.status === "issued" && <><button type="button" className={buttonClass} disabled={busy} onClick={() => act("renew_link")}>Generate replacement link</button>{signingUrl && <div className="rounded-lg bg-[#f3f7f5] p-4"><label className="text-sm font-medium">Private signing link<input readOnly value={signingUrl} className={fieldClass} onFocus={event => event.target.select()} /></label><p className="my-3 text-xs leading-5 text-slate-600">Copy this link now. Only its fingerprint is stored, so it cannot be recovered after refreshing this page. You can replace an unsigned link above.</p><button type="button" className={buttonClass} disabled={busy} onClick={() => act("email")}>Email signing link to customer</button></div>}</>}
          {selected.status === "signed" && <Link href={`/admin/service-invoices?agreement=${selected.id}`} className={`${buttonClass} inline-block`}>Prepare invoice from signed agreement</Link>}
          {(selected.status === "draft" || selected.status === "issued") && <button type="button" className="ml-3 text-sm text-red-700 underline" disabled={busy || dirty} onClick={() => act("void")}>Void unsigned agreement</button>}
          <button type="button" onClick={() => window.print()} className="block text-sm text-[#086b70] underline">Print / Save PDF {dirty && "(saved version)"}</button>
        </div>
      </section>
      <section><p className="agreement-controls mb-3 text-sm font-semibold text-[#367577]">Saved customer preview</p><ServiceAgreementDocument agreement={selected} /></section>
    </div>}
    <section className="agreement-controls mt-8 rounded-xl border border-[#d6e4df] bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold text-[#173d40]">Recent agreements</h2><p className="mt-2 text-xs text-slate-500">Up to 200 most recent agreements. Reload an open agreement to see new signatures.</p><div className="mt-4 divide-y divide-slate-100">{items.map(item => <button key={item.id} disabled={busy} type="button" onClick={() => { if (dirty && !window.confirm("Leave unsaved changes?")) return; select(item); setNotice(""); setError(""); }} className="flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left text-sm"><span className="min-w-0 break-words"><strong className="text-[#173d40]">{item.content.title}</strong><span className="mt-1 block text-slate-500">{item.content.name} · Request #{item.bookingId}</span></span><span className="font-medium text-[#086b70]">{item.status} →</span></button>)}{items.length === 0 && <p className="py-4 text-sm text-slate-500">No agreements yet. Start from a booking request above.</p>}</div></section>
  </div></main>;
}
