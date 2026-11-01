import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import React from 'react';
import { createHmac } from 'node:crypto';
import { render } from '@react-email/render';
import { sourceLoader } from './lib/load-typescript.mjs';

const load = sourceLoader({ 'server-only': {} });
const { campaignConfig, createCampaignService } = load('lib/newsletter-campaigns.ts');
let passed = 0;
async function test(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
const env = { Email: 'qa@example.com', AppPassword: 'mock-only', NEWSLETTER_SENDING_ENABLED: 'true', NEWSLETTER_MAILING_ADDRESS: '123 Test Street, Test City, TX 77000' };
await test('Production defaults on; explicit off, local isolation, caps and preview blocks remain', () => {
  assert.equal(campaignConfig({}).enabled, false);
  assert.equal(campaignConfig(env).enabled, true);
  assert.equal(campaignConfig({ ...env, VERCEL: '1', VERCEL_ENV: 'preview' }).enabled, false);
  assert.equal(campaignConfig({ ...env, NEWSLETTER_DAILY_LIMIT: '9999' }).dailyLimit, 100);
  assert.equal(campaignConfig({ ...env, NEWSLETTER_DAILY_LIMIT: '25' }).dailyLimit, 25);
  assert.equal(campaignConfig({ ...env, NEWSLETTER_MAILING_ADDRESS: '' }).enabled, true);
  assert.equal(campaignConfig({ ...env, NEWSLETTER_MAILING_ADDRESS: '[Business mailing address — add before sending]' }).mailingAddress, '');
  assert.equal(campaignConfig({ ...env, NEWSLETTER_SENDING_ENABLED: undefined }).enabled, false);
  assert.equal(campaignConfig({ ...env, NEWSLETTER_SENDING_ENABLED: undefined, VERCEL: '1', VERCEL_ENV: 'production' }).enabled, true);
  assert.equal(campaignConfig({ ...env, NEWSLETTER_SENDING_ENABLED: 'false', VERCEL: '1', VERCEL_ENV: 'production' }).enabled, false);
});
const issue = { title: 'QA seasonal table', subject: 'QA newsletter', previewText: 'Seasonal ideas', body: 'Only synthetic newsletter content for automated tests.', ctaLabel: '', ctaUrl: '' };
await test('Subscriber email has opt-out and address, without preview banner', async () => {
  const Email = load('lib/email/templates/newsletter-issue-email.tsx').default;
  const html = await render(React.createElement(Email, { issue, campaign: { mailingAddress: env.NEWSLETTER_MAILING_ADDRESS, unsubscribeUrl: 'https://example.com/unsubscribe?token=test' } }));
  assert.ok(html.includes(env.NEWSLETTER_MAILING_ADDRESS)); assert.ok(html.includes('Unsubscribe from newsletters')); assert.ok(!html.includes('PREVIEW ONLY'));
  const noAddress = await render(React.createElement(Email, { issue, campaign: { mailingAddress: '[Business mailing address — add before sending]', unsubscribeUrl: 'https://example.com/unsubscribe?token=test' } }));
  assert.ok(noAddress.includes('Unsubscribe from newsletters')); assert.ok(!noAddress.includes('Business mailing address')); assert.ok(!noAddress.includes('PREVIEW ONLY'));
  const preview = await render(React.createElement(Email, { issue }));
  assert.ok(preview.includes('PREVIEW ONLY'));
  const originalAddress = process.env.NEWSLETTER_MAILING_ADDRESS;
  try {
    delete process.env.NEWSLETTER_MAILING_ADDRESS;
    const placeholderPreview = await render(React.createElement(Email, { issue }));
    assert.ok(!placeholderPreview.includes('Business mailing address'));
    assert.ok(!placeholderPreview.includes('add before sending'));
  } finally {
    if (originalAddress !== undefined) process.env.NEWSLETTER_MAILING_ADDRESS = originalAddress;
  }
});
await test('Campaign API requires admin and same-origin requests', async () => {
  const { NextRequest } = await import('next/server.js');
  const guardedLoad = sourceLoader({ 'server-only': {}, '@/lib/newsletter-campaign-store': { campaigns: {} }, '@/lib/email/mailer': { sendEmail: () => { throw new Error('No SMTP allowed in tests'); } } });
  const routes = guardedLoad('app/api/admin/newsletters/[id]/campaign/route.ts');
  assert.equal((await routes.GET(new NextRequest('https://example.com/api/admin/newsletters/1/campaign'), { params: Promise.resolve({ id: '1' }) })).status, 401);
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (secret) {
    const payload = `${Date.now()+60000}.qa`;
    const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('hex')}`;
    const request = new NextRequest('https://example.com/api/admin/newsletters/1/campaign', { method: 'POST', headers: { cookie: `wlf_admin_session=${token}`, origin: 'https://evil.example' } });
    assert.equal((await routes.POST(request, { params: Promise.resolve({ id: '1' }) })).status, 403);
  }
});
await test('One-click opt-out verifies signed tokens and has no mutating GET', async () => {
  const { NextRequest } = await import('next/server.js');
  let updates = 0;
  const original = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'isolated-test-signing-secret';
  try {
    const fakeDb = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 11, email: 'qa@example.com', active: true }] }) }) }),
      update: () => ({ set: values => ({ where: async () => { assert.equal(values.active, false); updates++; } }) }),
    };
    const oneClickLoad = sourceLoader({ 'server-only': {}, '@/lib/db': { db: fakeDb } });
    const route = oneClickLoad('app/api/newsletter/one-click/route.ts');
    const { createNewsletterUnsubscribeToken } = oneClickLoad('lib/newsletter-unsubscribe.ts');
    const token = createNewsletterUnsubscribeToken(11, 'qa@example.com');
    const request = tokenValue => new NextRequest(`https://example.com/api/newsletter/one-click?subscriber=11&token=${tokenValue}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
    assert.equal(route.GET, undefined);
    assert.equal((await route.POST(request('invalid'))).status, 400); assert.equal(updates, 0);
    assert.equal((await route.POST(request(token))).status, 200); assert.equal(updates, 1);
  } finally {
    if (original === undefined) delete process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
    else process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = original;
  }
});

