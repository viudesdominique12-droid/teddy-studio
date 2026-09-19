/** Démarrage des pages secondaires : même coquille, dispositifs propres à chacune. */
import { startClocks } from './clock.js';
import { paintSun } from './acts.js';
import { initSheet } from './sheet.js';
import { cursor, indexPanel, bar } from './motion.js';
import { initReveals, initMagnets, markReveals, markMagnets } from './reveal.js';
import { initWipe } from './wipe.js';
import { initSky } from './sky.js';
import { initViewer } from './viewer.js';
import './scroll.js';

startClocks();
paintSun();
cursor();
indexPanel();
bar();
initSky();
initViewer();   // le ciel et sa nuit sont le sol du site, pas une page
initWipe();
initSheet();

const h1 = document.querySelector('.phead__h');
markReveals('h1.phead__h, .sec__h, .loc__h, .film__h', 'lines');

markReveals('.loc__i, .film__row, .vac__i, .phead__meta, .locs__cta > *, .works__note, .vac__panel > *, .sec__lede, .cli__i, .form .field, .con__side > *');
markMagnets('.btn--gold, .bar__cta', 26);
initReveals();
initMagnets();
