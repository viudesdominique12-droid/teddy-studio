# Outils de travail (non publiés)

Scripts de vérification et de préparation utilisés pendant la refonte. Ils ne font pas partie du site : rien ici n'est construit ni publié. Ils se lancent **depuis un dossier de travail temporaire**, avec le serveur de dev en marche (`http://localhost:5179`). Ils écrivent leurs captures dans `./shots/`, à créer d'abord.

## Captures (Playwright, sans fenêtre)

Les scripts chargent `playwright-core` depuis le cache npx (`~/.npm/_npx/9833c18b2d85bc59/node_modules`) et utilisent le Chrome for Testing du cache Playwright (`~/Library/Caches/ms-playwright/chromium-1223/…`). Si l'un des deux a disparu, il suffit de relancer `npx @playwright/mcp@latest` une fois, puis de corriger le chemin dans le script. Tous posent `sessionStorage['teddy-seen']='1'` pour sauter l'ouverture.

- `seq.mjs <url> <préfixe> [largeur] [hauteur] [pas] [--mobile]` : la page écran par écran.
- `sect.mjs <url> <préfixe> <l> <h> "#id1,#id2" [--offset=40]` : une capture par section.
- `plans.mjs <préfixe> <l> <h> '[0.4,0.75]' [--mobile]` : chaque plan de la séquence du matériel (kit3d), aux instants donnés.
- `reel.mjs <préfixe> <l> <h> '[0,0.5,1]' [--mobile]` : la bobine des lieux à plusieurs positions, puis l'ouverture de la fiche d'un lieu.
- `sheet.py "<motif>" <sortie.jpg> [colonnes] [largeur]` : une planche contact. `tile.py` découpe une capture pleine page en tuiles.
- `overflow.mjs <l> <h> [--mobile]` : parcourt toute la page et liste chaque texte visible qui dépasse de l'écran (aucun attendu). À passer aussi en très grand (2667×1500 : un écran dézoomé).
- `kitmotion.mjs [étiquette] [px par cran] [ms entre crans]` : fait défiler la séquence du matériel à la molette, à une vitesse réaliste (100 px tous les 90 ms par défaut), et mesure image par image la plus forte variation de chaque plan (opacité des fiches, glissement et rotation des objets, découverte des photos), plus la durée réelle d'apparition des fiches. Pour juger une transition « brute » par des chiffres.
- `kittrans.mjs <préfixe> <l> <h> '[[de,à],…]' [--mobile] [--nogl]` : capture un passage d'un outil à l'autre dans le temps (0 à 2 s), pour vérifier l'ordre du passage.
- `themes.mjs <préfixe> <l> <h> [--mobile] [--pages]` : les mêmes endroits du site (ou des pages intérieures avec `--pages`) dans les trois thèmes, Vert, Nuit et Papier. Il liste aussi les polices réellement chargées. `cmp3.py <préfixe> <sections,…> <sortie.jpg> [largeur]` en fait une planche, un thème par colonne.
- `prodcheck.mjs <adresse> [--mobile]` : vérifie une version CONSTRUITE, celle que Pages publie. On la sert en local avec la configuration `teddy-pages-test` (port 4174, sous `/teddy-studio/`), ou on donne l'adresse en ligne. Pour les 5 pages et les 3 thèmes, il signale tout fichier manquant (404), toute erreur, et indique si les modèles 3D, la bobine et les polices se chargent. À lancer avant chaque mise en ligne.
- `mobperf.mjs <étiquette> [adresse] [--soft]` : fait défiler toute la page au doigt, en téléphone (390×844, écran ×3), avec le processeur ralenti ×4. Il compte, section par section, les images en retard (> 25 ms) et les saccades (> 50 ms). Avec `--soft`, tout le rendu passe par le processeur, sans puce graphique : c'est ce qui révèle les effets lourds pour un téléphone (scènes 3D, flous).
- `pinalign.mjs <l> <h> [--mobile]` : vérifie que les scènes épinglées (kit, bobine, caméra) démarrent pile à leur place, au chargement puis après avoir ouvert et fermé des services. L'écart doit rester à 0.

## Modèles 3D (`public/kit3d/`)

Les modèles viennent de Sketchfab, qui exige un compte pour télécharger : c'est Dominique qui télécharge, en « glb (Autoconverted format) ».

- Préparation : `process-model.mjs in.glb out.glb '{"ratio":0.3,"error":0.001,"tex":1024,"rough":512,"metalRough":false,"drop":["^Turntable"]}'`. Il retire les nœuds indésirables, simplifie, passe les textures en WebP et compresse en meshopt. Mettre `metalRough:true` pour un scan en specular-glossiness, que Three.js ne lit plus.
  - Dépendances, à installer dans le dossier de travail : `npm i @gltf-transform/core@4.2.1 @gltf-transform/extensions@4.2.1 @gltf-transform/functions@4.2.1 meshoptimizer@0.22.0 sharp@0.34.3`.
- `model-tree.mjs file.glb` : l'arbre des nœuds, pour repérer un plateau ou un décor à retirer. Il ne lit pas un fichier déjà compressé en meshopt.
- Orientation d'un modèle : `data-fix` / `data-fit` / `data-turn` sur son `.k3__plan`, réglés en dev avec `window.__k3`.
