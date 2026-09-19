/**
 * LE TÉLÉPHONE — la section s'épingle, l'appareil pivote, son écran s'ouvre.
 *
 * Quatre temps : le titre recule derrière l'appareil, les arguments défilent
 * un par un dans l'axe, l'appareil bascule de 90°, puis son écran s'agrandit
 * jusqu'à remplir la page.
 *
 * Trois règles portent tout le reste :
 *  1. tout est construit dans un `gsap.matchMedia()` — la chorégraphie mobile
 *     et la chorégraphie bureau n'ont pas le même ORDRE, pas seulement pas la
 *     même taille ; décider une fois au chargement laisserait la mauvaise en
 *     place après une rotation d'écran ou un simple redimensionnement ;
 *  2. `tl.set({}, {}, 1)` FIGE la durée de la timeline à 1 avant le moindre
 *     tween — sinon chaque ajout déplace toutes les positions fractionnaires ;
 *  3. toute géométrie est une FONCTION, relue au refresh grâce à
 *     `invalidateOnRefresh` — une mesure en dur est fausse dès le premier
 *     frame où le viewport n'a pas encore sa hauteur définitive.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const BLUR_MAX = 12;
const SCROLL_LENGTH = '+=470%';
const SCRUB = 0.1;
const HEAD_END = 0.09;
const BLOCKS_WINDOW = [0.10, 0.72];
const TURN_END = 0.86;
const FULL_START = 0.87, FULL_END = 0.995;
const MOBILE_MAX = 767;          /* doit rester égal au @media de acts.css */
const MOBILE_TURN = [0.28, 0.40];
const MOBILE_OUT = [0.41, 0.49];
const MOBILE_BLOCKS = [0.52, 0.97];
const RADIUS_PCT = 13;
const COVER = 1.04;              /* marge anti-couture sur les bords du cadre */
/* Le raccord vertical → large. Tôt et court : la boîte s'élargit vite, et dès
   ~20° le rush vertical (288 px) doit couvrir plus de 400 px — il bouillit.
   Fenêtre choisie pour qu'aucune des deux pistes ne dépasse ~1,2× sa taille
   native pendant qu'elle est visible. */
const CUT = [0.08, 0.38];

/* Les rushes : verticaux pour l'appareil debout, larges pour l'appareil couché.
   Ils tournent d'un passage à l'autre — cinq plans vus plusieurs fois valent
   mieux qu'un seul plan vu cinq fois.
   Les plans larges sont en 1280 px : ce sont eux qui finissent en plein écran,
   et un 640 étiré sur 1440 se voit. Ils ne se chargent qu'au pivot. */
const UP_CLIPS = ['r02', 'r04', 'r06', 'r08', 'r10', 'r12'];
const WIDE_CLIPS = ['w01', 'w02', 'w03'];

const s01 = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
/** Supprime réellement le filtre : `blur(0px)` laisse un calque vivant qui scintille. */
const freeFilter = (targets) => () => gsap.set(targets, { clearProps: 'filter' });

