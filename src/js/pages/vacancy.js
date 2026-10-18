/**
 * VACANCY — le tableau de l'équipe (18/10/2026).
 *
 * Dominique : « améliore-moi les autres pages avec la même logique de
 * customisation de thème ». Les gestes de la page, tous décoratifs : le
 * sélecteur de poste reste celui de la page source (le script en ligne de
 * vacancy.html), ce module ne fait que l'accompagner.
 *   felt()       le feutre du tableau, tissé une fois sur un petit canvas ;
 *   swings       un seul moteur de balancier pour le badge d'équipe (tiré à
 *                la souris, poussé au doigt, bercé par le défilement) et
 *                pour la note épinglée (elle bouge quand on passe) ;
 *   flap()       le volet du tableau d'affichage bat puis retombe sur « — » ;
 *   string()     le fil entre deux punaises se pince au passage ;
 *   stamp()      le tampon « Closed » vient frapper la fiche des dates ;
 *   sheets()     la feuille du poste choisi est dépunaisée, puis la nouvelle
 *                punaisée ; les feuilles sans description ont un bord déchiré ;
 *   tabs()       l'affiche à languettes : une languette s'arrache au clic.
 * Tout ce qui boucle s'arrête hors de l'écran (`data-vc-off`) ou onglet
 * caché ; en mouvement réduit, tout est posé, sans animation.
 * Aucun texte inventé : les seuls mots ajoutés sont des étiquettes
 * décoratives, tirées de la page (dates, numéros de poste, adresse).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from '../motion.js';

const LITE = matchMedia('(pointer: coarse)').matches;
const STILL = reduced();
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ═══════════════════════ LE FEUTRE ═══════════════════════
   Une tuile de 160 px : un grain fin et de courtes fibres, claires et
   sombres, recopiées de l'autre côté des bords pour que la tuile se raccorde. */
function felt() {
  const S = 160;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  if (!g) return;
  const img = g.createImageData(S, S);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() < 0.5 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = Math.random() * (v ? 9 : 16);
  }
  g.putImageData(img, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 360; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const a = Math.random() * Math.PI;
    const l = 2 + Math.random() * 8;
    const dx = Math.cos(a) * l;
    const dy = Math.sin(a) * l;
    g.lineWidth = 0.5 + Math.random() * 0.5;
    g.strokeStyle = Math.random() < 0.45 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.085)';
    g.beginPath();
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.moveTo(x + ox, y + oy);
      g.lineTo(x + ox + dx, y + oy + dy);
    }
    g.stroke();
  }
  const url = `url(${c.toDataURL('image/png')})`;
  document.getElementById('main')?.style.setProperty('--vc-felt', url);
  document.querySelector('.ftr')?.style.setProperty('--vc-felt', url);
}

/* ═══════════════════════ À L'ÉCRAN OU NON ═══════════════════════ */
function liveWhenSeen(els, onChange) {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      e.target.toggleAttribute('data-vc-off', !e.isIntersecting);
      onChange?.(e.target, e.isIntersecting);
    });
  }, { rootMargin: '80px 0px' });
  els.filter(Boolean).forEach((el) => io.observe(el));
}

/* ═══════════════════════ LE BALANCIER ═══════════════════════
   Un pendule amorti par objet : `k` sa raideur (sa période), `c` son
   amortissement, `max` son angle limite. Un seul `requestAnimationFrame`
   pour tous, qui s'endort dès que tout est immobile. */
const swings = [];
let raf = 0;
let last = 0;

function loop(t) {
  const dt = clamp((t - last) / 1000, 0.001, 0.034);
  last = t;
  let awake = false;
  for (const s of swings) {
    if (!s.awake) continue;
    s.step(dt);
    awake ||= s.awake;
  }
  raf = awake && !document.hidden ? requestAnimationFrame(loop) : 0;
}
function wake() {
  if (raf || document.hidden) return;
  last = performance.now();
  raf = requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && swings.some((s) => s.awake)) wake(); });

