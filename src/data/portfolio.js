/**
 * LE PORTFOLIO — source unique (brief du client §12, 17/10/2026).
 *
 * Une fiche par projet. Le portfolio, l'accueil (`featured`) et le bloc
 * « portfolio » de chaque division se nourrissent de ce seul fichier : pour
 * ajouter un projet, on ajoute une fiche ici, rien d'autre.
 *
 * `category` : une des catégories du brief (CATEGORIES ci-dessous).
 * `status`   : ce que le visiteur doit pouvoir distinguer (§10.C) —
 *   'client'  projet réalisé pour un client,
 *   'own'     production de la maison,
 *   'demo'    démonstration ou concept,
 *   'third'   travail d'un tiers auquel l'entreprise a contribué,
 *   'worked'  « We've worked on » : la seule chose que dit le site d'origine.
 *             Les cinq films l'ont en attendant que le client précise, film
 *             par film, s'il s'agit d'une production maison, d'un projet
 *             client ou d'une contribution (critique du 18/10/2026).
 * `role`     : rôle de l'entreprise (§6) — 'lead-producer', 'partner',
 *              'technical', 'contributor' ; vide tant que le client ne l'a
 *              pas confirmé (rien n'est affiché).
 *
 * Les images : `poster` (560 px) et `posterFull` (l'affiche entière) ;
 * `posterMid` (720 px, même cadrage que `posterFull`) quand elle existe, pour
 * la grille sur téléphone ; `stills` (photos de tournage, 1280 px) et leurs
 * vignettes `stillThumbs` (240 × 135, même ordre).
 *
 * Une catégorie sans projet n'est jamais remplie de faux exemples : la page
 * affiche un état « en préparation » avec un appel à demander des références.
 */

export const CATEGORIES = [
  { id: 'live',    label: 'Live Streaming' },
  { id: 'events',  label: 'Events' },
  { id: 'ai',      label: 'AI Production' },
  { id: 'music',   label: 'Music' },
  { id: 'film',    label: 'Feature Films' },
  { id: 'doc',     label: 'Documentaries' },
  { id: 'tech',    label: 'Equipment & Technical Production' }
];

export const STATUS = {
  client: 'Client project',
  own: 'Teddy Studio production',
  demo: 'Concept / demonstration',
  third: 'Third-party production',
  worked: 'Worked on'
};

export const ROLES = {
  'lead-producer': 'Lead producer',
  partner: 'Production partner',
  technical: 'Technical provider',
  contributor: 'Contributor'
};

export const projects = [
  {
    slug: 'sost-maezen-2',
    title: 'Sost Maezen 2',
    aka: 'Triangle II',
    category: 'film',
    status: 'worked',
    role: '',
    credit: 'A film by Theodros Teshome',
    poster: '/works/p-2-560.webp',
    posterFull: '/works/p-2-full.webp',
    stills: ['/film/triangle-card-w1280.webp', '/film/desert-walk-w1280.webp'],
    stillThumbs: ['/film/triangle-card-t240.webp', '/film/desert-walk-t240.webp'],
    featured: true
  },
  {
    slug: 'sost-maezen-1',
    title: 'Sost Maezen 1',
    aka: 'Triangle',
    category: 'film',
    status: 'worked',
    role: '',
    poster: '/works/p-1-560.webp',
    posterFull: '/works/p-1-full.webp',
    posterMid: '/works/p-1-720.webp',
    stills: ['/film/sundown-w1280.webp', '/film/forest-w1280.webp'],
    stillThumbs: ['/film/sundown-t240.webp', '/film/forest-t240.webp'],
    featured: true
  },
  {
    slug: 'kezkaza-welafen',
    title: 'Kezkaza Welafen',
    category: 'film',
    status: 'worked',
    role: '',
    poster: '/works/p-5-560.webp',
    posterFull: '/works/p-5-full.webp',
    posterMid: '/works/p-5-720.webp',
    featured: true
  },
  {
    slug: 'sele-enat-meder',
    title: 'Sele Enat Meder',
    category: 'film',
    status: 'worked',
    role: '',
    poster: '/works/p-4-560.webp',
    posterFull: '/works/p-4-full.webp',
    posterMid: '/works/p-4-720.webp',
    featured: false
  },
  {
    slug: 'fikir-siferd',
    title: 'Fikir Siferd',
    category: 'film',
    status: 'worked',
    role: '',
    poster: '/works/p-0-280.webp',
    posterFull: '/works/p-0-full.webp',
    featured: false
  }
];

export const byCategory = (id) => projects.filter((p) => p.category === id);
