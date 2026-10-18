/**
 * LA PISTE — Music Production, deuxième écran (18/10/2026).
 *
 * Dominique, devant le deuxième écran de la page : « on peut vachement faire
 * mieux par rapport à l'animation ». Il y avait là un « fil » qui ne vibrait
 * que pendant le défilement : à l'arrêt, un trait plat dans une grande bande
 * vide. À sa place, une vraie piste de studio, vivante en permanence :
 *   · une forme d'onde stéréo (le haut plein, le bas en reflet), tirée d'un
 *     morceau imaginaire — intro, couplet, montée, refrain — sur huit mesures ;
 *   · une tête de lecture qui avance au tempo de la page (96 BPM) ; ce qu'elle
 *     a déjà lu s'allume en rose, la suite reste dans l'ombre ;
 *   · autour de la tête, les barres sautent sur chaque temps ; partout ailleurs
 *     l'onde frémit à peine ; défiler vite la fait vibrer plus fort ;
 *   · une règle des mesures au-dessus, le compteur de temps au-dessous ;
 *   · à la souris, une tête fantôme suit le pointeur et gonfle l'onde sous
 *     lui ; un clic (ou un appui au doigt) y amène la lecture.
 * Silencieuse : aucun son. Décor (`aria-hidden`). Ne tourne qu'à l'écran et
 * onglet visible ; en mouvement réduit, une image fixe.
 */

import { reduced } from '../motion.js';

const LITE = matchMedia('(pointer: coarse)').matches;
const BPM = 96;
const BEAT = 60 / BPM;
const BARS = 8;
const LOOP = BARS * 4 * BEAT;                       // 20 s pour un passage

function makeNoise(seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const V = Float32Array.from({ length: 512 }, rnd);
  return (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    const a = V[i & 511], b = V[(i + 1) & 511];
    return a + (b - a) * u;
  };
}

