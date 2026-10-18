/**
 * CONTACT — l'accueil du studio, le signal (17/10/2026, refait le 18/10).
 *
 *   studioClock()     l'heure réelle d'Addis-Abeba, comme sur une horloge de
 *                     régie : soixante points pour les secondes, qui
 *                     s'allument un à un et s'éteignent ensemble à la minute ;
 *                     les chiffres roulent comme un compteur. À l'arrivée,
 *                     les chiffres montent de 00:00 jusqu'à l'heure et
 *                     l'anneau s'allume jusqu'à la seconde en cours. Sous
 *                     l'horloge : l'heure du visiteur et l'écart avec Addis.
 *   prefillDivision() « De quoi s'agit-il ? » se coche depuis l'adresse :
 *                     ?category=live, ?type=events, ?division=rentals (ou le
 *                     nom de la page : ?category=feature-film…).
 *
 *   liveSections()    les boucles d'une section (filets qui défilent,
 *                     impulsions, phare) ne tournent que si elle se voit.
 * Les pièces du 18/10, chacune dans son module :
 *   contact-signal.js le signal de l'ouverture (la ligne et les anneaux) ;
 *   contact-desk.js   le comptoir : la fiche de routage qui se compose ;
 *   contact-board.js  le standard des sept lignes ;
 *   contact-visit.js  la carte du lieu, l'étage, le phare.
 *
 * L'horloge s'arrête hors de l'écran et quand l'onglet est caché ; en
 * mouvement réduit, l'heure change sans rouler. Chaque seconde peinte, elle
 * prévient la page (`ct:tick`) : le signal s'en sert.
 */
import gsap from 'gsap';
import { bootDivision } from '../division.js';
import { reduced } from '../motion.js';
import { addisTime, offsetFromAddis } from '../clock.js';
import { divisions } from '../../data/divisions.js';
import { initSignal } from './contact-signal.js';
import { initDesk } from './contact-desk.js';
import { initBoard } from './contact-board.js';
import { initVisit } from './contact-visit.js';

const STILL = reduced();

bootDivision();
reachLink();
prefillDivision();
studioClock();
sunPause();
liveSections();
initSignal();
initDesk();
initBoard();
initVisit();

/* Les boucles en CSS d'une section ne tournent que si elle se voit
   (`.is-live`) ; le pied de page aussi (son filet de signal). */
function liveSections() {
  const els = [...document.querySelectorAll('[data-live]'), document.querySelector('.ftr')].filter(Boolean);
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-live')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
  }, { rootMargin: '8% 0px' });
  els.forEach((e) => io.observe(e));
}

/* « Contact Our Team » mène aux trois portes : à gauche du formulaire sur
   ordinateur, juste après lui sur téléphone. */
function reachLink() {
  const a = document.querySelector('[data-reach-link]');
  if (!a) return;
  const mq = matchMedia('(max-width: 60rem)');
  const set = () => a.setAttribute('href', mq.matches ? '#reach-m' : '#reach');
  set();
  mq.addEventListener('change', set);
}

/* ─────────────── L'adresse oriente la demande ─────────────── */
function prefillDivision() {
  const form = document.querySelector('form[data-inquiry="general"]');
  if (!form) return;
  const alias = {
    tech: 'rentals', equipment: 'rentals', rental: 'rentals', event: 'events', streaming: 'live',
    documentary: 'doc', documentaries: 'doc', films: 'film', 'feature-films': 'film'
  };
  for (const d of divisions) { alias[d.slug] = d.id; alias[d.id] = d.id; }
  const q = new URLSearchParams(location.search);
  const raw = [q.get('category'), q.get('type'), q.get('division')].filter(Boolean).join(',');
  if (!raw) return;
  const want = new Set(raw.toLowerCase().split(',').map((v) => alias[v.trim()] || v.trim()));
  form.querySelectorAll('input[name="division"]').forEach((i) => { if (want.has(i.value)) i.checked = true; });
}

/* ─────────────── L'horloge de studio ─────────────── */
function makeCol(base) {
  const el = document.createElement('span');
  el.className = 'ct-col';
  const s = document.createElement('span');
  s.className = 'ct-col__s';
  // 0 … base−1, puis un 0 de plus : le passage 9 → 0 roule vers le haut.
  for (let i = 0; i <= base; i++) {
    const d = document.createElement('span');
    d.textContent = String(i % base);
    s.append(d);
  }
  el.append(s);
  return { el, s, base, v: -1 };
}

function setCol(col, v, dur) {
  if (col.v === v) return;
  const n = col.base + 1;
  const prev = col.v;
  col.v = v;
  if (prev < 0 || !dur) { gsap.set(col.s, { yPercent: (-100 * v) / n }); return; }
  if (v === 0 && prev === col.base - 1) {
    gsap.to(col.s, {
      yPercent: (-100 * col.base) / n, duration: dur, ease: 'expo.out', overwrite: true,
      onComplete: () => gsap.set(col.s, { yPercent: 0 })
    });
  } else {
    gsap.to(col.s, { yPercent: (-100 * v) / n, duration: dur, ease: 'expo.out', overwrite: true });
  }
}

