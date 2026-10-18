/**
 * LES PAGES DE DIVISION — le démarrage commun (17/10/2026).
 *
 * La même coquille que les autres pages (barre, index, curseur, volet,
 * thème, révélations), plus le vocabulaire des divisions :
 *   heroIn()        l'ouverture : les mots du titre montent de leur masque
 *                   (la phrase, les appels et les repères montent en CSS,
 *                   division.css) ;
 *   spotlight()     la lumière de la division suit le curseur sur les cartes ;
 *   stepsLine()     le filet du processus se remplit au défilement et allume
 *                   chaque étape qu'il atteint ;
 *   drift()         les médias `[data-drift]` flottent à peine au défilement ;
 *   quickBar()      sur téléphone, Appeler / WhatsApp / Demander, une fois
 *                   l'ouverture passée ;
 *   mountPortfolio  le portfolio d'une division, tiré de src/data/portfolio.js ;
 *                   jamais de faux exemple : un état « en préparation » sinon.
 * Chaque page ajoute ensuite sa pièce signature (src/js/pages/<division>.js).
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './scroll.js';
import { startClocks } from './clock.js';
import { cursor, indexPanel, bar, reduced } from './motion.js';
import { initReveals, initMagnets, markReveals, markMagnets } from './reveal.js';
import { pauseOffscreen } from './offscreen.js';
import { initWipe } from './wipe.js';
import { initViewer } from './viewer.js';
import { applyPalette } from './palette.js';
import { initInquiries } from './inquiry.js';
import { initAccordion } from './services.js';
import { splitWords } from './split-words.js';
import { byCategory, STATUS, ROLES } from '../data/portfolio.js';

gsap.registerPlugin(ScrollTrigger);

export const LITE = matchMedia('(pointer: coarse)').matches;

/* ─────────────── L'ouverture ─────────────── */
// `splitWords` vit dans son module (l'accueil le prend là) ; il reste
// exporté d'ici pour les pages qui l'importent du socle (film.js).
export { splitWords };

/* Les mots du titre montent de leur masque. Le reste de l'ouverture
   (`[data-in]` : surtitre, phrase, appels, repères) monte en CSS, sans
   attendre le script (division.css, F08) : la timeline rendue ne porte plus
   que les mots — events.js s'y accroche pour allumer ses faisceaux. */
export function heroIn(hero = document.querySelector('.dv-hero')) {
  const root = document.documentElement;
  if (!hero) { root.classList.add('dv-in'); return null; }
  const h1 = hero.querySelector('.dv-h1');
  if (reduced()) { root.classList.add('dv-in'); return null; }
  const words = splitWords(h1);
  gsap.set(words, { yPercent: 115 });
  root.classList.add('dv-in');
  return gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(words, { yPercent: 0, duration: 1.35, stagger: 0.06 }, 0.15);
}

