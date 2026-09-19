import { defineConfig } from 'vite';
import { resolve } from 'path';
import htmlInclude from './plugins/html-include.js';
import { identity } from './src/data/site.js';

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
      year: new Date().getFullYear()
    })
  ],
  build: {
    target: 'es2020',
    cssTarget: 'safari15',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'index.html'),
        locations: resolve(__dirname, 'locations.html'),
        works:     resolve(__dirname, 'works.html'),
        book:      resolve(__dirname, 'book.html'),
        vacancy:   resolve(__dirname, 'vacancy.html'),
        notfound:  resolve(__dirname, '404.html')
      },
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
