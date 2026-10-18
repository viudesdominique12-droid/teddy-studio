/**
 * 404 — « Not cleared », hors de la carte (18/10/2026).
 *
 *   contours()  le relevé de terrain : des courbes de niveau tirées d'un
 *               bruit, tracées UNE fois sur un canvas (ratio ≤ 1,25), puis
 *               seulement déplacées (CSS) ; retracées si la largeur change ;
 *   permit()    le permis porte le chemin réellement demandé et la date du
 *               jour ; le tampon « Not cleared » vient le frapper, et chaque
 *               clic (ou toucher) sur le permis le frappe encore ;
 *   seek()      le repère cherche son signal d'un point à l'autre de la
 *               carte, les coordonnées défilent sans jamais se fixer ;
 *   parallax()  sur ordinateur, la carte et le permis suivent un peu la main.
 * Tout ce qui boucle s'arrête hors de l'écran ou onglet caché ; en
 * mouvement réduit, tout est posé.
 */
import gsap from 'gsap';
import { reduced } from '../motion.js';

const LITE = matchMedia('(pointer: coarse)').matches;
const STILL = reduced();
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

const scene = document.querySelector('[data-nf]');
let visible = true;

/* ═══════════════════════ LES COURBES DE NIVEAU ═══════════════════════ */
function noise2(seed) {
  // Un bruit de valeurs lissé, sur une grille de 256 points pseudo-aléatoires.
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const P = new Float32Array(256 * 256);
  for (let i = 0; i < P.length; i++) P[i] = rnd();
  const at = (x, y) => P[((y & 255) << 8) | (x & 255)];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const tx = sm(x - xi), ty = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

function contours() {
  const cv = document.querySelector('[data-nf-map]');
  const g = cv?.getContext('2d');
  if (!g) return;
  const n = noise2(4049);
  const field = (x, y) => n(x, y) * 0.58 + n(x * 2.03 + 17, y * 2.03 + 5) * 0.28 + n(x * 4.1 + 3, y * 4.1 + 29) * 0.14;
  let lastW = 0;

  const draw = () => {
    const r = cv.getBoundingClientRect();
    if (!r.width || Math.abs(r.width - lastW) < 40) return;
    lastW = r.width;
    const dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1 : 1.25);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, r.width, r.height);

    // Le carroyage de la carte.
    g.strokeStyle = 'rgba(236,232,223,0.05)';
    g.lineWidth = 1;
    g.setLineDash([2, 6]);
    const step = 150;
    g.beginPath();
    for (let x = step / 2; x < r.width; x += step) { g.moveTo(x, 0); g.lineTo(x, r.height); }
    for (let y = step / 2; y < r.height; y += step) { g.moveTo(0, y); g.lineTo(r.width, y); }
    g.stroke();
    g.setLineDash([]);

    // Les courbes : marche des carrés sur une grille de 12 px.
    const C = LITE ? 14 : 11;
    const cols = Math.ceil(r.width / C) + 1;
    const rows = Math.ceil(r.height / C) + 1;
    const sc = 1 / 210;
    const V = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) V[j * cols + i] = field(i * C * sc, j * C * sc);
    const levels = [];
    for (let L = 0.22; L < 0.8; L += 0.034) levels.push(L);
    levels.forEach((L, k) => {
      const index = k % 5 === 0;
      g.strokeStyle = index ? 'rgba(236,232,223,0.17)' : 'rgba(236,232,223,0.075)';
      g.lineWidth = index ? 1.1 : 0.8;
      g.beginPath();
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = V[j * cols + i], b = V[j * cols + i + 1], c = V[(j + 1) * cols + i + 1], d = V[(j + 1) * cols + i];
          const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const x = i * C, y = j * C;
          const t = (p, q) => (L - p) / (q - p || 1e-6);
          const top = [x + C * t(a, b), y];
          const right = [x + C, y + C * t(b, c)];
          const bottom = [x + C * t(d, c), y + C];
          const left = [x, y + C * t(a, d)];
          const seg = (p, q) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 10: seg(top, right); seg(left, bottom); break;
            default: break;
          }
        }
      }
      g.stroke();
    });
  };
  draw();
  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 250); }, { passive: true });
}

/* ═══════════════════════ LE PERMIS ═══════════════════════ */
/* Le grain de l'encre : un masque de taches, tissé une fois. */
function inkMask() {
  const S = 120;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  if (!g) return;
  g.fillStyle = '#000';
  g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 260; i++) {
    const r = Math.random() < 0.85 ? 0.4 + Math.random() * 0.9 : 1.2 + Math.random() * 2.2;
    g.globalAlpha = 0.25 + Math.random() * 0.6;
    g.beginPath();
    g.arc(Math.random() * S, Math.random() * S, r, 0, Math.PI * 2);
    g.fill();
  }
  document.getElementById('main')?.style.setProperty('--nf-ink', `url(${c.toDataURL('image/png')})`);
}