class Swing {
  constructor(el, opts = {}) {
    Object.assign(this, { k: 9, c: 0.8, max: 24, card: null, a: 0, v: 0, la: 0, lv: 0, ty: 0, tyGoal: 0, drag: false, awake: false, seen: true }, opts);
    this.el = el;
    swings.push(this);
  }
  kick(dv) {
    if (!this.seen || STILL) return;
    this.v = clamp(this.v + dv, -110, 110);
    this.awake = true;
    wake();
  }
  tilt(goal) {
    this.tyGoal = goal;
    this.awake = true;
    wake();
  }
  step(dt) {
    let acc = 0;
    if (!this.drag) {
      acc = -this.k * this.a - this.c * this.v;
      this.v += acc * dt;
      this.a += this.v * dt;
      if (Math.abs(this.a) > this.max) { this.a = Math.sign(this.a) * this.max; this.v *= -0.35; }
    }
    if (this.card) {
      // La carte pend à sa pince : elle suit la lanière avec un temps de retard.
      const lacc = -70 * this.la - 6.5 * this.lv - acc * 0.06;
      this.lv += lacc * dt;
      this.la = clamp(this.la + this.lv * dt, -10, 10);
      this.ty += (this.tyGoal - this.ty) * Math.min(1, dt * 9);
    }
    this.paint();
    const calm = Math.abs(this.a) < 0.02 && Math.abs(this.v) < 0.04
      && Math.abs(this.la) < 0.02 && Math.abs(this.lv) < 0.04 && Math.abs(this.ty - this.tyGoal) < 0.05;
    if (!this.drag && calm) {
      this.a = 0; this.v = 0; this.la = 0; this.lv = 0; this.ty = this.tyGoal;
      this.paint();
      this.awake = false;
    }
  }
  paint() {
    this.el.style.transform = `rotate(${this.a.toFixed(3)}deg)`;
    if (this.card) {
      this.card.style.transform = `perspective(700px) rotateY(${this.ty.toFixed(2)}deg) rotate(${this.la.toFixed(3)}deg)`;
      this.card.style.setProperty('--tilt', (this.ty * 2 + this.a * 3).toFixed(1));
    }
  }
}

/* Le défilement berce ce qui pend : un coup léger, dans le sens du geste. */
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const dy = y - lastY;
  lastY = y;
  if (!dy || STILL) return;
  for (const s of swings) if (s.seen && s.scroll) s.kick(clamp(dy * s.scroll, -9, 9));
}, { passive: true });

