# RESEARCH — Phase 0, relevé du 24–25/09/2026

> **Méthode.** Chaque référence a été **ouverte** : page Awwwards lue, site capturé dans un navigateur isolé (1440 et 390 px, au fil du défilement), étude de cas lue quand elle existe. Aucune n'est analysée de mémoire. Les chercheurs marquent chaque affirmation **vu** (capture regardée), **lu** (texte ouvert), **mesuré** ou **déduit**.
>
> **Dossiers complets**, où tout est sourcé avec les URL, les notes du jury et les captures : [`recherche-film.md`](docs/refonte/phase0/recherche-film.md) · [`recherche-craft-A.md`](docs/refonte/phase0/recherche-craft-A.md) · [`recherche-craft-B.md`](docs/refonte/phase0/recherche-craft-B.md) · [`recherche-tech.md`](docs/refonte/phase0/recherche-tech.md). Captures : `ref/phase0/`.
>
> **Ce document** donne, dans l'ordre du brief (§3.4) : 1. trois lignes par référence ; 2. quinze patterns ; 3. dix clichés ; 4. le barème réel et ce qu'il implique. Puis 5. l'état de l'art technique et 6. les erreurs relevées dans le brief.
>
> **Légende des trois lignes** : **✓** ce qui marche · **→** pourquoi ça sert *son* sujet · **Teddy** transposable ou non, et pourquoi.

---

## 0. Ce que la recherche change pour Teddy

1. **Aucun site primé n'est un bureau de service de production.** Aucune des 8 références film ne montre de matériel, de permis, de carte ou de logistique. Le modèle de « preuve d'infrastructure » que cherche l'audience de Teddy est donc à inventer. Les meilleurs analogues viennent d'ailleurs :
   - **White Desert** pour les lieux (le rêve, puis la donnée) ;
   - **Cerebrium** pour la preuve face à un acheteur technique et pressé ;
   - **Bitter Creek** pour la langue du plateau ;
   - **USAvionix** et **Tracing Art** pour une navigation qui est aussi un sommaire.
2. **L'utilisabilité est le point faible des primés, et le besoin n° 1 de Teddy.** Le jury lui donne 30 % de la note, et c'est la plus basse de 19 SOTD sur 21. Une audience qui veut briefer en 30 secondes fait de l'utilisabilité une arme créative, pas une contrainte.
3. **Les transitions qui marquent sont des phénomènes du monde du client** (plonger, descendre d'orbite, traverser un nuage), pas des volets graphiques. Teddy a un monde réel, de −125 m à 4 550 m, que personne d'autre ne peut montrer.
4. **Ce que Teddy a et que personne n'a** : une heure et un calendrier propres (données vivantes réelles), une écriture (le ge'ez), 4 675 m d'amplitude en une seule juridiction, 2003. Les patterns « donnée vivante » (Lando, Bruno) et « preuve collée à l'objet » trouvent ici une matière qu'aucun primé n'avait.
   ⚑ *Décision du 25/09* ([DECISIONS.md](DECISIONS.md)) : on ne touche pas aux informations. Les faits absents du site (2003, AMAA, Sebastopol Cinema, titres amhariques en texte) ne sont donc **pas ajoutés**. Restent utilisables, parce qu'ils sont déjà sur le site :
   - l'heure d'Addis et la fenêtre de lumière (l'heure et le calendrier éthiopiens seraient une autre *façon d'afficher* l'heure déjà présente) ;
   - l'amplitude de 4 675 m et la juridiction unique ;
   - les 9 lieux et leurs altitudes ;
   - les films, les clients, les services.
5. **La pile en place (Vite + GSAP + Lenis, 78 kB gzip) suffit à tout**, sauf à une scène WebGL persistante entre les pages, qui demanderait un routeur client. Ce choix se fera en Phase 2, d'après la direction retenue.

---

## 1. Les références, trois lignes chacune

### 1.1 Secteur film / TV (catégorie Film & TV d'Awwwards)

**Siena Film Foundation** — N. Miranda, F. Valla, G-NS Studio · SOTM mars 2025 · jury 7,9 · Developer Award
- **✓** Chaque film est une affiche plein cadre qui porte sa preuve : festival, prix, trois citations de presse. Le menu est un ticket qui affiche le film en cours.
- **→** Une maison de documentaires d'auteur se vend par la reconnaissance de ses films, et la direction artistique vient de l'architecture toscane du client.
- **Teddy** : partiellement. Oui à la preuve imprimée sur chaque film (2003, AMAA 2015). Non à la porte ENTER et au mode d'emploi en 5 consignes avant de pouvoir naviguer.

**LxL Creative** — Jordan Gilroy · SOTD 17/09/2026 · 7,37 · Developer Award
- **✓** Chaque série montrée porte la liste de ce qui a été livré (Key Art · Unit · EPK · Social). Témoignages signés par métier. Le CTA s'adresse à « qui a une production à venir ».
- **→** L'acheteur d'un diffuseur veut savoir quels livrables, sur quelles séries, sans cliquer.
- **Teddy** : oui, pour l'étiquetage « projet × service rendu » (permis patrimonial, convoi, location 12K). Non pour sa palette orange et script de divertissement.

**Michael Gatt** — Synchronized Studio, Zhenya Rynzhuk · SOTD 18/08/2026 · 7,45 · Developer Award
- **✓** Un espace WebGL de photogrammes de ses crédits, doublé d'un **INDEX VIEW** qui liste tout en un écran, avec l'extrait qui passe au survol.
- **→** Un compositeur prouve ses crédits par les images des œuvres, pas par des logos.
- **Teddy** : oui, pour la double lecture « immersion / index ». Non pour la porte sonore : le son n'est pas le produit de Teddy.

**PALOMINO** — METABOLE STUDIO · Honorable Mention 19/08/2026
- **✓** Chaque carte de service = une promesse + 8 à 9 prestations concrètes + « voir les projets associés » + contact. Témoignages reliés à leur projet.
- **→** Un studio de sport se juge aux athlètes et aux fédérations qu'il a filmés, et à sa capacité en direct.
- **Teddy** : oui, pour la carte service : c'est la forme directe de « la preuve de l'infrastructure ». Non pour le hero en capitales géantes sur vidéo. Ce qui l'a probablement privé du SOTD (déduit) : une grammaire attendue.

**EverWonder Studio** — Dylan Brouwer · Honorable Mention 18/08/2026
- **✓** Chaque projet affiche le logo du diffuseur (Paramount+, Universal) ; une section presse cite des titres avec leur média.
- **→** Qui livre aux plateformes prouve sa valeur par le diffuseur.
- **Teddy** : partiellement. Oui au commanditaire nommé sur chaque projet (World Bank, Pepsi, Ambassade des États-Unis…). Non à la grammaire la plus partagée de la catégorie : capitales condensées sur vidéo, texte mot à mot, 35 vidéos.

**Josh Goldsmith** — jashhh · Honorable Mention 12/08/2026
- **✓** Une bascule « Previews / Index ». L'index date 19 projets (client — format — année). Bio en jalons vérifiables.
- **→** Un réalisateur-producteur montre son ancienneté d'un coup d'œil.
- **Teddy** : oui, pour l'index daté de 2003 à aujourd'hui et pour la bio en jalons (Jimma 1970, Los Angeles Film School, 2003, Sebastopol). Non pour le cube 3D. Ce qui l'a probablement privé du SOTD (déduit) : aucune identité typographique.

**LUT Studios** — auto-soumis · Honorable Mention 11/08/2026
- **✓** Deux studios (Los Angeles, Erevan) avec leurs téléphones en clair, plus une prise de rendez-vous.
- **→** Un studio d'effets visuels démontre son rendu par l'interface elle-même.
- **Teddy** : oui pour les coordonnées et la prise de rendez-vous (24/7, Meskel Square). Non pour la navigation en vidéos préchargées : environ 36 Mo, écran « LOADING » resté affiché 30 s dans le relevé.

**CA Film Creatives** — The Moss WDS · **simple nomination (13/08/2026), sans mention**. Le brief dit HM : c'est une erreur.
- **✓** Un chiffre ou un prix sur chaque cas ; le processus en 4 phases, avec leurs tâches.
- **→** Un promoteur immobilier raisonne en retour marketing.
- **Teddy** : partiellement. Oui au processus par phases (permis → casting → line production → convois → post). Oui aux chiffres, seulement s'ils sont réels. La grammaire (crochets, Bebas Neue, écrans noirs d'attente) l'a probablement privé de mention (déduit).

