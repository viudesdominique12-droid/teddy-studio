/**
 * PORTFOLIO — la galerie de tous les projets (brief §12, 17/10/2026),
 * devenue le 18/10 « la salle de projection, puis la salle d'archives ».
 *
 * Tout vient de src/data/portfolio.js : ajouter une fiche suffit pour qu'un
 * projet apparaisse ici, dans son filtre, sur l'écran de l'ouverture (s'il
 * est `featured`) et dans la page de sa division.
 *
 *   screen()   l'ouverture : les images des projets mis en avant passent sur
 *              un écran, la légende dit lequel et ce qu'il est ; le faisceau
 *              du projecteur (portfolio-beam.js) vacille à chaque image ;
 *   grid()     les tirages sur la table lumineuse, les mises en avant
 *              d'abord, la dernière rangée centrée ; une affiche en hauteur
 *              s'y montre entière (`portrait`, src/data/portfolio.js) ;
 *              les tiroirs (Tout + les sept catégories)
 *              changent la table en fondu enchaîné et s'écrivent dans
 *              l'adresse (?cat=film) ; une catégorie vide ouvre un tiroir sur
 *              une boîte de bobine scellée qui mène à sa division ; les
 *              étiquettes de la légende éclairent les tirages qui les portent
 *              (survol, ou toucher / clavier pour les épingler) ;
 *   sheet()    la fiche d'un projet, en projection : depuis un tirage, depuis
 *              l'écran, ou depuis /portfolio.html#<slug> (les cartes des pages
 *              de division y mènent). Retour arrière et Échap la ferment ;
 *              ← → passent au projet voisin.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { CATEGORIES, STATUS, ROLES, projects } from '../../data/portfolio.js';
import { divisionById } from '../../data/divisions.js';
import { initBeam } from './portfolio-beam.js';
import { live, tableOn, loupe, near, reel } from './portfolio-archive.js';

gsap.registerPlugin(ScrollTrigger);

/* Les catégories du portfolio et les divisions qui les portent. */
const CAT_DIV = { live: 'live', events: 'events', ai: 'ai', music: 'music', film: 'film', doc: 'doc', tech: 'rentals' };
const WHAT = {
  live: 'broadcasts', events: 'events', ai: 'AI productions', music: 'music projects',
  film: 'films', doc: 'documentaries', tech: 'technical productions'
};
const STATUS_NOTE = {
  client: 'Made for a client.',
  own: 'Produced by us.',
  demo: 'Made to show an idea or a capability, not for a client.',
  third: 'Another company’s production that we contributed to.',
  worked: 'A production we have worked on.'
};
/* L'inclinaison de chaque tirage posé sur la table (en degrés). */
const TILT = [-0.9, 0.7, -0.45, 1.1, -1.2, 0.55, -0.7, 0.95];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const catOf = (id) => CATEGORIES.find((c) => c.id === id);
const divOf = (catId) => divisionById[CAT_DIV[catId]];
const accentOf = (catId) => divOf(catId)?.accent || 'var(--dv)';
const bySlug = (slug) => projects.find((p) => p.slug === slug);
/* Les mises en avant d'abord, puis l'ordre du fichier. */
const ordered = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];
const noOf = (slug) => ordered.findIndex((p) => p.slug === slug) + 1;
const imagesOf = (p) => [...new Set([p.posterFull || p.poster, ...(p.stills || [])].filter(Boolean))];
/* L'affiche d'un tirage : sur téléphone (une colonne), la version de 720 px
   suffit, même sur un écran ×3 ; au-delà, l'affiche entière, comme avant
   (la loupe de l'ordinateur la lit). */
const posterSet = (p) => (p.posterMid && p.posterFull
  ? ` srcset="${esc(p.posterMid)} 720w, ${esc(p.posterFull)} 1280w" sizes="(max-width: 44rem) 60vw, 1280px"` : '');
/* L'affiche en hauteur (`portrait`, 23/10/2026) : entière dans le cadre
   (`object-fit: contain`), sa copie floutée en fond de la même image (`--bd`)
   pour remplir les côtés. L'original suffit partout (≤ 424 px) et la loupe
   le lit. */
const bdOf = (p) => (p.portrait && p.backdrop ? ` style="--bd:url('${esc(p.backdrop)}')"` : '');
const fullDims = (p) => (p.portrait && p.posterSize ? p.posterSize.full : [1280, 720]);
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

const still = reduced();
let current = 'all';
let beam = null;

/* La grille d'abord : le démarrage commun mesure ensuite la page entière. */
const grid = initGrid();
bootDivision();
structuredData();
beam = initBeam(document.querySelector('.pf-hero'), document.querySelector('[data-screen-frame]'));
initScreen();
const sheet = initSheet();
grid?.ready();
live();
reel(document.querySelector('[data-reel]'));
heroExit();

