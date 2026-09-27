# REFONTE — la copie de travail

> Copie du site sur la branche git `refonte`, dans le dossier `teddy-studio-refonte`. Le site actuel (`teddy-studio`, branche `main`) n'est pas touché.
> Aperçu local : `http://localhost:5179` (le site actuel reste sur `http://localhost:5178`).
> Carte blanche de Dominique (26/09/2026) : « modifie vraiment, tout ce que tu veux, et rajoute des animations ».
> **On garde** : les textes, les photos, les informations, le fond vert (décision du même jour) et la terre cuite.

## Les quatre références, et ce qu'on leur prend

On prend des idées, jamais le code, les images ou les textes des sites de référence.

| Référence | Ce qu'on reprend | Où |
|---|---|---|
| **LAYR Media** (studio photo et vidéo, Toronto) | Le vocabulaire de la caméra : équerres de viseur autour des boutons, étiquettes `[ entre crochets ]`, point REC, bandeau accent qui défile, chiffres géants au contour seul, nom géant en pied de page | Tout le site |
| **Hobro** (agence digitale) | La vidéo plein cadre sous un titre qui mange la largeur ; les lignes de services qui se remplissent au survol ; le texte qui tourne sur un cylindre | Ouverture, services, anneau |
| **Trevor Noah** (site officiel) | Les titres sur deux lignes et deux tons ; le compteur 000 → 100 ; les mots d'une déclaration qui s'allument | Tous les titres, intro, « About Us » |
| **Synchronized** (studio créatif) | Les planches de papier numérotées qui s'empilent ; la serif d'affiche pour les titres de films | Les films |

## Vague 1 — faite le 26/09/2026 (page d'accueil et coquille commune)

- **L'intro** : le clap arme son bras pendant qu'un compteur géant court de 000 à 100, le bras tombe, puis le rideau monte. Une fois par session, jamais en mouvement réduit.
- **Le plan d'ouverture** : la vidéo Sebastopol en plein cadre, « GATEWAY *to* AFRICA » calé sur la largeur, et par-dessus l'écran du moniteur (équerres, REC, code temporel, scène/prise). En quittant le plan, l'image se referme en cadre.
- **Les clients** : un bandeau terre cuite qui défile, accélère avec le geste et change de sens quand on remonte.
- **Les services** : huit grandes lignes numérotées ; au survol, la terre cuite monte dans la ligne.
- **« About Us »** : la déclaration s'allume mot à mot au défilement ; la photo du bureau est cadrée d'équerres et légèrement décalée en profondeur (parallaxe).
- **« Why Teddy Studio »** : quatre arguments, quatre chiffres creux.
- **Les lieux, le matériel, la galerie, la feuille** : nouveaux titres ; les mécanismes existants sont gardés.
- **Les films** : cinq planches crème qui montent l'une sur l'autre ; un clic ouvre l'affiche.
- **L'anneau** : « Start a production » tourne sur un cylindre en 3D avec le défilement, et mène à la page de réservation.
- **Le pied de page** : « TEDDY STUDIO » sur toute la largeur.
- **La barre du haut** : l'horloge entre crochets avec son point REC, et l'appel cadré.

Code : `src/styles/refonte.css` (chargé en dernier), `src/js/refonte.js`, et le balisage de `index.html`. Polices : Archivo en capitales serrées pour les titres (axe de largeur à 62), Fraunces pour l'affiche, Martian Mono pour les données.

## Vague 2 — 26/09/2026, à la demande de Dominique

