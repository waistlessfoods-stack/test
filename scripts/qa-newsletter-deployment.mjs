// Read-only production verification. No test-send or campaign mutation calls.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = 'https://www.waistlessfoods.com';
const directory = 'docs/audit-screenshots/newsletter-deployed-2026-09-08';
await mkdir(directory, { recursive: true });
const report = { checkedAt: new Date().toISOString(), mutations: 'none', checks: {} };
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  assert.equal((await context.request.get(base + '/api/admin/newsletters/900001/campaign')).status(), 401);
  report.checks.adminApiProtected = true;
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  assert.ok(secret);
  const payload = `${Date.now()+600000}.${randomBytes(16).toString('hex')}`;
  const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
  await context.addCookies([{ name: 'wlf_admin_session', value: token, url: base, secure: true, httpOnly: true, sameSite: 'Lax' }]);
  const state = await context.request.get(base + '/api/admin/newsletters/900001/campaign');
  assert.equal(state.status(), 200);
  const configuration = await state.json();
  assert.equal(configuration.settings.enabled, false);
  assert.equal(configuration.settings.addressConfigured, false);
  report.checks.realDatabaseRead = true;
  report.checks.liveSubscriberSendingDisabled = true;
  report.checks.placeholderModeConfigured = true;
  const list = await context.request.get(base + '/api/admin/newsletters');
  assert.equal(list.status(), 200);
  const { issues } = await list.json();
  assert.ok(issues.length, 'An existing issue is needed for read-only preview verification');
  const id = issues[0].id;
  const preview = await context.request.get(`${base}/api/admin/newsletters/${id}?format=email`);
  assert.equal(preview.status(), 200);
  const html = await preview.text();
  assert.ok(html.includes('PREVIEW ONLY') && html.includes('add before sending'));
  report.checks.realPreviewContainsPlaceholder = true;
  const pdf = await context.request.get(`${base}/api/admin/newsletters/${id}?format=pdf`);
  assert.equal(pdf.status(), 200);
  assert.ok(pdf.headers()['content-type'].includes('application/pdf'));
  report.checks.pdfPreviewWorks = true;
  const page = await context.newPage();
  await page.goto(`${base}/admin/newsletters/${id}`);
  const section = page.getByRole('region', { name: 'Send to subscribers' });
  await section.getByText('[Business mailing address — add before sending]', { exact: true }).waitFor();
  await section.screenshot({ path: `${directory}/desktop.png`, animations: 'disabled', style: 'header { visibility: hidden !important; }' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await section.screenshot({ path: `${directory}/mobile.png`, animations: 'disabled', style: 'header { visibility: hidden !important; }' });
  report.checks.liveUiAndMobileLayout = true;
  assert.equal((await context.request.get(base + '/api/newsletter/one-click')).status(), 405);
  report.checks.unsubscribeGetDoesNotMutate = true;
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify(report, null, 2));
}
