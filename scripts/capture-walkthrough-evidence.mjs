// Read-only live captures and browser-isolated workflow tests. App mutations,
// email sends, and payments are intercepted. No production records are written.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import React from 'react';
import { render } from '@react-email/render';
import { sourceLoader } from './lib/load-typescript.mjs';

const base = 'https://www.waistlessfoods.com';
const directory = 'docs/walkthrough-evidence/2026-10-30';
await mkdir(directory, { recursive: true });
const stage = process.argv.find(arg=>arg.startsWith('--stage='))?.slice(8) || 'all';
const report = stage === 'all' ? { capturedOn: '2026-10-30', screenshots: [], checks: [], limitations: ['Real booking persistence, customer/admin email delivery, Google appointment creation and Meet invitation, live payments, and Contentful publishing are not verified by browser simulations.'], mutations: 'No production application writes, emails, charges, or calendar bookings.' } : JSON.parse(await readFile(`${directory}/capture-report.json`,'utf8'));
delete report.failure;
const load = sourceLoader({ 'server-only': {} });
const { buildClassRosters } = load('lib/class-roster.ts');
const issue = { id: 900001, version: 1, status: 'draft', updatedAt: '2026-10-30T00:00:00Z', title: 'SAMPLE - A seasonal table', subject: 'A note from The WaistLess Table', previewText: 'Fresh ideas from Chef Amber’s kitchen.', body: 'This is sample content for the website walkthrough.\n\nShare a favorite recipe, a seasonal tip, or news from your kitchen. Review the draft before publishing or sending.', ctaLabel: 'Explore recipes', ctaUrl: base + '/recipes' };
let campaign = null;
let invoice = { id: 'in_sample_walkthrough', number: 'SAMPLE-001', status: 'draft', name: 'Alex Sample', email: 'alex@example.com', service: 'private_chef', title: 'SAMPLE - Private dinner for six', eventDate: '2026-12-12', notes: 'Sample service details for the walkthrough. No event is booked.', total: 60000, paid: 0, remaining: 60000, currency: 'usd', created: 1793318400, dueDate: null, paidAt: null, hostedUrl: null, pdfUrl: null, live: false, ready: true, overdue: false, items: [{description:'Private dinner for six',quantity:6,amount:60000}] };
let bookings = [{ id:900001,serviceSlug:'complimentary-consultation',serviceTitle:'Complimentary Consultation',firstName:'Alex',lastName:'Sample',email:'alex@example.com',phone:'2025550100',guests:6,preferredDate:'2026-12-12',alternativeDate:null,notes:'SAMPLE - Seasonal dinner. Budget range: $600.',status:'pending',createdAt:'2026-10-30T00:00:00Z' }];
let reviews = [{id:900001,serviceSlug:'private',serviceTitle:'Private Chef',name:'Alex Sample',email:'alex@example.com',rating:5,reviewText:'SAMPLE REVIEW - A thoughtful menu and a lovely evening at home.',status:'pending',createdAt:'2026-10-30T00:00:00Z',updatedAt:'2026-10-30T00:00:00Z',moderatedAt:null,source:'website'}];
const roster = buildClassRosters([{id:900001,status:'completed',stripeSessionId:'cs_test_walkthrough',items:[{id:'sample-class',name:'SAMPLE - Fresh Pasta Workshop',kind:'cooking_class',eventDate:'December 12, 2026',capacity:12,quantity:2,price:75}],customerEmail:'alex@example.com',metadata:{customerDetails:{name:'Alex Sample',phone:'2025550100'}},createdAt:new Date('2026-10-30T00:00:00Z')}], 'test');
const Template=load('lib/email/templates/newsletter-issue-email.tsx').default;
const emailHtml=await render(React.createElement(Template,{issue}));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1360,height:1000},acceptDownloads:true});
await context.addInitScript(()=>sessionStorage.setItem('waistlessfoods-site-unlocked','true'));
const secret=process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
assert.ok(secret,'Admin session configuration required');
const payload=`${Date.now()+3600000}.${randomBytes(16).toString('hex')}`;
await context.addCookies([{name:'wlf_admin_session',value:`${payload}.${createHmac('sha256',secret).update(payload).digest('hex')}`,url:base,httpOnly:true,secure:true,sameSite:'Lax'}]);
let submitted=[];
let issueSaves=0;
await context.route('**/*',async route=>{
 const req=route.request(), url=new URL(req.url()), method=req.method();
 if(url.origin!==base) return route.continue();
 const json=value=>route.fulfill({status:200,json:value});
 if(url.pathname==='/api/bookings' && method==='POST') {submitted.push(req.postDataJSON());return route.fulfill({status:201,json:{confirmationEmailSent:true}});}
 if(url.pathname==='/api/admin/bookings') {
  if(method==='PATCH') {const data=req.postDataJSON();bookings=bookings.map(b=>b.id===(data.id??data.bookingId)?{...b,status:data.status}:b);return json({success:true});}
  return json({bookings});
 }
 if(url.pathname==='/api/admin/reviews') {
  if(method==='PATCH') {const data=req.postDataJSON();reviews=reviews.map(r=>({...r,status:data.status??'approved'}));return json({review:reviews[0],success:true});}
  return json({reviews});
 }
 if(url.pathname==='/api/admin/class-rosters') return json(roster);
 if(url.pathname==='/api/admin/settings' && method==='POST') return route.continue(); // Existing read-only endpoint.
 if(url.pathname==='/api/admin/newsletters') return json({issues:[issue]});
 if(url.pathname.startsWith('/api/admin/newsletters/900001')) {
  if(url.pathname.endsWith('/campaign')) {
   if(method==='POST') {assert.equal(req.postDataJSON().action,'prepare','No subscriber send is allowed');campaign={id:900001,issue_id:issue.id,issue_version:issue.version,snapshot:issue,status:'ready',mailing_address:''};}
   return json({campaign,counts:campaign?{pending:2}:{},recent:[],settings:{enabled:true,addressConfigured:false,dailyLimit:100}});
  }
  if(url.searchParams.get('format')==='email') return route.fulfill({contentType:'text/html',body:emailHtml});
  if(method==='PATCH') {Object.assign(issue,req.postDataJSON(),{version:issue.version+1});issueSaves++;}
  return json({issue});
 }
 if(url.pathname==='/api/admin/service-invoices') {
  if(method==='POST') return route.fulfill({status:201,json:{invoice}});
  return json({invoices:[],next:null,mode:'test'});
 }
 if(url.pathname==='/api/admin/service-invoices/in_sample_walkthrough') {
  if(method==='POST') {assert.equal(req.postDataJSON().action,'finalize','No invoice email/payment is allowed');invoice={...invoice,status:'open',hostedUrl:'https://example.com/sample-payment-link',number:'SAMPLE-001'};}
  return json({invoice});
 }
 if(method!=='GET' && method!=='HEAD') {report.checks.push(`Blocked unhandled ${method} ${url.pathname}`);return route.abort();}
 return route.continue();
});
const page=await context.newPage();
const style='header.sticky { visibility:hidden!important }';
async function visit(url) {await page.goto(url.startsWith('http')?url:base+url,{waitUntil:'domcontentloaded'});await page.waitForTimeout(700);}
async function shot(section,step,file,title,kind,caption,locator=null) {
 await page.locator('img').evaluateAll(imgs=>imgs.forEach(img=>img.loading='eager'));
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.race([Promise.allSettled([...document.images].map(img=>img.decode())),new Promise(resolve=>setTimeout(resolve,5000))]);});
 const options={path:`${directory}/${file}.jpg`,type:'jpeg',quality:80,animations:'disabled',style};
 if(locator)await locator.screenshot(options);else await page.screenshot(options);
 report.screenshots=report.screenshots.filter(s=>s.file!==`${file}.jpg`);
 report.screenshots.push({section,step,file:`${file}.jpg`,title,kind,caption,capturedOn:'2026-10-30'});
 await writeFile(`${directory}/capture-report.json`,JSON.stringify(report,null,2));
}
async function mainScreen(){return page.locator('main').last();}

