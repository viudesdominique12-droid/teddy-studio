import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
const walk = (n, d) => {
  const kids = n.listChildren();
  const mesh = n.getMesh();
  if (d < 6 && (kids.length > 0 || /turntable/i.test(n.getName()))) {
    const t = n.getTranslation().map(v => +v.toFixed(2)), r = n.getRotation().map(v => +v.toFixed(3)), s = n.getScale().map(v => +v.toFixed(3));
    console.log('  '.repeat(d) + `${n.getName()} [${kids.length} kids${mesh ? ', mesh ' + mesh.getName() : ''}] T${t} R${r} S${s}`);
  }
  kids.forEach(k => walk(k, d + 1));
};
scene.listChildren().forEach(n => walk(n, 0));
