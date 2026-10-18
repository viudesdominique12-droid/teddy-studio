/**
 * L'ACCUEIL, VERSION SOBRE — le démarrage (26/09/2026).
 *
 * La même coquille que les pages intérieures (`page.js`) : l'horloge, le
 * curseur, l'index, la barre, la visionneuse, le volet, le blur-in. En plus,
 * trois choses propres à l'accueil : l'ouverture en plan technique (une fois
 * par session), l'entrée du premier écran, et la galerie qu'on attrape —
 * annoncée par la caméra dans laquelle on plonge.
 *
 * L'ancien démarrage (`main.js` : vidéo, moniteur, bandeau, planches,
 * anneau, caméra, échelle, fiche) n'est plus chargé par aucune page. Il reste
 * dans `src/js/` : remettre l'ancienne page (copie dans
 * `docs/archive/accueil-avant-2026-09-26/`) suffit à revenir en arrière.
 *
 * Règle inchangée : aucune animation ne conditionne l'existence du contenu.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './scroll.js';
import { startClocks, addisTime } from './clock.js';
import { cursor, indexPanel, bar, reduced, breathe } from './motion.js';
import { initReveals, initMagnets, markReveals, markMagnets } from './reveal.js';
import { initWipe } from './wipe.js';
import { initViewer } from './viewer.js';
import { initGallery } from './gallery.js';
import { bootReel, cameraEntry } from './refonte.js';
import { initServices, initWhy } from './services.js';
import { applyPalette } from './palette.js';
import { splitWords } from './split-words.js';
import { pauseOffscreen } from './offscreen.js';
import { initInquiries } from './inquiry.js';
import { initLines } from './home-lines.js';
import { initLobby } from './home-lobby.js';
import { initIris } from './home-iris.js';
import { initScout } from './home-scout.js';
import { initFrame } from './home-frame.js';

gsap.registerPlugin(ScrollTrigger);

/* Sur téléphone, la barre d'adresse fait osciller la hauteur du viewport à
   chaque geste : sans ça, chaque pixel relance un refresh complet. */
ScrollTrigger.config({ ignoreMobileResize: true });

if (import.meta.env.DEV) { window.__gsap = gsap; window.__ST = ScrollTrigger; }

const root = document.documentElement;
const ungate = () => root.classList.remove('hm-gate');

/* Le filet : quoi qu'il arrive au script, le premier écran finit par se montrer. */
window.addEventListener('error', ungate);
setTimeout(ungate, 8000);

/* L'index ouvert fige le défilement ; `scroll.js` n'écoute que l'ancien nom. */
window.addEventListener('index:open', () => window.__lenis?.stop());
window.addEventListener('index:close', () => window.__lenis?.start());

/* ───────────────────────── Le premier écran ─────────────────────────
   Le geste de la référence (21st.dev) : chaque bloc monte de 20 px en
   apparaissant, en une seconde, un dixième de seconde après le précédent —
   le badge, le titre, la phrase, les appels, puis les clients. Les états de
   départ sont écrits AVANT de lever le gate. */
function heroIn() {
  const hero = document.querySelector('.hx');
  if (!hero || reduced()) { root.classList.add('hx-in'); ungate(); rollBadge(hero); return Promise.resolve(); }

  // Le titre du brief, mot à mot : chaque mot monte de son masque (le geste
  // des pages de division), puis le badge, la phrase, les appels, les clients.
  const words = splitWords(hero.querySelector('.hx__h'));
  const items = hero.querySelectorAll('[data-hx-in]');
  gsap.set(words, { yPercent: 115 });
  gsap.set(items, { autoAlpha: 0, y: 20 });
  root.classList.add('hx-in');
  ungate();
  rollBadge(hero);
  // La promesse tient jusqu'à la fin de l'entrée : la page attend ce moment
  // pour préparer ses sections plus bas (`start`).
  return gsap.timeline({ delay: 0.1 })
    .to(words, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.055 }, 0.05)
    .to(items, {
      autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.1,
      clearProps: 'transform,opacity,visibility'
    }, 0)
    .then(() => {});
}

