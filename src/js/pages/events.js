/**
 * EVENT ORGANIZING — la salle de l'ouverture (17/10/2026).
 *
 * Des lyres accrochées juste au-dessus du cadre. À l'ouverture elles
 * s'allument l'une après l'autre et balaient la salle ; quand un faisceau
 * traverse le titre, ses mots prennent la lumière (`--lit`). Puis elles se
 * posent sur l'appel « Plan Your Event » et respirent doucement. Sur
 * ordinateur, elles suivent la souris quand on la promène dans la salle, et
 * visent le bouton qu'on survole ; sans geste, elles reviennent à l'appel.
 *
 * Tout est dessiné dans UN canevas, à basse définition (0,5 à 0,6 px par px
 * CSS) : l'agrandissement adoucit les bords, gratuitement. Chaque faisceau est
 * une image calculée une seule fois (un cône aux bords doux, strié de rayons),
 * posée et tournée à chaque image ; une brume (un bruit lent) le ronge par
 * endroits. Hors de l'écran, rien ne tourne. Sur téléphone : quatre lyres,
 * moins de pixels. En mouvement réduit : la salle fixe, faisceaux posés.
 * Si le canevas manque, trois faisceaux en CSS (events.css) prennent la place.
 *
 * Le reste de la page : le programme (les familles s'ouvrent une à une), les
 * liens qui orientent le formulaire sans recharger la page, et l'invitation
 * (18/10) : un billet qui s'imprime pendant qu'on remplit la demande, des
 * lampes qui s'allument acte par acte, et un talon qui se détache à l'envoi.
 * Les scènes des sections (la poursuite, le programme imprimé, les badges, la
 * scène et son rideau, l'enseigne) sont dans events-scenes.js.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, heroIn, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { initScenes } from './events-scenes.js';

gsap.registerPlugin(ScrollTrigger);

bootDivision({ hero: false });
const intro = heroIn();
initRig(intro);
initProgramme();
initScenes();                                     // les sections : poursuite, programme, badges, scène, enseigne
const refreshInvite = initInvite();
initPrefillLinks(refreshInvite);
watchHeight();

/* ═══════════════════════ LA SALLE ═══════════════════════ */

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function smooth(a, b, x) { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }

function hexRgb(hex, fallback = [242, 169, 59]) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(String(hex).trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : fallback;
}

/* Un faisceau, calculé une fois : un cône pointé vers le bas, aux bords
   doux, plus dense au cœur, strié de quelques rayons, qui s'éteint au loin. */
