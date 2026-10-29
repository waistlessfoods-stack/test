// Read-only checks of the guide, protected image delivery and gallery controls.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base=process.env.WALKTHROUGH_BASE_URL || 'http://localhost:3015';
const evidence=JSON.parse(await readFile('lib/walkthrough-evidence.json','utf8'));
const browser=await chromium.launch({headless:true});
const directory='.runtime/walkthrough-evidence';await mkdir(directory,{recursive:true});
const report={base,screenshots:evidence.screenshots.length,checks:[]};
try {
 const anon=await browser.newContext();
 const sample='/api/admin/walkthrough-images/'+evidence.screenshots[0].file;
 assert.equal((await anon.request.get(base+sample)).status(),401);
 await anon.close();report.checks.push('Anonymous image access denied.');
 const context=await browser.newContext({viewport:{width:1440,height:1080}});
 const secret=process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;assert.ok(secret);
 const payload=`${Date.now()+3600000}.${randomBytes(16).toString('hex')}`;
 await context.addCookies([{name:'wlf_admin_session',value:`${payload}.${createHmac('sha256',secret).update(payload).digest('hex')}`,url:base,httpOnly:true,secure:base.startsWith('https'),sameSite:'Lax'}]);
 for(const shot of evidence.screenshots) {
  const response=await context.request.get(base+'/api/admin/walkthrough-images/'+shot.file);
  assert.equal(response.status(),200,shot.file);
  assert.match(response.headers()['content-type'],/^image\/(jpeg|png)$/);
  assert.match(response.headers()['cache-control'],/private, no-store/);
  assert.ok((await response.body()).length>1000);
 }
 assert.equal((await context.request.get(base+'/api/admin/walkthrough-images/unknown.jpg')).status(),404);
 report.checks.push('Every image serves only with admin authentication, no-store headers, and an allow-listed filename.');
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/admin/walkthrough#website-tour');
 await page.getByRole('heading',{name:'Your website, step by step.'}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'See the steps on screen',exact:true}).count(),7);
 for(const section of evidence.sections) {
  const region=page.locator(`div[aria-label="${section.id} screenshot guide"]`);
  const buttons=region.getByRole('group',{name:section.id+' screenshots'}).getByRole('button');
  assert.equal(await buttons.count(),evidence.screenshots.filter(shot=>shot.section===section.id).length);
  for(let i=0;i<await buttons.count();i++) {
   await buttons.nth(i).click();
   const img=region.locator('img');
   await img.evaluate(img=>img.decode());
   assert.ok(await img.evaluate(img=>img.complete&&img.naturalWidth>100));
  }
  await region.getByText('What was checked and what remains',{exact:true}).click();
  assert.ok(await region.getByText('Still to verify:',{exact:false}).isVisible());
  await buttons.first().click();
 }
 assert.equal(await page.getByRole('checkbox').count(),7);
 await page.getByRole('checkbox').first().check();
 assert.equal(await page.getByRole('status').innerText(),'1 of 7 reviewed');
 const consultation=page.locator('#consultations');
 await consultation.screenshot({path:directory+'/guide-gallery-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await consultation.screenshot({path:directory+'/guide-gallery-mobile.png'});
 const [popup]=await Promise.all([page.waitForEvent('popup'),consultation.getByRole('link',{name:/Open full-size image:/}).click()]);
 await popup.waitForLoadState('domcontentloaded');
 assert.ok((await popup.url()).includes('/api/admin/walkthrough-images/'));
 await popup.close();
 assert.deepEqual(errors,[]);report.checks.push('All gallery selectors, images, full-size links, notes, review ticks and mobile layout passed.');
 console.log(JSON.stringify(report));
}finally{await browser.close();await writeFile(directory+'/gallery-qa.json',JSON.stringify(report,null,2));}
