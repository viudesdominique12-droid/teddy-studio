/**
 * L'ACCUEIL — LES FILETS QUI VIVENT (18/10/2026).
 *
 * Dominique, sur les pages de service : « des animations en continu… chacun
 * différent de l'autre ». Sur l'accueil, le filet qui ouvre chaque section
 * parle de ce qu'elle montre :
 *   - les sept divisions : une lumière qui traverse les sept couleurs ;
 *   - les films : le bord d'une pellicule qui défile, perforations comprises ;
 *   - le matériel : une règle graduée, un curseur qui mesure ;
 *   - pourquoi nous : une mise au point (le trait se resserre, puis s'adoucit) ;
 *   - les lieux : une ligne de crêtes qui passe, comme vue de la route ;
 *   - le bureau du film : un tracé de route en pointillés qui avance ;
 *   - la galerie : une timeline de montage et sa tête de lecture ;
 *   - l'appel final : un signal qui part du centre.
 *
 * Tout est en CSS (`home.css`, « LES FILETS »), en `transform` et `opacity`.
 * Ici, on pose les éléments et on ne fait tourner que ce qui est à l'écran,
 * onglet visible. En mouvement réduit, chaque filet reste dans une pose fixe.
 */

const KIND = {
  services: 'spectrum',
  works: 'film',
  resources: 'ruler',
  why: 'focus',
  locations: 'terrain',
  filming: 'trail',
  gallery: 'playhead',
  contact: 'signal'
};

const PARTS = {
  spectrum: '<i class="hm-rule__band"></i><i class="hm-rule__band hm-rule__band--glow"></i>',
  film: '<i class="hm-rule__holes"></i><i class="hm-rule__leak"></i>',
  ruler: '<i class="hm-rule__ticks"></i><i class="hm-rule__run"><i class="hm-rule__span"></i><i class="hm-rule__mark"></i></i>',
  focus: '<i class="hm-rule__sharp"></i><i class="hm-rule__soft"></i>',
  terrain: '<i class="hm-rule__ridge hm-rule__ridge--far"></i><i class="hm-rule__ridge"></i>',
  trail: '<i class="hm-rule__dash"></i><i class="hm-rule__run"><i class="hm-rule__wp"></i></i>',
  playhead: '<i class="hm-rule__frames"></i><i class="hm-rule__run"><i class="hm-rule__head"></i></i>',
  signal: '<i class="hm-rule__pulse"></i><i class="hm-rule__pulse hm-rule__pulse--l"></i><i class="hm-rule__pulse hm-rule__pulse--b"></i><i class="hm-rule__pulse hm-rule__pulse--l hm-rule__pulse--b"></i>'
};

export function initLines() {
  const rules = [];
  document.querySelectorAll('#main > .hm-sec[id]').forEach((sec) => {
    const kind = KIND[sec.id];
    if (!kind || sec.querySelector(':scope > .hm-rule')) return;
    const r = document.createElement('div');
    r.className = `hm-rule hm-rule--${kind}`;
    r.setAttribute('aria-hidden', 'true');
    r.innerHTML = PARTS[kind];
    sec.prepend(r);
    sec.classList.add('has-rule');
    rules.push(r);
  });
  if (!rules.length) return;

  const seen = new Set();
  const sync = () => rules.forEach((r) => r.classList.toggle('is-run', seen.has(r) && !document.hidden));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
    sync();
  }, { rootMargin: '8% 0px' });
  rules.forEach((r) => io.observe(r));
  document.addEventListener('visibilitychange', sync);
}
