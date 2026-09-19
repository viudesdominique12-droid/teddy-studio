/**
 * LA BARRE DE MONTAGE — la page devient un banc de montage.
 *
 * Une page de 27 000 px ne dit nulle part où l'on est. Un point de progression
 * ordinaire répondrait « 43 % », ce qui ne veut rien dire pour personne. Ici la
 * barre répond dans la langue du métier : **SC 04/10 — WHY US · TC 00:01:12:07**.
 *
 * Deux décisions portent tout :
 *
 *  1. **La largeur de chaque segment est la hauteur RÉELLE de la section**,
 *     posée en `flex-grow` (avec `flex-basis: 0`). Une section épinglée qui
 *     dure cinq écrans occupe cinq fois plus de barre qu'une section courte.
 *     Sans ça, la barre ment : dix segments égaux devant des sections de
 *     durées très différentes. C'est le détail qui la rend honnête.
 *
 *  2. **Le timecode est un vrai calcul 24 images/seconde**, pas un pourcentage
 *     déguisé. La bobine fait 90 secondes — c'est une convention de showreel,
 *     posée une fois et assumée. `f = frames % 24` donne des images qui
 *     défilent vraiment de 0 à 23.
 *
 * La section courante est **la dernière dont le haut est passé au-dessus du
 * milieu de l'écran** — pas la plus visible. Un producteur lit la scène où il
 * vient d'entrer, pas celle qui occupe le plus de pixels.
 */

const REEL_S = 90;               /* la bobine, en secondes — convention showreel */
const FPS = 24;
const MIN_PAGE = 2.6;            /* sous 2,6 écrans, une barre de montage ment */
const NARROW = 600;

const pad = (n) => String(n).padStart(2, '0');

export function initTimeline() {
  if (window.__teddyTimeline) return;
  // `main > section` raterait toute section épinglée : ScrollTrigger l'enveloppe
  // dans un `.pin-spacer`, qui devient l'enfant direct à sa place.
  const sections = [...document.querySelectorAll('main [data-scene]')];
  if (sections.length < 3) return;
  if (document.documentElement.scrollHeight < window.innerHeight * MIN_PAGE) return;
  window.__teddyTimeline = true;

  /* ── L'ossature ── */
  const bar = document.createElement('nav');
  bar.className = 'tl';
  bar.setAttribute('aria-label', 'Scene index');

  const scene = document.createElement('p');
  scene.className = 'tl__scene mono';

  const strip = document.createElement('ol');
  strip.className = 'tl__strip';

  const head = document.createElement('span');
  head.className = 'tl__head';
  head.setAttribute('aria-hidden', 'true');

  const tc = document.createElement('p');
  tc.className = 'tl__tc mono';

  const segs = sections.map((sec, i) => {
    const li = document.createElement('li');
    li.className = 'tl__seg';
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = sec.dataset.scene;
    // Le nom de scène est rendu en tout petit dans la barre : on le redonne en
    // clair à qui écoute la page au lieu de la regarder.
    b.setAttribute('aria-label', `Scene ${i + 1} of ${sections.length} — ${sec.dataset.scene}`);
    b.addEventListener('click', () => {
      const y = window.scrollY + sec.getBoundingClientRect().top;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
    li.appendChild(b);
    strip.appendChild(li);
    return li;
  });

  strip.appendChild(head);
  bar.append(scene, strip, tc);
  document.body.appendChild(bar);

  /* ── Les mesures ──
     Une section épinglée n'a plus sa hauteur propre : c'est son `pin-spacer`
     qui porte la durée réelle du passage. Mesurer la section elle-même
     donnerait un segment d'un écran pour une séquence qui en dure cinq. */
  const spanOf = (sec) => {
    const p = sec.parentElement;
    const host = p && p.classList.contains('pin-spacer') ? p : sec;
    return Math.max(host.offsetHeight, 1);
  };

  const tops = [];
  function measure() {
    tops.length = 0;
    sections.forEach((sec, i) => {
      segs[i].style.flexGrow = String(spanOf(sec));
      segs[i].style.flexBasis = '0';
      const p = sec.parentElement;
      const host = p && p.classList.contains('pin-spacer') ? p : sec;
      tops.push(host.getBoundingClientRect().top + window.scrollY);
    });
  }

  /* ── La lecture ── */
  let last = -1;
  function paint() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const prog = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

    head.style.left = (prog * 100) + '%';

    const frames = Math.round(prog * FPS * REEL_S);
    const f = frames % FPS;
    const s = Math.floor(frames / FPS) % 60;
    const m = Math.floor(frames / (FPS * 60));
    // SMPTE complet : heures:minutes:secondes:images. Trois champs se liraient
    // comme un hh:mm:ss ordinaire et l'effet tomberait.
    tc.textContent = (window.innerWidth < NARROW ? '' : 'TC ')
      + `00:${pad(m)}:${pad(s)}:${pad(f)}`;

    // La dernière section dont le haut a franchi le milieu de l'écran.
    const mid = window.scrollY + window.innerHeight * 0.5;
    let i = 0;
    for (let k = 0; k < tops.length; k++) if (tops[k] <= mid) i = k;

    if (i !== last) {
      if (last >= 0) segs[last].classList.remove('is-on');
      segs[i].classList.add('is-on');
      scene.textContent = `SC ${pad(i + 1)}/${pad(sections.length)}`
        + (window.innerWidth < NARROW ? '' : ` — ${sections[i].dataset.scene}`);
      last = i;
    }
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { paint(); ticking = false; });
  };

  measure();
  paint();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Les sections épinglées ne prennent leur vraie hauteur qu'après le refresh
  // de ScrollTrigger : on remesure là, et à chaque changement de largeur.
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    measure(); last = -1; paint();
  });
  window.addEventListener('load', () => { measure(); last = -1; paint(); });
  window.setTimeout(() => { measure(); last = -1; paint(); }, 1200);

  document.documentElement.classList.add('has-tl');
}