export function initPhone() {
  if (window.__teddyPhone) return;
  const section = document.querySelector('[data-phone]');
  if (!section) return;

  const title = section.querySelector('[data-phone-title]');
  const device = section.querySelector('[data-phone-device]');
  const screen = section.querySelector('[data-phone-screen]');
  const vidUp = section.querySelector('[data-phone-video="up"]');
  const vidWide = section.querySelector('[data-phone-video="wide"]');
  const chrome = [...section.querySelectorAll('.ph__notch, .ph__glare')];
  const blocks = [...section.querySelectorAll('[data-phone-block]')];
  if (!device || !screen || !blocks.length) return;
  window.__teddyPhone = true;

  /* ── La bande : les rushes tournent d'un passage à l'autre ── */
  let bag = 0;
  const swap = (v, id) => {
    if (!v || v.dataset.clip === id) return;
    v.dataset.clip = id;
    v.poster = `/reel/${id}.jpg`;
    v.querySelector('source').src = `/reel/${id}.mp4`;
    v.load();
  };
  const cast = () => { swap(vidUp, UP_CLIPS[bag++ % UP_CLIPS.length]); };
  // Le plan large pèse un demi-mégaoctet : il n'est demandé qu'au pivot, et
  // jamais sur téléphone, où il n'apparaît pas.
  let wideCued = false;
  const cueWide = () => {
    if (wideCued || !vidWide) return;
    wideCued = true;
    swap(vidWide, WIDE_CLIPS[(bag - 1) % WIDE_CLIPS.length]);
    vidWide.play().catch(() => {});
  };

  gsap.matchMedia().add({
    isMobile: `(max-width: ${MOBILE_MAX}px)`,
    isDesktop: `(min-width: ${MOBILE_MAX + 1}px)`,
    still: '(prefers-reduced-motion: reduce)'
  }, (ctx) => {
    const { isMobile, still } = ctx.conditions;

    // Sans mouvement, la section n'est plus une chorégraphie mais une page :
    // le titre, l'appareil, puis les quatre arguments — tous lisibles.
    if (still) { section.dataset.phoneStatic = '1'; return; }
    delete section.dataset.phoneStatic;

    /* ── Les mesures, relues à chaque refresh ──────────────────────────────
       `offsetWidth/Height` et `offsetTop`, jamais `getBoundingClientRect` :
       un rect inclut les transformations déjà posées, donc se mesure
       lui-même et dérive un peu plus à chaque refresh. */
    let baseScale = 1, H0 = 1, W0 = 1, endScale = 1, fullScale = 1;
    let titleShift = 0;
    const blockShift = blocks.map(() => 0);

    function topWithin(el) {
      let y = 0, n = el;
      while (n && n !== section) { y += n.offsetTop; n = n.offsetParent; }
      return y;
    }

    function measure() {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const dw = device.offsetWidth, dh = device.offsetHeight;
      // Un viewport sans hauteur (onglet caché, premier frame) donnerait
      // scale 0 : on garde les dernières mesures valides.
      if (!vh || !vw || !dw || !dh) return;

      baseScale = Math.min(1, (vh * 0.78) / dh);
      W0 = screen.offsetWidth;
      H0 = screen.offsetHeight;

      // La section est épinglée en haut : son repère et le viewport coïncident.
      titleShift = title ? vh / 2 - (topWithin(title) + title.offsetHeight / 2) : 0;
      blocks.forEach((b, i) => { blockShift[i] = vh / 2 - (topWithin(b) + b.offsetHeight / 2); });

      // Couché, l'appareil doit tenir en largeur ET en hauteur. Sur téléphone
      // il prend presque toute la largeur : un appareil plus haut que l'écran
      // n'est pas large rétrécit forcément en se couchant, autant que ce soit
      // le moins possible — à 62 % il aurait l'air d'un bug.
      const lieW = isMobile ? 0.94 : 0.62;
      endScale = Math.min((vw * lieW) / dh, (vh * 0.80) / dw, 3 * baseScale);
      // Plein écran : l'écran couché fait H0 de large et W0 de haut.
      fullScale = Math.max(vw / H0, vh / W0) * 1.02;
    }

    /* ── La géométrie du pivot ─────────────────────────────────────────────
       L'appareil tourne de θ ; les vidéos tournent de −θ, donc restent
       droites. Leur boîte doit couvrir l'écran tourné : c'est exactement la
       boîte englobante du rectangle W0×H0 sous l'angle θ. À θ = 0 elle vaut
       l'écran lui-même — un rush vertical y tombe juste, sans recadrage
       parasite ; à θ = 90° elle devient large. `object-fit: cover` fait le
       reste. */
    const turn = { p: 0 };
    const full = { p: 0 };

    function apply() {
      const p = turn.p;
      const th = p * 90;
      const rad = th * Math.PI / 180;
      const c = Math.cos(rad), s = Math.sin(rad);

      gsap.set(device, { rotation: th });
      gsap.set(screen, { borderRadius: (RADIUS_PCT * (1 - full.p)) + '%' });

      if (p > 0) {
        const von = baseScale * 1.1;
        // La respiration : l'appareil se resserre à mi-pivot puis se rouvre.
        let sc = (von + (endScale - von) * p) * (1 - 0.09 * Math.sin(Math.PI * p));
        if (full.p > 0) sc = endScale + (fullScale - endScale) * full.p;
        gsap.set(device, { scale: sc });
      }

      // Le raccord : la piste verticale s'efface, la large prend sa place.
      const k = s01((p - CUT[0]) / (CUT[1] - CUT[0]));
      const boxW = (W0 * c + H0 * s) * COVER;
      const boxH = (W0 * s + H0 * c) * COVER;
      for (const [v, o] of [[vidUp, 1 - k], [vidWide, k]]) {
        if (v) gsap.set(v, { opacity: o, rotation: -th, width: boxW, height: boxH });
      }
    }

    /* ── La timeline ── */
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: SCROLL_LENGTH,
        pin: section,
        pinSpacing: true,
        scrub: SCRUB,
        invalidateOnRefresh: true,
        refreshPriority: 1,      // le pin rallonge la page : mesuré avant la suite
        anticipatePin: 1,
        onRefresh: apply,
        onToggle(self) {
          if (self.isActive) { cast(); vidUp?.play().catch(() => {}); if (wideCued) vidWide?.play().catch(() => {}); }
          else { vidUp?.pause(); vidWide?.pause(); }
        }
      }
    });
    tl.set({}, {}, 1);           // fige la durée AVANT le premier tween

    ScrollTrigger.addEventListener('refreshInit', measure);
    measure();

    gsap.set(device, { transformOrigin: '50% 50%' });
    gsap.set(blocks, { autoAlpha: 0 });

    const splits = blocks.map((b) => {
      try { return new SplitText(b.querySelectorAll('h3, p'), { type: 'lines', linesClass: 'ph-line' }); }
      catch { return null; }
    });
    const lines = splits.map((sp, i) => sp ? sp.lines : [...blocks[i].querySelectorAll('h3, p')]);

    /* Phase A — le titre recule derrière l'appareil.
       fromTo et non to : les deux bornes sont alors relues au refresh, donc
       l'échelle de repos se réécrit même si la première mesure était fausse. */
    tl.fromTo(device,
      { scale: () => baseScale },
      { scale: () => baseScale * 1.1, duration: HEAD_END, ease: 'power1.inOut' }, 0);
    if (title) {
      tl.fromTo(title, { y: 0 },
        { y: () => titleShift, duration: HEAD_END, ease: 'power1.inOut' }, 0);
      tl.to(title, {
        filter: `blur(${BLUR_MAX}px)`, opacity: 0.5,
        duration: HEAD_END * 0.9, ease: 'power1.in',
        onReverseComplete: freeFilter(title)
      }, HEAD_END * 0.35);
    }

    /* Phase B — les arguments défilent un par un dans l'axe */
    const win = isMobile ? MOBILE_BLOCKS : BLOCKS_WINDOW;
    const share = (win[1] - win[0]) / blocks.length;
    const beat = share * 0.2;
    let lastOut = win[0];

    blocks.forEach((b, i) => {
      const at = win[0] + i * share;
      const out = at + share * 0.8;
      lastOut = out;

      tl.fromTo(b,
        { autoAlpha: 0, y: () => blockShift[i] + 72 },
        { autoAlpha: 1, y: () => blockShift[i], duration: beat, ease: 'power3.out', immediateRender: false },
        at);
      tl.fromTo(lines[i],
        { autoAlpha: 0, y: 18, filter: `blur(${BLUR_MAX}px)` },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)',
          duration: beat, stagger: { amount: beat * 0.5, from: 'start' },
          ease: 'power2.out', immediateRender: false, onComplete: freeFilter(lines[i]) },
        at);

      // Sur téléphone, le dernier argument reste : c'est la fin de la section.
      if (isMobile && i === blocks.length - 1) return;
      tl.to(lines[i], {
        autoAlpha: 0, y: -18, filter: `blur(${BLUR_MAX}px)`,
        duration: beat, stagger: { amount: beat * 0.5, from: 'end' }, ease: 'power2.in'
      }, out);
      tl.to(b, { autoAlpha: 0, duration: beat, ease: 'power3.in' }, out);
    });

    /* Phase C — le pivot */
    const turnStart = isMobile ? MOBILE_TURN[0] : Math.min(lastOut + 0.05, TURN_END - 0.08);
    const turnEnd = isMobile ? MOBILE_TURN[1] : TURN_END;
    tl.to(turn, {
      p: 1, duration: turnEnd - turnStart, ease: 'power1.inOut',
      onUpdate: apply, onStart: isMobile ? undefined : cueWide
    }, turnStart);

    if (isMobile) {
      /* Phase C2 — l'appareil quitte l'image, et rien ne s'ouvre : un plein
         écran sur 390 px n'ajoute rien, il coûte. */
      tl.to([device, title].filter(Boolean),
        { autoAlpha: 0, duration: 0.08, ease: 'power2.inOut' }, MOBILE_OUT[0]);
    } else {
      /* Phase D — l'écran s'ouvre. Le boîtier doit disparaître avec :
         agrandi six fois, un liseré de 8 px devient une bordure de 5 cm. */
      const span = FULL_END - FULL_START;
      tl.to(full, { p: 1, duration: span, ease: 'power2.inOut', onUpdate: apply }, FULL_START);
      tl.to(device, { padding: 0, boxShadow: '0 0 0 0 #0000', duration: span * 0.6, ease: 'power2.in' }, FULL_START);
      if (chrome.length) tl.to(chrome, { autoAlpha: 0, duration: span * 0.35, ease: 'power2.in' }, FULL_START);
    }

    apply();

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', measure);
      for (const sp of splits) sp?.revert();
    };
  });
}
