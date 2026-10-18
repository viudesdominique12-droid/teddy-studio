/**
 * PORTFOLIO — la salle d'archives (18/10/2026).
 *
 *   live()       les animations continues (filets, étiquettes, bobine…) ne
 *                tournent que dans la section à l'écran, onglet visible ;
 *   tableOn()    la table lumineuse s'allume en arrivant, comme un tube qui
 *                hésite deux fois avant de prendre ;
 *   loupe()      à la souris, une loupe d'archiviste suit le pointeur sur les
 *                tirages et grossit l'image (celle qui est affichée) ;
 *   near()       au doigt, le tirage au milieu de l'écran se redresse et la
 *                lumière passe dessous ;
 *   reel()       la bobine réceptrice de l'appel final : une vraie géométrie
 *                (jante, six lumières, moyeu), tracée dans le code.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────── Les animations continues, seulement à l'écran ─────────────── */
export function live(sel = '[data-live], .ftr') {
  if (reduced()) return;
  const els = [...document.querySelectorAll(sel)];
  const seen = new Map();
  const paint = () => els.forEach((el) => el.classList.toggle('is-live', !!seen.get(el) && !document.hidden));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target, e.isIntersecting));
    paint();
  }, { rootMargin: '80px 0px' });
  els.forEach((el) => io.observe(el));
  document.addEventListener('visibilitychange', paint);
}

/* ─────────────── La table lumineuse s'allume ─────────────── */
export function tableOn(table) {
  if (!table) return;
  if (reduced()) { table.classList.add('is-on'); return; }
  const glow = table.querySelector('.pf-table__glow');
  gsap.set(glow, { opacity: 0 });
  ScrollTrigger.create({
    trigger: table, start: 'top 82%',
    onEnter: (self) => {
      self.kill();
      table.classList.add('is-on');
      gsap.timeline()
        .to(glow, { opacity: 0.7, duration: 0.06, ease: 'none' })
        .to(glow, { opacity: 0.08, duration: 0.08, ease: 'none' })
        .to(glow, { opacity: 0.85, duration: 0.05, ease: 'none' }, '+=0.12')
        .to(glow, { opacity: 0.25, duration: 0.1, ease: 'none' })
        .to(glow, { opacity: 1, duration: 0.7, ease: 'power2.out', clearProps: 'opacity' }, '+=0.05');
    }
  });
}

