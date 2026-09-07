import { serviceMoney, type ServiceInvoiceView } from "@/lib/service-invoice-content";

export function ServiceInvoiceCard({ invoice }: { invoice: ServiceInvoiceView }) {
  const overdue = invoice.overdue;
  const date = (stamp: number) => new Date(stamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return <article className="overflow-hidden rounded-2xl border border-[#d6e4df] bg-white shadow-sm">
    <header className="border-b border-[#e1eae6] px-6 py-7 sm:px-9">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#367577]">WaistLess Foods</p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${invoice.status === "paid" ? "bg-emerald-50 text-emerald-800" : overdue ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-700"}`}>{overdue ? "Overdue" : invoice.status === "draft" ? "Draft · not issued" : invoice.status}</span></div>
      {!invoice.live && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">TEST MODE — No real payment. Do not fulfill.</p>}
      <h2 className="mt-5 break-words font-serif text-3xl text-[#173d40]">{invoice.title}</h2>
      <p className="mt-2 text-sm text-slate-500">{invoice.number || "Invoice number assigned when issued"}</p>
      <div className="mt-6 grid gap-5 text-sm sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-slate-500">Prepared for</p><p className="mt-2 font-semibold text-[#173d40]">{invoice.name}</p><p className="mt-1 break-all text-slate-600">{invoice.email}</p></div><div><p className="font-medium text-[#173d40]">{invoice.service === "private_chef" ? "Private Chef" : "Catering"}</p>{invoice.eventDate && <p className="mt-1 text-slate-600">Event: {invoice.eventDate}</p>}<p className="mt-1 text-slate-600">{invoice.dueDate ? `Payment due ${date(invoice.dueDate)}` : "Payment terms begin when issued"}</p></div></div>
    </header>
    <div className="px-6 py-6 sm:px-9"><div className="divide-y divide-slate-100">{invoice.items.map((item, index) => <div key={index} className="flex justify-between gap-4 py-4 text-sm"><div className="min-w-0"><p className="break-words font-medium text-[#173d40]">{item.description}</p><p className="mt-1 text-xs text-slate-500">Quantity {item.quantity}</p></div><p className="shrink-0 font-medium">{serviceMoney(item.amount, invoice.currency)}</p></div>)}</div>
      <dl className="mt-5 space-y-3 border-t border-[#cdded7] pt-5 text-sm"><div className="flex justify-between"><dt>Invoice total</dt><dd className="font-semibold">{serviceMoney(invoice.total, invoice.currency)}</dd></div><div className="flex justify-between text-slate-500"><dt>Paid</dt><dd>{serviceMoney(invoice.paid, invoice.currency)}</dd></div><div className="flex justify-between text-lg font-semibold text-[#086b70]"><dt>Remaining</dt><dd>{serviceMoney(invoice.remaining, invoice.currency)}</dd></div></dl>
      {invoice.paidAt && <p className="mt-3 text-sm text-emerald-700">Payment recorded {date(invoice.paidAt)}</p>}
      {invoice.notes && <div className="mt-7 rounded-xl bg-[#f3f7f5] p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-[#367577]">Service details & notes</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{invoice.notes}</p></div>}
      <div className="mt-6 flex flex-wrap gap-3">{invoice.hostedUrl && <a href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#086b70] px-5 py-3 text-sm font-semibold text-white hover:bg-[#07585c]">{invoice.status === "open" ? "View & pay securely" : "View in Stripe"} ↗</a>}{invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#cdded7] px-5 py-3 text-sm font-medium text-[#173d40]">Download invoice PDF ↗</a>}</div>
    </div>
  </article>;
}
