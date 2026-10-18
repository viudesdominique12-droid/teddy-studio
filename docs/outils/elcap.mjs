// Capture des éléments précis. node elcap.mjs <chemin> <préfixe> <sel1,sel2,...> [W H] [--mobile] [--palette=x]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const [, , path = '/', prefix = 'el', sels = 'main', W0 = '1440', H0 = '900'] = process.argv;
const W = +W0, H = +H0, mob = process.argv.includes('--mobile');
const pal = (process.argv.find(a => a.startsWith('--palette=')) || '').split('=')[1];
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text().slice(0, 200)); });
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto(`http://localhost:5179${path}${path.includes('?') ? '&' : '?'}x=${Date.now()}${pal ? '&palette=' + pal : ''}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
let n = 0;
for (const sel of sels.split(',')) {
  const y = await page.evaluate((s) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY : null; }, sel);
  if (y == null) { errs.push('missing ' + sel); continue; }
  await page.evaluate(y => (window.__lenis ? window.__lenis.scrollTo(y - 80, { immediate: true }) : window.scrollTo(0, y - 80)), y);
  await page.waitForTimeout(1600);
  await page.locator(sel).first().screenshot({ path: `shots/${prefix}-${n++}.jpg`, type: 'jpeg', quality: 72 });
}
console.log(JSON.stringify({ errs }));
await browser.close();
