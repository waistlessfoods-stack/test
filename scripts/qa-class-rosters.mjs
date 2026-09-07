// Read-only local browser QA. Real authentication/API reads are checked first;
// labelled fixtures are then intercepted in Playwright for populated screenshots.
// No real registration, payment, CMS, or subscriber record is created or changed.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { sourceLoader } from './lib/load-typescript.mjs';

const base = 'http://localhost:3010';
const directory = 'docs/audit-screenshots/class-rosters-ui-2026-09-07';
await mkdir(directory, { recursive: true });
const load = sourceLoader({ 'server-only': {} });
const { buildClassRosters, parseRosterQuery, filterRegistrations, classRosterCsv } = load('lib/class-roster.ts');
const item = { id: 'qa-pasta-workshop', name: 'QA SAMPLE — Fresh Pasta Workshop', kind: 'cooking_class', eventDate: 'October 10, 2026 · 10:00 AM CT', capacity: 12, quantity: 2, price: 75 };
function fixture(id, name, quantity, status = 'completed', changes = {}) {
  return { id, status, stripeSessionId: `cs_live_QA_SAMPLE_${id}`, items: [{ ...item, quantity }], customerEmail: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`, metadata: { customerDetails: { name, phone: '+1 555 010 0100' } }, createdAt: new Date('2026-09-07T08:00:00Z'), ...changes };
}
const orders = [fixture(900101, 'Alex Sample', 2), fixture(900102, 'Morgan Sample', 3), fixture(900103, 'Taylor Sample', 1, 'pending'), fixture(900104, 'Riley Sample', 2, 'refunded'), fixture(900105, 'Other Date Sample', 1, 'completed', { items: [{ ...item, eventDate: 'October 17, 2026 · 10:00 AM CT', quantity: 1 }] }), fixture(900106, 'Test Sample', 7, 'completed', { stripeSessionId: 'cs_test_QA_SAMPLE' })];
const target = buildClassRosters(orders, 'live').classes.find(group => group.eventDate === item.eventDate);
const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD; assert.ok(secret);
const payload = `${Date.now() + 3600000}.${randomBytes(16).toString('hex')}`;
const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
const report = { localOnly: true, populatedScreenshotsUseFixtures: true, mutations: 'none', checks: {}, screenshots: [] };
const browser = await chromium.launch({ headless: true });
try {
  const anon = await browser.newContext();
  for (const path of ['/api/admin/class-rosters', '/api/admin/class-rosters?format=csv']) assert.equal((await anon.request.get(base + path)).status(), 401);
  report.checks.realAnonymousApiDenied = true;
  const anonPage = await anon.newPage(); await anonPage.goto(base + '/admin/class-rosters');
  await anonPage.getByRole('heading', { level: 1, name: 'Admin Portal', exact: true }).waitFor();
  await anonPage.getByPlaceholder('Admin password', { exact: true }).waitFor();
  assert.equal(await anonPage.getByRole('heading', { name: 'Class registrations', exact: true }).count(), 0);
  report.checks.realAdminPageProtected = true;
  await anon.close();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, acceptDownloads: true });
  await context.addCookies([{ name: 'wlf_admin_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  const real = await context.request.get(base + '/api/admin/class-rosters');
  assert.equal(real.status(), 200); assert.equal((await real.json()).mode, 'live');
  report.checks.realAuthenticatedDatabaseRead = true;
  let failNext = false;
  await context.route('**/api/admin/class-rosters**', async route => {
    if (failNext) { failNext = false; await route.fulfill({ status: 503, json: { error: 'QA simulated database interruption. Please retry.' } }); return; }
    const query = parseRosterQuery(new URL(route.request().url()).searchParams);
    const data = buildClassRosters(orders, query.mode);
    if (query.format === 'csv') {
      const group = data.classes.find(group => group.key === query.key);
      assert.ok(group);
      await route.fulfill({ status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8' }, body: classRosterCsv(group, filterRegistrations(group.registrations, query.status, query.query), query.mode) });
    } else await route.fulfill({ status: 200, json: data });
  });
  const page = await context.newPage();
  await page.goto(base + '/admin/class-rosters');
  await page.getByRole('heading', { level: 1, name: 'Class registrations' }).waitFor();
  await page.getByRole('button', { name: `Select ${target.title}, ${target.eventDate}`, exact: true }).click();
  await page.getByRole('heading', { name: 'Morgan Sample', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Riley Sample', exact: true }).count(), 0);
  assert.equal(await page.getByRole('heading', { name: 'Test Sample', exact: true }).count(), 0);
  assert.match(await page.getByRole('region', { name: 'Class totals' }).innerText(), /Confirmed seats\s+5/);
  report.checks.confirmedSeatsAndDefaultFilters = true;
  assert.equal(await page.locator('footer').count(), 0);
  assert.equal(await page.getByRole('button', { name: /cart/i }).count(), 0);
  report.checks.storefrontChromeHidden = true;
  await page.getByRole('link', { name: 'View site', exact: true }).click();
  await page.waitForURL(base + '/');
  await page.locator('footer').waitFor();
  await page.goBack();
  await page.getByRole('heading', { level: 1, name: 'Class registrations' }).waitFor();
  await page.getByRole('button', { name: `Select ${target.title}, ${target.eventDate}`, exact: true }).click();
  assert.equal(await page.locator('footer').count(), 0);
  report.checks.clientNavigationRestoresStorefront = true;
  async function shot(name) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => scrollY === 0);
    await page.screenshot({ path: `${directory}/${name}`, fullPage: true, animations: 'disabled' });
    report.screenshots.push(name);
  }
  await shot('01-class-roster-desktop.png');
  await page.setViewportSize({ width: 768, height: 1024 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot('05-class-roster-tablet.png');
  report.checks.tabletNoOverflow = true;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('combobox', { name: /Class & date/ }).selectOption(target.key);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await shot('02-class-roster-mobile.png');
  report.checks.mobileNoOverflow = true;
  await page.setViewportSize({ width: 320, height: 740 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  report.checks.smallMobileNoOverflow = true;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText('About these counts & CSV privacy', { exact: true }).click();
  assert.ok(await page.getByText('This workspace is read-only.', { exact: false }).isVisible());
  await page.getByText('About these counts & CSV privacy', { exact: true }).click();
  report.checks.notesExpandable = true;
  await page.getByLabel('Find purchaser or order').fill('Morgan');
  assert.equal(await page.getByRole('heading', { name: 'Alex Sample', exact: true }).count(), 0);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export filtered CSV', exact: true }).click();
  const file = await download; const path = `${directory}/sample-filtered-roster.csv`; await file.saveAs(path);
  const csv = await readFile(path, 'utf8'); assert.ok(csv.includes('Morgan Sample')); assert.ok(!csv.includes('Alex Sample')); assert.ok(!csv.includes('Test Sample')); assert.ok(csv.includes('"3"'));
  report.checks.filteredCsvDownload = true;
  await page.getByLabel('Find purchaser or order').fill('');
  await page.getByRole('combobox', { name: /Order status/ }).selectOption('all');
  await page.getByRole('heading', { name: 'Riley Sample', exact: true }).waitFor();
  await shot('03-all-statuses-mobile.png');
  report.checks.refundedAndPendingHistoryVisible = true;
  await page.getByRole('combobox', { name: /Order environment/ }).selectOption('test');
  await page.getByRole('heading', { name: 'Test Sample', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Morgan Sample', exact: true }).count(), 0);
  await shot('04-test-mode-mobile.png');
  report.checks.testModeSeparated = true;
  await page.getByRole('combobox', { name: /Order environment/ }).selectOption('unknown');
  await page.getByRole('heading', { name: 'No class registrations yet', exact: true }).waitFor();
  report.checks.emptyState = true;
  failNext = true;
  await page.getByRole('button', { name: 'Refresh registrations', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'QA simulated database interruption' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Export filtered CSV', exact: true }).count(), 0);
  report.checks.failureHidesStaleRoster = true;
} finally {
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
