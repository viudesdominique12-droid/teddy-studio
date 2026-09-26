// Prépare un modèle pour le web. usage :
// node process2.mjs in.glb out.glb '{"ratio":0.3,"error":0.001,"tex":1024,"rough":512,"metalRough":false,"drop":[]}'
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, weld, simplify, prune, textureCompress, meshopt, instance, metalRough } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [inp, out, json] = process.argv.slice(2);
const o = Object.assign({ ratio: 0.3, error: 0.001, tex: 1024, rough: 512, metalRough: false, drop: [] }, JSON.parse(json || '{}'));
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inp);
const root = doc.getRoot();
for (const node of root.listNodes()) {
  const n = node.getName() || '';
  if (o.drop.some((d) => new RegExp(d).test(n))) { console.log('drop', n); node.dispose(); }
}
const tri = () => Math.round(root.listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() || 0) / 3, 0), 0));
const before = tri();
const steps = [prune(), dedup()];
if (o.metalRough) steps.push(metalRough());
steps.push(
  instance({ min: 5 }), flatten(), join(), weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: o.ratio, error: o.error }),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /metallicRoughness|occlusion/, resize: [o.rough, o.rough], quality: 86 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [o.tex, o.tex], quality: 88 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' })
);
await doc.transform(...steps);
console.log('triangles', before, '->', tri(), '| meshes', root.listMeshes().length, '| materials', root.listMaterials().length, '| textures', root.listTextures().map((t) => t.getImage()?.byteLength).join(','));
await io.write(out, doc);
