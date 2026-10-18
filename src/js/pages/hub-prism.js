/**
 * SERVICES — la lumière de l'ouverture (18/10/2026).
 *
 *   photons  un trait blanc entre dans le prisme ; une onde en part, puis un
 *            photon de chaque couleur court sur son rayon jusqu'au nom de sa
 *            division, où un anneau s'allume. Web Animations, transformations
 *            et opacités seulement : tout part ensemble et s'arrête ensemble
 *            (hors de l'écran, onglet caché).
 *   dust     la poussière dans la lumière : des grains qui ne se voient que
 *            dans les faisceaux, de la couleur du rayon qu'ils traversent.
 *            Le curseur (ou le doigt) les écarte. Canevas 2D, 30 i/s au plus
 *            (24 au doigt), densité ≤ 1,25.
 * Mouvement réduit : pas de photon, une seule image de poussière.
 */
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

const T = 5600;            // un cycle complet, en ms
const HIT = 0.30;          // le moment où le trait blanc touche le prisme

export function prismLight(hero) {
  const fan = hero?.querySelector('[data-fan]');
  if (!fan) return { start() {}, setOn() {} };
  const svg = fan.querySelector('svg');
  const cores = [...svg.querySelectorAll('.hb-ray__core')];
  const hazes = [...svg.querySelectorAll('.hb-ray__haze')];
  const links = [...hero.querySelectorAll('[data-ray-link]')];
  const box = fan.querySelector('[data-photons]');
  const pulse = fan.querySelector('.hb-fan__pulse');
  const flash = fan.querySelector('.hb-prism__flash');
  const canvas = fan.querySelector('[data-dust]');
  const still = reduced();

  /* La géométrie, en pourcentages de la boîte (celle du SVG étiré). */
  const geo = cores.map((c, i) => {
    const pts = hazes[i].getAttribute('points').trim().split(/\s+/).map((p) => p.split(',').map(Number));
    return {
      x2: +c.getAttribute('x2'), y2: +c.getAttribute('y2'),
      lo: pts[1][1], hi: pts[2][1],
      color: c.getAttribute('stroke')
    };
  });
  const O = { x: +cores[0].getAttribute('x1'), y: +cores[0].getAttribute('y1') };

  let on = false;
  let started = false;
  let anims = [];
  let W = 0, H = 0;

  /* ─────────────── Les photons ─────────────── */
  const inEl = document.createElement('span');
  inEl.className = 'hb-ph hb-ph--in';
  inEl.innerHTML = '<i></i>';
  const phs = geo.map((g, i) => {
    const el = document.createElement('span');
    el.className = 'hb-ph';
    el.dataset.ph = String(i);
    el.style.setProperty('--c', g.color);
    el.innerHTML = '<i></i>';
    return el;
  });
  const hits = links.map((a) => {
    const h = document.createElement('span');
    h.className = 'hb-fan__hit';
    h.setAttribute('aria-hidden', 'true');
    a.append(h);
    return h;
  });
  if (!still) box.append(inEl, ...phs);

  const place = (el, x, y, len, ang) => {
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.style.width = `${len}px`; el.style.transform = `rotate(${ang}rad)`;
  };

  function build() {
    anims.forEach((a) => a.cancel());
    anims = [];
    if (still || !W || !H) return;
    const ox = O.x / 100 * W, oy = O.y / 100 * H;
    place(inEl, 0, oy, ox, 0);
    const lens = geo.map((g, i) => {
      const dx = g.x2 / 100 * W - ox, dy = g.y2 / 100 * H - oy;
      const len = Math.hypot(dx, dy);
      place(phs[i], ox, oy, len, Math.atan2(dy, dx));
      return len;
    });
    // Une seule vitesse pour toute la lumière : le plus long rayon prend 40 % du cycle.
    const v = Math.max(...lens) / (0.40 * T);       // px par ms
    const opt = { duration: T, iterations: Infinity, easing: 'linear' };
    const kf = (a, b, tail) => [
      { transform: 'translateX(-100%)', offset: 0 },
      { transform: 'translateX(-100%)', offset: a },
      { transform: 'translateX(0%)', offset: b },
      { transform: `translateX(${tail}%)`, offset: Math.min(0.99, b + (b - a) * tail / 100) },
      { transform: `translateX(${tail}%)`, offset: 1 }
    ];
    // Le trait blanc entre : il touche le prisme à HIT.
    const tin = ox / v / T;
    anims.push(inEl.firstChild.animate(kf(Math.max(0, HIT - tin), HIT, 38), opt));
    // L'onde et l'éclair du verre, à l'impact.
    anims.push(pulse.animate([
      { opacity: 0, transform: 'scale(0.2)', offset: 0 },
      { opacity: 0, transform: 'scale(0.2)', offset: HIT },
      { opacity: 0.9, transform: 'scale(0.35)', offset: HIT + 0.01 },
      { opacity: 0, transform: 'scale(1.6)', offset: HIT + 0.16 },
      { opacity: 0, transform: 'scale(1.6)', offset: 1 }
    ], { ...opt, easing: 'linear' }));
    if (flash) anims.push(flash.animate([
      { opacity: 0, offset: 0 }, { opacity: 0, offset: HIT }, { opacity: 0.32, offset: HIT + 0.015 }, { opacity: 0, offset: HIT + 0.12 }, { opacity: 0, offset: 1 }
    ], opt));
    // Les sept couleurs partent du prisme et vont jusqu'aux noms.
    const go = HIT + 0.02;
    lens.forEach((len, i) => {
      const arrive = go + len / v / T;
      anims.push(phs[i].firstChild.animate(kf(go, arrive, 26), opt));
      anims.push(hits[i].animate([
        { opacity: 0, transform: 'scale(0.6)', offset: 0 },
        { opacity: 0, transform: 'scale(0.6)', offset: arrive - 0.004 },
        { opacity: 1, transform: 'scale(1)', offset: arrive },
        { opacity: 0, transform: 'scale(3.4)', offset: Math.min(0.995, arrive + 0.13) },
        { opacity: 0, transform: 'scale(3.4)', offset: 1 }
      ], opt));
    });
    // Toutes ensemble, au même instant : la synchronie tient d'un cycle à l'autre.
    const t0 = document.timeline.currentTime;
    anims.forEach((a) => { a.startTime = t0; if (!on || !started) a.pause(); });
  }

  /* ─────────────── La poussière ─────────────── */
  const ctx = canvas?.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, LITE ? 1 : 1.25);
  const N = LITE ? 46 : 130;
  const STEP = 1000 / (LITE ? 24 : 30);
  let motes = [];
  let raf = 0, last = 0;
  const ptr = { x: -1e4, y: -1e4, f: 0 };

  const seed = () => {
    motes = Array.from({ length: N }, () => spawn(true));
  };
  function spawn(any) {
    return {
      x: (any ? 0.12 + Math.random() * 0.88 : 0.12 + Math.random() * 0.2) * W,
      y: Math.random() * H * 0.85,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.6) * 0.08,
      r: 0.5 + Math.random() * 1.25,
      ph: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 1.4
    };
  }
  // La lumière en un point : la couleur et l'intensité du faisceau qui y passe.
  function lightAt(x, y) {
    const ox = O.x / 100 * W, oy = O.y / 100 * H;
    if (x < ox) {
      const half = H * (1.6 - 1.35 * (x / ox)) / 100;
      const d = Math.abs(y - oy);
      return d < half ? { k: (1 - d / half) * 0.7, c: '#ffffff' } : null;
    }
    const t = (x - ox) / (W - ox);
    let best = null;
    for (const g of geo) {
      const yc = oy + t * (g.y2 / 100 * H - oy);
      const half = t * (g.hi - g.lo) / 200 * H + 2;
      const d = Math.abs(y - yc);
      if (d < half) {
        const k = (1 - d / half) * (t > 0.88 ? (1 - t) / 0.12 : 1);
        if (!best || k > best.k) best = { k, c: g.color };
      }
    }
    return best;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < STEP) return;
    const dt = Math.min(3, (now - last) / 16.7);
    last = now;
    draw(dt, now);
  }
  function draw(dt, now) {
    if (!ctx) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ptr.f *= 0.92;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      if (dt) {
        // L'air qui bouge : une dérive lente, et le curseur qui écarte.
        m.vx += (Math.random() - 0.5) * 0.012 * dt;
        m.vy += (Math.random() - 0.5) * 0.012 * dt - 0.0015 * dt;
        const dx = m.x - ptr.x, dy = m.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000 && ptr.f > 0.02) {
          const d = Math.sqrt(d2) || 1;
          m.vx += dx / d * 0.5 * ptr.f * dt; m.vy += dy / d * 0.5 * ptr.f * dt;
        }
        m.vx *= 0.985; m.vy *= 0.985;
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (m.x < 0 || m.x > W || m.y < -10 || m.y > H * 0.9) motes[i] = spawn(Math.random() < 0.7);
      }
      const L = lightAt(m.x, m.y);
      if (!L) continue;
      const tw = 0.55 + 0.45 * Math.sin(now * 0.0016 * m.sp + m.ph);
      const a = L.k * tw;
      if (a < 0.04) continue;
      ctx.globalAlpha = Math.min(1, a * 0.9);
      ctx.fillStyle = L.c;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 2.4, 0, 6.2832); ctx.globalAlpha = a * 0.22; ctx.fill();
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = a > 0.6 ? '#ffffff' : L.c;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.8, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function measure() {
    const w = fan.clientWidth, h = fan.clientHeight;
    if (!w || !h || (w === W && h === H)) return false;
    W = w; H = h;
    if (canvas) { canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); }
    seed();
    return true;
  }

  const point = (e) => {
    const r = fan.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.f = 1;
  };
  if (!still && canvas) {
    hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') point(e); }, { passive: true });
    hero.addEventListener('pointerdown', point, { passive: true });
  }

  function setOn(v) {
    on = v;
    if (still) return;
    anims.forEach((a) => (on && started ? a.play() : a.pause()));
    if (on && started && canvas && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  measure();
  build();
  if (still) { draw(0, 0); }

  let rt = 0;
  new ResizeObserver(() => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (!measure()) return;
      build();
      if (still) draw(0, 0);
    }, 120);
  }).observe(fan);

  return {
    start() {
      if (started) return;
      started = true;
      if (still) return;
      const t0 = document.timeline.currentTime;
      anims.forEach((a) => { a.startTime = t0; if (!on) a.pause(); });
      setOn(on);
    },
    setOn
  };
}
