// Unit tests always run. --integration adds real SQL against temporary tables
// on a direct connection inside a rollback transaction. No emails are sent.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { render } from '@react-email/render';
import { PDFDocument } from 'pdf-lib';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

const load = sourceLoader({ 'server-only': {} });
const { parseNewsletterContent, assertNewsletterReady, csvCell, parsePositiveInteger } = load('lib/newsletter-content.ts');
const { createNewsletterPdf } = load('lib/newsletter-pdf.ts');
const content = { title: 'Seasonal notes', subject: 'A seat at The WaistLess Table', previewText: 'A little inspiration for your kitchen.', body: 'An original newsletter prepared by Chef Amber.\n\nEnjoy a thoughtful meal with less waste and more flavor.', ctaLabel: 'Read the recipes', ctaUrl: 'https://www.waistlessfoods.com/recipes' };

test('content validation preserves plain text and rejects unsafe input', () => {
  assert.deepEqual(parseNewsletterContent(content), content);
  for (const ctaUrl of ['javascript:alert(1)', 'http://example.com', 'https://user:password@example.com', 'data:text/html,bad']) assert.throws(() => parseNewsletterContent({ ...content, ctaUrl }));
  assert.throws(() => parseNewsletterContent({ ...content, subject: 'Subject\nBcc: bad@example.com' }));
  assert.throws(() => parseNewsletterContent({ ...content, body: 'x'.repeat(20001) }));
  assert.throws(() => parseNewsletterContent({ ...content, title: '' }));
  assert.throws(() => parseNewsletterContent({ ...content, ctaLabel: '' }));
  assert.throws(() => assertNewsletterReady({ ...content, body: '' }));
  for (const id of [0, -1, '1oops', 1.5, true, null, 2147483648]) assert.throws(() => parsePositiveInteger(id));
});
test('email template escapes content and clearly labels administrator-only preview', async () => {
  const Template = load('lib/email/templates/newsletter-issue-email.tsx').default;
  const html = await render(React.createElement(Template, { issue: { ...content, body: '<script>danger()</script> & delicious food' } }));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('PREVIEW ONLY'));
  assert.ok(html.includes('Broadcast sending is not enabled'));
});
test('PDF is downloadable, paginated, and supports long unbroken words', async () => {
  const short = await PDFDocument.load(await createNewsletterPdf(content));
  assert.equal(short.getPages().length, 1);
  assert.equal(short.getTitle(), content.title);
  const long = await PDFDocument.load(await createNewsletterPdf({ ...content, body: ('Seasonal meal ideas. '.repeat(20) + '\n\n').repeat(35) + 'A'.repeat(650) }));
  assert.ok(long.getPages().length > 2);
  for (const page of long.getPages()) assert.deepEqual(page.getSize(), { width: 612, height: 792 });
  await assert.rejects(() => createNewsletterPdf({ ...content, body: 'Unsupported emoji: 🌿' }), /cannot render/);
});
test('CSV cells are escaped and spreadsheet formulas are neutralized', () => {
  assert.equal(csvCell('normal@example.com'), '"normal@example.com"');
  assert.equal(csvCell('a"b'), '"a""b"');
  for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', '  =1']) assert.ok(csvCell(value).startsWith('"\''));
});

