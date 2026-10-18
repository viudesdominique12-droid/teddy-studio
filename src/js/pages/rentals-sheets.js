/**
 * EQUIPMENT RENTALS — le bureau d'études (18/10/2026).
 *
 * Dominique : « chaque page vive de son thème à travers visuel et
 * interaction ». Entre l'ouverture (la caméra 3D sur son plan) et le comptoir
 * (la feuille de sortie et son ticket), chaque section est une planche du
 * dossier technique :
 *   initCad()      un réticule de dessinateur qui suit la souris sur les
 *                  planches, avec sa lecture X / Y (ordinateur seulement) ;
 *   initRulers()   la règle graduée en tête de planche se trace à l'arrivée ;
 *   initSpecs()    les fiches du catalogue s'inclinent sous la main ; leurs
 *                  cotes se tracent au survol, au clavier, ou (téléphone)
 *                  quand la fiche passe au milieu de l'écran ; un toucher
 *                  sur la photo la fait pivoter un instant ;
 *   initOptions()  le bordereau des six formules : la ligne allumée bascule
 *                  son interrupteur, et une ligne de rappel la relie au schéma
 *                  de la formule (ses éléments, mot pour mot de sa phrase) ;
 *   initRun()      le déroulé est un câble qui se trace au défilement, de
 *                  fiche en fiche ; chaque fiche se verrouille à son passage
 *                  et le signal court dans les tronçons branchés ;
 *   initTerms()    les conditions s'impriment clause par clause, puis le
 *                  tampon se pose.
 * Tout ce qui tourne en boucle s'arrête hors de l'écran ; en mouvement
 * réduit, tout est posé à son état final, sans animation.
 * Aucun chiffre, aucune caractéristique inventés : les étiquettes des
 * schémas reprennent les mots des textes de la page.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

const pad = (n, w = 2) => String(Math.max(0, Math.round(n))).padStart(w, '0');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ═══════════════════════ LE RÉTICULE ═══════════════════════
   Deux traits fins dans le bleu de la division, qui s'estompent loin du
   pointeur, et la lecture « 02 · X 0412  Y 0188 » (la planche, puis la
   position dans la planche). Un seul calque par planche, déplacé par
   `transform` ; plus discret au-dessus des fiches, qui ont leurs propres
   gestes. */
