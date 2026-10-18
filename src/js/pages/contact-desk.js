/**
 * CONTACT — le comptoir d'accueil (18/10/2026).
 *
 * La demande générale (`data-inquiry="general"`, envoyée par inquiry.js) est
 * posée sur le comptoir : la fiche d'accueil en quatre blocs, et la fiche de
 * routage qui se compose à mesure qu'on écrit.
 *   · une division cochée s'allume dans SA couleur, se tamponne sur la
 *     fiche (« For »), colore la barre de signal de la fiche d'accueil et
 *     la lampe du comptoir ; sur ordinateur, une lumière vole de la clé à la
 *     fiche ;
 *   · le nom, l'organisation, le téléphone, l'email, la façon de répondre,
 *     le moment et la date s'impriment ligne par ligne ; le message s'écrit
 *     sur les lignes de la fiche, avec son curseur ;
 *   · chaque bloc rempli allume son voyant et une barre du signal ; après un
 *     envoi tenté, ce qui manque s'écrit en rouge sur la fiche ;
 *   · la ligne du temps allume l'arrêt choisi et se remplit jusqu'à lui.
 * La confirmation : la fiche détachée, ses lignes qui s'impriment, le tampon.
 * Rien ici ne change les champs, leurs noms ni leurs valeurs.
 */
import gsap from 'gsap';
import { LITE } from '../division.js';
import { reduced } from '../motion.js';

