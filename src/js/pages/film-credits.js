/**
 * FEATURE FILM — le générique et sa cabine de projection (19/10/2026).
 *
 * Derrière le générique, un calque collé à l'écran le temps de la section
 * (film.css, `.fi-booth`) : le faisceau du projecteur, qui vacille à peine,
 * et sa poussière qui flotte dans la lumière — un petit canevas où chaque
 * grain ne se voit que dans le cône, comme dans une vraie salle.
 *
 *   · chaque étape du générique s'allume (or) en passant au milieu de
 *     l'écran, ses métiers passent du gris à la crème ;
 *   · un compteur de temps (TC) tourne avec le défilement ;
 *   · le repère de fin de bobine clignote deux fois quand le générique
 *     s'achève.
 *
 * La boucle de la poussière ne tourne que la section en vue et l'onglet
 * visible ; au doigt, moins de grains, une image sur deux, à demi-définition.
 * Sans mouvement : ni poussière ni vacillement, toutes les étapes allumées.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

const pad = (n) => String(n).padStart(2, '0');
/* Le cône du faisceau, comme dans film.css : son sommet à 22 % au-dessus du
   calque, ±15° autour de la verticale ; il s'éteint de 52 % à 90 % de la
   hauteur. */
const APEX = 0.22;
const HALF = (15 * Math.PI) / 180;

export function initCredits() {
  const sec = document.getElementById('services');
  if (!sec) return;
  const STILL = reduced();
  const groups = [...sec.querySelectorAll('.fi-roll__g')];

  /* Les étapes qui s'allument au milieu de l'écran. */
  if (STILL) groups.forEach((g) => g.classList.add('is-lit'));
  else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-lit', e.isIntersecting));
    }, { rootMargin: '-38% 0px -38% 0px' });
    groups.forEach((g) => io.observe(g));
  }

  /* Le compteur : 24 images par seconde, deux minutes et demie de générique
     sur toute la traversée. Un repère de décor, rien de plus. */
  const tc = sec.querySelector('[data-tc]');
  const roll = sec.querySelector('[data-roll]');
  if (tc && roll) {
    let last = -1;
    const fmt = (f) => {
      const s = Math.floor(f / 24);
      return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f % 24].map(pad).join(':');
    };
    ScrollTrigger.create({
      trigger: roll, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const f = Math.round(self.progress * 150 * 24);
        if (f !== last) { last = f; tc.textContent = fmt(f); }
      }
    });
  }

  if (STILL) return;

  /* Le repère de fin de bobine. */
  const cue = sec.querySelector('[data-booth-cue]');
  const end = sec.querySelector('[data-roll-end]');
  if (cue && end) {
    ScrollTrigger.create({
      trigger: end, start: 'top 72%',
      onEnter: () => gsap.timeline()
        .set(cue, { opacity: 1 }, 0).set(cue, { opacity: 0 }, 0.16)
        .set(cue, { opacity: 1 }, 0.34).set(cue, { opacity: 0 }, 0.5)
    });
  }

  /* Le faisceau vit (vacille, poussière) seulement en vue. */
  const canvas = sec.querySelector('[data-dust]');
  const motes = canvas ? dust(canvas) : null;
  let seen = false;
  const run = () => {
    const on = seen && !document.hidden;
    sec.classList.toggle('is-run', on && !LITE);
    motes?.(on);
  };
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }).observe(sec);
  document.addEventListener('visibilitychange', run);
}

/* La poussière dans la lumière : des grains doux qui dérivent, plus
   visibles au cœur du cône, invisibles hors de lui. Renvoie `play(on)`. */
function dust(canvas) {
  let ctx;
  try { ctx = canvas.getContext('2d'); } catch { ctx = null; }
  if (!ctx) { canvas.remove(); return null; }

  const N = LITE ? 26 : 64;
  const RES = LITE ? 0.5 : 1;                       // une poussière douce : pas besoin de la pleine définition
  let W = 0; let H = 0;

  /* Le grain : un disque flou, dessiné une fois. */
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 32;
  const sx = sprite.getContext('2d');
  const g = sx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,246,226,1)');
  g.addColorStop(0.35, 'rgba(255,236,200,0.55)');
  g.addColorStop(1, 'rgba(255,230,190,0)');
  sx.fillStyle = g;
  sx.fillRect(0, 0, 32, 32);

  const spawn = (p, anywhere = true) => {
    const y = anywhere ? Math.random() * H * 0.9 : H * (0.05 + Math.random() * 0.8);
    const half = Math.tan(HALF) * (y + APEX * H);
    p.x = W / 2 + (Math.random() * 2 - 1) * half * 1.05;
    p.y = y;
    p.r = 0.7 + Math.random() ** 2 * 2.1;            // la plupart fins, quelques gros
    p.vx = (Math.random() - 0.5) * 0.12;
    p.vy = -0.03 - Math.random() * 0.1;              // l'air chaud du faisceau monte
    p.ph = Math.random() * Math.PI * 2;
    p.tw = 0.008 + Math.random() * 0.02;
    return p;
  };
  const parts = Array.from({ length: N }, () => ({}));

  const size = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * RES);
    canvas.height = Math.round(H * RES);
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    parts.forEach((p) => spawn(p));
  };
  size();
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas);

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vx += (Math.random() - 0.5) * 0.01;
      p.vx = Math.max(-0.18, Math.min(0.18, p.vx));
      p.x += p.vx;
      p.y += p.vy;
      p.ph += p.tw;
      const ang = Math.abs(Math.atan2(p.x - W / 2, p.y + APEX * H));
      if (p.y < -10 || ang > HALF * 1.25) { spawn(p, false); continue; }
      const inBeam = Math.max(0, 1 - ang / HALF);
      const fall = p.y / H < 0.52 ? 1 : Math.max(0, 1 - (p.y / H - 0.52) / 0.38);
      const a = inBeam ** 1.4 * fall * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.ph))) * 0.7;
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      const d = p.r * 3.2;
      ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  };

  let raf = 0; let odd = false;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (LITE && (odd = !odd)) return;               // au doigt : 30 images par seconde
    draw();
  };
  return (on) => {
    if (on && !raf) { if (!W) size(); raf = requestAnimationFrame(loop); }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
}
