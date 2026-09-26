import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const prefix = process.argv[2] || 'rl';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const mobile = process.argv.includes('--mobile');
const ps = JSON.parse(process.argv[5] || '[0,0.25,0.5,0.75,1]');
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text()); });
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto('http://localhost:5179/?r=' + Date.now(), { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const st = await page.evaluate(() => { const s = window.__ST.getAll().find(s => s.pin && String(s.trigger.className).includes('reel__stage')); return s ? { start: s.start, end: s.end } : null; });
if (!st) { console.log('no reel pin', errs); await browser.close(); process.exit(0); }
await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), st.start - 5);
await page.waitForFunction(() => window.__reel?.three?.cards?.length === 9, null, { timeout: 60000 });
await page.waitForTimeout(800);
let i = 0;
for (const p of ps) {
  await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), st.start + (st.end - st.start) * p);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `shots/${prefix}-${i++}.jpg`, type: 'jpeg', quality: 76 });
}
// clic au centre de la vue du milieu
await page.mouse.move(W / 2, H * 0.45);
await page.waitForTimeout(300);
await page.mouse.click(W / 2, H * 0.45);
await page.waitForTimeout(250);
await page.screenshot({ path: `shots/${prefix}-open-a.jpg`, type: 'jpeg', quality: 76 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `shots/${prefix}-open-b.jpg`, type: 'jpeg', quality: 76 });
const opened = await page.evaluate(() => !document.getElementById('reel-view').hidden && document.querySelector('[data-rv-h]').textContent);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(900);
await page.screenshot({ path: `shots/${prefix}-open-c.jpg`, type: 'jpeg', quality: 76 });
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
const closed = await page.evaluate(() => document.getElementById('reel-view').hidden);
console.log(JSON.stringify({ pin: st, opened, closed, errs }));
await browser.close();
