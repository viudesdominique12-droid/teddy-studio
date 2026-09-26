/* ══════════════════════════════════════════════════════════════
   LA REFONTE — le mouvement.
   Tout ce qui bouge ici part d'une idée des références (LAYR, Hobro,
   Trevor Noah, Synchronized) et d'un seul vocabulaire : celui du plateau.
   Règle : aucune animation ne conditionne l'existence du contenu. Sans JS,
   ou en mouvement réduit, tout est là et lisible.
   ══════════════════════════════════════════════════════════════ */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

const MOBILE = '(max-width: 48rem)';

/* ───────────────────────── L'OUVERTURE ─────────────────────────
   Le plan d'une caméra de tournage se trace pendant que le premier écran se
   charge (le poster du plan, le logo, les fontes : le compteur avance au
   rythme de ce qui est réellement décodé). Puis la caméra attend : un clic
   sur la lentille — ou la molette, le doigt, Entrée — et elle s'ouvre ; on
   plonge dedans jusqu'au premier plan. */

function firstScreen() {
  const out = new Set();
  const logo = document.querySelector('img.logo__w');
  if (logo) out.add(logo.currentSrc || logo.src);
  const plan = document.querySelector('.bp__lines');
  if (plan) out.add(plan.getAttribute('href'));
  if (document.querySelector('.hero__media')) {
    out.add(matchMedia(MOBILE).matches ? '/media/sebastopol-poster-mobile.jpg' : '/media/sebastopol-poster.jpg');
  }
  return [...out].filter((s) => s && !s.startsWith('data:'));
}

function decodeOne(src) {
  return new Promise((done) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    const fin = () => done();
    if (img.decode) img.decode().then(fin, fin);
    else { img.onload = fin; img.onerror = fin; }
  });
}

