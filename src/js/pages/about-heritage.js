/**
 * ABOUT US — la matière du dossier d'archives (18/10/2026).
 *
 * Dominique : « améliore les autres pages avec la même logique ». Autour du
 * tambour (about.js), chaque section vit le monde du bureau : l'héritage,
 * la gravure, le laiton, la cire.
 *   roses()      les rosaces de graveur (guilloches), tracées en SVG par le
 *                code : des anneaux de sinusoïdes entrelacées et une étoile
 *                d'hypotrochoïde, comme sur un billet ou un certificat ;
 *   waves()      les bandes de guilloche au pied des deux plaques ;
 *   liveLoops()  tout ce qui tourne en continu ne tourne que dans une section
 *                visible, et onglet affiché (`.is-live`, `html.ab-hidden`) ;
 *   heroSeal()   le sceau du bureau (le vrai logo) se pose sur la photo ;
 *                la souris incline la photo et le sceau ; un appui le refrappe ;
 *   plates()     mission et vision : le double filet se trace, la plaque
 *                s'incline sous la souris ; au doigt, un reflet à l'appui ;
 *   charter()    l'approche : au doigt, l'article au milieu de l'écran
 *                s'encre (le survol de l'ordinateur) ; les articles entrent ;
 *   cabinet()    le matériel : les fiches se posent l'une après l'autre ;
 *   films()      les épreuves se redressent à l'arrivée ;
 *   drawer()     le tiroir de fiches s'éventaille, au doigt, au milieu de
 *                l'écran ;
 *   wax()        le cachet de cire se pose à l'arrivée et se presse quand on
 *                approche du bouton (ou d'un appui).
 * En mouvement réduit, tout est posé à son état final. Rien n'est inventé :
 * aucune date, aucun chiffre ; les seuls mots ajoutés (le nom du bureau sur
 * le sceau, « No. 01 »…) sont des étiquettes décoratives, muettes.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

const STILL = reduced();
const NS = 'http://www.w3.org/2000/svg';
const f1 = (n) => (Math.round(n * 10) / 10).toString();

export function initHeritage() {
  // La rosace de l'ouverture tout de suite ; le reste du tracé quand le
  // navigateur a un moment (rien de tout cela n'est à l'écran au départ).
  roses('[data-rose="hero"]');
  const later = 'requestIdleCallback' in window ? (fn, o) => window.requestIdleCallback(fn, o) : (fn) => setTimeout(fn, 180);
  later(() => { roses('[data-rose]:not([data-rose="hero"])'); waves(); }, { timeout: 900 });
  waxShape();
  liveLoops();
  heroSeal();
  plates();
  charter();
  cabinet();
  films();
  drawer();
  wax();
}

/* ═══════════════════════ LES ROSACES ═══════════════════════ */

/* Un anneau de guilloche : `copies` sinusoïdes fermées autour d'un cercle de
   rayon R, décalées chacune d'une fraction de période — elles se croisent et
   tissent la bande. Un seul chemin (des sous-chemins), en coordonnées
   -100…100. */
function ring(R, A, n, copies, ppp = 9) {
  const N = n * ppp;
  let d = '';
  for (let k = 0; k < copies; k++) {
    const ph = (2 * Math.PI * k) / copies;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 2 * Math.PI;
      const r = R + A * Math.sin(n * t + ph);
      d += `${i ? 'L' : 'M'}${f1(r * Math.cos(t))} ${f1(r * Math.sin(t))}`;
    }
  }
  return d;
}

/* L'étoile du centre : une hypotrochoïde fermée (R et r entiers). */
function star(R, r, dd, scale = 1, steps = 640) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const T = (2 * Math.PI * r) / gcd(R, r);
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * T;
    const x = (R - r) * Math.cos(t) + dd * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - dd * Math.sin(((R - r) / r) * t);
    d += `${i ? 'L' : 'M'}${f1(x * scale)} ${f1(y * scale)}`;
  }
  return d;
}

const ROSES = {
  hero: () => [ring(92, 4, 36, 6), ring(76, 6.5, 26, 7), ring(56, 6, 18, 6), star(30, 11, 17, 1.05, 720), circle(98), circle(46)],
  founder: () => [ring(88, 5, 28, 6), ring(64, 6.5, 18, 6), star(25, 9, 14, 1.1, 560), circle(97)],
  wax: () => [ring(94, 3.2, 44, 4, 8), circle(99), circle(88)],
  waxcore: () => [ring(80, 7, 14, 5, 10), star(30, 11, 18, 1.35, 600), circle(96)]
};
function circle(r) { return `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0`; }

