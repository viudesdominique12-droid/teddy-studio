/**
 * DOCUMENTARY — la projection et la planche-contact (17/10/2026).
 *
 * L'ouverture projette, plan après plan, des lieux réels de notre
 * bibliothèque : chaque plan avance lentement (push-in), un fondu chaud (la
 * lumière qui brûle entre deux plans) mène au suivant, le nom du lieu monte
 * de son cache et le sujet documentaire se tape lettre à lettre. La fenêtre
 * s'allume comme un projecteur au chargement. Tout s'arrête quand
 * l'ouverture quitte l'écran ou que l'onglet est caché ; en mouvement réduit,
 * un seul plan fixe.
 *
 * Entre les deux, le terrain (doc-field.js, 18/10/2026) : la machine à
 * écrire, l'écrit et le réel, les chemises, le carnet, la feuille de
 * production, la table de montage.
 *
 * Plus bas, la planche-contact : un défilement natif (doigt, pavé, clavier),
 * qu'on peut aussi attraper à la souris, avec son élan, et qui se pose sur
 * l'image la plus proche. Les images glissent un peu dans leur cadre ; une
 * seule est nette (la mise au point suit le survol ou l'image en cours).
 *
 * Enfin la demande (18/10/2026) : la fiche du film se compose à mesure qu'on
 * remplit le carnet, et reçoit le tampon « Filed » à la confirmation.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { initTypewriter, initCompare, initFolders, initNotes, initLog, initEdit } from './doc-field.js';

/* Le bouton d'envoi a disparu avec le formulaire : le clavier passe au titre
   de la confirmation, un instant après — pendant le fondu d'inquiry.js, un
   élément encore `visibility: hidden` refuse le focus (relecture du 18/10). */
function focusDone(box, n = 0) {
  const h = box?.querySelector('h3');
  if (!h || document.activeElement === h) return;
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
  if (document.activeElement !== h && n < 10) window.setTimeout(() => focusDone(box, n + 1), 80);
}

gsap.registerPlugin(ScrollTrigger);

/* Les plans : le lieu (nom de fichier), son nom, et un sujet tiré du brief.
   Ce sont des lieux, jamais des projets. */
const SHOTS = [
  { src: 'lalibela', place: 'Lalibela', subject: 'Cultural heritage', pos: '50% 62%' },
  { src: 'afar', place: 'Afar', subject: 'Ethiopian traditions', pos: '40% 45%' },
  { src: 'wonchi', place: 'Wonchi', subject: 'Environmental conservation', pos: '50% 55%' },
  { src: 'fasilides', place: 'Fasilides', subject: 'Historical accounts', pos: '45% 30%' },
  { src: 'wollo', place: 'Wollo', subject: 'Traditional arts and crafts', pos: '55% 72%' },
  { src: 'simien-mountains', place: 'Simien Mountains', subject: 'Natural landscapes', pos: '50% 55%' }
];

/* Quatre mouvements de caméra lents, en alternance. */
const MOVES = [
  { from: { scale: 1.05, xPercent: -1.2, yPercent: 0.8 }, to: { scale: 1.17, xPercent: 1.2, yPercent: -0.8 } },
  { from: { scale: 1.16, xPercent: 1.4, yPercent: -0.6 }, to: { scale: 1.05, xPercent: -0.8, yPercent: 0.6 } },
  { from: { scale: 1.06, xPercent: 0.8, yPercent: 1 }, to: { scale: 1.18, xPercent: -1.2, yPercent: -0.4 } },
  { from: { scale: 1.06, xPercent: -1, yPercent: -0.8 }, to: { scale: 1.16, xPercent: 0.6, yPercent: 1 } }
];
const HOLD = 6.4;       // secondes à l'écran par plan
const DISSOLVE = 1.5;   // durée du fondu

const pad = (n) => String(n).padStart(2, '0');

// Les chemins écrits ici ne passent pas par scripts/rebase.mjs (gabarits) :
// ils prennent la base du site eux-mêmes (/teddy-studio/ sur GitHub Pages).
const BASE = import.meta.env.BASE_URL;

function shotImg(s) {
  const img = new Image();
  img.alt = ''; img.decoding = 'async';
  img.width = 1200; img.height = 800;
  img.sizes = '(max-width: 60rem) 100vw, 52vw';
  img.srcset = `${BASE}loc/${s.src}-640.webp 640w, ${BASE}loc/${s.src}-1200.webp 1200w, ${BASE}loc/${s.src}-1920.webp 1920w`;
  img.src = `${BASE}loc/${s.src}-1200.webp`;
  img.style.objectPosition = s.pos;
  return img;
}

