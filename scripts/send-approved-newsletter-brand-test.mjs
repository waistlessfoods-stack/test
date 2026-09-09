// One test approved September 9, 2026, to the fixed recipient below.
// Verify deployment first; send with the shared Gmail mailer locally.
// Never broadcasts, changes subscriptions, or retries an SMTP attempt.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, access, writeFile } from 'node:fs/promises';
import React from 'react';
import { render, toPlainText } from '@react-email/render';
import postgres from 'postgres';
import { chromium } from '@playwright/test';
import { sourceLoader } from './lib/load-typescript.mjs';

assert.ok(process.argv.includes('--send-approved-test'), 'Explicit approval flag required');
const recipient = 'zulzdn@gmail.com';
const base = 'https://www.waistlessfoods.com';
const commit = '99301990e0012ac6e6b24f13a002f6d645ef0c02';
const directory = 'docs/audit-screenshots/newsletter-brand-inbox-test-2026-09-09';
const reportPath = `${directory}/send-result.json`;
try { await access(reportPath); throw new Error('An attempt is recorded. Do not resend.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const deployment = JSON.parse(execFileSync('gh', ['api', `repos/waistlessfoods-stack/test/commits/${commit}/status`], { encoding: 'utf8' }));
assert.equal(deployment.statuses.find(status => status.context === 'Vercel')?.state, 'success', 'Wait for Vercel success before sending');
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit);
assert.equal(execFileSync('git', ['diff', 'HEAD', '--', 'lib/email/templates/newsletter-issue-email.tsx'], { encoding: 'utf8' }).trim(), '', 'Local template must match deployed commit');
assert.ok(process.env.Email && process.env.AppPassword && process.env.DATABASE_URL);
const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
assert.ok(secret);
await mkdir(directory, { recursive: true });
const load = sourceLoader({ 'server-only': {} });
const Template = load('lib/email/templates/newsletter-issue-email.tsx').default;
const { createNewsletterUnsubscribeUrl } = load('lib/newsletter-unsubscribe.ts');
const { sendEmail } = load('lib/email/mailer.ts');
const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
const browser = await chromium.launch();
const report = {
  checkedAt: new Date().toISOString(), recipient: 'zul***@gmail.com', commit,
  deployment: deployment.statuses.find(status => status.context === 'Vercel').target_url,
  status: 'not_attempted', broadcast: false, subscriptionChanges: false,
  sendMethod: 'Shared Gmail mailer invoked locally using the template from the successful Vercel deployment commit', checks: {},
};
try {
  const context = await browser.newContext({ viewport: { width: 800, height: 1050 } });
  const payload = `${Date.now() + 600000}.${randomBytes(16).toString('hex')}`;
  const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
  await context.addCookies([{ name: 'wlf_admin_session', value: token, url: base, secure: true, httpOnly: true, sameSite: 'Lax' }]);
  const list = await context.request.get(`${base}/api/admin/newsletters`);
  assert.equal(list.status(), 200);
  const { issues } = await list.json();
  if (issues.length) {
    const live = await context.request.get(`${base}/api/admin/newsletters/${issues[0].id}?format=email`);
    assert.equal(live.status(), 200);
    const liveHtml = await live.text();
    for (const marker of [`${base}/logo.png`, 'newsletter-masthead', 'prefers-color-scheme: dark', 'A NOTE FROM THE TABLE', 'PREVIEW ONLY']) {
      assert.ok(liveHtml.includes(marker), `Deployed template missing ${marker}`);
    }
    report.checks.deployedBrandedTemplate = true;
  } else {
    report.checks.deployedBrandedTemplate = 'No saved issues for live preview; verified Vercel success for the exact unchanged local template commit instead.';
  }
  const [subscriber] = await sql`SELECT id, active FROM subscribers WHERE lower(trim(email))=${recipient} ORDER BY id LIMIT 1`;
  assert.ok(subscriber, 'Use the existing test recipient only; do not create or modify subscriptions');
  const unsubscribeUrl = createNewsletterUnsubscribeUrl({ subscriberId: subscriber.id, email: recipient, siteUrl: base });
  const oneClick = new URL(unsubscribeUrl); oneClick.pathname = '/api/newsletter/one-click';
  const subject = '[TEST] WaistLess Foods — updated logo & newsletter design';
  const issue = {
    title: 'A fresh look for The WaistLess Table', subject,
    previewText: 'Your requested test of our updated logo, colors, and newsletter layout.',
    body: 'Hello! Here is the updated WaistLess Foods newsletter design you asked to see.\n\nThe header now includes the website’s logo, with our teal and warm-cream colors, clearer headings, and more comfortable spacing on your phone.\n\nPlease check that the logo appears and the text and button are easy to read in both light and dark mode.\n\nThis is a single test for you, not a subscriber broadcast. No payment, booking, or subscription change is involved.',
    ctaLabel: 'Visit WaistLess Foods', ctaUrl: base,
  };
  const html = (await render(React.createElement(Template, { issue, campaign: { unsubscribeUrl, mailingAddress: '' } })))
    .replace('You received this newsletter because you subscribed to WaistLess Foods.', 'You received this one-time test because you requested it. Your subscription preferences were not enabled by this test.');
  assert.ok(html.includes(`${base}/logo.png`) && html.includes('Unsubscribe from newsletters'));
  const page = await context.newPage();
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const [device, width] of [['desktop', 800], ['mobile', 390]]) {
      await page.setViewportSize({ width, height: 1050 });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${directory}/${device}-${scheme}.png`, fullPage: true });
    }
  }
  report.checks.logoLoadedAndFourBrowserPreviews = true;
  assert.equal((await context.request.get(base)).status(), 200);
  report.checks.websiteLinkOpens = true;
  await page.goto(unsubscribeUrl);
  await page.getByRole('button', { name: 'Unsubscribe me', exact: true }).waitFor();
  // Read-only: do not click or POST an opt-out for the existing recipient.
  report.checks.unsubscribePageOpensWithoutSubmitting = true;
  const [after] = await sql`SELECT active FROM subscribers WHERE id=${subscriber.id}`;
  assert.equal(after.active, subscriber.active);
  report.subject = subject;
  report.status = 'smtp_attempt_started';
  await writeFile(reportPath, JSON.stringify(report, null, 2), { flag: 'wx' });
  const result = await sendEmail({ to: recipient, subject, html, text: toPlainText(html), headers: { 'List-Unsubscribe': `<${oneClick.href}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
  if (result.error || !result.data?.id) {
    report.status = 'smtp_outcome_uncertain';
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    throw new Error('SMTP outcome uncertain. Do not retry; ask recipient first.');
  }
  report.status = 'accepted_by_gmail';
  report.messageId = result.data.id;
  report.inboxDelivery = 'Requires recipient confirmation; browser previews are not inbox screenshots.';
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await sql.end();
}
