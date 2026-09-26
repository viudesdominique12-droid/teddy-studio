/**
 * LES MONDES DE COULEUR.
 *
 * Tout le site dérive de neuf couleurs de base (voir `tokens.css`). On change
 * donc de monde en posant un seul attribut sur <html> ; la couche sémantique
 * et tous les modules suivent sans une ligne de plus.
 *
 * LA COMPARAISON (27/09/2026). Dominique : « deux autres sites, on ne change
 * que la couleur — et les polices — pour voir lequel on aime le plus ». Trois
 * thèmes, donc, sur le même site :
 *   · Vert    le site tel qu'il est (vert nuit, terre cuite) ;
 *   · Nuit    le thème sombre : noir, blanc chaud, ambre de lampe de projecteur ;
 *   · Papier  l'autre, d'après hobro.digital : papier blanc et grandes
 *             sections noires, un vert vif en accent.
 * Leurs couleurs et leurs polices sont dans `themes.css`.
 *
 * Le thème est posé avant le premier rendu par le script de `head.html`
 * (`?palette=nuit|papier`, `?palette=vert` pour revenir), et mémorisé pour
 * qu'on parcoure tout le site dans un thème. Ici, on ajoute le sélecteur
 * flottant qui permet de passer de l'un à l'autre sans quitter la page. Au
 * changement, l'événement `palette:change` prévient les deux scènes 3D.
 */

const KEY = 'teddy:palette';

const CHOICES = [
  { id: null, name: 'Vert', sw: ['#182d19', '#db6336'] },
  { id: 'nuit', name: 'Nuit', sw: ['#0b0b0b', '#f0a93b'] },
  { id: 'papier', name: 'Papier', sw: ['#f6f5f1', '#1fd286'] }
];

const themes = () => window.__THEMES || {};

function current() {
  const p = document.documentElement.dataset.palette;
  return p && themes()[p] ? p : null;
}

function loadFonts(id) {
  const url = themes()[id]?.fonts;
  if (!url || document.querySelector(`link[data-theme-fonts="${id}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = url;
    l.dataset.themeFonts = id;
    l.onload = l.onerror = () => resolve();
    document.head.appendChild(l);
  });
}

export async function setPalette(id) {
  const root = document.documentElement;
  if (id && !themes()[id]) id = null;
  // Les polices d'abord : le thème ne bascule qu'une fois ses lettres prêtes.
  if (id) {
    await loadFonts(id);
    await document.fonts?.ready;
  }
  if (id) root.dataset.palette = id;
  else delete root.dataset.palette;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {}
  const url = new URL(location.href);
  if (id) url.searchParams.set('palette', id);
  else url.searchParams.delete('palette');
  history.replaceState(history.state, '', url);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', themes()[id]?.color || '#182d19');
  window.dispatchEvent(new CustomEvent('palette:change', { detail: { palette: id } }));
  paintSwitch();
}

/* Le sélecteur : une petite pilule en bas à droite, trois pastilles. */
let el = null;
function paintSwitch() {
  if (!el) return;
  const cur = current();
  for (const b of el.querySelectorAll('button')) {
    b.setAttribute('aria-pressed', String((b.dataset.id || null) === cur));
  }
}

function mountSwitch() {
  if (el || !document.body) return;
  el = document.createElement('div');
  el.className = 'pal';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Compare colour themes');
  el.innerHTML = `<span class="pal__k">Theme</span>${CHOICES.map((c) => `
    <button class="pal__b" type="button" data-id="${c.id || ''}" aria-pressed="false">
      <span class="pal__sw" aria-hidden="true" style="--a:${c.sw[0]};--b:${c.sw[1]}"></span>${c.name}
    </button>`).join('')}`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) setPalette(b.dataset.id || null);
  });
  document.body.appendChild(el);
  paintSwitch();
}

export function applyPalette() {
  // Le thème est déjà posé par `head.html` ; on ne fait qu'ajouter le sélecteur.
  mountSwitch();
}
