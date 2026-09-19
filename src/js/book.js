/**
 * LA DEMANDE DE PRODUCTION — « Request the green light ».
 * Le concept descend jusqu'ici : chaque étape renseignée PASSE AU VERT.
 * Le visiteur voit sa production se dégager sous ses doigts.
 */

import gsap from 'gsap';
import { startClocks, toAddis, offsetFromAddis } from './clock.js';
import { cursor, indexPanel, bar, reduced, EASE, DUR } from './motion.js';
import { initReveals, initMagnets, markReveals, markMagnets } from './reveal.js';
import { initSheet } from './sheet.js';
import { initWipe } from './wipe.js';
import { initSky } from './sky.js';

const form = document.getElementById('bk-form');
const rail = document.getElementById('rail');
const note = document.getElementById('bk-note');

/* ─────────────── L'état des étapes ─────────────── */

/** Une étape est « dégagée » dès qu'elle porte une information utile. */
function stepFilled(fs) {
  const n = Number(fs.dataset.step);
  const val = (sel) => [...fs.querySelectorAll(sel)].some((i) => i.checked);
  const txt = (sel) => [...fs.querySelectorAll(sel)].some((i) => String(i.value || '').trim());

  if (n === 1) return val('input[type=radio]') || txt('#bk-title');
  if (n === 2) return txt('#bk-from, #bk-to') || val('input[name=firm]');
  if (n === 3) return val('input[name=loc]');
  if (n === 4) return val('input[name=svc], input[name=kit]') || txt('#bk-crew');
  if (n === 5) {
    const need = ['#bk-first', '#bk-last', '#bk-mail'];
    return need.every((s) => String(fs.querySelector(s).value || '').trim());
  }
  return false;
}

function paintSteps() {
  let done = 0;
  for (const fs of form.querySelectorAll('.step')) {
    const ok = stepFilled(fs);
    const was = fs.classList.contains('is-cleared');
    fs.classList.toggle('is-cleared', ok);

    const dot = rail?.querySelector(`.rail__i[data-step="${fs.dataset.step}"]`);
    dot?.classList.toggle('is-cleared', ok);

    // Le feu vert d'une étape est un ÉVÉNEMENT : on ne l'anime qu'à la bascule.
    if (ok && !was && !reduced() && dot) {
      gsap.fromTo(dot.querySelector('.rail__d'),
        { scale: 0.4 }, { scale: 1, duration: DUR.clear, ease: EASE.clear });
    }
    if (ok) done++;
  }
  rail?.style.setProperty('--done', String(done));
  return done;
}

/* ─────────────── Les détails utiles ─────────────── */

/** Combien de jours de tournage — dit à voix basse, sans jamais juger. */
function shootDays() {
  const el = document.getElementById('days-note');
  const a = document.getElementById('bk-from').value;
  const b = document.getElementById('bk-to').value;
  if (!el) return;
  if (!a || !b) { el.textContent = ''; return; }
  const d1 = new Date(a), d2 = new Date(b);
  if (Number.isNaN(+d1) || Number.isNaN(+d2)) { el.textContent = ''; return; }
  if (d2 < d1) { el.textContent = 'The last day falls before the first one.'; el.classList.add('is-warn'); return; }
  el.classList.remove('is-warn');
  const days = Math.round((d2 - d1) / 864e5) + 1;
  el.textContent = `${days} shooting ${days === 1 ? 'day' : 'days'}.`;
}

/**
 * Le fuseau traduit : le producteur choisit une heure dans SON horloge,
 * on lui dit ce que ça donne à Addis. Aucun concurrent du secteur ne le fait.
 */
function callSlot() {
  const input = document.getElementById('bk-call');
  const out = document.getElementById('call-out');
  if (!input || !out) return;

  const paint = () => {
    if (!input.value) {
      out.innerHTML = '<span class="callslot__muted">Pick a time in your own clock &mdash; we&rsquo;ll show you what it is in Addis Ababa.</span>';
      return;
    }
    const there = toAddis(input.value);
    const off = offsetFromAddis();
    const gap = off === 0 ? 'same time as you' : `${Math.abs(off)}h ${off > 0 ? 'ahead of' : 'behind'} you`;
    out.innerHTML = `<strong>${input.value}</strong> your time is <strong class="go">${there}</strong> in Addis Ababa <span class="callslot__muted">(${gap})</span>`;
  };
  input.addEventListener('input', paint);
  paint();
}