/* ─────────────── Le badge d'équipe ─────────────── */
function pass() {
  const swingEl = document.querySelector('.vc-pass__swing');
  const card = document.querySelector('[data-vc-card]');
  if (!swingEl || !card || STILL) return;
  const s = new Swing(swingEl, { k: 8.2, c: 0.7, max: LITE ? 16 : 22, card, scroll: LITE ? 0.22 : 0.3 });
  liveWhenSeen([document.querySelector('.vc-pass')], (_, on) => {
    s.seen = on;
    if (!on) s.awake = false;
  });

  // Une poussée au chargement, pour qu'il soit vivant dès l'arrivée.
  setTimeout(() => s.kick(LITE ? 22 : 30), 650);

  const pivot = () => {
    const r = swingEl.parentElement.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top };
  };
  const angleAt = (x, y) => {
    const p = pivot();
    return -Math.atan2(x - p.x, Math.max(30, y - p.y)) * 180 / Math.PI;
  };

  if (LITE) {
    // Au doigt : un toucher pousse le badge, du côté opposé au doigt.
    let t0 = 0, x0 = 0, y0 = 0;
    card.addEventListener('pointerdown', (e) => { t0 = performance.now(); x0 = e.clientX; y0 = e.clientY; });
    card.addEventListener('pointerup', (e) => {
      if (performance.now() - t0 > 450 || Math.hypot(e.clientX - x0, e.clientY - y0) > 12) return;
      const r = card.getBoundingClientRect();
      const side = e.clientX < r.left + r.width / 2 ? -1 : 1;
      s.kick(side * (34 + Math.random() * 10));
    });
    return;
  }

  // À la souris : on le tire par la carte, il repart en balancier ; au simple
  // survol, il se tourne vers la main et le passage le pousse un peu.
  let grabA = 0, startA = 0, prevA = 0, prevT = 0, vel = 0, lx = null;
  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    card.setPointerCapture?.(e.pointerId);
    s.drag = true; s.awake = true; s.v = 0;
    grabA = angleAt(e.clientX, e.clientY);
    startA = s.a; prevA = s.a; prevT = performance.now(); vel = 0;
    wake();
  });
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    s.tilt(clamp(((e.clientX - r.left) / r.width - 0.5) * 22, -11, 11));
    if (s.drag) {
      const now = performance.now();
      s.a = clamp(startA + (angleAt(e.clientX, e.clientY) - grabA), -s.max, s.max);
      const dt = Math.max(8, now - prevT) / 1000;
      vel = vel * 0.6 + ((s.a - prevA) / dt) * 0.4;
      prevA = s.a; prevT = now;
      return;
    }
    if (lx !== null) s.kick(clamp((e.clientX - lx) * -0.35, -6, 6));
    lx = e.clientX;
  });
  const drop = () => {
    if (!s.drag) return;
    s.drag = false;
    s.v = clamp(vel, -90, 90);
    s.kick(0);
  };
  card.addEventListener('pointerup', drop);
  card.addEventListener('pointercancel', drop);
  card.addEventListener('lostpointercapture', drop);
  card.addEventListener('pointerleave', () => { lx = null; if (!s.drag) s.tilt(0); });
}

/* ─────────────── La note épinglée ─────────────── */
function notice() {
  const paper = document.querySelector('.vc-notice__paper');
  const board = document.querySelector('[data-vc-board]');
  if (!paper || !board || STILL) return;
  const s = new Swing(paper, { k: 38, c: 3.4, max: 6, scroll: 0.12 });
  liveWhenSeen([board], (_, on) => { s.seen = on; if (!on) s.awake = false; });

  if (LITE) {
    paper.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const r = paper.getBoundingClientRect();
      s.kick((e.clientX < r.left + r.width / 2 ? -1 : 1) * 22);
    });
    return;
  }
  // La main qui passe près de la feuille fait de l'air.
  let lx = null;
  board.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = paper.getBoundingClientRect();
    const near = e.clientX > r.left - 60 && e.clientX < r.right + 60 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
    if (near && lx !== null) s.kick(clamp((e.clientX - lx) * -0.55, -7, 7));
    lx = e.clientX;
  });
  board.addEventListener('pointerleave', () => { lx = null; });
}

/* ═══════════════════════ LE VOLET ═══════════════════════ */
function flap() {
  const box = document.querySelector('[data-vc-flap]');
  const c = box?.querySelector('.vc-flap__c');
  if (!c || STILL) return;
  const G = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let busy = false;
  let lastRun = 0;
  const flip = () => c.animate?.([
    { transform: 'scaleY(0.15)', opacity: 0.5 },
    { transform: 'scaleY(1)', opacity: 1 }
  ], { duration: 80, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' });
  const run = () => {
    const now = performance.now();
    if (busy || now - lastRun < 1600) return;
    busy = true; lastRun = now;
    let n = 0;
    const steps = 8 + Math.floor(Math.random() * 5);
    const tick = () => {
      if (n++ < steps) {
        c.textContent = G[Math.floor(Math.random() * G.length)];
        flip();
        setTimeout(tick, 55 + n * 9);
      } else {
        c.textContent = '—';
        flip();
        busy = false;
      }
    };
    tick();
  };
  const head = box.closest('.vc-board__head');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(run, 350);
    }, { threshold: 0.6 });
    io.observe(box);
  }
  if (FINE) head?.addEventListener('pointerenter', run);
  else head?.addEventListener('click', run);
}

