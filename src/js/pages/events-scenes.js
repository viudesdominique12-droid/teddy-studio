/**
 * EVENT ORGANIZING — la soirée, section par section (18/10/2026).
 *
 * Dominique : « ce que je veux c'est pas juste un changement de couleur…
 * c'est que chaque page vive de son thème à travers visuel et interaction,
 * effets ». Entre l'ouverture (la salle) et la demande (l'invitation), chaque
 * section devient un objet de la soirée :
 *
 *   initSpot     le programme des familles — une poursuite glisse vers la
 *                ligne survolée, suit la souris sur la largeur, puis revient
 *                sur la famille ouverte (le rideau du dépli est en CSS) ;
 *   initMenu     ce que comprend le service — le programme imprimé arrive
 *                sur la table, ses lignes s'impriment ; sur téléphone, la
 *                ligne au milieu de l'écran prend la lueur de la bougie ;
 *   initPasses   les options — des badges suspendus : ils tombent sur leur
 *                cordon, oscillent au défilement, pivotent sous la souris ;
 *   initStage    le processus — le rideau s'ouvre au défilement, chaque top
 *                « Go » allume un projecteur de plus ;
 *   initMarquee  le portfolio vide — l'enseigne lumineuse de la salle ;
 *   initKickers  la pastille de chaque sur-titre s'allume à l'arrivée ;
 *   initBokeh    les lumières floues ne dérivent que si on les voit.
 *
 * Règles : transform et opacité seulement ; rien ne tourne hors de l'écran
 * ni onglet caché ; sur écran tactile, des équivalents au toucher et au
 * défilement ; en mouvement réduit, tout est posé et allumé. Les éléments
 * de décor sont `aria-hidden` dans le HTML.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const still = reduced();

export function initScenes() {
  initKickers();
  initBokeh();
  initSpot();
  initMenu();
  initPasses();
  initStage();
  initMarquee();
}

/* Appelle `cb(visible)` quand l'élément entre ou sort de l'écran, et
   `false` quand l'onglet est caché. */
function onSeen(el, cb, rootMargin = '0px') {
  let vis = false;
  const paint = () => cb(vis && !document.hidden);
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; paint(); }, { rootMargin }).observe(el);
  document.addEventListener('visibilitychange', paint);
}

/* ═══════════════════════ LES LAMPES DES SUR-TITRES ═══════════════════════ */
function initKickers() {
  const main = document.getElementById('main');
  const secs = [...document.querySelectorAll('#types, #services, #levels, #process, #portfolio')];
  if (!main || !secs.length || still || !('IntersectionObserver' in window)) return;
  main.classList.add('ev-io');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -35% 0px' });
  secs.forEach((s) => io.observe(s));
}

/* ═══════════════════════ LES LUMIÈRES FLOUES ═══════════════════════ */
function initBokeh() {
  if (still) return;
  document.querySelectorAll('[data-bokeh]').forEach((b) => {
    onSeen(b, (on) => b.classList.toggle('is-run', on));
  });
}

/* ═══════════════════════ LA POURSUITE ═══════════════════════
   Une flaque de lumière sous la liste des familles. Elle vise :
     · la ligne survolée (souris) ou qui a le focus (clavier), en suivant la
       souris sur la largeur ;
     · sinon la famille ouverte, dépli compris ;
     · sinon rien (elle s'éteint).
   Elle se replace quand la liste change de hauteur (un dépli qui s'ouvre). */