/* ─────────────── La synthèse ─────────────── */

function collect() {
  const d = new FormData(form);
  const many = (k) => d.getAll(k).filter(Boolean);
  return {
    'Project':    d.get('project') || '—',
    'Title':      d.get('title') || '—',
    'Dates':      d.get('from') || d.get('to')
                    ? `${d.get('from') || '?'} → ${d.get('to') || '?'}${d.get('firm') ? ` (${d.get('firm')})` : ''}`
                    : '—',
    'Locations':  many('loc').join(', ') || 'open to suggestions',
    'Services':   many('svc').join(', ') || '—',
    'Kit':        many('kit').join(', ') || '—',
    'Crew':       d.get('crew') || '—',
    'Contact':    `${d.get('first_name') || ''} ${d.get('last_name') || ''}`.trim() || '—',
    'Company':    d.get('company') || '—',
    'Email':      d.get('email') || '—',
    'Phone':      d.get('phone') || '—',
    'Call at':    d.get('call') ? `${d.get('call')} their time · ${toAddis(d.get('call'))} in Addis` : '—',
    'Notes':      d.get('message') || '—'
  };
}

function renderSummary(data) {
  const box = document.getElementById('summary');
  const dl = document.getElementById('summary-dl');
  if (!box || !dl) return;
  dl.innerHTML = '';
  for (const [k, v] of Object.entries(data)) {
    if (v === '—') continue;
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  }
  box.hidden = false;
  if (!reduced()) gsap.from(box, { autoAlpha: 0, y: 18, duration: 0.6, ease: EASE.lift });
}

/* ─────────────── Envoi ─────────────── */

function setErr(field, msg) {
  const p = field.closest('.field');
  p?.classList.toggle('is-err', Boolean(msg));
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  let e = p?.querySelector('.field__err');
  if (msg) {
    if (!e) { e = document.createElement('span'); e.className = 'field__err'; p.appendChild(e); }
    e.textContent = msg;
  } else e?.remove();
}

form?.addEventListener('submit', (ev) => {
  ev.preventDefault();

  // Robot : on ne dit rien, on ne fait rien.
  if (form.querySelector('[name=company_url]')?.value) return;

  let bad = null;
  for (const f of form.querySelectorAll('input[required]')) {
    const v = String(f.value || '').trim();
    if (!v) { setErr(f, 'Required'); bad = bad || f; }
    else if (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setErr(f, 'Check this address'); bad = bad || f; }
    else setErr(f, null);
  }
  if (bad) {
    note.textContent = 'We just need a name and an email to answer you.';
    bad.focus();
    bad.closest('.step')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    return;
  }

  const data = collect();
  renderSummary(data);
  form.classList.add('is-sent');

  const subject = `Production request — ${data['Contact']}${data['Project'] !== '—' ? ` · ${data['Project']}` : ''}`;
  const body = Object.entries(data)
    .filter(([, v]) => v !== '—')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  note.textContent = 'Your request is ready. Opening your mail app so it reaches us directly.';
  window.setTimeout(() => {
    window.location.href =
      `mailto:info@ethiopianfilmoffice.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, 420);
});

/* ─────────────── Démarrage ─────────────── */

startClocks();
initSky();   // le ciel et sa nuit sont le sol du site, pas une page
initWipe();
cursor();
indexPanel();
bar();
initSheet();
callSlot();

form?.addEventListener('input', () => { paintSteps(); shootDays(); });
form?.addEventListener('change', paintSteps);
paintSteps();

markReveals('.sec__h', 'lines');
markMagnets('.btn--gold, .bar__cta', 26);
initReveals();
initMagnets();