/* Les sept divisions passent dans le badge, une à une, tant que le premier
   écran est à l'écran. */
function rollBadge(hero) {
  const roll = hero?.querySelector('[data-roll]');
  if (!roll) return;
  const words = [...roll.children];
  if (reduced() || words.length < 2) return;
  let i = 0;
  let on = true;
  const step = () => {
    if (!on || document.hidden) return;
    const cur = words[i];
    i = (i + 1) % words.length;
    gsap.to(cur, { yPercent: -110, duration: 0.6, ease: 'power3.inOut' });
    gsap.fromTo(words[i], { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'power3.inOut' });
  };
  gsap.set(words.slice(1), { yPercent: 110, opacity: 1 });
  setInterval(step, 2400);
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(hero);
}

/* ───────────────────────── Les sept divisions ─────────────────────────
   Chaque vignette ne s'anime que visible (`.is-vis`). La régie : le
   minutage court à l'heure d'Addis, et au survol (souris) le programme
   passe en vidéo. */
function initDivisionGrid() {
  const grid = document.querySelector('[data-dvg]');
  if (!grid) return;
  const cards = [...grid.children];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-vis', e.isIntersecting));
  }, { rootMargin: '10% 0px' });
  cards.forEach((c) => io.observe(c));

  const live = cards[0];
  const tc = live?.querySelector('[data-dvg-tc]');
  if (tc) {
    // 25 images par seconde, à l'horloge et non à la cadence de l'écran (qui
    // allait 4,8 fois trop vite à 120 Hz), et le texte n'est réécrit que
    // quand il change.
    let last = -1;
    gsap.ticker.add((time) => {
      if (!live.classList.contains('is-vis')) return;
      const f = Math.floor(time * 25) % 25;
      if (f === last) return;
      last = f;
      tc.textContent = `${addisTime(true)}:${String(f).padStart(2, '0')}`;
    });
  }
  const video = live?.querySelector('video[data-src]');
  if (video && !LITE && !reduced() && !navigator.connection?.saveData) {
    const a = live.querySelector('a');
    a.addEventListener('pointerenter', () => {
      if (!video.src) video.src = video.dataset.src;
      video.play().then(() => video.classList.add('is-on')).catch(() => {});
    });
    a.addEventListener('pointerleave', () => { video.classList.remove('is-on'); video.pause(); });
  }
}

/* ───────────────────────── L'appel final ─────────────────────────
   « Have a Project in Mind? » monte mot à mot à son arrivée ; la lueur suit
   le pointeur. */
