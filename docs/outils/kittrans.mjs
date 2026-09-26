// Capture un passage d'un outil à l'autre, dans le temps. node kittrans.mjs prefix W H '[[from,to],...]' [--mobile] [--nogl]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const prefix = process.argv[2] || 'tr';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const pairs = JSON.parse(process.argv[5] || '[[0,1],[2,3],[3,4],[1,0]]');
const mob = process.argv.includes('--mobile'), nogl = process.argv.includes('--nogl');
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: nogl ? ['--disable-webgl', '--disable-3d-apis'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text()); });
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto('http://localhost:5179/?kt=' + Date.now(), { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const geo = await page.evaluate(() => {
  const s = window.__ST.getAll().find(s => s.pin && String(s.trigger.className).includes('k3__stage'));
  const plans = window.__k3.plans; const total = plans.reduce((a, p) => a + p.dur, 0) + 0.1;
  return { start: s.start, end: s.end, mids: plans.map(p => (p.t0 + p.dur * 0.5) / total) };
});
const go = (i) => page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), geo.start + (geo.end - geo.start) * geo.mids[i]);
await go(0);
if (!nogl) await page.waitForFunction(() => window.__k3.plans.filter(p => p.model).every(p => p.el.classList.contains('is-ready')), null, { timeout: 90000 });
const shots = [0, 150, 300, 500, 800, 1300, 2000];
for (const [a, b] of pairs) {
  await go(a); await page.waitForTimeout(2600);
  const t0 = Date.now();
  await go(b);
  for (const ms of shots) {
    const wait = ms - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `shots/${prefix}-${a}${b}-${String(ms).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 70 });
  }
  const act = await page.evaluate(() => window.__k3.active);
  console.log(`${a}→${b}: active ${act}`);
}
console.log(JSON.stringify({ errs }));
await browser.close();
