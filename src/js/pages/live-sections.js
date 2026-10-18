/**
 * LIVE STREAMING — les sections du milieu (18/10/2026).
 *
 * Dominique, le 18/10 : « pas juste un changement de couleur… que chaque page
 * vive de son thème à travers visuel et interaction, effets ». Entre
 * l'ouverture (le mur de régie) et la demande (le pupitre), on reste dans la
 * régie :
 *   initMultiviewer()  les familles d'événements sont les sources d'un
 *                      écran de contrôle ; survoler = couper sur elle (PGM) ;
 *   initTicker()       le bandeau est un synthé qui défile, plus vite quand
 *                      on défile la page ;
 *   initSwitcher()     les douze moyens sont les touches d'un mélangeur qui
 *                      s'allument au défilement, la manette descend ;
 *   initFlow()         l'encodeur envoie le signal vers le public et vers
 *                      l'accès restreint (le fil passe par un cadenas) ;
 *   initRundown()      le processus est une conduite qu'une tête de lecture
 *                      parcourt ;
 *   initTestCard()     pas encore de diffusion à montrer : une mire
 *                      « No signal » porte le message et l'appel.
 *
 * Partout : rien ne tourne hors de l'écran ; sur écran tactile, ce qui
 * s'allume au survol s'allume pour l'élément au centre de l'écran ; en
 * mouvement réduit, des états fixes, sans animation.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

/** Pose `is-vis` tant que l'élément est à l'écran (le CSS met en pause le reste). */
function onScreen(el, cb) {
  new IntersectionObserver(([e]) => {
    el.classList.toggle('is-vis', e.isIntersecting);
    cb?.(e.isIntersecting);
  }, { rootMargin: '80px 0px' }).observe(el);
}

/** Sur écran tactile : l'élément qui passe au centre de l'écran. */
function atCentre(els, cb) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) cb(e.target);
  }, { rootMargin: '-46% 0px -46% 0px' });
  els.forEach((el) => io.observe(el));
}

