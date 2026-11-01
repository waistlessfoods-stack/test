// Read-only local production smoke. Requests are anonymous or signed admin page
// reads; checkout mutations are rejected before customer/database/Stripe work.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { sourceLoader } from './lib/load-typescript.mjs';

const base='http://localhost:3010';
const browser=await chromium.launch();
const report={base,noPaymentOrEmail:true,checks:[]};
try{
  const anonymous=await browser.newContext();
  for(const endpoint of ['/api/stripe/checkout','/api/orders/1/checkout']){
    assert.equal((await anonymous.request.post(base+endpoint,{headers:{origin:base},data:{items:[{id:'not-a-real-product',quantity:1}]}})).status(),401);
    assert.equal((await anonymous.request.post(base+endpoint,{headers:{origin:'https://untrusted.example.com'},data:{}})).status(),403);
  }
  report.checks.push('Both new/resume checkout APIs reject anonymous customers and cross-origin mutations on the actual production build.');
  const visitor=await anonymous.newPage();await visitor.goto(base+'/stripe-test');
  await visitor.getByRole('heading',{name:'Admin Portal',exact:true}).waitFor();
  assert.equal(await visitor.getByRole('heading',{name:'Checkout verification',exact:true}).count(),0);
  const admin=await browser.newContext({viewport:{width:390,height:844}});
  await admin.addCookies([{name:'wlf_admin_session',value:sourceLoader({'server-only':{}})('lib/admin-session.ts').createAdminSessionToken(),url:base,httpOnly:true,sameSite:'Lax'}]);
  await admin.addInitScript(()=>sessionStorage.setItem('waistlessfoods-site-unlocked','true'));
  const page=await admin.newPage();await page.goto(base+'/stripe-test');
  await page.getByRole('heading',{name:'Checkout verification',exact:true}).waitFor();
  await page.getByRole('link',{name:'Open Shop',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Start Checkout',exact:true}).count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'docs/audit-screenshots/shop-payment-flow-2026-11-01/admin-checkout-verification.png',fullPage:true});
  report.checks.push('Checkout verification page requires the administrator session, displays the configured payment environment and class release state, and directs testing through the real Shop instead of an arbitrary charge.');
  report.passed=true;console.log(JSON.stringify(report,null,2));
}catch(error){report.failure=error.message;throw error;}
finally{await browser.close();await writeFile('docs/audit-screenshots/shop-payment-flow-2026-11-01/production-guards.json',JSON.stringify(report,null,2));}
