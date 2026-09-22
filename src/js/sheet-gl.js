/**
 * LES IMAGES PLIENT POUR DE BON — un maillage, un shader, écrits à la main.
 *
 * Le portage CSS (`bulge.js`) transforme chaque élément comme un PLAN RIGIDE :
 * il peut l'incliner, l'avancer, l'agrandir, mais ses quatre arêtes restent
 * droites. Une feuille de papier, elle, se courbe SUR SA PROPRE HAUTEUR — et
 * c'est ce que l'œil reconnaît. Aucune combinaison de `transform` ne le donne :
 * il n'y a qu'une matrice par élément, pas de sommets à déplacer.
 *
 * Ici on en déplace 289. Chaque image devient une grille de 16 × 16 quads dont
 * chaque sommet est poussé en profondeur selon la même parabole que le reste
 * de la page, et la silhouette s'arque parce que la PERSPECTIVE l'arque.
 *
 * ── Pourquoi pas Three.js ──
 * On venait d'en retirer 747 ko, qui ne servaient qu'à un objet décoratif. En
 * écrivant le shader à la main on tient le même effet en quelques kilo-octets :
 * un programme, un tampon de géométrie partagé, une texture par image. Rien
 * d'autre n'est nécessaire — pas de graphe de scène, pas de matériaux, pas de
 * chargeur.
 *
 * ── Ce qui reste au DOM ──
 * Tout. Le `<img>` garde sa place dans la mise en page, son `alt`, ses clics,
 * son `srcset`. On se contente de le rendre transparent pendant que le canvas
 * le dessine à sa place, au pixel près. Le texte n'est jamais touché : il
 * reste du vrai texte, sélectionnable et net.
 *
 * ── Et la lumière ──
 * C'est elle qui fait la différence entre « papier éclairé » et « image
 * tordue ». La normale est prise ANALYTIQUEMENT — la dérivée exacte de la
 * parabole, pas une différence entre facettes voisines, qui rendrait les 16
 * facettes visibles. Diffus discret, spéculaire serré : la feuille attrape la
 * lumière quand elle se cambre, et seulement là.
 *
 * ── Le repos est gratuit ──
 * À amplitude nulle le maillage est parfaitement plat, donc son rendu serait
 * identique à l'image du DOM. On rend donc la main : le canvas se vide, les
 * `<img>` réapparaissent, et il ne reste plus une seule opération GPU. Le
 * basculement est invisible puisque les deux états coïncident exactement.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from './motion.js';
import { sheetAmplitude } from './bulge.js';

/* Les images qui plient. Uniquement des PHOTOGRAPHIES : ce sont elles qu'on
   lit comme de la matière. Les logos et les pictogrammes n'y gagneraient rien
   et coûteraient une texture chacun. */
const TARGETS = [
  '.stop img',          /* les tirages de lieux — les plus grandes photos */
  '.note__fig img',     /* la figure d'À propos */
  '.credits__art',      /* les affiches de films */
  '.case__fig img',     /* le matériel */
  '.wall__i img'        /* les logos clients */
].join(', ');

const SEG = 16;             /* 16 × 16 quads = 289 sommets, 512 triangles */
/* DOIT rester égal au DEPTH de `bulge.js`, et FOCAL à son PERSP. Les blocs
   CSS et les images GL sont la MÊME feuille : deux profondeurs différentes,
   ce sont deux surfaces qui se croisent, et l'œil le voit immédiatement. */
const DEPTH = 130;
const FOCAL = 900;          /* = PERSP dans bulge.js */
const DPR_CAP = 1.5;
const EPS = 0.004;          /* sous ce seuil, la feuille est plate : on rend la main */

/* ── LE GARDE-FOU ──
   Ce module est le seul du site à dessiner sur un GPU, et je ne peux pas
   mesurer son coût réel ici : l'environnement de test émule WebGL sur le
   processeur. Plutôt que de parier sur le téléphone du visiteur, le module se
   SURVEILLE : il chronomètre son propre travail et, s'il dépasse durablement
   son budget, il se retire. Le portage CSS continue alors seul — moins beau,
   mais la page reste fluide. Un effet qui fait ramer n'est pas un effet. */