/* ═══════════════════ LE MULTIVIEWER ═══════════════════ */
export function initMultiviewer() {
  const mv = document.querySelector('[data-mv]');
  if (!mv) return;
  const srcs = [...mv.querySelectorAll('[data-feed]')];
  const pgmEl = mv.querySelector('[data-mv-pgm]');
  const pvwEl = mv.querySelector('[data-mv-pvw]');
  const still = reduced();
  let pgm = srcs[0];
  let pvw = srcs[1];

  const paint = () => {
    for (const s of srcs) {
      if (s === pgm) s.dataset.st = 'pgm';
      else if (s === pvw) s.dataset.st = 'pvw';
      else delete s.dataset.st;
    }
    if (pgmEl) pgmEl.textContent = pgm?.dataset.cam || '';
    if (pvwEl) pvwEl.textContent = pvw?.dataset.cam || '';
  };
  // Couper : la source passe à l'antenne, celle qu'on quitte passe en préparation.
  const cut = (s) => {
    if (!s || s === pgm) return;
    pvw = pgm;
    pgm = s;
    paint();
    if (!still) {
      gsap.fromTo(s.querySelector('.lv-src__flash'), { opacity: LITE ? 0.16 : 0.3 }, { opacity: 0, duration: 0.32, ease: 'power2.out', overwrite: true });
    }
  };
  paint();
  onScreen(mv);

  if (LITE) atCentre(srcs, cut);
  else {
    // Une petite intention de survol : balayer le mur ne coupe pas huit fois.
    let t = 0;
    for (const s of srcs) {
      s.addEventListener('pointerenter', () => { clearTimeout(t); t = window.setTimeout(() => cut(s), 70); });
      s.addEventListener('pointerleave', () => clearTimeout(t));
    }
  }
  for (const s of srcs) s.addEventListener('focusin', () => cut(s));

  if (still) return;
  // L'allumage : chaque écran s'ouvre depuis un trait blanc, l'un après l'autre.
  const parts = srcs.map((s) => ({
    scr: s.querySelector('.lv-src__scr'),
    flash: s.querySelector('.lv-src__flash'),
    inner: [...s.querySelectorAll('.lv-src__tag, .lv-src__vu, .lv-src__h, .lv-src__list, .lv-src__p')],
    umd: s.querySelector('.lv-src__umd')
  }));
  for (const p of parts) {
    gsap.set(p.scr, { scaleY: 0.012 });
    gsap.set(p.flash, { opacity: 0.85 });
    gsap.set([...p.inner, p.umd], { autoAlpha: 0 });
  }
  let lit = false;
  const on = () => {
    if (lit) return;
    lit = true;
    parts.forEach((p, i) => {
      gsap.timeline({ delay: i * 0.075 })
        .to(p.scr, { scaleY: 1, duration: 0.55, ease: 'expo.out', clearProps: 'transform' }, 0)
        .to(p.flash, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.06)
        .to(p.umd, { autoAlpha: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,visibility' }, 0.12)
        .to(p.inner, { autoAlpha: 1, duration: 0.45, ease: 'power2.out', stagger: 0.04, clearProps: 'opacity,visibility' }, 0.2);
    });
  };
  // Arrivé par le bas (un lien vers #inquiry, puis on remonte) : l'allumage
  // part aussi, sinon les écrans resteraient éteints.
  ScrollTrigger.create({ trigger: mv, start: 'top 82%', onEnter: on, onEnterBack: on, onLeave: on });
}

/* ═══════════════════ LE SYNTHÉ QUI DÉFILE ═══════════════════ */
export function initTicker() {
  const tick = document.querySelector('[data-tick]');
  const track = tick?.querySelector('[data-tick-track]');
  if (!track || reduced()) return;
  const row = track.firstElementChild;
  const BASE = LITE ? 42 : 58;             // px par seconde, au repos
  let w = row.offsetWidth;
  let x = 0;
  let on = false;
  let hold = false;
  let speed = 1;
  let vel = 0;
  let boost = 0;
  new ResizeObserver(() => { w = row.offsetWidth; }).observe(row);
  onScreen(tick, (v) => { on = v; });
  ScrollTrigger.create({
    trigger: tick, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => { vel = self.getVelocity(); }
  });
  gsap.ticker.add((time, dt) => {
    if (!on || document.hidden || !w) return;
    speed += ((hold ? 0 : 1) - speed) * 0.08;
    // Le défilement de la page pousse le synthé (dans son sens), puis il retombe.
    boost += (gsap.utils.clamp(-5, 5, vel / 500) - boost) * 0.1;
    vel *= 0.9;
    x -= BASE * (speed + boost) * Math.min(dt, 64) / 1000;
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
  });
  if (!LITE) {
    tick.addEventListener('pointerenter', () => { hold = true; });
    tick.addEventListener('pointerleave', () => { hold = false; });
  }
}

/* ═══════════════════ LE MÉLANGEUR ═══════════════════ */
export function initSwitcher() {
  const sw = document.querySelector('[data-sw]');
  if (!sw) return;
  const keys = [...sw.querySelectorAll('[data-key]')];
  const nEl = sw.querySelector('[data-sw-n]');
  const tEl = sw.querySelector('[data-sw-t]');
  const lcd = tEl?.parentElement;
  const bar = sw.querySelector('[data-sw-bar]');
  const still = reduced();
  const label = (k) => k.querySelector('.lv-sw__l')?.textContent.trim() || '';
  let idx = -1;

  const set = (i) => {
    if (i === idx) return;
    idx = i;
    keys.forEach((k, j) => {
      k.classList.toggle('is-lit', j < i);
      k.classList.toggle('is-pgm', j === i);
      k.classList.toggle('is-pvw', j === i + 1);
    });
    if (nEl) nEl.textContent = String(i + 1).padStart(2, '0');
    if (tEl) tEl.textContent = label(keys[i]);
    if (!still && lcd) gsap.fromTo(lcd, { opacity: 0.45 }, { opacity: 1, duration: 0.22, ease: 'steps(3)', overwrite: true });
  };

  if (still) {
    // Fixe : toutes les touches rétroéclairées, la commutation (04) à l'antenne.
    set(3);
    keys.forEach((k, j) => { if (j !== 3) { k.classList.add('is-lit'); k.classList.remove('is-pvw'); } });
    return;
  }

  set(0);
  let fromScroll = 0;
  let travel = 0;
  const measure = () => {
    const slot = bar?.parentElement;
    travel = slot && bar ? Math.max(0, slot.clientHeight - bar.offsetHeight) : 0;
  };
  measure();
  ScrollTrigger.create({
    trigger: sw, start: 'top 74%', end: 'bottom 48%',
    onRefresh: (self) => { measure(); if (bar) gsap.set(bar, { y: self.progress * travel }); },
    onUpdate: (self) => {
      const i = Math.min(keys.length - 1, Math.floor(self.progress * keys.length));
      // Une touche choisie à la main reste allumée jusqu'au cran suivant.
      if (i !== fromScroll) { fromScroll = i; set(i); }
      if (bar) gsap.set(bar, { y: self.progress * travel });
    }
  });

  keys.forEach((k, j) => {
    if (LITE) k.addEventListener('click', () => set(j));
    else {
      k.addEventListener('pointerenter', () => set(j));
      k.addEventListener('pointerleave', () => set(fromScroll));
    }
  });
}

/* ═══════════════════ LE CHEMIN DU SIGNAL ═══════════════════ */
export function initFlow() {
  const flow = document.querySelector('[data-flow]');
  const svg = flow?.querySelector('[data-flow-svg]');
  const enc = flow?.querySelector('[data-enc]');
  if (!svg || !enc) return;
  const gate = flow.querySelector('[data-gate]');
  const K = ['pub', 'priv'];
  const dest = Object.fromEntries(K.map((k) => [k, flow.querySelector(`[data-dest="${k}"]`)]));
  const port = Object.fromEntries(K.map((k) => [k, flow.querySelector(`[data-port="${k}"] i`)]));
  const NS = 'http://www.w3.org/2000/svg';
  const path = (cls) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', cls);
    svg.append(p);
    return p;
  };
  const wire = Object.fromEntries(K.map((k) => [k, path(`lv-wire lv-wire--${k}`)]));
  const pkt = Object.fromEntries(K.map((k) => [k, path(`lv-pkt lv-pkt--${k}`)]));
  const still = reduced();
  if (LITE) flow.classList.add('is-lite');

  const draw = () => {
    const box = flow.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width.toFixed(1)} ${box.height.toFixed(1)}`);
    const rel = (el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left - box.left, t: r.top - box.top, r: r.right - box.left, b: r.bottom - box.top, w: r.width, h: r.height };
    };
    const e = rel(enc);
    const vertical = getComputedStyle(flow).gridTemplateColumns.trim().split(/\s+/).length < 2;
    const ys = {};
    for (const k of K) {
      const c = rel(dest[k]);
      let d;
      if (!vertical) {
        const p = rel(port[k]);
        const sx = p.l + p.w / 2;
        const sy = p.t + p.h / 2;
        const tx = c.l;
        const ty = c.t + c.h / 2;
        const dx = Math.max(36, (tx - sx) * 0.55);
        d = `M${sx.toFixed(1)},${sy.toFixed(1)} C${(sx + dx).toFixed(1)},${sy.toFixed(1)} ${(tx - dx).toFixed(1)},${ty.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`;
      } else {
        // Un tronc à gauche, une branche à angle doux vers chaque sortie.
        const x0 = 22;
        const ty = c.t + Math.min(64, c.h / 2);
        const r = 14;
        ys[k] = ty;
        d = `M${x0},${e.b.toFixed(1)} V${(ty - r).toFixed(1)} Q${x0},${ty.toFixed(1)} ${x0 + r},${ty.toFixed(1)} H${c.l.toFixed(1)}`;
      }
      wire[k].setAttribute('d', d);
      pkt[k].setAttribute('d', d);
    }
    if (gate) {
      let pt;
      if (vertical) pt = { x: 22, y: (dest.pub.getBoundingClientRect().bottom - box.top + ys.priv) / 2 };
      else pt = wire.priv.getPointAtLength(wire.priv.getTotalLength() * 0.56);
      gate.style.left = `${pt.x.toFixed(1)}px`;
      gate.style.top = `${pt.y.toFixed(1)}px`;
      gate.classList.add('is-set');
    }
  };

  let raf = 0;
  const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  draw();
  new ResizeObserver(redraw).observe(flow);
  window.addEventListener('palette:change', redraw);

  // La sortie active : au survol sur ordinateur, au centre de l'écran au toucher.
  const activate = (k) => {
    if (k) flow.dataset.on = k; else delete flow.dataset.on;
    for (const j of K) dest[j]?.classList.toggle('is-on', j === k);
  };
  if (LITE) atCentre(K.map((k) => dest[k]), (el) => activate(el.dataset.dest));
  else {
    for (const k of K) {
      dest[k]?.addEventListener('pointerenter', () => activate(k));
      dest[k]?.addEventListener('pointerleave', () => activate(null));
    }
  }

  // À l'arrivée : les fils se tracent, puis les paquets partent.
  let drawn = still;
  onScreen(flow, (v) => {
    if (!v || drawn) return;
    drawn = true;
    draw();
    const all = K.map((k) => wire[k]);
    all.forEach((p) => {
      const L = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, {
        strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset'
      });
    });
    gsap.fromTo(K.map((k) => pkt[k]), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, delay: 0.8, clearProps: 'opacity,visibility' });
    if (gate) gsap.fromTo(gate, { scale: 0.4 }, { scale: 1, duration: 0.6, delay: 0.7, ease: 'back.out(2)', clearProps: 'scale' });
  });
}

/* ═══════════════════ LA CONDUITE ═══════════════════ */
export function initRundown() {
  const rd = document.querySelector('[data-rd]');
  const list = rd?.querySelector('[data-rd-list]');
  if (!list) return;
  const rows = [...list.querySelectorAll('[data-row]')];
  const sts = rows.map((r) => r.querySelector('[data-st]'));
  const ph = rd.querySelector('[data-rd-ph]');
  const pos = rd.querySelector('[data-rd-pos]');
  const LABEL = { done: 'Done', air: 'On air', next: 'Next', stby: 'Standby' };
  if (reduced()) return;

  let cur = -2;
  const state = (i) => {
    if (i === cur) return;
    cur = i;
    rows.forEach((r, j) => {
      const s = j < i ? 'done' : j === i ? 'air' : j === i + 1 ? 'next' : 'stby';
      r.classList.toggle('is-done', s === 'done');
      r.classList.toggle('is-air', s === 'air');
      r.classList.toggle('is-next', s === 'next');
      if (s !== 'air') r.style.setProperty('--rp', '0');
      if (sts[j] && sts[j].textContent !== LABEL[s]) sts[j].textContent = LABEL[s];
    });
    if (pos) pos.textContent = String(Math.min(rows.length, Math.max(1, i + 1))).padStart(2, '0');
  };

  let top = 0;
  let h = 0;
  let marks = [];
  const measure = () => {
    top = list.offsetTop;
    h = list.offsetHeight;
    // Les lignes se mesurent depuis le haut de la liste (leur parent positionné
    // est la conduite entière, en-tête compris).
    marks = rows.map((r) => [r.offsetTop - top, r.offsetHeight]);
  };
  const paint = (p) => {
    const y = p * h;
    if (ph) gsap.set(ph, { y: top + y });
    rd.classList.toggle('is-run', p > 0);
    if (p <= 0) { state(-1); return; }
    let i = marks.findIndex(([t, rh]) => y >= t && y < t + rh);
    if (i < 0) i = rows.length - 1;
    state(i);
    const [t, rh] = marks[i];
    rows[i].style.setProperty('--rp', gsap.utils.clamp(0, 1, (y - t) / rh).toFixed(3));
  };
  measure();
  state(-1);
  // La tête reste à la même hauteur de l'écran ; la conduite défile dessous.
  ScrollTrigger.create({
    trigger: list, start: 'top 60%', end: 'bottom 60%',
    onRefresh: (self) => { measure(); paint(self.progress); },
    onUpdate: (self) => paint(self.progress)
  });
}

/* ═══════════════════ LA MIRE ═══════════════════ */
export function initTestCard() {
  const empty = document.querySelector('#portfolio .dv-empty');
  if (!empty) return;   // de vraies diffusions : la grille du portfolio, telle quelle
  const text = empty.querySelector('.dv-empty__h')?.parentElement;
  const cta = empty.querySelector('.dv-btn');
  const el = (tag, cls, html = '') => {
    const n = document.createElement(tag);
    n.className = cls;
    n.setAttribute('aria-hidden', 'true');
    n.innerHTML = html;
    return n;
  };
  const i = (n) => '<i></i>'.repeat(n);
  empty.classList.add('lv-nosig', 'dv-night');
  const osd = document.createElement('div');
  osd.className = 'lv-nosig__osd';
  osd.append(el('div', 'lv-nosig__flag', '<i></i>No signal'));
  if (text) osd.append(text);
  if (cta) osd.append(cta);
  empty.prepend(
    el('div', 'lv-nosig__bars', `<div>${i(7)}</div><div>${i(7)}</div><div>${i(8)}</div>`),
    el('span', 'lv-nosig__roll'),
    el('div', 'lv-nosig__osd-k', '<span>Input 1</span><span>--:--:--:--</span>')
  );
  empty.append(osd);
  onScreen(empty);
}
