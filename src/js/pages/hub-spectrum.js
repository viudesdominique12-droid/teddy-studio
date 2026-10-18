/**
 * SERVICES — la lumière dans les sections (18/10/2026).
 *
 *   idle()      les boucles d'une section (filets, liserés, photons) ne
 *               tournent qu'à l'écran et onglet visible (`data-off`) ;
 *   ignite()    les deux têtes d'affiche montent et leur liseré s'allume ;
 *   touchLit()  au doigt, il n'y a pas de survol : le panneau ou la carte
 *               qui passe au milieu de l'écran s'allume (et d'une touche) ;
 *   recombine() l'appel final : les sept couleurs se tracent au défilement,
 *               se rejoignent en un point et repartent en lumière blanche,
 *               puis des photons refont ce chemin en boucle.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

export function spectrum() {
  idle();
  ignite();
  touchLit();
  recombine();
  switchOn();
}

/* ─────────────── « Ensemble » : les faisceaux s'allument en arrivant ─────────────── */
function switchOn() {
  const sec = document.querySelector('.hb-mix');
  if (!sec) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    sec.classList.add('is-in');
    io.disconnect();
  }, { rootMargin: '0px 0px -25% 0px' });
  io.observe(sec.querySelector('.hb-mix__list') || sec);
}

/* ─────────────── Les boucles, seulement à l'écran ─────────────── */
function idle() {
  const els = [...document.querySelectorAll('#main [data-sec], .ftr')];
  // Ces éléments sont gérés ici : la sentinelle commune (offscreen.js) les
  // laisse tranquilles (`data-off-manual`, aussi posé dans services.html).
  els.forEach((el) => el.setAttribute('data-off-manual', ''));
  const seen = new Map(els.map((el) => [el, false]));
  const paint = () => els.forEach((el) => el.toggleAttribute('data-off', !seen.get(el) || document.hidden));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target, e.isIntersecting));
    paint();
  }, { rootMargin: '80px 0px' });
  els.forEach((el) => io.observe(el));
  document.addEventListener('visibilitychange', paint);
  paint();
}

/* ─────────────── Les têtes d'affiche s'allument ─────────────── */
function ignite() {
  const duo = document.querySelector('.hb-duo');
  if (!duo || reduced()) return;
  const pans = [...duo.querySelectorAll('.hb-pan')];
  const edges = pans.map((p) => p.querySelector('.hb-pan__edge'));
  gsap.set(pans, { y: 48, autoAlpha: 0 });
  gsap.set(edges, { opacity: 0 });
  ScrollTrigger.create({
    trigger: duo, start: 'top 82%', once: true,
    onEnter: () => {
      gsap.timeline()
        .to(pans, { y: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12, clearProps: 'transform,opacity,visibility' })
        .to(edges, { opacity: 1, duration: 1.4, ease: 'power2.out', stagger: 0.12, clearProps: 'opacity' }, 0.35);
    }
  });
}

/* ─────────────── Au doigt : allumer ce qui est au milieu ─────────────── */
function touchLit() {
  if (!LITE) return;
  const els = [...document.querySelectorAll('.hb-pan, .hb-mix__i')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-lit', e.isIntersecting));
  }, { rootMargin: '-38% 0px -38% 0px' });
  els.forEach((el) => io.observe(el));
  // D'une touche sur une carte « Ensemble » (hors liens), les faisceaux se resserrent.
  document.querySelectorAll('.hb-mix__i').forEach((el) => {
    el.addEventListener('click', (e) => { if (!e.target.closest('a')) el.classList.toggle('is-lit'); });
  });
}

/* ─────────────── L'appel final : la recomposition ─────────────── */
const COLORS = ['#ff4a3d', '#f2a93b', '#8f7cff', '#ff5c8a', '#e8c27a', '#c98a52', '#7fb7d9'];
const T = 4600;

