"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAgreementConfirmation } from "@/components/agreement-controls";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ServiceAgreementDocument from "@/components/service-agreement-document";
import { SIGNATURE_CONSENT, type AgreementView } from "@/lib/service-agreement-content";
import { useUser } from "@clerk/nextjs";
import { agreementSignerName } from "@/lib/clerk-contact-profile";
import SignatureInput from "@/components/signature-input";
import type { SignatureMark } from "@/lib/service-signature-content";

export default function ServiceAgreementSigning() {
  const { confirm, confirmationDialog } = useAgreementConfirmation();
  const [agreement, setAgreement] = useState<AgreementView | null>(null);
  const token = useRef("");
  const { user } = useUser();
  const [nameInput, setName] = useState<string | null>(null);
  const name = nameInput ?? (agreement ? agreementSignerName(user, agreement.content) : "");
  const [mark, setMark] = useState<SignatureMark>({ method: "typed" });
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
    if (!(await confirm("Sign this agreement using your selected signature? Review the details before confirming."))) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/service-agreements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sign", token: token.current, documentHash: agreement.documentHash, name, consent, mark }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setAgreement(data.agreement);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to sign. Please retry."); }
    finally { setBusy(false); }
  }
  return <main className="agreement-theme agreement-page min-h-screen bg-[#f3f7f5] px-4 py-10 sm:px-8"><div className="mx-auto max-w-3xl">
    <div className="agreement-controls mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/" className="text-sm text-[#388082]">WaistLess Foods</Link>{agreement && <Button type="button" variant="outline" onClick={() => window.print()} className="h-auto rounded-lg border-primary px-4 py-2 text-primary">Print / Save PDF</Button>}</div>
    {error && <p role="alert" className="agreement-controls mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!agreement && !error && <p role="status">Loading your agreement…</p>}
    {agreement && <><ServiceAgreementDocument agreement={agreement} />
      <div className="agreement-controls mt-6 rounded-xl bg-white p-6">
        {agreement.status === "signed" ? <p role="status" className="font-medium text-[#173d40]">Thank you. Your signed agreement has been saved. Chef Amber will send your invoice separately. Signing does not charge your card.</p> : <form onSubmit={sign} className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">Review the complete agreement above. Contact <a className="underline" href="mailto:info@waistlessfoods.com">Chef Amber</a> if any detail needs changing before you sign.</p>
          <Label className="block leading-normal text-sm font-medium">Your full name<Input required disabled={busy} minLength={2} maxLength={100} autoComplete="name" value={name} onChange={event => { setName(event.target.value); setConsent(false); }} className="mt-2 h-12 w-full rounded-lg px-3 py-3" /></Label>
          <p className="text-xs leading-5 text-slate-500">Prefilled from your matching verified account or the booking. Review your name before signing; it identifies you for every signature style.</p>
          <SignatureInput value={mark} onChange={value => { setMark(value); setConsent(false); }} name={name} disabled={busy} />
          <Label className="flex items-start gap-3 text-sm leading-6"><Checkbox required disabled={busy} checked={consent} onCheckedChange={checked => { setName(name); setConsent(checked === true); }} className="mt-1.5" /><span>{SIGNATURE_CONSENT}</span></Label>
          <Button type="submit" disabled={busy || !consent || name.trim().length < 2 || (mark.method !== "typed" && !mark.imageData)} className="h-auto min-h-11 rounded-lg px-5 py-3">{busy ? "Saving signature…" : "Sign agreement"}</Button>
        </form>}
      </div>
    </>}
  </div>{confirmationDialog}</main>;
}
