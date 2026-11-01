// No SMTP, database writes, or external image downloads.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@react-email/render';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { sourceLoader } from './lib/load-typescript.mjs';

const load = sourceLoader({ 'server-only': {} });
const content = load('lib/newsletter-content.ts');
const { createNewsletterPdf } = load('lib/newsletter-pdf.ts');
const photo = 'https://www.waistlessfoods.com/recipes/pasta.png';
const logo = 'https://www.waistlessfoods.com/logo.png';
const link = 'https://www.waistlessfoods.com/recipes';
const issue = { title: 'QA media preview', subject: '[QA] media preview', previewText: 'QA test only.', body: 'First QA paragraph for a newsletter.\n\nSecond QA paragraph for a newsletter.', ctaLabel: '', ctaUrl: '', media: { header: { url: logo, alt: 'QA header', linkUrl: link }, footer: { url: logo, alt: 'QA footer', linkUrl: '' }, images: [{ url: photo, alt: 'QA body photo', linkUrl: link, afterParagraph: 1 }] } };

test('media validation retains image order/links and rejects incomplete or unsafe images', () => {
  assert.deepEqual(content.parseNewsletterContent(issue), issue);
  assert.deepEqual(content.newsletterBlocks(issue).map(block => block.kind), ['text','image','text']);
  for (const url of ['http://www.waistlessfoods.com/logo.png','https://localhost/a.png','https://127.0.0.1/a.png','https://images.ctfassets.net.evil.test/a.png','https://user:password@images.ctfassets.net/a.png','data:image/png,test','https://www.waistlessfoods.com/api/a.png']) assert.throws(() => content.newsletterImageUrl(url));
  assert.ok(content.newsletterImageUrl('https://images.ctfassets.net/space/asset/photo.webp').endsWith('fm=jpg'));
  assert.equal(content.newsletterImageUrl('https://waistlessfoods.com/logo.png'), logo);
  for (const patch of [{ alt: '' }, { alt: 'x'.repeat(251) }, { linkUrl: 'javascript:alert(1)' }, { afterParagraph: 10 }]) assert.throws(() => content.parseNewsletterContent({ ...issue, media: { ...issue.media, images: [{ ...issue.media.images[0], ...patch }] } }));
  assert.throws(() => content.parseNewsletterContent({ ...issue, media: { ...issue.media, images: Array(7).fill(issue.media.images[0]) } }));
});

test('archive/email share the saved image order, links, accessible descriptions, and escaped text', async () => {
  const Article = load('components/newsletter-article.tsx').default;
  const Email = load('lib/email/templates/newsletter-issue-email.tsx').default;
  for (const html of [renderToStaticMarkup(React.createElement(Article, { issue })), await render(React.createElement(Email, { issue }))]) {
    let previous = -1;
    for (const label of ['QA header','First QA paragraph','QA body photo','Second QA paragraph','QA footer']) { const position = html.indexOf(label); assert.ok(position > previous, label); previous = position; }
    assert.ok(html.includes(`href="${link}"`)); assert.ok(html.includes('alt="QA body photo"'));
  }
  const html = renderToStaticMarkup(React.createElement(Article, { issue: { ...issue, media: { ...issue.media, header: { url: 'https://localhost/private.png', alt: 'Unvalidated', linkUrl: '' } } } }));
  assert.ok(!html.includes('https://localhost/'));
});

test('PDF embeds unique images once, preserves hyperlink annotations, and rejects damaged image bytes', async () => {
  const bytes = await readFile(new URL('../public/recipes/pasta.png', import.meta.url));
  const loaded = [];
  const pdf = await PDFDocument.load(await createNewsletterPdf(issue, { loadImage: async url => { loaded.push(url); return { bytes, format: 'png' }; } }));
  assert.equal(loaded.length, 2);
  const images = pdf.getPages().flatMap(page => page.node.Resources().lookup(PDFName.of('XObject'), PDFDict)?.keys() || []);
  assert.ok(images.length >= 2);
  let links = 0;
  for (const page of pdf.getPages()) {
    const annotations = page.node.Annots();
    for (let index = 0; index < (annotations?.size() || 0); index++) {
      const annotation = pdf.context.lookup(annotations.get(index), PDFDict);
      const action = annotation.lookup(PDFName.of('A'), PDFDict);
      if (action?.get(PDFName.of('URI'))?.decodeText() === link) links++;
    }
  }
  assert.equal(links, 2);
  await assert.rejects(() => createNewsletterPdf(issue, { loadImage: async () => ({ bytes: new Uint8Array([0,1,2]), format: 'png' }) }), /damaged or unsupported/);
});

test('image download enforces published hosts, no redirects/credentials, size limits, and actual file bytes', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const png = await readFile(new URL('../public/recipes/pasta.png', import.meta.url));
  let requests = 0;
  globalThis.fetch = async (_url, options) => { requests++; assert.equal(options.redirect, 'error'); assert.equal(options.credentials, 'omit'); assert.ok(options.signal instanceof AbortSignal); return new Response(png, { headers: { 'content-type': 'image/png' } }); };
  const { loadNewsletterImage } = load('lib/newsletter-image-resource.ts');
  await assert.rejects(() => loadNewsletterImage('https://localhost/a.png'));
  assert.equal(requests, 0);
  assert.equal((await loadNewsletterImage(photo)).format, 'png');
  globalThis.fetch = async () => new Response('<svg>unsupported</svg>');
  await assert.rejects(() => loadNewsletterImage(photo), /JPEG or PNG/);
  globalThis.fetch = async () => new Response('x', { headers: { 'content-length': String(4 * 1024 * 1024) } });
  await assert.rejects(() => loadNewsletterImage(photo), /under 3 MB/);
  let cancelled = false;
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(4 * 1024 * 1024)); }, cancel() { cancelled = true; } }));
  await assert.rejects(() => loadNewsletterImage(photo), /under 3 MB/);
  assert.equal(cancelled, true);
});
