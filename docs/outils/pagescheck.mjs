// Les 16 pages, à l'ordinateur (1440 × 900) et au téléphone (390 × 844) :
// erreurs de console, réponses ≥ 400, débordement sur le côté (mesuré à
// chaque pas du défilement). Rien n'est cliqué, aucun formulaire envoyé.
// node docs/outils/pagescheck.mjs <base>   ex. http://127.0.0.1:4186 ou https://tedystudios.com
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const B = (process.argv[2] || 'http://localhost:5179').replace(/\/$/, '');
const PAGES = ['/', '/services.html', '/live-streaming.html', '/event-organizing.html', '/ai-production.html', '/music-production.html', '/feature-film.html', '/documentary.html', '/equipment-rentals.html', '/portfolio.html', '/about.html', '/contact.html', '/locations.html', '/book.html', '/vacancy.html', '/404.html'];
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const res = [];
try {
  for (const [W, H, mob] of [[1440, 900, false], [390, 844, true]]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
    for (const p of PAGES) {
      const page = await ctx.newPage(); const bad = []; const errs = [];
      page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) bad.push(`${r.status()} ${r.url().replace(B, '')}`); });
      page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
      page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
      await page.goto(B + p, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1000);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      let sw = 0;
      for (let y = 0; y < h; y += H * 0.8) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(120);
        sw = Math.max(sw, await page.evaluate(() => document.documentElement.scrollWidth));
      }
      res.push({ W, p, sw: sw > W ? sw : 'ok', bad, errs });
      await page.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify({ checked: res.length, issues: res.filter((r) => r.sw !== 'ok' || r.bad.length || r.errs.length) }, null, 1));
