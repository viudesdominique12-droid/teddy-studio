import Lenis from 'lenis';
import gsap from 'gsap';
import { applyPalette } from './palette.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initSky } from './sky.js';
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

  /* Exposée pour le débogage : elle permet de piloter le scroll depuis la
     console sans que la boucle de Lenis reprenne aussitôt la main. */
  window.__lenis = lenis;
  return lenis;
}

/* ───────────────────────── Le seuil ───────────────────────── */

/**
 * Pas une porte : une donnée qui se résout. L'horloge trouve l'heure d'Addis,
 * et le site est là. 900 ms plafond, sauté dès la deuxième visite —
 * un producteur pressé ne doit jamais attendre un site.
 */
/* ───────────────────────── LE PRÉCHARGEMENT ─────────────────────────
   L'ancien écran attendait 900 ms puis s'effaçait. Il ne préchargeait rien —
   c'était un rideau, pas un chargement, et il n'empêchait donc aucun à-coup.

   Ce qui saccade un défilement sur téléphone, ce n'est presque jamais le
   JavaScript (mesuré ici : zéro tâche longue). C'est le DÉCODAGE : une image
   webp de 1600 px entre dans le champ, le navigateur doit la décompresser, et
   cette milliseconde-là tombe au milieu d'une image d'animation.

   On décode donc tout ce qui sera AFFICHÉ, avant d'ouvrir la page. `decode()`
   fait exactement ça, hors du fil principal, et rend la main quand la trame
   est prête à être peinte.

   Deux garde-fous : on ne précharge QUE ce qui est réellement rendu (pas les
   versions pleine taille de la visionneuse, qui pèsent des mégaoctets et ne
   servent qu'au clic), et un plafond de temps — sur une connexion lente, mieux
   vaut une page qui s'ouvre qu'un rideau qui ne se lève jamais. */

const BOOT_CAP_MS = 7000;

/** Les sources du PREMIER ÉCRAN — et elles seules.
 *
 *  Première version : toutes les images du document. Sur une page de 27 000 px
 *  ça ramassait 38 fichiers et décodait 2 856 ko AVANT de lever le rideau —
 *  en annulant au passage le `loading="lazy"` de chacune, puisque `new Image()`
 *  les demande toutes immédiatement. Le rideau tenait donc la page fermée le
 *  temps de charger des photos situées vingt écrans plus bas, et le plafond de
 *  7 s se déclenchait avant la fin.
 *
 *  Un préchargement ne sert à rien s'il précharge ce qu'on ne verra pas. On ne
 *  garde que ce qui est réellement au-dessus de la ligne de flottaison, plus
 *  le logo. Le reste retrouve son chargement différé, qui est fait pour ça. */
function bootAssets() {
  const out = new Set();
  const vh = window.innerHeight || 800;
  const add = (src) => { if (src && !src.startsWith('data:')) out.add(src); };

  for (const img of document.images) {
    const r = img.getBoundingClientRect();
    // Au-dessus de la ligne de flottaison, avec une marge d'un demi-écran.
    if (r.top < vh * 1.5 && r.bottom > -vh * 0.5) add(img.currentSrc || img.src);
  }
  // Le logo porte la marque : il ne doit jamais apparaître en retard.
  const logo = document.querySelector('img.logo__w');
  if (logo) add(logo.currentSrc || logo.src);
  return [...out];
}

function decodeOne(src) {
  return new Promise((done) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    // `decode()` échoue sur certains formats/navigateurs : on ne bloque jamais.
    const fin = () => done();
    if (img.decode) img.decode().then(fin, fin);
    else { img.onload = fin; img.onerror = fin; }
  });
}

