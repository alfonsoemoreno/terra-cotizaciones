from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
ASSETS = ROOT / 'design' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)
ASSETS.mkdir(parents=True, exist_ok=True)
image = Image.open('/Users/alfonsomoreno/Downloads/logo-terra.png')
image = image.crop(image.getchannel('A').getbbox())
image.thumbnail((650, 720))
image.save(ASSETS / 'terra-logo.png')
GREEN, INK, GRAY, LINE = map(HexColor, ['#204B39', '#202B26', '#64736B', '#DFE7E1'])
pdf = OUT / 'terra-cotizacion-muestra.pdf'
c = canvas.Canvas(str(pdf), pagesize=(612, 792))
c.setTitle('Terra - Muestra de cotización')
c.setAuthor('Terra')
style = ParagraphStyle('body', fontName='Helvetica', fontSize=9, leading=13, textColor=INK)
small = ParagraphStyle('small', parent=style, fontSize=8, leading=11)

def txt(x, y, text, size=9, color=INK, bold=False):
    c.setFillColor(color)
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    c.drawString(x, y, text)

def paragraph(text, x, y, width, sty=style):
    p = Paragraph(text, sty)
    _, h = p.wrap(width, 700)
    p.drawOn(c, x, y-h)
    return y-h

c.drawImage(ImageReader(image), 40, 679, width=92, height=102, mask='auto', preserveAspectRatio=True)
txt(153, 747, 'SERVICIOS & PROYECTOS INTEGRALES', 11, GREEN, True)
txt(153, 729, 'Forestal · Construcción · Automatización', 9, GRAY)
txt(153, 704, 'COTIZACIÓN', 20, GREEN, True)
c.setFont('Helvetica-Bold', 10)
c.drawRightString(572, 704, 'TERR-2026-0001 / Rev. 1')
c.setStrokeColor(GREEN)
c.setLineWidth(1.5)
c.line(40, 669, 572, 669)
txt(40, 651, 'MUESTRA DE DISEÑO - NO EMITIDA', 8, GRAY)

c.setFillColor(HexColor('#F4F7F4'))
c.roundRect(40, 538, 532, 96, 5, fill=1, stroke=0)
txt(53, 616, 'PRESTADOR', 8, GREEN, True)
txt(53, 599, 'Nelson Escobar Belmar', 10, INK, True)
txt(53, 582, '+56 9 7851 5073')
txt(53, 566, 'escobar.oceanico@hotmail.com')
txt(320, 616, 'CLIENTE', 8, GREEN, True)
txt(320, 599, 'Guillermo Sepúlveda', 10, INK, True)
txt(320, 582, 'Emisión de ejemplo: 25 de agosto de 2026')
txt(320, 566, 'Validez: 15 días corridos')

txt(40, 514, 'Limpieza de terreno y tala', 14, GREEN, True)
y = paragraph('Servicio integral de limpieza de <b>800 m²</b>, despeje de vegetación menor, desbroce de arbustos y tala segura de árboles secos. Plazo estimado: <b>5 días hábiles</b>.', 40, 499, 532)
txt(40, y-25, 'DETALLE DEL PRESUPUESTO', 9, GREEN, True)
rows = [
    ['Servicio', 'Cant.', 'Unidad', 'P. unitario', 'Total neto'],
    [Paragraph('<b>Despeje y roce de arbustos</b><br/>Limpieza superficial de maleza en 800 m².', small), '800', 'm²', '$850', '$680.000'],
    [Paragraph('<b>Tala de árboles secos</b><br/>Corte controlado, trozado y acopio.', small), '1', 'Global', '$250.000', '$250.000'],
    [Paragraph('<b>Operación y logística</b><br/>Mano de obra, combustible, equipos y EPP.', small), '5', 'Días', '$70.000', '$350.000'],
]
table = Table(rows, colWidths=[258, 40, 48, 86, 100], repeatRows=1)
table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), GREEN), ('TEXTCOLOR', (0,0), (-1,0), white),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
    ('FONTSIZE', (0,0), (-1,-1), 8), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('ALIGN', (1,0), (2,-1), 'CENTER'), ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8), ('TOPPADDING', (0,0), (-1,-1), 8),
    ('LINEBELOW', (0,1), (-1,-1), .5, LINE),
]))
_, h = table.wrap(532, 700)
table.drawOn(c, 40, y-37-h)
y = y-37-h-19
for label, amount in [('Subtotal neto', '$1.280.000'), ('Descuento (20%)', '-$256.000'), ('Neto con descuento', '$1.024.000'), ('IVA (19%)', '$194.560')]:
    txt(338, y, label, 9, GRAY)
    c.setFillColor(INK)
    c.setFont('Helvetica', 9)
    c.drawRightString(561, y, amount)
    y -= 18
c.setFillColor(GREEN)
c.roundRect(325, y-18, 247, 30, 4, fill=1, stroke=0)
txt(338, y-7, 'TOTAL CLP', 10, white, True)
c.setFont('Helvetica-Bold', 13)
c.drawRightString(561, y-7, '$1.218.560')
y -= 47
txt(40, y, 'CONDICIONES COMERCIALES', 9, GREEN, True)
y -= 12
for text in [
    '<b>Pago:</b> 50% de anticipo al inicio y 50% contra entrega conforme.',
    '<b>Residuos:</b> restos vegetales trozados y acopiados dentro de la misma parcela.',
    '<b>Seguridad:</b> uso de EPP y seguros correspondientes del equipo.',
]:
    y = paragraph(text, 40, y, 532, small)-4
signature_y = y-32
assert signature_y > 63, f'Firmas demasiado bajas: {signature_y}'
c.setStrokeColor(GRAY)
c.setLineWidth(.6)
c.line(55, signature_y, 255, signature_y)
c.line(357, signature_y, 557, signature_y)
txt(93, signature_y-14, 'Nelson Escobar Belmar', 8, INK, True)
txt(115, signature_y-27, 'Prestador del servicio', 8, GRAY)
txt(396, signature_y-14, 'Guillermo Sepúlveda', 8, INK, True)
txt(407, signature_y-27, 'Aceptación del cliente', 8, GRAY)
c.setStrokeColor(LINE)
c.line(40, 37, 572, 37)
txt(40, 23, 'Terra · Servicios & Proyectos Integrales', 8, GRAY)
c.setFont('Helvetica', 8)
c.drawRightString(572, 23, 'Página 1 de 1')
c.save()
reader = PdfReader(str(pdf))
assert len(reader.pages) == 1
text = reader.pages[0].extract_text()
assert '$1.218.560' in text and 'Nelson Escobar Belmar' in text
doc = pdfium.PdfDocument(str(pdf))
doc[0].render(scale=1.5).to_pil().save(ROOT / 'design' / 'pdf-preview.png')
print(f'PDF verificado: 1 página, total $1.218.560, firma y pie separados. {pdf}')