function finalCall() {
  const sec = document.querySelector('.hm-cta');
  if (!sec) return;
  if (!LITE) {
    sec.addEventListener('pointermove', (e) => {
      const r = sec.getBoundingClientRect();
      sec.style.setProperty('--mx', `${e.clientX - r.left}px`);
      sec.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
  if (reduced()) return;
  const words = splitWords(sec.querySelector('[data-cta-h]'));
  gsap.set(words, { yPercent: 115 });
  ScrollTrigger.create({
    trigger: sec, start: 'top 72%', once: true,
    onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07 })
  });
}

/* ───────────────────────── Les cascades ─────────────────────────
   Les éléments d'une liste ou d'une grille entrent l'un après l'autre, avec
   le geste des pages intérieures : ils sortent du flou en montant de 16 px.
   Un IntersectionObserver plutôt qu'un ScrollTrigger : ce qui est déjà à
   l'écran au chargement est pris dans le premier appel, sans rattrapage. */
const inDocOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

// Sur un écran tactile, les cascades montent sans flou (voir `reveal.js`).
const LITE = matchMedia('(pointer: coarse)').matches;

function cascade(sel, { blur = !LITE, step = 0.08 } = {}) {
  const els = gsap.utils.toArray(sel);
  if (!els.length || reduced()) return;
  const from = blur ? { autoAlpha: 0, y: 16, filter: 'blur(0.34em)' } : { autoAlpha: 0, y: 24 };
  gsap.set(els, from);

  const io = new IntersectionObserver((entries) => {
    const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target).sort(inDocOrder);
    if (!batch.length) return;
    batch.forEach((el) => io.unobserve(el));
    gsap.timeline({ onComplete: () => gsap.set(batch, { clearProps: 'filter,opacity,visibility,transform' }) })
      .to(batch, { y: 0, filter: blur ? 'blur(0em)' : 'none', duration: 0.8, ease: 'power3.out', stagger: step }, 0)
      .to(batch, { autoAlpha: 1, duration: 0.45, ease: 'power1.out', stagger: step }, 0);
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
}

/* ───────────────────────── Démarrage ───────────────────────── */

async function start() {
  applyPalette();
  root.classList.add('hm-gate');
  // Les boucles CSS des sections hors de l'écran se mettent en pause (le
  // bandeau des clients, les vignettes, les points qui respirent).
  pauseOffscreen();
  initWipe();
  startClocks();
  cursor();
  indexPanel();
  bar();
  initViewer();
  initInquiries();
  initServices();
  initWhy();
  initDivisionGrid();
  /* Les deux scènes 3D (le matériel, la bobine des lieux) ne sont plus dans
     le script de départ : leurs modules se demandent ici, tout de suite, et
     arrivent pendant l'ouverture. La préparation de la page les attend avant
     sa première étape — l'ordre des épinglages ne change pas. */
  const sets = Promise.all([import('./kit3d.js'), import('./reel3d.js')]);
  // La séquence du matériel n'a lieu qu'avec du mouvement (`kit3dAvailable`).
  const kit3d = Boolean(document.querySelector('[data-kit3d]')) && !reduced();
  const page = preparer(kit3d, sets);

  /* Le reste de la page se prépare une seule fois, quand ça ne se voit pas :
     pendant que l'ouverture attend le clic (la page est cachée derrière). */
  await bootReel({ idle: page.start });

  const entrance = heroIn();
  markMagnets('.bar__cta', 26);
  initMagnets();

  if (page.started) return;
  // La page s'ouvre déjà défilée, ou sur une ancre : tout doit être en place
  // sur-le-champ, comme avant.
  if (window.scrollY > 0 || location.hash) { page.rush(); return; }
  /* Tout en haut : après le volet et l'entrée du premier écran (1,5 s), qui
     gardent ainsi toutes leurs images — ou dès que le visiteur agit. Faire
     défiler lance la préparation par tranches ; un clic ou une touche la
     termine d'un coup, avant que le clic ne soit traité : une ancre plus bas
     (Contact, Locations) doit viser la bonne hauteur, épinglages compris. */
  const soft = ['wheel', 'touchstart', 'scroll'];
  const hard = ['pointerdown', 'keydown'];
  const go = () => {
    soft.forEach((t) => window.removeEventListener(t, go, true));
    page.start();
  };
  const now = () => {
    hard.forEach((t) => window.removeEventListener(t, now, true));
    go();
    page.rush();
  };
  soft.forEach((t) => window.addEventListener(t, go, { capture: true, passive: true }));
  hard.forEach((t) => window.addEventListener(t, now, { capture: true, passive: true }));
  entrance.then(go);
  setTimeout(go, 3000);   // le filet, si l'entrée était interrompue
}

/* Les sections plus bas, dans l'ordre de la page. Aucune n'est à l'écran à ce
   moment-là : le premier écran fait toute la hauteur de la fenêtre.
   - `start` : par tranches, UNE PAR IMAGE ; le navigateur dessine entre deux.
     D'un seul bloc, ce travail figeait l'écran 100 à 300 ms, en plein dans une
     animation (la fin de la plongée dans la caméra, le volet d'arrivée,
     l'entrée du premier écran).
   - `rush` : ce qui reste, d'un coup, quand tout doit être en place aussitôt. */
function preparer(kit3d, sets) {
  let mods = null;
  // Un module qui ne vient pas (réseau coupé) : sa section garde son repli,
  // la liste du matériel ou la grille des lieux, et le reste se prépare.
  const ready = sets.then(
    ([k, r]) => { mods = { initKit3d: k.initKit3d, initReel: r.initReel }; },
    (err) => { console.warn('[home]', err); mods = { initKit3d() {}, initReel() {} }; }
  );
  const steps = [
    // Les épinglages sont créés dans l'ordre de la page : le matériel (juste
    // après les services), puis la caméra devant la galerie, puis tout le reste.
    () => { if (kit3d) mods.initKit3d(); },
    () => mods.initReel(),
    () => initGallery(),
    () => cameraEntry(document.querySelector('.hm-band')),
    // Les titres sortent ligne à ligne, les blocs d'un seul tenant : le geste
    // des pages intérieures. Les listes et les grilles, en cascade.
    () => {
      markReveals('.hm-h, .hm-about__stmt', 'lines');
      markReveals('.hm-sec .hm-k, .hm-split__head .hm-lede, .hm-head__side, '
                + '.hm-about__fig, .hm-about__p, .hm-facts, .hm-note, '
                + '.hm-cta__p, .hm-cta__act, .hm-cta__reach');
      initReveals();
      finalCall();
    },
    () => {
      cascade('.dvg__i', { step: 0.07 });
      cascade('.sv__i', { step: 0.05 });
      cascade('.hm-kit');
      cascade('.hm-why__i', { step: 0.1 });
      cascade('.hm-loc');
      cascade('.hm-film');
    },
    // L'accueil qui vit (18/10) : les filets de section, le mur d'affiches,
    // le diaphragme, le repérage, le cadrage final. Aucun épinglage, aucune
    // hauteur qui change : les scènes épinglées restent à leur place.
    () => {
      const opts = { lite: LITE, still: reduced() };
      initLines();
      initLobby(opts);
      initIris(opts);
      initScout(opts);
      initFrame(opts);
    },
    () => {
      ScrollTrigger.refresh();
      // Le défilement doux garde la hauteur de la page en mémoire : les
      // épinglages viennent de l'allonger. Sans cette mesure, un clic sur une
      // ancre lancé dans la foulée (`rush`) s'arrêtait à l'ancienne limite.
      window.__lenis?.resize();
      watchHeight();
    }
  ];
  let i = 0;
  let chain = null;
  let rushing = false;
  const next = () => steps[i++]();
  // Tout ce qui reste, d'un coup — dès que les modules 3D sont là (ils
  // le sont presque toujours : demandés dès le départ, ils pèsent peu).
  const rush = () => {
    if (!mods) { if (!rushing) { rushing = true; ready.then(rush, () => {}); } return; }
    while (i < steps.length) next();
  };
  return {
    get started() { return chain !== null || i > 0; },
    start: () => (chain ||= (async () => {
      await ready;
      while (i < steps.length) {
        await breathe();
        if (i < steps.length) next();
      }
    })()),
    rush
  };
}

/* La page change de hauteur sans que la fenêtre bouge : un service qu'on
   déplie, une police qui arrive. Les scènes épinglées plus bas (le kit, la
   bobine, la caméra) doivent alors se re-mesurer, sinon elles s'épinglent
   trop tôt ou trop tard et sautent en se figeant. Une seule fois par
   changement, quand la hauteur ne bouge plus. */
function watchHeight() {
  if (!('ResizeObserver' in window)) return;
  const height = () => document.documentElement.scrollHeight;
  let last = height();
  let timer = 0;
  new ResizeObserver(() => {
    if (Math.abs(height() - last) < 2) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      ScrollTrigger.refresh();
      last = height();
    }, 200);
  }).observe(document.body);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
