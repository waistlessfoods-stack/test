import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const root = 'C:/Users/MSI/code/waistlessfoods';
const work = root + '/.runtime/amber-presentation';
const SKILL = 'C:/Users/MSI/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations';
const PYTHON = 'C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const { finalizePresentation } = await import(pathToFileURL(SKILL + '/container_tools/artifact_tool_utils.mjs').href);
const P = Presentation.create({ slideSize: {width:1280,height:720} });
const C = { dark:'#173D40',teal:'#367577',mint:'#B6DCDA',paper:'#F3F6F2',ink:'#173D40',body:'#466163',white:'#FFFFFF' };
const FONT='Arial';
let serial=0;
function text(sl, value, x,y,w,h,size=26,color=C.ink,bold=false) {
 const s=sl.shapes.add({ geometry:'textbox',name:`text-${++serial}`,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0} });
 s.text=value;
 s.text.style={fontFamily:FONT,typeface:FONT,fontSize:size,color,bold,insets:0,verticalAlignment:'top',wrap:'word'};
 return s;
}
function link(sl,label,url,x,y,w=700,color=C.teal,size=24) {
 const s=text(sl,'',x,y,w,45,size,color,true);
 s.text=[[{run:label,style:{typeface:FONT,fontSize:`${size}px`,color,underline:'sng'},link:{uri:url,isExternal:true}}]];
 return s;
}
async function pic(sl,file,x,y,w,h,fit='cover',alt='') {
 sl.images.add({blob:new Uint8Array(await fs.readFile(file)),contentType:file.endsWith('.jpg')?'image/jpeg':'image/png',alt,fit,position:{left:x,top:y,width:w,height:h}});
}
function slide(title,notes,{dark=false}={}) {
 const s=P.slides.add(); s.background.fill=dark?C.dark:C.paper;
 const fg=dark?C.white:C.ink;
 text(s,title,70,55,1140,110,46,fg,true);
 text(s,'WaistLess Foods',70,666,600,26,16,dark?C.mint:C.body);
 text(s,String(P.slides.items.length).padStart(2,'0'),1160,666,50,26,16,dark?C.mint:C.body);
 s.speakerNotes.text=notes;
 return s;
}
function table(sl,values,x,y,width,height,colWidths,{fontSize=24}={}) {
 const t=sl.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width,height,columnWidths:colWidths,values});
 for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++) {
   const cell=t.getCell(r,c); cell.fill=r===0?C.dark:(r%2?C.white:'#E9F0EA');
   cell.text.style={fontFamily:FONT,typeface:FONT,fontSize,color:r===0?C.white:C.ink,bold:r===0,insets:16,verticalAlignment:'middle'};
 }
 t.borders.assign({fill:C.paper,width:2,style:'solid'});
 return t;
}

