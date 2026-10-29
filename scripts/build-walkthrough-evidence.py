"""Build the public-safe metadata for admin-protected walkthrough captures."""
import json
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
folder=root/'docs/walkthrough-evidence/2026-10-30'
report=json.loads((folder/'capture-report.json').read_text(encoding='utf-8'))
sections=[
 {'id':'consultations','checked':'The live form opens. A browser-only request response reaches the Google schedule. Google event questions are reviewed when available. The admin example uses a synthetic inquiry.','remaining':'A real saved inquiry, delivered emails, completed Google appointment, calendar invitation, and Google Meet link.'},
 {'id':'services','checked':'Private Chef and Catering request pages, required-field validation, and confirmation states with simulated submission responses.','remaining':'Persisted service requests and customer/admin confirmation delivery using an agreed test recipient. Replace the Catering starting-price placeholder ($XXX) during content review.'},
 {'id':'classes','checked':'Private-class inquiry validation and simulated confirmation, the live unavailable-class view, and a sample class roster. Database-backed roster access and filtering passed isolated temporary-table tests.','remaining':'Public-class enrollment, actual payment and seat allocation, and customer notifications before enrollment is enabled.'},
 {'id':'recipes','checked':'Owner-only paid recipe previews, complete recipe layout, and print styling. No purchase was needed for the admin preview.','remaining':'A final customer purchase-to-unlock check and the customer’s Print / Save PDF experience after payment.'},
 {'id':'newsletters','checked':'Save, preview, publish, and campaign preparation with browser-only sample responses. Publishing did not send an email. Newsletter authorization, publication and PDF-download APIs passed temporary-table tests with a mocked mailer.','remaining':'Real inbox delivery and a fresh customer sign-in/archive/download check. The member-archive image is explicitly dated September 6.'},
 {'id':'management','checked':'Invoice draft and issue controls with simulated Stripe responses. Invoice business rules and HTTP guards passed mocked tests. Review moderation and admin navigation use sample or non-customer views.','remaining':'Real invoice delivery, live payment reconciliation and a real review publication cycle. No real invoice, charge, email or review change occurred.'},
 {'id':'content','checked':'Contentful’s separate sign-in screen, the published homepage, and read-only storefront settings.','remaining':'Editing and publishing an entry in the owner’s Contentful session, final content approval, and approval to lift the preview restriction.'},
]
shots=[]
seen=set()
for screenshot in report['screenshots']:
 if screenshot['file'] in seen: continue
 seen.add(screenshot['file'])
 with Image.open(folder/screenshot['file']) as img:
  assert img.width>100 and img.height>100
  screenshot['width'],screenshot['height']=img.size
 shots.append(screenshot)
order={section['id']:i for i,section in enumerate(sections)}
shots.sort(key=lambda shot:(order[shot['section']],shot['step']))
for section in sections:
 images=[shot for shot in shots if shot['section']==section['id']]
 assert len(images)>=3,section['id']
 assert set(range(1,5 if section['id']=='newsletters' else 4)) <= {shot['step'] for shot in images},section['id']
result={'capturedOn':'2026-10-30','sections':sections,'screenshots':shots}
(root/'lib/walkthrough-evidence.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'images':len(shots),'sections':len(sections),'bytes':sum((folder/shot['file']).stat().st_size for shot in shots)}))
