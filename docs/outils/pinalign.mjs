// Vérifie que chaque scène épinglée démarre pile à sa place (écart 0), au chargement puis après avoir ouvert et fermé des services. node pinalign.mjs W H [--mobile]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900);
const mobile = process.argv.includes('--mobile');
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text()); });
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto('http://localhost:5179/?pc2=' + Date.now(), { waitUntil: 'load' });
await page.waitForFunction(() => window.__ST && window.__k3);
await page.evaluate(() => { window.__refreshes = 0; window.__ST.addEventListener('refresh', () => window.__refreshes++); });
const info = (label) => page.evaluate((label) => {
  const pins = window.__ST.getAll().filter(s => s.pin);
  const out = pins.map(s => {
    const el = s.pin.parentElement.classList.contains('pin-spacer') ? s.pin.parentElement : s.pin;
    return String(s.trigger.className).split(' ')[0] + ' start ' + Math.round(s.start) + ' vs top ' + Math.round(el.getBoundingClientRect().top + scrollY) + ' → ' + (Math.round(s.start) - Math.round(el.getBoundingClientRect().top + scrollY));
  });
  return label + ' | refreshes ' + window.__refreshes + ' | ' + out.join(' ; ');
}, label);
await page.waitForTimeout(300);  console.log(await info('0.3s après load'));
await page.waitForTimeout(2200); console.log(await info('2.5s après load'));
// ouvrir un service (au milieu de la liste), sans défiler dans la scène
const y = await page.evaluate(() => document.querySelector('#services').getBoundingClientRect().top + scrollY);
await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), y);
await page.waitForTimeout(600);
const q = await page.$$('.sv__q');
await q[3].click();
await page.waitForTimeout(1200); console.log(await info('service 4 ouvert'));
await q[0].click();
await page.waitForTimeout(1200); console.log(await info('service 1 ouvert'));
await q[0].click();
await page.waitForTimeout(1200); console.log(await info('tout fermé     '));
await page.waitForTimeout(3000); console.log(await info('+3s au repos   '));
console.log('errs', JSON.stringify(errs));
await browser.close();
