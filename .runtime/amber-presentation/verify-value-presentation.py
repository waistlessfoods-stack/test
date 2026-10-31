from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from pypdf import PdfReader
import json

root=Path('C:/Users/MSI/code/waistlessfoods')
deck=root/'output/amber-presentation/WaistLess-Foods-Meeting-Presentation-2026-10-30.pptx'
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with ZipFile(deck) as z:
    contents=[]; hidden=[]
    for i in range(1,12):
        slide=ET.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
        content=' '.join(el.text or '' for el in slide.findall('.//a:t',ns))
        contents.append(content)
        if slide.get('show')=='0': hidden.append(i)
        if i<=10:
            for term in ['USD $','$300','$700','monthly allowance','total hours']:
                assert term not in content,(i,term)
        else:
            assert 'USD $300' in content and 'USD $700' in content
        if i in (3,10):
            assert '#website-tour' in z.read(f'ppt/slides/_rels/slide{i}.xml.rels').decode()
    assert hidden==[11],hidden
    proposal=PdfReader(root/'output/pdf/WaistLess-Foods-Support-Proposal-Draft.pdf')
    first_page=proposal.pages[0].extract_text()
    for label in ['1 newsletter draft','4 promotional graphics','2 website content updates','1 website check and small fixes','One contact and a monthly review']:
        assert label in contents[3] and label in first_page,label
    assert 'Illustrative plan.' in contents[3]
    assert 'monthly allowance' not in ' '.join(contents).lower()
print(json.dumps({'mainSlides':10,'hiddenPricingAppendix':hidden,'deliverablesMatchProposal':True,'examplesClearlyLabelled':True,'noPricesInMainSlides':True,'tourDeepLinks':True}))
