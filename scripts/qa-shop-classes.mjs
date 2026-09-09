// Isolated browser component QA. Synthetic catalogue, real UI/filter/cart code.
// Next navigation/images and authentication are adapted for a standalone browser.
// No CMS writes, email, checkout, or production enrollment changes.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import tailwind from '@tailwindcss/postcss';
import { sourceLoader } from './lib/load-typescript.mjs';

const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve('@tailwindcss/postcss'))('postcss');
const { build } = createRequire(require.resolve('drizzle-kit'))('esbuild');
const root = process.cwd();
const directory = path.join(root, 'docs/audit-screenshots/shop-classes-2026-09-09');
await mkdir(directory, { recursive: true });
const load = sourceLoader();
const { filterShopItems } = load('lib/shop-filter.ts');
const { getRecipeOnlyPageData } = load('lib/contentful-management.ts');
const sample = { id: 'qa-class', slug: 'qa-pasta-workshop', title: 'Fresh Pasta Workshop', description: 'Discover the art of fresh pasta, from mixing your dough to shaping a beautiful plate.', detailDescription: 'A sample public class for design verification only. Learn dough preparation, pasta shaping, and simple finishing techniques.\n\nOctober 10, 2026 · 10:00 AM CT. This is not a real scheduled class.', price: '$75', imagePath: '/recipes/pasta.png', productKind: 'cooking_class', capacity: 12, duration: '2 hours', eventDate: 'October 10, 2026 · 10:00 AM CT', sortOrder: 0, categoryIds: ['class'], categoryNames: ['Cooking Classes'] };
const recipe = { ...sample, id: 'qa-recipe', slug: 'qa-herby-pasta', title: 'Herby Pasta', description: 'A fresh, vibrant recipe to bring to your own table.', price: '$3', productKind: 'recipe', categoryIds: ['pasta'], categoryNames: ['Pasta'] };
const items = [sample, { ...sample, id: 'qa-class-2', slug: 'qa-seasonal-cooking', title: 'Seasonal Kitchen Essentials', description: 'Bring seasonal ingredients to life with thoughtful techniques and fresh flavors.', imagePath: '/about/food-img.png', eventDate: 'October 17, 2026 · 11:00 AM CT', price: '$125', capacity: 10 }, recipe];
assert.equal(filterShopItems(items, 'classes', new Set(['pasta']), '').length, 2);
assert.equal(filterShopItems(items, 'recipes', new Set(), '').length, 1);
assert.equal(filterShopItems(items, 'all', new Set(), ' October 17 ').length, 1);
assert.equal(filterShopItems(items, 'recipes', new Set(['breakfast']), '').length, 0);
assert.equal(filterShopItems([{ ...recipe, price: 'Free' }], 'all', new Set(), '').length, 0);
assert.equal(getRecipeOnlyPageData({ recipes: items, categories: [] }).recipes.length, 1);
const data = { bannerTitle: 'Good food. Great experiences.', bannerDescription: 'Recipes for your kitchen. A seat at Chef Amber’s table.', bannerImagePath: '/recipes/banner-recipes.png', categories: [{ id: 'pasta', name: 'Pasta', imagePath: '/recipes/pasta.png', sortOrder: 0 }, { id: 'class', name: 'Cooking Classes', imagePath: null, sortOrder: 1 }], recipes: items };
const adapters = {
  'next/image': `import React from 'react'; export default function Image({fill,priority,sizes,...p}) { return <img {...p} style={{...p.style,...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{})}} /> }`,
  'next/link': `import React from 'react'; export default function Link({prefetch,...p}) { return <a {...p}/> }`,
  'next/navigation': `export const useRouter=()=>({push:()=>{},replace:()=>{}});`,
  'next/cache': `export const unstable_cache=(fn)=>fn;`,
  '@/lib/auth-client': `export const useSession=()=>({data:null,isPending:false});`,
};
const entry = `import React from 'react'; import {createRoot} from 'react-dom/client'; import Shop from '@/app/shop/shop-page-client'; import Detail from '@/app/recipes/detail/[slug]/recipe-detail-client'; import {CartProvider,useCart} from '@/lib/cart-context';
const data=${JSON.stringify(data)}; const item=${JSON.stringify(sample)};
function Cart(){const {items}=useCart();return <output data-testid="cart">{JSON.stringify(items)}</output>}
const root=createRoot(document.getElementById('root')); window.showShop=(empty=false,category)=>root.render(<CartProvider><Shop key={String(empty)+category} data={empty?{...data,recipes:[data.recipes[2]]}:data} initialCategory={category}/></CartProvider>); window.showDetail=(missing=false)=>root.render(<CartProvider><Detail recipe={missing?{...item,eventDate:undefined,duration:undefined,cookTime:undefined,capacity:undefined,imagePath:null}:item} source="shop"/><Cart/></CartProvider>); window.showShop();`;
const bundle = await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: root }, bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' }, plugins: [{ name: 'isolated-browser-adapters', setup(build) { build.onResolve({ filter: /^(next\/|@\/lib\/auth-client)/ }, args => adapters[args.path] ? { path: args.path, namespace: 'adapter' } : undefined); build.onLoad({ filter: /.*/, namespace: 'adapter' }, args => ({ contents: adapters[args.path], loader: 'tsx', resolveDir: root })); } }] });
const css = (await postcss([tailwind({ base: root })]).process(await readFile('app/globals.css', 'utf8'), { from: path.join(root, 'app/globals.css') })).css;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
  await page.route('http://shop-qa.test/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/settings/tax') return route.fulfill({ json: { taxRate: 0 } });
    const file = path.resolve(root, 'public', `.${url.pathname}`);
    if (url.pathname !== '/' && !file.startsWith(path.join(root, 'public') + path.sep)) return route.abort();
    if (url.pathname !== '/') {
      try { return await route.fulfill({ body: await readFile(file), contentType: url.pathname.endsWith('.png') ? 'image/png' : 'image/jpeg' }); } catch { return route.fulfill({ status: 404, body: '' }); }
    }
    return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<html><head><meta charset="utf-8"><style>${css}</style></head><body style="--font-metropolis:Arial,sans-serif;--font-bebas-neue:Arial,sans-serif"><p style="padding:12px;text-align:center;background:#fff5df;font:12px Arial">QA SAMPLE — Not real classes or enrollment</p><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>` });
  });
  await page.goto('http://shop-qa.test/');
  await page.getByRole('heading', { name: 'Fresh Pasta Workshop' }).waitFor();
  assert.equal(await page.getByRole('article').count(), 2);
  assert.equal(await page.getByRole('heading', { name: 'Herby Pasta' }).count(), 1);
  await page.getByRole('button', { name: 'Cooking classes', exact: true }).click();
  assert.equal(await page.getByRole('heading', { name: 'Herby Pasta' }).count(), 0);
  await page.getByRole('textbox', { name: 'Search shop' }).fill('October 17');
  assert.equal(await page.getByRole('article').count(), 1);
  await page.getByRole('textbox', { name: 'Search shop' }).fill('no-such-class');
  await page.getByRole('heading', { name: 'No classes match your search' }).waitFor();
  await page.getByRole('button', { name: 'Clear search' }).click();
  assert.equal(await page.getByRole('article').count(), 2);
  const region = page.getByRole('region', { name: 'A seat at Chef Amber’s table' });
  await region.screenshot({ path: `${directory}/classes-desktop.png` });
  await page.getByRole('button', { name: 'Recipes', exact: true }).click();
  assert.equal(await page.getByRole('article').count(), 0);
  assert.equal(await page.getByRole('heading', { name: 'Herby Pasta' }).count(), 1);
  await page.evaluate(() => window.showShop(false, 'cooking-classes'));
  await region.waitFor();
  assert.equal(await page.getByRole('button', { name: 'Cooking classes', exact: true }).getAttribute('aria-pressed'), 'true');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width === 390) await region.screenshot({ path: `${directory}/classes-mobile.png` });
  }
  await page.evaluate(() => window.showShop(true, 'cooking-classes'));
  await page.getByRole('heading', { name: 'Public classes are coming to the table' }).waitFor();
  assert.equal(await page.getByRole('article').count(), 0);
  await region.screenshot({ path: `${directory}/classes-unavailable-mobile.png` });
  await page.evaluate(() => window.showDetail());
  await page.getByRole('heading', { level: 1, name: 'Fresh Pasta Workshop' }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'All cooking classes' }).getAttribute('href'), '/shop?category=cooking-classes');
  await page.getByRole('button', { name: 'Add seat to cart' }).click();
  const cart = JSON.parse(await page.getByTestId('cart').textContent());
  assert.equal(cart[0].kind, 'cooking_class'); assert.equal(cart[0].quantity, 1); assert.equal(cart[0].price, 75); assert.equal(cart[0].maxQuantity, 12);
  await page.getByRole('button', { name: 'Add seat to cart' }).waitFor();
  for (const [device, width] of [['desktop', 1440], ['mobile', 390]]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.getByTestId('cart').evaluate(el => el.style.display = 'none');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${directory}/class-detail-${device}.png`, fullPage: true });
  }
  await page.evaluate(() => window.showDetail(true));
  await page.getByText('Schedule to be announced').waitFor();
  assert.equal(await page.getByText('Up to 12 participants').count(), 0);
  assert.deepEqual(errors, []);
  if (process.argv.includes('--local-production')) {
    const local = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await local.addInitScript(() => sessionStorage.setItem('waistlessfoods-site-unlocked', 'true'));
    await local.goto('http://localhost:3010/shop?category=cooking-classes');
    await local.getByRole('heading', { name: 'Public classes are coming to the table' }).waitFor();
    assert.equal(await local.getByRole('article').count(), 0);
    assert.equal(await local.getByRole('button', { name: 'Cooking classes', exact: true }).getAttribute('aria-pressed'), 'true');
    await local.getByRole('region', { name: 'A seat at Chef Amber’s table' }).screenshot({ path: `${directory}/local-production-unavailable.png`, style: 'header { visibility: hidden !important; }' });
    const anonymous = await browser.newPage();
    await anonymous.goto('http://localhost:3010/shop');
    await anonymous.getByRole('heading', { name: 'Enter Admin Password' }).waitFor();
    console.log('PASS local production Shop: class deep link, unavailable state, preview gate retained. No production writes.');
  }
  console.log('PASS: 5 filter assertions; mixed catalogue, type filters, date search, empty search/reset, category deep link, 3 narrow widths, unavailable state, detail navigation, real cart add, missing metadata, no browser errors. Screenshots saved.');
} finally { await browser.close(); }
