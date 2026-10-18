/**
 * LIVE STREAMING — la régie de l'ouverture (17/10/2026).
 *
 * Cinq caméras et un programme. Toutes les 2,6 s la régie coupe sur la
 * caméra suivante : un éclair blanc, le témoin rouge (à l'antenne) passe sur
 * elle, le vert (prête) sur la suivante. Le timecode court à l'heure d'Addis,
 * en images (25 i/s) ; les vumètres respirent. Le mur suit à peine la souris.
 *
 * Tout s'arrête quand l'ouverture quitte l'écran. Sur téléphone, en économie
 * de données ou en mouvement réduit : des images fixes, le programme seul en
 * vidéo (ou fixe), et aucune boucle.
 *
 * LE PUPITRE DE LA DEMANDE (18/10/2026) — `initDesk()`, plus bas. Le
 * formulaire reste celui d'inquiry.js (on ne fait qu'écouter ses événements).
 *
 * LES SECTIONS DU MILIEU (18/10/2026) — `live-sections.js` : le multiviewer
 * des familles d'événements, le synthé qui défile, le mélangeur des moyens,
 * le chemin du signal vers les plateformes, la conduite du processus et la
 * mire « No signal » du portfolio vide.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { addisTime } from '../clock.js';
import { initMultiviewer, initTicker, initSwitcher, initFlow, initRundown, initTestCard } from './live-sections.js';

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

bootDivision();
initWall();
initMultiviewer();
initTicker();
initSwitcher();
initFlow();
initRundown();
initTestCard();
initDesk();
remeasure();

/* Une police qui arrive après le chargement (Instrument Serif en Papier)
   raccourcit la page de 150 px environ, après que les déclencheurs du
   défilement ont été mesurés : les révélations des plateformes ne partaient
   plus. On remesure quand la hauteur du contenu change. */
function remeasure() {
  const main = document.getElementById('main');
  if (!main || !('ResizeObserver' in window)) return;
  let h = 0;
  let t = 0;
  new ResizeObserver(([e]) => {
    const nh = Math.round(e.contentRect.height);
    if (!h) { h = nh; return; }
    if (Math.abs(nh - h) < 2) return;
    h = nh;
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 160);
  }).observe(main);
}

function video(src) {
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
  v.src = `${src}.mp4`;
  return v;
}

