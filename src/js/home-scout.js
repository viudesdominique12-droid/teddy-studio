/**
 * L'ACCUEIL — « FILMING IN ETHIOPIA », LE REPÉRAGE (18/10/2026).
 *
 * Le bureau du film parle la langue du repérage :
 *   - derrière la section, une carte en courbes de niveau, calculée ici
 *     (un relief fictif, des isolignes par « marching squares ») : une
 *     texture, pas une carte réelle, sans aucun nom ni chiffre. Elle dérive
 *     très lentement, à l'écran seulement (CSS) ;
 *   - la liste des huit services devient un itinéraire : chaque service est
 *     une étape (un point), un tracé en pointillés les relie et avance en
 *     continu. Le service ouvert devient l'épingle (une onde part d'elle), et
 *     la portion de route jusqu'à lui se trace en terre cuite.
 * Le dépliage ne change pas (`initServices`, services.js) : on lit les
 * classes `is-open` qu'il pose.
 */

/* Un relief fixe : quelques collines et deux ondulations. */
function field(x, y) {
  const hills = [
    [0.18, 0.28, 0.16, 1.0], [0.42, 0.62, 0.2, 0.8], [0.74, 0.3, 0.14, 0.9],
    [0.9, 0.78, 0.18, 0.7], [0.08, 0.86, 0.12, 0.55], [0.58, 0.12, 0.1, 0.5],
    [0.32, 0.95, 0.1, 0.45]
  ];
  let v = 0;
  for (const [cx, cy, s, h] of hills) {
    const dx = x - cx, dy = (y - cy) * 1.25;
    v += h * Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
  }
  v += 0.08 * Math.sin(x * 9.1 + y * 3.7) + 0.06 * Math.sin(y * 11.3 - x * 4.1);
  return v;
}