function initCad() {
  if (LITE || reduced()) return;
  const secs = [...document.querySelectorAll('[data-cad]')];
  if (!secs.length) return;
  const SOFT = '.re-item, .re-ask, .re-rate__r, .re-op, .re-lay, .re-terms, .re-filter, .re-run__s';
  const cads = secs.map((sec) => {
    const el = document.createElement('div');
    el.className = 're-cad';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i class="re-cad__x"></i><i class="re-cad__y"></i><span class="re-cad__r"></span>';
    sec.append(el);
    const [x, y, r] = el.children;
    return { sec, el, x, y, r, sheet: sec.dataset.cad, txt: '' };
  });
  let cur = null;
  let px = -1;
  let py = -1;
  let target = null;
  let queued = false;

  const off = () => { if (cur) cur.el.classList.remove('is-on', 'is-soft'); cur = null; };
  const paint = () => {
    queued = false;
    if (px < 0) return off();
    let hit = null;
    let rect = null;
    for (const c of cads) {
      const r = c.sec.getBoundingClientRect();
      if (py >= r.top && py < r.bottom && px >= r.left && px < r.right) { hit = c; rect = r; break; }
    }
    if (hit !== cur) { off(); cur = hit; }
    if (!cur) return;
    const x = px - rect.left;
    const y = py - rect.top;
    cur.el.classList.add('is-on');
    cur.el.classList.toggle('is-soft', Boolean(target?.closest?.(SOFT)));
    cur.x.style.transform = `translate3d(${(x - 800).toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    cur.y.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 800).toFixed(1)}px, 0)`;
    cur.r.style.transform = `translate3d(${(x + 20).toFixed(1)}px, ${(y + 20).toFixed(1)}px, 0)`;
    const txt = `${cur.sheet} · X ${pad(x, 4)}  Y ${pad(y, 4)}`;
    if (txt !== cur.txt) { cur.r.textContent = txt; cur.txt = txt; }
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    px = e.clientX; py = e.clientY; target = e.target;
    ask();
  }, { passive: true });
  // La page défile sous un pointeur immobile : la lecture suit.
  window.addEventListener('scroll', () => { if (px >= 0) ask(); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { px = -1; ask(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { px = -1; ask(); } });
}

/* ═══════════════════════ LES RÈGLES ═══════════════════════ */
function initRulers() {
  const rulers = gsap.utils.toArray('.re-ruler');
  if (!rulers.length || reduced()) return;
  rulers.forEach((r) => {
    gsap.set(r, { scaleX: 0 });
    ScrollTrigger.create({
      trigger: r.parentElement, start: 'top 92%', once: true,
      onEnter: () => gsap.to(r, { scaleX: 1, duration: 1.1, ease: 'power3.inOut' })
    });
  });
}

/* ═══════════════════════ LES FICHES ═══════════════════════ */
function initSpecs() {
  const grid = document.querySelector('[data-re-items]');
  if (!grid) return;
  const still = reduced();
  const cards = [...grid.querySelectorAll('.re-item')];

  if (LITE) {
    // Le geste de la souris, au doigt : la fiche qui passe au milieu de
    // l'écran se cote ; un toucher sur la photo la fait pivoter un instant.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => e.target.classList.toggle('is-drawn', e.isIntersecting));
      }, { rootMargin: '-40% 0px -40% 0px' });
      cards.forEach((c) => io.observe(c));
    }
    if (still) return;
    cards.forEach((card) => {
      const inner = card.querySelector('.re-item__in');
      card.querySelector('.re-item__fig')?.addEventListener('click', () => {
        card.classList.add('is-drawn');
        gsap.fromTo(inner, { rotationY: -7, rotationX: 4 }, {
          rotationY: 0, rotationX: 0, transformPerspective: 900, duration: 1.1, ease: 'elastic.out(1, 0.45)',
          overwrite: true, clearProps: 'transform'
        });
      });
    });
    return;
  }
  if (still) return;

  // La fiche s'incline sous la main ; la photo glisse un peu à l'opposé, la
  // lumière de la division suit le pointeur.
  cards.forEach((card) => {
    const inner = card.querySelector('.re-item__in');
    const img = card.querySelector('.re-item__fig img');
    if (!inner) return;
    gsap.set(inner, { transformPerspective: 1100 });
    const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.7, ease: 'power3' });
    const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.7, ease: 'power3' });
    const ix = img && gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3' });
    const iy = img && gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power3' });
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      inner.style.willChange = 'transform';
      if (img) gsap.to(img, { scale: 1.045, duration: 1, ease: 'power3.out', overwrite: 'auto' });
    });
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const u = (e.clientX - r.left) / r.width - 0.5;
      const v = (e.clientY - r.top) / r.height - 0.5;
      rx(-v * 7);
      ry(u * 9);
      if (ix) { ix(-u * 10); iy(-v * 8); }
      inner.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
      inner.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
    });
    card.addEventListener('pointerleave', () => {
      rx(0); ry(0);
      if (ix) { ix(0); iy(0); gsap.to(img, { scale: 1, duration: 0.9, ease: 'power3.out', overwrite: 'auto' }); }
      gsap.delayedCall(0.8, () => { inner.style.willChange = ''; });
    });
  });
}

/* ═══════════════════════ LE BORDEREAU DES FORMULES ═══════════════════════
   Chaque formule a son schéma : ses éléments à gauche, reliés à sa
   destination à droite. Les mots viennent de la phrase de la formule. */
const LAYOUTS = {
  dry: { from: ['Equipment'], to: 'Your crew' },
  operator: { from: ['Equipment', 'Operator'], to: 'Your shoot or event' },
  multicam: { from: ['Cam 1', 'Cam 2', 'Cam n'], to: 'One moment', aim: true },
  'event-av': { from: ['Sound', 'Image', 'Light'], to: 'Your event' },
  live: { from: ['Capture', 'Switching', 'Streaming'], to: 'Online', chain: true },
  film: { from: ['Camera', 'Lenses', 'Light', 'Sound'], to: 'Film shoot' }
};

/* Le schéma, en SVG (viewBox 360 × 210). Les boîtes sont des tracés
   (`pathLength=1`) : elles se dessinent à l'allumage. */
