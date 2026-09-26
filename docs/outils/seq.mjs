// usage: node seq.mjs <url> <outprefix> [width] [height] [step] [--mobile] [--intro]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const args = process.argv.slice(2);
const url = args[0], out = args[1];
const w = +(args[2] || 1440), h = +(args[3] || 900);
const step = +(args[4] || h);
const mobile = args.includes('--mobile');
const intro = args.includes('--intro');
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('PAGEERROR', e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('CONSOLE', m.type(), m.text()); });
if (!intro) await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
const H = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('height', H);
let i = 0;
for (let y = 0; y <= H - h + step; y += step) {
  const yy = Math.min(y, H - h);
  // approach gradually for scrubbed animations
  await page.evaluate(yy => { if (window.__lenis) window.__lenis.scrollTo(yy, { immediate: true }); else window.scrollTo(0, yy); }, yy);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 75 });
  i++;
  if (yy >= H - h) break;
}
console.log('shots', i);
await browser.close();
