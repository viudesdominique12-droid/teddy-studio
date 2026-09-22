/**
 * LA FEUILLE — la page se courbe à la vitesse du geste.
 *
 * L'idée vient de Jesper Landberg, et elle tient en une ligne de shader :
 * on ne déforme PAS en y, à l'écran ; on pousse la géométrie en PROFONDEUR,
 * et c'est la perspective de la caméra qui produit la courbure.
 *
 *     w.z += A * (1 - t*t);   // t = position verticale, normalisée
 *
 * Son commentaire d'auteur dit pourquoi : essayé comme une onde verticale, ça
 * tordait la silhouette de chaque carte — bords ondulés, milieu pincé. Passé
 * par z, la moitié proche grandit, la moitié lointaine rétrécit, et
 * l'ondulation naît du CADRAGE au lieu de la géométrie.
 *
 * Nous n'avons pas de caméra. Mais ce que la division perspective produit au
 * bout du compte, c'est une ÉCHELLE qui culmine au centre vertical de l'écran
 * et vaut 1 en haut et en bas. Ça, une transformation CSS le fait — sans
 * canvas, sans shader, sans un octet de WebGL. On perd la courbure continue à
 * l'intérieur d'un même élément (ses arêtes restent droites) ; on garde le
 * geste, qui est l'essentiel.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LE VRAI TRÉSOR N'EST PAS LA COURBURE, C'EST LA VÉLOCITÉ.
 *
 * Chez eux, la vitesse n'est JAMAIS une dérivée temporelle. C'est le RÉSIDU
 * DU LISSAGE : l'écart entre là où le scroll veut aller et là où il est.
 *
 *     v = cible - courant
 *
 * Cette grandeur est déjà lissée, déjà bornée, et retombe toute seule quand le
 * geste s'arrête — aucune dérivation, aucun bruit, aucun amortisseur à régler.
 * Lenis expose les deux termes, donc on la lit sans rien calculer.
 *
 * Puis deux mises en forme, les leurs :
 *   `tanh(v / N)`  — plafond doux : un geste deux fois plus fort ne donne pas
 *                    deux fois plus d'effet, il approche la limite.
 *   `× |v|`        — réponse quadratique SIGNÉE : les petits mouvements sont
 *                    écrasés, seuls les grands gestes ouvrent la feuille. Et le
 *                    signe est conservé, donc remonter courbe dans l'autre sens.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DEUX DÉTAILS D'IMPLÉMENTATION QUI COMPTENT :
 *
 *  1. on écrit `scale` et `rotate` en PROPRIÉTÉS CSS AUTONOMES, pas dans
 *     `transform`. GSAP possède déjà `transform` sur ces éléments ; les deux
 *     se multiplient au lieu de se chasser. Sans ça il faudrait un niveau de
 *     DOM en plus autour de chaque carte ;
 *
 *  2. quand la feuille est à plat, la boucle SORT au premier test. C'est le
 *     principe de leur dirty-check : ne pas redessiner ce qui n'a pas bougé.
 *     Au repos — c'est-à-dire la plupart du temps — ce module coûte une
 *     soustraction et une comparaison par image.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';

/* À vitesse constante, une poursuite à 0,12 se stabilise avec un retard de
   ~7,3 fois le pas par image. Une lecture tranquille (20 px/image) donne donc
   ~146 px de retard, un lancer franc (80 px/image) ~585. Les seuils sont
   choisis là-dessus : la feuille frémit quand on lit, elle s'ouvre quand on
   lance. Les 900/500 de la référence valaient pour LEUR poursuite, pas la
   nôtre — les recopier tels quels donnait un effet qui ne démarrait jamais. */
const NORM_WIDE = 320;
const NORM_NARROW = 220;

/* +11 % suffisait chez eux parce que TOUTE la page est une seule surface
   continue : l'œil compare le centre aux bords et voit la feuille. Ici on
   transforme des blocs séparés, avec du vide autour — il n'y a rien à quoi
   comparer, et 11 % passent inaperçus. Il en faut davantage, et surtout il
   faut que le mouvement ne soit pas qu'une échelle (voir BANK). */