function boot() {
  const el = document.getElementById('boot');
  if (!el) return Promise.resolve();

  let seen = false;
  try { seen = sessionStorage.getItem('teddy-seen') === '1'; } catch { /* ignore */ }

  // Déjà vu dans cette session : les images sont en cache, le décodage sera
  // instantané. Et en mouvement réduit, on n'impose pas d'attente du tout.
  if (seen || reduced()) {
    el.remove();
    document.documentElement.classList.add('is-ready');
    return Promise.resolve();
  }

  document.documentElement.classList.add('is-booting');

  const barre = el.querySelector('[data-boot-bar]');
  const pct = el.querySelector('[data-boot-pct]');
  const setProgress = (k) => {
    if (barre) barre.style.scale = k.toFixed(3) + ' 1';
    if (pct) pct.textContent = String(Math.round(k * 100)).padStart(3, '0');
  };
  setProgress(0);

  return new Promise((resolve) => {
    let fini = false;
    const done = () => {
      if (fini) return;
      fini = true;
      try { sessionStorage.setItem('teddy-seen', '1'); } catch { /* ignore */ }
      setProgress(1);
      gsap.to(el, {
        autoAlpha: 0, duration: 0.44, ease: EASE.settle, delay: 0.12,
        onComplete: () => {
          el.remove();
          document.documentElement.classList.remove('is-booting');
          document.documentElement.classList.add('is-ready');
          resolve();
        }
      });
    };

    const cap = window.setTimeout(done, BOOT_CAP_MS);

    const run = async () => {
      const srcs = bootAssets();
      const total = srcs.length + 1;          // +1 pour les fontes
      let faits = 0;
      const bump = () => { faits++; setProgress(Math.min(1, faits / total)); };

      const fontes = (document.fonts?.ready || Promise.resolve()).then(bump, bump);
      await Promise.all([fontes, ...srcs.map((s) => decodeOne(s).then(bump))]);

      clearTimeout(cap);
      done();
    };

    // On attend que le DOM soit complet pour connaître la vraie liste d'images.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else run();
  });
}

/* ───────────────────────── LE CLAP ─────────────────────────
   Un clap ne décore pas : il OUVRE le plan. C'est le seul geste du site qui
   dise « on tourne », et il tombe au moment où le hero finit de se poser.

   La physique tient en trois temps, et c'est le troisième qui fait tout :
   le bras se lève lentement (on arme), il retombe VITE (`power4.in` — une
   entrée en accélération, la seule légitime du site : on ne pose pas un clap,
   on le laisse tomber), puis il REBONDIT d'un degré. Sans ce rebond, le bois
   ne sonne pas — c'est le follow-through de Disney appliqué à deux planches.

   Une seule fois par session : un clap qui claque à chaque visite devient un
   tic. Et jamais en mouvement réduit. */
function clap() {
  const slate = document.querySelector('[data-slate]');
  if (!slate || reduced()) return;
  const arm = slate.querySelector('.slate__arm');
  if (!arm) return;

  let vu = false;
  try { vu = sessionStorage.getItem('teddy-clap') === '1'; } catch { /* ignore */ }
  if (vu) return;
  try { sessionStorage.setItem('teddy-clap', '1'); } catch { /* ignore */ }

  /* `svgOrigin` et non `transformOrigin` : sur un <g> SVG, le `transform-origin`
     CSS se résout dans un repère que GSAP réécrit ensuite — mesuré, il retombe
     à `0 0`, donc le bras pivotait autour du coin du dessin au lieu de sa
     charnière. `svgOrigin` prend les coordonnées du VIEWBOX, qui sont celles
     dans lesquelles le clap a été dessiné. */
  gsap.timeline({ delay: 0.55 })
    .set(arm, { rotate: 0, svgOrigin: '14 52' })
    .to(arm, { rotate: -26, duration: 0.62, ease: 'power2.out' })      // on arme
    .to(arm, { rotate: 0, duration: 0.16, ease: 'power4.in' })         // ça tombe
    .to(arm, { rotate: -2.2, duration: 0.09, ease: 'power2.out' })     // le bois sonne
    .to(arm, { rotate: 0, duration: 0.22, ease: 'power2.inOut' });
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

  /* Le hero n'attend plus que les FONTES. Il attendait aussi l'emblème 3D —
     jusqu'à 4 s de sursis pendant lesquels Three.js se chargeait et compilait
     ses shaders. L'emblème est parti avec le canon : c'est le logo réel du
     client qui porte la marque, et lui est une image. */
  const fonts = document.fonts?.ready || Promise.resolve();

  Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(() => {
    gsap.to(items, {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 0.9, stagger: 0.12, ease: 'power3.out',
      onComplete: () => { gsap.set(items, { clearProps: 'filter,willChange' }); clap(); }
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

/* Le filet : même si `start()` lève, la porte se rouvre. */
window.addEventListener('error', () => document.documentElement.classList.remove('hero-gate'));
setTimeout(() => document.documentElement.classList.remove('hero-gate'), 8000);

async function start() {
  applyPalette();
  /* `hero-gate` cache le hero pour que l'intro puisse le révéler. Il était
     écrit EN DUR dans `index.html`, et seul le JS le retirait : si le script
     échouait — réseau, extension, une exception dans l'un des douze appels
     ci-dessous — le titre, le chapô et l'appel à l'action restaient invisibles
     POUR TOUJOURS. Une animation ne doit jamais conditionner l'existence du
     contenu. On le pose donc ici : sans JS, il n'est jamais posé. */
  document.documentElement.classList.add('hero-gate');
  initWipe();
  initSky();
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