// 1. Minimal cover using Chef Amber's existing portrait.
{
const s=P.slides.add();s.background.fill=C.dark;
await pic(s,root+'/public/amber.jpg',770,0,510,720,'cover','Chef Amber Fitzgerald, existing WaistLess Foods portrait');
text(s,'WaistLess Foods',70,70,660,40,24,C.mint,true);
text(s,'More time for\nWaistLess Foods',70,205,670,190,66,C.white,true);
text(s,'Website review and ongoing support',70,440,630,70,28,C.white);
text(s,'A conversation with Chef Amber\nPresented by Zul',70,590,620,65,22,C.mint);
s.speakerNotes.text='Open with the purpose: review what Amber can use on the website, understand which recurring tasks take her time, and discuss optional help. Ask what she would most like the website to support this season. Source image: existing WaistLess Foods portrait, public/amber.jpg. No claim of measured time savings or sales growth is being made.';
}
// 2. Website capabilities, paired with specific customer and owner uses.
{
const s=slide('The website tools we can put to work','Review the customer and owner sides together. These capabilities are implemented, but this is not launch sign-off. The September 9 website update identified final booking and payment checks, content review, and approval to remove the preview restriction as remaining launch steps. Source: client website update dated September 9, 2026 and https://www.waistlessfoods.com/admin/walkthrough.');
table(s,[['Customer experience','Amber’s management tools'],['Consultations and service requests','Booking requests and service invoices'],['Recipes and cooking-class pages','Paid recipe previews and class registrations'],['Member newsletter archive','Newsletter Studio and email subscribers']],70,195,1140,345,[570,570],{fontSize:25});
text(s,'Today’s review: confirm the workflows and agree on the remaining launch checks',70,580,1110,65,26,C.teal,true);
}
// 3. Live demo transition with a true current screenshot and hyperlinks.
{
const s=slide('Live website walkthrough','Open the guide and sign in with the existing admin password. Never display credentials on the slide or share the environment file. Walk through the customer pages, paid recipe preview, newsletter workflow, and the admin tools Amber wants to use. Return to the presentation after the demo. The guide is a practical training resource and contains no retainer prices or sales sections. Customer pages may require the separate preview password or customer account sign-in. Screenshot source: live read-only capture of https://www.waistlessfoods.com/admin/walkthrough on October 30, 2026. The optional screenshot-reference slides are hidden after the main presentation. Use them from the slide overview when a live demo is inconvenient.');
text(s,'Explore the customer journey\nand the tools behind it',70,200,480,100,31,C.ink,true);
text(s,'The guide includes step screenshots, direct links, and notes on what was tested.',70,335,460,120,27,C.body);
link(s,'Open the live walkthrough','https://www.waistlessfoods.com/admin/walkthrough#website-tour',70,505,490);
text(s,'Admin sign-in required',70,563,450,36,20,C.body);
await pic(s,work+'/walkthrough.png',610,195,600,429,'contain','Live Website Walkthrough page, without customer records');
}
// 4. Operational value grounded in task ownership, no invented financial return.
{
const s=slide('An example month of support','Source: revised draft support proposal dated October 30, 2026, output/pdf/WaistLess-Foods-Support-Proposal-Draft.pdf. This is an illustrative plan pending a team estimate and final scope, not committed monthly quantities. One newsletter draft uses the existing template, up to 600 words of supplied final copy, one call-to-action link, and one consolidated revision round. Each of four static graphics has one agreed message and size, based on approved templates, with one consolidated revision round. Each of two content updates covers one existing page or recipe entry using final supplied text and one supplied image. Website checks and minor fixes must fit the agreed technical scope. The monthly review is up to 30 minutes. Ask which work Amber actually wants to hand over.');
table(s,[['Work we prepare','What it helps you do'],['1 newsletter draft','Keep subscribers informed without doing the formatting'],['4 promotional graphics','Share recipes, services, or class announcements'],['2 website content updates','Keep recipes and existing pages current'],['1 website check and small fixes','Have someone review the site and follow up on issues'],['One contact and a monthly review','Delegate without managing several people']],70,175,1140,395,[440,700],{fontSize:24});
text(s,'You provide the ideas and approve the work. Zul coordinates the team.',70,593,1140,45,26,C.teal,true);
text(s,'Illustrative plan. Confirm team estimates and final scope before committing quantities.',70,636,1140,28,20,C.body);
}
// 5. Team structure in flat editorial columns.
{
const s=slide('One contact, a team behind the work','Zul remains the client contact and is accountable for assigning tasks and reviewing output. Confirm staffing and capacity in the written scope before promising coverage. Designers and assistants work on agreed tasks with appropriate access. Amber supplies or approves content and retains authority over customer prices, booking commitments, and newsletter sends. This is proposed part-time support.');
const cols=[['Zul','Your point of contact','Priorities, technical decisions,\nand final quality checks'],['Developer','Website support','Website checks, minor fixes,\nand technical assistance'],['Designer','Visual content','Promotional graphics\nusing approved brand templates'],['Assistant','Content preparation','Recipe uploads\nand newsletter formatting']];
cols.forEach((a,i)=>{const x=70+i*290;text(s,a[0],x,220,260,55,36,C.teal,true);text(s,a[1],x,300,260,70,25,C.ink,true);text(s,a[2],x,400,260,160,24,C.body);});
text(s,'One person to contact. The team prepares the work for your approval.',70,595,1100,45,27,C.ink,true);
}
// 6. Concrete example of work reused across channels.
{
const s=slide('One newsletter can support several updates','This is an example workflow, not a guaranteed monthly quantity. Amber provides the message and approved content. Reusing the same approved theme and assets helps plan the newsletter and promotional graphics together. The team must estimate the effort before committing to the sample quantities shown on slide 4. Sending a newsletter and publishing it to the archive are separate actions. Do not publish or send without Amber’s approval. Source for existing newsletter functionality: https://www.waistlessfoods.com/admin/walkthrough#newsletters.');
table(s,[['Amber provides','The team prepares'],['A recipe, story, or class announcement','A formatted newsletter draft'],['Approved photos and event details','Matching promotional graphics'],['Final edits and approval','The approved website or archive update']],70,190,1140,330,[500,640]);
text(s,'A useful starting project for the trial',70,570,1100,45,29,C.teal,true);
text(s,'Use the same approved story and photos across the newsletter and graphics.',70,615,1100,36,23,C.body);
}
// 7. Clear request and approval process, with text rather than decorative diagram.
{
const s=slide('How we would work together','Explain that Amber has one request list and one point of contact. We estimate and prioritize tasks, then confirm delivery dates. Revisions, meetings, and coordination consume the agreed capacity. Extra work requires approval. Confirm response windows and business days in the final agreement rather than promising same-day availability in this conversation.');
const rows=[['01','Choose priorities','Amber shares approved materials and the most important tasks.'],['02','Confirm the plan','Zul agrees the deliverables, revisions, and delivery dates.'],['03','Prepare and review','The team completes drafts. Amber approves public content.'],['04','Report and adjust','We share completed work, remaining tasks, and next priorities.']];
rows.forEach((r,i)=>{const y=190+i*105;text(s,r[0],70,y,80,55,36,C.teal,true);text(s,r[1],185,y,420,48,29,C.ink,true);text(s,r[2],640,y,570,82,25,C.body);});
}
// 8. Pilot with observation metrics instead of unsubstantiated ROI.
{
const s=slide('A three-month trial','This trial is optional and starts only after we agree on the current project closeout, scope, budget, and staffing in writing. Ask what support Amber wants before proposing a package. Record a baseline for recurring tasks in month one. Use completed tasks, time required, revision effort, and Amber’s feedback to judge usefulness. Do not promise sales growth or a fixed number of hours saved. At the end of month three, review whether to continue, resize, or end under the agreed terms.');
const a=[['Month 1','Set up the routine','Choose two recurring tasks.\nAgree templates, access, and approvals.'],['Month 2','Use the workflow','Complete the agreed priorities.\nReview time used and revision effort.'],['Month 3','Review the value','Assess the help Amber used.\nAgree whether to continue or adjust.']];
a.forEach((r,i)=>{const x=70+i*390;text(s,r[0],x,210,350,50,30,C.teal,true);text(s,r[1],x,305,350,80,34,C.ink,true);text(s,r[2],x,430,350,140,26,C.body);});
text(s,'Success means useful work completed and less routine work left with Amber',70,605,1140,50,25,C.ink,true);
}
// 9. No recharging for original obligations.
{
const s=slide('Launch closeout and ongoing support','Separate completion of the agreed existing project from optional future service. Remaining original-scope obligations are not charged again through a retainer. Confirm final consultation booking and Meet delivery, payment flow, content review, and preview restriction approval. Larger new features need their own estimate. Sources: client website update dated September 9, 2026 and https://www.waistlessfoods.com/admin/walkthrough#content.');
text(s,'Complete the current project',70,210,530,65,32,C.teal,true);
text(s,'Final booking and payment checks\n\nAmber’s content review\n\nApproval for public launch',70,310,530,245,27,C.body);
text(s,'Agree optional support',690,210,520,65,32,C.teal,true);
text(s,'Monthly work and delivery dates\n\nBudget, approvals, and response times\n\nA start date and review at three months',690,310,520,245,27,C.body);
text(s,'Existing agreed corrections remain part of the current project',70,615,1140,50,25,C.ink,true);
}
// 10. Conversational close instead of an assumed sale.
{
const s=slide('What would you like to hand over?','Ask Amber to identify the two tasks she would most like help with. Close the normal presentation here. Ask permission conversationally to prepare a tailored written proposal after learning her workload and budget. Only show the hidden appendix manually if she asks about pricing. Ask what monthly level of support would be comfortable. Agree whether she wants a short written scope for website support or the broader team option. Confirm any remaining launch items separately. Do not treat discussion of the options as acceptance. Source background image: existing WaistLess Foods homepage image, public/hero.png.');
await pic(s,root+'/public/hero.png',0,0,1280,720,'cover','Existing WaistLess Foods food photography');
// The original hero image already has a dark overlay. Keep all title and text editable.
// Move foreground text above the background by re-adding the closing content.
text(s,'What would you like\nto hand over?',70,125,1050,180,66,C.white,true);
text(s,'Choose two recurring tasks you would like help with.\nWe can build the first month around those priorities.',70,370,1050,115,31,C.white);
link(s,'Reopen the website walkthrough','https://www.waistlessfoods.com/admin/walkthrough#website-tour',70,570,1000,C.mint,26);
}


