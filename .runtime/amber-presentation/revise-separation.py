from pathlib import Path

root = Path('C:/Users/MSI/code/waistlessfoods')
work = root / '.runtime/amber-presentation'
script = (work / 'build.mjs').read_text(encoding='utf-8')
start = script.index('// 8. Proposed commercial options')
end = script.index('// 9. Pilot', start)
pricing = script[start:end]
script = script[:start] + script[end:]
pricing = pricing.replace('// 8. Proposed commercial options, explicit provisional status.', '// 11. Hidden pricing appendix, for use only if Amber asks about budget.')
pricing = pricing.replace("const s=slide('Monthly support options to discuss'", "const s=slide('Optional pricing discussion'")
pricing = pricing.replace('These are proposed discussion figures, not an accepted agreement or confirmed final quotation.', 'HIDDEN APPENDIX. Normal slideshow playback skips this slide. Show it manually only if Amber asks about budget after discussing her recurring tasks. These are provisional figures for internal review, not an accepted agreement or final quotation.')
pricing = pricing.replace('The combined option is an illustrative $650–750 range from our planning conversation. Confirm delivery costs and staffing before issuing a final written quote.', 'The combined option uses a provisional USD $700 monthly fee for discussion. Confirm the team cost calculation and staffing before offering a final quote. A separate draft proposal records the proposed scope and commercial terms.')
pricing = pricing.replace("'USD $650–750'", "'USD $700'")
pricing = pricing.replace("text(s,'Discussion figures. Final scope, staffing, and price confirmed in writing.'", "s.hidden = true;\ntext(s,'Provisional figures. Confirm team costs and scope before a final quote.'")
script = script.replace("await fs.mkdir(work+'/renders'", pricing + "\nawait fs.mkdir(work+'/renders'")
script = script.replace("work+'/renders'", "work+'/revised-renders'")
script = script.replace('`${work}/renders/', '`${work}/revised-renders/')
script = script.replace("work+'/candidate.pptx'", "work+'/revised-candidate.pptx'")
script = script.replace("WaistLess-Foods-Website-and-Team-Support-Aligned.pptx", "WaistLess-Foods-Meeting-Presentation.pptx")
script = script.replace("work+'/aligned-validation.json'", "work+'/revised-validation.json'")
script = script.replace('[2,4,6,8]', '[2,4,6,11]')
script = script.replace('// 9. Pilot', '// 8. Pilot').replace('// 10. No recharging', '// 9. No recharging').replace('// 11. Conversational close', '// 10. Conversational close')
script = script.replace('The trial begins after the current project closeout is agreed.', 'This trial is optional and starts only after we agree on the current project closeout, scope, budget, and staffing in writing. Ask what support Amber wants before proposing a package.')
script = script.replace("Ask Amber to identify the two tasks she would most like help with.", "Ask Amber to identify the two tasks she would most like help with. Close the normal presentation here. Ask permission conversationally to prepare a tailored written proposal after learning her workload and budget. Only show the hidden appendix manually if she asks about pricing.")
(work / 'build-revised.mjs').write_text(script, encoding='utf-8')
print('Prepared 10 main slides and one hidden pricing appendix.')
