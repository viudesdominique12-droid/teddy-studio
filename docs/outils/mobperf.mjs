// Défile toute la page au doigt, en téléphone (390×844, écran ×3), processeur ralenti ×4,
// et mesure, section par section, les images qui arrivent en retard. node mobperf.mjs <label> [url]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const label = process.argv[2] || 'avant';
const URL0 = process.argv[3] || 'http://localhost:5179/';
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: process.argv.includes('--soft') ? ['--disable-gpu', '--disable-gpu-compositing'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
const page = await ctx.newPage();
await page.goto(URL0 + (URL0.includes('?') ? '&' : '?') + 'mp=' + Date.now(), { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const cdp = await ctx.newCDPSession(page);
if (!process.argv.includes('--soft')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluate(() => {
  window.__fr = [];
  const secs = ['#top', '#services', '#resources', '#about', '#why', '#locations', '#gallery', '#works', '#contact', '.ftr'].map(s => document.querySelector(s)).filter(Boolean);
  window.__secs = secs;
  let last = performance.now();
  const tick = (t) => { window.__fr.push([t - last, scrollY]); last = t; if (!window.__stop) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const H = await page.evaluate(() => document.documentElement.scrollHeight);
// des gestes de doigt successifs, d'environ un écran chacun, à allure de lecture rapide
let y = 0;
while (y < H - 900) {
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -700, xDistance: 0, speed: 1400, gestureSourceType: 'touch', repeatCount: 1 });
  y = await page.evaluate(() => scrollY);
}
await page.waitForTimeout(800);
const res = await page.evaluate(() => {
  window.__stop = true;
  const bounds = window.__secs.map(s => { const r = s.getBoundingClientRect(); return { id: s.id || s.className.split(' ')[0], top: r.top + scrollY, bottom: r.bottom + scrollY }; });
  const by = {};
  for (const [dt, y] of window.__fr) {
    const mid = y + innerHeight / 2;
    const b = bounds.find(b => mid >= b.top && mid < b.bottom);
    const k = b ? b.id : '?';
    (by[k] = by[k] || []).push(dt);
  }
  const out = [];
  for (const b of bounds) {
    const a = by[b.id]; if (!a || a.length < 5) continue;
    const s = [...a].sort((x, y) => x - y);
    const mean = a.reduce((p, c) => p + c, 0) / a.length;
    out.push({ s: b.id, n: a.length, mean: +mean.toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), late: Math.round(100 * a.filter(x => x > 25).length / a.length), jank: a.filter(x => x > 50).length });
  }
  const all = window.__fr.map(f => f[0]).slice(5);
  return { out, total: { n: all.length, mean: +(all.reduce((p, c) => p + c, 0) / all.length).toFixed(1), late: Math.round(100 * all.filter(x => x > 25).length / all.length), jank: all.filter(x => x > 50).length } };
});
console.log(`${label} — ${res.total.n} images · moyenne ${res.total.mean} ms · en retard (>25 ms) ${res.total.late} % · saccades (>50 ms) ${res.total.jank}`);
console.log('section       images  moy.  p95   retard  saccades');
for (const o of res.out) console.log(o.s.padEnd(13), String(o.n).padStart(5), String(o.mean).padStart(6), String(o.p95).padStart(5), (o.late + ' %').padStart(7), String(o.jank).padStart(8));
await browser.close();
