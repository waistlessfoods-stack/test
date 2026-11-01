import { PDFDocument, PDFString, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { NewsletterInputError, newsletterBlocks, parseNewsletterContent, type NewsletterContent, type NewsletterImage } from "@/lib/newsletter-content";
import { loadNewsletterImage, type NewsletterImageResource } from "@/lib/newsletter-image-resource";

export async function createNewsletterPdf(input: NewsletterContent, options: { loadImage?: (url: string) => Promise<NewsletterImageResource> } = {}): Promise<Uint8Array> {
  const issue = parseNewsletterContent(input);
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const text = [issue.title, issue.previewText, issue.body, issue.ctaLabel, issue.ctaUrl, issue.media?.header?.alt, issue.media?.footer?.alt, ...(issue.media?.images.map(image => image.alt) || [])].filter(Boolean).join("\n");
  // Never silently drop characters from an archive download.
  for (const character of text.replace(/[\r\n\t]/g, "")) {
    try { regular.encodeText(character); } catch {
      throw new NewsletterInputError(`PDF cannot render the character “${character}”. Replace unsupported emoji or symbols before publishing.`);
    }
  }
  document.setTitle(issue.title);
  document.setAuthor("Chef Amber — WaistLess Foods");
  let page = document.addPage([612, 792]);
  let y = 682;
  const ink = rgb(0.09, 0.24, 0.25);
  function header() {
    page.drawText("THE WAISTLESS TABLE", { x: 54, y: 740, size: 11, font: bold, color: rgb(0.04, 0.42, 0.44) });
    page.drawLine({ start: { x: 54, y: 724 }, end: { x: 558, y: 724 }, color: rgb(0.8, 0.87, 0.85), thickness: 1 });
  }
  header();
  const resources = new Map<string, NewsletterImageResource>();
  const imageUrls = [...new Set([issue.media?.header?.url, issue.media?.footer?.url, ...(issue.media?.images.map(image => image.url) || [])].filter((url): url is string => Boolean(url)))];
  // Bound total network wait by loading the at-most-eight unique images
  // together; one slow resource must not multiply the request timeout.
  await Promise.all(imageUrls.map(async url => resources.set(url, await (options.loadImage || loadNewsletterImage)(url))));
  const loaded = new Map<string, Awaited<ReturnType<PDFDocument['embedPng']>>>();
  async function image(content: NewsletterImage | null | undefined, maximumHeight = 250) {
    if (!content) return;
    let resource = loaded.get(content.url);
    if (!resource) {
      const data = resources.get(content.url)!;
      try { resource = data.format === 'png' ? await document.embedPng(data.bytes) : await document.embedJpg(data.bytes); }
      catch { throw new NewsletterInputError("A newsletter image is damaged or unsupported. Replace it with a published JPEG or PNG."); }
      loaded.set(content.url, resource);
    }
    const scale = Math.min(504 / resource.width, maximumHeight / resource.height, 1);
    const width = resource.width * scale; const height = resource.height * scale;
    if (y - height < 78) { page = document.addPage([612, 792]); y = 694; header(); }
    const x = 54 + (504 - width) / 2;
    page.drawImage(resource, { x, y: y - height, width, height });
    if (content.linkUrl) {
      const annotation = document.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [x, y - height, x + width, y], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of(content.linkUrl) } });
      page.node.addAnnot(document.context.register(annotation));
    }
    y -= height + 20;
  }
  function line(value: string, font: PDFFont, size: number, height: number) {
    if (y < 78) { page = document.addPage([612, 792]); y = 694; header(); }
    page.drawText(value, { x: 54, y, size, font, color: ink });
    y -= height;
  }
  function paragraph(value: string, font = regular, size = 11.5, height = 18) {
    for (const raw of value.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n")) {
      let current = "";
      for (const word of raw.split(/ +/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= 504) { current = candidate; continue; }
        if (current) { line(current, font, size, height); current = ""; }
        for (const character of word) {
          if (font.widthOfTextAtSize(current + character, size) > 504) { line(current, font, size, height); current = ""; }
          current += character;
        }
      }
      line(current, font, size, height);
    }
  }
  paragraph(issue.title, bold, 24, 30);
  y -= 12;
  if (issue.previewText) { paragraph(issue.previewText, regular, 13, 20); y -= 16; }
  await image(issue.media?.header);
  if (!issue.media?.images.length) paragraph(issue.body);
  else for (const block of newsletterBlocks(issue)) {
    if (block.kind === 'text') { paragraph(block.text); y -= 10; }
    else await image(block.image);
  }
  if (issue.ctaUrl) { y -= 18; paragraph(issue.ctaLabel, bold); paragraph(issue.ctaUrl, regular, 10, 16); }
  await image(issue.media?.footer, 120);
  const pages = document.getPages();
  pages.forEach((sheet, index) => {
    sheet.drawText("WaistLess Foods | waistlessfoods.com | Member copy", { x: 54, y: 38, size: 8, font: regular, color: ink });
    sheet.drawText(`${index + 1} / ${pages.length}`, { x: 524, y: 38, size: 8, font: regular, color: ink });
  });
  return document.save();
}
