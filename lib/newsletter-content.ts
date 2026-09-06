export type NewsletterContent = {
  title: string;
  subject: string;
  previewText: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

export class NewsletterInputError extends Error {}

export function parseNewsletterContent(value: unknown): NewsletterContent {
  if (!value || typeof value !== "object") throw new NewsletterInputError("Invalid issue.");
  const source = value as Record<string, unknown>;
  const limits = { title: 140, subject: 160, previewText: 240, body: 20000, ctaLabel: 70, ctaUrl: 1500 };
  const content = {} as NewsletterContent;
  for (const key of Object.keys(limits) as (keyof NewsletterContent)[]) {
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
  return content;
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
