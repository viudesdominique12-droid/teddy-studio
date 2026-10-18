/**
 * LOCATIONS — l'atlas (18/10/2026).
 *
 * Dominique : « améliore-moi les autres pages avec la même logique de
 * customisation de thème ». La page des neuf lieux devient un atlas de
 * repérage :
 *   topo()       l'ouverture : une carte topographique tracée en direct
 *                (courbes de niveau par « marching squares » sur un relief
 *                qui dérive lentement), une courbe terre cuite qui monte les
 *                altitudes sans fin, et le relief qui se soulève sous la
 *                souris (sous le doigt, une bosse qui retombe) ;
 *   profile()    l'index des neuf lieux posé sur leur coupe d'altitude, du
 *                plus haut au plus bas ; un point de géomètre parcourt la
 *                crête ; viser un nom allume son point ;
 *   sheets()     chaque lieu devient une fiche de repérage : la photo dans
 *                un viseur (coins, croix, tiers, caches 2,39:1 au survol ou
 *                au toucher), le signe de carte du lieu dans ses courbes de
 *                niveau, et en tête un trait de relief qui vit à sa façon ;
 *   altimeter()  l'altimètre de gauche (ordinateur) : l'aiguille glisse à
 *                l'altitude du lieu à l'écran ;
 *   cta()        l'appel : la zone blanche de la carte, un itinéraire qui
 *                part de la base vers un lieu encore à trouver.
 * Les altitudes viennent de src/data/site.js (déjà publiées sur l'accueil) ;
 * Winding Road n'en a pas, rien n'est affiché pour elle. Tout ce qui tourne
 * s'arrête hors de l'écran et quand l'onglet est caché ; en mouvement
 * réduit, tout est posé et immobile.
 *
 * Ce module est chargé AVANT page.js : il marque les fiches comme déjà
 * révélées, pour que le flou d'entrée commun ne joue pas par-dessus leur
 * propre entrée (l'obturateur du viseur).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { locations as LOCS, range } from '../../data/site.js';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const LITE = matchMedia('(pointer: coarse)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const bySlug = Object.fromEntries(LOCS.map((l) => [l.slug, l]));
const cards = [...document.querySelectorAll('.locs > .loc__i')];
const pad = (n) => String(n).padStart(2, '0');
const fmt = (n) => (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-US');
const f1 = (n) => Math.round(n * 10) / 10;

/* Un hasard qui se répète : la même fiche a toujours le même relief. */
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

root.classList.add('ol-js');
const optOut = (el) => { if (el) { el.setAttribute('data-element-blur', ''); el.dataset.revealed = '1'; } };
cards.forEach(optOut);

/* ═══════════════════════ LES BOUCLES ═══════════════════════ */
const liveIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    e.target.classList.toggle('is-live', e.isIntersecting);
    e.target.dispatchEvent(new CustomEvent('ol:live', { detail: e.isIntersecting }));
  }
}, { rootMargin: '80px 0px' });
const watch = (el) => { if (el) liveIO.observe(el); };
document.addEventListener('visibilitychange', () => root.classList.toggle('ol-hidden', document.hidden));

/* Une courbe lisse par des points (Catmull-Rom → Bézier). */
function smooth(P, closed = false) {
  const n = P.length;
  const at = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(P[0].x)},${f1(P[0].y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += ` C${f1(p1.x + (p2.x - p0.x) / 6)},${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)},${f1(p2.y - (p3.y - p1.y) / 6)} ${f1(p2.x)},${f1(p2.y)}`;
  }
  return closed ? `${d}Z` : d;
}

