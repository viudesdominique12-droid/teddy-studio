/* ═══════════════════ LE MUR DE LEDS ═══════════════════
   Ouverture de Music, variante « leds » (18/10/2026), chargée par
   `music-production.html?hero=leds` (voir `initHeroChoice` dans `music.js`).

   Le fond de l'ouverture devient l'écran de LEDs d'une scène de concert :
   une trame de diodes rondes, posée en modules de 16 × 16 comme un vrai mur
   (chaque module a sa nuance de noir, à peine). Deux canevas : les diodes
   éteintes, peintes une fois par mise en page ; les diodes allumées, à
   chaque image (une petite image d'une case par diode, agrandie sans
   lissage puis découpée en ronds, plus deux halos lissés pour la lueur).

   Le mur affiche un analyseur de spectre : les graves à gauche, les aigus à
   droite, des barres de deux diodes qui sautent sur le tempo de la page
   (96 BPM : la grosse caisse sur chaque temps, plus forte sur le premier ;
   la caisse claire sur 2 et 4 au milieu ; les charlestons à droite) et des
   crêtes crème qui tiennent puis retombent. Toutes les quatre mesures, le
   mur joue une mesure d'autre chose, à tour de rôle : des anneaux qui
   partent du titre sur chaque temps, un soleil de rayons qui tourne d'un
   cran par temps, ou un balayage de filtre qui monte des graves aux aigus
   avant que tout retombe sur le premier temps.

   Le titre reste devant : le mur s'assombrit doucement derrière chaque ligne
   de texte (un masque mesuré sur la page), comme une régie qui découpe
   l'écran. La souris allume les diodes qu'elle touche (une traînée qui
   s'éteint) et soulève les barres sous elle ; un clic, ou un appui au
   doigt, lance une gerbe de lumière. Purement visuel, aucun son.
   Au doigt : moins de diodes, plus grosses, 30 images par seconde.
   En mouvement réduit : une seule image, sur un premier temps.
   ═══════════════════════════════════════════════════════════ */
import '../../styles/pages/music-hero-leds.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