**Peryton Film** — WEFLASH Studio · **nominé le 18/09/2026, vote ouvert au relevé**. C'est la référence reproduite par la passe précédente (voir AUDIT §1 et §6).
- Relevé seulement pour mesurer la parenté, pas analysé en trois lignes.

### 1.2 Territoire, paysage, expédition

**White Desert** — Malvah, Geoff Dawes, Usudo · SOTD 11/09/2026 · 7,31 (Content 7,74, sa meilleure note) · Developer Award
- **✓** Chaque image de rêve est suivie, dans le même défilement, d'une donnée vérifiable : saison, 12 invités par camp, 5 itinéraires avec leurs prix, coordonnées GPS des camps, vol « CPT → WFR » en 05:30. « How it works », « Enquire » et une adresse « Trade » restent toujours accessibles.
- **→** On vend une semaine en Antarctique jusqu'à 115 500 $ : l'acheteur doit croire au rêve *et* à la sécurité.
- **Teddy** : **oui, le modèle le plus direct pour les 9 lieux** : lieux extrêmes, logistique lourde, clientèle qui décide sur preuves. Seraient de l'imitation : le mot géant et le white-out.

**OceanX 2025, Year in Review** — Unseen Studio + PROPAGANDE · SOTD 23/02/2026 · 7,44 · sans Developer Award
- **✓** Le défilement fait avancer le navire, qui ne recule jamais. Le détail s'ouvre dans un panneau latéral qui garde la carte et l'épingle visibles, avec « Back to timeline ». Un bouton « Chapters » permet d'aller droit au but.
- **→** Le rapport annuel d'une organisation d'exploration devient le trajet réel de son navire.
- **Teddy** : oui, pour le mécanisme : « avancer = se déplacer sur le terrain », et chaque étape est un lieu épinglé, documenté. Seraient de l'imitation : le navire, le globe, le bleu nuit.

