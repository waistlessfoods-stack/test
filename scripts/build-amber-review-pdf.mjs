// Client review attachment. No email sends or application-data mutations.
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHmac, randomBytes } from 'node:crypto';
import { chromium } from '@playwright/test';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import React from 'react';
import { render } from '@react-email/render';
import { sourceLoader } from './lib/load-typescript.mjs';

const dir = 'docs/client-review-2026-09-09';
await mkdir(dir, { recursive: true });
const shots = [];
function add(section, title, file, note) { shots.push({ section, title, file: `docs/audit-screenshots/${file}`, note }); }
add('Consultations', 'Website consultation form', 'consultation-readiness-2026-09-07/01-website-consultation.png', 'Live website capture. Final booking, invitation and Meet-link verification remain open.');
add('Consultations', 'Google appointment schedule', 'consultation-readiness-2026-09-07/02-google-schedule.png', 'Google schedule capture: 30-minute consultation. No appointment was created in this check.');
add('Consultations', 'Required event questions', 'consultation-readiness-2026-09-07/03-google-required-questions.png', 'Google form capture: event details, event dates and budget. This is not a booking confirmation.');
for (const [title, file] of [['Class cards - desktop','classes-desktop'], ['Class cards - mobile','classes-mobile'], ['Class details - desktop','class-detail-desktop'], ['Class details - mobile','class-detail-mobile'], ['Unavailable classes','classes-unavailable-mobile']]) add('Cooking classes in Shop', title, `shop-classes-2026-09-09/${file}.png`, 'Design verification with sample classes and photos, not real enrollment. Public classes remain disabled.');
for (const [title, file] of [['Registrations - desktop','01-class-roster-desktop'], ['Registrations - mobile','02-class-roster-mobile'], ['Registration filters','03-all-statuses-mobile']]) add('Class registrations', title, `class-rosters-ui-2026-09-07/${file}.png`, 'Sample purchaser roster. Counts are seats purchased, not individual guest names. No real registrations shown.');
for (const [title, file] of [['Newsletter - desktop','desktop-light'], ['Newsletter - mobile','mobile-light'], ['Newsletter - desktop dark mode','desktop-dark'], ['Newsletter - mobile dark mode','mobile-dark']]) add('Newsletter design', title, `newsletter-design-2026-09-09/${file}.png`, 'Current branded template with sample copy. Browser preview; email clients can render differently.');
for (const [title, file] of [['Newsletter editor - desktop','01-editor-desktop'], ['Newsletter editor - mobile','02-editor-mobile'], ['Member newsletter archive','04-member-archive'], ['Member newsletter issue','05-member-issue'], ['Member issue - mobile','06-member-mobile']]) add('Newsletter management', title, `newsletter-studio-2026-09-06/${file}.png`, 'Earlier functional screen with sample content. The email design has since been refreshed; publication and sending are separate.');
for (const [title, file] of [['Campaign sending - desktop','01-campaign-desktop'], ['Campaign sending - mobile','02-campaign-mobile']]) add('Newsletter management', title, `newsletter-sending-2026-09-08/${file}.png`, 'Sample campaign controls. Sending uses explicit manual batches, not automatic scheduling. No campaign was sent in this capture.');
for (const [title, file] of [['Service invoice editor - desktop','10-invoice-editor-desktop'], ['Service invoice editor - mobile','11-invoice-editor-mobile'], ['Invoice payment tracking','09-admin-paid-tracking-desktop'], ['Customer invoice - mobile','06-member-invoice-mobile'], ['Customer paid status','07-member-paid-mobile']]) add('Private Chef and Catering invoices', title, `service-invoices-2026-09-07/${file}.png`, 'Stripe sandbox/sample data. No real charge or invoice inbox delivery is demonstrated; live verification remains open.');