function beamSprite(spread, rgb, H) {
  const half = spread / 2;
  const W = Math.ceil(2 * H * Math.tan(half * 1.3)) + 4;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  const d = img.data;
  const cx = W / 2;
  const k1 = 9 + Math.random() * 6, k2 = 23 + Math.random() * 10;
  const p1 = Math.random() * 6.28, p2 = Math.random() * 6.28;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5;
      const ang = Math.atan2(dx, dy);
      const r = Math.abs(ang) / half;
      if (r > 1.3) continue;
      const t = Math.min(1, Math.hypot(dx, dy) / H);
      const soft = 1 - smooth(0.45, 1.25, r);
      const core = Math.exp(-((r / 0.32) ** 2)) * 0.55;
      const rays = 0.84 + 0.16 * Math.sin((ang / half) * k1 + p1) * Math.sin((ang / half) * k2 + p2);
      const fall = (1 - t) ** 0.85 * (0.6 + 0.4 * Math.exp(-t * 3));
      const a = clamp01((soft * 0.7 + core) * rays * fall);
      if (a <= 0) continue;
      const i = (y * W + x) * 4;
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* La brume : un bruit doux (noir, alpha aléatoire), agrandi sans crénelage. */
function hazeTexture() {
  const n = 40;
  const small = document.createElement('canvas');
  small.width = small.height = n;
  const sg = small.getContext('2d');
  const img = sg.createImageData(n, n);
  for (let i = 0; i < n * n; i++) img.data[i * 4 + 3] = Math.random() * 255;
  sg.putImageData(img, 0, 0);
  const big = document.createElement('canvas');
  big.width = big.height = 320;
  const bg = big.getContext('2d');
  bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high';
  bg.drawImage(small, 0, 0, 320, 320);
  return big;
}

function initRig(intro) {
  const hero = document.querySelector('.ev-hero');
  const cv = hero?.querySelector('[data-rig]');
  if (!hero || !cv) return;
  let ctx = null;
  try { ctx = cv.getContext('2d', { alpha: true }); } catch { ctx = null; }
  if (!ctx) return;                                  // les faisceaux CSS restent

  const still = reduced();
  const Q = LITE ? 0.5 : 0.62;                       // px de canevas par px CSS
  const SPRITE_H = LITE ? 220 : 360;
  const amber = hexRgb(getComputedStyle(document.body).getPropertyValue('--dv'));
  const warm = [255, 238, 210];
  const DEG = Math.PI / 180;

  // Les lyres : position sur la largeur, couleur, ouverture.
  const RIG = LITE
    ? [{ x: -0.1, c: amber, s: 19 }, { x: 0.3, c: warm, s: 14 }, { x: 0.74, c: amber, s: 16 }, { x: 1.1, c: warm, s: 15 }]
    : [{ x: 0.06, c: amber, s: 16 }, { x: 0.21, c: warm, s: 12 }, { x: 0.36, c: amber, s: 14 },
       { x: 0.64, c: amber, s: 14 }, { x: 0.79, c: warm, s: 12 }, { x: 0.94, c: amber, s: 16 }];

  const beams = RIG.map((f, i) => ({
    x: f.x, rgb: f.c, spread: f.s * DEG, sprite: beamSprite(f.s * DEG, f.c, SPRITE_H),
    a: 0, on: still ? 1 : 0, ph: i * 1.7 + Math.random(), sp: 0.9 + Math.random() * 0.5,
    drift: (Math.random() - 0.5) * 2
  }));
  const haze = hazeTexture();
  hero.classList.add('has-rig');

  // Les mots du titre (découpés par heroIn) et les appels visés.
  const masks = [...hero.querySelectorAll('.dv-h1 .dv-w')];
  const words = masks.map((m) => ({ el: m.firstElementChild, x: 0, y: 0, w: 0, lit: -1 }));
  const aims = [...hero.querySelectorAll('[data-aim]')];

  let W = 0, H = 0, L = 0, oy = 0;
  const box = { cta: { x: 0, y: 0, w: 0 }, h1: { x: 0, y: 0, w: 0 } };
  const aim = { x: 0, y: 0, w: 0 };          // la cible lissée
  const goal = { x: 0, y: 0, w: 0 };         // la cible voulue
  const st = { settle: still ? 1 : 0, gain: still ? 1 : 0, master: 1 };
  let mode = still ? 'aim' : 'intro';
  let follow = null;                          // { x, y } : la souris
  let hover = null;                           // le bouton survolé
  let idle = 0;

  const rectIn = (el) => {
    const r = el.getBoundingClientRect(), h = hero.getBoundingClientRect();
    return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height / 2, w: r.width, h: r.height };
  };

  function measure() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    // Redimensionner un canevas l'efface : seulement si sa taille change.
    const cw = Math.max(2, Math.round(W * Q)), ch = Math.max(2, Math.round(H * Q));
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    L = Math.hypot(W, H) * 1.02;
    oy = -Math.min(40, H * 0.035);
    const main = aims[0];
    if (main) box.cta = rectIn(main);
    const h1 = hero.querySelector('.dv-h1');
    if (h1) box.h1 = rectIn(h1);
    for (const w of words) {
      const m = w.el.parentElement.getBoundingClientRect(), h = hero.getBoundingClientRect();
      w.x = m.left - h.left + m.width / 2; w.y = m.top - h.top + m.height * 0.55; w.w = m.width;
    }
    pickGoal(true);
    if (still) { snap(); draw(0); light(); }
  }

  function pickGoal(jump = false) {
    let t = box.cta;
    if (hover) t = rectIn(hover);
    else if (follow) t = { x: follow.x, y: follow.y, w: 160 };
    goal.x = t.x; goal.y = t.y; goal.w = t.w;
    if (jump) { aim.x = goal.x; aim.y = goal.y; aim.w = goal.w; }
  }

  // L'angle d'une lyre vers un point (0 = droit vers le bas, positif vers la droite).
  const angleTo = (b, px, py) => Math.atan2(px - b.x * W, py - oy);

  function desired(b, i, t) {
    const n = beams.length;
    const u = n > 1 ? i / (n - 1) - 0.5 : 0;
    if (mode === 'intro') {
      // Le balayage d'ouverture : chaque lyre fouille la ligne du titre.
      const tx = box.h1.x + u * box.h1.w * 1.1;
      return angleTo(b, tx, box.h1.y) + 0.26 * Math.sin(t * b.sp * 1.25 + b.ph);
    }
    // Posées : chacune vise un point de la cible, qui flâne un peu.
    const spread = Math.max(aim.w * 0.5, 70);
    const tx = aim.x + u * spread + Math.sin(t * 0.32 + b.ph) * 26 * b.drift;
    const ty = aim.y + Math.cos(t * 0.27 + b.ph) * 10;
    return angleTo(b, tx, ty) + 0.018 * Math.sin(t * 0.55 + b.ph);
  }

  // Les lyres sont posées sur l'appel et personne ne les guide.
  const calm = () => mode === 'aim' && st.settle > 0.99 && !follow && !hover;

  function snap() { beams.forEach((b, i) => { b.a = desired(b, i, 0); }); }

  /* ─── Le dessin ─── */
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(Q, 0, 0, Q, 0, 0);

    // 1. Les faisceaux, additionnés.
    ctx.globalCompositeOperation = 'lighter';
    for (const b of beams) {
      if (b.on <= 0.002) continue;
      const s = b.sprite, sw = s.width * (L / s.height);
      ctx.save();
      ctx.translate(b.x * W, oy);
      ctx.rotate(-b.a);
      ctx.globalAlpha = (LITE ? 0.52 : 0.5) * b.on * st.master;
      ctx.drawImage(s, -sw / 2, 0, sw, L);
      ctx.restore();
    }

    // 2. La brume les ronge par endroits, et dérive lentement.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.5;
    const hs = Math.max(W, H) * 1.7;
    const hx = -hs * 0.2 + Math.sin(t * 0.05) * hs * 0.12;
    const hy = -hs * 0.25 + Math.cos(t * 0.04) * hs * 0.1;
    ctx.drawImage(haze, hx, hy, hs, hs);

    // 3. L'éclat des optiques au bord du cadre, et la flaque de lumière sur l'appel.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    for (const b of beams) {
      if (b.on <= 0.002) continue;
      const x = b.x * W, r = LITE ? 54 : 78;
      const g = ctx.createRadialGradient(x, oy + 6, 0, x, oy + 6, r);
      g.addColorStop(0, rgba(warm, 0.95 * b.on));
      g.addColorStop(0.12, rgba(warm, 0.55 * b.on));
      g.addColorStop(0.35, rgba(b.rgb, 0.22 * b.on));
      g.addColorStop(1, rgba(b.rgb, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, oy + 6 - r, r * 2, r * 2);
    }
    if (st.settle > 0.01) {
      const rx = Math.max(aim.w * 1.15, 190), ry = rx * 0.34;
      ctx.save();
      ctx.translate(aim.x, aim.y + 6);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, rgba(amber, 0.3 * st.settle));
      g.addColorStop(0.5, rgba(amber, 0.1 * st.settle));
      g.addColorStop(1, rgba(amber, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
      ctx.restore();
    }
  }

  /* ─── Les mots prennent la lumière ─── */
  function light() {
    if (!words.length) return;
    /* Posées, les lyres ne font que flâner : la lumière des mots bouge de
       quelques millièmes à chaque trame, et chaque écriture de `--lit`
       repeignait le titre ~20 fois par seconde. Au repos (`calm()`), on ne
       relit la lumière que 5 fois par seconde et on n'écrit qu'un écart de
       3 % (invisible à l'œil) ; à l'ouverture, au balayage et sous la
       souris, la finesse reste (F30, 18/10/2026). */
    const eps = calm() ? 0.03 : 0.008;
    for (const w of words) {
      let lit = 0;
      for (const b of beams) {
        if (b.on <= 0.01) continue;
        const half = b.spread / 2;
        let p = 0;
        for (const f of [-0.32, 0, 0.32]) {
          const px = w.x + f * w.w;
          const r = Math.abs(angleTo(b, px, w.y) - b.a) / half;
          p += 1 - smooth(0.25, 1.05, r);
        }
        const dist = Math.hypot(w.x - b.x * W, w.y - oy) / L;
        lit += (p / 3) * b.on * (1 - dist * 0.5);
      }
      lit = Math.min(1, lit * 0.95) * st.gain;
      if (Math.abs(lit - w.lit) > eps || (lit === 0 && w.lit !== 0)) {
        w.lit = lit;
        w.el.style.setProperty('--lit', lit.toFixed(3));
      }
    }
  }

  measure();
  new ResizeObserver(() => measure()).observe(hero);
  document.fonts?.ready.then(measure);
  window.addEventListener('palette:change', () => setTimeout(measure, 350));

  if (still) {
    hero.classList.add('is-lit');
    return;
  }

  /* ─── L'ouverture : allumage, balayage, puis la pose sur l'appel ─── */
  beams.forEach((b, i) => {
    b.a = angleTo(b, b.x * W, H);                      // droit vers le bas
    gsap.to(b, { on: 1, duration: 1.1, delay: 0.15 + i * 0.13, ease: 'power2.out' });
  });
  const lit = () => {
    hero.classList.add('is-lit');
    gsap.to(st, { gain: 1, duration: 0.8, ease: 'power2.out' });
    measure();
  };
  /* Les mots s'allument quand l'entrée du titre est finie. Depuis F08
     (18/10/2026), heroIn() ne règle plus que les mots (la phrase, les appels
     et les repères montent en CSS) : on garde le moment d'avant, la fin de la
     montée des repères (0,45 s + 1,1 s, puis +0,08 s par élément). */
  const items = document.querySelectorAll('.dv-hero [data-in]').length;
  if (intro) intro.call(lit, null, Math.max(intro.duration(), items ? 1.55 + 0.08 * (items - 1) : 0));
  else lit();

  gsap.delayedCall(LITE ? 3.1 : 3.5, () => {
    mode = 'aim';
    measure();
    gsap.to(st, { settle: 1, duration: 1.4, ease: 'power2.inOut' });
  });

  /* ─── La souris (ordinateur) : les lyres la suivent, puis reviennent ─── */
  if (!LITE) {
    hero.addEventListener('pointermove', (e) => {
      if (mode !== 'aim' || e.pointerType !== 'mouse') return;
      const h = hero.getBoundingClientRect();
      follow = { x: e.clientX - h.left, y: e.clientY - h.top };
      idle = 0;
    });
    hero.addEventListener('pointerleave', () => { follow = null; });
  }
  for (const el of aims) {
    el.addEventListener('pointerenter', () => { hover = el; });
    el.addEventListener('pointerleave', () => { if (hover === el) hover = null; });
    el.addEventListener('focus', () => { hover = el; });
    el.addEventListener('blur', () => { if (hover === el) hover = null; });
  }

  /* ─── N'animer que ce qui se voit ─── */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  let last = performance.now() / 1000;
  let frame = 0;
  let litAt = 0;
  gsap.ticker.add(() => {
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - last);
    last = now;
    if (!visible || document.hidden) return;
    frame++;

    if (follow) { idle += dt; if (idle > 2.6) follow = null; }
    pickGoal();
    const ka = 1 - Math.exp(-dt * 3.2);
    aim.x += (goal.x - aim.x) * ka; aim.y += (goal.y - aim.y) * ka; aim.w += (goal.w - aim.w) * ka;

    const k = 1 - Math.exp(-dt * (mode === 'intro' ? 3.6 : 2.3));
    beams.forEach((b, i) => { b.a += (desired(b, i, now) - b.a) * k; });

    draw(now);
    if (calm() ? now - litAt > 0.2 : (!LITE || frame % 2 === 0)) { light(); litAt = now; }
  });

  // À la descente, la salle s'assombrit un peu : la lumière reste sur scène.
  gsap.to(st, {
    master: 0.55, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ═══════════════════════ LE PROGRAMME ═══════════════════════
   L'accordéon lui-même vient du socle (bootDivision → initAccordion). Ici :
   le rang de chaque ligne pour l'entrée en cascade, et le rattrapage quand
   une ligne ouverte plus haut se replie et emporte celle qu'on vient
   d'ouvrir hors de l'écran. */
function initProgramme() {
  const prog = document.querySelector('.ev-prog');
  if (!prog) return;
  prog.querySelectorAll('.ev-fam__list').forEach((ul) => {
    [...ul.children].forEach((li, i) => li.style.setProperty('--i', String(i)));
  });
  prog.querySelectorAll('.dv-acc__q').forEach((q) => {
    q.addEventListener('click', () => {
      const fam = q.closest('.ev-fam');
      window.setTimeout(() => {
        if (!fam.classList.contains('is-open')) return;
        const top = fam.getBoundingClientRect().top;
        if (top < 70 || top > window.innerHeight * 0.7) {
          const y = top + window.scrollY - 96;
          if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.9 });
          else window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
        }
      }, reduced() ? 0 : 720);
    });
  });
}