function rgbOf(host, token) {
  const probe = document.createElement('i');
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`;
  host.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g) || [255, 255, 255];
  probe.remove();
  return m.slice(0, 3).map(Number);
}

/* Le morceau : l'énergie de chaque mesure (intro, couplet, montée, refrain),
   puis le détail de chaque barre. */
const SHAPE = [0.32, 0.46, 0.52, 0.6, 0.74, 0.96, 1, 0.88];

export function initTrack() {
  const host = document.querySelector('[data-track]');
  const box = host?.querySelector('.mu-lane__wave') || host;
  const canvas = box?.querySelector('canvas');
  if (!canvas) return;
  let ctx = null;
  try { ctx = canvas.getContext('2d'); } catch { ctx = null; }
  if (!ctx) { host.classList.add('is-static'); return; }

  const still = reduced();
  const timeEl = host.querySelector('[data-track-time]');
  const posEl = host.querySelector('[data-track-pos]');
  const DPR = Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 2);
  const n1 = makeNoise(17), n2 = makeNoise(43), n3 = makeNoise(71);

  let W = 0, H = 0, B = 0, base = new Float32Array(0);
  let dv = [255, 92, 138], fg = [252, 235, 243];
  // La règle prend la voix des chiffres de la page (`--ff-n`, Barlow Condensed).
  let num = '"Barlow Condensed Data", sans-serif';
  let t = LOOP * 0.38, energy = 0, lastY = window.scrollY;
  let running = false, onScreen = false, raf = 0, last = 0, lastLabel = 0;
  const ptr = { x: 0.5, a: 0, ta: 0 };

  function build() {
    base = new Float32Array(B);
    for (let i = 0; i < B; i++) {
      const u = i / B;
      const bar = Math.min(BARS - 1, Math.floor(u * BARS));
      const inBar = u * BARS - bar;
      // l'énergie de la mesure, qui monte doucement vers la suivante
      const e = SHAPE[bar] + (SHAPE[(bar + 1) % BARS] - SHAPE[bar]) * inBar * inBar * 0.5;
      // chaque temps commence fort (l'attaque) puis retombe
      const beatPh = (inBar * 4) % 1;
      const attack = 0.55 + 0.45 * Math.exp(-beatPh * 3.2);
      const grain = 0.35 + 0.65 * n1(i * 0.42) ** 1.2;
      base[i] = Math.min(1, e * attack * grain + 0.05);
    }
  }

  function layout() {
    const r = box.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    const step = LITE ? 7 : 5;                       // une barre tous les 5 px
    B = Math.max(48, Math.floor(W / step));
    build();
    dv = rgbOf(host, '--dv'); fg = rgbOf(host, '--fg');
    num = getComputedStyle(host).getPropertyValue('--ff-n').trim() || num;
  }

  const fmt = (sec) => {
    const m = Math.floor(sec / 60), s = sec - m * 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
  };

  function draw() {
    const RULER = 22;                                 // la règle des mesures
    const top = RULER + 6, mid = top + (H - top) * 0.58;
    const upH = (mid - top) * 0.96, downH = (H - mid) * 0.9;
    const head = (t % LOOP) / LOOP;
    const beatPh = ((t % BEAT) + BEAT) % BEAT / BEAT;
    const kick = Math.exp(-beatPh * 6);
    const downbeat = Math.floor(t / BEAT) % 4 === 0 ? kick : 0;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // La règle : huit mesures, quatre temps chacune, les numéros dans la
    // voix des chiffres.
    ctx.font = `500 10px ${num}`;
    ctx.textBaseline = 'middle';
    for (let b = 0; b <= BARS * 4; b++) {
      const x = (b / (BARS * 4)) * W;
      const isBar = b % 4 === 0;
      ctx.fillStyle = `rgba(${fg.join(',')},${isBar ? 0.38 : 0.14})`;
      ctx.fillRect(Math.round(x), isBar ? 4 : 12, 1, isBar ? RULER - 4 : RULER - 12);
      if (isBar && b < BARS * 4) {
        ctx.fillStyle = `rgba(${fg.join(',')},0.5)`;
        ctx.fillText(String(b / 4 + 1), x + 5, 9);
      }
    }
    ctx.fillStyle = `rgba(${fg.join(',')},0.1)`;
    ctx.fillRect(0, RULER, W, 1);
    // la ligne du milieu
    ctx.fillRect(0, Math.round(mid), W, 1);

    // L'onde : barre par barre.
    const bw = W / B;
    const lw = Math.max(1.5, bw * 0.58);
    ctx.lineCap = 'round';
    ctx.lineWidth = lw;
    const playedGrad = ctx.createLinearGradient(0, mid - upH, 0, mid + downH);
    playedGrad.addColorStop(0, `rgba(${dv.join(',')},1)`);
    playedGrad.addColorStop(0.55, `rgba(${dv.map((c) => Math.round(c + (255 - c) * 0.35)).join(',')},1)`);
    playedGrad.addColorStop(0.58, `rgba(${dv.join(',')},0.55)`);
    playedGrad.addColorStop(1, `rgba(${dv.join(',')},0.08)`);
    const restCol = `rgba(${fg.join(',')},0.2)`;
    const restDown = `rgba(${fg.join(',')},0.07)`;
    const vib = 0.06 + 0.24 * energy;                 // le frémissement général
    const hx = head * W;

    ctx.beginPath();                                   // ce qui reste à lire, d'un seul trait
    const played = [];
    for (let i = 0; i < B; i++) {
      const x = (i + 0.5) * bw;
      const u = (i + 0.5) / B;
      const near = Math.max(0, 1 - Math.abs(x - hx) / (W * 0.07));
      const jit = (n2(i * 0.9 + t * 9) - 0.5) * vib + (n3(i * 0.31 + t * 2.2) - 0.5) * 0.08;
      let v = base[i] * (1 + jit + near * near * (0.55 * kick + 0.2 * energy));
      if (ptr.a > 0.01) { const q = (u - ptr.x) / 0.03; v += ptr.a * 0.45 * Math.exp(-q * q); }
      v = Math.max(0.03, Math.min(1.08, v));
      if (x <= hx) { played.push(x, v, near); continue; }
      ctx.moveTo(x, mid - v * upH); ctx.lineTo(x, mid);
    }
    ctx.strokeStyle = restCol; ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < B; i++) {
      const x = (i + 0.5) * bw;
      if (x <= hx) continue;
      ctx.moveTo(x, mid + 1); ctx.lineTo(x, mid + base[i] * downH * 0.9);
    }
    ctx.strokeStyle = restDown; ctx.stroke();

    // Ce qui est déjà lu, en rose (le reflet en dessous, plus pâle).
    ctx.beginPath();
    for (let k = 0; k < played.length; k += 3) {
      const x = played[k], v = played[k + 1];
      ctx.moveTo(x, mid - v * upH); ctx.lineTo(x, mid + v * downH * 0.9);
    }
    ctx.strokeStyle = playedGrad; ctx.stroke();

    // La tête de lecture : une lueur, un trait, un repère sur la règle.
    const glowW = 90 + 60 * kick;
    const g = ctx.createRadialGradient(hx, mid, 0, hx, mid, glowW);
    g.addColorStop(0, `rgba(${dv.join(',')},${0.22 + 0.25 * kick})`);
    g.addColorStop(1, `rgba(${dv.join(',')},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(hx - glowW, top, glowW * 2, H - top);
    ctx.fillStyle = `rgba(${fg.join(',')},0.95)`;
    ctx.fillRect(Math.round(hx), RULER - 2, 1.5, H - RULER + 2);
    ctx.beginPath();
    ctx.moveTo(hx - 6, RULER - 10); ctx.lineTo(hx + 7.5, RULER - 10); ctx.lineTo(hx + 0.75, RULER - 1); ctx.closePath();
    ctx.fill();

    // Le premier temps de chaque mesure : un éclair rose sur la ligne du milieu.
    if (downbeat > 0.05) {
      ctx.fillStyle = `rgba(${dv.join(',')},${0.5 * downbeat})`;
      ctx.fillRect(0, Math.round(mid) - 1, W, 2);
    }

    // La tête fantôme, sous le pointeur.
    if (ptr.a > 0.02) {
      ctx.fillStyle = `rgba(${fg.join(',')},${0.35 * ptr.a})`;
      ctx.fillRect(Math.round(ptr.x * W), RULER, 1, H - RULER);
    }
  }

  function label(now) {
    if (now - lastLabel < 90) return;
    lastLabel = now;
    const pos = t % LOOP;
    if (timeEl) timeEl.textContent = `${fmt(pos)} / ${fmt(LOOP)}`;
    if (posEl) {
      const beats = Math.floor(pos / BEAT);
      posEl.textContent = `${Math.floor(beats / 4) + 1}.${(beats % 4) + 1}`;
    }
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (LITE && now - last < 31) return;            // 30 images par seconde au doigt
    const dt = last ? Math.min(0.06, (now - last) / 1000) : 0;
    last = now;
    // L'énergie du défilement : défiler vite fait vibrer l'onde plus fort.
    const y = window.scrollY;
    const v = dt ? Math.abs(y - lastY) / dt : 0;
    lastY = y;
    const target = Math.min(1, v / 2400);
    energy += (target - energy) * (1 - Math.exp(-dt * (target > energy ? 12 : 2.2)));
    t += dt;
    ptr.a += (ptr.ta - ptr.a) * (1 - Math.exp(-dt * 8));
    draw();
    label(now);
  }

  const start = () => {
    if (running || still || !onScreen || document.hidden) return;
    running = true; last = 0; lastY = window.scrollY;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

  layout();
  draw();
  label(performance.now() + 1000);
  // La fonte des chiffres peut arriver après la première image (l'image fixe
  // du mouvement réduit ne se redessine pas d'elle-même).
  document.fonts?.load(`500 10px ${num}`).then(() => draw()).catch(() => {});
  new ResizeObserver(() => { layout(); draw(); }).observe(box);
  if (still) return;

  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen) start(); else stop(); }).observe(box);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  const toU = (clientX) => {
    const r = box.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  // Un clic ou un appui amène la lecture sous le doigt.
  box.addEventListener('pointerdown', (e) => {
    const u = toU(e.clientX);
    t = Math.floor(t / LOOP) * LOOP + u * LOOP;
    ptr.x = u; ptr.ta = 1;
    if (LITE) setTimeout(() => { ptr.ta = 0; }, 600);
  }, { passive: true });
  if (!LITE) {
    box.addEventListener('pointermove', (e) => { ptr.x = toU(e.clientX); ptr.ta = 1; });
    box.addEventListener('pointerleave', () => { ptr.ta = 0; });
  }
}
