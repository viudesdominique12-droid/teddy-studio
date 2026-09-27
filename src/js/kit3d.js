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
import { reduced, breathe } from './motion.js';

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
  /* Aucun outil n'est sauté (27/09, Dominique : « le 4, on le voit à peine,
     il ne s'affiche pas, il est sauté »). Au pas normal, rien ne change : le
     défilement choisit l'outil à l'écran, au même endroit qu'avant. Mais un
     geste rapide traversait la course d'un outil (0,5 écran pour une photo)
     plus vite qu'il ne peut apparaître (~1,2 s) : le suivant le chassait
     avant même qu'il se montre. Désormais chaque outil reste au moins SEEN
     à l'écran, puis le suivant prend sa place, dans l'ordre, jusqu'à
     rejoindre celui que demande le défilement. Les gestes d'entrée, de sortie
     et la vie du plan sont inchangés. Tout cela, scène épinglée seulement :
     si elle s'en va (on a quitté la séquence), l'outil demandé vient d'emblée,
     comme avant — jamais un outil qui apparaît pendant que l'écran défile. */
  const SEEN = 1300;   // ms : le temps qu'un outil apparaisse en entier
  let want = -1;       // l'outil que demande le défilement
  let since = 0;       // l'instant où l'outil à l'écran est entré
  let wait = 0;        // le passage suivant, en attente
  const pass = (i, k) => {
    const swap = active >= 0;
    if (swap) leave(plans[active]);
    active = i;
    since = performance.now();
    enter(plans[i], k, swap);
  };
  const advance = () => {
    wait = 0;
    if (want === active) return;
    // Par la position, bornes comprises : retenue au bout exact de la séquence,
    // la scène est encore là, immobile, même si ScrollTrigger la dit libérée.
    const y = st ? st.scroll() : -1;
    const pinned = Boolean(st) && y >= st.start - 1 && y <= st.end + 1;
    const left = since + SEEN - performance.now();
    if (active >= 0 && pinned && left > 0) { wait = setTimeout(advance, left); return; }
    pass(active < 0 || !pinned ? want : active + Math.sign(want - active), 1);
    if (active !== want) wait = setTimeout(advance, SEEN);
  };
  const show = (i, instant = false) => {
    if (instant) {
      clearTimeout(wait); wait = 0; want = i;
      if (i !== active) pass(i, 0);
      return;
    }
    if (i === want) return;
    want = i;
    if (!wait) advance();
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
    // Arrivé au milieu de la séquence (un saut, un rechargement) : l'outil du
    // moment, pas la caméra — sinon la file repasserait par tous les outils.
    const inside = st && st.isActive;
    show(passed || inside ? planAt((st ? st.progress : 1) * total) : 0, passed);
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

  /* La scène ne se libère pas tant qu'un outil reste à montrer (27/09,
     Dominique : « pour le 4, 5 et 6, l'écran descend avec le défilement alors
     que seul l'objet est censé apparaître »). Un geste de molette ou de pavé
     tactile qui atteint le bout de la séquence y est retenu le temps que les
     derniers outils passent, puis le défilement reprend. Au pas normal, rien
     n'est retenu : chaque outil est déjà passé. En remontant, rien n'est
     retenu non plus. Sur ordinateur ; le clavier, la barre de défilement et
     les liens gardent leur course. */
  const lenis = window.__lenis;
  if (lenis && !LITE) {
    const last = plans.length - 1;
    const previous = lenis.options.virtualScroll;
    lenis.options.virtualScroll = (data) => {
      if (previous && previous(data) === false) return false;
      const e = data.event;
      if (!e.type.includes('wheel') || e.ctrlKey || lenis.isStopped || data.deltaY <= 0) return true;
      const from = lenis.targetScroll;
      if (from > st.end + 1 || from + data.deltaY <= st.end) return true;
      if (active === last && want === last && performance.now() - since >= SEEN) return true;
      const room = st.end - from;
      // Lenis n'empêche le défilement natif que pour ce qu'il traite : un
      // geste entièrement retenu doit l'être ici.
      if (room < 0.5) { if (e.cancelable) e.preventDefault(); return false; }
      data.deltaY = room;
      return true;
    };
  }

  /* Sur écran tactile (27/09, Dominique : « sur téléphone, après le drone,
     quand je swipe, ça descend directement sans faire défiler le reste des
     objets », puis, sur son iPhone : « après l'objet 3, l'écran défile vers
     le bas et n'attend pas les objets 4, 5 et 6 »). Le doigt lance le
     défilement du système, avec son élan : un geste traversait la séquence
     d'un coup. Désormais, tant que la scène est épinglée (elle couvre
     l'écran), elle tient le doigt : un geste vers le haut amène l'outil
     suivant, vers le bas le précédent, dans un glissé doux (la vie du plan
     suit, comme au doigt). Un geste compte depuis l'outil À L'ÉCRAN, jamais
     depuis la position de la page : la page peut être en avance sur les
     outils (un élan l'a portée loin), et le geste suivant la faisait alors
     sortir avant le 4, le 5 et le 6. On ne sort par le bas qu'une fois le
     dernier outil vu ; avant le premier, un geste fait remonter.
     Un élan venu d'au-dessus est arrêté en entrant dans la scène, sur
     l'outil à l'écran. Sur iPhone, un saut de la page (scrollTo) ne coupe
     PAS l'élan du système : il repart du nouveau point (WebKit ne
     l'interrompt que pour un défilement animé, `_scrollToContentScrollPosition`).
     D'où le défilement animé du frein. Et le doigt est tenu par un
     `preventDefault` sur `touchmove`, que tous les iPhone respectent,
     en plus de `touch-action`. */
  if (lenis && LITE) {
    const last = plans.length - 1;
    const html = document.documentElement;
    const centre = (i) => st.start + ((plans[i].t0 + plans[i].dur / 2) / total) * (st.end - st.start);
    const inside = (y) => y >= st.start - 1 && y <= st.end + 1;
    const done = () => active === last && want === last && performance.now() - since >= SEEN;
    let goal = -1;       // l'outil que le doigt a demandé (la file peut être en retard)
    let ours = 0;        // jusqu'à cet instant, la page bouge de notre fait (glissé, frein)
    let touching = false;
    let grab = false;    // le geste en cours appartient à la scène
    let x0 = 0;
    let y0 = 0;
    let prevY = window.scrollY;

    const glide = (to, ms) => {
      ours = performance.now() + ms + 300;   // + la dernière image du glissé
      lenis.scrollTo(to, { duration: ms / 1000, force: true });
    };
    const brake = (to) => {
      ours = performance.now() + 900;
      goal = -1;
      window.scrollTo({ top: to, behavior: 'smooth' });
    };
    const step = (dir) => {
      const j = (goal >= 0 ? goal : Math.max(active, 0)) + dir;
      if (j > last && !done()) return;   // le dernier outil entre encore
      const leave = window.innerHeight * 0.35;
      goal = j < 0 || j > last ? -1 : j;
      glide(j < 0 ? st.start - leave : j > last ? st.end + leave : centre(j), 700);
    };

    // Lenis ne doit pas voir ces gestes : il y lirait le doigt qui reprend le
    // défilement du système, et arrêterait aussitôt le glissé vers l'outil.
    // Tout se passe à la capture, avant lui.
    const opt = { passive: true, capture: true };
    const move = (e) => {
      if (!grab) return;
      e.lenisStopPropagation = true;
      if (e.cancelable) e.preventDefault();
    };
    let moveOn = false;
    const hold = () => {
      const y = window.scrollY;
      // Un élan (plus de doigt sur l'écran) qui descend dans la scène, ou en
      // sort par le bas avant le dernier outil : arrêté sur l'outil à l'écran.
      // Pas un défilement programmé (un lien, le menu), ni un saut de plus
      // d'un demi-écran (la position rendue au retour sur la page) : ce n'est
      // pas un élan.
      const coast = !touching && lenis.isScrolling !== 'smooth' && performance.now() > ours
        && y > prevY && y - prevY < window.innerHeight / 2;
      if (coast && y >= st.start - 1 && prevY <= st.end + 1 && !done()) brake(centre(Math.max(active, 0)));
      if (!inside(y)) goal = -1;
      prevY = y;
      const held = inside(y);
      stage.classList.toggle('is-held', held);
      // Le doigt n'est retenu (écouteur non passif) que scène épinglée : ailleurs,
      // le défilement du téléphone démarre sans attendre la page.
      if (held !== moveOn) {
        moveOn = held;
        if (held) window.addEventListener('touchmove', move, { passive: false, capture: true });
        else window.removeEventListener('touchmove', move, { capture: true });
      }
    };
    window.addEventListener('scroll', hold, { passive: true });
    hold();

    window.addEventListener('touchstart', (e) => {
      touching = true;
      grab = e.touches.length === 1 && inside(window.scrollY) && !html.classList.contains('is-locked');
      if (!grab) { goal = -1; return; }
      e.lenisStopPropagation = true;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, opt);
    window.addEventListener('touchend', (e) => {
      touching = e.touches.length > 0;
      if (!grab) return;
      e.lenisStopPropagation = true;
      grab = false;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = y0 - e.changedTouches[0].clientY;   // > 0 : le doigt monte
      if (Math.abs(dy) < 30 || Math.abs(dx) > Math.abs(dy)) return;   // un appui, un geste de côté
      step(dy > 0 ? 1 : -1);
    }, opt);
    window.addEventListener('touchcancel', () => { touching = false; grab = false; }, opt);
  }

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

  /* Payer d'avance la première apparition d'un objet. Sans ça, sa première
     image à l'écran compile ses shaders, envoie ses textures et sa géométrie
     à la carte graphique et prépare ses états de dessin (Metal, sur Mac) —
     en pleine entrée du plan : des arrêts de 150 à 700 ms, mesurés. On le
     fait ici, hors champ et par petits morceaux. Le dessin de chauffe passe
     par une découpe (scissor) vide : il ne touche aucun pixel. */
  const warm = async (obj) => {
    const { renderer, scene, cam } = three;
    const maps = new Set();
    obj.traverse((o) => {
      for (const m of [].concat(o.material || [])) {
        for (const v of Object.values(m)) if (v && v.isTexture) maps.add(v);
      }
    });
    for (const tex of maps) { renderer.initTexture(tex); await breathe(); }
    await renderer.compileAsync(obj, cam, scene);
    await breathe();
    if (visible) return;   // à l'écran, le rendu normal s'en charge
    const was = [obj.visible, obj.position.clone(), obj.scale.clone()];
    obj.visible = true;
    obj.position.set(0, 0, 0);
    obj.scale.setScalar(1);
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, 0, 0);
    renderer.render(scene, cam);
    renderer.setScissorTest(false);
    [obj.visible] = was;
    obj.position.copy(was[1]);
    obj.scale.copy(was[2]);
    lastSig = '';   // le canevas est à redessiner à la prochaine image visible
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
      // Chaque gros morceau du chargement est suivi d'une respiration
      // (`breathe`) : la page garde ses images pendant qu'il se fait.
      const THREE = await import('three');
      await breathe();
      const [{ GLTFLoader }, { RoomEnvironment }, { MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/environments/RoomEnvironment.js'),
        import('three/addons/libs/meshopt_decoder.module.js')
      ]);
      // Les modèles se décompressent dans deux Web Workers, hors du fil de
      // la page : le même décodeur, le même résultat.
      try { MeshoptDecoder.useWorkers?.(2); } catch { /* décodage sur place */ }
      await breathe();

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1.25 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.2;
      await breathe();

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 1.1;
      await breathe();

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
          await breathe();
          const holder = stageModel(THREE, gltf.scene, p);
          scene.add(holder);
          await warm(holder);
          p.holder = holder;
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
