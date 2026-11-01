// Read-only local browser verification. Does not submit inquiries or send mail.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = 'http://localhost:3010';
const output = 'docs/audit-screenshots/meeting-fixes-2026-11-01';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
// The existing client-side launch preview gate is left enabled in the app.
await page.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
page.setDefaultTimeout(60000);
const checks = [];
try {
  for (const slug of ['private', 'catering', 'cooking-classes']) {
    await page.goto(`${base}/services/${slug}/book`, { timeout: 120000 });
    await page.getByRole('heading', { level: 1, name: /^Request / }).waitFor();
    assert.ok(await page.getByText("Tell us about your special occasion! We'll review your request and contact you regarding availability and next steps.", { exact: true }).isVisible());
    assert.ok(await page.getByText('Please note: Your date is not confirmed until the agreement is signed and payment is received.', { exact: true }).isVisible());
    const expectedPlaceholder = slug === 'cooking-classes'
      ? 'Tell us about your preferred date, number of participants, cooking interests, skill levels, or any other details that will help us tailor the class to your group.'
      : 'Tell us about the occasion, menu ideas, location, or any other details that will help us better understand your event and preferences.';
    assert.ok(await page.getByPlaceholder(expectedPlaceholder, { exact: true }).isVisible());
    const guests = page.getByLabel('Expected Number of Guests');
    for (const count of [1, 10, 49, 50, 51]) {
      await guests.fill(String(count));
      await guests.focus();
      await guests.press('ControlOrMeta+A');
      const style = await guests.evaluate(input => ({
        background: getComputedStyle(input).backgroundColor,
        color: getComputedStyle(input).color,
        selection: getComputedStyle(input, '::selection').backgroundColor,
        selectionColor: getComputedStyle(input, '::selection').color,
        textFill: getComputedStyle(input).webkitTextFillColor,
        valid: input.checkValidity(),
      }));
      assert.equal(style.background, 'rgb(244, 244, 244)');
      assert.equal(style.color, 'rgb(0, 0, 0)');
      assert.equal(style.textFill, 'rgb(0, 0, 0)');
      assert.equal(style.selection, 'rgb(220, 235, 234)');
      assert.equal(style.selectionColor, 'rgb(0, 0, 0)');
      assert.equal(style.valid, count <= 50);
    }
    await guests.fill('49');
    await page.getByRole('button', { name: 'Increase guest count' }).click();
    assert.equal(await guests.inputValue(), '50');
    assert.equal(await page.getByRole('button', { name: 'Increase guest count' }).isDisabled(), true);
    await guests.fill('1');
    assert.equal(await page.getByRole('button', { name: 'Decrease guest count' }).isDisabled(), true);
    await guests.fill('24');
    await guests.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${slug}-desktop.png`, animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });
    await guests.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/${slug}-mobile.png`, animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 1080 });
    checks.push(`${slug}: approved form copy, guest-count styles at 1/10/49/50/51, keyboard/button bounds, 390px layout`);
    await page.goto(`${base}/services/${slug}`, { timeout: 120000 });
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await page.getByText(/Starting at:|\$\d.*per (person|event)/i).count(), 0);
    checks.push(`${slug}: standard service price hidden`);
  }
  await page.goto(`${base}/admin`, { timeout: 120000 });
  await page.getByRole('button', { name: 'Sign in to your account', exact: true }).waitFor();
  checks.push('Admin entry offers account sign-in alongside existing password access');
  console.log(JSON.stringify({ base, checks, noSubmissionsOrEmails: true }, null, 2));
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify({ base, checks, noSubmissionsOrEmails: true }, null, 2));
}
