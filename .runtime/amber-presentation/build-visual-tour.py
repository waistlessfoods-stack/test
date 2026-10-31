from pathlib import Path

root=Path('C:/Users/MSI/code/waistlessfoods')
work=root/'.runtime/amber-presentation'
script=(work/'build-value-presentation.mjs').read_text(encoding='utf-8')
script=script.replace("text(s,'The guide keeps each step and its page links together while we review.'", "text(s,'The guide includes step screenshots, direct links, and notes on what was tested.'")
script=script.replace('October 30, 2026.\');','October 30, 2026. The optional screenshot-reference slides are hidden after the main presentation. Use them from the slide overview when a live demo is inconvenient.\');',1)
reference=r'''
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

'''
script=script.replace('// 11. Hidden pricing appendix',reference+'// 18. Hidden pricing appendix')
script=script.replace('[2,4,6,11]','[2,4,6,18]')
script=script.replace('explicitTotalSlideCount:11','explicitTotalSlideCount:18')
script=script.replace("work+'/value-renders'","work+'/visual-tour-renders'")
script=script.replace('`${work}/value-renders/','`${work}/visual-tour-renders/')
script=script.replace("work+'/value-candidate.pptx'","work+'/visual-tour-candidate.pptx'")
script=script.replace('WaistLess-Foods-Meeting-Presentation-2026-10-30.pptx','WaistLess-Foods-Visual-Walkthrough-Presentation.pptx')
script=script.replace("work+'/value-presentation-validation.json'","work+'/visual-tour-validation.json'")
(work/'build-visual-tour.mjs').write_text(script,encoding='utf-8')
print('Prepared 10 main slides, 7 hidden screenshot references, and 1 hidden pricing appendix.')
