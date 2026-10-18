/**
 * FEATURE FILM — la salle de projection (17/10/2026).
 *
 * L'ouverture : un trait de lumière s'allume au milieu de l'écran (0,8 s),
 * les deux caches s'écartent depuis lui (1,2 s) sur une image de nos films,
 * puis le titre arrive comme un carton de générique. Ensuite l'image avance à
 * peine, la fenêtre de projection flotte d'un demi-pixel, le grain court ;
 * toutes les 6,5 s le repère de bobine clignote deux fois et l'image suivante
 * arrive en fondu, avec sa légende (titre du film, tiré du portfolio).
 * Tout s'arrête quand l'écran sort de la vue ou que l'onglet est caché.
 *
 * À l'affiche : les films du portfolio (src/data/portfolio.js), rendus ici
 * AVANT le démarrage commun pour que la visionneuse les trouve. On tire la
 * rangée à la souris (avec élan) ; au doigt, le défilement natif s'aimante
 * sur chaque affiche. Au survol, l'affiche laisse passer les images du film.
 *
 * Le générique : chaque étape s'allume (or) quand elle passe au milieu de
 * l'écran ; les fondus du haut et du bas sont en CSS (sticky). Derrière lui,
 * la cabine : le faisceau et sa poussière (film-credits.js).
 *
 * En quittant l'ouverture (19/10/2026), les caches de l'écran se referment
 * à mesure qu'il sort par le haut : l'image se resserre en bande, le film
 * finit, le générique commence. Le hall (film-lobby.js), les billets
 * (film-seats.js), la pellicule et l'amorce (film-strip.js) vivent dans
 * leurs propres fichiers.
 *
 * La demande (18/10/2026) : une claquette de production qui se remplit à la
 * craie au fil du formulaire, et claque à l'envoi ; la confirmation se lit
 * comme une feuille de service.
 *
 * Sans mouvement : l'image fixe, les caches ouverts, aucune boucle ; la
 * claquette se remplit sans écriture animée et se ferme sans clap.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, splitWords, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { byCategory, STATUS, ROLES } from '../../data/portfolio.js';
import { initCredits } from './film-credits.js';
import { initLobby } from './film-lobby.js';
import { initSeats } from './film-seats.js';
import { initStrip, initLeader } from './film-strip.js';

gsap.registerPlugin(ScrollTrigger);

const STILL = reduced();
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const films = byCategory('film');

/* ─────────────── Utilitaires ─────────────── */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
/** Le film d'où vient une image (`stills` du portfolio). */
const filmOfStill = (name) => films.find((f) => (f.stills || []).some((s) => s.includes(`/${name}-`)));
const filmLabel = (f) => (f ? [f.title, f.aka].filter(Boolean).join(' · ') : '');

