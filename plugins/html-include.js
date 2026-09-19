/**
 * Mini-plugin Vite : <!--#include "nom" --> injecte src/partials/nom.html,
 * et {{clé}} substitue une variable passée au plugin.
 * Résolu au build ET en dev → HTML complet côté serveur, zéro FOUC, SEO intact.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function expand(html, vars, depth = 0) {
  if (depth > 6) return html;
  const out = html.replace(/<!--#include\s+"([\w./-]+)"\s*-->/g, (_m, name) => {
    const file = resolve(root, 'src/partials', `${name}.html`);
    if (!existsSync(file)) {
      throw new Error(`[html-include] partiel introuvable : src/partials/${name}.html`);
    }
    return expand(readFileSync(file, 'utf8'), vars, depth + 1);
  });
  return out === html ? out : expand(out, vars, depth + 1);
}

export default function htmlInclude(vars = {}) {
  return {
    name: 'teddy-html-include',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let out = expand(html, vars);
        out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, key) =>
          key in vars ? String(vars[key]) : m
        );
        return out;
      }
    }
  };
}