/* La liste des projets en données structurées, tirée du même fichier. */
function structuredData() {
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Teddy Studio — selected work',
    itemListElement: ordered.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': p.category === 'film' ? 'Movie' : 'CreativeWork',
        name: p.title,
        ...(p.aka ? { alternateName: p.aka } : {}),
        ...(p.year ? { dateCreated: String(p.year) } : {}),
        url: `${location.origin}/portfolio.html#${p.slug}`,
        image: `${location.origin}${p.posterFull || p.poster}`
      }
    }))
  });
  document.head.append(s);
}

/* Observe un élément : `cb(true)` tant qu'il est à l'écran et l'onglet visible. */
function watch(el, cb) {
  let seen = false;
  const fire = () => cb(seen && !document.hidden);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; fire(); }).observe(el);
  document.addEventListener('visibilitychange', fire);
}

/* Quand on quitte la salle, la lampe baisse. L'entrée de l'ouverture une
   fois jouée, le faisceau se recale sur l'écran. */
function heroExit() {
  const hero = document.querySelector('.pf-hero');
  if (!hero || !beam) return;
  window.setTimeout(() => beam.measure(), still ? 0 : 1700);
  if (still) return;
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top',
    onUpdate: (self) => beam.level(1 - self.progress * 0.9)
  });
}

/* ═══════════════════ L'ÉCRAN DE L'OUVERTURE ═══════════════════ */
function initScreen() {
  const box = document.querySelector('[data-screen]');
  if (!box) return;
  const frame = box.querySelector('[data-screen-frame]');
  const ticks = box.querySelector('[data-screen-ticks]');
  const tTitle = box.querySelector('[data-screen-title]');
  const tSt = box.querySelector('[data-screen-st]');
  const tN = box.querySelector('[data-screen-n]');
  const tTotal = box.querySelector('[data-screen-total]');

  // Les images, une par une, en alternant les projets mis en avant.
  const feat = ordered.filter((p) => p.featured);
  const lists = feat.map((p) => ((p.stills?.length ? p.stills : [p.posterFull || p.poster]).filter(Boolean)).map((src) => ({ p, src })));
  const slides = [];
  for (let i = 0; i < Math.max(0, ...lists.map((l) => l.length)); i++) lists.forEach((l) => l[i] && slides.push(l[i]));
  if (!slides.length) { box.hidden = true; return; }

  const first = frame.querySelector('img');
  // Une affiche en hauteur passe entière sur l'écran, sa copie floutée autour.
  const tall = (img, s) => {
    const on = !!(s.p.portrait && s.src === s.p.posterFull);
    img.classList.toggle('is-portrait', on);
    if (!on) return;
    if (s.p.backdrop) img.style.setProperty('--bd', `url('${s.p.backdrop}')`);
    if (s.p.posterSize) [img.width, img.height] = s.p.posterSize.full;
  };
  const imgs = slides.map((s, i) => {
    if (i === 0 && first) { first.src = s.src; first.alt = `${s.p.title}${s.p.aka ? ` (${s.p.aka})` : ''}`; tall(first, s); return first; }
    const img = new Image();
    img.className = 'pf-screen__img'; img.alt = `${s.p.title}${s.p.aka ? ` (${s.p.aka})` : ''}`;
    img.decoding = 'async'; img.loading = 'lazy'; img.width = 1280; img.height = 720;
    img.src = s.src;
    tall(img, s);
    frame.insertBefore(img, frame.querySelector('.pf-screen__hit'));
    return img;
  });
  const DUR = 5.2;
  ticks.style.setProperty('--dur', `${DUR}s`);
  ticks.innerHTML = slides.map((s, i) => `<button type="button" aria-label="Image ${i + 1}: ${esc(s.p.title)}"><i></i></button>`).join('');
  const dots = [...ticks.children];
  tTotal.textContent = pad(slides.length);

  let at = -1;
  const go = (i, first = false) => {
    if (i === at) return;
    at = (i + slides.length) % slides.length;
    const s = slides[at];
    imgs.forEach((img, j) => img.classList.toggle('is-on', j === at));
    dots.forEach((d, j) => {
      d.classList.remove('is-on');
      d.classList.toggle('is-done', j < at);
      d.setAttribute('aria-current', j === at ? 'true' : 'false');
    });
    void ticks.offsetWidth;                       // relance la jauge
    dots[at].classList.add('is-on');
    const st = `${STATUS[s.p.status] || ''} · ${catOf(s.p.category)?.label || ''}`;
    tN.textContent = pad(at + 1);
    if (!first) beam?.blink();
    if (first || still || tTitle.textContent === s.p.title) {
      tTitle.textContent = s.p.title; tSt.textContent = st;
    } else {
      gsap.timeline()
        .to([tTitle, tSt], { yPercent: -60, autoAlpha: 0, duration: 0.35, ease: 'power2.in', stagger: 0.04 })
        .add(() => { tTitle.textContent = s.p.title; tSt.textContent = st; })
        .fromTo([tTitle, tSt], { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05 });
    }
  };
  go(0, true);

  box.querySelectorAll('[data-screen-open]').forEach((b) => b.addEventListener('click', () => sheet?.open(slides[at].p.slug)));
  dots.forEach((d, i) => d.addEventListener('click', () => { go(i); restart(); }));

  if (still) { box.classList.add('is-still'); return; }
  let on = false;
  let held = false;
  let timer = 0;
  const restart = () => { clearInterval(timer); timer = window.setInterval(() => { if (on && !held) go(at + 1); }, DUR * 1000); };
  watch(box, (v) => { on = v; box.classList.toggle('is-paused', !v); });
  box.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; held = true; box.classList.add('is-held'); });
  box.addEventListener('pointerleave', () => { held = false; box.classList.remove('is-held'); });
  restart();
}

