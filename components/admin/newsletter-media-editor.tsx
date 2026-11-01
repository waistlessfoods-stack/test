"use client";

import { emptyNewsletterMedia, type NewsletterImage, type NewsletterMedia } from "@/lib/newsletter-content";

const inputClass = "mt-2 w-full rounded-lg border border-[#cbdcd6] bg-white px-3 py-2.5 text-sm text-[#173d40]";
const blank = (): NewsletterImage => ({ url: "", alt: "", linkUrl: "" });

export default function NewsletterMediaEditor({ value, paragraphCount, onChange }: { value?: NewsletterMedia; paragraphCount: number; onChange: (media: NewsletterMedia) => void }) {
  const media = value || emptyNewsletterMedia();
  function imageFields(image: NewsletterImage | null, change: (image: NewsletterImage) => void, prefix: string) {
    return <div className="space-y-3"><label className="block text-sm font-medium">{prefix} image URL<input value={image?.url || ""} maxLength={1500} placeholder="https://images.ctfassets.net/…" className={inputClass} onChange={event => change({ ...(image || blank()), url: event.target.value })} /></label>
      <label className="block text-sm font-medium">{prefix} image description<input value={image?.alt || ""} maxLength={250} placeholder="Describe the image for readers who cannot see it" className={inputClass} onChange={event => change({ ...(image || blank()), alt: event.target.value })} /></label>
      <label className="block text-sm font-medium">{prefix} image link (optional)<input value={image?.linkUrl || ""} maxLength={1500} placeholder="https://www.waistlessfoods.com/…" className={inputClass} onChange={event => change({ ...(image || blank()), linkUrl: event.target.value })} /></label></div>;
  }
  return <section className="space-y-5 border-t border-[#dce8e5] pt-5"><div><h3 className="font-semibold text-[#173d40]">Newsletter images</h3><p className="mt-2 text-xs leading-5 text-slate-500">Use published images from Contentful or JPG/PNG files on the website. Upload photos to Contentful&apos;s media library, publish them, and paste their image URL here. Descriptions are required for accessibility. Images appear in email, the archive, and PDF copies.</p></div>
    <details className="rounded-lg border border-[#dce8e5] p-4" open={Boolean(media.header?.url)}><summary className="cursor-pointer text-sm font-semibold">Header image (optional)</summary><div className="mt-4">{imageFields(media.header, header => onChange({ ...media, header }), "Header")}<button type="button" onClick={() => onChange({ ...media, header: null })} className="mt-3 text-xs text-[#086b70] underline">Remove header image</button></div></details>
    {media.images.map((image, index) => <div key={index} className="rounded-lg border border-[#dce8e5] p-4"><h4 className="mb-4 text-sm font-semibold">Body image {index + 1}</h4>{imageFields(image, next => onChange({ ...media, images: media.images.map((current, position) => position === index ? { ...next, afterParagraph: current.afterParagraph } : current) }), `Body ${index + 1}`)}
      <label className="mt-3 block text-sm font-medium">Body {index + 1} image position<select className={inputClass} value={image.afterParagraph} onChange={event => onChange({ ...media, images: media.images.map((current, position) => position === index ? { ...current, afterParagraph: Number(event.target.value) } : current) })}>{Array.from({ length: paragraphCount + 1 }, (_, number) => <option key={number} value={number}>{number === 0 ? "Before the first paragraph" : `After paragraph ${number}`}</option>)}</select></label>
      <button type="button" onClick={() => onChange({ ...media, images: media.images.filter((_, position) => position !== index) })} className="mt-3 text-xs text-red-700 underline">Remove body image {index + 1}</button></div>)}
    <button type="button" disabled={media.images.length >= 6} onClick={() => onChange({ ...media, images: [...media.images, { ...blank(), afterParagraph: Math.min(1, paragraphCount) }] })} className="text-sm font-medium text-[#086b70] underline disabled:opacity-40">Add body image (up to 6)</button>
    <details className="rounded-lg border border-[#dce8e5] p-4" open={Boolean(media.footer?.url)}><summary className="cursor-pointer text-sm font-semibold">Footer image (optional)</summary><div className="mt-4">{imageFields(media.footer, footer => onChange({ ...media, footer }), "Footer")}<button type="button" onClick={() => onChange({ ...media, footer: null })} className="mt-3 text-xs text-[#086b70] underline">Remove footer image</button></div></details>
  </section>;
}
