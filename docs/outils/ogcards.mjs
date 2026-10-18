// Les cartes d'aperçu de lien (1200 × 630) : le décor du haut de chaque page,
// sans texte ni interface, puis une carte composée par-dessus avec les polices du site.
// node ogcards.mjs <out-dir> <page...>   (serveur de dev sur 5179)
// Pour refaire les aperçus de lien après un changement de titre :
//   node docs/outils/ogcards.mjs /tmp/og / /services.html …  puis copier les
//   .jpg dans public/og/ (1200 × 630, JPEG ~84). Le surtitre de l'accueil est
//   fixé dans KICK ; ailleurs, c'est celui de la page.
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire('/Users/mb/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const [, , outDir, ...pages] = process.argv;
const REPO = '/Users/mb/Documents/Site Web/Teddy studio/teddy-studio-refonte';
const b64 = (f) => readFileSync(`${REPO}/public/${f}`).toString('base64');
const FONTS = `
@font-face{font-family:'AB';src:url(data:font/woff2;base64,${b64('fonts/archivo-black.woff2')}) format('woff2')}
@font-face{font-family:'PX';src:url(data:font/woff2;base64,${b64('fonts/ibm-plex-sans-var.woff2')}) format('woff2');font-weight:100 700;font-stretch:75% 100%}`;
const LOGO = `data:image/webp;base64,${b64('brand/teddy-studio-logo-320.webp')}`;
const browser = await chromium.launch({ executablePath: '/Users/mb/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const out = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 756 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('teddy-seen', '1'); } catch (e) {} });
  for (const p of pages) {
    const name = p === '/' ? 'home' : p.replace(/^\//, '').replace('.html', '');
    const page = await ctx.newPage();
    await page.goto('http://localhost:5179' + p, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(4500);
    // Ce que dit la page : surtitre, titre (avec ses mots en couleur), teinte d'accent.
    const info = await page.evaluate(() => {
      const h1 = document.querySelector('main h1');
      const hero = h1?.closest('section, header') || document.querySelector('main > *');
      const zone = h1?.closest('section, header');
      const k = zone?.querySelector('.eyebrow, .dv-k, .hm-k') || zone?.querySelector('[class*="__k"]:not([class*="cli"])');
      // Les mots du titre, ligne par ligne comme sur la page, avec leur couleur.
      const parts = [];
      if (h1) {
        const tw = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
        const hasSr = h1.querySelector('.sr-only, .visually-hidden') || h1.hasAttribute('aria-label');
        let top = null; let n;
        while ((n = tw.nextNode())) {
          const el = n.parentElement;
          if (el.closest('.sr-only, .visually-hidden') || (!hasSr && el.closest('[aria-hidden="true"]')) || getComputedStyle(el).display === 'none') continue;
          const color = getComputedStyle(el).color;
          const ff = /Plex/.test(getComputedStyle(el).fontFamily) ? 'PX' : 'AB';
          const wt = getComputedStyle(el).fontWeight;
          const rel = parseFloat(getComputedStyle(el).fontSize) / parseFloat(getComputedStyle(h1).fontSize);
          const re = /\S+/g; let m;
          while ((m = re.exec(n.textContent))) {
            const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
            const y = Math.round(r.getBoundingClientRect().top);
            if (top !== null && Math.abs(y - top) > 8) parts.push({ br: true });
            else if (top !== null) parts.push({ t: ' ', color, rel, ff, wt });
            top = y; parts.push({ t: m[0], color, rel, ff, wt });
          }
        }
      }
      const bg = getComputedStyle(document.querySelector('#main') || document.body).backgroundColor;
      const KICK = { '/': 'Ethiopian Film Office' };
      return { kicker: KICK[location.pathname] || (k?.textContent || '').trim().replace(/\s+/g, ' '), parts, base: h1 ? getComputedStyle(h1).color : '#fff', bg };
    });
    // Le décor seul : on cache texte et interface, on garde images, lumières, 3D.
    await page.addStyleTag({ content: `.bar,.skip,.dv-quick,.ftr,[class*="cursor"]{visibility:hidden!important}
      main h1,main h2,main p,main a,main button,main ol,main ul,main dl,main label,main small,main time,main [class*="__k"],main [class*="__meta"],main [class*="badge"],main [data-roll],main figcaption,main [class*="cap"],main [class*="cli"],main [class*="roll"],main [class*="pill"]{visibility:hidden!important}
      main *:not(canvas):not(img):not(video):not(picture):not(svg):not(source){color:transparent!important;text-shadow:none!important}` });
    await page.waitForTimeout(900);
    const bgPng = (await page.screenshot({ type: 'jpeg', quality: 90 })).toString('base64');
    await page.close();
    out.push({ name, info });
    // La carte.
    const title = info.parts.map((x) => (x.br ? '<br>' : `<span style="color:${x.color};font-size:${(x.rel || 1).toFixed(3)}em;font-family:${x.ff || 'AB'};${x.ff === 'PX' ? `font-weight:${x.wt};letter-spacing:-.01em` : ''}">${x.t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`)).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
      *{box-sizing:border-box;margin:0}
      body{width:1200px;height:630px;overflow:hidden;background:${info.bg};position:relative;font-family:'PX'}
      .bg{position:absolute;inset:0;background:url(data:image/jpeg;base64,${bgPng}) center/cover}
      .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.8) 0%,rgba(0,0,0,.55) 50%,rgba(0,0,0,.08) 100%),linear-gradient(0deg,rgba(0,0,0,.45),transparent 40%)}
      .logo{position:absolute;left:64px;top:52px;height:46px}
      .in{position:absolute;left:64px;right:64px;bottom:70px}
      .k{font-weight:500;font-stretch:87.5%;font-size:21px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.82);margin-bottom:20px;display:flex;align-items:center;gap:12px}
      .k:before{content:"";width:10px;height:10px;border-radius:50%;background:var(--acc,#e8743b)}
      h1{font-family:'AB';font-weight:400;line-height:.98;letter-spacing:-.035em;white-space:nowrap;display:inline-block}
    </style></head><body><div class="bg"></div><div class="shade"></div>
      <img class="logo" src="${LOGO}" alt="">
      <div class="in">${info.kicker ? `<p class="k">${info.kicker}</p>` : ''}<h1 id="t">${title}</h1></div>
      <script>
        document.fonts.ready.then(()=>{
        const t=document.getElementById('t'); let s=104; t.style.fontSize=s+'px';
        while((t.getBoundingClientRect().height>300||t.getBoundingClientRect().width>1072)&&s>40){s-=2;t.style.fontSize=s+'px';}
        const acc=[...t.querySelectorAll('span')].map(x=>getComputedStyle(x).color).find(c=>c!==getComputedStyle(t.querySelector('span')).color);
        if(acc) document.documentElement.style.setProperty('--acc',acc);
        document.body.dataset.ready='1'; });
      </script></body></html>`;
    writeFileSync(`${outDir}/${name}.html`, html);
    const cp = await (await browser.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
    await cp.setContent(html, { waitUntil: 'load' });
    await cp.waitForSelector('body[data-ready]'); await cp.waitForTimeout(150);
    await cp.screenshot({ path: `${outDir}/${name}.jpg`, type: 'jpeg', quality: 86 });
    await cp.context().close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify(out.map(o => ({ n: o.name, k: o.info.kicker, t: o.info.parts.map(x => x.t || '/').join('') })), null, 0));