try {
 if(stage==='calendar-details') {
  const {getConsultationBookingUrl}=load('lib/consultation-scheduling.ts');
  await visit(getConsultationBookingUrl(process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL));
  await page.getByRole('button',{name:/^\d{1,2}:\d{2}(am|pm)$/}).first().click();
  await page.getByRole('button',{name:'Book',exact:true}).waitFor();
  for(const name of ['Event Details','Event Date(s)','Budget Range']) {
   const field=page.getByRole('textbox',{name,exact:true});
   assert.ok(await field.evaluate(el=>el.required||el.getAttribute('aria-required')==='true'));
  }
  await shot('consultations',2,'google-required-details','Review Google’s booking questions','Live screen','Required event details, dates, and budget were checked. The Book button was not clicked.');
  report.checks.push('Google booking form contains the three required event questions. No appointment created.');
 }
 if(stage==='reference-fixes') {
  bookings=bookings.map(record=>({...record,serviceSlug:'private',serviceTitle:'Private Chef'}));
  await visit('/admin/bookings');await page.getByText('Alex Sample',{exact:false}).first().waitFor();
  await shot('services',2,'service-admin','Manage service inquiries','Sample data','A synthetic private-chef inquiry demonstrates the booking-request workspace.');
  await visit('/services/private/book');
  const sidebar=page.locator('aside').filter({has:page.getByRole('heading',{name:'How to Book',exact:true})});
  await sidebar.waitFor();
  await shot('services',3,'service-process','Review the service process','Live screen','The gray How to Book information comes from Contentful. Editing it was not tested.',sidebar);
  await visit('/shop?category=cooking-classes');
  const unavailable=page.getByRole('heading',{name:/A seat at Chef Amber/}).locator('xpath=ancestor::section[1]');
  await unavailable.waitFor();
  await shot('classes',2,'public-classes','Check public-class availability','Live screen','Current unavailable-class message. Enrollment was not enabled or tested.',unavailable);
 }
 // Consultation: real visible form, simulated response, real Google schedule.
 if(stage==='all'||stage==='consultations') {
 await visit('/');
 await page.getByRole('button',{name:'Complimentary Consultation',exact:true}).first().click();
 await shot('consultations',1,'consultation-form','Open the consultation form','Live screen','The current website asks for event details before Google scheduling.',page.getByRole('dialog'));
 const dialog=page.getByRole('dialog');
 for(const [label,value] of [['First name','Alex'],['Last name','Sample'],['Email','alex@example.com'],['Phone','2025550100'],['Expected guests','6'],['Budget range','$600'],['Preferred event date','2026-12-12'],['Event details','SAMPLE - Walkthrough only. No event is requested.']])await dialog.getByLabel(label,{exact:false}).fill(value);
 await shot('consultations',2,'consultation-complete','Complete the event details','Sample data','The form contains browser-only sample information. No inquiry is saved.',dialog);
 await page.getByRole('button',{name:'Send request and schedule',exact:true}).click();
 await page.getByRole('heading',{name:'Consultation request received',exact:true}).waitFor();
 await shot('consultations',2,'consultation-result','Review the request response','UI test','The response is simulated to test the client flow. No lead or email was created.',dialog);
 await page.waitForURL(url=>url.hostname==='calendar.google.com'||url.hostname==='calendar.app.google',{timeout:30000});
 assert.equal(submitted[0].serviceSlug,'complimentary-consultation');
 report.checks.push('Consultation form submitted to browser fixture and redirected to Google.');
 await page.waitForTimeout(2200);
 await shot('consultations',2,'google-calendar','Choose a consultation time','Live screen','Google appointment schedule. No appointment was booked in this check.');
 await visit('/admin/bookings');await page.getByText('Alex Sample',{exact:false}).first().waitFor();
 await shot('consultations',3,'consultation-admin','Find the inquiry in Admin','Sample data','A synthetic pending inquiry shows where consultation details appear.');
 }

 // Service pages and inquiry submission, without persistence or mail.
 if(stage==='all'||stage==='services'||stage==='classes') {
 for(const slug of stage==='classes'?[]:['private','catering','cooking-classes']) {
  await visit('/services/'+slug);
  const button=slug==='cooking-classes'?page.getByRole('link',{name:'Request a Private Class',exact:true}):page.getByRole('link',{name:'Request to Book',exact:true});
  await button.waitFor();
  const section=button.locator('xpath=ancestor::section[1]');
  await shot(slug==='cooking-classes'?'classes':'services',1,`${slug}-actions`,slug==='cooking-classes'?'Choose private or public classes':`Review ${slug==='private'?'Private Chef':'Catering'} requests`,'Live screen','Current service actions and booking-process information.',section);
  await button.click();await page.getByRole('button',{name:'Submit Request',exact:true}).waitFor();
  const form=page.locator('form').filter({has:page.getByRole('button',{name:'Submit Request',exact:true})});
  await shot(slug==='cooking-classes'?'classes':'services',1,`${slug}-inquiry`,'Review the request form','Live screen','This form requests availability. It does not confirm a booking.',form);
  await page.getByRole('button',{name:'Submit Request',exact:true}).click();
  assert.ok(await form.locator('input:invalid').count()>0 || await page.getByText('Please fill in all required fields.',{exact:true}).count()>0);
  report.checks.push(`${slug}: incomplete request is blocked by client validation.`);
  await page.getByPlaceholder('e.g. Sarah',{exact:true}).fill('Alex');
  await page.getByPlaceholder('e.g. Anderson',{exact:true}).fill('Sample');
  await page.getByPlaceholder('e.g. sarah@email.com',{exact:true}).fill('alex@example.com');
  await page.getByPlaceholder('e.g. (555) 123-4567',{exact:true}).fill('2025550100');
  await form.locator('input[type="number"]').fill('6');
  await form.locator('input[readonly]').first().click();
  await page.locator('[role="grid"] button:not([disabled])').filter({hasText:/^30$/}).first().click();
  await page.getByPlaceholder('Please provide your estimated budget range',{exact:true}).fill('$600');
  await form.locator('textarea').fill('SAMPLE - A seasonal dinner. No event is requested.');
  await page.getByRole('button',{name:'Submit Request',exact:true}).click();
  await page.getByRole('heading',{name:'Request Received!',exact:true}).waitFor();
  assert.equal(submitted.at(-1).serviceSlug,slug);
  await shot(slug==='cooking-classes'?'classes':'services',2,`${slug}-result`,'Review the request result','UI test','Simulated successful response. No request record or confirmation email was created.',page.getByRole('heading',{name:'Request Received!',exact:true}).locator('..'));
  report.checks.push(`${slug}: completed request reaches the confirmation state with a simulated API response.`);
 }
 await visit('/admin/bookings');await page.getByText('Alex Sample',{exact:false}).first().waitFor();
 await shot('services',2,'service-admin','Manage service inquiries','Sample data','A synthetic record demonstrates the booking-request workspace.');
 await visit('/services/private');
 await page.getByRole('link',{name:'Request to Book',exact:true}).waitFor();
 await shot('services',3,'service-process','Review the service process','Live screen','The gray booking-process information is edited through Contentful.',page.getByRole('link',{name:'Request to Book',exact:true}).locator('xpath=ancestor::section[1]'));
 await visit('/shop?category=cooking-classes');
 await page.getByRole('button',{name:'Cooking classes',exact:true}).waitFor();
 await page.getByText(/A seat at Chef Amber/).first().scrollIntoViewIfNeeded();
 await shot('classes',2,'public-classes','Check public-class availability','Live screen','Current public-class Shop view. Enrollment was not enabled or tested.');
 await visit('/admin/class-rosters');await page.getByLabel('Order environment',{exact:true}).selectOption('test');await page.getByRole('button',{name:/Select SAMPLE - Fresh Pasta Workshop/}).waitFor();
 await shot('classes',3,'class-roster','Review class registrations','Sample data','Synthetic sandbox purchaser and seat counts. No real enrollment is shown.',await mainScreen());
 }

 // Protected paid recipe and its print layout.
 if(stage==='all'||stage==='recipes') {
 await visit('/admin/recipes');await page.getByRole('heading',{name:'Paid Recipe Previews',exact:true}).waitFor();
 await shot('recipes',1,'paid-recipe-list','Choose a paid recipe preview','Live screen','Protected Admin recipe list. No purchase is required for the owner preview.',await mainScreen());
 await visit('/admin/recipes/triple-berry-french-toast');
 await page.locator('.recipe-print-page').waitFor();
 await shot('recipes',1,'paid-recipe-full','Inspect the full recipe','Live screen','Protected full-recipe owner preview. This is not proof of a completed customer payment.',page.locator('.recipe-print-page'));
 await page.emulateMedia({media:'print'});
 await shot('recipes',2,'paid-recipe-print','Preview Print / Save PDF','Live screen','Current print layout from the protected preview. Customer purchase unlocking is tested separately.',page.locator('.recipe-print-page'));
 await page.emulateMedia({media:'screen'});
 await visit('/recipes');await shot('recipes',3,'recipe-collection','Review the published recipe collection','Live screen','Published website content. Contentful editing itself was not exercised.');
 }

 // Newsletter UI is tested with entirely synthetic saved issues and campaigns.
 if(stage==='all'||stage==='newsletters') {
 await visit('/admin/newsletters');await page.getByText(issue.title,{exact:true}).waitFor();
 await shot('newsletters',1,'newsletter-studio','Open Newsletter Studio','Sample data','Current studio with one synthetic issue. No draft was created in the database.',await mainScreen());
 await page.getByRole('link',{name:new RegExp(issue.title)}).click();
 await page.getByLabel('Issue title',{exact:true}).waitFor();
 await page.getByLabel('Issue title',{exact:true}).fill('SAMPLE - A note from Chef Amber');
 await page.getByRole('button',{name:'Save changes',exact:true}).click();
 await page.getByRole('status').waitFor();assert.equal(issueSaves,1);
 await shot('newsletters',1,'newsletter-editor','Write and save an issue','UI test','Save was tested against a browser-only response. No issue was stored or emailed.',await mainScreen());
 await page.getByRole('button',{name:'Email preview',exact:true}).click();
 await page.frameLocator('iframe').getByAltText('WaistLess Foods').waitFor();
 await shot('newsletters',1,'newsletter-preview','Review the branded email','Sample data','Real email template with sample copy. Browser rendering is not inbox delivery.',page.locator('iframe'));
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Publish to archive',exact:true}).click();
 await page.getByRole('button',{name:'Unpublish',exact:true}).waitFor();
 assert.equal(issue.status,'published');assert.equal(campaign,null);
 await shot('newsletters',2,'newsletter-publish','Publish to the member archive','UI test','Publishing was simulated. It did not prepare or send an email campaign.',await mainScreen());
 const sendRegion=page.getByRole('region',{name:'Send to subscribers'});
 page.once('dialog',dialog=>dialog.accept());
 await sendRegion.getByRole('button',{name:'Prepare saved issue & audience',exact:true}).click();
 await sendRegion.getByRole('button',{name:'Send next 5 subscribers',exact:true}).waitFor();
 await shot('newsletters',3,'newsletter-campaign','Review before sending','UI test','Audience preparation was simulated. No subscriber send button was confirmed.',sendRegion);
 report.checks.push('Newsletter save, publish, preview, and campaign preparation tested with synthetic responses. Publication did not prepare a campaign.');
 const oldArchive='docs/audit-screenshots/newsletter-studio-2026-09-06/04-member-archive.png';
 await copyFile(oldArchive,`${directory}/member-archive-reference.png`);
 report.screenshots.push({section:'newsletters',step:4,file:'member-archive-reference.png',title:'Read the member archive',kind:'Earlier sample',caption:'September 6 sample capture from the earlier authenticated archive test. Not recaptured as a signed-in member today.',capturedOn:'2026-09-06'});
 }

 // Invoices: saved draft and issue controls use a browser-only Stripe stand-in.
 if(stage==='all'||stage==='management') {
 await visit('/admin/service-invoices');await page.getByRole('button',{name:'New invoice draft',exact:true}).click();
 for(const [label,value]of[['Customer name','Alex Sample'],['Customer email','alex@example.com'],['Invoice title','SAMPLE - Private dinner for six'],['Description 1','Private dinner for six'],['Unit price (USD)','100.00']])await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByLabel('Quantity',{exact:true}).fill('6');
 await shot('management',1,'invoice-editor','Prepare a service invoice','Sample data','Current invoice editor with sample details. No Stripe invoice has been created.',page.locator('form').filter({has:page.getByRole('button',{name:'Save draft in Stripe',exact:true})}));
 await page.getByRole('button',{name:'Save draft in Stripe',exact:true}).click();
 await page.getByText('Draft saved in Stripe. Nothing was emailed or charged.',{exact:true}).waitFor();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Issue invoice & payment link',exact:true}).click();
 await page.getByText('Invoice issued. You can copy its payment link or explicitly email it below.',{exact:true}).waitFor();
 await shot('management',1,'invoice-issued','Review the invoice and payment controls','UI test','Draft save and issue were simulated. The sample link is not payable. No email or charge occurred.',await mainScreen());
 report.checks.push('Invoice editor, totals, draft-save and issue controls tested with synthetic API responses.');
 await visit('/admin');await page.getByRole('link',{name:/Dashboard/}).waitFor();
 await shot('management',2,'admin-tools','Find orders and account tools','Live screen','Admin navigation shows Dashboard and All Accounts. No customer records are displayed.');
 await visit('/admin/reviews');await page.getByText(reviews[0].reviewText,{exact:true}).waitFor();
 await shot('management',3,'review-moderation','Review before approving','Sample data','Synthetic pending service review. No real review was approved or changed.',await mainScreen());
 }

 // Contentful ownership cannot be impersonated. Capture its sign-in boundary.
 if(stage==='all'||stage==='content') {
 await visit('https://app.contentful.com/');await page.waitForTimeout(1200);
 await shot('content',1,'contentful-access','Open Contentful','Live screen','Contentful requires its own account. Entry editing and publishing were not tested in this session.');
 await visit('/');await shot('content',2,'homepage-review','Review the published homepage','Live screen','Current homepage for content review. No Contentful content was changed.');
 await visit('/admin/settings');await page.getByRole('heading',{name:/Settings/}).first().waitFor();
 await shot('content',3,'storefront-settings','Review storefront settings','Live screen','Existing storefront configuration. No setting was saved or launch restriction changed.');
 }
 await writeFile(`${directory}/capture-report.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify({screenshots:report.screenshots.length,checks:report.checks,mutations:report.mutations}));
}catch(error){report.failure=error.message;await writeFile(`${directory}/capture-report.json`,JSON.stringify(report,null,2));console.error(error);process.exitCode=1;}
finally{await browser.close();}
