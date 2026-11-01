"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ServiceAgreementDocument from "@/components/service-agreement-document";
import type { AgreementView } from "@/lib/service-agreement-content";

export default function MemberServiceAgreements() {
  const [items, setItems] = useState<AgreementView[]>([]);
  const [selected, setSelected] = useState<AgreementView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/account/service-agreements", { signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setItems(data.agreements); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <main className="agreement-page min-h-screen bg-[#f3f7f5] px-4 py-10 sm:px-8"><div className="mx-auto max-w-3xl"><div className="agreement-controls"><Link href="/account" className="text-sm text-[#367577]">← Your account</Link><h1 className="mt-6 font-serif text-4xl text-[#173d40]">Your agreements</h1><p className="my-4 text-sm leading-6 text-slate-600">Agreements addressed to your verified primary email. Use your private signing email to sign an unsigned agreement.</p>
    {error && <p role="alert" className="my-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}{loading && <p role="status">Loading agreements…</p>}
    {items.map(item => <button type="button" key={item.id} className="mb-3 flex w-full items-center justify-between gap-3 rounded-xl border border-[#d6e4df] bg-white p-5 text-left text-sm" onClick={() => setSelected(item)}><span className="break-words font-semibold">{item.content.title} · {item.content.eventDate}</span><span>{item.status} →</span></button>)}
    {!loading && !error && items.length === 0 && <p className="my-6 text-sm text-slate-600">No agreements are linked to this email yet. If Chef Amber used a different address, contact her for help.</p>}
    {selected && <button type="button" className="my-4 rounded-lg border border-[#367577] px-4 py-2 text-sm text-[#086b70]" onClick={() => window.print()}>Print / Save PDF</button>}
  </div>{selected && <ServiceAgreementDocument agreement={selected} />}</div></main>;
}