/* ═══════════════════════ LE FIL ═══════════════════════ */
function string() {
  const seam = document.querySelector('[data-vc-string]');
  if (!seam) return;
  liveWhenSeen([seam]);
  if (STILL) return;
  const pluck = () => {
    seam.classList.remove('is-pluck');
    void seam.offsetWidth;
    seam.classList.add('is-pluck');
  };
  seam.addEventListener('animationend', (e) => { if (e.animationName === 'vc-pluck') seam.classList.remove('is-pluck'); });
  seam.addEventListener(FINE ? 'pointerenter' : 'pointerdown', pluck);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(pluck, 200);
    }, { threshold: 1, rootMargin: '0px 0px -20% 0px' });
    io.observe(seam);
  }
}

/* ═══════════════════════ LE TAMPON ═══════════════════════ */
function stamp() {
  const st = document.querySelector('[data-vc-stamp]');
  const slip = st?.closest('.vc-dates');
  if (!st || !slip || STILL || !('IntersectionObserver' in window)) return;
  gsap.set(st, { autoAlpha: 0 });
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    gsap.timeline({ delay: 0.25 })
      .fromTo(st, { autoAlpha: 0, scale: 2.3, rotation: -24 }, { autoAlpha: 1, scale: 1, rotation: -9, duration: 0.34, ease: 'power4.in' })
      .fromTo(slip, { y: 0 }, { y: 3, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' })
      .to(st, { scale: 1.02, duration: 0.08, yoyo: true, repeat: 1 }, '<');
  }, { threshold: 0.7 });
  io.observe(slip);
}

/* ═══════════════════════ LES FEUILLES ═══════════════════════ */
/* Un bord déchiré, toujours le même pour une feuille donnée. */
function tear(seed) {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const pts = ['0 0', '100% 0', `100% calc(100% - ${(10 + r() * 8).toFixed(1)}px)`];
  let x = 100;
  while (x > 0) {
    x = Math.max(0, x - (1.2 + r() * 3.6));
    pts.push(`${x.toFixed(2)}% calc(100% - ${(r() * 18).toFixed(1)}px)`);
  }
  return `polygon(${pts.join(', ')})`;
}

