"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAgreementConfirmation, AgreementSelect } from "@/components/agreement-controls";
import { Textarea } from "@/components/ui/textarea";

import { useEffect, useState } from "react";
import Link from "next/link";
import ServiceAgreementDocument from "@/components/service-agreement-document";
import type { AgreementContent, AgreementView } from "@/lib/service-agreement-content";
import { AMBER_CONTRACT_SOURCE, AMBER_CONTRACT_TERMS, CHEF_SIGNATURE_CONSENT, CONTRACT_FIELDS, INTAKE_FIELDS, emptyAmberContract, emptyIntake, unresolvedAgreementFields, type ContractField, type IntakeField } from "@/lib/service-agreement-template";
import { useUser } from "@clerk/nextjs";
import { clerkContactProfile } from "@/lib/clerk-contact-profile";
import SignatureInput from "@/components/signature-input";
import type { SignatureMark } from "@/lib/service-signature-content";

const fieldClass = "mt-2 min-h-11 w-full rounded-lg border-input bg-background px-3 py-2.5 text-sm text-foreground";
const buttonClass = "h-auto min-h-11 rounded-lg px-4 py-3";
async function api(path: string, body?: unknown, method = "POST") {
  const response = await fetch(path, body === undefined ? { cache: "no-store" } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load agreements."); return data;
}

export default function AdminServiceAgreements({ initialBookingId = "", initialAgreementId = "" }: { initialBookingId?: string; initialAgreementId?: string }) {
  const { confirm, confirmationDialog } = useAgreementConfirmation();
  const [items, setItems] = useState<AgreementView[]>([]);
  const [selected, setSelected] = useState<AgreementView | null>(null);
  const [form, setForm] = useState<AgreementContent | null>(null);
  const [amount, setAmount] = useState("");
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [reviewed, setReviewed] = useState(false);
  const { user } = useUser();
  const [chefNameInput, setChefName] = useState<string | null>(null);
  const chefName = chefNameInput ?? clerkContactProfile(user)?.name ?? "";
  const [chefMark, setChefMark] = useState<SignatureMark>({ method: "typed" });
  const [chefConsent, setChefConsent] = useState(false);
  const [signingUrl, setSigningUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = Boolean(selected && form && (JSON.stringify(selected.content) !== JSON.stringify(form) || (selected.content.amount ? String(selected.content.amount / 100) : "") !== amount));
  function select(agreement: AgreementView) {
    setSelected(agreement); setForm(agreement.content); setAmount(agreement.content.amount ? String(agreement.content.amount / 100) : ""); setReviewed(false); setChefName(null); setChefMark({ method: "typed" }); setChefConsent(false); setSigningUrl("");
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
  function changeIntake(key: IntakeField, value: string) {
    setForm(previous => previous ? { ...previous, intake: { ...emptyIntake(), ...previous.intake, [key]: value } } : null); setReviewed(false);
  }
  function changeContract(key: ContractField, value: string) {
    setForm(previous => previous?.contract ? { ...previous, contract: { ...previous.contract, values: { ...previous.contract.values, [key]: value } } } : previous); setReviewed(false);
  }
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
    const confirmation = action === "issue" ? `Sign this agreement as ${chefName}, freeze the reviewed copy, and create a customer signing link? Nothing will be emailed yet.` : action === "renew_link" ? "Replace the signing link? The previous link will stop working. The frozen agreement text stays the same." : action === "email" ? `Send a real signing email to ${selected.content.email}?` : "Void this unsigned agreement? Its signing link will stop working.";
    if (!(await confirm(confirmation))) return;
    await run(async () => {
      const token = signingUrl.split("#")[1];
      const data = await api(`/api/admin/service-agreements/${selected.id}`, { action, version: selected.version, reviewed, token, chefName, chefConsent, chefMark });
      if (data.agreement) select(data.agreement);
      if (data.signingUrl) setSigningUrl(data.signingUrl);
      setNotice(data.message || (action === "void" ? "Agreement voided." : "Signing link created. Keep it private. No email was sent."));
    });
  }
  return <main className="agreement-theme agreement-page min-h-screen bg-[#f3f7f5] px-4 py-9 sm:px-8"><div className="mx-auto max-w-7xl">
    <div className="agreement-controls"><Link href="/admin" className="text-sm text-[#388082]">← Admin portal</Link><h1 className="mt-6 font-serif text-4xl text-[#173d40]">Service agreements</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Prepare an agreement from a Private Chef or Catering request using Amber&apos;s original Personal Chef contract. Complete the intake and contract settings, review the saved preview, and sign as the Chef before creating the customer&apos;s signing link. Issued text cannot be edited.</p>
      <a href="/api/admin/service-agreements/source" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-[#00676E] underline">View Amber&apos;s original contract PDF</a>
      {error && <p role="alert" className="my-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="my-5 rounded-lg bg-teal-50 p-4 text-sm text-teal-900">{notice}</p>}
      <form onSubmit={async event => { event.preventDefault(); if (dirty && !(await confirm("Leave unsaved changes?"))) return; void run(async () => { const data = await api("/api/admin/service-agreements", { bookingId: Number(bookingId) }); select(data.agreement); }); }} className="my-7 flex flex-wrap items-end gap-3 rounded-xl border border-[#d6e4df] bg-white p-5">
        <Label className="block text-sm font-medium leading-normal">Booking request ID<Input type="number" min={1} step={1} required className={fieldClass} value={bookingId} onChange={event => setBookingId(event.target.value)} /></Label><Button className={buttonClass} disabled={busy}>Create draft from request</Button><Link href="/admin/bookings" className="py-3 text-sm text-[#00676E] underline">Find a request</Link>
      </form>
    </div>
    {selected && form && <div className="grid items-start gap-7 lg:grid-cols-2">
      <section className="agreement-controls rounded-xl border border-[#d6e4df] bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold text-[#173d40]">{selected.status === "draft" ? "Edit draft" : "Frozen agreement"}</h2>
        <p className="mt-2 text-sm text-slate-500">Request #{selected.bookingId} · {selected.status} · {dirty ? "Unsaved changes" : "Saved"}</p>
        <fieldset disabled={busy || selected.status !== "draft"} className="mt-5 grid gap-4 disabled:opacity-70">
          {([['name','Customer name'],['email','Customer email'],['phone','Phone'],['title','Agreement title'],['location','Event location'],['source','Approved contract source / filename']] as const).map(([key, label]) => <Label key={key} className="block text-sm font-medium leading-normal">{label}<Input className={fieldClass} value={form[key]} onChange={event => change(key, event.target.value)} /></Label>)}
          <Label className="block text-sm font-medium leading-normal">Service<AgreementSelect label="Service" className={fieldClass} value={form.service} disabled={busy || selected.status !== "draft"} onValueChange={value => change("service", value)} options={[{ value: "private_chef", label: "Private Chef" }, { value: "catering", label: "Catering" }]} /></Label>
          <div className="grid gap-4 sm:grid-cols-2"><Label className="block text-sm font-medium leading-normal">Event date<Input type="date" className={fieldClass} value={form.eventDate} onChange={event => change("eventDate", event.target.value)} /></Label><Label className="block text-sm font-medium leading-normal">End date (optional)<Input type="date" className={fieldClass} value={form.endDate} onChange={event => change("endDate", event.target.value)} /></Label></div>
          <div className="grid gap-4 sm:grid-cols-2"><Label className="block text-sm font-medium leading-normal">Guests<Input type="number" min={1} max={10000} className={fieldClass} value={form.guests} onChange={event => change("guests", Number(event.target.value))} /></Label><Label className="block text-sm font-medium leading-normal">Agreed total (USD)<Input inputMode="decimal" className={fieldClass} value={amount} onChange={event => { setAmount(event.target.value); setReviewed(false); }} placeholder="0.00" /></Label></div>
          <Label className="block text-sm font-medium leading-normal">Event details<Textarea rows={6} className={`${fieldClass} field-sizing-fixed`} value={form.details} onChange={event => change("details", event.target.value)} /></Label>
          <h3 className="mt-4 font-semibold">Client and event intake</h3>
          <p className="text-sm leading-6 text-slate-600">Record confirmed information. Enter “None” for dietary restrictions or allergies only after checking with the customer. The mailing-list preference is recorded here; use the separate newsletter signup to subscribe.</p>
          {INTAKE_FIELDS.map(([key, label]) => <Label key={key} className="block text-sm font-medium leading-normal">{label}
            {key === "contactMethod" || key === "mailingList" ? <AgreementSelect label={label} className={fieldClass} value={form.intake?.[key] || ""} disabled={busy || selected.status !== "draft"} onValueChange={value => changeIntake(key, value)} options={(key === "contactMethod" ? ["Email", "Text", "Phone"] : ["Not asked", "No", "Yes"]).map(value => ({ value, label: value }))} /> : <Input type={key === "dateOfBirth" ? "date" : "text"} maxLength={1000} className={fieldClass} value={form.intake?.[key] || ""} placeholder={key === "timeZone" ? "e.g. America/Chicago" : undefined} onChange={event => changeIntake(key, event.target.value)} />}
          </Label>)}
          {form.contract ? <><h3 className="mt-4 font-semibold">Contract settings</h3>
            <p className="text-sm leading-6 text-slate-600">All settings need a value before signing. Confirm these policies with Amber. The source lists 409-543-7266; the website previously used 281-436-9245. Enter the confirmed business phone below.</p>
            {CONTRACT_FIELDS.map(([key, kind]) => <Label key={key} className="block text-sm font-medium leading-normal">{key}{kind === "money" ? " (USD)" : kind === "percent" ? " (%)" : ""}<Input type={kind === "date" ? "date" : "text"} inputMode={["money", "percent", "number", "days"].includes(kind) ? "decimal" : undefined} maxLength={250} className={fieldClass} value={form.contract!.values[key]} onChange={event => changeContract(key, event.target.value)} /></Label>)}
            {form.service === "catering" && <Label className="flex items-start gap-3 text-sm leading-6"><Checkbox className="mt-1.5" checked={form.contract.serviceApproved} onCheckedChange={value => { const checked = value === true; setForm(previous => previous?.contract ? { ...previous, contract: { ...previous.contract, serviceApproved: checked } } : previous); setReviewed(false); }} /><span>Amber has confirmed this Personal Chef contract applies to this Catering event.</span></Label>}
          </> : selected.status === "draft" && <Button type="button" className={buttonClass} onClick={async () => {
            if (form.terms && !(await confirm("Replace this draft's terms with Amber's original Personal Chef contract? Existing event details will be kept."))) return;
            setForm(previous => previous ? { ...previous, contract: emptyAmberContract(), intake: { ...emptyIntake(), ...previous.intake }, source: AMBER_CONTRACT_SOURCE, terms: AMBER_CONTRACT_TERMS } : null); setReviewed(false);
          }}>Load Amber&apos;s original contract</Button>}
          <Label className="block text-sm font-medium leading-normal">Approved agreement terms<Textarea aria-label="Approved agreement terms" rows={16} maxLength={40000} className={`${fieldClass} field-sizing-fixed`} value={form.terms} onChange={event => change("terms", event.target.value)} /></Label>
          {form.contract && <p className="text-sm leading-6 text-slate-600">Bracketed fields are filled from the customer, event, and contract settings in the saved preview. All 25 source sections are included. Review any wording changes with Amber.</p>}
        </fieldset>
        <div className="mt-6 space-y-4">{selected.status === "draft" && <><Button type="button" className={buttonClass} disabled={busy || !dirty} onClick={save}>Save draft</Button>
          {unresolvedAgreementFields(selected.content).length > 0 && <p className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">Still needed in the saved agreement: {unresolvedAgreementFields(selected.content).join(", ")}.</p>}
          <Label className="flex items-start gap-3 text-sm leading-6"><Checkbox checked={reviewed} disabled={dirty || busy} onCheckedChange={checked => setReviewed(checked === true)} className="mt-1.5" /><span>I have reviewed the saved preview against the approved contract and confirmed the customer, dates, event details, and amount.</span></Label>
          <Label className="block leading-normal text-sm font-medium">Chef signer&apos;s full name<Input className={fieldClass} maxLength={100} value={chefName} disabled={busy || dirty} onChange={event => { setChefName(event.target.value); setChefConsent(false); }} /></Label>
          <SignatureInput value={chefMark} onChange={value => { setChefMark(value); setChefConsent(false); }} name={chefName} disabled={busy || dirty} />
          <Label className="flex items-start gap-3 text-sm leading-6"><Checkbox className="mt-1.5" checked={chefConsent} disabled={busy || dirty} onCheckedChange={checked => { setChefName(chefName); setChefConsent(checked === true); }} /><span>{CHEF_SIGNATURE_CONSENT}</span></Label>
          <Button type="button" className={buttonClass} disabled={dirty || busy || !reviewed || !form.terms || !form.source || !chefConsent || chefName.trim().length < 2 || (chefMark.method !== "typed" && !chefMark.imageData) || unresolvedAgreementFields(selected.content).length > 0} onClick={() => act("issue")}>Create signing link</Button></>}
          <Button type="button" variant="link" disabled={busy} className="h-auto p-0 text-sm" onClick={async () => { if (dirty && !(await confirm("Discard unsaved changes and reload the saved agreement?"))) return; void run(async () => { const data = await api(`/api/admin/service-agreements/${selected.id}`); select(data.agreement); }); }}>Refresh saved agreement</Button>
          {selected.status === "issued" && <><Button type="button" className={buttonClass} disabled={busy} onClick={() => act("renew_link")}>Generate replacement link</Button>{signingUrl && <div className="rounded-lg bg-[#f3f7f5] p-4"><Label className="block text-sm font-medium leading-normal">Private signing link<Input readOnly value={signingUrl} className={fieldClass} onFocus={event => event.target.select()} /></Label><p className="my-3 text-xs leading-5 text-slate-600">Copy this link now. Only its fingerprint is stored, so it cannot be recovered after refreshing this page. You can replace an unsigned link above.</p><Button type="button" className={buttonClass} disabled={busy} onClick={() => act("email")}>Email signing link to customer</Button></div>}</>}
          {selected.status === "signed" && <Button asChild className={buttonClass}><Link href={`/admin/service-invoices?agreement=${selected.id}`}>Prepare invoice from signed agreement</Link></Button>}
          {(selected.status === "draft" || selected.status === "issued") && <Button type="button" variant="ghost" className="ml-3 text-sm text-destructive" disabled={busy || dirty} onClick={() => act("void")}>Void unsigned agreement</Button>}
          <Button type="button" variant="link" onClick={() => window.print()} className="h-auto p-0 text-sm">Print / Save PDF {dirty && "(saved version)"}</Button>
        </div>
      </section>
      <section><p className="agreement-controls mb-3 text-sm font-semibold text-[#388082]">Saved customer preview</p><ServiceAgreementDocument agreement={selected} /></section>
    </div>}
    <section className="agreement-controls mt-8 rounded-xl border border-[#d6e4df] bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold text-[#173d40]">Recent agreements</h2><p className="mt-2 text-xs text-slate-500">Up to 200 most recent agreements. Reload an open agreement to see new signatures.</p><div className="mt-4 divide-y divide-slate-100">{items.map(item => <Button key={item.id} variant="ghost" disabled={busy} type="button" onClick={async () => { if (dirty && !(await confirm("Leave unsaved changes?"))) return; select(item); setNotice(""); setError(""); }} className="flex h-auto w-full flex-wrap items-center justify-between gap-3 whitespace-normal py-4 text-left text-sm"><span className="min-w-0 break-words"><strong className="text-[#173d40]">{item.content.title}</strong><span className="mt-1 block text-slate-500">{item.content.name} · Request #{item.bookingId}</span></span><span className="font-medium text-[#00676E]">{item.status} →</span></Button>)}{items.length === 0 && <p className="py-4 text-sm text-slate-500">No agreements yet. Start from a booking request above.</p>}</div></section>
  </div>{confirmationDialog}</main>;
}
