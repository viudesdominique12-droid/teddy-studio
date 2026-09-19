/**
 * L'EMBLÈME — le canon Sebastopol, extrudé en or depuis un SVG.
 *
 * Le dessin est vectoriel, pas un modèle importé : l'extrusion se fait au
 * chargement, avec un biseau plus épais que l'extrusion elle-même — c'est ce
 * qui donne l'arête d'une médaille frappée plutôt qu'une plaque découpée.
 *
 * L'or ne vient pas d'une couleur mais de trois choses : un métal pur
 * (metalness 1), deux textures procédurales NON corrélées (rugosité et relief
 * tirées séparément — une seule texture et le métal devient plat), et un
 * environnement de studio qui lui donne quelque chose à réfléchir.
 */

const SVG_URL = '/emblem/cannon.svg';

/** Marge de canvas : la parallaxe fait sortir le dessin de sa boîte. */
const FRAME_AIR = 0.15;

const DEG = Math.PI / 180;
const MAX_YAW = 19 * DEG;
const MAX_PITCH = 7 * DEG;
const MAX_PX = 0.30, MAX_PY = 0.22;
const START_YAW = -5 * DEG;
const FOLLOW = 0.06;          // lerp par frame

export function emblemReady() {
  if (window.__teddyEmblem) return;
  window.__teddyEmblem = true;
  window.dispatchEvent(new CustomEvent('teddy:emblem-ready'));
}