/* ═══════════════════════ LES LIENS QUI ORIENTENT LE FORMULAIRE ═══════════════════════
   « Plan a wedding », « Choose this option »… mènent à `?type=…#inquiry`.
   Sur la même page, le défilement doux (scroll.js) ne garde que l'ancre : le
   formulaire ne serait pas orienté. On le règle donc ici, avant lui, sans
   recharger la page, et l'adresse garde le choix. */
function initPrefillLinks(refresh = () => {}) {
  const form = document.querySelector('form[data-inquiry="events"]');
  if (!form) return;
  const KEYS = ['type', 'level'];
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="?"]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname) return;
    const touched = [];
    for (const [key, val] of url.searchParams) {
      if (!KEYS.includes(key)) continue;
      for (const el of form.querySelectorAll(`[name="${key}"]`)) {
        if (el.tagName === 'SELECT') {
          if ([...el.options].some((o) => o.value === val)) { el.value = val; touched.push(el.closest('.field')); }
        } else if (el.type === 'radio' || el.type === 'checkbox') {
          if (el.value === val) { el.checked = true; touched.push(el.closest('[data-group]')); }
        }
      }
    }
    const params = new URLSearchParams(location.search);
    for (const [key, val] of url.searchParams) params.set(key, val);
    const q = params.toString();
    history.replaceState(null, '', `${location.pathname}${q ? `?${q}` : ''}${location.hash}`);
    touched.filter(Boolean).forEach((box) => {
      box.classList.add('is-picked');
      window.setTimeout(() => box.classList.remove('is-picked'), 1800);
    });
    // Le billet imprime le choix (aucun événement `input` n'est émis ici).
    if (touched.length) requestAnimationFrame(() => refresh(true));
    // Sans défilement doux (mouvement réduit), on descend nous-mêmes.
    // Le test porte sur le mouvement réduit, pas sur Lenis : au doigt, Lenis
    // n'est plus chargé (F27) et scroll.js fait glisser la page nativement.
    if (reduced()) {
      e.preventDefault();
      const target = url.hash && document.querySelector(url.hash);
      target?.scrollIntoView({ block: 'start' });
      history.replaceState(null, '', `${location.pathname}${q ? `?${q}` : ''}${url.hash}`);
    }
  }, true);
}

