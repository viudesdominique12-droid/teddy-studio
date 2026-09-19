/**
 * LE BLUR-IN et LE HOVER MAGNÉTIQUE — les deux gestes qui se répètent partout.
 *
 * Le blur-in est le système le plus réutilisable du site : un titre se révèle
 * ligne par ligne, un bloc d'un seul tenant, et les deux sortent du flou en
 * montant de 16 px. Tout le reste de la page s'y raccroche par un attribut.
 *
 * Trois pièges, tous rencontrés avant d'arriver ici :
 *  1. `immediateRender` n'écrit pas fiablement l'état de départ dans le DOM.
 *     Il faut un `gsap.set` EXPLICITE après le `fromTo`, sinon l'élément reste
 *     invisible pour toujours si son déclencheur est manqué.
 *  2. `blur(0px)` garde un calque de compositing vivant, qui scintille : on
 *     supprime réellement le filtre à la fin — sauf si un enfant porte un
 *     `backdrop-filter`, qui sauterait.
 *  3. Ce qui est DÉJÀ visible au chargement ne recevra jamais d'`onEnter` :
 *     il faut le trier de haut en bas et le jouer à la main.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Le flou en `em`, pas en pixels : 12 px sont un voile sur un titre de 128 px
   et un brouillard sur une légende de 14 px. En `em`, le réglage suit le corps.
   (Artem Shcherbakov — confirmé sur quatre autres sites du corpus.) */
const BLUR = '0.34em';
const RISE = 16;
const DUR = 0.8;
/* L'opacité finit AVANT le mouvement. Un élément doit être lisible avant
   d'être arrivé : sinon l'œil lit un objet qui glisse, au lieu d'un objet qui
   se pose. Rapport 1:2, mesuré chez Sadu Media ; TBWA fait 1:4,5 en CSS. */
const DUR_FADE = 0.4;
const EASE = 'power3.out';
const STAGGER_MAX = 0.12;
const STAGGER_TOTAL = 0.5;
const START = 'top 85%';
const ABOVE = 0.85;          /* déjà visible au chargement : joué à la main */

const MAGNET_MIN = 992;
const MAGNET_EM = 16;        /* la force est donnée en 16e d'em */
const MAGNET_DUR = 1.6;
const MAGNET_INNER_DUR = 2;
const MAGNET_BACK = 'elastic.out(1, 0.3)';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Le pas entre deux lignes, plafonné : vingt lignes ne doivent pas durer 2,4 s. */
const step = (n) => (n > 1 ? Math.min(STAGGER_MAX, STAGGER_TOTAL / (n - 1)) : 0);

/* ═══════════════════════ LE BLUR-IN ═══════════════════════ */

/**
 * Pose les attributs sur une liste de sélecteurs. Les pages portent déjà leurs
 * classes ; les redéclarer une à une dans le HTML n'apporterait rien, et un
 * oubli se verrait — un bloc resté invisible.
 * `kind` : 'lines' découpe le texte (titres), 'element' révèle d'un seul tenant.
 */
export function markReveals(sel, kind = 'element') {
  const attr = kind === 'lines' ? 'data-blur-in' : 'data-element-blur';
  for (const el of document.querySelectorAll(sel)) {
    if (!el.hasAttribute('data-blur-in') && !el.hasAttribute('data-element-blur')) {
      el.setAttribute(attr, '');
    }
  }
}

/** Même idée pour l'aimant : les appels à l'action, sans les répéter en HTML. */
export function markMagnets(sel, strength = 20) {
  for (const el of document.querySelectorAll(sel)) {
    if (el.hasAttribute('data-magnetic-strength')) continue;
    el.setAttribute('data-magnetic-strength', String(strength));
    if (!el.querySelector('[data-magnetic-inner]')) {
      const kids = [...el.childNodes];
      if (kids.length === 1 && kids[0].nodeType === 1) kids[0].setAttribute('data-magnetic-inner', '');
    }
  }
}