function roses(sel) {
  document.querySelectorAll(sel).forEach((host) => {
    const make = ROSES[host.dataset.rose];
    if (!make) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-100 -100 200 200');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    if (host.classList.contains('ab-rose')) svg.classList.add('ab-loop');
    make().forEach((d, i) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      // Les anneaux extérieurs un peu plus effacés que l'étoile.
      p.style.opacity = String(i === 0 ? 0.55 : i < 3 ? 0.75 : 0.9);
      svg.append(p);
    });
    host.append(svg);
  });
}

/* ═══════════════════════ LES BANDES DE GUILLOCHE ═══════════════════════
   Six sinusoïdes entrelacées sur 1600 unités : la bande fait deux fois la
   largeur de son cadre et glisse de la moitié — seize périodes exactement,
   la boucle ne se voit pas. */
function waves() {
  document.querySelectorAll('[data-wave]').forEach((host) => {
    const kind = Number(host.dataset.wave) || 1;
    const P = kind === 1 ? 80 : 100;         // la période (1600 / P périodes)
    const lines = kind === 1 ? 6 : 4;
    let d = '';
    for (let k = 0; k < lines; k++) {
      const ph = (2 * Math.PI * k) / lines;
      const A = kind === 1 ? 13 : 9 + (k % 2) * 5;
      for (let x = 0; x <= 1600; x += 5) {
        const y = 20 + A * Math.sin((2 * Math.PI * x) / P + ph) * (kind === 2 ? Math.cos((Math.PI * x) / 400) * 0.35 + 0.65 : 1);
        d += `${x ? 'L' : 'M'}${x} ${f1(y)}`;
      }
    }
    host.innerHTML = `<svg viewBox="0 0 1600 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  });
}

/* ═══════════════════════ LA CIRE ═══════════════════════
   Le bord d'un cachet n'est jamais rond : un cercle légèrement ondulé, et
   deux coulures. Tracé une fois ; le dégradé fait le volume. */
function waxShape() {
  const host = document.querySelector('[data-wax] .ab-wax__blob');
  if (!host) return;
  const bump = (t, c, w) => { const d = Math.atan2(Math.sin(t - c), Math.cos(t - c)); return Math.exp(-((d / w) ** 2)); };
  const N = 160;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * 2 * Math.PI;
    const r = 86 + 2.6 * Math.sin(3 * t + 0.6) + 1.6 * Math.sin(7 * t + 1.9) + 1.1 * Math.sin(11 * t + 0.3)
      + 9 * bump(t, 0.75, 0.2) + 6 * bump(t, 3.7, 0.16);
    d += `${i ? 'L' : 'M'}${f1(r * Math.cos(t))} ${f1(r * Math.sin(t))}`;
  }
  host.insertAdjacentHTML('afterbegin', `<svg class="ab-wax__shape" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="ab-wax-g" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#f6a37a"/><stop offset=".32" stop-color="#e2703f"/><stop offset=".72" stop-color="#b9502a"/><stop offset="1" stop-color="#86361b"/></radialGradient>
      <radialGradient id="ab-wax-h" cx="30%" cy="24%" r="40%"><stop offset="0" stop-color="#fff2e6" stop-opacity=".45"/><stop offset="1" stop-color="#fff2e6" stop-opacity="0"/></radialGradient>
    </defs>
    <path d="${d}Z" fill="url(#ab-wax-g)"/>
    <path d="${d}Z" fill="url(#ab-wax-h)"/>
    <path d="${d}Z" fill="none" stroke="#5a1f0b" stroke-opacity=".35" stroke-width="1.2"/>
  </svg>`);
}

/* ═══════════════════════ LES BOUCLES ═══════════════════════ */
function liveLoops() {
  const root = document.documentElement;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
  }, { rootMargin: '8% 0px' });
  document.querySelectorAll('[data-live]').forEach((s) => io.observe(s));
  // Le pied de page (sa perle de cire) : la même règle.
  const ftr = document.querySelector('.ftr');
  if (ftr) io.observe(ftr);
  const vis = () => root.classList.toggle('ab-hidden', document.hidden);
  document.addEventListener('visibilitychange', vis);
  vis();
  root.classList.add('ab-js');
}

/* ═══════════════════════ LE SCEAU DU BUREAU ═══════════════════════ */
function heroSeal() {
  const hero = document.querySelector('.ab-hero');
  const seal = hero?.querySelector('[data-seal]');
  const mount = hero?.querySelector('[data-mount]');
  const frames = hero?.querySelector('[data-frames]');
  if (!seal || STILL) return;

  // Le passe-partout se pose avec les cadres, puis le sceau est frappé.
  const corners = mount ? [...mount.children] : [];
  if (mount) {
    gsap.set(mount, { autoAlpha: 0 });
    gsap.set(corners, { scale: 0.2 });
    gsap.timeline({ delay: 0.75 })
      .to(mount, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 0)
      .to(corners, { scale: 1, duration: 1, ease: 'expo.out', stagger: 0.06 }, 0);
  }
  gsap.set(seal, { autoAlpha: 0, scale: 1.5, rotation: -28 });
  gsap.timeline({ delay: 1.15 })
    .to(seal, { autoAlpha: 1, scale: 0.92, rotation: 0, duration: 0.42, ease: 'power3.in' })
    .to(seal, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)' });

  // Au défilement, le sceau monte plus vite que la photo (un quatrième plan).
  gsap.to(seal, {
    yPercent: -60, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });

  // Un appui (souris ou doigt) refrappe le sceau.
  const strike = () => gsap.timeline()
    .to(seal, { scale: 0.9, duration: 0.12, ease: 'power2.in', overwrite: 'auto' })
    .to(seal, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.45)' });
  seal.addEventListener('click', strike);

  // À la souris : la photo et le sceau s'inclinent très légèrement, la
  // rosace glisse à contre-sens (la profondeur).
  if (LITE || !frames) return;
  const rose = hero.querySelector('.ab-rose--hero');
  gsap.set(frames, { transformPerspective: 1100 });
  const rx = gsap.quickTo(frames, 'rotationX', { duration: 1.2, ease: 'power3.out' });
  const ry = gsap.quickTo(frames, 'rotationY', { duration: 1.2, ease: 'power3.out' });
  const sx = gsap.quickTo(seal, 'x', { duration: 1, ease: 'power3.out' });
  const sy = gsap.quickTo(seal, 'y', { duration: 1, ease: 'power3.out' });
  const qx = rose ? gsap.quickTo(rose, 'x', { duration: 1.6, ease: 'power3.out' }) : null;
  const qy = rose ? gsap.quickTo(rose, 'y', { duration: 1.6, ease: 'power3.out' }) : null;
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const nx = e.clientX / innerWidth - 0.5;
    const ny = e.clientY / innerHeight - 0.5;
    ry(nx * 5); rx(-ny * 4);
    sx(nx * 14); sy(ny * 10);
    qx?.(-nx * 26); qy?.(-ny * 18);
  });
  hero.addEventListener('pointerleave', () => { rx(0); ry(0); sx(0); sy(0); qx?.(0); qy?.(0); });
}

/* ═══════════════════════ LES PLAQUES GRAVÉES ═══════════════════════ */
function plates() {
  const list = [...document.querySelectorAll('[data-plate]')];
  list.forEach((p, idx) => {
    const lines = [...p.querySelectorAll('.ab-plate__frame i')];
    const across = [lines[0], lines[2]].filter(Boolean);
    const down = [lines[1], lines[3]].filter(Boolean);
    const num = p.querySelector('.ab-plate__num');
    const txt = p.querySelector('.ab-mv__t');
    const k = p.querySelector('.dv-k');

    if (!STILL) {
      gsap.set(across, { scaleX: 0 });
      gsap.set(down, { scaleY: 0 });
      gsap.set([num, k, txt], { autoAlpha: 0, y: 22 });
      ScrollTrigger.create({
        trigger: p, start: 'top 84%', once: true,
        onEnter: () => {
          gsap.timeline({ delay: idx * 0.16, defaults: { ease: 'power3.inOut' } })
            .to(across[0], { scaleX: 1, duration: 0.9 }, 0)
            .to(down[0], { scaleY: 1, duration: 0.7 }, 0.55)
            .to(across[1], { scaleX: 1, duration: 0.9 }, 0.95)
            .to(down[1], { scaleY: 1, duration: 0.7 }, 1.5)
            .to([k, txt], { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, clearProps: 'transform,opacity,visibility' }, 0.2)
            .to(num, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, 0.45);
        }
      });
    }

    if (STILL) return;
    if (LITE) {
      // Au doigt : un reflet traverse la plaque à l'appui.
      p.addEventListener('click', () => {
        p.classList.remove('is-shine');
        void p.offsetWidth;
        p.classList.add('is-shine');
      });
      return;
    }
    // À la souris : la plaque s'incline, la lumière suit le pointeur.
    gsap.set(p, { transformPerspective: 1000 });
    const rx = gsap.quickTo(p, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(p, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    p.addEventListener('pointermove', (e) => {
      const r = p.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * 5);
      rx(-(y - 0.5) * 4);
      p.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      p.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    p.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ═══════════════════════ LA CHARTE ═══════════════════════ */
function charter() {
  const items = [...document.querySelectorAll('[data-charter] > li')];
  if (!items.length) return;

  if (!STILL) {
    items.forEach((li) => {
      const parts = [...li.children].filter((c) => !c.classList.contains('ab-appr__burin'));
      gsap.set(parts, { autoAlpha: 0, y: 26 });
      ScrollTrigger.create({
        trigger: li, start: 'top 88%', once: true,
        onEnter: () => gsap.to(parts, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity,visibility' })
      });
    });
  }

  // Au doigt, le geste du survol : l'article qui passe au milieu de l'écran.
  if (LITE) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-on', e.isIntersecting));
    }, { rootMargin: '-42% 0px -42% 0px' });
    items.forEach((li) => io.observe(li));
  }
}

/* ═══════════════════════ LE CABINET DU MATÉRIEL ═══════════════════════
   Seule l'opacité cache les fiches avant leur arrivée : ce sont des boutons,
   ils restent atteignables au clavier (et un focus les montre aussitôt). */
function cabinet() {
  const grid = document.querySelector('[data-cabinet]');
  if (!grid || STILL) return;
  const items = [...grid.children];
  gsap.set(items, { opacity: 0, y: 44, rotation: (i) => (i % 2 ? 2.4 : -2.4), transformOrigin: '50% 100%' });
  let done = false;
  const play = () => {
    if (done) return;
    done = true;
    gsap.to(items, { opacity: 1, y: 0, rotation: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.07, clearProps: 'transform,opacity' });
  };
  ScrollTrigger.create({ trigger: grid, start: 'top 86%', once: true, onEnter: play });
  grid.addEventListener('focusin', play);
}

/* ═══════════════════════ LES FILMS ═══════════════════════ */
function films() {
  const figs = gsap.utils.toArray('.ab-films .dv-proj__fig');
  if (!figs.length || STILL) return;
  const n = figs.length;
  gsap.set(figs, { rotation: (i) => (i - (n - 1) / 2) * 2.2, scale: 0.94, transformOrigin: '50% 100%' });
  ScrollTrigger.create({
    trigger: figs[0].closest('.dv-port') || figs[0], start: 'top 86%', once: true,
    onEnter: () => gsap.to(figs, { rotation: 0, scale: 1, duration: 1.3, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' })
  });
}

/* ═══════════════════════ LE TIROIR DE FICHES ═══════════════════════ */
function drawer() {
  const card = document.querySelector('[data-drawer]');
  if (!card || !LITE || STILL) return;
  new IntersectionObserver(([e]) => card.classList.toggle('is-open', e.isIntersecting), { rootMargin: '-30% 0px -30% 0px' }).observe(card);
}

/* ═══════════════════════ LE CACHET DE CIRE ═══════════════════════ */
function wax() {
  const box = document.querySelector('[data-wax]');
  if (!box || STILL) return;
  const blob = box.querySelector('.ab-wax__blob');
  const ripple = document.createElement('span');
  ripple.className = 'ab-wax__ripple';
  box.append(ripple);

  gsap.set(blob, { autoAlpha: 0, scale: 1.45, rotation: -36 });
  const pulse = () => gsap.fromTo(ripple, { scale: 1, autoAlpha: 0.9 }, { scale: 1.7, autoAlpha: 0, duration: 1, ease: 'power2.out', overwrite: true });
  ScrollTrigger.create({
    trigger: box, start: 'top 88%', once: true,
    onEnter: () => gsap.timeline()
      .to(blob, { autoAlpha: 1, scale: 0.9, rotation: 0, duration: 0.42, ease: 'power3.in' })
      .add(pulse)
      .to(blob, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)' })
  });

  let busy = false;
  const press = () => {
    if (busy || gsap.getProperty(blob, 'opacity') < 0.99) return;
    busy = true;
    gsap.timeline({ onComplete: () => { busy = false; } })
      .to(blob, { scale: 0.9, duration: 0.13, ease: 'power2.in' })
      .add(pulse)
      .to(blob, { scale: 1, duration: 0.75, ease: 'elastic.out(1, 0.4)' });
  };
  box.addEventListener('click', press);
  const cta = document.querySelector('.ab-final .dv-btn:not(.dv-btn--ghost)');
  if (cta) {
    if (!LITE) cta.addEventListener('pointerenter', press);
    cta.addEventListener('focus', press);
  }
}