/* ═══════════════════ L'OUVERTURE ═══════════════════ */
function projection() {
  const hero = document.querySelector('.fi-hero');
  const screen = hero?.querySelector('[data-screen]');
  if (!screen) return;
  const shots = [...screen.querySelectorAll('[data-shot]')];
  const cap = screen.querySelector('[data-cap]');
  const cue = screen.querySelector('[data-cue]');
  const line = screen.querySelector('[data-line]');
  const mattes = [...screen.querySelectorAll('.fi-matte')];
  const edges = screen.querySelectorAll('.fi-matte i');
  const par = screen.querySelector('[data-par]');
  const title = hero.querySelector('.fi-title');
  const items = hero.querySelectorAll('[data-in]');

  // Chaque image dit de quel film elle vient ; une image sans film connu
  // n'est pas projetée (jamais de légende inventée).
  for (const s of shots) {
    const f = filmOfStill(s.dataset.still);
    if (f) s.dataset.label = filmLabel(f);
    else s.remove();
  }
  const reel = [...screen.querySelectorAll('[data-shot]')];
  if (!reel.length) return;
  if (cap) cap.textContent = reel[0].dataset.label;
  const imgOf = (s) => s.querySelector('img');

  grain(screen);

  if (STILL) return;

  /* La boucle : l'image avance, le repère clignote, fondu sur la suivante. */
  let k = 0;
  let on = true;
  let push = null;
  let timer = null;
  const pushIn = (img, from = 1.04) => {
    push?.kill();
    push = gsap.fromTo(img, { scale: from }, { scale: 1.13, duration: 10, ease: 'none' });
    if (!on) push.pause();
  };
  const swapCap = (text) => {
    if (!cap) return;
    gsap.timeline()
      .to(cap, { autoAlpha: 0, y: -4, duration: 0.3, ease: 'power2.in' })
      .add(() => { cap.textContent = text; })
      .fromTo(cap, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  };
  const cut = () => {
    const prev = reel[k];
    k = (k + 1) % reel.length;
    const next = reel[k];
    gsap.timeline()
      .set(cue, { autoAlpha: 1 }, 0).set(cue, { autoAlpha: 0 }, 0.14)
      .set(cue, { autoAlpha: 1 }, 0.3).set(cue, { autoAlpha: 0 }, 0.44)
      .add(() => {
        next.classList.add('is-on');
        gsap.set(next, { zIndex: 2 });
        gsap.set(prev, { zIndex: 1 });
        pushIn(imgOf(next));
        gsap.fromTo(next, { autoAlpha: 0 }, {
          autoAlpha: 1, duration: 1.1, ease: 'power2.inOut',
          onComplete: () => { prev.classList.remove('is-on'); gsap.set(prev, { clearProps: 'opacity,visibility' }); }
        });
        swapCap(next.dataset.label);
      }, 0.55);
    schedule();
  };
  const schedule = () => {
    timer?.kill();
    if (reel.length < 2) return;
    timer = gsap.delayedCall(6.5, () => (on && !document.hidden ? cut() : schedule()));
  };
  const run = (yes) => {
    on = yes;
    screen.classList.toggle('is-run', yes && !LITE);
    if (yes) { push?.resume(); timer?.resume(); } else { push?.pause(); timer?.pause(); }
  };
  const start = () => {
    pushIn(imgOf(reel[0]), 1.04);
    schedule();
    run(on);
    new IntersectionObserver(([e]) => run(e.isIntersecting && !document.hidden)).observe(screen);
    document.addEventListener('visibilitychange', () => run(!document.hidden && screen.getBoundingClientRect().bottom > 0));
    letterbox();
  };
  /* La sortie : les caches se referment pendant que l'écran sort par le
     haut, jusqu'à ne laisser qu'une bande quand il disparaît. */
  const letterbox = () => {
    const st = { trigger: screen, start: 'top 12%', end: 'bottom top', scrub: 0.4 };
    gsap.fromTo(mattes[0], { yPercent: -101 }, { yPercent: -16, ease: 'power1.in', immediateRender: false, scrollTrigger: st });
    gsap.fromTo(mattes[1], { yPercent: 101 }, { yPercent: 16, ease: 'power1.in', immediateRender: false, scrollTrigger: { ...st } });
  };

  /* L'ouverture : le trait, les caches, le carton-titre. */
  const words = splitWords(title);
  gsap.set(words, { autoAlpha: 0, yPercent: 38, ...(LITE ? {} : { filter: 'blur(10px)' }) });
  gsap.set(items, { autoAlpha: 0, y: 18 });
  gsap.set(mattes, { y: 0, yPercent: 0 });
  gsap.set(line, { autoAlpha: 1, scaleX: 0 });
  gsap.set(hero, { '--fi-spill': 0 });
  gsap.set(imgOf(reel[0]), { scale: 1.16 });

  // Le volet de page (wipe.js) découvre l'écran en 0,85 s : le trait
  // s'allume pendant qu'il passe. L'ouverture ne part qu'une fois la page
  // réellement dessinée (deux images du ticker) : si le premier affichage
  // tarde (polices, téléphone lent), elle ne saute pas en avant.
  const tl = gsap.timeline({ paused: true, onComplete: start });
  let ticks = 0;
  const go = () => {
    if (++ticks < 2) return;
    gsap.ticker.remove(go);
    gsap.delayedCall(0.3, () => tl.play());
  };
  gsap.ticker.add(go);
  tl
    .to(line, { scaleX: 1, duration: 0.8, ease: 'expo.out' }, 0)
    .set(edges, { autoAlpha: 1 }, 0.52)
    .set(line, { autoAlpha: 0 }, 0.53)
    .to(mattes[0], { yPercent: -101, duration: 1.05, ease: 'expo.inOut' }, 0.5)
    .to(mattes[1], { yPercent: 101, duration: 1.05, ease: 'expo.inOut' }, 0.5)
    .to(edges, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, 1.05)
    .to(hero, { '--fi-spill': 1, duration: 1.3, ease: 'power2.out' }, 0.6)
    .to(imgOf(reel[0]), { scale: 1.04, duration: 2.3, ease: 'power3.out' }, 0.5)
    .to(words, {
      autoAlpha: 1, yPercent: 0, ...(LITE ? {} : { filter: 'blur(0px)' }),
      duration: 1.1, stagger: 0.07, ease: 'power3.out', clearProps: 'filter'
    }, 1.0)
    .to(items, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 1.25);

  // À la descente, l'image glisse à peine dans sa fenêtre.
  gsap.to(par, {
    yPercent: 5, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* Le grain : une tuile de bruit tirée une fois, transparente (aucun mode de
   fusion) ; sur téléphone elle reste fixe. Une seconde tuile, plus douce,
   donne leur grain de pellicule à la bande des publics, au plateau de la
   demande et à la claquette ; plus léger sur le papier (`--fi-grain-dark`,
   `--fi-grain-light`, film.css). */
function noise(n, alpha) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d');
  const d = ctx.createImageData(n, n);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = Math.random() * alpha;
  }
  ctx.putImageData(d, 0, 0);
  return c.toDataURL();
}

function grain(screen) {
  const el = screen.querySelector('[data-grain]');
  if (!el) return;
  try { el.style.backgroundImage = `url(${noise(128, 34)})`; } catch { el.remove(); }
}

function softGrain() {
  const main = document.getElementById('main');
  if (!main) return;
  try {
    main.style.setProperty('--fi-grain-dark', `url(${noise(160, 16)})`);
    main.style.setProperty('--fi-grain-light', `url(${noise(160, 9)})`);
  } catch { /* sans grain */ }
}

/* ═══════════════════ À L'AFFICHE ═══════════════════ */
/* La vitrine et ses ampoules (film.css, film-lobby.js). */
const BULBS = `<svg class="fi-bulbs" aria-hidden="true" focusable="false">${['off', 'halo', 'on']
  .map((k) => `<rect class="fi-bulbs__${k}" width="100%" height="100%" rx="4" pathLength="128"/>`).join('')}</svg>`;

function filmCard(p, i, n) {
  const title = esc(p.title);
  const stills = p.stills || [];
  const rows = [];
  if (p.credit) rows.push(['Credit', p.credit]);
  if (ROLES[p.role]) rows.push(['Our role', ROLES[p.role]]);
  return `<li class="fi-film" data-view-group>
    <div class="fi-film__case">
      ${BULBS}
      <button class="fi-film__fig" type="button" data-view="${esc(p.posterFull || p.poster)}" data-view-label="${title} — poster" aria-label="View the poster of ${title}">
        <img src="${esc(p.poster)}" alt="" width="560" height="420" loading="lazy" decoding="async" draggable="false">
        ${stills.map((s) => `<img class="fi-film__pv" data-src="${esc(s)}" alt="" width="1280" height="720" draggable="false">`).join('')}
        <span class="fi-film__st">${esc(STATUS[p.status] || '')}</span>
        <span class="fi-film__open" aria-hidden="true">${stills.length ? 'Poster &amp; stills' : 'View poster'}</span>
      </button>
    </div>
    <div class="fi-film__body">
      <p class="fi-film__n">${pad(i + 1)} / ${pad(n)}</p>
      <h3 class="fi-film__h">${title}</h3>
      ${p.aka ? `<p class="fi-film__aka">Released as <b>${esc(p.aka)}</b></p>` : ''}
      ${rows.length ? `<dl class="fi-film__dl">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${stills.length ? `<div class="fi-film__stills"><span class="dv-mono">Stills</span>${stills.map((s, j) => `<button type="button" data-view="${esc(s)}" data-view-label="${title} — still ${j + 1}" aria-label="View still ${j + 1} from ${title}"><img src="${esc(p.stillThumbs?.[j] || s)}" alt="" width="240" height="135" loading="lazy" decoding="async" draggable="false"></button>`).join('')}</div>` : ''}
      <a class="fi-film__go" href="/portfolio.html#${esc(p.slug)}">In the portfolio</a>
    </div>
  </li>`;
}

function renderFilms() {
  const track = document.querySelector('[data-films]');
  if (!track) return;
  const total = document.querySelector('[data-rail-total]');
  if (!films.length) {
    // Jamais de faux exemple : l'état « en préparation » du portfolio commun.
    const box = document.createElement('div');
    box.className = 'dv-wrap';
    box.innerHTML = `<div class="dv-empty"><div><h3 class="dv-empty__h">Selected films, being prepared</h3>
      <p>We are assembling our film portfolio. Ask our team for recent references.</p></div>
      <a class="dv-btn dv-btn--ghost" href="#inquiry">Ask for references</a></div>`;
    track.closest('[data-rail]')?.replaceWith(box);
    document.querySelector('.fi-rail__foot')?.remove();
    return;
  }
  track.innerHTML = films.map((p, i) => filmCard(p, i, films.length)).join('');
  if (total) total.textContent = pad(films.length);
}

function initRail() {
  const rail = document.querySelector('[data-rail]');
  if (!rail) return;
  const cards = [...rail.querySelectorAll('.fi-film')];
  const thumb = document.querySelector('[data-rail-thumb]');
  const num = document.querySelector('[data-rail-n]');
  const steps = [...document.querySelectorAll('[data-rail-step]')];
  const max = () => Math.max(0, rail.scrollWidth - rail.clientWidth);
  let tween = null;

  /* Où l'on en est : la barre, le numéro, les flèches. */
  const paint = () => {
    const m = max();
    const p = m > 0 ? rail.scrollLeft / m : 0;
    const w = Math.min(100, (rail.clientWidth / rail.scrollWidth) * 100);
    if (thumb) {
      thumb.style.setProperty('--w', `${w}%`);
      thumb.style.setProperty('--x', `${(p * (100 - w)) / (w || 1) * 100}%`);
    }
    // Le numéro : la première affiche entièrement visible. Au doigt, sa
    // vitrine s'allume (à la souris, c'est le survol).
    if (cards.length) {
      const x0 = cards[0].offsetLeft;
      const i = cards.findIndex((c) => c.offsetLeft - x0 >= rail.scrollLeft - 4);
      if (num) num.textContent = pad(i < 0 ? cards.length : i + 1);
      if (!FINE) cards.forEach((c, j) => c.classList.toggle('is-lit', j === (i < 0 ? cards.length - 1 : i)));
    }
    steps.forEach((b) => { b.disabled = Number(b.dataset.railStep) < 0 ? rail.scrollLeft < 4 : rail.scrollLeft > m - 4; });
  };
  rail.addEventListener('scroll', paint, { passive: true });
  window.addEventListener('resize', paint);
  paint();

  const stepSize = () => (cards[0] ? cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(cards[0].parentElement).columnGap || 0) : rail.clientWidth * 0.8);
  const glide = (to) => {
    tween?.kill();
    const x = Math.max(0, Math.min(max(), to));
    if (STILL || !FINE) { rail.scrollTo({ left: x, behavior: STILL ? 'auto' : 'smooth' }); return; }
    tween = gsap.to(rail, { scrollLeft: x, duration: 0.95, ease: 'power3.inOut' });
  };
  steps.forEach((b) => b.addEventListener('click', () => glide(rail.scrollLeft + Number(b.dataset.railStep) * stepSize())));
  rail.addEventListener('keydown', (e) => {
    if (e.target !== rail) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); glide(rail.scrollLeft + stepSize()); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); glide(rail.scrollLeft - stepSize()); }
  });

  /* À la souris : on tire, et la rangée garde son élan. */
  if (FINE) {
    let down = false; let moved = false;
    let x0 = 0; let s0 = 0; let lx = 0; let lt = 0; let v = 0;
    rail.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType !== 'mouse') return;
      down = true; moved = false;
      x0 = lx = e.clientX; s0 = rail.scrollLeft; lt = performance.now(); v = 0;
      tween?.kill();
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 6) { moved = true; rail.classList.add('is-drag'); }
      if (!moved) return;
      rail.scrollLeft = s0 - dx;
      const t = performance.now();
      v = 0.8 * v + 0.2 * ((e.clientX - lx) / Math.max(1, t - lt));
      lx = e.clientX; lt = t;
    });
    const up = () => {
      if (!down) return;
      down = false;
      rail.classList.remove('is-drag');
      if (moved && !STILL) {
        const to = Math.max(0, Math.min(max(), rail.scrollLeft - v * 420));
        tween = gsap.to(rail, { scrollLeft: to, duration: 1.1, ease: 'power3.out' });
      }
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    // Un glissé n'est pas un clic : la visionneuse ne s'ouvre pas.
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  /* Au survol : l'affiche laisse passer les images du film. */
  if (FINE && !STILL) {
    rail.querySelectorAll('.fi-film__fig').forEach((fig) => {
      const pv = [...fig.querySelectorAll('.fi-film__pv')];
      if (!pv.length) return;
      let i = -1; let t = 0;
      const show = (j) => pv.forEach((im, m) => im.classList.toggle('is-on', m === j));
      const tick = () => { i = (i + 1) % pv.length; show(i); t = window.setTimeout(tick, 1600); };
      const enter = () => {
        pv.forEach((im) => { if (!im.getAttribute('src')) im.src = im.dataset.src; });
        window.clearTimeout(t); t = window.setTimeout(tick, 280);
      };
      const leave = () => { window.clearTimeout(t); i = -1; show(-1); };
      fig.addEventListener('pointerenter', enter);
      fig.addEventListener('pointerleave', leave);
      fig.addEventListener('focus', enter);
      fig.addEventListener('blur', leave);
    });
  }

  /* L'entrée : les affiches arrivent de la droite, une à une — tôt, pour
     qu'elles soient déjà là quand la section arrive. */
  if (!STILL) {
    gsap.set(cards, { autoAlpha: 0, x: 70 });
    ScrollTrigger.create({
      trigger: rail, start: 'top 94%', once: true,
      onEnter: () => gsap.to(cards, { autoAlpha: 1, x: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity,visibility' })
    });
  }
}

/* ═══════════════════ LA DEMANDE : LA CLAQUETTE ═══════════════════
   La claquette recopie le formulaire, à la craie : PROD. (le type et le
   genre), STAGE (et sa jauge de six étapes), ROLE, YOU ARE, FROM, TIMELINE,
   LOGLINE. Une case qui se remplit, ou un choix qui change, s'écrit de
   gauche à droite ; la frappe dans une case déjà remplie ne rejoue rien.
   Le témoin passe à « Ready » quand nom, téléphone et email sont là, et le
   bâton se lève. À l'envoi (`inquiry:sent`, émis par inquiry.js), le bâton
   claque, la feuille de service s'écrit ligne à ligne et reçoit son tampon.
   Rien ici ne valide ni n'envoie : c'est inquiry.js. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/* Le champ → la case de la claquette. */
const SLOT_OF = { type: 'prod', genre: 'prod', stage: 'stage', level: 'level', category: 'category', name: 'name', company: 'name', timeline: 'timeline', logline: 'logline' };

function slate() {
  const form = document.querySelector('form[data-inquiry="film"]');
  const sl = document.querySelector('[data-slate]');
  if (!form || !sl) return;
  const arm = sl.querySelector('[data-arm]');
  const board = sl.querySelector('[data-board]');
  const flash = sl.querySelector('[data-flash]');
  const lamp = sl.querySelector('[data-lamp]');
  const gauge = [...sl.querySelectorAll('[data-gauge] i')];
  const slots = Object.fromEntries([...sl.querySelectorAll('[data-slot]')].map((el) => [el.dataset.slot, el]));
  const sheet = form.parentElement.querySelector('[data-inquiry-done]');

  /* La date du jour, à l'heure d'Addis. */
  try {
    const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Addis_Ababa', day: '2-digit', month: '2-digit', year: 'numeric' })
      .format(new Date()).replace(/\//g, '.');
    sl.querySelectorAll('[data-slate-date]').forEach((el) => { el.textContent = day; });
    sheet?.querySelectorAll('[data-sheet-date]').forEach((el) => { el.textContent = day; });
  } catch { /* la date reste un tiret */ }

  const field = (n) => form.elements.namedItem(n);
  const txt = (n) => String(field(n)?.value || '').trim().replace(/\s+/g, ' ');
  const opt = (n) => { const s = field(n); return s?.value ? s.selectedOptions[0]?.textContent.trim() || '' : ''; };
  const pick = (n) => {
    const i = form.querySelector(`[name="${n}"]:checked`);
    return i ? i.dataset.text || i.closest('label')?.textContent.trim() || '' : '';
  };
  const read = () => ({
    prod: [opt('type'), txt('genre')].filter(Boolean).join(' · '),
    stage: opt('stage'),
    level: pick('level'),
    category: pick('category'),
    name: [txt('name'), txt('company')].filter(Boolean).join(' · '),
    timeline: txt('timeline'),
    logline: txt('logline')
  });

  /* L'écriture à la craie : la valeur se découvre de gauche à droite, la
     case s'éclaire un instant. */
  const write = (el, delay = 0) => {
    if (STILL) return;
    const cell = el.closest('.fi-cell');
    gsap.fromTo(el, { clipPath: 'inset(-20% 100% -20% 0)' }, { clipPath: 'inset(-20% 0% -20% 0)', duration: 0.6, delay, ease: 'power2.out', clearProps: 'clipPath' });
    if (cell) gsap.fromTo(cell, { '--hit': 1 }, { '--hit': 0, duration: 1.3, delay, ease: 'power2.out' });
  };

  let last = {};
  let ready = false;
  let sent = false;
  const paint = ({ from = null, animate = true } = {}) => {
    const now = read();
    const chose = from && (from.tagName === 'SELECT' || from.type === 'radio') ? SLOT_OF[from.name] : null;
    for (const [k, el] of Object.entries(slots)) {
      const v = now[k] || '';
      const was = last[k] || '';
      if (v === was && el.dataset.on) continue;
      el.dataset.on = '1';
      el.textContent = v || el.dataset.empty || '—';
      el.closest('.fi-cell')?.classList.toggle('is-set', Boolean(v));
      if (animate && v && (!was || chose === k || from === 'link')) write(el);
    }
    /* La jauge : les étapes jusqu'à celle choisie (l'option 0 est la question). */
    const at = field('stage')?.selectedIndex || 0;
    gauge.forEach((g, i) => { g.classList.toggle('is-on', i < at); g.classList.toggle('is-at', i === at - 1); });
    /* Le témoin. */
    const r = Boolean(txt('name') && txt('phone') && EMAIL.test(txt('email')));
    if (r !== ready && !sent) {
      ready = r;
      sl.classList.toggle('is-ready', r);
      if (lamp) lamp.textContent = r ? 'Ready' : 'Standby';
    }
    last = now;
  };

  paint({ animate: false });
  form.addEventListener('input', (e) => paint({ from: e.target }));
  form.addEventListener('change', (e) => paint({ from: e.target }));
  /* Une carte de la page (« Discuss this role », « Write to us ») coche un
     choix sans événement : on relit le formulaire juste après inquiry.js. */
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('a[href*="?"]')) return;
    requestAnimationFrame(() => paint({ from: 'link' }));
  });

  /* L'entrée : la claquette arrive fermée, et s'ouvre une fois en vue ; les
     cases déjà remplies (une demande orientée depuis une autre page)
     s'écrivent l'une après l'autre. */
  if (!STILL) {
    sl.classList.add('is-shut');
    gsap.set(board, { autoAlpha: 0, y: 26 });
    ScrollTrigger.create({
      trigger: sl, start: 'top 82%', once: true,
      onEnter: () => {
        gsap.to(board, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
        gsap.delayedCall(0.45, () => {
          sl.classList.remove('is-shut');
          Object.values(slots).filter((el) => el.closest('.fi-cell')?.classList.contains('is-set'))
            .forEach((el, i) => write(el, 0.25 + i * 0.12));
        });
      }
    });
  }

  /* Le clap. */
  window.addEventListener('inquiry:sent', (e) => {
    if (e.detail?.division && e.detail.division !== 'film') return;
    sent = true;
    sl.classList.add('is-sent');
    const single = matchMedia('(max-width: 60rem)').matches;
    // inquiry.js centre la feuille, plus haute que l'écran : on remonte au
    // haut du plateau, la claquette et l'en-tête de la feuille en vue (sur
    // téléphone, la claquette au-dessus, la feuille juste dessous).
    const grid = sl.closest('.fi-ask__grid') || sl;
    const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) * 16 || 76;
    const y = grid.getBoundingClientRect().top + window.scrollY - bar - 12;
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.7, force: true });
    else window.scrollTo({ top: y, behavior: STILL ? 'auto' : 'smooth' });
    // Le focus sur le titre de la feuille, une fois son fondu commencé
    // (inquiry.js la cache le temps d'une image : cachée, elle refuse le focus).
    window.setTimeout(() => sheet?.querySelector('h3')?.focus({ preventScroll: true }), 120);
    const stamp = sheet?.querySelector('.fi-sheet__stamp');
    if (STILL) { sl.classList.add('is-clapped'); return; }

    gsap.killTweensOf(arm);
    arm.style.transition = 'none';   // GSAP prend la main : pas de transition CSS par-dessus
    gsap.timeline({ delay: single ? 0.5 : 0.08 })
      .to(arm, { rotation: -20, duration: 0.28, ease: 'power2.out' })
      .to(arm, { rotation: 0, duration: 0.12, ease: 'power4.in' })
      .add(() => sl.classList.add('is-clapped'))
      .fromTo(board, { y: 0 }, { y: 4, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.inOut' })
      .fromTo(flash, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, '<');
    const rows = sheet ? [...sheet.querySelectorAll('dt, dd')] : [];
    if (rows.length) gsap.from(rows, { autoAlpha: 0, x: -10, duration: 0.5, stagger: 0.035, delay: 0.35, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
    if (stamp) gsap.fromTo(stamp, { autoAlpha: 0, scale: 1.7, rotation: -28 }, { autoAlpha: 1, scale: 1, rotation: -10, duration: 0.55, delay: 0.75, ease: 'back.out(2.2)' });
  });
}

/* ═══════════════════ LE DÉMARRAGE ═══════════════════
   Les films d'abord (la visionneuse doit les trouver), puis l'ouverture (elle
   pose ses états de départ avant que la page ne soit déclarée prête). */
renderFilms();
projection();
softGrain();
bootDivision({ hero: false });
initCredits();
initRail();
initLobby(films);
initSeats();
initStrip();
initLeader();
slate();
