/** Démarrage des pages secondaires : même coquille, dispositifs propres à chacune. */
import { startClocks } from './clock.js';
import { cursor, indexPanel, bar } from './motion.js';
import { initReveals, initMagnets, markReveals, markMagnets } from './reveal.js';
import { pauseOffscreen } from './offscreen.js';
import { initWipe } from './wipe.js';
import { initViewer } from './viewer.js';
import './scroll.js';
import { applyPalette } from './palette.js';

/* La feuille de service (le petit volet « Call sheet » en bas d'écran) est
   retirée (F35, 18/10/2026) : elle restait vide sur ces pages. On oublie
   ce qu'elle gardait dans le navigateur. */
try { localStorage.removeItem('teddy-sheet'); } catch { /* stockage indisponible */ }

startClocks();
cursor();
indexPanel();
bar();
initViewer();   // le ciel et sa nuit sont le sol du site, pas une page
initWipe();

const h1 = document.querySelector('.phead__h');
markReveals('h1.phead__h, .sec__h, .loc__h, .film__h', 'lines');

markReveals('.loc__i, .film__row, .vac__i, .phead__meta, .locs__cta > *, .works__note, .vac__panel > *, .sec__lede, .cli__i, .form .field, .con__side > *');
markMagnets('.btn--gold, .bar__cta', 26);
initReveals();
initMagnets();
// Les boucles CSS des sections hors de l'écran se mettent en pause.
pauseOffscreen('main > *, main > .pin-spacer > *, .ftr');

applyPalette();
