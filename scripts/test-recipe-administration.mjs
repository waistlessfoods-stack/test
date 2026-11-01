// Actual server-page access decisions, with identity/Contentful/order reads
// replaced. No customer accounts, purchases, CMS edits, or emails are created.
import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server.js';
import { sourceLoader } from './lib/load-typescript.mjs';

const recipe = { id: 'qa-recipe', slug: 'qa-paid-recipe', title: 'QA recipe', price: '$5', description: 'Public recipe description', imagePath: null, sortOrder: 1, productKind: 'recipe', ingredients: ['PRIVATE_QA_INGREDIENT'], tools: ['PRIVATE_QA_TOOL'], instructionSteps: [{ title: 'PRIVATE_QA_STEP', description: 'Private method' }], ingredientsRichText: { private: 'PRIVATE_QA_RICH' }, toolsRichText: { private: 'PRIVATE_QA_RICH' }, instructionsRichText: { private: 'PRIVATE_QA_RICH' }, futurePrivateField: 'PRIVATE_QA_FUTURE' };

test('public preview serialization excludes every protected recipe field, including unknown future fields', () => {
  const { recipePurchasePreview } = sourceLoader()('lib/recipe-content-access.ts');
  const preview = recipePurchasePreview(recipe);
  assert.ok(!JSON.stringify(preview).includes('PRIVATE_QA'));
  assert.equal(preview.price, '$5'); assert.equal(preview.id, recipe.id);
  const classPreview = recipePurchasePreview({ ...recipe, productKind: 'cooking_class', capacity: 20, eventDate: '2027-01-20' });
  assert.equal(classPreview.capacity, 20); assert.equal(classPreview.eventDate, '2027-01-20'); assert.equal(classPreview.productKind, 'cooking_class');
});

test('paid full pages grant admin/purchaser access while anonymous and non-purchasing accounts remain locked', async () => {
  let admin = false; let userId = null; let purchased = false; let reads = 0;
  const Full = () => null; const Preview = () => null;
  const modules = sourceLoader({
    'server-only': {},
    '@/lib/contentful-management': { fetchRecipesPageFromContentful: async () => ({ recipes: [recipe] }), findRecipeBySlug: (recipes, slug) => recipes.find(recipe => recipe.slug === slug), isCookingClassProduct: item => item.productKind === 'cooking_class', getRecipeOnlyPageData: value => value },
    '@/lib/admin-page-session': { hasAdminPageSession: async () => admin },
    '@clerk/nextjs/server': { auth: async () => ({ userId }) },
    '@/lib/clerk-user-sync': { syncCurrentClerkUser: async () => null, getClerkUserIdentityIds: id => [id] },
    '@/lib/db': { db: { select: () => ({ from: () => ({ where: async () => { reads++; return purchased ? [{ items: [{ id: recipe.id }] }] : []; } }) }) } },
    'next/navigation': { redirect: path => { throw new Error(`redirect:${path}`); } },
    './recipe-full-client': { __esModule: true, default: Full },
    './recipe-detail-client': { __esModule: true, default: Preview },
  });
  const full = modules('app/recipes/detail/[slug]/full/page.tsx').default;
  const detail = modules('app/recipes/detail/[slug]/page.tsx').default;
  const props = { params: Promise.resolve({ slug: recipe.slug }) };
  const find = (element, type) => {
    if (!element || typeof element !== 'object') return null;
    if (element?.type === type) return element;
    const children = element?.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) { const found = find(child, type); if (found) return found; }
    return null;
  };
  await assert.rejects(() => full(props), /redirect:\/recipes\/detail\/qa-paid-recipe$/);
  const publicPreview = find(await detail(props), Preview);
  assert.ok(publicPreview); assert.ok(!JSON.stringify(publicPreview.props.recipe).includes('PRIVATE_QA'));
  admin = true;
  assert.ok(JSON.stringify(find(await full(props), Full).props.recipe).includes('PRIVATE_QA_INGREDIENT'));
  assert.equal(reads, 0, 'An administrator needs no purchase query');
  await assert.rejects(() => detail(props), /redirect:\/admin\/recipes\/qa-paid-recipe$/);
  admin = false; userId = 'qa-customer';
  await assert.rejects(() => full(props), /redirect:\/recipes\/detail\/qa-paid-recipe$/);
  purchased = true;
  assert.ok(JSON.stringify(find(await full(props), Full).props.recipe).includes('PRIVATE_QA_INGREDIENT'));
});

test('recipe refresh is admin-only and same-origin, and expires only published recipe/shop caches', async t => {
  const previous = process.env.ADMIN_PASSWORD; process.env.ADMIN_PASSWORD ||= 'qa-recipe-only';
  t.after(() => { if (previous === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previous; });
  const invalidations = [];
  const modules = sourceLoader({ 'server-only': {}, 'next/cache': { revalidateTag: (...args) => invalidations.push(args) } });
  const token = modules('lib/admin-session.ts').createAdminSessionToken();
  const handler = modules('app/api/admin/recipes/refresh/route.ts').POST;
  const request = (admin, origin = 'https://qa.example.com') => new NextRequest('https://qa.example.com/api/admin/recipes/refresh', { method: 'POST', headers: { origin, ...(admin ? { cookie: `wlf_admin_session=${token}` } : {}) } });
  assert.equal((await handler(request(false))).status, 401);
  assert.equal((await handler(request(true, 'https://evil.test'))).status, 403);
  assert.equal(invalidations.length, 0);
  assert.equal((await handler(request(true))).status, 200);
  assert.deepEqual(invalidations, [['recipes-page', { expire: 0 }], ['shop-page', { expire: 0 }]]);
});

test('page admin detection validates the existing signed cookie and Contentful editing links contain no credentials', async t => {
  const previous = process.env.ADMIN_PASSWORD; const previousSpace = process.env.Contentful_space_id;
  process.env.ADMIN_PASSWORD ||= 'qa-recipe-only'; process.env.Contentful_space_id = 'qa-space';
  t.after(() => { if (previous === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previous; if (previousSpace === undefined) delete process.env.Contentful_space_id; else process.env.Contentful_space_id = previousSpace; });
  let value;
  const modules = sourceLoader({ 'server-only': {}, 'next/headers': { cookies: async () => ({ get: () => value ? { value } : undefined }) } });
  const { hasAdminPageSession } = modules('lib/admin-page-session.ts');
  assert.equal(await hasAdminPageSession(), false);
  value = 'invalid'; assert.equal(await hasAdminPageSession(), false);
  value = modules('lib/admin-session.ts').createAdminSessionToken(); assert.equal(await hasAdminPageSession(), true);
  const url = new URL(modules('lib/contentful-editor-links.ts').contentfulEntryEditorUrl('qa-entry'));
  assert.equal(url.hostname, 'app.contentful.com'); assert.equal(url.pathname, '/spaces/qa-space/environments/master/entries/qa-entry'); assert.equal(url.search, '');
});
