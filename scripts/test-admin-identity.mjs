// No Clerk API requests, accounts, email, or database mutations.
import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

test('admin account authorization requires an exact verified email match', () => {
  const { isAuthorizedAdminAccount: allowed } = sourceLoader()('lib/admin-identity.ts');
  const user = (emailAddress, status = 'verified') => ({ emailAddresses: [{ emailAddress, verification: { status } }] });
  assert.equal(allowed(user('ADMIN@waistlessfoods.com')), true);
  for (const candidate of [null, user('admin@waistlessfoods.com', 'unverified'), user('admin@waistlessfoods.com.evil.test'), user('customer@example.com'), { emailAddresses: [] }]) assert.equal(allowed(candidate), false);
});

test('account sign-in issues an admin cookie only after server-side identity verification', async t => {
  const originalPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = 'qa-only-secret';
  t.after(() => { if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = originalPassword; });
  let identity = null;
  const load = sourceLoader({
    '@clerk/nextjs/server': { currentUser: async () => identity },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ limited: false }) },
  });
  const { POST } = load('app/api/admin/verify/route.ts');
  const request = (body, origin = 'https://www.waistlessfoods.com') => new NextRequest('https://www.waistlessfoods.com/api/admin/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body),
  });
  const assertDenied = async (body, origin) => {
    const response = await POST(request(body, origin));
    assert.equal(response.status, 403);
    assert.equal(response.cookies.get('wlf_admin_session'), undefined);
  };
  await assertDenied({ useAccount: true, email: 'admin@waistlessfoods.com' });
  identity = { emailAddresses: [{ emailAddress: 'customer@example.com', verification: { status: 'verified' } }] };
  await assertDenied({ useAccount: true });
  identity.emailAddresses[0] = { emailAddress: 'admin@waistlessfoods.com', verification: { status: 'unverified' } };
  await assertDenied({ useAccount: true });
  identity.emailAddresses[0].verification.status = 'verified';
  await assertDenied({ useAccount: true }, 'https://evil.test');
  const response = await POST(request({ useAccount: true }));
  assert.equal(response.status, 200);
  const cookie = response.cookies.get('wlf_admin_session');
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, 'lax');
  assert.equal(load('lib/admin-session.ts').isValidAdminSessionToken(cookie.value), true);
  assert.equal((await POST(request({ password: 'wrong' }))).status, 401);
  assert.equal((await POST(request({ password: 'qa-only-secret' }))).status, 200);
});
