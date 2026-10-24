# À valider ou à fournir par le client

Liste issue de la refonte en sept divisions (brief du 17/10/2026, pages construites le 18/10/2026).
Rien n'a été inventé : là où une information manque, le site affiche un état honnête
(« being prepared », « Price on request », « Ask our team »). Chaque phrase nouvelle qui parle
de l'entreprise est marquée `<!-- À VALIDER : client -->` dans le code de la page.

## 1. Pour que les demandes arrivent (prioritaire)

- [ ] **Service de formulaires** : créer le compte (Formspree, Web3Forms, Basin…), puis
      donner l'adresse d'envoi. Elle se colle dans `src/data/site.js` → `inquiry.endpoints`.
      D'ici là, chaque formulaire ouvre la messagerie du visiteur.
- [ ] **Adresses de réception** par division, si chaque équipe a la sienne. Sinon, tout arrive à
      info@ethiopianfilmoffice.com, avec l'étiquette de la division au début de l'objet :
      [LIVE], [EVENT], [AI], [MUSIC], [FILM], [DOC], [RENTAL], [PROJECT].
- [ ] **Numéro WhatsApp** : confirmer le +251 911 204 388.
- [ ] **Adresse et horaires** : Finfine Building, 5ᵉ étage, en face de Meskel Square.
      Le « Open 24/7 » du site d'origine est-il toujours vrai ?

## 2. Les films (le portfolio)