function initWall() {
  const wall = document.querySelector('[data-wall]');
  if (!wall) return;
  const hero = wall.closest('.dv-hero');
  const cams = [...wall.querySelectorAll('.lv-cam')];
  const layers = [...wall.querySelectorAll('[data-layer]')];
  const flash = wall.querySelector('[data-flash]');
  const tc = wall.querySelector('[data-tc]');
  const meters = [...wall.querySelectorAll('[data-meter]')];
  const still = reduced();
  const lite = LITE || navigator.connection?.saveData;
  const motion = !still;

  // Les caméras : une image tout de suite, la vidéo sur ordinateur.
  for (const c of cams) {
    const img = new Image();
    img.src = `${c.dataset.src}.jpg`; img.alt = ''; img.decoding = 'async';
    c.prepend(img);
    if (!lite && motion) {
      const v = video(c.dataset.src);
      v.addEventListener('playing', () => { img.style.opacity = '0'; }, { once: true });
      c.prepend(v);
    }
  }

  /* La coupe. Sur ordinateur, le programme repart en vidéo à chaque coupe.
     Sur téléphone (ou en économie de données), il passe à l'image fixe de la
     caméra suivante, déjà chargée par sa vignette : l'éclair et les témoins
     restent, sans une nouvelle vidéo toutes les 2,6 s (F13, 18/10/2026). */
  let flip = 0;
  let k = 0;
  const cut = (n) => {
    const cam = cams[n];
    flip ^= 1;
    const layer = layers[flip];
    layer.replaceChildren();
    const img = new Image(); img.src = `${cam.dataset.src}.jpg`; img.alt = '';
    layer.append(img);
    if (motion && !lite) {
      const v = video(cam.dataset.src);
      layer.append(v);
      v.play().catch(() => {});
    }
    layers.forEach((l) => l.classList.toggle('is-on', l === layer));
    // L'ancienne couche, désormais cachée, se vide : une seule vidéo du
    // programme décodée à la fois (comme sur la page Services).
    const other = layers[flip ^ 1];
    window.setTimeout(() => { if (!other.classList.contains('is-on')) other.replaceChildren(); }, 400);
    cams.forEach((c, j) => {
      c.classList.toggle('is-pgm', j === n);
      c.classList.toggle('is-pvw', j === (n + 1) % cams.length);
    });
    if (motion) gsap.fromTo(flash, { opacity: 0.5 }, { opacity: 0, duration: 0.32, ease: 'power2.out' });
  };
  cut(0);
  if (!motion) return;

  // N'animer que ce qui se voit.
  let on = true;
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
    wall.querySelectorAll('video').forEach((v) => (on ? v.play().catch(() => {}) : v.pause()));
    tc?.classList.toggle('is-paused', !on);
  }).observe(hero);

  window.setInterval(() => { if (on && !document.hidden) { k = (k + 1) % cams.length; cut(k); } }, 2600);

  /* Le timecode (heure d'Addis, en images) et les vumètres (F14, 18/10/2026).
     Les images (00 → 24) sont une bande de chiffres que le compositeur fait
     défiler en CSS (`.lv-tc__ff`, 25 pas par seconde) : plus d'écriture ni de
     repeinte à chaque trame. Le script n'écrit l'heure qu'au changement de
     seconde. Les vumètres : une barre mise à l'échelle (`scaleY`), sa
     couleur contre-étirée pour garder le dégradé fixe — le même rendu que
     l'ancien `clip-path`, sans repeindre. Sur téléphone, une trame sur deux. */
  let sec = -1;
  let tcS = null;
  if (tc) {
    tc.textContent = '';
    tcS = document.createElement('span');
    tcS.textContent = addisTime(true);
    const ff = document.createElement('span');
    ff.className = 'lv-tc__ff';
    const strip = document.createElement('span');
    strip.textContent = Array.from({ length: 25 }, (_, i) => String(i).padStart(2, '0')).join('\n');
    strip.style.animationDelay = `${-Math.round(performance.now() % 1000)}ms`;
    ff.append(strip);
    tc.append(tcS, ':', ff);
  }
  const bars = meters.map((m) => {
    const bar = m.firstElementChild;
    const fill = bar?.firstElementChild;
    return bar && fill ? { y: gsap.quickSetter(bar, 'scaleY'), f: gsap.quickSetter(fill, 'scaleY') } : null;
  });
  const lv = meters.map(() => 0.3);
  const K = LITE ? 0.4375 : 0.25;          // une trame sur deux : la même réponse
  let skip = 0;
  gsap.ticker.add((time) => {
    if (!on) return;
    const s = Math.floor(Date.now() / 1000);
    if (tcS && s !== sec) { sec = s; tcS.textContent = addisTime(true); }
    if (LITE && (skip = (skip + 1) % 2)) return;
    meters.forEach((m, i) => {
      const target = 0.35 + 0.45 * Math.abs(Math.sin(time * (2.3 + i * 0.7)) * Math.sin(time * 5.1 + i)) + Math.random() * 0.12;
      lv[i] += (Math.min(0.98, target) - lv[i]) * K;
      const b = bars[i];
      if (b) { b.y(lv[i]); b.f(1 / lv[i]); } else m.style.setProperty('--v', lv[i].toFixed(3));
    });
  });

  // Le mur suit la souris, à peine.
  if (!LITE) {
    const base = { ry: -16, rx: 5 };
    const to = { ry: base.ry, rx: base.rx };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      to.ry = base.ry + ((e.clientX - r.left) / r.width - 0.5) * 6;
      to.rx = base.rx - ((e.clientY - r.top) / r.height - 0.5) * 4;
      gsap.to(wall, { rotateY: to.ry, rotateX: to.rx, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
    });
    gsap.set(wall, { rotateY: base.ry, rotateX: base.rx, rotateZ: 0.6 });
  }
  // À la descente, le mur recule dans la profondeur.
  gsap.to(wall, {
    yPercent: -8, scale: 0.94, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ═══════════════════ LE PUPITRE DE LA DEMANDE ═══════════════════
   Ce que le visiteur remplit s'affiche sur la régie :
     · chaque canal a son témoin — ambre quand il est commencé, vert quand il
       est rempli, rouge s'il reste une erreur après un essai d'envoi ;
     · le « signal » monte avec ce qui est rempli (le nom, le téléphone et
       l'email comptent double) ; le moniteur passe des mires à l'image ;
     · l'événement s'écrit en synthé sur le moniteur (type, lieu, date,
       plateformes, enregistrement) ;
     · nom, téléphone et email bons : le pupitre s'arme (« Ready »), la touche
       d'envoi s'allume en rouge ;
     · envoyée (`inquiry:sent`), la demande devient une feuille de conduite,
       ligne après ligne. « Edit my request » rouvre le formulaire.
   Le timecode ne court que quand le pupitre est à l'écran ; sur écran tactile
   ou en mouvement réduit, il avance à la seconde. Aucune animation en
   mouvement réduit. */
function initDesk() {
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;   // la même règle qu'inquiry.js
  const REQUIRED = ['name', 'phone', 'email'];
  const desk = document.querySelector('[data-desk]');
  const form = desk?.querySelector('form[data-inquiry]');
  if (!form) return;
  const still = reduced();
  const $ = (s) => desk.querySelector(s);
  const chans = [...form.querySelectorAll('[data-ch]')];
  const bus = [...desk.querySelectorAll('[data-bus]')];
  const segs = [...desk.querySelectorAll('[data-sig] i')];
  const stateEl = $('[data-desk-state]');
  const takeS = $('[data-take-s]');
  const take = $('[data-take]');
  const sigV = $('[data-sig-v]');
  const mon = $('[data-mon]');
  const mType = $('[data-mon-type]');
  const mWhere = $('[data-mon-where]');
  const mPlat = $('[data-mon-plat]');
  const tcEl = $('[data-desk-tc]');
  const done = desk.querySelector('[data-inquiry-done]');
  const note = form.querySelector('[data-inquiry-note]');
  const noteText = note?.textContent || '';

  const names = [...new Set([...form.elements].map((e) => e.name).filter((n) => n && n !== 'website'))];
  const els = (n) => [...form.querySelectorAll(`[name="${n}"]`)];
  const val = (n) => {
    const list = els(n);
    const el = list[0];
    if (!el) return '';
    if (el.type === 'checkbox' || el.type === 'radio') {
      return list.filter((e) => e.checked).map((e) => e.closest('label')?.textContent.trim() || e.value).join(' · ');
    }
    if (el.tagName === 'SELECT') return el.value ? el.selectedOptions[0].textContent.trim() : '';
    return String(el.value || '').trim();
  };
  const ok = (n) => {
    const v = val(n);
    return Boolean(v) && (n !== 'email' || EMAIL.test(v));
  };
  const weight = (n) => (REQUIRED.includes(n) ? 2 : 1);
  const total = names.reduce((s, n) => s + weight(n), 0);

  // Le signal glisse vers sa valeur ; les diodes et le moniteur le suivent.
  const level = { v: 0 };
  const paintSig = () => {
    const lit = Math.round(level.v * segs.length);
    segs.forEach((s, i) => s.classList.toggle('is-on', i < lit));
    if (sigV) sigV.textContent = `${Math.round(level.v * 100)}%`;
    mon?.style.setProperty('--sig', level.v.toFixed(3));
  };

  const fmtDate = (v) => {
    const d = new Date(`${v}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };
  const ph = (el, text, isPh) => { el.textContent = text; el.classList.toggle('is-ph', isPh); };

  let armed = null;
  const pop = (el) => {
    if (still || !el) return;
    gsap.fromTo(el, { scale: 1.9 }, { scale: 1, duration: 0.6, ease: 'power3.out', overwrite: true });
  };

  function update({ animate = true } = {}) {
    // Les champs remplis : un témoin au bout du libellé.
    for (const f of form.querySelectorAll('.field')) {
      const c = f.querySelector('input, select, textarea');
      if (c?.name) f.classList.toggle('is-on', ok(c.name));
    }
    for (const s of form.querySelectorAll('[data-need-f]')) s.classList.toggle('is-on', ok(s.dataset.needF));

    // Les canaux et le bus.
    chans.forEach((ch, i) => {
      const inCh = [...new Set([...ch.querySelectorAll('[name]')].map((e) => e.name))];
      const need = (ch.dataset.need || '').split(/\s+/).filter(Boolean);
      const any = inCh.some((n) => val(n));
      const st = ch.querySelector('.is-err') ? 'err' : need.every(ok) ? 'on' : any ? 'part' : 'off';
      if (ch.dataset.st === st) return;
      ch.dataset.st = st;
      if (bus[i]) bus[i].dataset.st = st;
      if (animate && st === 'on') { pop(ch.querySelector('.lv-tally')); pop(bus[i]?.querySelector('i')); }
    });

    // Le signal.
    const target = names.reduce((s, n) => s + (ok(n) ? weight(n) : 0), 0) / total;
    if (still || !animate) { gsap.killTweensOf(level); level.v = target; paintSig(); }
    else gsap.to(level, { v: target, duration: 0.9, ease: 'power3.out', overwrite: true, onUpdate: paintSig });

    // Le synthé du moniteur.
    const type = val('type');
    const where = [val('location'), els('date')[0]?.value ? fmtDate(els('date')[0].value) : ''].filter(Boolean);
    if (mType) ph(mType, type || 'Your event', !type);
    if (mWhere) ph(mWhere, where.length ? where.join(' · ') : 'Venue · Date', !where.length);
    if (mPlat) {
      const plat = els('platform').filter((e) => e.checked && e.value !== 'advise').map((e) => e.closest('label')?.textContent.trim());
      if (els('access').find((e) => e.checked)?.value === 'restricted') plat.push('Restricted');
      mPlat.textContent = plat.join(' · ');
    }
    mon?.classList.toggle('is-rec', els('recording').find((e) => e.checked)?.value === 'yes');

    // Plus rien à corriger : la note d'inquiry.js (« A few fields still need
    // you. ») reprend sa phrase d'origine.
    if (note && note.textContent !== noteText && !form.querySelector('.is-err') && !form.querySelector('[aria-busy=true]')) {
      if (/still need/i.test(note.textContent)) note.textContent = noteText;
    }

    // Armé ?
    const now = REQUIRED.every(ok);
    if (now !== armed) {
      const first = armed === null;
      armed = now;
      desk.classList.toggle('is-armed', now);
      if (stateEl) stateEl.textContent = now ? 'Ready' : 'Standby';
      if (takeS) takeS.textContent = now ? 'Ready' : 'Standby';
      if (now && !first && animate && !still && take) {
        gsap.fromTo(take, { scale: 0.97 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)', clearProps: 'transform' });
      }
    }
  }

  update({ animate: false });
  form.addEventListener('input', () => update());
  form.addEventListener('change', () => update());
  // Après un essai d'envoi (inquiry.js a déjà marqué les erreurs).
  form.addEventListener('submit', () => requestAnimationFrame(() => update()));
  // Une carte de la page oriente le formulaire sans événement : on relit.
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('a[href*="?"]')) return;
    requestAnimationFrame(() => {
      update();
      const picked = form.querySelector('.is-picked');
      if (picked) pop(picked.closest('[data-ch]')?.querySelector('.lv-tally'));
    });
  });

  // Le timecode, à l'heure d'Addis : en images sur ordinateur, à la seconde
  // sur écran tactile et en mouvement réduit. Seulement à l'écran.
  if (tcEl) {
    const frames = !still && !LITE;
    let on = false;
    let id = 0;
    // N'écrire que ce qui change : l'heure une fois par seconde, les images
    // au plus 25 fois par seconde (F14).
    let hms = '';
    let sec = -1;
    const paint = () => {
      const s = Math.floor(Date.now() / 1000);
      if (s !== sec) { sec = s; hms = addisTime(true); }
      const v = frames ? `${hms}:${String(Math.floor((performance.now() % 1000) / 40)).padStart(2, '0')}` : hms;
      if (tcEl.textContent !== v) tcEl.textContent = v;
    };
    paint();
    if (frames) gsap.ticker.add(() => { if (on && !document.hidden) paint(); });
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      clearInterval(id);
      if (on && !frames) id = window.setInterval(() => { if (!document.hidden) paint(); }, 1000);
    }).observe(desk);
  }

  // Envoyée : la feuille de conduite.
  window.addEventListener('inquiry:sent', (e) => {
    if (e.detail?.division && e.detail.division !== form.dataset.inquiry) return;
    const t = desk.querySelector('[data-cue-time]');
    if (t) t.textContent = addisTime(true);
    if (stateEl) stateEl.textContent = 'Cue sheet';
    // La touche d'envoi a disparu avec le formulaire : le clavier passe au titre
    // de la feuille de conduite.
    window.setTimeout(() => focusDone(done), 60);
    // Le formulaire a disparu, la page a raccourci : le défilement d'inquiry.js
    // (centré, natif) est coupé par le recalage des déclencheurs et la feuille
    // restait au-dessus de l'écran. On recale, puis on amène le haut de la
    // feuille sous la barre — après le recalage de remeasure() (160 ms).
    ScrollTrigger.refresh();
    const bring = (soft) => {
      if (!done) return;
      const off = -(document.querySelector('.bar')?.offsetHeight || 80) - 24;
      const lenis = window.__lenis;
      if (lenis) { lenis.resize?.(); lenis.scrollTo(done, { offset: off, force: true, ...(soft ? { duration: 0.9 } : { immediate: true }) }); }
      else window.scrollTo({ top: done.getBoundingClientRect().top + window.scrollY + off, behavior: soft ? 'smooth' : 'auto' });
    };
    window.setTimeout(() => { ScrollTrigger.refresh(); bring(!still); }, 240);
    // Un recalage tardif (machine chargée) peut encore couper le défilement :
    // on vérifie, et on pose la feuille d'un coup si elle n'est pas à l'écran.
    window.setTimeout(() => {
      const r = done?.getBoundingClientRect();
      if (r && (r.top < 0 || r.top > window.innerHeight * 0.5)) bring(false);
    }, 1500);
    if (still || !done) return;
    const rows = [...done.querySelectorAll('dt, dd')];
    gsap.fromTo(rows, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.035, delay: 0.25, clearProps: 'transform,opacity,visibility' });
    const strip = done.querySelector('.lv-cue__strip');
    if (strip) gsap.fromTo(strip, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut', clearProps: 'clipPath' });
  });

  // Rouvrir le formulaire pour corriger la demande.
  desk.querySelector('[data-cue-edit]')?.addEventListener('click', () => {
    form.classList.remove('is-sent');
    if (done) done.hidden = true;
    armed = null;
    update({ animate: false });
    const first = form.querySelector('select, input:not([type=hidden]):not([tabindex="-1"])');
    form.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    first?.focus({ preventScroll: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
}