/* ═══════════════════ LA TABLE, LES TIROIRS, LES ÉTIQUETTES ═══════════════════ */
function initGrid() {
  const gridEl = document.querySelector('[data-grid]');
  const bar = document.querySelector('[data-filters]');
  const count = document.querySelector('[data-count]');
  const prep = document.querySelector('[data-prep]');
  const table = document.querySelector('[data-table]');
  if (!gridEl || !bar) return null;

  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, projects.filter((p) => p.category === c.id).length]));
  const empties = CATEGORIES.filter((c) => !counts[c.id]);

  // Les tiroirs du meuble à fiches : un porte-étiquette, le nombre de
  // projets, une poignée ; la languette de couleur dit la division.
  const chips = [{ id: 'all', label: 'All', n: projects.length }, ...CATEGORIES.map((c) => ({ ...c, n: counts[c.id] }))];
  bar.innerHTML = chips.map((c) => `<button type="button" class="pf-chip${c.n ? '' : ' is-empty'}" data-cat="${c.id}" aria-pressed="false" style="--c:${c.id === 'all' ? 'var(--pf-lamp)' : accentOf(c.id)}">
      <span class="pf-chip__tab" aria-hidden="true"></span><span class="pf-chip__holder"><span>${esc(c.label)}</span></span>${c.n ? `<sup>${pad(c.n)}</sup>` : ''}<span class="pf-chip__pull" aria-hidden="true"></span></button>`).join('');
  const buttons = [...bar.querySelectorAll('.pf-chip')];

  // Les tirages : la photo dans son passe-partout, le statut et le numéro
  // d'archive imprimés sur la marge du bas.
  const cardHTML = (p, i) => {
    const cat = catOf(p.category);
    const meta = [p.credit, ROLES[p.role] && `Our role: ${ROLES[p.role]}`, p.year].filter(Boolean).join(' · ');
    const bg = p.stills?.[0];
    const [fw, fh] = fullDims(p);
    return `<article class="pf-card${bg ? ' has-bg' : ''}${p.portrait ? ' is-portrait' : ''}" data-slug="${esc(p.slug)}" data-cat="${esc(p.category)}" data-st="${esc(p.status)}" style="--c:${accentOf(p.category)};--tilt:${TILT[i % TILT.length]}deg">
      <div class="pf-card__fig">
        <div class="pf-card__pic">
          ${bg ? `<img class="pf-card__bg" src="${esc(bg)}" alt="" loading="lazy" decoding="async" width="1280" height="720">` : ''}
          <img class="pf-card__img" src="${esc(p.posterFull || p.poster)}"${posterSet(p)}${bdOf(p)} alt="" loading="lazy" decoding="async" width="${fw}" height="${fh}">
          <span class="pf-card__flip" aria-hidden="true"></span>
        </div>
        <p class="pf-card__strip"><span class="pf-badge"><span class="pf-mark pf-mark--${esc(p.status)}" aria-hidden="true"></span>${esc(STATUS[p.status] || '')}</span><span class="pf-card__no" aria-hidden="true">No. ${pad(i + 1)}</span></p>
      </div>
      <div class="pf-card__meta">
        <p class="pf-card__k"><span class="pf-card__cat">${esc(cat?.label || '')}</span>${p.aka ? `<span>Released as ${esc(p.aka)}</span>` : ''}</p>
        <h3 class="pf-card__h"><a href="#${esc(p.slug)}" data-open="${esc(p.slug)}" data-cursor="view">${esc(p.title)}</a></h3>
        ${meta ? `<p class="pf-card__m">${esc(meta)}</p>` : ''}
      </div>
    </article>`;
  };
  // À VALIDER : client — la phrase de la tuile « More work on the way ».
  // Un tiroir fermé : son porte-étiquette, sa poignée, et les fiches des
  // divisions qui dépassent (une languette de leur couleur chacune).
  const soonHTML = () => (empties.length ? `<aside class="pf-soon" data-soon aria-labelledby="pf-soon-h">
      <span class="pf-soon__seal" aria-hidden="true"></span>
      <p class="dv-k">Being prepared</p>
      <h3 class="pf-soon__h" id="pf-soon-h">More work on the way</h3>
      <p class="pf-soon__p">We are assembling the portfolios of these divisions. Ask our team for recent references.</p>
      <ul class="pf-soon__l">${empties.map((c) => `<li><a href="${esc(divOf(c.id)?.href || '/services.html')}" style="--c:${accentOf(c.id)}">${esc(c.label)}</a></li>`).join('')}</ul>
      <span class="pf-soon__pull" aria-hidden="true"></span>
    </aside>` : '');
  gridEl.innerHTML = ordered.map(cardHTML).join('') + soonHTML();
  const items = [...gridEl.children];
  const cards = items.filter((el) => el.classList.contains('pf-card'));

  // Le tiroir d'une catégorie encore vide : une boîte de bobine scellée,
  // jamais de faux exemple.
  const prepHTML = (catId) => {
    const c = catOf(catId); const d = divOf(catId);
    const what = WHAT[catId] || 'projects';
    return `<div class="pf-prep__in" style="--c:${accentOf(catId)}">
      <span class="pf-prep__word" aria-hidden="true">${esc(c?.label || '')}</span>
      <div class="pf-prep__can" aria-hidden="true">
        <span class="pf-prep__lid"></span>
        <span class="pf-prep__sheen"></span>
        <span class="pf-prep__band"><span>${esc(c?.label || '')}</span></span>
        <span class="pf-prep__tape"></span>
      </div>
      <div class="pf-prep__txt">
        <p class="dv-k">Being prepared</p>
        <h3 class="pf-prep__h">Selected ${esc(what)}, being prepared</h3>
        <p class="pf-prep__p">We are assembling our portfolio for this division. Ask our team for recent references, footage and client contacts.</p>
        <div class="dv-acts">
          ${d ? `<a class="dv-btn" href="${esc(d.href)}#inquiry">Ask for references${ARROW}</a>
          <a class="dv-btn dv-btn--ghost" href="${esc(d.href)}">Visit ${esc(d.name)}</a>` : ''}
        </div>
      </div>
    </div>`;
  };

  /* ── Les étiquettes : survoler en éclaire les tirages, toucher (ou
     Entrée) les épingle ; une étiquette qui n'a aucun tirage dans la vue
     le dit en pâlissant. ── */
  const legend = document.querySelector('[data-legend]');
  const tags = legend ? [...legend.querySelectorAll('.pf-tag')] : [];
  let pinned = null;
  const visibleCards = () => cards.filter((el) => !el.classList.contains('is-hidden'));
  const light = (st) => {
    const hits = st ? visibleCards().filter((el) => el.dataset.st === st) : [];
    gridEl.classList.toggle('is-dim', hits.length > 0);
    cards.forEach((el) => el.classList.toggle('is-hit', hits.includes(el)));
    return hits.length;
  };
  const tagOf = (st) => tags.find((t) => t.closest('li')?.dataset.st === st);
  const nope = (t) => {
    const li = t.closest('li');
    li.classList.add('is-none');
    if (!still) gsap.fromTo(t, { x: -5 }, { x: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.3)', clearProps: 'transform' });
    window.setTimeout(() => li.classList.remove('is-none'), 1400);
  };
  const pin = (st) => {
    pinned = st;
    tags.forEach((t) => t.setAttribute('aria-pressed', String(!!st && t.closest('li').dataset.st === st)));
    const n = light(st);
    setCount();
    if (st && !n) nope(tagOf(st));
  };
  tags.forEach((t) => {
    const st = t.closest('li').dataset.st;
    t.addEventListener('click', () => pin(pinned === st ? null : st));
    if (!LITE) {
      t.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || pinned) return;
        if (!light(st)) t.closest('li').classList.add('is-none');
      });
      t.addEventListener('pointerleave', () => {
        t.closest('li').classList.remove('is-none');
        light(pinned);
      });
    }
  });

  // Au survol, un tirage feuillette ses photos de tournage.
  if (!LITE && !still) {
    cards.forEach((el) => {
      const p = bySlug(el.dataset.slug);
      const extra = (p.stills || []).slice(el.classList.contains('has-bg') ? 1 : 0);
      if (!extra.length) return;
      const flip = el.querySelector('.pf-card__flip');
      let timer = 0; let k = -1; let built = false;
      const show = (i) => flip.querySelectorAll('img').forEach((img, j) => img.classList.toggle('is-on', j === i));
      el.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (!built) {
          built = true;
          flip.innerHTML = extra.map((src) => `<img src="${esc(src)}" alt="" decoding="async">`).join('');
        }
        k = 0; show(k);
        clearInterval(timer);
        timer = window.setInterval(() => { k = (k + 1) % (extra.length + 1); show(k === extra.length ? -1 : k); }, 1100);
      });
      el.addEventListener('pointerleave', () => { clearInterval(timer); show(-1); });
    });
  }

  function setCount() {
    const vis = visibleCards().length;
    const c = current === 'all' ? null : catOf(current);
    let txt = vis
      ? `${vis} project${vis > 1 ? 's' : ''}${c ? ` · ${c.label}` : ' · All categories'}`
      : `${c?.label || ''} · Being prepared`;
    if (pinned && vis) {
      const n = visibleCards().filter((el) => el.dataset.st === pinned).length;
      txt += ` · ${n} labelled “${STATUS[pinned]}”`;
    }
    if (count.textContent === txt) return;
    count.textContent = txt;
    if (!still) gsap.fromTo(count, { autoAlpha: 0.2, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
  }

  const writeUrl = () => {
    const u = new URL(location.href);
    if (current === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', current);
    history.replaceState(history.state, '', `${u.pathname}${u.search}${u.hash}`);
  };

  const nearby = near(gridEl);
  // L'entrée des tirages (posée par ready()) : un premier filtre la solde.
  let settle = () => {};

  /* Changer de tiroir : les tirages affichés s'effacent, la table change,
     les nouveaux tombent un à un pendant que la table prend sa hauteur.
     (18/10 : l'ancienne réorganisation GSAP Flip faisait voler les tirages
     les uns sur les autres et la galerie s'écrasait un instant.) */
  const box = table || gridEl;           // la table : la galerie ET le tiroir vide
  let swap = null;

  /* Une dernière rangée incomplète se centre (23/10/2026 : avec sept films,
     « All » laissait un trou après la tuile « More work on the way », et
     « Feature Films » un tirage seul à gauche). Douze colonnes : trois tirages
     par rangée à l'ordinateur (deux à côté de la grande carte), deux sur
     tablette ; sur téléphone, une seule colonne. */
  const mid = matchMedia('(max-width: 64rem)');
  const one = matchMedia('(max-width: 44rem)');
  const centerLast = () => {
    items.forEach((el) => el.style.removeProperty('grid-column'));
    if (one.matches) return;
    const vis = items.filter((el) => !el.classList.contains('is-hidden'));
    const per = mid.matches ? 2 : 3;
    let rest = vis.filter((el) => !el.classList.contains('is-big'));
    if (!mid.matches && vis[0]?.classList.contains('is-big')) rest = rest.slice(2);
    const k = rest.length % per;
    if (!k) return;
    const span = 12 / per;
    const at = (12 - k * span) / 2 + 1;
    rest.slice(-k).forEach((el, j) => { el.style.gridColumn = `${at + j * span} / span ${span}`; });
  };
  [mid, one].forEach((m) => m.addEventListener?.('change', centerLast));

  const render = (catId, animate) => {
    items.forEach((el) => {
      const show = el.hasAttribute('data-soon') ? catId === 'all' : (catId === 'all' || el.dataset.cat === catId);
      el.classList.toggle('is-hidden', !show);
      el.classList.remove('is-big');
    });
    const vis = visibleCards();
    if (vis.length >= 3) vis[0].classList.add('is-big');
    centerLast();
    setCount();
    nearby?.watch(vis);

    // La catégorie vide : le tiroir s'ouvre sur sa boîte scellée.
    const empty = catId !== 'all' && !vis.length;
    table?.classList.toggle('is-drawer', empty);
    if (empty) {
      prep.innerHTML = prepHTML(catId);
      prep.hidden = false;
      if (animate) openDrawer(prep.firstElementChild);
    } else if (!prep.hidden) {
      prep.hidden = true; prep.innerHTML = '';
    }
  };

  const apply = (catId, { animate = true, url = true } = {}) => {
    if (!chips.some((c) => c.id === catId)) catId = 'all';
    current = catId;
    if (animate) settle();
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === catId)));
    if (pinned) { pinned = null; tags.forEach((t) => t.setAttribute('aria-pressed', 'false')); light(null); }
    if (url) writeUrl();

    swap?.kill();
    gsap.killTweensOf(box, 'height');
    if (!animate || still) {
      gsap.set(items, { clearProps: 'transform,opacity,visibility' });
      gsap.set(box, { clearProps: 'height' });
      render(catId, false);
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return;
    }
    const out = items.filter((el) => !el.classList.contains('is-hidden'));
    if (!prep.hidden && prep.firstElementChild) out.push(prep.firstElementChild);
    const h0 = box.offsetHeight;
    gsap.set(box, { height: h0 });
    swap = gsap.timeline()
      .to(out, { autoAlpha: 0, y: -8, duration: 0.22, ease: 'power2.in', stagger: 0.02 })
      .add(() => {
        gsap.set(items, { clearProps: 'transform,opacity,visibility' });
        render(catId, true);
        gsap.set(box, { clearProps: 'height' });
        const h1 = box.offsetHeight;
        gsap.fromTo(box, { height: h0 }, { height: h1, duration: 0.55, ease: 'power3.inOut', clearProps: 'height' });
        const next = items.filter((el) => !el.classList.contains('is-hidden'));
        if (!next.length) { ScrollTrigger.refresh(); return; }
        gsap.fromTo(next, { autoAlpha: 0, y: 22 }, {
          autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06,
          clearProps: 'transform,opacity,visibility', onComplete: () => ScrollTrigger.refresh()
        });
      });
  };

  // Le tiroir sort, la boîte glisse en place, le ruban de scellé s'enroule.
  function openDrawer(el) {
    const can = el.querySelector('.pf-prep__can');
    const tape = el.querySelector('.pf-prep__tape');
    const txt = el.querySelector('.pf-prep__txt');
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo(el, { autoAlpha: 0, y: 28, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, clearProps: 'transform,opacity,visibility' }, 0.12)
      .fromTo(can, { xPercent: -30, rotation: -50, autoAlpha: 0 }, { xPercent: 0, rotation: 0, autoAlpha: 1, duration: 1.2, clearProps: 'transform,opacity,visibility' }, 0.2)
      .fromTo(tape, { '--wrap': '0deg' }, { '--wrap': '360deg', duration: 1, ease: 'power2.inOut', clearProps: '--wrap' }, 0.7)
      .fromTo(txt.children, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.35);
  }

  bar.addEventListener('click', (e) => {
    const b = e.target.closest('.pf-chip');
    if (!b || b.dataset.cat === current) return;
    apply(b.dataset.cat);
    // Sur le ruban qui défile (téléphone), le tiroir choisi vient au milieu.
    if (bar.scrollWidth > bar.clientWidth + 2) {
      const x = b.offsetLeft + b.offsetWidth / 2 - bar.clientWidth / 2;
      bar.scrollTo({ left: Math.max(0, x), behavior: still ? 'auto' : 'smooth' });
    }
  });

  // Ouvrir une fiche depuis un tirage.
  gridEl.addEventListener('click', (e) => {
    const a = e.target.closest('[data-open]');
    if (!a) return;
    e.preventDefault();
    sheet?.open(a.dataset.open);
  });

  loupe(gridEl);
  tableOn(table);

  return {
    /* L'état de départ : ?cat= dans l'adresse, sinon tout ; puis chaque
       chose entre à sa manière quand elle arrive : les étiquettes se
       suspendent, les tiroirs se rangent, les tirages tombent sur la table. */
    ready() {
      const q = new URLSearchParams(location.search).get('cat');
      apply(q && chips.some((c) => c.id === q) ? q : 'all', { animate: false, url: false });
      if (still) return;
      /* Les entrées jouent sur l'opacité seule (jamais `visibility`) : tout
         reste atteignable au clavier ; et dès que le focus entre dans
         l'archive avant elles, tout apparaît d'un coup. */
      const pending = new Set();
      const once = (trigger, fn, start = 'top 86%') => {
        let st = null;
        let done = false;
        const run = () => { if (done) return; done = true; pending.delete(run); st?.kill(); fn(); };
        pending.add(run);
        st = ScrollTrigger.create({ trigger, start, onEnter: run });
        if (done) st.kill();
      };

      if (legend && tags.length) {
        gsap.set(tags, { opacity: 0, rotation: -16, y: -12 });
        once(legend, () => gsap.to(tags, { opacity: 1, rotation: 0, y: 0, duration: 1.6, ease: 'elastic.out(1, 0.42)', stagger: 0.09, clearProps: 'transform,opacity' }));
      }
      gsap.set(buttons, { opacity: 0, y: 18 });
      once(bar, () => gsap.to(buttons, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.045, clearProps: 'transform,opacity' }), 'top 92%');

      const els = [...items, prep].filter((el) => !el.classList.contains('is-hidden') && !el.hidden);
      gsap.set(els, { opacity: 0, y: LITE ? 26 : -22, scale: LITE ? 1 : 1.035 });
      const drop = (batch, delay = 0.25) => gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: LITE ? 'power3.out' : 'back.out(1.25)', stagger: 0.1, delay, clearProps: 'transform,opacity' });
      const io = new IntersectionObserver((entries) => {
        const batch = entries.filter((x) => x.isIntersecting).map((x) => x.target);
        if (!batch.length) return;
        batch.forEach((el) => { io.unobserve(el); waiting.delete(el); });
        drop(batch);
      }, { rootMargin: '0px 0px -6% 0px' });
      const waiting = new Set(els);
      els.forEach((el) => io.observe(el));

      /* Un tirage qui attend encore sa chute n'a plus à l'attendre dès qu'on
         filtre : le fondu doit partir d'un état net (sinon il restait invisible). */
      settle = () => {
        settle = () => {};
        io.disconnect();
        const rest = [...waiting]; waiting.clear();
        if (rest.length) { gsap.killTweensOf(rest); gsap.set(rest, { clearProps: 'transform,opacity' }); }
      };

      const work = document.getElementById('work');
      const all = () => {
        work?.removeEventListener('focusin', all);
        pending.forEach((run) => run()); pending.clear();
        if (waiting.size) { io.disconnect(); drop([...waiting], 0); waiting.clear(); }
      };
      work?.addEventListener('focusin', all);
    },
    visibleSlugs: () => visibleCards().map((el) => el.dataset.slug)
  };
}