function studioClock() {
  const root = document.querySelector('[data-studio-clock]');
  if (!root) return;
  const ring = root.querySelector('[data-ring]');
  const hmEl = root.querySelector('[data-hm]');
  const sEl = root.querySelector('[data-s]');
  const local = root.querySelector('[data-local]');

  // L'anneau : douze repères, soixante secondes.
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 12; i++) {
    const m = document.createElement('i');
    m.className = 'ct-mark';
    m.style.setProperty('--i', String(i));
    frag.append(m);
  }
  const dots = [];
  for (let i = 0; i < 60; i++) {
    const d = document.createElement('i');
    d.className = 'ct-dot';
    d.style.setProperty('--i', String(i));
    frag.append(d);
    dots.push(d);
  }
  ring.append(frag);

  // Les chiffres.
  const H1 = makeCol(3), H2 = makeCol(10), M1 = makeCol(6), M2 = makeCol(10);
  const S1 = makeCol(6), S2 = makeCol(10);
  const colon = document.createElement('span');
  colon.className = 'ct-colon';
  colon.textContent = ':';
  hmEl.replaceChildren(H1.el, H2.el, colon, M1.el, M2.el);
  sEl.replaceChildren(S1.el, S2.el);

  const fLocal = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const paintLocal = () => {
    if (!local) return;
    const off = offsetFromAddis();
    if (!Number.isFinite(off)) return;
    const a = document.createElement('span');
    const b = document.createElement('span');
    if (off === 0) a.textContent = 'You are on Addis Ababa time';
    else {
      a.textContent = `Your time ${fLocal.format(new Date())}`;
      b.className = 'ct-dt';
      b.textContent = `Addis Ababa is ${Math.abs(off)} h ${off > 0 ? 'ahead' : 'behind'}`;
    }
    local.replaceChildren(a, ' ', b);
    local.hidden = false;
  };

  let lastS = -1;
  let lastM = -1;
  const paint = (instant = false) => {
    const parts = addisTime(true).split(':').map(Number);
    const h = parts[0] % 24, m = parts[1], s = parts[2];
    const dHM = instant || STILL ? 0 : 0.9;
    const dS = instant || STILL ? 0 : 0.5;
    setCol(H1, Math.floor(h / 10), dHM);
    setCol(H2, h % 10, dHM);
    setCol(M1, Math.floor(m / 10), dHM);
    setCol(M2, m % 10, dHM);
    setCol(S1, Math.floor(s / 10), dS);
    setCol(S2, s % 10, dS);

    // Les secondes : l'anneau se remplit, et se vide d'un coup à la minute.
    if (s < lastS || lastS < 0) {
      root.classList.toggle('is-reset', !instant && lastS >= 0);
      dots.forEach((d, i) => d.classList.toggle('is-on', i <= s));
    } else {
      root.classList.remove('is-reset');
      for (let i = lastS + 1; i <= s; i++) dots[i].classList.add('is-on');
    }
    dots[lastS]?.classList.remove('is-now');
    dots[s].classList.add('is-now');
    lastS = s;
    if (!instant) root.dispatchEvent(new CustomEvent('ct:tick', { detail: { s, m } }));
    if (m !== lastM) { lastM = m; paintLocal(); }
  };

  let id = 0;
  let running = false;
  let ready = STILL;
  const loop = () => {
    paint();
    id = window.setTimeout(loop, 1000 - (Date.now() % 1000) + 5);
  };
  const start = (instant = true) => {
    if (running) return;
    running = true;
    lastS = -1;
    paint(instant);
    id = window.setTimeout(loop, 1000 - (Date.now() % 1000) + 5);
  };
  const stop = () => { running = false; clearTimeout(id); };

  // L'arrivée : les chiffres partent de 00:00 et roulent jusqu'à l'heure,
  // l'anneau s'allume jusqu'à la seconde en cours.
  if (STILL) {
    start(true);
  } else {
    [H1, H2, M1, M2, S1, S2].forEach((c) => setCol(c, 0, 0));
    gsap.delayedCall(0.55, () => {
      const [h, m, s] = addisTime(true).split(':').map(Number);
      const sweep = gsap.timeline();
      [[H1, Math.floor((h % 24) / 10)], [H2, (h % 24) % 10], [M1, Math.floor(m / 10)], [M2, m % 10], [S1, Math.floor(s / 10)], [S2, s % 10]]
        .forEach(([c, v], i) => {
          const n = c.base + 1;
          c.v = v;
          sweep.to(c.s, { yPercent: (-100 * v) / n, duration: 1.5, ease: 'expo.out' }, i * 0.06);
        });
      dots.forEach((d, i) => { if (i <= s) sweep.call(() => d.classList.add('is-on'), null, 0.1 + i * 0.012); });
      sweep.call(() => { ready = true; if (vis && !document.hidden) start(false); }, null, 0.1 + s * 0.012 + 0.05);
    });
  }

  // Ne tourner que si l'horloge se voit.
  let vis = true;
  new IntersectionObserver(([e]) => {
    vis = e.isIntersecting;
    if (vis && !document.hidden) { if (ready) start(true); }
    else stop();
  }).observe(root);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (vis && ready) start(true);
  });
}

/* La lumière de l'ouverture s'arrête hors de l'écran. */
function sunPause() {
  const hero = document.querySelector('.ct-hero');
  if (!hero || STILL) return;
  new IntersectionObserver(([e]) => hero.classList.toggle('is-off', !e.isIntersecting)).observe(hero);
}
