"""Package actual local-browser captures for review; no website or PDF changes."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import html
import json
import shutil
import zipfile

root = Path(__file__).resolve().parent.parent
folder = root / 'output/screenshots/waistless-agreement-updates-2026-11-04'
captures = json.loads((folder / 'captures.json').read_text(encoding='utf-8'))
for number in range(1, 7):
    file = f'16-print-page-{number}.png'
    rendered = root / f'tmp/pdfs/amber-original/final-print-{number}.png'
    if rendered.exists():
        shutil.copy2(rendered, folder / file)
    elif not (folder / file).exists():
        raise FileNotFoundError(f'Missing rendered print page: {file}')
    captures.append({'file': file, 'title': f'Printable agreement - page {number} of 6'})
for file, title in [
    ('admin-agreement-desktop.png', 'Full admin agreement - desktop'),
    ('admin-agreement-mobile.png', 'Full admin draft - mobile'),
    ('signed-agreement-desktop.png', 'Full signed customer agreement - desktop'),
    ('signed-agreement-mobile.png', 'Full signed customer agreement - mobile'),
    ('linked-paid-invoice-desktop.png', 'Linked invoice and payment status - desktop'),
    ('linked-paid-invoice-mobile.png', 'Linked invoice and payment status - mobile'),
]:
    captures.append({'file': file, 'title': title})
captures = list({item['file']: item for item in captures}.values())

font_root = Path('C:/Windows/Fonts')
font = ImageFont.truetype(str(font_root / 'segoeui.ttf'), 19)
heading = ImageFont.truetype(str(font_root / 'segoeuib.ttf'), 35)
selected = ['01-admin-overview.png', '03-intake-1.png', '03-intake-2.png',
            '04-policy-blanks-1.png', '04-policy-blanks-2.png', '06-required-details-1.png',
            '07-catering-confirmation-1.png', '09-chef-signing-1.png', '12-customer-signing.png',
            '13-both-signatures-1.png', '15-mobile-signatures-1.png', '16-print-page-6.png']
overview = Image.new('RGB', (1560, 1290), '#f3f7f5')
draw = ImageDraw.Draw(overview)
draw.text((30, 20), 'WaistLess Foods | Agreement updates', font=heading, fill='#173d40')
draw.text((30, 70), 'Local preview - fictional example data. Open the gallery for full-size screenshots.', font=font, fill='#367577')
for index, file in enumerate(selected):
    item = next(item for item in captures if item['file'] == file)
    col, row = index % 4, index // 4
    x, y = 30 + col * 385, 120 + row * 385
    image = Image.open(folder / file).convert('RGB')
    # Thumbnail is an exact crop/resize of the screenshot, never a reconstruction.
    thumb = ImageOps.contain(image.crop((0, 0, image.width, min(image.height, 1000))), (355, 300))
    draw.rounded_rectangle((x, y, x + 355, y + 300), radius=8, fill='white', outline='#cbdcd6')
    overview.paste(thumb, (x + (355-thumb.width)//2, y))
    title = item['title']
    words, lines, line = title.split(), [], ''
    for word in words:
        candidate = (line + ' ' + word).strip()
        if draw.textlength(candidate, font=font) > 350:
            lines.append(line)
            line = word
        else:
            line = candidate
    lines.append(line)
    for offset, line in enumerate(lines[:3]):
        draw.text((x, y + 310 + offset*23), line, font=font, fill='#173d40')
overview.save(folder / 'overview.png')

cards = []
for item in captures:
    title, file = html.escape(item['title']), html.escape(item['file'])
    cards.append(f'<article><h2>{title}</h2><a href="{file}" target="_blank"><img src="{file}" alt="{title}" loading="lazy"></a><a href="{file}" target="_blank">Open full size</a></article>')
document = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WaistLess Foods agreement screenshots</title>
<style>body{margin:0;background:#f3f7f5;color:#173d40;font:16px/1.6 system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:32px}h1{font:40px Georgia,serif;margin:0}p{max-width:950px}a{color:#086b70}nav{margin:24px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}article{padding:20px;background:white;border:1px solid #d6e4df;border-radius:12px}h2{font-size:18px;line-height:1.4;margin:0 0 16px}img{width:100%;height:420px;object-fit:contain;object-position:top;border:1px solid #e2ebe7;background:#fafcfb}article>a:last-child{display:block;margin-top:10px}.note{padding:16px;background:#e4f0eb;border-radius:8px}</style>
<main><h1>Agreement workflow updates</h1><p>November 4, 2026. Actual screenshots of the local application, including every updated section, both signing steps, desktop/mobile layouts, linked invoicing, and all six print pages. Click any screenshot to view its full resolution.</p><p class="note">Fictional example customer and policy values are used throughout. These are local previews. No real customer email, payment, or agreement was created; the updates have not been deployed.</p><nav><a href="overview.png">Open overview image</a></nav><div class="grid">'''+''.join(cards)+'''</div></main></html>'''
(folder / 'index.html').write_text(document, encoding='utf-8')
(folder / 'README.txt').write_text('Open index.html in your browser for the screenshot gallery.\nAll screenshots use fictional example data in the local application.\nNo real emails or payments were sent. Not deployed.\n', encoding='utf-8')
(folder / 'captures.json').write_text(json.dumps(captures, indent=2), encoding='utf-8')
archive = root / 'output/screenshots/waistless-agreement-updates-2026-11-04.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for path in sorted(folder.iterdir()):
        if path.is_file():
            bundle.write(path, f'{folder.name}/{path.name}')
print(json.dumps({'screenshots': len(captures), 'gallery': str(folder / 'index.html'), 'zip': str(archive)}))
