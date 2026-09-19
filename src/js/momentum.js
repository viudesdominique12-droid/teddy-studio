/**
 * LE HOVER À INERTIE — l'élément répond à la MANIÈRE dont on arrive.
 *
 * Un hover magnétique classique donne toujours le même résultat : il lit la
 * POSITION du curseur. Celui-ci lit sa VITESSE. Arriver vite par la gauche et
 * arriver lentement par le bas ne produisent pas le même geste — c'est ce qui
 * donne l'impression de matière plutôt que d'effet.
 *
 * Deux studios que rien ne relie (LxL Creative à Londres, Hildén & Kaira à
 * Helsinki) l'ont réglé aux mêmes chiffres : ×30 en translation, ×20 en
 * rotation, `resistance: 200`. Quand deux équipes arrivent séparément aux
 * mêmes constantes, ce ne sont plus des goûts, ce sont des valeurs justes.
 *
 * La rotation vient d'un PRODUIT VECTORIEL entre le vecteur centre→curseur et
 * le vecteur vitesse : entrer par le haut à droite en filant vers la gauche
 * fait tourner dans un sens, entrer par le bas dans l'autre. C'est du couple,
 * au sens mécanique.
 *
 * `InertiaPlugin` projette ensuite l'élément à ces vitesses avec retour à zéro.
 * Donc **aucune durée n'est écrite** : la distance parcourue dépend uniquement
 * de la force du geste. C'est là toute la différence.
 */

import gsap from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

gsap.registerPlugin(InertiaPlugin);

const PUSH = 30;                 /* multiplicateur de translation */
const SPIN = 20;                 /* multiplicateur de rotation */
const RESIST = 200;              /* la résistance du milieu */

const clampXY = gsap.utils.clamp(-1080, 1080);
const clampRot = gsap.utils.clamp(-60, 60);

export function initMomentum(sel = '[data-momentum]') {
  const zones = [...document.querySelectorAll(sel)];
  if (!zones.length || window.__teddyMomentum) return;
  window.__teddyMomentum = true;

  // Rien au doigt : il n'y a pas de vitesse à lire avant le contact, et le
  // premier appui déclencherait un saut.
  gsap.matchMedia().add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const off = [];

    for (const zone of zones) {
      const targets = zone.querySelectorAll('[data-momentum-item]');
      if (!targets.length) continue;

      // La vitesse est échantillonnée UNE FOIS PAR FRAME, pas par événement :
      // un pointeur haute fréquence émet plusieurs événements dans le même
      // frame, et la vitesse mesurée deviendrait du bruit.
      let px = 0, py = 0, vx = 0, vy = 0, queued = false;
      let lx = 0, ly = 0, has = false;

      const sample = () => {
        queued = false;
        if (has) { vx = lx - px; vy = ly - py; }
        px = lx; py = ly; has = true;
      };

      const onMove = (e) => {
        lx = e.clientX; ly = e.clientY;
        if (!queued) { queued = true; requestAnimationFrame(sample); }
      };

      const onEnter = (e) => {
        const el = e.target.closest('[data-momentum-item]');
        if (!el || !zone.contains(el)) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        // Le produit vectoriel, normalisé : c'est le couple du geste.
        const torque = (dx * vy - dy * vx) / (Math.hypot(dx, dy) || 1);

        gsap.to(el, {
          inertia: {
            x: { velocity: clampXY(vx * PUSH), end: 0 },
            y: { velocity: clampXY(vy * PUSH), end: 0 },
            rotation: { velocity: clampRot(torque * SPIN), end: 0 },
            resistance: RESIST
          }
        });
      };

      zone.addEventListener('pointermove', onMove, { passive: true });
      zone.addEventListener('pointerover', onEnter);
      off.push(() => {
        zone.removeEventListener('pointermove', onMove);
        zone.removeEventListener('pointerover', onEnter);
        gsap.killTweensOf(targets);
        gsap.set(targets, { clearProps: 'transform' });
      });
    }

    return () => { for (const fn of off) fn(); };
  });
}
