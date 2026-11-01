export type NewsletterContent = {
  title: string;
  subject: string;
  previewText: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  media?: NewsletterMedia;
};

export type NewsletterImage = { url: string; alt: string; linkUrl: string };
export type NewsletterBodyImage = NewsletterImage & { afterParagraph: number };
export type NewsletterMedia = { header: NewsletterImage | null; footer: NewsletterImage | null; images: NewsletterBodyImage[] };
export const emptyNewsletterMedia = (): NewsletterMedia => ({ header: null, footer: null, images: [] });

export class NewsletterInputError extends Error {}

export function parseNewsletterContent(value: unknown): NewsletterContent {
  if (!value || typeof value !== "object") throw new NewsletterInputError("Invalid issue.");
  const source = value as Record<string, unknown>;
  const limits = { title: 140, subject: 160, previewText: 240, body: 20000, ctaLabel: 70, ctaUrl: 1500 };
  const content = {} as NewsletterContent;
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    if (typeof source[key] !== "string") throw new NewsletterInputError(`${key} must be text.`);
    const text = (source[key] as string).trim();
    if (text.length > limits[key]) throw new NewsletterInputError(`${key} exceeds ${limits[key]} characters.`);
    if (key !== "body" && /[\r\n]/.test(text)) throw new NewsletterInputError(`${key} must be one line.`);
    if (/\p{Cc}/u.test(text.replace(/[\r\n\t]/g, ""))) throw new NewsletterInputError("Control characters are not allowed.");
    content[key] = text;
  }
  if (!content.title || !content.subject) throw new NewsletterInputError("Title and email subject are required.");
  if (Boolean(content.ctaLabel) !== Boolean(content.ctaUrl)) throw new NewsletterInputError("Add both the button label and its HTTPS link, or leave both empty.");
  if (content.ctaUrl) {
    try {
      const url = new URL(content.ctaUrl);
      if (url.protocol !== "https:" || url.username || url.password) throw new Error();
      content.ctaUrl = url.href;
    } catch { throw new NewsletterInputError("The button link must be a valid HTTPS URL without credentials."); }
  }
  if (source.media !== undefined) content.media = parseNewsletterMedia(source.media, newsletterParagraphs(content.body).length);
  return content;
}

export function newsletterImageUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 1500) throw new NewsletterInputError("Add a published image URL from Contentful or the website.");
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port || !['images.ctfassets.net', 'www.waistlessfoods.com', 'waistlessfoods.com'].includes(url.hostname)) throw new Error();
    if (url.hostname === 'waistlessfoods.com') url.hostname = 'www.waistlessfoods.com';
    if (url.hostname === 'images.ctfassets.net') {
      // Email clients and the PDF renderer support JPEG/PNG. Contentful can
      // provide a JPEG rendition of other uploaded image formats.
      const format = url.searchParams.get('fm');
      if ((format && !['jpg','png'].includes(format)) || (!format && !/\.(png|jpe?g)$/i.test(url.pathname))) url.searchParams.set('fm', 'jpg');
    } else if (!/\.(png|jpe?g)$/i.test(url.pathname) || /^\/(api|_next)\//.test(url.pathname)) throw new Error();
    return url.href;
  } catch { throw new NewsletterInputError("Use a published HTTPS image from Contentful or a JPG/PNG on waistlessfoods.com."); }
}

function parseImage(value: unknown): NewsletterImage | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new NewsletterInputError("Invalid newsletter image.");
  const image = value as Record<string, unknown>;
  if (image.url === '' && image.alt === '' && (image.linkUrl === '' || image.linkUrl === undefined)) return null;
  const url = newsletterImageUrl(image.url);
  if (typeof image.alt !== 'string' || !image.alt.trim() || image.alt.length > 250 || /[\p{Cc}]/u.test(image.alt)) throw new NewsletterInputError("Add an image description of 1–250 characters.");
  let linkUrl = '';
  if (image.linkUrl !== undefined && image.linkUrl !== '') {
    if (typeof image.linkUrl !== 'string' || image.linkUrl.length > 1500) throw new NewsletterInputError("Check the image link.");
    try { const link = new URL(image.linkUrl.trim()); if (link.protocol !== 'https:' || link.username || link.password) throw new Error(); linkUrl = link.href; }
    catch { throw new NewsletterInputError("Image links must use HTTPS without credentials."); }
  }
  return { url, alt: image.alt.trim(), linkUrl };
}

export function parseNewsletterMedia(value: unknown, paragraphCount: number): NewsletterMedia {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new NewsletterInputError("Invalid newsletter images.");
  const media = value as Record<string, unknown>;
  const images = media.images ?? [];
  if (!Array.isArray(images) || images.length > 6) throw new NewsletterInputError("Add up to six body images.");
  return { header: parseImage(media.header), footer: parseImage(media.footer), images: images.map(value => {
    const image = parseImage(value);
    if (!image) throw new NewsletterInputError("Complete or remove the empty body image.");
    const position = (value as Record<string, unknown>).afterParagraph;
    if (!Number.isSafeInteger(position) || Number(position) < 0 || Number(position) > paragraphCount) throw new NewsletterInputError("Choose an image position within the current newsletter paragraphs.");
    return { ...image, afterParagraph: Number(position) };
  }) };
}

export function newsletterParagraphs(body: string): string[] { return body.replace(/\r\n?/g, '\n').split(/\n\s*\n/).filter(paragraph => paragraph.trim()); }
export function newsletterBlocks(issue: NewsletterContent): ({ kind: 'text'; text: string } | { kind: 'image'; image: NewsletterImage })[] {
  const paragraphs = newsletterParagraphs(issue.body);
  const blocks: ReturnType<typeof newsletterBlocks> = [];
  for (let position = 0; position <= paragraphs.length; position++) {
    for (const image of issue.media?.images || []) if (Math.min(image.afterParagraph, paragraphs.length) === position) blocks.push({ kind: 'image', image });
    if (position < paragraphs.length) blocks.push({ kind: 'text', text: paragraphs[position] });
  }
  return blocks;
}
export function newsletterEditableContent(issue: NewsletterContent): NewsletterContent {
  return { title: issue.title, subject: issue.subject, previewText: issue.previewText, body: issue.body, ctaLabel: issue.ctaLabel, ctaUrl: issue.ctaUrl, media: issue.media || emptyNewsletterMedia() };
}

// Unsaved editor input is not yet validated. Do not make browser image requests
// for incomplete or disallowed URLs while an administrator is typing.
export function newsletterPreviewImage(value: NewsletterImage | null | undefined): NewsletterImage | null {
  try { return value?.url && value.alt ? parseImage(value) : null; } catch { return null; }
}

export function assertNewsletterReady(content: NewsletterContent) {
  if (content.body.trim().length < 20) throw new NewsletterInputError("Add at least 20 characters of newsletter content before publishing or testing.");
}

export function parsePositiveInteger(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string") throw new NewsletterInputError("Invalid ID or version.");
  if (!/^\d+$/.test(String(value))) throw new NewsletterInputError("Invalid ID or version.");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) throw new NewsletterInputError("Invalid ID or version.");
  return number;
}

export function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