export function bootReel() {
  const el = document.getElementById('boot');
  const root = document.documentElement;
  clearTimeout(window.__bootSafety);
  if (!el) return Promise.resolve();

  let seen = false;
  try { seen = sessionStorage.getItem('teddy-seen') === '1'; } catch { /* ignore */ }
  if (seen || reduced() || !root.classList.contains('is-booting')) {
    el.remove();
    root.classList.remove('is-booting');
    root.classList.add('is-ready');
    return Promise.resolve();
  }
  window.__lenis?.stop();

  const svg = el.querySelector('.boot__bp');
  const plot = el.querySelector('.bp__plot');
  const head = el.querySelector('.bp__head');
  const inks = el.querySelectorAll('.bp__sheet, .bp__notes circle, .bp__notes path, .bp__block rect, .bp__block path');
  const labels = el.querySelectorAll('.bp__notes text, .bp__block text');
  const portal = el.querySelector('.bp__portal');
  const go = el.querySelector('[data-boot-go]');
  const num = el.querySelector('[data-boot-pct]');
  const state = el.querySelector('[data-boot-state]');
  const fill = el.querySelector('[data-boot-bar]');
  const chrome = el.querySelectorAll('.boot__top, .boot__hint, .boot__read, .boot__gauge, .bp__notes, .bp__block, .bp__axis, .bp__sheet');

  const nums = (v) => v.split(' ').map(Number);
  const Q = nums(svg.dataset.portal);                   // l'ouverture du pare-soleil : 4 coins
  const [CX, CY] = nums(svg.dataset.center);
  const [RX, RY] = nums(svg.dataset.rec);               // le vrai bouton REC de la caméra
  const corners = [0, 2, 4, 6].map((i) => [Q[i], Q[i + 1]]);
  const m = { rx: 0, ry: 0, cx: 0, cy: 0, s: 1 };

  /* Le plan est posé en « meet » ; sur écran étroit on recadre sur la caméra
     (les repères et la cartouche se cachent). Le zoom est calculé pour que
     l'ouverture du pare-soleil, une fois centrée, contienne tout l'écran. */
  const measure = () => {
    const W = svg.clientWidth || window.innerWidth;
    const H = svg.clientHeight || window.innerHeight;
    svg.setAttribute('viewBox', W < 768 ? '150 120 2100 1400' : '-260 -160 2920 1900');
    /* On passe par la matrice de l'SVG lui-même : elle dit exactement où
       tombe à l'écran un point du plan, quel que soit le cadrage réel. */
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const box = svg.getBoundingClientRect();
    const at = ([x, y]) => {
      const pt = svg.createSVGPoint();
      pt.x = x; pt.y = y;
      const sp = pt.matrixTransform(ctm);
      return [sp.x - box.left, sp.y - box.top];
    };
    [m.rx, m.ry] = at([RX, RY]);
    [m.cx, m.cy] = at([CX, CY]);
    const q = corners.map(at).map(([x, y]) => [x - m.cx, y - m.cy]);
    const inside = (s) => [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].every(([px, py]) => {
      let sign = 0;
      for (let i = 0; i < 4; i++) {
        const [ax, ay] = q[i].map((v) => v * s);
        const [bx, by] = q[(i + 1) % 4].map((v) => v * s);
        const c = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
        if (c !== 0) { if (sign && Math.sign(c) !== sign) return false; sign = Math.sign(c); }
      }
      return true;
    });
    let lo = 1; let hi = 400;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (inside(mid)) hi = mid; else lo = mid; }
    m.s = hi * 1.04;
    m.W = W; m.H = H;
    el.style.setProperty('--lx', `${m.rx}px`);
    el.style.setProperty('--ly', `${m.ry}px`);
  };
  measure();
  const ro = new ResizeObserver(() => measure());
  ro.observe(svg);

  // Le traceur imprime la caméra de gauche à droite, puis les repères se dessinent.
  gsap.set(inks, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(labels, { autoAlpha: 0 });
  gsap.set(plot, { attr: { width: 0 } });
  gsap.timeline()
    .to(head, { opacity: 1, duration: 0.2 }, 0.15)
    .to(plot, { attr: { width: 2520 }, duration: 1.8, ease: 'power1.inOut' }, 0.15)
    .to(head, { attr: { x1: 2460, x2: 2460 }, duration: 1.8, ease: 'power1.inOut' }, 0.15)
    .to(head, { opacity: 0, duration: 0.3 }, 1.85)
    .to(inks, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.06 }, 1.1)
    .to(labels, { autoAlpha: 1, duration: 0.5, stagger: 0.05 }, 1.5)
    .from([go, el.querySelector('.boot__hint')], { autoAlpha: 0, scale: 0.85, duration: 0.7, ease: 'back.out(1.6)' }, 1.9);

  const shown = { k: 0 };
  const paint = () => {
    if (num) num.textContent = String(Math.round(shown.k * 100)).padStart(3, '0');
    if (fill) fill.style.scale = `${shown.k.toFixed(3)} 1`;
  };
  let chase = null;
  const toward = (k, d = 0.9) => {
    chase?.kill();
    chase = gsap.to(shown, { k, duration: d, ease: 'power2.out', onUpdate: paint });
  };

  return new Promise((resolve) => {
    let entered = false;
    const intents = ['wheel', 'touchmove', 'keydown'];

    const enter = () => {
      if (entered) return;
      entered = true;
      try { sessionStorage.setItem('teddy-seen', '1'); } catch { /* ignore */ }
      intents.forEach((t) => window.removeEventListener(t, onIntent));
      ro.disconnect();
      toward(1, 0.4);

      gsap.timeline()
        .to(go, { scale: 0.86, duration: 0.12, ease: 'power2.out' })                       // on appuie sur REC
        .to(go, { autoAlpha: 0, scale: 1.3, duration: 0.4, ease: 'power2.in' })
        .to(chrome, { autoAlpha: 0, duration: 0.4 }, '<')
        .to(portal, { attr: { points: Q.join(' ') }, duration: 0.55, ease: 'power3.out' }, '-=0.2')  // le pare-soleil s'ouvre
        .to(svg, {
          x: () => m.W / 2 - m.cx,
          y: () => m.H / 2 - m.cy,
          scale: () => m.s,
          transformOrigin: () => `${m.cx}px ${m.cy}px`,
          duration: 1.25, ease: 'expo.in'
        }, '-=0.2')                                                                          // on entre
        .add(() => resolve(), '-=0.6')
        .add(() => {
          el.remove();
          root.classList.remove('is-booting');
          root.classList.add('is-ready');
          window.__lenis?.start();
        });
    };

    function onIntent(e) {
      if (e.type === 'keydown') {
        if (e.target === go && (e.key === 'Enter' || e.key === ' ')) return;
        if (!['Enter', ' ', 'ArrowDown', 'PageDown', 'Escape'].includes(e.key)) return;
      }
      enter();
    }
    go.addEventListener('click', enter);
    intents.forEach((t) => window.addEventListener(t, onIntent, { passive: true }));

    const run = async () => {
      const srcs = firstScreen();
      const total = srcs.length + 1;
      let n = 0;
      const bump = () => { n++; toward(Math.min(0.97, n / total)); };
      const fonts = (document.fonts?.ready || Promise.resolve()).then(bump, bump);
      await Promise.all([fonts, ...srcs.map((src) => decodeOne(src).then(bump))]);
      if (entered) return;
      chase?.kill();
      chase = gsap.to(shown, {
        k: 1, duration: 0.6, ease: 'power2.out', onUpdate: paint,
        onComplete: () => { if (state) state.textContent = 'Ready'; }
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else run();
  });
}

/* ───────────────────────── LE PLAN D'OUVERTURE ───────────────────────── */

function heroVideo() {
  const v = document.getElementById('hero-video');
  if (!v || v.dataset.armed) return;
  v.dataset.armed = '1';
  // En mouvement réduit ou en mode économie de données, le poster suffit.
  if (reduced() || navigator.connection?.saveData) return;

  v.src = matchMedia(MOBILE).matches ? v.dataset.srcMobile : v.dataset.src;
  v.preload = 'auto';
  v.addEventListener('playing', () => v.classList.add('is-on'), { once: true });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) v.play().catch(() => {});
    else v.pause();
  }, { threshold: 0.02 }).observe(v);
}

