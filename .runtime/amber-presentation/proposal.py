from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader

root = Path('C:/Users/MSI/code/waistlessfoods')
target = root / 'output/pdf/WaistLess-Foods-Support-Proposal-Draft.pdf'
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='ProposalTitle', fontName='Helvetica-Bold', fontSize=27, leading=31, spaceAfter=15, textColor=colors.HexColor('#173D40')))
styles.add(ParagraphStyle(name='SectionTitle', fontName='Helvetica-Bold', fontSize=15, leading=19, spaceBefore=17, spaceAfter=8, textColor=colors.HexColor('#173D40')))
styles.add(ParagraphStyle(name='Copy', fontName='Helvetica', fontSize=10.5, leading=14.3, spaceAfter=8, textColor=colors.HexColor('#304D50')))
styles.add(ParagraphStyle(name='SmallCopy', fontName='Helvetica', fontSize=9, leading=12.5, spaceAfter=7, textColor=colors.HexColor('#466163')))
styles.add(ParagraphStyle(name='Cell', fontName='Helvetica', fontSize=10, leading=14, textColor=colors.HexColor('#173D40')))
styles.add(ParagraphStyle(name='HeaderCell', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.white))
story=[]
def p(value, style='Copy'): story.append(Paragraph(value, styles[style]))
def heading(value): p(value,'SectionTitle')
def table(rows, widths):
    cells=[[Paragraph(value, styles['HeaderCell' if i == 0 else 'Cell']) for value in row] for i,row in enumerate(rows)]
    t=Table(cells, colWidths=widths, hAlign='LEFT', repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#173D40')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#EFF4F1')]),
        ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#D5DEDA')),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),11),('RIGHTPADDING',(0,0),(-1,-1),11),
        ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
    ]))
    story.append(t); story.append(Spacer(1,10))

p('Monthly Website &amp; Content Support', 'ProposalTitle')
p('Prepared for Amber Fitzgerald and John<br/>Muhammad Zulzidan M | Updated October 30, 2026','SmallCopy')
heading('Keep WaistLess Foods active while you focus on your clients')
p('Our team helps prepare your newsletters, create promotional graphics, and keep your website content updated. You provide the ideas and approve the work. Zul coordinates the designer and assistant and checks the results, so you have one person to contact.')
heading('An example month of support')
table([
 ['Work we prepare','What it helps you do'],
 ['<b>1 newsletter draft</b><br/>Format your supplied content in the existing branded template.','Keep subscribers informed without handling the formatting yourself.'],
 ['<b>4 promotional graphics</b><br/>Create static graphics using approved photos, copy, and templates.','Share recipes, services, or class announcements with consistent visuals.'],
 ['<b>2 website content updates</b><br/>Upload an approved recipe or update an existing page.','Keep the website current as your content develops.'],
 ['<b>1 website check and small fixes</b><br/>Review agreed pages and address minor issues within the support scope.','Have someone reviewing the website and following up on issues.'],
 ['<b>One contact and a monthly review</b><br/>Zul coordinates the work and shares a short progress report.','Delegate without having to manage several people.'],
], [242,226])
p('<b>Proposed team package: USD $700/month.</b> Start with a three-month trial and choose the work that is most useful to you. If you prefer to handle routine content yourself, website support alone is proposed at USD $300/month.')
p('<b>Draft for review:</b> The quantities above illustrate a possible monthly plan. Confirm the team estimate, content requirements, and final scope before offering them as committed deliverables at this price.','SmallCopy')

