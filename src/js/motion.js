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

/* Rendre la main au navigateur le temps d'une image, entre deux gros travaux
   (préparer une section, charger un modèle 3D) : une animation en cours garde
   ses images au lieu d'attendre la fin de tout le lot. Onglet caché : pas
   d'image à attendre, on continue au plus vite. */
export const breathe = () => new Promise((done) => {
  if (document.hidden) setTimeout(done, 0);
  else requestAnimationFrame(() => setTimeout(done, 0));
});

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
  const panel = wrap.querySelector('.index__in');
  const more = wrap.querySelector('.index__more');
  const svc = wrap.querySelector('#index-svc');
  const links = [...wrap.querySelectorAll('a')];

  // La page en cours, marquée dans la liste ; si c'est une division, la
  // liste des services s'ouvre déjà dessus.
  for (const a of links) {
    const u = new URL(a.href, location.href);
    if (u.origin === location.origin && u.pathname === location.pathname && !u.hash) {
      a.setAttribute('aria-current', 'page');
      if (svc?.contains(a)) { svc.hidden = false; more?.setAttribute('aria-expanded', 'true'); }
    }
  }
  more?.addEventListener('click', () => {
    const on = more.getAttribute('aria-expanded') !== 'true';
    more.setAttribute('aria-expanded', String(on));
    svc.hidden = !on;
  });

  let last = null;
  const focusables = () => [...panel.querySelectorAll('a, button')].filter((n) => n.offsetParent !== null);

  const show = () => {
    last = document.activeElement;
    wrap.hidden = false;
    // Deux images : sans ça, le panneau apparaîtrait déjà en place au lieu de glisser.
    requestAnimationFrame(() => requestAnimationFrame(() => { wrap.dataset.open = ''; }));
    document.documentElement.classList.add('is-locked');
    open.setAttribute('aria-expanded', 'true');
    wrap.querySelector('.index__x')?.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('index:open'));
  };

  const hide = () => {
    if (wrap.hidden) return;
    delete wrap.dataset.open;
    document.documentElement.classList.remove('is-locked');
    open.setAttribute('aria-expanded', 'false');
    const done = () => { wrap.hidden = true; last?.focus({ preventScroll: true }); };
    if (reduced()) done();
    else window.setTimeout(done, 420);
    window.dispatchEvent(new CustomEvent('index:close'));
  };

  open.addEventListener('click', () => (open.getAttribute('aria-expanded') === 'true' ? hide() : show()));
  wrap.querySelectorAll('[data-index-close]').forEach((b) => b.addEventListener('click', hide));
  for (const a of links) a.addEventListener('click', hide);

  // Glisser le panneau vers la droite le referme.
  let x0 = null, y0 = 0;
  panel.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const t = e.changedTouches[0];
    if (t.clientX - x0 > 70 && Math.abs(t.clientY - y0) < 60) hide();
    x0 = null;
  }, { passive: true });

  // Sur ordinateur, la barre porte tous les liens : le menu n'y existe pas.
  // Une fenêtre qu'on élargit menu ouvert le referme.
  const wide = matchMedia('(min-width: 60rem)');
  wide.addEventListener?.('change', (e) => { if (e.matches) hide(); });

  document.addEventListener('keydown', (e) => {
    if (wrap.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
}

/* ───────────────────────── La barre ───────────────────────── */

export function bar() {
  const el = document.getElementById('bar');
  // `[data-bar-clear]` : l'ouverture de l'accueil (27/09/2026).
  const open = document.querySelector('.open, [data-bar-clear]');
  if (!el) return;

  // La pilule marque la page en cours. Les ancres de l'accueil (#services,
  // #contact) ne sont pas des pages : seul « Home » (#top) y compte.
  const here = location.pathname.replace(/index\.html$/, '');
  for (const a of el.querySelectorAll('.bar__pill > a:not(.bar__pill-cta)')) {
    const u = new URL(a.href, location.href);
    if (u.pathname.replace(/index\.html$/, '') === here && (!u.hash || u.hash === '#top')) {
      a.setAttribute('aria-current', 'page');
    }
  }

  // Le menu des services (brief du 17/10) : il s'ouvre au clic, au clavier
  // et, à la souris, au survol ; Échap, un clic dehors ou la sortie du focus
  // le referment. Sur une page de division, « Services » reste allumé.
  const dd = el.querySelector('.bar__dd');
  if (dd) {
    const btn = dd.querySelector('.bar__ddb');
    const menu = dd.querySelector('.bar__menu');
    const links = [...menu.querySelectorAll('a')];
    let timer = 0;
    const set = (on) => {
      clearTimeout(timer);
      btn.setAttribute('aria-expanded', String(on));
      menu.hidden = !on;
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      dd.addEventListener('pointerenter', () => { clearTimeout(timer); timer = setTimeout(() => set(true), 90); });
      dd.addEventListener('pointerleave', () => { clearTimeout(timer); timer = setTimeout(() => set(false), 220); });
    }
    dd.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) { e.stopPropagation(); set(false); btn.focus(); }
      if (e.key === 'ArrowDown' && menu.hidden && e.target === btn) { e.preventDefault(); set(true); links[0]?.focus(); }
    });
    dd.addEventListener('focusout', (e) => { if (!dd.contains(e.relatedTarget)) set(false); });
    document.addEventListener('pointerdown', (e) => { if (!dd.contains(e.target)) set(false); });
    for (const a of links) {
      const u = new URL(a.href, location.href);
      if (u.pathname === location.pathname) { a.setAttribute('aria-current', 'page'); btn.classList.add('is-current'); }
    }
  }

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
  // La page défilée : le logo flottant prend son verre (refonte.css).
  el.classList.toggle('is-scrolled', prev > 8);
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 420 && y - prev > 6) el.classList.add('is-away');
    else if (prev - y > 6 || y < 120) el.classList.remove('is-away');
    el.classList.toggle('is-scrolled', y > 8);
    prev = y;
  }, { passive: true });
}
