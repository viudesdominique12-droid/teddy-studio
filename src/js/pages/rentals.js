/**
 * EQUIPMENT RENTALS — la planche et le catalogue (17/10/2026).
 *
 * L'ouverture : la vraie caméra de cinéma en 3D (public/kit3d/camera.glb),
 * posée sur son plan technique. Le plan se trace d'abord ; quand le modèle
 * est là, il s'y matérialise et le plan s'efface en filigrane. Sur
 * ordinateur, la caméra tourne lentement, suit à peine la souris et se tourne
 * à la main (glisser) ; la réglette du bas donne l'angle, comme la bague
 * d'un objectif. Sur écran tactile : la photo de la caméra d'abord ; la 3D
 * (le modèle allégé camera-m.glb, sans anticrénelage) la remplace en fondu
 * une fois la page chargée et au repos, sauf sur un réseau lent. Elle est
 * dessinée à 1,25 fois l'écran, rien ne tourne tout seul et rien n'est
 * redessiné tant que rien ne bouge (le geste, la descente de page). Sans
 * WebGL, en économie de données, ou si le modèle ne vient pas, la photo de
 * la caméra prend sa place. En mouvement réduit : le modèle posé, immobile,
 * qu'on peut encore tourner à la main.
 *
 * Le catalogue : tout est tiré de src/data/equipment.js — les catégories, les
 * articles, les cases du formulaire. Le filtre change les fiches en fondu.
 * « Add to quote » coche l'article dans le formulaire ; un petit compteur
 * flottant mène au devis. Les liens ?item=, ?option=, ?category= cochent le
 * formulaire sans recharger la page.
 *
 * Le comptoir (18/10/2026) : la feuille de sortie du matériel et son ticket.
 * Le ticket recopie ce que le visiteur remplit (les articles, aussi ceux
 * ajoutés depuis le catalogue ; les dates et leur durée ; l'opérateur ; le
 * retrait ou la livraison…), et son code-barres se trace à mesure que la
 * feuille se remplit. Il ne lit que le formulaire (événements input /
 * change, et après chaque coche faite par la page) ; l'envoi reste celui
 * d'inquiry.js. La confirmation : le ticket détaché, tamponné « demande, pas
 * une réservation ».
 *
 * Les planches (18/10/2026, rentals-sheets.js) : entre l'ouverture et le
 * comptoir, chaque section vit le bureau d'études — réticule X / Y, fiches
 * cotées qui s'inclinent, bordereau des formules et leurs schémas, câble du
 * déroulé, feuille de conditions tamponnée.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced, breathe } from '../motion.js';
import { equipment, allItems, RENTAL_OPTIONS, DURATIONS } from '../../data/equipment.js';
import { initSheets, plotLine } from './rentals-sheets.js';

gsap.registerPlugin(ScrollTrigger);

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// « Camera Equipment » → « Camera ».
const short = (l) => String(l).replace(/\s+equipment$/i, '');

/* Les photos du parc n'ont pas toutes le même fond : les produits détourés ou
   sur blanc se posent sur la plaque claire (« contain »), les photos de
   scène la remplissent (« cover »). Un article inconnu prend « cover ». */
const FIT = { 'cinema-camera': 'contain', lenses: 'contain', microphones: 'contain' };
/* La vignette d'un article (le formulaire, le compteur : 3 rem de côté) : sa
   version de 144 px, sinon celle de 400. */
const thumbOf = (it) => it?.thumb || it?.imgSmall || '';


/* ═══════════════════════ LE CATALOGUE ═══════════════════════ */

/* La fiche d'un article est une planche (18/10/2026) : la photo sur sa plaque
   de papier millimétré, ses deux cotes (la ligne du haut porte « Fig. 0n »),
   ses repères d'angle ; dessous, le cartouche « Rate / Availability ».
   `.re-item__in` porte tout le visuel : c'est lui qui s'incline sous la main
   (rentals-sheets.js), l'article reste la cible du filtre. */
function itemCard(it, i) {
  const fit = FIT[it.id] || 'cover';
  const small = it.imgSmall ? `${esc(it.imgSmall)} 400w, ` : '';
  return `<article class="re-item" data-cat="${esc(it.category)}" data-id="${esc(it.id)}">
    <div class="re-item__in">
    <div class="re-item__draw">
      <span class="re-dim re-dim--h" aria-hidden="true"><i class="re-dim__l"></i><b class="re-dim__t">Fig. ${pad(i + 1)}</b></span>
      <span class="re-dim re-dim--v" aria-hidden="true"><i class="re-dim__l"></i></span>
      <div class="re-item__fig re-item__fig--${fit}">
        <img src="${esc(it.img)}" srcset="${small}${esc(it.img)} ${it.imgW || 800}w" sizes="(max-width: 40rem) 86vw, (max-width: 72rem) 42vw, 19rem" width="800" height="600" alt="${esc(it.name)}" loading="lazy" decoding="async">
        <span class="re-item__cat">${esc(it.categoryLabel)}</span>
        <i class="re-item__mk" aria-hidden="true"></i>
      </div>
    </div>
    <div class="re-item__body">
      <span class="re-item__n">${pad(i + 1)}${it.tag ? `<span class="re-item__tag">${esc(it.tag)}</span>` : ''}</span>
      <h3 class="re-item__h">${esc(it.name)}</h3>
      <p class="re-item__p">${esc(it.body)}</p>
      <dl class="re-item__spec">
        <div><dt>Rate</dt><dd>${it.price ? esc(it.price) : 'Price on request'}</dd></div>
        <div><dt>Availability</dt><dd>${it.availability ? esc(it.availability) : 'Confirmed on request'}</dd></div>
      </dl>
      <div class="re-item__acts">
        <button type="button" class="re-add" data-add="${esc(it.id)}" aria-pressed="false" aria-label="Add ${esc(it.name)} to your quote">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path class="re-add__p" d="M12 5v14M5 12h14"/><path class="re-add__c" d="m5 12.5 4.5 4.5L19 7.5"/></svg>
          <span data-add-t>Add to quote</span>
        </button>
        <a class="re-item__go" href="?item=${esc(it.id)}#inquiry">Request Rental Quote</a>
      </div>
    </div>
    </div>
  </article>`;
}

