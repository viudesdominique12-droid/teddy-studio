/**
 * SERVICES — la page des sept divisions (17/10/2026).
 *
 * Quatre gestes, chacun s'arrête quand il quitte l'écran :
 *   lights()  l'ouverture : un faisceau blanc entre et se disperse en sept
 *             rayons, un par division ; survoler un nom éclaire son rayon ;
 *   régie()   le panneau Live Streaming : le programme coupe d'une caméra à
 *             l'autre, le minutage court à l'heure d'Addis ;
 *   scène()   le panneau Event Organizing : les types d'événements du brief
 *             passent un à un sous le projecteur ;
 *   index()   la pièce signature : survoler ou atteindre une division au
 *             clavier y balaie sa couleur et découvre son aperçu. Sans geste,
 *             l'index avance seul tant qu'il est à l'écran. Sur téléphone,
 *             chaque carte s'allume en entrant.
 * Mouvement réduit : tout est posé, rien ne tourne.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { addisTime } from '../clock.js';
import { prismLight } from './hub-prism.js';
import { spectrum } from './hub-spectrum.js';

gsap.registerPlugin(ScrollTrigger);

bootDivision();
lights();
regie();
scene();
index();
spectrum();

/* Observe un élément : `on` suit sa présence à l'écran (et l'onglet visible). */
function watch(el, cb, opts = {}) {
  let seen = false;
  const fire = () => cb(seen && !document.hidden);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; fire(); }, opts).observe(el);
  document.addEventListener('visibilitychange', fire);
}

