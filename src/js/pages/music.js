/**
 * MUSIC PRODUCTION — le mur de LEDs, la console et le lecteur (17–18/10/2026).
 *
 *   initHero()      l'ouverture (`music-hero-leds.js`) : l'écran de LEDs d'une
 *                   scène de concert, un analyseur de spectre à 96 BPM, la
 *                   souris allume les diodes, un clic lance une gerbe.
 *                   Choisi le 18/10 à la place de « l'horizon du son ».
 *   initSay()       « pour qui » en prise : la phrase s'enregistre mot à
 *                   mot sous un curseur, les publics deviennent des
 *                   régions de piste qui respirent sur le tempo (18/10) ;
 *   initDesk()      la console : elle s'allume à l'arrivée, les faders
 *                   montent, le défilement (ou le survol) allume une tranche
 *                   après l'autre ; au survol, la tranche passe en solo, ses
 *                   boutons tournent avec la souris et son écran affiche le
 *                   service survolé ; les vumètres bougent tant qu'on les voit ;
 *   initDaw()       le processus en session de studio : cinq pistes, une
 *                   tête de lecture qui suit le défilement (18/10) ;
 *   initDeck()      la platine de l'écoute : le disque tourne, le bras va
 *                   au-dessus de la plage survolée ou choisie (18/10) ;
 *   initListen()    le portfolio musical, filtré par catégorie, et son
 *                   lecteur (un seul élément audio pour toute la page) ;
 *   initWires()     le fil entre les sections : une onde qui ne vibre que
 *                   quand la page défile (18/10) ;
 *   initSession()   la demande en feuille de séance : deux vumètres à
 *                   aiguille qui montent à mesure qu'on la remplit, les
 *                   diodes des pistes, la touche REC, la liste des pistes à
 *                   l'envoi (18/10/2026) ;
 *   linkPrefill()   un lien « Ask about… » oriente le formulaire.
 *
 * Tout s'arrête hors de l'écran ou quand l'onglet est caché. Sur téléphone :
 * moins de lignes, 30 images par seconde, densité 1,25. En mouvement réduit :
 * une image fixe du spectre, les faders posés, rien ne bouge.
 *
 * ─────────────── LES MORCEAUX : LA FORME ATTENDUE ───────────────
 * Un extrait s'ajoute dans src/data/portfolio.js, comme tout projet, avec la
 * catégorie « music ». Le lecteur affiche toute fiche « music » qui porte un
 * `audio` (ou au moins une `video`) :
 *
 *   {
 *     slug: 'nom-unique',
 *     title: 'Titre du morceau',
 *     category: 'music',
 *     musicCategory: 'songs' | 'beats' | 'scores' | 'commercial' | 'other',
 *     status: 'client' | 'own' | 'demo' | 'third' | 'worked',   // obligatoire (§10.C)
 *     role: '' | 'lead-producer' | 'partner' | 'technical' | 'contributor',
 *     artist: 'Artiste ou client (avec son accord)',  // facultatif
 *     year: 2026,                                     // facultatif
 *     audio: '/music/nom-unique.mp3',   // l'extrait : 30 à 90 s, MP3 ou AAC (m4a), 128 à 192 kb/s
 *     cover: '/music/nom-unique-400.webp',   // facultatif, carré, 400 px
 *     duration: '1:30',                 // facultatif, affiché avant le chargement
 *     video: 'https://…'                // facultatif : le clip, ouvert dans un nouvel onglet
 *   }
 *
 * Les fichiers vont dans public/music/. Une catégorie sans extrait affiche
 * « Selected tracks being prepared » : jamais de faux morceau.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootDivision, LITE } from '../division.js';
import { reduced } from '../motion.js';
import { byCategory, STATUS, ROLES } from '../../data/portfolio.js';
import { initTrack } from './music-track.js';
import { initHero } from './music-hero-leds.js';

/* Le bouton d'envoi a disparu avec le formulaire : le clavier passe au titre
   de la confirmation, un instant après — pendant le fondu d'inquiry.js, un
   élément encore `visibility: hidden` refuse le focus (relecture du 18/10). */
function focusDone(box, n = 0) {
  const h = box?.querySelector('h3');
  if (!h || document.activeElement === h) return;
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
  if (document.activeElement !== h && n < 10) window.setTimeout(() => focusDone(box, n + 1), 80);
}

gsap.registerPlugin(ScrollTrigger);

const BPM = 96;
const BEAT = 60 / BPM;

/* ─────────────── Outils ─────────────── */

