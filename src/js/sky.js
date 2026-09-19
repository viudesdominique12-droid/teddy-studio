/**
 * LE CIEL — quatre calques de canvas 2D, fixes derrière toute la page.
 *
 * Trois idées portent la performance :
 *  1. les étoiles sont dessinées UNE fois ; le scintillement est délégué au CSS
 *     sur deux calques (coût JS nul par frame, quel que soit le nombre d'étoiles) ;
 *  2. les filantes n'effacent que leurs propres rectangles, jamais tout l'écran ;
 *  3. la traîne est tracée en 2 passes × 11 seaux d'alpha au lieu d'un `shadowBlur`
 *     (qui est un flou gaussien calculé par le CPU à chaque frame).
 */

const DPR_CAP = 1.5;

/* étoiles */
const DENSITY = 0.000135;   // étoiles par px²
const MAX_STARS = 320;
const R_MIN = 0.45, R_MAX = 1.6;
const GLOW_SHARE = 0.20;
const GOLD_SHARE = 0.28;
const BASE_ALPHA = 0.74;
const TWINKLE_SHARE = 0.30;
const C_PALE = [226, 236, 222];
const C_GOLD = [255, 214, 140];

/* filantes */
const RAILS = 9;
const AT_ONCE = 2;
const SPEED_MIN = 0.0020, SPEED_MAX = 0.0044;
const TAIL = 0.13;
const PAUSE_MIN = 3200, PAUSE_MAX = 13000;
const PAUSE_EXTRA_CHANCE = 0.35, PAUSE_EXTRA = 9000;
const FLARE_RGB = [255, 226, 168];
const FLARE_ALPHA = 0.8;
const HEAD_PX = 20;
const TAIL_W = 1.5;
const ALPHA_STEPS = 10;