const BPM = 96;
const BEAT = 60 / BPM;          // 0,625 s
const BAR = BEAT * 4;           // 2,5 s
const INTRO = 0.85;             // la mise sous tension, avant le premier temps
const RAYS = 9;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, x) => { const q = clamp((x - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); };
const hash = (i, j, s) => { const v = Math.sin(i * 12.9898 + j * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

/* Une couleur du thème, en [r, g, b] : on la fait calculer par le navigateur. */
function rgbOf(host, token, fallback) {
  const probe = document.createElement('i');
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;color:var(${token})`;
  host.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const nums = (c.match(/-?[\d.]+/g) || []).map(Number);
  if (nums.length < 3) return fallback;
  const out = c.startsWith('color(') ? nums.slice(0, 3).map((v) => Math.round(v * 255)) : nums.slice(0, 3);
  return out[0] + out[1] + out[2] > 0 ? out : fallback;
}

/* Un bruit de valeur en deux dimensions, lissé (le même que `music.js`). */
function makeNoise(seed = 11) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const P = new Uint8Array(512);
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const V = new Float32Array(256);
  for (let i = 0; i < 256; i++) V[i] = rnd();
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = fade(x - xi), v = fade(y - yi);
    const X = xi & 255, Y = yi & 255;
    const a = V[P[P[X] + Y]], b = V[P[P[X + 1] + Y]];
    const c = V[P[P[X] + Y + 1]], d = V[P[P[X + 1] + Y + 1]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/* Un flou de boîte séparable, en place, sur quatre couches (la lueur). */
function blur4(chs, w, h, tmp, passes) {
  for (let p = 0; p < passes; p++) {
    for (const a of chs) {
      for (let y = 0; y < h; y++) {
        const o = y * w;
        for (let x = 0; x < w; x++) {
          const l = x > 0 ? a[o + x - 1] : a[o + x], r = x < w - 1 ? a[o + x + 1] : a[o + x];
          tmp[o + x] = (l + a[o + x] + r) / 3;
        }
      }
      for (let y = 0; y < h; y++) {
        const o = y * w, up = y > 0 ? o - w : o, dn = y < h - 1 ? o + w : o;
        for (let x = 0; x < w; x++) a[o + x] = (tmp[up + x] + tmp[o + x] + tmp[dn + x]) / 3;
      }
    }
  }
}

export function initHero(hero) {
  const stage = hero.querySelector('[data-spectrum]') || hero;
  const wall = document.createElement('div');
  wall.className = 'mu-leds';
  wall.setAttribute('aria-hidden', 'true');
  const offCv = document.createElement('canvas');
  offCv.className = 'mu-leds__off';
  const cv = document.createElement('canvas');
  cv.className = 'mu-leds__on';
  wall.append(offCv, cv);
  stage.append(wall);

  let ctx = null, octx = null;
  try { ctx = cv.getContext('2d'); octx = offCv.getContext('2d', { alpha: false }); } catch { ctx = null; }
  if (!ctx || !octx) { wall.classList.add('is-static', 'is-on'); return; }

  const still = reduced();
  const CORE = !LITE;                      // le cœur blanc des diodes vives (ordinateur)
  const noise = makeNoise(23);
  const pulse = hero.querySelector('[data-pulse]');
  const h1 = hero.querySelector('.dv-h1');

  /* Les petites images : une case par diode. */
  const tiny = () => { const c = document.createElement('canvas'); c.width = c.height = 1; return [c, c.getContext('2d')]; };
  const [cA, xA] = tiny();                 // la couleur des diodes allumées
  const [cK, xK] = tiny();                 // leur cœur blanc
  const [cB, xB] = tiny();                 // la lueur proche
  const [cZ, xZ] = tiny();                 // la brume (quatre fois plus large)
  const cT = CORE ? document.createElement('canvas') : null;
  const tctx = cT ? cT.getContext('2d') : null;

  let W = 0, H = 0, DPR = 1, P = 12, pitch = 12, C = 0, R = 0, N = 0, ox = 0, oy = 0, cw = 0, ch = 0;
  let hc = 0, hr = 0, small = false;
  let V, HT, X, T, M, MT, colX, rowY, bandOf;
  let pr, pg, pb, pa, tmp, zr, zg, zb, za, ztmp;
  let iA, iK, iB, iZ;
  let B = 0, b0 = 0, BW = 3, STRIDE = 4;   // une barre = trois diodes (deux au doigt), puis une colonne éteinte
  let lvl = new Float32Array(0), pk, pkV, pkHold, boost;
  let lo = 0.45, hi = 0.9, tcx = 0, tcy = 0, maxD = 40, maskMoving = false;
  let dotPat = null, corePat = null;
  const LUT = new Uint8ClampedArray(256 * 3);
  let bg = [23, 10, 20], fg = [252, 235, 243], dv = [255, 92, 138], dvd = [201, 45, 90], dvl = [255, 146, 176], face = bg;

  let t = 0, raf = 0, running = false, onScreen = true, last = 0, scrollP = 0, kickNow = 0;
  const ptr = { x: 0, y: 0, lx: null, ly: null, a: 0, ta: 0 };
  const bursts = [];

  function readColors() {
    bg = rgbOf(hero, '--bg', bg); fg = rgbOf(hero, '--fg', fg); dv = rgbOf(hero, '--dv', dv);
    dvd = rgbOf(hero, '--dv-dp', dvd); dvl = rgbOf(hero, '--dv-lt', dvl);
    face = mixc(bg, [0, 0, 0], 0.34);
    // La chaleur d'une diode : le rose profond en bas du mur, le rose de la
    // division, le rose clair, puis la crème (les crêtes, les éclats).
    const stops = [[0, mixc(dvd, [0, 0, 0], 0.12)], [0.4, dv], [0.72, dvl], [1, fg]];
    for (let i = 0; i < 256; i++) {
      const h = i / 255;
      let s = 0; while (s < stops.length - 2 && h > stops[s + 1][0]) s++;
      const [h0, c0] = stops[s], [h1_, c1] = stops[s + 1];
      const c = mixc(c0, c1, clamp((h - h0) / (h1_ - h0), 0, 1));
      LUT[i * 3] = c[0]; LUT[i * 3 + 1] = c[1]; LUT[i * 3 + 2] = c[2];
    }
  }

  const tile = (draw) => { const c = document.createElement('canvas'); c.width = c.height = P; draw(c.getContext('2d'), P / 2, P * 0.34); return c; };

  function makePatterns() {
    // La forme d'une diode : un rond net, le bord à peine adouci.
    dotPat = ctx.createPattern(tile((g, c, r) => {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(c, c, r + 0.9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#000'; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
    }), 'repeat');
    if (CORE) {
      corePat = tctx.createPattern(tile((g, c, r) => {
        const gr = g.createRadialGradient(c - r * 0.12, c - r * 0.16, 0, c, c, r * 0.78);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.38, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
      }), 'repeat');
    }
  }

  function setTiny(c, g, w, h) { c.width = w; c.height = h; return g.createImageData(w, h); }

  function layout() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    small = LITE || W < 640;
    const cap = Math.sqrt(5.6e6 / (W * H));
    DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 2, cap));
    const want = small ? clamp(W / 32, 10, 16) : clamp(W / 128, 9.5, 15);
    BW = small ? 2 : 3; STRIDE = BW + 1;
    P = Math.max(7, Math.round(want * DPR));
    pitch = P / DPR;
    cw = Math.round(W * DPR); ch = Math.round(H * DPR);
    C = Math.ceil(cw / P) + 1; R = Math.ceil(ch / P) + 1; N = C * R;
    ox = Math.round((C * P - cw) / 2); oy = Math.round((R * P - ch) / 2);
    cv.width = cw; cv.height = ch; offCv.width = cw; offCv.height = ch;
    if (cT) { cT.width = cw; cT.height = ch; }

    V = new Float32Array(N); HT = new Float32Array(N); X = new Float32Array(N); T = new Float32Array(N);
    M = new Float32Array(N).fill(1); MT = new Float32Array(N).fill(1);
    pr = new Float32Array(N); pg = new Float32Array(N); pb = new Float32Array(N); pa = new Float32Array(N); tmp = new Float32Array(N);
    colX = new Float32Array(C); rowY = new Float32Array(R);
    for (let i = 0; i < C; i++) colX[i] = ((i + 0.5) * P - ox) / DPR;
    for (let j = 0; j < R; j++) rowY[j] = ((j + 0.5) * P - oy) / DPR;

    // Les barres : autant qu'il en tient dans les colonnes visibles, centrées.
    const vis = Math.floor(cw / P);
    B = Math.max(6, Math.floor((vis + 1) / STRIDE));
    b0 = Math.floor((C - (B * STRIDE - 1)) / 2);
    bandOf = new Int16Array(C).fill(-1);
    for (let i = 0; i < C; i++) {
      const q = i - b0;
      if (q >= 0 && q < B * STRIDE && q % STRIDE < BW) bandOf[i] = Math.floor(q / STRIDE);
    }
    if (lvl.length !== B) {
      lvl = new Float32Array(B); pk = new Float32Array(B); pkV = new Float32Array(B);
      pkHold = new Float32Array(B); boost = new Float32Array(B);
    }

    iA = setTiny(cA, xA, C, R); iK = setTiny(cK, xK, C, R); iB = setTiny(cB, xB, C, R);
    hc = Math.ceil(C / 4); hr = Math.ceil(R / 4);
    iZ = setTiny(cZ, xZ, hc, hr);
    zr = new Float32Array(hc * hr); zg = new Float32Array(hc * hr); zb = new Float32Array(hc * hr); za = new Float32Array(hc * hr); ztmp = new Float32Array(hc * hr);

    makePatterns();
    measure(true);
  }

  /* Le masque : le mur baisse doucement derrière chaque ligne de texte et
     sous la barre du haut. Mesuré sur la page (les lignes du titre et du
     chapeau, les boutons, la ligne du bas). */
  function measure(snap) {
    if (!N) return;
    const sr = wall.getBoundingClientRect();
    const rects = [];
    const add = (el, px, py, floor, lines) => {
      if (!el) return;
      let list = [el.getBoundingClientRect()];
      if (lines) { const rg = document.createRange(); rg.selectNodeContents(el); list = [...rg.getClientRects()]; }
      for (const q of list) {
        if (q.width > 2 && q.height > 2) rects.push([q.left - sr.left, q.top - sr.top, q.right - sr.left, q.bottom - sr.top, px, py, floor]);
      }
    };
    const s = clamp(W / 1440, 0.45, 1.3);
    // Un halo plus large que haut : le titre garde sa scène, les barres du
    // milieu restent visibles juste au-dessus.
    add(h1, 44 + 70 * s, 26 + 30 * s, 0.2, true);
    add(hero.querySelector('.dv-k'), 34, 18, 0.14);
    add(hero.querySelector('.dv-lede'), 30 + 22 * s, 22 + 8 * s, 0.05, true);
    hero.querySelectorAll('.dv-acts .dv-btn').forEach((b) => add(b, 34, 24, 0.1));
    hero.querySelectorAll('.mu-hero__meta li').forEach((li) => add(li, 26, 18, 0.1));
    const barH = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 4.75) * 16;
    rects.push([-1e4, -1e4, 1e4, barH * 0.55, 1, barH * 0.9, 0.3]);

    for (let j = 0; j < R; j++) {
      const y = rowY[j];
      for (let i = 0; i < C; i++) {
        const x = colX[i];
        let m = 1;
        for (let n = 0; n < rects.length; n++) {
          const q = rects[n];
          const dx = Math.max(q[0] - x, 0, x - q[2]) / q[4], dy = Math.max(q[1] - y, 0, y - q[3]) / q[5];
          const f = q[6] + (1 - q[6]) * smooth(0, 1, Math.hypot(dx, dy));
          if (f < m) m = f;
        }
        MT[j * C + i] = m;
      }
    }
    if (snap) M.set(MT); else maskMoving = true;

    // Le centre du titre (les anneaux et le soleil en partent) et la course
    // des barres : leur bas derrière le texte, leur jeu dans l'espace libre.
    const hr_ = h1 ? h1.getBoundingClientRect() : sr;
    const hx = (hr_.left + hr_.right) / 2 - sr.left, hy = (hr_.top + hr_.bottom) / 2 - sr.top;
    tcx = (hx * DPR + ox) / P - 0.5; tcy = (hy * DPR + oy) / P - 0.5;
    maxD = Math.max(Math.hypot(tcx, tcy), Math.hypot(C - tcx, tcy), Math.hypot(tcx, R - tcy), Math.hypot(C - tcx, R - tcy));
    const top = clamp((hr_.top - sr.top) / H, 0.1, 0.9);
    lo = clamp(1 - top - (small ? 0.02 : 0.12), 0.22, 0.74);
    hi = clamp(1 - (barH + 1.5 * pitch) / H, lo + 0.15, 0.96);
    // Le son « moins haut » (Dominique, 18/10) : les barres gardent leur jeu
    // mais montent nettement moins vers le haut du mur.
    lo *= 0.82;
    hi = lo + (hi - lo) * 0.55;
    paintOff();
  }

  /* Les diodes éteintes : la face noire du mur, ses modules de 16 × 16 (une
     nuance chacun, un joint fin), et chaque diode, une lentille sombre qui
     prend un reflet en haut à gauche. Plus discrètes derrière le texte. */
  function paintOff() {
    const CAB = small ? 12 : 16;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.globalAlpha = 1;
    octx.fillStyle = css(face); octx.fillRect(0, 0, cw, ch);
    for (let cj = 0; cj * CAB < R; cj++) {
      for (let ci = 0; ci * CAB < C; ci++) {
        const sh = (hash(ci, cj, 3) - 0.5) * 0.07;
        octx.fillStyle = css(mixc(face, sh > 0 ? fg : [0, 0, 0], Math.abs(sh)));
        octx.fillRect(ci * CAB * P - ox, cj * CAB * P - oy, CAB * P, CAB * P);
      }
    }
    const lenses = [0.72, 0.86, 1, 1.14, 1.28].map((k) => tile((g, c, r) => {
      const base = mixc(face, fg, 0.06 * k), hiC = mixc(face, fg, 0.15 * k), rim = mixc(face, [0, 0, 0], 0.35);
      const gr = g.createRadialGradient(c - r * 0.32, c - r * 0.38, 0, c, c, r);
      gr.addColorStop(0, css(hiC)); gr.addColorStop(0.55, css(base)); gr.addColorStop(1, css(mixc(base, rim, 0.6)));
      g.fillStyle = css(rim); g.beginPath(); g.arc(c, c, r + Math.max(1, P * 0.04), 0, Math.PI * 2); g.fill();
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
    }));
    for (let j = 0; j < R; j++) {
      for (let i = 0; i < C; i++) {
        const k = j * C + i;
        const v = Math.min(4, Math.floor(hash(Math.floor(i / CAB), Math.floor(j / CAB), 7) * 3 + hash(i, j, 1) * 2.2));
        octx.globalAlpha = 0.3 + 0.7 * MT[k];
        octx.drawImage(lenses[v], i * P - ox, j * P - oy);
      }
    }
    octx.globalAlpha = 1;
    octx.fillStyle = css(mixc(face, [0, 0, 0], 0.5));
    const lw = Math.max(1, Math.round(DPR));
    for (let i = CAB; i < C; i += CAB) octx.fillRect(i * P - ox - lw / 2, 0, lw, ch);
    for (let j = CAB; j < R; j += CAB) octx.fillRect(0, j * P - oy - lw / 2, cw, lw);
  }

  const bandAt = (cellX) => clamp((cellX - b0) / STRIDE, 0, B - 1);
  const heightOf = (l) => (l <= 0.001 ? 0 : (lo + (hi - lo) * Math.min(1.06, l)) * smooth(0, 0.22, l));

  /* Une image : l'analyseur, l'intermède de la quatrième mesure, la main,
     les gerbes, le masque. Tout s'écrit dans les petites images. */
  function compute(dt) {
    const tm = t - INTRO;
    const live = tm >= 0;
    const bt = tm / BEAT, beatI = Math.floor(bt), ph = bt - beatI;
    const beatN = ((beatI % 4) + 4) % 4;
    const barI = Math.floor(beatI / 4);
    const cyc = ((barI % 4) + 4) % 4;
    const kindOf = (bar) => ((Math.floor(bar / 4) % 3) + 3) % 3;
    const sInBar = tm - barI * BAR;
    const kick = live ? Math.exp(-ph * 5.5) : 0;
    const acc = live && beatN === 0 ? 1 : 0;
    kickNow = kick * (0.8 + 0.2 * acc);
    const inter = live && cyc === 3;
    const kind = kindOf(barI);

    // L'intermède en cours (ou qui s'efface sur le premier temps suivant).
    let iw = 0, ik = kind, iAge = 0;
    if (inter && kind !== 2) { iw = smooth(0, 0.08, sInBar); iAge = sInBar; }
    else if (live && cyc === 0 && barI >= 4 && sInBar < 0.5 && kindOf(barI - 1) !== 2) {
      ik = kindOf(barI - 1); iAge = sInBar + BAR; iw = (1 - sInBar / 0.5) ** 2;
    }
    const sweep = inter && kind === 2;
    const fc = sweep ? 0.035 * Math.pow(1.12 / 0.035, sInBar / BAR) : 0;

    // ── La main : sa présence, sa traînée, les barres qu'elle soulève.
    ptr.a += (ptr.ta - ptr.a) * (1 - Math.exp(-dt * 6));
    const dec = Math.exp(-dt * 3.2);
    for (let k = 0; k < N; k++) T[k] *= dec;
    if (ptr.ta > 0 && ptr.lx !== null) {
      const ddx = ptr.x - ptr.lx, ddy = ptr.y - ptr.ly;
      const n = Math.min(60, Math.ceil(Math.hypot(ddx, ddy) / 0.45));
      for (let s = 1; s <= n; s++) splat(ptr.lx + (ddx * s) / n, ptr.ly + (ddy * s) / n, 1.25, 0.2);
    }
    ptr.lx = ptr.x; ptr.ly = ptr.y;
    const bp = bandAt(ptr.x);
    for (let b = 0; b < B; b++) boost[b] = ptr.a * 0.42 * Math.exp(-(((b - bp) / 1.5) ** 2));

    // ── L'analyseur.
    for (let b = 0; b < B; b++) {
      const x = B > 1 ? b / (B - 1) : 0.5;
      let L = 0;
      if (live) {
        const n1 = noise(x * 4.2 + 7, tm * 0.55);
        const n2 = noise(x * 13 + 31, tm * 1.7);
        const n3 = noise(x * 41 + 90, tm * 6.5);
        L = (0.5 - 0.15 * x) * (0.4 + 0.8 * n1) + 0.18 * (n2 - 0.5) + 0.12 * (n3 - 0.5);
        // La grosse caisse, sur chaque temps (plus forte sur le premier).
        L += kick * (0.56 + 0.16 * acc) * Math.exp(-(((x - 0.02) / 0.14) ** 2));
        // La basse, sur les croches.
        const e8 = bt * 2 - Math.floor(bt * 2);
        L += 0.3 * Math.exp(-(((x - 0.17) / 0.08) ** 2)) * Math.exp(-e8 * 4) * (0.4 + 0.6 * noise(Math.floor(bt * 2) * 0.73, 3.3));
        // La caisse claire, sur 2 et 4.
        const snr = beatN % 2 === 1 ? Math.exp(-ph * 4.5) : 0;
        L += snr * 0.34 * Math.exp(-(((x - 0.46) / 0.2) ** 2)) * (0.7 + 0.6 * n2);
        // Les charlestons, à contretemps, et les doubles croches.
        const hat = Math.floor(bt * 2) % 2 ? Math.exp(-e8 * 7) : 0;
        const s16 = Math.exp(-(bt * 4 - Math.floor(bt * 4)) * 10);
        L += (hat * 0.3 + s16 * 0.1) * smooth(0.58, 0.92, x) * (0.6 + 0.8 * n3);
        L += acc * kick * 0.1;
        if (sweep) {
          // Le balayage de filtre : tout ce qui est au-dessus de la coupure
          // s'éteint, une résonance brillante monte des graves aux aigus.
          const q = x / fc;
          L = (L + 0.1) / (1 + q ** 6) + 0.8 * Math.exp(-(((x - fc) / 0.045) ** 2));
        } else if (inter) L = 0;           // les anneaux, le soleil : les barres lâchent
      }
      L += boost[b];
      const tg = clamp(L, 0, 1.06);
      if (tg > lvl[b]) lvl[b] = tg;
      else lvl[b] = Math.max(tg, lvl[b] - dt * (0.8 + 2.3 * lvl[b]));
      if (lvl[b] >= pk[b]) { pk[b] = lvl[b]; pkV[b] = 0; pkHold[b] = 0.34; }
      else if (pkHold[b] > 0) pkHold[b] -= dt;
      else { pkV[b] += dt * 1.5; pk[b] = Math.max(lvl[b], pk[b] - pkV[b] * dt); }
    }

    V.fill(0); HT.fill(0); X.fill(0);
    const sweepHot = sweep ? fc : -1;
    for (let i = 0; i < C; i++) {
      const b = bandOf[i];
      if (b < 0) continue;
      const hf = heightOf(lvl[b]);
      const yTop = H * (1 - hf);
      const span = Math.max(pitch, H - yTop);
      const xb = B > 1 ? b / (B - 1) : 0.5;
      const res = sweepHot > 0 ? Math.exp(-(((xb - sweepHot) / 0.05) ** 2)) : 0;
      for (let j = R - 1; j >= 0; j--) {
        const y = rowY[j];
        const cov = clamp((y + pitch * 0.5 - yTop) / pitch, 0, 1);
        if (cov <= 0) break;
        const k = j * C + i;
        const inBar = 1 - (y - yTop) / span;           // 1 en haut de la barre
        const abs = clamp(1 - y / H, 0, 1);              // 1 en haut du mur
        V[k] = cov * (0.3 + 0.7 * inBar ** 1.4);
        HT[k] = 0.04 + 0.6 * abs ** 1.2 + 0.22 * inBar ** 6 + 0.3 * res;
      }
      // La crête : une diode crème, au-dessus de la barre.
      if (pk[b] > 0.02) {
        const py = H * (1 - heightOf(pk[b]));
        const j = Math.floor((py * DPR + oy) / P);
        if (j >= 0 && j < R && rowY[j] < yTop - pitch * 0.5) { const k = j * C + i; V[k] = 0.98; HT[k] = 0.97; }
      }
    }

    // La mise sous tension : une ligne qui descend le mur.
    if (!live) {
      const ys = (1 + tm / INTRO) * (H + 4 * pitch) - 2 * pitch;
      for (let j = 0; j < R; j++) {
        const d = (rowY[j] - ys) / pitch;
        const v = d > 0 ? Math.exp(-d * d * 1.2) * 0.85 : Math.exp(d * 0.55) * 0.22;
        if (v < 0.01) continue;
        for (let i = 0; i < C; i++) { const k = j * C + i; V[k] = v; HT[k] = d > -0.5 ? 0.9 : 0.35; }
      }
    }

    // ── L'intermède : les anneaux ou le soleil, depuis le titre.
    if (iw > 0.002) {
      const ringV = maxD / 1.25;
      const rot = (Math.floor(iAge / BEAT) + 1 - Math.exp(-((iAge % BEAT) / BEAT) * 9)) * (Math.PI / RAYS) + iAge * 0.08;
      const kb = Math.exp(-((iAge % BEAT) / BEAT) * 4.5);
      for (let j = 0; j < R; j++) {
        const dy = j - tcy;
        for (let i = 0; i < C; i++) {
          const dx = i - tcx, d = Math.hypot(dx, dy);
          let v = 0, h = 0.5;
          if (ik === 0) {
            for (let q = 0; q < 4; q++) {
              const age = iAge - q * BEAT;
              if (age < 0 || age > 1.7) continue;
              const r = age * ringV, w = 0.95 + age * 0.9;
              const a = (q === 0 ? 1.15 : 0.82) * (1 - age / 1.7) ** 1.4;
              const e = (Math.exp(-(((d - r) / w) ** 2)) + 0.32 * Math.exp(-(((d - r * 0.78) / (w * 0.8)) ** 2))) * a;
              if (e > v) { v = e; h = q === 0 ? 0.97 : 0.52; }
            }
          } else {
            const th = Math.atan2(dy, dx);
            const ray = (0.5 + 0.5 * Math.cos(RAYS * (th - rot))) ** 20;
            const rad = smooth(2.5, 10, d) * (1 - 0.45 * smooth(maxD * 0.55, maxD, d));
            v = ray * rad * (0.42 + 0.7 * kb);
            h = 0.3 + 0.45 * ray + 0.25 * kb;
          }
          v *= iw;
          const k = j * C + i;
          if (v > V[k]) { V[k] = v; HT[k] = h; }
        }
      }
    }

    // ── La main posée sur le mur, et les gerbes.
    for (let n = bursts.length - 1; n >= 0; n--) if (t - bursts[n].t0 > 1.6) bursts.splice(n, 1);
    const hov = ptr.a > 0.01;
    if (hov || bursts.length) {
      for (let j = 0; j < R; j++) {
        for (let i = 0; i < C; i++) {
          let add = 0;
          if (hov) { const d2 = (i - ptr.x) ** 2 + (j - ptr.y) ** 2; if (d2 < 30) add += ptr.a * (0.4 + 0.25 * kick) * Math.exp(-d2 / 4.4); }
          for (const bu of bursts) {
            const age = t - bu.t0, d = Math.hypot(i - bu.x, j - bu.y), r = age * bu.v;
            if (d > r + 5 && d > 6) continue;
            add += 1.15 * Math.exp(-(((d - r) / 1.15) ** 2)) * (1 - age / 1.6) ** 1.5;
            add += 1.5 * Math.exp(-((d / 2.3) ** 2)) * Math.exp(-age * 7);
            const pass = age - d / bu.v;
            if (pass > 0 && d < bu.v * 0.9 && hash(i, j, bu.s) > 0.83) add += 0.95 * Math.exp(-pass * 4.2);
          }
          if (add > 0.003) X[j * C + i] = add;
        }
      }
    }

    // ── Le masque, l'élan de la grosse caisse, et l'écriture.
    const em = 1 - Math.exp(-dt * 5);
    let settled = true;
    const gain = (0.84 + 0.16 * kick + 0.1 * acc * kick) * (1 - 0.6 * scrollP);
    const flash = acc * Math.exp(-ph * 9) * 0.2;
    const dA = iA.data, dK = iK.data;
    for (let k = 0; k < N; k++) {
      if (maskMoving) { M[k] += (MT[k] - M[k]) * em; if (Math.abs(MT[k] - M[k]) > 0.004) settled = false; }
      const m = M[k];
      let v = V[k] * m, h = HT[k] + flash;
      const add = (X[k] + T[k]) * (0.45 + 0.55 * m);
      if (add > 0.003) { h = (h * v + 0.93 * add) / (v + add); v += add; }
      v *= gain;
      const o = k * 4;
      if (v < 0.006) { dA[o + 3] = 0; dK[o + 3] = 0; pr[k] = pg[k] = pb[k] = pa[k] = 0; continue; }
      // Une diode faible reste rose (jamais grise) ; seules les plus vives blanchissent.
      const hh = clamp(h * (0.35 + 0.65 * smooth(0.18, 0.95, v)) + Math.max(0, v - 0.9) * 0.9, 0, 1);
      const li = ((hh * 255) | 0) * 3;
      const r = LUT[li], g = LUT[li + 1], b = LUT[li + 2];
      dA[o] = r; dA[o + 1] = g; dA[o + 2] = b; dA[o + 3] = Math.min(1, v) * 255;
      dK[o] = fg[0]; dK[o + 1] = fg[1]; dK[o + 2] = fg[2]; dK[o + 3] = smooth(0.8, 1, hh) * smooth(0.68, 1.1, v) * 235;
      const vb = Math.min(1.4, v);
      pr[k] = r * vb; pg[k] = g * vb; pb[k] = b * vb; pa[k] = vb;
    }
    if (maskMoving && settled) maskMoving = false;

    // La haze : la lueur réduite au quart, puis floutée.
    zr.fill(0); zg.fill(0); zb.fill(0); za.fill(0);
    for (let j = 0; j < R; j++) {
      const zj = (j >> 2) * hc;
      for (let i = 0; i < C; i++) {
        const k = j * C + i, z = zj + (i >> 2);
        zr[z] += pr[k]; zg[z] += pg[k]; zb[z] += pb[k]; za[z] += pa[k];
      }
    }
    blur4([pr, pg, pb, pa], C, R, tmp, 2);
    blur4([zr, zg, zb, za], hc, hr, ztmp, 2);
    writeGlow(iB.data, pr, pg, pb, pa, N, 1);
    writeGlow(iZ.data, zr, zg, zb, za, hc * hr, 1 / 16);
  }

  function writeGlow(d, r, g, b, a, n, s) {
    for (let k = 0; k < n; k++) {
      const o = k * 4, al = a[k];
      if (al < 0.002) { d[o + 3] = 0; continue; }
      d[o] = r[k] / al; d[o + 1] = g[k] / al; d[o + 2] = b[k] / al; d[o + 3] = Math.min(1, al * s) * 255;
    }
  }

  function splat(cx, cy, rad, amp) {
    const R2 = Math.ceil(rad * 2.6);
    const i0 = Math.max(0, Math.floor(cx - R2)), i1 = Math.min(C - 1, Math.ceil(cx + R2));
    const j0 = Math.max(0, Math.floor(cy - R2)), j1 = Math.min(R - 1, Math.ceil(cy + R2));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const k = j * C + i;
        T[k] = Math.min(1.05, T[k] + amp * Math.exp(-((i - cx) ** 2 + (j - cy) ** 2) / (rad * rad)));
      }
    }
  }

  function draw() {
    xA.putImageData(iA, 0, 0); xB.putImageData(iB, 0, 0); xZ.putImageData(iZ, 0, 0);
    const GW = C * P, GH = R * P;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'copy';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cA, -ox, -oy, GW, GH);
    // Les ronds des diodes.
    ctx.globalCompositeOperation = 'destination-in';
    ctx.setTransform(1, 0, 0, 1, -ox, -oy);
    ctx.fillStyle = dotPat; ctx.fillRect(0, 0, GW, GH);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Le cœur blanc des plus vives.
    if (CORE) {
      xK.putImageData(iK, 0, 0);
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.globalCompositeOperation = 'copy';
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(cK, -ox, -oy, GW, GH);
      tctx.globalCompositeOperation = 'destination-in';
      tctx.setTransform(1, 0, 0, 1, -ox, -oy);
      tctx.fillStyle = corePat; tctx.fillRect(0, 0, GW, GH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(cT, 0, 0);
    }
    // La lueur, puis la brume.
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 0.52 + 0.16 * kickNow;
    ctx.drawImage(cB, -ox, -oy, GW, GH);
    ctx.globalAlpha = 0.34 + 0.16 * kickNow;
    ctx.drawImage(cZ, -ox, -oy, hc * 4 * P, hr * 4 * P);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (pulse) pulse.style.opacity = ((0.06 + 0.6 * kickNow * kickNow) * (1 - scrollP)).toFixed(3);
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (LITE && last && now - last < 31) return;          // 30 images par seconde au doigt
    const dt = last ? Math.min(0.066, (now - last) / 1000) : 0.016;
    last = now;
    t += dt;
    compute(dt);
    draw();
  }
  const start = () => {
    if (running || still || !onScreen || document.hidden) return;
    running = true; last = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

  /* Une image juste, sans le temps qui passe : on joue l'analyseur deux
     secondes en silence, et on s'arrête sur un premier temps. */
  function settle(at) {
    t = at - 2.4;
    while (t < at) { t += 1 / 60; compute(1 / 60); }
    draw();
  }

  readColors();
  layout();
  if (still) { settle(INTRO + 5 * BAR + 0.07); wall.classList.add('is-on'); }
  else { compute(0); draw(); requestAnimationFrame(() => wall.classList.add('is-on')); }

  // Les polices et l'entrée du titre déplacent le texte : on remesure.
  let rq = 0;
  const relayout = () => {
    if (rq) return;
    rq = requestAnimationFrame(() => {
      rq = 0;
      const r = stage.getBoundingClientRect();
      if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) { layout(); if (still) settle(INTRO + 5 * BAR + 0.07); else if (!running) { compute(0); draw(); } }
      else { measure(still); if (still) draw(); }
    });
  };
  document.fonts?.ready.then(relayout);
  setTimeout(relayout, 1900);
  new ResizeObserver(relayout).observe(stage);

  if (still) return;

  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen) start(); else stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // La main : la souris allume ce qu'elle touche ; un clic, un appui au
  // doigt lancent une gerbe et font sauter les barres sous elle.
  const toCell = (e) => {
    const r = wall.getBoundingClientRect();
    return [((e.clientX - r.left) * DPR + ox) / P - 0.5, ((e.clientY - r.top) * DPR + oy) / P - 0.5];
  };
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const [x, y] = toCell(e);
    if (ptr.ta === 0) { ptr.lx = x; ptr.ly = y; }
    ptr.x = x; ptr.y = y; ptr.ta = 1;
  });
  hero.addEventListener('pointerleave', () => { ptr.ta = 0; ptr.lx = null; });
  let tapT = 0;
  hero.addEventListener('pointerdown', (e) => {
    const [x, y] = toCell(e);
    bursts.push({ x, y, t0: t, v: 30 + (small ? 4 : 10), s: Math.random() * 97 });
    if (bursts.length > 5) bursts.shift();
    const bp = bandAt(x);
    for (let b = 0; b < B; b++) {
      const k = Math.exp(-(((b - bp) / 2.2) ** 2));
      lvl[b] = Math.max(lvl[b], 1.04 * k);
    }
    if (e.pointerType !== 'mouse') {
      ptr.x = x; ptr.y = y; ptr.lx = x; ptr.ly = y; ptr.ta = 1;
      clearTimeout(tapT); tapT = setTimeout(() => { ptr.ta = 0; ptr.lx = null; }, 650);
    }
  }, { passive: true });

  // En descendant : le mur s'apaise et glisse un peu moins vite que la page.
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top',
    onUpdate: (self) => { scrollP = self.progress; }
  });
  gsap.to(wall, {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });

  if (import.meta.env?.DEV) {
    window.__muLeds = {
      get t() { return t; }, set t(v) { t = v; },
      jump(v) { t = v; }, ptr, bursts,
      info: () => ({ W, H, DPR, P, C, R, B, lo, hi, tcx, tcy }),
      bench(n = 60) { const a = performance.now(); for (let k = 0; k < n; k++) { compute(1 / 60); draw(); } return (performance.now() - a) / n; }
    };
  }
  start();
}
