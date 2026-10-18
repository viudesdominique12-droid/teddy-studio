/**
 * THREE.JS, CE QUE L'ACCUEIL EN UTILISE (18/10/2026).
 *
 * `import('three')` tirait toute la bibliothèque (un module de 700 Ko,
 * l'arbre ne peut rien en retirer quand on prend l'espace de noms entier).
 * Ici, seulement les classes que `kit3d.js` (le matériel) et `reel3d.js` (la
 * bobine des lieux) appellent : le reste tombe à la construction. Une classe
 * oubliée lèverait au démarrage de la scène, qui prendrait alors ses photos
 * (le repli existant) : en ajouter une ici si l'on s'en sert là-bas.
 */
export {
  Box3,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  GridHelper,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three';