function layoutSvg(key, L) {
  const W = 360;
  const H = 210;
  const cy = H / 2;
  const bw = 112;
  const bh = 30;
  const x0 = 4;
  const gap = L.from.length > 3 ? 46 : 54;
  const ys = L.from.map((_, i) => cy + (i - (L.from.length - 1) / 2) * gap);
  const box = (x, y, w, h, cls) => `<path class="${cls}" pathLength="1" d="M${x} ${y}h${w}v${h}h${-w}Z"/>`;
  const label = (x, y, t, cls = 're-lay__tx') => `<text class="${cls}" x="${x}" y="${y}">${esc(t.toUpperCase())}</text>`;
  const id = `re-ah-${key}`;
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <defs><marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="re-lay__ah" d="M0 0L8 4L0 8Z"/></marker></defs>`;
  // Les boîtes de gauche.
  ys.forEach((y, i) => {
    s += box(x0, y - bh / 2, bw, bh, 're-lay__box');
    s += `<rect class="re-lay__port" x="${x0 + bw - 2}" y="${y - 2}" width="4" height="4"/>`;
    s += label(x0 + bw / 2, y, L.from[i]);
    s += `<text class="re-lay__idx" x="${x0}" y="${y - bh / 2 - 5}">${String.fromCharCode(65 + i)}</text>`;
  });
  const bx = 178;
  if (L.aim) {
    // Plusieurs caméras, un seul moment, des angles différents : les lignes
    // convergent sur le réticule.
    const cx = 292;
    const R = 30;
    ys.forEach((y) => {
      const sx = x0 + bw + 2;
      const dx = cx - sx;
      const dy = cy - y;
      const d = Math.hypot(dx, dy);
      const ex = cx - (dx / d) * (R + 3);
      const ey = cy - (dy / d) * (R + 3);
      s += `<path class="re-lay__w" d="M${sx} ${y}L${ex.toFixed(1)} ${ey.toFixed(1)}" marker-end="url(#${id})"/>`;
    });
    s += `<circle class="re-lay__aim" pathLength="1" cx="${cx}" cy="${cy}" r="${R}"/><circle class="re-lay__aim2" cx="${cx}" cy="${cy}" r="${R - 12}"/>`;
    s += `<path class="re-lay__cross" d="M${cx - R - 8} ${cy}h12M${cx + R - 4} ${cy}h12M${cx} ${cy - R - 8}v12M${cx} ${cy + R - 4}v12"/><circle class="re-lay__dot" cx="${cx}" cy="${cy}" r="3"/>`;
    s += label(cx, cy + R + 22, L.to, 're-lay__tx re-lay__tx--to');
  } else {
    const tw = 128;
    const tx = W - tw - 4;
    const words = L.to.split(' ');
    const two = L.to.length > 13 && words.length > 1;
    const th = two ? 50 : 40;
    if (L.chain) {
      ys.forEach((y, i) => {
        if (i < ys.length - 1) s += `<path class="re-lay__w" d="M${x0 + bw / 2} ${y + bh / 2 + 1}V${ys[i + 1] - bh / 2 - 3}" marker-end="url(#${id})"/>`;
      });
      const yl = ys[ys.length - 1];
      s += `<path class="re-lay__w" d="M${x0 + bw + 2} ${yl}H${bx}V${cy}H${tx - 3}" marker-end="url(#${id})"/>`;
    } else {
      ys.forEach((y) => { s += `<path class="re-lay__w" d="M${x0 + bw + 2} ${y}H${bx}V${cy}H${tx - 3}" marker-end="url(#${id})"/>`; });
      if (ys.length > 1) s += `<circle class="re-lay__dot" cx="${bx}" cy="${cy}" r="3"/>`;
    }
    s += box(tx, cy - th / 2, tw, th, 're-lay__box re-lay__box--to');
    if (two) {
      const mid = Math.ceil(words.length / 2);
      s += label(tx + tw / 2, cy - 8, words.slice(0, mid).join(' '), 're-lay__tx re-lay__tx--to');
      s += label(tx + tw / 2, cy + 8, words.slice(mid).join(' '), 're-lay__tx re-lay__tx--to');
    } else {
      s += label(tx + tw / 2, cy, L.to, 're-lay__tx re-lay__tx--to');
    }
  }
  return `${s}</svg>`;
}

/* Le petit schéma de ligne (téléphone, tablette) : les éléments, une flèche,
   la destination. */
function strip(L) {
  const arrow = '<b class="re-strip__a"></b>';
  const items = L.from.map((t) => `<i>${esc(t)}</i>`).join(L.chain ? arrow : '');
  return `<span class="re-strip${L.chain ? ' is-chain' : ''}" aria-hidden="true">${items}${arrow}<em>${esc(L.to)}</em></span>`;
}

function initOptions() {
  const root = document.querySelector('[data-re-opts]');
  if (!root) return;
  const still = reduced();
  const sec = root.closest('section');
  const rows = [...root.querySelectorAll('.re-rate__r')];
  const lay = root.querySelector('[data-re-lay]');
  const stage = root.querySelector('[data-re-lay-stage]');
  const capN = root.querySelector('[data-re-lay-n]');
  const capT = root.querySelector('[data-re-lay-t]');
  const lead = root.querySelector('[data-re-lead]');
  const path = lead?.querySelector('path');
  const [c1, c2] = lead ? [...lead.querySelectorAll('circle')] : [];
  const wide = matchMedia('(min-width: 64.01rem)');

  if (stage) stage.innerHTML = rows.map((r) => `<div class="re-lay__d" data-for="${esc(r.dataset.opt)}">${layoutSvg(r.dataset.opt, LAYOUTS[r.dataset.opt] || { from: [], to: '' })}</div>`).join('');
  rows.forEach((r) => { const L = LAYOUTS[r.dataset.opt]; if (L) r.insertAdjacentHTML('beforeend', strip(L)); });
  const figs = stage ? [...stage.children] : [];
  let active = null;

  // La ligne de rappel : du bout de la ligne allumée au schéma, en équerre.
  const drawLead = (animate) => {
    if (!lead || !path || !active || !lay || !wide.matches) { lead?.classList.remove('is-on'); return; }
    const o = root.getBoundingClientRect();
    const r = active.getBoundingClientRect();
    const p = lay.getBoundingClientRect();
    const x1 = r.right - o.left + 10;
    const y1 = r.top + r.height / 2 - o.top;
    const x2 = p.left - o.left - 6;
    const y2 = Math.min(Math.max(y1, p.top - o.top + 24), p.bottom - o.top - 24);
    const xm = x1 + (x2 - x1) * 0.45;
    path.setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)}H${xm.toFixed(1)}V${y2.toFixed(1)}H${x2.toFixed(1)}`);
    c1.setAttribute('cx', x1.toFixed(1)); c1.setAttribute('cy', y1.toFixed(1));
    c2.setAttribute('cx', x2.toFixed(1)); c2.setAttribute('cy', y2.toFixed(1));
    lead.classList.add('is-on');
    if (animate && !still) {
      gsap.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out', overwrite: true });
      gsap.fromTo(c2, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, delay: 0.4, overwrite: true });
    }
  };

  const set = (row, animate = true) => {
    if (!row || row === active) return;
    active?.classList.remove('is-on');
    row.classList.add('is-on');
    active = row;
    const key = row.dataset.opt;
    if (capN) capN.textContent = row.querySelector('.re-rate__n')?.textContent || '';
    if (capT) capT.textContent = row.querySelector('.re-rate__h')?.textContent || '';
    const fig = figs.find((f) => f.dataset.for === key);
    figs.forEach((f) => f.classList.toggle('is-on', f === fig));
    if (fig && animate && !still && wide.matches) {
      gsap.fromTo(fig.querySelectorAll('.re-lay__box, .re-lay__aim'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.06, ease: 'power2.inOut', overwrite: true });
      gsap.fromTo(fig.querySelectorAll('text, .re-lay__port, .re-lay__dot, .re-lay__aim2, .re-lay__cross'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, stagger: 0.025, delay: 0.18, overwrite: true });
      gsap.fromTo(fig.querySelectorAll('.re-lay__w'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.05, delay: 0.38, overwrite: true });
    }
    drawLead(animate);
  };

  // Survol et clavier ; sur écran tactile, la ligne qui passe au milieu.
  rows.forEach((row) => {
    row.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(row); });
    row.addEventListener('focusin', () => set(row));
  });
  if (LITE && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(e.target); });
    }, { rootMargin: '-42% 0px -42% 0px' });
    rows.forEach((r) => io.observe(r));
  }
  set(rows[0], false);

  // La ligne de rappel suit le défilement (le schéma est collant), tant que
  // le bordereau est à l'écran ; les fils du schéma courent pendant ce temps.
  let visible = false;
  let queued = false;
  const follow = () => {
    if (!visible || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; drawLead(false); });
  };
  if (sec && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sec.classList.toggle('is-live', visible);
      if (visible) follow();
    }).observe(sec);
  }
  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', () => drawLead(false));
  wide.addEventListener?.('change', () => drawLead(false));

  // L'arrivée : les filets du bordereau se tracent de gauche à droite, les
  // lignes montent l'une après l'autre.
  const man = root.querySelector('.re-man');
  if (still || !man) return;
  const parts = [man.querySelector('.re-man__cols'), ...rows].filter(Boolean);
  gsap.set(parts, { autoAlpha: 0, y: 14, '--rule': 0 });
  ScrollTrigger.create({
    trigger: man, start: 'top 84%', once: true,
    onEnter: () => gsap.to(parts, {
      autoAlpha: 1, y: 0, '--rule': 1, duration: 0.75, stagger: 0.06, ease: 'power3.out',
      clearProps: 'transform,opacity,visibility',
      onComplete: () => drawLead(false)
    })
  });
}

