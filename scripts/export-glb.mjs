// Builds the procedural model and writes it to build/flinders.glb.
import { mkdirSync, writeFileSync } from 'node:fs';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildStation } from '../src/station.js';

// GLTFExporter uses the browser FileReader; Node has Blob but no FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => { this.result = buf; this.onloadend?.(); });
  }
};

const scene = buildStation();
let tris = 0;
scene.traverse((o) => { if (o.isMesh) tris += o.geometry.attributes.position.count / 3; });

new GLTFExporter().parse(scene, (glb) => {
  mkdirSync('build', { recursive: true });
  writeFileSync('build/flinders.glb', Buffer.from(glb));
  console.log(`build/flinders.glb: ${(glb.byteLength / 1e6).toFixed(1)} MB, ${Math.round(tris)} triangles`);
}, (err) => { throw err; }, { binary: true });
