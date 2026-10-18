import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync } from 'fs';
import htmlInclude from './plugins/html-include.js';
import { identity, inquiry } from './src/data/site.js';

export default defineConfig({
  appType: 'mpa',
  /* Sur son domaine, le site est servi à la racine — c'est la valeur par
     défaut et la forme juste. GitHub Pages sert un dépôt de projet sous
     `/<dépôt>/` : la CI pose alors SITE_BASE. Passer par `base` plutôt que par
     une réécriture maison est indispensable pour les imports dynamiques
     (Three.js), dont Vite écrit les URL dans son propre code de préchargement.
     `scripts/rebase.mjs` ne rattrape ensuite que ce que Vite ne connaît pas :
     les attributs `data-*` qui portent des chemins. */
  base: process.env.SITE_BASE || '/',
  plugins: [
    htmlInclude({
      phone: identity.phone,
      phoneDisplay: identity.phoneDisplay,
      email: identity.email,
      whatsapp: inquiry.whatsapp,
      year: new Date().getFullYear()
    })
  ],
  build: {
    target: 'es2020',
    cssTarget: 'safari15',
    assetsInlineLimit: 2048,
    rollupOptions: {
      // Les pages du site. Depuis le brief du 17/10/2026 : les sept divisions,
      // Services, Portfolio, About et Contact. Une page absente est ignorée.
      input: Object.fromEntries([
        ['main', 'index.html'], ['locations', 'locations.html'], ['works', 'works.html'],
        ['book', 'book.html'], ['vacancy', 'vacancy.html'], ['notfound', '404.html'],
        ['services', 'services.html'], ['live', 'live-streaming.html'], ['events', 'event-organizing.html'],
        ['ai', 'ai-production.html'], ['music', 'music-production.html'], ['film', 'feature-film.html'],
        ['doc', 'documentary.html'], ['rentals', 'equipment-rentals.html'], ['portfolio', 'portfolio.html'],
        ['about', 'about.html'], ['contact', 'contact.html']
      ].filter(([, f]) => existsSync(resolve(__dirname, f))).map(([k, f]) => [k, resolve(__dirname, f)])),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/lenis')) return 'lenis';
        }
      }
    }
  },
  server: { port: 5178, open: false }
});
