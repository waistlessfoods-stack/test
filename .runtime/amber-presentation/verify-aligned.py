from pathlib import Path
from zipfile import ZipFile
import hashlib
import json

root = Path('C:/Users/MSI/code/waistlessfoods')
deck = root / 'output/amber-presentation/WaistLess-Foods-Website-and-Team-Support-Aligned.pptx'
with ZipFile(deck) as package:
    for n in (3, 11):
        rels = package.read(f'ppt/slides/_rels/slide{n}.xml.rels').decode()
        assert 'https://www.waistlessfoods.com/admin/walkthrough#website-tour' in rels
work = root / '.runtime/amber-presentation'
changed = [n for n in range(1, 12) if hashlib.sha256((work / f'final-renders/slide-{n}.png').read_bytes()).digest() != hashlib.sha256((work / f'aligned-final-renders/slide-{n}.png').read_bytes()).digest()]
assert changed == [3], changed
print(json.dumps({'deepLinksVerified': [3, 11], 'visuallyChangedSlides': changed, 'otherSlidesMatchInspectedOriginal': True}))
