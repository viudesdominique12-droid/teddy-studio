/**
 * LE HTML LIVRÉ, SANS LES NOTES DE TRAVAIL (F26, 18/10/2026).
 *
 * Les sources sont abondamment commentées — c'est voulu, elles racontent les
 * décisions. Le visiteur, lui, n'a pas à les télécharger : sur l'accueil, elles
 * pesaient plus que la place disponible dans le premier aller-retour réseau.
 * Au build SEULEMENT, on retire :
 *   • les commentaires HTML (sauf `<!--#…`, réservés aux inclusions) ;
 *   • les blocs `/* … *\/` des scripts en ligne (jamais le JSON-LD, jamais un
 *     script dont le résultat ne se compilerait plus : on garde alors l'original) ;
 *   • l'indentation en début de ligne, sauf dans `<pre>` et `<textarea>`.
 * Les sources ne changent pas, le dev non plus.
 */

import vm from 'node:vm';

/* Un seul passage de gauche à droite : le premier qui commence gagne. Un
   commentaire qui cite `<script>` reste un commentaire ; un script qui contient
   `<!--` reste un script. */
const TOKEN = /<!--[\s\S]*?-->|<(script|style|pre|textarea)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;

/** Retire les commentaires-blocs d'un script et l'indentation hors des chaînes. */
function stripJs(code) {
  let out = '';
  let i = 0;
  let lineStart = true;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    const d = code[i + 1];
    if (lineStart && (c === ' ' || c === '\t')) { i++; continue; }
    lineStart = false;
    if (c === '/' && d === '*') {              // commentaire-bloc : on le saute
      const end = code.indexOf('*/', i + 2);
      if (end < 0) return null;
      i = end + 2;
      continue;
    }
    if (c === '/' && d === '/') {              // commentaire de ligne : gardé tel quel
      const end = code.indexOf('\n', i);
      const stop = end < 0 ? n : end;
      out += code.slice(i, stop);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {  // chaîne : copiée sans y toucher
      let j = i + 1;
      while (j < n && code[j] !== c) j += code[j] === '\\' ? 2 : 1;
      if (j >= n) return null;
      out += code.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    out += c;
    if (c === '\n') lineStart = true;
    i++;
  }
  return out.replace(/\n{2,}/g, '\n').replace(/[ \t]+\n/g, '\n');
}

const compiles = (code) => {
  try { new vm.Script(code); return true; } catch { return false; }
};

function handleRaw(whole, tag, attrs, body) {
  tag = tag.toLowerCase();
  if (tag === 'pre' || tag === 'textarea' || tag === 'style') return whole;
  // Script externe, vide, ou de données (JSON-LD, gabarits) : intact.
  if (/\bsrc\s*=/.test(attrs) || !body.trim()) return whole;
  const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
  if (type && !/^(text\/javascript|module|application\/javascript)$/i.test(type)) return whole;
  if (type === 'module') return whole;       // Vite les a déjà extraits ; prudence
  const js = stripJs(body);
  if (js === null || !compiles(js) || !compiles(body)) return whole;
  const open = whole.slice(0, whole.indexOf('>') + 1);
  return `${open}${js.trim()}</script>`;
}

export function stripComments(html) {
  // Les blocs bruts sont mis de côté le temps de nettoyer le reste : rien de
  // ce qui est dans `<pre>`, `<textarea>`, un script ou un style ne peut être
  // touché par le nettoyage du texte.
  const kept = [];
  const hold = (s) => `\u0000${kept.push(s) - 1}\u0000`;
  let out = html.replace(TOKEN, (whole, tag, attrs, body) => {
    if (whole.startsWith('<!--')) return whole.startsWith('<!--#') ? hold(whole) : '';
    return hold(handleRaw(whole, tag, attrs || '', body || ''));
  });
  out = out
    .replace(/^[ \t]+|[ \t]+$/gm, '')       // l'indentation, les fins de ligne
    .replace(/\n{2,}/g, '\n');                // les lignes laissées vides
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}

export default function stripCommentsPlugin() {
  return {
    name: 'teddy-strip-comments',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => stripComments(html)
    }
  };
}
