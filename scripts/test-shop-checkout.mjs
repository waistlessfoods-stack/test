// Stripe/SMTP are replaced. --integration creates one isolated QA schema so two
// real connections can exercise competing transactions, then drops that schema.
// Never reads/writes the application's public orders or customer tables.
import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import Stripe from 'stripe';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NextRequest } from 'next/server.js';
import { render } from '@react-email/render';
import { sourceLoader } from './lib/load-typescript.mjs';

const load = sourceLoader({ 'server-only': {} });
const { resolveCheckoutItems, checkoutSessionState, checkoutKeyMode } = load('lib/checkout-content.ts');
const { createShopCheckout } = load('lib/shop-checkout.ts');
const { createOrderCheckoutSnapshot } = load('lib/order-checkout-snapshot.ts');
const { calculateCartTotals } = load('lib/pricing.ts');
const cookingClass = { id: 'qa-class', slug: 'qa-class', title: 'QA pasta workshop', price: '$75', description: 'QA only', imagePath: null, productKind: 'cooking_class', capacity: 4, eventDate: 'January 20, 2027 at 10 AM CT' };
const recipe = { ...cookingClass, id: 'qa-recipe', slug: 'qa-recipe', title: 'QA recipe', productKind: 'recipe', price: '$5' };
const catalogue = [cookingClass, recipe];
function snapshot(quantity = 2, product = cookingClass) {
  const items = resolveCheckoutItems([{ id: product.id, quantity }], [product], true);
  return createOrderCheckoutSnapshot({ currency: 'usd', items, ...calculateCartTotals(items, 0.0825), taxRate: 0.0825 });
}
function provider(mode = 'test') {
  const sessions = new Map(); let sequence = 0; let gate; let retrievalError = false;
  const calls = [];
  const stripe = { webhooks: new Stripe('sk_test_fixture').webhooks, checkout: { sessions: {
    retrieve: async id => { calls.push(['retrieve', id]); if (retrievalError || !sessions.has(id)) throw new Error('QA provider unavailable'); return { ...sessions.get(id) }; },
    create: async params => {
      calls.push(['create', params]);
      if (gate) await gate();
      const id = `cs_${mode}_qa${++sequence}`;
      const session = { id, livemode: mode === 'live', status: 'open', payment_status: 'unpaid', currency: 'usd', amount_total: params.line_items.reduce((sum,line) => sum+line.price_data.unit_amount*line.quantity,0), url: `https://checkout.stripe.com/c/pay/${id}`, metadata: params.metadata, expires_at: params.expires_at || Math.floor(Date.now()/1000)+86400 };
      sessions.set(id, session); return { ...session };
    },
    expire: async id => { calls.push(['expire', id]); const session = sessions.get(id); assert.equal(session.status, 'open'); session.status = 'expired'; session.url = null; return { ...session }; },
  } } };
  return { stripe, sessions, calls, setGate: value => { gate = value; }, failRetrieval: value => { retrievalError = value; } };
}

