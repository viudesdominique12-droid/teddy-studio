# La synthèse — ce que 52 sites primés font, et ce qu'on en prend

Six lots, 50 sites exploités sur 52, 3 831 lignes de relevé. Ce document ne
répète pas les lots : il garde ce qui **revient chez plusieurs studios qui ne
se connaissent pas**. Une technique trouvée une fois est une idée ; trouvée
quatre fois dans quatre piles différentes, c'est une règle du métier.

---

## A. LES CONVERGENCES — le socle

### A1. Un vocabulaire de courbes nommées, en variables CSS · **5 lots sur 6**
Velour (`response/settle/expressive/travel`), TBWA (`--ease-1` → `--ease-5`),
Depo Luxe (rampe complète), Milledollars (`--transition-easing`), le thème
`beaucoup` de Forms et Partizan (`beaucoup.alpha`, 95 usages).

Personne n'écrit une courbe à la main dans un tween. Tout le monde en a
**quatre ou cinq, nommées, posées une fois**. C'est ce qui fait qu'un site
entier semble tenu par la même main.

> Chez nous : des courbes improvisées section par section. À corriger en
> premier — c'est gratuit et ça unifie tout le reste d'un coup.

### A2. L'opacité finit bien avant le mouvement · **2 lots, 2 routes**
Sadu : deux tweens simultanés, l'opacité sur **la moitié** de la durée de la
géométrie. TBWA en CSS : `transform .45s / opacity .1s` — un rapport de 4,5.

Un élément doit être **lisible avant d'être arrivé**. S'ils finissent ensemble,
l'œil lit un objet qui glisse ; décalés, il lit un objet qui se pose.

> Chez nous : `autoAlpha` et `y` sur la même durée de 0,8 s. C'est exactement
> le défaut que ces deux studios corrigent.

### A3. Le flou se mesure en `em`, jamais en pixels · Artem Shcherbakov
`blur(0.3em)` et non `blur(34px)` : le même réglage lit pareil sur une légende
de 14 px et sur un titre de 128 px. Idem `yPercent: 104` plutôt que 100 — pour
les jambages.

> Chez nous : `blur(12px)` partout. Sur le titre d'accueil c'est un voile ; sur
> une légende, c'est illisible.

### A4. Le stagger est plafonné · LUT, Hildén & Kaira, TBWA
`Math.min(0.4, 0.06 × index)` : 60 ms par élément, **jamais plus de 400 ms au
total**. Une liste de vingt items ne dure pas vingt fois plus longtemps.

> Chez nous : déjà fait (`min(0.12, 0.5/(n-1))`). Rien à corriger.

### A5. `prefers-reduced-motion` est un interrupteur, pas des `if` · **3 lots**
Vigilante : `gsap.defaults({duration: 0, ease: "none"})` — une ligne, tout le
site devient instantané. Milledollars : tout le moteur enfermé dans
`@media (prefers-reduced-motion: no-preference)`, donc zéro code en double.
DISKO et Remedy : Lenis **n'est pas instancié du tout**.

> Chez nous : des gardes dispersées dans chaque module. Ça marche, mais c'est
> six endroits où l'oubli est possible.

### A6. Le seuil attend une preuve, avec un plafond dur · **3 lots**
SOMA attend l'événement `playing` de la première vidéo, pas `load`. RISK :
`sessionStorage` une fois par session, `MutationObserver` sur la preuve
visuelle, **plafond dur 6000 ms**. GM Studios : double filet, `reduced-motion`
saute tout, et un `animation: 0s 4s forwards` en CSS si le JS ne vient jamais.

> Chez nous : plafond 900 ms + `sessionStorage`. Bon. Manque le filet CSS.

---

## B. LES PIÈCES À PRENDRE — classées par rapport valeur/coût

### B1. La barre de timeline NLE avec timecode SMPTE · Ghost Pitcher
Une barre fixe en bas. Chaque section est un segment dont `flex-grow` vaut sa
**hauteur réelle de scroll en pixels**. Une tête de lecture. Un timecode 24 i/s.
```
segs[i].style.flexGrow = Math.max(sectionHeightPx, 1)   /* flexBasis: 0 */
frames = round(progress * 24 * 90)
f = frames % 24 ; s = floor(frames/24) % 60 ; m = floor(frames/1440)
section courante = la dernière dont top <= innerHeight * 0.5
```
**Pourquoi c'est la pièce n° 1 pour ce client précis :** un line producer lit
« SC 04/09 — ÉQUIPES · TC 00:01:12:07 » en un dixième de seconde. Ça résout
d'un coup le repère de progression manquant sur 26 000 px **et** ça parle le
langage du métier. Aucune dépendance.

### B2. Le survol sans glissement, et les frères qui s'éteignent · Depo Luxe
```css
/* repos  */ transform 0s var(--ease-in-quad),  opacity .2s
/* survol */ transform 0s,                      opacity .2s .05s
/* sortie */ transform .4s var(--ease-out-quad), opacity .1s
```
`transform` en **durée zéro** : l'élément se téléporte pendant qu'il est
invisible. Et sur le conteneur, `--opacity: 1 → .2` éteint tous les frères
d'une seule variable, l'élément visé repassant à `1`.

**Zéro JS, zéro poids.** C'est la réponse directe à la table des services et à
la filmographie, qui sont aujourd'hui des listes mortes.

### B3. Le hover à inertie — la vitesse du geste devient le mouvement · LxL + Hildén & Kaira
Deux studios, deux pays, **le même réglage au chiffre près** :
```
velocity  = delta × 30,  clamp ±1080        rotation = produit vectoriel normalisé × 20, clamp ±60
resistance: 200                              gate : (hover:hover) and (pointer:fine)
```
L'élément ne répond plus à **où** est le curseur mais à **comment** il est
arrivé. Arriver vite par la gauche et lentement par le bas ne produisent pas le
même geste — c'est ça qui donne l'impression de matière.