function initSpot() {
  const prog = document.querySelector('.ev-prog');
  const spot = prog?.querySelector('.ev-spot');
  const pool = spot?.querySelector('.ev-spot__pool');
  if (!prog || !spot || !pool) return;
  const fams = [...prog.querySelectorAll('.ev-fam')];
  let hover = null;
  let px = null;

  gsap.set(pool, { xPercent: -50 });
  const move = still
    ? { y: (v) => gsap.set(spot, { y: v }), h: (v) => gsap.set(spot, { height: v }), x: (v) => gsap.set(pool, { x: v }) }
    : {
        y: gsap.quickTo(spot, 'y', { duration: 0.6, ease: 'power3.out' }),
        h: gsap.quickTo(spot, 'height', { duration: 0.6, ease: 'power3.out' }),
        x: gsap.quickTo(pool, 'x', { duration: 0.9, ease: 'power3.out' })
      };

  const target = () => {
    const open = fams.find((f) => f.classList.contains('is-open'));
    const t = hover || open;
    if (!t) return null;
    const full = t.classList.contains('is-open');
    return { y: t.offsetTop, h: full ? t.offsetHeight : t.querySelector('.ev-fam__q').offsetHeight };
  };
  const restX = () => prog.clientWidth * (LITE ? 0.5 : 0.34);

  let first = true;
  function place() {
    const t = target();
    prog.classList.toggle('has-spot', Boolean(t));
    if (!t) return;
    const x = px ?? restX();
    if (first) {                                   // la première fois, d'emblée
      first = false;
      gsap.set(spot, { y: t.y, height: t.h });
      gsap.set(pool, { x });
      if (!still) {                                // les quickTo partent de là
        move.y(t.y); move.h(t.h); move.x(x);
      }
      return;
    }
    move.y(t.y); move.h(t.h); move.x(x);
  }

  if (!LITE) {
    prog.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      hover = e.target.closest?.('.ev-fam') || null;
      px = e.clientX - prog.getBoundingClientRect().left;
      place();
    });
    prog.addEventListener('pointerleave', () => { hover = null; px = null; place(); });
  }
  prog.addEventListener('focusin', (e) => {
    if (!e.target.matches?.(':focus-visible')) return;
    hover = e.target.closest('.ev-fam'); px = null; place();
  });
  prog.addEventListener('focusout', (e) => {
    if (!prog.contains(e.relatedTarget)) { hover = null; place(); }
  });
  prog.addEventListener('click', () => requestAnimationFrame(place));
  if ('ResizeObserver' in window) new ResizeObserver(() => place()).observe(prog);
  place();
}

/* ═══════════════════════ LE PROGRAMME IMPRIMÉ ═══════════════════════ */
function initMenu() {
  const menu = document.querySelector('[data-menu]');
  if (!menu) return;
  const items = [...menu.querySelectorAll('.ev-menu__list > li')];
  items.forEach((li, i) => li.style.setProperty('--i', String(i)));

  // Sur téléphone, pas de survol : la ligne qui passe au milieu de l'écran
  // reçoit la lueur de la bougie.
  if (LITE && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-lit', e.isIntersecting);
    }, { rootMargin: '-46% 0px -46% 0px' });
    items.forEach((li) => io.observe(li));
  }

  if (still) return;
  // Le carton arrive sur la table : il se couche un peu, puis se pose.
  menu.classList.add('is-js');
  gsap.set(menu, { autoAlpha: 0, y: 46, rotationX: 9, transformPerspective: 1400, transformOrigin: '50% 100%' });
  ScrollTrigger.create({
    trigger: menu, start: 'top 84%', once: true,
    onEnter: () => {
      gsap.to(menu, {
        autoAlpha: 1, y: 0, rotationX: 0, duration: 1.15, ease: 'power3.out',
        clearProps: 'transform,opacity,visibility'
      });
      menu.classList.add('is-in');
    }
  });
}

/* ═══════════════════════ LES BADGES ═══════════════════════ */
function initPasses() {
  const root = document.querySelector('[data-passes]');
  if (!root || still) return;
  const passes = [...root.querySelectorAll('.ev-pass')];
  const swings = passes.map((p) => p.querySelector('.ev-pass__swing'));
  const tilts = passes.map((p) => p.querySelector('.ev-pass__tilt'));
  const cards = passes.map((p) => p.querySelector('.ev-pass__card'));
  if (swings.some((s) => !s)) return;

  gsap.set(swings, { transformOrigin: '50% 0%' });
  gsap.set(tilts, { transformOrigin: '50% 0%', transformPerspective: 900 });

  // L'arrivée : chaque badge tombe sur son cordon, se balance et se pose.
  let ready = false;
  const tip = [5, -4, 6, -5];
  gsap.set(swings, { autoAlpha: 0, yPercent: -14, rotation: (i) => tip[i % 4] });
  ScrollTrigger.create({
    trigger: root, start: 'top 82%', once: true,
    onEnter: () => {
      gsap.timeline({ onComplete: () => { ready = true; } })
        .to(swings, { autoAlpha: 1, yPercent: 0, duration: 0.85, ease: 'power3.out', stagger: 0.1 }, 0)
        .to(swings, { rotation: 0, duration: 1.9, ease: 'elastic.out(1, 0.32)', stagger: 0.1 }, 0.08);
    }
  });

  // Le balancement : la vitesse du défilement les fait osciller, à peine ;
  // à l'arrêt, ils reviennent en se balançant.
  const sway = swings.map((s) => gsap.quickTo(s, 'rotation', { duration: 1.6, ease: 'elastic.out(1, 0.28)' }));
  const k = [1, 0.82, 1.12, 0.92];
  let calm = 0;
  const nudge = (i, a) => {
    sway[i](a);
    window.setTimeout(() => sway[i](0), 150);
  };
  ScrollTrigger.create({
    trigger: root, start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      if (!ready || document.hidden) return;
      const v = gsap.utils.clamp(-3.2, 3.2, self.getVelocity() / 800);
      sway.forEach((f, i) => f(v * k[i]));
      clearTimeout(calm);
      calm = window.setTimeout(() => sway.forEach((f) => f(0)), 110);
    }
  });

  if (!LITE) {
    // Sous la souris : le badge pivote autour de son agrafe, un reflet le
    // traverse, l'hologramme tourne ses couleurs.
    passes.forEach((p, i) => {
      const rx = gsap.quickTo(tilts[i], 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(tilts[i], 'rotationY', { duration: 0.6, ease: 'power3.out' });
      p.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse' && ready) nudge(i, e.movementX >= 0 ? 1.8 : -1.8);
      });
      p.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = p.getBoundingClientRect();
        const x = gsap.utils.clamp(0, 1, (e.clientX - r.left) / r.width);
        const y = gsap.utils.clamp(0, 1, (e.clientY - r.top) / r.height);
        ry((x - 0.5) * 16);
        rx((0.5 - y) * 9);
        cards[i].style.setProperty('--hx', `${((1 - x) * 100).toFixed(1)}%`);
        cards[i].style.setProperty('--ha', `${Math.round(x * 240 + y * 90)}deg`);
      });
      p.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  } else if ('IntersectionObserver' in window) {
    // Sur téléphone : le badge qui passe au milieu de l'écran se balance, et
    // son reflet le traverse une fois.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const i = passes.indexOf(e.target);
        e.target.classList.toggle('is-on', e.isIntersecting);
        if (e.isIntersecting && ready) nudge(i, i % 2 ? -2.2 : 2.2);
      }
    }, { rootMargin: '-38% 0px -38% 0px' });
    passes.forEach((p) => io.observe(p));
  }
}

