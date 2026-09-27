# TEDDY STUDIO — Ethiopian Film Office

Refonte du site de **Teddy Studio / Ethiopian Film Office** (Addis-Abeba), société de
services de production (*film service company* / *fixer*) fondée par **Tewodros Teshome**.

Site source analysé : `ethiopianfilmoffice.com` (relevé le 18/09/2026).

---

## Reprendre le projet (état au 27/09/2026)

**En ligne** : https://viudesdominique12-droid.github.io/teddy-studio/ — c'est la branche `main`, publiée automatiquement par GitHub Pages à chaque envoi (`.github/workflows/pages.yml`, environ une minute).

### Lancer, construire, publier
```bash
npm ci                # installe gsap, lenis, three et vite
npm run dev           # http://localhost:5178
npm run build         # construit dans dist/
npm run build:pages   # construit comme GitHub Pages (sous /teddy-studio/)
```
Publier = envoyer sur `main` (`git push origin main`) : le site se reconstruit et se met en ligne tout seul.

### Où en est le site
La refonte est en ligne, avec **trois thèmes** que le client compare : Vert (le thème de marque), Nuit et Papier. Un sélecteur (au milieu du bord droit) ou `?palette=vert|nuit|papier` les fait changer. Quand le client aura choisi : héberger les polices du thème retenu dans `public/fonts/` (elles viennent de Google Fonts le temps de l'essai), retirer le sélecteur, en faire le thème par défaut.

### Les documents, du plus récent au plus ancien
| Fichier | Contenu |
|---|---|
| `REFONTE.md` | **À lire en premier.** Le journal de la refonte, vague par vague (1 à 12, 26–27/09 ; la 11 est la fluidité, mesurée dans Safari), avec les demandes de Dominique mot pour mot, et **« Pistes pour la suite »** : tout ce qui reste à faire ou à faire valider par le client. |
| `CREDITS.md` | Licences de chaque média, modèle 3D et police. Certains médias sont encore **à confirmer** par le client. |
| `DECISIONS.md` | Les décisions de Dominique (périmètre, menu, fond vert…). |
| `DESIGN_SYSTEM.md`, `CONCEPTS.md`, `AUDIT.md`, `RESEARCH.md` | Les phases précédentes (24–26/09) : audit du site de départ, recherche de références, pistes de concept, système de design. Utiles pour le *pourquoi* ; la refonte en ligne a évolué depuis. |
| `docs/outils/` | Les scripts de vérification (captures, mesure de fluidité sur téléphone et en A/B contre une version de référence — `abperf.mjs`, aussi dans le moteur de Safari —, débordements, version construite) et la préparation des modèles 3D. Ils utilisent Playwright ; adapter les chemins en tête de script. |
| `docs/archive/` | L'ancienne page d'accueil, pour revenir en arrière si besoin. |

### Où est le code
- **Pages** : `index.html` (accueil), `locations.html`, `works.html`, `book.html`, `vacancy.html`, `404.html`. Les morceaux communs sont dans `src/partials/` (`head`, `bar`, `footer`), insérés par `plugins/html-include.js`.
- **Styles** (`src/styles/`) : `tokens.css` (les neuf couleurs de base : tout le site en dérive), `themes.css` (Nuit et Papier), `home.css` (l'accueil), `refonte.css` (la barre, le pied de page, l'ouverture), `pages.css` et `components.css` (pages intérieures).
- **Scripts** (`src/js/`) : `home.js` (démarrage de l'accueil), `kit3d.js` (le matériel en 3D, Three.js), `reel3d.js` (la bobine des lieux, WebGL), `services.js` (les listes qu'on déplie : services et « Why us »), `palette.js` (les thèmes), `motion.js` (la barre, l'index, le curseur), `wipe.js` (le changement de page), `page.js` / `book.js` (pages intérieures).
- **Médias** : `public/` (photos déjà préparées, modèles 3D dans `public/kit3d/`, polices dans `public/fonts/`).

### Hors de GitHub, volontairement
Les fichiers bruts d'origine (`source-assets/`, 53 Mo de rushes et d'images du client) ne sont pas dans le dépôt, qui est **public** : ils se partagent à part (Drive). Le site n'en a pas besoin pour tourner, il sert les versions préparées de `public/`.

---

## Historique : le concept de départ

> Ce qui suit est le concept de la première version (18–24/09). La refonte l'a fait évoluer ; `REFONTE.md` et `DECISIONS.md` disent ce qui a changé.

### Le concept — « LE FEU VERT »

**Le vert n'est pas une couleur de marque : c'est un ÉTAT.**
Il ne décore jamais. Il ne marque que ce qui est **dégagé, autorisé, disponible**.

Le double sens est intransposable à un concurrent :
c'est à la fois le *green light* de l'industrie du cinéma **et** le vert des hauts plateaux
éthiopiens — dans un secteur où tous les fixers (Maroc, Jordanie, Namibie, Islande) sont en
ocre ou en bleu glacé.

Deux preuves viennent du site lui-même : **deux des huit services sont des permis**
(*Shooting Permit*, *Location Permit*), et l'entreprise est ouverte **Monday – Sunday, 24/7**.

### Ce que le concept gouverne
| | |
|---|---|
| **Le budget vert** | 3 marques par écran au plus, jamais un aplat de section. Un élément passe au vert **uniquement** s'il change d'état. |
| **L'horloge d'Addis** | La seule chose verte dès la première seconde, et elle ne s'éteint jamais. Heure réelle UTC+3, calculée chez le visiteur. C'est le 24/7 rendu littéral. |
| **Le preloader** | Pas d'amorce 3-2-1 (le cliché du secteur). Une seule donnée se résout — l'horloge trouve l'heure — puis la marque verte apparaît. Vraie barrière de chargement, plafonnée à 2,2 s. |
| **Le booking** | Chaque étape renseignée **passe au vert**. Le visiteur voit sa production se dégager sous ses doigts. |
| **La 404** | « Not cleared. » La seule page où le vert est absent ; le seul vert de l'écran est le lien de retour. |
| **`::selection`** | Sélectionner, c'est dégager. |

---

## La couleur

Teinte de marque : **OKLCH H 142** — l'axe du primaire vert sRGB (`#00FF00` = `oklch(0.866 0.295 142.5)`).
À H 142 le pigment disponible est **maximal** : +19 % de chroma qu'à H 149.6 (Tailwind `green-500`)
à luminance égale. Écarts mesurés : Tailwind −7.6° · Spotify −6.9° · emerald −18.4° ·
drapeau éthiopien −4.8° · lime +11.2°. **Personne n'est sur cette teinte.**

Un seul vert ne peut pas être AA-texte sur blanc **et** sur nuit — d'où trois rôles distincts :

| rôle | jour | nuit | contraste |
|---|---|---|---|
| `--go` — **la marque** (filets, UI, points) | `#21A215` | `#4BD233` | 3.38:1 / 9.77:1 — gros texte + composants |
| `--go-text` — le vert qui porte du texte | `#17880C` | `#87E472` | 4.62:1 / 12.40:1 — AA corps |
| `--go-solid` — l'aplat qui porte du blanc | `#136E0A` | `#4BD233` | 6.42:1 — AA |

Blanc **`#FFFFFF` strict** (jamais crème, jamais verdâtre). Aucune troisième couleur, aucun dégradé.
Sur écran P3 : +15 % de chroma, plafonné pour que le repli sRGB reste ressemblant.

**L'erreur n'est pas rouge** — choix assumé. Dans ce concept, *l'absence de vert EST l'erreur*.
La conformité WCAG 1.4.1 est tenue autrement : épaisseur de filet, graisse, et libellé explicite.

---

## La typographie

- **Bricolage Grotesque** (display + texte) — `opsz 12→96 · wght 200→800 · wdth 75→100`.
  Rare grotesque libre à porter un vrai axe optique ; issue de typographie vernaculaire
  (enseignes, pochoirs), pas d'une fonderie d'interface.
- **Martian Mono** (donnée) — `wght 100→800 · wdth 75→112.5`. Réservée strictement à la
  donnée : horloge, références, légendes, libellés de champs.

**Les axes sont RÉGLÉS, pas choisis.** Le titre du hero oppose deux réglages de la même fonte :
`wdth 100 / wght 200` (large et fin) au-dessus de `wdth 75 / wght 800` (serré et massif).
C'est le contraste qui fait le dessin.

Les deux lignes sont calées à la **même largeur** par `src/js/fit.js`, à tous les écrans —
un bloc typographique justifié, sans valeur magique, plafonné à 58 % de la hauteur du viewport.

Auto-hébergées, sous-ensemblées latin-1 : **143 Ko** au total, zéro requête tierce.

---

## Les deux mondes

Ce n'est pas une inversion CSS : deux régimes de lumière, justifiés par le 24/7.

| | **DAY — le bureau de production** | **NIGHT — le plateau** |
|---|---|---|
| fond | `#FFFFFF` blanc pur | `#070F06` |
| le vert | une **marque** qui valide | une **lampe**, plus claire et plus rare |
| les images | encadrées, avec marge — planches de dossier | plein cadre, l'image devient la source de lumière |

Le jour est le monde dominant. La nuit arrive comme un **événement**, pas en damier.

---

## Structure

```
index.html        Home — one-pager complet (toutes les rubriques du site source, mêmes ancres)
locations.html    Les 9 lieux en pleine page
works.html        Les 5 films + l'ident Sebastopol + les 7 clients
book.html         « Start a production » — la demande de production en 5 étapes
vacancy.html      Les deux états : aucune offre ouverte (état réel) + l'archive de janvier 2025
404.html          « Not cleared. »
```

Toutes les rubriques du site actuel sont conservées :
Home · Services · About Us · Locations · Our Clients · Resources · Our Works · Contact · Vacancy.

---

## Technique

Vite 6 (multi-pages) · GSAP 3.15 (ScrollTrigger, SplitText) · Lenis · zéro framework, zéro WebGL.

```bash
npm install
npm run dev      # http://localhost:5178
npm run build
npm run preview
```

**Budget de la page d'accueil** (hors vidéo) : ~427 Ko, dont 143 Ko de fontes.
JS+CSS gzippés : ~60 Ko. La vidéo hero (2,1 Mo desktop / 771 Ko mobile) n'est chargée
qu'à l'entrée dans le viewport, jamais au chargement initial.

`prefers-reduced-motion` est respecté partout : le preloader est sauté, les états verts
sont posés sans transition. **Le concept survit — c'est un état, pas une animation.**

---

## Contenu

`content/source-verbatim.md` est la **source unique de vérité**, relevée sur le site actuel.
`src/data/site.js` la reprend en données structurées.

**Aucun fait, chiffre, client ou service n'a été inventé.** Seules les fautes manifestes ont été
corrigées (« Shoting Permit » → « Shooting Permit », « Semen Mountains » → « Simien Mountains »,
« Ertale » → « Erta Ale »…) — la liste complète est au §15 du verbatim.

Voir `CREDITS.md` pour les licences des médias et **ce qui reste à obtenir du client**.
