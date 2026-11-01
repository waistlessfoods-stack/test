"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ServiceAgreementDocument from "@/components/service-agreement-document";
import { SIGNATURE_CONSENT, type AgreementView } from "@/lib/service-agreement-content";

export default function ServiceAgreementSigning() {
  const [agreement, setAgreement] = useState<AgreementView | null>(null);
  const token = useRef("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const value = window.location.hash.slice(1);
    const controller = new AbortController();
    token.current = value;
    void fetch("/api/service-agreements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "review", token: value }), signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setAgreement(data.agreement); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, []);
  async function sign(event: React.FormEvent) {
    event.preventDefault(); if (!agreement || busy) return;
    if (!window.confirm("Sign this agreement with your typed name? Review the details before confirming.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/service-agreements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sign", token: token.current, documentHash: agreement.documentHash, name, consent }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setAgreement(data.agreement);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to sign. Please retry."); }
    finally { setBusy(false); }
  }
  return <main className="agreement-page min-h-screen bg-[#f3f7f5] px-4 py-10 sm:px-8"><div className="mx-auto max-w-3xl">
    <div className="agreement-controls mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/" className="text-sm text-[#367577]">WaistLess Foods</Link>{agreement && <button type="button" onClick={() => window.print()} className="rounded-lg border border-[#367577] bg-white px-4 py-2 text-sm text-[#086b70]">Print / Save PDF</button>}</div>
    {error && <p role="alert" className="agreement-controls mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!agreement && !error && <p role="status">Loading your agreement…</p>}
    {agreement && <><ServiceAgreementDocument agreement={agreement} />
      <div className="agreement-controls mt-6 rounded-xl bg-white p-6">
        {agreement.status === "signed" ? <p role="status" className="font-medium text-[#173d40]">Thank you. Your signed agreement has been saved. Chef Amber will send your invoice separately. Signing does not charge your card.</p> : <form onSubmit={sign} className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">Review the complete agreement above. Contact <a className="underline" href="mailto:info@waistlessfoods.com">Chef Amber</a> if any detail needs changing before you sign.</p>
          <label className="block text-sm font-medium">Your full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" /></label>
          <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1.5" /><span>{SIGNATURE_CONSENT}</span></label>
          <button disabled={busy || !consent || name.trim().length < 2} className="rounded-lg bg-[#086b70] px-5 py-3 font-medium text-white disabled:opacity-50">{busy ? "Saving signature…" : "Sign agreement"}</button>
        </form>}
      </div>
    </>}
  </div></main>;
}
