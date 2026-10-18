/**
 * LES DEMANDES — un seul module pour les formulaires des sept divisions et
 * le formulaire général (brief §13, 17/10/2026).
 *
 * Un formulaire porte `data-inquiry="<division>"` (live, events, ai, music,
 * film, doc, rentals, general). Le module :
 *   · préremplit depuis l'adresse (`?type=wedding`, `?level=full`,
 *     `?item=drone`) — une carte « Ask about this » mène au formulaire déjà
 *     orienté ;
 *   · vérifie les champs obligatoires et l'email, et ignore en silence les
 *     robots (champ piège `website`) ;
 *   · compose une demande lisible, dont l'objet porte le préfixe de la
 *     division ([LIVE], [EVENT]…) : l'équipe trie les divisions sans les
 *     confondre, même quand tout arrive à la même adresse ;
 *   · l'envoie au service de formulaires de la division s'il est configuré
 *     (src/data/site.js → inquiry.endpoints), sinon par la messagerie du
 *     visiteur, avec téléphone et WhatsApp en secours, toujours affichés.
 */

import gsap from 'gsap';
import { inquiry as CFG, identity } from '../data/site.js';
import { divisionById } from '../data/divisions.js';
import { reduced } from './motion.js';

const LABEL = {
  general: 'Project inquiry',
  live: 'Live streaming quote request',
  events: 'Event proposal request',
  ai: 'AI production project',
  music: 'Music project',
  film: 'Film project',
  doc: 'Documentary commission',
  rentals: 'Rental quote request'
};

const PREFIX = { general: 'PROJECT', ...Object.fromEntries(Object.values(divisionById).map((d) => [d.id, d.prefix])) };