if (!process.argv.includes('--integration')) {
  console.log(`${passed} tests passed; use --integration for isolated database tests.`);
  process.exit(0);
}
assert.ok(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query('BEGIN');
try {
  await client.query('CREATE TEMP TABLE subscribers(id serial PRIMARY KEY, email text NOT NULL, active boolean DEFAULT true, unsubscribed_at timestamptz)');
  await client.query('CREATE TEMP TABLE newsletter_issues(id serial PRIMARY KEY, version integer DEFAULT 1, title text, subject text, preview_text text, body text, cta_label text, cta_url text)');
  await client.query(await readFile(new URL('../drizzle/0014_newsletter_media.sql', import.meta.url), 'utf8'));
  const migration = await readFile(new URL('../drizzle/0012_newsletter_campaigns.sql', import.meta.url), 'utf8');
  await client.query(migration.replaceAll('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE'));
  const query = async (text, values = []) => (await client.query(text, values)).rows;
  let serial = Promise.resolve(); let sequence = 0;
  const database = { query, transaction(work) {
    const run = serial.then(async () => {
      const savepoint = `qa_campaign_${++sequence}`;
      await client.query(`SAVEPOINT ${savepoint}`);
      try { const result = await work(query); await client.query(`RELEASE SAVEPOINT ${savepoint}`); return result; }
      catch (error) { await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`); throw error; }
    });
    serial = run.catch(() => {}); return run;
  } };
  const service = createCampaignService(database);
  const config = { enabled: true, mailingAddress: '123 Test Street, Test City, TX 77000', dailyLimit: 100 };
  async function reset() {
    await client.query('TRUNCATE newsletter_deliveries, newsletter_campaigns, newsletter_issues, subscribers RESTART IDENTITY CASCADE');
    await client.query('UPDATE newsletter_dispatch_lock SET next_at=now(), busy_until=now()');
    await query('INSERT INTO newsletter_issues(title,subject,preview_text,body,cta_label,cta_url) VALUES ($1,$2,$3,$4,$5,$6)', Object.values(issue));
    await query("INSERT INTO subscribers(email,active) VALUES ('one@example.com',true),('two@example.com',true),('out@example.com',false),('ONE@example.com',true)");
  }
  const clearCooldown = () => query('UPDATE newsletter_dispatch_lock SET next_at=now(), busy_until=now()');
  await test('Preparation snapshots content, deduplicates active email addresses, and is idempotent', async () => {
    await reset(); const first = await service.prepare(1, 1, config); const second = await service.prepare(1, 1, config);
    assert.equal(first, second); const state = await service.read(1); assert.equal(state.counts.pending, 2);
    await query("UPDATE newsletter_issues SET body='Changed later', version=2 WHERE id=1");
    assert.equal((await service.read(1)).campaign.snapshot.body, issue.body);
  });
  await test('Stale versions are blocked; preparation works without an address', async () => {
    await reset();
    await assert.rejects(() => service.prepare(1, 2, config)); assert.equal((await service.read(1)).campaign, null);
    await service.prepare(1, 1, { ...config, mailingAddress: '' });
    assert.equal((await service.read(1)).campaign.mailing_address, '');
  });
  await test('Campaign snapshot freezes images and links even when the issue is edited later', async () => {
    await reset();
    const media = { header: { url: 'https://www.waistlessfoods.com/logo.png', alt: 'QA header', linkUrl: 'https://www.waistlessfoods.com/recipes' }, footer: null, images: [{ url: 'https://www.waistlessfoods.com/recipes/pasta.png', alt: 'QA pasta', linkUrl: '', afterParagraph: 1 }] };
    await query('UPDATE newsletter_issues SET media=$1::jsonb WHERE id=1', [JSON.stringify(media)]);
    await service.prepare(1, 1, config);
    await query("UPDATE newsletter_issues SET media='{}'::jsonb,version=2 WHERE id=1");
    assert.deepEqual((await service.read(1)).campaign.snapshot.media, media);
  });
  await test('Disabled sending never calls SMTP', async () => {
    await service.prepare(1, 1, config);
    await assert.rejects(() => service.sendNext(1, { ...config, enabled: false }, () => { throw new Error('must not run'); }));
    assert.equal((await service.read(1)).counts.pending, 2);
  });
  await test('Placeholder is omitted and a campaign can send with no address', async () => {
    await reset(); await service.prepare(1, 1, { ...config, mailingAddress: '[Business mailing address — add before sending]' });
    assert.equal((await service.read(1)).campaign.mailing_address, '');
    let sent = false;
    await service.sendNext(1, { ...config, mailingAddress: '' }, async campaign => { assert.equal(campaign.mailing_address, ''); sent = true; return 'mock-no-address'; });
    assert.equal(sent, true);
    await reset(); await service.prepare(1, 1, { ...config, mailingAddress: '' });
  });
  await test('Opt-out after preparation is skipped before send', async () => {
    await query("UPDATE subscribers SET active=false WHERE email='one@example.com'");
    const sent = [];
    await service.sendNext(1, config, async (_, delivery) => { sent.push(delivery.email); return 'mock-accepted'; });
    assert.deepEqual(sent, ['two@example.com']); const state = await service.read(1);
    assert.equal(state.counts.skipped, 1); assert.equal(state.counts.accepted, 1); assert.equal(state.campaign.status, 'completed');
  });
  await test('Concurrent request cannot claim a second email while SMTP is in flight', async () => {
    await reset(); await service.prepare(1, 1, config);
    let release; let started;
    const ready = new Promise(resolve => { started = resolve; });
    const first = service.sendNext(1, config, async () => { started(); await new Promise(resolve => { release = resolve; }); return 'mock-first'; });
    await ready;
    let secondSent = false;
    const second = await service.sendNext(1, config, async () => { secondSent = true; return 'mock-second'; });
    assert.equal(second.attempted, false); assert.equal(secondSent, false);
    release(); await first;
    const repeated = await service.sendNext(1, config, async () => { throw new Error('cooldown must prevent send'); });
    assert.equal(repeated.attempted, false);
  });
  await test('Global rolling attempt cap stops further sends', async () => {
    await clearCooldown(); let sent = false;
    const result = await service.sendNext(1, { ...config, dailyLimit: 1 }, async () => { sent = true; return 'bad'; });
    assert.equal(result.attempted, false); assert.equal(sent, false);
  });
  await test('Ambiguous SMTP failure pauses campaign and is never retried', async () => {
    await reset(); await service.prepare(1, 1, config);
    await service.sendNext(1, config, async () => { throw new Error('timeout after DATA'); });
    let state = await service.read(1); assert.equal(state.counts.uncertain, 1); assert.equal(state.campaign.status, 'paused');
    await service.control(1, 'resume'); await clearCooldown(); const sent = [];
    await service.sendNext(1, config, async (_, delivery) => { sent.push(delivery.email); return 'mock-ok'; });
    assert.deepEqual(sent, ['two@example.com']); state = await service.read(1); assert.equal(state.counts.uncertain, 1); assert.equal(state.counts.accepted, 1);
  });
  await test('Stale in-flight claims become uncertain without resending', async () => {
    await reset(); await service.prepare(1, 1, config);
    await query("UPDATE newsletter_deliveries SET status='sending', attempted_at=now()-interval '3 minutes' WHERE email='one@example.com'");
    const result = await service.sendNext(1, config, async () => { throw new Error('must not call'); });
    assert.equal(result.attempted, false); assert.equal((await service.read(1)).campaign.status, 'paused');
    assert.equal((await service.read(1)).counts.uncertain, 1);
  });
  await test('Cancellation skips pending recipients and cannot be resumed', async () => {
    await service.control(1, 'cancel'); await service.control(1, 'resume');
    const state = await service.read(1); assert.equal(state.campaign.status, 'cancelled'); assert.equal(state.counts.skipped, 1);
    assert.equal((await service.sendNext(1, config, async () => 'must-not-send')).attempted, false);
  });
  await test('Empty audience completes without sending', async () => {
    await reset(); await query('UPDATE subscribers SET active=false'); await service.prepare(1, 1, config);
    await service.sendNext(1, config, async () => { throw new Error('must not send'); });
    assert.equal((await service.read(1)).campaign.status, 'completed');
  });
} finally {
  await client.query('ROLLBACK'); await client.end();
}
console.log(`${passed} tests passed. Temporary tables rolled back; SMTP mocked; no customer data changed.`);