function permit() {
  const paper = document.querySelector('[data-nf-paper]');
  if (!paper) return;
  const path = paper.querySelector('[data-nf-path]');
  const date = paper.querySelector('[data-nf-date]');
  // L'adresse réellement demandée (texte brut, jamais interprété).
  if (path) {
    let p = location.pathname || '/';
    try { p = decodeURIComponent(p); } catch { /* chemin mal encodé : tel quel */ }
    path.textContent = p.slice(0, 120) || '/';
  }
  if (date) {
    try {
      date.textContent = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Addis_Ababa' }).format(new Date());
    } catch { /* la date reste « — » */ }
  }
  inkMask();
  const stamp = paper.querySelector('[data-nf-stamp]');
  if (!stamp || STILL) return;

  const slam = (el, rot, delay = 0) => gsap.timeline({ delay })
    .fromTo(el, { autoAlpha: 0, scale: 2.4, rotation: rot - 14 }, { autoAlpha: 1, scale: 1, rotation: rot, duration: 0.3, ease: 'power4.in' })
    .fromTo(paper, { y: 0 }, { y: 4, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.out' });

  gsap.set(stamp, { autoAlpha: 0 });
  slam(stamp, -11, 0.9);

  // Chaque clic frappe encore : trois échos au plus, le plus ancien s'en va.
  const echoes = [];
  paper.addEventListener('click', (e) => {
    const r = paper.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'nf-stamp nf-stamp--echo';
    s.innerHTML = '<b>Not cleared</b>';
    s.style.left = `${Math.max(4, Math.min(r.width - 150, e.clientX - r.left - 70))}px`;
    s.style.top = `${Math.max(4, Math.min(r.height - 40, e.clientY - r.top - 18))}px`;
    paper.append(s);
    echoes.push(s);
    if (echoes.length > 3) {
      const old = echoes.shift();
      gsap.to(old, { autoAlpha: 0, duration: 0.4, onComplete: () => old.remove() });
    }
    slam(s, -18 + Math.random() * 22);
  });
}

/* ═══════════════════════ LE REPÈRE ═══════════════════════ */
function seek() {
  const mark = document.querySelector('[data-nf-seek]');
  const fix = document.querySelector('[data-nf-fix]');
  if (!mark || !scene) return;
  const box = () => scene.getBoundingClientRect();
  const spot = () => {
    const r = box();
    const narrow = r.width < 900;
    return {
      x: r.width * (narrow ? 0.15 + Math.random() * 0.7 : 0.5 + Math.random() * 0.42),
      y: r.height * (narrow ? 0.12 + Math.random() * 0.8 : 0.18 + Math.random() * 0.62)
    };
  };
  const p0 = spot();
  gsap.set(mark, { x: p0.x, y: p0.y });
  mark.classList.add('is-on');
  if (STILL) return;

  const DIG = '0123456789';
  const rd = () => DIG[Math.floor(Math.random() * 10)];
  const r6 = () => DIG[Math.floor(Math.random() * 6)];
  let scr = 0;
  const scramble = (on) => {
    clearInterval(scr);
    if (!fix) return;
    if (!on) { fix.textContent = 'N --°--′ · E --°--′'; return; }
    scr = setInterval(() => { fix.textContent = `N ${rd()}${rd()}°${r6()}${rd()}′ · E ${rd()}${rd()}°${r6()}${rd()}′`; }, 90);
  };

  let call = null;
  const hop = () => {
    call = null;
    if (!visible || document.hidden) return;
    const p = spot();
    scramble(true);
    gsap.to(mark, {
      x: p.x, y: p.y, duration: 1.6 + Math.random() * 0.8, ease: 'power2.inOut',
      onComplete: () => {
        scramble(false);
        call = gsap.delayedCall(LITE ? 4.5 : 2.8, hop);
      }
    });
  };
  const resume = () => { if (!call && visible && !document.hidden && !gsap.isTweening(mark)) call = gsap.delayedCall(1.2, hop); };
  const pause = () => { call?.kill(); call = null; gsap.killTweensOf(mark); scramble(false); };
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
  scene.addEventListener('nf:visible', (e) => (e.detail ? resume() : pause()));
  resume();
}

/* ═══════════════════════ LA MAIN ═══════════════════════ */
function parallax() {
  if (!FINE || STILL || !scene) return;
  const drift = document.querySelector('[data-nf-drift]');
  const paper = document.querySelector('[data-nf-paper]');
  const mx = drift && gsap.quickTo(drift.parentElement, 'x', { duration: 1.4, ease: 'power3' });
  const my = drift && gsap.quickTo(drift.parentElement, 'y', { duration: 1.4, ease: 'power3' });
  const rx = paper && gsap.quickTo(paper, 'rotationX', { duration: 0.8, ease: 'power3' });
  const ry = paper && gsap.quickTo(paper, 'rotationY', { duration: 0.8, ease: 'power3' });
  scene.addEventListener('pointermove', (e) => {
    const r = scene.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width - 0.5;
    const v = (e.clientY - r.top) / r.height - 0.5;
    mx?.(u * -18); my?.(v * -12);
    if (paper) {
      const pr = paper.getBoundingClientRect();
      const pu = clampU((e.clientX - (pr.left + pr.width / 2)) / pr.width);
      const pv = clampU((e.clientY - (pr.top + pr.height / 2)) / pr.height);
      ry(pu * 9); rx(pv * -7);
    }
  });
  scene.addEventListener('pointerleave', () => { mx?.(0); my?.(0); rx?.(0); ry?.(0); });
}
const clampU = (v) => Math.max(-1, Math.min(1, v));

/* ═══════════════════════ LE DÉMARRAGE ═══════════════════════ */
function live() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      e.target.toggleAttribute('data-nf-off', !e.isIntersecting);
      if (e.target === scene) {
        visible = e.isIntersecting;
        scene.dispatchEvent(new CustomEvent('nf:visible', { detail: visible }));
      }
    });
  });
  if (scene) io.observe(scene);
  const ftr = document.querySelector('.ftr');
  if (ftr) new IntersectionObserver(([e]) => ftr.classList.toggle('is-off', !e.isIntersecting)).observe(ftr);
}

contours();
permit();
live();
seek();
parallax();
