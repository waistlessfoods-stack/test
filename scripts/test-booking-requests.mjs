// Exercises the actual request handlers with database and SMTP side effects
// replaced. No customer records, emails, or rate-limit buckets are created.
import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

function harness({ failedRecipient } = {}) {
  const rows = [];
  const deliveries = [];
  const load = sourceLoader({
    '@/lib/db': { db: {
      insert: () => ({ values: row => ({ returning: async () => {
        const saved = { id: rows.length + 1, ...row };
        rows.push(saved);
        return [saved];
      } }) }),
      select: () => ({ from: () => ({ orderBy: async () => rows }) }),
    } },
    '@/lib/email/mailer': { fromEmail: 'old-sender@example.com', sendEmail: async email => {
      deliveries.push(email);
      return { error: email.to === failedRecipient ? { message: 'SMTP unavailable' } : null };
    } },
    '@/lib/rate-limit': {
      normalizeRateLimitEmail: value => typeof value === 'string' ? value.trim().toLowerCase() : '',
      checkRateLimit: async () => ({ limited: false }),
    },
    '@/lib/structured-log': { getRequestLogContext: () => ({}), logInfo: () => {}, logError: () => {}, maskEmail: value => value },
    '@/lib/admin-session': { requireAdminSession: () => null },
  });
  return { load, rows, deliveries };
}

const request = body => new NextRequest('https://www.waistlessfoods.com/api/bookings', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const input = {
  serviceSlug: 'private-chef', serviceTitle: 'Private Chef', firstName: 'Alex', lastName: 'Guest',
  email: ' ALEX@example.com ', phone: '555-0100', guests: 24,
  preferredDate: 'January 20th, 2027', alternativeDate: 'January 21st, 2027',
  notes: 'Budget range: $1,000–$2,000\n\nEvent details:\nBirthday dinner. Vegetarian menu. Houston.',
};

for (const [slug, title] of [['private-chef', 'Private Chef'], ['catering', 'Catering'], ['complimentary-consultation', 'Complimentary Consultation']]) {
  test(`${title}: saves all submitted information and routes the owner notification to info`, async t => {
    const oldAdmin = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = 'outdated-gmail@example.com';
    t.after(() => { if (oldAdmin === undefined) delete process.env.ADMIN_EMAIL; else process.env.ADMIN_EMAIL = oldAdmin; });
    const { load, rows, deliveries } = harness();
    const response = await load('app/api/bookings/route.ts').POST(request({ ...input, serviceSlug: slug, serviceTitle: title }));
    assert.equal(response.status, 201);
    assert.deepEqual(rows[0], { id: 1, ...input, serviceSlug: slug, serviceTitle: title, email: 'alex@example.com', status: 'pending' });
    assert.deepEqual(deliveries.map(email => email.to), ['alex@example.com', 'info@waistlessfoods.com']);
    assert.equal(deliveries[1].replyTo, 'alex@example.com');
    for (const value of ['Alex', 'Guest', '555-0100', 'January 20th, 2027', 'January 21st, 2027', 'Birthday dinner.', '$1,000']) {
      assert.ok(deliveries[1].html.includes(value), `Notification missing ${value}`);
    }
    const adminResponse = await load('app/api/admin/bookings/route.ts').POST(request({}));
    assert.deepEqual((await adminResponse.json()).bookings, rows);
  });
}

test('an SMTP failure retains the booking and reports each delivery outcome honestly', async () => {
  const { load, rows } = harness({ failedRecipient: 'info@waistlessfoods.com' });
  const response = await load('app/api/bookings/route.ts').POST(request(input));
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(rows.length, 1);
  assert.equal(body.confirmationEmailSent, true);
  assert.equal(body.notificationEmailSent, false);
  assert.equal(body.emailSent, false);
});

test('invalid guest counts never save a request or send mail', async () => {
  for (const guests of [0, -1, 51, 1.5, 'invalid', null]) {
    const { load, rows, deliveries } = harness();
    const response = await load('app/api/bookings/route.ts').POST(request({ ...input, guests }));
    assert.equal(response.status, 400, String(guests));
    assert.equal(rows.length, 0);
    assert.equal(deliveries.length, 0);
  }
});

test('legacy general inquiries use the same business inbox and customer reply-to', async () => {
  const { load, deliveries } = harness();
  const response = await load('app/api/enquiries/route.ts').POST(request({ type: 'catering', name: 'Alex Guest', email: 'alex@example.com', phone: '555-0100', message: 'Dinner inquiry.' }));
  assert.equal(response.status, 201);
  assert.deepEqual(deliveries.map(email => email.to), ['alex@example.com', 'info@waistlessfoods.com']);
  assert.equal(deliveries[1].replyTo, 'alex@example.com');
});
