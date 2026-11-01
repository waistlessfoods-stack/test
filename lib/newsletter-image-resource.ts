import { NewsletterInputError, newsletterImageUrl } from "@/lib/newsletter-content";

export type NewsletterImageResource = { bytes: Uint8Array; format: "jpg" | "png" };
export async function loadNewsletterImage(value: string): Promise<NewsletterImageResource> {
  const url = newsletterImageUrl(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const maximum = 3 * 1024 * 1024;
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "error", credentials: "omit", headers: { Accept: "image/png,image/jpeg" } });
    if (!response.ok || !response.body) throw new Error();
    if (Number(response.headers.get("content-length")) > maximum) throw new NewsletterInputError("Newsletter images must be under 3 MB. Use a smaller published image.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.length;
        if (size > maximum) throw new NewsletterInputError("Newsletter images must be under 3 MB. Use a smaller published image.");
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const png = bytes.length > 8 && [137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte);
    const jpg = bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!png && !jpg) throw new NewsletterInputError("The image did not contain a JPEG or PNG. Publish a supported image and check its URL.");
    return { bytes, format: png ? "png" : "jpg" };
  } catch (error) {
    if (error instanceof NewsletterInputError) throw error;
    throw new NewsletterInputError("A newsletter image could not be loaded for its PDF. Check that each image is published and available, then retry.");
  } finally { clearTimeout(timeout); }
}