export function initReveals(root = document) {
  const heads = [...root.querySelectorAll('[data-blur-in]')];
  const blocks = [...root.querySelectorAll('[data-element-blur]')];
  const all = [...heads, ...blocks];
  if (!all.length) return;

  if (reduced()) {
    gsap.set(all, { autoAlpha: 1, clearProps: 'filter,transform' });
    return;
  }

  const ready = [];

  for (const el of all) {
    if (el.dataset.revealed) continue;
    el.dataset.revealed = '1';

    let targets = [el];
    if (el.hasAttribute('data-blur-in')) {
      try {
        targets = new SplitText(el, { type: 'lines', linesClass: 'rv-line', autoSplit: true }).lines;
      } catch { targets = [el]; }
    }
    if (!targets.length) targets = [el];

    // Une révélation terminée doit RENDRE LA MAIN. Tant qu'elle laisse
    // `opacity` en style inline, elle bat toute règle CSS — et le survol qui
    // éteint les frères, lui, passe justement par l'opacité. On efface donc
    // tout ce que le tween a écrit : l'élément redevient un élément.
    // (`filter` en prime : `blur(0em)` garde un calque de compositing vivant.)
    const keepFilter = el.querySelector('[data-backdrop]') !== null;
    const props = keepFilter ? 'opacity,visibility,transform' : 'filter,opacity,visibility,transform';
    const free = () => gsap.set(targets, { clearProps: props });

    const st = step(targets.length);
    // `onComplete` sur la TIMELINE, pas sur le tween interne : c'est la fin de
    // l'ensemble qui rend la main, et c'est le seul rappel qui se déclenche de
    // façon fiable quand deux tweens de durées différentes tournent ensemble.
    const tween = gsap.timeline({ paused: true, onComplete: free })
      .fromTo(targets,
        { y: RISE, filter: `blur(${BLUR})` },
        { y: 0, filter: 'blur(0em)', duration: DUR, ease: EASE, stagger: st,
          immediateRender: false }, 0)
      .fromTo(targets,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: DUR_FADE, ease: 'power1.out', stagger: st,
          immediateRender: false }, 0);

    // L'état de départ, écrit explicitement : sans ça, un déclencheur manqué
    // laisse l'élément invisible pour de bon.
    gsap.set(targets, { autoAlpha: 0, y: RISE, filter: `blur(${BLUR})` });

    ScrollTrigger.create({
      trigger: el, start: START, refreshPriority: -2,
      onEnter: () => tween.restart()
    });
    // Repartir du haut quand on remonte au-dessus de la section : la deuxième
    // descente doit rejouer, pas afficher un état déjà arrivé.
    ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top', refreshPriority: -2,
      onLeaveBack: () => tween.pause(0)
    });

    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * ABOVE && r.bottom > 0) ready.push({ el, tween, top: r.top });
  }

  // Ce qui est déjà à l'écran n'aura pas d'`onEnter` : on le joue de haut en
  // bas, au même pas que le reste.
  ready.sort((a, b) => a.top - b.top);
  ready.forEach((it, i) => gsap.delayedCall(i * STAGGER_MAX, () => it.tween.restart()));
}

/* ═══════════════════════ LE HOVER MAGNÉTIQUE ═══════════════════════ */

/**
 * L'élément suit le curseur, son contenu le suit avec un temps de retard, et
 * au départ tout revient avec un rebond. Sous 992 px : rien — il n'y a pas de
 * curseur à suivre, et le doigt déclencherait un saut au premier contact.
 */
export function initMagnets(root = document) {
  const nodes = [...root.querySelectorAll('[data-magnetic-strength]')];
  if (!nodes.length) return;

  gsap.matchMedia().add(`(min-width: ${MAGNET_MIN}px) and (prefers-reduced-motion: no-preference)`, () => {
    const off = [];

    for (const el of nodes) {
      const strength = parseFloat(el.dataset.magneticStrength) || 20;
      const inner = el.querySelector('[data-magnetic-inner]');
      const amp = strength / MAGNET_EM;         // en em : la force suit le corps

      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * amp;
        const y = ((e.clientY - r.top) / r.height - 0.5) * amp;
        // `rotate` non nul force la promotion GPU : sans lui, Safari repeint
        // le bouton à chaque frame au lieu de le composer.
        gsap.to(el, { x: `${x}em`, y: `${y}em`, rotate: 0.001, duration: MAGNET_DUR, ease: 'power4.out' });
        if (inner) gsap.to(inner, { x: `${x}em`, y: `${y}em`, duration: MAGNET_INNER_DUR, ease: 'power4.out' });
      };

      const back = () => {
        gsap.to([el, inner].filter(Boolean),
          { x: 0, y: 0, duration: MAGNET_DUR, ease: MAGNET_BACK });
      };

      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', back);
      // Le focus clavier ne doit pas laisser le bouton décalé de sa cible.
      el.addEventListener('blur', back);
      off.push(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', back);
        el.removeEventListener('blur', back);
        gsap.set([el, inner].filter(Boolean), { clearProps: 'transform' });
      });
    }

    return () => { for (const fn of off) fn(); };
  });
}
