import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
const pages = process.argv.slice(2);
for (const path of pages) {
  await page.goto('http://localhost:5179' + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="?"]')].map((a, i) => { a.dataset.pt = i; return a.getAttribute('href'); }));
  const out = [];
  for (let i = 0; i < links.length; i++) {
    const r = await page.evaluate((i) => {
      const a = document.querySelector(`[data-pt="${i}"]`);
      const url = new URL(a.href, location.href);
      a.click();
      const res = [];
      for (const [k, v] of url.searchParams) {
        const els = [...document.querySelectorAll(`form[data-inquiry] [name="${k}"], form[data-inquiry] [name="${k}[]"]`)];
        if (!els.length) { res.push(`${k}: NO FIELD`); continue; }
        const ok = els.some(el => (el.tagName === 'SELECT' ? el.value === v.split(',')[0] : el.checked && v.split(',').includes(el.value)));
        res.push(`${k}=${v}: ${ok ? 'ok' : 'NOT SET'}`);
      }
      return res.join(' | ');
    }, i);
    out.push(r);
  }
  const bad = out.filter(x => /NOT|NO FIELD/.test(x));
  console.log(path, links.length, 'links;', bad.length ? 'PROBLEMS: ' + JSON.stringify([...new Set(bad)]) : 'all ok');
}
console.log('errs', errs);
await browser.close();
