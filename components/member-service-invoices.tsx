"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ServiceInvoiceCard } from "@/components/service-invoice-card";
import type { ServiceInvoiceView } from "@/lib/service-invoice-content";

export default function MemberServiceInvoices() {
  const [invoices, setInvoices] = useState<ServiceInvoiceView[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (after?: string) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/account/service-invoices${after ? `?after=${after}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load invoices.");
      setInvoices(previous => after ? [...previous, ...data.invoices] : data.invoices); setNext(data.next);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load invoices."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const response = await fetch("/api/account/service-invoices", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load invoices.");
        if (active) { setInvoices(data.invoices); setNext(data.next); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not load invoices."); }
      finally { if (active) setLoading(false); }
    }
    void initialLoad();
    return () => { active = false; };
  }, []);
  return <main className="min-h-screen bg-[#f3f7f5] px-4 py-12 sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/account" className="text-sm text-[#367577]">← My account</Link><header className="mb-8 mt-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#367577]">Your table, thoughtfully prepared</p><h1 className="mt-3 font-serif text-4xl text-[#173d40]">Your service invoices</h1><p className="mt-4 text-sm leading-7 text-slate-600">View private-chef and catering invoices, pay securely through Stripe, and download a copy. Invoices appear when their billing email matches your verified primary account email.</p><button disabled={loading} onClick={() => load()} className="mt-5 rounded-lg border border-[#cdded7] bg-white px-4 py-3 text-sm text-[#173d40]">{loading ? "Checking Stripe…" : "Refresh payment status"}</button></header>
    {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-5 text-sm text-red-800">{error}</p>}
    {!loading && !error && invoices.length === 0 && <div className="rounded-2xl border border-[#d6e4df] bg-white p-9 text-center"><h2 className="text-xl font-semibold text-[#173d40]">No issued invoices on this page</h2><p className="mt-4 text-sm leading-7 text-slate-500">Amber will issue an invoice after you agree on your service details. If you expected one, check your account email or contact Amber. You can also use the secure link in your invoice email.</p></div>}
    <div className="space-y-7">{invoices.map(invoice => <ServiceInvoiceCard key={invoice.id} invoice={invoice} />)}</div>
    {next && <button disabled={loading} onClick={() => load(next)} className="mt-7 rounded-lg border border-[#cdded7] bg-white px-5 py-3 text-sm">Load older invoices</button>}
    <p className="mt-8 text-xs leading-6 text-slate-500">Payment status is supplied by Stripe. If you have just paid, refresh this page. Questions about your event, refunds, or service changes? Contact Amber directly.</p>
  </div></main>;
}
