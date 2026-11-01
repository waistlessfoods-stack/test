// Read-only readiness evidence. Reports counts/configuration booleans only;
// never prints keys, order ids, customer details, or complete recipe content.
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from 'contentful';
import pg from 'pg';
import { sourceLoader } from './lib/load-typescript.mjs';

const pure=sourceLoader({'server-only':{}});
const key=pure('lib/stripe-config.ts').getStripeSecretKey();
const configuredMode=pure('lib/stripe-config.ts').getStripeMode();
let actualMode=null;
try{if(key)actualMode=pure('lib/checkout-content.ts').checkoutKeyMode(key);}catch{/* report readiness, never secret */}
const report={inspectedAt:new Date().toISOString(),noMutations:true,scope:'locally configured environment and published CMS',
  localConfiguration:{configuredStripeMode:configuredMode,actualKeyMode:actualMode,modeMatches:actualMode===configuredMode,webhookSecretConfigured:Boolean(pure('lib/stripe-config.ts').getStripeWebhookSecret()),publicClassEnrollmentEnabled:process.env.PUBLIC_COOKING_CLASSES_ENABLED==='true',shopAdminNotificationRecipientIsBusinessInbox:pure('lib/email/notification-recipients.ts').businessOrderEmail==='info@waistlessfoods.com'},
  publishedClasses:[],orderCounts:[],unclassifiedClassLines:0,qaSchemasPresent:0};
const contentful=createClient({space:process.env.Contentful_space_id||process.env.CONTENTFUL_SPACE_ID,accessToken:process.env.CONTENTFUL_DELIVERY_TOKEN||process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_TOKEN});
const response=await contentful.getEntries({content_type:'shopPage',limit:1,include:4});
if(!response.items.length)throw new Error('No published Shop page found. No changes made.');
const modules=sourceLoader({'next/cache':{unstable_cache:fn=>fn},contentful:{createClient:()=>({getEntries:async()=>response})}});
const original=console.log;let data;
try{console.log=()=>{};data=await modules('lib/contentful-management.ts').fetchShopPageFromContentful();}finally{console.log=original;}
const classes=data.recipes.filter(item=>item.productKind==='cooking_class');
report.publishedClasses=classes.map(item=>({title:item.title,slug:item.slug,hasDate:Boolean(item.eventDate?.trim()),hasCapacity:Number.isSafeInteger(item.capacity)&&item.capacity>0,hasPaidPrice:Number(item.price.replace(/[^0-9.]/g,''))>0}));
const databaseUrl=new URL(process.env.DATABASE_URL);databaseUrl.searchParams.set('sslmode','verify-full');
const client=new pg.Client({connectionString:databaseUrl.href,connectionTimeoutMillis:15000});await client.connect();
try{
  const rows=await client.query(`SELECT CASE WHEN left(stripe_session_id,8)='cs_test_' THEN 'test' WHEN left(stripe_session_id,8)='cs_live_' THEN 'live' ELSE 'unknown' END AS mode,status,count(*)::int AS orders
    FROM orders WHERE items @> '[{"kind":"cooking_class"}]'::jsonb GROUP BY 1,2 ORDER BY 1,2`);
  report.orderCounts=rows.rows;
  const legacy=await client.query(`SELECT count(*)::int AS count FROM orders CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(items)='array' THEN items ELSE '[]'::jsonb END) line
    WHERE line->>'id' IN (SELECT jsonb_array_elements_text($1::jsonb)) AND line->>'kind' IS DISTINCT FROM 'cooking_class'`,[JSON.stringify(classes.map(item=>item.id))]);
  report.unclassifiedClassLines=legacy.rows[0].count;
  report.qaSchemasPresent=(await client.query("SELECT count(*)::int AS count FROM pg_namespace WHERE nspname LIKE 'qa_checkout_%'")).rows[0].count;
}finally{await client.end();}
const directory='docs/audit-screenshots/shop-payment-flow-2026-11-01';await mkdir(directory,{recursive:true});
await writeFile(`${directory}/readiness.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
