// Read-only browser checks against the local production build and published CMS.
// No account, order, recipe, or publication mutations.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { sourceLoader } from './lib/load-typescript.mjs';

const base = 'http://localhost:3010';
const output = 'docs/audit-screenshots/recipe-administration-2026-11-01';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { browser: base, mutations: 'none', checks: [] };
try {
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const load = sourceLoader({ 'server-only': {} });
  await admin.addCookies([{ name: 'wlf_admin_session', value: load('lib/admin-session.ts').createAdminSessionToken(), url: base, httpOnly: true, sameSite: 'Lax' }]);
  await admin.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
  const page = await admin.newPage(); page.setDefaultTimeout(30000);
  await page.goto(base + '/admin/recipes', { timeout: 120000 });
  await page.getByRole('heading', { name: 'Paid Recipe Management', exact: true }).waitFor();
  const preview = page.getByRole('link', { name: 'Preview', exact: true }).first();
  const previewPath = await preview.getAttribute('href'); assert.ok(previewPath);
  const slug = previewPath.split('/').at(-1);
  for (const href of await page.getByRole('link', { name: /Edit recipe in Contentful/ }).evaluateAll(links => links.map(link => link.href))) {
    const url = new URL(href); assert.equal(url.hostname, 'app.contentful.com'); assert.equal(url.search, ''); assert.ok(url.pathname.includes('/environments/master/entries/'));
  }
  await page.screenshot({ path: `${output}/admin-recipes-desktop.png`, fullPage: true });
  await preview.click();
  await page.getByRole('heading', { name: 'Ingredients', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Instructions', exact: true }).waitFor();
  await page.getByRole('link', { name: /Edit in Contentful/ }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${output}/admin-full-recipe-mobile.png`, fullPage: true });
  await page.goto(`${base}/recipes/detail/${slug}/full`, { timeout: 120000 });
  await page.getByRole('heading', { name: 'Ingredients', exact: true }).waitFor();
  report.checks.push('Signed administrator session sees the complete paid recipe in both admin and storefront full views without an order; CMS edit links point to the existing master entry without credentials; mobile layout fits.');
  const visitor = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  await visitor.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
  const publicPage = await visitor.newPage();
  await publicPage.goto(`${base}/recipes/detail/${slug}/full`, { timeout: 120000 });
  assert.equal(new URL(publicPage.url()).pathname, `/recipes/detail/${slug}`);
  assert.equal(await publicPage.getByRole('heading', { name: 'Ingredients', exact: true }).count(), 0);
  for (const path of ['/recipes', '/shop', `/recipes/detail/${slug}`, `/shop/${slug}`]) {
    const response = await visitor.request.get(base + path);
    assert.equal(response.status(), 200);
    const html = await response.text();
    for (const name of ['ingredientsRichText', 'instructionsRichText', 'instructionSteps', 'toolsRichText', 'ingredientsImagePath']) assert.ok(!html.includes(`\\"${name}\\":`), `${path} exposes protected serialized field ${name}`);
  }
  await publicPage.screenshot({ path: `${output}/public-paid-recipe-preview.png`, fullPage: true });
  // The existing admin layout presents its sign-in gate at the requested URL.
  // Verify the rendered gate and absent recipe content rather than HTTP alone.
  await publicPage.goto(base + previewPath);
  await publicPage.getByRole('heading', { name: 'Admin Portal', exact: true }).waitFor();
  await publicPage.getByText('Sign in with your administrator account to continue', { exact: true }).waitFor();
  assert.equal(await publicPage.getByRole('heading', { name: 'Ingredients', exact: true }).count(), 0);
  report.checks.push('Anonymous full view redirects to the purchase preview; admin preview shows the existing admin sign-in gate; public recipe/shop HTML contains no protected recipe fields. Purchaser authorization remains covered by route tests.');
  report.paidRecipeSlug = slug; report.passed = true;
  console.log(JSON.stringify(report, null, 2));
} catch (error) { report.failure = error.message; throw error; }
finally { await browser.close(); await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2)); }
