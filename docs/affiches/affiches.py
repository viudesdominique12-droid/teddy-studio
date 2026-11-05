#!/usr/bin/env python3
"""Les fonds d'ouverture de Live, Music et AI (demande du client, 04/11/2026).

Les sources sont les photos WhatsApp officielles des affiches : redressées et
recadrées ici, sans aucune régénération par IA (les versions refaites par IA
inventaient des crédits, un nom de réalisateur et des décors).

  python3 -I affiches.py <dossier des photos> <dossier de sortie>

Sort, pour chaque affiche : -w1600 (paysage, ordinateur) et -v828 (portrait,
téléphone), en WebP.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from skimage.restoration import inpaint_biharmonic
from skimage.transform import ProjectiveTransform, warp

# Les coins de chaque affiche sur la photo (haut-gauche, haut-droit, bas-droit,
# bas-gauche), en pixels de la photo 1920 x 2560.
K = 1.28
AFFICHES = {
    'abay': ('WhatsApp Image 2026-11-04 at 14.48.11.jpeg',
             [(108, 138), (1338, 158), (1308, 1876), (190, 1916)], 1600 / 0.70),
    'selemenna': ('WhatsApp Image 2026-11-04 at 14.48.12.jpeg',
                  [(158, 320), (1340, 322), (1290, 1684), (195, 1712)], 1600 / 0.745),
    'sost': ('WhatsApp Image 2026-11-04 at 14.48.12 (1).jpeg',
             [(122, 108), (1375, 104), (1345, 1788), (212, 1812)], 1600 / 0.745),
}
# Le cadrage de chaque format, en fractions de l'affiche redressée : y0, y1
# pour le paysage ; x0, x1, y0, y1 pour le portrait.
PAYSAGE = {'abay': (0.205, 0.60), 'selemenna': (0.235, 0.63), 'sost': (0.22, 0.60)}
PORTRAIT = {'abay': (0.13, 0.80, 0.215, 0.91), 'selemenna': (0.14, 0.86, 0.245, 0.90), 'sost': (0.17, 0.89, 0.19, 0.96)}


def redresse(chemin, coins, haut):
    photo = np.asarray(Image.open(chemin).convert('RGB')) / 255.0
    w, h = 1600, int(haut)
    t = ProjectiveTransform.from_estimate(
        np.array([(0, 0), (w, 0), (w, h), (0, h)], float), np.array(coins, float) * K)
    return warp(photo, t, output_shape=(h, w), order=3)


def enleve_traits(a):
    """Sost Maezen : les deux traits de lumière jaune de la vitre."""
    h, w = a.shape[:2]
    y, x = np.mgrid[0:h, 0:w]
    u, v = x / 1600.0, y / 2148.0
    couloir = np.zeros((h, w), bool)
    for (x0, y0, x1, y1) in ((0.735, 0.312, 1.0, 0.205), (0.61, 0.356, 0.68, 0.33)):
        d = ((x1 - x0) * (y0 - v) - (x0 - u) * (y1 - y0)) / np.hypot(x1 - x0, y1 - y0)
        s = ((u - x0) * (x1 - x0) + (v - y0) * (y1 - y0)) / ((x1 - x0) ** 2 + (y1 - y0) ** 2)
        couloir |= (np.abs(d) < 0.0065) & (s > -0.02) & (s < 1.02)
    bloc = np.where(couloir)
    y0, y1, x0, x1 = bloc[0].min(), bloc[0].max() + 1, bloc[1].min(), bloc[1].max() + 1
    a = a.copy()
    a[y0:y1, x0:x1] = inpaint_biharmonic(a[y0:y1, x0:x1], couloir[y0:y1, x0:x1], channel_axis=-1)
    return a


def assombrit_cotes(a):
    """Abay Weys Vegas : les côtés de l'affiche sont noirs, la vitre y reflète
    la pièce. On les ramène au noir, sans toucher à la colonne centrale."""
    w = a.shape[1]
    u = np.arange(w) / w
    m = np.clip((u - 0.14) / 0.09, 0, 1) * np.clip((0.90 - u) / 0.09, 0, 1)
    m = m * m * (3 - 2 * m)
    return a * (0.22 + 0.78 * m)[None, :, None]


def regle(a, noir, blanc, sat=1.0):
    a = np.clip((a - noir) / (blanc - noir), 0, 1)
    g = a.mean(axis=2, keepdims=True)
    return np.clip(g + (a - g) * sat, 0, 1)


def ecrit(a, sortie, largeur, qualite):
    im = Image.fromarray((a * 255 + 0.5).astype('uint8'))
    if im.width != largeur:
        im = im.resize((largeur, round(im.height * largeur / im.width)), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
    im.save(sortie, 'WEBP', quality=qualite, method=6)
    print(sortie.name, im.size, sortie.stat().st_size // 1024, 'Ko')


def main(src, dst):
    src, dst = Path(src), Path(dst)
    for nom, (fichier, coins, haut) in AFFICHES.items():
        a = redresse(src / fichier, coins, haut)
        if nom == 'sost':
            a = enleve_traits(a)
            a = regle(a, 0.05, 0.95, 1.06)
        elif nom == 'abay':
            a = regle(a, 0.09, 0.90, 1.14)
            a = assombrit_cotes(a)
        else:
            a = regle(a, 0.03, 0.97, 0.0)
            # La trame de points pèse lourd en WebP : un léger flou la garde, à 1/3 du poids.
            a = np.asarray(Image.fromarray((a * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.9))) / 255.0
        h, w = a.shape[:2]
        y0, y1 = PAYSAGE[nom]
        ecrit(a[int(y0 * h):int(y1 * h)], dst / f'{nom}-poster-w1600.webp', 1600, 58 if nom == 'selemenna' else 74)
        x0, x1, y0, y1 = PORTRAIT[nom]
        ecrit(a[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)], dst / f'{nom}-poster-v828.webp', 828, 52 if nom == 'selemenna' else 70)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