/* Une couleur du thème, en [r, g, b] : on la fait calculer par le navigateur. */
function rgbOf(host, token) {
  const probe = document.createElement('i');
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;color:var(${token})`;
  host.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const nums = (c.match(/-?[\d.]+/g) || ['0', '0', '0']).map(Number);
  if (c.startsWith('color(')) return nums.slice(0, 3).map((v) => Math.round(v * 255));
  return nums.slice(0, 3);
}

/* Un bruit de valeur en deux dimensions, lissé : de quoi faire « respirer »
   un spectre sans jamais le répéter. */
function makeNoise(seed = 11) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const P = new Uint8Array(512);
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const V = new Float32Array(256);
  for (let i = 0; i < 256; i++) V[i] = rnd();
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = fade(x - xi), v = fade(y - yi);
    const X = xi & 255, Y = yi & 255;
    const a = V[P[P[X] + Y]], b = V[P[P[X + 1] + Y]];
    const c = V[P[P[X] + Y + 1]], d = V[P[P[X + 1] + Y + 1]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/* ═══════════════════ L'OUVERTURE ═══════════════════
   « Le mur de LEDs » (`music-hero-leds.js`), choisi par Dominique le 18/10
   parmi trois idées, « avec le son moins haut ». Il a remplacé « l'horizon
   du son » (les lignes de spectre en paysage), qu'il n'aimait pas. */

/* ═══════════════════ POUR QUI : LA PRISE ═══════════════════
   La phrase s'enregistre mot à mot au défilement : un curseur
   d'enregistrement avance de mot en mot, le transport compte les temps (un
   mot = un temps, quatre temps = une mesure) et la lampe REC s'allume tant
   que la prise avance. Chaque public (en rose) devient une région de piste
   qui s'ouvre derrière le mot quand le curseur l'atteint, avec sa petite
   forme d'onde : elle respire sur le tempo de la page tant que la section
   est à l'écran (une animation CSS, rien à calculer), et le survol (ou le
   doigt) la fait « rejouer » : l'onde se redessine sous un trait de lecture.
   En mouvement réduit : tout est posé, le curseur se retire. */

/* La forme d'onde d'un mot : des barres verticales dans une boîte de
   100 × 40, une enveloppe qui monte et retombe, un contenu qui varie. */
function clipWave(seed, n) {
  const noise = makeNoise(seed);
  let d = '';
  for (let k = 0; k < n; k++) {
    const u = k / (n - 1);
    const env = Math.sin(Math.PI * Math.min(1, 0.06 + u * 0.94)) ** 0.55;
    const a = Math.max(0.07, env * (0.18 + 0.82 * noise(k * 0.55, seed * 0.1) ** 1.4));
    const h = a * 18;
    const x = 2 + 96 * u;
    d += `M${x.toFixed(1)} ${(20 - h).toFixed(1)}V${(20 + h).toFixed(1)}`;
  }
  return d;
}

function initSay() {
  const el = document.querySelector('[data-say]');
  if (!el) return;
  const sec = el.closest('.mu-for');
  const words = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'mu-w';
          w.textContent = part;
          frag.append(w);
          words.push(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(el);

  // Les publics : une région de piste derrière chaque mot rose.
  const clips = words.filter((w) => w.closest('em'));
  clips.forEach((w, i) => {
    w.classList.add('mu-w--clip');
    w.style.setProperty('--k', (0.12 + ((i * 3) % 5) * 0.045).toFixed(3));
    const n = Math.max(12, Math.round(w.textContent.length * 3.4));
    // En tête du mot (pas à la fin) : un élément placé en fin de mot peut
    // passer à la ligne suivante et déformer la région.
    w.insertAdjacentHTML('afterbegin',
      `<span class="mu-clip" aria-hidden="true"><span class="mu-clip__draw"><svg class="mu-clip__wave" viewBox="0 0 100 40" preserveAspectRatio="none" focusable="false"><path d="${clipWave(5 + i * 11, n)}"/></svg></span></span>`);
  });

  const caret = document.createElement('span');
  caret.className = 'mu-caret';
  caret.setAttribute('aria-hidden', 'true');
  el.append(caret);
  const pos = sec?.querySelector('[data-tp-pos]');
  const still = reduced();

  // Rejouer une région : au survol (souris), au doigt, ou au clavier
  // (rien à atteindre au clavier : c'est un décor, la phrase reste lisible).
  const solo = (w) => {
    w.classList.remove('is-solo');
    void w.offsetWidth;
    w.classList.add('is-solo');
  };
  clips.forEach((w) => {
    w.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') solo(w); });
    w.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') w.classList.remove('is-solo'); });
    w.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      solo(w);
      clearTimeout(w.muT);
      w.muT = setTimeout(() => w.classList.remove('is-solo'), 1900);
    }, { passive: true });
  });

  // La section à l'écran : le métronome et la respiration des régions.
  if (sec && !still) {
    new IntersectionObserver(([en]) => sec.classList.toggle('is-live', en.isIntersecting)).observe(sec);
  }

  if (still) {
    words.forEach((w) => w.classList.add('is-lit'));
    sec?.classList.add('is-done');
    if (pos) pos.textContent = `${String(Math.floor(words.length / 4) + 1).padStart(2, '0')}.${(words.length % 4) + 1}`;
    return;
  }

  /* Le curseur se pose juste après le dernier mot enregistré (avant le
     premier, au départ). D'une ligne à l'autre, il saute, sans traverser. */
  let lit = -1, lastY = null, rollT = 0;
  const place = (n, jump = false) => {
    const w = words[Math.max(0, n - 1)];
    if (!w) return;
    const fs = parseFloat(getComputedStyle(el).fontSize) || 48;
    const h = fs * 0.84;
    const x = n === 0 ? w.offsetLeft - fs * 0.14 : w.offsetLeft + w.offsetWidth + fs * 0.07;
    const y = w.offsetTop + (w.offsetHeight - h) / 2;
    caret.style.height = `${h.toFixed(1)}px`;
    if (jump || lastY === null || Math.abs(y - lastY) > 2) gsap.set(caret, { x, y });
    else gsap.to(caret, { x, y, duration: 0.32, ease: 'power3.out', overwrite: true });
    lastY = y;
  };
  const paint = (p, force = false) => {
    const n = Math.round(p * words.length);
    if (n === lit && !force) return;
    const moved = n !== lit && lit !== -1;
    lit = n;
    words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
    place(n, force);
    if (pos) pos.textContent = `${String(Math.floor(n / 4) + 1).padStart(2, '0')}.${(n % 4) + 1}`;
    sec?.classList.toggle('is-done', n >= words.length);
    if (moved && sec) {
      sec.classList.add('is-rolling');
      clearTimeout(rollT);
      rollT = setTimeout(() => sec.classList.remove('is-rolling'), 420);
    }
  };
  ScrollTrigger.create({
    trigger: el, start: 'top 88%', end: 'bottom 62%',
    onUpdate: (self) => paint(self.progress),
    onRefresh: (self) => paint(self.progress, true)
  });
  // Les polices d'un autre thème déplacent les mots : le curseur suit.
  document.fonts?.addEventListener?.('loadingdone', () => place(Math.max(0, lit), true));
}

/* ═══════════════════ LA CONSOLE ═══════════════════ */
function initDesk() {
  const desk = document.querySelector('[data-desk]');
  if (!desk) return;
  const chans = [...desk.querySelectorAll('[data-ch]')];
  const levels = chans.map((c) => parseFloat(c.style.getPropertyValue('--lv')) || 0.7);
  const meters = chans.map((c) => [...c.querySelectorAll('.mu-meter i')]);
  const still = reduced();
  chans.forEach((c, i) => c.style.setProperty('--i', String(i)));

  let active = -1, hover = -1, scrolled = -1, raised = false;

  const level = (i) => (i === active ? Math.min(0.96, levels[i] + 0.17) : levels[i]);
  const paint = () => {
    chans.forEach((c, i) => {
      c.classList.toggle('is-on', i === active);
      if (!raised) return;
      if (still) c.style.setProperty('--f', level(i).toFixed(3));
      else gsap.to(c, { '--f': level(i), duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
    });
    // Le survol met la tranche en SOLO : sa touche S s'allume, les autres
    // vumètres tombent.
    desk.classList.toggle('is-solo', hover >= 0);
  };
  const setActive = (i) => { if (i === active && desk.classList.contains('is-solo') === hover >= 0) return; active = i; paint(); };
  const pick = () => setActive(hover >= 0 ? hover : scrolled);

  if (still) {
    raised = true;
    chans.forEach((c, i) => {
      c.style.setProperty('--f', levels[i].toFixed(3));
      meters[i].forEach((m, k) => m.style.setProperty('--m', (levels[i] * (0.82 - k * 0.06)).toFixed(3)));
    });
  } else {
    // À l'arrivée : la mise sous tension (les diodes balaient la table, les
    // écrans clignotent, en CSS), puis les faders montent l'un après l'autre.
    desk.classList.add('is-cold');
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      raised = true;
      desk.classList.remove('is-cold');
      desk.classList.add('is-powered');
      chans.forEach((c, i) => gsap.to(c, { '--f': level(i), duration: 1.3, ease: 'expo.out', delay: 0.25 + i * 0.07 }));
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(desk);
  }

  // Le défilement allume une tranche après l'autre ; le survol a la priorité.
  const mm = gsap.matchMedia();
  mm.add('(min-width: 40.0625rem)', () => {
    const st = ScrollTrigger.create({
      trigger: desk, start: 'top 72%', end: 'bottom 62%',
      onUpdate: (self) => {
        scrolled = self.progress <= 0 ? -1 : Math.min(chans.length - 1, Math.floor(self.progress * chans.length));
        pick();
      },
      onLeave: () => { scrolled = chans.length - 1; pick(); },
      onLeaveBack: () => { scrolled = -1; pick(); }
    });
    return () => st.kill();
  });
  mm.add('(max-width: 40rem)', () => {
    const sts = chans.map((c, i) => ScrollTrigger.create({
      trigger: c, start: 'top 58%', end: 'bottom 58%',
      onToggle: (self) => {
        if (self.isActive) scrolled = i;
        else if (scrolled === i) scrolled = -1;
        pick();
      }
    }));
    return () => sts.forEach((s) => s.kill());
  });

  /* Sous la souris : les deux boutons de la tranche tournent avec elle
     (gauche-droite pour le gain, haut-bas pour l'égaliseur), et l'écran de
     la tranche affiche le service survolé, comme le ruban d'une console. */
  const scribble = (lcd, text) => {
    if (lcd.textContent === text) return;
    lcd.textContent = text;
    if (!still) gsap.fromTo(lcd, { opacity: 0.25 }, { opacity: 1, duration: 0.3, ease: 'steps(3)', overwrite: true });
  };
  chans.forEach((c, i) => {
    const lcd = c.querySelector('.mu-lcd');
    const base = lcd?.textContent || '';
    const items = [...c.querySelectorAll('.mu-ch__list li')];
    const reset = () => {
      c.style.removeProperty('--tw');
      c.style.removeProperty('--te');
      items.forEach((li) => li.classList.remove('is-hot'));
      if (lcd) scribble(lcd, base);
    };
    c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hover = i; pick(); } });
    c.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = c.getBoundingClientRect();
      const u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const v = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      c.style.setProperty('--tw', `${((u - 0.5) * 150).toFixed(1)}deg`);
      c.style.setProperty('--te', `${((0.5 - v) * 150).toFixed(1)}deg`);
      if (!lcd || !items.length) return;
      const hit = items.find((li) => {
        const b = li.getBoundingClientRect();
        return e.clientY >= b.top - 5 && e.clientY <= b.bottom + 5;
      });
      items.forEach((li) => li.classList.toggle('is-hot', li === hit));
      scribble(lcd, hit ? hit.textContent.trim() : base);
    });
    c.addEventListener('pointerleave', reset);
    c.addEventListener('focusin', () => { hover = i; pick(); });
    c.addEventListener('focusout', () => { hover = -1; pick(); });
  });
  desk.addEventListener('pointerleave', () => { hover = -1; pick(); });

  if (still) return;

  // Les vumètres : un signal inventé (silencieux), plus vif sur la tranche
  // allumée, presque éteint sur les autres quand une tranche est en solo.
  // Seulement quand la console est à l'écran.
  const noise = makeNoise(29);
  const val = meters.map((ms) => ms.map(() => 0));
  let visible = false, t = 0, skip = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(desk);
  gsap.ticker.add((time, dms) => {
    if (!visible || document.hidden || !raised) return;
    if (LITE && (skip = (skip + 1) % 2)) return;
    t += Math.min(0.1, dms / 1000) * (LITE ? 2 : 1);
    const ph = (t % BEAT) / BEAT;
    const kick = Math.exp(-ph * 5);
    const solo = hover >= 0;
    chans.forEach((c, i) => {
      const f = parseFloat(c.style.getPropertyValue('--f')) || 0;
      const on = i === active;
      meters[i].forEach((m, k) => {
        const n = noise(t * 2.4 + i * 7.3 + k * 1.7, i + k * 3);
        let target = f * (on ? 0.72 + 0.26 * kick : 0.45 + 0.2 * kick) * (0.62 + 0.5 * n);
        if (solo && !on) target *= 0.06;
        const cur = val[i][k];
        val[i][k] = cur + (Math.min(0.98, target) - cur) * (target > cur ? 0.55 : 0.12);
        m.style.setProperty('--m', val[i][k].toFixed(3));
      });
    });
  });
}

/* ═══════════════════ LE PROCESSUS : LA SESSION ═══════════════════
   La vue « arrangement » d'un logiciel de studio : cinq pistes, une région
   par étape, en escalier sur seize mesures. La tête de lecture suit le
   défilement (lissé) : derrière elle, chaque région passe de prévue (des
   pointillés) à enregistrée. Le transport affiche la mesure et le temps
   (seize mesures à 96 BPM : 40 secondes), et la touche lecture s'allume
   tant que la page défile. Au survol (ou au doigt), une piste s'écoute :
   un trait passe sur sa région. En mouvement réduit : la session est
   complète, la tête de lecture se retire. */

/* Les formes de chaque étape, dans une boîte de 200 × 40 (le centre à 20). */
const bars = (n, amp, cls = 'mu-wv') => {
  let d = '';
  for (let k = 0; k < n; k++) {
    const u = k / (n - 1);
    const h = Math.max(0.4, Math.min(1, amp(u, k)) * 17);
    const x = 2 + 196 * u;
    d += `M${x.toFixed(1)} ${(20 - h).toFixed(1)}V${(20 + h).toFixed(1)}`;
  }
  return `<path class="${cls}" vector-effect="non-scaling-stroke" d="${d}"/>`;
};
const DAW_SHAPES = {
  // La démo : trois phrases fredonnées, des silences entre elles.
  memo(seed) {
    const nz = makeNoise(seed);
    const phrases = [[0.03, 0.27], [0.36, 0.58], [0.67, 0.93]];
    return bars(84, (u, k) => {
      const p = phrases.find(([a, b]) => u >= a && u <= b);
      if (!p) return 0.02;
      const v = (u - p[0]) / (p[1] - p[0]);
      return Math.sin(Math.PI * v) ** 0.7 * (0.2 + 0.42 * nz(k * 0.6, 1));
    });
  },
  // Le plan : des notes posées, comme sur un rouleau de piano.
  plan() {
    const notes = [[4, 8, 22], [28, 14, 12], [44, 20, 18], [64, 11, 10], [76, 26, 20], [98, 17, 14], [114, 8, 22], [138, 23, 12], [152, 14, 18], [172, 29, 22], [24, 30, 16], [92, 32, 18], [150, 33, 20]];
    const d = notes.map(([x, y, w]) => `M${x} ${y}h${w}v3.2h${-w}z`).join('');
    return `<path class="mu-nt" d="${d}"/>`;
  },
  // La prise : une onde pleine, un couplet plus calme, un refrain plus fort.
  take(seed) {
    const nz = makeNoise(seed);
    return bars(118, (u, k) => {
      const sect = u < 0.42 ? 0.55 : u < 0.5 ? 0.35 : 0.88;
      const fade = Math.min(1, u * 12, (1 - u) * 14);
      return fade * sect * (0.5 + 0.5 * nz(k * 0.7, 3)) + 0.04;
    });
  },
  // Le mixage : la même matière, coupée et raccordée, et la courbe de volume.
  mix(seed) {
    const nz = makeNoise(seed);
    const w = bars(118, (u, k) => {
      if ((u > 0.315 && u < 0.34) || (u > 0.655 && u < 0.68)) return 0;
      const fade = Math.min(1, u * 10, (1 - u) * 10);
      return fade * (0.42 + 0.4 * nz(k * 0.5, 6)) + 0.04;
    });
    return `${w}<path class="mu-au" vector-effect="non-scaling-stroke" d="M2 13H60L72 8H128L140 11H198"/>`;
  },
  // Le master : une onde dense et régulière, qui s'éteint à la fin.
  master(seed) {
    const nz = makeNoise(seed);
    return bars(136, (u, k) => {
      const fade = Math.min(1, u * 30, (1 - u) * 7);
      return fade * (0.86 + 0.12 * nz(k * 0.9, 8));
    });
  }
};

function initDaw() {
  const daw = document.querySelector('[data-daw]');
  if (!daw) return;
  const ruler = daw.querySelector('[data-daw-ruler]');
  const rows = [...daw.querySelectorAll('.mu-trk')];
  const rgns = rows.map((r) => r.querySelector('.mu-rgn'));
  const geo = rgns.map((g) => ({
    x: parseFloat(g?.style.getPropertyValue('--x')) || 0,
    w: parseFloat(g?.style.getPropertyValue('--w')) || 0.3
  }));
  const posEl = daw.querySelector('[data-daw-pos]');
  const timeEl = daw.querySelector('[data-daw-time]');
  const still = reduced();

  // La règle : seize mesures, un chiffre toutes les quatre.
  if (ruler) {
    let marks = '';
    for (let b = 0; b < 16; b++) marks += `<span class="mu-daw__bar${b % 4 === 0 ? ' is-major' : ''}" style="--b:${b / 16}">${b % 4 === 0 ? b + 1 : ''}</span>`;
    ruler.insertAdjacentHTML('afterbegin', marks);
  }
  // Les régions : la même forme deux fois, prévue (en pointillés) et
  // enregistrée (découpée à la tête de lecture).
  rgns.forEach((g, i) => {
    if (!g) return;
    const shape = DAW_SHAPES[g.dataset.kind]?.(17 + i * 9) || '';
    const svg = `<svg viewBox="0 0 200 40" preserveAspectRatio="none" focusable="false">${shape}</svg>`;
    g.insertAdjacentHTML('beforeend', `<span class="mu-rgn__ghost">${svg}</span><span class="mu-rgn__rec">${svg}</span>`);
    g.addEventListener('animationend', (e) => { if (e.animationName === 'mu-aud') g.classList.remove('is-aud'); });
  });

  const fmtPos = (ph) => {
    const beats = Math.min(63.999, ph * 64);
    return `${String(Math.floor(beats / 4) + 1).padStart(2, '0')}.${Math.floor(beats % 4) + 1}`;
  };
  const fmtTime = (ph) => {
    const s = ph * 64 * BEAT;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };
  let rollT = 0;
  const set = (ph) => {
    daw.style.setProperty('--ph', ph.toFixed(4));
    geo.forEach((g, i) => {
      let f = Math.min(1, Math.max(0, (ph - g.x) / g.w));
      if (f > 0.998) f = 1;
      rgns[i]?.style.setProperty('--f', f.toFixed(3));
      const on = ph > g.x + 0.002;
      rows[i].classList.toggle('is-on', on);
      rows[i].classList.toggle('is-cur', on && f < 1);
      rows[i].classList.toggle('is-done', f >= 1);
    });
    if (posEl) posEl.textContent = fmtPos(ph);
    if (timeEl) timeEl.textContent = fmtTime(ph);
  };

  // Écouter une piste : un trait passe sur sa région.
  const audition = (row) => {
    const g = row.querySelector('.mu-rgn');
    if (!g || still) return;
    g.classList.remove('is-aud');
    void g.offsetWidth;
    g.classList.add('is-aud');
  };
  rows.forEach((row) => {
    row.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') audition(row); });
    row.addEventListener('click', () => audition(row));
  });

  if (still) { daw.classList.add('is-still'); set(1); return; }

  set(0);
  const proxy = { ph: 0 };
  gsap.to(proxy, {
    ph: 1, ease: 'none',
    scrollTrigger: { trigger: daw.querySelector('.mu-daw__tracks'), start: 'top 74%', end: 'bottom 50%', scrub: 0.5 },
    onUpdate: () => {
      set(proxy.ph);
      daw.classList.add('is-rolling');
      clearTimeout(rollT);
      rollT = setTimeout(() => daw.classList.remove('is-rolling'), 260);
    }
  });
}

/* ═══════════════════ LE FIL : L'ONDE DU DÉFILEMENT ═══════════════════
   Entre deux sections, une forme d'onde (deux canaux, L et R) qui ne vibre
   que quand la page défile : plus on défile vite, plus elle s'emballe ;
   à l'arrêt, elle retombe et se tait (un trait plat, plus rien à calculer).
   Dessinée seulement à l'écran. En mouvement réduit : une onde fixe. */
function initWires() {
  const items = [...document.querySelectorAll('[data-wire]')].map((box) => {
    const canvas = box.querySelector('canvas');
    let ctx = null;
    try { ctx = canvas?.getContext('2d'); } catch { ctx = null; }
    return { box, canvas, ctx, w: 0, h: 0, on: false, dv: [255, 92, 138], fg: [252, 235, 243] };
  }).filter((it) => it.ctx);
  if (!items.length) return;
  const still = reduced();
  const DPR = Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 2);
  const noise = makeNoise(53);
  // Au repos, le fil respire doucement (18/10 : « faire des animations en
  // continu ») ; défiler vite l'emballe.
  const IDLE = 0.2;
  let e = still ? 0.16 : IDLE, t = 1.3, lastY = window.scrollY, running = false, flat = false;

  const size = (it) => {
    const r = it.box.getBoundingClientRect();
    it.w = Math.max(1, r.width); it.h = Math.max(1, r.height);
    it.canvas.width = Math.round(it.w * DPR); it.canvas.height = Math.round(it.h * DPR);
    it.dv = rgbOf(it.box, '--dv'); it.fg = rgbOf(it.box, '--fg');
  };
  const draw = (it) => {
    const { ctx, w, h } = it;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    const N = LITE ? 110 : 200;
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${it.fg.join(',')},0.1)`;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
    const lit = Math.min(1, e * 3);
    [[0, 1.5, 0.95], [1, 1, 0.42]].forEach(([ch, lw, al]) => {
      ctx.beginPath();
      for (let j = 0; j <= N; j++) {
        const u = j / N;
        const env = Math.sin(Math.PI * u) ** 1.6;
        const v = Math.sin(u * 40 + t * 5 + ch * 2.1) * 0.42 + Math.sin(u * 97 - t * 7.3 + ch) * 0.2
          + (noise(u * 26 + ch * 9, t * 1.7) - 0.5) * 0.7;
        const y = mid - Math.max(-0.47, Math.min(0.47, v * env * e)) * h;
        if (j) ctx.lineTo(u * w, y); else ctx.moveTo(0, y);
      }
      ctx.strokeStyle = `rgba(${it.dv.join(',')},${(al * (0.32 + 0.68 * lit)).toFixed(3)})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    });
  };
  const drawAll = () => items.forEach((it) => { if (it.on || still) draw(it); });

  items.forEach((it) => {
    size(it);
    draw(it);
    new ResizeObserver(() => { size(it); draw(it); }).observe(it.box);
  });
  window.addEventListener('palette:change', () => setTimeout(() => items.forEach((it) => { size(it); draw(it); }), 90));
  if (still) return;

  const tick = (time, dms) => {
    const dt = Math.min(0.05, Math.max(0.001, (dms || 16) / 1000));
    const y = window.scrollY;
    const v = Math.abs(y - lastY) / dt;
    lastY = y;
    const target = Math.max(IDLE, Math.min(1, v / 2600));
    e += (target - e) * (1 - Math.exp(-dt * (target > e ? 14 : 2.4)));
    t += dt * (0.4 + 2.4 * e);
    if (!items.some((it) => it.on) || document.hidden) {
      gsap.ticker.remove(tick); running = false;
      return;
    }
    flat = false;
    if (LITE && (Math.round(time * 60) & 1)) return;   // au doigt : 30 images par seconde
    drawAll();
  };
  const wake = () => {
    if (running || document.hidden || !items.some((it) => it.on)) { lastY = window.scrollY; return; }
    running = true;
    gsap.ticker.add(tick);
  };
  const io = new IntersectionObserver((ens) => {
    ens.forEach((en) => {
      const it = items.find((x) => x.box === en.target);
      if (!it) return;
      it.on = en.isIntersecting;
      if (it.on) { draw(it); wake(); }
    });
  });
  document.addEventListener('visibilitychange', wake);
  items.forEach((it) => io.observe(it.box));
  window.addEventListener('scroll', wake, { passive: true });
}

/* ═══════════════════ L'ÉCOUTE ═══════════════════ */
const MCATS = [
  { id: 'songs', label: 'Original songs', type: 'song' },
  { id: 'beats', label: 'Instrumentals and beats', type: 'beat' },
  { id: 'scores', label: 'Film and documentary scores', type: 'score' },
  { id: 'commercial', label: 'Commercial music', type: 'commercial' },
  { id: 'other', label: 'Other audio projects', type: 'other' }
];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return '--:--';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

function emptyHTML(cat) {
  const c = MCATS.find((x) => x.id === cat);
  const href = c ? `?type=${c.type}#inquiry` : '#inquiry';
  // « All » : les cinq catégories du brief, comme les plages d'un disque,
  // chacune avec sa ligne d'onde encore à plat.
  const sides = c ? '' : `<ol class="mu-sides">${MCATS.map((x, i) => `
    <li class="mu-side">
      <span class="mu-side__n">${i < 3 ? 'A' : 'B'}${i < 3 ? i + 1 : i - 2}</span>
      <span class="mu-side__t">${esc(x.label)}</span>
      <span class="mu-side__w"><span class="mu-side__s">Being prepared</span></span>
      <a class="mu-side__go" href="?type=${x.type}#inquiry">Ask for samples<span class="mu-vh">: ${esc(x.label.toLowerCase())}</span></a>
    </li>`).join('')}</ol>`;
  return `<div class="dv-empty mu-empty${c ? '' : ' mu-empty--all'}">
    <div>
      <p class="dv-mono">${esc(c ? c.label : 'All categories')}</p>
      <h3 class="dv-empty__h">Selected tracks being prepared</h3>
      <p>Ask our team for samples${c ? ` of ${esc(c.label.toLowerCase())}` : ''}.</p>
    </div>
    ${c ? `<a class="dv-btn dv-btn--ghost" href="${href}">Ask for samples${ARROW}</a>` : ''}${sides}
  </div>`;
}

function trackHTML(p) {
  const meta = [p.artist, STATUS[p.status], ROLES[p.role], p.year].filter(Boolean).join(' · ');
  const title = esc(p.title);
  const play = p.audio
    ? `<button class="mu-play" type="button" aria-pressed="false" aria-label="Play ${title}">
        <svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>
        <svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>
      </button>`
    : `<span class="mu-play" aria-hidden="true" style="opacity:.35"><svg class="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg></span>`;
  const cover = p.cover
    ? `<div class="mu-cover"><img src="${esc(p.cover)}" alt="" width="400" height="400" loading="lazy" decoding="async"></div>`
    : '<div class="mu-cover mu-cover--none" aria-hidden="true"></div>';
  const bar = p.audio
    ? `<div class="mu-track__bar">
        <input class="mu-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek in ${title}" disabled>
        <span class="mu-time"><span data-cur>0:00</span> / <span data-dur>${esc(p.duration || '--:--')}</span></span>
      </div>`
    : '<div class="mu-track__bar"></div>';
  const vid = p.video ? `<a class="mu-track__vid" href="${esc(p.video)}" target="_blank" rel="noopener">Music video ↗</a>` : '<span></span>';
  return `<li class="mu-track" data-slug="${esc(p.slug)}">
    ${play}${cover}
    <div><h3 class="mu-track__t">${title}</h3>${meta ? `<p class="mu-track__m">${esc(meta)}</p>` : ''}</div>
    ${bar}${vid}
  </li>`;
}

function initListen() {
  const root = document.getElementById('portfolio');
  const box = root?.querySelector('[data-tracks]');
  const filter = root?.querySelector('[data-filter]');
  if (!box) return;
  const all = byCategory('music').filter((p) => p.audio || p.video);
  let cat = 'all';

  /* Le lecteur : un seul élément audio pour toute la page. */
  const audio = new Audio();
  audio.preload = 'none';
  let cur = null;                       // la fiche en cours
  const rowOf = (slug) => box.querySelector(`.mu-track[data-slug="${CSS.escape(slug)}"]`);
  const sync = () => {
    // La platine suit le lecteur : le bras se pose sur la plage de l'extrait.
    const band = cur && !audio.paused ? MCATS.findIndex((x) => x.id === cur.musicCategory) : -1;
    cueDeck({ play: cur && !audio.paused ? Math.max(0, band) : -1 });
    box.querySelectorAll('.mu-track').forEach((row) => {
      const mine = cur && row.dataset.slug === cur.slug;
      const playing = mine && !audio.paused;
      row.classList.toggle('is-playing', Boolean(playing));
      const b = row.querySelector('button.mu-play');
      const title = row.querySelector('.mu-track__t')?.textContent || '';
      if (b) { b.setAttribute('aria-pressed', String(Boolean(playing))); b.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${title}`); }
      const seek = row.querySelector('.mu-seek');
      if (seek) seek.disabled = !mine;
    });
  };
  const progress = () => {
    if (!cur) return;
    const row = rowOf(cur.slug);
    if (!row) return;
    const d = audio.duration, c = audio.currentTime;
    const seek = row.querySelector('.mu-seek');
    const p = Number.isFinite(d) && d > 0 ? c / d : 0;
    if (seek && document.activeElement !== seek) seek.value = String(Math.round(p * 1000));
    seek?.style.setProperty('--p', `${(p * 100).toFixed(2)}%`);
    seek?.setAttribute('aria-valuetext', `${fmt(c)} of ${fmt(d)}`);
    const ce = row.querySelector('[data-cur]'); if (ce) ce.textContent = fmt(c);
    const de = row.querySelector('[data-dur]'); if (de && Number.isFinite(d)) de.textContent = fmt(d);
  };
  const toggle = (p) => {
    if (cur?.slug !== p.slug) {
      cur = p;
      audio.src = p.audio;
      if ('mediaSession' in navigator && window.MediaMetadata) {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: p.title, artist: p.artist || 'Teddy Studio',
          artwork: p.cover ? [{ src: p.cover, sizes: '400x400' }] : []
        });
      }
    }
    if (audio.paused) audio.play().catch(() => fail(p)); else audio.pause();
    sync();
  };
  const fail = (p) => {
    const row = rowOf(p.slug);
    if (row && !row.querySelector('.mu-track__err')) {
      row.insertAdjacentHTML('beforeend', '<p class="mu-track__err" role="status">This preview could not be loaded. Ask our team for the file.</p>');
    }
    sync();
  };
  ['play', 'pause'].forEach((ev) => audio.addEventListener(ev, sync));
  ['timeupdate', 'loadedmetadata', 'durationchange'].forEach((ev) => audio.addEventListener(ev, progress));
  audio.addEventListener('ended', () => { audio.currentTime = 0; progress(); sync(); });
  audio.addEventListener('error', () => { if (cur) fail(cur); });

  box.addEventListener('click', (e) => {
    const b = e.target.closest('button.mu-play');
    if (!b) return;
    const p = all.find((x) => x.slug === b.closest('.mu-track')?.dataset.slug);
    if (p?.audio) toggle(p);
  });
  box.addEventListener('input', (e) => {
    const seek = e.target.closest('.mu-seek');
    if (!seek || !cur || seek.closest('.mu-track')?.dataset.slug !== cur.slug) return;
    const d = audio.duration;
    if (Number.isFinite(d) && d > 0) audio.currentTime = (Number(seek.value) / 1000) * d;
    progress();
  });

  const render = (animate) => {
    const list = cat === 'all' ? all : all.filter((p) => p.musicCategory === cat);
    if (cur && !list.some((p) => p.slug === cur.slug)) { audio.pause(); }
    box.innerHTML = list.length ? `<ol class="mu-list">${list.map(trackHTML).join('')}</ol>` : emptyHTML(cat);
    cueDeck({ cat: MCATS.findIndex((x) => x.id === cat), hover: -1 });
    sync(); progress();
    if (animate && !reduced()) gsap.fromTo(box, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
  };

  filter?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b || b.dataset.cat === cat) return;
    cat = b.dataset.cat;
    filter.querySelectorAll('button[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render(true);
  });

  render(false);

  // En développement seulement : essayer le lecteur avec des fiches de test.
  if (import.meta.env?.DEV) {
    window.__muPlayer = { load(entries) { all.splice(0, all.length, ...entries); render(true); }, audio };
  }
}

/* ═══════════════════ LA PLATINE ═══════════════════
   Le disque tourne lentement tant qu'on le voit (il démarre et s'arrête en
   douceur, comme un plateau). Ses cinq plages sont les cinq catégories, dans
   l'ordre de la liste (A1 à B2). Survoler une plage de la liste (ou la
   toucher, ou y arriver au clavier), ou choisir une catégorie, amène le bras
   au-dessus de la plage, levé, en attente : il ne se pose que le jour où un
   extrait joue vraiment, et le disque prend alors sa vraie vitesse
   (33 tours, 1,8 s par tour). Le bras est un dessin SVG qui tourne autour de
   son pivot (en CSS) ; l'angle de chaque plage est calculé ici, pour que la
   pointe tombe au milieu de la plage. */
const SIDES = ['A1', 'A2', 'A3', 'B1', 'B2'];
const BANDS = [45, 39.8, 34.6, 29.4, 24.2, 19];        // les bords des plages, en centièmes du plateau
const TT = { pivot: [86, 14], tip: [-6.1, 51.8], c: [40, 40], k: 0.68 };   // le socle mesure 100 × 80

let cueDeck = () => {};

function initDeck() {
  const tt = document.querySelector('[data-tt]');
  if (!tt) return;
  const disc = tt.querySelector('[data-tt-disc]');
  const bandsSvg = tt.querySelector('[data-tt-bands]');
  const lcd = tt.querySelector('[data-tt-lcd]');
  const still = reduced();

  // Les plages : les sillons plus lisses entre elles, et la lumière de la
  // plage choisie.
  let g = '';
  for (let k = 1; k < BANDS.length - 1; k++) g += `<circle class="mu-tt__gap" cx="50" cy="50" r="${BANDS[k]}"/>`;
  g += `<circle class="mu-tt__gap mu-tt__gap--in" cx="50" cy="50" r="${BANDS[BANDS.length - 1]}"/>`;
  for (let k = 0; k < SIDES.length; k++) {
    const r = (BANDS[k] + BANDS[k + 1]) / 2;
    g += `<circle class="mu-tt__band" cx="50" cy="50" r="${r.toFixed(2)}" stroke-width="${(BANDS[k] - BANDS[k + 1] - 0.7).toFixed(2)}"/>`;
  }
  if (bandsSvg) bandsSvg.innerHTML = g;
  const rings = [...(bandsSvg?.querySelectorAll('.mu-tt__band') || [])];

  // L'angle du bras pour chaque plage : la pointe au milieu de la plage.
  const dist = (deg) => {
    const a = (deg * Math.PI) / 180;
    const [x, y] = TT.tip;
    const sx = TT.pivot[0] + x * Math.cos(a) - y * Math.sin(a);
    const sy = TT.pivot[1] + x * Math.sin(a) + y * Math.cos(a);
    return Math.hypot(sx - TT.c[0], sy - TT.c[1]);
  };
  const ANG = SIDES.map((_, k) => {
    const target = ((BANDS[k] + BANDS[k + 1]) / 2) * TT.k;
    let lo = 0, hi = 60;
    for (let n = 0; n < 32; n++) { const m = (lo + hi) / 2; if (dist(m) > target) lo = m; else hi = m; }
    return (lo + hi) / 2;
  });

  let hoverCue = -1, catCue = -1, playCue = -1, live = false;
  // Le plateau : un tour en 8 s au repos, 1,8 s quand un extrait joue.
  const spin = still || !disc ? null : gsap.to(disc, { rotation: '+=360', duration: 8, ease: 'none', repeat: -1, paused: true });
  spin?.timeScale(0.001);
  const speed = () => {
    if (!spin) return;
    const target = live && !document.hidden ? (playCue >= 0 ? 8 / 1.8 : 1) : 0;
    if (target > 0 && spin.paused()) { spin.timeScale(Math.max(0.001, spin.timeScale())); spin.play(); }
    gsap.to(spin, {
      timeScale: Math.max(0.001, target), duration: target ? 1.6 : 0.9, ease: 'power2.inOut', overwrite: true,
      onComplete: () => { if (!target) spin.pause(); }
    });
  };
  const apply = () => {
    const i = playCue >= 0 ? playCue : hoverCue >= 0 ? hoverCue : catCue;
    tt.style.setProperty('--arm', `${i >= 0 ? ANG[i].toFixed(2) : 0}deg`);
    tt.classList.toggle('is-cued', i >= 0 && playCue < 0);
    tt.classList.toggle('is-playing', playCue >= 0);
    rings.forEach((r, k) => r.classList.toggle('is-on', k === i));
    if (lcd) lcd.textContent = playCue >= 0 ? `Play · ${SIDES[i]}` : i >= 0 ? `Cue · ${SIDES[i]}` : 'Standby';
  };
  cueDeck = ({ hover, cat, play } = {}) => {
    const was = playCue;
    if (hover !== undefined) hoverCue = hover;
    if (cat !== undefined) catCue = cat;
    if (play !== undefined) playCue = play;
    apply();
    if ((was >= 0) !== (playCue >= 0)) speed();
  };
  apply();

  if (spin) {
    new IntersectionObserver(([en]) => { live = en.isIntersecting; speed(); }, { rootMargin: '0px 0px -10% 0px' }).observe(tt);
    document.addEventListener('visibilitychange', speed);
  }

  /* La liste : survoler une plage (ou y arriver au clavier) amène le bras ;
     au doigt, toucher la ligne l'amène quelques instants. */
  const box = document.querySelector('[data-tracks]');
  if (!box) return;
  const sideOf = (el) => {
    const row = el?.closest?.('.mu-side');
    return row ? [...box.querySelectorAll('.mu-side')].indexOf(row) : -1;
  };
  let touchT = 0;
  box.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') cueDeck({ hover: sideOf(e.target) }); });
  box.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') cueDeck({ hover: -1 }); });
  box.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const i = sideOf(e.target);
    if (i < 0) return;
    cueDeck({ hover: i });
    clearTimeout(touchT);
    touchT = setTimeout(() => cueDeck({ hover: -1 }), 2600);
  }, { passive: true });
  box.addEventListener('focusin', (e) => cueDeck({ hover: sideOf(e.target) }));
  box.addEventListener('focusout', () => cueDeck({ hover: -1 }));
}

/* ═══════════════════ LA FEUILLE DE SÉANCE ═══════════════════
   Le formulaire de la page, en feuille de séance de studio (18/10/2026).
   Rien ici ne touche à l'envoi (`inquiry.js`) : on écoute seulement.

     · le pont : deux vumètres à aiguille (L et R) et l'écran de la séance.
       Le niveau monte à mesure que la feuille se remplit : −3 VU quand le
       nom, le téléphone et l'email sont là, 0 VU quand tout est rempli ;
       chaque frappe donne une petite impulsion, choisir un type ou une étape
       une plus franche. L'aiguille est un ressort amorti (la vraie balistique
       d'un vumètre, à peu près), calculé seulement tant qu'elle bouge.
     · les pistes : la diode s'allume quand la piste est remplie ;
     · la touche REC s'allume quand la feuille peut partir ;
     · à l'envoi, la liste des pistes défile sous une tête de lecture.
   En mouvement réduit : les aiguilles se posent sans ressort ni impulsion. */
const VU = { sweep: 48, px: 100, py: 135 };
const VU_MARKS = [[-20, 0], [-10, 0.25], [-7, 0.37], [-5, 0.47], [-3, 0.58], [-2, 0.645], [-1, 0.71], [0, 0.775], [1, 0.845], [2, 0.92], [3, 1]];
const vuPt = (u, r) => {
  const a = ((-VU.sweep + u * 2 * VU.sweep) * Math.PI) / 180;
  return [VU.px + r * Math.sin(a), VU.py - r * Math.cos(a)];
};
const f1 = (n) => n.toFixed(1);

function vuSVG(ch) {
  const id = `mu-vu-face-${ch}`;
  const arc = (u0, u1, r) => {
    const [x0, y0] = vuPt(u0, r);
    const [x1, y1] = vuPt(u1, r);
    return `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 0 1 ${f1(x1)} ${f1(y1)}`;
  };
  let ticks = '';
  let nums = '';
  VU_MARKS.forEach(([db, u]) => {
    const hot = db > 0 ? ' class="is-hot"' : '';
    const [x0, y0] = vuPt(u, 101);
    const [x1, y1] = vuPt(u, [-20, -10, -5, 0, 3].includes(db) ? 111 : 108);
    ticks += `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"${hot}/>`;
    const [lx, ly] = vuPt(u, 119);
    nums += `<text x="${f1(lx)}" y="${f1(ly + 3)}"${hot}>${Math.abs(db)}</text>`;
  });
  // Les petites graduations entre −20 et −10, et entre −10 et −7.
  [0.0625, 0.125, 0.1875, 0.29, 0.33].forEach((u) => {
    const [x0, y0] = vuPt(u, 101);
    const [x1, y1] = vuPt(u, 105);
    ticks += `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`;
  });
  return `<svg viewBox="0 0 200 118" focusable="false" aria-hidden="true">
    <defs><radialGradient id="${id}" cx="50%" cy="92%" r="88%"><stop offset="0" class="mu-vu__s0"/><stop offset="1" class="mu-vu__s1"/></radialGradient></defs>
    <rect width="200" height="118" fill="url(#${id})"/>
    <path class="mu-vu__arc" d="${arc(0, 0.775, 101)}"/>
    <path class="mu-vu__red" d="${arc(0.775, 1, 103.5)}"/>
    <g class="mu-vu__ticks">${ticks}</g>
    <g class="mu-vu__nums">${nums}</g>
    <text class="mu-vu__vu" x="100" y="74">VU</text>
    <g class="mu-vu__needle" transform="rotate(${-VU.sweep} ${VU.px} ${VU.py})">
      <line class="mu-vu__shade" x1="${VU.px + 1.6}" y1="${VU.py + 2}" x2="${VU.px + 1.6}" y2="${VU.py - 108}"/>
      <line class="mu-vu__hand" x1="${VU.px}" y1="${VU.py}" x2="${VU.px}" y2="${VU.py - 110}"/>
    </g>
    <path class="mu-vu__shroud" d="M0 118V98Q100 80 200 98V118Z"/>
    <text class="mu-vu__ch" x="12" y="112">${ch}</text>
  </svg>`;
}

/* La piste remplie, et la feuille prête : les mêmes règles que `inquiry.js`. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const isOn = (el) => (el.type === 'radio' || el.type === 'checkbox' ? el.checked : String(el.value || '').trim() !== '');
const isOk = (el) => {
  const v = String(el.value || '').trim();
  return Boolean(v) && (el.type !== 'email' || EMAIL.test(v));
};

let syncSheet = () => {};

function initSession() {
  const sheet = document.querySelector('[data-sheet]');
  const form = sheet?.querySelector('form[data-inquiry="music"]');
  if (!form) return;
  const bridge = sheet.querySelector('[data-bridge]');
  const rec = form.querySelector('[data-rec]');
  const done = sheet.querySelector('[data-inquiry-done]');
  const cells = [...form.querySelectorAll('.mu-cell')].map((el) => ({ el, ctl: [...el.querySelectorAll('input, select, textarea')] }));
  const required = [...form.querySelectorAll('[required]')];
  const optional = cells.filter((c) => !c.ctl.some((e) => e.required));
  const note = form.querySelector('[data-inquiry-note]');
  const noteText = note?.textContent || '';
  const still = reduced();

  /* L'écran : un mot change, il clignote une fois, comme un afficheur. */
  const disp = {};
  bridge?.querySelectorAll('[data-disp]').forEach((el) => { disp[el.dataset.disp] = el; });
  const show = (k, v) => {
    const el = disp[k];
    if (!el || el.textContent === v) return;
    el.textContent = v;
    if (!still) gsap.fromTo(el, { opacity: 0.15 }, { opacity: 1, duration: 0.42, ease: 'steps(4)', overwrite: true });
  };

  /* Les aiguilles. `level` est la cible (0 = −20, 0,775 = 0 VU, 1 = +3). */
  const needles = [];
  bridge?.querySelectorAll('[data-vu]').forEach((box) => {
    box.innerHTML = vuSVG(box.dataset.vu);
    needles.push(box.querySelector('.mu-vu__needle'));
  });
  const st = needles.map(() => ({ a: 0, v: 0, kick: 0 }));
  let level = 0;
  let running = false;
  const put = () => needles.forEach((n, i) => {
    const u = Math.max(-0.03, Math.min(1.04, st[i].a));
    n.setAttribute('transform', `rotate(${(-VU.sweep + u * 2 * VU.sweep).toFixed(2)} ${VU.px} ${VU.py})`);
  });
  const tick = (time, dms) => {
    const dt = Math.min(0.05, (dms || 16) / 1000);
    let busy = false;
    st.forEach((s) => {
      s.kick *= Math.exp(-dt * 4.5);
      const target = level + s.kick;
      s.v += (150 * (target - s.a) - 17 * s.v) * dt;   // un ressort un peu amorti : l'aiguille dépasse à peine
      s.a += s.v * dt;
      if (Math.abs(target - s.a) > 0.0015 || Math.abs(s.v) > 0.004 || s.kick > 0.002) busy = true;
    });
    put();
    if (!busy) { gsap.ticker.remove(tick); running = false; }
  };
  const wake = () => {
    if (!needles.length) return;
    if (still) { st.forEach((s) => { s.a = level; s.v = 0; }); put(); return; }
    if (!running) { running = true; gsap.ticker.add(tick); }
  };
  const kick = (amt) => {
    if (still) return;
    st.forEach((s, i) => { s.kick = Math.min(0.3, s.kick + amt * (i ? 0.7 + Math.random() * 0.6 : 1)); });
    wake();
  };

  const update = () => {
    let opt = 0;
    cells.forEach(({ el, ctl }) => el.classList.toggle('is-filled', ctl.some(isOn)));
    optional.forEach(({ ctl }) => { if (ctl.some(isOn)) opt += 1; });
    const req = required.filter(isOk).length;
    const ready = req === required.length;
    level = 0.58 * (req / required.length) + 0.195 * (optional.length ? opt / optional.length : 0);

    const type = form.elements.namedItem('type');
    show('type', type?.value ? type.selectedOptions[0].textContent.trim() : 'Untitled session');
    const stage = form.querySelector('[name="stage"]:checked');
    show('stage', stage ? stage.closest('label').textContent.trim() : '—');
    show('status', ready ? 'Ready to send' : req + opt ? 'Recording' : 'Standby');
    show('req', `${req}/${required.length}`);
    bridge?.classList.toggle('is-ready', ready);
    rec?.classList.toggle('is-ready', ready);
    // Le rappel « il manque des champs » (`inquiry.js`) s'efface une fois
    // la feuille complète.
    if (ready && note && note.textContent === 'A few fields still need you.') note.textContent = noteText;
    wake();
  };
  syncSheet = () => { update(); kick(0.14); };

  form.addEventListener('input', (e) => {
    if (e.target.matches('input:not([type=radio]):not([type=checkbox]), textarea')) kick(0.045 + Math.random() * 0.05);
    update();
  });
  form.addEventListener('change', (e) => {
    if (e.target.matches('select, [type=radio]')) kick(0.16);
    update();
  });
  // `inquiry.js` a vérifié la feuille juste avant (même événement, écouté
  // plus tôt) : une piste en erreur fait « saturer » l'écran un instant.
  form.addEventListener('submit', () => {
    if (!form.querySelector('.is-err')) return;
    show('status', 'Check the sheet');
    bridge?.classList.add('is-clip');
    setTimeout(() => { bridge?.classList.remove('is-clip'); update(); }, 2200);
  });

  window.addEventListener('inquiry:sent', (e) => {
    if (e.detail?.division !== 'music') return;
    show('status', e.detail.via === 'endpoint' ? 'Request sent' : 'Request ready');
    bridge?.classList.add('is-done');
    window.setTimeout(() => focusDone(done), 60);
    const bar = done?.querySelector('.mu-done__bar b');
    const rows = done ? [...done.querySelectorAll('dl > *')] : [];
    if (still) return;
    kick(0.3);
    if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power2.inOut', delay: 0.3 });
    if (rows.length) {
      gsap.from(rows, {
        autoAlpha: 0, x: -12, duration: 0.6, ease: 'power3.out', delay: 0.35,
        stagger: Math.min(0.05, 0.9 / rows.length), clearProps: 'transform,opacity,visibility'
      });
    }
  });

  update();
  if (!needles.length) return;
  st.forEach((s) => { s.a = still ? level : 0; });
  put();
  if (still) return;
  // À l'arrivée : la mise sous tension, l'aiguille balaie l'échelle et
  // revient au niveau de la feuille, une seule fois.
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    setTimeout(() => kick(0.72), 250);
  }, { rootMargin: '0px 0px -20% 0px' });
  io.observe(bridge);
}

/* ═══════════════════ LES LIENS QUI ORIENTENT LE FORMULAIRE ═══════════════════
   Un lien « Ask about this » (`?type=recording#inquiry`) vers la même
   page : le défilement fluide garde la page sans la recharger, donc le
   préremplissage par l'adresse (inquiry.js) ne se ferait pas. On le fait
   ici, au clic, et le champ s'allume un instant. */
function linkPrefill() {
  const form = document.querySelector('form[data-inquiry="music"]');
  if (!form) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href*="#inquiry"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname) return;
    let hit = null;
    for (const [k, v] of url.searchParams) {
      if (!['type', 'stage', 'category'].includes(k)) continue;
      const sel = form.querySelector(`select[name="${k}"]`);
      if (sel && [...sel.options].some((o) => o.value === v)) { sel.value = v; hit = hit || sel; }
      form.querySelectorAll(`input[name="${k}"]`).forEach((i) => {
        if ((i.type === 'radio' || i.type === 'checkbox') && i.value === v) { i.checked = true; hit = hit || i; }
      });
    }
    if (!hit) return;
    setTimeout(() => syncSheet(), 0);   // l'écran et les diodes de la feuille suivent
    const field = hit.closest('.field, .dv-group');
    if (!field || reduced()) return;
    field.classList.remove('mu-flash');
    setTimeout(() => {
      void field.offsetWidth;
      field.classList.add('mu-flash');
    }, 700);
  }, true);
}

/* ─────────────── Le démarrage (en bas : les constantes sont prêtes) ─────────────── */
bootDivision();
initHero(document.querySelector('.mu-hero'));
initSay();
initTrack();
initDesk();
initDaw();
initDeck();
initListen();
initWires();
initSession();
linkPrefill();