/* Le code temporel du moniteur : heures:minutes:secondes:images, à 24 i/s,
   depuis l'ouverture de la page. Il ne tourne que tant que le plan est visible. */
function hudTimecode() {
  const tc = document.querySelector('.hud [data-tc]');
  const hero = tc?.closest('.hero');
  if (!tc || !hero) return;
  const t0 = performance.now();
  const pad = (n) => String(n).padStart(2, '0');
  let last = '';
  const tick = () => {
    const ms = performance.now() - t0;
    const s = Math.floor(ms / 1000);
    const f = reduced() ? 0 : Math.floor(ms / (1000 / 24)) % 24;
    const str = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
    if (str !== last) { tc.textContent = str; last = str; }
  };
  let on = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { gsap.ticker.add(tick); on = true; }
    else if (!e.isIntersecting && on) { gsap.ticker.remove(tick); on = false; }
  }).observe(hero);
}

/**
 * L'entrée du plan : les deux lignes du titre montent de leur masque, le
 * cadre du moniteur se resserre sur l'image, puis le texte et l'appel se
 * posent. Les états de départ sont écrits AVANT de retirer le gate CSS.
 */
export function heroReveal() {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  if (!hero) { root.classList.remove('hero-gate'); return; }

  hudTimecode();
  if (reduced()) { root.classList.remove('hero-gate'); heroVideo(); return; }

  const lines = hero.querySelectorAll('.hero__h .ln > span');
  const items = hero.querySelectorAll('[data-hero]');
  const hud = hero.querySelector('.hud');

  gsap.set(lines, { yPercent: 118 });
  gsap.set(items, { autoAlpha: 0, y: 28 });
  if (hud) gsap.set(hud, { autoAlpha: 0, scale: 1.05 });
  root.classList.remove('hero-gate');

  const fonts = document.fonts?.ready || Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(() => {
    heroVideo();
    gsap.timeline()
      .to(lines, { yPercent: 0, duration: 1.45, ease: 'expo.out', stagger: 0.1 })
      .to(hud, { autoAlpha: 1, scale: 1, duration: 1.5, ease: 'expo.out' }, 0.1)
      .to(items, {
        autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.07,
        clearProps: 'transform,opacity,visibility'
      }, 0.45);
  });
}

/* En quittant le plan, l'image se referme en cadre — les bords rentrent,
   les coins s'arrondissent — pendant que le titre file plus vite qu'elle. */
export function heroScroll() {
  const hero = document.querySelector('.hero');
  if (!hero || reduced()) return;
  const media = hero.querySelector('.hero__media');
  const inner = hero.querySelector('.hero__in');
  const hud = hero.querySelector('.hud');

  gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  })
    .fromTo(media,
      { clipPath: 'inset(0% 0% 0% 0% round 0rem)' },
      { clipPath: 'inset(7% 4% 16% 4% round 1.6rem)', ease: 'none' }, 0)
    .to(inner, { yPercent: -22, autoAlpha: 0.15, ease: 'none' }, 0)
    .to(hud, { autoAlpha: 0, ease: 'none' }, 0);
}

