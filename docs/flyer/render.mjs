// Construit le flyer : A5 (148 × 210 mm) et A5 imprimeur (fond perdu de 3 mm), en PDF, plus des aperçus PNG.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// La racine du projet, deux dossiers au-dessus de celui-ci : les polices, le logo, les images.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire('/Users/dominiqueviudes/.npm/_npx/705bc6b22212b352/node_modules/');
const { chromium } = require('playwright-core');
const out = process.argv[2] || 'out';
fs.mkdirSync(out, { recursive: true });
const URL = 'https://viudesdominique12-droid.github.io/teddy-studio/';
const tpl = fs.readFileSync('flyer.tpl.html', 'utf8');
const qr = fs.readFileSync('qr.svg', 'utf8');
const make = (b, pw, ph) => tpl.replaceAll('{{ROOT}}', 'file://' + ROOT).replaceAll('{{FONTS}}', 'file://' + fs.realpathSync('fonts')).replaceAll('{{QR}}', qr).replaceAll('{{URL1}}', 'viudesdominique12-droid.github.io').replaceAll('{{URL2}}', '/teddy-studio/').replaceAll('{{B}}', b).replaceAll('{{PW}}', pw).replaceAll('{{PH}}', ph);
const variants = [
  { name: 'A5', b: '0mm', w: 148, h: 210 },
  { name: 'A5-imprimeur-fond-perdu-3mm', b: '3mm', w: 154, h: 216 }
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const v of variants) {
  const file = `${out}/flyer-${v.name}.html`;
  fs.writeFileSync(file, make(v.b, `${v.w}mm`, `${v.h}mm`));
  const pxW = Math.round(v.w * 96 / 25.4); const pxH = Math.round(v.h * 96 / 25.4);
  const ctx = await browser.newContext({ viewport: { width: pxW, height: pxH }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('file://' + fs.realpathSync(file), { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).join(', '));
  await page.pdf({ path: `${out}/Teddy-Studio-flyer-${v.name}.pdf`, width: `${v.w}mm`, height: `${v.h}mm`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  if (v.name === 'A5') {
    const pages = await page.$$('.page');
    for (const [i, el] of pages.entries()) await el.screenshot({ path: `${out}/Teddy-Studio-flyer-${i ? 'verso' : 'recto'}.png` });
  }
  console.log(`${v.name} : PDF prêt · polices chargées : ${fonts}`);
  await ctx.close();
}
await browser.close();
