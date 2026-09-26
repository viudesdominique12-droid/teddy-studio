/**
 * LA BOBINE — les neuf lieux sur un tambour (26/09/2026).
 *
 * Référence : jesperlandberg.com, que Dominique adore (« ça me rappelle les
 * bandes de films, les bobines d'avant »). Les photos sont posées sur le
 * pourtour d'un tambour vu de l'extérieur : la carte du milieu est la plus
 * proche, celles des côtés fuient en s'arrondissant. Le défilement fait
 * tourner le tambour, et la bande ondule comme une pellicule qui court —
 * d'autant plus qu'on va vite. Une grille court au sol, sous la bande.
 *
 * Un appui sur un lieu ouvre sa fiche : la photo en haut, le texte dessous
 * (demande de Dominique). La fiche n'invente rien : elle reprend ce que le
 * site dit déjà de chaque lieu — sa description, son altitude, sa note, le
 * crédit de sa photo.
 *
 * Three.js et les photos ne se chargent qu'à l'approche. Sans WebGL ou en
 * mouvement réduit, la grille des neuf lieux reste, telle quelle.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

const MOBILE = matchMedia('(max-width: 48rem)');
/* Sur un écran tactile (27/09) : le tambour est dessiné à 1,25 fois l'écran au
   lieu de 2, ne respire plus au repos, et n'est redessiné que quand il tourne,
   ondule ou réagit au doigt. Mesuré : c'est lui, avec le matériel, qui
   saccadait sur téléphone. */
const LITE = matchMedia('(pointer: coarse)').matches;
const GAP = 0.018;         // l'espace entre deux vues, en fraction de leur part du tour (fin, comme la référence)
const STEP_SCREENS = 0.22; // la course de défilement d'un lieu au suivant (0,45 avant l'accélération)

/* Les couleurs et les polices du thème, lues sur la scène elle-même : le
   fond de la section (la brume du sol s'y fond), l'encre (la grille, le nom
   des lieux) et les deux polices des vues. Relues quand on change de thème
   (`palette.js`). */
function themeOf(el) {
  const cs = getComputedStyle(el);
  const v = (n, d) => cs.getPropertyValue(n).trim() || d;
  return {
    bg: v('--bg', '#182d19'),
    shade: v('--bg-2', '#101b13'),
    ink: v('--fg', '#ece7e0'),
    text: v('--ff-t', '"Instrument Sans", sans-serif'),
    mono: v('--ff-m', '"Martian Mono", monospace')
  };
}
const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function webgl() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export const reelAvailable = (root = document.querySelector('[data-reel]')) =>
  Boolean(root) && !reduced() && webgl();

