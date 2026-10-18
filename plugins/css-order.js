/**
 * L'ORDRE DES FEUILLES DE STYLE, AU BUILD SEULEMENT (F04, 18/10/2026).
 *
 * Les pages déclarent leurs styles dans un ordre voulu : le socle commun
 * (`main.css`), puis `division.css`, puis la feuille de la page, qui a le
 * dernier mot. En dev, c'est cet ordre qui s'applique. Au build, Vite sort
 * `division.css` en morceau partagé et l'injecte APRÈS la feuille de la page :
 * la cascade s'inversait, et la production ne ressemblait plus à ce qui avait
 * été validé (le titre de Rentals sur la caméra, les marges des héros…).
 *
 * Ce plugin remet le lien `division-[hash].css` juste après la PREMIÈRE feuille
 * (le socle commun, quel que soit le nom que Vite lui donne). Il ne fait rien
 * sur une page sans division, et rien en dev.
 */

const LINK = /<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi;
const DIVISION = /\/assets\/division-[\w-]+\.css(?:["'?#\s>])/;

export function reorderCss(html) {
  const links = html.match(LINK);
  if (!links || links.length < 3) return html;
  const dv = links.findIndex((l) => DIVISION.test(l));
  if (dv <= 1) return html;                 // absente, ou déjà à sa place

  const tag = links[dv];
  // On retire le lien (et l'éventuel saut de ligne qui le précède)…
  let out = html.replace(new RegExp(`\\n?[ \\t]*${escape(tag)}`), '');
  // … et on le repose juste après le socle commun.
  const first = links[0];
  out = out.replace(first, `${first}\n${tag}`);
  return out;
}

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function cssOrder() {
  return {
    name: 'teddy-css-order',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => reorderCss(html)
    }
  };
}
