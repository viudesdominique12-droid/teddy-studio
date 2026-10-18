/**
 * START A PRODUCTION — le bureau des autorisations (18/10/2026).
 *
 * Dominique : « améliore-moi les autres pages avec la même logique de
 * customisation de thème ». Ce module n'ajoute que le visuel ; la logique du
 * formulaire (étapes dégagées, jours, fuseau, envoi) reste dans book.js.
 *   loops()     les filets ne tournent que dans une partie à l'écran et un
 *               onglet affiché ; les parties entrent (numéro, filet) ;
 *   stamp()     le tampon dateur de l'en-tête : la vraie date d'Addis, un
 *               coup de tampon à l'arrivée, un autre à chaque clic ou
 *               toucher, qui laisse l'empreinte précédente s'effacer ;
 *   slip()      la fiche de production, tenue à jour pendant la saisie, ses
 *               cases tamponnées, la ligne de la partie en cours ;
 *   days()      une case par jour de tournage, le premier et le dernier
 *               tamponnés ;
 *   clocks()    les deux cadrans du téléphone : l'heure du visiteur et
 *               celle d'Addis.
 * En mouvement réduit, tout est posé, sans coup ni boucle. Aucun chiffre
 * inventé : les dates et les heures sont celles du visiteur ou d'Addis.
 */
import gsap from 'gsap';
import { reduced } from '../motion.js';
import { toAddis, addisTime } from '../clock.js';

const TZ = 'Africa/Addis_Ababa';
const root = document.documentElement;

/* ═══════════════════════ LES BOUCLES ET LES ENTRÉES ═══════════════════════ */
function loops() {
  root.classList.add('bk-js');
  for (const el of document.querySelectorAll('.bk .step, .bk__rail, .bk__end')) el.setAttribute('data-bk-live', '');
  const io = new IntersectionObserver((es) => {
    for (const e of es) e.target.classList.toggle('is-live', e.isIntersecting);
  }, { rootMargin: '60px 0px' });
  for (const el of document.querySelectorAll('[data-bk-live], body[data-page="book"] .ftr')) io.observe(el);

  const vis = () => root.classList.toggle('bk-hidden', document.hidden);
  document.addEventListener('visibilitychange', vis);
  vis();

  // Chaque partie entre une fois : le numéro monte, le filet se pose.
  const steps = [...document.querySelectorAll('.bk .step')];
  if (reduced()) { steps.forEach((s) => s.classList.add('is-in')); return; }
  const inIo = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('is-in'); inIo.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  steps.forEach((s) => inIo.observe(s));
}