const TZ = 'Africa/Addis_Ababa';
const isMail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLong = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  if (!m) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export function initDesk() {
  const form = document.querySelector('form[data-inquiry="general"]');
  const slip = form?.querySelector('[data-slip]');
  const desk = form?.closest('[data-desk]');
  if (!form || !slip || !desk) return;
  const still = reduced();
  const wide = matchMedia('(min-width: 64.01rem)');
  const $ = (sel, root = slip) => root.querySelector(sel);

  const today = $('[data-slip-date]');
  if (today) {
    today.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      .format(new Date()).replace(',', '');
  }

  const keys = [...form.querySelectorAll('input[name="division"]')];
  const info = new Map(keys.map((k) => {
    const lab = k.closest('label');
    return [k.value, { name: lab?.textContent.trim() || k.value, c: lab?.style.getPropertyValue('--c').trim() || '' }];
  }));
  const tagsBox = $('[data-slip-to]');
  const ph = tagsBox?.querySelector('.ct-slip__ph');
  const bar = form.querySelector('.ct-card__bar');
  const routeTo = form.querySelector('[data-route-to]');
  const rows = Object.fromEntries([...slip.querySelectorAll('[data-sl]')].map((r) => [r.dataset.sl, r]));
  const how = [...slip.querySelectorAll('[data-slip-how] li')];
  const msg = $('[data-slip-msg]');
  const bars = [...slip.querySelectorAll('[data-slip-bars] i')];
  const state = $('[data-slip-state]');
  const blocks = Object.fromEntries([...form.querySelectorAll('[data-blk]')].map((b) => [b.dataset.blk, b]));
  const track = form.querySelector('[data-track]');
  const stops = track ? [...track.querySelectorAll('.ct-stop')] : [];
  const area = form.querySelector('textarea[name="message"]');
  const note = form.querySelector('[data-inquiry-note]');
  const noteText = note?.textContent || '';

  const val = (name) => String(form.querySelector(`[name="${name}"]`)?.value || '').trim();
  const picked = (name) => [...form.querySelectorAll(`[name="${name}"]:checked`)];
  const textOf = (el) => el.closest('label')?.textContent.trim() || el.value;

  let armed = false;    // pas d'animation au premier dessin
  let tried = false;    // un envoi a été tenté : ce qui manque se signale
  const order = [];     // les divisions, dans l'ordre où elles ont été choisies

  /* Une ligne de la fiche : la valeur s'imprime en glissant à peine. */
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

  /* La lumière qui vole de la clé à la fiche (ordinateur, fiche à l'écran). */
  const fly = (key, c) => {
    if (still || LITE || !wide.matches || !tagsBox) return false;
    const t = tagsBox.getBoundingClientRect();
    if (t.top < 0 || t.bottom > window.innerHeight) return false;
    const d = desk.getBoundingClientRect();
    const k = key.closest('label').getBoundingClientRect();
    const dot = document.createElement('i');
    dot.className = 'ct-fly';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.setProperty('--c', c);
    const x0 = k.left + 20 - d.left;
    const y0 = k.top + k.height / 2 - d.top;
    const last = tagsBox.lastElementChild?.getBoundingClientRect();
    const x1 = (last && last.width ? last.left + last.width / 2 : t.left + 30) - d.left;
    const y1 = (last && last.height ? last.top + last.height / 2 : t.top + t.height / 2) - d.top;
    dot.style.left = `${x0}px`;
    dot.style.top = `${y0}px`;
    desk.append(dot);
    const dx = x1 - x0;
    const dy = y1 - y0;
    gsap.timeline({ onComplete: () => dot.remove() })
      .to(dot, { x: dx, duration: 0.62, ease: 'power1.inOut' }, 0)
      .to(dot, { y: dy, duration: 0.62, ease: 'back.in(2.2)' }, 0)
      .to(dot, { scale: 2.4, autoAlpha: 0, duration: 0.25, ease: 'power2.out' }, 0.6);
    return true;
  };

  /* Les divisions : tampons sur la fiche, barre de signal, lampe, ligne
     « Routes to ». */
  let sig = null;
  const paintRoute = (changed) => {
    const now = keys.filter((k) => k.checked).map((k) => k.value);
    for (const v of now) if (!order.includes(v)) order.push(v);
    for (let i = order.length - 1; i >= 0; i--) if (!now.includes(order[i])) order.splice(i, 1);
    const key = order.join(',');
    if (key === sig) return;
    sig = key;
    const anim = armed && !still;

    // Les tampons.
    if (tagsBox) {
      if (ph) ph.hidden = order.length > 0;
      const have = new Map([...tagsBox.querySelectorAll('.ct-tag')].filter((e) => !e.dataset.out).map((e) => [e.dataset.v, e]));
      order.forEach((v, i) => {
        if (have.has(v)) { have.delete(v); return; }
        const it = info.get(v);
        const tag = document.createElement('span');
        tag.className = 'ct-tag';
        tag.dataset.v = v;
        tag.textContent = it.name;
        tag.style.setProperty('--c', it.c || 'var(--slip-ink-3)');
        tag.style.setProperty('--r', `${((i * 37) % 5) - 2}deg`);
        tagsBox.append(tag);
        if (anim) {
          const flew = changed && changed.value === v && changed.checked ? fly(changed, it.c || '#efe8de') : false;
          gsap.fromTo(tag, { scale: 1.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2.4)', delay: flew ? 0.56 : 0, clearProps: 'transform,opacity,visibility' });
        }
      });
      have.forEach((tag) => {
        tag.dataset.out = '1';
        if (anim) gsap.to(tag, { scale: 0.6, autoAlpha: 0, duration: 0.25, ease: 'power2.in', onComplete: () => tag.remove() });
        else tag.remove();
      });
    }

    // La barre de signal de la fiche d'accueil : un segment par division.
    if (bar) {
      const segs = new Map([...bar.querySelectorAll('i')].map((i) => [i.dataset.v, i]));
      order.forEach((v) => {
        let seg = segs.get(v);
        if (seg) { segs.delete(v); bar.append(seg); return; }
        seg = document.createElement('i');
        seg.dataset.v = v;
        seg.style.setProperty('--c', info.get(v).c || 'var(--cream)');
        bar.append(seg);
        if (anim) gsap.from(seg, { scaleX: 0, duration: 0.6, ease: 'expo.out', clearProps: 'transform' });
      });
      segs.forEach((seg) => seg.remove());
      bar.classList.toggle('has-pick', order.length > 0);
    }

    // La lampe du comptoir prend la couleur de la dernière choisie.
    const lastC = order.length ? info.get(order[order.length - 1]).c : '';
    if (lastC) desk.style.setProperty('--pick', lastC);
    else desk.style.removeProperty('--pick');

    // « Routes to » sous les clés.
    if (routeTo) {
      routeTo.replaceChildren();
      if (order.length) {
        routeTo.append('Routes to');
        order.forEach((v) => {
          const it = info.get(v);
          const dot = document.createElement('i');
          dot.style.setProperty('--c', it.c || 'var(--cream)');
          const b = document.createElement('b');
          b.textContent = it.name;
          routeTo.append(dot, b);
        });
      }
    }
  };

  const refresh = (changed) => {
    paintRoute(changed);

    const name = val('name');
    const phone = val('phone');
    const mail = val('email');
    const text = val('message');
    const noName = tried && !name;
    put('from', noName ? '' : name, noName ? 'Name needed' : '');
    put('org', val('organization'));
    put('phone', tried && !phone ? '' : phone, tried && !phone ? 'Phone needed' : '');
    const badMail = tried && !isMail(mail);
    put('email', badMail ? '' : mail, badMail ? (mail ? 'Check this address' : 'Email needed') : '');

    const method = picked('contact_method')[0]?.value || '';
    how.forEach((li) => li.classList.toggle('is-on', li.dataset.v === method));

    const tl = picked('timeline')[0];
    put('start', tl ? textOf(tl) : '');
    put('date', dayLong(val('date')));

    // La ligne du temps.
    if (track) {
      const k = tl ? stops.indexOf(tl.closest('.ct-stop')) : -1;
      const onLine = k >= 0 && k <= 3;
      track.style.setProperty('--kp', onLine ? String(k / 3) : '0');
      stops.forEach((s, i) => s.classList.toggle('is-past', onLine && i < k));
    }

    if (msg) {
      const shown = text.length > 420 ? `${text.slice(0, 420)}…` : text;
      if (msg.textContent !== shown) msg.textContent = shown;
    }

    const done = {
      you: Boolean(name && phone && isMail(mail)),
      about: order.length > 0,
      when: Boolean(method || tl || val('date')),
      msg: Boolean(text)
    };
    Object.entries(done).forEach(([k, v]) => blocks[k]?.classList.toggle('is-done', v));
    const n = Object.values(done).filter(Boolean).length;
    bars.forEach((b, i) => b.classList.toggle('is-on', i < n));
    const ready = done.you && done.msg;
    if (state) {
      state.textContent = ready ? 'Ready to send' : 'Name, phone, email and message are needed';
      state.classList.toggle('is-ready', ready);
    }
    if (note && tried && !form.querySelector('[aria-invalid="true"]')) { note.classList.remove('is-warn'); note.textContent = noteText; }
  };

  let queued = null;
  const schedule = (e) => {
    const t = e?.target;
    if (queued) { if (t?.name === 'division') queued.changed = t; return; }
    queued = { changed: t?.name === 'division' ? t : null };
    requestAnimationFrame(() => { const q = queued; queued = null; refresh(q.changed); });
  };
  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);

  // Le curseur de la fiche, tant qu'on écrit le message.
  if (area) {
    area.addEventListener('focus', () => slip.classList.add('is-typing'));
    area.addEventListener('blur', () => slip.classList.remove('is-typing'));
  }

  // Après la vérification d'inquiry.js (inscrite avant nous) : ce qui manque
  // s'écrit sur la fiche, qui frémit une fois.
  form.addEventListener('submit', () => {
    if (form.classList.contains('is-sent')) return;
    tried = true;
    const bad = form.querySelector('[aria-invalid="true"]');
    note?.classList.toggle('is-warn', Boolean(bad));
    refresh(null);
    if (bad && !still) gsap.fromTo(slip, { x: -7 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.32)', clearProps: 'transform' });
  });

  refresh(null);
  armed = true;

  // La fiche colle au comptoir : si elle est plus haute que l'écran, c'est
  // son pied (le bouton) qui reste visible.
  const side = form.querySelector('[data-side]');
  if (side && 'ResizeObserver' in window) {
    const measure = () => side.style.setProperty('--side-h', `${side.offsetHeight}px`);
    measure();
    new ResizeObserver(measure).observe(side);
  }

  deskIn(form, slip);
  doneMotion();
}

/* L'arrivée au comptoir (ordinateur) : les blocs montent l'un après l'autre,
   la fiche de routage glisse et se pose. Rien ne bouge si on y est déjà,
   en mouvement réduit, ni sur écran tactile. */
function deskIn(form, slip) {
  if (reduced() || LITE) return;
  if (form.getBoundingClientRect().top < window.innerHeight * 0.9) return;
  const card = form.querySelector('.ct-card');
  const parts = form.querySelectorAll('.ct-card__top, .ct-blk');
  gsap.set(card, { autoAlpha: 0, y: 40 });
  gsap.set(parts, { autoAlpha: 0, y: 24 });
  gsap.set(slip, { autoAlpha: 0, y: 70, rotation: 2.5, transformOrigin: '0% 0%' });
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    gsap.timeline()
      .to(card, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0)
      .to(parts, { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.15)
      .to(slip, { autoAlpha: 1, y: 0, rotation: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.3);
  }, { rootMargin: '0px 0px -12% 0px' });
  io.observe(form);
}

/* La confirmation : la fiche détachée descend, ses lignes s'impriment, puis
   le tampon se pose. */
function doneMotion() {
  window.addEventListener('inquiry:sent', (e) => {
    if (e.detail?.division !== 'general' || reduced()) return;
    const box = document.querySelector('form[data-inquiry="general"]')?.parentElement.querySelector('[data-inquiry-done]');
    if (!box) return;
    const paper = box.querySelector('.ct-done__slip');
    const lines = box.querySelectorAll('dl > *');
    const stamp = box.querySelector('.ct-stamp');
    gsap.timeline({ defaults: { overwrite: 'auto' } })
      .from(box.querySelectorAll('.ct-done__msg > *:not([hidden])'), { opacity: 0, y: 18, duration: 0.7, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.1)
      .from(paper, { y: -36, rotation: 1.4, autoAlpha: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.15)
      .from(lines, { autoAlpha: 0, x: 8, duration: 0.35, stagger: 0.025, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.45)
      .fromTo(stamp, { autoAlpha: 0, scale: 1.9, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.5, ease: 'back.out(2.2)' }, '>-0.05');
  });
}