const GAIN = 0.17;

/* Le glissement qui accompagne l'échelle. La poussée en z éloigne aussi les
   objets de l'axe de la caméra : sans lui, les blocs gonflent sur place et
   l'effet paraît collé. */
const LIFT = 0.07;

/* L'INCLINAISON. C'est elle qui fait lire « papier » plutôt que « zoom ».
   La référence fait rouler son ruban de 0,16 rad ; ici un bloc s'incline
   selon son écart au centre, donc le haut et le bas de l'écran penchent en
   sens contraires et la colonne entière semble fléchir. */
const BANK = 1.6;                /* degrés au plein de la vélocité */

/* L'inclinaison des cartes d'un rail, en degrés, au plein de la vélocité.
   Les deux moitiés tournent en sens OPPOSÉS (`Math.sign`), nul au centre :
   c'est l'essorage du ruban, et c'est lui qui donne « le papier au vent ». */
const TWIST = 2.6;

/* En dessous, la feuille est considérée à plat et on ne touche à rien. */
const EPS = 0.0015;

const clamp1 = (v) => (v < -1 ? -1 : v > 1 ? 1 : v);

export function initBulge() {
  if (window.__teddyBulge) return;

  /* Le mouvement réduit n'est pas négociable. La référence n'a AUCUNE règle
     `prefers-reduced-motion` — zéro sur 228 — et c'est une faute qu'on ne
     recopie pas : cet effet est exactement du type qui donne la nausée. */
  if (reduced()) return;

  window.__teddyBulge = true;

  /* ── NOTRE PROPRE POURSUITE ────────────────────────────────────────────
     On lisait le résidu de Lenis. Erreur : sur téléphone `syncTouch` est à
     faux — le défilement tactile reste NATIF, c'est voulu — donc Lenis ne
     poursuit rien, son résidu vaut zéro, et l'effet était mort au doigt.
     Mesuré avant correction : +2 % d'échelle au maximum. Invisible.

     On tient donc notre propre poursuite de la position réelle. Elle marche
     à l'identique à la molette, au doigt, au clavier et à la barre de
     défilement, puisqu'elle ne lit qu'une chose : où la page est vraiment. */
  let suivi = window.scrollY;
  const CHASE = 0.12;              /* la poursuite : plus bas = plus de traîne */

  /* ── Les participants ──────────────────────────────────────────────────
     Verticaux : posés dans le flux, donc leur position se déduit d'un
     `offsetTop` mis en cache — aucune lecture de géométrie par image.
     Horizontaux : ils traversent l'écran, il faut lire leur rectangle. Ils
     sont peu nombreux et on ne lit que ceux qui sont à l'écran. */
  /* Il en faut BEAUCOUP. Avec cinq cartes qui gonflent au milieu d'une page
     immobile, l'œil n'a aucun point de comparaison et ne voit rien — c'est
     l'erreur du premier jet. Chez eux, TOUT bouge ensemble : c'est la page
     entière qui est la feuille. On prend donc chaque bloc de contenu. */
  const VERTICAL = [
    '.case', '.cases__head', '.cases__lede',
    '.credits__films > li', '.credits__clients > li', '.credits__end',
    '.wall__i', '.wall__h',
    '.phead', '.note', '.note__fig', '.note__t',
    '.drop__more', '.gal__h', '.gal__lede',
    '.board', '.table-act__h', '.open',
    '.cs__lines', '.cs__form', '.cs__foot',
    '.ftr__brand', '.ftr__col', '.hero__lede', '.hero__meta'
  ].join(', ');
  const HORIZONTAL = '.stop, .gal__item';

  let ups = [];          /* { el, mid, half } en coordonnées document */
  let sides = [];
  let vh = 1, halfVh = 1, norm = NORM_WIDE;
  let flat = true;       /* la feuille est-elle déjà rendue à plat ? */

  function measure() {
    vh = window.innerHeight || 1;
    halfVh = vh / 2;
    norm = window.innerWidth < 768 ? NORM_NARROW : NORM_WIDE;

    ups = [];
    for (const el of document.querySelectorAll(VERTICAL)) {
      /* Un élément épinglé ne suit pas le scroll : son `offsetTop` mentirait.
         Ceux-là sont traités par la passe horizontale, ou pas du tout. */
      if (el.closest('.pin-spacer')) continue;
      const r = el.getBoundingClientRect();
      if (!r.height) continue;
      /* LA MARGE LATÉRALE. Un bloc qui remplit déjà la largeur n'a nulle part
         où grandir ni pencher : il déborde, et 29 px de défilement horizontal
         apparaissent (mesuré). Un bloc étroit, lui, a de la place — et penché,
         il lit comme une feuille plutôt que comme une section cassée.
         On dose donc l'effet par la place DISPONIBLE. */
      const vw = window.innerWidth || 1;
      const room = Math.max(0, Math.min(1, (vw - r.width) / (vw * 0.3)));
      ups.push({ el, mid: r.top + window.scrollY + r.height / 2, room });
    }
    sides = [...document.querySelectorAll(HORIZONTAL)];
  }

  /** Remet tout le monde à plat, une seule fois. */
  function settle() {
    for (const u of ups) { u.el.style.scale = ''; u.el.style.translate = ''; u.el.style.rotate = ''; }
    for (const el of sides) { el.style.scale = ''; el.style.rotate = ''; }
    document.documentElement.style.setProperty('--sheet', '0');
    flat = true;
  }

  function frame() {
    /* LE RÉSIDU. Toute la sensation du site vient de cette soustraction. */
    const vise = window.scrollY;
    suivi += (vise - suivi) * CHASE;
    const v = vise - suivi;
    const t = Math.tanh(v / norm);
    const a = t * Math.abs(t);

    if (Math.abs(a) < EPS) { if (!flat) settle(); return; }
    flat = false;

    document.documentElement.style.setProperty('--sheet', a.toFixed(3));

    const y0 = window.scrollY + halfVh;
    const gain = GAIN * a;
    const lift = LIFT * a * halfVh;

    for (const u of ups) {
      const d = clamp1((u.mid - y0) / halfVh);
      const k = 1 - d * d;                     // la parabole : 1 au centre, 0 aux bords
      if (k <= 0) { if (u.el.style.scale) { u.el.style.scale = ''; u.el.style.translate = ''; u.el.style.rotate = ''; } continue; }
      // L'échelle garde un plancher : même un bloc pleine largeur respire un peu.
      u.el.style.scale = (1 + gain * k * (0.45 + 0.55 * u.room)).toFixed(4);
      // Le glissement suit le SIGNE de l'écart au centre : on s'écarte de l'axe.
      u.el.style.translate = '0 ' + (d * lift * k).toFixed(2) + 'px';
      // L'inclinaison, elle, est maximale AUX BORDS et nulle au centre — et
      // réservée aux blocs qui ont de la place pour pencher.
      u.el.style.rotate = (BANK * a * d * (1 - k * 0.55) * u.room).toFixed(2) + 'deg';
    }

    if (!sides.length) return;
    const halfVw = (window.innerWidth || 1) / 2;
    for (const el of sides) {
      const r = el.getBoundingClientRect();
      if (r.right < -40 || r.left > halfVw * 2 + 40) {
        if (el.style.scale) { el.style.scale = ''; el.style.rotate = ''; }
        continue;
      }
      const d = clamp1((r.left + r.width / 2 - halfVw) / halfVw);
      const k = 1 - d * d;
      el.style.scale = (1 + gain * k * 0.7).toFixed(4);
      /* L'essorage : nul au centre, maximal au bord, et de sens opposé de part
         et d'autre. C'est `sign(qe)` de leur `sheetWind()`. */
      el.style.rotate = (TWIST * a * Math.sign(d) * (1 - k)).toFixed(2) + 'deg';
    }
  }

  measure();
  /* On monte sur l'horloge de GSAP plutôt que d'ouvrir une boucle à nous :
     le site n'a qu'un seul `requestAnimationFrame`, comme la référence. */
  gsap.ticker.add(frame);
  ScrollTrigger.addEventListener('refresh', measure);
  window.addEventListener('resize', () => { measure(); settle(); }, { passive: true });
}