**Montfort** — Immersive Garden · SOTM juin 2025 · 7,62 · Developer Award (Animations 9,00). **Ce n'est pas un territoire** : c'est une société de négoce.
- **✓** Une seule traversée de ciel, et des « respirations » : un écran entier de nuages sans texte entre deux chapitres.
- **→** Une société abstraite se donne une géographie imaginaire, calme et haute.
- **Teddy** : partiellement. Changer de chapitre par une couche du milieu naturel plutôt que par un volet graphique a du sens (la lumière d'altitude). Mais les lieux de Teddy sont réels et doivent rester reconnaissables.

**The Tuscan Journey Begins** — MONOGRID pour Weekend Max Mara · SOTD 13/09/2026 · 7,27. **C'est une campagne pour un sac**, la Toscane y sert de décor.
- **✓** L'ouverture a une cause physique (le store du compartiment remonte). Boucle vidéo assumée à 15 images/s. Le seul site du lot qui gère la réduction des animations.
- **→** Le train met le produit au premier plan et la Toscane derrière la vitre.
- **Teddy** : partiellement, pour le cadrage d'un paysage réel à travers un cadre en mouvement (convois, route de montagne). Seraient de l'imitation : le train, la peinture, le papier vert.

### 1.3 Étalons de craft — Unseen, Malvah, Immersive Garden

**Unseen Studio, site du studio** — SOTM février 2023 · 7,99 · Developer Award (Animations 9,20)
- **✓** Changer de page, c'est se déplacer : la caméra plonge sous l'eau en ~1,5 s, et le titre sortant se lit à l'envers dans le reflet. La même scène est recadrée sur téléphone.
- **→** Le studio de « l'invisible » met son travail sous la surface.
- **Teddy** : partiellement. Le principe « chaque rubrique est un lieu » a chez Teddy un répondant réel (9 lieux, −125 à 4 550 m). Mais Unseen invente un monde, alors que Teddy a des lieux filmés. Non à l'écran d'entrée avec choix du son.

**Unseen, 2025 Wrapped** — SOTD 24/03/2026 · 7,44 · Developer Award
- **✓** Une frise mois par mois ; la mascotte vole sur une ligne pointillée et sert de repère de progression.
- **→** Un bilan d'année est une ligne du temps.
- **Teddy** : partiellement, pour la frise datée (films de 2003, 2010, 2014 ; calendrier de 13 mois). Non pour le poids : plus de 200 Mo.

**Illoca** — Unseen · SOTD 04/09/2026 · 7,44 · Developer Award
- **✓** Un seul décor et une seule caméra : l'objet se transforme sur place (croquis → plan → volume → étages), sans une seule coupe.
- **→** Le produit promet de transformer un croquis en projet, et le site le montre.
- **Teddy** : partiellement. La chaîne réelle permis → convoi → tournage → post s'y prêterait, mais il faudrait un décor 3D sur mesure.

**Hubtown** — Unseen · SOTD 10/06/2026 · 7,66 · Developer Award (Accessibilité 6,60)
- **✓** Un objet-héros unique qui finit en carte du territoire bâti. L'index des chapitres reste toujours visible.
- **→** Un promoteur veut paraître à l'échelle d'une ville.
- **Teddy** : partiellement, pour « le spectacle débouche sur l'outil » (la carte des 9 lieux). Non pour le poids : ~86 Mo déclarés.

**Malvah, site du studio** — Studio of the Year 2025 (21 SOTD, 0 SOTM : c'est la régularité qui est primée) · site SOTD 2024 · 7,70
- **✓** Une seule famille de caractères ; le texte reste fixe pendant qu'une colonne d'images défile ; une horloge locale en direct dans le pied de page ; volet de sortie de ~0,6 s.
- **→** Un studio de marque vend de la confiance, et montre qu'il tient une page sans effets.
- **Teddy** : oui pour la retenue, qui sert une audience technique et ne coûte rien. Non pour l'entrée 3D et le reel de 55 Mo chargé d'office.

**Seventeen** — Malvah · SOTD 10/12/2025 · 7,35 (Usability 6,89)
- **✓** L'accueil est un index ; la liste des disciplines passe au noir pour celles du projet actif.
- **→** Une agence se présente par un système plutôt que par des images.
- **Teddy** : partiellement, pour la légende vivante « quels services sur quel film ». Le coût de l'abstraction se mesure : 6,89 en Usability.

**KODE Immersive** — Malvah · SOTD 13/05/2025 · 7,62 · Developer Award
- **✓** Un symbole 3D par service, dans la même matière pour tous.
- **→** Une société d'expériences immersives prouve sa compétence en la démontrant.
- **Teddy** : non. Teddy ne vend pas de technologie ; ce registre détournerait de l'infrastructure réelle.

**Bitter Creek** — Malvah · SOTD 11/09/2025 · 7,47 · Developer Award — **une société de production**
- **✓** Codes de catalogue par projet. Au survol, la vignette devient un moniteur de plateau (repères aux coins, timecode). Effectifs chiffrés dans le pied de page.
- **→** Une société de production parle la langue du plateau : la forme prouve le métier.
- **Teddy** : oui, c'est la référence la plus proche du métier. Seraient de l'imitation : son monogramme, sa mono, sa phrase en grille.

**Odd Ritual** — Malvah · SOTD 11/04/2026 · 7,55 (Accessibilité 6,20)
- **✓** Le code produit imprimé comme une étiquette ; l'ancrage local revendiqué (« Designed and made locally — Cape Town »).
- **→** Une marque héritage se donne un vestiaire de club.
- **Teddy** : partiellement, pour l'ancrage local affirmé par des faits (premier long produit en Éthiopie par un Éthiopien ; des salles qui ne passent que des films éthiopiens). À proscrire : la fenêtre newsletter qui bloque l'arrivée.

**Immersive Garden, site du studio** — Agency of the Year 2025 · SOTM janvier 2025 · **8,0**, la meilleure note relevée
- **✓** Une matière unique, un mur de plâtre en bas-relief 3D, relie un portfolio hétérogène ; les repères de navigation sont taillés dans cette matière.
- **→** Une agence du luxe veut paraître artisanale.
- **Teddy** : partiellement, pour « une matière qui relie des éléments disparates » (films, services, lieux). Le plâtre est leur signature.

**Aramco « The Birth of Oil »** — Immersive Garden · SOTD 27/05/2025 · 7,30 (Usability 6,72) — relevé sur mobile seulement
- **✓** Des chapitres explicites (I, II, Prev/Next), chargés un par un.
- **→** Raconter l'origine géologique légitime l'entreprise.
- **Teddy** : partiellement, pour le temps géologique (Danakil, lac de lave). Le prix d'un récit linéaire imposé se lit dans ses 6,72 en Usability.

### 1.4 Étalons de craft — lot B (sites de l'année et grands studios)

**Lando Norris** — OFF+BRAND · **Site of the Year 2025** + Users' Choice · SOTD 8,18
- **✓** Le casque du pilote devient l'interface :
  - un masque en forme de casque suit le *mouvement* du curseur, révèle la visière 3D, puis se referme en 0,3 à 0,6 s ;
  - le fond reprend les courbes du casque ;
  - la collection montre 16 casques datés.
  Une carte « prochaine course » sert de donnée vivante, et chaque photo porte la légende « lieu, année ».
- **→** L'identité d'un pilote, c'est son casque ; la carte de course ancre le site dans la saison réelle.
- **Teddy** : partiellement.
  - Oui à un objet propre au client qui fournit à la fois l'interaction, le fond et la collection.
  - Oui à la donnée vivante : l'heure éthiopienne.
  - Non au portrait-vedette : l'audience cherche l'infrastructure, pas une figure.
  - Le site découpe 412 fragments de texte animé et n'a aucune règle de mouvement réduit.

**Messenger** — abeto · **Developer Site of the Year 2025** (et non SOTY) · SOTD 7,92 · Developer 8,21
- **✓** Une contrainte unique, une micro-planète, produit tout le design. Toute la couleur du monde tient dans un atlas de 16×16 px : on le change et le monde entier est ré-éclairé. Dix joueurs par instance et pas de chat : on retire pour protéger l'émotion.
- **→** Un jeu de livraison de messages au calme étrange : chaque système protège la même émotion.
- **Teddy** : non comme format (un jeu de 15 minutes sans guidage). Oui comme méthode : un paramètre global unique qui ré-éclaire tout. La lumière réelle d'Addis pourrait jouer ce rôle.

**Scout Motors** — Locomotive · **E-commerce of the Year 2025** · SOTD 7,6
- **✓** Le rêve et la petite ligne dans le même écran : le slogan en très grand, puis, 4 à 5 fois plus petits dessous, le prix et la date de production. La carte « Reserve » arrive après le hero et reste. L'archive de 1961 fait la preuve d'héritage.
- **→** Une marque neuve qui ressuscite un nom de 1961 doit prouver sa légitimité.
- **Teddy** : oui, pour la preuve d'héritage (2003, 2010, Sebastopol) et la ligne pratique sous l'image. C'est un contre-modèle de poids : 22,9 Mo, chargement terminé à 9,3 s.

**Tracing Art** — Resn pour le Getty · SOTM juillet 2025 · SOTD 7,68 (Content 8,09)
- **✓** Le tableau reste épinglé. Seuls le texte et l'année sur une réglette changent (1700 → 1940). Le sommaire des chapitres est rangé *dans* la barre de progression.
- **→** La provenance est une chaîne de propriétaires dans le temps : le défilement devient le temps.
- **Teddy** : oui en principe (filmographie de 2003 à 2014, parcours d'un permis). Non pour la longueur : 90 écrans.

**Navigate** — Resn · SOTM avril 2025 · SOTD 7,93 — site hors ligne, relevé sur l'archive Wayback
- **✓** Le « squelette de phrase » : les mots pas encore lus sont des barres grises de la bonne longueur, que le défilement remplit.
- **→** Une plateforme qui transforme la collecte de données en jeu parle comme un jeu.
- **Teddy** : non. Registre ludique, lecture ralentie, accessibilité à 6,6.

**USAvionix** — basement.studio · SOTD 09/09/2026 · 7,41 (Usability 7,03)
- **✓**
  - La barre de progression est la table des matières : 10 graduations, celle du chapitre en cours s'ouvre et affiche son nom.
  - La fiche technique est reliée par un filet à la pièce exacte du drone.
  - L'objet est montré dans le noir avant d'être éclairé.
- **→** La valeur d'un drone autonome, c'est la mission : la page *est* une mission.
- **Teddy** : partiellement. Oui à la barre-sommaire et à la légende reliée à l'objet (caméra 12K, optiques, drone). Non à l'esthétique HUD militaire : un cliché, étranger à un bureau de cinéma.

**Cerebrium** — agence KOKI-KIKO, direction de création Louis Paquet · SOTD 10/09/2026 · 7,39
- **✓** Chaque section est une preuve : comparatif chiffré, capacité, régions, conformité. « Try it now » et « Book a demo » sont posés dès le titre. « Cliquer et tenir » fait *ressentir* la vitesse promise.
- **→** Des développeurs achètent de la preuve : l'infrastructure abstraite devient tangible.
- **Teddy** : **oui, l'audience la plus proche** : un acheteur technique et pressé qui veut la preuve de l'infrastructure. Les chiffres doivent venir du client. À noter : l'équipe a abandonné WebGPU (20 s de compilation des shaders).

**Bruno's Portfolio** — Bruno Simon · SOTM janvier 2026 · SOTD 8,11
- **✓** Le chargement est déjà la scène : l'anneau tracé sur le sol devient le bord du décor. Météo, jour et nuit sont identiques pour tous au même instant. Les feuilles devant la voiture rétrécissent pour qu'on voie où l'on va.
- **→** Un développeur créatif prouve sa compétence en *étant* la chose.
- **Teddy** : non comme format (un jeu de conduite, accessibilité 6,6). Oui en principe : un état du monde partagé en temps réel, comme l'heure éthiopienne, la même pour tous au même instant.

### 1.5 Techniques — tutoriels Codrops 2026

| Tutoriel (auteur, date lue) | ✓ Ce qui marche | Teddy |
|---|---|---|
| Scroll-Revealed WebGL Gallery — Mazouni, 02/02 | Le DOM reste la source, le WebGL peint par-dessus ; l'image « voyage » entre pages grâce à Barba | Partiellement (9 lieux en pages détail) ; ~144 kB gzip, rien sur la réduction des animations ni l'accessibilité |
| Horizontal Parallax Gallery — Faure, 19/02 | La parallaxe = déplacer l'image dans une fenêtre fixe, avec une marge supérieure au décalage | Oui, **en DOM** : 9 lieux ne justifient pas le WebGL (l'auteur le réserve aux dizaines d'images) |
| SVG Mask Transitions — Watanabe, 11/03 | Des masques SVG en lames ou en grille, pilotés par le scroll : nets, sans contexte GPU | Oui, pour passer d'un lieu à l'autre ; ajouter la réduction des animations et un vrai texte alternatif |
| Sticky Grid Scroll — Plawinski, 02/03 | Scène `sticky` + une timeline découpée en phases | Partiellement ; 425vh pour révéler une grille, c'est retarder l'accès au contenu |
| Never Ending Story — Taylor, 28/05 | Boucle infinie avec Lenis | **Non** : un bureau de production doit avoir une fin (contact, call sheet) |
| Infinite Gallery + Flip — Aditya, 30/07 | La vignette se transforme en plein écran (Flip) | Seulement le morph Flip (+9 kB) ; pas le défilement confisqué |
| Persistent Page Transitions WebGPU — Paine, 30/06 | Un canvas unique, des plans jamais détruits qui suivent le DOM | Partiellement ; WebGPU est inutile ici (+113 kB gzip par rapport à WebGL), et exige un routeur SPA |
| Seamless 3D Transitions — Ruffini, 18/03 (**Webflow + Barba**, omis par le brief) | Canvas hors du conteneur Barba : la caméra glisse entre des modèles alignés | La structure de référence **si** un objet 3D persistant est retenu |
| Shader Uniforms → Clip-Path Wipes — Guignand, 06/05 | Un seul `progress` pilote toute la chorégraphie ; WebGL monté une fois, textures échangées, veille au repos | Oui pour la discipline ; OGL (15 kB), et les View Transitions y sont *same-document* |
| Système de motion — Arnaud Rocca, 31/03 | Des effets GSAP nommés, enregistrés automatiquement ; le mobile est une autre composition, sans WebGL | Oui : Vite est déjà en place (coût ≈ 0) |
| Retenue — Joffrey Spitzer, 18/02 (titre paraphrasé par le brief ; routeur **Swup**) | Trois recettes seulement, appliquées partout | Oui : le cas le plus proche de Teddy (SSG, routeur léger de 7,5 kB) |
| Datamosh temps réel — Fanton, 02/09 | Reconstruit la vraie erreur d'un codec vidéo | **Non** : deux rendus, quatre passes plein écran, rien sur la photosensibilité |
| Lens effect — Nakata, 25/08 | Une loupe carrée qui suit le pointeur | **Non** : dépend de la souris ; le viseur est un cliché |

---

## 2. Quinze patterns observés chez les gagnants

Chacun est vu chez au moins deux studios qui ne se connaissent pas. La deuxième ligne répond à la question du brief : *comment ça servirait un producteur qui veut tourner en Éthiopie ?*

1. **La preuve collée à ce qu'elle prouve.** Vu chez Siena (prix et presse sur chaque film), EverWonder (diffuseur sur chaque projet), LxL (livrables par série), CA Film (un chiffre par cas), Lando (« lieu, année » sous chaque photo), Tracing Art (ligne de crédit sous chaque œuvre).
   → *Pour le producteur* : sur chaque film, chaque lieu, chaque service, la preuve est là où il regarde — année, commanditaire, service rendu, permis obtenu, reconnaissance (3 nominations AMAA 2015) — et non dans une page « références » à part.

2. **Le rêve, puis la donnée, dans le même défilement.** Vu chez White Desert (image, puis saison, capacité, prix, GPS, temps de vol), Scout (slogan, puis prix, date et renvoi aux mentions légales), OceanX (épingle, lieu, date).
   → *Pour le producteur* : chaque lieu éthiopien donne envie, puis dit aussitôt ce qui le rend faisable : altitude, accès, permis, fenêtre de lumière, délai.

3. **Le plateau comme preuve.** Vu chez LxL (cadreur au travail, plein cadre), Palomino (tournage en vestiaire, moniteur de plateau), CA Film (vignettes de tournage à côté de chaque film).
   → *Pour le producteur* : l'équipe et le matériel au travail sur de vrais lieux prouvent l'infrastructure mieux qu'une liste. ⚑ *Décision du 25/09* : on travaille avec les images existantes seulement ; ce pattern s'applique à la façon de les montrer.

4. **La carte de service : prestations concrètes + projets liés + contact.** Vu chez Palomino (4 cartes, 8 à 9 prestations chacune), CA Film (4 phases et leurs tâches), LxL (6 services et projets étiquetés), Cerebrium (liste épinglée et preuve chiffrée). Variante : les *scénarios types nommés* (USAvionix, Cerebrium).
   → *Pour le producteur* : vérifier en une lecture caméra 12K, drone, fond vert, convois, hébergement, permis patrimoniaux, 24/7, voir où ça a déjà servi, et se reconnaître dans un cas type (« une pub dans le Danakil », « un documentaire à Lalibela »).

5. **Double lecture : l'expérience et l'index.** Vu chez Michael Gatt (INDEX VIEW), Josh Goldsmith (Previews / Index), Siena (menu-ticket qui liste les films), Seventeen (l'accueil *est* un index).
   → *Pour le producteur* : tout le catalogue — films, lieux, services, clients — en un écran. L'immersion reste un choix, jamais une condition.

6. **Le parcours de décision toujours à portée.** Vu chez White Desert (« How it works », « Enquire », adresse « Trade » dédiée), Scout (carte « Reserve » persistante), Cerebrium (« Book a demo » dès le titre), USAvionix (« Request Access »), LxL (CTA « production à venir »).
   → *Pour le producteur* : briefer ou appeler un bureau ouvert 24/7, à un clic, où qu'il soit dans le site.

7. **La barre de progression qui est le sommaire.** Vu chez USAvionix (10 graduations, celle du chapitre en cours affiche son nom), Tracing Art (menu des chapitres dans la barre), Hubtown (index vertical permanent), 2025 Wrapped (repère-personnage sur un tracé).
   → *Pour le producteur* : sauter directement à « permis », « matériel » ou « lieux » sans ouvrir de menu, en sachant ce qu'il reste.

8. **Les lieux épinglés, et un détail qui garde la carte visible.** Vu chez OceanX (panneau latéral, carte satellite et épingle, « Back to timeline »), White Desert (tracé du vol, coordonnées des camps), Montfort (bureaux épinglés), Hubtown (carte de Mumbai).
   → *Pour le producteur* : les 9 lieux d'un coup d'œil ; la fiche d'un lieu s'ouvre sans perdre la carte ni l'ordre du parcours.

9. **Un seul monde, et des transitions qui sont des phénomènes de ce monde.** Vu chez Unseen (plongée sous l'eau), OceanX (descente d'orbite), Montfort (couche de nuages), White Desert (effacement dans le blanc), Tuscan (store qui remonte), Bruno (le chargement devient le sol).
   → *Pour le producteur* : si chaque passage emprunte la matière réelle du terrain — sel du Danakil, brume du Simien, lumière d'altitude —, la transition montre l'Éthiopie au lieu de la cacher derrière un volet graphique.

10. **L'objet reste, c'est le temps qui change.** Vu chez Tracing Art (tableau épinglé, année qui défile), Illoca (le croquis se transforme sur place), Hubtown (le cube devient la carte).
    → *Pour le producteur* : lire une chronologie réelle — 2003 → 2010 → 2014 → AMAA 2015, ou le parcours d'un permis — sans perdre l'objet de vue.

11. **Le spectacle débouche sur l'outil.** Vu chez Hubtown (l'objet-héros finit en carte des projets), Illoca (le croquis devient le produit), Cerebrium (« tenir » fait sentir la promesse, puis rend la main), Bruno (le chargement est déjà la scène).
    → *Pour le producteur* : le moment signature mène à la carte des lieux ou à la call sheet ; il ne retarde jamais l'information.

12. **La langue du plateau dans l'interface, à condition qu'elle serve.** Vu chez Bitter Creek (codes de projet, survol « moniteur » avec timecode, effectifs chiffrés), USAvionix (fiche technique reliée à la pièce), Malvah (codes), Odd Ritual (codes produit).
    → *Pour le producteur* : des références qui servent vraiment dans un devis (lieu, matériel, permis). Décoratives, elles deviennent le cliché « HUD » (§3).

13. **Une donnée vivante native du client.** Vu chez Lando (prochaine course), Bruno (heure et météo identiques pour tous), Malvah et Bitter Creek (horloge locale).
    → *Pour le producteur* : l'heure éthiopienne comptée depuis l'aube, le calendrier de 13 mois et la fenêtre de lumière d'Addis sont des données de production réelles (quand tourner, quand appeler), pas un décor. *Réserve* : l'horloge seule est déjà un tic de Malvah ; elle doit *servir*.

14. **La retenue comme système.** Vu chez Malvah (une seule famille de caractères, texte fixe, images qui défilent), Seventeen (une fonte), Joffrey Spitzer (trois recettes appliquées partout), Bitter Creek.
    → *Pour le producteur* : un lecteur technique lit vite et fait davantage confiance à ce qui ne gesticule pas. La retenue ne coûte rien. Sa limite est mesurée : Seventeen tombe à 6,89 en Usability quand l'abstraction va trop loin.

15. **Les versions secondaires sont des designs, pas des dégradations.** Mobile recadré ou recomposé chez Unseen, OceanX et Arnaud Rocca (mobile sans WebGL) ; préréglage mobile chez Bruno et Messenger ; mouvement réduit traité comme un « design parallèle » chez Guignand, Rocca et Tuscan.
    → *Pour le producteur* : le site consulté sur un téléphone entre deux rendez-vous garde le même récit, à la même échelle de défilement (ta règle du 19/09). Et c'est exactement là où les primés perdent des points (§4).

---

## 3. Dix clichés Awwwards 2023–2025 à ne pas reproduire

Chacun est vu sur au moins deux sites ouverts pendant la recherche. Le site actuel de Teddy en contient six, marqués **(Teddy)**.

1. **La porte d'entrée** (« Enter », « Begin », « Click to start »), souvent avec un choix du son et un bouton son en coin. Vue chez Siena, Michael Gatt, LUT, CA Film, EverWonder, Unseen, Malvah, KODE, Immersive Garden, OceanX, Tuscan, Aramco, Messenger, Bruno. Née pour débloquer l'audio ; devenue un réflexe qui coûte un clic et une attente à chaque visite, payé sur les 30 % d'Usability.
2. **Le préchargeur-spectacle à compteur (0 → 100)** **(Teddy)**. Vu chez Lusion, Cartier, Lando (« LOAD NORRIS »), Immersive Garden, KODE, 2025 Wrapped, Hubtown, OceanX, Joffrey Spitzer. On met en scène l'attente au lieu de la réduire, et un titre en opacité 0 retarde le LCP.
3. **Le titre géant en capitales sur toute la largeur, souvent sur vidéo.** Vu chez EverWonder, Palomino, CA Film, Peryton, White Desert, 2025 Wrapped, KODE, Tuscan, Lando, Noomo, Navigate. Le signe « cinéma » par défaut : il ne dit rien du lieu ni du service.
4. **Le mot marqué dans le titre** (italique serif, autre fonte, autre couleur, graisse opposée) **(Teddy)**. Vu chez Unseen, White Desert, Odd Ritual, 2025 Wrapped, Lando, Cerebrium, Navigate. L'air « éditorial » instantané. Le brief l'interdit déjà.
5. **Le texte découpé et révélé** (lignes, mots, lettres, flou → net) **(Teddy)**. Plus de 50 fragments sur 7 sites sur 19 : Terminal 1 032, Lando 412, Lusion 326, Siena 188… Aussi EverWonder, CA Film, Michael Gatt, Peryton. C'est l'animation typographique la moins chère, et elle ralentit précisément ceux qui lisent pour décider.
6. **La micro-typo mono en capitales, les métadonnées entre crochets, le HUD** **(Teddy)**. Vu chez USAvionix (169 éléments), Cerebrium (101), Terminal, Scout, Anime.js, Igloo, 2025 Wrapped, KODE, OceanX. Un uniforme de « précision ». **Risque particulier pour Teddy** : altitudes et coordonnées réelles appellent ce registre, et c'est exactement là qu'il devient un cliché.
7. **Le fond noir pour dire « cinéma »** **(Teddy)**. Vu chez 6 références film sur 8 (Siena, Michael Gatt, Palomino, CA Film, LUT, Josh Goldsmith). La salle obscure ne distingue plus personne.
8. **Le mur de logos sans contexte** **(Teddy)**. Vu chez Palomino, EverWonder, CA Film, Peryton. Il ne dit ni quel service a été rendu, ni pour quel projet : c'est l'inverse du pattern n° 1.
9. **La navigation à manipuler et le curseur à étiquette** (glisser, lancer, « Drag », étiquette qui suit la souris). Vu chez Siena (mode d'emploi nécessaire), Josh Goldsmith (cube à lancer), LxL (« DRAG »), Malvah (« Enter Site »), Hubtown, Montfort. Teddy l'avait aussi (galerie « Drag »). Le jury aime la physicalité (Animations 8,0 à 8,6), mais le geste doit être expliqué, donc il n'est pas évident.
10. **L'objet 3D-héros flottant** (chrome, rubans, verre, Terre vue d'orbite). Vu chez Noomo, Cerebrium, Igloo, USAvionix, OceanX (globe), Montfort (Terre). Un contexte WebGL est demandé sur 15 sites sur 19. Il est spectaculaire, mais interchangeable s'il n'est pas l'objet réel du client.

**Aussi relevés, sous le seuil des dix** : sons de survol et de clic partout (Hubtown, Aramco, Tuscan) · navigation en pilules flottantes (Scout, MindMarket, Terminal, Cerebrium, Navigate, Mana) · fond qui change de couleur à chaque section (Lando, Navigate — ta « bicouleur ») · pile de cartes épinglées pour les services (LxL, Palomino) · logotype pleine largeur en pied de page (trois sites Malvah) · vert acide `#D2FF00` sur les CTA (Lando, Navigate, Terminal) · défilement infini ou confisqué, glitch de codec, loupe qui suit la souris (tutoriels Codrops).

**Deux omissions récurrentes**, qui ne sont pas des clichés mais des trous du métier :
- aucune règle de mouvement réduit sur 10 sites sur 19 ;
- aucun H1 sur 7 sites sur 19.

Ce sont précisément les points les plus faibles des notes Developer (§4).

---

## 4. Le barème réel des jurés, et ce qu'il implique

### Ce qui est vérifié (pages officielles d'Awwwards, lues le 24–25/09/2026)

**Site of the Day**
- **Pondération** : Design **40 %** · Usability **30 %** · Creativity **20 %** · Content **10 %**, chaque critère noté sur 10 par chaque juré.
- **Jury** : au moins 18 jurés par site ; les 3 notes les plus éloignées de la moyenne sont écartées. Seuls les votes des utilisateurs Pro comptent.
- **Calcul reconstitué** (déduit par le chercheur, puis vérifié sur les 21 pages SOTD 2023–2026 examinées) : la moyenne agrégée des utilisateurs Pro compte comme **une voix sur 16**. Le vote de la communauté pèse donc peu.
- **Seuils** :
  - *Honorable Mention* : ≥ 6,5 du jury **et** ≥ 6,5 des utilisateurs.
  - *SOTD* : pas de seuil ; c'est la meilleure note du jury ce jour-là. **Les notes du jury ne sont publiées que pour les SOTD**, juré par juré.
  - *Notes observées dans nos relevés* : de 7,27 (Tuscan) à 8,25 ; les trois SOTD du secteur film vont de 7,37 à 7,9.
- **SOTM** : les 8 sites les mieux notés du mois sont revus par le jury. **SOTY** : les sites du mois et les mieux notés de l'année. Sept prix annuels : Site, Developer, E-commerce, Agency, Studio, Independent, Users' Choice.
- **Qui juge** : pour entrer dans le jury principal, il faut avoir gagné au moins un SOTD.

**Developer Award**
- **Attribution** : tout SOTD est envoyé à **5 jurés développeurs** ; au-dessus de 7, le prix est attribué.
- **Pondération** (guide officiel, qui reproduit 22 notes sur 22) :

  | Critère | Poids |
  |---|---|
  | WPO (vitesse) | 20 % |
  | Responsive / mobile | 20 % |
  | Sémantique / SEO | 20 % |
  | Markup / métadonnées | 15 % |
  | Animations / transitions | 15 % |
  | Accessibilité | 10 % |

- **La vidéo et les séquences d'images ne comptent pas** dans le critère Animations.
- L'accessibilité exige : sous-titres et transcription des vidéos parlantes, pause de toute animation automatique de plus de 5 s, contenu accessible **sans JS**, focus visible.

### Ce que montrent les notes des primés (mesuré par les chercheurs)

- **L'Usability est la note la plus basse sur 19 pages SOTD sur 21**, et chez les trois SOTD du secteur film. La Creativity est souvent la plus haute.
- Côté Developer, **l'Accessibilité est la plus basse sur 11 pages sur 21**, les **Animations la plus haute sur 18 sur 21**.
- **Le poids ne prédit pas la note WPO** : Cerebrium pèse 2,45 Mo et obtient 7,0 ; Lusion pèse 10,6 Mo et obtient 9,0.

### Ce que ça implique pour Teddy

1. **Design (40 %) est le ticket d'entrée.** Composition, typographie et image doivent être au niveau des primés (7,3 à 8,1 relevés). ⚑ *Décision du 25/09* : les images existantes restent. Le design devra donc en tirer le maximum : cadrage, rythme, séquence, mise en valeur. C'est un défi de direction artistique, pas de production d'images.
2. **Usability (30 %) est le terrain où gagner.** C'est la note la plus faible de presque tous les primés, et c'est exactement le besoin de l'audience de Teddy : utilisable en 30 s. Pas de porte, pas de préchargeur, pas de parcours de 70 écrans : chaque seconde d'attente se paie sur 30 % de la note.
3. **Creativity (20 %) récompense une idée propre au client**, pas un effet. Un seul moment signature, qui ne pourrait pas exister pour une autre boîte de production.
4. **Content (10 %) est l'atout caché.** White Desert (7,74) et Tracing Art (8,09) ont leur meilleure note en Content grâce à des faits précis et vrais. Teddy a un contenu que personne n'a : premier long-métrage produit en Éthiopie par un Éthiopien, 4 675 m d'amplitude en une seule juridiction, une chaîne de salles qui ne passe que des films éthiopiens.
5. **Le Developer Award se gagne sur l'infrastructure.** 60 % de la note porte sur la vitesse, le responsive et la sémantique : le budget de performance du brief et un HTML propre y valent directement des points. La bande-démo vidéo ne rapporte rien en Animations mais pèse sur la vitesse. L'accessibilité, maillon faible des primés, y est un avantage à prendre.
6. **Chaque faiblesse est publique.** Les notes par critère et par juré s'affichent sur la page SOTD.

---

## 5. État de l'art technique (docs officielles, poids mesurés)

Tout est sourcé et mesuré dans [`recherche-tech.md`](docs/refonte/phase0/recherche-tech.md) : méthode, versions, supports navigateurs lus dans les données de compatibilité MDN du 24/09/2026.

**Le budget JavaScript (en gzip, l'unité du brief et de GitHub Pages)**

| Configuration | Total estimé |
|---|---|
| Existant | **78,2 kB** |
| + Flip | ≈ 87 kB |
| + OGL | ≈ **102 kB** |
| + Three.js WebGL (import typique) | ≈ **221 kB** |
| + Three.js WebGPU / TSL | ≈ **334 kB**, soit 16 kB de marge sous 350 |

Un routeur client ajoute 5,6 à 10,4 kB.

**Garder une scène WebGL d'une page à l'autre exige un routeur client.**

| Option | Poids (gzip) | Remarque |
|---|---|---|
| ClientRouter d'Astro | 5,6 kB | |
| Swup | 7,5 kB | |
| Barba | 10,4 kB | plus rien publié depuis août 2024 |
| Transitions natives entre pages | 0 kB | Chrome 126+ et Safari 18.2+, pas Firefox ; le canvas est recréé à chaque page |

C'est **le** choix d'architecture de la Phase 2, et il dépend de la direction choisie.

**Ce qui est sûr ou non aujourd'hui**
- **Transitions de vue dans une même page** : sûres partout (Baseline depuis octobre 2025). La **Navigation API** l'est depuis janvier 2026.
- **Scroll-driven CSS** : **pas Baseline**, Firefox ne l'a qu'en Nightly. Il reste un enrichissement ; GSAP reste nécessaire pour tout ce qui compte.
- **L'argument de la passe précédente contre les transitions natives entre pages ne tient plus** : `event.viewTransition` indique de façon fiable si une transition a lieu.
- **GSAP 3.15** : gratuit depuis la 3.13 (avril 2025), plugins compris (Flip, SplitText, MorphSVG…). Mais sous une licence propriétaire gratuite, pas libre.
- **Lenis 1.3.26** (déjà dans le lockfile) coupe désormais le lissage par défaut sous mouvement réduit, et plafonne à 60 images/s sur Safari (30 en économie d'énergie).
- **WebGPU** : pas Baseline. Le `WebGPURenderer` de Three.js est « expérimental », impose de réécrire les shaders en TSL et ajoute +113 kB, sans gain de compatibilité (repli WebGL 2). Cerebrium l'a abandonné : 20 s de compilation.
- **OGL** pèse 15 kB en usage typique, mais le projet est inactif depuis janvier 2025.

**Le ge'ez**
- Noto Serif Ethiopic et Noto Sans Ethiopic : licence OFL, axes `wdth` 62,5–100 et `wght` 100–900.
- Poids mesurés : **34,6 kB** en statique 400 réduit au bloc éthiopien, contre 143 à 311 kB en variable.
- Abyssinica SIL : une seule graisse, dessin calligraphique.
- Alignement mesuré : chez Noto Ethiopic, le signe ን est exactement à la hauteur de capitale (0,714 em), ce qui permet de calculer l'accord de taille avec la latine choisie.
- Pas de faux italique en amharique : la tradition n'en a pas.

**La sortie de la call sheet sans backend**

| Option | Ce que ça coûte | Limite |
|---|---|---|
| **Impression → PDF** | 0 kB, ge'ez rendu comme à l'écran | l'utilisateur choisit « Enregistrer en PDF » |
| **mailto structuré** | 0 kB | Outlook tronquait à 2 084 caractères (8 192 depuis 2023) ; un caractère éthiopien encodé en occupe 9 |
| jsPDF | 133 kB + une fonte éthiopienne | |
| pdf-lib | ≈ 590 kB | |
| Formspree, Basin | 0 kB | gratuit à 50 envois par mois, hébergés aux États-Unis ou au Canada |

**Web Vitals**
- Un titre en opacité 0 ou un préchargeur **retarde le LCP**. Un canvas n'est jamais l'élément LCP.
- L'INP ne compte que clic, tap et clavier : le défilement lissé n'y pèse pas, mais pèse sur la fluidité.

**GitHub Pages** sert du gzip seulement (jamais de brotli), avec un cache de 10 minutes sur tous les fichiers.

---

## 6. Ce que la recherche corrige dans le brief

Aucune de ces erreurs ne change le cap ; elles changent ce qu'on peut affirmer.

**Références**
1. **CA Film Creatives** : simple nomination (13/08/2026), **pas d'Honorable Mention**.
2. **Les notes du jury des HM ne sont pas publiques** : « ce qui les a empêchés d'être SOTD » ne peut être que déduit, par encadrement.
3. **Messenger** est *Developer* Site of the Year 2025. Le **Site of the Year 2025 est Lando Norris**, qui a aussi le Users' Choice.
4. **« Tracing Art · Navigate »** : deux sites distincts de Resn, SOTM juillet et avril 2025.
5. **Scout Motors** : E-commerce of the Year 2025. **Bruno Simon** : portfolio primé en janvier 2026 (SOTM). **Cerebrium** : agence KOKI-KIKO, Louis Paquet à la direction de création.
6. **malvah.co.za n'existe pas** : c'est malvah.co. **Montfort** n'est pas un territoire (société de négoce, paysages métaphoriques). **Tuscan Journey** est une campagne pour un sac Max Mara (la Toscane y sert de décor). **OceanX** est co-signé avec PROPAGANDE, sans Developer Award.
7. Crédits incomplets : Siena a trois auteurs, Michael Gatt deux.

**Tutoriels Codrops**
8. **Seamless 3D** repose sur Webflow et Barba.
9. **Shader Uniforms** utilise OGL et des transitions *dans une même page* d'une application React.
10. **Spitzer** : le titre du brief est une paraphrase ; le routeur est Swup.
11. **Scroll-Revealed** : le défilement doux vient de ScrollSmoother, pas de Lenis.

**Faits techniques**
12. « GSAP 100 % gratuit » : oui, mais sous licence propriétaire.
13. « Scroll-driven CSS baseline » : non.
14. « 195 ko de JS » : c'est du minifié, soit 78,2 kB gzip.
15. `three.module.min.js` n'existe plus.

**Fait client**
16. **Erta Ale culmine à 613 m** : c'est le fond de la dépression du Danakil qui est à ≈ −125 m. Le site actuel a les bonnes valeurs ; seul le brief les confond.
