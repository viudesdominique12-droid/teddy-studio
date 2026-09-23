/**
 * LES MONDES DE COULEUR.
 *
 * Tout le site dérive de neuf couleurs de base (voir `tokens.css`). On change
 * donc de monde en posant un seul attribut sur <html> ; la couche sémantique
 * et tous les modules suivent sans une ligne de plus.
 *
 * `?palette=bleu|violet|rouge|mono` l'active, `?palette=vert` revient au vert
 * d'origine. Le choix est mémorisé pour qu'on puisse parcourir le site entier
 * dans une teinte sans réécrire l'adresse à chaque page.
 */

const PALETTES = ['bleu', 'violet', 'rouge', 'mono', 'mono-or'];
const KEY = 'teddy:palette';

export function applyPalette() {
  let p = new URLSearchParams(location.search).get('palette');
  if (p === 'vert' || p === 'none') {
    try { localStorage.removeItem(KEY); } catch {}
    p = null;
  } else if (p) {
    try { localStorage.setItem(KEY, p); } catch {}
  } else {
    try { p = localStorage.getItem(KEY); } catch {}
  }
  const root = document.documentElement;
  if (p && PALETTES.includes(p)) root.dataset.palette = p;
  else delete root.dataset.palette;
}