const browser = await chromium.launch();
try {
  if (process.argv.includes('--capture')) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
    await context.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
    const page = await context.newPage();
    await page.goto('https://www.waistlessfoods.com', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Complimentary Consultation', exact: true }).first().click();
    await page.getByRole('dialog').screenshot({ path: `${dir}/consultation-form.png` });
    for (const slug of ['private-chef', 'catering', 'cooking-classes']) {
      await page.goto(`https://www.waistlessfoods.com/services/${slug === 'private-chef' ? 'private' : slug}`, { waitUntil: 'domcontentloaded' });
      const control = slug === 'cooking-classes' ? page.getByRole('link', { name: 'Request a Private Class', exact: true }) : page.getByRole('link', { name: 'Request to Book', exact: true });
      await control.waitFor();
      await control.locator('xpath=ancestor::section[1]').screenshot({ path: `${dir}/${slug}.png`, style: 'body > header, header.sticky { visibility: hidden !important; }' });
    }
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    if (!secret) throw new Error('Admin session configuration required for protected recipe capture');
    const payload = `${Date.now() + 600000}.${randomBytes(16).toString('hex')}`;
    await context.addCookies([{ name: 'wlf_admin_session', value: `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`, url: 'https://www.waistlessfoods.com', secure: true, httpOnly: true, sameSite: 'Lax' }]);
    await page.goto('https://www.waistlessfoods.com/admin/recipes/triple-berry-french-toast', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Triple Berry French Toast', exact: true }).first().waitFor();
    await page.locator('.recipe-print-page img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
    await page.waitForFunction(() => [...document.querySelectorAll('.recipe-print-page img')].every(image => image.complete && image.naturalWidth > 0));
    await page.locator('.recipe-print-page').screenshot({ path: `${dir}/recipe-desktop.png`, style: 'header.sticky { visibility: hidden !important; }' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.recipe-print-page').screenshot({ path: `${dir}/recipe-mobile.png`, style: 'header.sticky { visibility: hidden !important; }' });
    await page.setViewportSize({ width: 816, height: 1056 });
    await page.emulateMedia({ media: 'print' });
    await page.locator('.recipe-print-page').screenshot({ path: `${dir}/recipe-print.png` });
    await page.emulateMedia({ media: 'screen' });
    const issue = { id: 900001, version: 1, status: 'draft', updatedAt: '2026-09-09T00:00:00Z', title: 'A little inspiration for your kitchen', subject: 'A note from The WaistLess Table', previewText: 'Good food, thoughtful cooking, and a seat at the table.', body: 'This is sample content for your website walkthrough.\n\nUse this editor to share seasonal recipes, cooking inspiration, and news from your kitchen.', ctaLabel: 'Explore WaistLess Foods', ctaUrl: 'https://www.waistlessfoods.com' };
    const Template = sourceLoader()('lib/email/templates/newsletter-issue-email.tsx').default;
    const emailHtml = await render(React.createElement(Template, { issue }));
    await page.route('**/api/admin/newsletters/900001**', async route => {
      if (route.request().method() !== 'GET') return route.abort();
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/campaign')) return route.fulfill({ json: { campaign: null, counts: {}, recent: [], settings: { enabled: true, addressConfigured: false, dailyLimit: 100 } } });
      if (url.searchParams.get('format') === 'email') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: emailHtml });
      return route.fulfill({ json: { issue } });
    });
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto('https://www.waistlessfoods.com/admin/newsletters/900001', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Email preview', exact: true }).click();
    await page.frameLocator('iframe').getByAltText('WaistLess Foods').waitFor();
    await page.frameLocator('iframe').locator('img').evaluate(image => image.decode());
    await page.locator('main').last().screenshot({ path: `${dir}/newsletter-editor-desktop.png`, style: 'header { visibility: hidden !important; }' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('main').last().screenshot({ path: `${dir}/newsletter-editor-mobile.png`, style: 'header { visibility: hidden !important; }' });
    await context.close();
  }
  const extra = [
    ...['private-chef', 'catering', 'cooking-classes'].map(slug => ({ section: 'Service requests', title: slug === 'private-chef' ? 'Private Chef request' : slug === 'catering' ? 'Catering request' : 'Private and public class actions', file: `${dir}/${slug}.png`, note: 'Live service-page capture, September 9. Amber can review and update her service booking-process copy in Contentful.' })),
    ...['desktop', 'mobile', 'print'].map(view => ({ section: 'Paid recipe access and PDFs', title: `Paid recipe - ${view}`, file: `${dir}/recipe-${view}.png`, note: 'Live protected admin preview, September 9. Full paid content is restricted; customers can use Print / Save PDF after purchase.' })),
  ];
  shots.splice(3, 0, ...extra);
  for (const shot of shots) {
    if (shot.title === 'Website consultation form') shot.file = `${dir}/consultation-form.png`;
    if (shot.title === 'Newsletter editor - desktop' || shot.title === 'Newsletter editor - mobile') {
      shot.file = `${dir}/newsletter-editor-${shot.title.endsWith('desktop') ? 'desktop' : 'mobile'}.png`;
      shot.note = 'Current live editor with browser-only sample content and branded preview. No draft was saved, published or sent.';
    }
  }
  for (const shot of shots) { shot.bytes = await readFile(shot.file); }
  const inspectPage = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
  for (let i = 0; i < shots.length; i += 6) {
    await inspectPage.setContent(`<html><head><meta charset="utf-8"><style>body{font:14px Arial;background:#e8edeb;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px}.tile{background:white;padding:12px;height:500px}img{width:100%;height:440px;object-fit:contain}h2{font-size:14px;margin:0 0 8px}</style></head><body>${shots.slice(i, i+6).map((shot,index)=>`<div class="tile"><h2>${i+index+1}. ${shot.title}</h2><img src="data:image/png;base64,${shot.bytes.toString('base64')}"></div>`).join('')}</body></html>`);
    await inspectPage.screenshot({ path: `${dir}/inspection-${Math.floor(i/6)+1}.png`, fullPage: true });
  }
  if (process.argv.includes('--inspect-only')) { console.log(`${shots.length} screenshots prepared for inspection`); process.exitCode = 0; }
  else {
    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const serif = await pdf.embedFont(StandardFonts.TimesRoman);
    const teal = rgb(0, .404, .431), ink = rgb(.09,.24,.25), muted = rgb(.33,.41,.40);
    pdf.setTitle('WaistLess Foods - Website Review - September 9, 2026');
    pdf.setAuthor('Zul | WaistLess Foods');
    pdf.setSubject('Client review screenshots. Sample screens and remaining verification are labelled.');
    const cover = pdf.addPage([840, 960]);
    cover.drawRectangle({ x: 0, y: 0, width: 840, height: 960, color: rgb(.98,.97,.95) });
    const logo = await pdf.embedPng(await readFile('public/logo.png'));
    cover.drawImage(logo, { x: 60, y: 744, width: 128, height: 128 });
    cover.drawText('WAISTLESS FOODS', { x: 60, y: 686, font: bold, size: 13, color: teal });
    cover.drawText('Website review', { x: 60, y: 624, font: serif, size: 46, color: ink });
    cover.drawText('Prepared for Chef Amber | September 9, 2026', { x: 60, y: 582, font: regular, size: 15, color: muted });
    cover.drawText(`${shots.length} selected screenshots | Desktop and mobile`, { x: 60, y: 550, font: regular, size: 13, color: muted });
    const topics = [...new Set(shots.map(shot=>shot.section))];
    topics.forEach((topic,index)=>cover.drawText(`${String(index+1).padStart(2,'0')}   ${topic}`, { x: 60, y: 486-index*30, font: regular, size: 14, color: ink }));
    const notes = ['Prepared for review, not a public-launch sign-off.', 'Class and invoice examples use sample/sandbox data, not real bookings or charges.', 'Public enrollment remains off; the site preview restriction is unchanged.', 'Final consultation/Meet and live payment/invoice checks remain open.', 'Older duplicate designs, internal logs and private payment links are excluded.'];
    notes.forEach((line,index)=>cover.drawText(line, { x: 60, y: 184-index*23, font: regular, size: 11, color: muted }));
    for (const [index, shot] of shots.entries()) {
      const img = await pdf.embedPng(shot.bytes);
      // Screen-first pages retain the whole screenshot without clipping or distortion.
      // Taller mobile captures have taller pages, preserving readable text at fit-width.
      const pageWidth = img.width < 700 ? 612 : 1040;
      const scale = Math.min((pageWidth-80)/img.width, 1.25);
      const imageWidth = img.width*scale, imageHeight = img.height*scale;
      const pageHeight = Math.max(700, imageHeight+190);
      const page = pdf.addPage([pageWidth,pageHeight]);
      page.drawText(shot.section.toUpperCase(), { x: 40, y: pageHeight-38, font: bold, size: 10, color: teal });
      page.drawText(shot.title, { x: 40, y: pageHeight-72, font: serif, size: 25, color: ink });
      const words = shot.note.split(' '); let line='', lines=[];
      for (const word of words) { const next=line?`${line} ${word}`:word; if (regular.widthOfTextAtSize(next,10)>pageWidth-80) {lines.push(line);line=word;} else line=next; } if(line)lines.push(line);
      lines.forEach((text,i)=>page.drawText(text,{x:40,y:pageHeight-96-i*14,font:regular,size:10,color:muted}));
      const top=pageHeight-142;
      page.drawImage(img, { x: (pageWidth-imageWidth)/2, y: top-imageHeight, width:imageWidth, height:imageHeight });
      page.drawText('WaistLess Foods | Review copy', { x:40,y:22,font:regular,size:9,color:muted });
      page.drawText(`${index+2} / ${shots.length+1}`, { x:pageWidth-80,y:22,font:regular,size:9,color:muted });
    }
    const bytes = await pdf.save();
    const filename = `${dir}/WaistLess-Foods-Website-Review-2026-09-09.pdf`;
    await writeFile(filename, bytes);
    const check = await PDFDocument.load(bytes);
    if(check.getPageCount()!==shots.length+1)throw new Error('PDF page count mismatch');
    await writeFile(`${dir}/screenshot-index.json`, JSON.stringify(shots.map(({section,title,file,note})=>({section,title,file,note})),null,2));
    console.log(JSON.stringify({filename,screenshots:shots.length,pages:check.getPageCount(),sizeMB:(bytes.length/1024/1024).toFixed(2)}));
  }
} finally { await browser.close(); }
