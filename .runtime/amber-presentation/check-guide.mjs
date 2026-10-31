import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire('C:/Users/MSI/code/waistlessfoods/package.json');
require('dotenv').config({quiet:true});
const { chromium } = require('@playwright/test');
const base=process.env.WALKTHROUGH_BASE_URL || 'http://localhost:3015';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1080}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/admin/walkthrough#website-tour');
 await page.getByRole('button',{name:'Access Admin'}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'Your website, step by step.'}).count(),0);
 await page.locator('#password').fill(process.env.ADMIN_PASSWORD);
 await page.getByRole('button',{name:'Access Admin'}).click();
 await page.getByRole('heading',{name:'Your website, step by step.'}).waitFor();
 await page.waitForFunction(()=>Math.abs(document.getElementById('website-tour').getBoundingClientRect().top)<50);
 const body=await page.locator('main').innerText();
 for(const absent of ['USD $300','USD $700','USD $650','Monthly support','Presentation slide','three-month trial','What would you like to hand over','design + admin']) assert.ok(!body.includes(absent),absent);
 for(const id of ['recurring-work','team','support-options','trial','next-steps']) assert.equal(await page.locator('#'+id).count(),0);
 const nav=page.getByRole('navigation',{name:'Walkthrough sections'});
 assert.equal(await nav.getByRole('link').count(),7);
 for(const id of ['consultations','services','classes','recipes','newsletters','management','content']) {
  await nav.locator(`a[href="#${id}"]`).click();
  assert.equal(new URL(page.url()).hash,'#'+id);
 }
 assert.equal(await page.locator('main a[target="_blank"]').count(),22);
 await page.getByRole('checkbox').first().check();
 assert.equal(await page.getByRole('status').innerText(),'1 of 7 reviewed');
 await page.getByRole('button',{name:'Reset ticks'}).click();
 assert.equal(await page.getByRole('status').innerText(),'0 of 7 reviewed');
 await page.goto(base+'/admin/walkthrough');
 await page.getByRole('heading',{name:'Your website, step by step.'}).waitFor();
 await page.screenshot({path:'.runtime/amber-presentation/guide-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'.runtime/amber-presentation/guide-mobile.png'});
 await page.getByRole('link',{name:'Admin home',exact:true}).click();
 await page.getByRole('link',{name:/Website Walkthrough/}).click();
 await page.getByRole('heading',{name:'Your website, step by step.'}).waitFor();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({base,workflows:7,links:22,noSalesSections:true,noRetainerPricing:true,anchors:true,protectedLogin:true,mobile:true,progress:true,pageErrors:errors}));
}finally{await browser.close();}
