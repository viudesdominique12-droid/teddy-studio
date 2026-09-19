/**
 * L'AJUSTEUR DE TITRE.
 * Chaque ligne du titre est calée pour occuper EXACTEMENT la largeur disponible :
 * un bloc typographique justifié, à tous les écrans, sans valeur magique.
 *
 * C'est ce qui permet le contraste d'axes du hero — une ligne large et fine
 * au-dessus d'une ligne serrée et grasse — tout en gardant un bloc net.
 */

const MIN = 8;   // px — garde-fou
const MAX = 400; // px

function textWidth(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  return r.getBoundingClientRect().width;
}

/** Cale une ligne sur `target` px de large par bissection sur la taille de police. */
function fitLine(el, target) {
  if (!target || target < 40) return;
  el.style.fontSize = '';
  const start = parseFloat(getComputedStyle(el).fontSize) || 100;

  let size = start;
  // Deux passes multiplicatives : la largeur du texte est quasi linéaire en taille.
  for (let i = 0; i < 6; i++) {
    el.style.fontSize = `${size}px`;
    const w = textWidth(el);
    if (!w) return;
    if (Math.abs(w - target) < 0.6) break;
    size = Math.min(MAX, Math.max(MIN, size * (target / w)));
  }
  // Dernier cran de sûreté : jamais de débordement d'un pixel.
  while (textWidth(el) > target && size > MIN) {
    size -= 0.5;
    el.style.fontSize = `${size}px`;
  }
}

export function fitHeadline(root = document) {
  const host = root.querySelector('[data-fit]');
  if (!host) return () => {};

  const lines = [...host.querySelectorAll('[data-fit-line]')];
  if (!lines.length) return () => {};

  const run = () => {
    const box = host.getBoundingClientRect().width;
    if (!box) return;
    for (const l of lines) fitLine(l, box);

    /* Un titre pleine largeur est une affiche ; un titre qui mange l'écran
       est un mur. Le bloc ne dépasse jamais la part du viewport qu'on lui
       accorde — sinon la bande vidéo et les CTA passent sous la ligne de flottaison. */
    const cap = window.innerHeight * (window.innerWidth < 768 ? 0.44 : 0.58);
    const h = host.getBoundingClientRect().height;
    if (h > cap) {
      const k = cap / h;
      for (const l of lines) {
        l.style.fontSize = `${parseFloat(getComputedStyle(l).fontSize) * k}px`;
      }
    }
    host.dataset.fitted = '1';
  };

  // La mesure n'a de sens qu'une fois la fonte réellement chargée.
  if (document.fonts?.ready) document.fonts.ready.then(run);
  run();

  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(run);
  };

  const ro = new ResizeObserver(onResize);
  ro.observe(host);
  window.addEventListener('orientationchange', onResize);

  return () => { ro.disconnect(); window.removeEventListener('orientationchange', onResize); };
}
