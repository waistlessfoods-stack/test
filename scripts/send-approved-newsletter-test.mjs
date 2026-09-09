// One user-approved test only. Does not prepare/broadcast a subscriber campaign.
// Never rerun after an SMTP attempt without a new explicit approval.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { mkdir, access, writeFile } from 'node:fs/promises';
import React from 'react';
import { render, toPlainText } from '@react-email/render';
import postgres from 'postgres';
import { chromium } from '@playwright/test';
import { sourceLoader } from './lib/load-typescript.mjs';

assert.ok(process.argv.includes('--send-approved-test'), 'Explicit approved-test flag required.');
const recipient = 'zulzdn@gmail.com'; // Exact address approved by the user.
const directory = 'docs/audit-screenshots/newsletter-inbox-test-2026-09-08';
const reportPath = `${directory}/send-result.json`;
try { await access(reportPath); throw new Error('A test attempt is already recorded. Do not resend automatically.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
assert.ok(process.env.Email && process.env.AppPassword && process.env.DATABASE_URL, 'Required server configuration is missing.');
await mkdir(directory, { recursive: true });
const load = sourceLoader({ 'server-only': {} });
const Email = load('lib/email/templates/newsletter-issue-email.tsx').default;
const { createNewsletterUnsubscribeUrl } = load('lib/newsletter-unsubscribe.ts');
const { sendEmail } = load('lib/email/mailer.ts');
const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
const browser = await chromium.launch({ headless: true });
const report = { checkedAt: new Date().toISOString(), recipient: 'zul***@gmail.com', status: 'not_attempted', broadcast: false, checks: {} };
try {
  let [subscriber] = await sql`SELECT id, active FROM subscribers WHERE lower(trim(email))=${recipient} ORDER BY id LIMIT 1`;
  let insertedInactiveTest = false;
  if (!subscriber) {
    [subscriber] = await sql`INSERT INTO subscribers(email, active, unsubscribed_at) VALUES (${recipient}, false, now()) ON CONFLICT (email) DO NOTHING RETURNING id, active`;
    insertedInactiveTest = !!subscriber;
    if (!subscriber) [subscriber] = await sql`SELECT id, active FROM subscribers WHERE email=${recipient}`;
  }
  assert.ok(subscriber);
  report.subscriberHandling = insertedInactiveTest ? 'Created inactive record solely for a working test unsubscribe link. It is not eligible for campaigns.' : 'Existing subscription status left unchanged.';
  const unsubscribeUrl = createNewsletterUnsubscribeUrl({ subscriberId: subscriber.id, email: recipient, siteUrl: 'https://www.waistlessfoods.com' });
  const oneClick = new URL(unsubscribeUrl); oneClick.pathname = '/api/newsletter/one-click';
  const subject = '[TEST] WaistLess Foods newsletter — inbox check';
  const issue = {
    title: '[TEST] A note from The WaistLess Table', subject,
    previewText: 'Your requested one-time newsletter test. No action or payment is required.',
    body: 'Hello! This is the single newsletter test you requested for zulzdn@gmail.com. It is not a subscriber broadcast.\n\nPlease check whether this message arrived in your inbox or spam folder, whether the text is readable on your phone, and whether the website button opens correctly.\n\nThe layout uses the website’s newsletter template. This test does not add you to the active marketing list. No payment or event booking is involved.',
    ctaLabel: 'Open WaistLess Foods', ctaUrl: 'https://www.waistlessfoods.com/',
  };
  // Same campaign layout, with truthful one-time-test copy in the footer.
  const html = (await render(React.createElement(Email, { issue, campaign: { unsubscribeUrl, mailingAddress: '' } })))
    .replace('You received this newsletter because you subscribed to WaistLess Foods.', 'You received this one-time test because you requested it. Your subscription preferences were not enabled by this test.');
  assert.ok(html.includes('[TEST]') && html.includes('Unsubscribe from newsletters'));
  assert.ok(!html.includes('add before sending'));
  const page = await browser.newPage({ viewport: { width: 760, height: 1050 } });
  await page.setContent(html);
  await page.screenshot({ path: `${directory}/rendered-email-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${directory}/rendered-email-mobile.png`, fullPage: true });
  const cta = await page.request.get(issue.ctaUrl); assert.equal(cta.status(), 200);
  await page.goto(unsubscribeUrl);
  await page.getByRole('button', { name: 'Unsubscribe me', exact: true }).waitFor();
  report.checks.unsubscribePageOpens = true;
  if (insertedInactiveTest) {
    const response = await page.request.post(oneClick.href, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, data: 'List-Unsubscribe=One-Click' });
    assert.equal(response.status(), 200);
    const [current] = await sql`SELECT active FROM subscribers WHERE id=${subscriber.id} AND email=${recipient}`;
    assert.equal(current.active, false);
    report.checks.signedOptOutEndpointAcceptsTestLink = true;
  }
  report.checks.renderAndMobileLayout = true;
  report.checks.websiteLinkOpens = true;
  report.subject = subject;
  report.status = 'smtp_attempt_started';
  // A durable marker prevents accidental duplicate sends after interruption.
  await writeFile(reportPath, JSON.stringify(report, null, 2), { flag: 'wx' });
  const result = await sendEmail({ to: recipient, subject, html, text: toPlainText(html), headers: { 'List-Unsubscribe': `<${oneClick.href}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
  if (result.error || !result.data?.id) {
    report.status = 'smtp_outcome_uncertain';
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    throw new Error('SMTP failed or was uncertain. Do not retry automatically; ask the recipient first.');
  }
  report.status = 'accepted_by_gmail';
  report.messageId = result.data.id;
  report.inboxDelivery = 'Requires recipient confirmation; no access to this personal Gmail inbox.';
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); await sql.end(); }
