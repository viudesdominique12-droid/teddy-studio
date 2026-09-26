// Vérifie la version construite (celle que Pages publiera) : fichiers manquants, erreurs, 3D, polices, thèmes.
// node prodcheck.mjs <base> [--mobile]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const BASE = process.argv[2] || 'http://localhost:4174/teddy-studio/';
const mob = process.argv.includes('--mobile');
const [W, H] = mob ? [390, 844] : [1440, 900];
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
let problems = 0;
for (const theme of ['vert', 'nuit', 'papier']) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
  for (const pth of ['', 'locations.html', 'works.html', 'book.html', 'vacancy.html']) {
    const page = await ctx.newPage();
    const bad = [];
    page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace(BASE, '/')); });
    page.on('requestfailed', r => { const f = r.failure()?.errorText || ''; if (!/ERR_ABORTED/.test(f)) bad.push('FAIL ' + f + ' ' + r.url().replace(BASE, '/')); });
    page.on('pageerror', e => bad.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') bad.push('console ' + m.text().slice(0, 140)); });
    await page.goto(BASE + pth + '?palette=' + theme, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    // parcourir la page pour déclencher tout ce qui se charge à l'approche
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += H * 0.8) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(260); }
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => ({
      pal: document.documentElement.dataset.palette || 'vert',
      fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))].join(', '),
      kit: document.querySelector('.k3') ? [...document.querySelectorAll('.k3__plan')].map(p => p.dataset.mode + (p.classList.contains('is-ready') ? '+' : '')).join(' ') : '',
      reel: document.querySelector('[data-reel]') ? (document.querySelector('#locations')?.classList.contains('reel-on') ? 'reel' : 'grille') : '',
      pal_ui: !!document.querySelector('.pal'),
      sw: document.documentElement.scrollWidth
    }));
    const flag = bad.length ? '  ✗ ' + bad.slice(0, 6).join(' | ') : '';
    if (bad.length) problems++;
    console.log(`${theme.padEnd(6)} ${(pth || 'index').padEnd(14)} pal=${st.pal} sel=${st.pal_ui ? 'oui' : 'NON'} sw=${st.sw}${st.kit ? ' kit=' + st.kit : ''}${st.reel ? ' lieux=' + st.reel : ''} | ${st.fonts}${flag}`);
    await page.close();
  }
  await ctx.close();
}
console.log(problems ? `PROBLÈMES : ${problems} page(s)` : 'AUCUN PROBLÈME');
await browser.close();