/* ═══════════════════════ LA SCÈNE ═══════════════════════
   La feuille de conduite (« Standby » → « Go » quand on atteint le top) et
   ses projecteurs : le top N allume le projecteur N ; le dernier parti
   garde la lumière la plus vive. Le rideau s'ouvre pendant que la section
   monte dans l'écran (de son entrée jusqu'à ce que son haut passe aux deux
   cinquièmes de l'écran) : il est ouvert avant qu'on lise la première étape. */
function initStage() {
  const sec = document.getElementById('process');
  if (!sec) return;
  const rows = [...sec.querySelectorAll('.ev-cue')];
  const fixes = [...sec.querySelectorAll('.ev-fix')];
  const beams = [...sec.querySelectorAll('.ev-beam')];
  if (!rows.length) return;

  const paint = () => {
    let now = -1;
    rows.forEach((r, i) => { if (r.classList.contains('is-go')) now = i; });
    rows.forEach((r, i) => {
      const go = r.classList.contains('is-go');
      r.classList.toggle('is-now', i === now);
      for (const el of [fixes[i], beams[i]]) {
        el?.classList.toggle('is-on', go);
        el?.classList.toggle('is-now', i === now);
      }
    });
  };
  if (still) {
    rows.forEach((r) => r.classList.add('is-go'));
    sec.classList.add('is-pre');
    paint();
    return;
  }

  const flash = (r) => {
    r.classList.remove('is-flash');
    void r.offsetWidth;                          // relance l'éclair
    r.classList.add('is-flash');
  };
  rows.forEach((r) => {
    ScrollTrigger.create({
      trigger: r, start: 'top 74%',
      onEnter: () => { r.classList.add('is-go'); flash(r); paint(); },
      onLeaveBack: () => { r.classList.remove('is-go', 'is-flash'); paint(); }
    });
  });

  // Le rideau : les deux pans glissent vers les coulisses en se plissant
  // (scaleX depuis le bord), jusqu'à ne laisser qu'un pan fin sur la marge.
  const box = sec.querySelector('[data-curtain]');
  const L = box?.querySelector('.ev-drape--l');
  const R = box?.querySelector('.ev-drape--r');
  if (!L || !R) return;
  const S_END = 0.24;
  let w = 0, rest = 0;
  const measure = () => {
    w = L.offsetWidth;
    rest = parseFloat(getComputedStyle(sec).getPropertyValue('--ev-rest')) || 0;
    if (!rest) {
      const pad = parseFloat(getComputedStyle(sec.querySelector('.dv-wrap') || sec).paddingLeft) || 20;
      rest = pad * 0.62;
    }
  };
  const apply = (p) => {
    const e = p * p * (3 - 2 * p);
    const s = 1 + (S_END - 1) * e;
    const x = e * (rest - w * s);
    gsap.set(L, { x, scaleX: s });
    gsap.set(R, { x: -x, scaleX: s });
    sec.classList.toggle('is-pre', e > 0.85);
  };
  measure();
  const st = ScrollTrigger.create({
    trigger: sec, start: 'top bottom', end: 'top 38%',
    onUpdate: (self) => apply(self.progress),
    onRefresh: (self) => { measure(); apply(self.progress); }
  });
  apply(st.progress);
}

