/**
 * ABOUT US — le dossier d'archives du bureau (17/10/2026, refait le 18/10).
 *
 *   heroFrames()  la photo du bureau et le plan du film montent de leur cadre,
 *                 puis glissent à deux vitesses au défilement (la profondeur) ;
 *   statement()   le texte d'origine, imprimé comme un manifeste : les mots
 *                 s'encrent un à un au défilement, sous un rouleau de laiton
 *                 qui descend avec l'encre ;
 *   scope()       le plan en scope glisse dans sa fenêtre, un reflet le
 *                 traverse ;
 *   drum()        la pièce signature : les sept divisions sur un tambour,
 *                 dont la graduation de laiton défile avec la rotation.
 *                 Le défilement CHOISIT la division (une demi-hauteur d'écran
 *                 chacune) ; le tambour tourne et la fiche change en un temps
 *                 fixe (≈ 1 s), jamais en deux images. Les onglets (01 → 07)
 *                 mènent au même endroit, au clavier comme à la souris.
 *
 * La matière des autres sections (rosaces, plaques, charte, cabinet, cachet)
 * est dans about-heritage.js.
 *
 * En mouvement réduit : rien ne bouge, le tambour laisse la place à la liste
 * des sept fiches (le HTML de base). Tout ce qui tourne en boucle s'arrête
 * hors de l'écran et quand l'onglet est caché.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { initHeritage } from './about-heritage.js';

gsap.registerPlugin(ScrollTrigger);

const STILL = reduced();

bootDivision();
heroFrames();
statement();
scope();
drum();
clientsBand();
initHeritage();
requestAnimationFrame(() => ScrollTrigger.refresh());

/* ─────────────── L'ouverture : deux cadres en profondeur ─────────────── */
function heroFrames() {
  const hero = document.querySelector('.ab-hero');
  if (!hero) return;
  const office = hero.querySelector('[data-frame="office"]');
  const still = hero.querySelector('[data-frame="still"]');
  if (STILL || !office) return;

  const ins = [...hero.querySelectorAll('[data-frame-in]')];
  const imgs = [...hero.querySelectorAll('[data-frame-img]')];
  gsap.set(ins, { yPercent: 101 });
  gsap.set(imgs, { scale: 1.22, transformOrigin: '50% 60%' });
  gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.25 })
    .to(ins[0], { yPercent: 0, duration: 1.4 }, 0)
    .to(imgs[0], { scale: 1, duration: 1.9 }, 0)
    .to(ins[1], { yPercent: 0, duration: 1.2 }, 0.4)
    .to(imgs[1], { scale: 1, duration: 1.6 }, 0.4);

  // Au défilement : le cadre du bureau recule doucement, l'image glisse dans
  // son cadre, le plan du film monte plus vite — trois plans, trois vitesses.
  const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(office, { yPercent: -7, ease: 'none', scrollTrigger: st });
  gsap.fromTo(imgs[0], { yPercent: 0 }, { yPercent: 7, ease: 'none', immediateRender: false, scrollTrigger: { ...st } });
  if (still) gsap.to(still, { yPercent: -48, ease: 'none', scrollTrigger: { ...st } });
}

