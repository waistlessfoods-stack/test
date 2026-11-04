import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { signatureImage } from './lib/signature-fixture.mjs';
import { sourceLoader } from './lib/load-typescript.mjs';

const load = sourceLoader({ 'server-only': {} });
const { clerkContactProfile, agreementSignerName } = load('lib/clerk-contact-profile.ts');
const { validateSignatureMark } = load('lib/service-signature-validation.ts');
const { parseAgreementContent, canonicalAgreement } = load('lib/service-agreement-content.ts');
const template = load('lib/service-agreement-template.ts');
const profile = { firstName: 'QA Profile', lastName: 'Customer', primaryEmailAddressId: 'email-1',
  emailAddresses: [{ id: 'email-1', emailAddress: 'QA@example.com', verification: { status: 'verified' } }],
  primaryPhoneNumberId: 'phone-1', phoneNumbers: [{ id: 'phone-1', phoneNumber: '+15550123456' }],
  privateMetadata: { secret: 'must never be copied' }, unsafeMetadata: { address: 'not an approved contact field' } };
const recipient = { name: 'QA Booking Name', email: 'qa@example.com' };

test('Clerk prefill copies contact fields only and checks recipient identity before suggesting signer name', () => {
  const contact = clerkContactProfile(profile);
  assert.equal(contact.phone, '+15550123456'); assert.equal(contact.email, 'qa@example.com');
  assert.equal(contact.name, 'QA Profile Customer');
  assert.ok(!JSON.stringify(contact).includes('metadata')); assert.ok(!JSON.stringify(contact).includes('secret'));
  assert.equal(agreementSignerName(profile, recipient), 'QA Profile Customer');
  assert.equal(agreementSignerName({ ...profile, primaryEmailAddressId: 'unverified' }, recipient), recipient.name);
  assert.equal(agreementSignerName(profile, { ...recipient, email: 'other@example.com' }), recipient.name);
  assert.equal(agreementSignerName(null, recipient), recipient.name);
  assert.equal(clerkContactProfile(null), null);
});

test('booking renders saved Clerk name, primary email, and phone as editable values', () => {
  const modules = sourceLoader({ 'server-only': {}, '@clerk/nextjs': { useUser: () => ({ user: profile }) } });
  const Component = modules('app/services/[slug]/book/booking-page-client.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Component, { serviceSlug: 'private-chef', serviceTitle: 'Private Chef', howToBook: [], bookingImagePath: null }));
  for (const value of ['QA Profile', 'Customer', 'qa@example.com', '+15550123456']) assert.ok(html.includes(`value="${value}"`), value);
  assert.ok(html.includes('Available contact details are filled from your account'));
});

test('typed, drawn, and uploaded marks validate; blank, invalid, excessive, and remote images fail', () => {
  assert.deepEqual(validateSignatureMark(undefined), { method: 'typed' });
  assert.deepEqual(validateSignatureMark({ method: 'typed' }), { method: 'typed' });
  for (const method of ['drawn', 'uploaded']) {
    const mark = validateSignatureMark({ method, imageData: signatureImage() });
    assert.equal(mark.method, method); assert.match(mark.imageData, /^data:image\/png;base64,/);
    assert.deepEqual(validateSignatureMark(mark), mark, 'normalized proof is stable on retries');
  }
  for (const input of [{ method: 'drawn', imageData: '' }, { method: 'uploaded', imageData: signatureImage(true) },
    { method: 'uploaded', imageData: 'https://example.com/signature.png' },
    { method: 'uploaded', imageData: 'data:image/svg+xml;base64,PHN2Zz4=' },
    { method: 'uploaded', imageData: 'data:image/png;base64,' + 'A'.repeat(210000) },
    { method: 'typed', imageData: signatureImage() }]) assert.throws(() => validateSignatureMark(input));
  const oversized = Buffer.from(signatureImage().split(',')[1], 'base64'); oversized.writeUInt32BE(100000, 16);
  assert.throws(() => validateSignatureMark({ method: 'uploaded', imageData: `data:image/png;base64,${oversized.toString('base64')}` }));
});

test('legacy Chef consent and hashes are retained; rendered drawn/uploaded proof uses safe inline PNGs', () => {
  const content = { name: recipient.name, email: recipient.email, phone: '', service: 'private_chef', title: 'QA TEST Agreement',
    eventDate: '2027-01-20', endDate: '', location: 'QA Venue', guests: 8, amount: 20000, details: '', terms: 'QA TEST contract text', source: 'QA TEST',
    chefSignature: { name: 'QA Chef', consent: template.LEGACY_CHEF_SIGNATURE_CONSENT, signedAt: '2026-11-01T00:00:00Z' } };
  assert.deepEqual(parseAgreementContent(content), content);
  assert.equal(canonicalAgreement(content), JSON.stringify(content));
  const hash = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  assert.equal(load('lib/service-agreements.ts').agreementView({ id: 'qa', status: 'issued', content, document_hash: hash, created_at: '2026-11-01', updated_at: '2026-11-01' }).documentHash, hash);
  const Component = load('components/service-agreement-document.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Component, { agreement: { id: 'qa', status: 'signed', documentHash: 'qa',
    content: { ...content, chefSignature: { ...content.chefSignature, mark: validateSignatureMark({ method: 'drawn', imageData: signatureImage() }) } },
    signature: { name: 'QA Customer', consent: 'QA consent', signedAt: '2026-11-04T00:00:00Z', documentHash: 'qa', mark: validateSignatureMark({ method: 'uploaded', imageData: signatureImage() }) } } }));
  assert.ok(html.includes('Chef drawn signature')); assert.ok(html.includes('Client uploaded signature')); assert.ok(!html.includes('src="https://'));
});