/* La fiche d'une catégorie : « en cours d'inventaire » si elle n'a encore
   aucun article (visible dans « All »), sinon « Need something else? »
   (visible seulement quand on filtre sur elle). Dans les deux cas : ce qu'on
   peut y demander, mot pour mot du brief, et le lien vers le formulaire.
   La catégorie encore vide a sa plaque hachurée : la planche est en cours. */
function askCard(c, n) {
  const empty = !c.items.length;
  return `<article class="re-ask${empty ? ' is-empty' : ' is-more'}" data-cat="${esc(c.id)}">
    ${empty ? `<span class="re-ask__plate" aria-hidden="true"><b>${pad(n)}</b><i>${esc(short(c.label))}</i></span>` : ''}
    <span class="re-ask__k">${pad(n)} · ${esc(c.label)}</span>
    <h3 class="re-ask__h">${empty ? 'Inventory being listed — ask us' : 'Need something else?'}</h3>
    <p class="re-ask__s">${empty ? 'We are listing this category. You can already ask us about:' : 'You can also ask us about:'}</p>
    <ul class="re-ask__list">${c.covers.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <a class="re-item__go" href="?category=${esc(c.id)}#inquiry">Ask about ${esc(c.label.toLowerCase())}</a>
  </article>`;
}

function renderCatalogue() {
  const rail = document.querySelector('[data-re-filter]');
  const grid = document.querySelector('[data-re-items]');
  if (!rail || !grid) return;

  // L'onglet dit « Camera », la ligne dessous « Camera Equipment » (`short`).
  const tab = (id, label, count, n, full = label) => `<button type="button" class="re-filter__b" data-filter="${esc(id)}" aria-pressed="false" aria-controls="re-items" aria-label="${esc(full)}, ${count === 'Ask' ? 'inventory being listed' : `${Number(count)} listed`}">
    ${n ? `<span class="re-filter__n">${n}</span>` : ''}<span class="re-filter__t">${esc(label)}</span><span class="re-filter__c">${count}</span></button>`;
  rail.innerHTML = tab('all', 'All equipment', pad(allItems.length))
    + equipment.map((c, i) => tab(c.id, short(c.label), c.items.length ? pad(c.items.length) : 'Ask', pad(i + 1), c.label)).join('');

  grid.innerHTML = allItems.map(itemCard).join('')
    + equipment.map((c, i) => askCard(c, i + 1)).join('');
}

/* Les cases du formulaire. Les noms et les valeurs (`item`, `category`,
   `duration`, `option`) ne changent jamais : les liens ?item= ?category=
   ?option= et inquiry.js en dépendent. `data-text` donne le libellé du mail. */

function renderForm() {
  const pick = document.querySelector('[data-re-pick]');
  const cats = document.querySelector('[data-re-cats]');
  const opts = document.querySelector('[data-re-options]');
  const durs = document.querySelector('[data-re-durs]');
  if (pick) {
    // Une petite fiche par article : la photo du parc, le nom, la catégorie.
    pick.innerHTML = allItems.map((it) => `<label class="re-pk"><input type="checkbox" name="item" value="${esc(it.id)}" data-text="${esc(it.name)}"><span>
      <i class="re-pk__img re-pk__img--${FIT[it.id] || 'cover'}" aria-hidden="true">${thumbOf(it) ? `<img src="${esc(thumbOf(it))}" alt="" width="96" height="96" loading="lazy" decoding="async">` : ''}</i>
      <i><b>${esc(it.name)}</b><small>${esc(short(it.categoryLabel))}</small></i>
      <i class="re-pk__box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></i>
    </span></label>`).join('');
  }
  if (cats) {
    // Sous « Categories you need », le nom court suffit (« Camera ») ; le mail
    // garde le nom entier (`data-text`).
    cats.innerHTML = equipment.map((c) => `<label class="re-o"><input type="checkbox" name="category" value="${esc(c.id)}" data-text="${esc(c.label)}"><span>${esc(short(c.label))}</span></label>`).join('');
  }
  if (opts) {
    opts.insertAdjacentHTML('beforeend', RENTAL_OPTIONS.map((o) => `<option value="${esc(o.id)}">${esc(o.label)}</option>`).join(''));
  }
  if (durs) {
    durs.innerHTML = DURATIONS.map((d) => `<label class="re-o"><input type="radio" name="duration" value="${esc(slug(d))}" data-text="${esc(d)}"><span>${esc(d)}</span></label>`).join('');
  }
  // Les conditions citent les mêmes durées.
  const words = document.querySelector('[data-re-durations]');
  if (words && DURATIONS.length > 1) {
    const l = DURATIONS.map((d) => d.toLowerCase());
    words.textContent = `${l.slice(0, -1).join(', ')} or ${l[l.length - 1]}`;
  }
}

/* ═══════════════════════ LE FILTRE ═══════════════════════ */

