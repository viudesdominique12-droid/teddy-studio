/**
 * CONTACT — le signal de l'ouverture (18/10/2026).
 *
 *   pings()  toutes les cinq secondes de l'horloge, un anneau sort du cadran
 *            (plus large à la minute) ; un clic ou un appui sur l'horloge en
 *            lance un tout de suite.
 *   trace()  la ligne du bas de l'ouverture, sur un canevas : une porteuse
 *            qui ondule à peine, et à chaque seconde une onde qui part sous
 *            l'horloge et court des deux côtés en s'éteignant. Sur
 *            ordinateur, la ligne frémit sous le pointeur ; un clic (ou un
 *            appui sur téléphone) dans l'ouverture y lance une onde.
 *
 * Le canevas : 30 images/s au plus (24 sur écran tactile), densité ≤ 1,25,
 * arrêté hors de l'écran et quand l'onglet est caché. En mouvement réduit :
 * une ligne immobile, une onde figée sous l'horloge.
 */
import gsap from 'gsap';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

export function initSignal() {
  const hero = document.querySelector('.ct-hero');
  if (!hero) return;
  const still = reduced();
  pings(hero, still);
  trace(hero, still);
}

/* ─────────────── Les anneaux du cadran ─────────────── */
function pings(hero, still) {
  const clock = hero.querySelector('[data-studio-clock]');
  const dial = hero.querySelector('.ct-clock__dial');
  const rings = [...hero.querySelectorAll('[data-ping]')];
  if (!clock || !dial || !rings.length || still) return;
  let k = 0;
  const ping = (big = false) => {
    const r = rings[k++ % rings.length];
    gsap.fromTo(r,
      { scale: 0.94, opacity: big ? 0.95 : 0.6 },
      { scale: big ? 1.75 : 1.4, opacity: 0, duration: big ? 1.7 : 2.4, ease: 'power2.out', overwrite: true });
  };
  clock.addEventListener('ct:tick', (e) => { if (e.detail.s % 5 === 0) ping(e.detail.s === 0); });
  dial.addEventListener('pointerdown', () => ping(true));
}

