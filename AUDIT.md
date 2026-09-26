# AUDIT — teddy-studio, état au 24/09/2026

> **Phase 0 du brief.** État audité : commit `989f42c`, celui qui est en ligne.
> **Sauvegarde de cet état** : copie complète `~/teddy-studio_SAUVEGARDE_2026-09-24` + tag git local `sauvegarde-2026-09-24`.
> **Pièces sources** : inventaire du code (agent Explore, lecture seule) → [`docs/refonte/phase0/audit-code.md`](docs/refonte/phase0/audit-code.md) · mesures (agent perf-a11y) → [`docs/refonte/phase0/mesures-depart.md`](docs/refonte/phase0/mesures-depart.md) · captures → `shots/phase0/` · comparaison du menu → `ref/phase0/menu-compare/`.
> **Comment lire l'inventaire (§5)** : chaque élément a un numéro, ma recommandation (**garder / refactoriser / remplacer**) et une raison en une phrase. La colonne **Dominique** est vide : c'est la tienne (« j'aime », « à garder », « libre »). Tant qu'elle est vide, je considère tout l'existant comme potentiellement protégé.

> **⚑ Décision de Dominique du 25/09/2026** ([DECISIONS.md](DECISIONS.md)) : **toutes les photos et toutes les informations restent telles quelles.** La refonte ne porte que sur la forme : animations, couleur, design, affichage, transitions, organisation. Dans ce document, « remplacer » ou « refactoriser » s'applique donc **à la forme seulement**. Mes recommandations qui touchaient au contenu (retirer la photo du bureau, changer les photos du matériel, réécrire le texte, demander des assets) sont **annulées**. Je les laisse visibles comme constats d'audit, marquées ⚑.

---

## 0. L'essentiel

**1. Dans ses dispositifs, le site est une reproduction de peryton-film.com.**
Menu, section téléphone, galerie à glisser avec curseur « Drag », révélations floues, boutons aimantés, composition du hero, rail des lieux : tous repris de Peryton, souvent au paramètre près (`docs/spec-technique.md` le documente). S'y ajoutent sept emprunts nommés à d'autres sites primés : Ghost Pitcher, Velour, Ian Coad, LxL / Hildén & Kaira, Depo Luxe, Josh Goldsmith, RISK (§6).
Peryton lui-même n'est pas primé : simple nominé le 18/09/2026, vote encore ouvert au relevé (source : `recherche-film.md`). Le §8 du brief interdit toute reproduction d'un site existant.

**2. Ce qui rend Teddy unique n'est pas sur le site.**
- Zéro caractère éthiopique dans tout le code.
- Ni heure ni calendrier éthiopiens.
- Rien sur la renaissance du cinéma éthiopien, *Kezkaza Welafen* (2003), *Abay vs Vegas*, les 3 nominations AMAA, les salles Sebastopol ou le projet d'école.
- 5 films sur 8, sans une seule année.

**3. La preuve est fausse là où l'audience vérifie.**
- La photo « The office · Meskel Square » est une image générée par IA.
- Les photos de matériel sont des photos de catalogue (« Canon » et « RØDE » y sont lisibles), et le « drone » est une vue aérienne.
- Les 9 lieux sont des placeholders Wikimedia sous CC BY-SA.
- 2 logos clients sur 7 manquent, alors qu'ils existent dans l'extraction.

Pour un public qui « sent le faux à 100 m », c'est le premier problème du site, avant tout effet.

**4. La structure est celle d'une landing page SaaS habillée cinéma.**
- Enchaînement : hero → logos → 8 services numérotés → about → why us → lieux → kit → galerie → films → formulaire → pied « Quick Links ».
- 22 écrans de haut sur ordinateur, 24 sur téléphone (mesuré le 24/09).
- 71 déclencheurs de scroll sur l'accueil et 2 sections épinglées, dont une de 4,7 écrans pour quatre paragraphes de brochure.
- 16 des 18 tells interdits par le §8 sont présents, dont un partiellement (§7).

**5. Les mesures sont bonnes là où Lighthouse regarde, mauvaises là où le visiteur se trouve (§3).**

*Ce qui passe* :
- Lighthouse mobile 87 sur l'accueil, 95 à 99 ailleurs ;
- JavaScript à 74,7 kB gzip, contre 350 kB autorisés ;
- 88 ms d'INP.

*Ce qui ne passe pas* :
- **Sur mobile lent, l'écran de chargement cache l'accueil jusqu'à 6,8 s**, et pour toujours sans JavaScript.
- **Au clavier**, le formulaire de contact est inatteignable au chargement, la visionneuse ne s'ouvre pas, le lien d'évitement n'évite rien et le focus est invisible dans le menu.
- **En mouvement réduit**, les 9 photos des lieux disparaissent.
- **6 vidéos de galerie** se chargent dès l'ouverture, 20 écrans avant la galerie.

### Verdict par couche

| Couche | Recommandation | En une phrase |
|---|---|---|
| Structure (ordre, sections) | **Remplacer** | C'est la landing SaaS que le brief décrit ; un producteur doit trouver services, preuve et brief en 30 s, pas en 22 écrans. |
| Motion | **Remplacer** — sauf la grammaire du menu | Le système est celui de Peryton ; le seul étalon à garder est la *sensation* du menu (§1), pas sa forme. |
| Typographie | **Remplacer** | Fraunces + Archivo + Instrument Sans (Peryton utilise aussi Instrument Sans avec une serif d'affiche), sans aucune place pour le ge'ez. |
| Couleur | **Remplacer** | Basalte + encre crème + serif + terre cuite retombe dans la palette-réflexe interdite. La justification « Lalibela, scorie rouge sur basalte » (commit `dc17198`) est une vraie matière, à réexaminer en Phase 1. |
| Copy | ⚑ **Garder tel quel** (décision du 25/09) | Constat d'audit : le texte client est de la brochure (« visionary », « comprehensive »). La forme (hiérarchie, typographie, mise en page) peut lui donner plus de tenue sans changer un mot. |
| Contenu, preuves | ⚑ **Garder tel quel** (décision du 25/09) | Constat d'audit : certaines images sont faibles comme preuves (§9). Le design devra tirer le meilleur des images existantes : cadrage, rythme, mise en valeur. |
| Infrastructure (Vite, GSAP, Lenis, Pages) | **Garder**, à reconfigurer | Saine et légère : 78,2 kB de JS gzip, zéro WebGL. La migration éventuelle vers Astro se tranche en Phase 2. |

**Inventaire (§5) : 82 éléments.**

| Recommandation | Nombre |
|---|---|
| Garder | 7 |
| Refactoriser | 43 — souvent « garder le fond, refaire la forme » |
| Remplacer | 32 |

---

## 1. Le point qui conditionne tout : le menu que tu aimes vient de Peryton

**Les faits**
- **Date du code.** Le bouton et le panneau datent du premier commit (`09f6150`, 19/09) et n'ont jamais été modifiés : `git blame` ne montre que ce commit. Seule la couleur a changé, par le jeton `--gold` (`dc17198`, 24/09).
- **Le commentaire du code** (`motion.js:125`) dit : « Un seul bouton : il ouvre et il ferme, comme la référence ». Dans ce dépôt, « la référence » désigne Peryton (`docs/spec-technique.md:3`).
- **La mesure.** J'ai ouvert peryton-film.com aujourd'hui (Chrome isolé) et relevé son menu. Captures et vidéo : `ref/phase0/menu-compare/`.

| | Peryton (mesuré le 24/09/2026) | Teddy (code actuel) |
|---|---|---|
| Bouton | `button` 46 × 46 px, en haut à droite | `button` 48 × 48 px, en haut à gauche |
| Traits | 3 × 31 × 2 px, `#ecc779` | 3 × 32 × 2 px, `#ecc779` jusqu'au 24/09, puis `#db6336` |
| Transition des traits | `transform 0.5s cubic-bezier(0.7, 0, 0.3, 1)` | `transform 0.52s cubic-bezier(0.76, 0, 0.24, 1)` |
| Trait du milieu | sort par la droite (capture à 220 ms) | sort par la droite (`translateX(3rem)`), rogné par le bouton, opacité en 0,30 s |
| Traits 1 et 3 | forment une croix | forment une croix à ±45° |
| Panneau | tuile pleine page couleur d'accent, qui descend du haut | tuile pleine page couleur d'accent, qui descend du haut en 0,72 s |
| Liens | serif, centrés : Home, Über Uns, Referenzen, Leistungen | serif Fraunces, 9 liens + une donnée à droite, arrivée en cascade (45 ms d'écart) |
| Libellé ARIA | « Menü öffnen und schließen » | « Open and close the index » — la traduction mot à mot |

![Menu de Peryton : fermé, 220 ms, 440 ms, 1 500 ms](ref/phase0/menu-compare/planche-peryton-menu.jpg)

**Pourquoi il marche.** C'est ça qu'il faut garder : tu m'as demandé d'en faire l'étalon des micro-interactions.

1. **Une seule courbe, très « in-out »** (0.76, 0, 0.24, 1) : départ retenu, milieu rapide, arrivée amortie. Le geste a du poids, il ne glisse pas. Bouton (0,52 s) et panneau (0,72 s) partagent la même courbe, donc on lit un seul geste, pas deux animations.
2. **Une métamorphose, pas un remplacement.** Les traits *deviennent* la croix. L'œil suit un seul objet qui change d'état ; rien n'apparaît ni ne disparaît au hasard.
3. **Le trait du milieu quitte le champ.** Le bouton coupe ce qui dépasse (`overflow: hidden`) : le trait sort latéralement comme un objet qui sort du cadre. Son opacité s'éteint en 0,30 s, bien avant la fin de son mouvement (0,52 s) : on le lit « parti » avant qu'il ne soit arrivé.
4. **Tout se chevauche.** Les liens partent à 0,18 s, quand la tuile n'est qu'à mi-course. L'écart entre liens est minuscule (45 ms) : une cascade, pas une file d'attente. Tout est posé vers 1,16 s.
5. **Ouvrir est une mise en scène, fermer est un outil.** À la fermeture, les liens disparaissent net et la tuile remonte : on ne fait jamais attendre quelqu'un qui veut partir.
6. **La couleur bascule d'un coup, et le geste est réversible.** Pas de fondu de couleur, un seul changement d'état net. Les transitions CSS s'inversent en plein vol si on reclique.

**Ses défauts actuels** (inventaire, n° 7–8)
- Lenis n'est pas stoppé quand le menu est ouvert sur 4 pages : `scroll.js` écoute `menu:open`, que rien n'émet.
- Le CTA du panneau est hors de la boucle de focus.
- L'ancien vert `#182d19` est écrit en dur dans le panneau.
- À la fermeture, `hidden` est posé à 520 ms, quand la tuile n'a fait que **90 % de sa course** (mesuré). Les ~88 px restants sautent en une image.
- Aucun `inert` sur le reste de la page.
- Mesuré au clavier (perf-a11y) :
  - le contour de focus orange est posé sur la tuile orange : contraste 1:1, **focus invisible** ;
  - Tab sort du menu vers deux éléments invisibles de la barre ;
  - la donnée à droite des liens est à 2,44:1 de contraste ;
  - sur les pages secondaires, **la page défile derrière le menu ouvert** ;
  - la fonte des liens (Fraunces, 121 kB) n'est téléchargée qu'au premier clic sur les pages secondaires.

**La référence « avant » existe** : vidéo, GIF temps réel et GIF décomposé image par image (40 ms), à 1440 et 390, ouverture et fermeture, avec les valeurs lues pendant l'animation. Fichiers : `shots/phase0/menu/1440/` et `shots/phase0/menu/390/`, planche `menu-1440-open-planche.jpg`. Tout refactor sera comparé à ces fichiers.

**Ma recommandation : refactoriser.** Garder la sensation (points 1 à 6, mêmes durées, même courbe, même chorégraphie) et changer la forme — l'icône et le panneau — pour qu'elle ne soit plus celle de Peryton. Je te montre l'avant / après en vidéo avant de toucher à quoi que ce soit.
- **Alternative A** : le garder tel quel, en assumant une parenté visible avec Peryton, contraire au §8.
- **Alternative B** : le déclarer « libre ».

C'est ta décision.

---

## 2. Stack, structure, dépendances

**La pile**
- **Vite 6.4.3** multi-pages : 6 pages HTML, assemblées par un plugin d'inclusion maison.
- **GSAP 3.15.0** : ScrollTrigger, SplitText, Observer, InertiaPlugin.
- **Lenis 1.3.26**.
- Aucun framework. **Zéro canvas, zéro WebGL** : Three.js, le ciel étoilé et le maillage de « la feuille » ont été retirés entre le 22 et le 24/09.

**Publication** : GitHub Pages par Actions (Node 22, `SITE_BASE`, `rebase.mjs`) sur `viudesdominique12-droid.github.io/teddy-studio`.

**Poids du JavaScript** : **201,3 kB minifié, soit 78,2 kB gzip**, tous morceaux confondus (mesuré par `researcher-tech`). Le « 195 ko » de l'historique était du minifié non compressé : le budget du brief (350 kB) s'exprime en gzip.

**Charge de l'accueil**
- 71 déclencheurs ScrollTrigger, dont 38 pour les seules révélations.
- 2 épinglages.
- Une boucle continue : le ticker GSAP, qui porte Lenis.
- 32 éléments `<video>` dans la galerie à 1440 px.

**Code inerte**
- `actCards`, `openVideo`, `fitHeadline`, la branche `.open` de la barre.
- Une quinzaine de règles CSS sans cible (`.pre*`, `.sky__*`, `.emblem`, `.films*`, `.con*`…).
- Deux fichiers CSS qui se contredisent : `pages.css` contre `components.css`.
- `fit.js` est chargé sur l'accueil pour rien.

**Documentation périmée**
- `README.md` décrit encore le concept vert, Bricolage et Martian.
- `package.json` s'appelle « Green Light ».
- Plusieurs commentaires parlent du ciel étoilé ou de Three.js.

Détail complet : `audit-code.md` §1.

**Une question qui sera pour la Phase 2.** Le brief propose Astro par défaut. Faits relevés :
- Astro 7.3.5 impose Node ≥ 22.12 et Vite 8.
- Il ne supprime pas le préfixage manuel des liens sous `base`.
- Garder **un seul contexte WebGL d'une page à l'autre** exige un routeur côté client : ClientRouter d'Astro, Swup ou Barba (5,6 à 10,4 kB gzip).
- Les transitions de vue natives entre pages ne coûtent aucun JS, mais recréent le canvas à chaque page (`recherche-tech.md`).

Je trancherai à partir de la direction choisie en Phase 1, pas avant.

---

## 3. Mesures de départ

Mesuré par l'agent perf-a11y du 24/09 23 h au 25/09 3 h 45, sans toucher au dépôt. Rapport complet, méthodes et commandes : [`mesures-depart.md`](docs/refonte/phase0/mesures-depart.md).

**Méthode**
- Le site en ligne est bien le commit audité : ses 10 fichiers compilés sont identiques, octet pour octet, à un build local.
- Tout ce qui dépend du processeur est mesuré avec un ralentissement ×4.
- Le rendu du navigateur de test est logiciel : aucune conclusion n'est tirée sur la fluidité GPU.

### Contre le budget du brief

| Poste | Seuil | Mesuré | Verdict |
|---|---|---|---|
| **Accueil visible (mobile lent réel)** | LCP < 2,5 s | Lighthouse annonce 1,43 s, mais l'écran de chargement couvre l'accueil jusqu'à **6,80 s** ; titre net à **7,30 s** ; Speed Index 8,44 s | **hors budget** |
| LCP `works` mobile | < 2,5 s | 2,69 s | hors budget (léger) |
| CLS au chargement | < 0,1 | 0,000 à 0,021 ; `book` mobile 0,097–0,099 | OK (`book` au seuil) |
| CLS au défilement, 1440 | < 0,1 | ≈ **2,95** aux bords des deux sections épinglées. Chrome le compterait ; saut visible à l'œil non vérifié | **hors budget** |
| INP (labo, CPU ×4) | < 200 ms | **88 ms** au pire sur 45 interactions | OK |
| JavaScript | < 350 kB gzip | **74,7 kB** (accueil), dont GSAP 69 % | OK |
| Images | AVIF/WebP + `srcset` | 0 AVIF ; 14 images sur 28 sans `srcset` sur l'accueil (dont un micro de 318 kB) | hors budget |
| Vidéos | poster + chargement différé | posters présents, **mais 6 vidéos de galerie (0,73–0,85 Mo) chargées à l'ouverture**, 20 écrans avant la galerie ; `works` charge la vidéo ordinateur (2,2 Mo) même sur téléphone | **hors budget** |
| WebGL | un seul contexte | 0 | sans objet |
| Mouvement réduit | respecté, avec une version belle | les **9 photos des lieux disparaissent** ; à 390, **3 arguments sur 4 de « Why us » sortent de l'écran** ; le curseur personnalisé continue d'amortir | **hors budget** |
| Sans JavaScript | contenu lisible | **l'accueil est illisible** : l'écran de chargement reste pour toujours. Les autres pages sont lisibles | **hors budget** |
| Clavier, focus | clavier complet, focus dessiné | voir le détail ci-dessous | **hors budget** |
| Contrastes | AA | 5 couples en échec (menu 2,44:1 et 2,88:1, générique 3,83 et 4,09, « optional » 3,19) | hors budget |
| Fluidité 60 fps sur téléphone | 60 fps | non mesurable ici. Le fil principal est sain (p95 16,8 ms, 0 à 1 tâche longue), mais 40 à 56 calques composités à 1440 | à mesurer sur un vrai téléphone |

**Clavier et focus, le détail**
- 15 contrôles de l'accueil sont hors tabulation au chargement, **dont tout le formulaire de contact**.
- La visionneuse ne s'ouvre pas au clavier.
- Le lien d'évitement n'évite rien.
- Le focus est invisible dans le menu.
- 4 liens sociaux en `href="#"` sur chaque page.

### Lighthouse en ligne (GitHub Pages), médianes

| Page | Mobile — Perf / A11y / BP / SEO | Desktop — Perf / A11y / BP / SEO |
|---|---|---|
| index | 87 / 89 / 100 / 100 | 92 / 93 / 100 / 100 |
| locations | 99 / 96 / 100 / 100 | 100 / 100 / 100 / 100 |
| works | 96 / 96 / 100 / 100 | 100 / 100 / 100 / 100 |
| book | 95 / 93 / 100 / 100 | 100 / 96 / 100 / 100 |
| vacancy | 96 / 96 / 100 / 100 | 100 / 100 / 100 / 100 |
| 404 | 97 / 96 / 100 / **54** (pas de description) | 96 / 100 / 100 / 54 |

**Ces scores sont bons, et c'est le piège.** Lighthouse ne voit ni l'écran de chargement qui cache l'accueil jusqu'à 6,8 s, ni ce qui échappe au clavier, ni ce qui casse en mouvement réduit.

### Poids et travail permanent

**Accueil, premier écran**
- 1,5 Mo à 390 et 1,6 Mo à 1440, dont 0,73 à 0,85 Mo de vidéos de galerie.
- Puis +3 Mo pendant la descente.

**Tout le site**
- `dist` pèse 24,3 Mo, dont **36 fichiers (5,2 Mo) jamais référencés**.
- 3 fontes variables (268 kB), aucune préchargée.
- GitHub Pages sert en gzip seulement, avec un cache de 10 minutes sur tout.

**Même immobile, le site travaille**
- Le balayage lumineux du titre réécrit un style **120 à 150 fois par seconde, en permanence**, même quand le hero est 20 écrans plus haut.
- S'y ajoutent le grain plein écran en fusion, deux pastilles qui pulsent et l'indicateur « Scroll ».
- 11 `will-change` permanents à 1440.

### Défauts relevés en plus de l'inventaire du code
- **« Add to sheet » ouvre aussi la visionneuse** (au clic, au doigt et à Entrée), parce que le bouton est dans l'élément cliquable de l'image.
- Le titre « Why Teddy Studio » se lit « WhyTeddy Studio » à 390 (il manque une espace entre deux `span`).
- Le lien « Start » de la barre n'a pas de nom accessible sous 480 px.
- Les segments de la barre de montage sont des cibles de 4 à 10 px de haut.

---

## 4. Captures commentées

Les storyboards 390 / 768 / 1440 capturent l'entrée de chacune des 10 scènes, plus les deux sections épinglées à 25, 50 et 75 % : `shots/phase0/storyboard/`. Ce que j'y vois :

- **Hero** (`01-gateway`)
  - Le titre « AFRICA » en Fraunces 800 porte l'écran.
  - Le clap à 50 % d'opacité derrière reste illisible comme objet.
  - Le bandeau de données en capitales espacées se lit comme un tableau de bord.
- **Services** (`03-services`)
  - Un service ouvert, sept pâles.
  - Sur téléphone, un producteur voit 5 services sur 8 et une seule description.
- **Why us** (`05-why-us*`)
  - Le téléphone devant un « TEDDY STUDIO » géant et flou : c'est la composition « HYPE » de Peryton.
  - Les arguments sont en petites capitales orange et gris sur noir. À 390, pendant l'épinglage, les textes sont presque invisibles.
- **Locations** (`06-locations*`)
  - Le moment le plus fort du site : les photos qui flottent autour de « One base. 4,675 metres of range. One permit jurisdiction. »
  - Mais le titre passe sur les photos, et en mouvement réduit elles disparaissent (`reduced-motion/storyboard/*/06-locations.jpg`).
- **Resources, galerie, films, call sheet** (`07` à `10`) : des rangées et des grilles clonées. Le titre en creux « Shot in Ethiopia » derrière la grille est illisible.
- **Sur téléphone, sur chaque écran**
  - Le dock « Call sheet » et la barre de montage occupent ensemble le bas de l'écran, sous la barre de Safari.
  - Avec la barre du haut, c'est environ 20 % de l'écran pris par l'interface, en permanence.
- **Ta capture iPhone du 23/09** (ancienne version verte) : même constat. On y voyait aussi l'altimètre chevaucher « The nine, in full » (corrigé le jour même à 11 h 32) et le lien d'évitement dépasser sous la barre d'état.

**Autres dossiers**
- `shots/phase0/menu/` : la référence « avant » du menu.
- `clavier/` : les 40 premiers arrêts Tab, le menu, les formulaires, « Add to sheet » qui ouvre la visionneuse.
- `sans-js/` : l'accueil couvert par l'écran de chargement.
- `reduced-motion/`.
- `pages/` : les pages secondaires, écran par écran.
- `lighthouse/` : 32 rapports.

---

## 5. Inventaire numéroté

Numéros identiques à `audit-code.md` §2, où chaque élément a ses fichiers, lignes et valeurs.

**Origine**

| Code | Signification |
|---|---|
| **Pery** | repris de peryton-film.com |
| **Emp** | emprunt nommé à un autre site primé |
| **Cl** | contenu du site client (verbatim) |
| **Pr** | propre au projet |

**Recommandation** : **G** garder · **Rf** refactoriser · **Rp** remplacer. « (retirer) » veut dire remplacer par rien.

### Coquille commune (toutes les pages)

| # | Élément | Origine | Reco | Raison | Dominique |
|---|---|---|---|---|---|
| 1 | `<head>` : favicon, icône Apple, `theme-color` | Pr | **Rf** | Ils montrent encore le canon or sur vert de la direction abandonnée : première impression incohérente dans l'onglet. | |
| 2 | Lien d'évitement « Skip to content » | Pr | **Rf** | Indispensable, mais **inopérant** : Entrée ne déplace pas le focus (mesuré). À réparer, à restyler sans capitales, à vérifier sur iPhone (visible sur ta capture du 23/09). | |
| 3 | Calque de lumière `.depth` (dégradé fixe) | Pery → Pr | **Rp** | Dégradé d'ambiance générique ; la lumière réelle d'Addis peut prendre cette place. | |
| 4 | Grain pellicule plein écran | Emp (Velour) | **Rp** (retirer) | Interdit par le §8 ; valeurs identiques à Velour ; calque en fusion au-dessus du contenu, animé sans fin. | |
| 5 | Barre du haut (masquée au scroll) | Pr | **Rf** | Sa fonction sert le producteur pressé (appeler, briefer) ; le verre dépoli (§8) et la branche morte partent. | |
| 6 | Logo client + filet animé | Cl + Pr | **Rf** | Le logo est au client et ne se redessine pas ; le filet, reste du « feu vert », ne s'anime que sur l'accueil. | |
| 7 | **Bouton menu (trois traits orange)** — PROTÉGÉ | Pery | **Rf** | Voir §1 : sensation gardée à l'identique, forme à changer parce qu'elle reproduit Peryton. | |
| 8 | **Panneau Index (menu plein écran)** — PROTÉGÉ | Pery | **Rf** | Même origine ; plus quatre défauts (§1). | |
| 9 | Horloge de la barre | Pr | **Rf** | Graine du brief (l'heure d'Addis) ; aujourd'hui heure occidentale seulement, libellé en capitales espacées. | |
| 10 | Téléphone de la barre | Cl | **G** | Appeler en un clic un bureau ouvert 24/7, c'est exactement « utilisable en 30 secondes ». | |
| 11 | CTA « Start a production » (barre) | Pr + Pery | **Rf** | Fonction indispensable ; capitales espacées et aimant de Peryton à retirer. | |
| 12 | Pied de page | Cl + Pr | **Rp** | « Quick Links », « visionary », réseaux en `href="#"`, ancre `#clients` cassée, © 2024 en dur : un pied de page de template. | |
| 13 | Dock « Call sheet » | Pr | **Rf** | Graine du brief ; trop pauvre (3 sources de lignes), frappé lettre à lettre, et sur téléphone il s'empile avec la barre de montage. | |
| 14 | Curseur personnalisé + pastille « Drag » | Pery | **Rp** (retirer) | Interdit par le §8 ; repris de Peryton ; le curseur natif reste affiché, donc deux curseurs. | |
| 15 | Transition de page en chevron | Emp (RISK) | **Rp** | Emprunt ; un chevron ne dit rien de Teddy ; le système de transitions se décide en Phase 2. | |
| 16 | Visionneuse d'images | Pr | **Rf** | Voir les images en grand sert le producteur (le site source l'avait) ; mais **elle ne s'ouvre pas au clavier** (21 déclencheurs non focalisables) ; verre dépoli et compteur « i / n » à reprendre. | |
| 17 | Défilement Lenis | Pery (socle) | **G** | Infrastructure saine, tactile natif ; à reconfigurer (absent de `book.html` ; Lenis 1.3.26 gère seul le mouvement réduit). | |
| 18 | Révélations « blur-in » | Pery | **Rp** | Système de Peryton au paramètre près ; « fade-and-slide-up par section » interdit ; rejoue à chaque remontée. | |
| 19 | Boutons aimantés | Pery | **Rp** (retirer) | Gadget sans rapport avec le métier. | |
| 20 | Boutons et liens (`.btn`, `.lnk`) | Pr | **Rp** | « → » collé, capitales espacées, remplissage qui monte : le kit de bouton par défaut. | |
| 21 | Bascule `?palette=` | Pr | **Rp** (retirer) | Outil de comparaison, pas une fonction ; à retirer une fois la couleur tranchée. | |
| 22 | Pastille qui pulse (`.go-dot`) | Pr | **Rp** | Le point « en direct » qui pulse est un cliché de tableau de bord, reste du « feu vert ». | |
| 23 | Focus, sélection, mouvement réduit global | Pr | **Rf** | Socle d'accessibilité à garder ; le brief veut un focus *dessiné*, pas un contour standard. | |

### Accueil — `index.html`

| # | Élément | Origine | Reco | Raison | Dominique |
|---|---|---|---|---|---|
| 24 | Écran de démarrage (compteur « 000 → 100 ») | Pr | **Rp** | Préloader à compteur interdit par le §8 ; **il cache l'accueil jusqu'à 6,8 s sur mobile lent, et pour toujours sans JavaScript** (mesuré) ; le brief propose à la place un rituel Sebastopol court, une fois. | |
| 25 | Hero : composition | Pery | **Rp** | Titre géant + objet qui le chevauche + paragraphe : c'est le hero de Peryton (« HYPE » + cerf ailé). | |
| 26 | Sur-titre « Film service & production across Ethiopia » | Pr | **Rf** | Seule ligne du hero qui dit le métier et le lieu : l'information reste, la forme suivra le concept. | |
| 27 | Titre « Gateway to Africa » | Cl + Pery | **Rp** | Contraste fin / gras dans un titre (§8). Le slogan du client ne passe pas le test « une autre boîte de prod pourrait-elle le dire ? », et l'Éthiopie n'est pas « l'Afrique ». Le garder ou non se décide avec le client. | |
| 28 | Titre éclairé (balayage + halo) | Emp (Ian Coad) | **Rp** (retirer) | Emprunt ; animation infinie non déclenchée (le brief n'en admet qu'une par page) qui **réécrit un style 120 à 150 fois par seconde, en permanence** (mesuré) ; or `#ecc779` en dur. | |
| 29 | Entrée du hero | Pery | **Rp** | Valeurs de Peryton (y 2,5rem, flou 12 px, 0,9 s, décalage 0,12). | |
| 30 | Clap SVG et son geste | Pr (demande du partenaire) | **Rf** | Graine du brief (métadonnées de plateau), geste bien écrit (armer lent, tomber vite, rebond de 2,2°) ; mais un clap est le symbole cinéma par défaut, posé derrière le titre à 50 %. | |
| 31 | Chapô du hero | Pr | **Rf** | Bon fond (permis, lieux, équipe, kit, logistique ; du Simien au Danakil ; une juridiction) ; à réécrire avec des preuves. | |
| 32 | CTA du hero | Pr + Pery | **Rf** | Doublon du CTA de la barre ; aimant et capitales espacées à retirer. | |
| 33 | Bandeau Addis / Zone / Light / Desk | Pr | **Rf** | Graine du brief (horloge + lumière) ; « open now » est toujours vrai, pas d'heure éthiopienne, lever / coucher calculés une fois (arrondi « :60 » possible). | |
| 34 | Indicateur « Scroll » | Pr | **Rp** (retirer) | Animation infinie décorative. | |
| 35 | Mur de clients | Cl + Pr | **Rp** | Mur de logos sans contexte (cliché relevé par la recherche) ; 2 logos manquent alors qu'ils sont dans l'extraction ; « They have already shot with us » affirme plus que la source (« Our Clients »). | |
| 36 | Hover à inertie (logos, caisses) | Emp (LxL, Hildén & Kaira) | **Rp** (retirer) | Repris au chiffre près ; des logos qui virevoltent ne prouvent rien. | |
| 37 | Survol qui éteint les voisins | Emp (Depo Luxe) | **Rf** | Motif utile pour lire une liste, mais aux valeurs de Depo Luxe : à réécrire dans le système de motion propre à Teddy. | |
| 38 | Services : en-tête « What we handle » | Pr + Cl | **Rf** | Le titre est une bonne phrase de plateau ; le chapô « comprehensive range… » est de la brochure. | |
| 39 | Services : tableau 01–08 en accordéon au scroll | Pr + Emp | **Rp** | 01–08 sur du non-séquentiel (§8) ; 7 services sur 8 cachés à tout instant ; tu l'as déjà jugé « débutant » le 19/09. | |
| 40 | About : photo « The office · Meskel Square » | Cl | ⚑ **Photo gardée** — forme **Rf** | Constat : l'image a l'aspect d'une image générée (claps illisibles). Décision du 25/09 : elle reste, seule sa présentation change. | ⚑ garder la photo |
| 41 | About : trois fiches (fondateur, adresse, horaires) | Pr (demande du partenaire) | **Rf** | La demande est juste (faits isolés, texte plus grand) ; la forme « cartes identiques » est interdite par le §8. | |
| 42 | About : texte + signature Sebastopol | Cl + Pr | **Rp** | Brochure (« visionary », « prominent ») ; aucun des vrais faits du §1 du brief. | |
| 43 | Why us : section téléphone épinglée | Pery | **Rp** | Reproduction la plus directe de Peryton ; un téléphone vend de la pub sociale, pas un service de tournage ; 4,7 écrans épinglés pour quatre paragraphes de brochure. Mesuré : textes quasi invisibles à 390 pendant l'épinglage ; en mouvement réduit, 3 arguments sur 4 hors de l'écran à 390. | |
| 44 | Locations : rail « descente » | Pery + Pr | **Rf** | L'idée (les 9 lieux rangés par altitude, du Simien au Danakil) est propre à Teddy ; le mécanisme (cartes flottantes sur une scène épinglée) vient de Peryton. Mesuré : **en mouvement réduit, les 9 photos disparaissent** ; décalage de mise en page ≈ 1 à chaque bord d'épinglage. | |
| 45 | Locations : message central | Pr + Cl | **Rf** | « One base. 4,675 metres of range. One permit jurisdiction. » est la meilleure phrase du site : à garder ; le chapô « stunning locations » part. | |
| 46 | Altimètre | Pr | **Rf** | Graine forte (l'altitude comme donnée de production) ; figé sur deux segments à cause de Winding Road ; halo vert en dur. | |
| 47 | Resources : en-tête | Pr + Cl | **Rf** | « The kit travels with you » tient ; le chapô est de la brochure. | |
| 48 | Resources : six caisses | Cl + Pr | **Rp** (forme) — ⚑ photos et textes gardés | Rangées clonées (§8) ; **« Add to sheet » ouvre aussi la visionneuse**, et est hors tabulation au chargement (mesuré). Constat : les photos ont un aspect catalogue et le « drone » est une vue aérienne ; décision du 25/09 : elles restent. On garde l'ajout à la call sheet et les trois mentions « 12K / Cinematic / Professional ». | ⚑ garder photos et textes |
| 49 | Resources : entrée en pile | Pr | **Rp** | Fondu-glissé par section (§8). | |
| 50 | Galerie infinie + « Drag » | Pery | **Rp** | Reproduction de Peryton (32 vidéos à 1440 px, **dont 6 téléchargées dès l'ouverture de l'accueil**, mesuré). On garde ton besoin du 19/09 : une zone dédiée où les images flottent et se manipulent. | |
| 51 | Galerie : titre en contour, légende, indice | Pery | **Rp** | Composition de Peryton ; texte en contour = cliché ; or en dur. | |
| 52 | Générique : films | Cl + Pr | **Rf** — priorité contenu | La filmographie est la preuve la plus rare de Teddy, réduite à 5 titres sans années ; une association d'affiche à confirmer (§9). | |
| 53 | Générique : clients et fin | Pr | **Rf** | Doublon du mur de clients ; « → » collé. | |
| 54 | Call sheet : en-tête | Pr | **Rf** | « Draft request — not a booking confirmation » est la langue exacte d'un producteur : le fond reste. | |
| 55 | Call sheet : journal « Collected as you went » | Pr | **Rf** | Graine du brief ; trop pauvre aujourd'hui. | |
| 56 | Call sheet : formulaire 5 champs + mailto | Cl + Pr | **Rp** | Formulaire générique en fin de page (§8), sans repli si pas de client mail ; **inatteignable au clavier au chargement**, erreurs non reliées aux champs (mesuré) ; le brief veut un document de production prêt à envoyer. | |
| 57 | Call sheet : pied Office / Call / Email / Open | Cl | **G** | Coordonnées exactes et utiles ; à restyler. | |
| 58 | Barre de montage + timecode | Emp (Ghost Pitcher) | **Rp** | Emprunt ; le timecode ne mesure rien de réel ; sur téléphone elle s'empile avec le dock. | |
| 59 | Feuille d'impression (call sheet seule) | Pr | **G** — à étendre | Imprimer en PDF coûte 0 kB et garde le ge'ez : c'est la base de la sortie « document de production ». | |
| 60 | Méta, OG, JSON-LD | Pr | **Rf** | `og.jpg` montre l'ancienne direction verte ; seule l'accueil a des balises OG. | |

### `locations.html`

| # | Élément | Origine | Reco | Raison | Dominique |
|---|---|---|---|---|---|
| 61 | Préchargement de la première image | Pr | **G** | Bonne pratique d'affichage rapide. | |
| 62 | En-tête (chapô brochure en H1) | Cl + Pr | **Rp** | « Stunning locations » mis en gras dans le titre (§8), méta-chaîne, eyebrow en capitales. | |
| 63 | Liste des 9 lieux | Pr | **Rp** | Rangées alternées clonées ; photos CC BY-SA (obligation de partager à l'identique) ; aucune donnée de production par lieu (accès, permis, altitude, lumière). | |
| 64 | CTA de fin | Pr | **Rf** | « We scout, we clear the permits, we get the trucks there. » est juste ; la forme suivra. | |

### `works.html`

| # | Élément | Origine | Reco | Raison | Dominique |
|---|---|---|---|---|---|
| 65 | En-tête | Pr + Cl | **Rf** | Eyebrow en capitales espacées. | |
| 66 | Films (5 rangées) | Cl + Pr | **Rf** — priorité contenu | Comme n° 52. | |
| 67 | Note « Ask us for press kits » | Pr | **Rf** | Phrase utile ; « → » collé. | |
| 68 | Ident Sebastopol (vidéo) | Cl | **G** — matière première | La vraie séquence de la société sœur : c'est la matière du « rituel Sebastopol » proposé par le brief. À corriger : la version ordinateur (2,2 Mo) est chargée même sur téléphone, alors que la version mobile existe (mesuré). | |
| 69 | Clients (grille 4 colonnes) | Cl + Pr | **Rp** | Cellules clonées ; deux cases vides alors que les logos existent. | |
| 70 | CTA de fin | Pr | **Rf** | La forme suivra. | |

### `book.html`

| # | Élément | Origine | Reco | Raison | Dominique |
|---|---|---|---|---|---|
| 71 | En-tête « Tell us what you're shooting. We'll clear the way. » | Pr | **Rf** | Le copy parle comme un producteur : il reste ; la forme change. | |
| 72 | Rail d'étapes | Pr | **Rf** | À fondre dans la call sheet. | |
| 73 | Étape 1 — type de projet, titre | Pr | **Rf** | Bonne structure de brief. Comme les étapes 2 à 5 : séparée de la call sheet, dont elle n'emporte pas les lignes. | |
| 74 | Étape 2 — dates et degré de certitude | Pr | **Rf** | « Locked / Likely / Still exploring » : du vrai vocabulaire de production. | |
| 75 | Étape 3 — lieux | Pr | **Rf** | À relier aux lieux vus pendant la visite. | |
| 76 | Étape 4 — services, kit, effectif | Pr | **Rf** | À relier au kit ajouté pendant la visite. | |
| 77 | Étape 5 — contact + créneau converti en heure d'Addis | Pr | **Rf** | La conversion d'heure est une vraie attention de producteur : à garder. | |
| 78 | Synthèse et envoi par mailto | Pr | **Rp** | mailto seul : rien ne part sans client mail ; la sortie se décide en Phase 2 (PDF, mailto structuré, service de formulaire). | |

### `vacancy.html` et `404.html`

| # | Élément | Origine | Reco | Raison | Dominique |
|---|---|---|---|---|---|
| 79 | En-tête | Pr | **Rf** | Eyebrow en capitales espacées. | |
| 80 | État « No Vacancies Currently Available » | Cl | **G** | Honnête et vrai. | |
| 81 | Archive et sélecteur de poste | Cl + Pr | **Rf** | Annonce verbatim générique ; méta-chaînes, « → ». | |
| 82 | 404 « Not cleared. » | Pr | **Rf** | « No permit for this address » est du vocabulaire propre à Teddy : l'idée reste, la forme suit (et il lui manque une méta-description : SEO 54). | |

**Ce que je garde comme graines**, conformément au brief. Ce sont des idées, pas des exécutions :
- la call sheet qui se remplit (13, 54, 55, 59) ;
- l'horloge et la fenêtre de lumière (9, 33) ;
- les métadonnées de plateau du clap (30) ;
- l'ordre des lieux par altitude et l'altimètre (44, 46) ;
- l'ident Sebastopol (68) ;
- la structure du brief de production (73–77) ;
- le vocabulaire du permis (82).

---

## 6. Parenté et emprunts, élément par élément

| Dispositif chez Teddy | Source | Preuve |
|---|---|---|
| Menu (bouton + panneau) | peryton-film.com | Mesure comparée (§1) ; `motion.js:125` ; commit `09f6150` |
| Section téléphone épinglée (Why us) | peryton-film.com | `docs/spec-technique.md` §6 (« pin +=470% », mêmes phases) |
| Galerie infinie à glisser + curseur « Drag » | peryton-film.com | spec §5 (Observer + quickTo, 1,2 s `expo.out`) |
| Révélations floues | peryton-film.com | spec §2 (flou, y 16, 0,8 s, `power3.out`) |
| Boutons aimantés | peryton-film.com | spec §7 (`elastic.out(1, 0.3)`) |
| Composition du hero + entrée | peryton-film.com | spec §3 |
| Rail des lieux (cartes flottantes épinglées) | peryton-film.com | commentaires `acts.css:527-531`, `acts.js:189, 232, 237` |
| Palette d'origine (vert nuit, crème, or) | peryton-film.com | spec « Palette (identique à la référence) » |
| Parité du défilement téléphone / ordinateur | peryton-film.com | `studio/06` du 19/09 ; Peryton mesuré à 27,3 contre 27,1 écrans |
| Barre de montage + timecode | Ghost Pitcher | `docs/recherche/07-synthese.md` B1 |
| Grain animé en `steps(2)` | Velour | synthèse B6 (valeurs identiques) |
| Titre éclairé (balayage + bloom + halo) | Ian Coad | synthèse B5 |
| Hover à inertie | LxL Creative, Hildén & Kaira | synthèse B3 (« au chiffre près ») |
| Survol qui éteint les voisins | Depo Luxe | synthèse B2 |
| Tampon en paliers | Josh Goldsmith | synthèse B7 |
| Transition chevron | RISK | synthèse, lot 5 |

La passe précédente n'a pas collé de code : elle a *réécrit* ces dispositifs, mais avec leurs valeurs et leurs compositions. Au regard du §8 (« aucune reproduction d'un site existant »), le résultat est le même. **Ma recommandation : tout ce tableau part, sauf la sensation du menu si tu la protèges.**

---

## 7. Tells de génération automatique relevés (§8)

**16 des 18 tells interdits sont présents**, dont le texte révélé par morceaux partiellement. Seuls le marquee et le bento sont absents. Chaque occurrence, avec fichier et ligne, est dans `audit-code.md` §4.

| Tell | Où, principalement |
|---|---|
| Préloader à compteur | boot de l'accueil (« Loading reel 000 → 100 ») |
| Curseur avec label | pastille « Drag » (6 pages) |
| Grain global | `body::after`, plein écran, animé |
| Verre dépoli | barre, barre de montage, visionneuse |
| Cartes identiques | fiches About, caisses, cartes de galerie, tirages, clients |
| Survol qui monte ou zoome | affiches, bureau, caisses, lieux, boutons |
| « → » collé aux liens | `.lnk` et 5 libellés |
| Capitales espacées | 64 règles `uppercase`, `--ls-eyebrow` utilisé 36 fois |
| Méta-chaînes « A · B · C » | panneau Index, About, crédits photo, vacancy… |
| Pseudo-mono pour les données | classe `.mono`, une centaine d'usages (c'est en fait Instrument Sans) |
| 01/02/03 sur du non-séquentiel | services 01–08 |
| Un mot marqué dans un titre | « stunning locations », « Triangle », « Africa » |
| Fondu-glissé par section | système de révélation, 19 cibles sur l'accueil |
| Texte révélé par morceaux | par lignes (titres), par caractères (dock) |
| « Quick Links » | pied de page |
| Formulaire générique en fin de page | call sheet, book |

**Autres points interdits**
- **Copy** : « visionary » ×2, « cutting-edge », « seamless », « comprehensive » ×3 ; même registre : « stunning », « pristine », « limitless », « one-stop », « elevate ».
- **Palette-réflexe** : crème + serif + terre cuite.

---

## 8. Copy : ce qui vient du client, ce qui tient, ce qui part

> ⚑ **Décision du 25/09 : aucun texte ne change.** Ce qui suit reste un constat d'audit. Le travail portera sur la façon de présenter ces textes (hiérarchie, typographie, rythme, organisation), pas sur les mots.

- **Le texte du client** (About, Why us, chapôs, textes du kit) est de la brochure, sans aucune preuve.
- **Les phrases écrites ensuite qui passent déjà le test** (« une autre boîte de prod pourrait-elle le dire ? ») :
  - « One base. 4,675 metres of range. One permit jurisdiction. »
  - « Draft request — not a booking confirmation »
  - « Tell us what you're shooting. We'll clear the way. »
  - « We scout, we clear the permits, we get the trucks there. »
  - « No permit for this address. »
  - « Locked / Likely / Still exploring »
  - la conversion du créneau d'appel en heure d'Addis
- **À vérifier** :
  - « They have already shot with us » : la source dit seulement « Our Clients ».
  - « Released as *Triangle* » : l'affiche associée montre « Triangle 2 — 2016 ».

---

## 9. Assets : présents, inutilisés, manquants

> ⚑ **Décision du 25/09 : toutes les photos restent, on n'y touche pas.** Les 9 photos de lieux (Wikimedia, voir plus bas) restent aussi, **avec leurs crédits visibles**, qu'impose leur licence. Le reste de cette section est un constat, pas un plan d'action.

**Présents et réels** (à confirmer par le client)
- Le logo.
- Les 5 logos clients en ligne, plus **2 dans l'extraction** :
  - Forces de défense (FDRE, avec texte amharique) ;
  - un logo qui porte le mot **« woestijnvis »**, affiché « Wosti Jnvis » sur le site source (à confirmer avec le client).
- **5 affiches**, dont 4 portent leur titre en amharique dans l'image.
- **L'ident 3D Sebastopol** (source de 2 min 51 s avec son, `source-assets/vid/movie.mp4`).
- **8 photogrammes** du générique.
- **15 clips** `reel/`, de 2,5 à 5 s, sans son. **Origine non documentée** : à confirmer avant tout usage.

**Faux ou provisoires**
- `office/desk` : image générée, présentée comme le bureau.
- `kit/*` : photos de catalogue ; `drone` = vue aérienne.
- `loc/*` : placeholders Wikimedia, CC BY-SA ou CC BY (attribution **et** partage à l'identique).

**Inutilisés** : 46 fichiers de `public/`, soit 6,9 Mo (29 %), dont 8 photogrammes `film/` jamais référencés.

**À confirmer, sans corriger** (ta règle du 19/09 : on ne corrige jamais une association du client)
- L'affiche rangée sous « Sost Maezen 1 / Triangle » montre « TRIANGLE 2 — 2016 ».
- *Fikir Siferd* n'existe qu'en 300 × 168, avec un filigrane « DEKIKA FLIX ».

**Manquants au regard des faits du brief**
- *Abay vs Vegas*, *Red Mistake*, *For the Love of the Motherland* : ni visuel, ni année.
- Les titres amhariques **en texte** (0 caractère aujourd'hui).
- Les salles **Sebastopol Cinema**.
- Un portrait du fondateur.
- Le vrai bureau (Finfine Building, Meskel Square).
- Le vrai parc de matériel, dont la caméra 12K.
- Les **repérages photo du studio** sur les 9 lieux.
- Une trace des 3 nominations AMAA 2015.
- Les années de chaque film.

---

## 10. Ce que je te demande

**Réglé le 25/09** ([DECISIONS.md](DECISIONS.md)) :
- **Photos et informations** : on ne touche à rien, donc plus aucune demande d'assets au client.
- **Périmètre** : forme seulement. Les dispositifs repris de Peryton et d'autres sites (§6) sont des animations et des transitions, donc ils seront retravaillés.

**Encore ouvert**
1. **Le menu** (§1) : refactoriser en gardant la sensation, le garder tel quel, ou le déclarer libre ?
2. **Ton GO pour la Phase 1** : trois directions dans CONCEPTS.md.
3. *(facultatif)* **La colonne « Dominique »** du §5 : les numéros d'autres éléments que tu aimes, pour que je les garde.
