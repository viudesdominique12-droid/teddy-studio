import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initSky } from './sky.js';
import { initEmblem } from './emblem.js';
import { initGallery } from './gallery.js';
import { initPhone } from './phone.js';
import { initWipe } from './wipe.js';
import { initTimeline } from './timeline.js';
import { initLit } from './lit.js';
import { initMomentum } from './momentum.js';
import { initViewer } from './viewer.js';
import { startClocks } from './clock.js';
import { fitHeadline } from './fit.js';
import { initSheet, sheetLines } from './sheet.js';
import { actTable, actCards, actDrop, actCases, actCredits, paintSun } from './acts.js';
import { cursor, indexPanel, bar, reduced, EASE } from './motion.js';
import { initReveals, initMagnets, markReveals, markMagnets } from './reveal.js';

/* ───────────────────────── Scroll ───────────────────────── */

/* Sur téléphone, la barre d'adresse fait osciller la hauteur du viewport à
   chaque geste. Sans ça, chaque pixel gagné relance un refresh complet et
   toutes les sections épinglées sautent pendant qu'on scrolle. */
ScrollTrigger.config({ ignoreMobileResize: true });

// En dev seulement : une poignée pour inspecter le scroll depuis la console.
if (import.meta.env.DEV) { window.__gsap = gsap; window.__ST = ScrollTrigger; }


function smoothScroll() {
  if (reduced()) return null;
  /* `duration` + `easing` imposent à CHAQUE impulsion de molette un tween de
     1,05 s : le scroll cesse de suivre la main, il rejoue une courbe. `lerp`
     — le défaut de Lenis, et ce qu'emploie la référence — poursuit la cible en
     continu, donc reste accroché au geste. `syncTouch` reste à faux (défaut) :
     sur un téléphone le défilement tactile doit rester NATIF, avec l'inertie
     du système. C'est la première raison pour laquelle un site ne « sent »
     pas le bureau rétréci. */
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, touchMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  window.addEventListener('index:open', () => lenis.stop());
  window.addEventListener('index:close', () => lenis.start());

  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || url.origin !== location.origin || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -70, duration: 1.1 });
    history.pushState(null, '', url.hash);
  });

  if (import.meta.env.DEV) window.__lenis = lenis;
  return lenis;
}

/* ───────────────────────── Le seuil ───────────────────────── */

/**
 * Pas une porte : une donnée qui se résout. L'horloge trouve l'heure d'Addis,
 * et le site est là. 900 ms plafond, sauté dès la deuxième visite —
 * un producteur pressé ne doit jamais attendre un site.
 */
function boot() {
  const el = document.getElementById('boot');
  if (!el) return Promise.resolve();

  let seen = false;
  try { seen = sessionStorage.getItem('teddy-seen') === '1'; } catch { /* ignore */ }

  if (seen || reduced()) {
    el.remove();
    document.documentElement.classList.add('is-ready');
    return Promise.resolve();
  }

  document.documentElement.classList.add('is-booting');

  return new Promise((resolve) => {
    const done = () => {
      try { sessionStorage.setItem('teddy-seen', '1'); } catch { /* ignore */ }
      gsap.to(el, {
        autoAlpha: 0, duration: 0.38, ease: EASE.settle,
        onComplete: () => {
          el.remove();
          document.documentElement.classList.remove('is-booting');
          document.documentElement.classList.add('is-ready');
          resolve();
        }
      });
    };
    const cap = window.setTimeout(done, 900);
    const ready = () => { clearTimeout(cap); window.setTimeout(done, 160); };
    if (document.readyState === 'complete') ready();
    else window.addEventListener('load', ready, { once: true });
  });
}

/* ───────────────────────── L'ouverture ───────────────────────── */

function openVideo() {
  const v = document.getElementById('open-video');
  if (!v) return;

  const mq = window.matchMedia('(max-width: 48rem)');
  const setPoster = () => {
    v.poster = mq.matches ? '/media/sebastopol-poster-mobile.jpg' : '/media/sebastopol-poster.jpg';
  };
  setPoster();
  mq.addEventListener('change', setPoster);

  // Sur téléphone, le poster suffit tant que le visiteur n'a rien demandé :
  // on ne dépense pas sa data pour une ambiance.
  if (mq.matches || reduced()) return;

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
      v.play().catch(() => {});
    } else v.pause();
  }, { threshold: 0.15 }).observe(v);
}