/* ─────────────── La loupe ─────────────── */
const ZOOM = 2.3;
export function loupe(gridEl) {
  if (!gridEl || LITE || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cur = document.getElementById('cursor');
  let card = null, lens = null, raf = 0, last = null;

  const shownImg = (c) => c.querySelector('.pf-card__flip img.is-on')
    || (c.classList.contains('is-big') && c.classList.contains('has-bg') ? c.querySelector('.pf-card__bg') : c.querySelector('.pf-card__img'));

  const place = () => {
    raf = 0;
    if (!card || !last) return;
    const pic = card.querySelector('.pf-card__pic');
    const img = shownImg(card);
    if (!pic || !img) return;
    const r = pic.getBoundingClientRect();
    const x = last.clientX - r.left, y = last.clientY - r.top;
    // Sur la jaquette posée sur la photo (la grande carte), la loupe se retire.
    const jacket = card.classList.contains('is-big') && card.classList.contains('has-bg') ? card.querySelector('.pf-card__img') : null;
    const jr = jacket?.getBoundingClientRect();
    const onJacket = jr && last.clientX >= jr.left && last.clientX <= jr.right && last.clientY >= jr.top && last.clientY <= jr.bottom;
    const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height && !onJacket;
    card.classList.toggle('is-loupe', inside);
    if (cur) cur.dataset.state = inside ? 'loupe' : 'view';
    if (!inside) return;
    // L'image est « cover » (et un rien agrandie) : on retrouve où tombe le pointeur.
    const nw = img.naturalWidth || 1280, nh = img.naturalHeight || 720;
    const sc = Math.max(r.width / nw, r.height / nh) * 1.03;
    const dw = nw * sc, dh = nh * sc;
    const fx = img.classList.contains('pf-card__bg') ? 0.7 : 0.5;
    const ox = (r.width - dw) * fx, oy = (r.height - dh) / 2;
    const L = lens.offsetWidth || 150;
    const src = img.currentSrc || img.src;
    if (lens.dataset.src !== src) { lens.dataset.src = src; lens.style.backgroundImage = `url("${src}")`; }
    lens.style.backgroundSize = `${dw * ZOOM}px ${dh * ZOOM}px`;
    lens.style.backgroundPosition = `${L / 2 - (x - ox) * ZOOM}px ${L / 2 - (y - oy) * ZOOM}px`;
    // La loupe est posée sur le passe-partout (elle peut déborder de la photo).
    lens.style.transform = `translate3d(${x + pic.offsetLeft - L / 2}px, ${y + pic.offsetTop - L / 2}px, 0)`;
  };

  gridEl.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const c = e.target.closest('.pf-card');
    if (c !== card) {
      card?.classList.remove('is-loupe');
      card = c;
      if (card) {
        const fig = card.querySelector('.pf-card__fig');
        lens = fig.querySelector('.pf-loupe');
        if (!lens) {
          lens = document.createElement('span');
          lens.className = 'pf-loupe';
          lens.setAttribute('aria-hidden', 'true');
          fig.append(lens);
        }
      }
    }
    last = e;
    if (card && !raf) raf = requestAnimationFrame(place);
  });
  gridEl.addEventListener('pointerleave', () => {
    card?.classList.remove('is-loupe');
    card = null;
  });
}

/* ─────────────── Au doigt : le tirage du milieu s'éclaire ─────────────── */
export function near(gridEl) {
  if (!gridEl || !LITE) return null;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-near', e.isIntersecting));
  }, { rootMargin: '-40% 0px -40% 0px' });
  return {
    watch(els) { io.disconnect(); els.forEach((el) => io.observe(el)); }
  };
}

/* ─────────────── La bobine de l'appel final ─────────────── */
export function reel(box) {
  if (!box) return;
  const C = 200, R = 96;
  const polar = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const f = (n) => n.toFixed(2);
  // Six lumières : des secteurs d'anneau aux coins arrondis par la jante.
  const windows = Array.from({ length: 6 }, (_, k) => {
    const a0 = (k * 60 + 9) * Math.PI / 180, a1 = (k * 60 + 51) * Math.PI / 180;
    const r0 = 30, r1 = 80;
    const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1);
    const [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0);
    return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 0 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 0 0 ${f(x3)} ${f(y3)}Z`;
  }).join('');
  const holes = Array.from({ length: 3 }, (_, k) => {
    const [x, y] = polar(9, (k * 120 - 90) * Math.PI / 180);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="2.2"/>`;
  }).join('');
  box.innerHTML = `<svg viewBox="0 0 400 400" focusable="false">
    <g class="pf-reel__spin">
      <circle class="pf-reel__rim" cx="${C}" cy="${C}" r="${R}"/>
      <circle class="pf-reel__rim2" cx="${C}" cy="${C}" r="${R - 5}"/>
      <path class="pf-reel__win" d="${windows}"/>
      <circle class="pf-reel__hub" cx="${C}" cy="${C}" r="18"/>
      <g class="pf-reel__holes">${holes}</g>
    </g>
    <circle class="pf-reel__film" cx="${C}" cy="${C}" r="${R + 46}"/>
  </svg>`;
  if (reduced()) return;
  // Au défilement, la bobine roule d'un tiers de tour en plus de sa rotation lente.
  gsap.fromTo(box, { rotation: -40 }, {
    rotation: 80, ease: 'none',
    scrollTrigger: { trigger: box.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
  });
}
