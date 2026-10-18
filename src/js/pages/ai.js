/**
 * AI PRODUCTION — « du bruit à la vision » (17/10/2026).
 *
 * L'OUVERTURE. Un champ de points dessiné par un petit shader WebGL (sans
 * three.js : un seul triangle plein écran). Au départ, du bruit qui scintille
 * partout ; en deux secondes et demie, un anneau de lumière violette se forme
 * autour du titre et l'intérieur s'éclaircit. La souris fait la mise au point :
 * là où elle passe, le bruit devient une trame nette et violette. À la
 * descente, l'anneau s'ouvre, comme si l'on passait à travers l'objectif.
 * C'est un motif abstrait (aria-hidden), jamais présenté comme une image
 * produite par une IA.
 *
 * LE PROCESSUS. Un écran de points (canvas 2D) suit les cinq étapes : du
 * bruit (le brief), une esquisse (le concept), neuf variantes (le
 * développement assisté), le choix et ses traits de coupe (la direction
 * humaine), l'image finie (la livraison). Le défilement choisit l'étape ; la
 * transformation se joue dans le temps (1,1 s), en vague, jamais à-coups.
 *
 * LA DEMANDE (18/10). Un « studio du brief » : la fiche, à côté du
 * formulaire, compose en direct les réponses du visiteur en un brief propre.
 * Elle ne fait que remettre en ordre SES mots — rien n'est généré. Son
 * anneau de points se ferme à mesure que le brief se remplit ; à l'envoi, la
 * fiche passe du grain au net. Le formulaire lui-même reste celui de
 * `inquiry.js` (noms, valeurs, vérifications, envoi) : on ne fait qu'écouter.
 *
 * ENTRE LES DEUX (18/10, « que chaque page vive de son thème ») : les
 * sections du milieu vivent du même geste — voir `ai-world.js` (titres qui se
 * décodent, filets de points, trames de l'approche, moniteur des services,
 * étiquettes dessinées, flux du processus, cases vides du portfolio).
 *
 * Économie : sur écran tactile, le champ est dessiné à 1,25× au plus et à
 * 30 images/s ; tout s'arrête hors de l'écran ou quand l'onglet est caché. En
 * mouvement réduit : une seule image, puis plus rien. Sans WebGL : une trame
 * fixe en CSS.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { initWorld } from './ai-world.js';

/* Le bouton d'envoi a disparu avec le formulaire : le clavier passe au titre
   de la confirmation, un instant après — pendant le fondu d'inquiry.js, un
   élément encore `visibility: hidden` refuse le focus (relecture du 18/10). */
function focusDone(box, n = 0) {
  const h = box?.querySelector('h3');
  if (!h || document.activeElement === h) return;
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
  if (document.activeElement !== h && n < 10) window.setTimeout(() => focusDone(box, n + 1), 80);
}

gsap.registerPlugin(ScrollTrigger);


/* ─────────────── Les couleurs du thème, lues sur la page ───────────────
   Lues DANS l'élément qui les montre (`host`) : le contenu de la page porte
   les couleurs de la division, et en Papier une section `.dv-night` porte sa
   nuit — le corps de la page, lui, garde celles de la marque. */