const BUDGET_MS = 6;        /* le coût moyen qu'on s'autorise par image */
const WATCH = 90;           /* la fenêtre d'observation, en images rendues */

const VERT = `
attribute vec2 aUV;
uniform vec4 uRect;        // x, y, largeur, hauteur — en pixels écran
uniform vec2 uView;
uniform float uAmp;
uniform float uDepth;
uniform float uFocal;
varying vec2 vUV;
varying float vSlope;

void main() {
  vec2 p = uRect.xy + aUV * uRect.zw;

  // half est un mot reserve du GLSL : il ne peut pas servir de variable.
  float hy = uView.y * 0.5;
  float t = clamp((p.y - hy) / hy, -1.0, 1.0);

  // LA FEUILLE. Exactement la parabole du portage CSS, mais évaluée PAR
  // SOMMET : c'est toute la différence. Deux sommets d'une même image ont
  // deux profondeurs distinctes, donc l'image se courbe.
  float z = uAmp * uDepth * (1.0 - t * t);

  // La perspective, à la main : un point à la profondeur z est vu depuis le
  // centre de l'écran agrandi de f / (f - z).
  float s = uFocal / max(uFocal - z, 1.0);
  vec2 c = uView * 0.5;
  vec2 q = (p - c) * s + c;

  // La pente locale — la dérivée de la parabole. Elle part au fragment, où
  // elle deviendra la normale : prise ici, les 16 facettes se verraient.
  vSlope = uAmp * uDepth * (-2.0 * t) / hy;

  vUV = aUV;
  vec2 clip = (q / uView) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUV;
varying float vSlope;
uniform sampler2D uTex;
uniform vec2 uTexScale;
uniform vec2 uTexOffset;

const vec3  LIGHT = vec3(-0.30, 0.55, 1.0);
const float GLOSS = 42.0;
const float SPEC  = 0.26;
const float DIFF  = 0.11;

void main() {
  vec2 uv = uTexOffset + vUV * uTexScale;
  vec4 c = texture2D(uTex, uv);

  // La normale, prise de la PENTE et non de la géométrie.
  vec3 n = normalize(vec3(0.0, -vSlope, 1.0));
  vec3 L = normalize(LIGHT);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));

  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, H), 0.0), GLOSS);

  // Au repos la normale vaut (0,0,1) : diff et spec valent alors leur valeur
  // de référence, et le facteur retombe exactement à 1 — l'image non pliée
  // est rendue telle quelle, sans assombrissement parasite.
  float k = 1.0 + DIFF * (diff - 0.8752) + SPEC * (spec - 0.4820);
  gl_FragColor = vec4(c.rgb * k, c.a);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[teddy] sheet-gl:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export function initSheetGL() {
  if (window.__teddySheetGL) return;
  if (reduced()) return;
  if (!document.querySelector(TARGETS)) return;
  // `?gl=off` coupe le rendu des images sans toucher au reste de la feuille.
  if (new URLSearchParams(location.search).get('gl') === 'off') return;

  const canvas = document.createElement('canvas');
  canvas.className = 'sheet-gl';
  canvas.setAttribute('aria-hidden', 'true');

  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: false, antialias: true, depth: false
  });
  // Pas de WebGL : on ne fait rien, et le portage CSS continue seul.
  if (!gl) return;

  window.__teddySheetGL = true;
  document.body.appendChild(canvas);

  /* ── Le programme ── */
  const prog = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return; }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aUV');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[teddy] sheet-gl:', gl.getProgramInfoLog(prog));
    canvas.remove(); return;
  }
  gl.useProgram(prog);

  const U = {};
  for (const n of ['uRect', 'uView', 'uAmp', 'uDepth', 'uFocal', 'uTex', 'uTexScale', 'uTexOffset']) {
    U[n] = gl.getUniformLocation(prog, n);
  }
  gl.uniform1i(U.uTex, 0);
  gl.uniform1f(U.uDepth, DEPTH);
  gl.uniform1f(U.uFocal, FOCAL);

  /* ── La géométrie, construite UNE fois et partagée par toutes les images ──
     Chaque image ne coûte donc qu'une texture et un appel de dessin. */
  const uv = [];
  for (let y = 0; y <= SEG; y++) {
    for (let x = 0; x <= SEG; x++) uv.push(x / SEG, y / SEG);
  }
  const idx = [];
  for (let y = 0; y < SEG; y++) {
    for (let x = 0; x < SEG; x++) {
      const a = y * (SEG + 1) + x, b = a + 1, c = a + SEG + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const COUNT = idx.length;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  /* ── Les images ── */
  const slots = new Map();      /* élément → { tex, w, h } */

  function upload(img) {
    if (!img.complete || !img.naturalWidth) return null;
    let slot = slots.get(img);
    if (slot && slot.src === img.currentSrc) return slot;
    const tex = slot ? slot.tex : gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Dimensions quelconques : ni mipmap ni répétition, sinon rien ne s'affiche.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); }
    catch { return null; }
    slot = { tex, src: img.currentSrc, nw: img.naturalWidth, nh: img.naturalHeight };
    slots.set(img, slot);
    return slot;
  }

  let dpr = 1, vw = 0, vh = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    vw = window.innerWidth; vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uView, vw, vh);
  }
  resize();

  let live = false;             /* le canvas a-t-il la main ? */
  let targets = [];
  let spent = 0, seen = 0, retired = false;

  function collect() { targets = [...document.querySelectorAll(TARGETS)]; }
  collect();

  /** Rend la main au DOM : les <img> redeviennent visibles, le canvas se vide. */
  function release() {
    if (!live) return;
    live = false;
    for (const img of targets) img.style.visibility = '';
    canvas.classList.remove('is-on');
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Se retire définitivement et rend la page au DOM. */
  function retire(why) {
    if (retired) return;
    retired = true;
    gsap.ticker.remove(frame);
    release();
    canvas.remove();
    console.info('[teddy] sheet-gl retiré :', why);
  }

  function frame() {
    if (retired) return;
    const a = sheetAmplitude();
    if (Math.abs(a) < EPS) { release(); return; }

    const t0 = performance.now();

    if (!live) {
      live = true;
      canvas.classList.add('is-on');
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uAmp, a);

    for (const img of targets) {
      const r = img.getBoundingClientRect();
      // Hors cadre : ni texture ni dessin. C'est le seul filtrage nécessaire,
      // la page n'ayant jamais plus d'une quinzaine d'images visibles.
      if (r.bottom < -80 || r.top > vh + 80 || r.right < -80 || r.left > vw + 80 || !r.width) {
        if (img.style.visibility) img.style.visibility = '';
        continue;
      }
      const slot = upload(img);
      if (!slot) { if (img.style.visibility) img.style.visibility = ''; continue; }

      img.style.visibility = 'hidden';

      /* `object-fit: cover` : la texture est recadrée, pas étirée. On calcule
         la portion réellement visible plutôt que de déformer la photo. */
      const s = Math.max(r.width / slot.nw, r.height / slot.nh);
      const cw = r.width / (slot.nw * s), ch = r.height / (slot.nh * s);
      gl.uniform2f(U.uTexScale, cw, ch);
      gl.uniform2f(U.uTexOffset, (1 - cw) / 2, (1 - ch) / 2);
      gl.uniform4f(U.uRect, r.left, r.top, r.width, r.height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, slot.tex);
      gl.drawElements(gl.TRIANGLES, COUNT, gl.UNSIGNED_SHORT, 0);
    }

    /* On ne juge que sur une fenêtre pleine : les toutes premières images
       portent le téléversement des textures, qui ne se reproduit pas. */
    spent += performance.now() - t0;
    if (++seen >= WATCH) {
      const moy = spent / seen;
      if (moy > BUDGET_MS) retire('coût moyen ' + moy.toFixed(1) + ' ms par image');
      spent = 0; seen = 0;
    }
  }

  gsap.ticker.add(frame);
  ScrollTrigger.addEventListener('refresh', collect);
  window.addEventListener('resize', () => { resize(); release(); }, { passive: true });

  // Le contexte peut être repris par le système : on se retire proprement
  // plutôt que de dessiner dans le vide.
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    gsap.ticker.remove(frame);
    release();
    canvas.remove();
  });
}
