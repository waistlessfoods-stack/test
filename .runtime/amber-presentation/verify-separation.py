from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json

root=Path('C:/Users/MSI/code/waistlessfoods')
deck=root/'output/amber-presentation/WaistLess-Foods-Meeting-Presentation-Final.pptx'
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with ZipFile(deck) as z:
    hidden=[]
    for i in range(1,12):
        slide=ET.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
        content=' '.join(el.text or '' for el in slide.findall('.//a:t',ns))
        if slide.get('show')=='0': hidden.append(i)
        if i<=10:
            for term in ['USD $','$300','$700','$650']:
                assert term not in content,(i,term)
        else:
            assert 'USD $300' in content and 'USD $700' in content
        if i in (3,10):
            assert '#website-tour' in z.read(f'ppt/slides/_rels/slide{i}.xml.rels').decode()
    assert hidden==[11],hidden
    assert 'What would you like' in z.read('ppt/slides/slide10.xml').decode()
print(json.dumps({'mainSlides':10,'hiddenPricingAppendix':hidden,'mainSlidesHaveNoPrices':True,'demoLinks':True}))
