/**
 * LES DISPOSITIFS DES ACTES.
 * Un acte, une forme, un dispositif — et jamais le même deux fois.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, EASE, DUR } from './motion.js';
import { addLine } from './sheet.js';

const mobile = () => window.matchMedia('(max-width: 48rem)').matches;

/* ═══════ ACTE 2 · la table se signe ═══════ */

export function actTable() {
  const board = document.getElementById('svc-board');
  if (!board) return;
  const deps = [...board.querySelectorAll('[data-dep]')];
  if (!deps.length) return;

  const sign = () => addLine('svc', 'SERVICES \u2014 8 listed, 2 permits cleared by EFO');
  ScrollTrigger.create({ trigger: board, start: 'top 76%', once: true, onEnter: sign });

  // Sans mouvement, tout est ouvert : le CSS s'en charge, rien à piloter.
  if (reduced()) { deps.forEach((d) => d.classList.add('is-on')); return; }

  /* Un seul déclencheur pour huit lignes. Le scroll ne fait que DÉSIGNER un
     index ; c'est le CSS qui ouvre, ferme, et frappe le tampon. Aucune
     timeline, aucune mesure de hauteur, et le mode « mouvement réduit » est
     gratuit parce qu'il n'y a rien à désactiver côté JS. */
  let open = -1;
  const setOpen = (i) => {
    if (i === open) return;
    if (open >= 0) deps[open].classList.remove('is-on');
    deps[i].classList.add('is-on');
    open = i;
  };

  ScrollTrigger.create({
    trigger: board,
    start: 'top 72%',
    end: 'bottom 55%',
    scrub: true,
    onUpdate: (self) => setOpen(Math.min(deps.length - 1, Math.floor(self.progress * deps.length)))
  });

  // Le pointeur prime sur le scroll : on regarde ce qu'on survole, pas ce que
  // la page a décidé. Au départ du curseur, le scroll reprend la main.
  deps.forEach((d, i) => {
    d.addEventListener('pointerenter', () => setOpen(i));
    d.addEventListener('focusin', () => setOpen(i));
  });
}

/* ═══════ ACTE 4 · les cartons épinglés ═══════ */

export function actCards() {
  const track = document.getElementById('cards-track');
  if (!track) return;
  const cards = [...track.querySelectorAll('.card')];
  if (!cards.length) return;

  // Sur téléphone et en mouvement réduit : quatre écrans qui défilent
  // normalement. L'effet tient sans le pin, la lecture aussi.
  if (reduced() || mobile()) {
    for (const c of cards) {
      gsap.fromTo(c.children,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.lift, stagger: 0.08,
          immediateRender: false,
          scrollTrigger: { trigger: c, start: 'top 80%', once: true }
        });
    }
    return;
  }

  for (const [i, card] of cards.entries()) {
    gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top top',
        end: '+=70%',
        pin: true,
        pinSpacing: i === cards.length - 1,
        scrub: 0.6
      }
    })
      .fromTo(card.querySelector('.card__h'),
        { yPercent: 8, autoAlpha: 0.15 }, { yPercent: 0, autoAlpha: 1, ease: 'none', duration: 0.4 })
      .fromTo(card.querySelector('.card__p'),
        { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.25 }, 0.18)
      .to({}, { duration: 0.35 })
      .to(card, { autoAlpha: 0.08, ease: 'none', duration: 0.3 });
  }
}

/* ═══════ ACTE 5 · la descente ═══════ */