function sheets() {
  const stack = document.querySelector('[data-vc-stack]');
  if (!stack) return;
  const btns = [...document.querySelectorAll('.vac__btn')];
  const roles = [...stack.querySelectorAll('.vac__role')];
  roles.forEach((r, i) => { if (r.classList.contains('vc-sheet--torn')) r.style.clipPath = tear(97 + i * 131); });

  let cur = roles.find((r) => r.classList.contains('is-on')) || roles[0];
  let refreshT = 0;
  const sync = () => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.classList.contains('is-on'))));
  sync();

  // Les filets des sous-titres se tracent quand la feuille arrive à l'écran.
  let seen = false;
  const draw = (el) => { el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in'); };
  if ('IntersectionObserver' in window && !STILL) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      seen = true;
      draw(cur);
    }, { threshold: 0.2 });
    io.observe(stack);
  } else { seen = true; roles.forEach((r) => r.classList.add('is-in')); }

  // Le surligneur, au doigt.
  if (!FINE) {
    stack.querySelectorAll('.vac__ul li').forEach((li) => li.addEventListener('click', () => li.classList.toggle('is-hl')));
  }

  // Le script de la page source a déjà basculé `is-on` (il est chargé
  // avant ce module) : on joue le passage d'une feuille à l'autre.
  btns.forEach((b) => b.addEventListener('click', () => {
    sync();
    const next = roles.find((r) => r.classList.contains('is-on'));
    if (!next || next === cur) return;
    const prev = cur;
    cur = next;
    if (seen) draw(next);
    // La feuille change de hauteur : les déclencheurs plus bas se remesurent.
    clearTimeout(refreshT);
    refreshT = setTimeout(() => { ScrollTrigger.refresh(); window.__lenis?.resize?.(); }, STILL ? 50 : 900);
    if (STILL) return;
    const pinsOut = prev.querySelectorAll('.vc-sheet__pin');
    const pinsIn = next.querySelectorAll('.vc-sheet__pin');
    gsap.killTweensOf([prev, next, ...pinsOut, ...pinsIn]);
    gsap.timeline()
      .fromTo(pinsOut, { scale: 1 }, { scale: 0, duration: 0.16, ease: 'power2.in', clearProps: 'transform' }, 0)
      // L'ancienne feuille sort par-dessus la nouvelle, hors du flux.
      .set(prev, { display: 'block', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }, 0)
      .fromTo(prev, { autoAlpha: 1, x: 0, y: 0, rotation: 0 },
        { autoAlpha: 0, x: 16, y: 38, rotation: 2.8, duration: 0.42, ease: 'power2.in', clearProps: 'transform,opacity,visibility,display,position,top,left,right,zIndex' }, 0.08)
      .fromTo(next, { autoAlpha: 0, y: -24, rotation: -2.2 },
        { autoAlpha: 1, y: 0, rotation: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.24)
      .fromTo(pinsIn, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', stagger: 0.09, clearProps: 'transform' }, 0.66);
  }));
}

/* ═══════════════════════ L'AFFICHE À LANGUETTES ═══════════════════════ */
function tabs() {
  const box = document.querySelector('[data-vc-tabs]');
  const flyer = box?.closest('[data-vc-flyer]');
  if (!box) return;
  const n = window.innerWidth < 640 ? 5 : 6;
  box.innerHTML = Array.from({ length: n }, (_, i) => `<span class="vc-tab" style="--i:${i}">info@ethiopianfilmoffice.com</span>`).join('');
  liveWhenSeen([flyer]);
  if (STILL) return;
  const link = flyer.querySelector('.lnk');
  const all = [...box.children];
  let regrow = 0;
  all.forEach((t) => t.addEventListener('click', () => {
    if (t.classList.contains('is-torn') || t.dataset.ripping) return;
    t.dataset.ripping = '1';
    const dir = Math.random() < 0.5 ? -1 : 1;
    link?.classList.add('is-flash');
    setTimeout(() => link?.classList.remove('is-flash'), 900);
    gsap.timeline({
      onComplete: () => {
        t.classList.add('is-torn');
        delete t.dataset.ripping;
        gsap.set(t, { clearProps: 'transform,opacity,visibility' });
        if (all.every((x) => x.classList.contains('is-torn'))) {
          clearTimeout(regrow);
          regrow = setTimeout(() => {
            all.forEach((x) => x.classList.remove('is-torn'));
            gsap.fromTo(all, { scaleY: 0, autoAlpha: 0 }, { scaleY: 1, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
          }, 1200);
        }
      }
    })
      .to(t, { rotation: dir * 7, y: 4, duration: 0.12, ease: 'power2.out' })
      .to(t, { rotation: dir * (24 + Math.random() * 16), y: 220, x: dir * 30, autoAlpha: 0, duration: 0.85, ease: 'power2.in' });
  }));
}

/* ═══════════════════════ LE DÉMARRAGE ═══════════════════════ */
function boot() {
  liveWhenSeen([document.querySelector('.vc-pass'), document.querySelector('.vc-seam--perf'), document.querySelector('[data-vc-board]')]);
  // Le pied de page : son mètre ruban ne défile qu'à l'écran.
  const ftr = document.querySelector('.ftr');
  if (ftr && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => ftr.classList.toggle('is-off', !e.isIntersecting)).observe(ftr);
  }
  pass();
  notice();
  flap();
  string();
  stamp();
  sheets();
  tabs();
  (window.requestIdleCallback || ((f) => setTimeout(f, 60)))(felt);
}

boot();
