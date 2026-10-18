/**
 * LES THÈMES — RETIRÉS LE 18/10/2026.
 *
 * Du 27/09 au 18/10, trois thèmes (Vert, Nuit, Papier) se comparaient sur le
 * site, avec un sélecteur flottant. Dominique a tranché : « on reste que sur
 * le vert de base, enlève les options ». Le sélecteur et les thèmes d'essai
 * sont partis (`themes.css` n'est plus chargé ; le script de `head.html`
 * efface un ancien choix mémorisé). Les règles `html[data-palette=…]` qui
 * restent dans quelques feuilles sont inactives.
 *
 * `applyPalette()` est gardé, vide, parce que toutes les pages l'appellent.
 */
export function applyPalette() {}