export function actDrop() {
  const stage = document.getElementById('drop-stage');
  const track = document.getElementById('drop-track');
  if (!stage || !track) return;

  const stops = [...track.querySelectorAll('.stop')];
  if (!stops.length) return;

  const altEl = document.getElementById('gauge-alt');
  const placeEl = document.getElementById('gauge-place');
  const fill = document.getElementById('gauge-fill');
  const HIGH = 4550, LOW = -125;
  const fmt = (v) => (v < 0 ? '\u2212' : '') + Math.abs(Math.round(v)).toLocaleString('en-US');

  /** La jauge suit la descente : c'est elle qui fait l'instrument. */
  const setAlt = (v) => {
    if (altEl) altEl.textContent = fmt(v);
    if (fill) fill.style.width = `${gsap.utils.clamp(0, 100, ((HIGH - v) / (HIGH - LOW)) * 100)}%`;
  };
  setAlt(HIGH);

  // Chaque lieu regardé s'inscrit sur la feuille.
  const setPlace = (name) => { if (placeEl && name) placeEl.textContent = name; };

  const noteStop = (li) => {
    const name = li.dataset.name;
    const alt = li.dataset.alt;
    if (!name) return;
    addLine(`loc:${li.dataset.loc}`, alt ? `UNIT \u2014 ${name}, ${fmt(+alt)} m` : `UNIT \u2014 ${name}`);
  };

  /* ---- Téléphone : la chute est verticale, et c'est la meilleure version ---- */
  if (mobile() || reduced()) {
    stops.forEach((li) => {
      ScrollTrigger.create({
        trigger: li, start: 'top 60%', end: 'bottom 40%',
        onEnter: () => { setAlt(+li.dataset.alt || 0); setPlace(li.dataset.name); noteStop(li); },
        onEnterBack: () => { setAlt(+li.dataset.alt || 0); setPlace(li.dataset.name); }
      });
    });
    return;
  }

  /* ═══════════ LA GALERIE FLOTTANTE ═══════════
     Les lieux ne prennent plus tout l'écran : ce sont des cartes qui traversent
     une zone dédiée. Chacune MONTE ou DESCEND, GROSSIT à 1,4× et PIVOTE en
     passant, puis revient — c'est le `yoyo: true, repeat: 1` qui fait le
     flottement, pas une courbe compliquée.

     Trois tweens, jamais un seul : le déplacement horizontal du rail, puis
     pour chaque carte le flottement et l'échelle, chacun avec sa propre
     fenêtre `left 90% → right 10%` accrochée au rail par `containerAnimation`.
     Une seule timeline monolithique donnerait le même mouvement à toutes. */

  const PEAK = 1.4;              /* l'échelle au sommet du passage */
  const NAV_REM = 4.5;           /* l'air laissé sous la barre du haut */
  const FOOT_REM = 7;            /* l'air au-dessus de la bobine ET de la fiche */
  const TILT = 6;                /* l'écart d'inclinaison, en degrés */

  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  /** La demi-hauteur de la carte UNE FOIS INCLINÉE et grossie — sans ça, un
      coin passe sous la barre alors que le centre est encore dans les clous. */
  const halfCard = (card, deg) => {
    const rad = Math.abs(deg) * Math.PI / 180;
    return (card.offsetHeight * Math.cos(rad) + card.offsetWidth * Math.sin(rad)) * PEAK / 2;
  };

  const span = () => Math.max(0, track.scrollWidth - window.innerWidth);

  const rail = gsap.to(track, {
    x: () => -span(),
    ease: 'none',
    scrollTrigger: {
      trigger: stage,
      pin: true,
      scrub: true,
      start: 'top top',
      end: () => `+=${span()}`,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      // Dernier pin de la page : il doit être calculé APRÈS celui du téléphone,
      // sinon tous les déclencheurs suivants tombent trop tôt.
      refreshPriority: -1,
      onUpdate: (self) => {
        const p = self.progress * (stops.length - 1);
        const i = Math.min(stops.length - 2, Math.floor(p));
        const t = p - i;
        const a = Number(stops[i].dataset.alt);
        const b = Number(stops[i + 1].dataset.alt);
        if (Number.isFinite(a) && Number.isFinite(b)) setAlt(a + (b - a) * t);
        // Le nom suit le tirage le plus proche du centre : l'altimètre dit OÙ
        // on est, pas seulement à quelle hauteur.
        setPlace(stops[Math.round(p)]?.dataset.name);
      }
    }
  });

  stops.forEach((card, i) => {
    const sign = i % 2 === 0 ? 1 : -1;            // une monte, la suivante descend
    const tilt = (Math.random() - 0.5) * TILT;    // chaque carte a son propre défaut

    gsap.fromTo(card, { rotation: tilt }, {
      rotation: -tilt,
      y: () => {
        const vh = window.innerHeight;
        const rem = remPx();
        const amp = (window.innerWidth < vh ? 0.38 : 0.48) * vh;
        const half = halfCard(card, tilt);
        const back = card.offsetHeight / 2;       // ce que `yPercent` reprend

        // La référence ne borne que la montée : ses cartes n'ont pas de
        // légende sous elles et sa page n'a pas de barre en bas. Les nôtres
        // ont les deux — on borne donc les DEUX sens, chacun avec son obstacle.
        if (sign < 0) {
          const room = vh / 2 - FOOT_REM * rem - half;
          return Math.min(amp, Math.max(0, room) + back);
        }
        const room = vh / 2 - NAV_REM * rem - half;
        return -Math.min(amp, Math.max(0, room) + back);
      },
      yPercent: () => sign * 50,
      yoyo: true, repeat: 1,
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: card, containerAnimation: rail,
        start: 'left 90%', end: 'right 10%', scrub: true,
        invalidateOnRefresh: true
      }
    });

    // L'échelle a sa propre courbe : `back.inOut(3)` dépasse légèrement avant
    // de se poser. C'est ce dépassement qui donne le poids.
    gsap.to(card, {
      scale: PEAK,
      yoyo: true, repeat: 1,
      ease: 'back.inOut(3)',
      scrollTrigger: {
        trigger: card, containerAnimation: rail,
        start: 'left 90%', end: 'right 10%', scrub: true
      }
    });

    ScrollTrigger.create({
      trigger: card, containerAnimation: rail,
      start: 'left 60%', end: 'right 40%',
      onEnter: () => noteStop(card)
    });
  });

  // Le clavier doit pouvoir traverser aussi.
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'The descent \u2014 use the arrow keys to travel');
  stage.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const st = rail.scrollTrigger;
    const step = (st.end - st.start) / (stops.length - 1);
    window.scrollTo({ top: window.scrollY + (e.key === 'ArrowRight' ? step : -step), behavior: 'smooth' });
  });
}

