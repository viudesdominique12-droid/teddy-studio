/**
 * LA FEUILLE DE SERVICE.
 *
 * C'est LE moment du site : une petite fiche suit le visiteur et s'écrit
 * toute seule au fil de sa visite — les services vus, les lieux regardés,
 * le matériel qu'il ajoute. Arrivé au contact, elle est déjà remplie, et
 * il ne reste que son nom à écrire.
 *
 * État en mémoire + localStorage (~1 Ko). Aucune requête, aucun suivi.
 */

import gsap from 'gsap';
import { reduced, EASE, DUR } from './motion.js';

const KEY = 'teddy-sheet';
const MAX = 14;

let lines = [];
let els = null;

/* ─────────────── État ─────────────── */

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return Array.isArray(v) ? v.slice(0, MAX) : [];
  } catch { return []; }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* ignore */ }
}

/** Le texte lu par l'humain ET envoyé dans le message. */
export function sheetLines() {
  return lines.map((l) => l.text);
}

export function clearSheet() {
  lines = [];
  save();
  render(true);
}

/* ─────────────── Écriture ─────────────── */

/**
 * Une ligne s'écrit caractère par caractère — c'est une machine à écrire,
 * pas un effet. C'est le seul motif d'animation répété du site.
 */
function typeInto(node, text) {
  if (reduced()) { node.textContent = text; return; }
  const o = { i: 0 };
  node.textContent = '';
  gsap.to(o, {
    i: text.length,
    duration: Math.min(1.1, text.length * 0.018),
    ease: 'none',
    snap: { i: 1 },
    onUpdate: () => { node.textContent = text.slice(0, o.i); }
  });
}

function render(silent = false) {
  if (!els) return;
  const { dock, log, dockLog, count, empty } = els;

  count.textContent = String(lines.length);
  dock.classList.toggle('is-live', lines.length > 0);
  if (empty) empty.hidden = lines.length > 0;

  for (const [host, animate] of [[dockLog, false], [log, false]]) {
    if (!host) continue;
    host.innerHTML = '';
    for (const l of lines) {
      const li = document.createElement('li');
      li.textContent = l.text;
      host.appendChild(li);
    }
  }

  if (!silent && !reduced() && lines.length) {
    const last = dockLog?.lastElementChild;
    if (last) {
      const text = last.textContent;
      typeInto(last, text);
      gsap.fromTo(dock, { scale: 0.985 }, { scale: 1, duration: DUR.clear, ease: EASE.clear });
    }
  }
}

/**
 * Ajoute une ligne. `id` garantit qu'un même fait ne s'écrit qu'une fois,
 * même si le visiteur repasse devant.
 */
export function addLine(id, text) {
  if (!id || lines.some((l) => l.id === id)) return false;
  if (lines.length >= MAX) return false;
  lines.push({ id, text });
  save();
  render();
  return true;
}

export function removeLine(id) {
  const n = lines.length;
  lines = lines.filter((l) => l.id !== id);
  if (lines.length !== n) { save(); render(true); }
  return lines.length !== n;
}

export function hasLine(id) {
  return lines.some((l) => l.id === id);
}

/* ─────────────── Branchement ─────────────── */

export function initSheet() {
  const dock = document.getElementById('dock');
  if (!dock) return;

  els = {
    dock,
    log: document.getElementById('cs-log'),
    dockLog: document.getElementById('dock-log'),
    count: document.getElementById('dock-count'),
    empty: document.getElementById('cs-empty')
  };

  lines = load();
  render(true);

  // Ouverture / fermeture de la fiche
  const toggle = document.getElementById('dock-toggle');
  const body = document.getElementById('dock-body');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    body.hidden = open;
    if (!open && !reduced()) {
      gsap.from(body, { height: 0, opacity: 0, duration: 0.42, ease: EASE.clear });
    }
  });

  // Les boutons « Add to sheet » du matériel
  for (const btn of document.querySelectorAll('[data-add]')) {
    const kit = btn.dataset.add;
    const id = `kit:${kit}`;
    const paint = () => {
      const on = hasLine(id);
      btn.classList.toggle('is-in', on);
      btn.querySelector('span').textContent = on ? 'On the sheet' : 'Add to sheet';
      btn.setAttribute('aria-pressed', String(on));
    };
    paint();
    btn.addEventListener('click', () => {
      hasLine(id) ? removeLine(id) : addLine(id, `KIT — ${kit}`);
      paint();
    });
  }

  // La fiche se range quand la vraie feuille est à l'écran :
  // deux fois le même objet en même temps n'aurait aucun sens.
  const full = document.getElementById('cs-full');
  if (full) {
    new IntersectionObserver(
      ([e]) => dock.classList.toggle('is-home', e.isIntersecting),
      { threshold: 0.12 }
    ).observe(full);
  }

  // La date du jour, à Addis, en en-tête de la feuille.
  const date = document.getElementById('cs-date');
  if (date) {
    date.textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Addis_Ababa', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date());
  }
}
