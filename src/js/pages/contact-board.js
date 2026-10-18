/**
 * CONTACT — le standard (18/10/2026).
 *
 * « Go Straight to the Right Team » : sept lignes, une par division, et la
 * ligne de l'accueil. Quand le tableau entre à l'écran, il se met sous
 * tension : les voyants s'allument un à un, les câbles se tracent (CSS, à
 * partir de `.is-on` et de l'indice `--i` de chaque ligne). Au survol, une
 * ligne se branche (CSS). Sur écran tactile, il n'y a pas de survol : la
 * ligne qui passe au milieu de l'écran se branche d'elle-même (`.is-hot`).
 */
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

export function initBoard() {
  const board = document.querySelector('[data-board]');
  if (!board) return;
  const lines = [...board.querySelectorAll('.ct-line')];
  lines.forEach((l, i) => l.style.setProperty('--i', String(i)));

  if (reduced() || !('IntersectionObserver' in window)) {
    board.classList.add('is-on');
    return;
  }
  const power = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    power.disconnect();
    board.classList.add('is-on');
  }, { rootMargin: '0px 0px -22% 0px' });
  power.observe(board);

  if (LITE) {
    const mid = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-hot', e.isIntersecting));
    }, { rootMargin: '-44% 0px -46% 0px' });
    lines.forEach((l) => mid.observe(l));
  }
}