function readColor(expr, host = document.body) {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;color:${expr}`;
  host.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const m = c.match(/[\d.]+/g) || ['255', '255', '255'];
  // `color(srgb r g b)` donne des valeurs entre 0 et 1 ; `rgb()` entre 0 et 255.
  const scale = c.startsWith('color(') ? 1 : 1 / 255;
  return [Number(m[0]) * scale, Number(m[1]) * scale, Number(m[2]) * scale];
}
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/* ═══════════════════ L'OUVERTURE : LE CHAMP ═══════════════════
   Deux passes. La première calcule, pour chaque cellule de la trame (une
   petite texture, ~200 × 130), le bruit, l'anneau, la mise au point ; la
   seconde dessine, pixel par pixel, le point de sa cellule. Le bruit n'est
   donc calculé qu'une fois par point, pas une fois par pixel : sur un
   téléphone, c'est cent fois moins de travail. */
const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const COMMON = `
precision highp float;
uniform float uCell, uR, uResolve;
uniform vec2 uCenter;
uniform vec4 uQuiet;
float ringRes(float d) {
  float e = mix(-0.3, 2.05, uResolve);
  float edge = 1.0 - smoothstep(e - 0.65, e, d);
  float fade = smoothstep(0.25, 0.95, uResolve) * (1.0 - smoothstep(1.15, 1.95, d));
  return max(edge, fade);
}
float quietAt(vec2 c) { vec2 q = max(abs(c - uQuiet.xy) - uQuiet.zw, 0.0); return 1.0 - smoothstep(0.0, uCell * 9.0, length(q)); }
`;
const FIELD = (oct) => `${COMMON}
uniform float uTime, uLens, uLensR;
uniform vec2 uPtr;
float hash(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < ${oct}; i++) { v += a * noise(p); p = p * 2.03 + vec2(3.1, 1.7); a *= 0.5; }
  return v;
}
void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 cc = (cell + 0.5) * uCell;
  float t = uTime;

  /* Le bruit : un champ qui coule lentement (fbm déformé). */
  vec2 p = cc / (uCell * 30.0);
  vec2 w = vec2(fbm(p + vec2(0.0, t * 0.04)), fbm(p + vec2(5.2, 1.3) - t * 0.035));
  float n = smoothstep(0.3, 0.74, fbm(p * 1.25 + w * 1.7 + vec2(t * 0.025, 0.0)));

  /* L'anneau : un filet net, une couronne de rayons au-dehors, une lueur courte au-dedans. */
  vec2 dp = cc - uCenter;
  float dl = length(dp);
  float d = dl / uR;
  vec2 dir = dp / max(dl, 1.0);
  float ry = noise(dir * 4.6 + vec2(d * 1.4 - t * 0.06, t * 0.025));
  float rays = 0.12 + 1.15 * ry * ry;
  float rw = max(0.05, 2.4 * uCell / uR);   /* au moins deux points d'épaisseur, même sur un petit anneau */
  float k1 = (d - 1.0) / (rw * 0.45), k2 = (d - 1.0) / rw;
  float core = exp(-k1 * k1);
  float rim = exp(-k2 * k2) * clamp(0.72 + 0.5 * ry, 0.0, 1.0);
  float corona = d > 1.0 ? exp(-(d - 1.0) * 2.7) * rays * mix(0.65, 1.2, n) : exp(-(1.0 - d) * 13.0) * 0.5;
  float ring = clamp(max(rim, corona * 0.78), 0.0, 1.0);

  float quiet = quietAt(cc);
  float res = ringRes(d);

  /* La mise au point sous la souris. */
  float lens = uLens * (1.0 - smoothstep(uLensR * 0.2, uLensR, length(cc - uPtr)));
  lens *= 1.0 - 0.6 * quiet;

  float inside = 1.0 - smoothstep(0.92, 1.0, d);
  float halfV = max(ring * res * (1.0 - 0.5 * quiet), max(n, 0.3) * lens * 0.8);
  halfV = max(halfV, n * 0.16 * res * inside * (1.0 - quiet));
  float m = max(res, lens);

  /* Le bruit : une cellule allumée ou éteinte selon un seuil qui se renouvelle lentement. */
  float ph = hash(cell + 7.1);
  float th = hash(cell + floor(t * 0.45 + ph * 9.0));
  float dens = mix(1.0, 0.82, uResolve) * (1.0 - quiet);
  float on = step(th, n * dens) * (1.0 - m);

  gl_FragColor = vec4(halfV, on, core * res, 1.0);
}`;
const DRAW = `${COMMON}
uniform sampler2D uField;
uniform vec2 uGrid;
uniform float uLight;
uniform vec3 uFg, uDv;
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 cell = floor(fc / uCell);
  vec4 f = texture2D(uField, (cell + 0.5) / uGrid);
  vec2 lp = (fc - (cell + 0.5) * uCell) / uCell;
  float aa = 1.2 / uCell;

  /* Le bruit : un petit carré. */
  float sq = max(abs(lp.x), abs(lp.y));
  float aS = (1.0 - smoothstep(0.19 - aa, 0.19 + aa, sq)) * f.g * mix(0.42, 0.3, uLight);

  /* La trame nette : un disque dont le rayon suit la valeur. */
  float halfV = f.r;
  float rad = halfV * 0.5;
  float aH = (1.0 - smoothstep(rad - aa, rad + aa, length(lp))) * step(0.035, halfV);
  aH *= 0.5 + 0.5 * clamp(halfV * 1.4, 0.0, 1.0);
  vec3 cH = mix(uDv, uFg, f.b * mix(0.42, 0.28, uLight));

  /* Une lueur continue, très douce, autour du filet. */
  float d = length(fc - uCenter) / uR;
  float glow = exp(-abs(d - 1.0) * 5.5) * 0.085 * ringRes(d) * (1.0 - 0.6 * quietAt(fc));

  vec3 col = uFg * aS * (1.0 - aH) + cH * aH;
  float a = aS * (1.0 - aH) + aH;
  col = col * (1.0 - glow) + uDv * glow;
  a = a * (1.0 - glow) + glow;
  gl_FragColor = vec4(col, a);
}`;

function program(gl, frag) {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(pr, 0, 'p');
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr) || 'link');
  const U = {};
  const n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(pr, i); U[u.name] = gl.getUniformLocation(pr, u.name); }
  return { pr, U };
}

function initField() {
  const root = document.querySelector('[data-field]');
  const cv = root?.querySelector('[data-field-gl]');
  if (!cv) return;
  const hero = root.closest('.dv-hero');
  const txt = hero.querySelector('.ai-hero__txt');
  const still = reduced();
  let dead = false;
  const fail = () => { dead = true; root.classList.add('is-still'); };

  let gl = null;
  try {
    gl = cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: LITE ? 'low-power' : 'high-performance' });
  } catch { gl = null; }
  if (!gl) { fail(); return; }

  let A, B;
  try { A = program(gl, FIELD(LITE ? 3 : 4)); B = program(gl, DRAW); } catch { fail(); return; }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // La texture des cellules et son tampon.
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();

  const S = {
    dpr: 1, w: 0, h: 0, cell: 7, cols: 1, rows: 1, cx: 0, cy: 0, R: 100, quiet: [0, 0, 0, 0],
    resolve: still ? 1 : 0, zoom: 1, lens: 0, lensTo: 0,
    px: -9999, py: -9999, tx: -9999, ty: -9999, ox: 0, oy: 0,
    fg: [1, 1, 1], dv: [0.56, 0.49, 1], light: 0
  };

  const colors = () => {
    S.fg = readColor('var(--fg)', hero);
    S.dv = readColor('var(--dv)', hero);
    S.light = lum(readColor('var(--bg)', hero)) > 0.5 ? 1 : 0;
  };

  // La géométrie : sur ordinateur, l'anneau entoure le titre ; sur
  // téléphone, il se pose au-dessus du texte.
  const layout = () => {
    const r = hero.getBoundingClientRect();
    const vh = Math.min(window.innerHeight, r.height);
    S.dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 1.75);
    S.w = Math.max(1, Math.round(r.width * S.dpr));
    S.h = Math.max(1, Math.round(r.height * S.dpr));
    if (cv.width !== S.w || cv.height !== S.h) { cv.width = S.w; cv.height = S.h; }
    const t = txt.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(txt).paddingTop) || 0;
    const top = t.top - r.top + pad;          // le haut du texte lui-même
    const th = t.height - pad;
    const narrow = r.width < 704;
    const cx = r.width / 2;
    if (narrow) {
      S.R = Math.max(60, Math.min(r.width * 0.4, (top - 64) * 0.47));
      S.cy = Math.max(64 + S.R * 1.02, top * 0.55);
      S.quiet = [cx, top + th / 2, t.width / 2, th / 2];
    } else {
      // Assez grand pour que la phrase d'appui tienne dedans (tablette),
      // sans devenir démesuré sur un très grand écran.
      const lede = hero.querySelector('.ai-hero__lede')?.getBoundingClientRect().width || 600;
      const base = Math.min(r.width * 0.31, vh * 0.47);
      S.R = Math.min(660, Math.max(base, Math.min(lede * 0.59, r.width * 0.49)));
      S.cy = top + th * 0.47;
      S.quiet = [cx, top + th / 2, Math.min(t.width, r.width * 0.42) / 2, th / 2];
    }
    S.cx = cx;
    S.narrow = narrow;
    S.cell = (narrow ? 6 : 7) * S.dpr;
    S.cols = Math.ceil(S.w / S.cell); S.rows = Math.ceil(S.h / S.cell);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S.cols, S.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) fail();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const shared = (U) => {
    const q = S.quiet;
    gl.uniform1f(U.uCell, S.cell);
    gl.uniform1f(U.uR, S.R * S.zoom * S.dpr);
    gl.uniform1f(U.uResolve, S.resolve);
    gl.uniform2f(U.uCenter, (S.cx + S.ox) * S.dpr, S.h - (S.cy + S.oy) * S.dpr);
    const k = S.narrow ? 1 : 0.9;
    gl.uniform4f(U.uQuiet, q[0] * S.dpr, S.h - q[1] * S.dpr, q[2] * k * S.dpr, q[3] * (S.narrow ? 1 : 0.82) * S.dpr);
  };

  const draw = (time) => {
    if (dead) return;
    // 1 — les cellules
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, S.cols, S.rows);
    gl.useProgram(A.pr);
    shared(A.U);
    gl.uniform1f(A.U.uTime, time);
    gl.uniform1f(A.U.uLens, S.lens);
    gl.uniform1f(A.U.uLensR, 200 * S.dpr);
    gl.uniform2f(A.U.uPtr, S.px * S.dpr, S.h - S.py * S.dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 2 — les points
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, S.w, S.h);
    gl.useProgram(B.pr);
    shared(B.U);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(B.U.uField, 0);
    gl.uniform2f(B.U.uGrid, S.cols, S.rows);
    gl.uniform1f(B.U.uLight, S.light);
    gl.uniform3fv(B.U.uFg, S.fg);
    gl.uniform3fv(B.U.uDv, S.dv);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  colors();
  layout();
  if (import.meta.env?.DEV) window.__aiField = S;
  cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(); });

  // Une image tout de suite (le bruit) ; le canevas apparaît en fondu.
  const t0 = performance.now();
  const clock = () => (still ? 14 : 6 + (performance.now() - t0) / 1000);
  draw(clock());
  requestAnimationFrame(() => cv.classList.add('is-on'));

  // La taille de l'ouverture, ou celle du texte (une police qui arrive, un
  // thème qui change de police), redessine l'anneau autour du titre.
  const ro = new ResizeObserver(() => { layout(); draw(clock()); });
  ro.observe(hero); ro.observe(txt);
  document.fonts?.ready.then(() => { layout(); draw(clock()); });
  window.addEventListener('palette:change', () => {
    // Les polices changent avec le thème : la zone du titre aussi.
    setTimeout(() => { colors(); layout(); draw(clock()); }, 160);
  });
  if (still) return;

  // Le bruit se résout : l'anneau se forme pendant que le titre monte.
  gsap.to(S, { resolve: 1, duration: 2.6, delay: 0.35, ease: 'power2.inOut' });

  // La souris fait la mise au point (ordinateur seulement).
  if (!LITE) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      S.tx = e.clientX - r.left; S.ty = e.clientY - r.top;
      if (S.px < -9000) { S.px = S.tx; S.py = S.ty; }
      S.lensTo = 1;
    });
    hero.addEventListener('pointerleave', () => { S.lensTo = 0; });
  }

  // À la descente, l'anneau s'ouvre : on passe à travers l'objectif.
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top',
    onUpdate: (self) => { S.zoom = 1 + self.progress * 0.55; }
  });

  let on = true;
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(hero);

  let last = 0;
  gsap.ticker.add(() => {
    if (!on || dead || document.hidden) return;
    const now = performance.now();
    if (LITE && now - last < 32) return;   // 30 images/s sur téléphone
    last = now;
    // Les valeurs suivent leur cible, sans à-coup.
    S.px += (S.tx - S.px) * 0.12; S.py += (S.ty - S.py) * 0.12;
    S.lens += (S.lensTo - S.lens) * 0.06;
    if (S.lensTo > 0) {
      S.ox += ((S.px - S.cx) * 0.025 - S.ox) * 0.05;
      S.oy += ((S.py - S.cy) * 0.025 - S.oy) * 0.05;
    }
    draw(clock());
  });
}

/* ═══════════════════ LE PROCESSUS : L'ÉCRAN DE POINTS ═══════════════════ */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* L'ordre de Hilbert : deux points voisins à l'écran restent voisins dans
   la liste. Chaque particule prend la n-ième place de chaque état : elle
   voyage court, et la transformation reste lisible. */
function hilbert(n, x, y) {
  let d = 0;
  for (let s = n / 2; s >= 1; s /= 2) {
    const rx = (x & s) > 0 ? 1 : 0;
    const ry = (y & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) { x = n - 1 - x; y = n - 1 - y; }
      const t = x; x = y; y = t;
    }
  }
  return d;
}

const STEPS = ['Brief', 'Concept', 'AI-assisted development', 'Human direction & finishing', 'Delivery'];

function states(W, H, N) {
  const out = [];
  const Z = W < 520 ? 1 : 1.3;   // la taille des points suit celle de l'écran
  const P = (x, y, r, a, c, sq = 0) => ({ x, y, r: r * Z, a, c, sq });

  // Le cadre commun (16:9).
  let fw = W * 0.82, fh = fw * 9 / 16;
  if (fh > H * 0.64) { fh = H * 0.64; fw = fh * 16 / 9; }
  const F = { x: (W - fw) / 2, y: (H - fh) / 2 + H * 0.035, w: fw, h: fh };

  const border = (b, k, list, rand, jit, a, r, c = 0) => {
    const per = 2 * (b.w + b.h);
    for (let i = 0; i < k; i++) {
      let u = (i / k) * per;
      let x, y;
      if (u < b.w) { x = b.x + u; y = b.y; }
      else if ((u -= b.w) < b.h) { x = b.x + b.w; y = b.y + u; }
      else if ((u -= b.h) < b.w) { x = b.x + b.w - u; y = b.y + b.h; }
      else { u -= b.w; x = b.x; y = b.y + b.h - u; }
      list.push(P(x + (rand() - 0.5) * jit, y + (rand() - 0.5) * jit, r, a, c));
    }
  };
  const circle = (cx, cy, rr, k, list, rand, jit, a, r, c = 1) => {
    for (let i = 0; i < k; i++) {
      const th = (i / k) * Math.PI * 2;
      list.push(P(cx + Math.cos(th) * rr + (rand() - 0.5) * jit, cy + Math.sin(th) * rr + (rand() - 0.5) * jit, r, a, c));
    }
  };
  const line = (x0, x1, y, k, list, rand, jit, a, r, c = 0) => {
    for (let i = 0; i < k; i++) list.push(P(x0 + (x1 - x0) * (i + 0.5) / k + (rand() - 0.5) * jit, y + (rand() - 0.5) * jit, r, a, c));
  };
  // Une composition simple : un cadre, un astre, un horizon.
  const compo = (b, k, rand, o) => {
    const list = [];
    const kb = Math.round(k * o.kb), kc = Math.round(k * o.kc), kl = k - kb - kc;
    border(b, kb, list, rand, o.jit, o.ab, o.r, 0);
    circle(b.x + b.w * o.sx, b.y + b.h * o.sy, b.h * o.sr, kc, list, rand, o.jit, o.ac, o.r * 1.15, o.cc ?? 1);
    line(b.x + b.w * 0.04, b.x + b.w * 0.96, b.y + b.h * o.hy, kl, list, rand, o.jit, o.al, o.r, 0);
    return list;
  };

  // 0 — Le brief : du bruit, et au milieu l'étincelle d'une idée.
  {
    const rand = rng(11), list = [];
    const spark = Math.round(N * 0.07);
    for (let i = 0; i < N - spark; i++) list.push(P(W * 0.03 + rand() * W * 0.94, H * 0.1 + rand() * H * 0.84, 0.7 + rand() * 0.9, 0.16 + rand() * 0.38, rand() < 0.06 ? 1 : 0, 1));
    for (let i = 0; i < spark; i++) {
      const a = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * H * 0.06;
      list.push(P(W / 2 + Math.cos(a) * rr, H * 0.54 + Math.sin(a) * rr, 1 + rand() * 1.1, 0.75, 1, 0));
    }
    out.push(list);
  }
  // 1 — Le concept : une esquisse, à main levée, avec ses tiers.
  {
    const rand = rng(22);
    const kg = Math.round(N * 0.16);
    const list = compo(F, N - kg, rand, { kb: 0.4, kc: 0.3, jit: 6, ab: 0.55, ac: 0.85, al: 0.5, r: 1.15, sx: 0.66, sy: 0.4, sr: 0.22, hy: 0.7 });
    const g = Math.round(kg / 3);
    line(F.x, F.x + F.w, F.y + F.h / 3, g, list, rand, 0, 0.2, 0.7);
    for (let i = 0; i < kg - g; i++) {
      const vx = i % 2 ? F.x + F.w / 3 : F.x + (2 * F.w) / 3;
      list.push(P(vx, F.y + F.h * ((Math.floor(i / 2) + 0.5) / Math.ceil((kg - g) / 2)), 0.7, 0.2, 0));
    }
    out.push(list);
  }
  // 2 — Le développement assisté : neuf variantes à la fois.
  const grid = (() => {
    const g = W * 0.03;
    let mw = (W * 0.9 - 2 * g) / 3, mh = mw * 9 / 16;
    if (3 * mh + 2 * g > H * 0.78) { mh = (H * 0.78 - 2 * g) / 3; mw = mh * 16 / 9; }
    const x0 = (W - (3 * mw + 2 * g)) / 2, y0 = (H - (3 * mh + 2 * g)) / 2 + H * 0.035;
    return [...Array(9)].map((_, k) => ({ x: x0 + (k % 3) * (mw + g), y: y0 + Math.floor(k / 3) * (mh + g), w: mw, h: mh }));
  })();
  const variant = (k) => ({
    kb: 0.42, kc: 0.33, jit: 2, ab: 0.4, ac: 0.9, al: 0.45, r: 0.95,
    sx: 0.22 + ((k * 37) % 9) / 14, sy: 0.3 + ((k * 23) % 5) / 14, sr: 0.14 + ((k * 13) % 4) / 22, hy: 0.55 + ((k * 7) % 4) / 12,
    cc: 1
  });
  {
    const rand = rng(33), list = [];
    const per = Math.floor(N / 9);
    grid.forEach((b, k) => list.push(...compo(b, k === 8 ? N - per * 8 : per, rand, variant(k))));
    out.push(list);
  }
  // 3 — La direction humaine : un choix, net, avec ses traits de coupe ; les
  //     autres variantes s'effacent là où elles étaient.
  {
    const rand = rng(44);
    const kGhost = Math.round(N * 0.3), kCrop = Math.round(N * 0.12);
    const list = compo(F, N - kGhost - kCrop, rand, { kb: 0.36, kc: 0.38, jit: 0, ab: 0.75, ac: 1, al: 0.75, r: 1.15, sx: variant(4).sx, sy: variant(4).sy, sr: variant(4).sr * 1.2, hy: variant(4).hy });
    const m = Math.min(F.w, F.h) * 0.07, arm = Math.min(F.w, F.h) * 0.16;
    const corners = [[F.x - m, F.y - m, 1, 1], [F.x + F.w + m, F.y - m, -1, 1], [F.x - m, F.y + F.h + m, 1, -1], [F.x + F.w + m, F.y + F.h + m, -1, -1]];
    for (let i = 0; i < kCrop; i++) {
      const [x, y, sx, sy] = corners[i % 4];
      const j = Math.floor(i / 4), half = Math.ceil(kCrop / 8);
      const u = ((j % half) / half) * arm;
      list.push(j < half ? P(x + sx * u, y, 1.2, 0.95, 0) : P(x, y + sy * u, 1.2, 0.95, 0));
    }
    const per = Math.ceil(kGhost / 8);
    let left = kGhost;
    grid.forEach((b, k) => {
      if (k === 4 || left <= 0) return;
      const n = Math.min(per, left); left -= n;
      compo(b, n, rand, variant(k)).forEach((p) => list.push({ ...p, a: 0.06, r: 0.7 }));
    });
    out.push(list);
  }
  // 4 — La livraison : l'image finie, une trame régulière dans un cadre net.
  {
    const rand = rng(55);
    const kb = Math.round(N * 0.12);
    const list = [];
    border(F, kb, list, rand, 0, 0.9, 0.9, 0);
    const k = N - kb;
    const step = Math.sqrt((F.w * F.h) / k);
    const cols = Math.floor(F.w / step), rows = Math.floor(k / cols);
    const sx = F.w / cols, sy = F.h / rows;
    const cx = F.x + F.w * 0.5, cy = F.y + F.h * 0.47, R = F.h * 0.3;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = F.x + (i + 0.5) * sx, y = F.y + (j + 0.5) * sy;
        const d = Math.hypot(x - cx, y - cy) / R;
        const ang = Math.atan2(y - cy, x - cx);
        const rays = 0.55 + 0.45 * Math.sin(ang * 9 + 1.3) * Math.sin(ang * 4 - 0.7);
        const rim = Math.exp(-(((d - 1) / 0.11) ** 2));
        const corona = d > 1 ? Math.exp(-(d - 1) * 2.6) * rays : Math.exp(-(1 - d) * 7) * 0.5;
        const ground = 0.32 * Math.max(0, (y - (F.y + F.h * 0.8)) / (F.h * 0.2));
        const v = Math.min(1, Math.max(rim, corona * 0.85, ground));
        list.push(P(x, y, Math.max(0.15, (v * Math.min(sx, sy) * 0.48) / Z), v < 0.06 ? 0.1 : 0.95, v > 0.12 ? 1 : 0, 0));
      }
    }
    while (list.length < N) list.push(P(F.x + rand() * F.w, F.y + rand() * F.h, 0.2, 0, 0));
    out.push(list.slice(0, N));
  }

  // Chaque état, trié dans l'ordre de Hilbert.
  const G = 128, sc = G / Math.max(W, H);
  return out.map((list) => {
    while (list.length < N) list.push({ ...list[list.length % Math.max(1, list.length)], a: 0 });
    return list.slice(0, N)
      .map((p) => ({ p, k: hilbert(G, Math.max(0, Math.min(G - 1, Math.floor(p.x * sc))), Math.max(0, Math.min(G - 1, Math.floor(p.y * sc)))) }))
      .sort((a, b) => a.k - b.k)
      .map((o) => o.p);
  });
}

function initMorph() {
  const box = document.querySelector('[data-morph]');
  const list = document.querySelector('[data-flow]');
  if (!box || !list) return;
  const cv = box.querySelector('[data-morph-c]');
  const tag = box.querySelector('[data-morph-tag]');
  const num = box.querySelector('[data-morph-n]');
  const steps = [...list.querySelectorAll('.dv-step')];
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const still = reduced();
  const N = LITE ? 680 : 1100;

  let W = 0, H = 0, dpr = 1, S = [], cur = 0, from = null, to = null, prog = 1, tween = null;
  const live = []; // l'état affiché, particule par particule
  const delay = new Float32Array(N);
  { const r = rng(7); for (let i = 0; i < N; i++) delay[i] = (i / N) * 0.22 + r() * 0.1; }
  const phase = new Float32Array(N);
  { const r = rng(9); for (let i = 0; i < N; i++) phase[i] = r() * Math.PI * 2; }

  let shades = [];
  const paintColors = () => {
    const fg = readColor('var(--fg)', box).map((v) => Math.round(v * 255));
    const dv = readColor('var(--dv)', box).map((v) => Math.round(v * 255));
    shades = [...Array(6)].map((_, i) => {
      const k = i / 5;
      return `rgb(${fg.map((c, j) => Math.round(c + (dv[j] - c) * k)).join(',')})`;
    });
  };

  const size = () => {
    const r = box.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    S = states(W, H, N);
    // On se pose directement sur l'état en cours.
    tween?.kill(); prog = 1; from = null;
    to = S[cur];
    for (let i = 0; i < N; i++) live[i] = { ...to[i] };
  };

  const ease = gsap.parseEase('power3.inOut');
  let time = 0;
  const render = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const idle = (cur === 0 || cur === 2) && !still;
    for (let i = 0; i < N; i++) {
      const b = to[i];
      let p = b;
      if (from && prog < 1) {
        const a = from[i];
        const q = ease(Math.max(0, Math.min(1, (prog * 1.32 - delay[i]) / 1)));
        p = live[i];
        p.x = a.x + (b.x - a.x) * q; p.y = a.y + (b.y - a.y) * q;
        p.r = a.r + (b.r - a.r) * q; p.a = a.a + (b.a - a.a) * q;
        p.c = a.c + (b.c - a.c) * q; p.sq = a.sq + (b.sq - a.sq) * q;
      } else {
        Object.assign(live[i], b);
        p = live[i];
      }
      if (p.a < 0.01 || p.r < 0.1) continue;
      let x = p.x, y = p.y, al = p.a;
      if (idle) {
        const ph = phase[i];
        if (cur === 0) { x += Math.sin(time * 0.7 + ph) * 2.2; y += Math.cos(time * 0.55 + ph * 1.3) * 2.2; }
        else if (p.c > 0.5) al *= 0.72 + 0.28 * Math.sin(time * 2.2 + ph);
      }
      ctx.globalAlpha = al;
      ctx.fillStyle = shades[Math.round(p.c * 5)];
      if (p.sq > 0.5) ctx.fillRect(x - p.r, y - p.r, p.r * 2, p.r * 2);
      else { ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };

  const go = (k) => {
    if (k === cur && to) return;
    cur = k;
    steps.forEach((s, i) => s.classList.toggle('is-cur', i === k));
    if (num) num.textContent = String(k + 1).padStart(2, '0');
    if (tag) {
      if (still) tag.textContent = STEPS[k];
      else gsap.to(tag, { autoAlpha: 0, y: -6, duration: 0.25, ease: 'power2.in', overwrite: true, onComplete: () => {
        tag.textContent = STEPS[k];
        gsap.fromTo(tag, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      } });
    }
    from = live.map((p) => ({ ...p }));
    to = S[k];
    if (still) { prog = 1; from = null; render(); return; }
    prog = 0;
    tween?.kill();
    tween = gsap.to({ v: 0 }, { v: 1, duration: 1.15, ease: 'none', onUpdate() { prog = this.targets()[0].v; }, onComplete: () => { prog = 1; from = null; render(); } });
  };

  paintColors();
  size();
  render();
  steps[0]?.classList.add('is-cur');

  new ResizeObserver(() => { size(); render(); }).observe(box);
  window.addEventListener('palette:change', () => setTimeout(() => { paintColors(); render(); }, 60));

  // Le défilement choisit l'étape : celle qui passe la ligne de lecture.
  const pick = () => {
    // Sur téléphone, l'écran reste en haut : la ligne de lecture est juste dessous.
    const mobile = window.innerWidth < 960;
    const below = box.getBoundingClientRect().bottom;
    const lineY = mobile ? below + (window.innerHeight - below) * 0.38 : window.innerHeight * 0.58;
    let k = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < lineY) k = i; });
    go(k);
  };
  ScrollTrigger.create({ trigger: list, start: 'top bottom', end: 'bottom top', onUpdate: pick, onRefresh: pick });

  if (still) return;
  let on = false;
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) render(); }).observe(box);
  let last = 0;
  gsap.ticker.add(() => {
    if (!on || document.hidden) return;
    const now = performance.now();
    const moving = from && prog < 1;
    const idle = cur === 0 || cur === 2;
    if (!moving && !idle) return;
    if (!moving && now - last < 33) return;   // au repos, 30 images/s suffisent
    last = now;
    time = now / 1000;
    render();
  });
}

/* ═══════════════════ LA DEMANDE : LA FICHE DU BRIEF ═══════════════════
   La fiche lit le formulaire à chaque saisie et range les réponses : le
   type de projet en titre, puis l'approche, où on le verra, le calendrier,
   le budget, l'idée, les références, qui écrit et comment répondre. Une
   ligne vide montre du grain ; une ligne écrite sort du flou. L'anneau de
   points, en haut, se ferme dans le sens des aiguilles d'une montre à mesure
   que les neuf lignes se remplissent. */
const TAU = Math.PI * 2;
const hash2 = (x, y) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
const rgb = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;

/* L'anneau : `p` (0 → 1) la part fermée ; `t` le temps, pour le grain. */
function drawRing(cv, p, t, C) {
  const s = cv.clientWidth || 56;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const px = Math.round(s * dpr);
  if (cv.width !== px) { cv.width = px; cv.height = px; }
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, s, s);
  const n = 13, cell = s / n, c = s / 2, R = s * 0.335;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * cell, y = (j + 0.5) * cell;
      const dx = x - c, dy = y - c;
      const d = Math.hypot(dx, dy) / R;
      let a = Math.atan2(dx, -dy) / TAU;   // 0 à midi, dans le sens des aiguilles
      if (a < 0) a += 1;
      const ring = Math.exp(-(((d - 1) / 0.2) ** 2));
      if (ring > 0.3 && a <= p + 0.001 && p > 0.001) {
        // La part fermée : des points violets, nets.
        ctx.globalAlpha = 0.4 + 0.6 * ring;
        ctx.fillStyle = C.dv;
        ctx.beginPath(); ctx.arc(x, y, cell * (0.17 + 0.2 * ring), 0, TAU); ctx.fill();
      } else if (ring > 0.3) {
        // Le reste de l'anneau, en attente : à peine dessiné.
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = C.c3;
        ctx.beginPath(); ctx.arc(x, y, cell * 0.19, 0, TAU); ctx.fill();
      } else if (d < 1.5) {
        // Le grain, qui s'apaise à mesure que le brief se remplit.
        const on = hash2(i + 17, j + Math.floor(t * 2.2 + hash2(i, j) * 9)) < 0.26 * (1 - p * 0.8);
        if (!on) continue;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = C.c3;
        const q = cell * 0.13;
        ctx.fillRect(x - q, y - q, q * 2, q * 2);
      }
    }
  }
  if (p >= 0.999) {
    // Le brief est complet : le centre s'allume, comme l'ouverture.
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.dv;
    ctx.beginPath(); ctx.arc(c, c, cell * 0.5, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function initBrief() {
  const form = document.querySelector('form[data-inquiry="ai"]');
  const card = form?.querySelector('[data-brief]');
  if (!form || !card) return;
  const still = reduced();
  const ringCv = card.querySelector('[data-brief-ring]');
  const count = card.querySelector('[data-brief-count]');
  const steps = [...form.querySelectorAll('[data-step]')];
  const rows = {};
  card.querySelectorAll('[data-brief-row]').forEach((r) => { rows[r.dataset.briefRow] = r; });
  const TOTAL = Object.keys(rows).length;
  const note = form.querySelector('[data-inquiry-note]');
  const NOTE = note?.textContent || '';
  const submitBusy = () => form.querySelector('[type=submit]')?.getAttribute('aria-busy') === 'true';

  const el = (n) => form.elements.namedItem(n);
  const val = (n) => String(el(n)?.value || '').trim();
  const picked = (n) => [...form.querySelectorAll(`[name="${n}"]:checked`)]
    .map((i) => i.dataset.text || i.closest('label')?.textContent.trim() || i.value);
  const typeText = () => {
    const s = el('type');
    return s && s.value ? (s.selectedOptions[0]?.textContent.trim() || '') : '';
  };
  const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

  // Les couleurs de la fiche (sa nuit, dans tous les thèmes).
  let C = {};
  const colors = () => {
    C = { dv: rgb(readColor('var(--dv)', card)), c3: rgb(readColor('var(--cream-3)', card)) };
  };
  colors();

  const R = { p: 0, t: 0 };
  const paintRing = () => drawRing(ringCv, R.p, R.t, C);

  let tried = false;
  const update = (animate = true) => {
    const name = val('name'), org = val('organization'), phone = val('phone'), email = val('email');
    const values = {
      type: typeText(),
      approach: picked('approach').join(', '),
      platform: picked('platform').join(' · '),
      timeline: val('timeline'),
      budget: val('budget'),
      message: val('message'),
      references: val('references'),
      from: [name, org].filter(Boolean).join(', '),
      reach: [phone, email].filter(Boolean).join(' · ')
    };
    let n = 0;
    for (const [k, row] of Object.entries(rows)) {
      const v = values[k] || '';
      const out = row.querySelector('[data-v]');
      const was = row.classList.contains('is-set');
      if (out.textContent !== v) out.textContent = v;
      row.classList.toggle('is-set', Boolean(v));
      if (v) n++;
      // Une ligne qui vient d'être écrite sort du flou.
      if (v && !was && animate && !still) {
        gsap.fromTo(out, { autoAlpha: 0, y: 4, ...(LITE ? {} : { filter: 'blur(6px)' }) },
          { autoAlpha: 1, y: 0, ...(LITE ? {} : { filter: 'blur(0px)' }), duration: 0.6, ease: 'power3.out', clearProps: 'all' });
      }
    }
    rows.from?.classList.toggle('is-need', tried && !name);
    rows.reach?.classList.toggle('is-need', tried && (!phone || !email));
    const ready = Boolean(name && phone && emailOk(email));
    card.classList.toggle('is-ready', ready);
    // Tout ce qui manquait est là : la note d'erreur reprend sa phrase.
    if (ready && note && note.textContent !== NOTE && !submitBusy()) note.textContent = NOTE;
    if (count) count.textContent = String(n).padStart(2, '0');

    // Les étapes s'allument dès qu'une réponse y est posée ; les lignes
    // écrites gardent leur chevron violet.
    steps.forEach((s) => {
      const any = [...s.querySelectorAll('input, select, textarea')].some((c) =>
        (c.type === 'radio' || c.type === 'checkbox') ? c.checked : String(c.value || '').trim() !== '');
      s.classList.toggle('is-done', any);
    });
    form.querySelectorAll('.ai-line, .ai-prompt').forEach((f) => {
      const c = f.querySelector('input, select, textarea');
      f.classList.toggle('is-filled', Boolean(c && String(c.value || '').trim()));
    });

    const p = n / TOTAL;
    if (still || !animate) { R.p = p; paintRing(); }
    else gsap.to(R, { p, duration: 0.9, ease: 'power3.out', overwrite: true, onUpdate: paintRing });
  };

  // L'idée : la boîte grandit avec le texte.
  const ta = el('message');
  const grow = () => {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight + 2, 152)}px`;
  };

  form.addEventListener('input', (e) => { if (e.target === ta) grow(); update(); });
  form.addEventListener('change', () => update());
  // Après la vérification d'`inquiry.js` (écoutée avant nous) : ce qui manque
  // se dit aussi dans la fiche.
  form.addEventListener('submit', () => { tried = true; update(); });
  // Une carte « Ask about this » oriente la liste sans événement de saisie :
  // la fiche se relit juste après.
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('a[href*="?"]')) setTimeout(() => update(), 0);
  });
  window.addEventListener('palette:change', () => setTimeout(() => { colors(); paintRing(); }, 80));

  update(false);
  grow();

  // Le grain de l'anneau scintille doucement tant que le brief n'est pas
  // complet — ordinateur seulement, fiche visible, à 10 images/s.
  if (!still && !LITE) {
    let on = false, last = 0;
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(card);
    gsap.ticker.add(() => {
      if (!on || document.hidden || R.p >= 0.999) return;
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      R.t = now / 1000;
      paintRing();
    });
  }

  window.addEventListener('inquiry:sent', () => resolveDone(form));
}

