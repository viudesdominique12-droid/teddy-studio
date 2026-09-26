/**
 * LE MATÉRIEL, PLAN PAR PLAN (26/09/2026).
 *
 * Demande de Dominique : « quelque chose de beaucoup plus cinématique : la
 * caméra vient, tourne à gauche, à droite, il y a sa description ; tu
 * descends, ensuite les lentilles, le drone… ». Puis, après l'essai : la
 * caméra, les objectifs et le drone en 3D ; le reste garde sa photo.
 *
 * Une scène plein écran s'épingle, et les six outils y passent l'un après
 * l'autre, en alternant les côtés. Chaque PLAN a trois temps :
 *   l'entrée  l'objet arrive par son côté (le modèle en pivotant, la photo
 *             en se découvrant depuis le bord) ; sa fiche se pose en face ;
 *   la vie    le modèle tourne lentement sous une lumière qui passe ; la
 *             photo se resserre à peine ;
 *   la sortie il repart par où il est venu, pendant que le suivant arrive.
 * Le défilement mène la vie du plan et choisit l'outil à l'écran ; l'entrée
 * et la sortie se jouent dans le temps, toujours à la même allure (27/09 :
 * « les transitions sont parfois un peu trop brutes »).
 *
 * Un vrai modèle 3D plutôt qu'une photo qu'on ferait pivoter : une photo ne
 * montre qu'une face, et la tourner donne un carton découpé.
 *
 * Three.js et les modèles ne se chargent qu'à l'approche de la section, dans
 * l'ordre des plans. Sans WebGL, ou si un modèle ne vient pas, le plan prend
 * la photo de l'outil : la séquence est toujours entière. En mouvement
 * réduit, rien de tout ça : la liste des six outils reste telle quelle.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

const MOBILE = matchMedia('(max-width: 48rem)');
/* Sur un écran tactile (27/09, « les transitions ne sont pas fluides sur
   mobile ») : la scène est dessinée à 1,25 fois l'écran au lieu de 2, sans le
   souffle au repos, et n'est redessinée que quand quelque chose bouge. Mesuré :
   c'est elle qui saccadait, pas le reste de la page. */
const LITE = matchMedia('(pointer: coarse)').matches;
const RAD = Math.PI / 180;
const HOME = 0.36;   // le centre d'un objet posé, en demi-largeurs d'écran depuis le milieu
const AWAY = 1.9;    // hors champ, même mesure
const HOLD = 0.1;    // le dernier plan tient un instant avant que la scène se libère

function webgl() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/** La séquence n'a lieu qu'avec du mouvement : sinon, la liste suffit. */
export function kit3dAvailable(root = document.querySelector('[data-kit3d]')) {
  return Boolean(root) && !reduced();
}

/* L'ombre posée sous l'objet : un disque flou peint une fois, qui le suit. */
function contactShadow(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const grd = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.22)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = grd;
  x.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* Un modèle devient un objet de la scène :
     holder (place et taille à l'écran) → spin (la pose animée)
       → unit (ramené à une taille de 1, centré) → fix (l'orientation propre
       au fichier, `data-fix`) → le modèle.
   L'orientation est posée AVANT la mesure : l'ombre se cale sous l'objet tel
   qu'on le voit, pas tel qu'il a été modelé. */
function stageModel(THREE, model, p) {
  const fix = new THREE.Group();
  fix.rotation.set(p.fix[0] * RAD, p.fix[1] * RAD, p.fix[2] * RAD);
  fix.add(model);
  fix.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fix);
  const dims = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const max = Math.max(dims.x, dims.y, dims.z);
  fix.position.copy(center).multiplyScalar(-1);

  const unit = new THREE.Group();
  unit.add(fix);
  unit.scale.setScalar(1 / max);
  const spin = new THREE.Group();
  spin.add(unit);
  const holder = new THREE.Group();
  holder.add(spin);

  const shadow = contactShadow(THREE);
  const foot = Math.max(dims.x, dims.z) / max;
  shadow.scale.set(foot * 1.25, foot * 0.9, 1);
  shadow.position.y = -(dims.y / max) / 2 - p.gap;
  shadow.material.opacity = p.shade;
  holder.add(shadow);

  holder.userData.spin = spin;
  holder.visible = false;
  return holder;
}