- **Entrer dans la caméra** (LAYR, l'effet que Dominique a aimé). Premier jet refusé, parce que c'était un dos d'appareil photo et non une caméra de tournage. Version retenue : une vraie caméra de tournage, une Sony avec un zoom Fujinon 50-135 (photo Vanilla Bear Films / Unsplash, choisie par Dominique). Au départ, la caméra est un dessin au trait tiré de la photo elle-même (OpenCV), donc parfaitement superposé. Au défilement, la photo se révèle en cercle depuis l'objectif, puis la lentille s'ouvre comme un diaphragme sur les vidéos de la galerie. Enfin, on plonge dans l'objectif jusqu'à la galerie, et l'on continue de descendre. Sur téléphone, la photo est recadrée autour de l'objectif. Les images ne se chargent qu'à l'approche de la galerie.
- **L'échelle d'objectif** à la place de la barre de montage (« SC 01/10 — GATEWAY … TC ») : Dominique la trouvait trop chargée. Il reste des traits fins, un grand trait par section et un repère terre cuite qui avance au fil de la page. Le nom d'une section n'apparaît qu'au survol de son trait, et un clic y mène. `timeline.js` n'est plus appelé.

- **L'ouverture en plan technique** (LAYR), à la demande de Dominique. Un premier jet, une caméra « générique » en formes simples, a été refusé. Version retenue : le plan d'une vraie caméra de cinéma, la Canon EOS C500 Mark II avec son zoom 30-300, son pare-soleil, ses rails, son moniteur et sa batterie. Le dessin est tiré de la photo « Camera » déjà présente sur le site (contour et détails extraits avec OpenCV, logos effacés). La feuille porte une grille, l'axe optique, des lignes de repère légendées (matte box, cine zoom 30–300, monitor, top handle, battery, camera body, rods · baseplate) et une cartouche de titre. Pendant le chargement, une tête de traceur terre cuite imprime la caméra de gauche à droite, puis les repères se dessinent. L'anneau « Click to enter » tourne sur le vrai bouton REC du boîtier. Au clic (ou à la molette, au doigt, avec Entrée), l'ouverture du pare-soleil devient une fenêtre sur le premier plan, et l'on plonge dedans. Les positions à l'écran passent par la matrice de l'SVG (`getScreenCTM`). L'ouverture ne passe qu'une fois par session et n'existe qu'avec JavaScript (classe posée dans `<head>`, filet de 9 s).

## Vague 3 — 26/09/2026 au soir : l'accueil sobre (demande de Dominique)

Ce qu'a dit Dominique : « J'aime pas ce qui est sur la page d'accueil, ni la vidéo, ni comment les dispositions sont faites. Trop surchargé. Quelque chose de beaucoup plus sobre et attirant, en s'inspirant des quatre autres pages. »

- **L'accueil est réécrit dans le langage des pages intérieures** (Locations, Works, Book, Vacancy). Chaque section a une étiquette mono avec un point terre cuite, un titre en capitales Archivo (celui de `.phead__h`) et des filets. Les photos sont posées sans cadre ni effet. La terre cuite reste rare : les appels, les points, et les deux permis « Cleared by us ».
- **L'ouverture de page** : « Gateway to Africa » en très grand, la phrase et un seul bouton à droite. Dessous, une seule photo au format cinéma 2,39:1, la caravane de sel d'Afar (photo déjà sur le site), qui se découvre de bas en haut à l'arrivée et dérive doucement au défilement. **Plus de vidéo, plus d'écran de moniteur.**
- **L'ordre** : clients (une ligne de logos immobile) → services (titre fixe à gauche, liste à droite) → à propos (photo du bureau et texte) → pourquoi (quatre colonnes) → les neuf lieux (grille, chaque vignette mène à sa fiche) → le matériel (liste avec vignettes, comme les films de Works) → la galerie → les cinq films (affiches côte à côte) → contact (coordonnées et formulaire).
- **Retirés de l'accueil** : la vidéo Sebastopol, l'écran de moniteur, le bandeau qui défile, les chiffres creux, l'altimètre et les photos flottantes, les planches de films, l'anneau 3D, l'échelle d'objectif en bas de l'écran, la fiche « Call sheet » et ses boutons « Add to sheet ».
- **Gardés** : l'ouverture en plan technique (« Click to enter », une fois par session), qui plonge maintenant dans la nouvelle page ; la galerie « Shot in Ethiopia », telle quelle, en pleine hauteur ; tous les textes, photos et informations.
- **L'entrée dans la caméra**, retirée dans un premier temps, est revenue le soir même. Dominique a aimé la page sobre, mais a demandé « où est passée la partie de la caméra ? ». Elle se trouve de nouveau devant la galerie, sous le titre « Shot in Ethiopia » : le dessin devient la photo, l'objectif s'ouvre sur les vidéos, et l'on plonge dedans. La bande de la galerie est épinglée pendant ce temps. `cameraEntry()` prend maintenant l'élément à épingler en paramètre.
- **Longueur** : environ 14 écrans au lieu de 25 sur ordinateur (dont deux pour la plongée dans la caméra).
- **Code** : `index.html`, `src/styles/home.css` (classes `hm-`, chargée après `main.css`) et `src/js/home.js` (le démarrage de l'accueil). `main.js` n'est plus chargé. L'ancienne page et ses fichiers sont copiés dans `docs/archive/accueil-avant-2026-09-26/`. Pour revenir en arrière, il suffit de remettre cet `index.html`.
- Le lien « Our Clients » du menu mène désormais à la ligne des clients (`/#clients`).

## Vague 4 — le matériel, plan par plan (3D et photos)

Ce qu'a dit Dominique : « Est-ce qu'on peut faire quelque chose de beaucoup plus cinématique ? La caméra vient, tourne à gauche, à droite, il y a sa description. Tu descends, ensuite t'as les lentilles, après les drones… » Réponse donnée : le mouvement est sans risque, mais la rotation demande de vrais modèles 3D, car une photo ne montre qu'une face. Dominique a validé un essai avec la caméra seule.

- **Fait** : la section Resources passe juste après les Services (la location de matériel est un service ; on évite aussi deux caméras à la suite avec la galerie).
- **La séquence** : la scène plein écran s'épingle. La caméra entre par la gauche en pivotant et se pose. Sa fiche s'écrit à droite (« 01 / 06 », « CAMERA », 12K, la description). Puis elle tourne lentement, de trois quarts face à profil, pendant que la lumière passe sur elle. Un léger souffle la fait vivre quand on ne défile pas. Les cinq autres outils restent en liste en dessous.
- **Code** : `src/js/kit3d.js` (Three.js 0.180, chargé seulement à l'approche de la section) et le bloc « LE MATÉRIEL EN 3D » de `home.css`. Le modèle attendu est `public/kit3d/camera.glb`. Tant qu'il manque, ou sans WebGL, ou en mouvement réduit, la section reste la liste de six lignes. `?kit3d=placeholder` montre une caméra en volumes simples, pour les réglages seulement.
- **Le modèle est en place** (26/09, soir) : « RED Digital Cinema Weapon Dragon 8K Camera » de Christopher Holloway (Sketchfab, CC BY 4.0), téléchargé par Dominique.
  - Préparation (script gltf-transform dans le dossier temporaire de la session) : le plateau tournant (nœud `Turntable`) est retiré. `FinishedAsset_Turntable` reste, car c'est le parent de tout. Ensuite : fusion, simplification à 30 % (524 000 → 158 000 triangles), cartes de rugosité en WebP 512 px, normales en WebP 1024 px, compression meshopt. Le fichier passe de 24 Mo à 2,4 Mo, sans différence visible avec la version à 4,4 Mo.
  - Réglages : `data-yaw="-90"` (à yaw 0, la caméra est de profil, objectif vers la droite) et `data-fit="1.22"`. La caméra de la scène plonge de 6°, faute de quoi l'ombre se lit comme un trait sur toute la largeur. Sur téléphone, le canevas n'occupe que les 60 % du haut.
  - La lumière : une clé chaude qui traverse, un contre-jour froid et une touche terre cuite derrière (intensité 15). À 26, elle rosissait l'intérieur du pare-soleil.
  - Le crédit s'affiche en bas de la scène et figure dans CREDITS.md §6.
  - `scripts/rebase.mjs` (GitHub Pages) réécrit désormais `data-model`, `data-href` et `data-href-small`. Les images de la caméra de la galerie n'étaient pas rebasées non plus.
  - En dev, `window.__k3` donne la pose et les réglages, pour orienter un nouveau modèle.
- **Validé par Dominique**, puis la suite (26/09, soir) : « pour les lenses et pour le drone seulement, on va les mettre en 3D ; pour tout le reste, ça reste en photo ».
- **La séquence complète, six plans en alternant les côtés** : 01 Caméra (3D, à gauche), 02 Objectifs (3D, à droite), 03 Drone (3D, à gauche), 04 Éclairage, 05 Micros et 06 Fond vert (photo, à droite, à gauche, à droite).
  - Chaque plan entre pendant que le précédent sort : le modèle en pivotant, la photo en se découvrant depuis son bord.
  - La fiche s'efface avant l'arrivée du plan suivant, et la lueur de fond glisse du côté de l'objet.
  - L'épinglage dure environ 6,6 écrans : 1,25 par plan 3D, 0,9 par plan photo.
  - Sur téléphone, tous les plans ont l'objet en haut et la fiche dessous.
  - Sans WebGL, ou si un modèle ne vient pas, le plan prend la photo de l'outil : la séquence reste entière (testé). En mouvement réduit, la liste des six outils reste.
- **Modèles** : `public/kit3d/lens.glb`, le scan du Sony FE 20mm de Lassi Kaukonen (56 Mo → 2,2 Mo), et `public/kit3d/drone.glb`, le DJI Inspire 3 de polyman Studio (24 Mo → 1,9 Mo). Script `process2.mjs` : conversion specular-glossiness → metal-roughness pour le scan, que Three.js ne lit plus.
- **Réglages par plan** (attributs sur `.k3__plan`) : `data-fix` (orientation du fichier, en degrés), `data-fit` (taille), `data-turn` (rotation : de a à b), `data-tilt`, `data-shadow-gap` et `data-shadow`.
  - Caméra : fix `0 -90 0`, fit 1.22.
  - Objectif : fix `-90 0 90`, fit 0.8, turn `16 -42`. Sur ce scan, le logo du bouchon et les inscriptions du fût ne peuvent pas être à l'endroit en même temps. On garde le fût lisible (badge G, AF/MF, E-mount) et on présente l'objectif de profil, le bouchon ne passant que de biais.
  - Drone : fix `0 90 0`, fit 1.55, ombre plus proche et plus légère.
- La touche terre cuite ne s'allume qu'une fois l'objet posé : en chemin, elle rosissait le pare-soleil de la caméra.

## Vague 5 — la bobine des lieux (26/09/2026, nuit)

Ce qu'a dit Dominique, en envoyant jesperlandberg.com : « j'adore l'animation scroll de cette page, ça me rappelle les bandes de films, les bobines d'avant. Faire exactement comme ça la partie Locations, avec toutes les places. Quand on appuie dessus, on a la photo en haut et l'explication en bas. »

- **Ce qu'on reprend de la référence** (l'idée, jamais le code ni les images) : des vues posées sur le pourtour d'un tambour vu de l'extérieur. Celle du milieu est la plus proche, les autres fuient en s'arrondissant. Le défilement fait tourner le tambour, la bande ondule comme une pellicule, et une grille court au sol.
- **Ce qui est fait** :
  - Les neuf lieux, du plus haut au plus bas, forment un tour complet (Afar retrouve Simien). La scène s'épingle environ 4,2 écrans.
  - La rotation suit le défilement avec l'inertie d'une bobine, et la vitesse creuse l'ondulation. Chaque vue porte son numéro, son nom et son altitude, peints dans l'image : ils ondulent avec elle.
  - La grille est en crème, sur le vert, et se fond dans le vert au loin (brume). Le compteur (« 05 / 09 · Wollo ») est en bas à gauche, l'invitation (« Click a location ») en bas à droite. Au survol, la pastille du curseur dit « View ».
- **La fiche d'un lieu** (`#reel-view`) :
  - La photo en haut part de la vue sur laquelle on a appuyé. Dessous : le nom, la description, l'altitude, « Permits handled in-house », la note du lieu quand il en a une, « Start a production », « The nine, in full » et le crédit de la photo.
  - Les flèches passent d'un lieu à l'autre, Échap ferme.
  - Aucun texte inventé : la description est le texte de remplacement déjà écrit pour chaque photo. Pour des textes plus riches, il faut que le client les fournisse.
- **Code** : `src/js/reel3d.js` et le bloc « LA BOBINE DES LIEUX » de `home.css`. Les lieux sont lus dans la grille `.hm-locs`, qui reste le repli sans WebGL ou en mouvement réduit (testé). Ses `<li>` portent désormais `data-credit` et `data-note`. Pour le clavier et les lecteurs d'écran, un bouton invisible par lieu ouvre la même fiche.
- **Réglages** : caméra à 44° de focale (l'arrondi du tambour se lit mieux qu'à 30°). Vue du milieu à 48 % de la largeur (86 % sur téléphone). Ondulation de 1,8 % de la hauteur au repos, jusqu'à 12 % lancée. `STEP_SCREENS` : voir la vague 5 bis.
- **La page s'allonge** : avec les trois séquences (matériel 6,6 écrans, bobine 4,2, caméra 2,1), elle fait environ 25 écrans de défilement. Le contenu reste aéré. On peut resserrer si Dominique trouve ça long.

## Vague 5 bis — plus vite, et une vraie fiche par lieu (26/09/2026, nuit)

Ce qu'a dit Dominique : « c'est trop long, raccourci en mode accéléré — les passages » et « quand j'ai cliqué sur une photo, j'ai pas vu d'explications. On doit avoir l'explication et la description, l'altitude, tout ce que tu veux ».

- **Les passages accélérés** : le matériel passe de 1,25 à 0,7 écran par plan 3D et de 0,9 à 0,5 par plan photo, soit 3,7 écrans au lieu de 6,6. La bobine passe de 0,45 à 0,22 écran par lieu, soit 2,1 écrans au lieu de 4,2. La caméra de la galerie passe de 210 % à 140 %. La page fait environ 19 écrans au lieu de 25.
- **Pourquoi les explications n'étaient pas vues** : sur un écran de portable, la photo occupait presque tout l'écran et le texte tombait dessous, hors de vue. La fiche tient désormais sur un écran : la barre, la photo qui prend la place qui reste, puis le texte en trois colonnes. Vérifié à 1440 × 900, 1440 × 760 et 1280 × 680. Sur téléphone, la fiche défile.
- **Le contenu de la fiche** :
  - le nom et la région, en terre cuite ;
  - une **présentation du lieu** ;
  - « On the photo » (la description de la photo) et la note du lieu quand il en a une ;
  - l'altitude et « Permits · Handled in-house » ;
  - « Start a production », « The nine, in full » et le crédit de la photo.
- **⚠️ Les neuf présentations sont des textes NOUVEAUX**, écrits en anglais à la demande de Dominique (« tout ce que tu veux »), à partir de faits connus et vérifiables : parcs et sites UNESCO, régions, particularités. Exemples : le gelada et le bouquetin walia du Simien, les onze églises taillées de Lalibela, l'Union africaine à Addis-Abeba, le lac de lave de l'Erta Ale. **Ils sont à faire valider par le client** avant la mise en ligne. Ils se trouvent dans `index.html`, dans les `<p class="hm-loc__about" hidden>` de la grille des lieux, avec la région en `data-region`.

## Vague 5 ter — la disposition de la référence (26/09/2026, nuit)

Ce qu'a dit Dominique, capture à l'appui : « c'est pas la même disposition que le site que je t'ai donné ». Sur sa capture, le tambour s'était arrêté entre deux vues : deux grandes cartes côte à côte, les voisines écrasées en lames, de gros noms en capitales grasses.

- **Une vue toujours posée au centre** : la rotation suit un escalier adouci. Sur chaque pas, le tambour tient la vue centrée pendant 20 % de la course, tourne, puis tient la suivante. Où qu'on s'arrête, on retrouve la composition de la référence : une vue au milieu, ses deux voisines de part et d'autre.
- **Les voisines lisibles** : la focale passe de 44° à 32°, et la vue du milieu prend 50 % de la largeur. À 44°, les voisines n'étaient plus que des lames.
- **Le bombé** : chaque vue est tendue plus fort que le tambour. Son milieu s'avance vers nous de 12 % de sa largeur (dans le vertex shader) : le haut s'arrondit vers le haut, le bas vers le bas, comme la pellicule de la référence.
- **Des espaces fins** entre les vues : 1,8 % (6 % avant).
- **Les inscriptions de la référence** : un petit titre en Instrument Sans en bas à gauche, l'altitude en petit dessous, un petit bouton rond fléché en bas à droite. Le voile est plus léger, le numéro a quitté l'image (il reste dans le compteur en bas de l'écran), et les coins sont arrondis à 24 px.
- **La grille au sol**, plus présente : opacité 0,2, et la brume reculée à la nouvelle distance de caméra.

## Vague 6 — les services « liste et panneau » (26/09/2026, nuit) — remplacée par la 6 bis

Ce qu'a dit Dominique : « La partie What we handle, services, on va la faire comme ça », avec le lien 21st.dev vers « features-with-panel » (scrollxui).

- **Ce qu'on reprend de la référence** :
  - un grand titre et une liste numérotée ; l'élément actif est cerclé d'un filet, son numéro sur fond clair ;
  - à droite, un panneau de 4:3 aux coins arrondis, collé à l'écran, qui montre l'élément actif et passe tout seul au suivant ;
  - sur téléphone, le panneau s'ouvre sous l'élément actif.
- **Ce qui est fait** :
  - Les huit services : l'actif déplie sa ligne de détail, et « Cleared by us » en terre cuite marque les deux permis.
  - Le panneau passe au service suivant toutes les 4,2 s, un filet terre cuite en pied comptant le temps. La lecture s'arrête sous la souris ou au clavier, hors de l'écran, en mouvement réduit et sur téléphone, où le panneau changerait de place sous le pouce. Un clic ou les flèches choisissent un service.
  - Une légende (« 04 / 08 · Shooting Permit ») s'affiche dans le panneau.
- **Les visuels** : des photos du site, pas les extraits vidéo. Ceux-ci font 640 × 250 px et seraient flous dans un panneau de cette taille.
  - Producing : l'affiche de *Triangle*.
  - Production Rental : la caméra Sony et son zoom Fujinon.
  - Casting : l'affiche de *Sele Enat Meder*.
  - Shooting Permit : une **feuille de permis** dessinée en HTML (papier crème, trois champs, la phrase du service), sur laquelle tombe un **tampon** terre cuite « Cleared by us · Ethiopian Film Office · Addis Ababa ».
  - Location Permit : Lalibela, avec le même tampon en crème.
  - Transportation : la route de montagne.
  - Accommodation : Addis-Abeba.
  - Editing : le bureau et ses écrans.
- **Code** : `src/js/services.js`, le bloc « LES SERVICES » de `home.css` (textes de la feuille en unités `cqw`, mesurés sur la largeur du panneau) et la section `#services` d'`index.html`. Les anciennes lignes `.hm-svc` sont retirées.

## Vague 6 bis — les services, une liste qu'on déplie (26/09/2026, nuit)

Ce qu'a dit Dominique : « enlève-moi toutes ces photos. La partie à gauche, c'est bien, et je n'ai même pas besoin de 1, 2, 3… 8. Quand on appuie dessus, on a l'explication. »

- **Retirés** : le panneau de photos, la feuille de permis tamponnée, la lecture automatique et les numéros.
- **Gardé et repris** : la liste en pastilles. L'en-tête est à gauche (étiquette, titre, chapô, collé à l'écran), la liste à droite. Chaque service est un bouton : son nom en Archivo, « Cleared by us » sur les deux permis, un « + ». Un appui l'ouvre (filet crème, le « + » devient « − ») et montre sa ligne de détail en terre cuite, puis son explication. Un seul service reste ouvert à la fois ; sans JavaScript, tout est ouvert.
- **Les explications** reprennent au maximum les phrases du site :
  - Casting et Shooting Permit : « Why Teddy Studio » presque mot pour mot.
  - Producing : le quatrième argument de « Why Teddy Studio ».
  - Production Rental : le matériel.
  - Location Permit : le chapô des lieux et « from the Simien Mountains to the Danakil ».
  - Transportation, Accommodation et Editing : des phrases **nouvelles**, courtes, à faire valider par le client.
- **Code** : la section `#services` d'`index.html`, le bloc « LES SERVICES » de `home.css` et `src/js/services.js` (quelques lignes).

## Vague 6 ter — quatre retouches (26/09/2026, nuit)

Ce qu'a dit Dominique : « enlève ça, le logo mal fait », « une petite animation de la section quand on hover », « le 3D de la cam prend du temps avant de venir quand on scroll », « le 05/06, ça sort de l'écran ».

- **Le dessin du pied de page** (le mortier au trait, `.ftr__mark`) est retiré, avec ses règles dans `shell.css`. Le grand « TEDDY STUDIO » garde sa place (marge reprise dans `refonte.css`).
- **« Why Teddy Studio » au survol** (à la souris seulement) : un filet terre cuite se trace sur l'argument survolé, son numéro et son titre se soulèvent, son texte s'éclaire, et les trois autres s'estompent. Survoler l'espace entre deux arguments n'estompe rien.
- **La caméra arrive plus tôt.** Deux causes, deux corrections :
  1. Elle n'entrait qu'une fois la scène épinglée. Elle entre maintenant dès que la section monte à l'écran, avec sa fiche (ou sa photo, sans 3D). Le modèle se précharge dès la fin du chargement de la page. Quand la scène se fige, la caméra est déjà là et tourne tout de suite.
  2. **Un vrai défaut, trouvé en testant.** Les services, ouverts dans le HTML, se repliaient au chargement avec leur transition d'une demi-seconde. Or les scènes épinglées s'étaient déjà mesurées. Le kit s'épinglait alors ~220 px trop tard : la scène remontait hors de l'écran puis sautait en place. Le même décalage touchait la bobine et la caméra de la galerie, et il revenait à chaque service ouvert.
     - Correction : le repli du chargement se fait d'un coup (`is-still` dans `services.js`), et la page se re-mesure quand sa hauteur change (`watchHeight` dans `home.js`).
     - Vérifié : écart de 0 px au chargement et après chaque service ouvert ou fermé, sur ordinateur et sur téléphone.
- **05/06 (MICROPHONES) sortait de l'écran** sur un grand écran dézoomé. Le titre de chaque plan est maintenant taillé sur la largeur de sa colonne (`cqw`), et non plus sur celle de l'écran.
  - Vérifié à 1280, 1440 et 2667 px : les six titres tiennent dans leur colonne.
  - Sur toute la page, aucun texte ne dépasse de l'écran à 390, 1280, 1440, 1920 et 2667 px.
- **Nouveaux outils** : `docs/outils/overflow.mjs` et `docs/outils/pinalign.mjs`.

## Vague 7 — l'ouverture « hero banner » et la bande des clients (27/09/2026)

Ce qu'a dit Dominique :
- « le hero, je le veux comme ça, dans ce style » (21st.dev, *responsive hero banner* de sensewood8), « et juste en dessous, le Our Clients : on va mettre les vrais logos et les faire défiler » ;
- en cours de route : « enlève cette photo de fond », puis « je veux que la bande des logos soit plus grande, avec une couleur de fond qui les fait ressortir ».

Ce qui a été fait :
- **La disposition de la référence.** Le logo à gauche. À droite, une pilule de verre avec cinq liens (Home, Services, Locations, Our Works, Contact) et l'appel en blanc « Start a production ↗ ». Au centre :
  - un badge : l'heure d'Addis en direct dans une puce blanche, puis « Film service & production across Ethiopia » ;
  - le titre « Gateway to Africa » en serif, puis la phrase d'accroche ;
  - deux appels : « Start a production → » en verre, et « Our works ▷ ».
- **L'entrée** est celle de la référence : chaque bloc monte de 20 px en apparaissant, en 1 s, à 0,1 s d'intervalle.
- **La serif est Fraunces**, déjà celle de l'index et auto-hébergée, en taille d'affiche. La référence annonce Instrument Serif mais s'affiche en Georgia, faute de la charger. Aucune police de plus.
- **Pas de photo de fond.** Une photo du lac de lave d'Erta Ale a été essayée, puis retirée à la demande de Dominique. Le fond est le vert nuit de la page.
- **L'index reste** : un rond de verre à droite de la pilule, seul sur téléphone comme le menu de la référence.
  - L'horloge est passée dans le badge.
  - Le numéro de téléphone et l'ancien bouton terre cuite ne sont plus dans la barre de l'accueil. Ils restent sur les autres pages, et le téléphone reste au contact et au pied de page.
- **Les clients : une bande terre cuite pleine largeur**, en bas du premier écran. « Our Clients » est à gauche, les logos à droite, et ils défilent.
  - Vitesse : environ 30 px/s, pause au survol. En mouvement réduit, la bande est figée et repliée sur deux lignes.
  - Les cinq vrais logos (BGI, Pepsi, World Bank, Prime Minister Office, U.S. Embassy) passent à l'encre sur la terre cuite. Ils mesurent environ 75 px de haut sur un portable.
  - Ethiopia Defence Force et Wosti Jnvis n'ont pas de logo : ils étaient déjà en texte sur le site d'origine, et restent en lettres.
- **Vérifié** :
  - rien ne dépasse de l'écran à 390, 1440 et 2667 px ;
  - les scènes épinglées démarrent pile à leur place ;
  - l'index s'ouvre et se ferme depuis le rond ;
  - la barre prend son fond après l'ouverture ;
  - la construction passe.
- **Code** :
  - `index.html` : la section `.hx`, qui remplace l'ancienne ouverture 2,39:1 et l'ancienne ligne des clients ;
  - `home.css` : les blocs « L'OUVERTURE DE PAGE » et « LA BARRE DE L'ACCUEIL » ;
  - `home.js` : `heroIn()` ;
  - `src/partials/bar.html` : la pilule, cachée hors de l'accueil ;
  - `motion.js` : `[data-bar-clear]`, qui garde la barre transparente sur l'ouverture.
- **Corrigé le 27/09** : les styles de la pilule étaient dans `home.css`, qui ne se charge que sur l'accueil. Sur Locations, Works, Book et Vacancy, ses liens s'affichaient bruts en haut à droite et cassaient la barre. Ils sont maintenant dans `refonte.css`, chargée partout ; la pilule reste cachée hors de l'accueil. Vérifié sur les cinq pages, ordinateur et téléphone.

## Vague 7 bis — la nouvelle barre sur toutes les pages, flottante (27/09/2026)

Ce qu'a dit Dominique : « mets la nouvelle barre sur toutes les pages, et je veux qu'elle soit flottante, sans trait de séparation inférieur ».

- **Sur les cinq pages** : le logo à gauche ; à droite, la pilule (Home, Services, Locations, Our Works, Contact et « Start a production ↗ ») et le rond de l'index. Sur téléphone, le logo et le rond seulement.
- **La page en cours est marquée dans la pilule** : Home sur l'accueil, Locations et Our Works sur leurs pages. Book et Vacancy n'y ont pas de lien.
- **Elle flotte.** Plus de bandeau ni de filet dessous, sur aucune page. Sur le contenu, la pilule et le rond passent à un verre vert sombre avec une ombre portée, pour rester lisibles sur les photos et les textes. Une fois la page défilée, le logo prend le même verre ; il ne bouge pas d'un pixel.
- Elle se range toujours quand on descend franchement et revient dès qu'on remonte.
- **Retirés de la barre** : l'horloge, le numéro de téléphone et l'ancien bouton terre cuite. L'heure est dans le badge de l'accueil ; le téléphone reste au contact et au pied de page. L'ancienne barre est dans la branche `main` (`src/partials/bar.html`).
- **Code** :
  - `src/partials/bar.html` ;
  - le bloc « LA BARRE » de `refonte.css` ;
  - `bar()` dans `motion.js`, qui marque la page en cours et pose `is-scrolled`.
  - Les anciennes règles `.bar__clock`, `.bar__tel` et `.bar__cta` de `shell.css` ne s'appliquent plus à rien : à supprimer avec l'ancien code de l'accueil.

## Vague 8 — des passages plus doux dans le matériel (27/09/2026)

Ce qu'a dit Dominique : « la partie ressources, les transitions sont parfois un peu trop brutes ».

- **La cause, mesurée** (`docs/outils/kitmotion.mjs`, molette réaliste). Tout suivait le défilement, et depuis l'accélération de la séquence, chaque passage ne tenait qu'en quelques pixels :
  - une fiche apparaissait en 70 ms et disparaissait en 40 ms, soit deux à quatre images ;
  - un objet traversait l'écran à 300 px par image et pivotait jusqu'à 27° par image ;
  - une photo se découvrait de 40 % de sa largeur par image ;
  - la lumière principale sautait d'un côté à l'autre à chaque changement d'objet.
- **Le remède** : le défilement ne fait plus que CHOISIR l'outil à l'écran, et mène sa vie (la rotation lente, la lumière qui passe, la photo qui se resserre). L'entrée et la sortie se jouent dans le temps, toujours à la même allure, qu'on défile vite ou lentement, dans un sens ou dans l'autre. La longueur de la séquence ne change pas.
- **L'ordre du passage.** Les côtés alternent, donc la nouvelle fiche prend la place de l'ancien objet :
  1. l'ancienne fiche s'efface (0,3 s) et l'ancien objet dégage son côté (0,65 s) ;
  2. le nouvel objet entre par l'autre côté, déjà vide (1,2 s) ;
  3. la nouvelle fiche se pose ensuite (à partir de 0,55 s).
  Sans cet ordre, la fiche qui arrivait se posait sur l'objet qui partait.
- **Les lumières glissent** vers leur nouvelle place au lieu d'y sauter.
- **Après, à la même molette** :
  - une fiche met 0,4 s à apparaître et 0,2 à 0,3 s à partir ;
  - les objets glissent au plus de 0,1 demi-écran par image et pivotent au plus de 7° ;
  - les photos se découvrent au plus de 7 % par image.
- **Vérifié** :
  - les quatre sortes de passage : 3D → 3D, 3D → photo, photo → photo, et en remontant ;
  - sans WebGL et sur téléphone ;
  - l'arrivée de la caméra à l'approche, et une page ouverte directement plus bas ;
  - les épinglages restent à leur place, et la construction passe.
- **Code** : `src/js/kit3d.js` (`enter`, `leave`, `show`, `planAt`, et les amortis du rendu).

## Vague 9 — trois thèmes à comparer (27/09/2026)

Ce qu'a dit Dominique :
- « on va générer deux autres sites, mais on va juste changer la couleur » : un thème un peu sombre et un autre, au choix ;
- « inspire-toi des sites que je t'ai envoyés, notamment hobro.digital, qui avait des variations entre le noir et le blanc » ;
- « n'hésite pas à changer les polices : on compare, on voit lequel on aime le plus ».

Plutôt que trois copies du site, c'est **le même site en trois thèmes**. Les textes, les photos, la mise en page et les animations sont identiques.

| Thème | Couleurs | Polices |
|---|---|---|
| **Vert** (actuel) | vert nuit, crème, terre cuite | Archivo (titres), Instrument Sans, Martian Mono, Fraunces (ouverture, index) |
| **Nuit** (le sombre) | noir profond, blanc chaud, **ambre** de lampe de projecteur | **Big Shoulders Display** (capitales de fronton de cinéma), **Geist**, **Geist Mono** |
| **Papier** (d'après Hobro) | papier blanc, **grandes sections noires** (le matériel, les lieux, la galerie, le pied de page), un **vert vif** rare | **Instrument Serif** (titres en capitales italiques), Instrument Sans, **DM Mono** |

- **Pour comparer** :
  - un petit sélecteur au milieu du bord droit (« Theme · Vert · Nuit · Papier ») change de thème sur place, sans quitter l'endroit de la page ;
  - les deux scènes 3D suivent : la brume et la grille des lieux, le nom des lieux repeint dans la nouvelle police, la touche de lumière du matériel ;
  - le choix est mémorisé d'une page à l'autre ;
  - adresses directes : `/?palette=nuit`, `/?palette=papier`, `/?palette=vert`.
- **Ce qu'il a fallu reprendre** pour que chaque thème tienne partout :
  - les couleurs écrites en dur de l'ouverture, de la barre et de l'index passent par l'encre du thème ;
  - la bande des clients prend l'accent du thème ;
  - le logo (lettres blanches) garde une pastille noire sur le papier ;
  - les erreurs de formulaire passent en rouge foncé sur le papier ;
  - le grand mot du pied de page est recalibré pour chaque police.
- **Vérifié** :
  - les cinq pages dans les trois thèmes, sur ordinateur et sur téléphone ;
  - aucun texte ne sort de l'écran à 390, 1440 et 2667 px ;
  - les scènes épinglées restent à leur place ;
  - le changement de thème en direct fonctionne, et la construction passe.
- **Contrastes (WCAG)** :
  - Nuit : encre 17:1, gris 9,2:1, gris clair 5,6:1, ambre 9,9:1 ;
  - Papier : encre 18:1, gris 7,9:1, gris clair 5,0:1, vert foncé 5,0:1 ; l'encre sur le vert vif fait 9,5:1.
- **Code** :
  - `src/styles/themes.css` (nouveau, chargé en dernier) ;
  - le script de `src/partials/head.html` pose le thème avant le premier rendu ;
  - `src/js/palette.js` porte le sélecteur ;
  - `reel3d.js` et `kit3d.js` lisent les couleurs du thème.
- **Une fois le thème choisi** :
  - héberger ses polices dans `public/fonts/` (Google Fonts n'est là que pour la comparaison) ;
  - retirer le sélecteur et, si ce n'est pas le Vert, faire du thème choisi le thème par défaut.

## Mise en ligne — 27/09/2026

À la demande de Dominique (« le client choisira, on déploie ; je teste sur mobile et on finalise »), la refonte est en ligne avec ses trois thèmes, sur https://viudesdominique12-droid.github.io/teddy-studio/ (commit `8521448`, publication GitHub Pages réussie).
- Vérifié avant l'envoi, sur la version construite, puis à nouveau en ligne (`docs/outils/prodcheck.mjs`) : les 5 pages dans les 3 thèmes, sur ordinateur et sur téléphone. Aucun fichier manquant, aucune erreur. Les modèles 3D, la bobine des lieux et les polices se chargent.
- Les textes nouveaux (les neuf lieux ; Transportation, Accommodation, Editing) sont partis tels quels, sans validation du client.
- Pour la prochaine mise en ligne : enregistrer sur la branche `refonte`, puis `git push origin HEAD:main`.

## Vague 10 — « Why us » qu'on déplie, et la fluidité sur téléphone (27/09/2026)

Ce qu'a dit Dominique après son essai sur téléphone : « les transitions ne sont pas fluides sur mobile » ; « Why us : comme des carrousels fermés, on appuie sur un pour l'ouvrir, et les autres sont fermés quand un est ouvert ».

- **Why us** : les quatre arguments sont fermés au départ, avec leur numéro, leur titre et un « + ». Un appui en ouvre un et ferme les autres.
  - Sur ordinateur, les quatre colonnes restent, et le texte se déplie sous le titre ouvert. Le filet terre cuite reste tracé sur l'argument ouvert, et le survol est gardé.
  - Sur téléphone, c'est une ligne par argument.
  - Le code est le même que pour les services, mis en commun : `initAccordion` dans `services.js`.
- **La fluidité, mesurée d'abord** (`docs/outils/mobperf.mjs`, rendu sans puce graphique). Seules les deux scènes 3D saccadaient :
  - le matériel : 42 ms par image, des pointes à 192 ms ;
  - les lieux : 21 ms par image, 11 % d'images en retard.
  Tout le reste de la page tenait sous 10 ms.
- **Sur écran tactile seulement** (l'ordinateur ne change pas) :
  - les deux scènes sont dessinées à 1,25 fois l'écran au lieu de 2 ;
  - elles ne sont redessinées que quand quelque chose bouge (plus de souffle ni de respiration au repos) ;
  - les révélations montent sans flou ;
  - les éléments fixés à l'écran (le logo, le rond de l'index, le sélecteur de thème) prennent un verre dense au lieu d'un flou recalculé à chaque image.
  Résultat, sans puce graphique : les lieux passent à 11 ms et 0 % de retard, le matériel à 29 ms avec des pointes à 125 ms. Avec le processeur ralenti ×4, plus aucune section ne dépasse 10 ms au 95e centile, sauf « About » (24 ms).
- **Le changement de page** : le chevron glisse désormais d'un bloc (`translate`, sur la carte graphique) au lieu de redessiner deux formes plein écran à chaque image. L'aspect est identique.
- **Changer de thème** redécoupe maintenant les lignes des titres : un paragraphe gardait sinon les coupures de l'ancienne police.
- **Vérifié** : sur la version construite, les 5 pages dans les 3 thèmes, sur ordinateur et sur téléphone, sans fichier manquant ni erreur ; aucun débordement ; les épinglages restent à leur place.

## Vague 11 — la fluidité, sans rien changer à l'image (27/09/2026)

Ce qu'a dit Dominique : « le site lag beaucoup, il faut l'optimiser sans rien changer ; certaines transitions n'ont même pas le temps d'avoir lieu ».

- **Les conditions réelles.** Dominique regarde le site dans Safari, sur un MacBook Pro M5, sur batterie et en économie d'énergie. Dans ce mode, Safari plafonne les animations à 30 images/s (60 sur secteur). Chrome, lui, restait presque fluide. La mesure s'est donc faite aussi dans le moteur de Safari (WebKit, via Playwright), toujours contre la version d'origine servie à côté.
- **Les causes, mesurées dans Safari** :
  - **L'ouverture** : 7 images/s pendant le tracé, 5 pendant la plongée. Le masque SVG de 20 000 unités était recalculé sur le processeur à chaque image, même fermé.
  - **La caméra de la galerie** : ses trois masques SVG donnaient des images de 600 ms pendant le zoom.
  - **La 3D** : 150 à 700 ms d'arrêt à la première apparition de chaque modèle (shaders, textures, états de dessin Metal), et 130 à 370 ms à l'arrivée sur la bobine.
  - **Le démarrage de l'accueil** : 275 à 460 ms d'un seul bloc (processeur ralenti ×4), en pleine fin de plongée ou pendant le volet d'arrivée.
  - **Le grain** : un calque de 180 % × 180 % de l'écran, recomposé à chaque image. C'est lui qui causait presque toutes les images en retard restantes.
  - Le flou des révélations et les verres dépolis ont été mesurés à part : ils ne coûtent rien et n'ont pas été touchés.
- **Les remèdes**, avec la même image :
  - **Masques → découpes** : chemins de découpe en pair-impair, de même géométrie. Mêmes animations, même courbe (`index.html`, `refonte.js`).
  - **La 3D préparée d'avance, hors champ** : les textures sont envoyées à la carte graphique et les shaders compilés (`compileAsync`). Un dessin de chauffe passe à travers une découpe vide, sans toucher aucun pixel. Les modèles se décompressent dans deux Web Workers, et les photos des lieux sont décodées hors du fil de la page (`kit3d.js`, `reel3d.js`).
  - **Le démarrage par tranches**, une par image (`breathe`, `motion.js`) :
    - avec l'ouverture, la page se prépare pendant qu'elle attend le clic ;
    - sans ouverture, après le volet et l'entrée du premier écran, ou dès que le visiteur fait défiler ;
    - un clic ou une touche termine tout d'un coup : une ancre (Contact, Locations) vise ainsi la bonne hauteur (`home.js`).
  - **Le grain retaillé au plus juste** : 106 vw × 105 vh. Les tuiles partent toujours de −40 % de l'écran et le saut est le même (`base.css`).
- **Résultats**, sur les versions construites comme pour GitHub Pages :

  | Moment | Avant | Après |
  |---|---|---|
  | Ouverture dans Safari, tracé | 8 images | 36 images |
  | Ouverture dans Safari, plongée | 8 images, jusqu'à 465 ms | 66 images, aucune en retard |
  | Accueil dans Safari, pire image | 889 ms | 48 ms |
  | Accueil dans Safari, images en retard | 20 | 2 |
  | Accueil dans Chrome, pire image | 133 ms | 17 ms, plus aucune en retard |
  | Safari au format téléphone, pire image | 907 ms | 44 ms |
  | Arrivée sur l'accueil depuis Locations | 1 061 ms | 79 ms |

- **Vérifié** :
  - **L'image ne change pas.** Captures comparées au pixel près à l'original : l'ouverture, la caméra, le grain aux deux positions de son saut, la bobine figée au même instant. Une seule différence : dans Safari, le bord du trou reste net à la fin du zoom, comme dans Chrome. Safari calculait le masque en basse résolution et ce bord était flou.
  - **Les ancres.** Un clic sur Contact dans la première seconde arrive au même pixel qu'avant, et `/#locations` aussi.
  - **La construction.** `prodcheck.mjs` : les 5 pages, les 3 thèmes, sur ordinateur et sur téléphone, sans aucun problème.
- **Pour mesurer à nouveau** : `docs/outils/abperf.mjs`.
- **À savoir.** En économie d'énergie, Safari bride tout le JavaScript à 30 images/s, y compris le défilement doux (Lenis). Le défilement natif du Mac n'est pas bridé. Piste, à décider avec Dominique : passer au défilement natif quand le navigateur bride la cadence.

## Vague 12 — trois retouches (27/09/2026)

Ce qu'a dit Dominique :
- « après la première page et la transition, on n'apparaît pas tout en haut mais à What we handle » ;
- le rond de l'index et « Start a production » : « orange, comme le orange qu'il y a sur le site » ;
- « le scroll saute trop vite certains kit travel, comme le 4 » ;
- puis : « l'effet sur le défilement, le mouvement des objets, doit rester exactement identique », et « pour le 4, 5 et 6, l'écran descend avec le défilement alors que seul l'objet est censé apparaître ».

Ce qui a été fait :
- **L'arrivée en haut.** Quand on entrait d'un geste de pavé tactile, la lancée du geste faisait encore défiler la page après la plongée. On arrivait sur les services, et même à 1 941 px dans Safari. Ce défaut existait déjà avant la vague 11. Désormais, le défilement ne reprend que quand le geste s'est tu : 200 ms sans molette, 2 s au plus (`bootReel`, `refonte.js`).
- **Les deux boutons en terre cuite.** Le rond de l'index, sur les cinq pages, et « Start a production » de l'accueil sont désormais en terre cuite pleine avec l'encre basalte (contraste 5,2:1) : le couple de la bande des clients.
  - Au survol, ils passent à `--gold-lt`.
  - Dans les autres thèmes, ils prennent l'accent du thème : ambre pour Nuit, vert vif pour Papier.
  - Leur verre dépoli est retiré, puisqu'il ne sert à rien sur un aplat. L'index ouvert ne change pas (`refonte.css`, `home.css`).
- **Le matériel : aucun outil n'est plus sauté, et rien d'autre ne change.**
  - **La mesure.** À 400 px/s, l'éclairage et les micros n'apparaissaient jamais. À 700 px/s, seuls la caméra et le fond vert apparaissaient. L'arrivée d'un outil dure environ 1,2 s, alors qu'une photo n'a que 0,5 écran de course.
  - **Un essai retiré.** J'ai essayé « un outil par geste » (défilement guidé), puis je l'ai retiré : le défilement et le mouvement des objets doivent rester identiques.
  - **Chaque outil a son temps.** Il reste au moins 1,3 s à l'écran, puis le suivant prend sa place, dans l'ordre, avec les mêmes gestes d'entrée et de sortie. Au pas normal (250 px/s), les outils changent aux mêmes pixels qu'avant.
  - **La scène ne se libère pas trop tôt.** Tant que le dernier outil n'est pas passé, un geste qui atteint le bout de la séquence y est retenu, puis le défilement reprend. Cela vaut vers le bas seulement, et sur ordinateur. Si l'on quitte la séquence autrement (clavier, barre, téléphone), l'outil demandé s'affiche directement, comme avant : jamais un outil qui apparaît pendant que l'écran défile.
  - **Vérifié** à 250, 400, 700, 1 100 et 2 000 px/s, et avec des gestes de pavé tactile : les six outils sont vus à chaque fois, tous avec la scène immobile (`show`, `advance` et la retenue dans `kit3d.js`).

## Pistes pour la suite

- **À faire valider par le client avant la mise en ligne** : les neuf présentations des lieux (vague 5 bis), et les explications de Transportation, Accommodation et Editing (vague 6 bis).
- **L'ouverture en plan technique** (« Click to enter ») : la garder sur l'accueil sobre ? Question posée à Dominique, sans réponse.
- **La fiche d'appel en bas à gauche** (« Call sheet ») : elle n'est plus sur l'accueil, et plus rien ne la remplit. Elle reste, vide, sur les pages intérieures. La retirer partout ? À trancher avec Dominique.
- **Le code de l'ancien accueil** (`main.js`, les blocs de l'accueil dans `refonte.css` et `acts.css`, `acts.js`, `lit.js`, `momentum.js`, `timeline.js`) : à supprimer une fois l'accueil validé. Il faut garder l'ouverture (`bootReel`, `.boot`) et la caméra de la galerie (`cameraEntry`, `.cam`).
- **La retouche de lisibilité** (le texte terre cuite à 4,10:1 et les libellés gris à 4,15:1 sur le vert) : toujours en attente de décision.
- **Les outils de travail** (captures, préparation des modèles 3D) sont dans `docs/outils/`, avec leur mode d'emploi.
- **Le thème à retenir** (vague 9) : Vert, Nuit ou Papier. Réponse attendue de Dominique, puis du client.
- **Les logos manquants** : Ethiopia Defence Force et Wosti Jnvis sont en texte dans la bande des clients. Si Dominique a leurs logos, les aplatir comme les autres (crème sur transparent, 200 px de haut) et les poser dans `public/clients/`.
