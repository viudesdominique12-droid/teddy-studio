# Recale les pages au format exact (vectoriel conservé) et pose TrimBox / BleedBox pour l'imprimeur.
import fitz, sys
MM = 72 / 25.4
def exact(src, dst, w_mm, h_mm, bleed_mm=0):
    s = fitz.open(src); d = fitz.open()
    W, H = w_mm * MM, h_mm * MM
    for i in range(len(s)):
        p = d.new_page(width=W, height=H)
        p.show_pdf_page(p.rect, s, i, clip=fitz.Rect(0, 0, W, H))
        if bleed_mm:
            b = bleed_mm * MM
            p.set_bleedbox(p.rect)
            p.set_trimbox(fitz.Rect(b, b, W - b, H - b))
    d.set_metadata({'title': 'Teddy Studio — Ethiopian Film Office · flyer A5', 'author': 'Teddy Studio', 'subject': 'Gateway to Africa', 'creator': 'Teddy Studio'})
    d.save(dst, garbage=3, deflate=True)
    r = fitz.open(dst)
    print(f"{dst.split('/')[-1]}: {len(r)} pages · {r[0].rect.width / MM:.2f} × {r[0].rect.height / MM:.2f} mm" + (f" · coupe {r[0].trimbox.width / MM:.2f} × {r[0].trimbox.height / MM:.2f} mm" if bleed_mm else '') + f" · polices {len({f[3] for p in r for f in p.get_fonts()})}")
exact('out/Teddy-Studio-flyer-A5.pdf', 'out/final-A5.pdf', 148, 210)
exact('out/Teddy-Studio-flyer-A5-imprimeur-fond-perdu-3mm.pdf', 'out/final-A5-imprimeur.pdf', 154, 216, 3)
d = fitz.open('out/final-A5.pdf')
for i, p in enumerate(d): p.get_pixmap(dpi=110).save(f'out/final-p{i+1}.png')