> Remplace notre hover magnétique, qui donne toujours la même réponse.

### B4. L'obturateur · SOMA
Un `clip-path: inset()` sur un `<video>`, piloté par cinq segments de phase :
plein `0→.12`, fermeture `.12→.32`, maintien `.32→.52`, ouverture sur le film
suivant `.52→.92`, plein `.92→1`. **Le film change à `.52`, pendant que le
cadre est petit.** Le vertical se ferme deux fois plus vite que l'horizontal.
Carré de côté `vh × 0.34` centré à `y = vh × 0.42`.

Coût nul, et c'est la seule pièce du corpus qui **dit « société de production »
sans l'écrire**.

### B5. Le texte éclairé, sans WebGL · Ian Coad
Trois couches **couplées** : un balayage de gradient (cœur à `0.92` à 50 %,
`background-size: 220% 100%`, `160% → -60%` en `3.8s linear`), un bloom en
filtre SVG (`feColorMatrix` alpha `×12 −5.5` puis `feGaussianBlur` 2.5 et 8),
et un halo de proximité (`max(0, 1 − distance/60)`).
Le couplage est le coup de maître : **le balayage s'efface quand le curseur
prend la main** — `opacité = 0.18 + (1 − halo) × 0.72`.

Sur le titre d'accueil en or, c'est de la lumière de plateau.

### B6. Le grain et le halo — la matière · Velour
```css
grain : inset:-40%; 180%; background-size:9rem; mix-blend-mode:soft-light;
        opacity:.055; animation:.9s steps(2,end) infinite   /* il SAUTE, il ne glisse pas */
        + une 2ᵉ tuile décalée de 197px 113px pour casser la répétition
halo  : drop-shadow(0 0 1.5px #ffdb9b99) drop-shadow(0 -1px 5px #ff642094)
        drop-shadow(0 2px 9px #5596be47)
```
Le `steps(2,end)` est tout le secret : un grain qui glisse est un dégradé
animé ; un grain qui saute est de la pellicule.

### B7. Les transitions quantifiées · Josh Goldsmith
`transition: opacity .4s steps(5, end)`. **Un mot à changer par règle**, et
tout le registre passe de « site web » à « régie vidéo ».

### B8. Le thème piloté par la section traversée · Hildén & Kaira + Vigilante
Le header prend la classe `theme-*` de la section sous le point à **3 rem** du
haut (échantillonné en `rAF`, `{passive:true}`). Chez Vigilante, c'est l'item
**survolé** qui repeint `document.body`, avec une priorité propre entre le
survol et l'item collé par le scroll.

### B9. Les deux points de navigation, dont un seul rebondit · OGON
Point solide `8×8`, `transform .4s cubic-bezier(.4,0,.2,1)`. Point fantôme
identique mais `.42s cubic-bezier(.34,1.56,.64,1)` à `opacity .6`.
**La différence entre les deux courbes est tout l'effet** — c'est ce qui donne
l'impression que quelqu'un s'est assis là.

### B10. Le contrat audio, si on en veut un jour · LUT Studios
Rampe manuelle de **450 ms** en `setInterval(16ms)`, jamais de coupure sèche ;
démarrage à volume 0 puis montée ; pool par `cloneNode()` pour les SFX
superposés ; mute = fondu à 0 **puis** `pause()`. Ambiance `0.6`, SFX `0.5`.
Et la contrainte mobile de Tour Kyrgyzstan : `play()` doit être **la toute
première instruction** du handler de geste, avant tout autre réglage.

---

## C. CE QU'ON NE PREND PAS, ET POURQUOI

- **Les fluides GPU** (ALTITUDE 101) et **WebGPU** (Scheme Engine) : gros
  dispositif, gros budget, et le site a déjà son objet 3D.
- **Matter.js** (PALOMINO) : la physique 2D est magnifique et hors sujet pour
  un dossier de production.
- **La séquence canvas de 287 WebP** (CA Film) : des mégaoctets pour un plan.
- **Les View Transitions natives** : mesurées, écartées. `onpageswap` est
  exposé par des navigateurs où la transition inter-documents ne part jamais —
  on se retrouve sans transition, silencieusement. Un seul système partout.

---

## D. L'ORDRE D'EXÉCUTION

| Rang | Quoi | Coût | Pourquoi maintenant |
|---|---|---|---|
| 0 | Le vocabulaire de courbes (A1) | 20 lignes CSS | Tout le reste s'y accroche |
| 0 | Flou en `em` (A3) + opacité 2× plus rapide (A2) | 4 lignes | Corrige le blur-in déjà partout |
| 0 | L'interrupteur `reduced-motion` global (A5) | 3 lignes | Supprime six gardes dispersées |
| 1 | **La barre timeline + timecode (B1)** | ~80 lignes | Comble le repère manquant ET parle au client |
| 1 | Survol sans glissement + frères éteints (B2) | CSS seul | Réveille les trois sections plates |
| 1 | Grain et halo (B6) | CSS seul | La matière de pellicule qui manque |
| 2 | Hover à inertie (B3) | ~60 lignes | Remplace le magnétique, un cran au-dessus |
| 2 | Obturateur sur la galerie (B4) | ~50 lignes | Le geste de caméra |
| 2 | Texte éclairé sur le titre (B5) | ~40 lignes | Le premier regard |
| 3 | Thème par section (B8), points de nav (B9) | ~40 lignes | Détails de juré |
| 3 | Son (B10) | ~120 lignes | À trancher avec le client d'abord |

**Déjà fait :** la transition de page en chevron (RISK, B — lot 5), posée
pendant que la recherche tournait.
