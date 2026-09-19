/** Le scroll fluide, partagé par toutes les pages. */
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';

if (!reduced()) {
  /* `duration` + `easing` imposent à CHAQUE impulsion de molette un tween de
     1,05 s : le scroll cesse de suivre la main, il rejoue une courbe. `lerp`
     — le défaut de Lenis, et ce qu'emploie la référence — poursuit la cible en
     continu, donc reste accroché au geste. `syncTouch` reste à faux (défaut) :
     sur un téléphone le défilement tactile doit rester NATIF, avec l'inertie
     du système. C'est la première raison pour laquelle un site ne « sent »
     pas le bureau rétréci. */
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, touchMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener('menu:open', () => lenis.stop());
  window.addEventListener('menu:close', () => lenis.start());

  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || url.origin !== location.origin || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -86, duration: 1.1 });
    history.pushState(null, '', url.hash);
  });
}
