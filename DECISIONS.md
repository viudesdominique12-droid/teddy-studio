# DECISIONS — teddy-studio

> Chaque choix non trivial du projet : qui l'a pris, quand, l'alternative écartée, la raison.
> Les décisions de Dominique priment sur mes recommandations.

---

## 26/09/2026 — Le téléphone de « Why Teddy Studio » disparaît (décision de Dominique)

**Contexte.** Le partenaire demandait que toutes les vidéos passent en paysage, « comme sur Apple TV ». La galerie « Shot in Ethiopia » alterne des clips verticaux et horizontaux. La section « Why Teddy Studio » faisait défiler un clip vertical dans un téléphone qui pivotait.

**Décision.** « On enlève la partie vidéo » : entre la galerie, le téléphone, les deux ou rien, Dominique a choisi **le téléphone**.
- Le téléphone, ses deux vidéos et son épinglage (4,7 écrans de défilement) sont retirés. `src/js/phone.js` est supprimé, ainsi que `public/reel/w01`–`w03`, qui ne servaient qu'à lui.
- **Les textes restent mot pour mot.** Le titre reprend le dessin de « What we handle », et les quatre arguments s'affichent côte à côte : quatre colonnes, puis deux, puis une sur téléphone.
- **La galerie « Shot in Ethiopia » est gardée telle quelle.** La demande du partenaire de passer ses vidéos en paysage n'est pas faite.

---

## 26/09/2026 — Le fond vert revient (décision de Dominique)

**Ce qu'a dit Dominique.** « On remet le fond vert. Garde tout comme c'est actuellement, mais remets le fond vert. »

**Décision.**
- Le fond revient au vert nuit d'origine (`src/styles/tokens.css`) : `#182d19` pour le sol, `#101b13` pour les surfaces enfoncées, `#1e3720` pour les surfaces relevées.
- **Tout le reste est gardé tel quel** : la terre cuite en accent, les encres, le clap, le logo, le menu, et le défilement allégé du commit `989f42c` (donc sans le ciel étoilé).
- Le basalte `#141211` reste l'encre posée sur la terre cuite (menu, boutons pleins, sélection), grâce à un nouveau jeton `--basalt`. En vert, cette encre serait tombée de 5,20:1 à 4,10:1.

**Conséquence mesurée.** Le vert est plus clair que le basalte. Sur l'accueil, 63 textes passent sous le seuil AA de 4,5:1 : le texte terre cuite (4,10:1) et les petits libellés gris (4,15:1). Une retouche a été proposée à Dominique ; elle attend sa réponse.

**Ce que ça remplace.** Le fond basalte du commit `dc17198`. DESIGN_SYSTEM.md §3 décrit encore un fond basalte : il sera mis à jour une fois la retouche tranchée.

---

## 25/09/2026 — Périmètre de la refonte (décision de Dominique)

**Décision.**
- **Toutes les photos restent**, telles quelles : Dominique indique qu'elles viennent du site officiel du client. **On n'y touche pas.**
- **Toutes les informations restent**, telles quelles : textes, faits, libellés, coordonnées. **On n'y touche pas.**
- **Mon travail porte uniquement sur la forme** : animations, couleur, design, affichage, transitions, organisation (ordre et structure des sections, navigation, mise en page).

**Ce que ça change dans mes recommandations de la Phase 0.**
- AUDIT.md recommandait de retirer la photo du bureau (image générée), de remplacer les photos du matériel et de réécrire le texte « brochure ». **Ces recommandations sont annulées** : les photos et les textes restent, seule leur mise en forme change.
- Les demandes d'assets au client (photos réelles, repérages, affiches HD, années des films) sont **retirées**.
- **Les faits du brief §1 absents du site ne sont pas ajoutés** : *Kezkaza Welafen* 2003, *Abay vs Vegas*, les nominations AMAA, Sebastopol Cinema, l'école de cinéma. C'est ma lecture de « on ne touche pas aux informations » ; Dominique peut me dire le contraire.
- Les 9 photos de lieux ne viennent pas du site du client : ce sont des photos Wikimedia Commons (CC BY-SA / CC BY) posées par la passe précédente (`CREDITS.md`). Elles **restent**, comme le reste. **Leurs crédits restent affichés** : c'est une obligation de leur licence.