/** Texture procédurale : brossage du métal. Appelée DEUX fois, jamais mise en cache. */
function brushed(THREE) {
  const S = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  c.fillStyle = '#808080';
  c.fillRect(0, 0, S, S);

  // 60 grandes taches douces — les variations lentes de la surface
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 60 + Math.random() * 220;
    const v = Math.random() > 0.5 ? 255 : 0;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${v},${v},${v},${(0.04 + Math.random() * 0.07).toFixed(3)})`);
    g.addColorStop(1, `rgba(${v},${v},${v},0)`);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 750 courbes quasi horizontales — le sens du brossage
  for (let i = 0; i < 750; i++) {
    const v = Math.round(40 + Math.random() * 175);
    c.strokeStyle = `rgba(${v},${v},${v},${(0.05 + Math.random() * 0.12).toFixed(3)})`;
    c.lineWidth = 0.5 + Math.random();
    const x = Math.random() * S, y = Math.random() * S;
    const len = 40 + Math.random() * 200;
    const w = -0.5 + (Math.random() - 0.5) * 0.9;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(w) * len * 0.5 + (Math.random() - 0.5) * 14,
                       y + Math.sin(w) * len * 0.5 + (Math.random() - 0.5) * 14,
                       x + Math.cos(w) * len, y + Math.sin(w) * len);
    c.stroke();
  }
  // 1400 micro-traits sans direction — le grain fin
  for (let i = 0; i < 1400; i++) {
    const v = Math.round(30 + Math.random() * 200);
    c.strokeStyle = `rgba(${v},${v},${v},${(0.07 + Math.random() * 0.15).toFixed(3)})`;
    c.lineWidth = 0.4 + Math.random() * 0.7;
    const x = Math.random() * S, y = Math.random() * S;
    const len = 4 + Math.random() * 30, a = Math.random() * 6.2832;
    c.beginPath(); c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.stroke();
  }

  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.5 / 265, 1.5 / 265);
  return t;
}

export async function initEmblem() {
  const box = document.getElementById('emblem3d');
  if (!box || box.dataset.ready) { emblemReady(); return; }
  box.dataset.ready = '1';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let THREE, RoomEnvironment, SVGLoader;
  try {
    [THREE, { RoomEnvironment }, { SVGLoader }] = await Promise.all([
      import('three'),
      import('three/addons/environments/RoomEnvironment.js'),
      import('three/addons/loaders/SVGLoader.js')
    ]);
  } catch (e) {
    console.error('[teddy] emblem: three indisponible', e);
    emblemReady();
    return;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.domElement.style.cssText = 'display:block;position:absolute;pointer-events:none';
  box.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.3, 6.0);

  /* Environnement : une pièce, plus quatre panneaux HDR qui donnent
     à l'or des reflets orientés — sans eux, le métal est terne. */
  const env = new RoomEnvironment();
  const panel = (w, h, col, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(...col) })
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(16, 8, [4.6, 3.6, 2.2], 0, 2.5, 9);
  panel(7, 5, [1.9, 1.5, 0.8], 0, 2.5, -9);
  panel(8, 6, [2.2, 1.7, 1.0], -9, 1.5, 0);
  panel(8, 6, [2.2, 1.7, 1.0], 9, 1.5, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.04).texture;

  const key = new THREE.DirectionalLight(0xffe9b8, 1.15);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xd4af37, 24);
  rim.position.set(-5, -2, -4);
  scene.add(rim);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xC79A3E,
    metalness: 1,
    roughness: 0.30,
    roughnessMap: brushed(THREE),
    bumpMap: brushed(THREE),      // deuxième tirage : non corrélé au premier
    bumpScale: 0.28,
    envMapIntensity: 1.15,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3
  });

  const pivot = new THREE.Group();
  scene.add(pivot);

  let svgText;
  try {
    svgText = await (await fetch(SVG_URL)).text();
  } catch (e) {
    console.error('[teddy] emblem: svg introuvable', e);
    emblemReady();
    return;
  }

  const parsed = new SVGLoader().parse(svgText);
  const inner = new THREE.Group();
  for (const path of parsed.paths) {
    for (const shape of path.toShapes()) {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 6,
        bevelEnabled: true,
        bevelThickness: 6.5,   // plus épais que l'extrusion : arête de médaille
        bevelSize: 4,
        bevelSegments: 12,
        curveSegments: 24
      });
      inner.add(new THREE.Mesh(geo, material));
    }
  }
  inner.rotation.x = Math.PI;      // le SVG a l'axe Y inversé
  pivot.add(inner);

  const bb = new THREE.Box3().setFromObject(inner);
  const center = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3());
  inner.position.sub(center);
  pivot.scale.setScalar(3.35 / Math.max(size.x, size.y));

  /* ── Le cadrage : les trois écritures sont indissociables ──
     `setViewOffset` élargit le frustum vers l'extérieur ; l'échelle et la
     perspective ne bougent pas, on dessine seulement plus large. Modifier
     setSize, setViewOffset ou le CSS séparément casse l'échelle. */
  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    const lx = Math.round(w * FRAME_AIR), ly = Math.round(h * FRAME_AIR);
    const gw = w + 2 * lx, gh = h + 2 * ly;
    camera.aspect = w / h;
    camera.position.setLength(6.0 * Math.max(1, 0.8 / camera.aspect));
    camera.setViewOffset(w, h, -lx, -ly, gw, gh);
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    renderer.setSize(gw, gh, false);
    const st = renderer.domElement.style;
    st.left = -lx + 'px'; st.top = -ly + 'px';
    st.width = gw + 'px'; st.height = gh + 'px';
  }
  resize();
  new ResizeObserver(resize).observe(box);

  /* ── Parallaxe ── */
  let yawT = START_YAW, pitchT = 0, pxT = 0, pyT = 0;
  pivot.rotation.y = START_YAW;

  if (!reduced) {
    window.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      yawT = START_YAW + nx * MAX_YAW;
      pitchT = ny * MAX_PITCH;
      pxT = nx * MAX_PX;
      pyT = -ny * MAX_PY;
    }, { passive: true });
  }

  /* On ne rend pas une scène WebGL qui n'est pas à l'écran. */
  let onScreen = true;
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    renderer.setAnimationLoop(onScreen ? loop : null);
  }, { rootMargin: '20% 0px' }).observe(box);

  let intro = false;
  let first = false;

  function loop() {
    if (!intro) {
      pivot.rotation.y += (yawT - pivot.rotation.y) * FOLLOW;
      pivot.rotation.x += (pitchT - pivot.rotation.x) * FOLLOW;
      pivot.position.x += (pxT - pivot.position.x) * FOLLOW;
      pivot.position.y += (pyT - pivot.position.y) * FOLLOW;
    }
    renderer.render(scene, camera);
    if (!first) {
      first = true;
      box.querySelector('.emblem__ph')?.remove();
      startIntro();
    }
  }
  renderer.setAnimationLoop(loop);

  /* ── L'entrée : il arrive du centre de l'écran en tournant, et se pose. ── */
  function startIntro() {
    const wrap = box.closest('.emblem') || box;
    const g = window.gsap;
    if (reduced || !g) { emblemReady(); return; }

    const r = wrap.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (r.left + r.width / 2);
    const dy = window.innerHeight / 2 - (r.top + r.height / 2);
    intro = true;

    const spin = { v: START_YAW - Math.PI * 1.5 };
    pivot.rotation.y = spin.v;
    g.set(wrap, { x: dx, y: dy, scale: 0.22, autoAlpha: 0, zIndex: 999, willChange: 'transform' });

    g.timeline({
      onComplete() {
        intro = false;
        emblemReady();
        g.set(wrap, { clearProps: 'zIndex,willChange' });
      }
    })
      .to(wrap, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .to(spin, { v: START_YAW, duration: 2.4, ease: 'expo.out',
                  onUpdate: () => { pivot.rotation.y = spin.v; } }, 0)
      .to(wrap, { x: 0, y: 0, scale: 1, duration: 1.7, ease: 'expo.inOut' }, 0.45)
      // le titre n'attend pas la fin : il part quand l'emblème est posé à 99 %
      .call(emblemReady, null, 1.55);
  }

  // Filet : si la boucle ne démarre jamais, le hero ne doit pas rester bloqué.
  setTimeout(emblemReady, 4000);
}
