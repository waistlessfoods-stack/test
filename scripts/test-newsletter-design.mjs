import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { render } from '@react-email/render';
import { chromium } from '@playwright/test';
import { sourceLoader } from './lib/load-typescript.mjs';

// Local rendering only: no SMTP, database writes, or subscription changes.
const load = sourceLoader({ 'server-only': {} });
const Template = load('lib/email/templates/newsletter-issue-email.tsx').default;
const output = fileURLToPath(new URL('../docs/audit-screenshots/newsletter-design-2026-09-09/', import.meta.url));
await mkdir(output, { recursive: true });
const issue = {
  title: 'A little inspiration for your kitchen',
  subject: '[DESIGN PREVIEW] The WaistLess Table',
  previewText: 'Good food, thoughtful cooking, and a seat at the table.',
  body: 'Hello from the WaistLess kitchen!\n\nThis is a design preview of our newsletter: a space for seasonal recipes, creative ideas, and simple ways to make more of the ingredients you love.\n\nPull up a chair, find something delicious, and make it your own.',
  ctaLabel: 'Explore WaistLess Foods',
  ctaUrl: 'https://www.waistlessfoods.com',
};
const campaign = { unsubscribeUrl: 'https://www.waistlessfoods.com/unsubscribe?preview=true', mailingAddress: '' };
const html = await render(React.createElement(Template, { issue, campaign }));
assert.ok(html.includes('https://www.waistlessfoods.com/logo.png'));
assert.ok(html.includes('alt="WaistLess Foods"'));
assert.ok(html.includes('prefers-color-scheme: dark'));
assert.ok(!html.includes('PREVIEW ONLY'));
assert.ok(!html.includes('Business mailing address'));
assert.ok(html.includes('Unsubscribe from newsletters'));
assert.ok(Buffer.byteLength(html) < 90 * 1024, 'Keep template comfortably below Gmail clipping size');

const browser = await chromium.launch();
try {
  for (const colorScheme of ['light', 'dark']) {
    for (const [device, width] of [['desktop', 800], ['mobile', 375]]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.newsletter-button').getAttribute('href'), issue.ctaUrl);
      assert.equal(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth), true, 'No horizontal overflow');
      assert.equal(await page.locator('.newsletter-content').evaluate(el => getComputedStyle(el).backgroundColor), colorScheme === 'dark' ? 'rgb(35, 53, 54)' : 'rgb(255, 255, 255)');
      assert.equal(await page.locator('.newsletter-body > table > tbody > tr > td').evaluate(el => getComputedStyle(el).backgroundColor), colorScheme === 'dark' ? 'rgb(23, 37, 38)' : 'rgb(243, 239, 232)');
      await page.screenshot({ path: `${output}/${device}-${colorScheme}.png`, fullPage: true });
      console.log(`PASS ${device} ${colorScheme}: logo loads, CTA preserved, no overflow; screenshot saved`);
      await page.close();
    }
  }
  const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
  const stress = await render(React.createElement(Template, { issue: { ...issue, title: 'LongTitle'.repeat(24), body: '<script>alert(1)</script>\n\n' + 'LongUnbrokenText'.repeat(80), ctaUrl: '' } }));
  await page.setContent(stress);
  assert.equal(await page.locator('script').count(), 0);
  assert.equal(await page.locator('.newsletter-button').count(), 0);
  assert.equal(await page.locator('.newsletter-preview').count(), 1);
  assert.equal(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth), true);
  // Email clients may discard head CSS; the inline layout must still work.
  await page.locator('style').evaluateAll(elements => elements.forEach(el => el.remove()));
  assert.equal(await page.locator('body').evaluate(el => el.scrollWidth <= window.innerWidth), true);
  console.log('PASS 320px long-content preview: escaped content, no CTA, banner present, inline fallback fits');
} finally {
  await browser.close();
}
console.log('Browser previews only; Apple Mail/Gmail inbox rendering still needs a new approved test. No email sent.');
