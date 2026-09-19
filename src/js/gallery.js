/**
 * LA GALERIE INFINIE — une bande de cartes qu'on tire à l'infini.
 *
 * Deux tuiles identiques côte à côte, et un modulo sur la position : quand on
 * dépasse d'une tuile, la seconde a exactement pris la place de la première,
 * et le wrap est invisible. Ni Draggable ni InertiaPlugin — `Observer` capte
 * molette, tactile et pointeur dans une seule API, et `quickTo` donne une
 * inertie plus prévisible.
 */

import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(Observer, ScrollTrigger);

const WHEEL_SPEED = 0.75;
const DRAG_SPEED = 1.25;
const GAP_FACTOR = 0.8;
const CLICK_THRESHOLD = 6;      // px : au-delà, c'est un glissé, pas un tap
const HOVER_DELAY = 100;        // ms avant de lancer une vidéo au survol
const RESUME_DELAY = 250;       // ms après l'arrêt de la grille
const MAX_PREPARED = 10;        // sources vidéo attachées simultanément

const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initGallery() {
  for (const wrapper of document.querySelectorAll('[data-gallery]')) build(wrapper);
}

function build(wrapper) {
  if (wrapper.dataset.galleryReady) return;

  const collection = wrapper.querySelector('[data-gallery-collection]');
  const sourceList = wrapper.querySelector('[data-gallery-list]');
  if (!collection || !sourceList) return;
  wrapper.dataset.galleryReady = '1';

  const originals = [...sourceList.querySelectorAll('[data-gallery-item]')].map((n) => n.cloneNode(true));
  if (!originals.length) return;

  let currentX = 0, currentY = 0;
  let xTo = null, observer = null, setGridFrame = 0;
  let pointerDown = false, downX = 0, downY = 0;
  let lastPointerX = -1, lastPointerY = -1;
  let activeCard = null, hoverTimer = 0, resumeTimer = 0;
  const prepared = [];

  const setStatus = (v) => { wrapper.dataset.galleryStatus = v; };

  /* Résout une longueur CSS (em, rem, vw, clamp…) en pixels par sonde. */
  function cssPx(name, fallback) {
    const raw = getComputedStyle(wrapper).getPropertyValue(name).trim() || fallback;
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;width:${raw}`;
    wrapper.appendChild(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
  }

  function buildGrid() {
    cancelAnimationFrame(setGridFrame);
    observer?.kill();
    setStatus('loading');
    collection.innerHTML = '';

    const colW = cssPx('--gallery-col', '17rem');
    if (!colW) return;
    const gapX = cssPx('--gallery-gap-x', `${colW * GAP_FACTOR}px`);
    const gapY = cssPx('--gallery-gap-y', `${gapX}px`);

    const ratioOf = (el) => {
      const raw = (el.dataset.ratio || '16/9').split(/[:/xX]/);
      const r = Number(raw[0]) / Number(raw[1]);
      return Number.isFinite(r) && r > 0 ? r : 16 / 9;
    };
    const cardH = (el) => colW / ratioOf(el);
    const maxH = Math.max(...originals.map(cardH));

    const cellW = colW + gapX;
    const cellH = maxH + gapY;
    // le +1 garantit que la tuile est au moins aussi large que le wrapper,
    // sans quoi le wrap laisserait un trou
    const columns = Math.max(2, Math.ceil(wrapper.clientWidth / cellW) + 1);
    const rows = Math.max(1, Math.round(wrapper.clientHeight / cellH));
    const perList = columns * rows;

    const wide = originals.filter((o) => ratioOf(o) >= 1);
    const tall = originals.filter((o) => ratioOf(o) < 1);
    const checker = wide.length > 0 && tall.length > 0;

    // sacs mélangés, re-remplis quand ils se vident, sans répétition immédiate
    const bags = {};
    const draw = (key, pool) => {
      let bag = bags[key];
      if (!bag || !bag.items.length) {
        const items = pool.slice();
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }
        if (bag && bag.last && items[0] === bag.last && items.length > 1) items.push(items.shift());
        bag = bags[key] = { items, last: bag?.last || null };
      }
      const pick = bag.items.shift();
      bag.last = pick;
      return pick;
    };

    const chosen = [];
    for (let i = 0; i < perList; i++) {
      const row = Math.floor(i / columns), col = i % columns;
      chosen.push(checker && (row + col) % 2 === 0
        ? draw('wide', wide)
        : checker ? draw('tall', tall) : draw('all', originals));
    }

    for (let t = 0; t < 2; t++) {
      const list = document.createElement('div');
      list.setAttribute('data-gallery-list', '');
      list.className = 'gal__list';
      list.style.cssText =
        `display:grid;grid-template-columns:repeat(${columns}, ${cellW}px);` +
        `grid-auto-rows:${cellH}px;width:${columns * cellW}px;height:${rows * cellH}px`;
      if (t === 1) list.setAttribute('aria-hidden', 'true');
      for (const src of chosen) {
        const node = src.cloneNode(true);
        if (t === 1) node.setAttribute('aria-hidden', 'true');
        list.appendChild(node);
      }
      collection.appendChild(list);
    }

    setGridFrame = requestAnimationFrame(setGrid);
  }

  function setGrid() {
    const lists = collection.querySelectorAll('[data-gallery-list]');
    // gsap.set(undefined) lève, et l'erreur sortirait du try/catch de l'appelant
    if (!lists[0] || !lists[1]) return;

    const rect = lists[0].getBoundingClientRect();
    const tileW = rect.width, tileH = rect.height;
    if (!tileW) return;

    // PAS de `xPercent` ici. `.gal__collection` est en `display:flex` : la
    // seconde tuile est DÉJÀ posée contre la première par la mise en page.
    // Lui ajouter `xPercent:100` la décalait une seconde fois, et ouvrait un
    // vide large d'exactement une tuile entre les deux — le trou vert qu'on
    // traversait avant que le modulo ne ramène tout d'un coup.
    // (La recette d'origine positionne ses tuiles en absolu ; transposée dans
    //  un flex, le décalage doit venir de la mise en page OU du transform,
    //  jamais des deux.)
    gsap.set(lists, { xPercent: 0 });

    // La boucle : on ne déplace jamais les tuiles, on replie la position du
    // conteneur dans [-tileW, 0]. Les deux tuiles couvrant 2 × tileW et la
    // scène étant toujours plus étroite qu'une tuile (le +1 sur `columns` le
    // garantit), il y a du contenu sous la scène à CHAQUE valeur de x.
    const wrapX = gsap.utils.wrap(-tileW, 0);
    currentX = wrapX((wrapper.clientWidth - tileW) * 0.5);
    currentY = (wrapper.clientHeight - tileH) / 2;

    // `unitize` est obligatoire : le modifier reçoit "-1234px", pas un nombre
    xTo = gsap.quickTo(collection, 'x', {
      duration: 1.2,
      ease: 'expo.out',
      modifiers: { x: gsap.utils.unitize(wrapX) }
    });
    gsap.set(collection, { x: currentX, y: currentY });

    observer = Observer.create({
      target: wrapper,
      type: 'wheel,touch,pointer',
      preventDefault: false,      // le scroll vertical reste à la page
      dragMinimum: 3,
      onPress: () => setStatus('dragging'),
      onRelease: () => setStatus('idle'),
      onStop: () => setStatus('idle'),
      onChangeX: move
    });

    wrapper.style.touchAction = 'pan-y';
    wrapper.style.userSelect = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';
    setStatus('idle');
    prepareVisible();
  }

  function move(self) {
    const isWheel = self.event?.type === 'wheel';
    if (isWheel) {
      setStatus('scrolling');
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => setStatus('idle'), 200);
    }
    const mult = isWheel ? WHEEL_SPEED : DRAG_SPEED;
    const delta = gsap.utils.clamp(-80, 80, self.deltaX * mult);
    // molette : le contenu part dans le sens du scroll ; glissé : il suit le doigt
    currentX += isWheel ? -delta : delta;
    xTo(currentX);
    planResume();
  }

  /* ── les vidéos ── */

  function prepare(video) {
    if (!video || video.dataset.prepared) return;
    video.dataset.prepared = '1';
    video.preload = 'auto';
    if (!video.src && video.dataset.src) video.src = video.dataset.src;
    prepared.push(video);
    while (prepared.length > MAX_PREPARED) {
      const old = prepared.shift();
      if (old && old !== activeCard?.querySelector('video')) {
        old.pause();
        old.removeAttribute('src');
        old.load();
        delete old.dataset.prepared;
      }
    }
  }

  function prepareVisible() {
    const vids = [...collection.querySelectorAll('video')].slice(0, 6);
    for (const v of vids) prepare(v);
  }

  function play(card) {
    const v = card?.querySelector('video');
    if (!v) return;
    prepare(v);
    v.muted = true; v.playsInline = true;   // posés en propriété, pas en attribut
    v.play().catch(() => {});
    card.classList.add('is-playing');
  }

  function stopActive() {
    if (!activeCard) return;
    const v = activeCard.querySelector('video');
    if (v) v.pause();
    activeCard.classList.remove('is-playing');
    activeCard = null;
  }

  function startHover(card) {
    if (card === activeCard) return;
    stopActive();
    activeCard = card;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => play(card), HOVER_DELAY);
  }

  /* La grille peut glisser SOUS un curseur immobile : aucun `pointerover`
     ne part alors, et la carte survolée « colle ». On re-teste donc le point
     une fois la grille arrêtée. */
  function hoverCheck() {
    if (!canHover || pointerDown || lastPointerX < 0) return;
    const el = document.elementFromPoint(lastPointerX, lastPointerY);
    const card = el?.closest?.('[data-gallery-card]');
    card ? startHover(card) : stopActive();
  }
  const isMoving = () => xTo && gsap.isTweening(collection);
  function hoverWhenSettled() {
    if (isMoving()) { clearTimeout(resumeTimer); resumeTimer = setTimeout(hoverWhenSettled, 150); return; }
    hoverCheck();
  }
  function planResume() {
    if (!canHover) return;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(hoverWhenSettled, RESUME_DELAY);
  }

  if (canHover) {
    wrapper.addEventListener('pointermove', (e) => { lastPointerX = e.clientX; lastPointerY = e.clientY; });
    wrapper.addEventListener('pointerover', (e) => {
      const card = e.target.closest?.('[data-gallery-card]');
      if (card && !pointerDown) startHover(card);
    });
    wrapper.addEventListener('pointerout', (e) => {
      if (!e.relatedTarget?.closest?.('[data-gallery-card]')) stopActive();
    });
    wrapper.addEventListener('pointerleave', () => { lastPointerX = -1; stopActive(); });
  }

  wrapper.addEventListener('pointerdown', (e) => { pointerDown = true; downX = e.clientX; downY = e.clientY; });
  wrapper.addEventListener('pointerup', (e) => {
    pointerDown = false;
    const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (canHover) { planResume(); return; }
    if (dist > CLICK_THRESHOLD) return;      // c'était un glissé
    const card = e.target.closest?.('[data-gallery-card]');
    if (!card) return;
    if (card === activeCard) stopActive(); else { stopActive(); activeCard = card; play(card); }
  });

  // On ne laisse pas tourner une vidéo sortie du cadre.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) {
        const v = e.target.querySelector('video');
        if (v) v.pause();
        e.target.classList.remove('is-playing');
      }
    }
  }, { root: wrapper });
  requestAnimationFrame(() => {
    for (const c of collection.querySelectorAll('[data-gallery-card]')) io.observe(c);
  });

  /* Le clavier doit pouvoir traverser la galerie. */
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', 'Project gallery — use the left and right arrow keys');
  wrapper.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = cssPx('--gallery-col', '17rem') * 1.2;
    currentX += e.key === 'ArrowRight' ? -step : step;
    xTo?.(currentX);
  });

  buildGrid();

  // Rebuild seulement si la LARGEUR change : la barre d'adresse mobile
  // fait osciller la hauteur en permanence.
  let lastW = window.innerWidth, rt = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rt);
    rt = setTimeout(buildGrid, 200);
  });
}