function contours(W = 1200, H = 800, GX = 72, GY = 48, LEVELS = 14) {
  const cw = W / GX, ch = H / GY;
  const g = [];
  let lo = Infinity, hi = -Infinity;
  for (let j = 0; j <= GY; j += 1) {
    const row = [];
    for (let i = 0; i <= GX; i += 1) {
      const v = field(i / GX, j / GY);
      row.push(v);
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    g.push(row);
  }
  const minor = [], index = [];
  for (let l = 1; l <= LEVELS; l += 1) {
    const t = lo + ((hi - lo) * l) / (LEVELS + 1);
    const segs = [];
    for (let j = 0; j < GY; j += 1) {
      for (let i = 0; i < GX; i += 1) {
        const v0 = g[j][i], v1 = g[j][i + 1], v2 = g[j + 1][i + 1], v3 = g[j + 1][i];
        const c = (v0 > t ? 8 : 0) | (v1 > t ? 4 : 0) | (v2 > t ? 2 : 0) | (v3 > t ? 1 : 0);
        if (c === 0 || c === 15) continue;
        const x = i * cw, y = j * ch;
        // Chaque point d'arête porte une clé : les segments voisins s'y rejoignent.
        const T = () => [x + ((t - v0) / (v1 - v0)) * cw, y, `h${i},${j}`];
        const Rr = () => [x + cw, y + ((t - v1) / (v2 - v1)) * ch, `v${i + 1},${j}`];
        const B = () => [x + ((t - v3) / (v2 - v3)) * cw, y + ch, `h${i},${j + 1}`];
        const L = () => [x, y + ((t - v0) / (v3 - v0)) * ch, `v${i},${j}`];
        const seg = (a, b) => segs.push([a, b]);
        switch (c) {
          case 1: case 14: seg(L(), B()); break;
          case 2: case 13: seg(B(), Rr()); break;
          case 3: case 12: seg(L(), Rr()); break;
          case 4: case 11: seg(T(), Rr()); break;
          case 6: case 9: seg(T(), B()); break;
          case 7: case 8: seg(L(), T()); break;
          case 5: seg(L(), T()); seg(B(), Rr()); break;
          case 10: seg(T(), Rr()); seg(L(), B()); break;
          default: break;
        }
      }
    }
    // On relie les segments en lignes continues : un tracé deux fois plus
    // court, et des courbes sans raccords.
    const at = new Map();
    segs.forEach((sg, n) => sg.forEach((p) => { const k = p[2]; if (!at.has(k)) at.set(k, []); at.get(k).push(n); }));
    const used = new Uint8Array(segs.length);
    const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const out = l % 4 === 0 ? index : minor;
    for (let n = 0; n < segs.length; n += 1) {
      if (used[n]) continue;
      used[n] = 1;
      const line = [segs[n][0], segs[n][1]];
      for (const dir of [1, 0]) {
        for (;;) {
          const end = dir ? line[line.length - 1] : line[0];
          const next = (at.get(end[2]) || []).find((m) => !used[m]);
          if (next === undefined) break;
          used[next] = 1;
          const [a, b] = segs[next];
          const p = a[2] === end[2] ? b : a;
          if (dir) line.push(p); else line.unshift(p);
        }
      }
      out.push(`M${line.map(f).join('L')}`);
    }
  }
  return { minor: minor.join(''), index: index.join('') };
}

function topo(sec, still) {
  if (sec.querySelector(':scope > .hm-topo')) return;
  const { minor, index } = contours();
  const box = document.createElement('div');
  box.className = 'hm-topo';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = `<div class="hm-topo__drift"><svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" focusable="false">
    <path class="hm-topo__minor" d="${minor}"/><path class="hm-topo__index" d="${index}"/></svg></div>`;
  sec.prepend(box);
  if (still) { box.classList.add('is-in'); return; }
  const io = new IntersectionObserver(([e]) => {
    box.classList.toggle('is-run', e.isIntersecting && !document.hidden);
    if (e.isIntersecting) box.classList.add('is-in');
  });
  io.observe(box);
  document.addEventListener('visibilitychange', () => { if (document.hidden) box.classList.remove('is-run'); });
}

function route(list) {
  if (list.querySelector('.sv__trail')) return;
  const items = [...list.querySelectorAll('.sv__i')];
  if (items.length < 2) return;
  const trail = document.createElement('li');
  trail.className = 'sv__trail';
  trail.setAttribute('aria-hidden', 'true');
  trail.setAttribute('role', 'presentation');
  trail.innerHTML = '<i class="sv__trail-dash"></i><i class="sv__trail-done"></i>';
  list.append(trail);
  list.classList.add('is-route');

  /* L'étape se pose à mi-hauteur de la PREMIÈRE ligne du nom : sur
     téléphone, « Cleared by us » passe dessous et le bouton s'allonge. */
  const wpY = (q) => {
    const name = q.querySelector('.sv__name');
    if (!name) return q.offsetHeight / 2;
    const lh = parseFloat(getComputedStyle(name).lineHeight) || name.offsetHeight;
    return name.offsetTop + Math.min(lh, name.offsetHeight) / 2;
  };
  const centre = (it) => {
    const q = it.querySelector('.sv__q');
    return it.offsetTop + (q ? q.offsetTop + wpY(q) : 0);
  };
  const measure = () => {
    items.forEach((it) => {
      const q = it.querySelector('.sv__q');
      if (q) q.style.setProperty('--wp-y', `${wpY(q).toFixed(1)}px`);
    });
    const top = centre(items[0]);
    const h = Math.max(1, centre(items[items.length - 1]) - top);
    trail.style.setProperty('--t0', `${top.toFixed(1)}px`);
    trail.style.setProperty('--h', `${h.toFixed(1)}px`);
    const open = items.find((it) => it.classList.contains('is-open'));
    const done = open ? (centre(open) - top) / h : 0;
    trail.style.setProperty('--done', done.toFixed(4));
    list.classList.toggle('has-open', !!open);
  };
  measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(list);
  const mo = new MutationObserver(measure);
  items.forEach((it) => mo.observe(it, { attributes: true, attributeFilter: ['class'] }));
  // Les étapes se replient en 0,5 s : on re-mesure à la fin.
  list.addEventListener('transitionend', (e) => { if (e.target.classList?.contains('sv__a')) measure(); });
}

export function initScout({ still = false } = {}) {
  const sec = document.getElementById('filming');
  if (!sec) return;
  topo(sec, still);
  const list = sec.querySelector('.sv__list');
  if (list) route(list);
}