/* ─────────────── La ligne du signal ─────────────── */
const rgb = (hex, fb) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return fb;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function trace(hero, still) {
  const cv = hero.querySelector('[data-trace]');
  const dial = hero.querySelector('.ct-clock__dial');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  const DPR = Math.min(1.25, window.devicePixelRatio || 1);
  const FPS = LITE ? 24 : 30;
  const STEP = LITE ? 4 : 3;          // un point tous les 3 px (4 sur téléphone)
  const V = 230;                      // la vitesse d'une onde, px/s
  const css = getComputedStyle(hero);
  const [sr, sg, sb] = rgb(css.getPropertyValue('--dv'), [236, 106, 60]);
  const [cr, cg, cb] = rgb(css.getPropertyValue('--cream'), [239, 232, 222]);
  const SIG = `rgb(${sr} ${sg} ${sb})`;
  const BASE = `rgb(${cr} ${cg} ${cb} / 0.2)`;

  let W = 0, H = 0, mid = 0, ox = 0;
  let running = false;
  let ys = new Float32Array(2);
  const pulses = [];                  // { x, t0, a }
  const ptr = { x: 0, a: 0, ta: 0 };  // le frémissement sous le pointeur

  const resize = () => {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    W = r.width; H = r.height; mid = Math.round(H * 0.58) + 0.5;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ys = new Float32Array(Math.ceil(W / STEP) + 2);
    const d = dial?.getBoundingClientRect();
    ox = d && d.width ? d.left + d.width / 2 - r.left : W * 0.75;
    if (!running) draw(still ? 0 : performance.now() / 1000);
  };

  const shape = (t) => {
    const n = ys.length;
    for (let i = 0; i < n; i++) {
      const x = i * STEP;
      let y = Math.sin(x * 0.045 - t * 2.1) * 1.1;
      for (const p of pulses) {
        const d = (t - p.t0) * V;
        if (d < 0) continue;
        const amp = p.a * Math.exp(-d / 560);
        let u = (x - (p.x - d)) / 22;
        if (u > -3 && u < 3) y += amp * Math.exp(-u * u) * Math.sin(u * 7);
        u = (x - (p.x + d)) / 22;
        if (u > -3 && u < 3) y += amp * Math.exp(-u * u) * Math.sin(u * 7);
      }
      if (ptr.a > 0.05) {
        const u = (x - ptr.x) / 48;
        if (u > -3 && u < 3) y += ptr.a * Math.exp(-u * u) * Math.sin(x * 0.13 - t * 7.5);
      }
      ys[i] = mid + y;
    }
  };

  const stroke = (i0, i1) => {
    ctx.beginPath();
    ctx.moveTo(i0 * STEP, ys[i0]);
    for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(i * STEP, ys[i]);
    ctx.stroke();
  };

  // Une portion de la ligne dans la couleur du signal, autour d'un front.
  const glow = (fx, alpha) => {
    if (alpha < 0.04) return;
    const i0 = Math.max(0, Math.floor((fx - 70) / STEP));
    const i1 = Math.min(ys.length - 1, Math.ceil((fx + 70) / STEP));
    if (i1 <= i0) return;
    const g = ctx.createLinearGradient(fx - 70, 0, fx + 70, 0);
    g.addColorStop(0, `rgb(${sr} ${sg} ${sb} / 0)`);
    g.addColorStop(0.5, `rgb(${sr} ${sg} ${sb} / ${Math.min(1, alpha).toFixed(3)})`);
    g.addColorStop(1, `rgb(${sr} ${sg} ${sb} / 0)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    stroke(i0, i1);
  };

  function draw(t) {
    if (!W) return;
    // Les ondes sorties de la ligne s'effacent.
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      if ((t - p.t0) * V > Math.max(p.x, W - p.x) + 80) pulses.splice(i, 1);
    }
    ptr.a += (ptr.ta - ptr.a) * 0.12;
    shape(t);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = BASE;
    stroke(0, ys.length - 1);
    for (const p of pulses) {
      const d = Math.max(0, (t - p.t0) * V);
      const a = (p.a / 7) * Math.exp(-d / 560);
      glow(p.x - d, a);
      if (d > 0) glow(p.x + d, a);
    }
    if (ptr.a > 0.3) glow(ptr.x, ptr.a / 6);
    // Le point d'émission, sous l'horloge.
    ctx.fillStyle = SIG;
    ctx.beginPath();
    ctx.arc(ox, mid, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (still) {
    pulses.push({ x: 0, t0: -0.4, a: 7 });
    const place = () => { pulses[0].x = ox; draw(0); };
    resize();
    place();
    if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); place(); }).observe(hero);
    return;
  }

  let raf = 0;
  let last = 0;
  let lastSec = -1;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS - 2) return;
    last = now;
    const t = now / 1000;
    const sec = Math.floor(Date.now() / 1000);
    if (sec !== lastSec) {
      if (lastSec > 0) pulses.push({ x: ox, t0: t, a: new Date().getSeconds() === 0 ? 12 : 7 });
      lastSec = sec;
    }
    draw(t);
  };
  const start = () => {
    if (running) return;
    running = true;
    last = 0;
    lastSec = -1;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  let queued = false;
  const onResize = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; resize(); });
  };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(hero);
  else window.addEventListener('resize', onResize);

  let vis = false;
  new IntersectionObserver(([e]) => {
    vis = e.isIntersecting;
    if (vis && !document.hidden) start(); else stop();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (vis) start();
  });

  // Le pointeur fait frémir la ligne (ordinateur) ; un clic ou un appui dans
  // l'ouverture (hors liens et boutons) y lance une onde.
  const localX = (e) => e.clientX - cv.getBoundingClientRect().left;
  if (!LITE) {
    hero.addEventListener('pointermove', (e) => { ptr.x = localX(e); ptr.ta = 5; });
    hero.addEventListener('pointerleave', () => { ptr.ta = 0; });
  }
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    const onDial = e.target.closest('.ct-clock__dial');
    pulses.push({ x: onDial ? ox : localX(e), t0: performance.now() / 1000, a: 12 });
  });
}