**Les dispositifs repris de Peryton et d'autres sites** (AUDIT §6) relèvent des animations et des transitions, donc du périmètre à retravailler : ils seront remplacés.

---

## 25/09/2026 — Le menu : garder la sensation, changer la forme (décision de Dominique)

**Contexte.** Le menu (trois traits orange) est un élément que Dominique aime. Mesures à l'appui, il reproduit celui de peryton-film.com (AUDIT §1).

**Décision.**
- **On garde la sensation**, à l'identique :
  - une seule courbe `cubic-bezier(0.76, 0, 0.24, 1)` ;
  - bouton 0,52 s, panneau 0,72 s ;
  - les traits se métamorphosent en croix, le trait du milieu sort du cadre, son opacité s'éteint en 0,30 s ;
  - les liens arrivent en cascade à 0,18 s + 45 ms par lien ;
  - la fermeture est sèche, la couleur bascule d'un coup.
- **On change la forme** : l'icône et le panneau doivent naître du concept retenu.

**Méthode.** Avant validation, comparaison vidéo avant/après, avec comme référence « avant » `shots/phase0/menu/`.

**Alternatives écartées.**
- Le garder tel quel : parenté visible avec Peryton, contraire au §8 du brief.
- Le déclarer libre : on perdait l'étalon que Dominique a choisi.

---

## 25/09/2026 — Plus de concept narratif : une refonte de craft (décision de Dominique)

**Ce qu'a dit Dominique.** « J'aime pas l'idée de l'Éthiopie, tout n'est pas obligé de raconter une histoire. Juste une organisation parfaite, bien réfléchie, chaque chose à sa place, chaque bouton une animation subtile et fluide comme la barre latérale. Avec des idées d'animation comme en bas, quand j'attrape avec ma souris un espace pour faire défiler les photos. Plein d'idées bien réfléchies. »

**Décision.**
- **La direction C est abandonnée.** Il n'y a plus de concept narratif.
- **La refonte porte sur** :
  1. l'organisation ;
  2. un système de micro-interactions au niveau du menu ;
  3. la couleur et ses transitions ;
  4. la correction de tous les défauts mesurés.
- **Gardés parce que Dominique les aime** : le menu (sensation) et **la galerie qu'on attrape à la souris**.
- **L'identité visuelle actuelle est conservée comme base** (basalte, terre cuite, Fraunces), puisqu'elle n'a pas été rejetée. Elle est épurée et mise en système.

**Note.** La galerie à attraper est un mécanisme repris de Peryton (AUDIT §6). Dominique la garde en connaissance de cause. Elle est réécrite proprement, avec ses propres réglages.

---

## 25/09/2026 — Direction retenue : C « À la lumière d'Addis », resserrée *(remplacée le même jour, voir ci-dessus)*

**Ce qu'a dit Dominique.** « Ne donne pas des idées que tu vas mal réaliser. Chaque idée doit avoir un taux de réussite parfait. Ce qui fait un beau site, c'est l'organisation, l'animation, la couleur, le jeu de couleur des transitions. Fais-le, mais chaque détail compte. »

**Lecture.** GO sur la direction recommandée (C). Seuls restent les dispositifs dont la réussite est garantie.
- **Aucune WebGL.**
- **Aucune dépendance à la qualité des photos.**
- **Tout repose sur ce qui se maîtrise au pixel** : grille, typographie, couleur calculée, transitions CSS et GSAP.

**Écartées.**
- **B** : WebGL, photos inégales au premier plan, 60 fps incertains sur téléphone.
- **La rosace générative de A** : son rendu dépend trop de réglages fins pour être garanti du premier coup.

---

## 25/09/2026 — GO Phase 1

Dominique donne le GO pour la Phase 1 : trois directions dans CONCEPTS.md, forme seulement, photos et textes intouchés. Arrêt au STOP suivant pour son choix. Aucun code avant.
