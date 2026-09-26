# DESIGN SYSTEM — la refonte de craft

> **Phase 2, version 2** (25/09/2026). Il n'y a plus de concept narratif ([DECISIONS.md](DECISIONS.md)). Le site ne raconte pas d'histoire : **il est parfaitement organisé, et chaque geste reçoit une réponse fluide, au niveau du menu.**
> **Périmètre** : forme seulement. Photos et textes inchangés ; photos en vraies couleurs.
> **Base conservée** : le monde basalte, l'accent terre cuite, Fraunces pour les titres. Tout est épuré et mis en système.
> **Règle** : n'entre ici que ce dont la réussite est garantie et vérifiable en navigateur. Il n'y a pas de WebGL.

---

## 1. Les quatre principes

1. **Chaque chose a une place, et une seule.** Une information apparaît à un endroit, pas trois. Aujourd'hui, les clients sont montrés deux fois et le bouton « Start a production » trois fois dans le même écran : c'est fini.
2. **Chaque geste reçoit une réponse**, en moins de 100 ms, sur la courbe du menu. Pas d'animation gratuite qui démarre toute seule : le site bouge **quand on le touche**.
3. **Le texte n'est jamais caché.** On ne fait pas attendre la lecture : seuls les titres, les filets et les photos ont une entrée.
4. **Une seule famille de mouvements** pour tout le site : les courbes et les durées du menu que tu aimes, déclinées.

---

## 2. L'organisation

### 2.1 L'accueil — de 22 écrans à environ 8 sur ordinateur, même nombre d'écrans sur téléphone

