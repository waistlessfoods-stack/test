"""Create a full-resolution PDF review of all 30 captured agreement views."""
from pathlib import Path
from xml.sax.saxutils import escape
import json

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'output/screenshots/waistless-agreement-updates-2026-11-04'
OUTPUT = ROOT / 'output/pdf/waistless-foods-agreement-updates-screenshots-2026-11-04.pdf'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
W, H = A4
MARGIN = 38
INK = colors.HexColor('#173d40')
TEAL = colors.HexColor('#086b70')
MUTED = colors.HexColor('#526967')
LINE = colors.HexColor('#d6e4df')
for name, file in [('Arial', 'arial.ttf'), ('ArialBold', 'arialbd.ttf'), ('Georgia', 'georgia.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / file)))
entries = json.loads((SOURCE / 'captures.json').read_text(encoding='utf-8'))
titles = {item['file']: item['title'] for item in entries}
plan = [
    ('Administrator overview', ['01-admin-overview.png'], 'The original contract is available through the administrator-only PDF link.'),
    ('Booking details and draft source', ['02-draft-1.png'], 'Customer details carry over from the booking request. The source filename and original contract are prefilled.'),
    ('Client and event intake - 1', ['03-intake-1.png'], 'Client address, optional birth date, contact preference, mailing-list preference, and event information.'),
    ('Client and event intake - 2', ['03-intake-2.png'], 'Event and Chef times, time zone, dietary restrictions, allergies, cuisine, and nutritional goals.'),
    ('Contract settings - 1', ['04-policy-blanks-1.png'], 'Policy values start blank. The phone discrepancy is shown for confirmation.'),
    ('Contract settings - 2', ['04-policy-blanks-2.png'], 'Each notice period, guest fee, travel rule, governing state, and business phone can be completed.'),
    ('Original agreement wording', ['05-original-terms.png'], 'All 25 sections are included. Bracketed fields are filled from saved customer, event, and contract settings.'),
    ('Required details and Catering approval', ['06-required-details-1.png', '07-catering-confirmation-1.png'], 'Unresolved values block issuance. Catering also requires confirmation that the Personal Chef contract applies.'),
    ('Completed example settings - 1', ['08-filled-settings-1.png'], 'Fictional QA values illustrate the completed editor; they are not approved business policies.'),
    ('Completed example settings - 2', ['08-filled-settings-2.png'], 'Additional fictional example values for the notice periods, charges, and contact details.'),
    ('Chef signature and signing link', ['09-chef-signing-1.png', '10-share-link-1.png'], 'The Chef signs the reviewed saved document before the customer link is created. Emailing remains an explicit action.'),
    ('Customer review', ['11-customer-review.png'], 'Customers review their event, intake, agreement terms, and Chef signature before signing.'),
    ('Customer signature and saved proof', ['12-customer-signing.png', '13-both-signatures-1.png', '14-signing-confirmation.png'], 'The final copy shows both signatures, timestamps, a document reference, and the frozen document hash.'),
    ('Signatures on mobile', ['15-mobile-signatures-1.png'], 'The signed customer copy remains readable on a 390px mobile viewport.'),
]
for number in range(1, 7):
    plan.append((f'Printable agreement - {number} of 6', [f'16-print-page-{number}.png'], 'Previously verified printable example. Its reference and timestamps may differ from the newer browser captures.'))
for file in ['admin-agreement-desktop.png', 'admin-agreement-mobile.png', 'signed-agreement-desktop.png', 'signed-agreement-mobile.png', 'linked-paid-invoice-desktop.png', 'linked-paid-invoice-mobile.png']:
    plan.append((titles[file], [file], 'Full-length reference screenshot on a long PDF page. Scroll vertically to review; original image resolution is retained.'))
assert len({file for _, files, _ in plan for file in files}) == 30
TOTAL = len(plan) + 1

pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
pdf.setTitle('WaistLess Foods - Agreement updates screenshot review')
pdf.setAuthor('WaistLess Foods')
pdf.setSubject('All 30 local agreement workflow screenshots - November 4, 2026')
styles = {
    'title': ParagraphStyle('title', fontName='Georgia', fontSize=23, leading=28, textColor=INK),
    'body': ParagraphStyle('body', fontName='Arial', fontSize=9, leading=13, textColor=MUTED),
    'caption': ParagraphStyle('caption', fontName='ArialBold', fontSize=8, leading=11, textColor=TEAL),
}

def paragraph(text, x, top, width, style='body'):
    p = Paragraph(escape(text), styles[style])
    _, height = p.wrap(width, H)
    p.drawOn(pdf, x, top - height)
    return height

def chrome(number):
    pdf.setFillColor(TEAL)
    pdf.setFont('ArialBold', 8)
    pdf.drawString(MARGIN, H - 27, 'WAISTLESS FOODS')
    pdf.setFont('Arial', 8)
    pdf.setFillColor(MUTED)
    pdf.drawRightString(W - MARGIN, H - 27, 'November 4, 2026 | Local review')
    pdf.setStrokeColor(LINE)
    pdf.line(MARGIN, H - 37, W - MARGIN, H - 37)
    pdf.line(MARGIN, 35, W - MARGIN, 35)
    pdf.setFont('Arial', 7.5)
    pdf.drawString(MARGIN, 22, 'Fictional example data | Updates not deployed')
    pdf.drawRightString(W - MARGIN, 22, f'{number} / {TOTAL}')

def picture(file, x, top, width, height):
    path = SOURCE / file
    with Image.open(path) as source:
        iw, ih = source.size
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    left = x + (width - dw) / 2
    # Keep the original raster resolution in the PDF, including tall references.
    pdf.drawImage(str(path), left, top - dh, dw, dh, preserveAspectRatio=True, mask='auto')
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.4)
    pdf.rect(left, top - dh, dw, dh)
    return dh

chrome(1)
pdf.bookmarkPage('overview')
pdf.addOutlineEntry('Overview', 'overview', 0)
top = H - 64
top -= paragraph('Agreement workflow\nScreenshot review'.replace('\n', ' - '), MARGIN, top, W - 2*MARGIN, 'title') + 15
top -= paragraph('30 screenshots covering the original contract, intake, policy settings, Chef and Client signatures, mobile layouts, linked invoices, and six print pages.', MARGIN, top, W - 2*MARGIN) + 15
top -= paragraph('Local preview only. Customer details and policy values are fictional examples. Amber still needs to confirm the actual policies, phone number, and Catering applicability.', MARGIN, top, W - 2*MARGIN) + 19
picture('overview.png', MARGIN, top, W - 2*MARGIN, 405)
paragraph('Reading guide: detailed updates on pages 2-15; printable example on pages 16-21; desktop, mobile, and invoice references on pages 22-27. The final six pages use long formats to keep full-length screenshots readable.', MARGIN, 113, W - 2*MARGIN)
pdf.showPage()

for number, (title, files, note) in enumerate(plan, start=2):
    W, H = A4
    if number >= 22:
        with Image.open(SOURCE / files[0]) as image:
            W = 1000 if image.width >= 1000 else 377
            H = max(A4[1], image.height * min((W-2*MARGIN)/image.width, 0.9) + 260)
    pdf.setPageSize((W, H))
    chrome(number)
    key = f'view-{number}'
    pdf.bookmarkPage(key)
    pdf.addOutlineEntry(title, key, 0)
    top = H - 61
    top -= paragraph(title, MARGIN, top, W - 2*MARGIN, 'title') + 10
    top -= paragraph(note, MARGIN, top, W - 2*MARGIN) + 16
    captions = [titles[file] if len(files) > 1 else '' for file in files]
    gap = 16
    caption_heights = []
    for caption in captions:
        p = Paragraph(escape(caption), styles['caption'])
        caption_heights.append(p.wrap(W - 2*MARGIN, H)[1] + 5 if caption else 0)
    available = top - 50 - sum(caption_heights) - gap*(len(files)-1)
    natural = []
    for file in files:
        with Image.open(SOURCE / file) as image:
            natural.append(image.height * min((W-2*MARGIN)/image.width, 0.9))
    factor = min(1, available / sum(natural))
    for file, caption, ch, expected in zip(files, captions, caption_heights, natural):
        if caption:
            paragraph(caption, MARGIN, top, W - 2*MARGIN, 'caption')
            top -= ch
        height = picture(file, MARGIN, top, W - 2*MARGIN, expected * factor)
        top -= height + gap
    assert top + gap >= 48, (title, top)
    pdf.showPage()
pdf.save()
reader = PdfReader(OUTPUT)
assert len(reader.pages) == TOTAL == 27
for page in reader.pages:
    assert page.images
print(json.dumps({'output': str(OUTPUT), 'pages': len(reader.pages), 'screenshots': 30, 'bytes': OUTPUT.stat().st_size}))
