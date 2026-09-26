// Le même endroit du site dans les trois thèmes. node themes.mjs prefix W H [--mobile] [--pages]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const prefix = process.argv[2] || 'th';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const mob = process.argv.includes('--mobile'), pages = process.argv.includes('--pages');
const THEMES = ['vert', 'nuit', 'papier'];
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const t of THEMES) {
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text().slice(0, 160)); });
  await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
  const shot = async (name) => { await page.mouse.move(W - 3, H - 3); await page.screenshot({ path: `shots/${prefix}-${name}-${t}.jpg`, type: 'jpeg', quality: 72 }); };
  if (!pages) {
    await page.goto(`http://localhost:5179/?palette=${t}&th=${Date.now()}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);
    await shot('01hero');
    const go = async (sel, dy = 0) => { const y = await page.evaluate(s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : null; }, sel); if (y == null) return false; await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), y + dy); await page.waitForTimeout(1600); return true; };
    await go('#services', -10); await shot('02services');
    // le matériel : le plan 1, posé
    const st = await page.evaluate(() => { const s = window.__ST.getAll().find(s => s.pin && String(s.trigger.className).includes('k3__stage')); return s ? { start: s.start, end: s.end } : null; });
    if (st) {
      await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), st.start + 20);
      await page.waitForFunction(() => window.__k3?.plans?.[0]?.el.classList.contains('is-ready') || window.__k3?.plans?.[0]?.el.dataset.mode === 'photo', null, { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(2200); await shot('03kit');
      await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), st.start + (st.end - st.start) * 0.62);
      await page.waitForTimeout(2400); await shot('04kit-photo');
    }
    await go('#about', -10); await shot('05about');
    await go('#why', -10); await shot('06why');
    const rs = await page.evaluate(() => { const s = window.__ST.getAll().find(s => s.pin && String(s.trigger.className).includes('reel__stage')); return s ? { start: s.start, end: s.end } : null; });
    if (rs) { await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), rs.start + (rs.end - rs.start) * 0.3); await page.waitForTimeout(3000); await shot('07reel'); }
    const gs = await page.evaluate(() => { const s = window.__ST.getAll().find(s => s.pin && String(s.trigger.className).includes('hm-band')); return s ? { start: s.start, end: s.end } : null; });
    if (gs) { await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), gs.end + 60); await page.waitForTimeout(2200); await shot('08gallery'); }
    await go('#works', -10); await shot('09works');
    await go('#contact', -10); await shot('10contact');
    await page.evaluate(() => window.__lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true })); await page.waitForTimeout(1800); await shot('11footer');
  } else {
    for (const [url, name] of [['/locations.html', 'p1loc'], ['/works.html', 'p2works'], ['/book.html', 'p3book'], ['/vacancy.html', 'p4vac']]) {
      await page.goto(`http://localhost:5179${url}?palette=${t}&th=${Date.now()}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2200);
      await shot(name);
      await page.evaluate(() => (window.__lenis ? window.__lenis.scrollTo(1100, { immediate: true }) : window.scrollTo(0, 1100)));
      await page.waitForTimeout(1500);
      await shot(name + 'b');
    }
  }
  const info = await page.evaluate(() => ({ pal: document.documentElement.dataset.palette || 'vert', fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))], sw: document.documentElement.scrollWidth }));
  console.log(t.padEnd(7), JSON.stringify(info), errs.length ? JSON.stringify(errs.slice(0, 6)) : '');
  await page.context().close();
}
await browser.close();