- [ ] **Le rôle de l'entreprise sur chacun des 7 films** : production maison, projet client,
      partenaire de production, prestataire technique ou contribution. Aujourd'hui, ils portent
      seulement l'étiquette « Worked on », la formule du site d'origine (« We've worked on »).
- [x] **L'affiche de Sost Maezen 1 (Triangle)** : l'image reprise du site d'origine portait en
      gros « TRIANGLE 2 · 2016 ». Réglé le 23/10/2026 : le film montre désormais sa vraie
      affiche (« SOST MAEZEN », trouvée sur teddystudios.com, l'ancien site du studio).
- [ ] **De meilleures affiches** pour Fikir Siferd (300 px, logo DEKIKA FLIX) et
      Sost Maezen 2 (640 px). Le 18/10, le client a demandé « clearer posters » : on garde les
      images actuelles telles quelles et on reprendra les nouvelles dès qu'elles seront sur son
      site (ethiopianfilmoffice.com). Depuis le 23/10, l'accueil montre les films un peu plus
      grands (quatre par rangée au lieu de cinq) : Fikir Siferd, qui n'existe qu'en 300 px,
      y paraît plus flou que les autres. Une version plus grande est la plus urgente.
- [x] **Seol** et **Abay Weys Vegas** (« New movies we have to include ») : ajoutés le
      23/10/2026, comme les autres films, avec leur affiche officielle et leur nom seulement
      (toutes deux reprises de teddystudios.com, l'ancien site du studio). Ils apparaissent partout où sont
      les films : l'accueil, le portfolio, Feature Film et About.
- [ ] **L'affiche d'Abay Weys Vegas** : il en existe deux versions. Le site montre, depuis le
      24/10/2026, celle de teddystudios.com, l'ancien site du studio (424 × 600 px). EtMDB et
      Wikipedia en amharique montrent l'autre (personnages inversés, autre éclairage). Si
      l'affiche de sortie en salle est l'autre, la remplacer.
- [ ] **Les fichiers d'origine des trois affiches** (Seol, Abay Weys Vegas, Sost Maezen 1) :
      celles du site sont petites (337, 424 et 400 px de large). Elles restent nettes parce
      qu'on ne les agrandit jamais, mais elles paraissent petites dans la fiche du portfolio.
- [ ] **L'orthographe de Seol** : le site suit l'écriture du client, mais l'affiche écrit
      « SIOL » (ሲዖል). Laquelle garder ? **Et celle d'Abay Weys Vegas** : en lettres
      latines, l'affiche écrit « ABAY VS VEGAS » (en amharique : አባይ ወይስ ቬጋስ) ; le site suit
      l'écriture du client, « Abay weys vegas ».
- [ ] **L'orthographe du fondateur** : « Theodros Teshome » sur l'affiche de Triangle II,
      « Tewodros Teshome » partout ailleurs.
- [ ] Pour chaque film : année, court résumé, générique, bande-annonce.

## 3. Photos, vidéos et sons à fournir

Le brief demande de vraies images ; le site n'utilise que ce que nous avions (films, lieux,
matériel, bureau). À fournir dès que possible :

- [ ] **Événements** : photos de scènes installées, mariages, conférences, soirées (une par
      famille d'événements, idéalement). La page Event Organizing n'a aucune photo pour l'instant.
- [ ] **Live streaming** : images d'une vraie régie ou d'un vrai direct. Le mur d'écrans montre
      aujourd'hui des extraits de nos films, en décor.
- [ ] **Musique** : extraits audio (MP3, 30 à 90 s) avec titre, artiste ou client (avec son
      accord), catégorie, statut et pochette carrée. Le lecteur est prêt et s'affichera tout seul.
      Photos de séances ou du studio, s'il existe.
- [ ] **IA** : exemples réels ou démonstrations, chacun marqué AI-assisted, AI-generated ou
      concept demonstration.
- [ ] **Documentaires** : titres, sujets, résumés, rôle, bande-annonce, client (avec son accord).
      Photos de tournage ou de repérage (les photos de lieux viennent de Wikimedia Commons).
- [ ] **Matériel** : pour chaque appareil, marque, modèle, vraies photos, caractéristiques,
      accessoires inclus. La photo « drone » montre une vue aérienne, pas l'appareil.
      Inventaire des catégories vides (Event Production Equipment, Supporting Equipment).
- [ ] **Équipe** : noms, rôles et photos ; une photo du fondateur ; une vraie photo du bureau.

## 4. Ce que l'entreprise fait vraiment

Le brief demande de ne montrer que les capacités réelles. Pour chaque page, retirer ce qui
n'est pas proposé :

- [ ] AI Production : les 11 services du brief, et les outils utilisés.
- [ ] Music Production : les 15 services du brief ; existe-t-il un studio d'enregistrement ?
- [ ] Equipment Rentals : les 6 appareils affichés sont-ils bien à vous ? Prix publiables ou
      « Price on request » ? Retrait au bureau, livraison, ou les deux ? Règles de caution et de
      pièce d'identité (la page dit seulement « may be required »).
- [ ] Event Organizing : existe-t-il une équipe dédiée aux événements (« our event team ») ?
      Faut-il publier « We only accept projects we can legally and operationally support » ?

## 5. Textes nouveaux à relire

Toutes les phrases marquées `À VALIDER : client` dans les pages. Les principales :

- **Accueil** : la phrase sous « Seven divisions. One company. » ; cinq des sept raisons de
  « Why work with us? » (les deux dernières sont les textes du site d'origine).
- **Services** : le titre « Seven divisions. One production company. », « Two divisions. Two
  different jobs. », « Combined when you need them » et ses trois exemples.
- **About** : l'introduction, la mission, la vision, les cinq principes de « Our Approach »,
  la phrase sur le fondateur.
- **Chaque division** : les descriptions des étapes du processus et la phrase d'introduction du
  formulaire (« We come back to you with… »).
- **Contact** : « We reply by phone, WhatsApp or email, as you prefer. »

## 6. Choix à faire

- [x] **Le thème** : Vert, choisi le 18/10/2026 (Nuit et Papier retirés).
- [ ] **Le modèle 3D de la caméra** (accueil et location) montre une marque (RED) sous certains
      angles et un « 8K » dans son crédit obligatoire, alors que la fiche dit « 12K ». Le garder,
      ou le remplacer par un modèle de leur vraie caméra ?
- [ ] **Le domaine** : ethiopianfilmoffice.com (l'ancien site) est déjà inscrit dans les balises
      canonical et le plan du site (`public/sitemap.xml`).
