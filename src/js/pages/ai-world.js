/**
 * AI PRODUCTION — la page vit dans son monde (18/10/2026).
 *
 * Dominique : « pas juste un changement de couleur… que chaque page vive de
 * son thème à travers visuel et interaction, effets ». Le monde de cette
 * page : « du bruit à la vision ». Le grain devient une trame, la trame
 * devient une forme. Partout entre l'ouverture et la demande :
 *
 *   initScramble  les petits titres mono se décodent à l'entrée (des signes
 *                 qui se fixent en lettres, de gauche à droite) ;
 *   initSeams     entre les sections, un filet de points dispersés qui se
 *                 range en ligne au défilement ;
 *   initMix       l'approche : trois trames vivantes qui font la mise au
 *                 point au survol (au toucher : celle du milieu de l'écran) ;
 *   initMonitor   les services : un moniteur où le pictogramme du service
 *                 survolé ou ouvert apparaît du gros grain au net ;
 *   initTags      les étiquettes : la même petite image faite de trois
 *                 façons (à la main, en trame, en pointillés) ;
 *   initFlow      le processus : le flux de points ne tourne que visible ;
 *   initWall      le portfolio vide : quatre cases qui attendent.
 *
 * Tout est abstrait et décoratif (aria-hidden) : jamais une image présentée
 * comme produite par une IA. Économie : les canevas ne se redessinent que
 * visibles, onglet affiché, et seulement quand quelque chose change ; le
 * grain bat à ~9 images/s. Sur écran tactile, moins de points, et le survol
 * devient le défilement ou le toucher. En mouvement réduit : une seule image,
 * nette, et plus rien ne bouge.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────── Outils ─────────────── */
const TAU = Math.PI * 2;
const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const sstep = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const hh = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
const h3 = (x, y, z) => hh(x + z * 57.31, y - z * 13.77);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (i, j) => BAYER[(j & 3) * 4 + (i & 3)];
const pad = (n) => String(n).padStart(2, '0');
const still = reduced();

/* Une couleur du thème, lue DANS l'élément qui la montre (en Papier, une
   section `.dv-night` porte la nuit de la division). */