/* ═══════════════════════ L'INVITATION ═══════════════════════
   Le formulaire, découpé en quatre actes, et son billet. Le billet ne fait
   que relire les champs (il est `aria-hidden` : les champs portent déjà
   l'information) ; `inquiry.js` reste seul maître de la vérification et de
   l'envoi. On écoute :
     · `input` / `change` du formulaire → le billet s'imprime, les lampes
       des actes s'allument, le bouton s'éclaire quand nom, téléphone et
       email sont là ;
     · `focusin` → la lampe de l'acte en cours sur le billet ;
     · `inquiry:sent` → le billet passe dans le récapitulatif, le talon se
       détache, le tampon « Request ready » se pose. Une demande, pas une
       réservation : rien n'y dit « confirmé ».
   Renvoie la fonction de mise à jour (les liens qui orientent le formulaire
   l'appellent : ils changent les champs sans émettre d'événement). */
function initInvite() {
  const form = document.querySelector('form[data-inquiry="events"]');
  const stub = form?.querySelector('[data-stub]');
  if (!form || !stub) return () => {};
  const still = reduced();
  form.classList.add('is-js');

  const out = {};
  stub.querySelectorAll('[data-st]').forEach((el) => { out[el.dataset.st] = el; });
  const lamps = [...stub.querySelectorAll('[data-lamp]')];
  const acts = [...form.querySelectorAll('.ev-act')];
  const send = form.querySelector('.ev-send');
  const note = form.querySelector('[data-inquiry-note]');
  const NOTE = note?.textContent || '';
  const EMPTY_TYPE = out.type?.textContent.trim() || 'Your event';
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  // Les choix (liste, cases, date) se réimpriment à chaque changement ; le
  // texte tapé seulement quand la case passe de vide à remplie.
  const DISCRETE = new Set(['type', 'date', 'scope', 'services']);
  let dateFmt = null;
  try {
    dateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  } catch { dateFmt = null; }

  const field = (n) => form.elements.namedItem(n);
  const val = (n) => String(field(n)?.value || '').trim();
  const cut = (s, n = 64) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  function read() {
    const sel = field('type');
    const type = sel && sel.value ? sel.selectedOptions[0]?.textContent.trim() || '' : '';
    let date = '';
    const d = val('date');
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    if (m && dateFmt) date = dateFmt.format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
    else if (d) date = d;
    const g = val('guests');
    let guests = g;
    if (/^[\d\s.,~–-]+$/.test(g) && /\d/.test(g)) guests = `${g} ${g.replace(/\D/g, '') === '1' ? 'guest' : 'guests'}`;
    const level = form.querySelector('[name="level"]:checked');
    const n = form.querySelectorAll('[name="services"]:checked').length;
    const who = [val('name'), val('organization')].filter(Boolean).join(' · ');
    return {
      type,
      date,
      venue: cut(val('location')),
      guests: cut(guests, 40),
      who: cut(who),
      scope: level ? level.closest('label')?.textContent.trim() || '' : '',
      services: n ? `${n} selected` : ''
    };
  }

  function replay(el, cls) {
    if (still) return;
    el.classList.remove(cls);
    void el.offsetWidth;                       // relance l'animation
    el.classList.add(cls);
  }

  const prev = {};
  let full = false;
  let primed = false;

  function update(force = false) {
    const v = read();
    for (const [key, el] of Object.entries(out)) {
      const now = v[key] || '';
      if (now === prev[key] && !force) continue;
      const was = prev[key] || '';
      prev[key] = now;
      if (key === 'type') {
        el.textContent = now || EMPTY_TYPE;
        el.classList.toggle('is-empty', !now);
        if (primed && now !== was) replay(el, 'is-roll');
        continue;
      }
      el.textContent = now;
      if (primed && now && (DISCRETE.has(key) ? now !== was : !was)) replay(el, 'is-print');
    }

    const lit = [
      Boolean(val('name') && val('phone') && EMAIL.test(val('email'))),
      Boolean(v.type || v.date || v.venue || v.guests),
      Boolean(v.scope || v.services),
      Boolean(val('budget') || val('message'))
    ];
    lit.forEach((on, i) => {
      lamps[i]?.classList.toggle('is-on', on);
      acts[i]?.classList.toggle('is-lit', on);
    });

    // Nom, téléphone et email : la demande peut partir. Le bouton s'allume ;
    // le reflet ne passe qu'au moment où il devient prêt.
    if (send) {
      const ready = lit[0];
      if (ready && !send.classList.contains('is-ready') && primed) replay(send, 'is-glint');
      send.classList.toggle('is-ready', ready);
    }
    // « A few fields still need you » (inquiry.js) : une fois les champs
    // obligatoires remplis, la note redevient l'invitation à appeler.
    if (lit[0] && note && note.textContent !== NOTE && !send?.hasAttribute('aria-busy')) {
      note.textContent = NOTE;
    }

    const all = lit.every(Boolean);
    if (all && !full && primed) replay(stub, 'is-shine');
    full = all;
  }

  // La lampe de l'acte où l'on écrit.
  form.addEventListener('focusin', (e) => {
    const act = e.target.closest?.('.ev-act');
    const i = acts.indexOf(act);
    lamps.forEach((l, k) => l.classList.toggle('is-cur', k === i));
  });
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget)) lamps.forEach((l) => l.classList.remove('is-cur'));
  });

  form.addEventListener('input', () => update());
  form.addEventListener('change', () => update());
  update(true);                                // l'adresse a peut-être déjà orienté le formulaire
  primed = true;

  // Les actes entrent en scène : leur filet se trace quand ils arrivent.
  if (still || !('IntersectionObserver' in window)) acts.forEach((a) => a.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    acts.forEach((a) => io.observe(a));
  }

  // L'envoi : le billet rejoint le récapitulatif, le talon se détache.
  window.addEventListener('inquiry:sent', (e) => {
    if (e.detail?.division && e.detail.division !== 'events') return;
    const box = form.parentElement?.querySelector('[data-inquiry-done]');
    const slot = box?.querySelector('[data-stub-slot]');
    if (!box || !slot || slot.contains(stub)) return;
    update(true);
    lamps.forEach((l) => l.classList.remove('is-cur'));
    slot.append(stub);
    // Le formulaire vient de disparaître : la page a raccourci d'un coup.
    // Le défilement doux (Lenis) garderait son ancienne cible, plus bas ;
    // on l'amène lui-même au billet, pour qu'on le voie se détacher.
    const lenis = window.__lenis;
    if (lenis) {
      requestAnimationFrame(() => {
        lenis.resize?.();
        lenis.scrollTo(box, { offset: -(document.querySelector('.bar')?.offsetHeight || 80) - 24, force: true, ...(still ? { immediate: true } : { duration: 0.9 }) });
      });
    }
    // Le formulaire a disparu avec le bouton qui avait le focus : on le
    // pose sur le titre du récapitulatif, sans faire défiler — un instant
    // après, quand le fondu d'inquiry.js l'a rendu visible (un élément
    // `visibility: hidden` refuse le focus).
    const h = box.querySelector('h3');
    const focusTitle = (n = 0) => {
      if (!h || document.activeElement === h) return;
      h.focus({ preventScroll: true });
      if (document.activeElement !== h && n < 8) window.setTimeout(() => focusTitle(n + 1), 80);
    };
    window.setTimeout(focusTitle, 60);

    const foil = stub.querySelector('.ev-stub__foil');
    const stamp = stub.querySelector('.ev-stub__stamp');
    if (still || !foil || !stamp) { stub.classList.add('is-torn'); return; }
    gsap.timeline({ delay: 0.75 })
      // Un premier coup sec, puis le talon part vers l'équipe.
      .to(foil, { rotation: 2.4, transformOrigin: '100% 0%', duration: 0.14, ease: 'power2.out' })
      .to(foil, { rotation: -1.2, duration: 0.12, ease: 'power2.inOut' })
      .to(foil, { x: 90, y: 54, rotation: 13, autoAlpha: 0, duration: 0.8, ease: 'power3.in' })
      .to(foil, { height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.3')
      .add(() => stub.classList.add('is-torn'))
      // Le tampon tombe (la CSS lui donne déjà son inclinaison de -9°).
      .fromTo(stamp,
        { autoAlpha: 0, scale: 1.8, rotation: -13 },
        { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.4)', clearProps: 'transform' }, '-=0.05');
  });

  return update;
}

/* Une famille qui s'ouvre change la hauteur de la page : les déclencheurs
   plus bas (la feuille de conduite) se remesurent. */
function watchHeight() {
  const main = document.getElementById('main');
  if (!main || !('ResizeObserver' in window)) return;
  let h = 0, timer = 0;
  new ResizeObserver(([e]) => {
    const nh = Math.round(e.contentRect.height);
    if (Math.abs(nh - h) < 2) return;
    h = nh;
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), 160);
  }).observe(main);
}
