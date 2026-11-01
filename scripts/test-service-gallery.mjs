// Actual Contentful mapper and refresh/webhook handlers; no CMS mutations,
// cache changes, external requests, database operations, or messages.
import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

const load = sourceLoader();
const { serviceGalleryImagePaths, serviceGalleryPhotos } = load('lib/service-gallery.ts');
const asset = (id, patch = {}) => ({ sys: { id }, fields: { file: { url: `//images.ctfassets.net/qa/${id}.jpg`, contentType: 'image/jpeg', ...patch } } });

test('all current Sub Images keep editor order and supersede old gallery fields', () => {
  const photos = Array.from({ length: 12 }, (_, index) => asset(`photo-${index}`));
  const paths = serviceGalleryImagePaths({ subImages: photos, galleryImages: [asset('old')], galleryImagePaths: ['/old.jpg'] });
  assert.equal(paths.length, 12); assert.equal(paths[0], 'https://images.ctfassets.net/qa/photo-0.jpg'); assert.equal(paths[11], 'https://images.ctfassets.net/qa/photo-11.jpg');
  assert.ok(!paths.some(path => path.includes('old')));
  assert.deepEqual(serviceGalleryImagePaths({ subImages: [], galleryImages: [asset('old')] }), []);
});
test('unpublished/non-image assets are excluded, duplicates collapse, and legacy galleries remain compatible', () => {
  assert.deepEqual(serviceGalleryImagePaths({ subImages: [asset('photo'), asset('photo'), { sys: { id: 'draft' } }, asset('document', { contentType: 'application/pdf' }), null] }), ['https://images.ctfassets.net/qa/photo.jpg']);
  assert.deepEqual(serviceGalleryImagePaths({ galleryImages: [asset('old')] }), ['https://images.ctfassets.net/qa/old.jpg']);
  assert.deepEqual(serviceGalleryImagePaths({ galleryImagePaths: ['/one.jpg', null, '/one.jpg', ' /two.jpg '] }), ['/one.jpg', '/two.jpg']);
  assert.deepEqual(serviceGalleryPhotos('/hero.jpg', ['/one.jpg', null, '/hero.jpg', '/two.jpg']), ['/hero.jpg', '/one.jpg', '/two.jpg']);
  assert.deepEqual(serviceGalleryPhotos(null, []), []);
});
test('actual delivery mapper keeps every additional photo without changing the main thumbnail', async t => {
  const settings = { CONTENTFUL_DELIVERY_TOKEN: 'qa-delivery-only', Contentful_space_id: 'qa-space' };
  const previous = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]]));
  Object.assign(process.env, settings);
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const photos = Array.from({ length: 9 }, (_, index) => asset(`photo-${index}`));
  const entry = { sys: { id: 'qa-service' }, fields: { slug: 'private', title: 'QA Private Chef', thumbnailsImage: asset('hero'), subImages: photos } };
  const modules = sourceLoader({ 'next/cache': { unstable_cache: fn => fn }, contentful: { createClient: () => ({ getEntries: async () => ({ items: [entry] }) }) } });
  const original = console.log;
  try {
    console.log = () => {};
    const result = await modules('lib/contentful-management.ts').fetchServiceDetailFromContentful('private');
    assert.equal(result.mainImagePath, 'https://images.ctfassets.net/qa/hero.jpg'); assert.equal(result.galleryImagePaths.length, 9);
  } finally { console.log = original; }
});
test('manual service refresh requires signed admin and same-origin, then immediately expires service data only', async t => {
  const original = process.env.ADMIN_PASSWORD; process.env.ADMIN_PASSWORD ||= 'qa-gallery-only';
  t.after(() => { if (original === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = original; });
  const invalidations = [];
  const modules = sourceLoader({ 'next/cache': { revalidateTag: (...args) => invalidations.push(args) } });
  const token = modules('lib/admin-session.ts').createAdminSessionToken();
  const route = modules('app/api/admin/services/refresh/route.ts').POST;
  const request = (admin, origin = 'https://qa.example.com') => new NextRequest('https://qa.example.com/api/admin/services/refresh', { method: 'POST', headers: { origin, ...(admin ? { cookie: `wlf_admin_session=${token}` } : {}) } });
  assert.equal((await route(request(false))).status, 401);
  assert.equal((await route(request(true, 'https://evil.example.com'))).status, 403);
  assert.equal(invalidations.length, 0);
  const response = await route(request(true)); assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.deepEqual(invalidations, [['services', { expire: 0 }]]);
});
test('authenticated service/asset webhooks expire gallery cache immediately; other content retains existing behavior', async t => {
  const original = process.env.CONTENTFUL_REVALIDATE_SECRET; process.env.CONTENTFUL_REVALIDATE_SECRET = 'qa-webhook-secret';
  t.after(() => { if (original === undefined) delete process.env.CONTENTFUL_REVALIDATE_SECRET; else process.env.CONTENTFUL_REVALIDATE_SECRET = original; });
  const invalidations = [];
  const modules = sourceLoader({ 'next/cache': { revalidateTag: (...args) => invalidations.push(args), revalidatePath: () => {} } });
  const route = modules('app/api/revalidate/contentful/route.ts').POST;
  const request = (body, secret = 'qa-webhook-secret') => new Request('https://qa.example.com/api/revalidate/contentful', { method: 'POST', headers: { 'content-type': 'application/json', 'x-contentful-secret': secret }, body: JSON.stringify(body) });
  assert.equal((await route(request({ contentType: 'service' }, 'wrong'))).status, 401);
  assert.equal(invalidations.length, 0);
  for (const body of [{ contentType: 'service' }, { sys: { type: 'Asset' } }]) assert.equal((await route(request(body))).status, 200);
  assert.deepEqual(invalidations, [['services', { expire: 0 }], ['services', { expire: 0 }]]);
  assert.equal((await route(request({ contentType: 'recipe' }))).status, 200);
  assert.deepEqual(invalidations.slice(2), [['recipes-page', 'max'], ['shop-page', 'max']]);
});