/* ═══════════════════════ LE CÂBLE DU DÉROULÉ ═══════════════════════
   Une fiche à trois broches par étape. Le câble passe par le centre des
   fiches (en ligne sur ordinateur, en colonne sur téléphone), puis file
   jusqu'à « Your set ». */
const JACK = `<svg viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
  <circle class="j-o" r="14.5"/>
  <g class="j-f"><circle class="j-i" r="9.6"/>
    <circle class="j-p" cx="-3.9" cy="-1.7" r="1.55"/><circle class="j-p" cx="3.9" cy="-1.7" r="1.55"/><circle class="j-p" cx="0" cy="4.3" r="1.55"/>
    <rect class="j-k" x="-1.7" y="-14.6" width="3.4" height="3.8" rx="0.6"/></g>
</svg>`;

function initRun() {
  const run = document.querySelector('[data-re-run]');
  const svg = run?.querySelector('[data-re-wire]');
  if (!run || !svg) return;
  const sec = run.closest('section');
  const still = reduced();
  const steps = [...run.querySelectorAll('.re-run__s')];
  const jacks = steps.map((s) => s.querySelector('.re-run__j'));
  jacks.forEach((j) => { if (j) j.innerHTML = JACK; });
  let fracs = [];
  let ends = [];
  let onPath = null;
  let sigs = [];
  let tags = [];
  let term = null;
  let progress = still ? 1 : 0;

  const paint = (p) => {
    progress = p;
    if (onPath) onPath.style.strokeDashoffset = String(1 - p);
    steps.forEach((s, i) => s.classList.toggle('is-on', p > 0.001 && p >= fracs[i] - 0.002));
    sigs.forEach((g, i) => g.classList.toggle('is-on', p >= ends[i] - 0.002));
    tags.forEach((g, i) => g.classList.toggle('is-on', p >= ends[i] - 0.002));
    term?.classList.toggle('is-on', p >= 0.995);
  };

  const build = () => {
    const o = run.getBoundingClientRect();
    if (!o.width) return;
    const pts = jacks.map((j) => {
      const r = j.getBoundingClientRect();
      return [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top];
    });
    if (pts.length < 2) return;
    const row = Math.abs(pts[1][1] - pts[0][1]) < 4;
    const last = pts[pts.length - 1];
    const end = row ? [o.width - 2, last[1]] : [last[0], o.height - 6];
    const all = [...pts, end];
    const lens = all.slice(1).map((pt, i) => Math.hypot(pt[0] - all[i][0], pt[1] - all[i][1]));
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    fracs = [0];
    ends = lens.map((l) => { acc += l; return acc / total; });
    fracs.push(...ends.slice(0, pts.length - 1));
    const d = `M${all.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}`;
    let s = `<path class="re-run__base" d="${d}"/><path class="re-run__on" pathLength="1" d="${d}"/>`;
    for (let i = 0; i < all.length - 1; i++) {
      const [a, b] = [all[i], all[i + 1]];
      s += `<path class="re-run__sig" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`;
    }
    // Les repères de fil (W1…W5), au milieu de chaque tronçon, en ligne
    // seulement : en colonne, ils gêneraient le texte.
    if (row) {
      for (let i = 0; i < all.length - 1; i++) {
        const mx = (all[i][0] + all[i + 1][0]) / 2;
        const my = all[i][1];
        s += `<g class="re-run__tag" transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})"><rect x="-15" y="-7.5" width="30" height="15" rx="2"/><text y="0.5">W${i + 1}</text></g>`;
      }
    }
    s += `<g class="re-run__end${row ? '' : ' is-col'}" transform="translate(${end[0].toFixed(1)} ${end[1].toFixed(1)})"><path d="${row ? 'M-9 -5L0 0L-9 5' : 'M-5 -9L0 0L5 -9'}"/><text ${row ? 'x="-2" y="-14"' : 'x="12" y="-2"'}>Your set</text></g>`;
    svg.setAttribute('viewBox', `0 0 ${o.width.toFixed(1)} ${o.height.toFixed(1)}`);
    svg.setAttribute('width', o.width.toFixed(1));
    svg.setAttribute('height', o.height.toFixed(1));
    svg.innerHTML = s;
    onPath = svg.querySelector('.re-run__on');
    sigs = [...svg.querySelectorAll('.re-run__sig')];
    tags = [...svg.querySelectorAll('.re-run__tag')];
    term = svg.querySelector('.re-run__end');
    paint(progress);
  };
  build();
  if ('ResizeObserver' in window) {
    let t = 0;
    new ResizeObserver(() => { clearTimeout(t); t = setTimeout(build, 80); }).observe(run);
  }
  document.fonts?.ready?.then(build);

  // Le signal ne court que planche à l'écran.
  if (sec && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => sec.classList.toggle('is-live', e.isIntersecting)).observe(sec);
  }
  if (still) { paint(1); return; }
  ScrollTrigger.create({
    trigger: run, start: 'top 74%', end: 'bottom 62%', scrub: 0.5,
    onUpdate: (self) => paint(self.progress),
    onRefresh: (self) => paint(self.progress)
  });
}

