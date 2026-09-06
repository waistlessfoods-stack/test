import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { NewsletterInputError, type NewsletterContent } from "@/lib/newsletter-content";

export async function createNewsletterPdf(issue: NewsletterContent): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const text = [issue.title, issue.previewText, issue.body, issue.ctaLabel, issue.ctaUrl].join("\n");
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
  paragraph(issue.body);
  if (issue.ctaUrl) { y -= 18; paragraph(issue.ctaLabel, bold); paragraph(issue.ctaUrl, regular, 10, 16); }
  const pages = document.getPages();
  pages.forEach((sheet, index) => {
    sheet.drawText("WaistLess Foods | waistlessfoods.com | Member copy", { x: 54, y: 38, size: 8, font: regular, color: ink });
    sheet.drawText(`${index + 1} / ${pages.length}`, { x: 524, y: 38, size: 8, font: regular, color: ink });
  });
  return document.save();
}