story.append(PageBreak())
p('What the monthly work includes','ProposalTitle')
heading('Newsletter preparation')
p('One draft using the existing branded template, up to 600 words of supplied final copy, and one call-to-action link. Includes formatting, a preview, and one consolidated revision round. Original article writing and a new email-template design are outside this example. Archive publishing and email sending require separate approval.')
heading('Promotional graphics')
p('Four static graphics based on approved brand templates. Each graphic covers one message in one agreed size, with one consolidated revision round. Additional sizes count as additional graphics. Illustration, animation, video editing, and a new brand identity need a separate estimate.')
heading('Website updates and checks')
p('Each of the two updates means one existing page or recipe entry, using supplied final text and one supplied image. A website check reviews agreed key pages and links. Minor text, image, or layout corrections can fit within the technical capacity. A larger defect is assessed and estimated before repair; unlimited fixes are not included.')
heading('What Amber provides and approves')
p('Provide final copy, recipe details, photos you can use, event information, and feedback. Amber approves public content and newsletter sends, and keeps decisions about prices, booking commitments, refunds, and customer relationships. Delayed materials or approvals can move delivery dates.')
heading('One contact for the team')
p('Zul agrees priorities, assigns work, reviews drafts, and reports what was completed and what comes next. The example includes one monthly check-in of up to 30 minutes. Staff capacity and access are confirmed before starting. Requests to organize inquiries or draft customer replies can be considered as agreed substitutions after estimating their effort.')
heading('Additional work and existing obligations')
p('Major features, redesigns, e-books, custom calendar synchronization, photography, paid advertising, full inbox management, calls, and emergency coverage need separate scope. Remaining agreed website corrections stay in the current project and are not charged again through this service.')

story.append(PageBreak())
p('Trial and working terms','ProposalTitle')
heading('Agree the plan before the trial starts')
p('Choose two recurring tasks Amber most wants to hand over. Estimate the sample newsletter, graphics, and updates with the assigned staff. Confirm the monthly deliverables, revision limits, deadlines, price, and access in a final written scope. The example quantities on page 1 become commitments only when that scope is approved.')
p('<b>Month 1:</b> Set up templates and approvals and record the actual work required.<br/><b>Month 2:</b> Complete agreed priorities and review the workload and revision effort.<br/><b>Month 3:</b> Review completed work and Amber\'s feedback, then decide whether to continue, resize, or stop.')
heading('Service capacity and billing')
p('The provisional USD $700 team package reserves up to 15 combined staff hours monthly: a planning split of 5 technical, 8 design/admin, and 2 coordination/review hours. The USD $300 website-only option reserves up to 5 hours for technical work and coordination. Meetings, revisions, testing, and reporting count within these limits. The website-only option does not include the sample content plan.')
p('Payment is proposed monthly in advance. Unused capacity expires monthly. Agree the work that fits before starting and flag scope pressure early. Substitutions require agreement. Extra work needs a written estimate and approval, with no automatic overage charges. Three months would total USD $2,100 for the team option or USD $900 for website support, before separate provider fees and any applicable taxes.')
heading('Requests and response times')
p('Use one agreed request list and one client contact. Proposed acknowledgement is within two business days, with delivery dates confirmed per task. This is a response target, not a promise to finish every task within two days. Agree business days, time-zone overlap, and any urgency arrangements before starting.')
heading('Review and ending the trial')
p('Proposed term is three months, with an option for either party to stop before the next unpaid month by giving 14 calendar days\' written notice before renewal. A paid service month remains available through its end. No automatic commitment beyond the trial; continuation requires written agreement. Confirm these terms in the final offer.')
p('<b>DRAFT FOR ZUL\'S REVIEW.</b> Check staffing and full delivery costs, then confirm the selected work, budget, approver, start date, and invoicing details. Resolve the fit between deliverables and capacity before issuing a final offer. These terms and example quantities have not been accepted.','SmallCopy')

def footer(canvas, doc):
    canvas.saveState(); canvas.setFont('Helvetica',8.5);canvas.setFillColor(colors.HexColor('#466163'))
    canvas.drawString(72,35,'WaistLess Foods | Optional support proposal | Draft for review')
    canvas.drawRightString(540,35,str(doc.page));canvas.restoreState()

doc=SimpleDocTemplate(str(target),pagesize=letter,rightMargin=72,leftMargin=72,topMargin=54,bottomMargin=56,title='WaistLess Foods - Draft Support Proposal',author='Muhammad Zulzidan M')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(str(target))
assert len(reader.pages)==3,len(reader.pages)
content='\n'.join(page.extract_text() for page in reader.pages)
for value in ['$300','$700','$900','$2,100','15 combined staff hours','DRAFT FOR ZUL']:
    assert value in content,value
first_page = reader.pages[0].extract_text()
assert 'Total monthly allowance' not in content
assert 'combined staff hours' not in first_page
for value in ['1 newsletter draft','4 promotional graphics','2 website content updates','1 website check and small fixes','One contact and a monthly review']:
    assert value in first_page,value
print(f'Created {len(reader.pages)}-page draft proposal: {target}')