function rgb(expr, host) {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;color:${expr}`;
  host.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const m = c.match(/[\d.]+/g) || ['255', '255', '255'];
  const k = c.startsWith('color(') ? 255 : 1;
  return [0, 1, 2].map((i) => Math.round(Number(m[i]) * k));
}
const rgbs = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const onPalette = (fn) => window.addEventListener('palette:change', () => setTimeout(fn, 90));

/* Le canevas à la taille de sa boîte, net sur écran dense. */
function fit(cv, max = LITE ? 1.5 : 2) {
  const w = cv.clientWidth || 1, h = cv.clientHeight || 1;
  const dpr = Math.min(window.devicePixelRatio || 1, max);
  const pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, W: w, H: h };
}

/* Visible ou non (avec une marge) : les boucles s'arrêtent hors de l'écran. */
function seen(el, cb, rootMargin = '60px 0px') {
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin }).observe(el);
}

/* Une seule horloge pour tous les canevas de la page. */
const loops = new Set();
gsap.ticker.add(() => {
  if (document.hidden || !loops.size) return;
  const now = performance.now();
  loops.forEach((f) => f(now));
});

/* Des disques groupés par teinte et par opacité : un seul `fill` par lot,
   au lieu d'un par point. */
function dots() {
  const B = new Map();
  return {
    add(key, x, y, r) {
      let p = B.get(key);
      if (!p) { p = new Path2D(); B.set(key, p); }
      p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU);
    },
    flush(ctx, style) {
      B.forEach((p, key) => {
        const [c, a] = key.split('|');
        ctx.globalAlpha = Number(a);
        ctx.fillStyle = style[c];
        ctx.fill(p);
      });
      ctx.globalAlpha = 1;
    }
  };
}
const q8 = (a) => (Math.round(cl(a) * 8) / 8).toFixed(3);   // l'opacité, en huit paliers

/* ═══════════════════ LES TITRES QUI SE DÉCODENT ═══════════════════
   Le texte réel reste lisible par les lecteurs d'écran (`u-sr`) ; seule la
   copie visible (aria-hidden) passe par les signes. */
const GLY = '#%&*+=-/<>_:;01';
export function decode(node, text, dur = 0.75) {
  if (!node) return;
  if (still) { node.textContent = text; return; }
  const n = text.length;
  const at = [...text].map((_, i) => (i / Math.max(1, n - 1)) * 0.6 + Math.random() * 0.25);
  if (node._scr) node._scr.kill();
  const o = { p: 0 };
  let frame = -1;
  node._scr = gsap.to(o, {
    p: 1, duration: dur, ease: 'none',
    onUpdate() {
      const f = Math.floor(o.p * dur * 28);   // ~28 changements par seconde
      if (f === frame) return;
      frame = f;
      let s = '';
      for (let i = 0; i < n; i++) {
        const ch = text[i];
        s += ch === ' ' || o.p >= at[i] + 0.15 ? ch : GLY[(Math.random() * GLY.length) | 0];
      }
      node.textContent = s;
    },
    onComplete() { node.textContent = text; node._scr = null; }
  });
}

function initScramble() {
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    const text = el.textContent.trim();
    const sr = document.createElement('span');
    sr.className = 'u-sr';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.className = 'ai-scr';
    vis.setAttribute('aria-hidden', 'true');
    vis.textContent = text;
    el.textContent = '';
    el.append(sr, vis);
    if (still) return;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => decode(vis, text, 0.8) });
  });
}

/* ═══════════════════ LES FILETS DE POINTS ═══════════════════
   Entre deux sections, un filet de points. À l'arrivée, les points dispersés
   se rangent en ligne du centre vers les bords (au défilement). Depuis le
   18/10 (Dominique : « il peut faire des animations en continu, et comme il
   y en a plusieurs, chacun différent de l'autre »), chaque filet vit ensuite
   à sa façon, en boucle, tant qu'il est à l'écran :
     0  le balayage : une impulsion violette parcourt la ligne et soulève les
        points sur son passage, comme un modèle qui lit ;
     1  l'onde : la ligne devient un signal qui ondule et se module ;
     2  le débruitage : la ligne se brouille en grain, puis se remet en ordre
        du centre vers les bords, et recommence — du bruit à la vision ;
     3  le flux : des paquets de points filent le long de la ligne, à des
        vitesses différentes, et clignotent comme des bits. */
function initSeams() {
  document.querySelectorAll('.ai-seam').forEach((box, idx) => {
    const cv = box.querySelector('canvas');
    if (!cv) return;
    const kind = Number(box.dataset.seam ?? idx) % 4;
    const S = { p: still ? 1 : 0 };
    let C, t = 0, last = 0, vis = false;
    const colors = () => { C = { f: rgbs(rgb('var(--fg)', box)), d: rgbs(rgb('var(--dv)', box)) }; };

    // Ce que chaque filet ajoute à un point : un décalage vertical (en part
    // de l'amplitude), une lumière (0 → 1) et un désordre (0 → 1).
    const live = (u, i) => {
      switch (kind) {
        case 0: {                                        // le balayage
          const head = (t * 0.22) % 1.3 - 0.15;
          const g = Math.exp(-(((u - head) / 0.045) ** 2));
          const trail = u < head ? Math.exp(-(head - u) / 0.12) * 0.5 : 0;
          return { dy: -g * 0.55, lit: Math.max(g, trail), mess: 0 };
        }
        case 1: {                                        // l'onde
          const env = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.7 + u * 3));
          const w = Math.sin(u * 22 - t * 2.6) * 0.42 + Math.sin(u * 51 + t * 1.7) * 0.14;
          return { dy: w * env, lit: Math.max(0, w * env * 1.6), mess: 0 };
        }
        case 2: {                                        // le débruitage
          const cyc = (t % 6) / 6;                       // 6 s : brouiller, ranger, tenir
          const front = sstep(0.18, 0.72, cyc) * 0.62;   // l'ordre gagne depuis le centre
          const dist = Math.abs(u - 0.5) + hh(i, 4.4) * 0.08;
          const noisy = cyc < 0.12 ? sstep(0, 0.12, cyc) : dist > front ? 1 : 0;
          const settle = cyc > 0.9 ? 1 - sstep(0.9, 1, cyc) : 1;
          const m = cl(noisy * settle);
          return { dy: 0, lit: (1 - m) * Math.exp(-(((u - 0.5) / 0.3) ** 2)) * 0.8, mess: m };
        }
        default: {                                       // le flux
          let lit = 0;
          for (let k = 0; k < 5; k++) {
            const sp = 0.07 + hh(k, 9.1) * 0.16;
            const pos = (hh(k, 2.2) + t * sp) % 1.2 - 0.1;
            const len = 0.025 + hh(k, 5.5) * 0.05;
            const d = u - pos;
            if (d < 0 && d > -len) lit = Math.max(lit, 1 - (-d / len) * 0.6);
          }
          const blink = hh(i, Math.floor(t * 6)) > 0.94 ? 0.6 : 0;
          return { dy: 0, lit: Math.max(lit, blink), mess: 0 };
        }
      }
    };

    const draw = () => {
      const { ctx, W, H } = fit(cv);
      const step = LITE ? 8 : 7;
      const n = Math.max(8, Math.floor(W / step));
      const mid = H / 2, amp = H * 0.44;
      const D = dots();
      ctx.fillStyle = C.f;
      const running = !still && S.p > 0.98;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, x = u * W;
        const r1 = hh(i, 3.1), r2 = hh(i, 7.7), r3 = hh(i, 1.3);
        const d = Math.abs(u - 0.5) * 0.75 + r1 * 0.22;
        let q = sstep(d, d + 0.4, S.p);
        const edge = sstep(0, 0.1, u) * sstep(0, 0.1, 1 - u);
        const glow = Math.exp(-(((u - 0.5) / 0.17) ** 2));
        const L = running ? live(u, i) : { dy: 0, lit: 0, mess: 0 };
        if (L.mess) q *= 1 - L.mess;
        // Le grain du débruitage bouge à chaque instant ; le reste est posé.
        const jitter = L.mess ? (hh(i, Math.floor(t * 9)) - 0.5) * 2 * amp * L.mess : 0;
        const y = mid + (r2 - 0.5) * 2 * amp * (1 - q) * (L.mess ? 0 : 1) + jitter + L.dy * amp;
        const lit = cl(Math.max(glow * 0.6, L.lit));
        const a = mix(0.16 + r3 * 0.34, 0.2 + lit * 0.78, q) * edge;
        if (a < 0.02) continue;
        if (q < 0.55) {
          // Le grain : de petits carrés.
          const r = 0.55 + r3 * 0.9;
          ctx.globalAlpha = a;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        } else {
          D.add(`${lit > 0.3 ? 'd' : 'f'}|${q8(a)}`, x, y, 0.95 + lit * 1.1);
        }
      }
      ctx.globalAlpha = 1;
      D.flush(ctx, C);
    };
    colors();
    draw();
    new ResizeObserver(() => draw()).observe(box);
    onPalette(() => { colors(); draw(); });
    if (still) return;
    gsap.to(S, {
      p: 1, ease: 'none', onUpdate: draw,
      scrollTrigger: { trigger: box, start: 'top 96%', end: 'top 52%', scrub: 0.6 }
    });
    // La vie en boucle, à ~30 images par seconde (à ~20 au doigt).
    const loop = (now) => {
      if (!vis || S.p < 0.98) return;
      if (now - last < (LITE ? 48 : 32)) return;
      t += Math.min(0.08, (now - (last || now)) / 1000);
      last = now;
      draw();
    };
    seen(box, (on) => {
      vis = on;
      if (on) { last = 0; loops.add(loop); } else loops.delete(loop);
    });
  });
}

/* ═══════════════════ L'APPROCHE : TROIS MISES AU POINT ═══════════════════
   `f` (0 → 1) la mise au point d'une trame. Au repos, elles restent à
   mi-chemin (on devine la forme dans le grain) ; au survol, celle-ci se
   fait nette et les deux autres retournent au grain.
     01  la direction : des traits au hasard qui s'alignent, de gauche à
         droite, vers un cap ;
     02  le savoir-faire : une trame qui s'ordonne, une zone choisie et ses
         traits de coupe ; la souris y promène une loupe ;
     03  les outils : un grain de télévision qui devient l'anneau de
         l'ouverture, en trame ordonnée. */
function drawDirection(P, ctx, W, H, C, tick, t) {
  const c = LITE ? 14 : 12;
  const cols = Math.floor(W / c), rows = Math.floor(H / c);
  const ox = (W - cols * c) / 2 + c / 2, oy = (H - rows * c) / 2 + c / 2;
  const tx = W * 0.78, ty = H * 0.5;
  const L = c * 0.36;
  const sway = P.hover ? 0.07 : 0;
  const paths = new Map();
  const seg = (key, x, y, a, l) => {
    let p = paths.get(key);
    if (!p) { p = new Path2D(); paths.set(key, p); }
    const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
    p.moveTo(x - dx, y - dy); p.lineTo(x + dx, y + dy);
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * c, y = oy + j * c;
      const u = x / W;
      const q = sstep(0, 1, P.f * 1.7 - u * 0.62 - hh(i, j) * 0.12);
      const an = h3(i, j, Math.floor(tick * 0.6 + hh(j, i) * 5)) * TAU;
      const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
      let af = Math.atan2(dy, dx) + 0.55 * Math.exp(-d / (H * 0.42));
      if (sway) af += sway * Math.sin(t * 1.3 + x * 0.025 + y * 0.01);
      const da = ((af - an + Math.PI * 3) % TAU) - Math.PI;
      const a = an + da * q;
      if (d < c * 1.2 && q > 0.5) continue;                 // le cap reste dégagé
      const near = d < H * 0.3 && q > 0.6;
      const al = mix(0.2 + 0.26 * hh(i + 3, j), near ? 0.95 : 0.5 + 0.25 * (1 - d / W), q);
      seg(`${near ? 'd' : 'f'}|${q8(al)}`, x, y, a, L * (0.55 + 0.45 * q));
    }
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.3;
  paths.forEach((p, key) => {
    const [k, a] = key.split('|');
    ctx.globalAlpha = Number(a);
    ctx.strokeStyle = C[k];
    ctx.stroke(p);
  });
  // Le cap : un anneau, un point.
  const k = sstep(0.55, 1, P.f);
  if (k > 0.01) {
    ctx.globalAlpha = k;
    ctx.strokeStyle = C.d;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(tx, ty, H * 0.085 + (1 - k) * 8, 0, TAU); ctx.stroke();
    ctx.fillStyle = C.d;
    ctx.beginPath(); ctx.arc(tx, ty, 2.6, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawExpertise(P, ctx, W, H, C, tick) {
  const c = LITE ? 12 : 10;
  const cols = Math.floor(W / c), rows = Math.floor(H / c);
  const ox = (W - cols * c) / 2 + c / 2, oy = (H - rows * c) / 2 + c / 2;
  const R = { x0: W * 0.36, x1: W * 0.8, y0: H * 0.25, y1: H * 0.75 };
  const rcx = (R.x0 + R.x1) / 2, rcy = (R.y0 + R.y1) / 2;
  const lr = Math.min(W, H) * 0.3;                            // le rayon de la loupe
  const D = dots();
  ctx.fillStyle = C.f;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * c, y = oy + j * c;
      const inR = x > R.x0 && x < R.x1 && y > R.y0 && y < R.y1;
      const dR = Math.hypot((x - rcx) / W, (y - rcy) / H) * 1.6;
      let q = sstep(0, 1, P.f * 1.55 - dR * 0.55);
      let mag = 1;
      if (P.lens > 0.01) {
        const l = P.lens * (1 - sstep(lr * 0.45, lr, Math.hypot(x - P.px, y - P.py)));
        q = Math.max(q, l);
        mag = 1 + 0.7 * l;
      }
      if (q < 0.98 && h3(i, j, Math.floor(tick + hh(i, j) * 4)) < 0.4) {
        const r = c * (0.08 + 0.12 * hh(j, i));
        ctx.globalAlpha = 0.42 * (1 - q);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      if (q > 0.02) D.add(`${inR ? 'd' : 'f'}|${q8(q * (inR ? 0.95 : 0.4))}`, x, y, c * (inR ? 0.27 : 0.12) * mag);
    }
  }
  ctx.globalAlpha = 1;
  D.flush(ctx, C);
  // Les traits de coupe autour de la zone choisie.
  const k = sstep(0.55, 1, P.f);
  if (k > 0.01) {
    const m = 7, arm = 13 * k;
    ctx.globalAlpha = k;
    ctx.strokeStyle = C.f;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const [x, y, sx, sy] of [[R.x0 - m, R.y0 - m, 1, 1], [R.x1 + m, R.y0 - m, -1, 1], [R.x0 - m, R.y1 + m, 1, -1], [R.x1 + m, R.y1 + m, -1, -1]]) {
      ctx.moveTo(x + sx * arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * arm);
    }
    ctx.stroke();
  }
  // La loupe.
  if (P.lens > 0.01) {
    ctx.globalAlpha = P.lens * 0.7;
    ctx.strokeStyle = C.f;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(P.px, P.py, lr * 0.72, 0, TAU); ctx.stroke();
    ctx.beginPath();
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI / 2;
      ctx.moveTo(P.px + Math.cos(ang) * lr * 0.78, P.py + Math.sin(ang) * lr * 0.78);
      ctx.lineTo(P.px + Math.cos(ang) * lr * 0.9, P.py + Math.sin(ang) * lr * 0.9);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawTools(P, ctx, W, H, C, tick) {
  const c = LITE ? 10 : 8;
  const cols = Math.floor(W / c), rows = Math.floor(H / c);
  const ox = (W - cols * c) / 2 + c / 2, oy = (H - rows * c) / 2 + c / 2;
  const cx = W * 0.5, cy = H * 0.5, R = H * 0.29;
  const D = dots();
  ctx.fillStyle = C.f;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * c, y = oy + j * c;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) / R;
      const ang = Math.atan2(dy, dx);
      const rays = 0.55 + 0.45 * Math.sin(ang * 7 + 1.3) * Math.sin(ang * 3 - 0.7);
      const rim = Math.exp(-(((d - 1) / 0.13) ** 2));
      const corona = d > 1 ? Math.exp(-(d - 1) * 2.3) * rays * 0.85 : Math.exp(-(1 - d) * 5.5) * 0.45;
      const v = Math.max(rim, corona);
      const q = sstep(0, 1, P.f * 1.65 - Math.abs(d - 1) * 0.5 - hh(i, j) * 0.12);
      if (q < 0.98 && h3(i, j, Math.floor(tick + hh(j, i) * 3)) < 0.32) {
        const r = c * 0.17;
        ctx.globalAlpha = 0.4 * (1 - q);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      if (q > 0.02 && v > bayer(i, j) * 0.92) D.add(`d|${q8(q * (0.55 + 0.45 * v))}`, x, y, c * (0.16 + 0.2 * v));
    }
  }
  ctx.globalAlpha = 1;
  D.flush(ctx, C);
}

const MIX_DRAW = [drawDirection, drawExpertise, drawTools];

function initMix() {
  const root = document.querySelector('[data-mix]');
  if (!root) return;
  const head = document.getElementById('mix-h');
  const BASE = 0.42;
  // Le libellé mono se décode à la mise au point : sur une copie visible
  // (aria-hidden), le vrai mot restant lisible par les lecteurs d'écran.
  const labelOf = (card) => {
    const lab = card.querySelector('.dv-mono');
    if (!lab) return null;
    const text = lab.textContent.trim();
    lab.innerHTML = '';
    const sr = document.createElement('span');
    sr.className = 'u-sr'; sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true'); vis.textContent = text; vis.dataset.text = text;
    lab.append(sr, vis);
    return vis;
  };
  const P = [...root.querySelectorAll('[data-mix-i]')].map((card) => ({
    card, k: Number(card.dataset.mixI),
    cv: card.querySelector('canvas'),
    meter: card.querySelector('.ai-mix__m'),
    label: labelOf(card),
    f: still ? 1 : 0, lens: 0, px: -999, py: -999, hover: false, drawn: '', tick: -1
  }));
  let C;
  const colors = () => { C = { f: rgbs(rgb('var(--fg)', root)), d: rgbs(rgb('var(--dv)', root)) }; };
  colors();

  const draw = (p, now = performance.now()) => {
    const { ctx, W, H } = fit(p.cv);
    const t = now / 1000;
    MIX_DRAW[p.k](p, ctx, W, H, C, still ? 0 : Math.floor(now / 110), t);
    p.meter?.style.setProperty('--f', p.f.toFixed(3));
  };
  const drawAll = () => P.forEach((p) => draw(p));
  drawAll();
  new ResizeObserver(drawAll).observe(root);
  onPalette(() => { colors(); drawAll(); });
  if (still) return;

  let vis = false, entered = false, active = -1;
  const intro = [];
  const to = (p, f, dur = 0.9) => gsap.to(p, { f, duration: dur, ease: 'power2.out', overwrite: 'auto' });
  const focus = (k) => {
    if (k === active) return;
    active = k;
    // L'entrée, si elle attend encore, ne doit pas reprendre la main après.
    intro.forEach((tw) => tw.kill());
    intro.length = 0;
    P.forEach((p) => {
      to(p, k < 0 ? BASE : p.k === k ? 1 : 0.16, k < 0 ? 0.9 : p.k === k ? 1 : 0.7);
      p.card.classList.toggle('is-on', p.k === k);
    });
    if (k >= 0) {
      const lab = P[k].label;
      if (lab) decode(lab, lab.dataset.text, 0.55);
    }
    if (head) { if (k >= 0 && !LITE) head.dataset.on = String(k); else delete head.dataset.on; }
  };

  seen(root, (v) => {
    vis = v;
    if (v && !entered) {
      entered = true;
      if (active < 0) P.forEach((p, i) => intro.push(gsap.to(p, { f: BASE, duration: 1.5, delay: 0.25 + i * 0.22, ease: 'power2.out' })));
    }
  });

  if (!LITE) {
    P.forEach((p) => {
      p.card.addEventListener('pointerenter', () => { p.hover = true; focus(p.k); });
      p.card.addEventListener('pointerleave', () => {
        p.hover = false;
        gsap.to(p, { lens: 0, duration: 0.5, ease: 'power2.out' });
        // Une autre colonne a peut-être déjà pris la main.
        requestAnimationFrame(() => { if (!P.some((o) => o.hover)) focus(-1); });
      });
      if (p.k === 1) {
        p.cv.parentElement.addEventListener('pointermove', (e) => {
          const r = p.cv.getBoundingClientRect();
          p.px = e.clientX - r.left; p.py = e.clientY - r.top;
          if (p.lens < 0.99) gsap.to(p, { lens: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        });
        p.cv.parentElement.addEventListener('pointerleave', () => gsap.to(p, { lens: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' }));
      }
    });
  } else {
    // Au toucher : la colonne qui passe au milieu de l'écran se fait nette ;
    // un toucher la choisit aussi.
    P.forEach((p) => {
      ScrollTrigger.create({
        trigger: p.card, start: 'top 62%', end: 'bottom 40%',
        onToggle: (self) => { if (self.isActive) focus(p.k); else if (active === p.k) focus(-1); }
      });
      p.card.addEventListener('click', () => focus(p.k));
    });
  }

  loops.add((now) => {
    if (!vis) return;
    const tick = Math.floor(now / 110);
    P.forEach((p) => {
      // On ne redessine que si la mise au point bouge, si le grain bat (il
      // reste du grain à l'écran), si la loupe bouge ou si la direction
      // ondule sous la souris.
      const sig = `${p.f.toFixed(3)}|${p.lens.toFixed(2)}|${p.px | 0},${p.py | 0}`;
      const grain = p.f < 0.995 && tick !== p.tick;
      const sway = p.k === 0 && p.hover && now - (p.last || 0) > 33;
      if (sig === p.drawn && !grain && !sway) return;
      p.drawn = sig; p.tick = tick; p.last = now;
      draw(p, now);
    });
  });
}

/* ═══════════════════ LES SERVICES : LE MONITEUR ═══════════════════
   Chaque service a son pictogramme, une fonction (x, y) → intensité, posée
   sur une trame ordonnée (Bayer). Pour l'afficher, quatre passes : 5, 10,
   20 rangées, puis la trame fine — du gros grain bruité au net, en 0,6 s.
   Trois pictogrammes vivent ensuite (la balle qui rebondit, l'onde de la
   voix, l'interférence). Des signes, pas des images. */
const sdBox = (x, y, hw, hh2) => {
  const dx = Math.abs(x) - hw, dy = Math.abs(y) - hh2;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
};
const ln = (d, w) => 1 - sstep(w * 0.55, w * 1.15, Math.abs(d));

const PICTO = [
  // 01 — la vidéo : un cadre, la lecture, la barre de temps
  () => (X, Y) => {
    const fr = sdBox(X, Y + 0.07, 0.5, 0.29);
    let v = Math.max(ln(fr, 0.02), fr < 0 ? 0.08 + 0.14 * (0.3 - Y) : 0);
    const px = X + 0.01, py = Y + 0.07;
    if (px > -0.07 && px < 0.1 && Math.abs(py) < (0.1 - px) * 0.62) v = 1;
    const ty = Y - 0.34;
    if (Math.abs(X) < 0.5 && Math.abs(ty) < 0.009) v = Math.max(v, 0.5);
    if (X > -0.5 && X < 0.08 && Math.abs(ty) < 0.018) v = 1;
    if (Math.hypot(X - 0.08, ty) < 0.038) v = 1;
    return v;
  },
  // 02 — les concepts et les éléments : une planche de six
  () => (X, Y) => {
    let v = 0;
    const cx = [-0.4, 0, 0.4], cy = [-0.19, 0.19];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const x = X - cx[c], y = Y - cy[r];
        const b = sdBox(x, y, 0.16, 0.15);
        if (b > 0.04) continue;
        v = Math.max(v, ln(b, 0.016) * 0.75);
        if (b >= 0) continue;
        const k = r * 3 + c;
        let s = 0;
        if (k === 0) s = Math.hypot(x, y) < 0.085 ? 1 : 0;
        else if (k === 1) s = y > -0.08 && y < 0.08 && Math.abs(x) < (y + 0.08) * 0.62 ? 1 : 0;
        else if (k === 2) s = ln(Math.hypot(x, y) - 0.075, 0.024);
        else if (k === 3) s = cl(0.5 + (x - y) * 2.8) * 0.92;
        else if (k === 4) s = sdBox(x, y, 0.075, 0.075) < 0 ? 0.6 : 0;
        else s = Math.abs(x) < 0.1 && Math.abs(y) < 0.1 && Math.hypot(((x + 0.33) % 0.066) - 0.033, ((y + 0.33) % 0.066) - 0.033) < 0.016 ? 1 : 0;
        v = Math.max(v, s);
      }
    }
    return v;
  },
  // 03 — la publicité : un panneau, son dégradé, ses lignes de titre
  () => (X, Y) => {
    let v = 0;
    const b = sdBox(X, Y + 0.1, 0.56, 0.27);
    if (b < 0) {
      v = 0.1 + 0.55 * cl((X + 0.56) / 1.12);
      if (Math.hypot(X - 0.27, Y + 0.12) < 0.15) v = 1;
      if (sdBox(X + 0.27, Y + 0.21, 0.2, 0.036) < 0) v = 0;
      if (sdBox(X + 0.35, Y + 0.09, 0.12, 0.022) < 0) v = 0;
      if (sdBox(X + 0.43, Y - 0.07, 0.045, 0.045) < 0) v = 1;
    }
    v = Math.max(v, ln(b, 0.018));
    if ((Math.abs(X - 0.3) < 0.02 || Math.abs(X + 0.3) < 0.02) && Y > 0.17 && Y < 0.4) v = Math.max(v, 0.8);
    if (Math.abs(Y - 0.4) < 0.009 && Math.abs(X) < 0.66) v = Math.max(v, 0.45);
    return v;
  },
  // 04 — les concepts vidéo : une pellicule, trois images
  () => (X, Y) => {
    let v = 0;
    if (Math.abs(Y) < 0.3 && Math.abs(X) < 0.7) {
      v = 0.16;
      const sx = ((X + 0.7) % 0.1) - 0.05;
      if (Math.abs(Math.abs(Y) - 0.25) < 0.026 && Math.abs(sx) < 0.022) v = 0;
      for (let k = -1; k <= 1; k++) {
        const fx = X - k * 0.44, b = sdBox(fx, Y, 0.19, 0.17);
        if (b < 0) {
          v = 0;
          const hz = 0.06 - k * 0.03;
          if (Y > hz) v = 0.28;
          if (Math.abs(Y - hz) < 0.01) v = 0.75;
          if (Math.hypot(fx - 0.06 * k, Y + 0.03 + k * 0.02) < 0.055 + 0.015 * (k + 1)) v = 1;
        }
        v = Math.max(v, ln(b, 0.014) * 0.85);
      }
    }
    if (Math.abs(Math.abs(Y) - 0.3) < 0.009 && Math.abs(X) < 0.7) v = 0.75;
    return v;
  },
  // 05 — le produit et la marque : un objet sur son socle, dans sa lumière
  () => (X, Y) => {
    let v = 0;
    const cy = Y + 0.5, half = 0.06 + cy * 0.42;
    if (Math.abs(X) < half && Y < 0.3) v = 0.36 * (1 - cy * 0.5) * (1 - (Math.abs(X) / half) * 0.55);
    if ((X / 0.34) ** 2 + ((Y - 0.27) / 0.06) ** 2 < 1) v = 0.78;
    if (Math.abs(X) < 0.34 && Y > 0.27 && Y < 0.44) v = Math.max(v, 0.48);
    const ob = sdBox(X, Y - 0.05, 0.07, 0.17) - 0.03;
    if (ob < 0) v = X < -0.045 ? 0.62 : 1;
    if (Math.abs(X) < 0.036 && Y > -0.27 && Y < -0.14) v = 1;
    if (ob < 0 && Math.abs(Math.hypot(X - 0.01, Y - 0.07) - 0.045) < 0.013) v = 0;
    return v;
  },
  // 06 — l'animation : une balle qui rebondit, et sa traîne (vivante)
  (t) => {
    const G = 0.36, HGT = [0.6, 0.36, 0.18], WID = [0.45, 0.33, 0.22];
    const pos = (s) => {
      let a = cl(s), x0 = -0.62;
      for (let k = 0; k < 3; k++) {
        const w = WID[k];
        if (a <= w || k === 2) { const u = cl(a / w); return [x0 + u * w * 1.24, G - 0.06 - HGT[k] * 4 * u * (1 - u)]; }
        a -= w; x0 += w * 1.24;
      }
      return [0, 0];
    };
    const now = (t * 0.32) % 1;
    const trail = [...Array(7)].map((_, k) => [...pos(now - k * 0.04), [1, 0.62, 0.44, 0.32, 0.24, 0.17, 0.12][k], 0.068 - k * 0.005]);
    const path = [...Array(46)].map((_, k) => pos(k / 45));
    return (X, Y) => {
      let v = Math.abs(Y - G) < 0.009 && Math.abs(X) < 0.66 ? 0.55 : 0;
      for (const [x, y] of path) if (Math.abs(X - x) < 0.014 && Math.abs(Y - y) < 0.014) { v = Math.max(v, 0.4); break; }
      for (const [x, y, a, r] of trail) if (Math.hypot(X - x, Y - y) < r) v = Math.max(v, a);
      return v;
    };
  },
  // 07 — le storyboard : trois cases, une caméra qui s'approche
  () => (X, Y) => {
    let v = 0;
    for (let k = -1; k <= 1; k++) {
      const x = X - k * 0.44, y = Y + 0.08;
      const b = sdBox(x, y, 0.18, 0.13);
      v = Math.max(v, ln(b, 0.016));
      if (b < 0) {
        if (Math.abs(y - 0.045) < 0.009) v = Math.max(v, 0.6);
        if (y > 0.045) v = Math.max(v, 0.2);
        if (Math.hypot(x - 0.02, y + 0.01) < 0.035 + (k + 1) * 0.028) v = 1;
      }
      if (Math.abs(Y - 0.16) < 0.013 && x > -0.18 && x < 0.12) v = Math.max(v, 0.5);
      if (Math.abs(Y - 0.215) < 0.013 && x > -0.18 && x < 0.02) v = Math.max(v, 0.5);
    }
    for (const ax of [-0.22, 0.22]) {
      const x = X - ax, y = Y + 0.08;
      if (x > -0.016 && x < 0.018 && Math.abs(y) < 0.028 - (x + 0.016) * 0.8) v = 1;
    }
    return v;
  },
  // 08 — la voix : une onde (vivante)
  (t) => (X, Y) => {
    let v = Math.abs(Y) < 0.007 && Math.abs(X) < 0.66 ? 0.4 : 0;
    const step = 0.046, i = Math.round(X / step), xb = i * step;
    if (Math.abs(X - xb) < 0.014 && Math.abs(xb) < 0.62) {
      const env = Math.exp(-xb * xb * 4.2);
      const h = env * (0.14 + 0.86 * Math.abs(Math.sin(i * 0.9 + t * 2.1) * Math.sin(i * 0.37 - t * 1.3)));
      if (Math.abs(Y) < 0.035 + h * 0.36) v = 1;
    }
    return v;
  },
  // 09 — les réseaux sociaux : trois formats verticaux
  () => (X, Y) => {
    let v = 0;
    for (const [cx, hw, hy, k] of [[-0.4, 0.13, 0.27, 0.6], [0.4, 0.13, 0.27, 0.6], [0, 0.17, 0.37, 1]]) {
      const x = X - cx;
      const b = sdBox(x, Y, hw - 0.03, hy - 0.03) - 0.03;
      if (b < 0) {
        v = 0;
        const top = -hy + 0.04, mid = hy * 0.3;
        if (Y > top && Y < mid && Math.abs(x) < hw - 0.035) v = (0.12 + 0.55 * cl((Y - top) / (mid - top))) * k;
        if (Math.hypot(x + hw * 0.45, Y - (mid + 0.07)) < hw * 0.18) v = k;
        if (Math.abs(Y - (mid + 0.07)) < 0.012 && x > -hw * 0.15 && x < hw * 0.65) v = 0.6 * k;
        if (Math.abs(Y - (mid + 0.13)) < 0.012 && x > -hw * 0.7 && x < hw * 0.35) v = 0.45 * k;
      }
      v = Math.max(v, ln(b, 0.016) * k);
    }
    return v;
  },
  // 10 — l'expérimental : une interférence (vivante, lente)
  (t, rows = 60) => {
    const ax = -0.1 + 0.035 * Math.sin(t * 0.5), ay = 0.025 * Math.cos(t * 0.4);
    const k = Math.min(68, rows * 1.15);   // des franges d'au moins cinq points
    return (X, Y) => {
      const r = Math.hypot(X, Y);
      if (r > 0.44) return 0;
      const d1 = Math.hypot(X - ax, Y - ay), d2 = Math.hypot(X - 0.12, Y + 0.04);
      return (0.5 + 0.5 * Math.sin(d1 * k) * Math.sin(d2 * k + t * 0.6)) * (1 - sstep(0.34, 0.44, r));
    };
  },
  // 11 — la postproduction : la timeline, l'étalonnage, la tête de lecture
  () => (X, Y) => {
    let v = 0;
    if (Math.abs(Y + 0.34) < 0.04 && Math.abs(X) < 0.62) v = 0.06 + 0.88 * cl((X + 0.62) / 1.24);
    const tracks = [[-0.18, [[-0.62, -0.3], [-0.27, 0.12], [0.15, 0.62]], 1], [-0.05, [[-0.5, -0.05], [0, 0.4]], 0.72], [0.09, [[-0.62, 0.22], [0.26, 0.62]], 0.48], [0.23, [[-0.62, 0.62]], 0.32]];
    for (const [ty, clips, k] of tracks) {
      if (Math.abs(Y - ty) > 0.05) continue;
      for (const [a, b] of clips) if (sdBox(X - (a + b) / 2, Y - ty, (b - a) / 2 - 0.008, 0.046) < 0) v = Math.max(v, k);
    }
    if (Math.abs(X - 0.08) < 0.009 && Y > -0.29 && Y < 0.32) v = 1;
    if (Y > -0.33 && Y < -0.27 && Math.abs(X - 0.08) < (-0.27 - Y) * 0.7 + 0.004) v = 1;
    return v;
  }
];
const LIVE = new Set([5, 7, 9]);

class Monitor {
  constructor(cv, host, ui = {}) {
    this.cv = cv; this.host = host; this.ui = ui;
    this.idx = -1; this.s = 3; this.lvl = -1; this.vis = false;
    this.colors();
  }

  colors() {
    this.C = { f: rgbs(rgb('var(--fg)', this.host)), d: rgbs(rgb('var(--dv)', this.host)) };
  }

  show(i) {
    if (i === this.idx) return;
    this.idx = i;
    const { n, t } = this.ui;
    if (n) n.textContent = i < 0 ? '--' : pad(i + 1);
    if (t) decode(t, i < 0 ? 'Standby' : (this.names?.[i] || ''), 0.55);
    this.tw?.kill();
    if (still) { this.s = 3; this.draw(); return; }
    this.s = 0;
    this.tw = gsap.to(this, { s: 3, duration: i < 0 ? 0.32 : 0.62, ease: 'none', onUpdate: () => this.draw(), onComplete: () => this.draw() });
  }

  draw(now = performance.now()) {
    const { ctx, W, H } = fit(this.cv);
    const t = now / 1000;
    const lvl = Math.min(3, Math.floor(this.s));
    // Une trame plus fine sur un petit moniteur (le service ouvert, au téléphone).
    const cell = W < 520 ? 5 : LITE ? 7 : 6;
    const ROWS = [5, 10, 20, Math.max(10, Math.floor(H / cell))];
    const NOISE = [0.85, 0.52, 0.22, 0];
    const idle = this.idx < 0;
    const L = idle ? 2 : lvl;
    const rows = ROWS[L], cols = Math.max(1, Math.round((rows * W) / H));
    if (this.ui.res && this.lvl !== L) this.ui.res.textContent = `${cols} × ${rows}`;
    this.lvl = L;
    const bw = W / cols, bh = H / rows, A = W / H;
    const g = L === 3 ? 0.7 : 1;
    const fn = idle ? null : PICTO[this.idx](t, ROWS[3]);
    const ss = L < 3 ? 3 : 1;
    const tick = Math.floor(t * (idle ? 6 : 14));
    const solid = new Path2D(), soft = new Path2D();
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        let v = 0;
        if (idle) {
          // L'attente : un grain latent, des grappes qui dérivent.
          const nx = i * 0.22, ny = j * 0.22 + t * 0.3;
          const a = hh(Math.floor(nx), Math.floor(ny)), b = hh(Math.floor(nx) + 1, Math.floor(ny));
          const c2 = hh(Math.floor(nx), Math.floor(ny) + 1), d = hh(Math.floor(nx) + 1, Math.floor(ny) + 1);
          const fx = sstep(0, 1, nx % 1), fy = sstep(0, 1, ny % 1);
          v = mix(mix(a, b, fx), mix(c2, d, fx), fy) * 0.4 + (h3(i, j, tick) - 0.5) * 0.16;
        } else {
          for (let sy = 0; sy < ss; sy++) {
            for (let sx = 0; sx < ss; sx++) {
              const u = (i + (sx + 0.5) / ss) / cols, w = (j + (sy + 0.5) / ss) / rows;
              v += fn(u * A - A / 2, w - 0.5);
            }
          }
          v /= ss * ss;
          if (NOISE[L]) v = mix(v, h3(i, j, tick + L * 7), NOISE[L]);
        }
        if (v <= bayer(i, j)) continue;
        const x = i * bw + g, y = j * bh + g;
        (v > 0.9 && L === 3 ? solid : soft).rect(x, y, bw - g * 2, bh - g * 2);
      }
    }
    ctx.globalAlpha = idle ? 0.55 : L < 3 ? 0.78 : 0.92;
    ctx.fillStyle = this.C.d;
    ctx.fill(soft);
    ctx.fillStyle = this.C.f;
    ctx.fill(solid);
    ctx.globalAlpha = 1;
  }

  tick(now) {
    if (!this.vis || this.tw?.isActive()) return;
    const live = this.idx < 0 || LIVE.has(this.idx);
    if (!live) return;
    if (now - (this.last || 0) < (this.idx < 0 ? 140 : 50)) return;
    this.last = now;
    this.draw(now);
  }
}

function initMonitor() {
  const acc = document.querySelector('#services [data-acc]');
  const box = document.querySelector('[data-pv]');
  if (!acc || !box) return;
  const items = [...acc.querySelectorAll('.dv-acc__i')];
  const names = items.map((it) => it.querySelector('.ai-acc__t')?.textContent.trim() || '');
  const narrow = matchMedia('(max-width: 60rem)');

  const mon = new Monitor(box.querySelector('canvas'), box, {
    n: box.querySelector('[data-pv-n]'), t: box.querySelector('[data-pv-t]'), res: box.querySelector('[data-pv-res]')
  });
  mon.names = names;
  mon.draw();
  seen(box, (v) => { mon.vis = v; });
  loops.add((now) => mon.tick(now));
  new ResizeObserver(() => mon.draw()).observe(box);

  // Sur téléphone : un petit moniteur dans le service ouvert, créé au besoin.
  const minis = new Map();
  const mini = (i) => {
    if (minis.has(i)) return minis.get(i);
    const slot = items[i].querySelector('.ai-acc__pv');
    if (!slot) return null;
    const cv = document.createElement('canvas');
    slot.append(cv);
    const m = new Monitor(cv, slot);
    m.names = names;
    m.draw();
    seen(slot, (v) => { m.vis = v; });
    new ResizeObserver(() => m.draw()).observe(slot);
    minis.set(i, m);
    return m;
  };
  loops.add((now) => minis.forEach((m) => m.tick(now)));
  onPalette(() => { mon.colors(); mon.draw(); minis.forEach((m) => { m.colors(); m.draw(); }); });

  let hover = -1, focused = -1, open = -1, timer = 0;
  const sync = () => {
    clearTimeout(timer);
    const i = hover >= 0 ? hover : focused >= 0 ? focused : open;
    timer = setTimeout(() => mon.show(i), hover >= 0 ? 70 : 0);
  };
  items.forEach((it, i) => {
    const btn = it.querySelector('.dv-acc__q');
    if (!LITE) {
      it.addEventListener('pointerenter', () => { hover = i; sync(); });
      it.addEventListener('pointerleave', () => { if (hover === i) { hover = -1; sync(); } });
    }
    btn?.addEventListener('focus', () => { focused = i; sync(); });
    btn?.addEventListener('blur', () => { if (focused === i) { focused = -1; sync(); } });
    // Après la liste (`initAccordion`, écoutée avant nous) : l'état est déjà posé.
    btn?.addEventListener('click', () => {
      open = items.findIndex((o) => o.classList.contains('is-open'));
      sync();
      if (narrow.matches && open === i) {
        const m = mini(i);
        if (m) { m.idx = -1; m.draw(); setTimeout(() => m.show(i), still ? 0 : 260); }
      }
    });
  });
}

/* ═══════════════════ LES ÉTIQUETTES : TROIS FAÇONS DE FAIRE ═══════════════════
   La même petite image (un cadre, un astre, une colline, l'horizon) :
     assisté      tracée à la main, puis deux touches de trame (l'outil) ;
     généré       sortie tout entière du grain, en trame, puis choisie (les
                  traits de coupe) ;
     démonstration en pointillés, avec deux variantes de l'astre essayées.
   Elle se refait à l'entrée, et au survol ou au toucher. */
function scene(W, H) {
  const F = { x: W * 0.07, y: H * 0.12, w: W * 0.86, h: H * 0.76 };
  const sun = { x: F.x + F.w * 0.68, y: F.y + F.h * 0.38, r: F.h * 0.2 };
  const hz = F.y + F.h * 0.68;
  const hill = (x) => hz - F.h * 0.2 * Math.exp(-((((x - F.x) / F.w - 0.27) / 0.19) ** 2));
  return { F, sun, hz, hill };
}

/* Un tracé « à la main » : une suite de polylignes qu'on dessine jusqu'à
   une fraction `s` de leur longueur totale. */
function strokes(ctx, list, s) {
  const lens = list.map((pts) => pts.reduce((acc, p, k) => (k ? acc + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0), 0));
  let left = s * lens.reduce((a, b) => a + b, 0);
  ctx.beginPath();
  list.forEach((pts) => {
    if (left <= 0) return;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length && left > 0; k++) {
      const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
      const l = Math.hypot(bx - ax, by - ay);
      const f = Math.min(1, left / l);
      ctx.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f);
      left -= l;
    }
  });
  ctx.stroke();
}
const rectPts = (F) => [[F.x, F.y], [F.x + F.w, F.y], [F.x + F.w, F.y + F.h], [F.x, F.y + F.h], [F.x, F.y]];
const circlePts = (c, r, n = 48, a0 = -Math.PI / 2) => [...Array(n + 1)].map((_, k) => [c.x + Math.cos(a0 + (k / n) * TAU) * r, c.y + Math.sin(a0 + (k / n) * TAU) * r]);

function drawTag(T, C) {
  const { ctx, W, H } = fit(T.cv);
  const { F, sun, hz, hill } = scene(W, H);
  const p = T.p;
  const hillPts = [...Array(33)].map((_, k) => { const x = F.x + (k / 32) * F.w; return [x, Math.min(hz, hill(x))]; });
  const horizon = [[F.x, hz], [F.x + F.w, hz]];
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  if (T.mode === 'gen') {
    // Tout en trame, sorti du grain.
    const c = LITE ? 7 : 6;
    const cols = Math.floor(F.w / c), rows = Math.floor(F.h / c);
    const q = sstep(0, 0.8, p);
    const fz = Math.floor(p * 16);
    const D = dots();
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = F.x + (i + 0.5) * c, y = F.y + (j + 0.5) * c;
        const ds = Math.hypot(x - sun.x, y - sun.y);
        let v;
        if (ds < sun.r) v = 1;
        else if (y > hz) v = 0.16 + 0.34 * ((y - hz) / (F.y + F.h - hz)) * (0.55 + 0.45 * Math.sin((y - hz) * 0.9));
        else if (y > hill(x)) v = 0.58;
        else v = 0.015 + 0.13 * ((y - F.y) / (hz - F.y)) + 0.5 * Math.exp(-(ds - sun.r) / (sun.r * 0.35));
        const k = sstep(0, 1, q * 1.35 - hh(i, j) * 0.35);
        const show = mix(h3(i, j, fz) * 0.85, v, k);
        if (show < 0.06) continue;
        D.add(`d|${q8(0.35 + 0.6 * k)}`, x, y, c * 0.5 * Math.sqrt(show) * 0.95);
      }
    }
    D.flush(ctx, C);
    // Choisie : les traits de coupe.
    const s = sstep(0.75, 1, p);
    if (s > 0.01) {
      const m = 5, arm = 14 * s;
      ctx.globalAlpha = s; ctx.strokeStyle = C.f; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const [x, y, sx, sy] of [[F.x - m, F.y - m, 1, 1], [F.x + F.w + m, F.y - m, -1, 1], [F.x - m, F.y + F.h + m, 1, -1], [F.x + F.w + m, F.y + F.h + m, -1, -1]]) {
        ctx.moveTo(x + sx * arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * arm);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    return;
  }

  if (T.mode === 'assist') {
    // D'abord la main : le cadre, l'horizon, la colline, l'astre.
    ctx.strokeStyle = C.f; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9;
    strokes(ctx, [rectPts(F), horizon, hillPts, circlePts(sun, sun.r)], sstep(0, 0.62, p));
    ctx.globalAlpha = 1;
    // Puis l'outil, à deux endroits précis : l'astre et l'ombre de la colline.
    const k = sstep(0.55, 0.98, p);
    if (k > 0.01) {
      const c = LITE ? 6 : 5;
      const D = dots();
      for (let y = F.y + c / 2; y < hz; y += c) {
        for (let x = F.x + c / 2; x < F.x + F.w; x += c) {
          const i = Math.round(x / c), j = Math.round(y / c);
          const ds = Math.hypot(x - sun.x, y - sun.y);
          let v = 0;
          if (ds < sun.r - 3) v = 0.95;
          else if (y > hill(x) + 3) v = 0.42 * ((y - hill(x)) / (hz - hill(x) + 1));
          if (v > bayer(i, j) && bayer(j, i) < k) D.add(`d|${q8(0.9)}`, x, y, c * 0.32);
        }
      }
      D.flush(ctx, C);
    }
    return;
  }

  // La démonstration : en pointillés, et l'astre essayé ailleurs.
  ctx.strokeStyle = C.f; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.85;
  ctx.setLineDash([3, 5]);
  strokes(ctx, [rectPts(F), horizon, hillPts, circlePts(sun, sun.r)], sstep(0, 0.6, p));
  const k = sstep(0.58, 0.95, p);
  if (k > 0.01) {
    const alt = [{ x: F.x + F.w * 0.36, y: F.y + F.h * 0.3, r: sun.r * 0.78 }, { x: F.x + F.w * 0.52, y: F.y + F.h * 0.2, r: sun.r * 0.6 }];
    ctx.strokeStyle = C.d; ctx.globalAlpha = 0.85 * k;
    alt.forEach((a) => { ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (0.8 + 0.2 * k), 0, TAU); ctx.stroke(); });
    // Le chemin de l'essai : un arc de points.
    ctx.setLineDash([1, 5]); ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sun.x - sun.r * 0.9, sun.y - sun.r * 0.4);
    ctx.quadraticCurveTo(F.x + F.w * 0.56, F.y + F.h * 0.02, alt[0].x + alt[0].r * 0.9, alt[0].y - alt[0].r * 0.2);
    ctx.stroke();
    ctx.fillStyle = C.d; ctx.globalAlpha = k;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, 2.4, 0, TAU); ctx.fill();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function initTags() {
  const grid = document.querySelector('[data-tags]');
  if (!grid) return;
  const T = [...grid.querySelectorAll('[data-tag]')].map((card) => ({ card, mode: card.dataset.tag, cv: card.querySelector('canvas'), p: still ? 1 : 0, tw: null }));
  let C;
  const colors = () => { C = { f: rgbs(rgb('var(--fg)', grid)), d: rgbs(rgb('var(--dv)', grid)) }; };
  colors();
  const drawAll = () => T.forEach((t) => drawTag(t, C));
  drawAll();
  new ResizeObserver(drawAll).observe(grid);
  onPalette(() => { colors(); drawAll(); });
  if (still) return;

  const play = (t, delay = 0) => {
    if (t.tw?.isActive()) return;
    t.tw = gsap.fromTo(t, { p: 0 }, { p: 1, duration: t.mode === 'gen' ? 2.1 : 1.9, delay, ease: 'power1.inOut', onUpdate: () => drawTag(t, C) });
  };
  // L'entrée : côte à côte sur ordinateur (l'une après l'autre), empilées
  // sur téléphone (chacune quand elle arrive).
  T.forEach((t, i) => {
    let done = false;
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done) return;
      done = true;
      play(t, LITE || window.innerWidth < 960 ? 0.1 : 0.15 + i * 0.3);
    }, { threshold: 0.45 }).observe(t.card);
    if (!LITE) t.card.addEventListener('pointerenter', () => play(t));
    else t.card.addEventListener('click', () => play(t));
  });
}

/* ═══════════════════ LE PROCESSUS : LE FLUX ═══════════════════
   Le flux de points du filet (CSS) ne tourne que la section visible. */
function initFlow() {
  const sec = document.getElementById('process');
  if (!sec || still) return;
  seen(sec, (v) => sec.classList.toggle('is-vis', v));
}

/* ═══════════════════ LE PORTFOLIO VIDE : LES CASES QUI ATTENDENT ═══════════════════
   Le message honnête reste au centre (`mountPortfolio`). Autour, quatre
   cases vides : du grain qui scintille, une étiquette en pointillés qui
   attend son nom. Une case s'ordonne sous la souris, puis retourne au
   grain ; sans souris, une vague lente passe d'une case à l'autre. */
function drawWall(T, C, tick) {
  const { ctx, W, H } = fit(T.cv);
  const c = LITE ? 11 : 9;
  const cols = Math.floor(W / c), rows = Math.floor(H / c);
  const ox = (W - cols * c) / 2 + c / 2, oy = (H - rows * c) / 2 + c / 2;
  const D = dots();
  ctx.fillStyle = C.f;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * c, y = oy + j * c;
      const q = sstep(0, 1, T.q * 1.4 - hh(i + T.k * 9, j) * 0.4);
      if (q < 0.98 && h3(i + T.k * 31, j, Math.floor(tick + hh(j, i) * 5)) < 0.34) {
        const r = c * (0.09 + 0.1 * hh(i, j + 3));
        ctx.globalAlpha = 0.4 * (1 - q);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      if (q > 0.02) D.add(`d|${q8(q * 0.7)}`, x, y, c * 0.14);
    }
  }
  ctx.globalAlpha = 1;
  D.flush(ctx, C);
}

function initWall() {
  const box = document.querySelector('[data-portfolio="ai"]');
  const empty = box?.querySelector('.dv-empty');
  if (!empty) return;
  const wall = document.createElement('div');
  wall.className = 'ai-wall';
  const tile = (n) => `<div class="ai-wall__t" aria-hidden="true"><canvas></canvas><span class="ai-wall__slot"></span><span class="ai-wall__n">${n}</span></div>`;
  wall.innerHTML = tile('01') + tile('02');
  empty.replaceWith(wall);
  wall.append(empty);
  wall.insertAdjacentHTML('beforeend', tile('03') + tile('04'));

  const T = [...wall.querySelectorAll('.ai-wall__t')].map((el, k) => ({ el, k, cv: el.querySelector('canvas'), q: 0, hover: false, sig: '' }));
  let C;
  const colors = () => { C = { f: rgbs(rgb('var(--fg)', wall)), d: rgbs(rgb('var(--dv)', wall)) }; };
  colors();
  const drawAll = () => T.forEach((t) => drawWall(t, C, 0));
  drawAll();
  new ResizeObserver(drawAll).observe(wall);
  onPalette(() => { colors(); drawAll(); });
  if (still) return;

  let vis = false;
  seen(wall, (v) => { vis = v; });
  if (!LITE) {
    T.forEach((t) => {
      t.el.addEventListener('pointerenter', () => { t.hover = true; t.el.classList.add('is-on'); gsap.to(t, { q: 1, duration: 0.8, ease: 'power2.out', overwrite: true }); });
      t.el.addEventListener('pointerleave', () => { t.hover = false; t.el.classList.remove('is-on'); gsap.to(t, { q: 0, duration: 1.1, ease: 'power2.inOut', overwrite: true }); });
    });
  }
  // La vague : une case après l'autre, toutes les 3,4 s, tant qu'on la voit.
  let k = 0;
  const wave = () => {
    if (vis && !document.hidden) {
      const t = T[k % T.length];
      k++;
      if (!t.hover) {
        t.el.classList.add('is-on');
        gsap.timeline({ onComplete: () => { if (!t.hover) t.el.classList.remove('is-on'); } })
          .to(t, { q: 1, duration: 0.8, ease: 'power2.out' })
          .to(t, { q: 0, duration: 1.2, ease: 'power2.inOut' }, '+=0.9');
      }
    }
    gsap.delayedCall(3.4, wave);
  };
  gsap.delayedCall(1.6, wave);

  loops.add((now) => {
    if (!vis) return;
    const tick = Math.floor(now / 120);
    T.forEach((t) => {
      const sig = `${t.q.toFixed(3)}|${t.q < 0.99 ? tick : 'x'}`;
      if (sig === t.sig) return;
      t.sig = sig;
      drawWall(t, C, tick);
    });
  });
}

/* ─────────────── Le démarrage ─────────────── */
export function initWorld() {
  initScramble();
  initSeams();
  initMix();
  initMonitor();
  initTags();
  initFlow();
  initWall();
}
