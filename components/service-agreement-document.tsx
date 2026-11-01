import type { AgreementView } from "@/lib/service-agreement-content";
import { serviceMoney } from "@/lib/service-invoice-content";

export default function ServiceAgreementDocument({ agreement }: { agreement: AgreementView }) {
  const content = agreement.content;
  return <article className="agreement-document rounded-2xl border border-[#d6e4df] bg-white p-6 text-[#173d40] shadow-sm sm:p-10">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#367577]">WaistLess Foods · {agreement.status}</p>
    <h1 className="mt-4 break-words font-serif text-3xl">{content.title}</h1>
    <dl className="my-7 grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="font-semibold">Prepared for</dt><dd className="mt-1 break-words">{content.name}<br />{content.email}{content.phone && <><br />{content.phone}</>}</dd></div>
      <div><dt className="font-semibold">Service</dt><dd className="mt-1">{content.service === "private_chef" ? "Private Chef" : "Catering"}</dd></div>
      <div><dt className="font-semibold">Event date</dt><dd className="mt-1">{content.eventDate || "To be confirmed"}{content.endDate && ` through ${content.endDate}`}</dd></div>
      <div><dt className="font-semibold">Guests</dt><dd className="mt-1">{content.guests}</dd></div>
      <div><dt className="font-semibold">Agreed total</dt><dd className="mt-1">{content.amount ? serviceMoney(content.amount) : "Not set"}</dd></div>
      {content.location && <div><dt className="font-semibold">Location</dt><dd className="mt-1 whitespace-pre-wrap break-words">{content.location}</dd></div>}
    </dl>
    {content.details && <section className="border-t border-[#d6e4df] pt-6"><h2 className="font-semibold">Event details</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{content.details}</p></section>}
    <section className="mt-7 border-t border-[#d6e4df] pt-6"><h2 className="font-semibold">Agreement terms</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{content.terms || "Draft: approved agreement text has not been added."}</p></section>
    {agreement.signature && <section className="agreement-signature mt-8 border-t-2 border-[#367577] pt-6">
      <h2 className="font-semibold">Electronic signature</h2><p className="mt-3 font-serif text-2xl italic">{agreement.signature.name}</p>
      <p className="mt-2 text-sm">Signed {new Date(agreement.signature.signedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</p>
      <p className="mt-3 text-sm leading-6">{agreement.signature.consent}</p>
    </section>}
    <footer className="mt-8 border-t border-[#d6e4df] pt-4 text-xs leading-5 text-slate-500"><p>Agreement reference: {agreement.id}</p>{agreement.documentHash && <p className="break-all">Document SHA-256: {agreement.documentHash}</p>}</footer>
  </article>;
}