/* ═══════════════════════ LES DATES D'ADDIS ═══════════════════════ */
const fDate = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
function addisDate(withDay) {
  const p = Object.fromEntries(fDate.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${withDay ? `${p.weekday} ` : ''}${p.day} ${p.month} ${p.year}`.toUpperCase();
}
function paintDates() {
  for (const el of document.querySelectorAll('[data-bk-date]')) {
    const v = addisDate(Boolean(el.closest('.slip')));
    if (el.textContent !== v) el.textContent = v;
  }
}

/* ═══════════════════════ LE TAMPON DATEUR ═══════════════════════ */
function stamp() {
  const el = document.getElementById('bk-stamp');
  if (!el) return;
  const ink = el.querySelector('.bk-stamp__ink');
  const prints = el.querySelector('.bk-stamp__prints');
  let r = -9;
  let at = [0, 0];
  gsap.set(ink, { rotation: r });
  if (reduced()) return;

  const land = (delay = 0) => gsap.fromTo(ink,
    { scale: 1.45, autoAlpha: 0, x: at[0], y: at[1] - 18 },
    { scale: 1, autoAlpha: 1, x: at[0], y: at[1], rotation: r, duration: 0.3, delay, ease: 'power4.in',
      onComplete: () => { gsap.fromTo(el, { y: 0 }, { y: 2, duration: 0.05, yoyo: true, repeat: 1, ease: 'none' }); } });

  // L'arrivée : le tampon frappe quand le volet de la page s'est retiré.
  land(0.8);

  // Un nouveau coup : l'empreinte précédente reste un instant, puis pâlit.
  el.addEventListener('click', () => {
    const g = ink.cloneNode(true);
    const tf = ink.style.transform;
    g.className = 'bk-stamp__ghost';
    g.removeAttribute('style');
    g.style.transform = tf;
    g.querySelector('defs')?.remove();
    for (const n of g.querySelectorAll('[data-clock], [data-bk-date]')) { n.removeAttribute('data-clock'); n.removeAttribute('data-bk-date'); }
    prints.append(g);
    while (prints.children.length > 3) prints.firstElementChild.remove();
    window.setTimeout(() => g.classList.add('is-gone'), 1600);
    window.setTimeout(() => g.remove(), 4400);
    // Jamais deux fois au même endroit : un autre angle, un léger décalage.
    const prev = r;
    do r = Math.round(-18 + Math.random() * 24); while (Math.abs(r - prev) < 7);
    at = [Math.round(-8 + Math.random() * 16), Math.round(-8 + Math.random() * 16)];
    gsap.killTweensOf(ink);
    land(0);
  });
}

/* ═══════════════════════ LES JOURS DE TOURNAGE ═══════════════════════ */
function nDays(a, b) {
  if (!a || !b) return 0;
  const d1 = new Date(`${a}T00:00:00Z`);
  const d2 = new Date(`${b}T00:00:00Z`);
  if (Number.isNaN(+d1) || Number.isNaN(+d2) || d2 < d1) return 0;
  return Math.round((d2 - d1) / 864e5) + 1;
}
const fShort = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short' });
const shortDate = (v) => {
  if (!v) return '';
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(+d) ? '' : fShort.format(d);
};

function days() {
  const el = document.getElementById('bk-days');
  const a = document.getElementById('bk-from');
  const b = document.getElementById('bk-to');
  if (!el || !a || !b) return;
  let key = '';
  const WD = 'SMTWTFS';
  const cell = (d, i, end) => `<span class="bk-days__d${end ? ' is-end' : ''}" style="--i:${i}"><small>${WD[d.getUTCDay()]}</small><b>${d.getUTCDate()}</b></span>`;
  const paint = () => {
    const k = `${a.value}|${b.value}`;
    if (k === key) return;
    key = k;
    const n = nDays(a.value, b.value);
    el.classList.remove('is-on');
    if (!n) { el.innerHTML = ''; return; }
    const d0 = Date.parse(`${a.value}T00:00:00Z`);
    const day = (i) => new Date(d0 + i * 864e5);
    const MAX = 28;
    let html = '';
    if (n <= MAX) {
      for (let i = 0; i < n; i++) html += cell(day(i), i, i === 0 || i === n - 1);
    } else {
      for (let i = 0; i < MAX - 2; i++) html += cell(day(i), i, i === 0);
      html += `<span class="bk-days__d is-more" style="--i:${MAX - 2}">+${n - MAX + 1}</span>`;
      html += cell(day(n - 1), MAX - 1, true);
    }
    el.innerHTML = html;
    if (reduced()) { el.classList.add('is-on'); return; }
    void el.offsetWidth;
    requestAnimationFrame(() => el.classList.add('is-on'));
  };
  a.addEventListener('input', paint);
  b.addEventListener('input', paint);
  a.addEventListener('change', paint);
  b.addEventListener('change', paint);
  paint();
}

/* ═══════════════════════ LA FICHE DE PRODUCTION ═══════════════════════ */
function slip(form) {
  const box = document.getElementById('bk-slip');
  if (!box || !form) return;
  const rail = document.querySelector('.bk__rail');
  const cells = Object.fromEntries([...box.querySelectorAll('[data-f]')].map((n) => [n.dataset.f, n]));
  const boxes = [...box.querySelectorAll('.slip__boxes li')];
  const count = box.querySelector('[data-bk-done]');
  const steps = [...form.querySelectorAll('.step')];
  const rows = [...box.querySelectorAll('.slip__r')];

  const read = () => {
    const d = new FormData(form);
    const one = (k) => String(d.get(k) || '').trim();
    const many = (k) => d.getAll(k).map(String).filter(Boolean).join(', ');
    const from = one('from');
    const to = one('to');
    const firm = one('firm');
    let dates = '';
    if (from || to) dates = `${shortDate(from) || '?'} → ${shortDate(to) || '?'}`;
    const n = nDays(from, to);
    if (n) dates += ` · ${n} ${n === 1 ? 'day' : 'days'}`;
    if (firm) dates = dates ? `${dates} (${firm})` : firm;
    const name = `${one('first_name')} ${one('last_name')}`.trim();
    const call = one('call');
    return {
      project: one('project'),
      title: one('title'),
      dates,
      loc: many('loc'),
      svc: many('svc'),
      kit: many('kit'),
      crew: one('crew'),
      contact: [name, one('company'), one('email')].filter(Boolean).join(' · '),
      call: call ? `${call} your time · ${toAddis(call) || '?'} Addis` : ''
    };
  };

  const paint = () => {
    const v = read();
    for (const [k, n] of Object.entries(cells)) {
      const t = v[k] || '';
      if (n.textContent === t) continue;
      n.textContent = t;
      if (t && !reduced()) { n.classList.remove('is-new'); void n.offsetWidth; n.classList.add('is-new'); }
    }
    let done = 0;
    for (const s of steps) {
      const ok = s.classList.contains('is-cleared');
      boxes.find((b) => b.dataset.s === s.dataset.step)?.classList.toggle('is-cleared', ok);
      if (ok) done++;
    }
    if (count) count.textContent = String(done);
    rail?.style.setProperty('--done', String(done));
  };

  // book.js a déjà posé ses écouteurs : les nôtres passent après lui, quand
  // les étapes ont pris (ou perdu) leur état « dégagé ».
  form.addEventListener('input', paint);
  form.addEventListener('change', paint);
  paint();

  // La partie en cours : celle qui passe au milieu de l'écran, ou celle où
  // l'on écrit.
  const here = (n) => { for (const r of rows) r.classList.toggle('is-here', r.dataset.s === n); };
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) here(e.target.dataset.step);
  }, { rootMargin: '-42% 0px -52% 0px' });
  steps.forEach((s) => io.observe(s));
  form.addEventListener('focusin', (e) => { const s = e.target.closest?.('.step'); if (s) here(s.dataset.step); });

  // La demande est prête : le grand coup de tampon sur la fiche.
  new MutationObserver(() => box.classList.toggle('is-sent', form.classList.contains('is-sent')))
    .observe(form, { attributes: true, attributeFilter: ['class'] });
}

/* ═══════════════════════ LES ONGLETS ═══════════════════════ */
function railJump() {
  for (const li of document.querySelectorAll('.bk__rail .rail__i')) {
    li.addEventListener('click', () => {
      document.querySelector(`.bk .step[data-step="${li.dataset.step}"]`)
        ?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    });
  }
}

/* ═══════════════════════ LES CADRANS ═══════════════════════ */
function clocks() {
  const wrap = document.querySelector('.clocks');
  const input = document.getElementById('bk-call');
  const you = document.getElementById('clk-you');
  const addis = document.getElementById('clk-addis');
  const slot = document.querySelector('.callslot');
  if (!wrap || !input || !you || !addis) return;
  const sec = addis.querySelector('.clock__s');

  const set = (fig, h, m) => {
    fig.querySelector('.clock__h').style.setProperty('--a', `${((h % 12) + m / 60) * 30}deg`);
    fig.querySelector('.clock__m').style.setProperty('--a', `${m * 6}deg`);
  };
  const hm = (s) => String(s || '').split(':').map(Number);

  // La trotteuse d'Addis part de la vraie seconde.
  const syncSec = () => {
    if (!sec) return;
    const now = new Date();
    sec.style.animationDelay = `-${now.getSeconds() + now.getMilliseconds() / 1000}s`;
  };

  const paint = () => {
    paintDates();
    if (input.value) {
      const [h, m] = hm(input.value);
      if (!Number.isNaN(h)) set(you, h, m || 0);
      const [H, M] = hm(toAddis(input.value));
      if (!Number.isNaN(H)) set(addis, H, M || 0);
      wrap.classList.add('is-set');
    } else {
      const now = new Date();
      set(you, now.getHours(), now.getMinutes());
      const [H, M] = hm(addisTime(false));
      set(addis, H, M);
      wrap.classList.remove('is-set');
    }
  };
  input.addEventListener('input', paint);
  input.addEventListener('change', paint);
  syncSec();
  paint();

  // Sans heure choisie, les cadrans suivent l'heure : une fois toutes les
  // 30 s, seulement à l'écran et dans un onglet affiché.
  window.setInterval(() => {
    if (document.hidden || (slot && !slot.classList.contains('is-live'))) return;
    if (!input.value) paint();
    else paintDates();
  }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { syncSec(); paint(); } });
}

/* ═══════════════════════ DÉMARRAGE ═══════════════════════ */
export function initBookDesk(form = document.getElementById('bk-form')) {
  if (!document.body.matches('[data-page="book"]')) return;
  loops();
  paintDates();
  stamp();
  days();
  slip(form);
  railJump();
  clocks();
}