test('newsletter APIs, authorization, publication and subscriber controls', { skip: !process.argv.includes('--integration') && 'Pass --integration with DATABASE_URL' }, async t => {
  assert.ok(process.env.DATABASE_URL && process.env.ADMIN_PASSWORD);
  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (databaseUrl.hostname.endsWith('.neon.tech')) databaseUrl.hostname = databaseUrl.hostname.replace(/-pooler(?=\.)/, '');
  databaseUrl.searchParams.set('sslmode', 'verify-full');
  const client = new pg.Client({ connectionString: databaseUrl.href });
  await client.connect();
  t.after(async () => { try { await client.query('ROLLBACK'); } finally { await client.end(); } });
  await client.query('BEGIN');
  await client.query('SET LOCAL search_path TO pg_temp');
  const migration = await readFile(new URL('../drizzle/0011_newsletter_issues.sql', import.meta.url), 'utf8');
  await client.query(migration.replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE'));
  await client.query('CREATE TEMP TABLE subscribers (id serial primary key, email text not null unique, active boolean not null default true, created_at timestamp not null default now(), updated_at timestamp not null default now(), unsubscribed_at timestamp)');
  const { rows: tables } = await client.query("SELECT relname, relnamespace = pg_my_temp_schema() AS isolated FROM pg_class WHERE oid IN ('newsletter_issues'::regclass, 'subscribers'::regclass)");
  assert.equal(tables.length, 2);
  assert.ok(tables.every(table => table.isolated));
  let userId = null;
  let sendFailure = false;
  const sends = [];
  const modules = sourceLoader({
    'server-only': {},
    '@/lib/db': { db: drizzle(client) },
    '@clerk/nextjs/server': { auth: async () => ({ userId }) },
    '@/lib/email/mailer': { fromEmail: 'sender@example.com', sendEmail: async message => {
      if (sendFailure) return { error: { message: 'Simulated SMTP failure' }, data: null };
      sends.push(message); return { data: { id: 'test' }, error: null };
    } },
  });
  const token = modules('lib/admin-session.ts').createAdminSessionToken();
  const list = modules('app/api/admin/newsletters/route.ts');
  const detail = modules('app/api/admin/newsletters/[id]/route.ts');
  const subscribers = modules('app/api/admin/newsletter-subscribers/route.ts');
  const download = modules('app/api/newsletters/[id]/download/route.ts');
  function request(url, method = 'GET', body, { admin = true, origin = 'https://qa.example.com' } = {}) {
    return new NextRequest(`https://qa.example.com${url}`, { method, headers: { ...(admin ? { cookie: `wlf_admin_session=${token}` } : {}), origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  }
  const context = id => ({ params: Promise.resolve({ id: String(id) }) });
  async function create() {
    const response = await list.POST(request('/api/admin/newsletters', 'POST', { ...content, status: 'published' }));
    assert.equal(response.status, 201);
    return (await response.json()).issue;
  }
  const patch = (issue, changes) => detail.PATCH(request(`/api/admin/newsletters/${issue.id}`, 'PATCH', { ...issue, ...changes }), context(issue.id));

  await t.test('anonymous admin APIs are rejected, including previews and exports', async () => {
    for (const [route, url] of [[list, '/api/admin/newsletters'], [detail, '/api/admin/newsletters/1?format=email'], [subscribers, '/api/admin/newsletter-subscribers?format=csv']]) {
      assert.equal((await route.GET(request(url, 'GET', null, { admin: false }), context(1))).status, 401);
    }
    assert.equal((await list.POST(request('/api/admin/newsletters', 'POST', content, { admin: false }))).status, 401);
  });
  await t.test('cross-origin admin mutations are rejected', async () => {
    assert.equal((await list.POST(request('/api/admin/newsletters', 'POST', content, { origin: 'https://untrusted.example.com' }))).status, 403);
  });
  await t.test('new issues are private drafts and no delivery occurs on creation', async () => {
    const issue = await create();
    assert.equal(issue.status, 'draft');
    assert.equal(issue.publishedAt, null);
    assert.equal(sends.length, 0);
    const response = await list.GET(request('/api/admin/newsletters'));
    assert.equal((await response.json()).broadcastEnabled, false);
  });
  await t.test('stale concurrent saves cannot overwrite newer changes', async () => {
    const issue = await create();
    const responses = await Promise.all([patch(issue, { title: 'First edit' }), patch(issue, { title: 'Second edit' })]);
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  });
  await t.test('archive downloads require membership and publication; unpublishing revokes access', async () => {
    const issue = await create();
    userId = null;
    assert.equal((await download.GET(request('/download'), context(issue.id))).status, 401);
    userId = 'qa-member';
    assert.equal((await download.GET(request('/download'), context(issue.id))).status, 404);
    const published = await patch(issue, { status: 'published' });
    assert.equal(published.status, 200);
    const current = (await published.json()).issue;
    assert.ok(current.publishedAt);
    const pdf = await download.GET(request('/download'), context(issue.id));
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('cache-control'), 'private, no-store');
    assert.match(pdf.headers.get('content-disposition'), /attachment/);
    assert.equal((await PDFDocument.load(await pdf.arrayBuffer())).getPages().length, 1);
    assert.equal((await patch(current, { status: 'draft' })).status, 200);
    assert.equal((await download.GET(request('/download'), context(issue.id))).status, 404);
    assert.equal(sends.length, 0);
  });
  await t.test('empty content and unsupported PDF characters cannot be published', async () => {
    const issue = await create();
    assert.equal((await patch(issue, { status: 'published', body: '' })).status, 400);
    assert.equal((await patch(issue, { status: 'published', body: content.body + ' 🌿' })).status, 400);
  });
  await t.test('admin test sends only the saved issue to the configured admin and is rate-limited', async () => {
    const issue = await create();
    const first = await detail.POST(request('/test', 'POST', { version: issue.version, to: 'not-allowed@example.com' }), context(issue.id));
    assert.equal(first.status, 200);
    assert.equal(sends.length, 1);
    assert.equal(sends[0].to, process.env.ADMIN_EMAIL?.trim() || 'sender@example.com');
    assert.ok(sends[0].subject.startsWith('[PREVIEW]'));
    assert.equal((await detail.POST(request('/test', 'POST', { version: issue.version }), context(issue.id))).status, 429);
    assert.equal((await detail.POST(request('/test', 'POST', { version: 999 }), context(issue.id))).status, 409);
  });
  await t.test('mail failure is reported, not counted as success', async () => {
    const issue = await create();
    sendFailure = true;
    assert.equal((await detail.POST(request('/test', 'POST', { version: issue.version }), context(issue.id))).status, 502);
    sendFailure = false;
  });
  await t.test('saved email preview is private, sandboxed, and escaped', async () => {
    const issue = await create();
    const response = await detail.GET(request(`/api/admin/newsletters/${issue.id}?format=email`), context(issue.id));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-security-policy'), /sandbox/);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  });
  await t.test('subscriber filters, active-only export and unsubscribe preserve consent boundaries', async () => {
    await client.query("INSERT INTO pg_temp.subscribers(email,active) VALUES ('active@example.com',true),('inactive@example.com',false),('=formula@example.com',true)");
    let response = await subscribers.GET(request('/api/admin/newsletter-subscribers?status=active&q=active'));
    const data = await response.json();
    assert.equal(data.total, 1);
    const id = data.subscribers[0].id;
    response = await subscribers.GET(request('/api/admin/newsletter-subscribers?format=csv'));
    const csv = await response.text();
    assert.ok(csv.includes('active@example.com') && !csv.includes('inactive@example.com'));
    assert.ok(csv.includes("'=formula@example.com"));
    assert.equal((await subscribers.PATCH(request('/subscribers', 'PATCH', { id, action: 'unsubscribe' }))).status, 200);
    assert.equal((await subscribers.PATCH(request('/subscribers', 'PATCH', { id, action: 'reactivate' }))).status, 400);
    response = await subscribers.GET(request('/api/admin/newsletter-subscribers?format=csv'));
    assert.ok(!(await response.text()).includes('active@example.com'));
  });
});
