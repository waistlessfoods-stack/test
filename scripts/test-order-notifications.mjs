// No SMTP or Stripe requests. --integration uses a session-local PostgreSQL
// temporary table, never the application's permanent orders or sequences.
// Run: node --env-file=.env scripts/test-order-notifications.mjs --integration
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { render } from '@react-email/render';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Compile the actual TS/TSX sources with only external side effects replaced.
function sourceLoader(overrides = {}) {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiledModule = { exports: {} };
    cache.set(filename, compiledModule);
    const nativeRequire = createRequire(filename);
    const localRequire = (specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
      if (specifier.startsWith('@/')) {
        const base = specifier.slice(2);
        const resolved = [base + '.ts', base + '.tsx', base + '/index.ts']
          .find((candidate) => existsSync(path.join(root, candidate)));
        if (!resolved) throw new Error(`Unresolved source: ${specifier}`);
        return load(resolved);
      }
      return nativeRequire(specifier);
    };
    const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    });
    const execute = vm.runInThisContext(
      `(function(require, module, exports) { ${outputText}\n})`, { filename },
    );
    execute(localRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return load;
}

test('admin template renders escaped order details, totals and test warning', async () => {
  const Template = sourceLoader()('lib/email/templates/admin-order-notification-email.tsx').default;
  const props = {
    ...Template.PreviewProps,
    customerName: '<script>alert(1)</script>',
    includesCookingClass: true,
  };
  const element = React.createElement(Template, props);
  const html = await render(element);
  const plain = await render(element, { plainText: true });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  for (const text of ['TEST PAYMENT', 'Do not fulfill', '$10.80', 'customer@example.com', 'Quantity: 2', 'cooking class seats']) {
    assert.ok(plain.includes(text), text);
  }
  assert.ok(html.includes('https://www.waistlessfoods.com/admin/dashboard'));
  const live = await render(React.createElement(Template, { ...props, isTest: false }));
  assert.ok(!live.includes('TEST PAYMENT'));
});

