# Les instances fixes des polices variables du site, aux réglages exacts du flyer.
# Chrome les incorpore alors en polices TrueType nommées (et non en « Type 3 »).
# python3 fonts.py   (écrit ./fonts/*.ttf ; il faut fontTools et brotli)
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
SRC = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'fonts') + '/'
os.makedirs('fonts', exist_ok=True)
jobs = [
    ('archivo-var', 'Archivo-Titre',    'archivo-84-740',   {'wdth': 84, 'wght': 740}),
    ('archivo-var', 'Archivo-Service',  'archivo-84-600',   {'wdth': 84, 'wght': 600}),
    ('archivo-var', 'Archivo-Bande',    'archivo-84-700',   {'wdth': 84, 'wght': 700}),
    ('archivo-var', 'Archivo-Geant',    'archivo-62-800',   {'wdth': 62, 'wght': 800}),
    ('instrument-sans-var', 'InstrumentSans-400', 'instrument-400', {'wdth': 100, 'wght': 400}),
    ('instrument-sans-var', 'InstrumentSans-500', 'instrument-500', {'wdth': 100, 'wght': 500}),
    ('instrument-sans-var', 'InstrumentSans-600', 'instrument-600', {'wdth': 100, 'wght': 600}),
    ('fraunces-var', 'Fraunces-Affiche', 'fraunces-144-380', {'opsz': 144, 'wght': 380, 'SOFT': 0, 'WONK': 0}),
    ('martian-mono-var', 'MartianMono-400', 'martian-400', {'wdth': 87.5, 'wght': 400}),
    ('martian-mono-var', 'MartianMono-500', 'martian-500', {'wdth': 87.5, 'wght': 500}),
    ('martian-mono-var', 'MartianMono-700', 'martian-700', {'wdth': 87.5, 'wght': 700}),
]
for src, ps, out, axes in jobs:
    f = instantiateVariableFont(TTFont(SRC + src + '.woff2'), axes)
    f.flavor = None
    for rec in list(f['name'].names):
        if rec.nameID in (1, 4, 16, 17): f['name'].setName(ps.replace('-', ' '), rec.nameID, rec.platformID, rec.platEncID, rec.langID)
        if rec.nameID == 6: f['name'].setName(ps, 6, rec.platformID, rec.platEncID, rec.langID)
    f.save(f'fonts/{out}.ttf')
    print(f'fonts/{out}.ttf')