// Optional reference images for the live demo. Hidden from normal playback.
const evidence=JSON.parse(await fs.readFile(root+'/lib/walkthrough-evidence.json','utf8'));
const referenceSlides=[
 ['consultations','Consultation flow',['consultation-complete.jpg','google-required-details.jpg']],
 ['services','Service request flow',['private-inquiry.jpg','private-result.jpg']],
 ['classes','Cooking-class flow',['cooking-classes-actions.jpg','class-roster.jpg']],
 ['recipes','Paid recipes and print layout',['paid-recipe-full.jpg','paid-recipe-print.jpg']],
 ['newsletters','Newsletter workflow',['newsletter-editor.jpg','newsletter-campaign.jpg']],
 ['management','Service invoice workflow',['invoice-editor.jpg','invoice-issued.jpg']],
 ['content','Content and launch review',['contentful-access.jpg','homepage-review.jpg']],
];
for(const [section,title,files]of referenceSlides) {
 const images=files.map(file=>evidence.screenshots.find(item=>item.file===file));
 const notes=images.map(item=>`${item.title}. ${item.kind}, captured ${item.capturedOn}. ${item.caption} Source: docs/walkthrough-evidence/2026-10-30/${item.file}`).join('\n\n');
 const verification=evidence.sections.find(item=>item.id===section);
 const s=slide(title,`OPTIONAL SCREENSHOT REFERENCE. Hidden during normal slideshow playback. Open manually from the slide overview when needed.\n\n${notes}\n\nChecked: ${verification.checked}\nStill to verify: ${verification.remaining}`);
 s.hidden=true;
 for(const [i,item]of images.entries()) {
  const x=70+i*585;
  await pic(s,root+'/docs/walkthrough-evidence/2026-10-30/'+item.file,x,185,555,355,'contain',item.title+'. '+item.caption);
  text(s,item.title,x,555,555,45,24,C.ink,true);
  text(s,`${item.kind}. ${item.caption}`,x,600,555,56,17,C.body);
 }
 link(s,'Open all step images in the guide','https://www.waistlessfoods.com/admin/walkthrough#'+section,70,125,1050,C.teal,22);
}