export const waLink = (text = '') =>
  `https://wa.me/${CFG.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/* Le libellé humain d'un champ : `data-label`, sinon le texte de son label. */
function labelOf(el, form) {
  if (el.dataset.label) return el.dataset.label;
  const group = el.closest('[data-group]');
  if (group?.dataset.group) return group.dataset.group;
  const lab = el.id ? form.querySelector(`label[for="${el.id}"]`) : el.closest('label');
  return (lab?.childNodes[0]?.textContent || lab?.textContent || el.name).replace(/\s*\(optional\)\s*/i, '').trim();
}

function collect(form) {
  const out = [];
  const seen = new Set();
  for (const el of form.elements) {
    if (!el.name || el.name === 'website' || el.type === 'submit' || el.type === 'button') continue;
    if (seen.has(el.name)) continue;
    seen.add(el.name);
    const label = labelOf(el, form);
    let value = '';
    if (el.type === 'checkbox' || el.type === 'radio') {
      const picked = [...form.querySelectorAll(`[name="${CSS.escape(el.name)}"]:checked`)]
        .map((i) => i.dataset.text || i.closest('label')?.textContent.trim() || i.value);
      value = picked.join(', ');
    } else if (el.tagName === 'SELECT') {
      value = el.value ? el.selectedOptions[0]?.textContent.trim() : '';
    } else {
      value = String(el.value || '').trim();
    }
    if (value) out.push([label, value]);
  }
  return out;
}

function setErr(field, msg) {
  const box = field.closest('.field') || field.closest('[data-group]');
  box?.classList.toggle('is-err', Boolean(msg));
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  let e = box?.querySelector('.field__err');
  if (msg) {
    if (!e) { e = document.createElement('span'); e.className = 'field__err'; e.setAttribute('role', 'alert'); box?.appendChild(e); }
    e.textContent = msg;
  } else e?.remove();
}

function validate(form) {
  let bad = null;
  for (const f of form.querySelectorAll('[required]')) {
    const v = String(f.value || '').trim();
    if (!v) { setErr(f, 'Required'); bad = bad || f; }
    else if (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setErr(f, 'Check this address'); bad = bad || f; }
    else setErr(f, null);
  }
  return bad;
}

/* L'adresse oriente le formulaire : ?type=, ?level=, ?item=, ?option=…
   N'importe quel choix nommé du formulaire (liste, case, bouton radio) peut
   être orienté ainsi ; jamais un champ de texte, et jamais le piège. */
export function prefill(form, params = new URLSearchParams(location.search)) {
  let hit = null;
  for (const [key, val] of params) {
    if (key === 'website') continue;
    const vals = val.split(',');
    for (const el of form.querySelectorAll(`[name="${CSS.escape(key)}"], [name="${CSS.escape(key)}[]"]`)) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (vals.includes(el.value)) { el.checked = true; hit ||= el; }
      } else if (el.tagName === 'SELECT') {
        if ([...el.options].some((o) => o.value === vals[0])) { el.value = vals[0]; hit ||= el; }
      }
    }
  }
  return hit;
}

function done(form, rows, mode, mail) {
  const box = form.parentElement.querySelector('[data-inquiry-done]');
  if (!box) return;
  const dl = box.querySelector('dl');
  if (dl) {
    dl.innerHTML = '';
    for (const [k, v] of rows) {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      dl.append(dt, dd);
    }
  }
  box.querySelector('[data-done-sent]')?.toggleAttribute('hidden', mode !== 'sent');
  box.querySelector('[data-done-mail]')?.toggleAttribute('hidden', mode !== 'mail');
  const again = box.querySelector('[data-done-mailto]');
  if (again && mail) again.href = mail;
  box.hidden = false;
  form.classList.add('is-sent');
  // Le défilement passe par Lenis quand il est là : un scrollIntoView natif
  // se battait avec lui pendant que la page raccourcissait (le formulaire
  // disparaît), et l'écran finissait plus bas que la confirmation.
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(box, { offset: -120, duration: reduced() ? 0 : 0.9, immediate: reduced() });
  else box.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  if (!reduced()) gsap.from(box, { autoAlpha: 0, y: 24, duration: 0.7, ease: 'power3.out' });
  // Le bouton d'envoi a disparu avec le formulaire : le focus va à la
  // confirmation, pour les lecteurs d'écran et le clavier.
  const head = box.querySelector('h2, h3, [data-done-focus]') || box;
  if (!head.hasAttribute('tabindex')) head.setAttribute('tabindex', '-1');
  window.setTimeout(() => head.focus({ preventScroll: true }), 60);
}

export function initInquiry(form) {
  if (!form || form.dataset.inquiryReady) return;
  form.dataset.inquiryReady = '1';
  const div = form.dataset.inquiry || 'general';
  const note = form.querySelector('[data-inquiry-note]');
  const noteText = note?.textContent || '';
  prefill(form);

  // Une erreur corrigée s'efface ; la dernière corrigée, la note revient à
  // son texte d'origine (avant, « A few fields still need you » restait).
  const clear = (e) => {
    if (e.target.getAttribute('aria-invalid') !== 'true') return;
    setErr(e.target, null);
    if (note && !form.querySelector('[aria-invalid="true"]')) note.textContent = noteText;
  };
  form.addEventListener('input', clear);
  form.addEventListener('change', clear);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    // Robot : on ne dit rien, on ne fait rien.
    if (form.querySelector('[name=website]')?.value) return;

    const bad = validate(form);
    if (bad) {
      if (note) note.textContent = 'A few fields still need you.';
      bad.focus();
      return;
    }

    const rows = collect(form);
    const who = rows.find(([k]) => /name/i.test(k))?.[1] || 'website visitor';
    const kind = rows.find(([k]) => /type of event|type of project|project type|event type|type/i.test(k))?.[1];
    const subject = `[${PREFIX[div] || 'PROJECT'}] ${LABEL[div] || 'Inquiry'} — ${who}${kind ? ` · ${kind}` : ''}`;
    const body = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nSent from ${location.href.split('?')[0]}`;
    const email = CFG.emails[div] || CFG.emails.general || identity.email;
    const mail = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const endpoint = CFG.endpoints[div] || CFG.endpoints.general;

    const submit = form.querySelector('[type=submit]');
    if (endpoint) {
      submit?.setAttribute('aria-busy', 'true');
      if (note) note.textContent = 'Sending…';
      try {
        const fd = new FormData(form);
        fd.append('_subject', subject);
        // `_division` : le formulaire général a déjà un champ « division ».
        fd.append('_division', div);
        const res = await fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        if (note) note.textContent = '';
        done(form, rows, 'sent', mail);
        window.dispatchEvent(new CustomEvent('inquiry:sent', { detail: { division: div, via: 'endpoint' } }));
        return;
      } catch {
        if (note) note.textContent = 'Our form service did not answer — opening your mail app instead.';
      } finally { submit?.removeAttribute('aria-busy'); }
    }

    done(form, rows, 'mail', mail);
    window.dispatchEvent(new CustomEvent('inquiry:sent', { detail: { division: div, via: 'mailto' } }));
    // Un navigateur piloté par un script de test (`navigator.webdriver`) ne
    // passe jamais la main à la messagerie : le 18/10, les essais d'envoi
    // des agents ont ouvert des dizaines de brouillons sur l'écran de
    // Dominique. Un vrai visiteur n'est jamais concerné.
    if (navigator.webdriver) return;
    window.setTimeout(() => { window.location.href = mail; }, 480);
  });
}

let linksReady = false;

export function initInquiries(root = document) {
  root.querySelectorAll('form[data-inquiry]').forEach(initInquiry);
  // Une carte de la même page (`?type=wedding#inquiry`) oriente le formulaire
  // avant que le défilement doux ne l'emmène (sans recharger la page, la
  // lecture de l'adresse au chargement ne la verrait pas). En capture : avant
  // le gestionnaire de `scroll.js`.
  if (!linksReady) {
    linksReady = true;
    document.addEventListener('click', (e) => {
      const a = e.target.closest?.('a[href*="?"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.search) return;
      document.querySelectorAll('form[data-inquiry]').forEach((f) => {
        const hit = prefill(f, url.searchParams);
        // Le champ choisi s'éclaire un instant, à l'arrivée du défilement.
        const box = hit?.closest('.field, [data-group]');
        if (box) {
          box.classList.add('is-picked');
          setTimeout(() => box.classList.remove('is-picked'), 2600);
        }
      });
    }, true);
  }
  // Les liens WhatsApp portent leur message dans `data-wa`.
  root.querySelectorAll('a[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
}