/* ─────────────── L'ouverture : une lumière, sept couleurs ─────────────── */
function lights() {
  const fan = document.querySelector('[data-fan]');
  if (!fan) return;
  const hero = fan.closest('.dv-hero');
  const svg = fan.querySelector('svg');
  const beam = svg.querySelector('.hb-fan__in');
  const rays = [...svg.querySelectorAll('.hb-ray')];
  const flare = fan.querySelector('.hb-fan__flare');
  const links = [...hero.querySelectorAll('[data-ray-link]')];
  const [ox, oy] = (svg.querySelector('.hb-ray__core')?.getAttribute('x1') ? [
    svg.querySelector('.hb-ray__core').getAttribute('x1'), svg.querySelector('.hb-ray__core').getAttribute('y1')
  ] : ['34', '36']);

  const prism = fan.querySelector('.hb-prism');
  const light = prismLight(hero);
  watch(hero, (on) => { fan.classList.toggle('is-paused', !on); light.setOn(on); });

  // Survoler (ou atteindre au clavier) un nom éclaire son rayon et son photon.
  const near = (i) => {
    fan.classList.toggle('has-near', i >= 0);
    rays.forEach((r, j) => r.classList.toggle('is-near', j === i));
    links.forEach((a, j) => a.classList.toggle('is-near', j === i));
    fan.querySelectorAll('.hb-ph[data-ph]').forEach((p) => p.classList.toggle('is-near', +p.dataset.ph === i));
  };
  links.forEach((a, i) => {
    a.addEventListener('pointerenter', () => near(i));
    a.addEventListener('pointerleave', () => near(-1));
    a.addEventListener('focus', () => near(i));
    a.addEventListener('blur', () => near(-1));
  });

  if (reduced()) { light.start(); return; }

  // Le faisceau blanc entre, le prisme s'allume, la lumière se disperse, et
  // chaque rayon va poser son nom ; puis les photons commencent leur course.
  gsap.set(beam, { scaleX: 0, svgOrigin: `0 ${oy}` });
  gsap.set(rays, { scale: 0, svgOrigin: `${ox} ${oy}` });
  gsap.set(flare, { autoAlpha: 0, scale: 0.2 });
  gsap.set(prism, { autoAlpha: 0, scale: 0.6, rotate: -18 });
  gsap.set(links, { autoAlpha: 0, x: -14 });
  gsap.timeline({ delay: 0.2 })
    .to(beam, { scaleX: 1, duration: 0.75, ease: 'power3.inOut' })
    .to(prism, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, 0.35)
    .to(flare, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out', clearProps: 'transform' }, 0.62)
    .to(rays, { scale: 1, duration: 1.35, ease: 'expo.out', stagger: 0.06 }, 0.66)
    .to(links, { autoAlpha: 1, x: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, clearProps: 'transform,opacity,visibility' }, 0.95)
    .call(() => light.start(), null, 1.7);

  // À la descente, la lumière se retire vers son point d'origine.
  gsap.to(fan, {
    autoAlpha: 0.25, yPercent: -6, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ─────────────── La régie de Live Streaming ─────────────── */
function regie() {
  const box = document.querySelector('[data-pgm]');
  if (!box) return;
  const cams = [...box.querySelectorAll('[data-cam]')];
  const layers = [...box.querySelectorAll('[data-layer]')];
  const flash = box.querySelector('[data-flash]');
  const tc = box.querySelector('[data-tc]');
  const still = reduced();
  const video = !still && !LITE && !navigator.connection?.saveData;

  for (const c of cams) {
    const img = new Image();
    img.src = `${c.dataset.src}.jpg`; img.alt = ''; img.decoding = 'async';
    c.prepend(img);
  }

  let flip = 0;
  let k = 0;
  let on = false;
  const cut = (n) => {
    const cam = cams[n];
    flip ^= 1;
    const layer = layers[flip];
    layer.replaceChildren();
    const img = new Image(); img.src = `${cam.dataset.src}.jpg`; img.alt = ''; img.decoding = 'async';
    layer.append(img);
    if (video) {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.src = `${cam.dataset.src}.mp4`;
      layer.append(v);
      if (on) v.play().catch(() => {});
    }
    layers.forEach((l) => l.classList.toggle('is-on', l === layer));
    // L'ancienne couche se vide une fois couverte : une seule vidéo à la fois.
    const other = layers[flip ^ 1];
    window.setTimeout(() => { if (!other.classList.contains('is-on')) other.replaceChildren(); }, 400);
    cams.forEach((c, j) => {
      c.classList.toggle('is-pgm', j === n);
      c.classList.toggle('is-pvw', j === (n + 1) % cams.length);
    });
    if (!still) gsap.fromTo(flash, { opacity: 0.45 }, { opacity: 0, duration: 0.3, ease: 'power2.out' });
  };
  cut(0);
  if (tc) tc.textContent = `${addisTime(true)}:00`;
  if (still) return;

  watch(box, (v) => {
    on = v;
    box.querySelectorAll('video').forEach((el) => (on ? el.play().catch(() => {}) : el.pause()));
  });
  window.setInterval(() => { if (on) { k = (k + 1) % cams.length; cut(k); } }, 2800);

  gsap.ticker.add(() => {
    if (!on || !tc) return;
    const f = String(Math.floor((performance.now() % 1000) / 40)).padStart(2, '0');
    tc.textContent = `${addisTime(true)}:${f}`;
  });
}

/* ─────────────── La scène d'Event Organizing ─────────────── */
function scene() {
  const box = document.querySelector('[data-stage]');
  if (!box) return;
  const words = [...box.querySelectorAll('[data-words] li')];
  let on = false;
  watch(box, (v) => { on = v; box.classList.toggle('is-paused', !v); });
  if (reduced() || words.length < 2) return;

  gsap.set(words, { autoAlpha: 0, yPercent: 40 });
  gsap.set(words[0], { autoAlpha: 1, yPercent: 0 });
  let k = 0;
  window.setInterval(() => {
    if (!on) return;
    const out = words[k];
    k = (k + 1) % words.length;
    const inn = words[k];
    gsap.to(out, { autoAlpha: 0, yPercent: -35, duration: 0.6, ease: 'power3.in', overwrite: true });
    gsap.fromTo(inn, { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 1.1, ease: 'expo.out', delay: 0.45, overwrite: true });
  }, 3200);
}

/* ─────────────── L'index des cinq autres ─────────────── */
function index() {
  const root = document.querySelector('[data-index]');
  if (!root) return;
  const sec = root.closest('section');
  const items = [...root.querySelectorAll('.hb-div')];
  const desk = matchMedia('(min-width: 60.0625rem)');
  const still = reduced();

  let at = -1;
  let prevTimer = 0;
  const activate = (i) => {
    if (i === at || !items[i]) return;
    const prev = items[at];
    at = i;
    clearTimeout(prevTimer);
    items.forEach((el) => el.classList.remove('is-prev'));
    if (prev) {
      prev.classList.remove('is-on');
      prev.classList.add('is-prev');
      prevTimer = window.setTimeout(() => prev.classList.remove('is-prev'), still ? 0 : 1100);
    }
    const it = items[i];
    it.classList.add('is-on');
    const c = getComputedStyle(it).getPropertyValue('--c').trim();
    if (c) sec.style.setProperty('--sweep', c);
    placeRay(!prev);
  };

  /* Le rayon qui relie la ligne active à son aperçu (ordinateur). */
  const ray = root.querySelector('.hb-ix__ray');
  function placeRay(now) {
    if (!ray || !desk.matches || !items[at]) return;
    const row = items[at].querySelector('.hb-div__row');
    const y = row.offsetTop + row.offsetHeight / 2;
    gsap.to(ray, { y, duration: now || still ? 0 : 0.8, ease: 'expo.out', overwrite: true });
  }
  if (ray && 'ResizeObserver' in window) new ResizeObserver(() => placeRay(true)).observe(root);

  /* Ordinateur : la liste et l'écran. */
  let auto = 0;
  let live = false;
  let held = false;
  const stopAuto = () => { clearInterval(auto); auto = 0; };
  const startAuto = () => {
    stopAuto();
    if (still || !desk.matches) return;
    auto = window.setInterval(() => {
      if (live && !held) activate((at + 1) % items.length);
    }, 4600);
  };

  items.forEach((it, i) => {
    const row = it.querySelector('.hb-div__row');
    row.addEventListener('pointerenter', () => { if (desk.matches) activate(i); });
    it.addEventListener('focusin', () => { if (desk.matches) activate(i); });
    // L'aperçu est un décor : un clic y mène à la division, comme la ligne.
    it.querySelector('.hb-div__media')?.addEventListener('click', () => { if (desk.matches) location.href = row.href; });
  });
  root.addEventListener('pointerenter', () => { held = true; });
  root.addEventListener('pointerleave', () => { held = false; });
  root.addEventListener('focusin', () => { held = true; });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) held = false; });

  watch(sec, (v) => { live = v; sec.classList.toggle('is-live', v); }, { rootMargin: '-10% 0px' });

  /* Téléphone : chaque carte s'allume en entrant, et sa boucle ne tourne
     qu'à l'écran. */
  let io = null;
  const mobile = () => {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-on', e.isIntersecting);
    }, { threshold: 0.35 });
    items.forEach((el) => io.observe(el));
  };

  const setup = () => {
    io?.disconnect(); io = null;
    items.forEach((el) => el.classList.remove('is-on', 'is-prev'));
    at = -1;
    root.classList.toggle('has-ray', desk.matches);
    if (desk.matches) { activate(0); startAuto(); }
    else { stopAuto(); mobile(); }
  };
  setup();
  desk.addEventListener('change', setup);
}