/* fondu d'entrée */
const FADE_MS = 1400;

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function initSky() {

  if (window.__teddySky) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const wrap = document.createElement('div');
  wrap.className = 'sky';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.opacity = '0';           // posé AVANT insertion, sinon un frame flashe

  const mk = (cls) => {
    const c = document.createElement('canvas');
    c.className = 'sky__l' + (cls ? ' ' + cls : '');
    wrap.appendChild(c);
    return c;
  };
  const cvS = mk('');            // étoiles fixes
  const cvA = mk('sky__tw-a');   // scintillement A
  const cvB = mk('sky__tw-b');   // scintillement B
  const cvF = mk('sky__flares'); // filantes

  const ctxS = cvS.getContext('2d');
  const ctxA = cvA.getContext('2d');
  const ctxB = cvB.getContext('2d');
  const ctxF = cvF.getContext('2d');
  if (!ctxS || !ctxA || !ctxB || !ctxF) return;   // pas de calques vides

  document.body.appendChild(wrap);

  // Les calques de profondeur, posés APRÈS le ciel. À z-index égal c'est
  // l'ordre du DOM qui décide : placés avant, le canvas les recouvrait et les
  // étoiles restaient claires alors que c'est justement elles qu'on assombrit.
  for (const cls of ['depth', 'depth-glow']) {
    if (document.querySelector('.' + cls)) continue;
    const layer = document.createElement('div');
    layer.className = cls;
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }

  let W = 0, H = 0, dpr = 1, lastW = -1;
  let stars = [], rails = [], flares = [];
  let running = false, visible = true, lastTime = 0, runId = 0;
  const dirty = [];

  /* ── le sprite de tête, rendu une seule fois ── */
  const headSprite = (() => {
    const s = document.createElement('canvas');
    s.width = s.height = HEAD_PX * 2;
    const c = s.getContext('2d');
    const g = c.createRadialGradient(HEAD_PX, HEAD_PX, 0, HEAD_PX, HEAD_PX, HEAD_PX);
    const [r, gr, b] = FLARE_RGB;
    g.addColorStop(0.00, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.12, `rgba(${r},${gr},${b},0.75)`);
    g.addColorStop(0.34, `rgba(${r},${gr},${b},0.22)`);
    g.addColorStop(0.70, `rgba(${r},${gr},${b},0.05)`);
    g.addColorStop(1.00, `rgba(${r},${gr},${b},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, s.width, s.height);
    return s;
  })();

  /* ── semer ── */
  function seed() {
    const n = Math.min(MAX_STARS, Math.round(W * H * DENSITY));
    stars = new Array(n);
    for (let i = 0; i < n; i++) {
      // pow(rand, 2.4) : beaucoup de minuscules, peu de grosses
      const t = Math.pow(Math.random(), 2.4);
      stars[i] = {
        x: Math.random() * W,
        y: Math.random() * H,
        r: R_MIN + t * (R_MAX - R_MIN),
        a: BASE_ALPHA * (0.35 + 0.65 * Math.random()),
        gold: Math.random() < GOLD_SHARE,
        glow: Math.random() < GLOW_SHARE,
        layer: Math.random() < TWINKLE_SHARE ? (Math.random() < 0.5 ? 1 : 2) : 0
      };
    }
  }

  function paintStar(ctx, s) {
    const [r, g, b] = s.gold ? C_GOLD : C_PALE;
    if (s.glow) {
      const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 7);
      gr.addColorStop(0, `rgba(${r},${g},${b},${s.a * 0.5})`);
      gr.addColorStop(0.4, `rgba(${r},${g},${b},${s.a * 0.13})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 7, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = `rgba(${r},${g},${b},${s.a})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
  }

  /** Dessiné une seule fois : ensuite on n'y touche plus. */
  function paintStars() {
    for (const c of [ctxS, ctxA, ctxB]) c.clearRect(0, 0, W, H);
    for (const s of stars) paintStar(s.layer === 1 ? ctxA : s.layer === 2 ? ctxB : ctxS, s);
  }

  /* ── les rails : Bézier quadratique + onde sur la normale ── */
  function railPoints() {
    const edge = Math.floor(Math.random() * 4);
    let sx, sy;
    if (edge === 0) { sx = rnd(0, W); sy = rnd(-0.04 * H, 0.05 * H); }
    else if (edge === 1) { sx = rnd(0.95 * W, 1.03 * W); sy = rnd(0, H); }
    else if (edge === 2) { sx = rnd(0, W); sy = rnd(0.95 * H, 1.03 * H); }
    else { sx = rnd(-0.03 * W, 0.05 * W); sy = rnd(0, H); }

    // cible dans une ellipse aplatie autour du centre
    const w = Math.random() * 6.2832, rr = Math.sqrt(Math.random());
    const tx = (0.5 + 0.30 * rr * Math.cos(w)) * W;
    const ty = (0.5 + 0.18 * rr * Math.sin(w)) * H;
    // la course s'arrête AVANT la cible : la filante s'éteint dans le vide
    const f = rnd(0.30, 0.95);
    const ex = sx + (tx - sx) * f, ey = sy + (ty - sy) * f;

    const len = Math.hypot(ex - sx, ey - sy) || 1;
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const belly = len * rnd(0.02, 0.11), ang = rnd(-Math.PI, Math.PI);
    const cx = mx + Math.cos(ang) * belly, cy = my + Math.sin(ang) * belly;
    const amp = len * rnd(0.004, 0.018), freq = rnd(1.2, 2.6);
    const nx = -(ey - sy) / len, ny = (ex - sx) / len;

    const N = 140, p = new Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      const x = u * u * sx + 2 * u * t * cx + t * t * ex;
      const y = u * u * sy + 2 * u * t * cy + t * t * ey;
      const hull = Math.sin(t * Math.PI);          // l'onde s'annule aux deux bouts
      const off = Math.sin(t * Math.PI * freq) * amp * hull;
      p[i] = { x: x + nx * off, y: y + ny * off };
    }
    return p;
  }

  function buildRails() {
    rails = new Array(RAILS);
    flares = new Array(RAILS);
    for (let i = 0; i < RAILS; i++) {
      rails[i] = railPoints();
      flares[i] = newFlare(i, true);
    }
  }

  function newFlare(i, initial) {
    return {
      rail: i,
      progress: 0,
      speed: rnd(SPEED_MIN, SPEED_MAX),
      tail: TAIL * rnd(0.7, 1.35),
      size: rnd(0.7, 1.35),
      pauseUntil: performance.now() + (initial ? Math.random() * PAUSE_MAX : 0),
      drain: null,
      tA: rnd(0.3, 1.4), tB: rnd(0.25, 1.5),
      pA: Math.random() * 6.2832, pB: Math.random() * 6.2832,
      bias: rnd(0.5, 1.6), curve: Math.floor(Math.random() * 3)
    };
  }

  /** La vitesse irrégulière : c'est elle qui rend la course vivante. */
  function tempo(f, t) {
    const a = t * f.tA + f.pA, b = t * f.tB + f.pB;
    let v;
    if (f.curve === 0) v = 0.2 + 1.05 * (0.5 + 0.5 * (0.5 * Math.sin(a) + 0.5 * Math.sin(b)));
    else if (f.curve === 1) { const s = Math.sin(a) * Math.sin(1.63 * b); v = 0.16 + 1.08 * s * s; }
    else v = 0.34 + 0.62 * (0.5 + 0.5 * Math.sin(a * 0.31));
    return Math.min(2.1, Math.max(0.07, v * f.bias));
  }

  function pointOn(p, t) {
    const N = p.length - 1, f = clamp01(t) * N;
    const i = Math.min(N - 1, Math.floor(f)), r = f - i;
    return { x: p[i].x + (p[i + 1].x - p[i].x) * r, y: p[i].y + (p[i + 1].y - p[i].y) * r };
  }

  /** Trace une filante et renvoie son rectangle sale. */
  function paintFlare(f, head, tailPos, fade) {
    const p = rails[f.rail];
    const segN = 26;
    const pts = new Array(segN + 1);
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let s = 0; s <= segN; s++) {
      const t = tailPos + (head - tailPos) * (s / segN);
      const pt = pointOn(p, t);
      pts[s] = pt;
      if (pt.x < minX) minX = pt.x; if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y; if (pt.y > maxY) maxY = pt.y;
    }

    const [r, g, b] = FLARE_RGB;
    ctxF.lineCap = 'round'; ctxF.lineJoin = 'round';

    // 2 passes (large et diffuse, puis fine et dense) × 11 seaux d'alpha
    for (let pass = 0; pass < 2; pass++) {
      const basis = fade * FLARE_ALPHA * (pass === 0 ? 0.12 : 0.55);
      ctxF.lineWidth = (pass === 0 ? TAIL_W * 3.2 : TAIL_W) * f.size;
      const buckets = new Array(ALPHA_STEPS + 1);
      for (let s = 1; s <= segN; s++) {
        const tt = s / segN;
        const a = tt * tt * basis;
        if (a < 0.004) continue;
        const step = Math.round((a / basis) * ALPHA_STEPS);
        (buckets[step] || (buckets[step] = [])).push(s);
      }
      for (let st = 0; st <= ALPHA_STEPS; st++) {
        const seg = buckets[st];
        if (!seg) continue;
        ctxF.strokeStyle = `rgba(${r},${g},${b},${(basis * st / ALPHA_STEPS).toFixed(3)})`;
        ctxF.beginPath();
        for (const s of seg) { ctxF.moveTo(pts[s - 1].x, pts[s - 1].y); ctxF.lineTo(pts[s].x, pts[s].y); }
        ctxF.stroke();
      }
    }

    // la tête disparaît dès que la queue la rattrape
    if (!f.drain) {
      const sz = HEAD_PX * f.size;
      const last = pts[segN];
      ctxF.globalAlpha = Math.min(1, fade * 0.8);
      ctxF.drawImage(headSprite, last.x - sz, last.y - sz, sz * 2, sz * 2);
      ctxF.globalAlpha = 1;
      if (last.x - sz < minX) minX = last.x - sz;
      if (last.x + sz > maxX) maxX = last.x + sz;
      if (last.y - sz < minY) minY = last.y - sz;
      if (last.y + sz > maxY) maxY = last.y + sz;
    }

    // arrondi au pixel appareil, sinon clearRect laisse des résidus
    const pad = TAIL_W * 3.2 * f.size + 2;
    const x0 = Math.floor((minX - pad) * dpr) / dpr;
    const y0 = Math.floor((minY - pad) * dpr) / dpr;
    const x1 = Math.ceil((maxX + pad) * dpr) / dpr;
    const y1 = Math.ceil((maxY + pad) * dpr) / dpr;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ── la boucle ── */
  function frame() {
    const now = performance.now();
    const dt = lastTime ? Math.min(50, now - lastTime) : 16;   // clamp anti-saut d'onglet
    lastTime = now;
    const tSec = now * 0.001;

    for (const r of dirty) ctxF.clearRect(r.x, r.y, r.w, r.h);
    const hadContent = dirty.length > 0;
    dirty.length = 0;

    let live = 0;
    for (const f of flares) if (f.drain || f.progress > 0) live++;

    for (let i = 0; i < flares.length; i++) {
      const f = flares[i];

      if (f.drain) {
        f.drain.tail += f.speed * tempo(f, tSec) * (dt / 16.67) * 0.8;
        if (f.drain.tail >= f.drain.head - 0.002) {
          const extra = Math.random() < PAUSE_EXTRA_CHANCE ? Math.random() * PAUSE_EXTRA : 0;
          flares[i] = newFlare(f.rail, false);
          flares[i].pauseUntil = now + rnd(PAUSE_MIN, PAUSE_MAX) + extra;
          continue;
        }
        dirty.push(paintFlare(f, f.drain.head, f.drain.tail, 1));
        continue;
      }

      if (now < f.pauseUntil) continue;
      if (f.progress === 0 && live >= AT_ONCE) { f.pauseUntil = now + rnd(600, 2200); continue; }
      if (f.progress === 0) live++;

      f.progress += f.speed * tempo(f, tSec) * (dt / 16.67);
      if (f.progress >= 1) { f.drain = { head: 1, tail: Math.max(0, 1 - f.tail) }; continue; }

      const fade = Math.min(1, f.progress / 0.14) * Math.min(1, (1 - f.progress) / 0.22);
      if (fade <= 0.01) continue;
      dirty.push(paintFlare(f, f.progress, Math.max(0, f.progress - f.tail), fade));
    }

    // le ciel vient de se vider : un seul clear complet, puis plus rien
    if (hadContent && dirty.length === 0) ctxF.clearRect(0, 0, W, H);
  }

  /* Une exception ici emporterait Lenis et tous les scrubs : on se désinscrit. */
  function tick() {
    try { frame(); }
    catch (e) { stop(); console.error('[teddy] sky:', e); }
  }

  function startScene() {
    if (running || !visible || reduced) return;
    running = true;
    lastTime = 0;
    if (window.gsap && gsap.ticker) { gsap.ticker.add(tick); return; }
    const id = ++runId;
    (function loop() {
      if (!running || id !== runId) return;
      if (window.gsap && gsap.ticker) { gsap.ticker.add(tick); return; }   // GSAP arrive : on bascule
      tick();
      requestAnimationFrame(loop);
    })();
  }

  function stop() {
    running = false;
    runId++;
    if (window.gsap && gsap.ticker) gsap.ticker.remove(tick);
  }

  function resize(force) {
    const w = window.innerWidth, h = window.innerHeight;
    // Reconstruire seulement si la LARGEUR bouge : la barre d'adresse mobile
    // fait osciller innerHeight en permanence.
    if (!force && w === lastW) return;
    lastW = w;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    for (const cv of [cvS, cvA, cvB, cvF]) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      const c = cv.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.scale(dpr, dpr);
    }
    seed();
    paintStars();
    buildRails();
    dirty.length = 0;
  }

  resize(true);

  if (reduced) {
    cvF.style.display = 'none';
    wrap.classList.add('sky--still');
    wrap.style.opacity = '';
    window.__teddySky = { wrap };
    return;
  }

  // La transition court sur le WRAPPER : les calques portent leurs propres
  // keyframes de scintillement, le compositor multiplie les deux.
  wrap.style.transition = `opacity ${FADE_MS}ms var(--e-sky, cubic-bezier(0.33,0,0.25,1))`;
  let faded = false;
  const fadeIn = () => {
    if (faded) return;
    faded = true;
    wrap.style.opacity = '1';
    setTimeout(() => { wrap.style.transition = ''; wrap.style.opacity = ''; }, FADE_MS + 150);
  };
  // Deux rAF imbriqués : la transition a besoin d'une valeur de départ réellement
  // peinte, sinon le navigateur fusionne les deux états et saute à 1.
  requestAnimationFrame(() => requestAnimationFrame(fadeIn));
  setTimeout(fadeIn, 400);   // filet pour l'onglet caché, où rAF ne tire jamais

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    lastTime = 0;
    visible ? startScene() : stop();
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => resize(false), 200);
  });

  if (document.visibilityState === 'visible') startScene();

  window.__teddySky = { wrap, stars, rails, flares, stop, start: startScene };
}
