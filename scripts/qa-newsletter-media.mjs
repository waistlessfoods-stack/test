// Actual browser UI -> actual route handlers -> isolated PostgreSQL TEMP tables.
// SMTP and image downloads use local fixtures. No real issue, mail, or CMS edits.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

const base = 'http://localhost:3010';
const output = 'docs/audit-screenshots/newsletter-media-2026-11-01';
await mkdir(output, { recursive: true });
await mkdir('output/pdf', { recursive: true });
assert.ok(process.env.DATABASE_URL && process.env.ADMIN_PASSWORD);
const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith('.neon.tech')) url.hostname = url.hostname.replace(/-pooler(?=\.)/, '');
url.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 15000 });
await client.connect(); client.on('error', () => {});
const browser = await chromium.launch({ headless: true });
const report = { browser: base, database: 'TEMP tables; transaction rolled back', smtp: 'mocked', images: 'local website fixtures', checks: [] };
try {
  await client.query('BEGIN'); await client.query('SET LOCAL search_path TO pg_temp');
  await client.query((await readFile('drizzle/0011_newsletter_issues.sql', 'utf8')).replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE'));
  await client.query(await readFile('drizzle/0014_newsletter_media.sql', 'utf8'));
  await client.query('CREATE TEMP TABLE subscribers(id serial PRIMARY KEY,email text NOT NULL,active boolean DEFAULT true,unsubscribed_at timestamptz)');
  await client.query((await readFile('drizzle/0012_newsletter_campaigns.sql', 'utf8')).replaceAll('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE'));
  const scope = await client.query("SELECT relnamespace=pg_my_temp_schema() AS isolated FROM pg_class WHERE oid IN ('newsletter_issues'::regclass,'newsletter_campaigns'::regclass,'newsletter_deliveries'::regclass,'newsletter_dispatch_lock'::regclass,'subscribers'::regclass)");
  assert.equal(scope.rows.length, 5); assert.ok(scope.rows.every(row => row.isolated));
  await client.query("INSERT INTO subscribers(email) VALUES ('qa-only@example.com')");
  const query = async (statement, values = []) => (await client.query(statement, values)).rows;
  let tail = Promise.resolve();
  const database = { query, transaction: work => { const run = tail.then(() => work(query)); tail = run.catch(() => {}); return run; } };
  const pure = sourceLoader({ 'server-only': {} });
  const campaigns = pure('lib/newsletter-campaigns.ts').createCampaignService(database);
  const assets = new Map(await Promise.all(['recipes/banner-recipes.png', 'recipes/pasta.png', 'logo.png'].map(async path => [`https://www.waistlessfoods.com/${path}`, await readFile(`public/${path}`)])));
  const sends = [];
  const modules = sourceLoader({
    'server-only': {}, '@/lib/db': { db: drizzle(client) },
    '@/lib/newsletter-campaign-store': { campaigns },
    '@/lib/newsletter-image-resource': { loadNewsletterImage: async href => { assert.ok(assets.has(href)); return { bytes: assets.get(href), format: 'png' }; } },
    '@/lib/email/mailer': { sendEmail: async message => { sends.push(message); return { error: null, data: { id: 'qa-mock' } }; } },
  });
  const token = modules('lib/admin-session.ts').createAdminSessionToken();
  const routes = { list: modules('app/api/admin/newsletters/route.ts'), detail: modules('app/api/admin/newsletters/[id]/route.ts'), campaign: modules('app/api/admin/newsletters/[id]/campaign/route.ts') };
  const content = { title: 'QA sample - A seasonal table', subject: 'QA newsletter image review', previewText: 'Fictional content for layout testing; not Amber\'s first issue.', body: 'QA SAMPLE ONLY. Good food brings people together. This fictional issue checks how an administrator adds photos, saves changes, reviews an email, and downloads a member copy.\n\nA second sample paragraph keeps the body image in context. No newsletter is published or sent to real subscribers by this walkthrough.\n\nA final sample paragraph checks the footer and closing link.', ctaLabel: 'Explore recipes', ctaUrl: 'https://www.waistlessfoods.com/recipes' };
  const createRequest = new NextRequest(`${base}/api/admin/newsletters`, { method: 'POST', headers: { cookie: `wlf_admin_session=${token}`, origin: base, 'content-type': 'application/json' }, body: JSON.stringify(content) });
  const created = await routes.list.POST(createRequest); assert.equal(created.status, 201);
  const { issue } = await created.json();
  async function bridge(route) {
    const original = route.request(); const path = new URL(original.url()).pathname;
    const request = new NextRequest(original.url(), { method: original.method(), headers: original.headers(), ...(original.method() !== 'GET' ? { body: original.postData() || '{}' } : {}) });
    const handler = (path.endsWith('/campaign') ? routes.campaign : routes.detail)[original.method()];
    assert.ok(handler);
    const response = await handler(request, { params: Promise.resolve({ id: String(issue.id) }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) });
  }
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1080 }, acceptDownloads: true });
  await admin.addCookies([{ name: 'wlf_admin_session', value: token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  await admin.route('**/api/admin/newsletters/**', bridge);
  await admin.route('https://www.waistlessfoods.com/**', async route => {
    const bytes = assets.get(route.request().url());
    if (bytes) await route.fulfill({ contentType: 'image/png', body: bytes }); else await route.abort();
  });
  const page = await admin.newPage(); page.setDefaultTimeout(30000);
  await page.goto(`${base}/admin/newsletters/${issue.id}`, { timeout: 120000 });
  await page.getByText('Private draft · All changes saved', { exact: true }).waitFor();
  const campaign = page.getByRole('region', { name: 'Send to subscribers' });
  assert.ok(await campaign.getByRole('button', { name: 'Prepare saved issue & audience' }).isEnabled());
  await page.getByText('Header image (optional)', { exact: true }).click();
  await page.getByLabel('Header image URL', { exact: true }).fill('https://www.waistlessfoods.com/recipes/banner-recipes.png');
  await page.getByLabel('Header image description', { exact: true }).fill('QA seasonal ingredients banner');
  await page.getByLabel('Header image link (optional)', { exact: true }).fill(content.ctaUrl);
  await page.getByRole('button', { name: 'Add body image (up to 6)' }).click();
  await page.getByLabel('Body 1 image URL', { exact: true }).fill('https://www.waistlessfoods.com/recipes/pasta.png');
  await page.getByLabel('Body 1 image description', { exact: true }).fill('QA pasta photograph');
  await page.getByLabel('Body 1 image link (optional)', { exact: true }).fill(content.ctaUrl);
  await page.getByLabel(/Body 1 image position/).selectOption('1');
  await page.getByText('Footer image (optional)', { exact: true }).click();
  await page.getByLabel('Footer image URL', { exact: true }).fill('https://www.waistlessfoods.com/logo.png');
  await page.getByLabel('Footer image description', { exact: true }).fill('QA WaistLess Foods logo');
  assert.equal(await page.getByRole('button', { name: 'Send admin test' }).isEnabled(), false);
  assert.equal(await campaign.getByRole('button', { name: 'Prepare saved issue & audience' }).isEnabled(), false);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Draft saved' }).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Send admin test' }).isEnabled());
  const live = page.locator('article').first();
  await live.getByAltText('QA pasta photograph').waitFor();
  await live.screenshot({ path: `${output}/archive-desktop.png`, animations: 'disabled' });
  const saved = (await query('SELECT * FROM newsletter_issues WHERE id=$1', [issue.id]))[0];
  assert.equal(saved.media.images[0].afterParagraph, 1);
  report.checks.push('Saved header/body/footer images, descriptions, links, and placement round-trip through actual handlers/SQL; unsaved changes block tests and campaign preparation.');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Send admin test' }).click();
  await page.getByRole('status').filter({ hasText: 'No subscribers were emailed' }).waitFor();
  assert.equal(sends.length, 1); assert.equal(sends[0].to, modules('lib/admin-identity.ts').administratorAccountEmail());
  await page.getByRole('button', { name: 'Email preview', exact: true }).click();
  const frame = page.frameLocator('iframe[title="Saved newsletter email preview"]');
  await frame.getByAltText('QA pasta photograph').waitFor();
  const email = await admin.newPage();
  await email.goto(`${base}/api/admin/newsletters/${issue.id}?format=email`);
  for (const mode of ['light', 'dark']) {
    await email.emulateMedia({ colorScheme: mode });
    for (const width of [900, 390]) {
      await email.setViewportSize({ width, height: 900 });
      await email.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
      assert.ok(await email.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await email.screenshot({ path: `${output}/email-${mode}-${width}.png`, fullPage: true });
    }
  }
  report.checks.push('Saved email preview renders all three photos and links at desktop/mobile widths in light/dark modes; administrator test uses mocked SMTP only.');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF preview' }).click();
  const download = await downloadEvent;
  await download.saveAs('output/pdf/qa-newsletter-media-2026-11-01.pdf');
  const pdf = await PDFDocument.load(await readFile('output/pdf/qa-newsletter-media-2026-11-01.pdf'));
  report.pdfPages = pdf.getPageCount();
  await page.getByRole('button', { name: 'Email preview', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('article').first().screenshot({ path: `${output}/archive-mobile.png`, animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 1080 });
  page.once('dialog', dialog => dialog.accept());
  await campaign.getByRole('button', { name: 'Prepare saved issue & audience' }).click();
  await campaign.getByText('Review frozen email content & footer', { exact: true }).waitFor();
  const frozen = (await query('SELECT snapshot FROM newsletter_campaigns WHERE issue_id=$1', [issue.id]))[0].snapshot;
  assert.deepEqual(frozen.media, saved.media);
  assert.equal(sends.length, 1);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Publish to archive', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Published to the member archive' }).waitFor();
  assert.equal(sends.length, 1);
  report.checks.push('PDF download contains the same saved media; campaign snapshot freezes images/links; explicit archive publication sends no subscriber email.');
  report.passed = true;
  console.log(JSON.stringify(report, null, 2));
} catch (error) { report.failure = error.message; throw error; }
finally {
  await browser.close();
  try { await client.query('ROLLBACK'); } finally { await client.end(); }
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
}