/* ═══════════════════ LA FICHE D'UN PROJET : LA PROJECTION ═══════════════════ */
function initSheet() {
  const dlg = document.querySelector('[data-dlg]');
  if (!dlg || typeof dlg.showModal !== 'function') return null;
  const panel = dlg.querySelector('.pf-dlg__panel');
  const scrim = dlg.querySelector('.pf-dlg__scrim');
  const main = dlg.querySelector('[data-dlg-main]');
  const shutter = dlg.querySelector('[data-dlg-shutter]');
  const thumbs = dlg.querySelector('[data-dlg-thumbs]');
  const no = dlg.querySelector('[data-dlg-no]');
  const cat = dlg.querySelector('[data-dlg-cat]');
  const title = dlg.querySelector('[data-dlg-title]');
  const aka = dlg.querySelector('[data-dlg-aka]');
  const dl = dlg.querySelector('[data-dlg-dl]');
  const acts = dlg.querySelector('[data-dlg-acts]');
  const nav = dlg.querySelector('[data-dlg-nav]');

  let at = null;          // le projet ouvert
  let pushed = false;     // l'ouverture a-t-elle ajouté une entrée d'historique ?
  let closing = false;
  let lastFocus = null;

  const list = () => {
    const vis = grid?.visibleSlugs() || [];
    return vis.includes(at) ? vis : ordered.map((p) => p.slug);
  };

  /* Une nouvelle image : l'obturateur bat, la lampe éclaire la suivante.
     Une affiche en hauteur (`tall`) n'est jamais montrée plus grande que ses
     pixels (`is-portrait`, comme dans les visionneuses de l'accueil et de
     Feature Film) ; sur téléphone, la salle passe alors en hauteur
     (`is-tall`) pour qu'elle y tienne à sa vraie taille. */
  const media = main.closest('.pf-dlg__media');
  const showImage = (src, alt, animate, tall = false) => {
    const img = new Image();
    img.src = src; img.alt = alt; img.decoding = 'async';
    img.className = `pf-dlg__img${tall ? ' is-portrait' : ''}`;
    const old = [...main.querySelectorAll('img')];
    const put = () => { media?.classList.toggle('is-tall', tall); main.append(img); old.forEach((o) => o.remove()); };
    if (!animate || still) { put(); return; }
    gsap.timeline()
      .to(shutter, { autoAlpha: 1, duration: 0.11, ease: 'power1.in' })
      .add(put)
      .fromTo(img, { scale: 1.035 }, { scale: 1, duration: 0.9, ease: 'expo.out' })
      .to(shutter, { autoAlpha: 0, duration: 0.42, ease: 'power2.out' }, '<');
  };

  const fill = (p, animate) => {
    const c = catOf(p.category);
    const d = divOf(p.category);
    panel.style.setProperty('--c', accentOf(p.category));
    no.textContent = `No. ${pad(noOf(p.slug))} / ${pad(ordered.length)}`;
    cat.textContent = c?.label || '';
    title.textContent = p.title;
    aka.textContent = p.aka ? `Released as ${p.aka}` : '';
    aka.hidden = !p.aka;

    const rows = [
      ['Status', `<span class="pf-badge pf-badge--flat"><span class="pf-mark pf-mark--${esc(p.status)}" aria-hidden="true"></span>${esc(STATUS[p.status] || '')}</span><span class="pf-dlg__note">${esc(STATUS_NOTE[p.status] || '')}</span>`],
      ['Category', esc(c?.label || '')],
      p.credit && ['Credit', esc(p.credit)],
      ROLES[p.role] && ['Our role', esc(ROLES[p.role])],
      p.year && ['Year', esc(p.year)],
      d && ['Division', `<a class="dv-link" href="${esc(d.href)}">${esc(d.name)}</a>`]
    ].filter(Boolean);
    dl.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    acts.innerHTML = d ? `<a class="dv-btn" href="${esc(d.href)}#inquiry">${esc(d.cta)}${ARROW}</a>` : '';

    // Les images : l'affiche, puis les photos de tournage, sur une bande de pellicule.
    const imgs = imagesOf(p);
    const altOf = (i) => (i === 0 ? `${p.title}, poster` : `${p.title}, still ${i}`);
    const tallOf = (src) => !!(p.portrait && src === p.posterFull);
    showImage(imgs[0], altOf(0), animate, tallOf(imgs[0]));
    // L'affiche en hauteur reste entière jusque dans sa vignette.
    const tallThumb = (src) => (tallOf(src) ? ` class="is-portrait"${bdOf(p)}` : '');
    thumbs.innerHTML = imgs.length > 1
      ? imgs.map((src, i) => `<button type="button" class="${i ? '' : 'is-on'}" aria-pressed="${i ? 'false' : 'true'}" aria-label="${esc(altOf(i))}"><img src="${esc(src)}"${tallThumb(src)} alt="" decoding="async"></button>`).join('')
      : '';
    thumbs.hidden = imgs.length < 2;
    [...thumbs.children].forEach((b, i) => b.addEventListener('click', () => {
      if (b.classList.contains('is-on')) return;
      [...thumbs.children].forEach((x, j) => { x.classList.toggle('is-on', j === i); x.setAttribute('aria-pressed', String(j === i)); });
      showImage(imgs[i], altOf(i), true, tallOf(imgs[i]));
    }));

    // Les voisins
    const l = list(); const k = l.indexOf(p.slug);
    const prev = l.length > 1 ? bySlug(l[(k - 1 + l.length) % l.length]) : null;
    const next = l.length > 1 ? bySlug(l[(k + 1) % l.length]) : null;
    nav.innerHTML = prev && next ? `
      <button type="button" data-go="${esc(prev.slug)}"><span class="dv-mono">Previous</span><b>${esc(prev.title)}</b></button>
      <button type="button" data-go="${esc(next.slug)}"><span class="dv-mono">Next</span><b>${esc(next.title)}</b></button>` : '';
  };

  /* Les lignes de la carte d'archive s'écrivent l'une après l'autre. */
  const writeRows = () => {
    if (still) return;
    gsap.fromTo(dl.children, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out', delay: 0.25, clearProps: 'transform,opacity,visibility' });
  };

  const lock = (on) => {
    document.documentElement.classList.toggle('is-locked', on);
    window.__lenis?.[on ? 'stop' : 'start']();
  };

  const open = (slug, { push = true } = {}) => {
    const p = bySlug(slug);
    if (!p) return false;
    const was = dlg.open;
    const swap = was && at !== slug;
    at = slug;
    const info = dlg.querySelector('.pf-dlg__info');
    if (swap && !still) {
      gsap.to(info, { autoAlpha: 0, y: 10, duration: 0.25, ease: 'power2.in', onComplete: () => {
        fill(p, true);
        gsap.fromTo(info, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', clearProps: 'transform,opacity,visibility' });
        writeRows();
      } });
    } else fill(p, false);

    if (!was) {
      lastFocus = document.activeElement;
      closing = false;
      dlg.showModal();
      dlg.classList.add('is-live');
      lock(true);
      panel.scrollTop = 0;
      if (!still) {
        // L'iris de l'objectif s'ouvre sur l'image ; un éclair de lampe.
        gsap.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
        gsap.fromTo(panel, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform' });
        gsap.fromTo(main, { clipPath: 'circle(0% at 50% 50%)', scale: 1.05 }, { clipPath: 'circle(75% at 50% 50%)', scale: 1, duration: 1.25, ease: 'expo.inOut', delay: 0.1, clearProps: 'clipPath,transform' });
        gsap.fromTo(shutter, { autoAlpha: 0 }, { keyframes: [{ autoAlpha: 0.55, duration: 0.08 }, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }], delay: 0.45 });
        writeRows();
      }
    }
    const hash = `#${slug}`;
    if (location.hash !== hash) {
      if (push && !was) { history.pushState({ pf: slug }, '', `${location.pathname}${location.search}${hash}`); pushed = true; }
      else history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
    }
    return true;
  };

  const close = ({ fromHistory = false } = {}) => {
    if (!dlg.open || closing) return;
    closing = true;
    const done = () => {
      dlg.close();
      dlg.classList.remove('is-live');
      lock(false);
      closing = false;
      at = null;
      main.innerHTML = '';
      gsap.set([scrim, panel, shutter], { clearProps: 'all' });
      const card = lastFocus?.isConnected ? lastFocus : null;
      card?.focus?.({ preventScroll: true });
    };
    if (still) done();
    else {
      // La lampe s'éteint : l'image se referme en iris, puis la fiche s'en va.
      gsap.to(main, { clipPath: 'circle(0% at 50% 50%)', duration: 0.45, ease: 'power3.in' });
      gsap.to(scrim, { autoAlpha: 0, duration: 0.5, ease: 'power2.in', delay: 0.05 });
      gsap.to(panel, { autoAlpha: 0, y: 30, duration: 0.45, ease: 'power3.in', delay: 0.08, onComplete: () => { gsap.set(main, { clearProps: 'clipPath' }); done(); } });
    }
    if (!fromHistory) {
      if (pushed) { pushed = false; history.back(); }
      else history.replaceState(history.state, '', `${location.pathname}${location.search}`);
    } else pushed = false;
  };

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-dlg-close]')) { close(); return; }
    const go = e.target.closest('[data-go]');
    if (go) open(go.dataset.go, { push: false });
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const b = nav.querySelectorAll('[data-go]')[e.key === 'ArrowLeft' ? 0 : 1];
    if (b) { e.preventDefault(); open(b.dataset.go, { push: false }); }
  });

  // L'adresse commande : retour arrière, lien direct, ancre tapée à la main.
  const fromHash = () => decodeURIComponent(location.hash.slice(1));
  const sync = () => {
    const slug = fromHash();
    if (slug && bySlug(slug)) { if (at !== slug) open(slug, { push: false }); }
    else if (dlg.open) close({ fromHistory: true });
  };
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
  if (bySlug(fromHash())) window.setTimeout(() => open(fromHash(), { push: false }), still ? 0 : 450);

  return { open: (slug) => open(slug) };
}