function initProjection() {
  const frame = document.querySelector('[data-frame]');
  if (!frame) return;
  const hero = frame.closest('.dv-hero');
  const gate = frame.querySelector('[data-gate]');
  const layers = [...frame.querySelectorAll('[data-shot]')];
  const leak = frame.querySelector('[data-leak]');
  const count = frame.querySelector('[data-count]');
  const total = frame.querySelector('[data-total]');
  const place = frame.querySelector('[data-place]');
  const subject = frame.querySelector('[data-subject]');
  const l3 = frame.querySelector('.dc-l3');
  if (total) total.textContent = pad(SHOTS.length);

  const first = layers[0].querySelector('img');
  if (first) first.style.objectPosition = SHOTS[0].pos;
  if (reduced()) return;   // un seul plan, fixe

  /* Les tweens vivants, pour tout suspendre d'un coup. */
  const live = new Set();
  const track = (t) => { live.add(t); t.then(() => live.delete(t)); return t; };
  const kill = (t) => { if (t) { t.kill(); live.delete(t); } };

  /* Le projecteur s'allume : deux battements de lampe, puis la lumière. */
  gsap.set(gate, { autoAlpha: 0, scale: 1.025 });
  track(gsap.to(gate, { keyframes: { autoAlpha: [0, 0.75, 0.3, 0.95, 0.7, 1], easeEach: 'power1.inOut' }, duration: 1.1, delay: 0.2 }));
  track(gsap.to(gate, { scale: 1, duration: 1.6, ease: 'expo.out', delay: 0.2, clearProps: 'transform' }));

  // Les images d'avance : chacune décodée avant sa coupe. Le premier plan
  // reprend l'image de la page (déjà là, à sa taille d'écran) au lieu d'en
  // demander une autre au retour de la boucle.
  const cache = new Map();
  if (first) cache.set(0, first);
  const get = (k) => {
    if (!cache.has(k)) {
      const img = shotImg(SHOTS[k]);
      img.decode?.().catch(() => {});
      cache.set(k, img);
    }
    return cache.get(k);
  };

  const push = [null, null];   // le push-in en cours sur chaque calque
  const pushIn = (slot, img, k) => {
    kill(push[slot]);
    const m = MOVES[k % MOVES.length];
    push[slot] = track(gsap.fromTo(img, m.from, { ...m.to, duration: HOLD + DISSOLVE + 0.6, ease: 'none' }));
  };
  pushIn(0, first, 0);

  /* Le sujet s'efface, puis se tape lettre à lettre. */
  let typing = null;
  const type = (text, wait = 0.55) => {
    kill(typing);
    const from = subject.textContent;
    const st = { n: from.length };
    l3?.classList.add('is-typing');
    typing = track(gsap.timeline({ onComplete: () => l3?.classList.remove('is-typing') })
      .to(st, { n: 0, duration: Math.min(0.45, from.length * 0.018), ease: 'none', onUpdate: () => { subject.textContent = from.slice(0, Math.round(st.n)); } })
      .to(st, { n: text.length, duration: text.length * 0.048, ease: 'none', onUpdate: () => { subject.textContent = text.slice(0, Math.round(st.n)); } }, `+=${wait}`));
  };
  subject.textContent = '';
  type(SHOTS[0].subject, 1.1);

  /* Le nom du lieu monte de son cache. */
  const caption = (s, k) => {
    if (count) count.textContent = pad(k + 1);
    track(gsap.to(place, {
      yPercent: -110, duration: 0.45, ease: 'power3.in',
      onComplete: () => {
        place.textContent = s.place;
        track(gsap.fromTo(place, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' }));
      }
    }));
    type(s.subject);
  };

  let k = 0;
  let slot = 0;
  const cut = () => {
    k = (k + 1) % SHOTS.length;
    const out = layers[slot];
    slot ^= 1;
    const inc = layers[slot];
    const img = get(k);
    inc.replaceChildren(img);
    gsap.set(inc, { zIndex: 2, autoAlpha: 0 });
    gsap.set(out, { zIndex: 1 });
    pushIn(slot, img, k);
    const was = slot ^ 1;
    track(gsap.to(inc, {
      autoAlpha: 1, duration: DISSOLVE, ease: 'power2.inOut',
      onComplete: () => { kill(push[was]); push[was] = null; out.replaceChildren(); gsap.set(out, { autoAlpha: 0 }); }
    }));
    if (leak) {
      track(gsap.timeline()
        .fromTo(leak, { autoAlpha: 0, xPercent: -18 }, { autoAlpha: LITE ? 0.45 : 0.85, xPercent: -4, duration: 0.6, ease: 'power2.out' })
        .to(leak, { autoAlpha: 0, xPercent: 12, duration: 1.2, ease: 'power2.in' }));
    }
    caption(SHOTS[k], k);
    get((k + 1) % SHOTS.length);   // le plan suivant se prépare
    next = track(gsap.delayedCall(HOLD, cut));
  };
  let next = track(gsap.delayedCall(HOLD, cut));
  window.setTimeout(() => get(1), 1800);

  /* N'animer que ce qui se voit. */
  let onScreen = true;
  const sync = () => {
    const run = onScreen && !document.hidden;
    hero.classList.toggle('is-off', !run);
    live.forEach((t) => (run ? t.resume() : t.pause()));
  };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(hero);
  document.addEventListener('visibilitychange', sync);

  // En quittant l'écran, la fenêtre s'éloigne à peine (le titre, lui, reste).
  if (!LITE) {
    gsap.to(frame, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }
}

/* ─────────────── La planche-contact ─────────────── */
function initReel() {
  const reel = document.querySelector('[data-reel]');
  if (!reel) return;
  const sec = reel.closest('section');
  const trackEl = reel.querySelector('[data-reel-track]');
  const film = reel.querySelector('.dc-reel__film');
  const frames = [...trackEl.querySelectorAll('.dc-fr')];
  const imgs = frames.map((f) => f.querySelector('img'));
  const nEl = sec.querySelector('[data-reel-n]');
  const pEl = sec.querySelector('[data-reel-p]');
  const prev = sec.querySelector('[data-reel-prev]');
  const next = sec.querySelector('[data-reel-next]');
  const still = reduced();
  const parallax = !still && !LITE;

  /* La mise au point : une image nette (le survol, sinon l'image en cours),
     les autres douces. */
  const focusEl = sec.querySelector('[data-reel-focus]');
  const names = frames.map((f) => f.querySelector('.dc-fr__cap b')?.textContent.trim() || '');
  let focusK = -1;
  let hoverK = -1;
  if (!still) reel.classList.add('is-armed');
  const focus = (k) => {
    if (k === focusK || k < 0) return;
    frames[focusK]?.classList.remove('is-focus');
    focusK = k;
    frames[k].classList.add('is-focus');
    if (focusEl) focusEl.textContent = names[k];
  };

  const max = () => Math.max(0, trackEl.scrollWidth - trackEl.clientWidth);
  // Où se pose chaque image (la première est un peu plus large : sa marge).
  const stops = () => frames.map((f) => Math.min(max(), f.offsetLeft - frames[0].offsetLeft));
  const nearest = (x) => {
    const s = stops();
    let k = 0;
    s.forEach((p, i) => { if (Math.abs(p - x) < Math.abs(s[k] - x)) k = i; });
    return k;
  };
  const index = () => nearest(trackEl.scrollLeft);

  const paint = () => {
    const m = max();
    const x = trackEl.scrollLeft;
    const atEnd = x >= m - 2;
    const k = atEnd ? frames.length - 1 : index();
    if (nEl) nEl.textContent = pad(k + 1);
    focus(hoverK >= 0 ? hoverK : k);
    if (pEl) pEl.style.transform = `scaleX(${(0.08 + 0.92 * (m ? x / m : 1)).toFixed(4)})`;
    if (prev) prev.disabled = x <= 2;
    if (next) next.disabled = atEnd;
    if (parallax) {
      const W = window.innerWidth;
      frames.forEach((f, i) => {
        const r = f.getBoundingClientRect();
        if (r.right < -50 || r.left > W + 50) return;
        const c = (r.left + r.width / 2) / W - 0.5;
        imgs[i].style.transform = `translate3d(${(-c * 7).toFixed(2)}%,0,0)`;
      });
    }
  };
  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); }); };
  trackEl.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  paint();

  /* Glisser jusqu'à une position, l'aimantation coupée le temps du geste. */
  const glide = (x, dur = 0.9) => {
    const to = Math.max(0, Math.min(max(), x));
    if (still) { trackEl.scrollLeft = to; return; }
    trackEl.classList.add('is-gliding');
    gsap.to(trackEl, {
      scrollLeft: to, duration: dur, ease: 'power3.out', overwrite: true,
      onComplete: () => trackEl.classList.remove('is-gliding')
    });
  };
  const go = (dir) => {
    const k = Math.max(0, Math.min(frames.length - 1, index() + dir));
    glide(stops()[k]);
  };
  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));
  trackEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); glide(0); }
    else if (e.key === 'End') { e.preventDefault(); glide(max()); }
  });

  // Au survol, la mise au point suit la souris (pas pendant qu'on tire).
  frames.forEach((f, i) => f.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || drag) return;
    hoverK = i;
    focus(i);
  }));
  trackEl.addEventListener('pointerleave', () => { hoverK = -1; schedule(); });

  /* À la souris : on attrape la bande ; elle garde son élan, puis se pose
     sur l'image la plus proche. Le doigt et le pavé gardent le natif. */
  let drag = null;
  trackEl.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    gsap.killTweensOf(trackEl);
    hoverK = -1;
    drag = { x: e.clientX, s: trackEl.scrollLeft, v: 0, lx: e.clientX, lt: performance.now() };
    trackEl.classList.add('is-drag', 'is-gliding');
    trackEl.setPointerCapture?.(e.pointerId);
  });
  trackEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    trackEl.scrollLeft = drag.s - (e.clientX - drag.x);
    const now = performance.now();
    const dt = now - drag.lt;
    if (dt > 0) {
      drag.v = 0.75 * ((e.clientX - drag.lx) / dt) + 0.25 * drag.v;
      drag.lx = e.clientX; drag.lt = now;
    }
  });
  const end = () => {
    if (!drag) return;
    const v = performance.now() - drag.lt > 90 ? 0 : drag.v;   // une main arrêtée ne lance rien
    drag = null;
    trackEl.classList.remove('is-drag');
    glide(stops()[nearest(trackEl.scrollLeft - v * 340)], 1.1);
  };
  trackEl.addEventListener('pointerup', end);
  trackEl.addEventListener('pointercancel', end);
  trackEl.addEventListener('lostpointercapture', end);

  /* La bande entre en glissant quand la section arrive. */
  if (!still) {
    gsap.set(film, { x: 90, autoAlpha: 0 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(film, { x: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity,visibility' });
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(trackEl);
  }
}

/* ─────────────── La fiche du film ───────────────
   Elle se compose à mesure qu'on remplit le carnet : « A cultural and
   historical documentary about…, for…, filmed in… », puis le format, l'usage,
   le calendrier, l'archive, les besoins et qui écrit. La place du champ en
   cours porte le curseur ; une place qui vient d'être écrite s'encre un
   instant. inquiry.js reste seul maître du formulaire : on ne fait qu'écouter
   (saisie, changement, clic d'une carte « Ask about this », envoi). */
const TYPE_PHRASE = {
  corporate: 'corporate', social: 'social and development', cultural: 'cultural and historical',
  environmental: 'environmental', biographical: 'biographical', institutional: 'event and institutional', other: ''
};
/* Le champ → sa place sur la fiche. */
const SLOT_OF = {
  type: 'type', subject: 'subject', audience: 'audience', locations: 'where',
  length: 'format', use: 'use', timeline: 'when', archive: 'archive', requirements: 'needs',
  name: 'from', organization: 'from'
};

function initStoryCard() {
  const form = document.querySelector('form[data-inquiry="doc"]');
  const card = form?.querySelector('[data-card]');
  if (!form || !card) return;
  const still = reduced();
  const slots = {};
  card.querySelectorAll('[data-slot]').forEach((el) => { slots[el.dataset.slot] = el; });
  const art = card.querySelector('[data-card-art]');
  const nEl = card.querySelector('[data-card-n]');
  const ofEl = card.querySelector('[data-card-of]');
  const stamp = card.querySelector('[data-stamp]');
  const dateEl = card.querySelector('[data-stamp-date]');
  if (ofEl) ofEl.textContent = pad(Object.keys(slots).length);

  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
  // `namedItem`, pas `elements[name]` : `elements.length` est le nombre de
  // champs, pas la liste « Length or format ».
  const field = (name) => form.elements.namedItem(name);
  const val = (name) => clean(field(name)?.value);
  const opt = (name) => {
    const s = field(name);
    return s && s.value ? clean(s.selectedOptions[0]?.textContent) : '';
  };
  const picked = (name) => [...form.querySelectorAll(`[name="${name}"]:checked`)]
    .map((i) => clean(i.closest('label')?.textContent)).filter(Boolean);

  const compose = () => {
    const t = val('type');
    return {
      type: t ? (TYPE_PHRASE[t] ?? '') : '',
      subject: clip(val('subject'), 110),
      audience: clip(val('audience'), 60),
      where: clip(val('locations'), 60),
      format: opt('length'),
      use: picked('use').join(' · '),
      when: clip(val('timeline'), 60),
      archive: picked('archive')[0] || '',
      needs: clip(val('requirements'), 70),
      from: clip([val('name'), val('organization')].filter(Boolean).join(', '), 60)
    };
  };

  let last = {};
  const paint = (flash = true) => {
    const c = compose();
    const t = val('type');
    // « Something else, or not sure yet » : la phrase reste « A documentary ».
    slots.type.hidden = t === 'other';
    const lead = t === 'other' ? '' : c.type;
    art.textContent = /^[aeiou]/i.test(lead) ? 'An' : 'A';
    let filled = 0;
    for (const [k, el] of Object.entries(slots)) {
      const v = c[k];
      if (v || (k === 'type' && t === 'other')) filled += 1;
      if (el.textContent === v) continue;
      el.textContent = v;
      if (flash && v && !still && last[k] !== undefined) {
        el.classList.remove('is-inked');
        void el.offsetWidth;            // relancer l'encre
        el.classList.add('is-inked');
      }
    }
    if (nEl) nEl.textContent = pad(filled);
    last = c;
  };

  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); }); };
  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  // Une carte « Ask about this » oriente la liste sans événement : on relit
  // après elle (inquiry.js l'écoute en capture, nous en bulle).
  document.addEventListener('click', (e) => { if (e.target.closest?.('a[href*="?"]')) schedule(); });
  paint(false);
  // Le préremplissage par l'adresse est déjà fait : la fiche part écrite, sans encre.
  last = compose();

  /* Le champ en cours : sa place porte le curseur. */
  const live = (name, on) => {
    const el = slots[SLOT_OF[name]];
    if (el) el.classList.toggle('is-live', on);
  };
  form.addEventListener('focusin', (e) => { if (e.target.name) live(e.target.name, true); });
  form.addEventListener('focusout', (e) => { if (e.target.name) live(e.target.name, false); });

  /* La fiche arrive sur le bureau quand la demande entre à l'écran. */
  if (!still) {
    gsap.set(card, { y: 36, rotation: LITE ? 0 : 1.6, autoAlpha: 0 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(card, { y: 0, rotation: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', delay: 0.15, clearProps: 'transform,opacity,visibility' });
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(card);
  }

  /* L'envoi : la fiche passe dans la confirmation, à la même place, et
     reçoit le tampon. (inquiry.js a déjà montré la confirmation.) */
  window.addEventListener('inquiry:sent', (e) => {
    if (e.detail?.division !== 'doc') return;
    const box = form.parentElement.querySelector('[data-inquiry-done]');
    const slot = box?.querySelector('[data-card-slot]');
    if (!slot) return;
    paint(false);
    card.querySelectorAll('.is-live').forEach((el) => el.classList.remove('is-live'));
    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .format(new Date()).toUpperCase();
    }
    gsap.killTweensOf(card);
    gsap.set(card, { clearProps: 'transform,opacity,visibility' });
    slot.append(card);
    card.classList.add('is-filed');
    window.setTimeout(() => focusDone(box), 60);
    if (still || !stamp) return;
    // Le coup de tampon : il tombe, la fiche encaisse, l'encre se pose.
    gsap.timeline({ delay: 0.55 })
      .fromTo(stamp, { autoAlpha: 0, scale: 2.1, rotation: -2 },
        { autoAlpha: 0.92, scale: 1, rotation: -9, duration: 0.3, ease: 'power4.in' })
      .to(card, { keyframes: { y: [0, 3, -1, 0], rotation: [0, -0.25, 0.1, 0] }, duration: 0.32, ease: 'none' })
      .fromTo(stamp, { filter: 'blur(0.6px)' }, { filter: 'blur(0px)', duration: 0.4, clearProps: 'filter' }, '<');
  });
}

bootDivision();
initProjection();
initTypewriter();
initCompare();
initFolders();
initNotes();
initLog();
initReel();
initEdit();
initStoryCard();
