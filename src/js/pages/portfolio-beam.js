/**
 * PORTFOLIO — le faisceau du projecteur (18/10/2026).
 *
 * La salle de projection de l'ouverture : un cône de lumière chaude part de
 * la cabine (hors champ, en haut à gauche ; en haut à droite sur téléphone)
 * et s'ouvre jusqu'à l'écran ; la poussière y flotte et scintille.
 *
 *   · le cône est peint UNE fois dans un canevas hors écran (à chaque
 *     redimensionnement) : par image, on ne fait que le recopier ;
 *   · la poussière vit dans « l'espace du faisceau » (t : de la cabine à
 *     l'écran, s : d'un bord à l'autre) : elle reste toujours dans la
 *     lumière, quelle que soit la taille de la fenêtre ;
 *   · 30 images/s au plus, densité ≤ 1,25, et seulement tant que l'ouverture
 *     est à l'écran et l'onglet visible ; au doigt, moins de poussière ;
 *     sans mouvement, une seule image, immobile.
 *
 * `blink()` fait vaciller la lampe (au changement d'image de l'écran),
 * `level(v)` baisse la lumière quand on quitte la salle (0 à 1).
 */
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

const LAMP = [255, 240, 214];
const CS = 2;   // le cône est peint à demi-taille, puis adouci
const CONE_A = 0.2;

