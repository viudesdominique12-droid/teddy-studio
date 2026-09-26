// usage: node sect.mjs <url> <outprefix> <w> <h> <sel1,sel2,...> [--mobile] [--offset=N]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const [url, out, W, H, sels, ...rest] = process.argv.slice(2);
const mobile = rest.includes('--mobile');
const offArg = rest.find(a => a.startsWith('--offset='));
const off = offArg ? +offArg.split('=')[1] : 0;
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('PAGEERROR', e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('CONSOLE', m.type(), m.text()); });
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
let i = 0;
for (const sel of sels.split(',')) {
  if (sel === 'top') {
    await page.evaluate(() => { window.__lenis ? window.__lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0); });
  } else {
    const ok = await page.evaluate(([sel, off]) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const y = el.getBoundingClientRect().top + window.scrollY - off;
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
      return true;
    }, [sel, off]);
    if (!ok) { console.error('missing', sel); continue; }
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 80 });
  i++;
}
await browser.close();
console.log('done', i);