/* ═══════ ACTE 6 · la pile de caisses ═══════ */

export function actCases() {
  const stack = document.getElementById('cases-stack');
  if (!stack) return;
  const cases = [...stack.querySelectorAll('.case')];
  if (!cases.length) return;

  if (reduced()) return;

  // La pile est empilée, puis elle s'écarte. `fromTo` + `immediateRender: false`
  // pour qu'une caisse ne reste jamais invisible si le déclencheur est manqué.
  gsap.set(cases, { transformOrigin: 'center top' });
  gsap.fromTo(cases,
    { y: (i) => -16 * (cases.length - i), rotateX: -6, autoAlpha: 0 },
    {
      y: 0, rotateX: 0, autoAlpha: 1,
      duration: 0.8, ease: EASE.clear, stagger: 0.07,
      immediateRender: false,
      onComplete: () => gsap.set(cases, { clearProps: 'opacity,visibility,transform' }),
      scrollTrigger: { trigger: stack, start: 'top 88%', once: true }
    });
}

/* ═══════ ACTE 7 · le générique ═══════ */

export function actCredits() {
  const roll = document.getElementById('credits-roll');
  if (!roll) return;
  if (reduced()) return;

  const items = roll.querySelectorAll('.credits__k, .credits__films li, .credits__clients li, .credits__end');

  // Le générique est piloté par le scroll — jamais en lecture automatique.
  gsap.fromTo(items,
    { autoAlpha: 0, y: 26 },
    {
      autoAlpha: 1, y: 0, duration: 0.5, ease: 'none', stagger: 0.12,
      immediateRender: false,
      scrollTrigger: { trigger: roll, start: 'top 88%', end: 'bottom 75%', scrub: 0.8 }
    });
}

/* ═══════ Le soleil d'Addis ═══════ */

/**
 * Lever et coucher du soleil calculés chez le visiteur (algorithme NOAA simplifié).
 * Aucune valeur écrite en dur : une feuille de service porte toujours la lumière
 * du jour, et celle-ci est vraie.
 */
export function sunTimes(date = new Date(), lat = 9.0192, lon = 38.7525, tz = 3) {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 864e5);

  const gamma = (2 * Math.PI / 365) * (day - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

  const cosH = (Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)))
    - Math.tan(lat * rad) * Math.tan(decl);
  if (cosH > 1 || cosH < -1) return null;   // soleil qui ne se lève ou ne se couche pas
  const ha = Math.acos(cosH) / rad;

  const noon = 720 - 4 * lon - eqTime + tz * 60;
  const pad = (m) => {
    const t = ((m % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`;
  };
  return { rise: pad(noon - 4 * ha), set: pad(noon + 4 * ha), riseMin: noon - 4 * ha, setMin: noon + 4 * ha };
}

export function paintSun() {
  const s = sunTimes();
  if (!s) return null;
  for (const el of document.querySelectorAll('#sun-open, #sun-cs, [data-sun]')) {
    el.textContent = `${s.rise} → ${s.set}`;
  }
  return s;
}
