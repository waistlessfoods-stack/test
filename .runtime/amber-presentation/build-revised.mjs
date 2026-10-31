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
const s=slide('Live website walkthrough','Open the guide and sign in with the existing admin password. Never display credentials on the slide or share the environment file. Walk through the customer pages, paid recipe preview, newsletter workflow, and the admin tools Amber wants to use. Return to the presentation after the demo. Customer pages may require the separate preview password or customer account sign-in. Screenshot source: live read-only capture of https://www.waistlessfoods.com/admin/walkthrough on October 29, 2026.');
text(s,'Explore the customer journey\nand the tools behind it',70,200,480,100,31,C.ink,true);
text(s,'The guide keeps each step and its page links together while we review.',70,335,460,120,27,C.body);
link(s,'Open the live walkthrough','https://www.waistlessfoods.com/admin/walkthrough#website-tour',70,505,490);
text(s,'Admin sign-in required',70,563,450,36,20,C.body);
await pic(s,work+'/walkthrough.png',610,195,600,429,'contain','Live Website Walkthrough page, without customer records');
}
// 4. Operational value grounded in task ownership, no invented financial return.
{
const s=slide('The recurring work around your website','Ask which of these tasks Amber currently does, how often they occur, and what she wants to retain. Treat the benefits as intended outcomes to test during a trial, not established results. Amber previously requested ownership of newsletters, so the team can prepare and format content while she keeps editorial and sending decisions.');
table(s,[['Recurring task','What our support would handle'],['Keep recipes current','Upload approved recipes and check the layout'],['Promote services or classes','Prepare graphics from approved details'],['Prepare a newsletter','Format supplied content and organize the archive'],['Stay on top of inquiries','Maintain a follow-up list and draft replies']],70,180,1140,395,[450,690]);
text(s,'You choose what to hand over and keep approval of your brand and customer commitments',70,600,1120,55,24,C.teal,true);
}
// 5. Team structure in flat editorial columns.
{
const s=slide('One contact, a team behind the work','Zul remains the client contact and is accountable for assigning tasks and reviewing output. Confirm staffing and capacity in the written scope before promising coverage. Designers and assistants work on agreed tasks with appropriate access. Amber supplies or approves content and retains authority over customer prices, booking commitments, and newsletter sends. This is proposed part-time support.');
const cols=[['Zul','Your point of contact','Priorities, technical decisions,\nand final quality checks'],['Developer','Website support','Maintenance, troubleshooting,\nand small improvements'],['Designer','Visual content','Class flyers, social graphics,\nand newsletter artwork'],['Assistant','Content and admin','Recipe uploads, newsletter\nformatting, and draft replies']];
cols.forEach((a,i)=>{const x=70+i*290;text(s,a[0],x,220,260,55,36,C.teal,true);text(s,a[1],x,300,260,70,25,C.ink,true);text(s,a[2],x,400,260,160,24,C.body);});
text(s,'Access to several skills within an agreed monthly allowance',70,595,1100,45,27,C.ink,true);
}
// 6. Concrete example of work reused across channels.
{
const s=slide('One newsletter can support several updates','This is an example workflow, not a guaranteed monthly quantity. Amber provides the message and approved content. The team estimates the work against the monthly allowance before starting. Sending a newsletter and publishing it to the archive are separate actions. Do not publish or send without Amber’s approval. Source for existing newsletter functionality: https://www.waistlessfoods.com/admin/walkthrough#newsletters.');
table(s,[['Amber provides','The team prepares'],['A recipe, story, or class announcement','A formatted newsletter draft'],['Approved photos and event details','Matching promotional graphics'],['Final edits and approval','The approved website or archive update']],70,190,1140,330,[500,640]);
text(s,'A useful starting project for the trial',70,570,1100,45,29,C.teal,true);
text(s,'We estimate the work first and agree what fits the monthly allowance.',70,615,1100,36,23,C.body);
}
// 7. Clear request and approval process, with text rather than decorative diagram.
{
const s=slide('How we would work together','Explain that Amber has one request list and one point of contact. We estimate and prioritize tasks, then confirm delivery dates. Revisions, meetings, and coordination consume the agreed capacity. Extra work requires approval. Confirm response windows and business days in the final agreement rather than promising same-day availability in this conversation.');
const rows=[['01','Choose priorities','Amber shares approved materials and the most important tasks.'],['02','Confirm the plan','Zul checks the scope, time required, and delivery dates.'],['03','Prepare and review','The team completes drafts. Amber approves public content.'],['04','Report and adjust','We share completed work, time used, and the next priorities.']];
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
text(s,'Recurring tasks and monthly capacity\n\nBudget, approvals, and response times\n\nA start date and review at three months',690,310,520,245,27,C.body);
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

// 11. Hidden pricing appendix, for use only if Amber asks about budget.
{
const s=slide('Optional pricing discussion','HIDDEN APPENDIX. Normal slideshow playback skips this slide. Show it manually only if Amber asks about budget after discussing her recurring tasks. These are provisional figures for internal review, not an accepted agreement or final quotation. Website Support follows the earlier $300 five-hour concept. The combined option uses a provisional USD $700 monthly fee for discussion. Confirm the team cost calculation and staffing before offering a final quote. A separate draft proposal records the proposed scope and commercial terms. The combined allowance is fifteen total hours: five technical, eight design/admin, and two coordination/review. Do not promise fifteen production hours plus additional management.');
table(s,[['','Website support','Website + design + admin'],['Proposed monthly budget','USD $300','USD $700'],['Monthly allowance','5 total hours','15 total hours'],['Planned allocation','Technical help and small updates','5 technical / 8 design or admin / 2 coordination'],['Best fit','Amber runs routine content work','Amber delegates regular content tasks']],70,180,1140,350,[320,330,490],{fontSize:23});
s.hidden = true;
text(s,'Provisional figures. Confirm team costs and scope before a final quote.',70,560,1140,50,24,C.teal,true);
text(s,'Paid monthly in advance. Meetings and revisions count toward the allowance.\nUnused hours expire monthly. Extra work needs approval. Provider fees are separate.',70,614,1140,65,21,C.body);
}

await fs.mkdir(work+'/revised-renders',{recursive:true});
for(const [i,s] of P.slides.items.entries()) {
 const blob=await P.export({slide:s,format:'png',scale:1});
 await fs.writeFile(`${work}/revised-renders/slide-${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await blob.arrayBuffer()));
}
const candidate=work+'/revised-candidate.pptx';
await (await PresentationFile.exportPptx(P)).save(candidate);
const result=await finalizePresentation({
 workspaceDir:root,candidatePath:candidate,finalPath:root+'/output/amber-presentation/WaistLess-Foods-Meeting-Presentation-Final.pptx',
 pythonExecutable:PYTHON,
 integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',
 layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...[2,4,6,11].flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:11,requiredNativeTableOwnerSlides:[2,4,6,11],requiredNativeChartOwnerSlides:[],
 fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,
 receiptPath:work+'/final-meeting-validation.json',
});
console.log(JSON.stringify(result,null,2));