/* ───────────────────────── LES TITRES QUI MONTENT ─────────────────────────
   Chaque ligne d'un titre est un masque ; le mot monte de dessous quand le
   titre entre dans l'écran. Une fois, jamais rejoué. */
export function riseTitles(sel = '[data-rise]') {
  if (reduced()) return;
  document.querySelectorAll(sel).forEach((el) => {
    const spans = el.querySelectorAll('.ln > span');
    if (!spans.length) return;
    gsap.set(spans, { yPercent: 118 });
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.09 })
    });
  });
}

/* ───────────────────────── LE BANDEAU ─────────────────────────
   Deux moitiés identiques, un glissement de −50 % en boucle : la couture est
   invisible. La vitesse suit le geste — on défile vite, il file ; on remonte,
   il repart dans l'autre sens — puis revient doucement à son pas. */
function marquee(el) {
  const track = el.querySelector('.mq__track');
  if (!track) return;
  const rail = document.createElement('div');
  rail.className = 'mq__rail';
  track.before(rail);
  rail.append(track);

  // Assez de copies pour qu'une moitié couvre toujours plus qu'un écran.
  const copies = Math.max(1, Math.ceil((window.innerWidth * 1.2) / Math.max(1, track.offsetWidth)));
  for (let i = 1; i < copies * 2; i++) {
    const c = track.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    rail.append(c);
  }
  if (reduced()) return;

  const loop = gsap.to(rail, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
  let target = 1;
  ScrollTrigger.create({
    trigger: el, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = Math.abs(self.getVelocity());
      target = (self.direction || 1) * (1 + Math.min(7, v / 220));
    },
    onToggle: (self) => (self.isActive ? loop.resume() : loop.pause())
  });
  gsap.ticker.add(() => {
    const ts = loop.timeScale();
    loop.timeScale(ts + (target - ts) * 0.08);
    target += ((target < 0 ? -1 : 1) - target) * 0.035;
  });
}

/* ───────────────────────── LES MOTS QUI S'ALLUMENT ─────────────────────────
   La déclaration est découpée en mots (le texte et ses balises restent) ; le
   défilement les allume un à un. Sans JS ou en mouvement réduit, rien n'est
   découpé : tout est lisible d'emblée. */
function words(el) {
  if (reduced()) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.append(part); continue; }
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = part;
      frag.append(w);
    }
    node.replaceWith(frag);
  }
  const all = [...el.querySelectorAll('.w')];
  let lit = -1;
  ScrollTrigger.create({
    trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true,
    onUpdate: (self) => {
      const n = Math.round(self.progress * all.length);
      if (n === lit) return;
      all.forEach((w, i) => w.classList.toggle('is-lit', i < n));
      lit = n;
    }
  });
}

/* Des lignes qui entrent en cascade quand elles arrivent dans l'écran. */
function cascade(sel, from = { y: 46 }) {
  const els = gsap.utils.toArray(sel);
  if (!els.length || reduced()) return;
  gsap.set(els, { autoAlpha: 0, ...from });
  ScrollTrigger.batch(els, {
    start: 'top 92%', once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, x: 0, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07,
      clearProps: 'transform,opacity,visibility'
    })
  });
}

