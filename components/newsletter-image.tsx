/* eslint-disable @next/next/no-img-element -- Shared author-supplied email/archive images retain their original proportions. */
import { newsletterPreviewImage, type NewsletterImage as ImageContent } from "@/lib/newsletter-content";

export default function NewsletterImage({ image }: { image: ImageContent | null | undefined }) {
  const safe = newsletterPreviewImage(image);
  if (!safe) return null;
  const picture = <img src={safe.url} alt={safe.alt} className="h-auto max-h-[600px] w-full rounded-lg object-contain" />;
  return <figure>{safe.linkUrl ? <a href={safe.linkUrl} rel="noopener noreferrer">{picture}</a> : picture}</figure>;
}
