/**
 * FEATURE FILM — le hall du cinéma (19/10/2026).
 *
 * L'enseigne : un panneau lumineux où les vrais titres (src/data/portfolio.js)
 * sont posés lettre à lettre, chacune un peu de travers, comme sur un tableau
 * à lettres ; ses ampoules courent, les titres défilent lentement. Quand le
 * hall arrive, le tube s'allume en grésillant. Les vitrines des affiches
 * s'éclairent ensuite l'une après l'autre, puis s'éteignent : on les rallume
 * au survol, au clavier, ou — au doigt — sur l'affiche en cours (film.js).
 *
 * Les ampoules sont des pointillés ronds sur un rectangle SVG (film.css) ;
 * ici on règle `pathLength` pour qu'elles tombent tous les ~17 px, en nombre
 * pair (une sur deux s'allume, puis l'autre).
 *
 * Tout ce qui tourne (défilement des titres, ampoules) s'arrête hors de vue
 * et onglet caché. Sans mouvement : l'enseigne allumée, immobile.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

/* Un « hasard » fixe : les deux copies du panneau ont les mêmes lettres de
   travers, la boucle ne se voit pas. */
const jitter = (i, k) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export function fitBulbs(svg, spacing = 17) {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return;
  let n = Math.max(8, Math.round((2 * (r.width + r.height)) / spacing));
  if (n % 2) n += 1;
  svg.querySelectorAll('rect').forEach((rc) => rc.setAttribute('pathLength', String(n * 2)));
}

function letterboard(track, films) {
  let i = 0;
  const seq = () => {
    const box = document.createElement('div');
    box.className = 'fi-marq__seq';
    i = 0;
    films.forEach((f) => {
      String(f.title || '').split(/\s+/).filter(Boolean).forEach((word) => {
        const w = document.createElement('span');
        w.className = 'fi-marq__w';
        for (const ch of word) {
          const l = document.createElement('span');
          l.className = 'fi-marq__l';
          l.textContent = ch;
          l.style.setProperty('--r', `${((jitter(i, 1) - 0.5) * 3.2).toFixed(2)}deg`);
          l.style.setProperty('--y', `${((jitter(i, 2) - 0.5) * 0.08).toFixed(3)}em`);
          w.append(l);
          i += 1;
        }
        box.append(w);
      });
      const sep = document.createElement('span');
      sep.className = 'fi-marq__sep';
      box.append(sep);
    });
    return box;
  };
  track.replaceChildren(seq(), seq());
}

export function initLobby(films) {
  const STILL = reduced();
  const marq = document.querySelector('[data-marq]');
  const track = marq?.querySelector('[data-marq-track]');
  const svgs = [...document.querySelectorAll('#films .fi-bulbs')];

  /* Les ampoules tombent juste, à toute taille. */
  const gap = (s) => (s.closest('.fi-marq') ? 17 : 21);
  svgs.forEach((s) => fitBulbs(s, gap(s)));
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver((entries) => entries.forEach((e) => fitBulbs(e.target, gap(e.target))));
    svgs.forEach((s) => ro.observe(s));
  }

  /* L'enseigne. */
  if (marq && track) {
    if (!films.length) marq.remove();
    else {
      letterboard(track, films);
      // ~42 px par seconde, quelle que soit la longueur des titres.
      const speed = () => {
        const w = track.firstElementChild?.getBoundingClientRect().width || 0;
        if (w) marq.style.setProperty('--marq-dur', `${Math.max(30, w / 42).toFixed(1)}s`);
      };
      speed();
      window.addEventListener('resize', speed);
      document.fonts?.ready.then(speed);

      if (STILL) marq.classList.add('is-lit');
      else {
        marq.classList.add('is-dark');
        let seen = false;
        const run = () => marq.classList.toggle('is-run', seen && !document.hidden && marq.classList.contains('is-on'));
        new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }).observe(marq);
        document.addEventListener('visibilitychange', run);
        ScrollTrigger.create({
          trigger: marq, start: 'top 86%',
          onEnter: (self) => {
            self.kill();
            marq.classList.remove('is-dark');
            marq.classList.add('is-on');
            gsap.delayedCall(0.45, run);
          }
        });
      }
    }
  }

  /* Les vitrines s'éclairent l'une après l'autre quand la rangée arrive. */
  const rail = document.querySelector('[data-rail]');
  const cases = [...document.querySelectorAll('#films .fi-film__case')];
  if (!STILL && rail && cases.length) {
    ScrollTrigger.create({
      trigger: rail, start: 'top 72%',
      onEnter: (self) => {
        self.kill();
        cases.forEach((c, k) => {
          c.style.setProperty('--d', `${(0.35 + k * 0.14).toFixed(2)}s`);
          c.classList.add('is-flick');
        });
        gsap.delayedCall(0.35 + cases.length * 0.14 + 1.1, () => cases.forEach((c) => c.classList.remove('is-flick')));
      }
    });
  }
}
