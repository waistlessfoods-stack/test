// Read-only production smoke check. Never submits forms or modifies records.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const directory = 'docs/audit-screenshots/deployed-roster-2026-09-08';
await mkdir(directory, { recursive: true });
const report = { checkedAt: new Date().toISOString(), mutations: 'none', checks: {}, screenshots: [] };
const browser = await chromium.launch({ headless: true });
try {
  const anon = await browser.newContext();
  const home = await anon.request.get('https://www.waistlessfoods.com');
  assert.equal(home.status(), 200);
  const base = new URL(home.url()).origin;
  report.origin = base;
  report.checks.homepage = true;
  for (const path of ['/api/admin/class-rosters', '/api/admin/class-rosters?format=csv']) {
    const response = await anon.request.get(base + path);
    assert.equal(response.status(), 401, `${path} protects anonymous access`);
  }
  report.checks.anonymousApiProtected = true;
  const gate = await anon.newPage();
  await gate.goto(base + '/admin/class-rosters');
  await gate.getByPlaceholder('Admin password', { exact: true }).waitFor();
  report.checks.adminAuthenticationRetained = true;
  await anon.close();
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  assert.ok(secret, 'Local admin session configuration required');
  const payload = `${Date.now() + 600000}.${randomBytes(16).toString('hex')}`;
  const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  await context.addCookies([{ name: 'wlf_admin_session', value: token, url: base, httpOnly: true, secure: true, sameSite: 'Lax' }]);
  const response = await context.request.get(base + '/api/admin/class-rosters');
  assert.equal(response.status(), 200, 'Deployed API accepts configured admin session');
  const data = await response.json();
  assert.equal(data.mode, 'live');
  assert.ok(Array.isArray(data.classes));
  report.checks.realDatabaseRead = true;
  const page = await context.newPage();
  await page.goto(base + '/admin/class-rosters');
  await page.getByRole('heading', { name: 'Class registrations', exact: true }).waitFor();
  await page.getByRole('link', { name: 'View site', exact: true }).waitFor();
  await page.getByRole('combobox', { name: /Order environment/ }).waitFor();
  await page.waitForFunction(() => document.querySelector('[aria-label="Refresh registrations"]')?.disabled === false);
  assert.equal(await page.locator('main').getByRole('alert').count(), 0, 'Roster UI loaded without an error');
  if (!data.classes.length) await page.getByRole('heading', { name: 'No class registrations yet', exact: true }).waitFor();
  report.checks.rosterFinishedLoading = true;
  assert.equal(await page.locator('footer').count(), 0);
  report.checks.updatedAdminWorkspaceLive = true;
  // Mask the roster area if real customer data is present in this environment.
  const mask = data.classes.length ? [page.locator('main')] : [];
  for (const [name, width, height] of [['desktop', 1440, 1080], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const filename = `${name}.png`;
    await page.screenshot({ path: `${directory}/${filename}`, fullPage: true, animations: 'disabled', mask });
    report.screenshots.push(filename);
  }
  report.checks.desktopAndMobileNoOverflow = true;
  await page.getByRole('link', { name: 'View site', exact: true }).click();
  await page.waitForURL(base + '/');
  await page.locator('footer').waitFor();
  report.checks.storefrontRestoredOnNavigation = true;
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify(report, null, 2));
}
