// Capture chaque plan de la séquence à des instants donnés. node plans.mjs prefix W H '[0.35,0.75]' [--mobile]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const prefix = process.argv[2] || 'pl';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const us = JSON.parse(process.argv[5] || '[0.35,0.75]');
const mobile = process.argv.includes('--mobile');
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text()); });
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto('http://localhost:5179/?p=' + Date.now(), { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const geo = await page.evaluate(() => {
  const st = window.__ST.getAll().find(s => s.pin && String(s.trigger.className).includes('k3__stage'));
  const durs = window.__k3.plans.map(p => p.dur);
  return { start: st.start, end: st.end, durs, total: durs.reduce((a, b) => a + b, 0) + 0.15 };
});
// on laisse les modèles arriver
await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), geo.start + 10);
await page.waitForFunction(() => window.__k3.plans.filter(p => p.model).every(p => p.el.classList.contains('is-ready') || p.el.dataset.mode === 'photo'), null, { timeout: 90000 });
let t0 = 0, n = 0;
for (let i = 0; i < geo.durs.length; i++) {
  for (const u of us) {
    const t = t0 + u * geo.durs[i];
    await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), geo.start + (geo.end - geo.start) * (t / geo.total));
    await page.waitForTimeout(1700);
    await page.screenshot({ path: `shots/${prefix}-${i + 1}-${Math.round(u * 100)}.jpg`, type: 'jpeg', quality: 76 });
    n++;
  }
  t0 += geo.durs[i];
}
const modes = await page.evaluate(() => window.__k3.plans.map(p => p.el.dataset.mode + (p.el.classList.contains('is-ready') ? '+' : '')));
console.log(JSON.stringify({ n, modes, pin: [geo.start, geo.end], errs }));
await browser.close();
