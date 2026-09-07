// Read-only public booking check. Never submits a lead or books an appointment.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'docs/audit-screenshots/consultation-readiness-2026-09-07';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, timezoneId: 'Asia/Makassar' });
  await page.goto('https://waistlessfoods.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const consultation = page.getByRole('button', { name: 'Complimentary Consultation', exact: true });
  assert.ok(await consultation.count(), 'Live consultation button is present');
  {
    await consultation.first().click();
    await page.screenshot({ path: `${output}/01-website-consultation.png`, fullPage: true });
    let intercepted = false;
    // Only the response is simulated; this exercises the deployed client redirect.
    // No lead, mail, or appointment is created.
    await page.route('**/api/bookings', async route => {
      intercepted = true;
      assert.equal(route.request().postDataJSON().serviceSlug, 'complimentary-consultation');
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ confirmationEmailSent: true }) });
    });
    for (const [label, value] of [
      ['First name', 'QA'], ['Last name', 'Read-only preview'],
      ['Email', 'qa@example.com'], ['Phone', '2025550100'],
      ['Expected guests', '4'], ['Budget range', '$500'],
      ['Preferred event date', '2026-12-01'],
      ['Event details', 'Browser-only QA. Submission intercepted; no event requested.'],
    ]) await page.getByRole('dialog').getByLabel(label, { exact: false }).fill(value);
    await page.getByRole('button', { name: 'Send request and schedule', exact: true }).click();
    await page.waitForURL(url => url.hostname === 'calendar.google.com' || url.hostname === 'calendar.app.google', { timeout: 30000 });
    assert.equal(intercepted, true, 'Website POST was intercepted, not sent');
    console.log('PASS: Deployed client redirects to Google after a simulated successful lead response.');
  }
  await page.waitForTimeout(4000);
  assert.match(await page.locator('body').innerText(), /WaistLess Foods Complimentary Consultation/);
  assert.match(await page.locator('body').innerText(), /30 min appointments/);
  await page.screenshot({ path: `${output}/02-google-schedule.png`, fullPage: true });
  await page.getByRole('button', { name: /^\d{1,2}:\d{2}(am|pm)$/ }).first().click();
  await page.getByRole('button', { name: 'Book', exact: true }).waitFor();
  for (const name of ['Event Details', 'Event Date(s)', 'Budget Range']) {
    const field = page.getByRole('textbox', { name, exact: true });
    assert.equal(await field.count(), 1, `${name} must be present`);
    assert.equal(await field.evaluate(el => el.required || el.getAttribute('aria-required') === 'true'), true, `${name} must be required`);
  }
  await page.screenshot({ path: `${output}/03-google-required-questions.png`, fullPage: true });
  console.log('PASS: Google duration and three required questions. No appointment submitted.');
  await writeFile(`${output}/results.json`, JSON.stringify({
    checkedAt: new Date().toISOString(),
    liveSite: 'https://waistlessfoods.com',
    checks: { liveFormOpens: true, clientRedirectWithMockedLeadResponse: true, correctGoogleSchedule: true, thirtyMinuteAppointments: true, threeRequiredQuestions: true },
    mutations: 'none; website lead POST intercepted in browser; Google Book button never clicked',
    notVerified: ['Actual lead persistence and email delivery in this run', 'Google appointment creation', 'Calendar invitation and Meet link', 'Test cancellation'],
  }, null, 2));
} finally {
  await browser.close();
}
