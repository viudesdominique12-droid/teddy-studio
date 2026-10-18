// Inventaire des champs des formulaires de demande. node formfields.mjs <page...>
import { createRequire } from 'module';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const out = {};
for (const p of process.argv.slice(2)) {
  await page.goto('http://localhost:5179' + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  out[p] = await page.evaluate((SEL) => [...document.querySelectorAll(SEL)].map(f => ({
    inquiry: f.dataset.inquiry || f.id || 'form',
    fields: [...f.elements].filter(e => e.name).reduce((acc, e) => {
      const k = e.name; acc[k] ||= { type: e.type || e.tagName.toLowerCase(), required: false, values: [] };
      if (e.required) acc[k].required = true;
      if (e.tagName === 'SELECT') acc[k].values.push(...[...e.options].map(o => o.value).filter(Boolean));
      else if (e.type === 'checkbox' || e.type === 'radio') acc[k].values.push(e.value);
      return acc;
    }, {})
  })), process.env.ALLFORMS ? 'main form' : 'form[data-inquiry]');
}
console.log(JSON.stringify(out));
await browser.close();