/* ─────────────── La lumière qui suit le curseur ─────────────── */
export function spotlight(sel = '.dv-card, .dv-level, [data-spot]') {
  if (LITE) return;
  document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ─────────────── Le processus ─────────────── */
export function stepsLine(root = document) {
  root.querySelectorAll('.dv-steps').forEach((list) => {
    const steps = [...list.querySelectorAll('.dv-step')];
    list.style.setProperty('--n', String(steps.length));
    const paint = (p) => {
      list.style.setProperty('--p', p.toFixed(3));
      steps.forEach((s, i) => s.classList.toggle('is-on', p >= (steps.length > 1 ? i / (steps.length - 1) : 0) - 0.02));
    };
    if (reduced()) { paint(1); return; }
    paint(0);
    ScrollTrigger.create({
      trigger: list, start: 'top 78%', end: 'bottom 52%', scrub: 0.6,
      onUpdate: (self) => paint(self.progress)
    });
  });
}

/* ─────────────── Les médias qui flottent ─────────────── */
export function drift(sel = '[data-drift]') {
  if (reduced()) return;
  gsap.utils.toArray(sel).forEach((el) => {
    const amt = Number(el.dataset.drift || 8);
    gsap.fromTo(el, { yPercent: -amt / 2 }, {
      yPercent: amt / 2, ease: 'none',
      scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

/* ─────────────── La barre d'appel sur téléphone ─────────────── */
export function quickBar(hero = document.querySelector('.dv-hero')) {
  const q = document.querySelector('.dv-quick');
  if (!q) return;
  const ask = document.getElementById('inquiry');
  // Une page sans formulaire (Services, Portfolio…) : « Inquire » mène au
  // formulaire général.
  if (!ask) q.querySelectorAll('a[href="#inquiry"]').forEach((a) => { a.href = '/contact.html#inquiry'; });
  let pastHero = !hero, atAsk = false;
  const paint = () => q.classList.toggle('is-on', pastHero && !atAsk);
  if (hero) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; paint(); }, { threshold: 0.15 }).observe(hero);
  if (ask) new IntersectionObserver(([e]) => { atAsk = e.isIntersecting; paint(); }, { threshold: 0.1 }).observe(ask);
  paint();
}

/* ─────────────── Le portfolio d'une division ─────────────── */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Brief §4 : distinguer le travail assisté par l'IA du travail entièrement
   généré. Une fiche du portfolio peut porter `ai: 'assisted' | 'generated'`. */
export const AI_LABEL = { assisted: 'AI-assisted', generated: 'AI-generated' };

export function projectCard(p) {
  const meta = [p.aka && `Released as ${p.aka}`, p.year, ROLES[p.role]].filter(Boolean).join(' · ');
  return `<article class="dv-proj">
    <div class="dv-proj__fig">${p.poster ? `<img src="${esc(p.poster)}" alt="${esc(p.title)}" width="560" height="420" loading="lazy" decoding="async">` : ''}
      <span class="dv-proj__st">${esc(STATUS[p.status] || '')}</span>${AI_LABEL[p.ai] ? `<span class="dv-proj__st dv-proj__st--ai">${AI_LABEL[p.ai]}</span>` : ''}</div>
    <h3 class="dv-proj__h"><a href="/portfolio.html#${esc(p.slug)}">${esc(p.title)}</a></h3>
    ${meta ? `<p class="dv-proj__m">${esc(meta)}</p>` : ''}
  </article>`;
}

export function mountPortfolio(root = document) {
  root.querySelectorAll('[data-portfolio]').forEach((box) => {
    const list = byCategory(box.dataset.portfolio);
    if (list.length) {
      box.innerHTML = `<div class="dv-port">${list.map(projectCard).join('')}</div>`;
      return;
    }
    const what = box.dataset.portfolioLabel || 'projects';
    box.innerHTML = `<div class="dv-empty">
      <div><h3 class="dv-empty__h">Selected ${esc(what)}, being prepared</h3>
      <p>We are assembling our portfolio for this division. Ask our team for recent references, footage and client contacts.</p></div>
      <a class="dv-btn dv-btn--ghost" href="#inquiry">Ask for references<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
    </div>`;
  });
}

/* ─────────────── Le démarrage ─────────────── */
export function bootDivision({ hero = true } = {}) {
  startClocks();
  cursor();
  indexPanel();
  bar();
  initViewer();
  initWipe();
  applyPalette();

  mountPortfolio();
  initInquiries();
  document.querySelectorAll('[data-acc]').forEach((r) => initAccordion(r, { item: '.dv-acc__i', trigger: '.dv-acc__q' }));

  if (hero) heroIn();
  else document.documentElement.classList.add('dv-in');

  markReveals('.dv-h2, .dv-final .dv-h2', 'lines');
  markReveals('.dv-sec .dv-lede, .dv-sec .dv-p, .dv-head__side, .dv-level, .dv-caps, .dv-proj, .dv-empty, .dv-ask__intro, .dv-form, .dv-next, [data-reveal]');
  markMagnets('.dv-btn--xl', 22);
  initReveals();
  initMagnets();
  cascadeCards();

  spotlight();
  stepsLine();
  drift();
  quickBar();
  // Les boucles CSS des sections hors de l'écran se mettent en pause.
  pauseOffscreen('main > *, main > .pin-spacer > *, .ftr');
  requestAnimationFrame(() => ScrollTrigger.refresh());
  watchHeight();
}

/* La page change de hauteur sans que la fenêtre bouge : une police qui
   arrive après le chargement (Instrument Serif en Papier : ~150 px de moins),
   une liste qu'on déplie, un formulaire qui laisse place à sa confirmation.
   Les déclencheurs plus bas se remesurent alors une fois, quand la hauteur
   ne bouge plus (le même geste que l'accueil). */
function watchHeight() {
  const main = document.getElementById('main');
  if (!main || !('ResizeObserver' in window)) return;
  let last = main.offsetHeight;
  let timer = 0;
  new ResizeObserver(() => {
    if (Math.abs(main.offsetHeight - last) < 2) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      last = main.offsetHeight;
      ScrollTrigger.refresh();
      window.__lenis?.resize();
    }, 200);
  }).observe(main);
}

/* Les cartes entrent en cascade, une rangée après l'autre. C'est leur
   CONTENU qui monte, pas la carte : la grille dessine ses filets avec son
   propre fond, et des cartes encore invisibles laissaient voir une plaque
   grise unie (critique du 18/10/2026). Les cases sont là d'emblée, vides,
   puis se remplissent. */
function cascadeCards(sel = '.dv-cards > *') {
  const cards = gsap.utils.toArray(sel);
  if (!cards.length || reduced()) return;
  cards.forEach((c) => gsap.set(c.children, { autoAlpha: 0, y: 22 }));
  const io = new IntersectionObserver((entries) => {
    const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    batch.forEach((el, i) => {
      io.unobserve(el);
      gsap.to(el.children, {
        autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05, delay: i * 0.06,
        clearProps: 'transform,opacity,visibility'
      });
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  cards.forEach((el) => io.observe(el));
}
