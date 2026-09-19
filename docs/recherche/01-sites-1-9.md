# Lot 1 — sites 1 à 9

Méthode : `curl` sur le HTML, extraction des `<script src>` / `<link rel=stylesheet>`,
téléchargement des bundles et des CSS applicatifs, grep ciblé. Aucun navigateur.
Tous les extraits sont **verbatim** des bundles/CSS livrés en production (septembre 2026).

Légende transférabilité : cible = **Teddy Studio / Ethiopian Film Office**, Vite MPA,
GSAP 3.13 + Lenis, vanilla JS, pas de framework. Déjà en place : emblème 3D or (Three.js),
galerie infinie draggable, section téléphone épinglée, descente horizontale, blur-in,
hover magnétique, curseur à états.

---

## 1. Velour Productions — https://velourproductions.com/

**Pile réelle observée :** Next.js (turbopack, chunks `_next/static/immutable/`), React, GSAP
(ScrollTrigger, Observer, Draggable, Flip, CustomEase) + `useGSAP`, Sanity. CSS applicatif
unique de 105 Ko, fortement tokenisé. Aucun WebGL.
**Ce qui est remarquable :** tout le langage de mouvement est réduit à **quatre courbes nommées
et cinq constantes d'interaction**, et le logo du preloader ne « disparaît » pas — il **vole
physiquement dans le header** par une FLIP calculée en variables CSS.

### Le vocabulaire de courbes en 4 noms (le meilleur du lot)

- Mécanisme : au lieu de disperser des `power3.out` un peu partout, le site déclare quatre
  intentions et une seule courbe par intention. `response` = réaction immédiate au pointeur.
  `settle` = arrivée d'un élément qui se pose. `expressive` = une chose qui s'engage et se
  résout (in-out marqué). `travel` = un objet qui traverse l'écran. Chaque `transition:` du
  site pioche dans ces quatre-là, jamais ailleurs.
- Valeurs :
  - `--ease-response: cubic-bezier(.23, 1, .32, 1)` — quasi expo.out, démarrage instantané
  - `--ease-settle: cubic-bezier(.22, 1, .36, 1)` — quint.out, freinage long
  - `--ease-expressive: cubic-bezier(.76, 0, .24, 1)` — in-out serré, symétrique
  - `--ease-travel: cubic-bezier(.77, 0, .175, 1)` — in-out plus lent au départ
  - `--interaction-response: .18s` · `--interaction-press-in: .1s` ·
    `--interaction-press-out: .16s` · `--interaction-press-scale: .985` ·
    `--interaction-label-travel: 6px`
- Noter l'asymétrie du press : **.1s à l'enfoncement, .16s au relâchement**. On appuie plus
  vite qu'on ne relâche — c'est physiquement juste et c'est ce qui fait « bouton réel ».
  Et `.985` : un scale de 1,5 % seulement.
- Extrait :

```css
--ease-expressive:cubic-bezier(.76, 0, .24, 1); --ease-response:cubic-bezier(.23, 1, .32, 1);
--ease-settle:cubic-bezier(.22, 1, .36, 1); --ease-travel:cubic-bezier(.77, 0, .175, 1);
--interaction-press-in:.1s; --interaction-press-out:.16s; --interaction-press-scale:.985;
--interaction-label-travel:6px; --interaction-response:.18s;
```

- Transférable ? **Oui, immédiatement et sans coût.** C'est le premier fichier à écrire sur
  Teddy Studio. Ça remplace toutes les valeurs ad hoc actuelles et ça rend le site cohérent
  d'un bloc à l'autre sans ajouter une seule ligne de JS.

### FLIP du wordmark : le logo du preloader atterrit dans le header

- Mécanisme : le wordmark plein écran (SVG en `mask` sur un bloc coloré) n'est pas fondu.
  Au moment de la sortie du loader, le JS mesure deux `getBoundingClientRect()` — celui du
  wordmark plein écran et celui du logo du header — puis calcule scale + translation + un
  `clip-path` qui ne garde que la première lettre. Il écrit le tout dans quatre variables
  CSS ; **c'est la transition CSS qui anime**, pas GSAP. À l'arrivée le vrai logo du header
  apparaît en `opacity` (handoff) et le wordmark se coupe.
- Valeurs : `transform .58s var(--ease-expressive)`, `clip-path .58s var(--ease-expressive)`,
  `opacity .12s var(--ease-settle) .58s` (le fondu n'arrive **qu'après** le déplacement).
  Le handoff du vrai logo : `animation: hero-header-mark-v-handoff .7s var(--ease-settle) both`
  dont la keyframe reste à `opacity:0` jusqu'à **82.857 %** de 0,7 s ≈ 580 ms — exactement la
  fin du `.58s`. Et un anneau qui « éclot » : `hero-header-mark-ring-bloom .82s`, opacité 0 +
  `blur(7px)` jusqu'à **75.61 %**, puis net.
- Formule (le rectangle de la lettre dans le wordmark, en fractions) :

```js
r={left:0,top:.22195265390818417*e.height,width:.18482707137473184*e.width,height:.7727518567598386*e.height},
a={left:t.left+.2731490954610561*t.width,top:t.top+.2828*t.height,width:.4537419305657531*t.width,height:.47081730769230773*t.height},
i=Math.min(a.width/r.width,a.height/r.height);
return{scale:i,translateX:l-e.left-n*i,translateY:s-e.top-o*i,clipRightPercent:(1-E)*100}
```

