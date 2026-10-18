/**
 * CONTACT — le bureau, la carte du lieu (18/10/2026).
 *
 *   · les trois lignes de l'adresse montent l'une après l'autre ;
 *   · l'étage s'affiche comme sur un ascenseur : 1, 2, 3, 4… 5 (seul le « 5 »
 *     est du texte ; les autres chiffres viennent de la feuille de style) ;
 *   · la carte du lieu s'incline à peine sous le pointeur (ordinateur) ; un
 *     appui ou un clic sur la carte fait lancer au phare une onde plus large.
 * En mouvement réduit : tout est en place, l'étage affiche 5.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

export function initVisit() {
  const sec = document.querySelector('.ct-visit');
  if (!sec) return;
  const still = reduced();
  const lines = sec.querySelectorAll('.ct-visit__h > span');
  const floor = sec.querySelector('.ct-floor__s');
  const card = sec.querySelector('[data-loc]');
  const pin = card?.querySelector('.ct-pin');

  if (!still) {
    gsap.set(lines, { autoAlpha: 0, y: 34 });
    if (floor) gsap.set(floor, { y: 0, yPercent: 0 });
    if (card) gsap.set(card, { autoAlpha: 0, y: 30 });
    ScrollTrigger.create({
      trigger: sec, start: 'top 72%', once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        tl.to(lines, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0);
        if (floor) tl.to(floor, { yPercent: -80, duration: 2, ease: 'power2.inOut' }, 0.25);
        if (card) tl.to(card, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', clearProps: 'opacity,visibility' }, 0.35);
      }
    });
  }

  if (!card) return;
  // L'onde du phare, au clic ou à l'appui sur la carte (pas sur le lien).
  const burst = () => {
    if (!pin || still) return;
    pin.classList.remove('is-burst');
    void pin.offsetWidth;
    pin.classList.add('is-burst');
  };
  card.addEventListener('pointerdown', (e) => { if (!e.target.closest('a')) burst(); });
  pin?.addEventListener('animationend', (e) => { if (e.pseudoElement === '::after') pin.classList.remove('is-burst'); });

  // L'inclinaison sous le pointeur (ordinateur).
  if (still || LITE) return;
  gsap.set(card, { transformPerspective: 900 });
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'power3.out' });
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'power3.out' });
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx(-py * 7);
    ry(px * 8);
  });
  card.addEventListener('pointerleave', () => { rx(0); ry(0); });
}
