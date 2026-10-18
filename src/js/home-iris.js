/**
 * L'ACCUEIL — « WHY WORK WITH US? », LE DIAPHRAGME (18/10/2026).
 *
 * Sept raisons, sept lames : à côté du titre, le diaphragme d'un objectif,
 * dessiné en code (des lames qui pivotent chacune sur sa goupille, comme dans
 * un vrai objectif). Sa bague porte les numéros des raisons.
 *   - Quand la section arrive, l'objectif s'ouvre (il était fermé).
 *   - Au repos, il respire doucement, à l'écran seulement.
 *   - Au survol d'une raison (souris), son numéro s'allume sur la bague.
 *   - Une raison ouverte ouvre le diaphragme en grand : la lumière passe,
 *     sa lame et son numéro prennent la terre cuite, le repère tourne vers
 *     lui. Tout refermé, il revient à sa respiration.
 * Le dépliage lui-même ne change pas (`initWhy`, services.js) : on écoute
 * seulement les classes `is-open` qu'il pose.
 *
 * Le titre de chaque raison prend des « équerres d'autofocus » quand elle
 * est ouverte (CSS, `home.css`).
 */
import gsap from 'gsap';

const N = 7;
const R = 104;            // rayon des lames (la découpe)
const E = 0.02 * R;       // la goupille, à peine au-dessus de l'axe
const rad = (d) => (d * Math.PI) / 180;

function build(host) {
  const step = 360 / N;
  // La bague : 56 graduations, une grande par raison.
  let ticks = '';
  for (let i = 0; i < 56; i += 1) {
    const a = rad(-90 + (i * 360) / 56);
    const major = i % 8 === 0;
    const r0 = major ? 113 : 116, r1 = major ? 124 : 120;
    ticks += `M${(r0 * Math.cos(a)).toFixed(2)} ${(r0 * Math.sin(a)).toFixed(2)}L${(r1 * Math.cos(a)).toFixed(2)} ${(r1 * Math.sin(a)).toFixed(2)}`;
  }
  let labels = '';
  for (let k = 0; k < N; k += 1) {
    const a = rad(-90 + k * step);
    labels += `<text class="hm-iris__n" x="${(138 * Math.cos(a)).toFixed(2)}" y="${(138 * Math.sin(a)).toFixed(2)}">${String(k + 1).padStart(2, '0')}</text>`;
  }
  // Une lame : le bord intérieur part de la goupille, légèrement creusé.
  const blade = `M${-0.3 * R} 0Q${1.0 * R} ${-0.16 * R} ${2.3 * R} 0L${2.3 * R} ${-1.35 * R}L${-0.3 * R} ${-1.35 * R}Z`;
  let blades = '';
  for (let k = 0; k < N; k += 1) blades += `<path class="hm-iris__blade" d="${blade}"/>`;

  host.innerHTML = `<svg viewBox="-152 -152 304 304" focusable="false">
    <defs>
      <clipPath id="hm-iris-cut"><circle r="${R}"/></clipPath>
      <radialGradient id="hm-iris-light">
        <stop class="hm-iris__l0" offset="0"/>
        <stop class="hm-iris__l1" offset="0.32"/>
        <stop class="hm-iris__l2" offset="0.7"/>
        <stop class="hm-iris__l3" offset="1"/>
      </radialGradient>
      <linearGradient id="hm-iris-metal" x1="0" y1="1" x2="0.2" y2="0">
        <stop class="hm-iris__m0" offset="0"/>
        <stop class="hm-iris__m1" offset="1"/>
      </linearGradient>
    </defs>
    <circle class="hm-iris__house" r="128"/>
    <path class="hm-iris__ticks" d="${ticks}"/>
    <g class="hm-iris__notch"><path d="M-20.02 -126.42A128 128 0 0 1 20.02 -126.42"/></g>
    ${labels}
    <circle class="hm-iris__rim" r="${R + 5}"/>
    <g clip-path="url(#hm-iris-cut)">
      <circle class="hm-iris__back" r="${R}"/>
      <circle class="hm-iris__light" r="${R}" fill="url(#hm-iris-light)"/>
      <g class="hm-iris__blades">${blades}</g>
    </g>
    <circle class="hm-iris__edge" r="${R}"/>
    <ellipse class="hm-iris__glint" cx="-38" cy="-52" rx="34" ry="12" transform="rotate(-34 -38 -52)"/>
  </svg>`;
  return host.querySelector('svg');
}