/**
 * L'entrée du hero. Les états de départ sont posés AVANT de retirer le gate CSS,
 * sinon le texte apparaît un frame puis disparaît. Le départ attend deux choses,
 * chacune avec son plafond : l'emblème posé, et les fontes chargées.
 */
function heroIntro() {
  const items = [...document.querySelectorAll('[data-hero]')];
  const root = document.documentElement;
  if (!items.length) { root.classList.remove('hero-gate'); return; }

  if (reduced()) { root.classList.remove('hero-gate'); return; }

  gsap.set(items, { opacity: 0, y: '2.5rem', filter: 'blur(12px)', willChange: 'filter,transform' });
  root.classList.remove('hero-gate');

  const emblem = window.__teddyEmblem
    ? Promise.resolve()
    : new Promise((r) => window.addEventListener('teddy:emblem-ready', r, { once: true }));
  const cap = new Promise((r) => setTimeout(r, 4000));
  const fonts = document.fonts?.ready || Promise.resolve();

  Promise.all([
    Promise.race([emblem, cap]),
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))])
  ]).then(() => {
    gsap.to(items, {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 0.9, stagger: 0.12, ease: 'power3.out',
      onComplete: () => gsap.set(items, { clearProps: 'filter,willChange' })
    });
  });
}

/* ───────────────────────── Le formulaire ───────────────────────── */

function contactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const note = document.getElementById('form-note');

  const setErr = (field, msg) => {
    const p = field.closest('.field');
    p?.classList.toggle('is-err', Boolean(msg));
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    let e = p?.querySelector('.field__err');
    if (msg) {
      if (!e) { e = document.createElement('span'); e.className = 'field__err'; p.appendChild(e); }
      e.textContent = msg;
    } else e?.remove();
  };

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    let bad = null;

    for (const f of form.querySelectorAll('input,textarea')) {
      const v = String(data.get(f.name) || '').trim();
      if (f.required && !v) { setErr(f, 'Required'); bad = bad || f; }
      else if (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
        setErr(f, 'Check this address'); bad = bad || f;
      } else setErr(f, null);
    }
    if (bad) { bad.focus(); note.textContent = 'Some fields still need you.'; return; }

    // La feuille collectée pendant la visite part avec le message.
    const collected = sheetLines();
    const subject = `Production enquiry — ${data.get('first_name')} ${data.get('last_name')}`;
    const body = [
      `Name: ${data.get('first_name')} ${data.get('last_name')}`,
      `Email: ${data.get('email')}`,
      `Phone: ${data.get('phone') || '—'}`,
      '',
      String(data.get('message') || ''),
      collected.length ? `\n— Collected while browsing —\n${collected.join('\n')}` : ''
    ].join('\n');

    note.textContent = 'Opening your mail app so the message reaches us directly.';
    window.location.href =
      `mailto:info@ethiopianfilmoffice.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

/* ───────────────────────── Démarrage ───────────────────────── */

async function start() {
  initWipe();
  initSky();
  initEmblem();
  startClocks();
  paintSun();
  cursor();
  indexPanel();
bar();
  initSheet();
  contactForm();
  openVideo();
  fitHeadline();

  await boot();

  heroIntro();
  initLit();
  actTable();
  actCards();
  actDrop();
  actCases();
  actCredits();
  initPhone();
  initGallery();

  // Un seul langage de révélation sur tout le site : le blur-in. Les titres
  // sortent ligne à ligne, les blocs d'un seul tenant.
  markReveals('.table-act__h, .note__h, .drop__h, .cases__h, .cs__title, .credits__h, .wall__h', 'lines');
  // On révèle les CONTENEURS, jamais les enfants d'une liste : le survol qui
  // éteint les frères passe par `opacity`, et un tween qui laisse `opacity` en
  // style inline bat toute règle CSS. Deux systèmes sur la même propriété du
  // même élément, c'est un conflit garanti — ici ils ne se croisent jamais.
  markReveals('.wall__grid, .note__p, .note__facts, .note__sig, .drop__lede, .cases__lede, '
            + '.table-act__note, .board, .cases__stack, .cs__lines, .cs__form, .cs__foot');
  markMagnets('.btn--gold, .bar__cta, .cs__send', 26);
  markMagnets('.case__add', 14);
  initReveals();
  initMagnets();
  initMomentum();
  initViewer();

  ScrollTrigger.refresh();
  initTimeline();   // après le refresh : les pins ont leur hauteur réelle
}

smoothScroll();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
