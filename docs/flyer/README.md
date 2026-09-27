# Le flyer A5 (recto-verso)

Même direction artistique que le site : le plan technique de l'ouverture, « Gateway to Africa », la bande terre cuite des clients, le QR code qui mène au site. Tous les textes sont ceux du site, mot pour mot.

## Régénérer (après un changement d'adresse, de texte, de coordonnées)

Depuis ce dossier, dans l'ordre :

```bash
python3 fonts.py             # les polices en instances fixes (fontTools, brotli)
python3 qr.py                # le QR code (qrcode) — l'adresse est en tête du script
node render.mjs out          # les PDF (Chrome, via playwright-core — chemin en tête du script)
python3 exact.py             # format exact, cadres de coupe pour l'imprimeur (PyMuPDF)
swift qrcheck.swift out/qr-recto.png   # vérifier que le QR se lit (Vision d'Apple)
```

`exact.py` produit `out/final-A5.pdf` (148 × 210 mm, pour l'impression de bureau et le partage) et `out/final-A5-imprimeur.pdf` (154 × 216 mm, 3 mm de fond perdu, TrimBox et BleedBox posées).

- L'adresse du QR code : `qr.py` (`URL`) et les deux lignes « Web » dans `render.mjs`.
- Les textes, couleurs et mises en page : `flyer.tpl.html` (tout en millimètres, depuis la coupe).