- (`E` = 0.18482…, d'où `clipRightPercent` = 81.52 %.) Recalculé par un `ResizeObserver` sur
  les deux éléments + `document.fonts.ready`.
- Transférable ? **Oui.** Teddy Studio a un emblème or : l'emblème du preloader qui rétrécit
  et va se ranger dans le header est exactement le geste « le projecteur se cale ». Le fait
  que l'animation soit une transition CSS pilotée par variables la rend interruptible et
  gratuite en JS.

### Preloader : le pourcentage se lit en caractères, pas en chiffres

- Mécanisme : le mot `Loading Frames` est révélé lettre par lettre, mais sans découpage DOM.
  Le JS ne fait que `Math.floor(progress * "Loading Frames".length)` et pose le nombre dans
  une variable CSS ; le CSS coupe le mot avec `width: calc(var(--hero-visible-characters) * 1ch)`
  + `overflow:hidden`. Le logo a **4 paliers discrets** (`data-logo-step`), pas une rampe.
- Valeurs : `c = Math.floor(s * 14)`, `u = s>=1 ? 4 : Math.floor(4*s)`, `d = Math.round(100*s)`.
  Sortie : `animation: .62s cubic-bezier(.65,0,.25,1) .18s both hero-loader-fullscreen-wipe`
  où la keyframe est `clip-path: inset(0)` → `inset(0 0 0 100%)` — un rideau qui balaie vers
  la droite. La visibilité ne tombe qu'à `transition: visibility 0s linear .8s`.
- Extrait :

```css
.hero-preloader__text-clip{width:calc(var(--hero-visible-characters,0) * 1ch);
  font-family:var(--font-mono);overflow:hidden;white-space:nowrap;position:absolute;left:33.524%}
@keyframes hero-loader-fullscreen-wipe{0%{clip-path:inset(0)}to{clip-path:inset(0 0 0 100%)}}
```

- Transférable ? **Oui.** Le `1ch` fait le travail de dix lignes de SplitText. Sur Teddy on
  peut afficher `PREPARING PERMITS` ou `LOADING LOCATIONS` révélé au caractère.

### Halo anamorphique en trois `drop-shadow` (détail rare)

- Mécanisme : pas de glow WebGL, pas de bloom. Trois `drop-shadow` empilés de couleurs et
  d'offsets différents autour du logo du loader : un chaud serré, un orange décalé vers le
  haut, un bleu décalé vers le bas. L'œil lit une aberration chromatique d'objectif.
- Valeurs : `filter: drop-shadow(0 0 1.5px #ffdb9b99) drop-shadow(0 -1px 5px #ff642094) drop-shadow(0 2px 9px #5596be47)`
- Transférable ? **Oui, et c'est un cadeau.** L'emblème or de Teddy gagnerait énormément à
  porter ce triple halo (chaud/or/bleu nuit) sans toucher au shader.

### Grain : `steps(2, end)`, pas une animation continue

- Mécanisme : un calque fixe surdimensionné (180 %, `inset:-40%`) avec une texture SVG en
  `background-repeat`, animé en **deux positions seulement** par cycle. Le `steps(2,end)`
  supprime l'interpolation : le grain saute au lieu de glisser, ce qui est le comportement
  d'une pellicule. `mix-blend-mode: soft-light` à 5,5 % pour ne pas salir les noirs.
- Valeurs : `animation: .9s steps(2,end) infinite grain-shift` ·
  `opacity: .055` · `background-size: 9rem 9rem` · translations ±2 % / ±1 %.
  Variante du loader : `animation: .8s step-end infinite hero-loader-grain` avec quatre
  positions `0 0 / 37px -23px / -19px 41px / 53px 17px` (valeurs volontairement non alignées
  sur la tuile pour casser le motif).
- Extrait :

```css
.grain{position:fixed;inset:-40%;width:180%;height:180%;background-image:url(/textures/grain.svg);
  background-size:9rem 9rem;mix-blend-mode:soft-light;opacity:.055;z-index:9999;
  pointer-events:none;will-change:transform;animation:.9s steps(2,end) infinite grain-shift}
@keyframes grain-shift{0%{transform:translate(-2%,1%)}25%{transform:translate(1%,-2%)}
  50%{transform:translate(2%,2%)}75%{transform:translate(-1%,-1%)}to{transform:translate(-2%,1%)}}
```

- Transférable ? **Oui.** Sur le vert nuit #182d19 et l'encre crème #eae0d0, un `soft-light`
  à 5 % avec `steps(2)` donne la matière argentique sans salir. Coût : zéro JS, un seul calque.

### Parallaxe héro : le ratio vient de la donnée, pas du code

- Mécanisme : chaque slot média porte son propre `scrollPercent` (authored côté CMS), et le
  tween est `yPercent: 0 → slot.scrollPercent` avec `ease:"none"` + `scrub:true`. Aucun ratio
  n'est en dur. En plus, une couche pointeur indépendante, pilotée en `quickTo`.
- Valeurs : `scrollTrigger:{trigger:stage,start:"top top",end:"bottom top",scrub:!0}` ·
  pointeur `quickTo(el,"x",{duration:.6,ease:"power3.out"})` alimenté par
  `((clientX - rect.left)/rect.width - .5) * 2` (normalisé [-1,1]).
- Transférable ? **Oui** — surtout l'idée de sortir les ratios de parallaxe du JS dans un
  `data-parallax="-12"`. Ça rend la section réglable sans recompiler.

### Détails rares

- **Flash d'appareil photo** : `.photo-booth__flash { background: var(--color-paper); animation: .21s ease-out both photo-booth-flash }`, keyframe `opacity .72 → 0`. Un clap/flash de 210 ms en retour de capture.
- **Curseur contextuel** : `.photo-booth-trigger:hover{cursor:none}` + `.photo-booth-cursor[data-visible=true]` — le curseur natif est masqué *uniquement* sur cette zone.
- **Ticker footer** déclaré `paused` en CSS et débloqué par un attribut, pas par du style :
  `animation:45s linear infinite paused site-footer-ticker` puis `[data-motion-active=true] .track{animation-play-state:running}`.
- **Playhead projet** : un timecode mono fixe en haut à gauche pendant la lecture du projet,
  `transition: opacity .18s var(--ease-response), visibility 0s linear .18s`, caption en
  `color-mix(in srgb, var(--color-ink) 68%, transparent)`.
- **Transition projet** : `.project-transition-backdrop` avec `backdrop-filter: blur(var(--project-transition-blur))`
  animé, et une couleur **dépendante du sens** :
  `body:has(#smooth-wrapper[data-project-transition-direction=forward])` → papier ;
  `=reverse` → encre. Plus `.project-transition-surface{transform-origin:0 0}` = FLIP de la vignette.
- Respect de `Save-Data` / `prefers-reduced-data` via un attribut `data-data-saving` qui coupe
  l'ouverture (3 occurrences dans le bundle).

---

## 2. Peryton Film — https://www.peryton-film.com/

Déjà disséqué ailleurs. Ce qui manquait, et qui est le plus fort du site :

**Transition de page = View Transitions API en MPA**, pas de librairie. `@view-transition{navigation:auto}`
+ un panneau overlay à bord courbe (`border-radius: 50% / 12vh` sur une hauteur 140 %).
Aller : `--pw-cover-dauer: 800ms` `cubic-bezier(0.65,0,0.35,1)`, panneau `translateY(100%) → -9%`,
logo or en `pw-icon-rein .62s cubic-bezier(.4,0,.2,1) .2s`. Retour : `--pw-reveal-dauer: 1s`,
l'ancien snapshot part en `translateY(-106%)` avec `clip-path: inset(0 round 0 0 50% 50% / 0 0 12vh 12vh)`
(même arc que le panneau), la nouvelle page monte en `opacity 0→1` + `scale 1.04→1`
sur `cubic-bezier(0.3,0,0.1,1)`. Poignée de main entre les deux pages par `sessionStorage`
horodaté (au-delà d'un âge max, pas d'animation d'arrivée) et écoute de `pagereveal`.
Trois pièges documentés dans leurs propres commentaires : `html{background-color}` obligatoire
sinon le snapshot entrant est blanc ; `mix-blend-mode:normal` obligatoire sur `::view-transition-old(root)`
sinon le défaut UA `plus-lighter` brûle le panneau opaque ; `opacity:0` à 0 % sur la page
entrante sinon un snapshot vide flashe en blanc. `prefers-reduced-motion` coupe
`@view-transition{navigation:none}` **et** toutes les `::view-transition-*`.
Pas de son, pas de 404 custom détectée, pas de micro-interaction de formulaire notable.
⚠️ Leur `--pw-farbe` est `#182d19` et leur logo `#ecc779` — identiques à la palette Teddy :
la palette a manifestement déjà été prélevée ici lors de la première dissection.

---

## 3. LxL Creative — https://www.lxlcreative.co.uk/

**Pile réelle observée :** Webflow + Barba 2.10.3 + GSAP 3.15 **complet**
(CustomEase, DrawSVG, ScrollTrigger, Observer, Flip, SplitText, ScrollTo, Draggable, Inertia)
+ Lenis 1.3.17 + Finsweet Attributes. Le code du site est un bundle propre et lisible de 92 Ko
(`cdn.odyn.dev/auto/shdd/bundle.js`), organisé en ~40 modules déclenchés par attributs `data-*`.
**Ce qui est remarquable :** l'architecture entière tient dans deux courbes nommées et un
registre d'attributs ; et le hover « momentum » y est le plus abouti de tout le lot.

### Deux courbes, point final

- Mécanisme : `gsap.defaults({ease:"osmo", duration:…})` est posé une fois. 43 tweens sur ~70
  utilisent `osmo`. La seconde, `jump`, est réservée à ce qui doit **dépasser** (entrées de
  cartes).
- Valeurs :

```js
CustomEase.create("osmo","0.625, 0.05, 0, 1")     // ≈ cubic-bezier(.625,.05,0,1)
CustomEase.create("jump","M0,0 C0.35,1.5 0.6,1 1,1") // overshoot ~1.5
```

  Durées dominantes : `.3` / `.4` / `.5` / `.6` / `.75`. Staggers : `.04` / `.05`.
  Lenis : `new Lenis({lerp:.165, wheelMultiplier:1.25})`.
- Transférable ? **Oui.** `cubic-bezier(.625,.05,0,1)` est une excellente courbe unique par
  défaut (démarrage doux, arrivée nette). Le `jump` en `C0.35,1.5 0.6,1` est le rebond propre
  pour des cartes de projets.

### Hover momentum : on *lance* l'élément avec la vitesse réelle du curseur

- Mécanisme : le conteneur mesure le déplacement du curseur d'une frame à l'autre
  (`clientX - lastX`, agrégé dans un `requestAnimationFrame`). Au `mouseenter` d'un item, on
  ne lit pas la position du curseur — on lit sa **vitesse**, et on l'injecte dans InertiaPlugin
  comme vélocité initiale, avec une rotation dérivée du **produit vectoriel** entre le vecteur
  curseur→centre et le vecteur vitesse (donc : entrer par la gauche fait tourner dans l'autre
  sens qu'entrer par la droite), normalisé par la distance. Le retour à zéro est géré par
  l'inertie, pas par un tween.
- Valeurs : multiplicateur vitesse `30`, multiplicateur rotation `20`, `resistance: 200`,
  clamp translation `±1080`, clamp rotation `±60`. Désactivé si `!matchMedia("(hover:hover) and (pointer:fine)")`.
- Extrait :

```js
let{left:x,top:k,width:R,height:P}=C.getBoundingClientRect(),b=x+R/2,E=k+P/2,
T=v.clientX-b,L=v.clientY-E,I=T*o-L*g,_=Math.hypot(T,L)||1,H=I/_,
m=e(g*a),q=e(o*a),A=i(H*s);            // a=30, s=20, e=clamp(-1080,1080), i=clamp(-60,60)
gsap.to(C,{inertia:{x:{velocity:m,end:0},y:{velocity:q,end:0},rotation:{velocity:A,end:0},resistance:200},overwrite:"auto"});
```

- Transférable ? **Oui, et c'est le meilleur remplaçant du hover magnétique actuel.** Le hover
  magnétique classique attire vers le curseur (statique, prévisible). Celui-ci réagit à la
  *façon* dont on est arrivé — le même élément ne bouge jamais deux fois pareil. Sur une
  grille de projets ou de services, c'est la différence entre « animé » et « vivant ».

### Pile de médias en 3D avec un ScrollTrigger par carte

- Mécanisme : N cartes empilées, décalées en `y` **et en `z`** de `gap × (N-1)`. Chaque carte a
  son propre ScrollTrigger dont le `start`/`end` est **calculé à partir de son index** pour que
  les N sous-animations se partagent exactement la hauteur du pin. À chaque étape la carte
  remonte de `gap` en `y` et avance de `gap` en `z` (elle se rapproche). La dernière étape de
  chaque carte non-première l'éjecte hors champ avec une rotation aléatoire.
- Valeurs : `gap` par défaut `30`, `scrub:.5`, `invalidateOnRefresh:!0`,
  transition interne `ease:"back.inOut(3)"` (le `3` donne le petit recul avant de remonter),
  éjection `yPercent:-80, y:"-50vh", scale:1.2, rotation:(Math.random()-.5)*50, ease:"power4.in"`.
- Extrait :

```js
let l=parseFloat(s.dataset.mediaStackGap)||30,f=l*(i.length-1);gsap.set(i,{y:f,z:-f});
start:()=>`top top+=${(r.clientHeight-window.innerHeight)/i.length*g}`,
end:()=>`bottom bottom+=${(r.clientHeight-window.innerHeight)/i.length*g}`,scrub:.5
for(let t=0;t<i.length-1;t++)c.to(d,{y:`-=${l}`,z:`+=${l}`,ease:"back.inOut(3)"});
o||c.to(d,{yPercent:-80,y:"-50vh",scale:1.2,rotation:(Math.random()-.5)*50,ease:"power4.in"});
```

- Le module gère aussi le **flip carte recto/verso** en accessibilité complète : `role="button"`,
  `tabindex`, `aria-pressed`, `aria-label` qui change, `aria-hidden` sur la face cachée, Enter
  et Espace, et un garde qui ignore le clic si la cible est un lien/bouton interne
  (`h.closest('a, button, input, select, textarea, summary, [role="button"], [data-media-stack-no-flip]')`).
- Transférable ? **Oui.** C'est le dispositif « le dossier de production se feuillette » :
  permis, repérages, équipe, matériel — quatre cartes empilées qui défilent dans la profondeur.
  Le `z` en plus du `y` est ce qui le distingue d'un sticky stacking banal.

### Transition Barba dessinée au trait (DrawSVG)

- Mécanisme : un overlay contient un tracé SVG. À la sortie, le trait se **dessine** de 0 à 85 %
  tout en **épaississant** de 5 % à 30 % de la largeur du viewport — l'épaisseur du trait devient
  le rideau. À l'entrée, le trait se rétracte (`drawSVG "0% 100%" → "100% 100%"`) et se réamincit
  à 5 %, révélant la nouvelle page. Le thème (clair/sombre) du panneau est lu sur la page
  cible avant l'animation.
- Valeurs : sortie `duration:1, drawSVG:"0% 85%", ease:"Power1.easeInOut"` puis
  `strokeWidth:"30%", duration:.75` à `"< 0.25"`. Entrée : `duration:1.25, drawSVG:"100% 100%", strokeWidth:"5%"`,
  contenu en `fromTo({yPercent:25,autoAlpha:0},{yPercent:0,autoAlpha:1,ease:"osmo",duration:.75,stagger:.05},"<0.75")`.
- Extrait :

```js
i.set(r,{strokeWidth:"5%",drawSVG:"0% 0%"}),i.to(r,{duration:1,drawSVG:"0% 85%",ease:"Power1.easeInOut"}),
i.to(r,{strokeWidth:"30%",duration:.75,ease:"Power1.easeInOut"},"< 0.25");
```

- Transférable ? **Oui, en version simplifiée.** Un seul trait SVG qui s'épaissit jusqu'à couvrir
  l'écran, c'est un rideau de scène qui coûte un `path`. Sur Teddy : un trait or sur vert nuit.

### Curseur : deux niveaux, dont un *local*

- Mécanisme : deux systèmes distincts. (a) un curseur **global** en `quickTo` 0.4 s qui change
  d'attribut selon ce qui est sous le point — et qui détecte le **bord droit de l'écran** pour
  basculer en variante `active-edge` (le label ne déborde pas). (b) un curseur **de zone** :
  il ne suit le pointeur que dans les `[data-cursor-zone]`, avec un `pointermove` ajouté à
  l'entrée et retiré à la sortie (zéro listener global inutile), et il se téléporte à la position
  d'entrée avant de commencer à suivre.
- Valeurs : global `quickTo(x/y,{duration:.4,ease:"power3.out"})` ; zone `duration:.3,ease:"power3"`.
  L'état est recalculé dans un `requestAnimationFrame` coalescé (`elementFromPoint` + `closest`),
  et aussi au `scroll` (sinon l'état est faux quand la page bouge sous un curseur immobile).
- Extrait :

```js
let c=document.elementFromPoint(a,s)?.closest("[data-cursor-hover]"),t=n.getBoundingClientRect(),
h=!!c,w=t.right>=window.innerWidth;
n.setAttribute("data-cursor",h?w?"active-edge":"active":"");
```

- Transférable ? **Oui — les deux détails manquent au curseur de Teddy** : le recalcul au scroll
  et la variante « bord d'écran ».

### Trait au pointeur en SVG (détail rare)

- Mécanisme : dans une zone `[data-draw]`, chaque déplacement du pointeur ajoute un `<line>` à
  un SVG créé à la volée — mais seulement si le déplacement dépasse un seuil (sinon on
  accumulerait des milliers de segments). À la sortie, toutes les lignes disparaissent en
  cascade ultra-rapide puis sont retirées du DOM.
- Valeurs : seuil `4` px (comparé au carré : `dx*dx+dy*dy < 4*4`), une seule ligne par rAF,
  effacement `gsap.to(lines,{strokeOpacity:0,duration:.01,stagger:.01,ease:"none",onComplete: remove})`.
  `viewBox` recalculé au resize, invalidé au scroll. `pointerType !== "mouse"` → rien.
- Transférable ? **Oui**, en signature discrète (un easter egg dans une seule section : « tracez
  votre repérage »). Le `duration:.01 + stagger:.01` est la bonne recette d'effacement : ça
  s'efface dans l'ordre du tracé, comme une traîne.

### Divers LxL

- **Thème piloté par ScrollTrigger** : `[data-animate-theme-to]` + `onToggle` sur
  `start:"top center"` / `end:"bottom center"` → `gsap.to("body", colorThemes.getTheme(x))` et
  `document.body.dataset.pageTheme`. Un second système plus court pour la nav seule
  (`start:"top top"`, `end:"bottom top"`), pour que la nav change de couleur avant le corps.
- **Vidéo au survol** : `src` posé **au premier survol seulement** (jamais dans le HTML), pause
  différée de 200 ms avec vérification de l'état (évite le clignotement sur un passage rapide),
  et bascule automatique en IntersectionObserver `threshold:.5` si pas de vrai pointeur.
- **Filtre de projets** : `autoAlpha:0, scale:.35, duration:.3, ease:"osmo", stagger:.05, overwrite:"auto"`.
  Le `scale:.35` (et pas `.9`) est ce qui fait lire « ça se range », pas « ça s'efface ».
- **Cycle d'images d'équipe** : `setInterval` à **500 ms** au survol, `gsap.set` (pas de tween) —
  un flip-book, pas un fondu.
- Accessibilité : chaque module teste `matchMedia("(hover:hover) and (pointer:fine)")` et une
  variable globale `V` (reduced-motion) qui court-circuite l'animation en posant directement
  l'état final.

---

## 4. In Development Studios — https://indevelopment.studio/

**Pile réelle observée :** Webflow, GSAP 3.12.5/3.15 (ScrollTrigger, SplitText, CustomEase,
ScrollTo), Lenis 1.3.13, SplitType, Lottie (bodymovin 5.10.2), MixItUp. **Tout le code du site
est inline et non minifié** dans le HTML — c'est le site le plus facile à lire du lot.
**Ce qui est remarquable :** la révélation du titre héro n'est pas un fondu ; c'est une frappe.

### Titre héro « frappé » : durée quasi nulle + stagger

- Mécanisme : SplitType en `lines, chars`. Puis, **ligne par ligne séquentiellement**, les
  caractères passent de `autoAlpha:0` à `1` avec une durée de **15 ms** et un stagger de 45 ms,
  en `ease:"none"`. Comme la durée est bien plus courte que le stagger, chaque lettre **apparaît
  d'un coup** : on ne voit pas un fondu, on voit une machine à écrire. Le `">"` en position
  enchaîne les lignes bout à bout.
- Valeurs : `duration: 0.015`, `stagger: 0.045`, `ease: "none"`, par ligne, position `">"`.
- Extrait :

```js
splitHero.lines.forEach((line) => {
  const chars = line.querySelectorAll(".char");
  tl.to(chars, { autoAlpha: 1, duration: 0.015, stagger: 0.045, ease: "none" }, ">");
});
```

- Transférable ? **Oui, et c'est le contre-pied du blur-in généralisé de Teddy.** Réserver ce
  traitement à **une seule** ligne (le nom, ou le chiffre clé) pour créer un contraste avec le
  reste qui est doux. `0.045 × nombre de lettres` = durée totale : calibrer sur ~1 s.

### Preloader Lottie : plafond dur, une fois par session

- Mécanisme : Lottie en SVG, `autoplay:false`, lancé sur `DOMLoaded`. La sortie n'attend **pas**
  la fin de l'animation : `window.load` + `setTimeout(2200)` — un plafond fixe. Le loader n'est
  joué que sur la home, et `sessionStorage.homeLoaderShown` fait qu'il ne rejoue pas. La branche
  « déjà vu » rejoue quand même l'entrée du héro, avec les mêmes valeurs mais sans le panneau.
- Valeurs : plafond `2200 ms` après `load`. Sortie chorégraphiée :

```js
tl.to(".load",{yPercent:-100,duration:0.9,ease:"power3.inOut"})
  .set(".hero-video",{scale:1.05,autoAlpha:0})
  .to(".hero-video",{scale:1,autoAlpha:1,duration:1,ease:"power3.out"},"-=0.7")
  .from(".hero-content-logo",{y:30,autoAlpha:0,duration:0.8,ease:"power3.out"},"-=0.7")
  .call(()=>animateHeroTitle(0),null,"-=0.45")
  .to(".navbar",{autoAlpha:1,duration:0.5,ease:"power2.out",clearProps:"visibility,opacity"},"-=0.25");
```

- Noter les chevauchements : la vidéo commence à monter **0,7 s avant** la fin du rideau, le
  logo en même temps qu'elle, le titre 0,45 s avant, la nav 0,25 s avant. Rien ne commence
  après la fin de quoi que ce soit — c'est ça qui fait « une seule prise ».
- Transférable ? **Oui.** Le plafond dur (2,2 s) est la bonne décision de goût : on ne fait pas
  attendre un line producer. Le `sessionStorage` une-fois-par-session aussi.

### Transition de page sans librairie (33 lignes)

- Mécanisme : un panneau `.page-transition`. Au clic sur un lien interne : `preventDefault`,
  pose d'un flag `sessionStorage`, panneau de `yPercent:100` à `0`, puis `location.href` dans le
  `onComplete`. À l'arrivée, si `document.documentElement` porte `is-page-transitioning`, le
  panneau part de 0 à `-100` — il **traverse** l'écran, il ne revient pas sur ses pas.
  Filtres : `#`, ancres de même page, `mailto:`, `tel:`, `target="_blank"`, hôte externe.
- Valeurs : sortie `duration: 0.85, ease: "power3.inOut"` ; entrée `duration: 0.9`, puis
  `gsap.set(transition,{yPercent:100})` pour réarmer.
- Transférable ? **Oui.** Sur une MPA Vite c'est exactement le bon niveau : pas de Barba, pas de
  SPA, 30 lignes. (À comparer avec Peryton qui fait mieux avec View Transitions natives.)

### Révélation de section : blur + y, en cascade négative

- Mécanisme : 5 rôles nommés par `data-home-reveal` (`title`, `intro`, `column-left`,
  `column-right`, `extra`). Une timeline `paused` par section, jouée par `tl.restart()` quand
  le haut passe sous 92 % de la hauteur, **remise à zéro** quand la section est totalement hors
  champ (donc ça rejoue à la remontée).
- Valeurs : état initial `autoAlpha:0, y:32, filter:"blur(2px)"`, chaque item `duration: 1.05`
  (intro `1`), `ease:"power3.out"`, positions `-=0.75 / -=0.55 / -=0.75 / -=0.75`.
  Seuils par famille : sections `innerHeight * 0.92`, titres about `0.82`
  (avec `y:40, blur(6px), duration:1.4`), cartes projets `0.9` (`y:24, duration:1.2`).
- Transférable ? **Oui.** Ce qui est instructif : **le blur est proportionnel à l'amplitude**.
  2 px pour un bloc qui monte de 32 px, 6 px pour un titre qui monte de 40 px sur 1,4 s. Teddy
  applique un blur-in généralisé — le graduer par importance donnerait de la hiérarchie.

### Stagger de caractères en CSS pur (zéro JS par frame)

- Mécanisme : chaque caractère d'un bouton est enveloppé dans un `<span>` qui reçoit un
  `transition-delay` en dur à la construction. Ensuite c'est le CSS qui anime au `:hover`.
  Aucune timeline, aucun tween, aucune recalcul.
- Valeurs : `span.style.transitionDelay = index * 0.01 + "s"` — 10 ms par lettre.
  `whiteSpace:"pre"` sur les espaces. Désactivé sous 992 px.
- Extrait :

```js
[...text].forEach((char,index)=>{const span=document.createElement("span");
  span.textContent=char;span.style.transitionDelay=`${index*0.01}s`;
  if(char===" ")span.style.whiteSpace="pre";button.appendChild(span);});
```

- Transférable ? **Oui, sans hésiter.** C'est le stagger de label de bouton le moins cher qui
  existe. À combiner avec `--interaction-label-travel: 6px` de Velour.

### Divers In Development

- **Lottie réversible au survol** : `anim.setDirection(1); anim.play()` à l'entrée,
  `setDirection(-1); play()` à la sortie. Une icône qui se replie au lieu de sauter.
- **Vimeo paresseux** : l'iframe n'est **construite** qu'à l'intersection
  (`threshold: 0.01`, `rootMargin: "0px"`), puis `observer.unobserve`. Paramètres
  `?autoplay=1&muted=1&loop=1&background=1&autopause=0&playsinline=1`.
- **Lenis desktop-only** : `if (window.innerWidth < 992) return;` — pas de smooth scroll sur
  mobile du tout. `lerp: 0.1, smoothWheel: true, syncTouch: false, autoResize: true`.
- Faiblesse à ne **pas** copier : les reveals sont sur `window.addEventListener("scroll", …)`
  non throttlés, et les `ScrollTrigger.refresh` sont appelés à 300/900/1500/2500/5000 ms « au
  cas où ». C'est du rustinage. Utiliser ScrollTrigger proprement.

---

## 5. DISKO — https://disko.media

**Pile réelle observée :** Next.js App Router, React, Tailwind v4, GSAP (ScrollTrigger, Flip,
Observer). Le CSS est massivement Tailwind + un petit fichier maison.
**Ce qui est remarquable :** peu de choses côté motion — mais **le bon garde-fou d'accessibilité**,
et un loader SVG à deux traits qui se relaient.

### Toutes les animations dans un `matchMedia` reduced-motion

- Mécanisme : la totalité du système de reveal est enregistrée à l'intérieur de
  `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", …)`. Si l'utilisateur
  préfère moins de mouvement, **les tweens ne sont jamais créés** — pas de `if` éparpillés, pas
  d'état final à poser à la main. Le `revert()` au démontage nettoie tout.
- Valeurs :
  - `.reveal` : `{opacity:0,y:50}→{opacity:1,y:0,duration:.9,ease:"power3.out"}`, `start:"top 88%"`
  - `.reveal-group > .reveal-child` : `y:40 → 0, duration:.7, stagger:.12, ease:"power2.out"`, `start:"top 85%"`
  - `.feature-showcase` : `x: ±80 → 0, duration:1, ease:"power3.out"`, `start:"top 82%"`,
    le signe lu sur `e.dataset.direction`
  - `.final-cta` : `scale:.95 → 1, duration:.8, ease:"back.out(1.5)"`, `start:"top 85%"`
  - Tous en `toggleActions:"play none none none"` (jamais de rejeu au retour)
- Extrait :

```js
let e=gsap.matchMedia();
e.add("(prefers-reduced-motion: no-preference)",()=>{ /* tous les ScrollTrigger ici */ });
return ()=>e.revert();
```

- Transférable ? **Oui.** C'est la forme canonique. Sur Teddy, envelopper **tout** le motion
  dans un seul `gsap.matchMedia()` avec deux branches (`no-preference` / `reduce`) et une
  branche desktop, plutôt que des tests dispersés.
- Noter aussi l'**échelonnement des seuils** : 88 % pour un bloc seul, 85 % pour un groupe,
  82 % pour un panneau large. Plus l'élément est gros, plus on déclenche tard.

### Loader SVG à deux traits qui se passent le relais

- Mécanisme : deux `path` partagent un cycle. Le premier se dessine puis se sur-décale et
  devient `visibility:hidden` à **60.1 %** ; le second devient visible **exactement** à 60.1 %
  et prend la suite avec ses propres courbes par segment. On lit un seul trait continu qui
  serpente, alors qu'il y en a deux.
- Valeurs :

```css
@keyframes diskoWorm1{0%{animation-timing-function:ease-in-out;stroke-dashoffset:-87.96}
 20%{animation-timing-function:ease-in;stroke-dashoffset:0}
 60%{stroke-dashoffset:-791.68;visibility:visible}60.1%,to{stroke-dashoffset:-791.68;visibility:hidden}}
@keyframes diskoWorm2{0%,60%{stroke-dashoffset:-87.96;visibility:hidden}
 60.1%{animation-timing-function:cubic-bezier(0,0,.5,.75);stroke-dashoffset:-87.96;visibility:visible}
 77%{animation-timing-function:cubic-bezier(.5,.25,.5,.88);stroke-dashoffset:-340}
 to{stroke-dashoffset:-669.92}}
```

- Le point technique à retenir : `animation-timing-function` **déclarée dans une keyframe**
  s'applique au segment qui *part* de cette keyframe. C'est ainsi qu'on obtient quatre courbes
  différentes dans une seule animation CSS.
- Transférable ? **Oui** pour un loader léger (le spinner alternatif au Lottie). Le relais à
  60/60.1 % est la technique générale pour enchaîner deux éléments sans JS.
- Le reste (`orbPulse`, `shimmer`, `pin-pulse`, `cloudGlow`) est du Tailwind standard, sans
  intérêt pour nous.

---

## 6. RemyShoots — https://www.remyshoots.co.za/

**Pile réelle observée :** Next.js (turbopack), React, Three.js, Sanity, GSAP (Observer, Flip,
`quickTo`). **Et surtout : View Transitions API native avec *types* et *classes*** — le site le
plus moderne du lot sur les transitions.
**Ce qui est remarquable :** la transition entre deux projets n'est pas *une* animation, c'est
**quatre animations de vitesses différentes** appliquées à quatre parties nommées, dont le sens
dépend de la direction de navigation. Sans une ligne de librairie.

### Transition de page par parties, à quatre vitesses

- Mécanisme : quatre `view-transition-name` / `view-transition-class` — `proj-stage` (le média),
  `proj-meta` (titre + légende), `proj-sheet` (la planche-contact), `proj-chrome` (header /
  footer / menu). Chaque partie a sa durée, sa courbe et son délai. Le sens est choisi par des
  **types de transition** (`startViewTransition({types:[…]})`), lus en CSS avec
  `html:active-view-transition-type(project-cross-motion)`. La direction du wipe est une simple
  variable qui pointe vers l'une ou l'autre keyframe.
- Valeurs :

```css
--vt-stage-dur:1.6s;  --vt-stage-ease:cubic-bezier(.887, 0, .113, 1);
--vt-cross-dur:1.6s;  --vt-cross-delay:.33s;
--vt-sheet-dur:1s;
--vt-meta-dur:.45s;   --vt-meta-ease:cubic-bezier(.4, 0, .15, 1);
--vt-meta-in-delay:.45s; --vt-meta-out-delay:0s;
--vt-leave-dur:1.6s;  --vt-leave-fade:.25s;
--vt-sheet-dir-stills:proj-wipe-leftward;  --vt-sheet-hand-stills:proj-clip-to-left;
```

  Keyframes : `proj-stage-in{0%{transform:translate(100vw)}}` / `-in-back{-100vw}` /
  `-out{to{translate(-100vw)}}` ; `proj-meta-in{0%{opacity:0;transform:translateY(100%)}}` ;
  `proj-wipe-leftward{0%{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0)}}` ;
  `proj-clip-to-left{0%{clip-path:inset(0)}to{clip-path:inset(0 100% 0 0)}}`.
- Le rapport de vitesses est la clé : **le média met 1,6 s, la légende 0,45 s**, et la légende
  entrante attend `0.45s` — elle sort d'abord, le média voyage, puis elle revient quand il est
  presque arrivé. `cubic-bezier(.887,0,.113,1)` est une courbe extrêmement plate au centre :
  l'image démarre lentement, traverse très vite, et se pose lentement. C'est un mouvement de
  caméra, pas un slide.
- Extrait :

```css
html:active-view-transition-type(project-cross-motion)::view-transition-old(.proj-chrome)
 { animation: var(--vt-cross-dur) var(--vt-cross-ease) both proj-clip-to-left }
html:active-view-transition-type(project-cross-stills)::view-transition-new(.proj-chrome)
 { animation: var(--vt-sheet-dur) var(--vt-sheet-ease) both var(--vt-sheet-dir-stills) }
::view-transition-old(root){ animation:none }
```

- Transférable ? **Oui — et c'est probablement le plus gros gain du lot pour Teddy.** Une MPA
  Vite active les View Transitions avec `@view-transition{navigation:auto}`, et on peut nommer
  les parties persistantes (`header`, l'emblème, le fond étoilé) pour qu'elles **ne bougent
  pas** entre `index` / `locations` / `book`. Pas de JS, pas de SPA, et le fond de ciel ne
  redémarre pas à chaque page.

### Tutoriel gestuel animé (détail rare, et exactement ce qui manque à Teddy)

- Mécanisme : une petite main/curseur SVG qui **démontre le geste** en boucle. Trois scénarios
  (`click`, `drag`, `view`). Le déplacement est une animation `cubic-bezier(.4,0,.2,1)` ; la
  bascule main ouverte / main fermée est une animation **séparée** en `step-end` (donc un
  changement net, pas un fondu) calée sur les mêmes pourcentages ; un anneau pulse par-dessus.
  Trois animations indépendantes qui partagent la même durée = une pantomime lisible.
- Valeurs :

```css
@keyframes gt-drag-move{0%,14%{top:56%;left:68%}76%,to{top:56%;left:26%}}   /* 3s cubic-bezier(.4,0,.2,1) */
@keyframes gt-drag-open{0%,13%{opacity:1}14%,84%{opacity:0}85%,to{opacity:1}} /* 3s step-end */
@keyframes gt-drag-closed{0%,13%{opacity:0}14%,84%{opacity:1}85%,to{opacity:0}}
@keyframes gt-click-pulse{0%,50%{opacity:0;transform:scale(.4)}56%{opacity:.9;transform:scale(.9)}
 78%,to{opacity:0;transform:scale(1.9)}}                                    /* 4s ease-out */
@keyframes gt-view-press{0%,34%{scale(1)}46%,88%{scale(.86)}to{scale(1)}}   /* 2.6s ease-in-out */
```

  Glyphe : 34×34 px, `margin:-17px 0 0 -17px` (auto-centrage sans transform),
  `filter: drop-shadow(0 2px 6px #000000a6)` pour tenir sur n'importe quel fond.
- Transférable ? **Oui.** La galerie infinie « qu'on tire » de Teddy ne dit nulle part qu'on
  peut la tirer. Ce petit `gt-drag` en boucle sur les 3 premières secondes (puis effacé au
  premier drag) résout ça pour ~40 lignes de CSS et zéro JS d'animation.

### Divers Remy

- `quickTo(el,"x"/"y",{duration:.25,ease:"power3.out"})` pour le curseur — plus serré que les
  0,3–0,4 s habituels, ça donne un curseur qui « colle » davantage.
- Flèches de navigation en `clip-path: polygon(0 50%, 75% 6.7%, 75% 93.3%)` — un triangle pur
  CSS avec les quatre orientations, pas de SVG, pas d'icône.
- `transition: transform .45s cubic-bezier(.4,0,.15,1)` comme transition de hover dominante
  (.4/0/.15/1 est une out-quart douce, très photo).
- Le code applicatif de la scène Three.js n'est pas dans les chunks servis au premier rendu
  (chargement différé) — seuls les shaders par défaut de Three sont présents.

---

## 7. GM Studios — https://www.lesgmstudios.com/

**Pile réelle observée :** Next.js (turbopack), React, Tailwind v4, GSAP (Observer,
ScrollTrigger, Flip), Swiper. Beaucoup de CSS maison.
**Ce qui est remarquable :** un preloader qui **plonge à travers le logo** en 0,7 s, et le
meilleur marquee du lot (vitesse constante, pas durée constante).

### Le preloader plonge dans le contre-poinçon du logo

- Mécanisme : un SVG plein écran noir dont le wordmark est **découpé** (les lettres sont des
  trous). Le SVG est mis à l'échelle **×80** en pivotant sur un point précis à l'intérieur du
  logo (`svgOrigin`), calculé depuis le centre du viewport avec une correction optique en dur.
  Comme la courbe est `expo.in`, il ne se passe presque rien pendant ~400 ms puis tout explose :
  on lit « la caméra entre dans le logo ». Le scroll est verrouillé pendant, libéré à la fin.
- Valeurs : `scale: 1 → 80`, `duration: .7`, `delay: .25`, `ease: "expo.in"`,
  `svgOrigin = (innerWidth/2 - 10.5, innerHeight/2 + 2.36)`.
- Extrait :

```js
let d=u.w/2+-10.5, f=u.h/2+(12.36-10);
o.fromTo(c.current,{scale:1,svgOrigin:`${d} ${f}`},
  {scale:80,duration:.7,delay:.25,ease:"expo.in",svgOrigin:`${d} ${f}`});
```

- Les deux garde-fous, à copier tels quels :
  - `prefersReducedMotion()` → on saute entièrement, on déverrouille, on termine.
  - **Filet de sécurité CSS** : le masque porte une classe
    `animation: 0s 4s forwards gmHydrationFailsafe` dont la keyframe est `to{visibility:hidden}`.
    Si React n'hydrate jamais, le CSS retire le masque au bout de 4 s. Plus un
    `<noscript><style>[data-loading-mask]{display:none}</style></noscript>`.
- Transférable ? **Oui, très.** C'est le geste d'ouverture idéal pour Teddy : l'emblème or
  tenu, puis on plonge dedans. Bien moins cher qu'un preloader WebGL, et la double sécurité
  (reduced-motion + failsafe CSS 4 s) est la bonne hygiène.

### Marquee à vitesse constante (et non à durée constante)

- Mécanisme : la piste est dupliquée (`[...items, ...items]`) et translate de `-50%`. La
  **durée** n'est pas écrite en dur : le JS mesure `scrollWidth / 2` et pose
  `--results-duration = scrollWidth/2 / 60` secondes — soit exactement **60 px/s** quel que
  soit le nombre d'éléments ou la largeur d'écran. Un `ResizeObserver` recalcule. L'animation
  démarre `paused` et n'est mise en `running` qu'au premier passage d'un IntersectionObserver
  (`rootMargin: "200px"`), qui se déconnecte aussitôt.
- Valeurs : vitesse `60 px/s` ; `animation: results-scroll var(--results-duration,60s) linear infinite reverse` ;
  la variante logos tourne à `72s` par défaut, la variante compacte à `45s` ;
  `:hover { animation-play-state: paused }`. Fondu des bords en masque **responsive** :

```css
mask-image:linear-gradient(90deg,#0000,#000 min(220px,18%),
  calc(100% - min(220px,18%)),#0000);
```

  (le `min(220px, 18%)` empêche le fondu de manger la moitié d'un écran mobile).
- Extrait :

```js
let a=()=>{let t=e.scrollWidth/2; t>0 && e.style.setProperty("--results-duration",`${Math.round(t/60)}s`)};
a(); new ResizeObserver(a).observe(e);
new IntersectionObserver(t=>{t[0]?.isIntersecting&&(e.style.animationPlayState="running",i.disconnect())},
  {rootMargin:"200px"}).observe(t);
```

- Transférable ? **Oui.** La formule `durée = largeurPiste / vitessePxParSeconde` est la seule
  correcte : deux marquees de longueurs différentes doivent défiler à la même vitesse, sinon
  l'un a l'air pressé. `paused` par défaut + IO = zéro compositing hors écran.

### Divers GM

- **Point REC** : `animation: 2.2s ease-in-out infinite rec-blink`,
  keyframe `0%,to{opacity:1} 50%{opacity:.15}`. 2,2 s (pas 1 s) et descente à 0,15 (pas 0) :
  ça respire au lieu de clignoter. Très juste pour une société de production.
- **Grain en deux couches décalées** : `.noise-overlay{background-size:380px 380px;opacity:.25}`
  + `.noise-overlay--2{background-position:197px 113px}` — deux tuiles identiques décalées de
  valeurs non divisibles par 380, donc le motif ne se répète jamais visiblement.
  (Approche complémentaire de celle de Velour, qui décale dans le temps.)
- Reveals : `y:32 → 0, opacity:0 → 1, duration:.8, stagger:.12, ease:"power3.out"` avec
  `immediateRender:!1` et `clearProps:"transform,opacity"`.
- Seuils ScrollTrigger dominants : `top 80%` (5×), `top 85%`, `top 75%`, `top 90%`, `top 95%` ;
  `scrub: .4` pour les scrubs.
- `searchPanelIn/Out` asymétriques : entrée `translateY(24px) → 0`, sortie `0 → translateY(16px)`.
  On sort moins loin qu'on n'entre — le panneau « retombe » au lieu de « repartir ».

---

## 8. Filmbot — https://filmbot.com/

**Pile réelle observée :** Webflow + un bundle maison de 773 Ko sur Vercel
(`filmbot-code.vercel.app/scripts/app.js`), GSAP 3.15 (CustomEase, Observer, SplitText, Barba),
Lenis. **Aucun WebGL trouvé** dans le code servi malgré le tag Awwwards — pas de
`gl_FragColor`, pas de `getContext("webgl")`, pas de Three/OGL.
**Ce qui est remarquable :** l'ouverture de page est une **fente de projecteur** ; et leur
slider infini a une mécanique de wrap modulo propre et complète.

### Ouverture en fente : point → fente verticale → plein écran

- Mécanisme : la nouvelle page est masquée par un `clip-path: polygon` réduit à un point au
  centre-bas. Une seule animation à trois keyframes l'ouvre : d'abord en **fente verticale
  pleine hauteur de 4 % de large** (48 %→52 %), puis en rectangle plein. Chaque segment a sa
  propre courbe. C'est l'ouverture d'un obturateur.
- Valeurs : `duration: 1.5`, `delay: .1`, ease global `"energy"`, segment 0→80 % en `"ease-out"`,
  segment 80→100 % en `"expo-in-out"`. Le header du contenu monte en parallèle
  (`opacity 0→1, duration:.3, delay:.6`). Un voile sombre se retire en `duration:.2, delay:1.4`.
  Le `clearProps:"all"` remet tout à plat à la fin. Le départ de page : le voile monte en
  `duration:.7, ease:"ease-energy"`.
- Extrait :

```js
s.set(e,{zIndex:3,willChange:"clip-path",clipPath:"polygon(50% 100%, 50% 100%, 50% 100%, 50% 100%)"});
s.to(e,{keyframes:{"0%":{clipPath:"polygon(50% 100%, 50% 100%, 50% 100%, 50% 100%)"},
 "80%":{clipPath:"polygon(48% 0%, 52% 0%, 52% 100%, 48% 100%)",ease:"ease-out"},
 "100%":{clipPath:"polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",ease:"expo-in-out"}},
 duration:1.5,delay:.1,clearProps:"all",ease:"energy"},0);
```

- Transférable ? **Oui.** Une fente qui s'ouvre, c'est du cinéma littéral, et c'est un
  `clip-path` — aucun coût. Sur Teddy : sur vert nuit, la fente révèle le contenu crème.
  Attention : `keyframes` avec `ease` par segment nécessite GSAP ≥ 3.9 (OK en 3.13).

### Deux courbes maison, encore

- Valeurs :

```js
CustomEase.create("expo-in-out","M0,0 C0.95,0.1 0.05,1 1,1");  // ≈ cubic-bezier(.95,.1,.05,1)
CustomEase.create("energy","M0,0 C0.32,0.72 0,1 1,1");          // out doux avec relance
```

  `expo-in-out` est encore plus plat au centre que le `.887/.113` de Remy : quasi immobile aux
  deux bouts, très rapide au milieu. C'est LA courbe des transitions « caméra ».
- Répartition observée : `ease-energy` 13×, `expo-in-out` 12×, `energy` 7×, `power3.out` 8×.

### Slider infini : wrap modulo, inertie, snap

- Mécanisme : pas de clonage de DOM. Chaque item est positionné à
  `translate = (wrap(current + i, nbItems) - i) * itemWidth` — un modulo positif qui fait
  tourner les items en anneau. Pour les largeurs variables, la même formule sur les offsets
  cumulés et la largeur totale. Le `current` suit le `target` par un damp indépendant du
  framerate ; la vitesse résiduelle décroît de 15 % par frame. Snap en arrondissant `target`.
- Valeurs :

```js
{infinite:!0, snap:!0, variableWidth:!1, vertical:!1, dragSensitivity:.005,
 lerpFactor:.3, scrollSensitivity:1, snapStrength:.1, speedDecay:.85, bounceLimit:1,
 virtualScroll:{mouseMultiplier:.5, touchMultiplier:2, firefoxMultiplier:30, useKeyboard:!1, passive:!0}}
```

  `IntersectionObserver({rootMargin:"50px", threshold:0})` coupe la boucle rAF hors écran.
  Curseur `grab`/`grabbing` géré au drag.
- Transférable ? **Partiellement.** Teddy a déjà sa galerie infinie. Ce qui vaut d'être repris :
  `speedDecay: .85`, `lerpFactor: .3`, `mouseMultiplier: .5` (la molette doit être **deux fois
  moins** sensible que le doigt) et `firefoxMultiplier: 30` (Firefox envoie des deltas en
  lignes, pas en pixels — sans ce facteur le slider est inutilisable sous Firefox).

### Transition de citations : iris + flou

- Valeurs : `defaults:{duration:.95, ease:"expo-in-out"}` ;
  le texte sortant `{autoAlpha:0, filter:"blur(0.3125em)", duration:.4, ease:"energy"}` à `0.6` ;
  l'image sortante `{scale:.95, clipPath:"inset(0% 50% 0% 50%)"}` à `0` ;
  l'image entrante `fromTo({scale:.95,clipPath:"inset(0% 50% 0% 50%)"},{scale:1,clipPath:"inset(0% 0% 0% 0%)"})` à `1.2`.
- Le `blur` en **em** et non en px (`0.3125em` = 5 px à 16 px) : le flou suit la taille du texte.
  Petit détail, grosse différence en responsive.

---

## 9. ALTITUDE 101 — https://altitude101.com/

**Pile réelle observée :** Next.js (turbopack, 32 chunks), React Three Fiber + Three.js,
**simulation de fluide GPU complète** (advection / divergence / pression / curl / vorticité),
troika-three-text (texte SDF 3D), GSAP 3.13 (ScrollTrigger, Observer, SplitText, Flip), Lenis,
Tailwind v4.
**Ce qui est remarquable :** c'est le seul « gros dispositif » du lot. Deux choses en sont
extractibles sans embarquer le dispositif : le **découplage des résolutions GPU**, et
l'**anneau de sonar en délais négatifs**.

### Anneaux de sonar : une seule keyframe, quatre délais négatifs

- Mécanisme : quatre anneaux partagent **la même** animation et **la même** durée ; seuls leurs
  `animation-delay` diffèrent, en **valeurs négatives** fractionnaires de la durée. Un délai
  négatif démarre l'animation déjà avancée : au premier paint les quatre anneaux sont déjà
  répartis dans le cycle, sans aucun JS de stagger et sans attente.
- Valeurs :

```css
animation: sonarWave2 var(--sonar-wave-duration) linear infinite;
animation: sonarWave2 var(--sonar-wave-duration) calc(var(--sonar-wave-duration)/4*-1) linear infinite;
animation: sonarWave2 var(--sonar-wave-duration) calc(var(--sonar-wave-duration)/2*-1) linear infinite;
animation: sonarWave2 var(--sonar-wave-duration) calc(var(--sonar-wave-duration)*3/4*-1) linear infinite;
@keyframes sonarWave2{0%{opacity:1}to{opacity:0;transform:scale(2)}}
@keyframes sonarWave3{0%{opacity:1}to{opacity:0;transform:scale(3)}}
```

  Deux amplitudes (`scale(2)` et `scale(3)`) superposées : la seconde série, plus large, donne
  l'impression d'une propagation qui continue au lieu d'une boucle.
- Transférable ? **Oui, et c'est fait pour Teddy.** Un point de repérage sur une carte
  d'Éthiopie (Lalibela, Danakil, Simien) qui émet en continu : quatre `<span>`, une keyframe,
  quatre délais. Coût nul, lecture immédiate « ici, on tourne ».

### Entrée pilotée à la molette, pas au scroll

- Mécanisme : `Observer.create({target:window, type:"wheel"})` accumule un scalaire 0→1 et
  applique **directement** (durée .1, `ease:"none"`) un `scale` et un `blur` proportionnels.
  Le contenu n'est pas « scrollé » : la molette est un curseur de réglage. À 1, on bascule dans
  le site. Le texte est en SplitText `mask:"words"` avec un stagger très serré.
- Valeurs : `progress += .001 * deltaY` clampé 0..1 ;
  `scale: 1 + 19*t` · `filter: blur(${10*t}px)` · `duration:.1, ease:"none"` ;
  opacité du calque `1 - t` ; sortie des mots `yPercent:-100, opacity:0, duration:1, stagger:.005, ease:"power3.out"` ;
  entrée des mots `yPercent:0, opacity:1, duration:1, stagger:.005, ease:"power4.inOut"`.
  Sortie finale `opacity:0, duration:.3` puis démontage à `+300ms`.
- Le `stagger: .005` est remarquable : 5 ms entre mots. On ne lit pas une liste, on lit une
  **onde** qui traverse la phrase. (Comparer au `.12` de DISKO, qui lit « un, puis l'autre ».)
- SplitText 3.13 est utilisé avec l'option `mask` : `SplitText.create(el,{type:"chars",mask:"chars"})`
  et `{type:"words",mask:"words"}` — le masque `overflow:hidden` est généré automatiquement,
  plus besoin de doubles `<span>` à la main.
- Transférable ? **Le `mask` de SplitText : oui, tout de suite.** Le pilotage molette : à
  réserver, il casse le scroll et coûte un onboarding (voir le tutoriel gestuel de Remy).

### Simulation de fluide : ce qu'il faut en retenir même sans la reprendre

- Mécanisme : Navier-Stokes classique en ping-pong de render targets. Advection, divergence,
  pression (Jacobi), curl, vorticité, splat gaussien au pointeur
  (`exp(-dot(p,p)/uRadius) * uColor`).
- **Le point vraiment utile : les résolutions sont découplées.** La teinte (ce qu'on voit) est
  en 512², la simulation (ce qu'on ne voit pas) en 128². Formats minimaux par cible,
  `generateMipmaps = false`, `depthBuffer: false`.

```js
density : 512×512 HalfFloat RGBA  LinearFilter
velocity: 128×128 HalfFloat RG    LinearFilter
pressure: 128×128 HalfFloat Red   NearestFilter
divergence / curl : 128×128 HalfFloat Red NearestFilter
```

- Constantes par défaut : `blend:5, intensity:2, force:1.1, distortion:.4, curl:1.9,
  radius:.3 (→ uRadius = .003), swirl:4, pressure:.8, densityDissipation:.96,
  velocityDissipation:1, fluidColor:"#3300ff", backgroundColor:"#070410"`.
  `dt` figé à `1/60` (`.016666…`) — la sim ne dépend pas du framerate réel.
- Transférable ? **Le dispositif : non** — Teddy a déjà un emblème 3D et un ciel étoilé, ajouter
  un fluide serait le « gros dispositif de plus » qu'on ne veut pas. **La leçon : oui** — si le
  ciel étoilé est en canvas, simuler à basse résolution et rendre à haute, et figer le `dt`.
- Autres valeurs relevées côté scroll : `scrub: 1.5` et `.3`, `anticipatePin` (8×),
  `start:"top bottom+=100vh"` / `end:"bottom top-=100vh"` (pré-chargement d'une hauteur d'écran
  de part et d'autre), `mix-blend-mode: difference` sur un calque de texte.

---

## Les 5 choses à voler dans ce lot

**1. Le vocabulaire de courbes en quatre noms (Velour)**
`--ease-response: cubic-bezier(.23,1,.32,1)` · `--ease-settle: cubic-bezier(.22,1,.36,1)` ·
`--ease-expressive: cubic-bezier(.76,0,.24,1)` · `--ease-travel: cubic-bezier(.77,0,.175,1)`,
plus `press-in .1s / press-out .16s / press-scale .985 / label-travel 6px / response .18s`.
À poser en tête du design system de Teddy avant toute autre chose : ça unifie d'un coup tout ce
qui bouge aujourd'hui avec des valeurs improvisées, et ça ne coûte pas un octet de JS.

**2. La transition de page en View Transitions natives, par parties et à quatre vitesses (RemyShoots, confirmé par Peryton)**
`@view-transition{navigation:auto}` + `view-transition-class` sur média / légende / chrome ;
média `1.6s cubic-bezier(.887,0,.113,1)`, légende `.45s cubic-bezier(.4,0,.15,1)` avec
`in-delay .45s`, direction choisie par `active-view-transition-type()`.
Sur la MPA Vite de Teddy, c'est ce qui fait que le header, l'emblème or et le ciel étoilé
**ne redémarrent pas** entre accueil, locations et book — sans SPA, sans Barba, sans JS.
(Les trois pièges sont documentés chez Peryton : `html{background-color}`,
`mix-blend-mode:normal` sur `::view-transition-old(root)`, `opacity:0` à 0 % sur la page entrante.)

**3. Le hover « momentum » par vitesse du curseur (LxL Creative)**
InertiaPlugin alimenté par la vélocité réelle du pointeur : `velocity = delta × 30` clampé
`±1080`, rotation = produit vectoriel normalisé `× 20` clampé `±60`, `resistance: 200`.
Remplace le hover magnétique actuel de Teddy sur la grille de services et la galerie : l'élément
ne répond plus à *où* est le curseur mais à *comment* il est arrivé — donc il ne fait jamais deux
fois le même geste.

**4. Le preloader qui plonge dans le logo, avec son double filet (GM Studios)**
SVG plein écran, lettres en découpe, `scale 1 → 80` en `duration:.7, delay:.25, ease:"expo.in"`,
pivot sur `svgOrigin` corrigé optiquement (`centreX - 10.5`, `centreY + 2.36`), scroll verrouillé.
Filet 1 : `prefersReducedMotion()` saute tout. Filet 2 : `animation: 0s 4s forwards` →
`visibility:hidden` en CSS si le JS ne vient jamais, plus un `<noscript>`.
L'emblème or de Teddy est déjà là : c'est le geste d'ouverture le plus fort du lot pour le prix
le plus bas, et il remplace n'importe quel preloader WebGL.

**5. La matière : grain en `steps()`, halo en trois `drop-shadow`, marquee à vitesse constante (Velour + GM)**
Grain : `inset:-40%`, `180%`, `background-size:9rem`, `mix-blend-mode:soft-light`, `opacity:.055`,
`animation:.9s steps(2,end) infinite` (il saute, il ne glisse pas) — et une seconde tuile
décalée de `197px 113px` pour casser la répétition.
Halo anamorphique : `drop-shadow(0 0 1.5px #ffdb9b99) drop-shadow(0 -1px 5px #ff642094) drop-shadow(0 2px 9px #5596be47)`.
Marquee : `durée = largeurPiste / 60 px·s⁻¹` posé en variable CSS, `paused` par défaut, libéré
par un IntersectionObserver `rootMargin:"200px"`, bords en `mask-image` avec `min(220px,18%)`.
Trois détails, aucun dispositif, et c'est ce qui donne au vert nuit et à l'encre crème
la texture de pellicule que le site n'a pas encore.
