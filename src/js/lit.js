/**
 * LE TITRE ÉCLAIRÉ — de la lumière de plateau sur le lettrage, sans WebGL.
 *
 * Trois couches superposées sur le même texte :
 *
 *  1. **Le balayage** — un dégradé asymétrique traverse les lettres en 3,8 s.
 *     L'asymétrie est tout : la montée fait 8 points (42 % → 50 %), la descente
 *     22 (50 % → 72 %). Un dégradé symétrique paraîtrait immobile.
 *
 *  2. **Le bloom** — un filtre SVG dont la ligne alpha vaut `0 0 0 12 -5.5` :
 *     l'alpha est multiplié par 12 puis décalé de −5,5, donc **tout ce qui est
 *     sous ≈0,458 tombe à zéro**. C'est un SEUIL. Seul le cœur le plus clair du
 *     balayage survit, et c'est lui seul qui déborde en flou — exactement comme
 *     le bloom d'un rendu 3D.
 *
 *  3. **Le halo du curseur** — un dégradé radial qui suit la main. Son intensité
 *     n'est pas binaire : elle vient de la distance au point le plus proche du
 *     RECTANGLE du texte, normalisée sur 60 px. Le halo s'allume donc en
 *     approchant, avant même le survol.
 *
 * Et le vrai coup de maître, c'est le COUPLAGE : l'opacité du balayage
 * automatique est pilotée à l'inverse du halo. Sans curseur, 0,90 ; curseur
 * dessus, 0,18. L'animation d'ambiance s'efface dès que l'utilisateur prend la
 * main — le principe vaut pour n'importe quel élément vivant d'un site.
 */

import gsap from 'gsap';

/* La référence allume sur 60 px — ses titres sont petits. Sur un mot de
   128 px de haut, la même portée ne touche qu'une lettre à la fois. */
const REACH = 130;
const SWEEP_S = 3.8;
const SWEEP_GAP = 0.2;
const CALM_K = 0.45;             /* sans mouvement : on garde la matière, pas le geste */

const FILTER = `
<svg class="lit-defs" width="0" height="0" aria-hidden="true" focusable="false">
  <filter id="lit-bloom" x="-60%" y="-200%" width="220%" height="500%"
          color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -5.5" result="thr"/>
    <feComposite in="SourceGraphic" in2="thr" operator="in" result="core"/>
    <feGaussianBlur in="core" stdDeviation="2.5" result="b1"/>
    <feGaussianBlur in="core" stdDeviation="8" result="b2"/>
    <feMerge>
      <feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</svg>`;

export function initLit(sel = '[data-lit]') {
  const nodes = [...document.querySelectorAll(sel)];
  if (!nodes.length || window.__teddyLit) return;
  window.__teddyLit = true;

  // Le texte est recopié dans un attribut : les deux calques le repeignent en
  // `background-clip: text`, et il ne peut pas diverger de l'original.
  for (const el of nodes) el.dataset.litText = el.textContent.trim();

  document.body.insertAdjacentHTML('beforeend', FILTER);

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!calm) {
    // Le balayage : on n'anime QUE `background-position`. Le dégradé fait
    // 220 % de large, il traverse donc de 160 % à −60 %.
    gsap.fromTo(nodes,
      { '--lit-x': '160%' },
      { '--lit-x': '-60%', duration: SWEEP_S, ease: 'none',
        repeat: -1, repeatDelay: SWEEP_GAP });
  }

  if (!fine) {
    for (const el of nodes) el.style.setProperty('--lit-k', calm ? CALM_K : 0);
    return;
  }
  if (calm) {
    for (const el of nodes) el.style.setProperty('--lit-k', CALM_K);
    return;
  }

  // Ressorts quasi critiques : 26 / (2√(180 × 0,35)) ≈ 1,04 — ça se pose, ça
  // ne rebondit pas. `quickTo` en donne l'équivalent sans plugin de physique.
  const setX = nodes.map((el) => gsap.quickTo(el, '--lit-hx', { duration: 0.28, ease: 'power2.out' }));
  const setY = nodes.map((el) => gsap.quickTo(el, '--lit-hy', { duration: 0.28, ease: 'power2.out' }));
  const setK = nodes.map((el) => gsap.quickTo(el, '--lit-k', { duration: 0.36, ease: 'power2.out' }));

  window.addEventListener('pointermove', (e) => {
    nodes.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      // La distance au point le plus proche du RECTANGLE, pas à son centre :
      // sinon un titre large s'allume mollement par les bords.
      const cx = Math.min(Math.max(e.clientX, r.left), r.right);
      const cy = Math.min(Math.max(e.clientY, r.top), r.bottom);
      const k = Math.max(0, 1 - Math.hypot(e.clientX - cx, e.clientY - cy) / REACH);
      // On ne déplace le halo QUE s'il est allumé : en sortant, il s'éteint sur
      // place au lieu de partir en glissade vers le curseur.
      if (k > 0) { setX[i](e.clientX - r.left); setY[i](e.clientY - r.top); }
      setK[i](k);
    });
  }, { passive: true });
}