/* L'envoi : la fiche envoyée passe du grain au net. Une trame de carrés,
   de la couleur de la fiche, la couvre ; ils s'effacent dans l'ordre d'une
   matrice de Bayer (le tramage des vieux écrans), pendant que le texte
   dessous sort du flou. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function resolveDone(form) {
  const box = form.parentElement?.querySelector('[data-inquiry-done]');
  if (!box) return;
  const C = { dv: rgb(readColor('var(--dv)', box)), c3: rgb(readColor('var(--cream-3)', box)) };
  const ring = box.querySelector('[data-done-ring]');
  if (ring) drawRing(ring, 1, 0, C);
  // Le formulaire vient de disparaître : la page a perdu sa hauteur. On
  // recale les déclencheurs maintenant, puis on amène le HAUT de la fiche
  // sous la barre (centrée, une fiche plus haute que l'écran montrait son
  // milieu, et sur téléphone sa fin).
  heightNow();
  const bh = getComputedStyle(document.documentElement).getPropertyValue('--bar-h').trim();
  const bar = (parseFloat(bh) * (bh.endsWith('rem') ? 16 : 1)) || 76;
  const y = box.getBoundingClientRect().top + window.scrollY - bar - 12;
  if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.1, force: true });
  else window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
  window.setTimeout(() => focusDone(box), 60);

  const fx = box.querySelector('[data-done-fx]');
  const inner = box.querySelector('.ai-done__in');
  if (!fx || reduced()) { fx?.remove(); return; }

  const r = box.getBoundingClientRect();
  const W = Math.max(1, r.width), H = Math.max(1, r.height);
  const dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
  fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr);
  const ctx = fx.getContext('2d');
  if (!ctx) { fx.remove(); return; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = rgb(readColor('var(--night-3)', box));
  const cell = LITE ? 9 : 7;
  const cols = Math.ceil(W / cell), rowsN = Math.ceil(H / cell);
  // Le seuil de chaque carré : Bayer, plus un peu de hasard, plus une vague
  // qui part du haut à gauche.
  const th = new Float32Array(cols * rowsN);
  for (let j = 0; j < rowsN; j++) {
    for (let i = 0; i < cols; i++) {
      th[j * cols + i] = BAYER[(j % 4) * 4 + (i % 4)] * 0.62 + hash2(i, j) * 0.18 + ((i / cols + j / rowsN) / 2) * 0.2;
    }
  }
  const S = { t: 0 };
  const paint = () => {
    ctx.clearRect(0, 0, W, H);
    const t = S.t;
    for (let j = 0; j < rowsN; j++) {
      for (let i = 0; i < cols; i++) {
        const k = th[j * cols + i];
        if (k < t) continue;
        // Près du seuil, le carré rapetisse et passe au violet : la trame.
        const left = Math.min(1, (k - t) / 0.16);
        const q = cell * (0.38 + 0.62 * left);
        ctx.fillStyle = left < 0.55 ? C.dv : bg;
        ctx.globalAlpha = left < 0.55 ? 0.5 : 1;
        ctx.fillRect(i * cell + (cell - q) / 2, j * cell + (cell - q) / 2, q, q);
      }
    }
    ctx.globalAlpha = 1;
  };
  paint();
  if (inner && !LITE) gsap.fromTo(inner, { filter: 'blur(8px)' }, { filter: 'blur(0px)', duration: 1.3, ease: 'power2.out', clearProps: 'filter' });
  gsap.to(S, { t: 1.02, duration: 1.25, delay: 0.12, ease: 'power2.inOut', onUpdate: paint, onComplete: () => fx.remove() });
}

/* Quand la page change de hauteur (une liste qu'on déplie, une police qui
   arrive), les déclencheurs se recalent. */
let heightNow = () => {};
function watchHeight() {
  let h = document.body.scrollHeight, t = 0;
  new ResizeObserver(() => {
    const nh = document.body.scrollHeight;
    if (Math.abs(nh - h) < 2) return;
    h = nh;
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 220);
  }).observe(document.body);
  // Recaler tout de suite (et ne pas le refaire 220 ms plus tard, au milieu
  // d'un défilement).
  heightNow = () => { clearTimeout(t); h = document.body.scrollHeight; ScrollTrigger.refresh(); };
}

/* Le démarrage : en dernier, une fois tout le module défini. */
bootDivision();
// Entre l'ouverture et la demande : la page vit dans son monde (ai-world.js).
initWorld();
initField();
initMorph();
initBrief();
watchHeight();
