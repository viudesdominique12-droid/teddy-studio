// Cherche tout texte visible qui dépasse de l'écran, section par section. node overflow.mjs W H [--mobile]
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
await page.goto('http://localhost:5179/?a=' + Date.now(), { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const found = new Map();
let maxScrollW = 0;
for (let y = 0; y < total; y += Math.round(H * 0.5)) {
  await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), y);
  await page.waitForTimeout(650);
  const res = await page.evaluate(() => {
    const eff = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; } return o; };
    const bad = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (el.closest('[aria-hidden="true"], script, style, noscript, .boot, dialog:not([open])')) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const rc of r.getClientRects()) {
        if (rc.width < 1 || rc.bottom < 0 || rc.top > innerHeight) continue;
        if (rc.right > innerWidth + 1 || rc.left < -1) {
          if (eff(el) < 0.05) break;
          const path = []; for (let e = el; e && e !== document.body && path.length < 4; e = e.parentElement) path.unshift(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : ''));
          bad.push({ path: path.join(' > '), text: n.textContent.trim().slice(0, 40), left: Math.round(rc.left), right: Math.round(rc.right) });
          break;
        }
      }
    }
    return { bad, sw: document.documentElement.scrollWidth };
  });
  maxScrollW = Math.max(maxScrollW, res.sw);
  for (const b of res.bad) { const k = b.path + '|' + b.text; if (!found.has(k)) found.set(k, { ...b, y }); }
}
console.log(JSON.stringify({ W, H, mobile, maxScrollW, offenders: [...found.values()], errs }, null, 1));
await browser.close();
