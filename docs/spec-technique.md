# SPÉCIFICATION TECHNIQUE — les dispositifs à reproduire

> Source d'étude : peryton-film.com (Webflow + GSAP 3.15 + Lenis + hls.js).
> Le code du site est servi en clair, non minifié. Il a été **analysé** pour en
> comprendre les techniques, puis **réimplémenté** — jamais copié verbatim.
> Ce document est la spécification de notre implémentation.

## PALETTE (identique à la référence, sur demande du client)

```
--night    #182d19   fond, vert nuit
--cream    #eae0d0   texte
--gold     #ecc779   accent
--gold-lt  #ffd989   accent clair
--border   #ffffff73
--board    #101b13   fond d'écran du téléphone pendant la rotation
```

## SOCLE OBLIGATOIRE (sans ça, rien ne marche)

```js
gsap.registerPlugin(ScrollTrigger, Observer, SplitText);
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);   // OBLIGATOIRE : sinon la scrub se désynchronise
window.lenis = lenis;
```
Règles transversales :
- **Un flag de double-init par module** (global, ou `dataset` sur l'élément).
- **Tout callback de ticker dans un try/catch qui se désinscrit** — une exception dans
  le ticker partagé emporte Lenis et tous les scrubs de la page.
- **`smoothRefresh()`** debouncé à 120 ms, toujours préféré à `ScrollTrigger.refresh()` nu.
- Tout module qui **pin** met `refreshPriority: 1` ; les reveals qui ne pinnent pas
  mettent `refreshPriority: -2` (sinon ils sont mesurés avant les pin-spacers et
  se déclenchent trop tôt de toute la longueur du pin).

---

## 1. LE CIEL ÉTOILÉ — canvas 2D, 4 calques

Wrapper `div` en `position:fixed; inset:0; pointer-events:none`, `opacity:0` **avant**
insertion, contenant 4 canvas : statique, scintillement A, scintillement B, filantes.

```
DPR_CAP 1.5 · DICHTE 0.000135 étoiles/px² · MAX 320
r = 0.45 + pow(rand, 2.4) * 1.15        (beaucoup de minuscules, peu de grosses)
a = 0.74 * (0.35 + 0.65*rand)
28 % dorées rgb(255,214,140) · 72 % rgb(226,236,222)
20 % avec halo radial r*7  (stops a*0.5 / a*0.13 / 0)
30 % réparties sur les calques A et B (scintillement CSS, coût JS nul)
```
Les étoiles sont dessinées **une seule fois**. Le scintillement est en CSS.

**Filantes** : 9 rails précalculés de 141 points (Bézier quadratique + onde sinusoïdale
sur la normale), 2 simultanées au plus.
```
SPEED 0.0020…0.0044 par frame de 16,67 ms · SCHWEIF 0.13
PAUSE 3200…13000 ms, +35 % de chance d'ajouter 0…9000 ms
tête : sprite 40×40 pré-rendu, traîne : 2 passes × 11 seaux d'alpha
fade = min(1, p/0.14) * min(1, (1-p)/0.22)
```
Perf : **effacement par rects sales uniquement**, jamais de clear plein écran ;
`dt` clampé à 50 ms ; retrait réel du ticker sur `visibilitychange` ;
resize reconstruit **seulement si la largeur change** (barre d'adresse mobile).

Fondu d'entrée : `opacity 1400ms cubic-bezier(0.33, 0, 0.25, 1)` sur le wrapper,
déclenché après **deux rAF imbriqués** (+ `setTimeout 400 ms` en filet).

`prefers-reduced-motion` : calque des filantes masqué, **return avant toute boucle**.

---

## 2. LE BLUR-IN (révélations) — le système le plus réutilisable

```
blur 12px · y 16px · duration 0.8 · ease power3.out
stagger 0.12 PLAFONNÉ : Math.min(0.12, 0.5 / (n - 1))
start 'top 85%' · refreshPriority -2
```
Deux attributs : `[data-blur-in]` (SplitText par lignes) et `[data-element-blur]` (blocs).
Deux ScrollTrigger par cible :
- `start:'top 85%'` → `tween.restart()`
- `start:'top bottom'`, `end:'bottom top'` → `onLeaveBack: tween.pause(0)`

**Trois pièges, tous rencontrés dans notre v1 :**
1. `gsap.set(targets, …)` **explicite** après le `fromTo` — `immediateRender` n'écrit
   pas fiablement l'état de départ dans le DOM, et l'élément reste invisible.
2. `clearProps:'filter'` en `onComplete` — `blur(0px)` garde un layer de compositing
   vivant et fait scintiller. **Sauf** si un enfant porte `backdrop-filter` (saut visuel).
3. **Séquence de chargement** : les éléments déjà visibles au chargement
   (`top < innerHeight * 0.85`) ne reçoivent jamais de `onEnter`. Les trier de haut
   en bas et les jouer avec un stagger de 0.12.

---

## 3. LE HERO

Entrée : états posés **avant** de retirer le gate CSS (sinon le texte clignote).
```
depart : { opacity: 0, y: '2.5rem', filter: 'blur(12px)' }
arrivee: { opacity: 1, y: 0, filter: 'blur(0px)',
           duration: 0.9, stagger: 0.12, ease: 'power3.out' }
```
Attend **deux promesses avec caps** : l'emblème posé (cap 4000 ms) et
`document.fonts.ready` (cap 1200 ms). Filet : si l'emblème n'arrive jamais,
il est montré de force à 6000 ms.

Handshake : l'emblème émet `CustomEvent('teddy:emblem-ready')` + flag global,
dans **tous** ses chemins de sortie (y compris reduced-motion et absence de GSAP).

---

## 4. L'EMBLÈME 3D — chez nous : LE CANON SEBASTOPOL en or

Three.js, SVG extrudé (pas un GLB) :
```
ExtrudeGeometry(depth 6, bevelEnabled, bevelThickness 6.5, bevelSize 4,
                bevelSegments 12, curveSegments 24)
→ le biseau plus épais que l'extrusion donne l'arête de médaille frappée
MeshPhysicalMaterial({ color 0xD3A855, metalness 1, roughness 0.34,
  roughnessMap tex(), bumpMap tex(), bumpScale 0.28,
  envMapIntensity 0.9, clearcoat 0.35, clearcoatRoughness 0.3 })
```
`tex()` — texture procédurale 1024², appelée **deux fois** (deux canvas différents,
sinon relief et rugosité s'alignent et l'or devient plat) :
60 dégradés radiaux · 750 courbes quasi-horizontales (brossage) · 1400 micro-traits.

Environnement : `RoomEnvironment` + 4 plans émissifs HDR, `PMREM fromScene(env, 0.04)`.
Lumières : `DirectionalLight(0xfff2cc, 1.6)` @ (4,6,5) · `PointLight(0xd4af37, 24)` @ (-5,-2,-4).
Renderer : `ACESFilmicToneMapping`, `pixelRatio min(dpr, 2)`, alpha.

**Parallaxe souris** : lerp 0.06 sur 4 canaux, lacet ±30°, tangage ±9°, translation 0.3/0.22.

**`RAHMEN_LUFT = 0.15`** — le canvas déborde de 15 % par côté via
`camera.setViewOffset(w, h, -lx, -ly, gw, gh)` + `setSize(gw, gh, false)` + CSS négatif.
Les trois écritures sont **indissociables** : en modifier une casse l'échelle.
(Sans cette marge, les pointes du dessin sont coupées jusqu'à 12,7 %.)

Intro : `autoAlpha .5s power2.out @0` · `spin 1,5 tour, 2.4s expo.out @0` ·
`x/y/scale 1.7s expo.inOut @0.45` · signal de l'emblème à `1.55`.

---

## 5. LA GRILLE INFINIE (galerie qu'on tire)

**Ni Draggable ni InertiaPlugin** : `Observer` + `gsap.quickTo`.
```js
const wrapX = gsap.utils.wrap(-tileWidth, 0);
xTo = gsap.quickTo(collection, 'x', {
  duration: 1.2, ease: 'expo.out',
  modifiers: { x: gsap.utils.unitize(wrapX) }   // unitize OBLIGATOIRE
});
```
Deux tuiles identiques (`xPercent: 0` et `100`), wrap par modulo sur `x`.
`currentX` n'est **jamais** wrappé côté JS — seule la valeur écrite dans le DOM l'est
(sinon saut d'interpolation à chaque frontière).

```
columns = max(2, ceil(wrapperW / cellW) + 1)   ← le +1 garantit tileWidth >= wrapperW
rows    = max(1, round(wrapperH / cellH))
damier  : (row + col) % 2 → paysage / portrait, tirage en sacs mélangés sans répétition
Observer: type 'wheel,touch,pointer', preventDefault false, dragMinimum 3
delta   : clamp(-80, 80, deltaX * (molette ? 0.75 : 1.25)) — signe INVERSÉ à la molette
touchAction 'pan-y' · userSelect none · overscrollBehaviorX none
```
Vidéos : poster systématique, `preload` posé seulement à la préparation, **LRU de 14
sources attachées**, une seule en lecture, `IntersectionObserver` pause-seulement.
Survol : délai 100 ms ; et surtout **`elementFromPoint` rejoué quand la grille s'arrête**
(250 ms, puis poll 150 ms) — sinon la carte survolée « colle » quand la grille glisse
sous un curseur immobile.

Curseur « DRAG » : pilule, lerp 0.22 **dans le ticker GSAP**, `translate3d + translate(-50%,-50%)`,
état de glissé via `MutationObserver` sur l'attribut de statut du wrapper.

---

## 6. LA SECTION TÉLÉPHONE

```
pin: section · pinSpacing true · scrub 0.1 · end '+=470%' · refreshPriority 1
invalidateOnRefresh true
tl.set({}, {}, 1)   ← FIGE LA DURÉE À 1 AVANT TOUT TWEEN (sinon les positions bougent)
```
Toutes les valeurs de géométrie sont des **fonctions** (`scale: () => baseScale * 1.1`),
re-résolues au refresh grâce à `invalidateOnRefresh`.

Phases (desktop) : titre derrière le téléphone `[0, 0.09]` (blur 12px, opacity 0.5) ·
blocs de texte `[0.10, 0.72]` · rotation 90° `[calculé, 0.86]` · plein écran `[0.87, 0.995]`.
Mobile (≤ 767) : **ordre inversé** — rotation `[0.28, 0.40]`, sortie du téléphone
`[0.41, 0.49]`, textes `[0.52, 0.97]`, **jamais de plein écran**.

Géométrie de la rotation :
```js
th = p * 90 ; rad = th * π/180
boost = 1 + 0.5 * sin(rad)                    // évite les coins vides à 45°
w = (H0 * 16/9) * (1 - p) + H0 * p
scale = (von + (end - von) * p) * (1 - 0.09 * sin(π * p))   // respiration
video : rotation: -th                          // la vidéo reste DROITE
```

---

## 7. LE HOVER MAGNÉTIQUE

Désactivé sous 992 px.
```
offset = ((clientX - left)/offsetWidth - 0.5) * (strength / 16)   → en em
gsap.to(el, { x, y, rotate: '0.001deg', ease: 'power4.out', duration: 1.6 })
inner : duration 2 · retour : ease 'elastic.out(1, 0.3)', duration 1.6
```
Le `rotate: '0.001deg'` force la promotion GPU.

---

## 8. LE MARQUEE

```
speedMultiplier : <479px → 0.25 · <991px → 0.5 · sinon 1
marqueeSpeed = speed * (contentWidth / windowWidth) * multiplier
rangée élargie : marginLeft -scrollSpeed% ; width scrollSpeed*2 + 100%
gsap.to(items, { xPercent: -100, repeat: -1, duration, ease: 'linear' }).totalProgress(0.5)
```

---

## CE QU'ON NE FAIT PAS (décision du client)
- La planète/lune 3D qui tourne au scroll (module SpaceScroll, Three.js, 40 Ko).
- La bande de personnages qui défile en fin de page.

---

## CE QUI A ÉTÉ CONSTRUIT, ET LÀ OÙ ON S'ÉCARTE DE LA RÉFÉRENCE

Trois écarts, tous imposés par notre matière — pas par confort.

**1. Le téléphone porte deux pistes vidéo, pas une.**
La référence sort un seul fichier 16/9 et le recadre. Nos rushes sont soit
verticaux (288×512), soit ultra-larges (1280×500) : un seul fichier étiré de
l'un à l'autre serait de la bouillie. `src/js/phone.js` croise donc une piste
verticale (appareil debout) et une piste large (appareil couché) pendant le
pivot, fenêtre `[0.08, 0.38]` — tôt, parce que la boîte s'élargit vite et
qu'aucune des deux pistes ne doit dépasser ~1,2× sa taille native pendant
qu'elle est visible. La piste large ne se charge qu'au pivot, et jamais sur
téléphone (où elle n'apparaît pas) : 400 Ko économisés.

**2. La boîte vidéo suit la boîte englobante, pas la formule 16/9.**
La référence calcule `w = (H0 * 16/9)(1-p) + H0 * p` avec un `boost` de
`1 + 0.5·sin(θ)`. Cette formule suppose une source 16/9. Nous posons
directement la boîte englobante du rectangle tourné :
`boxW = W0·cos θ + H0·sin θ`, `boxH = W0·sin θ + H0·cos θ`, × 1,04 d'anti-couture.
À θ = 0 la boîte VAUT l'écran — un rush vertical y tombe juste, sans recadrage
parasite. C'est le même geste, correctement paramétré pour notre matière.

**3. Tout est dans un `gsap.matchMedia()`.**
Les chorégraphies mobile et bureau n'ont pas le même ORDRE (mobile : pivot,
sortie de l'appareil, puis les textes ; bureau : les textes, le pivot, le plein
écran). Décider une fois au chargement laissait la mauvaise en place après un
redimensionnement — et, sur un premier frame sans hauteur de viewport, un
`scale(0)`. Le contexte reconstruit et révoque proprement.

### Le reste, conforme
- blur-in : 12 px · y 16 · 0,8 s · `power3.out` · stagger `min(0,12 ; 0,5/(n−1))`
  · `top 85%` · `refreshPriority -2` · `gsap.set` explicite · rattrapage au
  chargement — `src/js/reveal.js`, appliqué par attribut sur les 4 pages.
- hover magnétique : `((clientX−left)/w − 0,5) × force/16` en em, `power4.out`
  1,6 s, intérieur 2 s, retour `elastic.out(1, 0.3)`, coupé sous 992 px.
- téléphone : pin `+=470%`, scrub 0,1, `tl.set({}, {}, 1)`, géométrie en
  fonctions, `invalidateOnRefresh`.

### Ce qui a été corrigé en route
- Le système de révélation v2 (`.will-in` / `.is-in` en CSS) a été supprimé :
  ses règles `opacity: 0` n'avaient plus de propriétaire et auraient laissé le
  mur de clients invisible. Un seul langage désormais, entièrement en JS.
- `.drop__stage` n'était pas clippé : la piste de 8 × 100vw donnait 11 520 px
  de défilement horizontal à la page.
- Le canevas de l'emblème déborde volontairement de 15 % (`FRAME_AIR`) : d'où
  62 px de défilement fantôme, réglés par `overflow-x: clip` sur `.hero`.
- `book.js` appelait `initSheet()` sans l'importer : la page de réservation
  plantait avant ses révélations.
- Rushes : `r04` et `w01`/`w03` tombaient au noir en fin de plan, `r11`
  commençait noir. Recoupés.

---

## LE MONDE UNIQUE (et ce qu'on a perdu au passage)

Le brief initial demandait **deux versions, claire et sombre, bien
différentes**. Le brief de référence a tranché autrement : « les mêmes
couleurs, le même fond » — et la référence n'a qu'un monde.

Le système de thème de la v2 (`theme.js`, bascule dans l'index, `data-theme`
sur `<html>`, bascule narrative pendant la descente) survivait pourtant dans le
code, sans palette pour le porter. Il ne changeait plus rien de visible **sauf
six règles orphelines**, qui rendaient l'apparence du site dépendante du
réglage clair/sombre de la machine du visiteur :

- `.bar__cta` : blanc sur or (**1,8:1**) quand le système était en clair, encre
  nuit (9,1:1) quand il était en sombre. L'appel à l'action principal.
- `.cli__i img` : les logos clients, déjà aplatis en encre crème, étaient
  ré-inversés en sombre — donc presque invisibles.

Tout cela est supprimé. Un seul monde, sans condition. Restent corrigés au
passage `.dock__n` et `.case__add.is-in`, eux aussi en blanc sur or.

**Si le client veut vraiment un second monde**, ce n'est pas une bascule de
variables à remettre : c'est une deuxième direction artistique à concevoir
(l'or ne tient pas sur du blanc, le ciel étoilé non plus). À décider comme un
travail à part.
