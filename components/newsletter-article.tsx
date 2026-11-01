import { newsletterBlocks, type NewsletterContent } from "@/lib/newsletter-content";
import NewsletterImage from "@/components/newsletter-image";

export default function NewsletterArticle({ issue }: { issue: NewsletterContent }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#dce8e5] bg-white shadow-sm">
      <header className="border-b border-[#dce8e5] bg-[#f3f8f6] px-6 py-8 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#367577]">WaistLess Foods · Chef Amber</p>
        <p className="mt-3 font-serif text-2xl text-[#0e4648]">The WaistLess Table</p>
      </header>
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        {issue.media?.header && <div className="mb-7"><NewsletterImage image={issue.media.header} /></div>}
        <h1 className="break-words text-3xl font-semibold leading-tight text-[#173d40]">{issue.title}</h1>
        {issue.previewText && <p className="mt-4 break-words text-lg leading-relaxed text-[#687775]">{issue.previewText}</p>}
        <div className="mt-8 space-y-5 text-base leading-8 text-[#334e4d]">
          {newsletterBlocks(issue).map((block, index) => block.kind === 'text' ? <p key={index} className="whitespace-pre-wrap break-words">{block.text}</p> : <NewsletterImage key={index} image={block.image} />)}
        </div>
        {issue.ctaUrl && <a href={issue.ctaUrl} rel="noopener noreferrer" className="mt-8 inline-flex max-w-full break-words rounded-lg bg-[#086b70] px-6 py-3 font-medium text-white">{issue.ctaLabel}</a>}
      </div>
      <footer className="border-t border-[#dce8e5] px-6 py-5 text-sm text-[#687775] sm:px-10">{issue.media?.footer && <div className="mb-5"><NewsletterImage image={issue.media.footer} /></div>}Waste less. Taste more. · waistlessfoods.com</footer>
    </article>
  );
}