test('checkout resolves only published product data and rejects malformed/hidden items', () => {
  const items = resolveCheckoutItems([{ id: cookingClass.id, quantity: 2, price: 1, capacity: 100, eventDate: 'fake' }, { slug: cookingClass.slug, quantity: 1 }], catalogue, true);
  assert.equal(items.length, 1); assert.equal(items[0].quantity, 3); assert.equal(items[0].price, 75); assert.equal(items[0].eventDate, cookingClass.eventDate); assert.equal(items[0].capacity, 4);
  for (const quantity of [0, -1, 1.5, '2', true, 21, Number.MAX_SAFE_INTEGER+1]) assert.throws(() => resolveCheckoutItems([{ id: recipe.id, quantity }], catalogue, true));
  assert.throws(() => resolveCheckoutItems([{ id: cookingClass.id, quantity: 1 }], catalogue, false), /not currently available/);
  assert.throws(() => resolveCheckoutItems([{ id: recipe.id, slug: cookingClass.slug, quantity: 1 }], catalogue, true));
  assert.throws(() => resolveCheckoutItems([{ id: cookingClass.id, quantity: 5 }], catalogue, true));
  for (const patch of [{ capacity: undefined }, { eventDate: '' }, { price: 'Free' }]) assert.throws(() => resolveCheckoutItems([{ id: cookingClass.id, quantity: 1 }], [{ ...cookingClass, ...patch }], true));
});
test('session state distinguishes paid/processing/expired and rejects a different mode', () => {
  const base = { id: 'cs_test_qa', livemode: false, status: 'open', payment_status: 'unpaid', url: 'https://checkout.stripe.com/test' };
  assert.equal(checkoutSessionState(base, 'test'), 'open');
  assert.equal(checkoutSessionState({ ...base, status: 'expired' }, 'test'), 'expired');
  assert.equal(checkoutSessionState({ ...base, status: 'complete' }, 'test'), 'processing');
  assert.equal(checkoutSessionState({ ...base, payment_status: 'paid' }, 'test'), 'paid');
  assert.throws(() => checkoutSessionState(base, 'live'));
  assert.equal(checkoutKeyMode('sk_live_fixture'), 'live'); assert.equal(checkoutKeyMode('rk_test_fixture'), 'test'); assert.throws(() => checkoutKeyMode('invalid'));
});