/* Les lieux, lus dans la grille de la section (qui reste le repli). */
function readPlaces(section) {
  return [...section.querySelectorAll('.hm-loc')].map((li, i) => {
    const img = li.querySelector('img');
    const base = (img.getAttribute('src') || '').replace(/-640\.webp$/, '');
    return {
      i,
      name: li.querySelector('.hm-loc__h')?.textContent.trim() || '',
      altitude: li.querySelector('.hm-loc__alt')?.textContent.trim() || '',
      desc: img.alt,
      note: li.dataset.note || '',
      credit: li.dataset.credit || '',
      region: li.dataset.region || '',
      about: li.querySelector('.hm-loc__about')?.textContent.trim() || '',
      href: li.querySelector('a')?.getAttribute('href') || '/locations.html',
      tex: `${base}-1200.webp`,
      big: `${base}-1920.webp`
    };
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

/* La vue d'un lieu, peinte une fois : la photo aux coins arrondis, un voile
   léger en pied, le nom, l'altitude et un petit bouton fléché. Le texte est
   DANS l'image : il ondule avec la bande, comme sur la référence. */
function paintCard(THREE, img, place, n, maxAniso, th) {
  const W = 1024;
  const H = 683;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.beginPath();
  if (x.roundRect) x.roundRect(0, 0, W, H, 24); else x.rect(0, 0, W, H);
  x.clip();
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  x.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // Un voile léger en pied, juste pour la lecture du titre.
  const g = x.createLinearGradient(0, H * 0.62, 0, H);
  g.addColorStop(0, rgba(th.shade, 0));
  g.addColorStop(1, rgba(th.shade, 0.62));
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  // Comme la référence : un petit titre en bas à gauche, l'altitude
  // dessous, et un petit bouton rond fléché en bas à droite.
  x.textBaseline = 'alphabetic';
  x.fillStyle = th.ink;
  x.font = `500 40px ${th.text}`;
  x.fillText(place.name, 44, H - (place.altitude ? 74 : 48));
  if (place.altitude) {
    x.fillStyle = rgba(th.ink, 0.72);
    x.font = `400 19px ${th.mono}`;
    x.fillText(place.altitude.toUpperCase(), 46, H - 42);
  }
  const bx = W - 70;
  const by = H - 62;
  x.fillStyle = rgba(th.shade, 0.55);
  x.beginPath(); x.arc(bx, by, 26, 0, Math.PI * 2); x.fill();
  x.strokeStyle = rgba(th.ink, 0.9);
  x.lineWidth = 2.5;
  x.lineCap = 'round';
  x.beginPath(); x.moveTo(bx - 9, by); x.lineTo(bx + 9, by); x.moveTo(bx + 2, by - 7); x.lineTo(bx + 9, by); x.lineTo(bx + 2, by + 7); x.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/* La matière d'une vue : sans lumière (c'est une photo), mais qui ondule et
   qui s'assombrit en tournant le dos — le tambour a du volume. */
function cardMaterial(THREE, map) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: map },
      uRot: { value: 0 },
      uTime: { value: 0 },
      uAmp: { value: 0 },
      uBulge: { value: 0 },
      uHover: { value: 0 },
      uFade: { value: 0 }
    },
    vertexShader: /* glsl */`
      uniform float uRot, uTime, uAmp, uBulge;
      varying vec2 vUv;
      varying float vFace;
      void main() {
        vUv = uv;
        vec3 p = position;
        // Chaque vue est tendue plus fort que le tambour : son milieu s'avance
        // vers nous, comme la pellicule sur la référence.
        float k = uv.x * 2.0 - 1.0;
        p.xz += normalize(p.xz) * uBulge * (1.0 - k * k);
        float a = atan(p.x, p.z) + uRot;          // l'angle de ce point, tambour tourné
        p.y += sin(a * 2.6 + uTime * 1.3) * uAmp;  // la bande ondule
        vFace = cos(a);                             // 1 face à nous, 0 de profil
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map;
      uniform float uHover, uFade;
      varying vec2 vUv;
      varying float vFace;
      void main() {
        vec4 c = texture2D(map, vUv);
        float light = mix(0.22, 1.0, smoothstep(-0.1, 0.95, vFace)) * (1.0 + 0.08 * uHover);
        gl_FragColor = vec4(c.rgb * light, c.a * (1.0 - uFade));
        #include <colorspace_fragment>
      }`
  });
}

