/**
 * LA FONTE DU TITRE, DEMANDÉE TOUT DE SUITE (F15, 18/10/2026).
 *
 * Une fonte n'est réclamée qu'une fois la feuille de style lue ET le texte qui
 * s'en sert mis en page : sur un téléphone lent, le titre arrivait ~2 s après
 * le reste, en sautant d'une fonte de secours à la vraie. Ce plugin fait
 * demander, dès les premiers octets de la page, LA fonte du titre (`h1`),
 * relevée page par page le 18/10/2026 :
 *   • l'accueil et les onze pages de division : Fraunces ;
 *   • Locations et la 404 : Archivo ;
 *   • Book et Careers (vacancy) : aucune — des formulaires, où le texte courant
 *     compte plus que le titre.
 * Une seule par page : précharger une fonte qui ne sert pas vole de la bande
 * passante au premier écran (et Chrome le signale). Si le titre d'une page
 * change de famille, changer la table ci-dessous.
 *
 * Le chemin suit `base` (le sous-dossier de GitHub Pages), et l'URL est
 * exactement celle des `@font-face` : sinon le navigateur la télécharge deux
 * fois. En dev comme au build.
 */

import { basename } from 'node:path';

const MAP = {
  'locations.html': 'archivo-var.woff2',
  '404.html': 'archivo-var.woff2',
  'book.html': null,
  'vacancy.html': null
};
const DEFAULT = 'fraunces-var.woff2';

export default function fontPreload() {
  let base = '/';
  return {
    name: 'teddy-font-preload',
    configResolved(config) { base = config.base || '/'; },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const page = basename(ctx.filename || ctx.path || 'index.html') || 'index.html';
        const font = page in MAP ? MAP[page] : DEFAULT;
        if (!font) return html;
        const href = `${base.endsWith('/') ? base : base + '/'}fonts/${font}`;
        if (html.includes(`href="${href}"`) && /rel="preload"[^>]*as="font"/.test(html)) return html;
        const tag = `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
        // Juste après le jeu de caractères, qui doit rester en tête.
        const out = html.replace(/(<meta\s+charset=["']?[\w-]+["']?\s*\/?>)/i, `$1\n${tag}`);
        return out === html ? html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`) : out;
      }
    }
  };
}
