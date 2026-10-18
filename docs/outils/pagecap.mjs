// Capture une page section par section. node pagecap.mjs <chemin> <préfixe> [W H] [--mobile] [--palette=x]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const [, , path = '/', prefix = 'pc', W0 = '1440', H0 = '900'] = process.argv;
const W = +W0, H = +H0, mob = process.argv.includes('--mobile');
const pal = (process.argv.find(a => a.startsWith('--palette=')) || '').split('=')[1];
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text().slice(0, 200)); });
page.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto(`http://localhost:5179${path}${path.includes('?') ? '&' : '?'}pc=${Date.now()}${pal ? '&palette=' + pal : ''}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3200);
await page.mouse.move(W * 0.7, H * 0.4);
let n = 0;
const shot = async (name) => page.screenshot({ path: `shots/${prefix}-${String(n++).padStart(2, '0')}-${name}.jpg`, type: 'jpeg', quality: 70 });
await shot('hero');
const ids = await page.evaluate(() => [...document.querySelectorAll('main > section[id], main > section, main > div.dv-band')].map((s, i) => { s.dataset.capi = i; return { i, id: s.id || s.className.split(' ')[0] }; }));
for (const { i, id } of ids.slice(1)) {
  const y = await page.evaluate((i) => document.querySelector(`[data-capi="${i}"]`).getBoundingClientRect().top + scrollY, i);
  await page.evaluate(y => (window.__lenis ? window.__lenis.scrollTo(y - 20, { immediate: true }) : window.scrollTo(0, y - 20)), y);
  await page.waitForTimeout(1400);
  await shot(id);
}
await page.evaluate(() => (window.__lenis ? window.__lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true }) : window.scrollTo(0, 1e6)));
await page.waitForTimeout(1200);
await shot('end');
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
console.log(JSON.stringify({ path, shots: n, sw, W, errs: errs.slice(0, 12) }));
await browser.close();
