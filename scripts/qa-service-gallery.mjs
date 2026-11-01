// Published Contentful reads + local production UI/cache refresh. A separate
// labelled component fixture tests nine photos without publishing test assets.
// No CMS, customer, payment, or email mutations.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from 'contentful';
import { chromium } from '@playwright/test';
import tailwind from '@tailwindcss/postcss';
import { sourceLoader } from './lib/load-typescript.mjs';

const base = process.env.QA_BASE_URL || 'http://localhost:3010';
const output = process.env.QA_OUTPUT_DIR || 'docs/audit-screenshots/service-gallery-2026-11-01';
await mkdir(output, { recursive: true });
const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve('@tailwindcss/postcss'))('postcss');
const { build } = createRequire(require.resolve('drizzle-kit'))('esbuild');
const root = process.cwd();
const client = createClient({ space: process.env.Contentful_space_id || process.env.CONTENTFUL_SPACE_ID, accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN || process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN });
const [response, type] = await Promise.all([client.getEntries({ content_type: 'service', limit: 100, include: 3 }), client.getContentType('service')]);
const field = type.fields.find(field => field.id === 'subImages');
assert.equal(field.type, 'Array'); assert.equal(field.items.linkType, 'Asset');
const entries = response.items.filter(entry => ['private','catering','cooking-classes'].includes(entry.fields.slug));
const assetUrl = asset => asset?.fields?.file?.url?.replace(/^\/\//, 'https://');
const published = entries.map(entry => ({ slug: entry.fields.slug, title: entry.fields.title, main: assetUrl(entry.fields.thumbnailsImage), photos: entry.fields.subImages.map(assetUrl).filter(Boolean) }));
const main = published.find(entry => entry.slug === 'private').main;
const photos = published.flatMap(entry => entry.photos).slice(0,9).map(url => `${url}?w=400&h=400&fit=fill&fm=jpg&q=70`);
assert.equal(photos.length,9);
const report = { base, contentful: { publishedPhotoCounts: published.map(({slug,photos}) => ({slug,count:photos.length})), multiAssetField: true, contentMutations: false }, checks: [] };
const imageAdapter = `import React from 'react';export default function Image({fill,priority,sizes,...props}){return <img {...props} style={{...props.style,...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{})}}/>}`;
const bundle = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Gallery from '@/components/service-gallery';const root=createRoot(document.getElementById('root'));window.showGallery=(images=${JSON.stringify(photos)})=>root.render(<Gallery title="QA service" mainImage=${JSON.stringify(main)} gallery={images}/>);window.showGallery();`, resolveDir: root, loader:'tsx' }, bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'next-image-adapter',setup(build){build.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'adapter'}));build.onLoad({filter:/.*/,namespace:'adapter'},()=>({contents:imageAdapter,loader:'tsx',resolveDir:root}));}}] });
const css = (await postcss([tailwind({base:root})]).process(await readFile('app/globals.css','utf8'),{from:path.join(root,'app/globals.css')})).css;
const browser = await chromium.launch();
try {
  const fixture = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = []; fixture.on('pageerror',error=>errors.push(error.message));
  await fixture.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body style="--font-metropolis:Arial,sans-serif"><p style="background:#fff5df;padding:12px;text-align:center;font:12px Arial">QA ONLY - nine-photo layout using published assets; no CMS edits</p><div style="max-width:552px;margin:auto;padding:16px" id="root"></div></body></html>`);
  await fixture.addScriptTag({content:bundle.outputFiles[0].text});
  const group = fixture.getByRole('group',{name:'QA service photos',exact:true});
  await group.waitFor();
  assert.equal(await group.getByRole('button').count(),10);
  const last = group.getByRole('button',{name:'Show QA service photo 10 of 10',exact:true});
  await last.focus(); await last.press('Enter');
  assert.equal(await last.getAttribute('aria-pressed'),'true');
  assert.equal(await group.getByAltText('QA service main image').getAttribute('src'),photos[8]);
  const first = group.getByRole('button',{name:'Show QA service photo 1 of 10',exact:true});
  await first.focus(); await first.press('Space');
  assert.equal(await group.getByAltText('QA service main image').getAttribute('src'),main);
  assert.equal(await first.getAttribute('aria-pressed'),'true');
  for(const width of [1440,768,390,320]) {
    await fixture.setViewportSize({width,height:1100});
    assert.ok(await fixture.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await group.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    if(width===1440||width===390)await group.screenshot({path:`${output}/nine-photos-${width}.png`});
  }
  await last.click();
  await fixture.evaluate(()=>window.showGallery(['/recipes/pasta.png']));
  await fixture.waitForFunction(expected=>document.querySelector('img[alt="QA service main image"]')?.getAttribute('src')===expected,main);
  assert.equal(await group.getByAltText('QA service main image').getAttribute('src'),main);
  report.checks.push('Nine additional photos plus the main image render without truncation; Enter/Space select and restore the original; changed photo lists reset stale selection; 1440/768/390/320px fit.');
  assert.deepEqual(errors,[]);
  const admin = await browser.newContext({viewport:{width:1440,height:1080}});
  await admin.addCookies([{name:'wlf_admin_session',value:sourceLoader({'server-only':{}})('lib/admin-session.ts').createAdminSessionToken(),url:base,httpOnly:true,sameSite:'Lax'}]);
  await admin.addInitScript(()=>sessionStorage.setItem('waistlessfoods-site-unlocked','true'));
  const page = await admin.newPage();
  await page.goto(base+'/admin/services');
  await page.getByRole('heading',{name:'Service photos & content',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Edit in Contentful ↗',exact:true}).count(),3);
  await page.getByRole('button',{name:'Refresh published services',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Published service photos and content refreshed'}).waitFor();
  await page.screenshot({path:`${output}/admin-service-photos.png`,fullPage:true});
  report.checks.push('Actual signed-admin page exposes the service CMS links and instructions; its refresh button successfully calls the protected real cache endpoint.');
  for(const service of published) {
    await page.goto(`${base}/services/${service.slug}`);
    const gallery = page.getByRole('group',{name:`${service.title} photos`,exact:true});
    await gallery.waitFor();
    assert.equal(await gallery.getByRole('button').count(),new Set([service.main,...service.photos]).size);
    const buttons = gallery.getByRole('button');
    for(let index=0;index<await buttons.count();index++) {
      await buttons.nth(index).click();
      await gallery.getByAltText(`${service.title} main image`).evaluate(image=>image.decode());
      const actual=await gallery.getByAltText(`${service.title} main image`).evaluate(image=>new URL(image.currentSrc,location.href).searchParams.get('url')||image.src);
      assert.equal(actual,[service.main,...service.photos][index]);
    }
    await buttons.first().click();
    if(service.slug!=='cooking-classes'){
      await page.setViewportSize({width:390,height:1000});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await gallery.screenshot({path:`${output}/${service.slug}-mobile.png`,style:'header{visibility:hidden!important}'});
      await page.setViewportSize({width:1440,height:1080});
    }
    report.checks.push(`${service.slug}: every published gallery image loads and selects correctly; original main thumbnail remains available.`);
  }
  const anonymous=await browser.newContext();
  assert.equal((await anonymous.request.post(base+'/api/admin/services/refresh',{headers:{origin:base}})).status(),401);
  assert.equal((await admin.request.post(base+'/api/admin/services/refresh',{headers:{origin:'https://untrusted.example.com'}})).status(),403);
  report.passed=true;console.log(JSON.stringify(report,null,2));
}catch(error){report.failure=error.message;throw error;}
finally{await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));}
