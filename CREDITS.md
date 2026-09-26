# CRÉDITS & LICENCES DES MÉDIAS

## 1. Médias appartenant au client (à confirmer par Teddy Studio)

| Fichier | Origine | Note |
|---|---|---|
| `public/media/sebastopol-hero*.mp4/.jpg` | Extrait de `vid/movie.mp4` du site actuel — carton d'ouverture **Sebastopol Entertainment** (canon Sebastopol 3D). | Société du même fondateur, Tewodros Teshome. **À confirmer avant mise en ligne.** |
| `public/works/p-*.webp` | Visuels de films du site actuel (Triangle, Triangle II, Sele Enat Meder, Kezkaza Welafen). | Basse définition (≤ 1280 px). **Demander les originaux.** |
| `public/clients/*.png` | Logos clients du site actuel. | Manquent : Ethiopia Defence Force, Wosti Jnvis. |
| `public/kit/*.webp` | Photos de matériel du site actuel. | **À vérifier** : ont l'aspect de photos de catalogue fabricant, pas de leur parc réel. |

## 2. Photographies de lieux — placeholders sous licence libre

> ⚠️ **Statut : placeholders professionnels.** Le site actuel utilise du stock Unsplash **générique et faux**
> (le visuel « Semen Mountains » est une forêt sans rapport avec l'Éthiopie). Ces images-ci sont au moins
> les **vrais lieux**. Le livrable final doit utiliser les **repérages photo du studio lui-même** — c'est
> leur métier et leur meilleur argument commercial.

Toutes proviennent de Wikimedia Commons. Attribution requise (affichée sur `/locations.html`).

| Lieu | Fichier Commons | Licence |
|---|---|---|
| Simien Mountains | `Ras Dejen Summit.JPG` | CC BY-SA 3.0 |
| Wollo | `Lac Haïk-Ethiopie-Tankwa (1).jpg` | CC BY-SA 3.0 |
| Lalibela | `Bete Giyorgis 01.jpg` | CC BY-SA 3.0 |
| Wonchi | `Lake wenchi crater.jpg` | CC BY-SA 4.0 |
| Fasilides | `Fasilides Palace 05.jpg` | CC BY-SA 3.0 |
| Afar | `Danakil Salt Plain.jpg` | CC BY-SA 4.0 |
| Erta Ale Lava Lake | `Erta-ale lac-de-lave 2001.jpg` | CC BY 2.5 |
| Addis Ababa | `Addis Ababa skyline.jpg` | CC BY-SA 3.0 |
| Winding Road | `Simien Mountains National Park 06.jpg` | CC BY-SA 3.0 |

**Obligation CC BY-SA** : citer l'auteur et la licence, et partager toute œuvre dérivée sous la même licence.
Les pages de fichiers (auteurs exacts) sont sur `commons.wikimedia.org/wiki/File:<nom du fichier>`.
Ces licences sont compatibles avec un usage commercial, mais la clause *ShareAlike* est une contrainte
réelle : **raison de plus pour les remplacer par les photos du studio.**

## 3. Typographies
Voir `src/styles/tokens.css`. Google Fonts / Fontshare uniquement (licence SIL OFL, usage commercial libre).

## 4. Ce qui a été retiré
- Les 8 icônes de services (dégradé violet→bleu, stock) — supprimées, la typographie porte les services.
- La photo « bureau » de la section About (`filmoffice.png`) — image générée, invraisemblable (caméra déformée). Supprimée.
- Le crédit « Designed by Ewenet Communication » — ancien prestataire.

## 5. La caméra de la galerie (refonte, 26/09/2026)
- `public/cam/camera-2400.webp` et `camera-1400.webp` : caméra Sony avec zoom Fujinon 50-135, photo de **Vanilla Bear Films** sur Unsplash (`unsplash.com/photos/black-shoulder-mount-camera-Wnly2mV4YKw`), **licence Unsplash** — usage commercial libre, sans attribution obligatoire ; on la crédite quand même.
- `public/cam/camera-lines-2400.webp` et `camera-lines-1400.webp` : le dessin au trait, tiré de cette photo par détection des contours (OpenCV).
- Typographie Martian Mono (`public/fonts/martian-mono-var.woff2`) : licence SIL OFL.
- `public/cam/blueprint-2400.webp` et `blueprint-1400.webp` : le plan de l'ouverture, tiré de la photo « Camera » du site (`public/kit/photo/camera.webp`, visuel de catalogue Canon EOS C500 Mark II), logos effacés.

## 6. Le matériel en 3D (refonte, 26/09/2026)
- `public/kit3d/camera.glb` : « RED Digital Cinema Weapon Dragon 8K Camera » de **Christopher Holloway**, sur Sketchfab (`sketchfab.com/3d-models/red-digital-cinema-weapon-dragon-8k-camera-e1127f2c8d4d4d65b9608ff3714890bc`). **Licence CC BY 4.0** : l'attribution est obligatoire. Elle s'affiche sous la caméra, dans la scène.
- Modifications (autorisées par la licence, à signaler) : le plateau tournant de la présentation a été retiré. Le maillage a été simplifié (524 000 → 158 000 triangles), les textures ont été converties en WebP, et la géométrie compressée (meshopt). Le fichier passe de 24 Mo à 2,4 Mo.
- Bibliothèque : Three.js 0.180 (licence MIT).
- `public/kit3d/lens.glb` : « Sony FE 20mm f/1.8 G » de **Lassi Kaukonen**, sur Sketchfab (`sketchfab.com/3d-models/sony-fe-20mm-f18-g-b7742faa4dd148bb9fb6877c156c5e15`). C'est un scan photographique. **Licence CC BY 4.0**, crédit affiché dans la scène. Modifications : matériaux convertis (specular-glossiness → metal-roughness), maillage simplifié (900 000 → 108 000 triangles), textures 4K ramenées à 2048/1024 px en WebP, géométrie compressée. Le fichier passe de 56 Mo à 2,2 Mo.
- `public/kit3d/drone.glb` : « DJI Inspire 3 » de **polyman Studio**, sur Sketchfab (`sketchfab.com/3d-models/dji-inspire-3-158e4fa0710f4511be14b73374b5df9b`). **Licence CC BY 4.0**, crédit affiché dans la scène. Modifications : maillage simplifié (514 000 → 154 000 triangles), textures en WebP, géométrie compressée. Le fichier passe de 24 Mo à 1,9 Mo.
- L'éclairage, les micros et le fond vert gardent les photos du site (§1).

## 7. Les thèmes à comparer (refonte, 27/09/2026)
Polices des deux thèmes d'essai, toutes sous **licence SIL Open Font License 1.1**, chargées depuis Google Fonts le temps de la comparaison (le thème retenu aura ses polices hébergées sur le site, comme les autres) :
- thème Nuit : **Big Shoulders Display** (Patric King), **Geist** et **Geist Mono** (Vercel) ;
- thème Papier : **Instrument Serif** (Instrument), **DM Mono** (Colophon Foundry). Le texte reste en Instrument Sans (§3).
Les couleurs du thème Papier s'inspirent de la mise en page de hobro.digital (papier blanc et sections noires). On en reprend l'idée, jamais le code, les images, les textes ni les polices (Hobro utilise des polices commerciales).

