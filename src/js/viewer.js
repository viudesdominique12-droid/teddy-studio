/**
 * LA VISIONNEUSE — on appuie, l'image s'ouvre en grand.
 *
 * Le site parle par l'encre : le matériel est détouré, les lieux sont des
 * tirages qui flottent, les films sont des titres. Mais derrière chaque signe
 * il y a une PHOTO, et un producteur veut la voir. La visionneuse est ce
 * passage — du signe à la preuve.
 *
 * Elle ouvre depuis n'importe quel `[data-view]`, dont l'attribut porte le
 * fichier grand format, `data-view-label` la légende. Une seule visionneuse
 * pour le matériel, les décors et les affiches.
 *
 * Trois choses la rendent utilisable plutôt que jolie :
 *  1. **elle s'ouvre DEPUIS la vignette** — on mémorise le rectangle de
 *     départ et l'image grandit depuis lui, au lieu d'apparaître au centre.
 *     C'est ce qui fait qu'on sait d'où elle vient, et où on revient ;
 *  2. **le focus est piégé** et rendu à la vignette à la fermeture ;
 *  3. **les flèches passent d'une image à l'autre** dans le même groupe, sans
 *     avoir à fermer et rouvrir.
 */

import gsap from 'gsap';

const DUR_IN = 0.62;
const DUR_OUT = 0.42;
const EASE_IN = 'expo.out';
const EASE_OUT = 'power3.inOut';

let root, img, cap, count, box;
let group = [];
let at = -1;
let from = null;                 /* la vignette d'où l'on vient */
let lastFocus = null;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function build() {
  root = document.createElement('div');
  root.className = 'viewer';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Image viewer');
  root.innerHTML = `
    <div class="viewer__scrim" data-viewer-close></div>
    <figure class="viewer__box">
      <img class="viewer__img" alt="">
      <figcaption class="viewer__cap mono"><span data-viewer-label></span><span class="viewer__n" data-viewer-count></span></figcaption>
    </figure>
    <button class="viewer__x" type="button" data-viewer-close aria-label="Close">
      <span aria-hidden="true"></span><span aria-hidden="true"></span>
    </button>
    <button class="viewer__nav viewer__nav--prev" type="button" data-viewer-step="-1" aria-label="Previous image"></button>
    <button class="viewer__nav viewer__nav--next" type="button" data-viewer-step="1" aria-label="Next image"></button>`;
  document.body.appendChild(root);

  box = root.querySelector('.viewer__box');
  img = root.querySelector('.viewer__img');
  cap = root.querySelector('[data-viewer-label]');
  count = root.querySelector('[data-viewer-count]');

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-viewer-close]')) { close(); return; }
    const step = e.target.closest('[data-viewer-step]');
    if (step) go(at + Number(step.dataset.viewerStep));
  });
}

/** Charge l'image et sa légende, sans toucher à l'animation d'ouverture. */
function paint(i) {
  const el = group[i];
  img.src = el.dataset.view;
  img.alt = el.dataset.viewAlt || el.querySelector('img')?.alt || '';
  cap.textContent = el.dataset.viewLabel || '';
  count.textContent = group.length > 1 ? `${i + 1} / ${group.length}` : '';
  root.classList.toggle('is-alone', group.length < 2);
  at = i;
}

function go(i) {
  if (group.length < 2) return;
  paint((i + group.length) % group.length);
  if (reduced()) return;
  gsap.fromTo(img, { autoAlpha: 0, scale: 0.98 },
    { autoAlpha: 1, scale: 1, duration: 0.34, ease: 'power2.out' });
}

function open(el) {
  lastFocus = document.activeElement;
  const scope = el.closest('[data-view-group]') || document;
  group = [...scope.querySelectorAll('[data-view]')];
  paint(Math.max(0, group.indexOf(el)));

  root.hidden = false;
  document.documentElement.classList.add('is-locked');
  root.querySelector('.viewer__x').focus({ preventScroll: true });

  if (reduced()) { gsap.set(root, { autoAlpha: 1 }); return; }

  // L'ouverture part du rectangle de la vignette : l'image grandit depuis
  // l'endroit où on a appuyé, elle n'apparaît pas de nulle part.
  const src = (el.querySelector('img, video') || el).getBoundingClientRect();
  from = src;
  gsap.set(root, { autoAlpha: 1 });
  gsap.fromTo(root.querySelector('.viewer__scrim'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });

  const t = box.getBoundingClientRect();
  if (t.width && src.width) {
    gsap.fromTo(box, {
      x: src.left + src.width / 2 - (t.left + t.width / 2),
      y: src.top + src.height / 2 - (t.top + t.height / 2),
      scale: Math.max(0.12, src.width / t.width),
      autoAlpha: 0.4
    }, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: DUR_IN, ease: EASE_IN });
  }
}

function close() {
  const done = () => {
    root.hidden = true;
    document.documentElement.classList.remove('is-locked');
    lastFocus?.focus({ preventScroll: true });
    gsap.set(box, { clearProps: 'transform,opacity' });
  };
  if (reduced()) { done(); return; }

  // Et elle repart vers la vignette — le même chemin, en sens inverse.
  const t = box.getBoundingClientRect();
  const back = from && from.width
    ? { x: from.left + from.width / 2 - (t.left + t.width / 2),
        y: from.top + from.height / 2 - (t.top + t.height / 2),
        scale: Math.max(0.12, from.width / t.width) }
    : { scale: 0.94 };
  gsap.to(root.querySelector('.viewer__scrim'), { autoAlpha: 0, duration: DUR_OUT });
  gsap.to(box, { ...back, autoAlpha: 0, duration: DUR_OUT, ease: EASE_OUT, onComplete: done });
}

export function initViewer() {
  if (window.__teddyViewer) return;
  if (!document.querySelector('[data-view]')) return;
  window.__teddyViewer = true;
  build();

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-view]');
    if (!el || root.contains(el)) return;
    e.preventDefault();
    open(el);
  });

  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1); }
    else if (e.key === 'Tab') {
      // Le focus ne doit pas s'échapper derrière la visionneuse.
      const f = [...root.querySelectorAll('button')].filter((n) => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}
