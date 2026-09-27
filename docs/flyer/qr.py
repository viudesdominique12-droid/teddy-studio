# Le QR code du flyer, en SVG vectoriel (modules carrés, encre basalte), sans marge :
# la zone de silence (4 modules) est donnée par la tuile crème autour.
import qrcode, json
URL = 'https://viudesdominique12-droid.github.io/teddy-studio/'
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=0, box_size=1)
qr.add_data(URL); qr.make(fit=True)
m = qr.get_matrix(); n = len(m)
# un seul chemin : une ligne de modules contigus = un rectangle
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
svg = f'<svg class="qr" viewBox="0 0 {n} {n}" shape-rendering="crispEdges" aria-label="QR code : {URL}"><path d="{"".join(d)}"/></svg>'
open('qr.svg', 'w').write(svg)
print(f'QR version {qr.version}, {n}×{n} modules, correction Q, pour {URL}')