export function initReel(root = document.querySelector('[data-reel]')) {
  if (!reelAvailable(root)) return;
  const section = root.closest('section');
  const stage = root.querySelector('.reel__stage');
  const canvas = root.querySelector('.reel__gl');
  const count = root.querySelector('[data-reel-count]');
  const places = readPlaces(section);
  const N = places.length;
  if (!stage || !canvas || N < 2) return;
  section.classList.add('reel-on');

  const step = (Math.PI * 2) / N;
  const state = { target: 0, rot: 0, amp: 0, hover: -1, t: 0 };

  /* Un escalier adouci : sur chaque pas de défilement, le tambour tient
     d'abord la vue au centre, tourne, puis tient la suivante. Où qu'on
     s'arrête, une vue est posée au milieu, ses deux voisines de part et
     d'autre — la composition de la référence. */
  const HOLD = 0.2;
  const stair = (x) => {
    const n = Math.floor(x);
    const f = Math.min(1, Math.max(0, (x - n - HOLD) / (1 - 2 * HOLD)));
    return n + f * f * (3 - 2 * f);
  };

  /* ── Le défilement fait tourner le tambour ──
     Du premier lieu au dernier. La rotation suit avec un peu de retard
     (l'inertie d'une bobine), et la vitesse fait onduler la bande. */
  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * (STEP_SCREENS * (N - 1) + 0.3))}`,
    pin: true,
    onUpdate: (self) => { state.target = -stair(self.progress * (N - 1)) * step; }
  });

  /* ── Les accès au clavier et aux lecteurs d'écran ──
     Le tambour se dessine dans un canevas : chaque lieu a aussi son bouton,
     invisible, qui ouvre la même fiche. */
  const access = root.querySelector('.reel__access');
  places.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'u-sr';
    b.textContent = `${p.name}${p.altitude ? `, ${p.altitude}` : ''} — open`;
    b.addEventListener('click', () => openPlace(p.i, null));
    access?.append(b);
  });

  let three = null;
  let visible = false;
  let lastSig = '';
  let started = false;

  const size = () => {
    if (!three) return;
    const { renderer, cam, geo } = three;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / Math.max(1, h);
    // La vue du milieu occupe 50 % de la largeur (86 % sur téléphone) : on
    // recule la caméra jusqu'à ce qu'elle y tienne.
    const f = MOBILE.matches ? 0.86 : 0.5;
    const hfov = 2 * Math.atan(Math.tan((cam.fov * Math.PI) / 360) * cam.aspect);
    const dist = geo.w / (2 * f * Math.tan(hfov / 2));
    cam.position.set(0, geo.h * 0.34, geo.R + dist);
    cam.lookAt(0, -geo.h * 0.06, geo.R * 0.55);
    cam.updateProjectionMatrix();
  };

  const render = (time) => {
    if (!three || !visible) return;
    const { renderer, scene, cam, drum, cards } = three;
    const sec = time / 1000;
    const prev = state.rot;
    state.rot += (state.target - state.rot) * 0.085;
    const vel = Math.abs(state.rot - prev);
    // Au repos, la bande respire à peine ; lancée, elle ondule franchement.
    const want = three.geo.h * ((LITE ? 0 : 0.018) + Math.min(0.1, vel * 3.2));
    state.amp += (want - state.amp) * 0.08;
    drum.rotation.y = state.rot;
    for (const c of cards) {
      const u = c.material.uniforms;
      u.uRot.value = state.rot;
      u.uTime.value = sec;
      u.uAmp.value = state.amp;
      u.uBulge.value = three.geo.w * 0.12;
      u.uHover.value += ((state.hover === c.userData.i ? 1 : 0) - u.uHover.value) * 0.15;
    }
    if (LITE) {
      // Au repos, rien ne change : on ne redessine pas.
      const sig = `${state.rot.toFixed(5)}#${state.amp.toFixed(5)}#${cards.map((c) => c.material.uniforms.uHover.value.toFixed(3)).join(',')}#${cards.length}#${canvas.width}x${canvas.height}`;
      if (sig === lastSig) return;
      lastSig = sig;
    }
    renderer.render(scene, cam);

    // Le compteur suit le lieu qui passe devant.
    if (count) {
      const k = ((Math.round(-state.rot / step) % N) + N) % N;
      const label = `${String(k + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')} · ${places[k].name}`;
      if (count.textContent !== label) count.textContent = label;
    }
  };

  const start = async () => {
    if (started) return;
    started = true;
    try {
      const THREE = await import('three');
      let th = themeOf(stage);
      const fontsOf = (t) => Promise.all([
        document.fonts?.load(`500 40px ${t.text}`),
        document.fonts?.load(`400 19px ${t.mono}`)
      ].filter(Boolean)).catch(() => {});
      await fontsOf(th);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(th.bg, 14, 44);

      // Le tambour : neuf vues de 3:2 sur un tour, le rayon tiré de leur largeur.
      const R = 4;
      const arc = step * (1 - GAP);
      const w = R * arc;
      const h = w / 1.5;
      const geo = { R, w, h };

      // Une focale moyenne : les voisines restent larges et lisibles de part et
      // d'autre, comme sur la référence (à 44°, elles n'étaient plus que des lames).
      const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
      const drum = new THREE.Group();
      scene.add(drum);

      // La grille au sol, qui se fond dans le fond au loin.
      const makeGrid = (ink) => {
        const g = new THREE.GridHelper(60, 60, ink, ink);
        g.material.transparent = true;
        g.material.opacity = 0.2;
        g.material.depthWrite = false;
        g.position.y = -h / 2 - h * 0.34;
        return g;
      };
      let grid = makeGrid(th.ink);
      scene.add(grid);

      three = { THREE, renderer, scene, cam, drum, cards: [], geo };
      size();

      const aniso = renderer.capabilities.getMaxAnisotropy();
      // Les vues arrivent dans l'ordre : celle qu'on voit d'abord est prête la première.
      for (const p of places) {
        try {
          const img = await loadImage(p.tex);
          const tex = paintCard(THREE, img, p, N, aniso, th);
          const g = new THREE.CylinderGeometry(R, R, h, 72, 1, true, p.i * step - arc / 2, arc);
          const mesh = new THREE.Mesh(g, cardMaterial(THREE, tex));
          mesh.userData.i = p.i;
          mesh.userData.img = img;
          mesh.userData.place = p;
          drum.add(mesh);
          three.cards.push(mesh);
        } catch (err) {
          console.warn('[reel]', p.tex, err);
        }
      }

      // Un autre thème : la brume, la grille et les vues se repeignent.
      window.addEventListener('palette:change', async () => {
        th = themeOf(stage);
        await fontsOf(th);
        scene.fog.color.set(th.bg);
        scene.remove(grid);
        grid.geometry.dispose(); grid.material.dispose();
        grid = makeGrid(th.ink);
        scene.add(grid);
        for (const mesh of three.cards) {
          const old = mesh.material.uniforms.map.value;
          mesh.material.uniforms.map.value = paintCard(THREE, mesh.userData.img, mesh.userData.place, N, aniso, th);
          old.dispose();
        }
        lastSig = '';   // redessiner, même au repos
      });
    } catch (err) {
      console.warn('[reel]', err);
      st.kill(true);
      section.classList.remove('reel-on');
      ScrollTrigger.refresh();
    }
  };

  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { start(); io.disconnect(); }
  }, { rootMargin: '150% 0px' }).observe(stage);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  gsap.ticker.add((time) => render(time * 1000));
  window.addEventListener('resize', () => requestAnimationFrame(size));

  /* ── Le survol et l'appui ── */
  const ray = { caster: null, v: null };
  const cursorEl = document.getElementById('cursor');
  const pill = cursorEl?.querySelector('.cursor__t');
  const pick = (e) => {
    if (!three) return null;
    const { THREE, cam, cards } = three;
    ray.caster = ray.caster || new THREE.Raycaster();
    ray.v = ray.v || new THREE.Vector2();
    const r = canvas.getBoundingClientRect();
    ray.v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.caster.setFromCamera(ray.v, cam);
    const hit = ray.caster.intersectObjects(cards, false)[0];
    // Seule la face qui nous regarde se choisit.
    return hit && hit.face && hit.face.normal.clone().transformDirection(hit.object.matrixWorld).z > 0.05 ? hit.object : null;
  };
  const setHover = (i) => {
    if (state.hover === i) return;
    state.hover = i;
    canvas.style.cursor = i >= 0 ? 'pointer' : '';
    if (cursorEl) {
      if (i >= 0) { cursorEl.dataset.state = 'view'; if (pill) pill.textContent = 'View'; }
      else if (cursorEl.dataset.state === 'view') { delete cursorEl.dataset.state; if (pill) pill.textContent = 'Drag'; }
    }
  };
  canvas.addEventListener('pointermove', (e) => { const m = pick(e); setHover(m ? m.userData.i : -1); });
  canvas.addEventListener('pointerleave', () => setHover(-1));
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return; }
    down = null;
    const m = pick(e);
    if (m) openPlace(m.userData.i, m);
  });

  /* ── La fiche d'un lieu : la photo en haut, le texte dessous ── */
  const view = document.getElementById('reel-view');
  let at = -1;
  let lastFocus = null;

  // Le rectangle d'une vue à l'écran : la photo de la fiche en part.
  const screenRect = (mesh) => {
    if (!mesh || !three) return null;
    const { THREE, cam } = three;
    const box = new THREE.Box3().setFromObject(mesh);
    const r = canvas.getBoundingClientRect();
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const v = new THREE.Vector3(x, y, z).project(cam);
      const sx = r.left + ((v.x + 1) / 2) * r.width;
      const sy = r.top + ((1 - v.y) / 2) * r.height;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  };

  const fill = (p) => {
    const img = view.querySelector('.reel-view__img');
    img.src = p.big;
    img.alt = p.desc;
    view.querySelector('[data-rv-n]').textContent = `${String(p.i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    view.querySelector('[data-rv-h]').textContent = p.name;
    view.querySelector('[data-rv-region]').textContent = p.region ? `${p.region} · Ethiopia` : 'Ethiopia';
    view.querySelector('[data-rv-about]').textContent = p.about;
    view.querySelector('[data-rv-desc]').textContent = p.desc.replace(/,? Ethiopia$/, '').replace(/([^.])$/, '$1.');
    const alt = view.querySelector('[data-rv-alt]');
    alt.textContent = p.altitude || '—';
    const note = view.querySelector('[data-rv-note]');
    note.textContent = p.note;
    note.hidden = !p.note;
    view.querySelector('[data-rv-more]').setAttribute('href', p.href);
    view.querySelector('[data-rv-credit]').textContent = `Photo: Wikimedia Commons${p.credit ? ` · ${p.credit}` : ''}`;
  };

  const parts = () => view.querySelectorAll('.reel-view__body > *');

  function openPlace(i, mesh) {
    if (!view) return;
    const p = places[i];
    at = i;
    fill(p);
    lastFocus = document.activeElement;
    view.hidden = false;
    document.documentElement.classList.add('is-locked');
    window.__lenis?.stop();
    setHover(-1);

    const fig = view.querySelector('.reel-view__fig');
    const from = screenRect(mesh);
    gsap.killTweensOf([view, fig, parts()]);
    gsap.fromTo(view, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
    requestAnimationFrame(() => {
      const to = fig.getBoundingClientRect();
      if (from && to.width) {
        // La photo part de la vue sur laquelle on a appuyé.
        gsap.fromTo(fig,
          { x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2),
            scaleX: from.width / to.width, scaleY: from.height / to.height, borderRadius: '18px' },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: '0px', duration: 0.95, ease: 'expo.out', clearProps: 'transform,borderRadius' });
      } else {
        gsap.fromTo(fig, { scale: 1.06, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, ease: 'expo.out', clearProps: 'transform' });
      }
      gsap.fromTo(parts(), { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05, delay: 0.25, clearProps: 'transform' });
    });
    view.querySelector('.reel-view__close')?.focus({ preventScroll: true });
  }

  function closePlace() {
    if (!view || view.hidden) return;
    gsap.to(view, {
      autoAlpha: 0, duration: 0.35, ease: 'power2.in',
      onComplete: () => {
        view.hidden = true;
        document.documentElement.classList.remove('is-locked');
        window.__lenis?.start();
        lastFocus?.focus?.({ preventScroll: true });
      }
    });
  }

  function go(d) {
    if (at < 0) return;
    const i = (at + d + N) % N;
    const els = [view.querySelector('.reel-view__img'), ...parts()];
    gsap.to(els, {
      autoAlpha: 0, duration: 0.2, ease: 'power1.in',
      onComplete: () => {
        at = i;
        fill(places[i]);
        gsap.fromTo(els, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.03, clearProps: 'transform' });
      }
    });
  }

  view?.querySelector('.reel-view__close')?.addEventListener('click', closePlace);
  view?.querySelector('[data-rv-prev]')?.addEventListener('click', () => go(-1));
  view?.querySelector('[data-rv-next]')?.addEventListener('click', () => go(1));
  document.addEventListener('keydown', (e) => {
    if (!view || view.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closePlace(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Tab') {
      const f = [...view.querySelectorAll('a,button')].filter((n) => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  if (import.meta.env.DEV) window.__reel = { state, places, openPlace, closePlace, get three() { return three; } };
}