function recombine() {
  const band = document.querySelector('[data-recomb]');
  if (!band) return;
  const still = reduced();

  const mk = (cls, c) => {
    const el = document.createElement('span');
    el.className = `hb-rc ${cls}`;
    if (c) el.style.setProperty('--c', c);
    el.innerHTML = '<span class="hb-rc__line"></span><span class="hb-rc__ph"><i></i></span>';
    band.append(el);
    return el;
  };
  const rays = COLORS.map((c) => mk('', c));
  const out = mk('hb-rc--out');
  const ring = document.createElement('span'); ring.className = 'hb-recomb__ring';
  const flare = document.createElement('span'); flare.className = 'hb-recomb__flare';
  band.append(ring, flare);
  const lines = [...rays, out].map((r) => r.querySelector('.hb-rc__line'));
  const phs = [...rays, out].map((r) => r.querySelector('.hb-rc__ph'));

  let anims = [];
  let on = false;
  let whole = still;

  function layout() {
    const W = band.clientWidth, H = band.clientHeight;
    if (!W || !H) return;
    const cx = W * 0.5, cy = H * 0.5;
    const lens = rays.map((r, i) => {
      const sy = H * (0.04 + i * 0.92 / 6);
      const dx = cx, dy = cy - sy;
      const len = Math.hypot(dx, dy);
      Object.assign(r.style, { left: '0px', top: `${sy}px`, width: `${len}px`, transform: `rotate(${Math.atan2(dy, dx)}rad)` });
      return len;
    });
    const outLen = W - cx;
    Object.assign(out.style, { left: `${cx}px`, top: `${cy}px`, width: `${outLen}px`, transform: 'none' });
    Object.assign(flare.style, { left: `${cx}px`, top: `${cy}px` });
    Object.assign(ring.style, { left: `${cx}px`, top: `${cy}px` });

    anims.forEach((a) => a.cancel());
    anims = [];
    if (still) return;
    const v = Math.max(...lens) / (0.42 * T);
    const opt = { duration: T, iterations: Infinity, easing: 'linear' };
    const kf = (a, b, tail) => [
      { transform: 'translateX(-100%)', offset: 0 },
      { transform: 'translateX(-100%)', offset: a },
      { transform: 'translateX(0%)', offset: b },
      { transform: `translateX(${tail}%)`, offset: Math.min(0.99, b + (b - a) * tail / 100) },
      { transform: `translateX(${tail}%)`, offset: 1 }
    ];
    const MEET = 0.5;
    lens.forEach((len, i) => {
      anims.push(phs[i].firstChild.animate(kf(MEET - len / v / T, MEET, 26), opt));
    });
    anims.push(phs[7].firstChild.animate(kf(MEET + 0.01, Math.min(0.9, MEET + 0.01 + outLen / v / T), 40), opt));
    anims.push(ring.animate([
      { opacity: 0, transform: 'scale(0.2)', offset: 0 },
      { opacity: 0, transform: 'scale(0.2)', offset: MEET },
      { opacity: 1, transform: 'scale(0.35)', offset: MEET + 0.01 },
      { opacity: 0, transform: 'scale(1.5)', offset: MEET + 0.2 },
      { opacity: 0, transform: 'scale(1.5)', offset: 1 }
    ], opt));
    const t0 = document.timeline.currentTime;
    anims.forEach((a) => { a.startTime = t0; if (!(on && whole)) a.pause(); });
  }
  const run = () => anims.forEach((a) => (on && whole ? a.play() : a.pause()));

  layout();
  let rt = 0;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 120); }).observe(band);
  let seen = false;
  const sync = () => { on = seen && !document.hidden; run(); };
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }).observe(band);
  document.addEventListener('visibilitychange', sync);

  if (still) return;
  // Le tracé, au défilement : les sept couleurs, puis le blanc et son point.
  gsap.set(lines.slice(0, 7), { scaleX: 0, transformOrigin: '0 50%' });
  gsap.set(lines[7], { scaleX: 0, transformOrigin: '0 50%' });
  gsap.set(flare, { scale: 0 });
  gsap.set(phs, { autoAlpha: 0 });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: band, start: 'top 92%', end: 'top 48%', scrub: 0.6,
      onUpdate: (self) => {
        const w = self.progress > 0.985;
        if (w === whole) return;
        whole = w;
        gsap.to(phs, { autoAlpha: w ? 1 : 0, duration: 0.4, overwrite: true });
        run();
      }
    }
  });
  tl.to(lines.slice(0, 7), { scaleX: 1, ease: 'power2.out', duration: 1, stagger: 0.06 })
    .to(flare, { scale: 1, ease: 'back.out(3)', duration: 0.35 }, '>-0.15')
    .to(lines[7], { scaleX: 1, ease: 'power2.out', duration: 0.7 }, '<');
}