/* ═══════════════════════ LA FEUILLE DE CONDITIONS ═══════════════════════ */
function initTerms() {
  const box = document.querySelector('[data-re-terms]');
  if (!box) return;
  const items = box.querySelectorAll('.re-cond__list li');
  const head = box.querySelector('.re-terms__head');
  const seal = box.querySelector('.re-seal');
  if (reduced()) return;
  gsap.set([head, ...items], { autoAlpha: 0, y: 12, '--rule': 0 });
  gsap.set(seal, { autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: box, start: 'top 80%', once: true,
    onEnter: () => {
      gsap.timeline()
        .to([head, ...items], { autoAlpha: 1, y: 0, '--rule': 1, duration: 0.6, stagger: 0.075, ease: 'power3.out', clearProps: 'transform,opacity,visibility' })
        .fromTo(seal, { autoAlpha: 0, scale: 1.8, rotation: -20 }, {
          autoAlpha: 1, scale: 1, rotation: -7, duration: 0.42, ease: 'back.out(1.8)'
        }, '-=0.15')
        .fromTo(box, { y: 0 }, { y: 2.5, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.inOut', clearProps: 'transform' }, '-=0.08');
    }
  });
}

/* ═══════════════════════ LE FILTRE : LA NOTE QUI S'ÉCRIT ═══════════════════════
   Au changement de catégorie, la ligne d'explication se découvre de gauche
   à droite, comme tracée à la plume. */
export function plotLine(line) {
  if (!line || reduced()) return;
  gsap.fromTo(line.children, { clipPath: 'inset(0 100% 0 0)' }, {
    clipPath: 'inset(0 0% 0 0)', duration: 0.6, stagger: 0.12, ease: 'power2.out', clearProps: 'clipPath'
  });
}

export function initSheets() {
  initCad();
  initRulers();
  initSpecs();
  initOptions();
  initRun();
  initTerms();
}
