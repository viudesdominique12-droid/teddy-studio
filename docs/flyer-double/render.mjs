// Construit le flyer double : A5 (partage, bureau) et A5 imprimeur (3 mm de fond perdu), PDF et aperçus PNG.
//   python3 qr.py && node render.mjs <dossier de sortie>
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const HONEST = path.join(os.homedir(), 'honest-global');
const require = createRequire(path.join(os.homedir(), '.npm/_npx/705bc6b22212b352/node_modules/'));
const { chromium } = require('playwright-core');
const out = path.resolve(process.argv[2] || 'out');
fs.mkdirSync(out, { recursive: true });
const tpl = fs.readFileSync(path.join(HERE, 'flyer.tpl.html'), 'utf8');
const AUTO = process.env.AUTO_LINE || '';
const fill = (b, pw, ph) => tpl
  .replaceAll('{{ROOT}}', 'file://' + ROOT).replaceAll('{{HONEST}}', 'file://' + HONEST)
  .replaceAll('{{B}}', b).replaceAll('{{PW}}', pw).replaceAll('{{PH}}', ph).replaceAll('{{AUTO}}', AUTO)
  .replaceAll('{{QR_TEDDY}}', fs.readFileSync(path.join(HERE, 'qr-teddy.svg'), 'utf8'))
  .replaceAll('{{QR_HONEST}}', fs.readFileSync(path.join(HERE, 'qr-honest.svg'), 'utf8'));
const variants = [
  { name: 'A5', b: '0mm', w: 148, h: 210 },
  { name: 'A5-imprimeur-fond-perdu-3mm', b: '3mm', w: 154, h: 216 }
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const v of variants) {
  const file = path.join(out, `.tmp-${v.name}.html`);
  fs.writeFileSync(file, fill(v.b, `${v.w}mm`, `${v.h}mm`));
  const w = Math.round(v.w * 96 / 25.4), h = Math.round(v.h * 96 / 25.4);
  const ctx = await browser.newContext({ viewport: { width: w, height: h * 2 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('file://' + file, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  console.log(v.name, 'fontes :', await page.evaluate(() => [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))].join(', ')));
  const over = await page.evaluate(() => [...document.querySelectorAll('.in')].map((i) => { const u = i.querySelector('ul').getBoundingClientRect(), b = i.querySelector('.bottom').getBoundingClientRect(); return Math.round(b.top - u.bottom); }));
  console.log('  air entre la liste et le bas (px) :', over);
  await page.pdf({ path: path.join(out, `Flyer-Teddy-Honest-${v.name}.pdf`), width: `${v.w}mm`, height: `${v.h}mm`, printBackground: true, preferCSSPageSize: true });
  if (v.b === '0mm') {
    const secs = await page.$$('.page');
    await secs[0].screenshot({ path: path.join(out, 'apercu-face-teddy.png') });
    await secs[1].screenshot({ path: path.join(out, 'apercu-face-honest.png') });
  }
  await ctx.close();
  fs.unlinkSync(file);
}
await browser.close();