/* ═══════════════════════ LA CARTE DE L'OUVERTURE ═══════════════════════ */
function topo() {
  const hero = document.querySelector('.ol-hero');
  const wrap = hero?.querySelector('.ol-topo');
  const cv = wrap?.querySelector('canvas');
  const ctx = cv?.getContext('2d');
  if (!ctx) return;
  const cs = getComputedStyle(hero);
  const SAGE = cs.getPropertyValue('--ol-sage').trim() || '#93a679';
  const DV = cs.getPropertyValue('--dv-lt').trim() || '#f39d6c';
  const DPR = Math.min(window.devicePixelRatio || 1, LITE ? 1 : 1.25);
  const CELL = LITE ? 16 : 11;
  const FPS = LITE ? 20 : 30;
  const L0 = 0.1, LS = 0.05, LN = 23, LMAX = L0 + LS * (LN - 1);

  /* Le bruit de valeur, pour que le relief respire. */
  const R = rng(11);
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];
  const g = (x, y) => perm[(perm[x & 255] + y) & 255] / 255;
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = g(ix, iy), b = g(ix + 1, iy), c = g(ix, iy + 1), d = g(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  let W = 0, H = 0, cols = 0, rows = 0, F = null, BASE = null;
  const bump = { x: 0, y: 0, tx: 0, ty: 0, a: 0, to: 0, inv: 1 / (2 * 120 * 120) };

  const layout = () => {
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return false;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
    F = new Float32Array(cols * rows);
    BASE = new Float32Array(cols * rows);
    const wide = W > 760;
    /* Le massif : à droite du titre sur ordinateur, au-dessus sur téléphone.
       [x, y, hauteur, étendue] en fractions de la largeur. */
    const peaks = (wide
      ? [[0.8, 0.26, 1, 0.12], [0.93, 0.5, 0.74, 0.09], [0.66, 0.5, 0.62, 0.085], [0.89, 0.07, 0.5, 0.07], [0.72, 0.78, 0.42, 0.1], [0.56, 0.2, 0.34, 0.07], [1.02, 0.86, 0.55, 0.09], [0.74, 0.42, -0.22, 0.04], [0.98, 0.3, 0.3, 0.05]]
      : [[0.84, 0.1, 1, 0.34], [0.22, 0.06, 0.58, 0.26], [0.6, 0.27, 0.6, 0.26], [0.04, 0.36, 0.42, 0.24], [0.96, 0.44, 0.46, 0.24]]
    ).map(([u, v, a, s]) => ({ x: u * W, y: v * H, a, inv: 1 / (2 * (s * W) ** 2) }));
    for (let j = 0; j < rows; j++) {
      const y = j * CELL;
      for (let i = 0; i < cols; i++) {
        const x = i * CELL;
        let v = 0;
        for (const p of peaks) { const dx = x - p.x, dy = y - p.y; v += p.a * Math.exp(-(dx * dx + dy * dy) * p.inv); }
        BASE[j * cols + i] = v;
      }
    }
    bump.inv = 1 / (2 * (wide ? 130 : 90) ** 2);
    return true;
  };

  const field = (t) => {
    const tx = t * 0.05, ty = t * 0.032;
    const useBump = bump.a > 0.003;
    for (let j = 0; j < rows; j++) {
      const y = j * CELL;
      for (let i = 0; i < cols; i++) {
        const x = i * CELL;
        let v = BASE[j * cols + i] + 0.28 * noise(x * 0.0042 + tx, y * 0.0042 - ty) + 0.1 * noise(x * 0.011 - tx, y * 0.011 + ty);
        if (useBump) { const dx = x - bump.x, dy = y - bump.y; v += bump.a * Math.exp(-(dx * dx + dy * dy) * bump.inv); }
        F[j * cols + i] = v;
      }
    }
  };

  /* Marching squares : pour chaque case et chaque niveau qu'elle traverse,
     un segment. Coins : a en haut à gauche, b en haut à droite, c en bas à
     droite, d en bas à gauche. Arêtes : 0 haut, 1 droite, 2 bas, 3 gauche. */
  const CASES = [null, [3, 2], [2, 1], [3, 1], [0, 1], [0, 1, 3, 2], [0, 2], [3, 0], [3, 0], [0, 2], [3, 0, 2, 1], [0, 1], [3, 1], [2, 1], [3, 2], null];
  let ex = 0, ey = 0;
  const edge = (e, L, a, b, c, d, x0, y0) => {
    if (e === 0) { ex = x0 + CELL * (L - a) / (b - a); ey = y0; }
    else if (e === 1) { ex = x0 + CELL; ey = y0 + CELL * (L - b) / (c - b); }
    else if (e === 2) { ex = x0 + CELL * (L - d) / (c - d); ey = y0 + CELL; }
    else { ex = x0; ey = y0 + CELL * (L - a) / (d - a); }
  };
  const segs = (p, L, a, b, c, d, x0, y0) => {
    const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
    const cs2 = CASES[k];
    if (!cs2) return;
    for (let s = 0; s < cs2.length; s += 2) {
      edge(cs2[s], L, a, b, c, d, x0, y0); p.moveTo(ex, ey);
      edge(cs2[s + 1], L, a, b, c, d, x0, y0); p.lineTo(ex, ey);
    }
  };

  const draw = (t) => {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const pN = new Path2D(), pI = new Path2D(), pS = new Path2D();
    /* La courbe terre cuite monte les altitudes, puis repart d'en bas. */
    const sweep = L0 + ((t * 0.035) % 1) * (LMAX - L0);
    for (let j = 0; j < rows - 1; j++) {
      const y0 = j * CELL;
      for (let i = 0; i < cols - 1; i++) {
        const a = F[j * cols + i], b = F[j * cols + i + 1], c = F[(j + 1) * cols + i + 1], d = F[(j + 1) * cols + i];
        const lo = Math.min(a, b, c, d), hi = Math.max(a, b, c, d);
        if (hi < L0 || lo > LMAX) continue;
        const x0 = i * CELL;
        const k0 = Math.max(0, Math.ceil((lo - L0) / LS)), k1 = Math.min(LN - 1, Math.floor((hi - L0) / LS));
        for (let k = k0; k <= k1; k++) segs(k % 5 === 2 ? pI : pN, L0 + k * LS, a, b, c, d, x0, y0);
        if (lo < sweep && sweep < hi) segs(pS, sweep, a, b, c, d, x0, y0);
      }
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = SAGE;
    ctx.globalAlpha = 0.34; ctx.lineWidth = 1; ctx.stroke(pN);
    ctx.globalAlpha = 0.62; ctx.lineWidth = 1.3; ctx.stroke(pI);
    ctx.strokeStyle = DV; ctx.globalAlpha = 0.9; ctx.lineWidth = 1.6; ctx.stroke(pS);
    ctx.globalAlpha = 1;
  };

  let raf = 0, last = 0, visible = true;
  const t0 = performance.now();
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS - 1) return;
    last = now;
    bump.x += (bump.tx - bump.x) * 0.22; bump.y += (bump.ty - bump.y) * 0.22;
    bump.a += (bump.to - bump.a) * (LITE ? 0.2 : 0.1);
    if (LITE) bump.to *= 0.93;
    const t = (now - t0) / 1000;
    field(t); draw(t);
  };
  const start = () => { if (!raf && visible && !document.hidden && !REDUCED && W) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const still = () => { field(0); draw(9); };

  if (layout()) { if (REDUCED) still(); else { field(0); draw(0); } }
  wrap.classList.add('is-on');

  let rsz = 0;
  new ResizeObserver(() => {
    clearTimeout(rsz);
    rsz = setTimeout(() => { if (layout()) { if (REDUCED) still(); else { field(0); draw(0); start(); } } }, 120);
  }).observe(cv);
  hero.addEventListener('ol:live', (e) => { visible = e.detail; if (visible) start(); else stop(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  if (REDUCED) return;
  /* La main soulève le relief ; le doigt y laisse une bosse qui retombe. */
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = cv.getBoundingClientRect();
    bump.tx = e.clientX - r.left; bump.ty = e.clientY - r.top;
    if (bump.to === 0) { bump.x = bump.tx; bump.y = bump.ty; }
    bump.to = 0.4;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { bump.to = 0; });
  hero.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const r = cv.getBoundingClientRect();
    bump.tx = bump.x = e.clientX - r.left; bump.ty = bump.y = e.clientY - r.top;
    bump.to = 0.55;
  }, { passive: true });
  start();
}