test('real SQL checkout, competing seats, retries, payment, confirmations, and roster', { skip: !process.argv.includes('--integration') && 'Pass --integration with DATABASE_URL' }, async t => {
  assert.ok(process.env.DATABASE_URL);
  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (databaseUrl.hostname.endsWith('.neon.tech')) databaseUrl.hostname = databaseUrl.hostname.replace(/-pooler(?=\.)/, '');
  databaseUrl.searchParams.set('sslmode','verify-full');
  const clients = Array.from({ length: 3 }, () => new pg.Client({ connectionString: databaseUrl.href, connectionTimeoutMillis: 15000 }));
  const schema = `qa_checkout_${randomUUID().replaceAll('-','')}`;
  assert.match(schema, /^qa_checkout_[0-9a-f]{32}$/);
  let createdSchema = false;
  try {
    await Promise.all(clients.map(client => client.connect()));
    const [control, first, second] = clients;
    await control.query(`CREATE SCHEMA "${schema}"`); createdSchema = true;
    await control.query(`CREATE TABLE "${schema}".orders(id serial PRIMARY KEY,user_id text NOT NULL,stripe_session_id text UNIQUE NOT NULL,stripe_payment_intent_id text,status text NOT NULL,amount integer NOT NULL,currency text NOT NULL,items jsonb NOT NULL,customer_email text,metadata jsonb,created_at timestamp DEFAULT now(),updated_at timestamp DEFAULT now())`);
    await Promise.all(clients.map(client => client.query(`SET search_path TO "${schema}"`)));
    await Promise.all(clients.map(client => client.query("SET statement_timeout TO '15s'")));
    const secondPid = (await second.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    for (const client of clients) assert.equal((await client.query("SELECT n.nspname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.oid='orders'::regclass")).rows[0].nspname, schema);
    const adapter = client => ({ transaction: async work => {
      await client.query('BEGIN');
      try { const result = await work(async (sql, values=[]) => (await client.query(sql,values)).rows); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    } });
    const service = createShopCheckout(adapter(first));
    const other = createShopCheckout(adapter(second));
    let fake = provider();
    const context = () => ({ stripe: fake.stripe, mode: 'test', appUrl: 'https://qa.example.com' });
    const create = (userId='qa-owner', quantity=2, product=cookingClass, selected=service) => selected.create({ ...context(), userId, email: `${userId}@example.com`, snapshot: snapshot(quantity,product) });
    const resume = (id, extra={}) => service.resume({ ...context(), orderId:id, ownerIds:['qa-owner'], catalogue, classesEnabled:true,...extra });
    const rows = async () => (await control.query('SELECT * FROM orders ORDER BY id')).rows;
    const reset = async () => { await control.query('TRUNCATE orders RESTART IDENTITY'); fake=provider(); };
    async function seed({ mode='test', status='completed', date=cookingClass.eventDate, quantity=2 }={}) {
      const value=snapshot(quantity,{...cookingClass,eventDate:date});
      await control.query("INSERT INTO orders(user_id,stripe_session_id,status,amount,currency,items,customer_email,metadata) VALUES ('qa-seed',$1,$2,$3,'usd',$4::jsonb,'qa-seed@example.com',$5::jsonb)",[`cs_${mode}_seed${randomUUID()}`,status,value.totalCents,JSON.stringify(value.items),JSON.stringify({checkoutSnapshot:value})]);
    }
    await t.test('canonical totals/ticket dates are saved; repeated requests reuse one payable session', async () => {
      const firstResult=await create(); const retry=await create();
      assert.equal(retry.url,firstResult.url); assert.equal(retry.reused,true);
      assert.equal((await rows()).length,1); assert.equal(fake.sessions.size,1);
      const row=(await rows())[0]; assert.equal(row.amount,16238); assert.equal(row.items[0].quantity,2); assert.equal(row.items[0].eventDate,cookingClass.eventDate);
      const params=fake.calls.find(call=>call[0]==='create')[1];
      assert.equal(params.line_items[0].quantity,2); assert.equal(params.line_items[0].price_data.unit_amount,7500);
      assert.ok(params.expires_at>=Math.floor(Date.now()/1000)+1800);
    });
    await t.test('test-mode and other-date purchases do not consume current live/date capacity; refunds release seats', async () => {
      await reset(); await seed({mode:'live',quantity:4}); await seed({date:'Another date',quantity:4}); await seed({status:'refunded',quantity:4});
      await create('qa-owner',4); assert.equal(fake.sessions.size,1);
      await assert.rejects(create('another-owner',1), /sold out/); assert.equal(fake.sessions.size,1);
    });
    await t.test('open and paid-before-webhook sessions hold seats; expired sessions release them', async () => {
      await reset(); await create('qa-owner',3);
      await assert.rejects(create('another-owner',2), /Only 1 seat/);
      const session=[...fake.sessions.values()][0]; session.status='complete'; session.payment_status='paid'; session.url=null;
      await assert.rejects(create('another-owner',2), /Only 1 seat/);
      await reset(); await create('qa-owner',3); [...fake.sessions.values()][0].status='expired';
      await create('another-owner',4); assert.equal(fake.sessions.size,2);
    });
    await t.test('two real transactions competing for the final seat cannot oversell', async () => {
      await reset(); const limited={...cookingClass,capacity:1};
      let release; let entered;
      const waiting=new Promise(resolve=>{entered=resolve}); const barrier=new Promise(resolve=>{release=resolve});
      fake.setGate(async()=>{entered();await barrier});
      const winner=create('first-owner',1,limited);
      await waiting;
      const loser=create('second-owner',1,limited,other);
      // Observe the second backend waiting on the actual advisory lock.
      let observed=false; let observationError;
      try {
        for(let attempt=0;attempt<60;attempt++){
          const row=(await control.query('SELECT wait_event FROM pg_stat_activity WHERE pid=$1',[secondPid])).rows[0];
          if(row?.wait_event==='advisory'){observed=true;break;}
          await new Promise(resolve=>setTimeout(resolve,50));
        }
        assert.ok(observed,'second real database session must wait for the first seat reservation');
      } catch(error) {observationError=error;} finally {release();fake.setGate(undefined);}
      const results=await Promise.allSettled([winner,loser]);
      if(observationError)throw observationError;
      assert.equal(results[0].status,'fulfilled'); assert.equal(results[1].status,'rejected');
      assert.match(results[1].reason.message,/sold out/); assert.equal((await rows()).length,1); assert.equal(fake.sessions.size,1);
    });
    await t.test('provider lookup failures never create a second link or release a held seat', async () => {
      await reset(); await create(); fake.failRetrieval(true);
      await assert.rejects(create(), /could not be checked/);
      await assert.rejects(resume(1), /could not be checked/);
      await assert.rejects(create('another-owner',4), /could not be checked/);
      assert.equal(fake.sessions.size,1);
    });
    await t.test('resume checks ownership, environment, paid state, current schedule, and capacity', async () => {
      await reset(); await create();
      await assert.rejects(resume(1,{ownerIds:['someone-else']}),/not found/);
      await assert.rejects(resume(1,{mode:'live'}),/another payment environment/);
      assert.equal((await resume(1)).reused,true);
      const session=[...fake.sessions.values()][0]; session.status='complete';session.payment_status='paid';
      await assert.rejects(resume(1),/already been submitted/); assert.equal(fake.sessions.size,1);
      session.status='expired';session.payment_status='unpaid';
      await create('another-owner',4);
      await assert.rejects(resume(1),/sold out/); assert.equal(fake.sessions.size,2);
      await reset();await create();
      await assert.rejects(resume(1,{catalogue:[{...cookingClass,eventDate:'Changed date'}]}),/no longer available/);
      assert.equal([...fake.sessions.values()][0].status,'expired');
    });
    await t.test('expired resume creates one replacement at the stored price; recipes retain checkout and retry support', async () => {
      await reset();await create();[...fake.sessions.values()][0].status='expired';
      const result=await resume(1,{catalogue:[{...cookingClass,price:'$99'}]});
      assert.equal(result.reused,false);assert.equal((await rows()).length,1);assert.equal(fake.sessions.size,2);
      assert.equal([...fake.sessions.values()][1].amount_total,16238);
      assert.equal((await resume(1)).reused,true);
      await reset();await create('qa-owner',1,recipe);assert.equal((await create('qa-owner',1,recipe)).reused,true);
      assert.equal(fake.calls.find(call=>call[0]==='create')[1].expires_at,undefined);
    });
    await t.test('failed order persistence expires the new inaccessible checkout', async () => {
      await reset();
      const base=adapter(first);
      const failing=createShopCheckout({transaction:work=>base.transaction(query=>work((sql,values)=>{if(sql.startsWith('INSERT INTO orders'))throw new Error('QA persistence failure');return query(sql,values)}))});
      await assert.rejects(create('qa-owner',2,cookingClass,failing),/persistence failure/);
      assert.equal((await rows()).length,0);assert.equal([...fake.sessions.values()][0].status,'expired');
    });
    await t.test('legacy class snapshots cannot bypass date, release, or seat checks', async () => {
      await reset();await create();[...fake.sessions.values()][0].status='expired';
      await control.query("UPDATE orders SET items=items #- '{0,kind}', metadata=jsonb_set(metadata,'{checkoutSnapshot,items}',(metadata->'checkoutSnapshot'->'items') #- '{0,kind}')");
      await assert.rejects(resume(1,{classesEnabled:false}),/no longer available/);
      await control.query("UPDATE orders SET items=items #- '{0,eventDate}', metadata=jsonb_set(metadata,'{checkoutSnapshot,items}',(metadata->'checkoutSnapshot'->'items') #- '{0,eventDate}')");
      await assert.rejects(resume(1),/booked date reviewed/);
      assert.equal(fake.sessions.size,1);
    });
    await t.test('actual HTTP checkout -> signed paid webhook -> one receipt/business email -> correct class roster', async () => {
      await reset();
      let userId='qa-owner';let enabled=true;const sends=[];
      const previousAdmin=process.env.ADMIN_EMAIL;process.env.ADMIN_EMAIL='qa-business@example.com';
      const modules=sourceLoader({
        'server-only':{}, '@/lib/shop-checkout-store':{shopCheckout:service}, '@/lib/db':{db:drizzle(first)},
        '@/lib/checkout-content':load('lib/checkout-content.ts'),
        '@/lib/stripe-config':{getStripeSecretKey:()=> 'sk_test_fixture',getStripeWebhookSecret:()=> 'whsec_qa_fixture'},
        stripe:class {constructor(){return fake.stripe}},
        '@clerk/nextjs/server':{auth:async()=>({userId}),currentUser:async()=>({primaryEmailAddress:{emailAddress:'qa-owner@example.com'}})},
        '@/lib/clerk-user-sync':{syncCurrentClerkUser:async()=>({skipped:true}),getClerkUserIdentityIds:id=>[id]},
        '@/lib/contentful-management':{fetchShopPageFromContentful:async()=>({recipes:catalogue})},
        '@/lib/public-cooking-classes':{arePublicCookingClassesEnabled:()=>enabled}, '@/lib/tax-settings':{getServerSalesTaxRate:async()=>0.0825},
        '@/lib/app-url':{getCanonicalAppUrl:()=> 'https://qa.example.com'},
        '@/lib/email/mailer':{fromEmail:'qa-sender@example.com',sendEmail:async message=>{sends.push(message);return {error:null,data:{id:'qa-mock'}}}},
        '@/lib/structured-log':{logInfo(){},logError(){},maskEmail:()=> '[redacted]'},
        '@/lib/service-invoice-workflow-store':{invoiceWorkflow:new Proxy({},{get(){throw new Error('Shop must not enter service invoices')}})},
      });
      try {
        const route=modules('app/api/stripe/checkout/route.ts');const retry=modules('app/api/orders/[id]/checkout/route.ts');const webhook=modules('app/api/stripe/webhook/route.ts');
        const request=(origin='https://qa.example.com',items=[{id:cookingClass.id,quantity:2,price:1}])=>new NextRequest('https://qa.example.com/api/stripe/checkout',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({items})});
        assert.equal((await route.POST(request('https://untrusted.example.com'))).status,403);
        userId=null;assert.equal((await route.POST(request())).status,401);userId='qa-owner';
        enabled=false;assert.equal((await route.POST(request())).status,400);enabled=true;
        const response=await route.POST(request());assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
        assert.equal((await retry.POST(request(),{params:Promise.resolve({id:'1'})})).status,200);
        const session=[...fake.sessions.values()][0];session.status='complete';session.payment_status='paid';session.payment_intent='pi_qa';session.customer_details={name:'QA Test Customer'};
        const payload=JSON.stringify({id:'evt_qa_checkout',type:'checkout.session.completed',livemode:false,data:{object:session}});
        const signature=fake.stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_qa_fixture'});
        const eventRequest=()=>new Request('https://qa.example.com/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload});
        assert.equal((await webhook.POST(eventRequest())).status,200);assert.equal((await webhook.POST(eventRequest())).status,200);
        assert.equal((await rows())[0].status,'completed');assert.equal(sends.length,2);
        assert.deepEqual(sends.map(message=>message.to).sort(),['info@waistlessfoods.com','qa-owner@example.com']);
        for(const message of sends){const text=await render(message.react,{plainText:true});assert.ok(text.includes(cookingClass.eventDate));assert.ok(text.includes('2'));assert.ok(text.includes('$162.38'));}
        const rosters=modules('lib/class-roster-data.ts');const result=await rosters.readClassRosters('test');
        assert.equal(result.classes[0].confirmedSeats,2);assert.equal(result.classes[0].confirmedOrders,1);assert.equal(result.classes[0].registrations[0].email,'qa-owner@example.com');
        const live=await rosters.readClassRosters('live');assert.equal(live.classes.length,0);
      } finally {if(previousAdmin===undefined)delete process.env.ADMIN_EMAIL;else process.env.ADMIN_EMAIL=previousAdmin;}
    });
  } finally {
    for(const client of clients.slice(1)){try{await client.query('ROLLBACK')}catch{}await client.end().catch(()=>{});}
    if(createdSchema){
      const control=clients[0];
      const check=await control.query('SELECT nspname,pg_get_userbyid(nspowner)=current_user AS owned FROM pg_namespace WHERE nspname=$1',[schema]);
      assert.equal(check.rows[0]?.nspname,schema);assert.equal(check.rows[0]?.owned,true);
      await control.query(`DROP TABLE "${schema}".orders`);await control.query(`DROP SCHEMA "${schema}"`);
      console.log('Isolated QA schema removed. No public customer/order records or real Stripe/SMTP operations.');
    }
    await clients[0].end().catch(()=>{});
  }
});
