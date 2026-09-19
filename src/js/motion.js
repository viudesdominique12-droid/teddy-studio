import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────
   LE LANGAGE DE MOUVEMENT — « Green Light »
   Trois courbes nommées, et une seule loi :
   un élément ne passe au vert QUE s'il change d'état.
   Le vert est un budget (3 marques par écran au plus), pas une texture.
   ──────────────────────────────────────────────────────────────── */

export const EASE = {
  /** Le feu vert : ça part vite et ça se POSE, comme un tampon. */
  clear: 'power4.out',
  /** L'arrivée d'un bloc : porté, jamais mou. */
  lift: 'expo.out',
  /** Le repos, les retours d'état. */
  settle: 'power2.inOut'
};

export const DUR = { clear: 0.52, lift: 0.9, settle: 0.34 };

export const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Les révélations vivent désormais dans `reveal.js` : un seul geste, le
   blur-in, piloté par attribut. Ce module ne garde que ce qui lui est propre —
   le curseur, l'index, la barre. */

/* ───────────────────────── Le curseur ───────────────────────── */

export function cursor() {
  const el = document.getElementById('cursor');
  if (!el) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) { el.remove(); return; }

  const dot = el.querySelector('.cursor__d');
  const ring = el.querySelector('.cursor__r');
  const pill = el.querySelector('.cursor__t');

  const dx = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'none' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'none' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3' });
  // La pastille suit plus court que l'anneau : elle porte un mot, elle doit
  // rester lisible pendant le geste.
  const px = pill && gsap.quickTo(pill, 'x', { duration: 0.22, ease: 'power3' });
  const py = pill && gsap.quickTo(pill, 'y', { duration: 0.22, ease: 'power3' });

  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (!shown) { shown = true; el.classList.add('is-on'); }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    if (px) { px(e.clientX); py(e.clientY); }
  }, { passive: true });

  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));

  // Le curseur ne grossit pas : il passe à l'état GO.
  const INTENT = 'a,button,[data-cursor],input,textarea,select,summary';
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.(INTENT);
    if (!t) return;
    el.dataset.state = t.dataset.cursor || (t.matches('input,textarea,select') ? 'text' : 'go');
  });
  document.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget?.closest?.(INTENT)) delete el.dataset.state;
  });

  // La pastille s'enfonce pendant qu'on tire. L'état vient de la galerie
  // elle-même — elle sait déjà distinguer un glissé d'une molette — et on
  // l'écoute plutôt que de dupliquer sa logique de pointeur.
  const stage = document.querySelector('[data-gallery]');
  if (pill && stage) {
    const press = () => gsap.to(pill, {
      scale: stage.dataset.galleryStatus === 'dragging' ? 0.9 : 1,
      duration: 0.24, ease: 'power3.out'
    });
    new MutationObserver(press).observe(stage, {
      attributes: true, attributeFilter: ['data-gallery-status']
    });
  }
}

/* ───────────────────────── L'INDEX ─────────────────────────
   Le sommaire du dossier : il informe avant de router. */

export function indexPanel() {
  const wrap = document.getElementById('index');
  const open = document.getElementById('index-open');
  if (!wrap || !open) return;

  const links = [...wrap.querySelectorAll('.index__nav a')];
  // Le retard de chaque lien est une variable CSS : l'échelonnement vit dans
  // la feuille de style, pas dans une timeline à tenir à jour.
  links.forEach((a, i) => a.style.setProperty('--i', String(i)));

  let last = null;

  const show = () => {
    last = document.activeElement;
    wrap.hidden = false;
    // Deux frames : sans ça le navigateur fusionne « affiché » et « ouvert »,
    // et la tuile apparaît déjà en place au lieu de descendre.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.dataset.open = '';
    }));
    document.documentElement.classList.add('is-locked');
    open.setAttribute('aria-expanded', 'true');
    links[0]?.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('index:open'));
  };

  const hide = () => {
    delete wrap.dataset.open;
    document.documentElement.classList.remove('is-locked');
    open.setAttribute('aria-expanded', 'false');
    const done = () => { wrap.hidden = true; last?.focus({ preventScroll: true }); };
    if (reduced()) done();
    else window.setTimeout(done, 520);
    window.dispatchEvent(new CustomEvent('index:close'));
  };

  // Un seul bouton : il ouvre et il ferme, comme la référence.
  open.addEventListener('click', () => {
    open.getAttribute('aria-expanded') === 'true' ? hide() : show();
  });
  for (const a of links) a.addEventListener('click', hide);

  document.addEventListener('keydown', (e) => {
    if (wrap.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key !== 'Tab') return;
    const f = [open, ...links].filter((n) => n && n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
}

/* ───────────────────────── La barre ───────────────────────── */

export function bar() {
  const el = document.getElementById('bar');
  const open = document.querySelector('.open');
  if (!el) return;

  // Sur la plaque d'ouverture : blanc sur l'image. Ailleurs : papier.
  if (open) {
    new IntersectionObserver(
      ([e]) => el.classList.toggle('is-paper', !e.isIntersecting),
      { rootMargin: '-60px 0px 0px 0px', threshold: 0 }
    ).observe(open);
  } else {
    el.classList.add('is-paper');
  }

  let prev = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 420 && y - prev > 6) el.classList.add('is-away');
    else if (prev - y > 6 || y < 120) el.classList.remove('is-away');
    prev = y;
  }, { passive: true });
}
