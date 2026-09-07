// Integration tests use TEMP tables and roll back. No production registrations,
// payment actions, or email sends are created by this suite.
import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

const load = sourceLoader({ 'server-only': {} });
const { buildClassRosters, filterRegistrations, classRosterCsv, rosterCsvCell, orderMode, parseRosterQuery } = load('lib/class-roster.ts');
const item = { id: 'class-pasta', name: 'Pasta Making', kind: 'cooking_class', eventDate: 'October 10, 2026 · 10:00 AM CT', capacity: 10, quantity: 2, price: 75 };
function order(id, changes = {}) {
  return { id, status: 'completed', stripeSessionId: `cs_live_roster${id}`, items: [item], customerEmail: `purchaser-${id}@example.com`, metadata: { customerDetails: { name: `Purchaser ${id}`, phone: '+1 555 0100' } }, createdAt: new Date('2026-09-07T07:00:00Z'), ...changes };
}
test('confirmed seats use quantity, not order count, and exclude noncompleted states', () => {
  const data = buildClassRosters([order(1), order(2, { items: [{ ...item, quantity: 3 }] }), ...['pending', 'refunded', 'failed'].map((status, i) => order(i + 3, { status }))], 'live');
  assert.equal(data.classes.length, 1); assert.equal(data.classes[0].confirmedSeats, 5); assert.equal(data.classes[0].confirmedOrders, 2); assert.equal(data.classes[0].pendingSeats, 2);
  assert.equal(filterRegistrations(data.classes[0].registrations, 'completed', '').length, 2);
});
test('live, sandbox, and unclassified orders cannot mix', () => {
  const rows = [order(1), order(2, { stripeSessionId: 'cs_test_sample' }), order(3, { stripeSessionId: 'legacy' })];
  for (const [mode, expected] of [['live', 1], ['test', 2], ['unknown', 3]]) {
    const data = buildClassRosters(rows, mode); assert.equal(data.classes[0].registrations.length, 1); assert.equal(data.classes[0].registrations[0].orderId, expected);
  }
  assert.equal(orderMode('cs_live_sample'), 'live'); assert.equal(orderMode('cs_test_sample'), 'test');
});
test('class grouping uses product and booked date; renaming does not split a class', () => {
  const data = buildClassRosters([order(1), order(2, { items: [{ ...item, name: 'Fresh Pasta' }] }), order(3, { items: [{ ...item, eventDate: 'October 17, 2026' }] }), order(4, { items: [{ ...item, id: 'different-class' }] })], 'live');
  assert.equal(data.classes.length, 3);
  const original = data.classes.find(group => group.productId === item.id && group.eventDate === item.eventDate);
  assert.equal(original.title, 'Fresh Pasta'); assert.equal(original.confirmedSeats, 4);
});
test('mixed recipe baskets never count recipes or guess from their titles', () => {
  const recipe = { ...item, kind: 'recipe', name: 'Cooking Class Pasta Recipe', quantity: 20 };
  const legacy = { ...item, kind: undefined };
  const result = buildClassRosters([order(1, { items: [recipe, legacy, item] })], 'live');
  assert.equal(result.classes.length, 1); assert.equal(result.classes[0].confirmedSeats, 2);
});
test('duplicate lines merge to one purchaser row; separate purchases stay separate', () => {
  const result = buildClassRosters([order(1, { items: [item, item] }), order(2, { customerEmail: 'purchaser-1@example.com' })], 'live');
  assert.equal(result.classes[0].confirmedSeats, 6); assert.equal(result.classes[0].confirmedOrders, 2);
  assert.equal(result.classes[0].registrations.find(row => row.orderId === 1).seats, 4);
});
test('malformed quantities and dates are flagged instead of inflating totals', () => {
  const result = buildClassRosters([order(1, { items: [item, ...[0, -1, 1.5, '3', Number.MAX_SAFE_INTEGER + 1].map(quantity => ({ ...item, quantity })), { ...item, eventDate: 123 }] })], 'live');
  assert.equal(result.invalidLines, 6); assert.equal(result.classes[0].confirmedSeats, 2);
});
test('missing contact/date fields remain blank instead of inventing guest names', () => {
  const result = buildClassRosters([order(1, { customerEmail: null, metadata: {}, items: [{ ...item, eventDate: undefined }] })], 'live');
  assert.equal(result.classes[0].eventDate, ''); assert.equal(result.classes[0].registrations[0].name, ''); assert.equal(result.classes[0].registrations[0].email, '');
});
test('search and status filtering match the intended purchaser or order', () => {
  const rows = buildClassRosters([order(1), order(2, { status: 'refunded' })], 'live').classes[0].registrations;
  assert.equal(filterRegistrations(rows, 'completed', '#1').length, 1);
  assert.equal(filterRegistrations(rows, 'completed', 'PURCHASER-2@EXAMPLE.COM').length, 0);
  assert.equal(filterRegistrations(rows, 'all', 'PURCHASER-2@EXAMPLE.COM').length, 1);
});
test('CSV escapes quotes and guards spreadsheet formulas, including phone prefixes', () => {
  for (const value of ['=1+1', '+15550100', '-3', '@SUM(A1)', ' \t=1', '\n=1', '\uFEFF=1']) assert.ok(rosterCsvCell(value).startsWith('"\''));
  assert.equal(rosterCsvCell('a"b'), '"a""b"');
  const group = buildClassRosters([order(1)], 'live').classes[0];
  const csv = classRosterCsv(group, group.registrations, 'live');
  assert.ok(csv.startsWith('\uFEFF"Mode"')); assert.ok(csv.includes('"Seats"')); assert.ok(csv.includes('purchaser-1@example.com'));
});
test('query validation defaults to live paid orders and rejects invalid filters', () => {
  const defaults = parseRosterQuery(new URLSearchParams()); assert.equal(defaults.mode, 'live'); assert.equal(defaults.status, 'completed');
  for (const query of ['mode=all', 'status=paid', 'class=../../../secret', 'format=html', `q=${'x'.repeat(151)}`]) assert.throws(() => parseRosterQuery(new URLSearchParams(query)));
});