function initFilter() {
  const rail = document.querySelector('[data-re-filter]');
  const grid = document.querySelector('[data-re-items]');
  const bar = document.querySelector('[data-re-bar]');
  const line = document.querySelector('[data-re-line]');
  const status = document.querySelector('[data-re-status]');
  if (!rail || !grid) return;
  const tabs = [...rail.querySelectorAll('[data-filter]')];
  const cards = () => [...grid.children];
  const still = reduced();
  let current = 'all';

  const visible = (el, id) => {
    if (el.classList.contains('re-ask')) {
      return id === 'all' ? el.classList.contains('is-empty') : el.dataset.cat === id;
    }
    return id === 'all' || el.dataset.cat === id;
  };

  const describe = (id, animate) => {
    if (!line) return;
    if (id === 'all') {
      line.innerHTML = `<span class="re-line__k">All equipment</span><span class="re-line__v">${pad(allItems.length)} listed items · ${pad(equipment.length)} categories. Rates and availability are confirmed with each quote.</span>`;
    } else {
      const c = equipment.find((x) => x.id === id);
      if (!c) return;
      line.innerHTML = `<span class="re-line__k">${esc(c.label)}</span><span class="re-line__v">${c.items.length ? `${pad(c.items.length)} listed ${c.items.length > 1 ? 'items' : 'item'}` : 'Inventory being listed'} · Ask us about ${c.covers.map((x) => esc(x.toLowerCase())).join(', ')}.</span>`;
    }
    // La note se découvre de gauche à droite, comme tracée à la plume.
    if (animate) plotLine(line);
  };

  // Le trait sous l'onglet actif glisse d'un onglet à l'autre.
  const slide = (instant) => {
    const on = tabs.find((t) => t.dataset.filter === current);
    if (!bar || !on) return;
    const x = on.offsetLeft - rail.scrollLeft;
    const w = on.offsetWidth;
    if (instant || still) gsap.set(bar, { x, width: w });
    else gsap.to(bar, { x, width: w, duration: 0.6, ease: 'expo.out', overwrite: true });
  };
  rail.addEventListener('scroll', () => slide(true), { passive: true });
  window.addEventListener('resize', () => slide(true));

  // Sur téléphone, l'onglet choisi se range au milieu du rail (le rail
  // défile, jamais la page).
  const center = (t, smooth) => {
    if (rail.scrollWidth <= rail.clientWidth) return;
    const left = Math.max(0, t.offsetLeft - (rail.clientWidth - t.offsetWidth) / 2);
    rail.scrollTo({ left, behavior: smooth && !still ? 'smooth' : 'auto' });
  };

  /* Le changement de catégorie (18/10, Dominique : « entre les transitions
     il y a un bug ») : la réorganisation Flip faisait voler les fiches par-
     dessus le titre. Désormais un fondu en deux temps, sur place : les
     fiches affichées s'effacent, puis celles de la catégorie choisie
     apparaissent en cascade, chacune à sa place. */
  let swap = null;
  const apply = (id, animate = true) => {
    current = id;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.filter === id)));
    const els = cards();
    describe(id, animate);
    slide(!animate);
    const n = els.filter((el) => visible(el, id) && el.classList.contains('re-item')).length;
    const label = id === 'all' ? 'all categories' : equipment.find((c) => c.id === id)?.label;
    if (status && animate) status.textContent = `${n ? `${n} ${n > 1 ? 'items' : 'item'}` : 'No listed items yet'} in ${label}.`;
    const toggle = () => els.forEach((el) => el.classList.toggle('is-out', !visible(el, id)));
    swap?.kill();
    if (!animate || still) {
      gsap.set(els, { clearProps: 'transform,opacity,visibility' });
      toggle();
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return;
    }
    const shown = els.filter((el) => !el.classList.contains('is-out'));
    swap = gsap.timeline()
      .to(shown, { autoAlpha: 0, y: -8, duration: 0.22, ease: 'power2.in', stagger: 0.02 })
      .add(() => {
        toggle();
        gsap.set(els, { clearProps: 'transform,opacity,visibility' });
        const next = els.filter((el) => !el.classList.contains('is-out'));
        gsap.fromTo(next, { autoAlpha: 0, y: 22 }, {
          autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06,
          clearProps: 'transform,opacity,visibility', onComplete: () => ScrollTrigger.refresh()
        });
      });
  };

  rail.addEventListener('click', (e) => {
    const t = e.target.closest('[data-filter]');
    if (!t || t.dataset.filter === current) return;
    apply(t.dataset.filter);
    center(t, true);
  });
  // Flèches gauche / droite d'un onglet à l'autre.
  rail.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].focus();
  });

  // Une adresse ?category=camera ouvre le catalogue déjà filtré.
  const q = new URLSearchParams(location.search).get('category');
  apply(equipment.some((c) => c.id === q) ? q : 'all', false);
  center(tabs.find((t) => t.dataset.filter === current), false);
  slide(true);
  if (document.fonts?.ready) document.fonts.ready.then(() => slide(true));

  // Les fiches entrent en cascade quand le catalogue arrive.
  if (!still) {
    const first = cards().filter((el) => !el.classList.contains('is-out'));
    gsap.set(first, { autoAlpha: 0, y: 34 });
    ScrollTrigger.create({
      trigger: grid, start: 'top 88%', once: true,
      onEnter: () => gsap.to(first, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity,visibility' })
    });
  }
}

/* ═══════════════════════ LE DEVIS ═══════════════════════ */

/* Les liens ?item= / ?option= / ?category= de la page mènent au formulaire
   sans recharger (le défilement doux intercepte l'ancre) : on coche ici ce
   que `inquiry.js` aurait coché au chargement. */
function applyParams(form, params) {
  for (const [key, val] of params) {
    if (!['item', 'option', 'category', 'type', 'level', 'platform'].includes(key)) continue;
    const vals = val.split(',');
    for (const el of form.querySelectorAll(`[name="${key}"]`)) {
      if (el.type === 'checkbox' || el.type === 'radio') { if (vals.includes(el.value)) el.checked = true; }
      else if (el.tagName === 'SELECT') { if ([...el.options].some((o) => o.value === vals[0])) el.value = vals[0]; }
    }
  }
}