/* ═══════════════════════ L'ENSEIGNE ═══════════════════════
   Le socle (mountPortfolio) écrit « Selected events, being prepared » dans
   un bloc `.dv-empty`. On en fait l'enseigne de la salle : le titre passe
   dans un panneau rétroéclairé, entouré d'ampoules posées ici (leur nombre
   suit la taille du cadre). Si de vrais projets sont publiés, la grille du
   socle s'affiche telle quelle et rien de ceci ne s'applique. */
function initMarquee() {
  const box = document.querySelector('#portfolio .dv-empty');
  const h = box?.querySelector('.dv-empty__h');
  if (!box || !h) return;

  const sign = document.createElement('div');
  sign.className = 'ev-marq__sign';
  const bulbs = document.createElement('div');
  bulbs.className = 'ev-marq__bulbs';
  bulbs.setAttribute('aria-hidden', 'true');
  const panel = document.createElement('div');
  panel.className = 'ev-marq__panel';
  panel.append(h);
  sign.append(bulbs, panel);
  box.prepend(sign);
  box.classList.add('ev-marq');

  // Les ampoules, à pas régulier sur le pourtour, dans le sens des aiguilles
  // d'une montre (le chenillard tourne ainsi).
  let count = -1, lastW = 0, lastH = 0;
  const layout = () => {
    const W = sign.clientWidth, H = sign.clientHeight;
    if (!W || !H || (W === lastW && H === lastH)) return;
    lastW = W; lastH = H;
    const pad = parseFloat(getComputedStyle(sign).paddingLeft) || 20;
    const inset = pad / 2;
    const step = W < 560 ? 24 : 30;
    const w = W - 2 * inset, hh = H - 2 * inset;
    const nx = Math.max(2, Math.round(w / step)), ny = Math.max(1, Math.round(hh / step));
    const pts = [];
    for (let i = 0; i < nx; i++) pts.push([inset + (w * i) / nx, inset]);
    for (let i = 0; i < ny; i++) pts.push([inset + w, inset + (hh * i) / ny]);
    for (let i = 0; i < nx; i++) pts.push([inset + w - (w * i) / nx, inset + hh]);
    for (let i = 0; i < ny; i++) pts.push([inset, inset + hh - (hh * i) / ny]);
    if (pts.length !== count) {
      count = pts.length;
      bulbs.replaceChildren(...pts.map((_, i) => {
        const b = document.createElement('i');
        b.className = 'ev-bulb';
        b.style.setProperty('--i', String(i));
        b.style.setProperty('--k', String(i % 3));
        return b;
      }));
    }
    [...bulbs.children].forEach((b, i) => { b.style.left = `${pts[i][0]}px`; b.style.top = `${pts[i][1]}px`; });
  };
  layout();
  if ('ResizeObserver' in window) {
    let raf = 0;
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); }).observe(sign);
  }
  document.fonts?.ready.then(layout);

  if (still) return;                              // allumée, immobile (CSS)
  box.classList.add('is-js');

  // Les lettres du panneau, posées une à une à l'allumage. SplitText garde
  // la phrase entière pour les lecteurs d'écran (aria-label).
  let chars = [];
  try {
    const sp = new SplitText(h, { type: 'words,chars', charsClass: 'ev-ch', aria: 'auto' });
    chars = sp.chars;
    gsap.set(chars, { autoAlpha: 0, yPercent: -40, rotationX: -80, transformOrigin: '50% 0%' });
  } catch { chars = []; }

  let lit = false, seen = false;
  const run = () => box.classList.toggle('is-run', lit && seen && !LITE);
  const lightUp = () => {
    box.classList.add('is-on');                   // les ampoules, une à une
    const wait = Math.min(900, bulbs.children.length * 14 + 150);
    window.setTimeout(() => {
      box.classList.add('is-lit');                // le panneau s'éclaire
      if (chars.length) {
        gsap.to(chars, {
          autoAlpha: 1, yPercent: 0, rotationX: 0, duration: 0.7, ease: 'back.out(2)',
          stagger: { each: 0.028 }, delay: 0.35, clearProps: 'transform,opacity,visibility'
        });
      }
    }, wait);
    window.setTimeout(() => { lit = true; run(); }, wait + 1400);
  };
  ScrollTrigger.create({ trigger: sign, start: 'top 78%', once: true, onEnter: lightUp });
  onSeen(sign, (on) => { seen = on; run(); });
}
