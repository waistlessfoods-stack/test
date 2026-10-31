// Capture the real built-in sample flow. No browser fixtures, database writes,
// checkout, emails, or payments. Run against a local or deployed build.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.WALKTHROUGH_BASE_URL || 'http://localhost:3015';
const folder = 'docs/walkthrough-evidence/2026-10-30';
await mkdir(folder, { recursive: true });
const report = JSON.parse(await readFile(`${folder}/capture-report.json`, 'utf8'));
const capturedOn = '2026-10-31';
const browser = await chromium.launch({ headless: true });
const checks = [];
try {
  const anon = await browser.newContext();
  assert.equal((await anon.request.get(base + '/api/admin/class-rosters?mode=test&sample=1')).status(), 401);
  await anon.close();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, acceptDownloads: true });
  await context.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  assert.ok(secret, 'Admin configuration required');
  const payload = `${Date.now() + 3600000}.${randomBytes(16).toString('hex')}`;
  await context.addCookies([{ name: 'wlf_admin_session', value: `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`, url: base, httpOnly: true, secure: base.startsWith('https'), sameSite: 'Lax' }]);
  await context.route('**/*', route => {
    const method = route.request().method();
    if (!['GET', 'HEAD'].includes(method)) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function shot(step, file, title, caption, locator = page.locator('main').last()) {
    await page.evaluate(() => document.fonts.ready);
    await locator.screenshot({ path: `${folder}/${file}.jpg`, type: 'jpeg', quality: 82, animations: 'disabled', style: 'nextjs-portal { display: none !important; }' });
    report.screenshots = report.screenshots.filter(item => item.file !== `${file}.jpg`);
    report.screenshots.push({ section: 'classes', step, file: `${file}.jpg`, title, kind: base.startsWith('http://localhost') ? 'Local sample walkthrough' : 'Built-in sample walkthrough', caption, capturedOn });
  }
  await page.goto(base + '/admin');
  const nav = page.getByRole('navigation', { name: 'Admin tools', exact: true });
  await nav.waitFor();
  assert.equal(await page.locator('footer').count(), 0);
  assert.equal(await page.getByRole('button', { name: /cart/i }).count(), 0);
  await shot(3, 'class-admin-navigation', 'Open Class registrations from Admin', 'Shared Admin tools navigation keeps registrations alongside bookings, invoices, newsletters, and the walkthrough guide.', page);
  await nav.getByRole('link', { name: 'Class registrations', exact: true }).click();
  const mode = page.getByLabel('Order environment', { exact: true });
  await page.waitForFunction(() => document.querySelector('[aria-label="Refresh registrations"]')?.disabled === false);
  const sampleButton = page.getByRole('button', { name: 'View sample registration', exact: true });
  if (await sampleButton.isVisible()) {
    await sampleButton.click();
    await page.getByRole('heading', { name: 'Alex Sample', exact: true }).waitFor();
    await mode.selectOption('test');
  }
  await mode.selectOption('sample');
  await page.getByRole('heading', { name: 'Alex Sample', exact: true }).waitFor();
  await shot(4, 'class-sample-selection', 'Choose Sample walkthrough', 'Choose Sample walkthrough under Order environment. The demonstration is separate from live and sandbox order history.', page.getByRole('complementary', { name: 'Class selection' }));
  assert.equal(await nav.getByRole('link', { name: 'Class registrations', exact: true }).getAttribute('aria-current'), 'page');
  assert.match(await page.getByRole('region', { name: 'Class totals' }).innerText(), /Confirmed seats\s+2\s+Confirmed orders\s+1/);
  await shot(5, 'class-sample-overview', 'Review one order for two seats', 'Fresh Pasta Workshop and Alex Sample are fictional. Two seats belong to one confirmed sample order; no seats are reserved.');
  await page.getByLabel('Find purchaser or order', { exact: true }).fill('Alex');
  await shot(6, 'class-sample-search', 'Search the purchaser or order', 'Search by purchaser name, email, phone, or order number. Alex matches the sample purchaser.');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export filtered CSV', exact: true }).click();
  const download = await downloaded;
  assert.match(download.suggestedFilename(), /^class-roster-sample-/);
  const stream = await download.createReadStream();
  const parts = []; for await (const part of stream) parts.push(part);
  const csv = Buffer.concat(parts).toString('utf8');
  assert.ok(csv.includes('Alex Sample') && csv.includes('SAMPLE - Fresh Pasta Workshop'));
  await page.getByRole('status').filter({ hasText: 'Sample CSV downloaded' }).waitFor();
  await shot(7, 'class-sample-export', 'Download the filtered sample CSV', 'Export CSV downloads the currently filtered sample roster. The file name starts with class-roster-sample; it contains fictional contact information.');
  await page.getByLabel('Order status', { exact: true }).selectOption('pending');
  await page.getByText('No registrations match these filters.', { exact: true }).waitFor();
  await shot(8, 'class-sample-filter', 'Check status filters and reset', 'Pending payment has no matching sample order. Reset filters restores the confirmed sample purchaser; pending seats are not reservations.');
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByRole('heading', { name: 'Alex Sample', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot(9, 'class-sample-mobile', 'Use the roster on a phone', 'The same sample class, seat totals, purchaser search, and CSV export are available on mobile.');
  await mode.selectOption('live');
  await page.waitForFunction(() => document.querySelector('[aria-label="Refresh registrations"]')?.disabled === false);
  assert.equal(await page.getByRole('heading', { name: 'Alex Sample', exact: true }).count(), 0);
  await shot(10, 'class-return-live', 'Return to Live registrations', 'Switch back to Live registrations to review actual orders. Only the environment selector is captured to keep any customer records private.', page.getByRole('complementary', { name: 'Class selection' }).locator('div').first());
  await page.getByRole('link', { name: 'View site', exact: true }).click();
  await page.waitForURL(base + '/');
  await page.locator('footer').waitFor();
  await page.goBack();
  await page.getByRole('heading', { name: 'Class registrations', exact: true }).waitFor();
  assert.equal(await page.locator('footer').count(), 0);
  assert.deepEqual(errors, []);
  checks.push('Protected sample API, shared navigation and current page, sample selection, one order/two seats, search, filtered CSV, status reset, mobile overflow, return to live, and no JavaScript errors passed.');
  report.checks = [...new Set([...report.checks, ...checks.map(value => `${capturedOn}: ${value}`)])];
  await writeFile(`${folder}/capture-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ base, capturedOn, screenshots: 8, checks, mutations: 'none' }));
} finally {
  await browser.close();
}
