/**
 * DOCUMENTARY — le terrain (18/10/2026).
 *
 * Entre l'ouverture et la demande, chaque section vit le métier :
 *   initTypewriter  la phrase « documentaire ou fiction » se tape à la machine ;
 *   initCompare     le même lieu filmé deux fois (l'écrit, le réel), qu'on
 *                   compare en tirant la séparation ;
 *   initFolders     les six familles en chemises : le tirage sort au survol,
 *                   ou au milieu de l'écran sur téléphone ;
 *   initNotes       les quatre exigences sur des pages de carnet, tamponnées ;
 *   initLog         les seize services sur une feuille de production, cochés
 *                   au tampon à mesure qu'on descend ;
 *   initEdit        le portfolio vide devient une table de montage.
 * Tout ce qui boucle s'arrête hors de l'écran ou onglet caché ; en mouvement
 * réduit, tout est posé d'emblée.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

const pad = (n) => String(n).padStart(2, '0');
/** Un timecode à 25 images/s : hh:mm:ss:ff. */
const timecode = (sec) => {
  const f = Math.max(0, Math.floor(sec * 25));
  const s = Math.floor(f / 25);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % 25)}`;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ─────────────── La machine à écrire ───────────────
   Les lettres sont posées dès le départ (invisibles) : les lignes ne bougent
   pas pendant la frappe. Une copie du texte reste pour les lecteurs d'écran ;
   la version découpée lettre à lettre leur est cachée. La frappe a son
   rythme : un temps de plus après une virgule. */
export function initTypewriter() {
  const q = document.querySelector('[data-type]');
  if (!q || reduced()) return;

  const sr = document.createElement('span');
  sr.className = 'u-sr';
  sr.innerHTML = q.innerHTML;
  const vis = document.createElement('span');
  vis.setAttribute('aria-hidden', 'true');
  vis.innerHTML = q.innerHTML;

  const chars = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'dc-wd';
          for (const c of part) {
            const s = document.createElement('span');
            s.className = 'dc-ch';
            s.textContent = c;
            w.append(s);
            chars.push(s);
          }
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(vis);
  if (!chars.length) return;
  q.replaceChildren(sr, vis);
  q.classList.add('is-armed');

  // L'horaire de chaque lettre.
  const at = [];
  let t = 0;
  chars.forEach((c, i) => {
    t += 0.0085 + Math.random() * 0.006;
    if (i && /[,.]/.test(chars[i - 1].textContent)) t += 0.16;
    at.push(t);
  });

  let i = 0, cur = null, clock = 0, last = 0;
  const step = (now) => {
    clock += Math.min(0.05, last ? (now - last) / 1000 : 0);   // un onglet caché ne fait pas tout taper d'un coup
    last = now;
    let moved = false;
    while (i < chars.length && at[i] <= clock) { chars[i].classList.add('is-on'); i += 1; moved = true; }
    if (moved) {
      cur?.classList.remove('is-cur');
      cur = chars[i - 1];
      cur.classList.add('is-cur');
    }
    if (i < chars.length) requestAnimationFrame(step);
    else q.classList.add('is-done');
  };
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    requestAnimationFrame(step);
  }, { rootMargin: '0px 0px -18% 0px' });
  io.observe(q);
}

/* ─────────────── L'écrit et le réel ───────────────
   `--x` (0 → 100) : la part du plan « écrit ». Souris : on attrape la
   séparation ou on clique où l'on veut. Doigt : un glissé horizontal la
   déplace (le vertical reste au défilement), un appui l'y envoie. Clavier :
   la poignée est un curseur (flèches, Page, Début, Fin). */
export function initCompare() {
  const fig = document.querySelector('[data-cmp]');
  if (!fig) return;
  const view = fig.querySelector('.dc-cmp__view');
  const knob = fig.querySelector('[data-cmp-knob]');
  const tcEl = fig.querySelector('[data-cmp-tc]');
  const still = reduced();
  const st = { x: 50 };

  const say = (x) => {
    const s = Math.round(x);
    if (s <= 3) return 'Real frame only';
    if (s >= 97) return 'Scripted frame only';
    return `${s}% scripted, ${100 - s}% real`;
  };
  const set = (x) => {
    st.x = clamp(x, 0, 100);
    fig.style.setProperty('--x', st.x.toFixed(2));
    knob.setAttribute('aria-valuenow', String(Math.round(st.x)));
    knob.setAttribute('aria-valuetext', say(st.x));
  };
  // `goal` : où la séparation va (les touches s'additionnent même pendant
  // qu'elle glisse encore).
  let goal = st.x;
  const glide = (x, duration = 0.55, ease = 'power3.out') => {
    goal = clamp(x, 0, 100);
    if (still) { set(goal); return; }
    gsap.to(st, { x: goal, duration, ease, overwrite: true, onUpdate: () => set(st.x) });
  };
  const xAt = (e) => {
    const r = view.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };

  let drag = null;
  view.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const touch = e.pointerType !== 'mouse';
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, touch, moved: false };
    if (!touch) {
      e.preventDefault();
      view.setPointerCapture?.(e.pointerId);
      fig.classList.add('is-drag');
      if (!knob.contains(e.target)) glide(xAt(e), 0.35);
      else gsap.killTweensOf(st);
      knob.focus({ preventScroll: true });
    }
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.touch && !drag.moved) {
      const dx = Math.abs(e.clientX - drag.x0);
      const dy = Math.abs(e.clientY - drag.y0);
      if (dx > 6 && dx > dy) { drag.moved = true; fig.classList.add('is-drag'); gsap.killTweensOf(st); }
      else if (dy > 8) { drag = null; return; }
      else return;
    }
    gsap.killTweensOf(st);
    set(xAt(e));
    goal = st.x;
  });
  const end = (e) => {
    if (!drag) return;
    if (drag.touch && !drag.moved && e.type === 'pointerup') glide(xAt(e));
    drag = null;
    fig.classList.remove('is-drag');
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
  view.addEventListener('lostpointercapture', end);

  knob.addEventListener('keydown', (e) => {
    const by = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 }[e.key];
    if (by) { e.preventDefault(); glide(goal + by, 0.3); }
    else if (e.key === 'Home') { e.preventDefault(); glide(0, 0.4); }
    else if (e.key === 'End') { e.preventDefault(); glide(100, 0.4); }
  });

  set(still ? 50 : 84);
  goal = st.x;

  // Le timecode du réel tourne, et le voyant REC clignote, tant qu'on le voit.
  let frames = 0;
  let timer = 0;
  let onScreen = false;
  let intro = !still;
  const sync = () => {
    const run = onScreen && !document.hidden;
    fig.classList.toggle('is-off', !run);
    if (run && !timer && !still && tcEl) {
      timer = window.setInterval(() => { frames += 2; tcEl.textContent = timecode(252 + frames / 25); }, 80);
    } else if (!run && timer) { window.clearInterval(timer); timer = 0; }
  };
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    // À l'arrivée, la séparation glisse jusqu'au milieu : on comprend qu'elle bouge.
    if (onScreen && intro && e.intersectionRatio > 0.35) { intro = false; glide(50, 1.5, 'expo.inOut'); }
    sync();
  }, { threshold: [0, 0.35, 0.6] }).observe(view);
  document.addEventListener('visibilitychange', sync);
}

/* ─────────────── Les chemises ───────────────
   Elles arrivent sur la table l'une après l'autre. Au doigt, il n'y a pas de
   survol : le tirage sort quand la chemise passe au milieu de l'écran. */
export function initFolders() {
  const box = document.querySelector('[data-files]');
  if (!box) return;
  const folds = [...box.querySelectorAll('[data-fold]')];
  if (reduced()) return;

  gsap.set(folds, { y: 48, autoAlpha: 0 });
  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, i) => {
      io.unobserve(e.target);
      gsap.to(e.target, { y: 0, autoAlpha: 1, duration: 0.95, ease: 'power3.out', delay: i * 0.09, clearProps: 'transform,opacity,visibility' });
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  folds.forEach((f) => io.observe(f));

  if (LITE || !matchMedia('(hover: hover)').matches) {
    const mid = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-up', e.isIntersecting));
    }, { rootMargin: '-38% 0px -38% 0px' });
    folds.forEach((f) => mid.observe(f));
  }
}

/* ─────────────── Le carnet ───────────────
   Les pages arrivent l'une après l'autre, puis chacune reçoit son tampon :
   il tombe, la page encaisse. Une fois, à l'entrée. */
export function initNotes() {
  const list = document.querySelector('[data-notes]');
  if (!list || reduced()) return;
  const notes = [...list.children];
  list.classList.add('is-armed');
  gsap.set(notes, { y: 70, autoAlpha: 0, rotation: (i) => (i % 2 ? 2.5 : -2.5) });
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const tl = gsap.timeline();
    tl.to(notes, { y: 0, rotation: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, clearProps: 'transform,opacity,visibility' });
    notes.forEach((n, i) => {
      const stamp = n.querySelector('.dc-note__stamp');
      if (!stamp) return;
      const t0 = 0.75 + i * 0.2;
      tl.fromTo(stamp, { autoAlpha: 0, scale: 2, rotation: -1 },
        { autoAlpha: 0.92, scale: 1, rotation: -8, duration: 0.24, ease: 'power4.in' }, t0);
      tl.to(n, { keyframes: { y: [0, 2.5, 0] }, duration: 0.2, ease: 'none', clearProps: 'transform' }, t0 + 0.24);
    });
  }, { rootMargin: '0px 0px -16% 0px' });
  io.observe(list);
}

/* ─────────────── La feuille de production ───────────────
   Chaque ligne reçoit sa coche quand elle passe aux deux tiers de l'écran ;
   les coches tombent l'une après l'autre, jamais toutes d'un bloc. */
export function initLog() {
  const log = document.querySelector('[data-log]');
  if (!log || reduced()) return;
  const rows = [...log.querySelectorAll('.dc-log__row')];
  log.classList.add('is-armed');
  const queue = [];
  let busy = false;
  const pump = () => {
    if (busy) return;
    const r = queue.shift();
    if (!r) return;
    busy = true;
    r.classList.add('is-ticked');
    window.setTimeout(() => { busy = false; pump(); }, 85);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      queue.push(e.target);
    });
    queue.sort((a, b) => rows.indexOf(a) - rows.indexOf(b));
    pump();
  }, { rootMargin: '0px 0px -30% 0px' });
  rows.forEach((r) => io.observe(r));
}

/* ─────────────── La table de montage ───────────────
   Seulement quand le portfolio est vide (l'état « en préparation » de
   division.js) : le message passe sur le moniteur, la timeline garde des
   emplacements hachurés — aucun titre, aucun faux projet. La tête de
   lecture suit le défilement ; à la souris, elle suit la main. */
const LANES = [
  { k: 'V2', t: 'v', clips: [[17, 11], [55, 13]] },
  { k: 'V1', t: 'v', clips: [[0, 21], [22, 16], [39, 19], [59, 15], [75, 25]] },
  { k: 'A1', t: 'a', clips: [[0, 38], [39, 35], [75, 25]] },
  { k: 'A2', t: 'a', clips: [[5, 31], [43, 47]] }
];
const SPAN = 96;   // la durée affichée de la séquence, en secondes (un décor)

export function initEdit() {
  const empty = document.querySelector('#portfolio .dv-empty');
  if (!empty) return;
  const text = empty.firstElementChild;
  const btn = empty.querySelector('.dv-btn');
  const still = reduced();

  empty.classList.add('dc-edit', 'dv-night');
  const top = document.createElement('div');
  top.className = 'dc-edit__top';
  top.setAttribute('aria-hidden', 'true');
  top.innerHTML = '<span>Sequence · Documentaries</span><span class="dc-edit__state"><i></i>In the edit</span>';

  const mon = document.createElement('div');
  mon.className = 'dc-edit__mon';
  mon.innerHTML = '<span class="dc-edit__lbl" aria-hidden="true">Program</span><span class="dc-edit__tc" aria-hidden="true" data-edit-tc>00:00:00:00</span>';
  if (text) mon.append(text);
  if (btn) mon.append(btn);

  const tl = document.createElement('div');
  tl.className = 'dc-edit__tl';
  tl.setAttribute('aria-hidden', 'true');
  let n = 0;
  const ruler = [0, 25, 50, 75].map((p) => `<span style="left:${p}%">${timecode((p / 100) * SPAN).slice(0, 8)}</span>`).join('');
  tl.innerHTML = `<div class="dc-edit__labels"><span></span>${LANES.map((l) => `<b>${l.k}</b>`).join('')}</div>
    <div class="dc-edit__area"><div class="dc-edit__ruler">${ruler}</div>${LANES.map((l) => `<div class="dc-edit__lane dc-edit__lane--${l.t}">${
      l.clips.map(([a, w]) => `<i style="--l:${a};--w:${w};--i:${n++}" data-a="${a}" data-w="${w}"></i>`).join('')}</div>`).join('')}<span class="dc-edit__head"></span></div>`;

  empty.replaceChildren(top, mon, tl);

  const tcEl = mon.querySelector('[data-edit-tc]');
  const area = tl.querySelector('.dc-edit__area');
  const clips = [...tl.querySelectorAll('.dc-edit__lane i')];
  const st = { ph: still ? 38 : 6 };
  let hitKey = '';
  const render = () => {
    empty.style.setProperty('--ph', st.ph.toFixed(2));
    if (tcEl) tcEl.textContent = timecode((st.ph / 100) * SPAN);
    let key = '';
    clips.forEach((c, i) => {
      const a = +c.dataset.a, w = +c.dataset.w;
      if (st.ph >= a && st.ph <= a + w) key += `${i},`;
    });
    if (key !== hitKey) {
      hitKey = key;
      const on = new Set(key.split(',').filter(Boolean).map(Number));
      clips.forEach((c, i) => c.classList.toggle('is-hit', on.has(i)));
    }
  };
  render();
  if (still) { tl.classList.add('is-in'); return; }

  empty.classList.add('is-armed');
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    tl.classList.add('is-in');
  }, { rootMargin: '0px 0px -12% 0px' }).observe(tl);

  const to = gsap.quickTo(st, 'ph', { duration: 0.6, ease: 'power3', onUpdate: render });
  let fromScroll = st.ph;
  let hovering = false;
  ScrollTrigger.create({
    trigger: empty, start: 'top 85%', end: 'bottom 30%',
    onUpdate: (self) => {
      fromScroll = 6 + 88 * self.progress;
      if (!hovering) to(fromScroll);
    }
  });
  if (!LITE) {
    area.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovering = true;
      const r = area.getBoundingClientRect();
      to(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100));
    });
    area.addEventListener('pointerleave', () => { hovering = false; to(fromScroll); });
  }
}
