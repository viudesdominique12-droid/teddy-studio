// A/B de fluidité : le même parcours de l'accueil, à vitesse constante et piloté par
// l'horloge, sur deux versions du site servies côte à côte (A = référence, B = modifiée).
// Donne, section par section, la durée moyenne des images, le 95e centile, la pire image
// et le nombre d'images en retard. Toujours comparer dans les mêmes conditions : la
// machine, sa batterie et son mode d'énergie changent tout.
//
//   node abperf.mjs --a=http://localhost:5199/ --b=http://localhost:5178/ [--engine=webkit]
//                   [--mobile] [--cpu=4] [--pxs=1400] [--runs=2] [--cssB="…"]
//
// --engine=webkit : le moteur de Safari (npx playwright install webkit). C'est lui qui
//   révèle les masques SVG, les grands calques et les à-coups de la 3D. En économie
//   d'énergie, il plafonne à 30 images/s : une image « à l'heure » y dure 33 ms.
// --cssB : une feuille injectée dans B seulement, pour mesurer le coût d'un effet
//   (par exemple `body::after{display:none!important}` pour le grain).
import { createRequire } from 'module';
const require = createRequire('/Users/dominiqueviudes/.npm/_npx/705bc6b22212b352/node_modules/');
const { chromium, webkit } = require('playwright-core');

const argv = process.argv.slice(2);
const opt = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const WK = opt('engine', 'chrome') === 'webkit';
const MOB = argv.includes('--mobile');
const W = +opt('w', MOB ? 390 : 1512); const H = +opt('h', MOB ? 844 : 860);
const pxs = +opt('pxs', MOB ? 900 : 1400);
const runs = +opt('runs', 2);
const CPU = +opt('cpu', 1);
const A = opt('a', 'http://localhost:5199/');
const B = opt('b', 'http://localhost:5178/');
const cssA = opt('cssA', ''); const cssB = opt('cssB', '');
const budget = WK ? 40 : 20;

async function once(url, css) {
  const browser = WK ? await webkit.launch({ headless: true })
    : await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: MOB ? 3 : 2, isMobile: MOB, hasTouch: MOB });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  if (CPU > 1 && !WK) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'ab=' + Date.now(), { waitUntil: 'load' });
  if (css) await page.addStyleTag({ content: css });
  await page.waitForTimeout(5000);   // le temps de lire l'accueil : la page se prépare
  const res = await page.evaluate(([pxs, H, budget]) => new Promise((done) => {
    const ids = ['#top', '#services', '#resources', '#about', '#why', '#locations', '#gallery', '#works', '#contact', '.ftr'];
    const bounds = ids.map((s) => document.querySelector(s)).filter(Boolean).map((s) => {
      const r = (s.closest('.pin-spacer') || s).getBoundingClientRect();
      return { id: s.id || s.className.split(' ')[0], top: r.top + scrollY, bottom: r.bottom + scrollY };
    });
    const max = document.documentElement.scrollHeight - innerHeight;
    const go = (y) => { if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); };
    const fr = [];
    let t0 = null; let last = null;
    const tick = (t) => {
      if (t0 === null) { t0 = t; last = t; }
      const y = Math.min(max, ((t - t0) / 1000) * pxs);   // la position suit l'horloge, pas le nombre d'images
      if (last !== t) fr.push([t - last, scrollY]);
      last = t;
      go(y);
      if (y < max) { requestAnimationFrame(tick); return; }
      setTimeout(() => {
        const by = {};
        for (const [dt, sy] of fr) {
          const b = bounds.find((b) => sy + H / 2 >= b.top && sy + H / 2 < b.bottom);
          (by[b ? b.id : '?'] = by[b ? b.id : '?'] || []).push(dt);
        }
        const stat = (a) => { const s = [...a].sort((x, y) => x - y); return { mean: a.reduce((p, c) => p + c, 0) / a.length, p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1], late: a.filter((x) => x > budget).length }; };
        done({ total: stat(fr.map((f) => f[0])), secs: bounds.map((b) => ({ id: b.id, ...(by[b.id] && by[b.id].length > 3 ? stat(by[b.id]) : {}) })) });
      }, 300);
    };
    requestAnimationFrame(tick);
  }), [pxs, H, budget]);
  await browser.close();
  return res;
}

const agg = { A: [], B: [] };
for (let i = 0; i < runs; i++) {
  agg.A.push(await once(A, cssA));
  agg.B.push(await once(B, cssB));
}
const f = (x) => (x == null ? '   -' : x.toFixed(0).padStart(4));
const avg = (list, fn) => { const v = list.map(fn).filter((x) => x != null && !Number.isNaN(x)); return v.length ? v.reduce((p, c) => p + c, 0) / v.length : null; };
const row = (id, get) => {
  const a = agg.A.map(get); const b = agg.B.map(get);
  console.log(id.padEnd(14), f(avg(a, (s) => s.mean)), f(avg(a, (s) => s.p95)), f(avg(a, (s) => s.max)), f(avg(a, (s) => s.late)).padStart(6), '  ',
    f(avg(b, (s) => s.mean)), f(avg(b, (s) => s.p95)), f(avg(b, (s) => s.max)), f(avg(b, (s) => s.late)).padStart(6));
};
console.log(`\n${WK ? 'WebKit' : 'Chrome'}${MOB ? ' téléphone' : ''}${CPU > 1 ? ` CPU×${CPU}` : ''} ${W}×${H} — ${pxs} px/s — ${runs} passages — A=${A} B=${B}`);
console.log('                  ──────── A ────────         ──────── B ────────');
console.log('section          moy  p95  max retards    moy  p95  max retards');
for (const id of agg.A[0].secs.map((s) => s.id)) row(id, (r) => r.secs.find((s) => s.id === id) || {});
row('TOTAL', (r) => r.total);
console.log(`(ms ; retards = images de plus de ${budget} ms ; moyenne des ${runs} passages)`);
