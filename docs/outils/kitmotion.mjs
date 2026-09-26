// Défile la séquence du matériel à la molette (vitesse réaliste) et mesure, image par image,
// la vitesse de chaque changement. node kitmotion.mjs [label] [notchPx] [intervalMs]
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const label = process.argv[2] || 'avant';
const NOTCH = +(process.argv[3] || 100), EVERY = +(process.argv[4] || 90);
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
await page.goto('http://localhost:5179/?km=' + Date.now(), { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const st = await page.evaluate(() => { const s = window.__ST.getAll().find(s => s.pin && String(s.trigger.className).includes('k3__stage')); return { start: s.start, end: s.end }; });
await page.evaluate(y => window.__lenis.scrollTo(y, { immediate: true }), st.start - 300);
await page.waitForFunction(() => window.__k3.plans.filter(p => p.model).every(p => p.el.classList.contains('is-ready')), null, { timeout: 90000 });
await page.waitForTimeout(1200);
// l'enregistreur
await page.evaluate(() => {
  const plans = window.__k3.plans;
  const clipOf = (el) => { if (!el) return null; const m = /inset\(([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%/.exec(getComputedStyle(el).clipPath); return m ? 100 - (+m[2]) - (+m[4]) : 100; };
  window.__log = [];
  const tick = (t) => {
    window.__log.push({ t, y: scrollY, p: plans.map(p => ({ op: +getComputedStyle(p.text[1]).opacity, x: p.tr ? p.tr.x : p.pose.x, yaw: p.pose.yaw + (p.tr ? p.tr.spin : 0), lamp: p.pose.lamp, clip: p.el.dataset.mode === 'photo' ? clipOf(p.photo) : null })) });
    if (!window.__stop) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
// la molette
let y = await page.evaluate(() => scrollY);
while (y < st.end + 400) {
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, NOTCH);
  await page.waitForTimeout(EVERY);
  y = await page.evaluate(() => scrollY);
}
await page.waitForTimeout(1500);
const log = await page.evaluate(() => { window.__stop = true; return window.__log; });
await browser.close();
// l'analyse : pour chaque plan, la plus forte variation d'une image à l'autre
const names = ['camera', 'lenses', 'drone', 'lighting', 'mics', 'green'];
const res = names.map((n, i) => ({ n, dOp: 0, dX: 0, dYaw: 0, dClip: 0, dLamp: 0 }));
let lampJumps = 0;
for (let k = 1; k < log.length; k++) {
  const a = log[k - 1], b = log[k];
  const dt = (b.t - a.t) / 16.67; // en images de 60 i/s
  if (dt <= 0) continue;
  b.p.forEach((q, i) => {
    const r = res[i], o = a.p[i];
    r.dOp = Math.max(r.dOp, Math.abs(q.op - o.op) / dt);
    r.dX = Math.max(r.dX, Math.abs(q.x - o.x) / dt);
    r.dYaw = Math.max(r.dYaw, Math.abs(q.yaw - o.yaw) / dt);
    if (q.clip != null && o.clip != null) r.dClip = Math.max(r.dClip, Math.abs(q.clip - o.clip) / dt);
  });
}
// durée réelle (ms) de l'apparition du texte de chaque plan : de 5 % à 95 % d'opacité
const dur = names.map((n, i) => {
  let t0 = null, t1 = null, t2 = null, t3 = null;
  for (const e of log) { const v = e.p[i].op; if (t0 == null && v > 0.05) t0 = e.t; if (t0 != null && t1 == null && v > 0.95) t1 = e.t; if (t1 != null && t2 == null && v < 0.95) t2 = e.t; if (t2 != null && t3 == null && v < 0.05) t3 = e.t; }
  return { in: t1 && t0 ? Math.round(t1 - t0) : null, out: t3 && t2 ? Math.round(t3 - t2) : null };
});
console.log(label, 'frames', log.length, 'scroll', Math.round(log[0].y), '→', Math.round(log.at(-1).y), 'ms', Math.round(log.at(-1).t - log[0].t));
console.log('plan      max/image: opacité  x(½écran)  rotation(°)  photo(%)   | texte: entrée ms / sortie ms');
res.forEach((r, i) => console.log(r.n.padEnd(9), r.dOp.toFixed(3).padStart(8), r.dX.toFixed(3).padStart(9), r.dYaw.toFixed(1).padStart(10), (r.dClip ? r.dClip.toFixed(1) : '-').padStart(10), '   |', String(dur[i].in).padStart(6), '/', String(dur[i].out).padStart(5)));
(await import('fs')).writeFileSync(`kitmotion-${label}.json`, JSON.stringify(log));