export function initKit3d(root = document.querySelector('[data-kit3d]')) {
  if (!root) return;
  const section = root.closest('section') || root;
  const stage = root.querySelector('.k3__stage');
  const canvas = root.querySelector('.k3__gl');
  if (!stage || !canvas) return;
  const gl = webgl();

  const plans = [...root.querySelectorAll('[data-k3-plan]')].map((el, i) => {
    const model = gl ? el.dataset.model || null : null;
    el.dataset.mode = model ? '3d' : 'photo';
    return {
      el,
      model,
      side: el.dataset.side === 'right' ? 1 : -1,
      fix: (el.dataset.fix || '0 0 0').trim().split(/\s+/).map(Number),
      fit: Number(el.dataset.fit || 1),
      tilt: Number(el.dataset.tilt || 0),
      // la rotation : de trois quarts face (a) jusqu'à (b), en degrés
      turn: (el.dataset.turn || '58 -24').trim().split(/\s+/).map(Number),
      // l'ombre : son écart sous l'objet (unité : sa plus grande dimension) et sa force
      gap: Number(el.dataset.shadowGap || 0.06),
      shade: Number(el.dataset.shadow || 1),
      // La course de défilement d'un plan, en écrans : accélérée à la demande
      // de Dominique (« trop long ») — elle était de 1,25 et 0,9.
      dur: model ? 0.7 : 0.5,
      phase: i * 1.7,
      text: el.querySelectorAll('.k3__n, .k3__h, .k3__tag, .k3__p, .k3__load, .k3__credit'),
      photo: el.querySelector('.k3__photo'),
      pct: el.querySelector('[data-k3-pct]'),
      // pose : la VIE du plan, menée par le défilement. yaw / pitch en
      // degrés ; lamp : la course de la lumière principale, de gauche (−1)
      // à droite (+1).
      pose: { yaw: 0, pitch: 7, lamp: -1 },
      // tr : l'ENTRÉE et la SORTIE, jouées dans le temps. x : le centre de
      // l'objet, en demi-largeurs d'écran (−1 bord gauche, +1 bord droit) ;
      // spin : le pivot d'entrée ou de sortie, ajouté à la rotation.
      tr: { x: AWAY, spin: 0, scale: 0.86 },
      grow: 0,
      holder: null
    };
  });
  if (!plans.length) return;
  section.classList.add('k3-on');

  const home = (p) => (MOBILE.matches ? 0 : p.side * HOME);
  const shut = (p) => (p.side < 0 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)');

  /* ── La vie des plans, au pas du défilement ──
     Le défilement ne mène plus que ce qui doit lui obéir : l'objet qui
     tourne lentement de trois quarts face jusqu'au profil, la lumière qui
     passe, la photo qui se resserre à peine. */
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  let t = 0;
  plans.forEach((p) => {
    const s = p.side;
    const d = p.dur;
    p.t0 = t;
    gsap.set(p.tr, { x: s * AWAY, spin: s * 100, scale: 0.86 });
    gsap.set(p.pose, { yaw: s * p.turn[0], pitch: 7, lamp: -1 });
    tl.fromTo(p.pose, { yaw: s * p.turn[0], pitch: 7 },
      { yaw: s * p.turn[1], pitch: -1, duration: d, ease: 'sine.inOut', immediateRender: false }, t);
    tl.fromTo(p.pose, { lamp: -1 }, { lamp: 1, duration: d, immediateRender: false }, t);

    gsap.set(p.text, { autoAlpha: 0, y: 20 });
    if (p.photo) {
      gsap.set(p.photo, { clipPath: shut(p) });
      const img = p.photo.querySelector('img');
      if (img) {
        gsap.set(img, { scale: 1.1 });
        tl.fromTo(img, { scale: 1.1 }, { scale: 1, duration: d, immediateRender: false }, t);
      }
    }
    t += d;
  });
  tl.to({}, { duration: HOLD }, t);
  const total = t + HOLD;

  /* ── Les passages, dans le temps ──
     Dominique (27/09) : « les transitions sont parfois un peu trop brutes ».
     Liées au défilement, elles tenaient en quelques pixels depuis que la
     séquence a été accélérée : à la molette, une fiche apparaissait en deux
     images et un objet traversait l'écran en quatre. Désormais le défilement
     ne fait que CHOISIR l'outil à l'écran ; le passage de l'un à l'autre
     dure toujours le même temps, qu'on défile vite ou lentement, dans un
     sens ou dans l'autre. Un passage interrompu repart d'où il en est. */
  // Le passage suit un ordre, parce que les côtés alternent : la fiche qui
  // arrive prend la place de l'objet qui part, et l'objet qui arrive celle
  // de la fiche qui part. Donc :
  //   1. l'ancienne fiche s'efface vite (0,3 s), l'ancien objet dégage son
  //      côté (0,65 s) ;
  //   2. le nouvel objet entre par son côté, déjà vide ;
  //   3. la nouvelle fiche ne se pose qu'une fois l'ancien objet parti.
  // `swap` : un plan sort en même temps. Sinon (la toute première arrivée),
  // rien n'est à attendre.
  const enter = (p, k = 1, swap = true) => {
    const w = (swap ? 1 : 0.45) * k;
    // Un plan tout à fait sorti revient de son côté ; un plan qui sortait
    // fait demi-tour là où il en est.
    if (Math.abs(p.tr.x) >= AWAY - 0.01) gsap.set(p.tr, { x: p.side * AWAY, spin: p.side * 100, scale: 0.86 });
    gsap.to(p.tr, { x: home(p), spin: 0, scale: 1, duration: 1.2 * k, delay: 0.2 * w, ease: 'power3.out', overwrite: true });
    gsap.to(p.text, { autoAlpha: 1, y: 0, duration: 0.8 * k, delay: 0.55 * w, stagger: 0.06 * k, ease: 'power3.out', overwrite: true });
    if (p.photo) gsap.to(p.photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 * k, delay: 0.15 * w, ease: 'power3.inOut', overwrite: true });
    // La lueur de fond passe du côté de l'objet.
    gsap.to(stage, { '--gx': p.side < 0 ? 32 : 68, duration: 1.2 * k, ease: 'sine.inOut', overwrite: true });
  };
  const leave = (p) => {
    gsap.to(p.tr, { x: p.side * AWAY, spin: -p.side * 50, scale: 0.92, duration: 0.65, ease: 'power2.in', overwrite: true });
    gsap.to(p.text, {
      autoAlpha: 0, y: -12, duration: 0.3, stagger: 0.02, ease: 'power1.in', overwrite: true,
      // La prochaine fois, la fiche remontera d'en dessous.
      onComplete: () => gsap.set(p.text, { y: 20 })
    });
    if (p.photo) gsap.to(p.photo, { clipPath: shut(p), duration: 0.55, ease: 'power2.in', overwrite: true });
  };

  // On passe au plan suivant un peu avant sa limite, et on n'en revient
  // qu'un peu plus haut : pas de va-et-vient quand on s'arrête sur la limite.
  const LEAD = 0.06;
  const HYST = 0.05;
  let active = -1;
  const planAt = (time) => {
    let i = 0;
    for (let k = 1; k < plans.length; k++) {
      if (time >= plans[k].t0 - LEAD - (k <= active ? HYST : 0)) i = k;
    }
    return i;
  };
  const show = (i, instant = false) => {
    if (i === active) return;
    const swap = active >= 0;
    if (swap) leave(plans[active]);
    active = i;
    enter(plans[i], instant ? 0 : 1, swap);
  };
  if (import.meta.env.DEV) window.__k3 = { plans, show, get active() { return active; } };

  /* L'arrivée du premier outil n'attend pas que la scène s'épingle
     (Dominique : « la caméra prend du temps avant de venir ») : dès que la
     section monte à l'écran, la caméra entre et sa fiche se pose. Page
     chargée plus bas : l'outil du moment est posé d'emblée. */
  let st = null;
  new IntersectionObserver(([e], io) => {
    const passed = !e.isIntersecting && e.boundingClientRect.top < 0;
    if (!e.isIntersecting && !passed) return;
    show(passed ? planAt((st ? st.progress : 1) * total) : 0, passed);
    io.disconnect();
  }, { rootMargin: '0px 0px -30% 0px' }).observe(stage);

  st = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * total)}`,
    pin: true,
    scrub: 1,
    animation: tl,
    invalidateOnRefresh: true,
    onUpdate: (self) => show(planAt(self.progress * total))
  });

  /* ── Le rendu ── */
  let three = null;
  let visible = false;
  let started = false;

  // Le canevas, pas la scène : sur téléphone il n'occupe que le haut de
  // l'écran (la fiche est dessous), et l'objet y reste centré. Le monter
  // dans l'espace 3D changerait l'angle de vue et coucherait son ombre.
  const size = () => {
    if (!three) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    three.renderer.setSize(w, h, false);
    three.cam.aspect = w / Math.max(1, h);
    three.cam.updateProjectionMatrix();
  };

  // Les lumières glissent vers leur place au lieu d'y sauter : un amorti
  // réglé en secondes, indépendant de la cadence d'affichage.
  let lastT = 0;
  let lastSig = '';
  let lampS = null;
  let kickX = null;
  let kickI = 0;

  const render = (time) => {
    if (!three || !visible) { lastT = 0; return; }
    const dt = lastT ? Math.min(0.1, (time - lastT) / 1000) : 1 / 60;
    lastT = time;
    const damp = (rate) => 1 - Math.exp(-dt * rate);
    const { renderer, scene, cam, key, kick } = three;
    const vh = 2 * Math.tan((cam.fov / 2) * RAD) * cam.position.z;
    const vw = vh * cam.aspect;
    const mobile = MOBILE.matches;
    const sec = (time || 0) / 1000;
    let lead = null;   // l'objet le plus près du centre : c'est lui que la lumière suit

    for (const p of plans) {
      const h = p.holder;
      if (!h) continue;
      const on = p.el.dataset.mode === '3d' && Math.abs(p.tr.x) < AWAY - 0.02;
      h.visible = on;
      if (!on) continue;
      const fit = Math.min(vw * (mobile ? 0.8 : 0.46), vh * (mobile ? 0.66 : 0.6)) * p.fit;
      // Le souffle : l'objet flotte à peine, pour qu'il vive quand on ne défile pas.
      const floatY = LITE ? 0 : Math.sin(sec * 0.9 + p.phase) * 0.012 * fit;
      const floatR = LITE ? 0 : Math.sin(sec * 0.7 + p.phase) * 0.6;
      h.position.set(p.tr.x * vw / 2, -0.02 * vh + floatY, 0);
      h.scale.setScalar(fit * p.tr.scale * (0.86 + 0.14 * p.grow));
      // À droite, l'objet est le miroir de celui de gauche : il regarde sa fiche.
      h.userData.spin.rotation.set(
        (p.pose.pitch + p.tilt) * RAD,
        (p.pose.yaw + p.tr.spin + (p.side > 0 ? 180 : 0) + floatR) * RAD,
        0
      );
      if (!lead || Math.abs(p.tr.x) < Math.abs(lead.tr.x)) lead = p;
    }

    if (lead) {
      // La lumière principale traverse : ses reflets glissent sur le boîtier.
      // Quand l'objet suivant prend la place, elle le rejoint en glissant ;
      // avant, elle sautait d'un côté à l'autre, un éclair sur les deux objets.
      lampS = lampS == null ? lead.pose.lamp : lampS + (lead.pose.lamp - lampS) * damp(4);
      const a = lampS * 1.05;
      key.position.set(Math.sin(a) * 7, 4.5, Math.cos(a) * 7);
      const kx = lead.holder.position.x - lead.side * 2.6;
      kickX = kickX == null ? kx : kickX + (kx - kickX) * damp(5);
      kick.position.set(kickX, lead.holder.position.y + 0.7, -3.2);
      // La touche terre cuite ne s'allume qu'une fois l'objet posé : en
      // chemin, elle rosissait l'intérieur du pare-soleil.
      const settled = 1 - Math.min(1, Math.abs(Math.abs(lead.tr.x) - (mobile ? 0 : HOME)) / 0.5);
      kickI += (15 * settled * settled - kickI) * damp(6);
      kick.intensity = kickI;
    }
    if (LITE) {
      // Rien n'a bougé depuis la dernière image : la puce graphique se repose.
      const sig = plans.map((p) => (p.holder?.visible
        ? [p.tr.x, p.tr.spin, p.tr.scale, p.pose.yaw, p.pose.pitch, p.grow].map((v) => v.toFixed(4)).join(',')
        : '-')).join('|') + `#${(lampS ?? 0).toFixed(4)}#${kickI.toFixed(3)}#${canvas.width}x${canvas.height}`;
      if (sig === lastSig) return;
      lastSig = sig;
    }
    renderer.render(scene, cam);
  };

  const start = async () => {
    if (started) return;
    started = true;
    const need = plans.filter((p) => p.model);
    if (!need.length) return;
    const fallback = (list, err) => {
      if (err) console.warn('[kit3d]', err);
      list.forEach((p) => { p.el.dataset.mode = 'photo'; });
    };

    try {
      const THREE = await import('three');
      const [{ GLTFLoader }, { RoomEnvironment }, { MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/environments/RoomEnvironment.js'),
        import('three/addons/libs/meshopt_decoder.module.js')
      ]);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.2;

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 1.1;

      // Une longue focale, un regard à peine plongeant (6°) : celui d'un
      // photographe de produit. L'ombre se lit comme une ombre, jamais comme
      // un trait vu par la tranche.
      const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
      cam.position.set(0, 1.15, 11);
      cam.lookAt(0, 0, 0);

      // Une clé chaude qui traverse, un contre-jour froid qui détache la
      // silhouette du vert, et une touche de terre cuite derrière.
      const key = new THREE.DirectionalLight(0xfff2e4, 3.2);
      const rim = new THREE.DirectionalLight(0xe4f2e6, 4.2);
      rim.position.set(3.5, 4, -5);
      // La touche derrière l'objet prend l'accent du thème, et la lumière
      // d'ambiance remonte du fond de la section : lus sur la scène, relus
      // quand on change de thème.
      const tone = () => {
        const cs = getComputedStyle(stage);
        return { accent: cs.getPropertyValue('--gold').trim() || '#db6336', ground: cs.getPropertyValue('--bg-2').trim() || '#0f1c11' };
      };
      const t0 = tone();
      const kick = new THREE.PointLight(t0.accent, 15, 10, 2);
      const fill = new THREE.HemisphereLight(0xe8efe6, t0.ground, 0.35);
      scene.add(key, rim, kick, fill);
      window.addEventListener('palette:change', () => {
        const t = tone();
        kick.color.set(t.accent);
        fill.groundColor.set(t.ground);
        lastSig = '';   // redessiner, même au repos
      });

      three = { THREE, renderer, scene, cam, key, kick };
      size();

      // Dans l'ordre des plans : la caméra est prête la première.
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      for (const p of need) {
        try {
          const gltf = await loader.loadAsync(p.model, (e) => {
            if (!p.pct || !e.total) return;
            p.pct.textContent = String(Math.round((e.loaded / e.total) * 100)).padStart(3, '0');
          });
          p.holder = stageModel(THREE, gltf.scene, p);
          scene.add(p.holder);
          p.el.classList.add('is-ready');
          gsap.to(p, { grow: 1, duration: 0.9, ease: 'expo.out' });
        } catch (err) {
          fallback([p], err);
        }
      }
    } catch (err) {
      fallback(need, err);
    }
  };

  // On charge dès que la page est tranquille (la section est la deuxième :
  // on y arrive vite), et au plus tard à l'approche. On ne dessine que quand
  // la scène est à l'écran.
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  const soon = () => idle(() => start(), { timeout: 2500 });
  if (document.readyState === 'complete') soon();
  else window.addEventListener('load', soon, { once: true });
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) { start(); io.disconnect(); }
  }, { rootMargin: '180% 0px' }).observe(stage);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

  // Le souffle impose un rendu continu tant que la scène est à l'écran ;
  // hors écran, rien ne tourne.
  gsap.ticker.add((time) => render(time * 1000));

  window.addEventListener('resize', () => requestAnimationFrame(size));
  MOBILE.addEventListener('change', () => {
    tl.invalidate();
    ScrollTrigger.refresh();
    if (active >= 0) gsap.to(plans[active].tr, { x: home(plans[active]), duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
  });
}