/* ─────────────── Les mots qui s'allument ─────────────── */
function wrapWords(root) {
  const words = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'ab-w';
          w.textContent = part;
          frag.append(w);
          words.push(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(root);
  return words;
}

function statement() {
  const el = document.querySelector('[data-words]');
  if (!el || STILL) return;
  const words = wrapWords(el);
  const roller = document.querySelector('[data-roller]');
  const STEP = 0.12;
  const total = (words.length - 1) * STEP + 1;

  // Le rouleau suit la ligne en train de s'encrer : la position (le bas du
  // mot) est mesurée une fois, puis à chaque remesure de la page.
  let tops = [];
  let rh = 0;
  const measure = () => {
    tops = words.map((w) => el.offsetTop + w.offsetTop + w.offsetHeight);
    rh = roller ? roller.offsetHeight : 0;
  };
  measure();
  ScrollTrigger.addEventListener('refresh', measure);
  const ry = roller ? gsap.quickTo(roller, 'y', { duration: 0.5, ease: 'power3.out' }) : null;
  let shown = false;

  gsap.fromTo(words, { opacity: 0.14 }, {
    opacity: 1, ease: 'none', stagger: STEP,
    scrollTrigger: { trigger: el, start: 'top 84%', end: 'bottom 56%', scrub: 0.6 },
    onUpdate() {
      if (!roller) return;
      const p = this.progress();
      const i = Math.max(0, Math.min(words.length - 1, Math.round((p * total - 0.5) / STEP)));
      const on = p > 0.01 && p < 0.985;
      if (on !== shown) { shown = on; gsap.to(roller, { opacity: on ? 1 : 0, duration: 0.5, overwrite: 'auto' }); }
      ry((tops[i] || 0) - rh + 4);
    }
  });
}

/* ─────────────── Le plan en scope ─────────────── */
function scope() {
  const img = document.querySelector('[data-scope]');
  if (!img || STILL) return;
  const st = { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true };
  gsap.fromTo(img, { yPercent: -7, scale: 1.04 }, { yPercent: 7, scale: 1, ease: 'none', scrollTrigger: st });
  // Le reflet d'une épreuve sous verre, qui passe au défilement.
  const sheen = img.parentElement.querySelector('[data-sheen]');
  if (sheen) gsap.fromTo(sheen, { xPercent: -110 }, { xPercent: 300, ease: 'none', scrollTrigger: { ...st, start: 'top 85%', end: 'bottom 15%' } });
}

/* ─────────────── Le tambour des sept divisions ─────────────── */
function drum() {
  const sec = document.querySelector('[data-drum-sec]');
  if (!sec || STILL) return;
  const track = sec.querySelector('[data-drum-track]');
  const rot = sec.querySelector('[data-drum]');
  const faces = [...rot.children];
  const panels = [...sec.querySelectorAll('[data-panel]')];
  const tabs = [...sec.querySelectorAll('[role="tab"]')];
  const glow = sec.querySelector('[data-drum-glow]');
  const ticks = sec.querySelector('[data-drum-ticks] i');
  const N = faces.length;
  const STEP = 360 / N;

  sec.classList.add('is-drum');
  panels.forEach((p, i) => {
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', tabs[i].id);
  });

  const state = { a: 0 };
  let cur = -1;
  let front = -1;

  // La face la plus proche de l'avant prend sa couleur ; les autres
  // s'éteignent avec leur angle (cos²), et disparaissent de profil.
  const paint = () => {
    gsap.set(rot, { rotationX: state.a, force3D: true });
    // La graduation du cylindre : 60 px par division, en boucle.
    if (ticks) ticks.style.transform = `translate3d(0, ${(((state.a / STEP) * 60) % 60).toFixed(2)}px, 0)`;
    let best = 0, bestC = -2;
    faces.forEach((f, i) => {
      const rel = ((state.a - i * STEP) % 360 + 540) % 360 - 180;
      const c = Math.cos((rel * Math.PI) / 180);
      if (c > bestC) { bestC = c; best = i; }
      const o = c <= 0.08 ? 0 : Math.pow(c, 2.4);
      f.style.opacity = o.toFixed(3);
      f.style.visibility = o === 0 ? 'hidden' : 'visible';
    });
    if (best !== front) {
      faces[front]?.classList.remove('is-front');
      faces[best].classList.add('is-front');
      front = best;
    }
  };

  // La fiche : la sortante part d'abord, l'entrante arrive ensuite — elles
  // ne se chevauchent jamais.
  gsap.set(panels, { autoAlpha: 0 });
  const go = (i, instant = false) => {
    if (i === cur) return;
    const prev = cur;
    cur = i;
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, j) => { if (j !== i) p.setAttribute('inert', ''); else p.removeAttribute('inert'); });
    const c = getComputedStyle(panels[i]).getPropertyValue('--c').trim();
    if (instant) {
      state.a = i * STEP; paint();
      gsap.set(panels[i], { autoAlpha: 1, y: 0 });
      if (glow) glow.style.setProperty('--c', c);
      return;
    }
    gsap.to(state, { a: i * STEP, duration: 1.05, ease: 'expo.out', overwrite: true, onUpdate: paint });
    if (prev >= 0) gsap.to(panels[prev], { autoAlpha: 0, y: -14, duration: 0.3, ease: 'power2.in', overwrite: true });
    gsap.fromTo(panels[i], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.75, delay: prev >= 0 ? 0.28 : 0, ease: 'power3.out', overwrite: true });
    if (glow) {
      gsap.to(glow, {
        opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: true,
        onComplete: () => { glow.style.setProperty('--c', c); gsap.to(glow, { opacity: 1, duration: 0.8, ease: 'power2.out' }); }
      });
    }
  };

  const pick = (p) => Math.max(0, Math.min(N - 1, Math.round(p * (N - 1))));
  const trig = ScrollTrigger.create({
    trigger: track, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => go(pick(self.progress))
  });
  go(pick(trig.progress), true);

  // Les onglets : un appui (ou Entrée) mène la page à la division ; les
  // flèches passent d'un onglet à l'autre.
  const scrollToStep = (i) => {
    const y = trig.start + ((trig.end - trig.start) * i) / (N - 1) + 2;
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
    go(i);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => scrollToStep(i));
    t.addEventListener('keydown', (e) => {
      let j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % N;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + N) % N;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = N - 1;
      if (j < 0) return;
      e.preventDefault();
      tabs[j].focus();
      scrollToStep(j);
    });
  });

  // Le tambour suit très légèrement la souris (ordinateur seulement).
  if (!LITE) {
    const stage = sec.querySelector('.ab-svc__stage');
    const ry = gsap.quickTo(rot, 'rotationY', { duration: 1.4, ease: 'power3.out' });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
    });
    stage.addEventListener('pointerleave', () => ry(0));
  }
}

/* ─────────────── La bande des clients ───────────────
   Elle défile en CSS ; hors de l'écran ou onglet caché, elle s'arrête. */
function clientsBand() {
  const band = document.querySelector('.ab-cli');
  if (!band || STILL) return;
  let vis = false;
  const paint = () => band.classList.toggle('is-off', !vis || document.hidden);
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; paint(); }).observe(band);
  document.addEventListener('visibilitychange', paint);
}