function initQuote() {
  const form = document.querySelector('form[data-inquiry="rentals"]');
  if (!form) return;
  const tray = document.querySelector('[data-re-tray]');
  const count = tray?.querySelector('[data-re-count]');
  const thumbs = tray?.querySelector('[data-re-thumbs]');
  const status = document.querySelector('[data-re-status]');
  const ask = document.getElementById('inquiry');
  const byId = Object.fromEntries(allItems.map((it) => [it.id, it]));
  const box = (id) => form.querySelector(`input[name="item"][value="${CSS.escape(id)}"]`);
  const picked = () => [...form.querySelectorAll('input[name="item"]:checked')].map((b) => b.value);
  let atAsk = false;
  let last = 0;

  const paintTray = () => {
    const on = picked();
    document.querySelectorAll('[data-add]').forEach((b) => {
      const p = on.includes(b.dataset.add);
      b.setAttribute('aria-pressed', String(p));
      const t = b.querySelector('[data-add-t]');
      if (t) t.textContent = p ? 'In your quote' : 'Add to quote';
      b.closest('.re-item')?.classList.toggle('is-picked', p);
    });
    if (!tray) return;
    if (count) count.textContent = String(on.length);
    if (thumbs) {
      thumbs.innerHTML = on.slice(0, 3).map((id) => (thumbOf(byId[id])
        ? `<i class="re-tray__i re-tray__i--${FIT[id] || 'cover'}"><img src="${esc(thumbOf(byId[id]))}" alt="" width="40" height="40"></i>` : '')).join('');
    }
    const show = on.length > 0 && !atAsk;
    tray.classList.toggle('is-on', show);
    tray.setAttribute('aria-hidden', String(!show));
    tray.tabIndex = show ? 0 : -1;
    tray.setAttribute('aria-label', `Your quote: ${on.length} ${on.length === 1 ? 'item' : 'items'}. Go to the rental quote form`);
    // Le compteur bat une fois quand un article s'ajoute. (Pas de GSAP sur
    // le plateau lui-même : il glisse par la propriété CSS `translate`, que
    // GSAP absorberait en cours de transition.)
    if (on.length > last && show && !reduced() && count?.animate) {
      count.animate([{ transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
    last = on.length;
  };
  const repaint = () => { paintTray(); refreshSheet(); };

  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-add]');
    if (b) {
      const c = box(b.dataset.add);
      if (!c) return;
      c.checked = !c.checked;
      repaint();
      const name = byId[b.dataset.add]?.name || 'Item';
      if (status) status.textContent = c.checked ? `${name} added to your quote.` : `${name} removed from your quote.`;
      return;
    }
    const a = e.target.closest?.('a[href*="?"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || url.hash !== '#inquiry') return;
    applyParams(form, url.searchParams);
    repaint();
  });
  form.addEventListener('change', (e) => { if (e.target.name === 'item') paintTray(); });

  if (ask) new IntersectionObserver(([e]) => { atAsk = e.isIntersecting; paintTray(); }, { threshold: 0.05 }).observe(ask);
  paintTray();
}

/* Les dates : pas de location dans le passé, et la fin jamais avant le début. */
function initDates() {
  const start = document.getElementById('re-start');
  const end = document.getElementById('re-end');
  if (!start || !end) return;
  const d = new Date();
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  start.min = today;
  end.min = today;
  start.addEventListener('change', () => {
    end.min = start.value || today;
    if (end.value && start.value && end.value < start.value) end.value = start.value;
  });
}

/* ═══════════════════════ LE TICKET ═══════════════════════ */

/* Le ticket se redessine quand la page coche une case elle-même (« Add to
   quote », un lien ?item=…) : `initSheet` remplace cette fonction. */
let refreshSheet = () => {};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parseDay = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const dayLong = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const dayShort = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

/* Un code-barres décoratif, toujours le même (graine fixe) : des barres de
   1 à 3 unités et des blancs de 1 à 2. Il ne code rien. */
function barcode() {
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  let x = 0;
  let rects = '';
  while (x < 236) {
    const w = 1 + Math.floor(rnd() * 3);
    rects += `<rect x="${x}" y="0" width="${w}" height="40"/>`;
    x += w + 1 + Math.floor(rnd() * 2.2);
  }
  return `<svg viewBox="0 0 ${x} 40" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">${rects}</svg>`;
}

function initSheet(form) {
  const tk = document.querySelector('[data-re-tk]');
  if (!form || !tk) return;
  const still = reduced();
  const $ = (sel) => tk.querySelector(sel);
  const list = $('[data-tk-items]');
  const empty = $('[data-tk-empty]');
  const count = $('[data-tk-count]');
  const other = $('[data-tk-other]');
  const cats = $('[data-tk-cats]');
  const meter = $('[data-tk-meter]');
  const state = $('[data-tk-state]');
  const bars = $('[data-tk-bars]');
  const ghost = $('[data-tk-ghost]');
  const note = form.querySelector('[data-inquiry-note]');
  const noteText = note?.textContent || '';
  const span = document.querySelector('[data-re-span]');
  const rows = Object.fromEntries([...tk.querySelectorAll('[data-tk]')].map((r) => [r.dataset.tk, r]));
  const blocks = Object.fromEntries([...form.querySelectorAll('[data-blk]')].map((b) => [b.dataset.blk, b]));
  const byId = Object.fromEntries(allItems.map((it) => [it.id, it]));
  const catLabel = Object.fromEntries(equipment.map((c) => [c.id, short(c.label)]));

  const today = $('[data-tk-today]');
  if (today) today.textContent = dayLong(new Date());
  const code = barcode();
  if (bars) bars.innerHTML = code;
  if (ghost) ghost.innerHTML = code;

  const val = (name) => String(form.querySelector(`[name="${name}"]`)?.value || '').trim();
  const checked = (name) => [...form.querySelectorAll(`[name="${name}"]:checked`)];
  const textOf = (el) => el.dataset.text || el.closest('label')?.textContent.trim() || el.value;
  const isMail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

  let armed = false;      // pas d'animation au premier dessin
  let tried = false;      // un envoi a déjà été tenté : on signale ce qui manque
  let lastP = -1;

  // Une valeur qui change s'imprime (une ligne qui glisse, à peine).
  const put = (key, text, need = '') => {
    const r = rows[key];
    if (!r) return;
    const dd = r.querySelector('dd');
    const shown = text || need || '—';
    r.classList.toggle('is-empty', !text && !need);
    r.classList.toggle('is-need', !text && Boolean(need));
    if (dd.textContent === shown) return;
    dd.textContent = shown;
    if (armed && text && !still) {
      r.classList.remove('is-new');
      void r.offsetWidth;
      r.classList.add('is-new');
    }
  };

  // Les articles : on ajoute et on retire ligne par ligne, dans l'ordre où
  // ils ont été choisis.
  const putItems = (ids) => {
    const live = new Map([...list.children].filter((li) => !li.dataset.out).map((li) => [li.dataset.id, li]));
    for (const id of ids) {
      if (live.has(id)) { live.delete(id); continue; }
      const it = byId[id];
      const li = document.createElement('li');
      li.dataset.id = id;
      li.innerHTML = `<span class="re-tk__n"></span><span class="re-tk__t">${esc(it?.name || id)}</span><i class="re-tk__lead" aria-hidden="true"></i><span class="re-tk__c">${esc(catLabel[it?.category] || '')}</span>`;
      list.append(li);
      if (armed && !still) gsap.from(li, { height: 0, autoAlpha: 0, x: 10, duration: 0.5, ease: 'power3.out', clearProps: 'height,opacity,visibility,transform' });
    }
    live.forEach((li) => {
      li.dataset.out = '1';
      if (armed && !still) gsap.to(li, { height: 0, autoAlpha: 0, paddingTop: 0, paddingBottom: 0, duration: 0.35, ease: 'power2.in', onComplete: () => li.remove() });
      else li.remove();
    });
    [...list.children].filter((li) => !li.dataset.out).forEach((li, i) => { li.querySelector('.re-tk__n').textContent = pad(i + 1); });
  };

  const refresh = () => {
    const ids = checked('item').map((b) => b.value);
    const more = val('equipment');
    const catNames = checked('category').map((b) => catLabel[b.value] || textOf(b));
    putItems(ids);
    if (count) count.textContent = String(ids.length);
    if (other) { other.hidden = !more; other.innerHTML = more ? `+ <b>${esc(more)}</b>` : ''; }
    if (cats) { cats.hidden = !catNames.length; cats.textContent = catNames.length ? `Categories: ${catNames.join(', ')}` : ''; }
    if (empty) empty.hidden = Boolean(ids.length || more || catNames.length);

    const opt = form.querySelector('[name="option"]');
    put('option', opt?.value ? opt.selectedOptions[0]?.textContent.trim() : '');

    const s = parseDay(val('start'));
    const e = parseDay(val('end'));
    let dates = '';
    if (s && e) dates = s.getFullYear() === e.getFullYear() ? `${dayShort(s)} → ${dayLong(e)}` : `${dayLong(s)} → ${dayLong(e)}`;
    else if (s) dates = `From ${dayLong(s)}`;
    else if (e) dates = `Until ${dayLong(e)}`;
    put('dates', dates);
    const n = s && e && e >= s ? Math.round((e - s) / 864e5) + 1 : 0;
    const days = n ? `${n} ${n > 1 ? 'days' : 'day'}` : '';
    const dur = checked('duration').map(textOf)[0] || '';
    put('length', [days, dur].filter(Boolean).join(' · '));
    if (span) span.textContent = n ? `${dates} · ${days}, both included` : '';

    put('operator', checked('operator').map(textOf)[0] || '');
    put('location', val('location'));
    put('use', val('use'));

    const name = val('name');
    const phone = val('phone');
    const mail = val('email');
    // Après un envoi tenté, ce qui manque s'écrit en rouge sur le ticket.
    const noName = tried && !name;
    put('client', noName ? '' : [name, val('organization')].filter(Boolean).join(' · '), noName ? 'Name needed' : '');
    const lack = tried ? [!phone && 'phone', !isMail(mail) && 'email'].filter(Boolean) : [];
    const lackText = lack.length ? `${lack.join(' and ').replace(/^./, (c) => c.toUpperCase())} needed` : '';
    put('contact', lackText ? '' : [phone, mail].filter(Boolean).join(' · '), lackText);

    // Les dix lignes de la feuille, et les blocs remplis.
    const lines = [
      ids.length || more || catNames.length, opt?.value, s && e, dur, checked('operator').length,
      val('location'), val('use'), name, phone, isMail(mail)
    ];
    const filled = lines.filter(Boolean).length;
    if (meter) meter.textContent = `${filled} of ${lines.length} lines filled`;
    const ready = Boolean(name && phone && isMail(mail));
    if (state) {
      state.textContent = ready ? 'Ready to send' : 'Name, phone and email are needed to send';
      state.classList.toggle('is-ready', ready);
    }
    blocks.kit?.classList.toggle('is-done', Boolean(lines[0] && opt?.value));
    blocks.dates?.classList.toggle('is-done', Boolean(s && e && dur));
    blocks.set?.classList.toggle('is-done', Boolean(val('use') && checked('operator').length && val('location')));
    blocks.you?.classList.toggle('is-done', ready);

    const p = filled / lines.length;
    if (bars && p !== lastP) {
      const clip = `inset(0 ${(100 - p * 100).toFixed(2)}% 0 0)`;
      if (armed && !still) gsap.to(bars, { clipPath: clip, duration: 0.7, ease: 'power3.out', overwrite: true });
      else gsap.set(bars, { clipPath: clip });
      lastP = p;
    }
    if (note && tried && !form.querySelector('[aria-invalid="true"]')) { note.classList.remove('is-warn'); note.textContent = noteText; }
  };

  let queued = false;
  refreshSheet = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refresh(); });
  };
  form.addEventListener('input', refreshSheet);
  form.addEventListener('change', refreshSheet);
  // Après la vérification d'inquiry.js (inscrit avant nous) : ce qui manque
  // se lit aussi sur le ticket, qui frémit une fois.
  form.addEventListener('submit', () => {
    if (form.classList.contains('is-sent')) return;
    tried = true;
    const bad = form.querySelector('[aria-invalid="true"]');
    note?.classList.toggle('is-warn', Boolean(bad));
    refresh();
    if (bad && !still) gsap.fromTo(tk, { x: -7 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.32)', clearProps: 'transform' });
  });

  refresh();
  armed = true;

  // Le ticket colle au comptoir sur ordinateur : s'il est plus haut que
  // l'écran, c'est son pied (le bouton) qui reste visible.
  // Les encoches de la ligne de détachement suivent sa hauteur.
  const side = form.querySelector('[data-re-side]');
  const tear = tk.querySelector('.re-tk__tear');
  const measure = () => {
    if (side) side.style.setProperty('--side-h', `${side.offsetHeight}px`);
    if (tear) tk.style.setProperty('--tear-y', `${tear.offsetTop + tear.offsetHeight / 2}px`);
  };
  measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(tk);

  sheetIn(form, tk);
  doneMotion();
}

