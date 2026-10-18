/**
 * THREE.JS, CE QUE L'OUVERTURE D'EQUIPMENT RENTALS EN UTILISE (18/10/2026).
 *
 * `import('three')` tirait toute la bibliothèque (l'arbre ne peut rien en
 * retirer quand on prend l'espace de noms entier). Ici, seulement les classes
 * que `rentals.js` appelle (`THREE.…`) : le reste tombe à la construction. Une
 * classe oubliée lèverait au démarrage de la scène, qui prendrait alors la
 * photo de la caméra (le repli existant) : en ajouter une ici si l'on s'en
 * sert là-bas.
 */
export {
  Box3,
  CanvasTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
