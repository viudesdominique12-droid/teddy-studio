/**
 * LE CHEVRON — la transition entre les pages.
 *
 * Le site est un MPA : sans rien, chaque clic donne une rupture franche. Un
 * panneau plein écran couvre l'écran avant la navigation et le découvre à
 * l'arrivée — et il ne traverse pas à plat : il a une PROUE.
 *
 * La forme est un polygone à cinq sommets : un rectangle plus un point qui
 * dépasse de 25 % à mi-hauteur. Toute la course tient dans un seul paramètre,
 * la position de la pointe :
 *
 *     P = -25 + 150·s        s ∈ [0, 2]
 *     R = P - 25             (l'arête droite du rectangle)
 *     L = P - 175            (l'arête gauche)
 *
 *     s = 0 → tout est hors champ à gauche
 *     s = 1 → l'écran est entièrement couvert
 *     s = 2 → tout est ressorti à droite
 *
 * Couvrir, c'est donc animer s de 0 à 1 ; découvrir, de 1 à 2. Le panneau ne
 * fait jamais marche arrière : il entre par la gauche et sort par la droite,
 * dans le sens de lecture.
 *
 * Deux détails sans lesquels ça casse :
 *  1. le premier état est écrit AVANT de rendre le panneau visible — sinon on
 *     voit une frame de panneau plein écran au chargement ;
 *  2. `pageshow` + `event.persisted` — un retour arrière restaure la page
 *     depuis le bfcache avec le panneau resté couvert. Sans ce filet, le
 *     visiteur revient sur un écran noir définitif.
 *
 * La voie native (`@view-transition`) a été écartée : `onpageswap` existe dans
 * des navigateurs où la transition inter-documents ne se déclenche jamais. On
 * se retrouvait alors sans aucune transition, sans le savoir. Un seul système,
 * identique partout, vaut mieux qu'un système à deux vitesses silencieux.
 */

import gsap from 'gsap';

const PROW = 25;                 /* dépassement de la pointe, en % de largeur */
const COVER = 0.65;              /* on fait attendre : bref */
const REVEAL = 0.85;             /* on fait arriver : ça respire */
const GOLD_LEAD = 0.019;         /* l'or précède l'encre d'un souffle : ~27 px */

let ink = null, gold = null, root = null;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** La forme, à un instant de la course. */
function shape(s) {
  const p = -PROW + (100 + 2 * PROW) * s;
  const r = p - PROW;
  const l = p - (100 + 3 * PROW);
  return `polygon(${l}% 0%, ${r}% 0%, ${p}% 50%, ${r}% 100%, ${l}% 100%)`;
}

function paint(s) {
  if (ink) ink.style.clipPath = shape(s);
  if (gold) gold.style.clipPath = shape(Math.min(2, s + GOLD_LEAD));
}

function build() {
  root = document.createElement('div');
  root.className = 'wipe';
  root.setAttribute('aria-hidden', 'true');
  // L'or est posé EN PREMIER : l'encre le recouvre partout sauf sur la proue,
  // où il subsiste en liseré. Deux div, aucune bordure à gérer.
  gold = document.createElement('span'); gold.className = 'wipe__gold';
  ink = document.createElement('span'); ink.className = 'wipe__ink';
  root.append(gold, ink);
  paint(0);                      // l'état de départ AVANT l'affichage
  document.body.appendChild(root);
}

/** Le panneau sort par la droite. */
function reveal() {
  if (!root) return;
  const t = { s: 1 };
  paint(1);
  root.hidden = false;
  gsap.to(t, { s: 2, duration: REVEAL, ease: 'power3.inOut',
    onUpdate: () => paint(t.s),
    onComplete: () => { root.hidden = true; } });
}

/** Le panneau entre par la gauche, puis on navigue. */
function cover(href) {
  if (!root) { location.href = href; return; }
  const t = { s: 0 };
  paint(0);
  root.hidden = false;
  gsap.to(t, { s: 1, duration: COVER, ease: 'power4.inOut',
    onUpdate: () => paint(t.s),
    onComplete: () => { location.href = href; } });
}

/** Deux chemins désignent la même page malgré leurs habillages. */
function samePage(url) {
  const norm = (p) => p.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  return url.origin === location.origin && norm(url.pathname) === norm(location.pathname);
}

export function initWipe() {
  if (window.__teddyWipe) return;
  window.__teddyWipe = true;
  if (reduced()) return;         // pas de volet : la navigation reste franche

  build();
  reveal();

  // Un retour arrière ressort la page du bfcache telle qu'on l'avait laissée —
  // c'est-à-dire couverte. Il faut la redécouvrir à la main.
  window.addEventListener('pageshow', (e) => { if (e.persisted) reveal(); });

  document.addEventListener('click', (e) => {
    // Le défilement doux a déjà pris la main sur les ancres internes.
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest?.('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

    const raw = a.getAttribute('href') || '';
    if (raw.startsWith('#') || /^(mailto|tel|sms):/i.test(raw)) return;

    let url;
    try { url = new URL(a.href, location.href); } catch { return; }
    if (url.origin !== location.origin) return;
    if (samePage(url)) return;   // ancre ou lien vers soi-même : le scroll suffit

    e.preventDefault();
    cover(url.href);
  });
}