export function initIris({ lite = false, still = false } = {}) {
  const host = document.querySelector('[data-iris]');
  const list = document.querySelector('[data-why]');
  if (!host || !list) return;
  const svg = build(host);
  const blades = [...svg.querySelectorAll('.hm-iris__blade')];
  const labels = [...svg.querySelectorAll('.hm-iris__n')];
  const notch = svg.querySelector('.hm-iris__notch');
  const light = svg.querySelector('.hm-iris__light');
  const items = [...list.querySelectorAll('.hm-why__i')];

  const st = { a: still ? 0.5 : 0.02, b: 0, n: 0 };
  const step = 360 / N;

  function render() {
    const a = Math.min(1, Math.max(0, st.a + st.b));
    const phi = -(2 + 54 * a);
    blades.forEach((p, k) => {
      // La goupille de la lame k est sous son numéro (k = 0 en haut).
      p.setAttribute('transform', `rotate(${(90 + k * step).toFixed(2)}) translate(${-R} ${-E}) rotate(${phi.toFixed(2)})`);
    });
    light.style.opacity = (0.35 + 0.65 * a).toFixed(3);
    notch.setAttribute('transform', `rotate(${st.n.toFixed(2)})`);
  }
  render();

  /* La respiration du repos. */
  const breath = still || lite ? null : gsap.to(st, {
    b: 0.1, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true, onUpdate: render
  });
  let visible = false;
  let open = -1;
  const syncBreath = () => {
    if (!breath) return;
    const run = visible && open < 0 && !document.hidden;
    if (run) breath.resume();
    else breath.pause();
  };

  const go = (vars) => (still ? (Object.assign(st, vars), render()) : gsap.to(st, { ...vars, duration: 1.1, ease: 'expo.out', overwrite: 'auto', onUpdate: render }));

  /* L'ouverture, quand la section arrive. */
  let entered = still;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !entered) {
      entered = true;
      gsap.to(st, { a: open < 0 ? 0.42 : 0.88, duration: 1.8, ease: 'expo.inOut', onUpdate: render, onComplete: syncBreath });
      svg.classList.add('is-in');
      return;
    }
    syncBreath();
  }, { threshold: 0.25 });
  io.observe(host);
  if (still) svg.classList.add('is-in');
  document.addEventListener('visibilitychange', syncBreath);

  /* L'état du dépliage. */
  const shortest = (from, to) => from + ((((to - from) % 360) + 540) % 360) - 180;
  const sync = () => {
    const k = items.findIndex((it) => it.classList.contains('is-open'));
    if (k === open) return;
    open = k;
    blades.forEach((p, i) => p.classList.toggle('is-act', i === k));
    labels.forEach((t, i) => t.classList.toggle('is-act', i === k));
    svg.classList.toggle('is-open', k >= 0);
    if (k >= 0) {
      if (breath) { breath.pause(); gsap.to(st, { b: 0, duration: 0.5, overwrite: false, onUpdate: render }); }
      go({ a: 0.88, n: shortest(st.n, k * step) });
    } else {
      go({ a: 0.42 });
      gsap.delayedCall(still ? 0 : 0.6, syncBreath);
    }
  };
  const mo = new MutationObserver(sync);
  items.forEach((it) => mo.observe(it, { attributes: true, attributeFilter: ['class'] }));
  sync();

  /* Le survol (souris) et le focus clavier : le numéro s'allume. */
  const pre = (k, on) => labels[k]?.classList.toggle('is-pre', on);
  items.forEach((it, k) => {
    if (!lite) {
      it.addEventListener('pointerenter', () => pre(k, true));
      it.addEventListener('pointerleave', () => pre(k, false));
    }
    const q = it.querySelector('.hm-why__q');
    q?.addEventListener('focus', () => pre(k, true));
    q?.addEventListener('blur', () => pre(k, false));
  });
}