// 18. Hidden pricing appendix, for use only if Amber asks about budget.
{
const s=slide('Optional pricing discussion','HIDDEN APPENDIX. Normal slideshow playback skips this slide. Show it manually only if Amber asks about budget after discussing her recurring tasks. Source: revised draft support proposal dated October 30, 2026. Website support is provisionally USD $300 per month with up to five combined service hours for technical work and coordination. Monthly Website & Content Support is provisionally USD $700 per month with fifteen combined staff hours: five technical, eight design/admin, and two coordination/review. These are planning limits in the detailed terms, not extra production time above the sample deliverables. Meetings, revisions, testing, and reporting count. The content plan on slide 4 is illustrative and must be estimated before quantities are promised. Confirm staffing, full delivery cost, and final scope before issuing a quote. One newsletter draft, four graphics, two updates, a website check with small fixes, and a monthly review are the proposed example, not a committed output package.');
table(s,[['','Website support','Website & content support'],['Proposed monthly fee','USD $300','USD $700'],['Focus','Technical help and small updates','Website care plus regular content preparation'],['Example work','Agreed checks and minor changes','Newsletter, graphics, and content updates'],['Best fit','Amber manages routine content','Amber wants help preparing and publishing content']],70,180,1140,350,[290,350,500],{fontSize:23});
s.hidden = true;
text(s,'Provisional figures. Confirm team costs and scope before a final quote.',70,560,1140,50,24,C.teal,true);
text(s,'The separate proposal defines scope, revisions, capacity, and trial terms.\nExample quantities need a team estimate. Provider fees are separate.',70,614,1140,65,21,C.body);
}

await fs.mkdir(work+'/visual-tour-renders',{recursive:true});
for(const [i,s] of P.slides.items.entries()) {
 const blob=await P.export({slide:s,format:'png',scale:1});
 await fs.writeFile(`${work}/visual-tour-renders/slide-${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await blob.arrayBuffer()));
}
const candidate=work+'/visual-tour-candidate.pptx';
await (await PresentationFile.exportPptx(P)).save(candidate);
const result=await finalizePresentation({
 workspaceDir:root,candidatePath:candidate,finalPath:root+'/output/amber-presentation/WaistLess-Foods-Visual-Walkthrough-Presentation.pptx',
 pythonExecutable:PYTHON,
 integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',
 layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...[2,4,6,18].flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:18,requiredNativeTableOwnerSlides:[2,4,6,18],requiredNativeChartOwnerSlides:[],
 fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,
 receiptPath:work+'/visual-tour-validation.json',
});
console.log(JSON.stringify(result,null,2));
