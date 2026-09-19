/**
 * REBASAGE POUR UN HÉBERGEMENT EN SOUS-DOSSIER.
 *
 * Le site est écrit en chemins absolus depuis la racine (`/reel/r01.mp4`,
 * `/loc/afar-1200.webp`, `/#contact`). C'est la forme JUSTE : sur son domaine
 * définitif, Teddy Studio sera servi à la racine.
 *
 * GitHub Pages, lui, sert un dépôt de projet sous `/<dépôt>/`. Plutôt que de
 * tordre les sources pour un hébergement de passage, on réécrit la SORTIE de
 * build — la source reste correcte, le sous-dossier reste une affaire de
 * livraison.
 *
 * Trois traitements distincts, parce que les trois formats ont des pièges
 * différents :
 *   • HTML — seulement les attributs qui portent une URL. `srcset` est découpé
 *     sur les virgules, chaque candidat étant « url largeur ».
 *   • CSS  — seulement l'intérieur de `url(...)`.
 *   • JS   — SEULEMENT les littéraux commençant par un préfixe d'asset connu.
 *     Un remplacement large casserait les littéraux d'expression régulière du
 *     bundle minifié (`.replace(/x/g, …)` commence aussi par `(/`).
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const base = process.argv[2];
const dir = process.argv[3] || 'dist';
if (!base || !base.startsWith('/') || !base.endsWith('/')) {
  console.error('usage: node scripts/rebase.mjs /prefixe/ [dossier]');
  process.exit(1);
}

/* Les dossiers d'assets réellement servis : sert de garde-fou au rebasage JS. */
const ASSET_DIRS = ['assets', 'reel', 'loc', 'kit', 'works', 'clients', 'office',
                    'media', 'fonts', 'emblem', 'film'];
const URL_ATTRS = ['src', 'href', 'poster', 'content', 'data-src', 'data-view'];
const SET_ATTRS = ['srcset', 'imagesrcset'];

/** Préfixe une URL racine-absolue, en refusant les cas qui n'en sont pas. */
const put = (u) => {
  if (!u.startsWith('/')) return u;        // relative, externe, ancre seule
  if (u.startsWith('//')) return u;        // protocole-relatif
  if (u.startsWith(base)) return u;        // déjà rebasée : rejouable sans dégât
  return base + u.slice(1);
};

const rebaseSet = (v) => v.split(',')
  .map((c) => {
    const t = c.trim();
    if (!t) return null;
    const sp = t.indexOf(' ');
    return sp < 0 ? put(t) : put(t.slice(0, sp)) + t.slice(sp);
  })
  .filter(Boolean).join(', ');

function rebaseHtml(s) {
  for (const a of URL_ATTRS) {
    s = s.replace(new RegExp(`(\\s${a}=")(/[^"]*)"`, 'g'), (_, p, u) => `${p}${put(u)}"`);
  }
  for (const a of SET_ATTRS) {
    s = s.replace(new RegExp(`(\\s${a}=")([^"]*)"`, 'g'), (_, p, v) => `${p}${rebaseSet(v)}"`);
  }
  return s;
}

const rebaseCss = (s) =>
  s.replace(/url\(\s*(['"]?)(\/[^'")]*)\1\s*\)/g, (_, q, u) => `url(${q}${put(u)}${q})`);

const rebaseJs = (s) =>
  s.replace(new RegExp(`(['"\`])(/(?:${ASSET_DIRS.join('|')})/[^'"\`]*)\\1`, 'g'),
            (_, q, u) => `${q}${put(u)}${q}`);

const handlers = { '.html': rebaseHtml, '.css': rebaseCss, '.js': rebaseJs };
let touched = 0;

(function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const fn = handlers[extname(p)];
    if (!fn) continue;
    const before = readFileSync(p, 'utf8');
    const after = fn(before);
    if (after !== before) { writeFileSync(p, after); touched++; }
  }
})(dir);

console.log(`rebase « ${base} » : ${touched} fichier(s) réécrit(s) dans ${dir}/`);
