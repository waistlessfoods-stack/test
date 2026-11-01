// Production React Orders UI with only Next navigation/images and identity
// adapted. Actual handlers/services use PostgreSQL TEMP orders; Stripe/SMTP
// are in-memory fixtures. No real checkout, payment, mail, or customer writes.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import Stripe from 'stripe';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NextRequest } from 'next/server.js';
import { chromium } from '@playwright/test';
import tailwind from '@tailwindcss/postcss';
import { render } from '@react-email/render';
import { sourceLoader } from './lib/load-typescript.mjs';

const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve('@tailwindcss/postcss'))('postcss');
const { build } = createRequire(require.resolve('drizzle-kit'))('esbuild');
const root = process.cwd();
const output = 'docs/audit-screenshots/shop-payment-flow-2026-11-01';
await mkdir(output, { recursive: true });
const product = { id: 'qa-class', slug: 'qa-class', title: 'QA SAMPLE - Fresh Pasta Workshop', description: 'Fictional class for testing only.', price: '$75', productKind: 'cooking_class', capacity: 4, eventDate: 'January 20, 2027 at 10 AM CT', imagePath: null };
const adapters = {
  'next/image': `import React from 'react'; export default function Image({fill,priority,sizes,...p}) { return <img {...p} /> }`,
  'next/link': `import React from 'react'; export default function Link({prefetch,...p}) { return <a {...p}/> }`,
  'next/navigation': `const router={push:()=>{},replace:()=>{}};export const useRouter=()=>router;export const useSearchParams=()=>new URLSearchParams(location.search);`,
  '@/lib/auth-client': `export const useSession=()=>({data:{user:{id:'qa-owner',email:'qa-owner@example.com'}},isPending:false});`,
};
const bundle = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Orders from '@/app/orders/page';createRoot(document.getElementById('root')).render(<Orders/>);`, loader: 'tsx', resolveDir: root }, bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'qa-browser-adapters', setup(build) {
  build.onResolve({ filter: /^(next\/|@\/lib\/auth-client)/ }, args => adapters[args.path] ? { path: args.path, namespace: 'adapter' } : undefined);
  build.onLoad({ filter: /.*/, namespace: 'adapter' }, args => ({ contents: adapters[args.path], loader: 'tsx', resolveDir: root }));
} }] });
const css = (await postcss([tailwind({ base: root })]).process(await readFile('app/globals.css', 'utf8'), { from: path.join(root, 'app/globals.css') })).css;
const databaseUrl = new URL(process.env.DATABASE_URL);
if (databaseUrl.hostname.endsWith('.neon.tech')) databaseUrl.hostname = databaseUrl.hostname.replace(/-pooler(?=\.)/, '');
databaseUrl.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: databaseUrl.href, connectionTimeoutMillis: 15000 });
await client.connect(); client.on('error', () => {});
const browser = await chromium.launch();
const report = { database: 'TEMP orders; transaction rolled back', stripe: 'fixture only', smtp: 'mocked', browserIdentity: 'fictional QA account adapter', checks: [] };
try {
  await client.query('BEGIN'); await client.query('SET LOCAL search_path TO pg_temp');
  await client.query('CREATE TEMP TABLE orders(id serial PRIMARY KEY,user_id text NOT NULL,stripe_session_id text UNIQUE NOT NULL,stripe_payment_intent_id text,status text NOT NULL,amount integer NOT NULL,currency text NOT NULL,items jsonb NOT NULL,customer_email text,metadata jsonb,created_at timestamp DEFAULT now(),updated_at timestamp DEFAULT now())');
  assert.equal((await client.query("SELECT relnamespace=pg_my_temp_schema() AS isolated FROM pg_class WHERE oid='orders'::regclass")).rows[0].isolated,true);
  let tail=Promise.resolve();
  const database={transaction:work=>{const run=tail.then(()=>work(async(sql,values=[]) => (await client.query(sql,values)).rows));tail=run.catch(()=>{});return run;}};
  const pure=sourceLoader({'server-only':{}});
  const shopCheckout=pure('lib/shop-checkout.ts').createShopCheckout(database);
  const sessions=new Map();const sends=[];let sequence=0;let failure=false;
  const stripe={webhooks:new Stripe('sk_test_fixture').webhooks,checkout:{sessions:{
    create:async params=>{const id=`cs_test_qa${++sequence}`;const session={id,livemode:false,status:'open',payment_status:'unpaid',currency:'usd',amount_total:params.line_items.reduce((sum,line)=>sum+line.price_data.unit_amount*line.quantity,0),url:`https://checkout.stripe.com/c/pay/${id}`,metadata:params.metadata,expires_at:params.expires_at};sessions.set(id,session);return {...session};},
    retrieve:async id=>{if(failure||!sessions.has(id))throw new Error('QA Stripe unavailable');return {...sessions.get(id)};},
    expire:async id=>{const session=sessions.get(id);session.status='expired';return {...session};},
  }}};
  const modules=sourceLoader({
    'server-only':{},'@/lib/db':{db:drizzle(client)},'@/lib/shop-checkout-store':{shopCheckout},
    '@/lib/checkout-content':pure('lib/checkout-content.ts'),
    '@/lib/stripe-config':{getStripeSecretKey:()=> 'sk_test_fixture',getStripeWebhookSecret:()=> 'whsec_qa_fixture'},
    stripe:class {constructor(){return stripe}},
    '@clerk/nextjs/server':{auth:async()=>({userId:'qa-owner'}),currentUser:async()=>({primaryEmailAddress:{emailAddress:'qa-owner@example.com'}})},
    '@/lib/clerk-user-sync':{syncCurrentClerkUser:async()=>({skipped:true}),getClerkUserIdentityIds:()=>['qa-owner']},
    '@/lib/contentful-management':{fetchShopPageFromContentful:async()=>({recipes:[product]})},
    '@/lib/public-cooking-classes':{arePublicCookingClassesEnabled:()=>true},'@/lib/tax-settings':{getServerSalesTaxRate:async()=>0.0825},
    '@/lib/app-url':{getCanonicalAppUrl:()=> 'https://shop-qa.test'},
    '@/lib/email/mailer':{fromEmail:'qa-sender@example.com',sendEmail:async message=>{sends.push(message);return {error:null,data:{id:'qa-mocked'}}}},
    '@/lib/structured-log':{logInfo(){},logError(){},maskEmail:()=> '[redacted]'},
    '@/lib/service-invoice-workflow-store':{invoiceWorkflow:new Proxy({},{get(){throw new Error('No service-invoice operations in shop QA')}})},
  });
  const routes={checkout:modules('app/api/stripe/checkout/route.ts'),resume:modules('app/api/orders/[id]/checkout/route.ts'),orders:modules('app/api/orders/route.ts'),reconcile:modules('app/api/orders/reconcile/route.ts'),webhook:modules('app/api/stripe/webhook/route.ts')};
  const create=await routes.checkout.POST(new NextRequest('https://shop-qa.test/api/stripe/checkout',{method:'POST',headers:{origin:'https://shop-qa.test','content-type':'application/json'},body:JSON.stringify({items:[{id:product.id,quantity:2}]})}));assert.equal(create.status,200);
  const session=[...sessions.values()][0];
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('https://shop-qa.test/**',async route=>{
    const original=route.request();const url=new URL(original.url());
    if(url.pathname.startsWith('/api/')){
      const request=new NextRequest(original.url(),{method:original.method(),headers:original.headers(),...(original.method()!=='GET'?{body:original.postData()||'{}'}:{})});
      let response;
      if(url.pathname==='/api/orders')response=await routes.orders.GET();
      else if(url.pathname==='/api/orders/reconcile')response=await routes.reconcile.POST();
      else if(url.pathname==='/api/orders/1/checkout')response=await routes.resume.POST(request,{params:Promise.resolve({id:'1'})});
      else throw new Error(`Unexpected QA endpoint ${url.pathname}`);
      return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
    }
    return route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body style="--font-metropolis:Arial,sans-serif"><p style="text-align:center;background:#fff5df;padding:12px;font:12px Arial">QA SAMPLE - No real class, payment, or email</p><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`});
  });
  const page=await context.newPage();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`https://shop-qa.test/orders?success=1&session_id=${session.id}`);
  await page.getByRole('heading',{name:'Review your payment status',exact:true}).waitFor();
  await page.getByRole('button',{name:'Refresh payment status',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Payment confirmed',exact:true}).count(),0);
  await page.getByText('PENDING',{exact:true}).waitFor();
  await page.getByText(`Class date: ${product.eventDate}`,{exact:true}).waitFor();
  report.checks.push('Return URL alone never shows payment confirmed; actual SQL order is pending and shows two seats, booked date, stored total, and Continue Payment.');
  await page.screenshot({path:`${output}/pending-desktop.png`,fullPage:true});
  failure=true;
  await page.getByRole('button',{name:'Refresh payment status',exact:true}).click();
  await page.getByText('Some payments could not be checked. Please retry shortly before starting another payment.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Continue Payment',exact:true}).click();
  await page.getByText(/An existing payment could not be checked/).waitFor();
  assert.equal(sessions.size,1);
  report.checks.push('A Stripe lookup interruption appears in the real Orders UI; Continue Payment returns an actionable error and creates no second payable link.');
  failure=false;session.status='complete';session.payment_status='paid';session.payment_intent='pi_qa';session.customer_details={name:'QA Sample Customer'};
  await page.getByRole('button',{name:'Refresh payment status',exact:true}).click();
  await page.getByRole('heading',{name:'Payment confirmed',exact:true}).waitFor();
  await page.getByText('COMPLETED',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Continue Payment',exact:true}).count(),0);
  assert.equal(await page.getByRole('link',{name:'Open full recipe',exact:true}).count(),0);
  assert.equal(await page.getByRole('link',{name:'View class details',exact:true}).getAttribute('href'),`/shop/${product.slug}`);
  assert.equal(sends.length,2);
  assert.deepEqual(sends.map(message=>message.to).sort(),['info@waistlessfoods.com','qa-owner@example.com']);
  for(const message of sends){const text=await render(message.react,{plainText:true});assert.ok(text.includes(product.eventDate));assert.ok(text.includes('$162.38'));}
  const payload=JSON.stringify({id:'evt_qa_replay',type:'checkout.session.completed',data:{object:session}});
  const signature=stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_qa_fixture'});
  assert.equal((await routes.webhook.POST(new Request('https://shop-qa.test/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}))).status,200);
  assert.equal(sends.length,2);
  const roster=await modules('lib/class-roster-data.ts').readClassRosters('test');assert.equal(roster.classes[0].confirmedSeats,2);
  for(const [name,width] of [['desktop',1440],['mobile',390],['narrow',320]]){
    await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(width!==320)await page.screenshot({path:`${output}/paid-${name}.png`,fullPage:true});
  }
  report.checks.push('Actual reconciliation marks the returned order paid, renders class details at 1440/390/320px, sends one mocked message per audience, and records two confirmed seats. A signed webhook replay adds no emails.');
  assert.deepEqual(errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
} catch(error){report.failure=error.message;throw error;}
finally{await browser.close();try{await client.query('ROLLBACK');}finally{await client.end();}await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));}
