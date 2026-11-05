# Les deux QR codes du flyer double, en SVG vectoriel, sans marge : la zone de
# silence (4 modules) vient de la tuile claire autour.
import qrcode
SITES = {'teddy': 'https://tedystudios.com/', 'honest': 'https://www.honesttglobal.com/'}
for nom, url in SITES.items():
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=0, box_size=1)
    qr.add_data(url); qr.make(fit=True)
    m = qr.get_matrix(); n = len(m)
    d = []
    for y, row in enumerate(m):
        x = 0
        while x < n:
            if row[x]:
                x0 = x
                while x < n and row[x]: x += 1
                d.append(f'M{x0} {y}h{x - x0}v1h{x0 - x}z')
            else:
                x += 1
    open(f'qr-{nom}.svg', 'w').write(f'<svg class="qr" viewBox="0 0 {n} {n}" shape-rendering="crispEdges"><path fill="#101b13" d="{"".join(d)}"/></svg>')
    print(nom, url, n, 'modules')