test('order emails and webhook with real SQL, isolated temporary orders', {
  skip: !process.argv.includes('--integration') && 'Pass --integration with DATABASE_URL to run database checks',
}, async (t) => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for --integration');
  // Neon poolers reuse server sessions. Use a direct connection and a rollback
  // transaction so no temporary table can leak into an application session.
  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (databaseUrl.hostname.endsWith('.neon.tech')) {
    databaseUrl.hostname = databaseUrl.hostname.replace(/-pooler(?=\.)/, '');
  }
  databaseUrl.searchParams.set('sslmode', 'verify-full');
  const client = new pg.Client({ connectionString: databaseUrl.href, connectionTimeoutMillis: 15000 });
  await client.connect();
  t.after(async () => {
    try { await client.query('ROLLBACK'); } finally { await client.end(); }
  });
  await client.query('BEGIN');
  await client.query(`CREATE TEMP TABLE orders (
    id integer PRIMARY KEY, user_id text NOT NULL, stripe_session_id text NOT NULL UNIQUE,
    stripe_payment_intent_id text, status text NOT NULL, amount integer NOT NULL,
    currency text NOT NULL, items jsonb NOT NULL, customer_email text, metadata jsonb,
    created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
  ) ON COMMIT DROP`);
  await client.query('SET search_path TO pg_temp');
  const { rows: scope } = await client.query("SELECT relnamespace = pg_my_temp_schema() AS isolated FROM pg_class WHERE oid = 'orders'::regclass");
  assert.equal(scope[0].isolated, true, 'All test queries must resolve to the temporary table');

  const previousAdmin = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = 'admin@example.com';
  t.after(() => {
    if (previousAdmin === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = previousAdmin;
  });
  const deliveries = [];
  let failureRecipient = null;
  let throwInstead = false;
  let event;
  const load = sourceLoader({
    '@/lib/db': { db: drizzle(client) },
    '@/lib/email/mailer': {
      fromEmail: 'sender@example.com',
      sendEmail: async (message) => {
        if (message.to === failureRecipient) {
          if (throwInstead) throw new Error('Simulated render/SMTP exception');
          return { data: null, error: { message: 'Simulated SMTP failure' } };
        }
        deliveries.push(message);
        return { data: { id: 'mock-delivery' }, error: null };
      },
    },
    '@/lib/structured-log': { logInfo() {}, logError() {}, maskEmail: () => '[redacted]' },
    '@/lib/stripe-config': { getStripeSecretKey: () => 'sk_test_mock', getStripeWebhookSecret: () => 'whsec_mock' },
    '@clerk/nextjs/server': { auth: async () => ({ userId: 'qa' }) },
    '@/lib/clerk-user-sync': { syncCurrentClerkUser: async () => null, getClerkUserIdentityIds: () => ['qa'] },
    stripe: class {
      webhooks = { constructEvent: () => event };
      checkout = { sessions: { retrieve: async () => ({
        id: 'cs_test_qa', payment_status: 'paid', payment_intent: 'pi_qa',
        amount_total: 1080, customer_details: { name: 'QA Checkout' },
      }) } };
    },
  });
  const { sendOrderConfirmationOnce: send } = load('lib/email/send-order-confirmation.tsx');
  const { POST: webhook } = load('app/api/stripe/webhook/route.ts');
  const { POST: reconcile } = load('app/api/orders/reconcile/route.ts');
  async function reset({ status = 'completed', metadata = {}, items, sessionId = 'cs_test_qa' } = {}) {
    await client.query('DELETE FROM pg_temp.orders');
    await client.query(`INSERT INTO pg_temp.orders
      (id,user_id,stripe_session_id,status,amount,currency,items,customer_email,metadata)
      VALUES (900001,'qa', $1,$2,1080,'usd',$3,'customer@example.com',$4)`, [
      sessionId, status,
      JSON.stringify(items ?? [{ id: 'recipe', name: 'Seasonal Recipe', price: 5, quantity: 2, kind: 'recipe' }]),
      JSON.stringify({ checkoutSnapshot: { retained: true }, customerDetails: { name: 'Stored Customer Name' }, ...metadata }),
    ]);
    deliveries.length = 0;
    failureRecipient = null;
    throwInstead = false;
  }
  const metadata = async () => (await client.query('SELECT metadata FROM pg_temp.orders WHERE id = 900001')).rows[0].metadata;
  const sendOrder = () => send({ orderId: 900001 });
  function postEvent(type, paymentStatus) {
    event = { type, data: { object: {
      id: 'cs_test_qa', payment_status: paymentStatus, payment_intent: 'pi_qa',
      amount_total: 1080, customer_details: { name: 'QA Checkout' }, metadata: { orderId: '900001' },
    } } };
    return webhook(new Request('http://localhost/api/stripe/webhook', {
      method: 'POST', headers: { 'stripe-signature': 'mock' }, body: '{}',
    }));
  }

  await t.test('sends both audiences with customer reply-to and independent markers', async () => {
    await reset();
    assert.equal(await sendOrder(), true);
    assert.deepEqual(deliveries.map((m) => m.to).sort(), ['admin@example.com', 'customer@example.com']);
    const admin = deliveries.find((m) => m.to === 'admin@example.com');
    assert.equal(admin.replyTo, 'customer@example.com');
    assert.match(admin.subject, /^\[TEST\]/);
    assert.equal(admin.react.props.customerName, 'Stored Customer Name');
    assert.equal(admin.react.props.orderTotal, '$10.80');
    const state = await metadata();
    assert.ok(state.orderConfirmationSentAt && state.orderAdminNotificationSentAt);
    assert.deepEqual(state.checkoutSnapshot, { retained: true });
    assert.ok(!state.orderConfirmationClaimedAt && !state.orderAdminNotificationClaimedAt);
  });
  await t.test('repeated and concurrent calls send one message per recipient', async () => {
    await reset();
    await Promise.all(Array.from({ length: 5 }, sendOrder));
    assert.equal(deliveries.length, 2);
    assert.equal(await sendOrder(), false);
    assert.equal(deliveries.length, 2);
  });
  for (const failed of ['admin@example.com', 'customer@example.com']) {
    await t.test(`failure of ${failed} retries only that recipient`, async () => {
      await reset();
      failureRecipient = failed;
      await assert.rejects(sendOrder, /One or more/);
      assert.equal(deliveries.length, 1);
      const errorKey = failed.startsWith('admin') ? 'orderAdminNotificationError' : 'orderConfirmationError';
      assert.ok((await metadata())[errorKey]);
      failureRecipient = null;
      await sendOrder();
      assert.equal(deliveries.length, 2);
      assert.equal(deliveries.filter((m) => m.to === failed).length, 1);
      assert.ok(!(await metadata())[errorKey]);
    });
  }
  await t.test('thrown mail errors release the claim for retry', async () => {
    await reset();
    failureRecipient = 'admin@example.com';
    throwInstead = true;
    await assert.rejects(sendOrder);
    assert.ok(!(await metadata()).orderAdminNotificationClaimedAt);
    failureRecipient = null;
    await sendOrder();
    assert.equal(deliveries.length, 2);
  });
  await t.test('existing customer sent marker does not suppress the new admin email', async () => {
    await reset({ metadata: { orderConfirmationSentAt: new Date().toISOString() } });
    await sendOrder();
    assert.deepEqual(deliveries.map((m) => m.to), ['admin@example.com']);
  });
  await t.test('pending, failed and refunded orders send nothing', async () => {
    for (const status of ['pending', 'failed', 'refunded']) {
      await reset({ status });
      assert.equal(await sendOrder(), false);
      assert.equal(deliveries.length, 0);
    }
  });
  await t.test('fresh claims block duplicates and stale claims can be retried', async () => {
    const fresh = new Date().toISOString();
    await reset({ metadata: { orderConfirmationClaimedAt: fresh, orderAdminNotificationClaimedAt: fresh } });
    assert.equal(await sendOrder(), false);
    const stale = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    await reset({ metadata: { orderConfirmationClaimedAt: stale, orderAdminNotificationClaimedAt: stale } });
    assert.equal(await sendOrder(), true);
    assert.equal(deliveries.length, 2);
  });
  await t.test('invalid items fail without sending and record both failures', async () => {
    await reset({ items: [] });
    await assert.rejects(sendOrder);
    assert.equal(deliveries.length, 0);
    const state = await metadata();
    assert.ok(state.orderConfirmationError && state.orderAdminNotificationError);
  });
  await t.test('missing admin configuration falls back to sender and live orders omit test label', async () => {
    await reset({ sessionId: 'cs_live_qa' });
    delete process.env.ADMIN_EMAIL;
    try {
      await sendOrder();
      const admin = deliveries.find((m) => m.to === 'sender@example.com');
      assert.ok(admin);
      assert.ok(!admin.subject.includes('[TEST]'));
    } finally { process.env.ADMIN_EMAIL = 'admin@example.com'; }
  });
  await t.test('unpaid checkout sends nothing; delayed success sends both; replay sends neither', async () => {
    await reset({ status: 'pending' });
    assert.equal((await postEvent('checkout.session.completed', 'unpaid')).status, 200);
    assert.equal(deliveries.length, 0);
    assert.equal((await client.query('SELECT status FROM pg_temp.orders')).rows[0].status, 'pending');
    assert.equal((await postEvent('checkout.session.async_payment_succeeded', 'paid')).status, 200);
    assert.equal(deliveries.length, 2);
    assert.equal((await postEvent('checkout.session.completed', 'paid')).status, 200);
    assert.equal(deliveries.length, 2);
  });
  await t.test('webhook returns retryable failure and recovers only the missing admin notification', async () => {
    await reset({ status: 'pending' });
    failureRecipient = 'admin@example.com';
    assert.equal((await postEvent('checkout.session.completed', 'paid')).status, 500);
    assert.equal(deliveries.length, 1);
    failureRecipient = null;
    assert.equal((await postEvent('checkout.session.completed', 'paid')).status, 200);
    assert.equal(deliveries.length, 2);
  });
  await t.test('replayed completion cannot revive a refunded order or send notifications', async () => {
    await reset({ status: 'refunded' });
    assert.equal((await postEvent('checkout.session.completed', 'paid')).status, 200);
    assert.equal(deliveries.length, 0);
    assert.equal((await client.query('SELECT status FROM pg_temp.orders')).rows[0].status, 'refunded');
  });
  await t.test('reconciliation retries an admin failure without resending the customer receipt', async () => {
    await reset({ metadata: {
      orderConfirmationSentAt: new Date().toISOString(),
      orderAdminNotificationError: 'Prior SMTP failure',
    } });
    const response = await reconcile();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).confirmationFailures, 0);
    assert.deepEqual(deliveries.map((m) => m.to), ['admin@example.com']);
  });
  await t.test('paid reconciliation sends both emails and preserves unrelated metadata', async () => {
    await reset({ status: 'pending' });
    const response = await reconcile();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).updated, 1);
    assert.equal(deliveries.length, 2);
    assert.deepEqual((await metadata()).checkoutSnapshot, { retained: true });
    await reconcile();
    assert.equal(deliveries.length, 2);
  });
});