export function initBeam(hero, target) {
  const cv = hero?.querySelector('[data-beam]');
  if (!cv || !target || !cv.getContext) return null;
  const ctx = cv.getContext('2d', { alpha: true });
  if (!ctx) return null;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.25);
  const still = reduced();
  const cone = document.createElement('canvas');
  const cctx = cone.getContext('2d');

  // Le grain de poussière : un point doux, dessiné une fois.
  const dot = document.createElement('canvas');
  dot.width = dot.height = 16;
  {
    const d = dot.getContext('2d');
    const g = d.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, `rgba(${LAMP}, 1)`);
    g.addColorStop(0.35, `rgba(${LAMP}, 0.55)`);
    g.addColorStop(1, `rgba(${LAMP}, 0)`);
    d.fillStyle = g; d.fillRect(0, 0, 16, 16);
  }

  let W = 0, H = 0;
  let O = { x: 0, y: 0 }, A = { x: 0, y: 0 }, B = { x: 0, y: 0 };  // la cabine, les deux bords du cône sur l'écran

  const N = LITE ? 26 : 72;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const motes = Array.from({ length: N }, () => ({
    t: rnd(0.12, 0.98), s: rnd(-1, 1),
    vt: rnd(-0.012, 0.012), vs: rnd(-0.05, 0.05),
    r: rnd(0.5, 1.9) * (Math.random() < 0.08 ? 2.2 : 1),
    ph: rnd(0, Math.PI * 2), sp: rnd(0.5, 1.8)
  }));

  /* La géométrie : l'écran (sa boîte, relative à l'ouverture) et la cabine. */
  const measure = () => {
    const hr = hero.getBoundingClientRect();
    const sr = target.getBoundingClientRect();
    W = Math.max(1, Math.round(hr.width));
    H = Math.max(1, Math.round(hr.height));
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    // Le cône est peint petit puis agrandi : le lissage en adoucit les bords.
    cone.width = Math.ceil(W / CS); cone.height = Math.ceil(H / CS);
    const L = sr.left - hr.left, T = sr.top - hr.top, R = L + sr.width, Bt = T + sr.height;
    const narrow = sr.width > W * 0.7;      // téléphone : l'écran occupe la largeur
    if (narrow) {
      O = { x: W * 1.06, y: -H * 0.06 };
      A = { x: L, y: T };                   // bord haut-gauche
      B = { x: R, y: Bt };                  // bord bas-droit
    } else {
      O = { x: L - W * 0.46, y: -H * 0.32 };
      A = { x: R, y: T };                   // bord haut-droit
      B = { x: L, y: Bt };                  // bord bas-gauche
    }
    paintCone();
  };

  /* Le cône : plusieurs couches de plus en plus étroites, d'où un bord doux
     et un cœur plus dense, plus lumineux près de la cabine. */
  const paintCone = () => {
    cctx.setTransform(1, 0, 0, 1, 0, 0);
    cctx.clearRect(0, 0, cone.width, cone.height);
    cctx.setTransform(1 / CS, 0, 0, 1 / CS, 0, 0);
    if ('filter' in cctx) cctx.filter = 'blur(5px)';
    const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    const layers = 22;
    for (let k = 0; k < layers; k++) {
      const q = k / layers;                        // 0 : le cône entier ; vers 1 : le cœur
      const a = { x: A.x + (mid.x - A.x) * q * 0.9, y: A.y + (mid.y - A.y) * q * 0.9 };
      const b = { x: B.x + (mid.x - B.x) * q * 0.9, y: B.y + (mid.y - B.y) * q * 0.9 };
      const g = cctx.createLinearGradient(O.x, O.y, mid.x, mid.y);
      // Peint huit fois trop fort (assez de nuances sur 8 bits), puis
      // recopié plus faible (`CONE_A`) : pas de marches dans le dégradé.
      g.addColorStop(0, `rgba(${LAMP}, 0.136)`);
      g.addColorStop(0.55, `rgba(${LAMP}, 0.068)`);
      g.addColorStop(1, `rgba(${LAMP}, 0.034)`);
      cctx.fillStyle = g;
      cctx.beginPath();
      cctx.moveTo(O.x, O.y); cctx.lineTo(a.x, a.y); cctx.lineTo(b.x, b.y); cctx.closePath();
      cctx.fill();
    }
  };

  let flick = 1, dip = 0, lvl = 1;
  const draw = (time) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const sec = time / 1000;
    // La lampe vacille à peine ; elle baisse franchement au changement d'image.
    flick = still ? 1 : 0.93 + 0.05 * Math.sin(sec * 7.3) * Math.sin(sec * 2.1) + 0.02 * Math.sin(sec * 23);
    dip *= 0.86;
    const light = Math.max(0, (flick - dip * 0.55) * lvl);
    ctx.globalAlpha = light * CONE_A;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cone, 0, 0, cv.width, cv.height);
    // La poussière.
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (const m of motes) {
      const ax = O.x + (A.x - O.x) * m.t, ay = O.y + (A.y - O.y) * m.t;
      const bx = O.x + (B.x - O.x) * m.t, by = O.y + (B.y - O.y) * m.t;
      const u = (m.s + 1) / 2;
      const x = ax + (bx - ax) * u, y = ay + (by - ay) * u;
      if (x < -8 || y < -8 || x > W + 8 || y > H + 8) continue;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(sec * m.sp + m.ph));
      const edge = 1 - Math.abs(m.s) ** 4;
      const a = tw * edge * (1.05 - m.t * 0.55) * 0.75 * light;
      if (a < 0.02) continue;
      const r = m.r * 2.4;
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(dot, x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  };

  const step = (dt) => {
    for (const m of motes) {
      m.t += m.vt * dt; m.s += m.vs * dt;
      m.vs += (Math.random() - 0.5) * 0.02 * dt;   // un souffle d'air
      m.vs = Math.max(-0.07, Math.min(0.07, m.vs));
      if (m.s > 1) { m.s = 1; m.vs = -Math.abs(m.vs); }
      if (m.s < -1) { m.s = -1; m.vs = Math.abs(m.vs); }
      if (m.t > 0.99) m.t = 0.12;
      if (m.t < 0.1) m.t = 0.98;
    }
  };

  let raf = 0, last = 0, on = false;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;                  // 30 images/s au plus
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    step(dt);
    draw(now);
  };
  const run = (v) => {
    if (v === on) return;
    on = v;
    if (on && !still) { last = 0; raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf);
  };

  measure();
  draw(performance.now());

  let seen = false;
  const sync = () => run(seen && !document.hidden);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);

  let rt = 0;
  const remeasure = () => { clearTimeout(rt); rt = setTimeout(() => { measure(); draw(performance.now()); }, 120); };
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(hero);
  else window.addEventListener('resize', remeasure);

  return {
    measure: remeasure,
    blink() { if (!still) dip = 1; },
    level(v) { lvl = Math.max(0, Math.min(1, v)); if (!on || still) draw(performance.now()); }
  };
}
