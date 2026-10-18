/**
 * CE QUI NE SE VOIT PAS NE TOURNE PAS (18/10/2026).
 *
 * Les boucles CSS (bandeaux qui défilent, lueurs qui respirent, repères qui
 * clignotent) continuaient de tourner sous le pli : le téléphone recalculait
 * des styles pour des sections que personne ne regardait. Ici, une seule
 * sentinelle pose `data-off` sur chaque section hors de l'écran (et sur
 * toutes quand l'onglet est caché) ; la règle de `base.css` met alors leurs
 * animations en pause. Rien ne change à l'œil : une section reprend là où
 * elle s'était arrêtée, 80 px avant d'entrer.
 *
 * `data-off-manual` : une section qui gère elle-même sa pause (Services) est
 * laissée tranquille.
 */

export function pauseOffscreen(sel = 'main > section, main > .pin-spacer > section, .ftr', margin = '80px') {
  if (window.__teddyOffscreen) return;
  window.__teddyOffscreen = true;
  if (!('IntersectionObserver' in window)) return;
  const els = [...document.querySelectorAll(sel)].filter((el) => !el.hasAttribute('data-off-manual'));
  if (!els.length) return;
  const seen = new Map();
  const paint = (el) => {
    if (el.hasAttribute('data-off-manual')) return;   // marqué après coup
    el.toggleAttribute('data-off', !seen.get(el) || document.hidden);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { seen.set(e.target, e.isIntersecting); paint(e.target); }
  }, { rootMargin: `${margin} 0px` });
  els.forEach((el) => io.observe(el));
  document.addEventListener('visibilitychange', () => {
    for (const el of seen.keys()) paint(el);
  });
}