| # | Section | Ce qu'on y trouve (contenu existant) | Ce qui change dans l'organisation |
|---|---|---|---|
| 1 | **Ouverture** | « Gateway to Africa », sur-titre, chapô, **deux actions** (*Start a production*, appeler), le bandeau Addis / Zone / Light / Desk | Le clap reste en fond, net ; le bandeau devient une petite table lisible, et non plus une ligne de capitales |
| 2 | **Services** | Les 8 | **Tous visibles ensemble** (2 × 4), plus d'accordéon qui en cache 7 ; la description s'ouvre sur place au survol ou au toucher |
| 3 | **Lieux** | La phrase « One base. 4,675 metres… », les 9 lieux, photos, altitudes, crédits | Un **registre** nom / altitude à gauche, l'image du lieu à droite qui change au survol ; « The nine, in full » vers la page Lieux |
| 4 | **Matériel** | Les 6, avec 12K / Cinematic / Professional | 3 × 2 sur ordinateur ; *Add to sheet* sur chacun |
| 5 | **La galerie à attraper** | Les clips « Shot in Ethiopia » | **Gardée.** Réécrite plus fluide (§4.6) |
| 6 | **Films et clients** | Les 5 films + les 7 clients | Un seul bloc « preuve » : la liste des films avec l'affiche qui apparaît au survol, puis les clients. **Les clients n'apparaissent plus qu'ici** (plus de doublon en haut de page) |
| 7 | **Le bureau** | About, les 3 faits, Why us (4 arguments) | Les 4 arguments sur 4 colonnes lisibles. **La section téléphone épinglée disparaît** : 4,7 écrans pour 4 paragraphes, textes presque invisibles |
| 8 | **La feuille** | Call sheet + formulaire | La conclusion de la page (§3, l'événement couleur) |
| — | **Pied** | Coordonnées, liens, réseaux | 3 colonnes nettes ; ancres réparées |

### 2.2 La navigation
- **La barre du haut** : logo, menu, heure d'Addis, téléphone, *Start a production*. Elle se cache quand on descend et revient dès qu'on remonte.
- **Le menu** (la « barre latérale ») : sensation gardée à l'identique (§4.1).
- **Le repère de lecture** remplace la barre de montage, qui prenait le bas de l'écran sur téléphone. C'est un filet de 2 px sous la barre du haut, qui se remplit au fil de la page.
- **La feuille** : un onglet discret en bas à droite (compteur), qui s'ouvre en panneau latéral. Sur téléphone, un seul élément en bas, pas deux.

---

## 3. La couleur et ses transitions

**Un monde dominant**, le basalte. **La terre cuite est la couleur de l'action**, et seulement de l'action : boutons, menu, transitions, feuille. Pas d'alternance de sections claires et sombres.

| Rôle | Nom | Hex | Contraste |
|---|---|---|---|
| Fond | Basalte | `#141211` | |
| Surface | Basalte levé | `#22201e` | |
| Texte | Encre claire | `#ece7e0` | 15:1 |
| Texte 2 | Encre douce | `#b0aba6` | 8,2:1 |
| Action | Terre cuite | `#db6336` | 5,2:1 |
| Action claire | Terre cuite claire | `#f69561` | 8,3:1 |

Le nettoyage de l'audit est fait : les verts et les ors restés **codés en dur** (panneau du menu, altimètre, galerie, téléphone, favicon) passent sur ces jetons.

### Les jeux de couleur — trois événements, pas plus

1. **Le menu** : la tuile terre cuite, telle qu'aujourd'hui.
2. **Le passage d'une page à l'autre** : une tuile terre cuite **de la même famille que le menu** couvre l'écran (monte en 520 ms), on navigue, puis elle découvre la nouvelle page (720 ms). Le changement de page *ressemble* à l'ouverture du menu : cohérence totale.
3. **La feuille, en fin de page** : en approchant de la section 8, le fond **glisse du basalte vers la terre cuite**. C'est un vrai dégradé piloté par le défilement, 1 200 px de transition, pas un bloc qui claque. La feuille se lit en encre sombre sur terre cuite. On ne « contacte » pas au milieu du basalte : la page s'allume pour l'action.

---

## 4. Le catalogue des micro-interactions

### 4.1 Les courbes et les durées (tirées du menu)

| Nom | Valeur | Usage |
|---|---|---|
| `--e-geste` | `cubic-bezier(0.76, 0, 0.24, 1)` | La courbe du menu : panneaux, transitions, ce qui a du poids |
| `--e-sortie` | `cubic-bezier(0.16, 1, 0.3, 1)` | Ce qui arrive et se pose : images, filets |
| `--e-reponse` | `cubic-bezier(0.23, 1, 0.32, 1)` | Survol, focus, opacités |

| Durée | Valeur |
|---|---|
| `--d-micro` | 180 ms |
| `--d-reponse` | 300 ms |
| `--d-geste` | 520 ms |
| `--d-panneau` | 720 ms |
| `--d-image` | 900 ms |

Tout est en `transform`, `opacity` et `clip-path`. Chaque animation rend la main à la fin (`clearProps`).

### 4.2 Le menu — l'étalon, gardé tel quel, corrigé
- Mêmes valeurs qu'aujourd'hui : trois traits → croix (520 ms), trait du milieu qui sort par la droite, tuile qui descend (720 ms), liens en cascade (180 ms + 45 ms), roulement du texte au survol.
- **Corrections** :
  - la tuile finit sa course avant de disparaître (aujourd'hui elle saute à 90 %) ;
  - la page ne défile plus derrière le menu sur les pages secondaires ;
  - le focus est visible (aujourd'hui orange sur orange) ;
  - le bouton du pied du menu est atteignable au clavier.
- Les vert et or restés en dur passent sur les jetons.

### 4.3 Le roulement — la signature des boutons
- **Le roulement de texte du menu** (le mot monte et sa copie arrive par-dessous, 560 ms, `--e-geste`) devient **le comportement de tous les boutons** du site : *Start a production*, *Send*, *Add to sheet*, *The nine, in full*.
- En même temps, le fond du bouton passe de contour à plein (terre cuite), du bas vers le haut, en 520 ms.
- **Un seul langage** : quand on survole un bouton, il répond comme le menu.
- Au clic, le bouton s'enfonce (`scale` 0,97, 180 ms) puis revient.
- **Les aimants de Peryton disparaissent.**

### 4.4 Les liens
- **Soulignement de 1 px qui se trace sous le mot** de gauche à droite (300 ms) au survol, et se retire vers la droite en sortant.
- Plus de « → » collé.

### 4.5 Les listes — services, lieux, films
- **Services** : au survol ou au toucher d'un service, sa description s'ouvre sur place (hauteur 0 → auto, 520 ms, `--e-geste`), son filet d'horizon se trace dessous, les autres services s'atténuent à 45 %. Les 8 restent visibles en permanence.
- **Lieux** : au survol d'un nom dans le registre, **l'image du lieu arrive dans le cadre de droite** par un rideau vertical (`clip-path`, 520 ms) pendant que l'ancienne s'efface. L'altitude du lieu défile au chiffre près dans le coin du cadre (compteur de 300 ms, de l'ancienne altitude à la nouvelle). Clic : la visionneuse s'ouvre **depuis le cadre** (l'image grandit depuis sa place).
- **Films** : au survol d'un titre, **l'affiche apparaît à côté du curseur** et le suit en retard (0,4 s d'amorti), légèrement inclinée selon la vitesse du geste (±3° au plus). Elle disparaît en rétrécissant quand on quitte la liste. Sur téléphone, l'affiche est dans la ligne.

### 4.6 La galerie à attraper — gardée, réécrite
Ce que tu aimes : **attraper un espace à la souris et faire défiler les photos**. On garde le geste et on le rend plus fin :
- **Le glisser a de l'inertie** : on lance, ça continue et ça ralentit naturellement (1,2 s), comme aujourd'hui.
- **Les images réagissent à la vitesse** : pendant un lancer rapide, elles se serrent très légèrement (échelle 0,96) et s'inclinent de 1 à 2° dans le sens du mouvement, puis se reposent à l'arrêt. On *sent* la vitesse.
- **Le curseur** : sur la zone, une main « attraper », puis « tenir » pendant le glisser (curseurs natifs). La pastille « Drag » disparaît.
- **Au doigt** : le glisser horizontal natif, avec la même inertie.
- **Au clavier** : ← → pour avancer d'une image.
- **Vidéos** : elles ne chargent qu'à l'approche de la galerie. Aujourd'hui, 6 vidéos partent dès l'ouverture de l'accueil.
- **Survol d'une image** : elle se met en lecture et s'avance à peine (échelle 1,03, 700 ms) ; les autres restent en pause.

### 4.7 Le matériel et la feuille
- **Add to sheet** :
  - le bouton se transforme en « On the sheet » par le roulement (§4.3), et un petit trait coché se dessine (180 ms) ;
  - le compteur de l'onglet de la feuille roule au chiffre suivant ;
  - l'onglet fait une seule pulsation (échelle 1,06 → 1, 520 ms).
  - **Il n'ouvre plus la visionneuse** (défaut mesuré aujourd'hui).
- **Les lignes de la feuille** entrent en glissant depuis la gauche (hauteur, puis opacité, 520 ms). Plus de frappe lettre à lettre.
- **L'ouverture de l'onglet** : le panneau latéral glisse depuis la droite avec la courbe du menu (720 ms).

### 4.8 Le formulaire
- **Libellés** : au focus, le libellé monte et rétrécit au-dessus du champ (300 ms) ; le filet du champ se trace en terre cuite de gauche à droite.
- **Erreur** : le champ fait une très courte secousse horizontale (2 allers-retours de 4 px, 300 ms). Le message apparaît sous le champ et lui est relié pour les lecteurs d'écran.
- **Envoi** : le bouton se remplit comme une jauge pendant la préparation, puis le texte roule vers « Sent ».

### 4.9 Les entrées à l'écran (le minimum, sans cacher le texte)
- **Titres de section** : chaque ligne monte depuis un masque (`yPercent` 100 → 0, 900 ms, décalage de 80 ms par ligne). **Seulement les titres**, une fois, jamais rejoué.
- **Photos** : elles se découvrent par un rideau du bas vers le haut (`clip-path`, 900 ms) avec une très légère réduction (échelle 1,08 → 1).
- **Filets de section** : ils se tracent de gauche à droite (900 ms).
- **Le texte courant n'a pas d'entrée** : il est là.

### 4.10 La barre du haut et le repère de lecture
- La barre se cache en descendant (`translateY` −100 %, 420 ms) et revient au premier mouvement vers le haut.
- Le filet de lecture se remplit en continu (`scaleX`, sans délai).
- Au clic sur le logo depuis le bas de page, **retour en haut animé** (1 s, `--e-geste`).

### 4.11 Le clap de l'ouverture
- **Gardé** (commit `f518aa1`) : il se lève lentement, tombe vite, puis rebondit de 2,2°. Une fois par session.
- Il est rendu net et lisible, et non plus à 50 % d'opacité derrière le titre.

---

## 5. Ce qui disparaît (mesuré ou relevé à l'audit)

| Élément | Pourquoi |
|---|---|
| Écran de chargement « 000 → 100 » | Il cache l'accueil 6,8 s sur mobile, et pour toujours sans JS |
| Section téléphone épinglée | 4,7 écrans, textes presque invisibles, grand décalage de mise en page |
| Barre de montage en bas | Elle mange le bas de l'écran sur téléphone. Remplacée par le filet de lecture |
| Titre qui scintille en boucle | 120 à 150 réécritures par seconde, en permanence |
| Grain plein écran | Calque animé au-dessus de tout le site |
| Curseur personnalisé | Deux curseurs à la fois. Seule la galerie garde un curseur, natif |
| Logos qui virevoltent, boutons aimantés | |
| Bascule de palette `?palette=` | |
| Doublons | Clients en haut **et** en bas ; trois boutons « Start » dans l'écran d'ouverture |

---

## 6. Typographie

**Deux familles au lieu de trois** : 268 kB → environ 180 kB.

| Famille | Usage |
|---|---|
| **Fraunces** | Titres : l'identité actuelle, gardée |
| **Instrument Sans** | Texte et interface |

Archivo disparaît : elle doublait l'une ou l'autre.

**Les petits libellés passent en casse normale**, en Instrument Sans de 13–14 px, sans capitales espacées. Ils deviennent plus lisibles et moins « tableau de bord ».

---

## 7. Technique, performance, accessibilité

**Technique**
- On reste sur **Vite** ; le déploiement GitHub Pages ne change pas.
- **GSAP** : cœur + Observer (pour la galerie). **Lenis** : gardé à la molette, le tactile reste natif.

**Objectifs mesurés à chaque étape**

| Mesure | Aujourd'hui | Objectif |
|---|---|---|
| Accueil réellement visible sur téléphone | 7,3 s | ≤ 2 s |
| JavaScript (gzip) | 75 kB | ≤ 60 kB |
| Décalage de mise en page au défilement | ≈ 2,95 | ≤ 0,05 |
| Vidéo au premier écran | 6 clips | 0 |

**Accessibilité**
- **Clavier complet** : formulaire, visionneuse, galerie, feuille.
- Lien d'évitement réparé.
- **Focus dessiné partout.**
- Contrastes AA.
- **Mouvement réduit** : tout est posé, rien ne manque. Aujourd'hui, les photos des lieux disparaissent.
- **Sans JavaScript** : tout est lisible.

---

## 8. Ordre de construction (après ton GO)

Branche dédiée. À chaque étape, un commit, des captures à 390 / 768 / 1440 / 1920 commentées, et une mesure.

1. **Organisation** : le nouvel ordre, les doublons supprimés, les 8 services visibles.
2. **Nettoyage** : ce qui disparaît (§5), les couleurs en dur, les fontes.
3. **Le menu corrigé**, comparé en vidéo à l'actuel.
4. **Boutons et liens** : le roulement partout.
5. **Listes** : services, registre des lieux, films avec l'affiche qui suit.
6. **La galerie à attraper** réécrite.
7. **La feuille** : onglet, lignes, fond qui passe à la terre cuite.
8. **Transitions de page** : la tuile de la famille du menu.
9. **Formulaire, entrées à l'écran, finitions.**
10. **Deux passes du juré.**
