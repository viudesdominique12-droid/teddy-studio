/** Le scroll fluide, partagé par toutes les pages. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';

/* Lenis seulement à la souris (F27, 18/10/2026). Sur un téléphone, le
   défilement tactile restait déjà NATIF (`syncTouch` à faux) : Lenis n'y
   faisait que tourner sa boucle à chaque image et peser ~6 Ko. Il n'est donc
   chargé que pour un pointeur fin qui survole (souris, pavé tactile) ; au
   doigt, les ancres glissent nativement, 86 px sous la barre. */
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const BAR = 86;   // la barre du haut et son air

if (!reduced()) {
  // Les animations gardent le pas de l'horloge après une image lente (avant,
  // posé avec Lenis sur tous les appareils) : on ne change rien au rythme.
  gsap.ticker.lagSmoothing(0);
}

/* Une ancre de la même page, ou rien. */
function sameAnchor(e) {
  const a = e.target.closest?.('a[href*="#"]');
  if (!a) return null;
  const url = new URL(a.href, location.href);
  if (url.pathname !== location.pathname || url.origin !== location.origin || !url.hash) return null;
  // Par l'identifiant, pas par un sélecteur : une ancre comme `#2024-gala`
  // n'est pas un sélecteur CSS valide.
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  return target ? { url, target } : null;
}

if (FINE && !reduced()) {
  /* `duration` + `easing` imposent à CHAQUE impulsion de molette un tween de
     1,05 s : le scroll cesse de suivre la main, il rejoue une courbe. `lerp`
     — le défaut de Lenis, et ce qu'emploie la référence — poursuit la cible en
     continu, donc reste accroché au geste. `syncTouch` reste à faux (défaut) :
     un écran tactile garde son défilement NATIF, avec l'inertie du système. */
  window.__lenisReady = import('lenis').then(({ default: Lenis }) => {
    const root = document.documentElement;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, touchMultiplier: 1 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    window.addEventListener('menu:open', () => lenis.stop());
    // Le menu du téléphone ouvert : la page derrière ne bouge plus ; le menu,
    // lui, défile (il porte `data-lenis-prevent`).
    window.addEventListener('index:open', () => lenis.stop());
    window.addEventListener('index:close', () => lenis.start());
    window.addEventListener('menu:close', () => lenis.start());
    // Lenis arrive un instant après la page : ce qui l'aurait arrêté entre-
    // temps (l'ouverture de l'accueil, le menu ouvert) l'arrête dès sa venue.
    if (root.classList.contains('is-booting') || root.classList.contains('is-locked')) lenis.stop();
    window.dispatchEvent(new CustomEvent('lenis:ready', { detail: lenis }));
    return lenis;
  }).catch(() => null);   // sans lui, le défilement natif suffit
} else {
  window.__lenisReady = Promise.resolve(null);
}

if (!FINE) {
  /* Au doigt : les ancres (un lien, une adresse avec `#…`, le focus) s'arrêtent
     sous la barre, et non dessous. */
  document.documentElement.style.scrollPaddingTop = `${BAR}px`;

  /* Le menu ouvert : la page derrière ne défile plus au doigt (Lenis le
     faisait ; `is-locked` seul ne suffit pas aux anciens iOS). Le menu, lui,
     défile toujours (`data-lenis-prevent`). */
  const hold = (e) => { if (e.cancelable && !e.target.closest?.('[data-lenis-prevent]')) e.preventDefault(); };
  window.addEventListener('index:open', () => document.addEventListener('touchmove', hold, { passive: false }));
  window.addEventListener('index:close', () => document.removeEventListener('touchmove', hold));
}

if (!reduced()) {
  document.addEventListener('click', (e) => {
    const hit = sameAnchor(e);
    if (!hit) return;
    const { url, target } = hit;
    e.preventDefault();
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(target, { offset: -BAR, duration: 1.1 });
    else if (!FINE) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else {
      // À la souris, avant que Lenis ne soit là (un instant) : le même point.
      const m = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - BAR - m, behavior: 'smooth' });
    }
    // La requête reste dans l'adresse (`?type=wedding#inquiry`) : le
    // formulaire vient d'être orienté par elle (`inquiry.js`).
    history.pushState(null, '', url.search + url.hash);
  });
}