test('real SQL and HTTP read-only roster integration', { skip: !process.argv.includes('--integration') && 'Pass --integration with DATABASE_URL' }, async t => {
  assert.ok(process.env.DATABASE_URL); process.env.ADMIN_PASSWORD ||= 'roster-test-only';
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname.endsWith('.neon.tech')) url.hostname = url.hostname.replace(/-pooler(?=\.)/, '');
  url.searchParams.set('sslmode', 'verify-full');
  const client = new pg.Client({ connectionString: url.href }); await client.connect();
  t.after(async () => { try { await client.query('ROLLBACK'); } finally { await client.end(); } });
  await client.query('BEGIN'); await client.query('SET LOCAL search_path TO pg_temp');
  await client.query('CREATE TEMP TABLE orders (id integer primary key, status text not null, stripe_session_id text not null, items jsonb not null, customer_email text, metadata jsonb, created_at timestamp not null)');
  assert.equal((await client.query("SELECT relnamespace = pg_my_temp_schema() AS isolated FROM pg_class WHERE oid = 'orders'::regclass")).rows[0].isolated, true);
  const fixture = [order(1), order(2, { status: 'refunded' }), order(3, { stripeSessionId: 'cs_test_roster3' }), order(4, { items: [{ ...item, kind: 'recipe' }] }), order(5, { status: 'pending' })];
  for (const row of fixture) await client.query('INSERT INTO orders VALUES ($1,$2,$3,$4,$5,$6,$7)', [row.id, row.status, row.stripeSessionId, JSON.stringify(row.items), row.customerEmail, JSON.stringify(row.metadata), row.createdAt]);
  const modules = sourceLoader({ 'server-only': {}, '@/lib/db': { db: drizzle(client) } });
  const route = modules('app/api/admin/class-rosters/route.ts');
  const token = modules('lib/admin-session.ts').createAdminSessionToken();
  const request = (query = '', authenticated = true) => new NextRequest(`https://qa.example.com/api/admin/class-rosters${query}`, { headers: authenticated ? { cookie: `wlf_admin_session=${token}` } : {} });
  await t.test('anonymous JSON and CSV requests are rejected', async () => {
    for (const query of ['', '?format=csv']) assert.equal((await route.GET(request(query, false))).status, 401);
  });
  let key;
  await t.test('SQL filters exclude recipes and test orders from live results', async () => {
    const response = await route.GET(request()); assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
    const data = await response.json(); key = data.classes[0].key;
    assert.equal(data.classes.length, 1); assert.equal(data.classes[0].confirmedSeats, 2); assert.equal(data.classes[0].registrations.length, 3);
    const tests = await (await route.GET(request('?mode=test'))).json(); assert.equal(tests.classes[0].registrations[0].orderId, 3);
  });
  await t.test('CSV exports only selected class/status/search with private headers', async () => {
    const response = await route.GET(request(`?format=csv&class=${key}`)); assert.equal(response.status, 200);
    const csv = await response.text(); assert.ok(csv.includes('purchaser-1@example.com')); assert.ok(!csv.includes('purchaser-2@example.com')); assert.ok(!csv.includes('purchaser-3@example.com'));
    assert.match(response.headers.get('content-disposition'), /attachment/);
    const refunded = await route.GET(request(`?format=csv&class=${key}&status=refunded&q=purchaser-2`)); assert.ok((await refunded.text()).includes('purchaser-2@example.com'));
  });
  await t.test('exports reject absent or unknown class selection', async () => {
    assert.equal((await route.GET(request('?format=csv'))).status, 400);
    assert.equal((await route.GET(request(`?format=csv&class=${'f'.repeat(64)}`))).status, 404);
  });
  await t.test('overflow fails closed, never exporting a truncated roster', async () => {
    await client.query("INSERT INTO orders SELECT x, 'completed', 'cs_live_limit' || x, $1::jsonb, 'limit@example.com', '{}'::jsonb, now() FROM generate_series(100,5100) x", [JSON.stringify([item])]);
    assert.equal((await route.GET(request())).status, 503);
    assert.equal((await route.GET(request(`?format=csv&class=${key}`))).status, 503);
  });
});
