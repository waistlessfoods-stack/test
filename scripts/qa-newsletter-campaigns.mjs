// Local browser QA with synthetic issue/campaign responses. No SMTP or writes.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = 'http://localhost:3010';
const directory = 'docs/audit-screenshots/newsletter-campaigns-2026-09-08';
await mkdir(directory, { recursive: true });
const issue = { id: 900001, version: 1, status: 'draft', title: 'QA SAMPLE — A seasonal table', subject: 'A little inspiration for your next gathering', previewText: 'Fresh ideas from Chef Amber’s kitchen.', body: 'Good food brings people together. This sample newsletter shows how a saved issue becomes a carefully reviewed email campaign.\n\nStart with seasonal vegetables, add a favorite herb, and make room at the table for someone you love.', ctaLabel: 'Explore recipes', ctaUrl: 'https://www.waistlessfoods.com/recipes' };
let state = { campaign: null, counts: {}, recent: [], settings: { enabled: true, addressConfigured: true, dailyLimit: 100 } };
let sends = 0;
let fail = false;
const report = { fixtures: true, mutations: 'none; all campaign/issue browser requests intercepted', checks: {} };
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  assert.equal((await context.request.get(base + '/api/admin/newsletters/900001/campaign')).status(), 401);
  assert.equal((await context.request.get(base + '/api/newsletter/one-click')).status(), 405);
  assert.equal((await context.request.post(base + '/api/newsletter/one-click?subscriber=0', { data: 'List-Unsubscribe=One-Click' })).status(), 400);
  report.checks.realRouteGuards = true;
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  assert.ok(secret);
  const payload = `${Date.now()+3600000}.${randomBytes(16).toString('hex')}`;
  const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
  await context.addCookies([{ name: 'wlf_admin_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  const real = await context.request.get(base + '/api/admin/newsletters/900001/campaign');
  assert.equal(real.status(), 200, 'Real campaign database adapter reads successfully');
  assert.equal((await real.json()).settings.enabled, false, 'Actual local subscriber sending remains disabled');
  report.checks.realDatabaseReadAndSendingDisabled = true;
  await context.route('**/api/admin/newsletters/**', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith('/campaign')) { await route.fulfill({ json: { issue } }); return; }
    if (fail) { fail = false; await route.fulfill({ status: 503, json: { error: 'QA simulated service interruption' } }); return; }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      if (body.action === 'prepare') state = { ...state, campaign: { id: 1, issue_id: issue.id, issue_version: 1, snapshot: issue, mailing_address: 'QA SAMPLE — business address appears here', status: 'ready' }, counts: { pending: 7, accepted: 12, skipped: 1 } };
      if (body.action === 'send') {
        sends++; assert.equal(body.confirm, 'SEND');
        state = { ...state, campaign: { ...state.campaign, status: 'paused' }, counts: { pending: 6, accepted: 12, skipped: 1, uncertain: 1 }, recent: [{ id: 5, email: 'qa.sample@example.com', status: 'uncertain' }] };
        await route.fulfill({ json: { ...state, attempted: true, message: 'QA uncertain send. Campaign paused.' } }); return;
      }
      if (body.action === 'resume') state.campaign.status = 'ready';
      if (body.action === 'cancel') { state.campaign.status = 'cancelled'; state.counts.skipped += state.counts.pending; state.counts.pending = 0; }
    }
    await route.fulfill({ json: state });
  });
  const page = await context.newPage();
  await page.goto(base + '/admin/newsletters/900001');
  const section = page.getByRole('region', { name: 'Send to subscribers' });
  await section.getByRole('button', { name: 'Prepare saved issue & audience' }).waitFor();
  await page.getByLabel('Issue title', { exact: true }).fill('Unsaved change');
  assert.equal(await section.getByRole('button', { name: 'Prepare saved issue & audience' }).isEnabled(), false);
  await page.getByLabel('Issue title', { exact: true }).fill(issue.title);
  page.once('dialog', dialog => dialog.accept());
  await section.getByRole('button', { name: 'Prepare saved issue & audience' }).click();
  await section.getByRole('button', { name: 'Send next 5 subscribers' }).waitFor();
  assert.equal(sends, 0); report.checks.prepareDoesNotSendAndDirtyIsBlocked = true;
  await section.getByText('Review frozen email content & footer', { exact: true }).click();
  // Focused component captures: hide the floating storefront header only while
  // capturing, so it does not cover a tall element screenshot during scrolling.
  const captureStyle = 'header { visibility: hidden !important; }';
  await section.screenshot({ path: `${directory}/01-campaign-desktop.png`, animations: 'disabled', style: captureStyle });
  page.once('dialog', dialog => dialog.dismiss());
  await section.getByRole('button', { name: 'Send next 5 subscribers' }).click();
  assert.equal(sends, 0); report.checks.decliningConfirmationDoesNotSend = true;
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await section.screenshot({ path: `${directory}/02-campaign-mobile.png`, animations: 'disabled', style: captureStyle });
  report.checks.mobileNoOverflow = true;
  page.once('dialog', dialog => dialog.accept());
  await section.getByRole('button', { name: 'Send next 5 subscribers' }).click();
  await section.getByText('qa.sample@example.com — uncertain', { exact: true }).waitFor();
  assert.equal(sends, 1);
  assert.equal(await section.getByRole('button', { name: 'Send next 5 subscribers' }).isEnabled(), false);
  report.checks.uncertainSendStopsBatch = true;
  await section.screenshot({ path: `${directory}/03-paused-campaign-mobile.png`, animations: 'disabled', style: captureStyle });
  page.once('dialog', dialog => dialog.accept());
  await section.getByRole('button', { name: 'Review complete · resume pending' }).click();
  await section.getByRole('button', { name: 'Send next 5 subscribers' }).waitFor();
  assert.equal(sends, 1); report.checks.resumeDoesNotSend = true;
  state.settings.enabled = false;
  await section.getByRole('button', { name: 'Refresh progress' }).click();
  await section.getByText(/Subscriber sending is disabled/).waitFor();
  assert.equal(await section.getByRole('button', { name: 'Send next 5 subscribers' }).isEnabled(), false);
  report.checks.disabledSendingExplained = true;
  page.once('dialog', dialog => dialog.accept());
  await section.getByRole('button', { name: 'Cancel remaining' }).click();
  await section.getByText('cancelled', { exact: true }).waitFor();
  report.checks.cancelControls = true;
  fail = true;
  await section.getByRole('button', { name: 'Refresh progress' }).click();
  await section.getByRole('alert').waitFor();
  assert.equal(sends, 1); report.checks.networkErrorVisible = true;
  state = { campaign: null, counts: {}, recent: [], settings: { enabled: false, addressConfigured: false, dailyLimit: 100 } };
  await section.getByRole('button', { name: 'Refresh progress' }).click();
  await section.getByText('[Business mailing address — add before sending]', { exact: true }).waitFor();
  assert.equal(await section.getByRole('button', { name: 'Prepare saved issue & audience' }).isEnabled(), false);
  await section.screenshot({ path: `${directory}/04-placeholder-mode-mobile.png`, animations: 'disabled', style: captureStyle });
  report.checks.placeholderPreviewMode = true;
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify(report, null, 2));
}
