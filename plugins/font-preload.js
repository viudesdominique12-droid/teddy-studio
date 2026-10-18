/**
 * LES FONTES DU PREMIER ÉCRAN, DEMANDÉES TOUT DE SUITE (F15, 18/10/2026).
 *
 * Une fonte n'est réclamée qu'une fois la feuille de style lue ET le texte qui
 * s'en sert mis en page : sur un téléphone lent, le titre arrivait ~2 s après
 * le reste, en sautant d'une fonte de secours à la vraie. Ce plugin fait
 * demander, dès les premiers octets de la page, la fonte du titre (`h1`).
 *
 * Depuis le passage à Archivo Black + IBM Plex Sans + Barlow Condensed
 * (18/10/2026), tous les titres de page sont en Archivo Black : l'affiche
 * (`--ff-p`) comme le display (`--ff-d` : Locations, Careers, Book, la 404)
 * partagent `archivo-black.woff2` (10 Ko). Book et Careers, qui n'en
 * demandaient aucune, la demandent donc aussi : elle ne pèse presque rien.
 *
 * IBM Plex Sans (60 Ko) en plus là où le plus grand élément du premier écran
 * (LCP) est la phrase d'ouverture (`.dv-lede`, `.hx__lede`), relevé page par
 * page le 18/10/2026 : l'accueil, Services, Event Organizing, AI Production,
 * Music Production, About et Contact. Ailleurs c'est une image (Live
 * Streaming, Long métrage, Documentaire, Matériel, Portfolio) ou le titre
 * (Locations, Book, Careers, la 404). Mesuré sur la version construite,
 * téléphone, 4G lente et processeur ralenti ×4 : sans elle, Plex arrivait
 * 0,5 à 0,75 s APRÈS le premier affichage, et la phrase sautait de la fonte
 * de secours à la vraie ; préchargée, elle arrive ~0,4 s avant, la phrase
 * s'affiche d'emblée dans sa fonte (Contact : décalage 0,009 → 0), pour un
 * premier affichage ~0,13 s plus tard. Les chiffres (Barlow, 15 Ko) ne sont
 * jamais préchargés : un bandeau de 11 px qui change de fonte ne se voit pas.
 *
 * Précharger une fonte qui ne sert pas vole de la bande passante au premier
 * écran (et Chrome le signale). Si le titre ou la phrase d'une page change de
 * famille, ou si le plus grand élément de l'écran change, changer la table.
 *
 * Le chemin suit `base` (le sous-dossier de GitHub Pages), et l'URL est
 * exactement celle des `@font-face` : sinon le navigateur la télécharge deux
 * fois. En dev comme au build.
 */

import { basename } from 'node:path';

const TITLE = 'archivo-black.woff2';
const TEXT = 'ibm-plex-sans-var.woff2';
const WITH_TEXT = [TITLE, TEXT];
const MAP = {
  'index.html': WITH_TEXT,
  'services.html': WITH_TEXT,
  'event-organizing.html': WITH_TEXT,
  'ai-production.html': WITH_TEXT,
  'music-production.html': WITH_TEXT,
  'about.html': WITH_TEXT,
  'contact.html': WITH_TEXT
};
const DEFAULT = [TITLE];

export default function fontPreload() {
  let base = '/';
  return {
    name: 'teddy-font-preload',
    configResolved(config) { base = config.base || '/'; },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const page = basename(ctx.filename || ctx.path || 'index.html') || 'index.html';
        const fonts = page in MAP ? MAP[page] : DEFAULT;
        const dir = `${base.endsWith('/') ? base : base + '/'}fonts/`;
        const tags = fonts
          .filter((f) => !html.includes(`href="${dir}${f}"`))
          .map((f) => `<link rel="preload" href="${dir}${f}" as="font" type="font/woff2" crossorigin>`);
        if (!tags.length) return html;
        const tag = tags.join('\n');
        // Juste après le jeu de caractères, qui doit rester en tête.
        const out = html.replace(/(<meta\s+charset=["']?[\w-]+["']?\s*\/?>)/i, `$1\n${tag}`);
        return out === html ? html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`) : out;
      }
    }
  };
}
