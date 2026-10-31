// Read-only audit of navigation/guide destinations and the real sample UI.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.WALKTHROUGH_BASE_URL || 'http://localhost:3015';
const report = { base, checkedAt: new Date().toISOString(), links: [], checks: [], mutations: 'none' };
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, acceptDownloads: true });
  await context.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  assert.ok(secret, 'Admin session configuration required');
  const payload = `${Date.now() + 3600000}.${randomBytes(16).toString('hex')}`;
  await context.addCookies([{ name: 'wlf_admin_session', value: `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`, url: base, httpOnly: true, secure: base.startsWith('https'), sameSite: 'Lax' }]);
  await context.route('**/*', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto(base + '/admin/walkthrough#classes');
  await page.getByRole('heading', { name: 'Your website, step by step.', exact: true }).waitFor();
  const nav = page.getByRole('navigation', { name: 'Admin tools', exact: true });
  await nav.waitFor();
  const links = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => ({ label: anchor.innerText.trim() || anchor.getAttribute('aria-label'), href: anchor.href })));
  const unique = [...new Map(links.map(link => [link.href, link])).values()];
  for (const link of unique) {
    const url = new URL(link.href);
    if (!['http:', 'https:'].includes(url.protocol)) continue;
    if (url.origin === base && url.pathname === '/admin/walkthrough' && url.hash) {
      assert.equal(await page.locator(`[id="${url.hash.slice(1)}"]`).count(), 1, link.href);
    }
    const response = await context.request.get(url.href, { timeout: 30000 });
    report.links.push({ ...link, status: response.status(), destination: response.url() });
    assert.ok(response.ok(), `${link.href}: HTTP ${response.status()}`);
  }
  await nav.getByRole('link', { name: 'Class registrations', exact: true }).click();
  const mode = page.getByLabel('Order environment', { exact: true });
  await mode.selectOption('sample');
  await page.getByRole('heading', { name: 'Alex Sample', exact: true }).waitFor();
  assert.match(await page.getByRole('region', { name: 'Class totals' }).innerText(), /Confirmed seats\s+2\s+Confirmed orders\s+1/);
  assert.equal(await nav.getByRole('link', { name: 'Class registrations', exact: true }).getAttribute('aria-current'), 'page');
  await page.getByLabel('Find purchaser or order').fill('Alex');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export filtered CSV', exact: true }).click();
  assert.match((await downloadEvent).suggestedFilename(), /^class-roster-sample-/);
  await page.getByLabel('Order status').selectOption('pending');
  await page.getByText('No registrations match these filters.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByRole('heading', { name: 'Alex Sample', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mode.selectOption('live');
  await page.waitForFunction(() => document.querySelector('[aria-label="Refresh registrations"]')?.disabled === false);
  assert.equal(await page.getByRole('heading', { name: 'Alex Sample', exact: true }).count(), 0);
  await page.getByRole('link', { name: 'View site', exact: true }).click();
  await page.waitForURL(base + '/');
  await page.locator('footer').waitFor();
  await page.goBack();
  await page.getByRole('heading', { name: 'Class registrations', exact: true }).waitFor();
  assert.equal(await page.locator('footer').count(), 0);
  report.checks.push('All admin navigation and guide destinations returned success; guide anchors exist.', 'Built-in sample, two seats/one order, search, CSV, status reset, mobile, live-mode separation and public/admin layout navigation passed.');
  console.log(JSON.stringify({ base, links: report.links.length, checks: report.checks }));
} catch (error) {
  report.failure = error.message;
  throw error;
} finally {
  await browser.close();
  await mkdir('.runtime/walkthrough-evidence', { recursive: true });
  await writeFile('.runtime/walkthrough-evidence/admin-links-qa.json', JSON.stringify(report, null, 2));
}
