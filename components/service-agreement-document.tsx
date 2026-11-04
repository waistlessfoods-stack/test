import type { AgreementView } from "@/lib/service-agreement-content";
import { serviceMoney } from "@/lib/service-invoice-content";
import { INTAKE_FIELDS, resolvedAgreementTerms } from "@/lib/service-agreement-template";
import SignatureDisplay from "@/components/signature-display";

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
    {content.contract && <p className="mt-4 text-sm">Chef: {content.contract.values["Chef business name"] || "To be confirmed"} · info@waistlessfoods.com · {content.contract.values["Business phone"] || "Phone to be confirmed"}</p>}
    {content.intake && <section className="mt-7 border-t border-[#d6e4df] pt-6"><h2 className="font-semibold">Client and event intake</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">{INTAKE_FIELDS.filter(([key]) => content.intake?.[key]).map(([key, label]) => <div key={key}><dt className="font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{content.intake![key]}</dd></div>)}</dl></section>}
    <section className="mt-7 border-t border-[#d6e4df] pt-6"><h2 className="font-semibold">Agreement terms</h2>{resolvedAgreementTerms(content).split(/\n\n+/).map((paragraph, index) => /^\d+\. [A-Z]/.test(paragraph) ? <h3 key={index} className="mt-5 text-sm font-semibold">{paragraph}</h3> : <p key={index} className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{paragraph}</p>)}{!content.terms && <p className="mt-3 text-sm">Draft: approved agreement text has not been added.</p>}</section>
    {content.chefSignature && <section className="agreement-signature mt-8 border-t-2 border-[#367577] pt-6"><h2 className="font-semibold">Chef electronic signature</h2><SignatureDisplay name={content.chefSignature.name} mark={content.chefSignature.mark} role="Chef" /><p className="mt-2 text-sm">Signed {new Date(content.chefSignature.signedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</p><p className="mt-3 text-sm leading-6">{content.chefSignature.consent}</p></section>}
    {agreement.signature && <section className="agreement-signature mt-8 border-t-2 border-[#367577] pt-6">
      <h2 className="font-semibold">Client electronic signature</h2><SignatureDisplay name={agreement.signature.name} mark={agreement.signature.mark} role="Client" />
      <p className="mt-2 text-sm">Signed {new Date(agreement.signature.signedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</p>
      <p className="mt-3 text-sm leading-6">{agreement.signature.consent}</p>
    </section>}
    <footer className="mt-8 border-t border-[#d6e4df] pt-4 text-xs leading-5 text-slate-500"><p>Agreement reference: {agreement.id}</p>{agreement.documentHash && <p className="break-all">Document SHA-256: {agreement.documentHash}</p>}</footer>
  </article>;
}