/* L'arrivée au comptoir (ordinateur) : les blocs montent l'un après l'autre
   et le ticket sort de la fente de l'imprimante. Rien ne bouge si on y est
   déjà (lien direct vers #inquiry), en mouvement réduit, ni sur écran
   tactile : sur téléphone, la feuille est là, tout de suite. */
function sheetIn(form, tk) {
  if (reduced() || LITE) return;
  const blocks = form.querySelectorAll('.re-blk');
  if (form.getBoundingClientRect().top < window.innerHeight) return;
  gsap.set(blocks, { autoAlpha: 0, y: 30 });
  gsap.set(tk, { yPercent: -101 });
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    gsap.timeline()
      .to(blocks, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0)
      .to(tk, { yPercent: 0, duration: LITE ? 0.9 : 1.25, ease: 'power2.inOut', clearProps: 'transform' }, 0.12);
  });
  io.observe(form);
}

/* La confirmation : le ticket détaché glisse, ses lignes s'impriment, puis
   le tampon « Quote request — Not a booking » se pose. */
function doneMotion() {
  window.addEventListener('inquiry:sent', (e) => {
    if (e.detail?.division !== 'rentals') return;
    const box = document.querySelector('[data-inquiry-done]');
    if (!box) return;
    // Le bouton d'envoi vient de disparaître avec la feuille : le focus passe
    // au titre de la confirmation (clavier, lecteur d'écran). Un instant plus
    // tard : inquiry.js fait entrer le panneau depuis `visibility: hidden`.
    const h = box.querySelector('h3');
    if (h) {
      h.tabIndex = -1;
      const focus = () => h.focus({ preventScroll: true });
      focus();
      if (document.activeElement !== h) gsap.delayedCall(0.12, focus);
    }
    if (reduced()) return;
    const tkd = box.querySelector('.re-done__wrap');
    const lines = box.querySelectorAll('dl > *');
    const stamp = box.querySelector('.re-stamp');
    gsap.timeline({ defaults: { overwrite: 'auto' } })
      .from(box.querySelectorAll('.re-done__msg > *:not([hidden])'), { opacity: 0, y: 18, duration: 0.7, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.1)
      .from(tkd, { y: -40, rotation: -1.2, autoAlpha: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.15)
      .from(lines, { autoAlpha: 0, x: 8, duration: 0.35, stagger: 0.025, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.45)
      .fromTo(stamp, { autoAlpha: 0, scale: 1.9, rotation: -18 }, { autoAlpha: 1, scale: 1, rotation: -7, duration: 0.5, ease: 'back.out(2.2)' }, '>-0.05');
  });
}

/* ═══════════════════════ L'OUVERTURE : LA CAMÉRA EN 3D ═══════════════════════ */

const RAD = Math.PI / 180;
const BASE = -40;        // le trois-quarts face, au repos (degrés)
const PX = 4;            // la réglette : 4 px par degré

/* Le test WebGL : un contexte jetable, rendu aussitôt (sur iOS, les contextes
   vivants sont comptés), et un seul test par page. */
let canGL = null;
function webgl() {
  if (canGL !== null) return canGL;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    canGL = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { canGL = false; }
  return canGL;
}

/* Le téléphone (18/10/2026) : la photo d'abord, la 3D ensuite, une fois la
   page chargée et au repos, avec le modèle allégé (camera-m.glb). Sur un
   réseau lent, elle ne vient pas : la photo reste. « Lent » : ce que le
   navigateur annonce (2G, 3G), ou le débit que cette page a réellement reçu
   en se chargeant, sous 2,5 Mbit/s (le modèle et Three.js, 0,9 Mo, y
   mettraient plus de trois secondes). Le débit annoncé par Chrome
   (`downlink`) ne sert pas : sans historique, il vaut souvent 1,5 Mbit/s
   sur une connexion rapide. */
const NET = navigator.connection;
const SLOW = /(^|-)(2g|3g)$/.test(NET?.effectiveType || '');
const MODEL = LITE ? '/kit3d/camera-m.glb' : '/kit3d/camera.glb';

/* Le débit mesuré (Mbit/s) : les octets reçus par la page, divisés par le
   temps pendant lequel quelque chose arrivait (Resource Timing). Rien à
   juger (page en cache, navigateur muet) : null. */
function measuredMbps() {
  let bytes = 0;
  const spans = [];
  for (const r of [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')]) {
    if (!(r.transferSize > 1000) || !(r.responseEnd > r.responseStart) || !(r.responseStart > 0)) continue;
    bytes += r.transferSize;
    spans.push([r.responseStart, r.responseEnd]);
  }
  if (bytes < 150e3) return null;
  spans.sort((a, b) => a[0] - b[0]);
  let busy = 0;
  let [s0, e0] = spans[0];
  for (const [s1, e1] of spans) {
    if (s1 > e0) { busy += e0 - s0; s0 = s1; e0 = e1; } else e0 = Math.max(e0, e1);
  }
  busy += e0 - s0;
  return busy > 0 ? (bytes * 8) / (busy * 1000) : null;
}
const slowLink = () => { const m = measuredMbps(); return m !== null && m < 2.5; };

/* Après le chargement de la page, puis au premier repos du navigateur
   (au plus tard 3 s après). */
function afterLoadIdle(fn) {
  const idle = () => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 3000 }) : window.setTimeout(fn, 700));
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

/* L'ombre posée sous l'objet : un disque flou peint une fois. */
function contactShadow(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.5)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.2)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* Le modèle ramené à une taille de 1, centré, orienté (même réglage que la
   séquence du matériel de l'accueil : la caméra tourne de −90° sur elle-même). */
function stage(THREE, model) {
  const fix = new THREE.Group();
  fix.rotation.set(0, -90 * RAD, 0);
  fix.add(model);
  fix.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fix);
  const dims = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const max = Math.max(dims.x, dims.y, dims.z);
  fix.position.copy(center).multiplyScalar(-1);
  const unit = new THREE.Group();
  unit.add(fix);
  unit.scale.setScalar(1 / max);
  const spin = new THREE.Group();
  spin.add(unit);
  const holder = new THREE.Group();
  holder.add(spin);
  const shadow = contactShadow(THREE);
  const foot = Math.max(dims.x, dims.z) / max;
  shadow.scale.set(foot * 1.15, foot * 0.75, 1);
  shadow.position.y = -(dims.y / max) / 2 - 0.05;
  holder.add(shadow);
  holder.userData = { spin, shadow };
  return holder;
}

function initHeroModel() {
  const frame = document.querySelector('[data-re-frame]');
  if (!frame) return;
  const hero = frame.closest('.dv-hero');
  const canvas = frame.querySelector('[data-re-gl]');
  const plan = document.querySelector('[data-re-plan]');
  const pct = frame.querySelector('[data-re-pct]');
  const angle = frame.querySelector('[data-re-angle]');
  const scale = frame.querySelector('[data-re-scale]');
  const strip = frame.querySelector('[data-re-strip]');
  const ctrl = document.querySelector('[data-re-ctrl]');
  const still = reduced();

  // La réglette : un repère tous les 30°, sur deux tours.
  if (strip) {
    let html = '';
    for (let d = 0; d <= 720; d += 30) html += `<span style="left:${d * PX}px">${pad(d % 360).padStart(3, '0')}</span>`;
    strip.innerHTML = html;
  }

  // Le plan se trace dès l'arrivée, avant le modèle.
  if (plan && !still) gsap.fromTo(plan, { autoAlpha: 0, x: 28 }, { autoAlpha: 0.5, x: 0, duration: 1.4, delay: 0.25, ease: 'power3.out' });
  if (!still) {
    gsap.fromTo(frame.querySelectorAll('.re-crop'), { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 1, delay: 0.35, stagger: 0.05, ease: 'expo.out' });
    gsap.fromTo(frame.querySelectorAll('.re-lab, .re-scale'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.6, stagger: 0.06, ease: 'power3.out' });
  }

  const photo = (why) => {
    if (why) console.warn('[rentals]', why);
    frame.dataset.mode = 'photo';
    ctrl?.setAttribute('hidden', '');
    if (plan) gsap.to(plan, { autoAlpha: 0.12, duration: 0.8, ease: 'power2.out', overwrite: true });
  };
  // Sans WebGL, ou en économie de données (le modèle pèse 2,4 Mo) : la photo.
  // Sur téléphone, aussi sur un réseau lent.
  if (!webgl() || NET?.saveData || (LITE && SLOW)) { photo(); return; }
  // Sur téléphone, la photo tient la place pendant que la 3D se prépare.
  if (LITE) photo();

  /* La pose. P : l'entrée (dans le temps). S : la vie (souris, main,
     défilement, rotation lente). */
  const P = { yaw: -130, pitch: 16, grow: 0.82 };
  const S = { auto: 0, hand: 0, vel: 0, px: 0, py: 0, tx: 0, ty: 0, scroll: 0 };
  let three = null;
  let holder = null;
  let visible = true;
  let dragging = false;
  let rest = 0;           // l'instant où la main a lâché : la rotation lente reprend ensuite
  let lastT = 0;
  let sig = '';
  let shown = -1;
  let scaleW = scale?.clientWidth || 0;   // relu au redimensionnement, pas à chaque image

  if (import.meta.env.DEV) window.__re = { P, S, get ready() { return Boolean(holder); } };

  const yawNow = () => BASE + P.yaw + S.auto + S.hand + S.px * 24 + S.scroll * 70;

  const size = () => {
    if (!three) return;
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    three.renderer.setSize(w, h, false);
    three.cam.aspect = w / h;
    three.cam.updateProjectionMatrix();
    scaleW = scale?.clientWidth || 0;
    sig = '';
  };

  const readout = (yaw) => {
    const d = ((Math.round(yaw) % 360) + 360) % 360;
    if (d !== shown && angle) { angle.textContent = String(d).padStart(3, '0'); shown = d; }
    if (strip && scale) {
      const exact = ((yaw % 360) + 360) % 360;
      strip.style.transform = `translate3d(${(scaleW / 2 - (exact + 360) * PX).toFixed(1)}px,0,0)`;
    }
  };
  readout(BASE);

  const render = (time) => {
    if (!three || !holder || !visible || document.hidden) { lastT = 0; return; }
    const dt = lastT ? Math.min(0.1, time - lastT) : 1 / 60;
    lastT = time;
    const k = (rate) => 1 - Math.exp(-dt * rate);

    // La rotation lente, sur ordinateur seulement, et pas pendant la main.
    if (!still && !LITE && !dragging && time - rest > 1.6) S.auto += 5.5 * dt;
    // L'élan de la main, qui s'amortit.
    if (!dragging && S.vel) {
      S.hand += S.vel * dt;
      S.vel *= Math.exp(-dt * 3.4);
      if (Math.abs(S.vel) < 0.5) S.vel = 0;
    }
    S.px += (S.tx - S.px) * k(2.6);
    S.py += (S.ty - S.py) * k(2.6);

    const { renderer, scene, cam, view } = three;
    const vh = 2 * Math.tan((cam.fov / 2) * RAD) * view;
    const vw = vh * cam.aspect;
    const fit = Math.min(vw * 0.8, vh * 1.05);
    const yaw = yawNow();
    const pitch = P.pitch + S.py * 6;
    holder.userData.spin.rotation.set(pitch * RAD, yaw * RAD, 0);
    holder.scale.setScalar(fit * P.grow);
    holder.position.set(0, -0.03 * vh, 0);

    if (LITE) {
      // Rien n'a bougé : la puce graphique se repose.
      const s = `${yaw.toFixed(3)}|${pitch.toFixed(3)}|${P.grow.toFixed(4)}|${canvas.width}x${canvas.height}`;
      if (s === sig) return;
      sig = s;
    }
    readout(yaw);
    renderer.render(scene, cam);
  };

  const enter = () => {
    frame.dataset.mode = '3d';
    ctrl?.removeAttribute('hidden');
    if (still) {
      Object.assign(P, { yaw: 0, pitch: 6, grow: 1 });
      gsap.set(canvas, { autoAlpha: 1 });
      if (plan) gsap.set(plan, { autoAlpha: 0.16 });
      return;
    }
    gsap.timeline({ defaults: { overwrite: 'auto' } })
      .fromTo(canvas, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0)
      .to(P, { yaw: 0, pitch: 6, grow: 1, duration: 2.1, ease: 'power3.out' }, 0)
      .to(plan, { autoAlpha: 0.16, x: -24, duration: 1.8, ease: 'power2.inOut' }, 0.1)
      .fromTo(ctrl, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' }, 0.7);
  };

  const start = async () => {
    try {
      // Seulement les classes dont la scène se sert (`three-rentals.js`).
      const THREE = await import('./three-rentals.js');
      await breathe();
      const [{ GLTFLoader }, { RoomEnvironment }, { MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/environments/RoomEnvironment.js'),
        import('three/addons/libs/meshopt_decoder.module.js')
      ]);
      try { MeshoptDecoder.useWorkers?.(2); } catch { /* décodage sur place */ }
      await breathe();

      // Sur écran tactile, sans anticrénelage (MSAA) : c'est lui qui pesait sur
      // les puces graphiques modestes.
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.15;
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); three = null; photo('WebGL context lost'); }, { once: true });

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 1.05;
      await breathe();

      // Une longue focale, un regard à peine plongeant : celui d'un
      // photographe de produit.
      const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
      cam.position.set(0, 1.15, 11);
      cam.lookAt(0, 0, 0);
      const view = cam.position.length();

      // Une clé chaude de face, un contre-jour froid, et derrière l'objet la
      // lumière de la division (bleu acier) qui détache sa silhouette.
      const accent = getComputedStyle(document.body).getPropertyValue('--dv').trim() || '#7fb7d9';
      const key = new THREE.DirectionalLight(0xfff2e4, 2.8);
      key.position.set(-4, 4.5, 6);
      const rim = new THREE.DirectionalLight(0xe6f0ff, 3.6);
      rim.position.set(3.5, 3.5, -5);
      const kick = new THREE.PointLight(accent, 14, 10, 2);
      kick.position.set(-1.6, 0.8, -3);
      const fill = new THREE.HemisphereLight(0xeef2f5, 0x101418, 0.4);
      scene.add(key, rim, kick, fill);

      three = { THREE, renderer, scene, cam, view };
      size();
      new ResizeObserver(() => size()).observe(canvas);

      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.loadAsync(MODEL, (e) => {
        if (pct && e.total) pct.textContent = String(Math.round((e.loaded / e.total) * 100)).padStart(3, '0');
      });
      await breathe();
      holder = stage(THREE, gltf.scene);
      scene.add(holder);
      await renderer.compileAsync(holder, cam, scene);
      await breathe();
      if (!three) return;
      // La première image est peinte avant le fondu (la photo s'efface pendant
      // que la 3D monte, au même endroit : rien ne bouge dans la page).
      sig = '';
      render(gsap.ticker.time);
      enter();
    } catch (err) {
      three = null;
      photo(err);
    }
  };
  // Sur ordinateur, tout de suite. Sur téléphone, après le chargement et au
  // repos ; et seulement quand l'ouverture est à l'écran (sinon, à son retour).
  let waiting = false;
  if (!LITE) start();
  else afterLoadIdle(() => { if (slowLink()) return; if (visible) start(); else waiting = true; });

  // On ne dessine que ce qui se voit.
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sig = '';
    if (visible && waiting) { waiting = false; start(); }
  }).observe(hero);
  gsap.ticker.add(render);

  /* La main : glisser de côté tourne la caméra (le défilement vertical reste
     à la page, `touch-action: pan-y`). Elle garde son élan en lâchant. */
  let x0 = 0;
  let t0 = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (!holder || (e.pointerType === 'mouse' && e.button !== 0)) return;
    dragging = true;
    x0 = e.clientX;
    t0 = performance.now();
    S.vel = 0;
    frame.classList.add('is-drag');
    try { canvas.setPointerCapture(e.pointerId); } catch { /* rien */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const d = (e.clientX - x0) * 0.42;
    S.hand += d;
    S.vel = d / Math.max(0.012, (now - t0) / 1000);
    x0 = e.clientX;
    t0 = now;
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    rest = gsap.ticker.time;
    frame.classList.remove('is-drag');
    if (e.type === 'pointercancel' || performance.now() - t0 > 90) S.vel = 0;
    S.vel = gsap.utils.clamp(-420, 420, S.vel);
    if (still) S.vel = 0;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // Les deux flèches : un huitième de tour.
  ctrl?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-re-rot]');
    if (!b || !holder) return;
    S.vel = 0;
    rest = gsap.ticker.time + 1.2;
    const to = S.hand + Number(b.dataset.reRot) * 45;
    if (still) S.hand = to;
    else gsap.to(S, { hand: to, duration: 1, ease: 'power3.inOut', overwrite: 'auto' });
  });

  if (still) return;

  // La souris : la caméra la suit à peine (ordinateur seulement).
  if (!LITE) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      S.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      S.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    hero.addEventListener('pointerleave', () => { S.tx = 0; S.ty = 0; });
  }

  // La descente : la caméra se tourne et la planche monte à peine.
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top',
    onUpdate: (self) => { S.scroll = self.progress; }
  });
  gsap.to(frame, {
    yPercent: -7, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ═══════════════════════ LE DÉMARRAGE ═══════════════════════ */
// Le catalogue et les cases d'abord : le formulaire se préremplit (?item=…)
// au démarrage commun, il faut qu'elles existent déjà.
renderCatalogue();
renderForm();
bootDivision();
initFilter();
initQuote();
initDates();
initSheet(document.querySelector('form[data-inquiry="rentals"]'));
initSheets();
initHeroModel();