/* ═══════════════════════ LA COUPE D'ALTITUDE ═══════════════════════ */
function profile() {
  const nav = document.querySelector('.ol-prof');
  if (!nav) return;
  const box = nav.querySelector('.ol-prof__chart');
  const links = [...nav.querySelectorAll('.ol-prof__list a')];
  const items = links.map((a) => bySlug[decodeURIComponent(a.hash.slice(1))]);
  let drawn = false;
  let lastW = 0;

  const build = () => {
    const W = Math.round(box.clientWidth), H = Math.round(box.clientHeight);
    if (!W || !H || W === lastW) return;
    lastW = W;
    const N = links.length;
    const top = 10, bot = H - 12;
    const y = (alt) => top + ((range.high - alt) / range.span) * (bot - top);
    const pts = items.map((l, i) => (l && l.alt != null ? { i, x: (i + 0.5) * W / N, y: y(l.alt) } : null));
    const P = pts.filter(Boolean);
    if (!P.length) return;
    const lastP = P[P.length - 1];
    const seq = [{ x: 0, y: P[0].y + 14 }, ...P, { x: lastP.x + (W / N) * 0.45, y: lastP.y + 2 }];
    const d = smooth(seq);
    const fill = `${d} L${f1(seq[seq.length - 1].x)},${H} L0,${H} Z`;
    const strata = [4000, 3000, 2000, 1000].map((a) => `<line x1="0" x2="${W}" y1="${f1(y(a))}" y2="${f1(y(a))}"/>`).join('');
    const sea = f1(y(0));
    const nomap = pts.map((p, i) => (p ? '' : `<line class="ol-p-nomap" x1="${f1((i + 0.5) * W / N)}" x2="${f1((i + 0.5) * W / N)}" y1="${f1(bot - 30)}" y2="${H}"/>`)).join('');
    const marks = P.map((p) => `<line class="ol-p-drop" data-i="${p.i}" x1="${f1(p.x)}" x2="${f1(p.x)}" y1="${f1(p.y + 6)}" y2="${H}"/>
      <g class="ol-p-pt" data-i="${p.i}"><circle class="h" cx="${f1(p.x)}" cy="${f1(p.y)}" r="9"/><circle class="c" cx="${f1(p.x)}" cy="${f1(p.y)}" r="3.4"/></g>`).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" focusable="false">
      <defs><linearGradient id="ol-p-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93a679" stop-opacity=".26"/><stop offset="1" stop-color="#93a679" stop-opacity="0"/></linearGradient>
      <clipPath id="ol-p-clip"><path d="${fill}"/></clipPath></defs>
      <path class="ol-p-fill" d="${fill}"/>
      <g class="ol-p-strata" clip-path="url(#ol-p-clip)">${strata}</g>
      <line class="ol-p-sea" x1="0" x2="${W}" y1="${sea}" y2="${sea}"/>
      <text class="ol-p-lab" x="4" y="${f1(sea - 5)}">0 m</text>
      ${nomap}
      <path class="ol-p-ridge" d="${d}"/>
      ${marks}
    </svg><span class="ol-prof__dot"></span>`;
    const dot = box.querySelector('.ol-prof__dot');
    dot.style.offsetPath = `path('${d}')`;
    if (!drawn) {
      drawn = true;
      box.classList.add('is-drawn');
      if (!REDUCED) {
        const ridge = box.querySelector('.ol-p-ridge');
        ridge.setAttribute('pathLength', '1');
        gsap.fromTo(ridge, { strokeDasharray: 1, strokeDashoffset: 1 }, {
          strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', delay: 0.35,
          onComplete: () => { ridge.removeAttribute('pathLength'); gsap.set(ridge, { clearProps: 'strokeDasharray,strokeDashoffset' }); }
        });
        gsap.from(box.querySelectorAll('.ol-p-pt .c'), { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2.4)', stagger: 0.12, delay: 0.6 });
        gsap.from(dot, { autoAlpha: 0, duration: 0.6, delay: 2.2, clearProps: 'opacity,visibility' });
      }
    } else box.classList.add('is-drawn');
  };

  const hot = (i) => {
    box.querySelectorAll('.ol-p-pt, .ol-p-drop').forEach((el) => el.classList.toggle('is-hot', Number(el.dataset.i) === i));
  };
  links.forEach((a, i) => {
    a.addEventListener('pointerenter', () => hot(i));
    a.addEventListener('pointerleave', () => hot(-1));
    a.addEventListener('focus', () => hot(i));
    a.addEventListener('blur', () => hot(-1));
  });
  build();
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(build, 120); }).observe(box);
}

/* ═══════════════════════ LES TRAITS DE RELIEF ═══════════════════════
   Neuf traits, un par lieu, chacun avec sa vie. Ils sont dessinés à la
   taille réelle de leur bande (en pixels), et redessinés si elle change. */
const D = {
  /* Simien : une crête dentelée, un éclat de lumière la parcourt. */
  'simien-mountains'(W, H, r) {
    const base = H - 8;
    const env = (x) => 0.85 * Math.exp(-(((x / W) - 0.3) ** 2) / 0.012) + 0.6 * Math.exp(-(((x / W) - 0.58) ** 2) / 0.02) + 0.18;
    const pts = [];
    let sx = 0, sy = H;
    for (let x = 0; x <= W; x += 14) {
      const y = f1(base - env(x) * (H - 16) * (0.78 + r() * 0.22));
      if (y < sy) { sx = x; sy = y; }
      pts.push(`${x},${y}`);
    }
    const back = [];
    for (let x = 0; x <= W; x += 22) back.push(`${x},${f1(base - env(x + 90) * (H - 22) * 0.55 - r() * 3)}`);
    return `<polyline class="b2" points="${back.join(' ')}"/><polyline class="b" points="${pts.join(' ')}"/>
      <polyline class="hi run" pathLength="1000" points="${pts.join(' ')}"/>
      <path class="dot" d="M${sx - 5},${f1(sy - 3)} l5,-8 l5,8z"/>`;
  },
  /* Wollo : trois rides du lac Hayq qui glissent, et un tankwa qui tangue. */
  wollo(W, H) {
    const wave = (p, amp, y0, cls, dur) => {
      let d = `M0,${y0}`;
      for (let x = 0; x <= W + p; x += 6) d += ` L${x},${f1(y0 + Math.sin((x / p) * Math.PI * 2) * amp)}`;
      return `<path class="${cls} wave" style="--p:${p}px;--d:${dur}s" d="${d}"/>`;
    };
    const bx = Math.round(W * 0.62), by = H / 2 - 2;
    return wave(150, 2.4, H / 2 - 9, 'b2', 11) + wave(96, 3, H / 2, 'b', 7) + wave(210, 2, H / 2 + 9, 'b2', 15)
      + `<g style="animation:ol-bob 3.6s ease-in-out infinite"><path class="oc" d="M${bx - 11},${by} Q${bx},${by + 6} ${bx + 11},${by - 1}"/></g>`;
  },
  /* Lalibela : la roche taillée en gradins autour de l'église en croix. */
  lalibela(W, H) {
    const g = 12, cx = Math.round(W * 0.46), half = 84, st = 3, sh = (H - g - 8) / st, sw = 14;
    let d = `M0,${g} L${cx - half},${g}`;
    for (let s = 1; s <= st; s++) d += ` L${cx - half + (s - 1) * sw},${f1(g + s * sh)} L${cx - half + s * sw},${f1(g + s * sh)}`;
    d += ` L${cx + half - st * sw},${f1(g + st * sh)}`;
    for (let s = st; s >= 1; s--) d += ` L${cx + half - s * sw},${f1(g + (s - 1) * sh)} L${cx + half - (s - 1) * sw},${f1(g + (s - 1) * sh)}`;
    d += ` L${W},${g}`;
    const cy = g + st * sh - 13;
    return `<path class="b" d="${d}"/><path class="hi draw" pathLength="1000" d="${d}"/>
      <path class="oc" d="M${cx},${f1(cy - 8)} V${f1(cy + 8)} M${cx - 6},${f1(cy - 2)} H${cx + 6}"/>`;
  },
  /* Wonchi : le cratère et son lac ; les courbes du fond respirent. */
  wonchi(W, H) {
    const cx = Math.round(W * 0.4), w = 120, g = 12, depth = H - g - 6;
    const d = `M0,${g} L${cx - w},${g} C${cx - w * 0.55},${g} ${cx - w * 0.5},${g + depth} ${cx},${g + depth} C${cx + w * 0.5},${g + depth} ${cx + w * 0.55},${g} ${cx + w},${g} L${W},${g}`;
    const ey = g + depth - 9;
    return `<path class="b" d="${d}"/><path class="hi run" pathLength="1000" d="${d}"/>
      <ellipse class="b crat" cx="${cx}" cy="${ey}" rx="44" ry="5"/><ellipse class="b crat" cx="${cx}" cy="${ey}" rx="30" ry="3.5"/><ellipse class="oc crat" cx="${cx}" cy="${ey}" rx="16" ry="2"/>`;
  },
  /* Fasilides : un rempart crénelé et sa tour à coupole ; la ronde y marche. */
  fasilides(W, H) {
    const b = H - 8, x0 = Math.round(W * 0.26), x1 = Math.round(W * 0.66), wt = b - 13, md = 6, mw = 12, mg = 9;
    let d = `M0,${b} L${x0},${b} L${x0},${wt - md}`;
    let x = x0;
    const stops = [];
    while (x + mw + mg + mw <= x1) {
      d += ` L${x + mw},${wt - md} L${x + mw},${wt} L${x + mw + mg},${wt} L${x + mw + mg},${wt - md}`;
      stops.push(x + mw + mg);
      x += mw + mg;
    }
    d += ` L${x + mw},${wt - md} L${x + mw},${b} L${W},${b}`;
    const tx = stops[Math.floor(stops.length * 0.3)] || x0, tw = mw, tt = 6;
    const tower = `M${tx - 4},${wt - md} V${tt + 8} A${tw / 2 + 4},${tw / 2 + 4} 0 0 1 ${tx + tw + 4},${tt + 8} V${wt - md}`;
    return `<path class="b" d="${d}"/><path class="b" d="${tower}"/>
      <path class="oc march" d="M${x0 + 4},${wt + 4} L${x + mw - 4},${wt + 4}"/>`;
  },
  /* Afar : sous le niveau de la mer ; une caravane de sel traverse. */
  afar(W, H) {
    const sea = 10, flat = H - 10;
    let camels = '';
    /* La caravane : des points réguliers, pas un dessin. */
    for (let k = 0; k < 7; k++) camels += `<circle class="dot" cx="${k * 12}" cy="${flat - 4}" r="${k === 6 ? 3 : 2.4}"/>`;
    return `<line class="b2" x1="0" x2="${W}" y1="${sea}" y2="${sea}" stroke-dasharray="3 6"/>
      <path class="b2" d="M0,${flat - 9} C${W * 0.3},${flat - 4} ${W * 0.6},${flat - 13} ${W},${flat - 8}" stroke-dasharray="1 5"/>
      <line class="b" x1="0" x2="${W}" y1="${flat}" y2="${flat}"/>
      <g class="walk">${camels}</g>`;
  },
  /* Erta Ale : le cône, le lac de lave qui palpite, une coulée qui court. */
  'erta-ale'(W, H) {
    const b = H - 8, cx = Math.round(W * 0.56), w = 110, top = 12, nw = 13;
    const d = `M0,${b} L${cx - w},${b} C${cx - w * 0.45},${b} ${cx - nw - 10},${top} ${cx - nw},${top} L${cx - nw + 4},${top + 6} L${cx + nw - 4},${top + 6} L${cx + nw},${top} C${cx + nw + 10},${top} ${cx + w * 0.45},${b} ${cx + w},${b} L${W},${b}`;
    return `<path class="b" d="${d}"/><path class="hi run run--lava" pathLength="1000" d="${d}"/>
      <ellipse class="lava flick" cx="${cx}" cy="${top + 5}" rx="${nw - 5}" ry="2.4"/>`;
  },
  /* Addis Ababa : la rue, ses voies qui filent, et la base qui bat. */
  'addis-ababa'(W, H) {
    const m = H / 2 + 6, px = Math.round(W * 0.62);
    let sky = `M0,${m - 7}`;
    const r = rng(41);
    for (let x = Math.round(W * 0.42); x < W * 0.86; x += 12 + Math.round(r() * 10)) {
      const h = 4 + Math.round(r() * 13);
      sky += ` L${x},${m - 7} L${x},${m - 7 - h} L${x + 8},${m - 7 - h} L${x + 8},${m - 7}`;
    }
    sky += ` L${W},${m - 7}`;
    return `<path class="b2" d="${sky}"/><line class="b" x1="0" x2="${W}" y1="${m + 7}" y2="${m + 7}"/>
      <line class="oc lane" x1="0" x2="${W}" y1="${m}" y2="${m}"/>
      <circle class="ring ping" cx="${px}" cy="${m}" r="4"/><circle class="dot" cx="${px}" cy="${m}" r="3"/>`;
  },
  /* Winding Road : des lacets de plus en plus serrés ; la route file. */
  'winding-road'(W, H) {
    const m = H / 2, A = H / 2 - 7;
    let d = `M0,${m}`;
    let ph = 0;
    for (let x = 0; x <= W; x += 4) {
      const per = 220 - 150 * (x / W);
      ph += (4 / per) * Math.PI * 2;
      d += ` L${x},${f1(m + Math.sin(ph) * A)}`;
    }
    return `<path class="b" d="${d}"/><path class="oc road" d="${d}"/>`;
  },
  /* L'appel : une ligne de visée, le repère qui cherche. */
  bearing(W, H) {
    const m = H / 2;
    let ticks = '';
    for (let x = 0; x <= W; x += 40) ticks += `<line class="b2" x1="${x}" x2="${x}" y1="${m - 3}" y2="${m + 3}"/>`;
    return `<line class="b" x1="0" x2="${W}" y1="${m}" y2="${m}" stroke-dasharray="1 5"/>${ticks}
      <g class="bear" style="--w:${W - 16}px"><path class="dot" d="M2,${m - 12} l6,9 l6,-9z"/><circle class="ring" cx="8" cy="${m}" r="5"/></g>`;
  }
};

function paintDiv(svg, kind, seed) {
  const W = Math.round(svg.clientWidth), H = Math.round(svg.clientHeight);
  if (W < 20 || !H || Number(svg.dataset.w) === W) return;
  svg.dataset.w = String(W);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.setProperty('--w', `${W}px`);
  svg.innerHTML = `<g class="all">${(D[kind] || D['winding-road'])(W, H, rng(seed))}</g>`;
}

function divider(host, kind, label, seed) {
  const div = document.createElement('div');
  div.className = 'ol-div';
  div.setAttribute('aria-hidden', 'true');
  div.innerHTML = `${label ? `<span class="ol-div__n">${label}</span>` : ''}<svg class="ol-div__s" xmlns="http://www.w3.org/2000/svg" focusable="false"></svg>`;
  host.prepend(div);
  optOut(div);
  const svg = div.querySelector('svg');
  paintDiv(svg, kind, seed);
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => paintDiv(svg, kind, seed), 100); }).observe(svg);
  return svg;
}

/* ═══════════════════════ LE SIGNE DE CARTE ═══════════════════════
   Les courbes de niveau du lieu (plus d'anneaux plus il est haut, en
   tirets sous le niveau de la mer), et son signe : le sommet, le lac, la
   croix, la ville, le château, la lave, la dépression, la route. */
function hill(slug, alt, i) {
  const r = rng(1000 + i * 97);
  const n = alt == null ? 5 : Math.max(3, Math.round(3 + 6 * (alt - range.low) / range.span));
  const below = alt != null && alt < 0;
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  const am = [0.07 + r() * 0.05, 0.05 + r() * 0.04, 0.03 + r() * 0.02];
  const dx = (r() - 0.5) * 9, dy = (r() - 0.5) * 9;
  let rings = '';
  let cx = 50, cy = 50;
  for (let k = 0; k < n; k++) {
    const R = 45 - k * (36 / n);
    cx = 50 + dx * (k / n); cy = 50 + dy * (k / n);
    const P = [];
    for (let s = 0; s < 28; s++) {
      const th = (s / 28) * Math.PI * 2;
      const w = 1 + (am[0] * Math.sin(2 * th + ph[0]) + am[1] * Math.sin(3 * th + ph[1]) + am[2] * Math.sin(5 * th + ph[2])) * (1 + k * 0.12);
      P.push({ x: cx + Math.cos(th) * R * w, y: cy + Math.sin(th) * R * w * 0.92 });
    }
    rings += `<path class="ol-hill__r${below ? ' ol-hill__r--dash' : ''}" style="--k:${k}" d="${smooth(P, true)}"/>`;
  }
  const x = f1(cx), y = f1(cy);
  const SYM = {
    'simien-mountains': `<path class="ol-hill__sym" d="M${x - 6},${y + 4} L${x},${y - 7} L${x + 6},${y + 4}Z"/>`,
    wonchi: `<ellipse class="ol-hill__water" cx="${x}" cy="${y}" rx="9" ry="6.5"/>`,
    lalibela: `<path class="ol-hill__sym-l" d="M${x},${y - 7} V${y + 7} M${x - 5},${y - 2} H${x + 5}"/>`,
    'addis-ababa': `<circle class="ol-hill__sym-l" cx="${x}" cy="${y}" r="5"/><circle class="ol-hill__sym" cx="${x}" cy="${y}" r="2"/>`,
    wollo: `<ellipse class="ol-hill__water" cx="${x}" cy="${y}" rx="11" ry="5.5"/><path class="ol-hill__sym-l" d="M${x - 5},${y - 1} Q${x},${y + 2.5} ${x + 5},${y - 1.5}"/>`,
    fasilides: `<path class="ol-hill__sym-l" d="M${x - 6},${y + 5} V${y - 4} H${x - 3.5} V${y - 6} H${x - 1} V${y - 4} H${x + 1} V${y - 6} H${x + 3.5} V${y - 4} H${x + 6} V${y + 5}Z"/>`,
    'erta-ale': `<ellipse class="ol-hill__lava" cx="${x}" cy="${y}" rx="6" ry="4"/>`,
    afar: `<path class="ol-hill__sym" d="M${x - 6},${y - 4} L${x + 6},${y - 4} L${x},${y + 6}Z"/>`,
    'winding-road': `<path class="ol-hill__sym-l" d="M${x - 14},${y + 9} C${x - 4},${y + 9} ${x + 4},${y + 1} ${x - 4},${y - 1} S${x + 4},${y - 10} ${x + 14},${y - 9}" stroke-dasharray="3 2.5"/>`
  };
  return `<svg class="ol-hill" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g>${rings}${SYM[slug] || ''}</g></svg>`;
}

/* ═══════════════════════ LES FICHES ═══════════════════════ */
function sheets() {
  const total = pad(cards.length);
  cards.forEach((li, i) => {
    const loc = bySlug[li.id] || {};
    li.setAttribute('data-ol-live', '');
    watch(li);
    divider(li, li.id, `${pad(i + 1)}<small> / ${total}</small>`, 300 + i * 13);

    const fig = li.querySelector('.loc__fig');
    fig.insertAdjacentHTML('beforeend', `<div class="ol-vf" aria-hidden="true">
      <i class="ol-vf__g"></i><i class="ol-vf__m ol-vf__m--t"></i><i class="ol-vf__m ol-vf__m--b"></i>
      <i class="ol-vf__c ol-vf__c--tl"></i><i class="ol-vf__c ol-vf__c--tr"></i><i class="ol-vf__c ol-vf__c--bl"></i><i class="ol-vf__c ol-vf__c--br"></i>
      <i class="ol-vf__x"></i><span class="ol-vf__fmt"><span>3:2</span><span>2.39:1</span></span>
    </div>`);
    const mh = () => fig.style.setProperty('--mh', `${(fig.clientHeight * 0.1862).toFixed(1)}px`);
    mh();
    new ResizeObserver(mh).observe(fig);
    /* Au toucher : un appui sur la photo la cadre en 2,39:1, un autre la rend. */
    if (LITE) fig.addEventListener('click', () => li.classList.toggle('is-framed'));

    li.querySelector('.loc__t')?.insertAdjacentHTML('afterbegin', hill(li.id, loc.alt, i));
  });
}

/* L'entrée d'une fiche : l'obturateur du viseur s'ouvre, les coins se
   posent, le relief se dessine, la fiche s'écrit. Une fois. */
function entrances() {
  if (REDUCED) return;
  const plays = new Map();
  cards.forEach((li) => {
    const fig = li.querySelector('.loc__fig');
    const img = fig.querySelector('img');
    const vf = fig.querySelector('.ol-vf');
    vf.insertAdjacentHTML('beforeend', '<i class="ol-vf__s ol-vf__s--l"></i><i class="ol-vf__s ol-vf__s--r"></i>');
    const sh = vf.querySelectorAll('.ol-vf__s');
    const corners = vf.querySelectorAll('.ol-vf__c, .ol-vf__x, .ol-vf__fmt');
    const text = li.querySelectorAll('.ol-alt, .loc__note, .loc__credit');
    const rings = li.querySelectorAll('.ol-hill path, .ol-hill ellipse, .ol-hill circle');
    const strip = li.querySelector('.ol-div');
    gsap.set(sh, { scaleX: 1 });
    gsap.set(img, { scale: 1.12 });
    gsap.set(corners, { autoAlpha: 0 });
    gsap.set(text, { autoAlpha: 0, y: 14 });
    gsap.set(rings, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' });
    gsap.set(strip, { clipPath: 'inset(0 100% 0 0)' });
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      .to(strip, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath' }, 0)
      .to(sh, { scaleX: 0, duration: 1.05, ease: 'expo.inOut' }, 0.12)
      .to(img, { scale: 1, duration: 1.6 }, 0.12)
      .to(corners, { autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: 'power2.out', clearProps: 'opacity,visibility' }, 0.75)
      .to(rings, { autoAlpha: 1, scale: 1, duration: 0.9, stagger: { each: 0.05, from: 'end' }, clearProps: 'opacity,visibility,transform' }, 0.3)
      .to(text, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', clearProps: 'opacity,visibility,transform' }, 0.5)
      .add(() => sh.forEach((s) => s.remove()));
    plays.set(li, tl);
  });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
      io.unobserve(e.target);
      plays.get(e.target)?.play();
    }
  }, { rootMargin: '0px 0px -16% 0px' });
  cards.forEach((li) => io.observe(li));

  /* La photo glisse à peine dans son viseur (ordinateur seulement). */
  if (!LITE && matchMedia('(min-width: 72rem) and (hover: hover)').matches) {
    cards.forEach((li) => {
      const fig = li.querySelector('.loc__fig');
      gsap.fromTo(fig.querySelector('img'), { yPercent: -3.5 }, {
        yPercent: 3.5, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }
}

/* ═══════════════════════ L'ALTIMÈTRE ═══════════════════════ */
function altimeter() {
  const rail = document.querySelector('.ol-rail');
  const pos = (alt) => (range.high - alt) / range.span;
  let alm = null, sc = null, nd = null, no = null, val = null;
  if (rail) {
    let ticks = '';
    for (let a = 4500; a >= 0; a -= 250) ticks += `<i class="ol-alm__t${a % 1000 === 0 ? ' ol-alm__t--k' : ''}" style="--y:${(pos(a) * 100).toFixed(2)}%"></i>`;
    const locs = LOCS.filter((l) => l.alt != null).map((l) => `<i class="ol-alm__loc" data-slug="${l.slug}" style="--y:${(pos(l.alt) * 100).toFixed(2)}%"></i>`).join('');
    rail.innerHTML = `<div class="ol-alm">
      <span class="ol-alm__end"><b>${fmt(range.high)}</b> m</span>
      <div class="ol-alm__sc">${ticks}<i class="ol-alm__sea" style="--y:${(pos(0) * 100).toFixed(2)}%"><span>0</span></i>${locs}<span class="ol-alm__nd"></span></div>
      <span class="ol-alm__end"><b>${fmt(range.low)}</b> m</span>
      <div class="ol-alm__read"><span class="ol-alm__no">01 / ${pad(cards.length)}</span><span class="ol-alm__v"></span></div>
    </div>`;
    alm = rail.firstElementChild;
    sc = alm.querySelector('.ol-alm__sc');
    nd = alm.querySelector('.ol-alm__nd');
    no = alm.querySelector('.ol-alm__no');
    val = alm.querySelector('.ol-alm__v');
  }
  let cur = -1;
  let curAlt = null;
  const place = (instant) => {
    if (!nd || curAlt == null) return;
    gsap.to(nd, { y: pos(curAlt) * sc.clientHeight, duration: instant || REDUCED ? 0 : 1.15, ease: 'expo.out', overwrite: true });
  };
  const setActive = (i) => {
    if (i === cur) return;
    const first = cur < 0;
    cur = i;
    cards.forEach((c, k) => c.classList.toggle('is-cur', k === i));
    if (!alm) return;
    const loc = bySlug[cards[i].id] || {};
    const alt = loc.alt ?? null;
    no.textContent = `${pad(i + 1)} / ${pad(cards.length)}`;
    alm.classList.toggle('is-off', alt == null);
    alm.querySelectorAll('.ol-alm__loc').forEach((m) => m.classList.toggle('is-on', m.dataset.slug === cards[i].id));
    if (alt != null) { curAlt = alt; place(first); }
    /* Le chiffre tourne comme un compteur : l'ancien monte, le nouveau
       arrive par-dessous. Jamais de chiffre intermédiaire. */
    const b = document.createElement('b');
    b.innerHTML = alt == null ? '&mdash;' : `${fmt(alt)}<small>m</small>`;
    const old = val.querySelector('b');
    val.append(b);
    if (REDUCED || first || !old) { old?.remove(); return; }
    gsap.fromTo(b, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
    gsap.to(old, { yPercent: -100, autoAlpha: 0, duration: 0.5, ease: 'expo.out', onComplete: () => old.remove() });
  };
  cards.forEach((li, i) => ScrollTrigger.create({
    trigger: li, start: 'top 58%', end: 'bottom 58%',
    onToggle: (self) => { if (self.isActive) setActive(i); }
  }));
  setActive(0);
  if (sc) new ResizeObserver(() => place(true)).observe(sc);
}

/* ═══════════════════════ L'APPEL ═══════════════════════ */
function cta() {
  const box = document.querySelector('.locs__cta');
  const map = box?.querySelector('.ol-cta__map');
  if (!box || !map) return;
  optOut(map);
  watch(box);
  divider(box, 'bearing', '', 77);
  let lastW = 0;
  const build = () => {
    const W = Math.round(map.clientWidth), H = Math.round(map.clientHeight);
    if (!W || !H || W === lastW) return;
    lastW = W;
    const narrow = W < 640;
    const r = rng(2024);
    const hillAt = (hx, hy, n, R0, cls) => {
      let s = '';
      const ph = [r() * 6.28, r() * 6.28];
      for (let k = 0; k < n; k++) {
        const R = R0 * (1 - k / (n + 0.6));
        const P = [];
        for (let q = 0; q < 30; q++) {
          const th = (q / 30) * Math.PI * 2;
          const w = 1 + 0.12 * Math.sin(2 * th + ph[0]) + 0.06 * Math.sin(3 * th + ph[1]);
          P.push({ x: hx + Math.cos(th) * R * w * 1.35, y: hy + Math.sin(th) * R * w * 0.8 });
        }
        s += `<path class="${k % 3 === 2 ? 'c2' : cls}" d="${smooth(P, true)}"/>`;
      }
      return s;
    };
    /* Sur téléphone, l'itinéraire passe au-dessus du titre, dans la bande
       que la fiche lui laisse ; sur ordinateur, il traverse la carte. */
    const bx = W * 0.12, by = narrow ? 104 : H * 0.74;
    const zx = narrow ? W * 0.84 : W * 0.86, zy = narrow ? 96 : H * 0.3;
    const route = narrow
      ? `M${f1(bx)},${f1(by)} C${f1(bx + W * 0.22)},${f1(by - 40)} ${f1(zx - W * 0.3)},${f1(zy + 34)} ${f1(zx - 28)},${f1(zy + 6)}`
      : `M${f1(bx)},${f1(by)} C${f1(bx + W * 0.2)},${f1(by - H * 0.05)} ${f1(zx - W * 0.32)},${f1(zy + H * 0.5)} ${f1(zx - 30)},${f1(zy + 22)}`;
    map.innerHTML = `<svg viewBox="0 0 ${W} ${H}" focusable="false">
      ${hillAt(W * 0.08, H * 0.18, narrow ? 4 : 6, narrow ? 70 : 120, 'c')}
      ${hillAt(W * 0.94, H * 0.86, narrow ? 4 : 6, narrow ? 60 : 110, 'c')}
      ${narrow ? '' : hillAt(W * 0.5, H * 1.05, 5, 150, 'c')}
      <path class="route" d="${route}"/>
      <circle class="ping" cx="${f1(bx)}" cy="${f1(by)}" r="5"/><circle class="base" cx="${f1(bx)}" cy="${f1(by)}" r="4"/>
      <text class="lab" x="${f1(bx - 4)}" y="${f1(by + 20)}">Addis Ababa</text>
      <circle class="zone2" cx="${f1(zx)}" cy="${f1(zy)}" r="${narrow ? 19 : 38}"/>
      <circle class="zone" cx="${f1(zx)}" cy="${f1(zy)}" r="${narrow ? 23 : 44}"/>
      <g class="pin"><text class="q" x="${f1(zx)}" y="${f1(zy + (narrow ? 8 : 10))}" text-anchor="middle"${narrow ? ' style="font-size:22px"' : ''}>?</text></g>
    </svg>`;
  };
  build();
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(build, 120); }).observe(map);
}

/* ═══════════════════════ LE DÉMARRAGE ═══════════════════════ */
const hero = document.querySelector('.ol-hero');
watch(hero);
watch(document.querySelector('.ftr'));
topo();
profile();
sheets();
entrances();
altimeter();
cta();
