"""Render and inspect the generated attachment with PyMuPDF, installed separately."""
from pathlib import Path
import sys

if len(sys.argv) > 1:
    sys.path.insert(0, sys.argv[1])
import pymupdf as fitz

folder = Path('docs/client-review-2026-09-09')
document = fitz.open(folder / 'WaistLess-Foods-Website-Review-2026-09-09.pdf')
assert document.page_count == 34
for index, page in enumerate(document):
    assert page.get_text().strip(), f'Missing caption on page {index + 1}'
    assert page.get_images(), f'Missing screenshot on page {index + 1}'
    for block in page.get_image_info():
        box = fitz.Rect(block['bbox'])
        assert box.x0 >= -1 and box.y0 >= -1
        assert box.x1 <= page.rect.width + 1 and box.y1 <= page.rect.height + 1
    for block in page.get_text('blocks'):
        assert block[0] >= 0 and block[2] <= page.rect.width + 1
    if index in [0, 1, 9, 10, 18, 22, 23, 31]:
        scale = min(1, 1600 / page.rect.height)
        page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False).save(folder / f'pdf-check-page-{index+1}.png')
print(f'PASS: {document.page_count} readable PDF pages; all screenshots and captions within page bounds.')
