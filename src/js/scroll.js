/** Le scroll fluide, partagé par toutes les pages. */
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';

if (!reduced()) {
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6
  });
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
