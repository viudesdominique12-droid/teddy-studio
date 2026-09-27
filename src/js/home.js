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
import { startClocks } from './clock.js';
import { cursor, indexPanel, bar, reduced, breathe } from './motion.js';
import { initReveals, initMagnets, markReveals, markMagnets } from './reveal.js';
import { initWipe } from './wipe.js';
import { initViewer } from './viewer.js';
import { initGallery } from './gallery.js';
import { bootReel, cameraEntry } from './refonte.js';
import { kit3dAvailable, initKit3d } from './kit3d.js';
import { initReel } from './reel3d.js';
import { initServices, initWhy } from './services.js';
import { applyPalette } from './palette.js';

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
  if (!hero || reduced()) { ungate(); return Promise.resolve(); }

  const items = hero.querySelectorAll('[data-hx-in]');
  gsap.set(items, { autoAlpha: 0, y: 20 });
  ungate();
  // La promesse tient jusqu'à la fin de l'entrée : la page attend ce moment
  // pour préparer ses sections plus bas (`start`).
  return gsap.to(items, {
    autoAlpha: 1, y: 0, duration: 1, ease: 'power1.out', stagger: 0.1, delay: 0.1,
    clearProps: 'transform,opacity,visibility'
  }).then(() => {});
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

/* ───────────────────────── Le formulaire ─────────────────────────
   Pas de serveur : le message part par la messagerie du visiteur. */
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

    const subject = `Production enquiry — ${data.get('first_name')} ${data.get('last_name')}`;
    const body = [
      `Name: ${data.get('first_name')} ${data.get('last_name')}`,
      `Email: ${data.get('email')}`,
      `Phone: ${data.get('phone') || '—'}`,
      '',
      String(data.get('message') || '')
    ].join('\n');

    note.textContent = 'Opening your mail app so the message reaches us directly.';
    window.location.href =
      `mailto:info@ethiopianfilmoffice.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

/* ───────────────────────── Démarrage ───────────────────────── */

async function start() {
  applyPalette();
  root.classList.add('hm-gate');
  initWipe();
  startClocks();
  cursor();
  indexPanel();
  bar();
  initViewer();
  contactForm();
  initServices();
  initWhy();
  // Le modèle 3D du matériel est-il là ? On le demande pendant l'ouverture.
  const kit3d = kit3dAvailable();
  const page = preparer(kit3d);

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
function preparer(kit3d) {
  const steps = [
    // Les épinglages sont créés dans l'ordre de la page : le matériel (juste
    // après les services), puis la caméra devant la galerie, puis tout le reste.
    () => { if (kit3d) initKit3d(); },
    () => initReel(),
    () => initGallery(),
    () => cameraEntry(document.querySelector('.hm-band')),
    // Les titres sortent ligne à ligne, les blocs d'un seul tenant : le geste
    // des pages intérieures. Les listes et les grilles, en cascade.
    () => {
      markReveals('.hm-h, .hm-about__stmt', 'lines');
      markReveals('.hm-sec .hm-k, .hm-split__head .hm-lede, .hm-head__side, '
                + '.hm-about__fig, .hm-about__p, .hm-facts, .hm-note, .hm-form');
      initReveals();
    },
    () => {
      cascade('.sv__i', { step: 0.05 });
      cascade('.hm-kit');
      cascade('.hm-why__i', { step: 0.1 });
      cascade('.hm-loc');
      cascade('.hm-film');
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
  const next = () => steps[i++]();
  return {
    get started() { return chain !== null || i > 0; },
    start: () => (chain ||= (async () => {
      while (i < steps.length) {
        await breathe();
        if (i < steps.length) next();
      }
    })()),
    rush: () => { while (i < steps.length) next(); }
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