/* Une image qui glisse dans son cadre, plus lentement que la page. */
function drift(sel) {
  if (reduced()) return;
  gsap.utils.toArray(sel).forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

export function initRefonte() {
  document.querySelectorAll('[data-marquee]').forEach(marquee);
  document.querySelectorAll('[data-words]').forEach(words);
  cascade('.svc__row');
  cascade('.why__item', { y: 60 });
  drift('.about__fig img');
}

/* ───────────────────────── LES PLANCHES ─────────────────────────
   Chaque planche est collante ; quand la suivante monte sur elle, elle
   recule (échelle) et s'assombrit (un voile basalte), au pas du défilement. */
function deck() {
  const sheets = gsap.utils.toArray('.sheet');
  if (reduced() || sheets.length < 2) return;
  sheets.forEach((sheet, i) => {
    const next = sheets[i + 1];
    if (!next) return;
    gsap.to(sheet.querySelector('.sheet__in'), {
      scale: 0.9, '--dim': 0.55, ease: 'none',
      scrollTrigger: {
        trigger: next, start: 'top bottom',
        end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`,
        scrub: true, invalidateOnRefresh: true
      }
    });
  });
}

/* ───────────────────────── L'ANNEAU ─────────────────────────
   Chaque lettre est posée sur un cylindre : son angle est sa position dans
   la phrase, le rayon est la longueur de la phrase divisée par 2π. Le
   cylindre est reculé de son rayon, pour que la face avant garde sa taille. */
function ring(el) {
  const cyl = el.querySelector('.ring__cyl');
  if (!cyl || reduced()) return;
  const text = `${cyl.textContent.replace(/\s+/g, ' ').trim()} `;
  cyl.textContent = '';
  const chars = [...text].map((c) => {
    const s = document.createElement('span');
    s.className = 'ring__ch';
    s.textContent = c === ' ' ? ' ' : c;
    cyl.append(s);
    return s;
  });
  el.classList.add('is-3d');

  const state = { rot: 0 };
  let R = 0;
  const paint = () => { cyl.style.transform = `translateZ(${-R}px) rotateY(${state.rot}deg)`; };
  const layout = () => {
    // On mesure À PLAT : un cylindre déjà reculé de son rayon rapetisse les
    // lettres à l'écran, et le rayon calculé serait trop court.
    cyl.style.transform = 'none';
    chars.forEach((s) => { s.style.transform = 'translate(-50%, -50%)'; });
    const widths = chars.map((s) => s.getBoundingClientRect().width);
    const total = widths.reduce((a, b) => a + b, 0);
    R = total / (2 * Math.PI);
    let acc = 0;
    chars.forEach((s, i) => {
      const a = (acc + widths[i] / 2) / R;
      acc += widths[i];
      s.style.transform = `translate(-50%, -50%) rotateY(${a}rad) translateZ(${R}px)`;
    });
    paint();
  };
  (document.fonts?.ready || Promise.resolve()).then(layout);
  layout();
  window.addEventListener('resize', () => requestAnimationFrame(layout));

  gsap.fromTo(state, { rot: 40 }, {
    rot: -150, ease: 'none', onUpdate: paint,
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
  });
}

export function initChapters() {
  deck();
  document.querySelectorAll('[data-ring]').forEach(ring);
}

/* ───────────────────────── ENTRER DANS LA CAMÉRA ─────────────────────────
   La galerie est épinglée ; par-dessus, une vraie caméra de tournage. Quatre
   temps, au pas du défilement :
     1. le dessin, tiré de la photo elle-même, devient la photo — depuis
        l'objectif, en cercle qui s'élargit ;
     2. la lentille s'ouvre comme un diaphragme : les vidéos apparaissent ;
     3. la caméra se centre sur l'objectif et grossit jusqu'à ce que la
        lentille déborde de l'écran ;
     4. elle s'efface : on est dans la galerie, et on continue de descendre.
   Le cadrage suit l'objectif : sur un écran étroit, la photo est recadrée
   autour de lui au lieu d'être centrée (il sortirait du cadre). */
export function cameraEntry() {
  const gal = document.querySelector('.gal');
  const cam = gal?.querySelector('[data-cam]');
  if (!gal || !cam) return;
  if (reduced()) { cam.remove(); return; }

  const svg = cam.querySelector('.cam__svg');
  const reveals = cam.querySelectorAll('.cam__reveal');
  const iris = cam.querySelector('.cam__iris');
  const cta = cam.querySelector('.cam__cta');
  const [LX, LY, RX, RY] = cam.dataset.lens.split(' ').map(Number);
  const IW = 2400;
  const IH = 1600;
  const FOCUS_X = 1560;   // écran étroit : on cadre un peu à gauche de la lentille, pour garder la bague
  const m = { hx: 0, hy: 0, dx: 0, dy: 0, s: 1 };

  const measure = () => {
    const W = gal.clientWidth;
    const H = gal.clientHeight;
    const A = W / H;
    let vx = 0; let vy = 0; let vw = IW; let vh = IH;
    if (A < IW / IH) { vw = IH * A; vx = Math.min(IW - vw, Math.max(0, FOCUS_X - vw / 2)); }
    else { vh = IW / A; vy = Math.min(IH - vh, Math.max(0, LY - vh / 2)); }
    svg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
    const k = W / vw;
    m.hx = (LX - vx) * k;
    m.hy = (LY - vy) * k;
    m.dx = W / 2 - m.hx;
    m.dy = H / 2 - m.hy;
    // L'ellipse ouverte doit contenir tout l'écran, une fois centrée.
    m.s = Math.hypot(W / 2 / (RX * k), H / 2 / (RY * k)) * 1.06;
    cam.style.setProperty('--hx', `${m.hx}px`);
    cam.style.setProperty('--hy', `${m.hy}px`);
  };
  measure();

  // La photo et son dessin ne partent qu'à l'approche de la galerie.
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    const small = window.innerWidth < 900;
    cam.querySelectorAll('image[data-href]').forEach((img) => {
      img.setAttribute('href', small ? img.dataset.hrefSmall : img.dataset.href);
    });
    io.disconnect();
  }, { rootMargin: '150% 0px' }).observe(gal);

  const origin = () => `${m.hx}px ${m.hy}px`;
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: gal, start: 'top top', end: '+=210%',
      pin: true, scrub: 0.6, invalidateOnRefresh: true,
      onRefreshInit: measure
    }
  })
    .to(reveals, { attr: { r: 2000 }, duration: 0.3, ease: 'power1.inOut' }, 0)
    .to(cta, { autoAlpha: 0, scale: 0.92, duration: 0.1 }, 0.12)
    .to(iris, { attr: { rx: RX, ry: RY }, duration: 0.14, ease: 'power2.out' }, 0.3)
    .fromTo(svg,
      { x: 0, y: 0, scale: 1, transformOrigin: origin },
      { x: () => m.dx, y: () => m.dy, scale: () => m.s, transformOrigin: origin, duration: 0.56, ease: 'power3.in' },
      0.4)
    .to(cam, { autoAlpha: 0, duration: 0.05 }, 0.95);
}

/* ───────────────────────── L'ÉCHELLE ─────────────────────────
   Un grand trait par section, quatre petits entre deux. L'index avance
   section par section : entre deux grands traits, il suit la progression
   DANS la section — une section épinglée n'écrase pas les autres. La section
   courante est la dernière dont le haut a passé le milieu de l'écran. */
export function initRuler() {
  const sections = [...document.querySelectorAll('main [data-scene]')];
  if (sections.length < 3 || document.querySelector('.lens')) return;
  const MINOR = 4;

  const nav = document.createElement('nav');
  nav.className = 'lens';
  nav.setAttribute('aria-label', 'Sections');
  const scale = document.createElement('div');
  scale.className = 'lens__scale';
  const majors = sections.map((sec) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lens__maj';
    b.dataset.label = sec.dataset.scene;
    b.setAttribute('aria-label', `Go to ${sec.dataset.scene}`);
    b.addEventListener('click', () => {
      const to = sec.closest('.pin-spacer') || sec;
      if (window.__lenis) window.__lenis.scrollTo(to, { duration: 1.2 });
      else to.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    });
    scale.append(b);
    for (let j = 0; j < MINOR; j++) {
      const t = document.createElement('i');
      t.className = 'lens__min';
      scale.append(t);
    }
    return b;
  });
  const idx = document.createElement('span');
  idx.className = 'lens__idx';
  idx.setAttribute('aria-hidden', 'true');
  scale.append(idx);
  nav.append(scale);
  document.body.append(nav);

  let tops = [];
  let x0 = 0;
  let unit = 0;
  const measure = () => {
    tops = sections.map((s) => (s.closest('.pin-spacer') || s).getBoundingClientRect().top + window.scrollY);
    tops.push(document.documentElement.scrollHeight - window.innerHeight * 0.5 + 1);
    x0 = majors[0].offsetLeft + majors[0].offsetWidth / 2;
    unit = majors[1].offsetLeft - majors[0].offsetLeft;
  };
  const setX = reduced() ? (x) => gsap.set(idx, { x }) : gsap.quickTo(idx, 'x', { duration: 0.55, ease: 'power3.out' });
  let on = -1;
  const update = () => {
    const y = window.scrollY + window.innerHeight * 0.5;
    let i = 0;
    while (i < sections.length - 1 && y >= tops[i + 1]) i++;
    const t = Math.min(1, Math.max(0, (y - tops[i]) / Math.max(1, tops[i + 1] - tops[i])));
    setX(x0 + (i + t) * unit);
    if (i !== on) {
      majors.forEach((b, k) => b.classList.toggle('is-on', k === i));
      on = i;
    }
  };
  measure();
  gsap.set(idx, { x: x0 });
  update();
  ScrollTrigger.addEventListener('refresh', () => { measure(); update(); });
  window.addEventListener('scroll', update, { passive: true });
}
