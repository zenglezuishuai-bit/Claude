// Procedural model of Flinders Street Station and its surroundings.
// Shared by the browser viewer (web/) and the Node GLB exporter (scripts/).
//
// Coordinates: metres, Y up, +X east, -Z north. The station's Flinders Street
// facade lies on z = 0 and runs west from Swanston Street (x = 0) to
// Elizabeth Street (x ≈ -207). Dimensions are estimates from photographs and
// public descriptions, not survey data.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------
// Materials (viewer colours; Blender replaces these by name)

export const MATERIALS = {
  brick:     { color: 0x9c3d27, roughness: 0.9 },
  render:    { color: 0xd6bd8a, roughness: 0.8 },
  trim:      { color: 0xe8d8b2, roughness: 0.75 },
  groove:    { color: 0xa08b66, roughness: 0.9 },
  mullion:   { color: 0x2e4636, roughness: 0.5 },
  columns:   { color: 0x4d5862, roughness: 0.5 },
  board:     { color: 0xe6c34a, roughness: 0.5 },
  signboard: { color: 0x1f3a2c, roughness: 0.5 },
  copper:    { color: 0x587f6a, roughness: 0.55, metalness: 0.3 },
  glass:     { color: 0x1d2a33, roughness: 0.15, metalness: 0.6 },
  roof:      { color: 0x55595c, roughness: 0.7, metalness: 0.2 },
  stone:     { color: 0x9a9690, roughness: 0.85 },
  clockface: { color: 0xf8f6ee, roughness: 0.4, emissive: 0x302c22 },
  clockdark: { color: 0x15181a, roughness: 0.5 },
  asphalt:   { color: 0x3b3d40, roughness: 0.95 },
  pavement:  { color: 0xb3ada3, roughness: 0.9 },
  marking:   { color: 0xeeeeee, roughness: 0.8 },
  rail:      { color: 0x8c8f93, roughness: 0.35, metalness: 0.8 },
  ballast:   { color: 0x5d5650, roughness: 1.0 },
  concrete:  { color: 0xb8b4ab, roughness: 0.9 },
  canopy:    { color: 0x8e9497, roughness: 0.5, metalness: 0.4 },
  water:     { color: 0x3c5a5c, roughness: 0.1, metalness: 0.2 },
  grass:     { color: 0x5f7d3f, roughness: 1.0 },
  foliage:   { color: 0x4b6b32, roughness: 1.0 },
  bark:      { color: 0x4a3a2c, roughness: 1.0 },
  bldg1:     { color: 0xd9d2c3, roughness: 0.85 },
  bldg2:     { color: 0xc4b59b, roughness: 0.85 },
  bldg3:     { color: 0x9c9a95, roughness: 0.8 },
  bldg4:     { color: 0xb87f5c, roughness: 0.9 },
  bldg5:     { color: 0xe6e3dc, roughness: 0.8 },
  curtain:   { color: 0x5d7486, roughness: 0.2, metalness: 0.5 },
  sandstone: { color: 0xa79a80, roughness: 0.9 },
  slate:     { color: 0x4a4f55, roughness: 0.7 },
  fedsq:     { color: 0xbfa27a, roughness: 0.85 },
  zinc:      { color: 0x8f969b, roughness: 0.45, metalness: 0.6 },
  gold:      { color: 0xd7a740, roughness: 0.25, metalness: 1.0 },
  tram:      { color: 0xf2f2ee, roughness: 0.35 },
  tramgreen: { color: 0x2f8f4e, roughness: 0.4 },
  paint1:    { color: 0x2a3a52, roughness: 0.3, metalness: 0.4 },
  paint2:    { color: 0xb8bcc0, roughness: 0.3, metalness: 0.5 },
  paint3:    { color: 0x8e2a26, roughness: 0.3, metalness: 0.4 },
  tyre:      { color: 0x1a1a1a, roughness: 0.9 },
};

export function createMaterials() {
  const out = {};
  for (const [name, p] of Object.entries(MATERIALS)) {
    const m = new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: p.roughness ?? 0.8,
      metalness: p.metalness ?? 0,
      emissive: p.emissive ?? 0x000000,
    });
    m.name = name;
    out[name] = m;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Clickable parts with descriptions and camera presets for the viewer.

export const PARTS = {
  dome: {
    title: '主入口与铜穹顶',
    subtitle: 'Swanston St 转角',
    text: '入口斜对着 Flinders 与 Swanston 街口：大拱门里是站名招牌和一排显示各线下一班车的时钟，"Under the clocks"（钟下见）是墨尔本人最常用的碰头暗号。上方是带钟的三角山花，再往上是带肋的铜穹顶和灯笼亭，两侧角楼各有一个小铜穹顶。',
    view: { pos: [30, 12, -30], target: [-14, 15, 12] },
  },
  clocktower: {
    title: '钟楼',
    subtitle: 'Elizabeth St 转角',
    text: '红砖与米色抹灰相间的条纹钟楼，正对着 Elizabeth Street 的街轴。四面钟面之上是开敞的瞭望亭，四角立着方尖小塔，顶上是一座小穹顶。',
    view: { pos: [-190, 24, -78], target: [-190, 34, 4] },
  },
  facade: {
    title: 'Flinders Street 立面',
    subtitle: '红砖嵌板 + 米色抹灰墙柱',
    text: '主楼沿 Flinders Street 延伸约 250 米。底层是一排弧拱商铺，上面三层窗嵌在红砖板里，墙柱是带横向分缝的米色抹灰，屋顶线是一整排栏杆，凸出的入口亭顶着弧形山墙或成对的小铜穹顶。顶层曾有一间舞厅，后来长期空置。',
    view: { pos: [-95, 22, -70], target: [-115, 10, 0] },
  },
  centre: {
    title: '中央入口',
    subtitle: '对着 Degraves St',
    text: '立面中段的入口亭，比两侧略高、向外突出，以弧形山墙和两座小铜顶塔楼收头，打断了长立面的节奏。',
    view: { pos: [-90, 18, -45], target: [-110, 12, 0] },
  },
  platforms: {
    title: '站台与雨棚',
    subtitle: '主楼南侧',
    text: '主楼背后是一排平行的站台，上方是钢结构雨棚，再往南就是亚拉河（Yarra River）。',
    view: { pos: [-40, 70, 190], target: [-150, 2, 65] },
  },
  stpauls: {
    title: '圣保罗座堂',
    subtitle: 'St Paul\'s Cathedral（对面街角）',
    text: '英国国教座堂，由 William Butterfield 设计，1891 年祝圣；尖塔 1926–1933 年间才加建。与车站隔着路口相望。',
    view: { pos: [10, 40, -10], target: [70, 25, -70] },
  },
  fedsq: {
    title: '联邦广场',
    subtitle: 'Federation Square（对面街角）',
    text: '2002 年开放的公共广场与文化建筑群，以碎片化的几何体和三角形拼板立面著称。（本模型为简化示意）',
    view: { pos: [20, 40, 150], target: [80, 5, 60] },
  },
  youngjackson: {
    title: 'Young & Jackson 酒店',
    subtitle: '对面街角',
    text: '车站对面的老牌酒馆，19 世纪中期起就是街角地标。',
    view: { pos: [20, 15, -10], target: [-12, 8, -40] },
  },
  eureka: {
    title: 'Eureka Tower',
    subtitle: 'Southbank（河对岸）',
    text: '2006 年竣工的住宅塔楼，高约 297 米，顶部若干层窗户为镀金玻璃。（远景示意）',
    view: { pos: [-60, 120, 40], target: [-160, 150, 300] },
  },
  city: {
    title: '周边街区',
    subtitle: '示意体块',
    text: '周边建筑为程序生成的示意体块，只表达大致的城市尺度，并非真实建筑。',
    view: { pos: [-60, 90, 60], target: [-100, 20, -100] },
  },
};

// ---------------------------------------------------------------------------
// Geometry plumbing

const KEEP = ['position', 'normal', 'uv'];

function clean(g) {
  if (g.index) g = g.toNonIndexed();
  for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k)) g.deleteAttribute(k);
  if (!g.attributes.uv) {
    const n = g.attributes.position.count;
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  }
  g.clearGroups();
  return g;
}

class Part {
  constructor(key) {
    this.key = key;
    this.buckets = new Map();
  }
  add(mat, geom) {
    if (!MATERIALS[mat]) throw new Error('unknown material ' + mat);
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat).push(clean(geom));
  }
  // Axis-aligned world box: x0..x1, y0..y1, z0..z1.
  box(mat, x0, x1, y0, y1, z0, z1) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(mat, g);
  }
  build(materials) {
    const group = new THREE.Group();
    group.name = this.key;
    for (const [mat, list] of this.buckets) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), materials[mat]);
      mesh.name = `${this.key}__${mat}`;
      mesh.userData.part = this.key;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }
}

// A local frame on a wall: local +x runs along the wall, +y up, +z points
// out of the wall. `ry` rotates local axes into world axes.
const FACING = { north: Math.PI, south: 0, east: Math.PI / 2, west: -Math.PI / 2 };

class Frame {
  constructor(part, ox, oz, facing) {
    this.part = part;
    this.mat = new THREE.Matrix4()
      .makeTranslation(ox, 0, oz)
      .multiply(new THREE.Matrix4().makeRotationY(typeof facing === 'number' ? facing : FACING[facing]));
  }
  add(mat, g, lx = 0, ly = 0, lz = 0) {
    g.translate(lx, ly, lz);
    g.applyMatrix4(this.mat);
    this.part.add(mat, g);
  }
  box(mat, x0, x1, y0, y1, z0, z1) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    this.add(mat, g, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  }
  // The same frame pushed `dz` out of the wall, for elements on a projecting face.
  offset(dz) {
    const f = Object.create(Frame.prototype);
    f.part = this.part;
    f.mat = this.mat.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, dz));
    return f;
  }
  // Arched (round-headed) window: glass with a projecting surround.
  arch(cx, y0, w, h, { t = 0.35, depth = 0.3, mat = 'trim', mullions = 0, transom = true, sill = true } = {}) {
    this.add('glass', new THREE.ShapeGeometry(archShape(THREE.Shape, cx, y0, w, h), 10), 0, 0, 0.04);
    const outer = archShape(THREE.Shape, cx, y0, w + 2 * t, h + t);
    outer.holes.push(archShape(THREE.Path, cx, y0, w, h));
    this.add(mat, new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, curveSegments: 10 }));
    const bar = Math.min(0.12, w * 0.05);
    const spring = y0 + h - w / 2;
    for (let i = 1; i <= mullions; i++) {
      const x = cx - w / 2 + (w * i) / (mullions + 1);
      this.box('trim', x - bar, x + bar, y0, spring + (w / 2) * Math.sqrt(1 - ((x - cx) / (w / 2)) ** 2), 0, 0.12);
    }
    if (transom && h > w) this.box('trim', cx - w / 2, cx + w / 2, spring - bar, spring + bar, 0, 0.12);
    if (sill) this.box('trim', cx - w / 2 - t - 0.1, cx + w / 2 + t + 0.1, y0 - 0.25, y0, 0, depth + 0.12);
  }
  rectWindow(cx, y0, w, h, { t = 0.25, depth = 0.25 } = {}) {
    this.box('glass', cx - w / 2, cx + w / 2, y0, y0 + h, 0, 0.05);
    this.box('trim', cx - w / 2 - t, cx - w / 2, y0, y0 + h, 0, depth);
    this.box('trim', cx + w / 2, cx + w / 2 + t, y0, y0 + h, 0, depth);
    this.box('trim', cx - w / 2 - t, cx + w / 2 + t, y0 + h, y0 + h + t * 1.6, 0, depth + 0.05);
    this.box('trim', cx - w / 2 - t - 0.1, cx + w / 2 + t + 0.1, y0 - 0.22, y0, 0, depth + 0.1);
  }
  clock(cx, cy, r, z = 0.2) {
    this.add('clockdark', new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.25, 40).rotateX(Math.PI / 2), cx, cy, z);
    this.add('clockface', new THREE.CircleGeometry(r, 40), cx, cy, z + 0.13);
    this.box('clockdark', cx - 0.06 * r, cx + 0.06 * r, cy, cy + 0.75 * r, z + 0.14, z + 0.18);
    const hand = new THREE.BoxGeometry(0.55 * r, 0.1 * r, 0.04).translate(0.27 * r, 0, 0).rotateZ(-0.6);
    this.add('clockdark', hand, cx, cy, z + 0.16);
  }
}

function archShape(Cls, cx, y0, w, h) {
  const s = new Cls();
  const r = w / 2;
  const ys = y0 + Math.max(h - r, 0);
  s.moveTo(cx - r, y0);
  s.lineTo(cx + r, y0);
  s.lineTo(cx + r, ys);
  s.absarc(cx, ys, r, 0, Math.PI, false);
  s.lineTo(cx - r, y0);
  return s;
}

// Segmental (curved) gable as an extruded slab in a Frame.
function curvedGable(f, cx, y0, w, rise, mat = 'render', depth = 0.6) {
  const s = new THREE.Shape();
  s.moveTo(cx - w / 2, y0);
  s.lineTo(cx + w / 2, y0);
  s.quadraticCurveTo(cx + w / 2, y0 + rise * 0.9, cx, y0 + rise);
  s.quadraticCurveTo(cx - w / 2, y0 + rise * 0.9, cx - w / 2, y0);
  f.add(mat, new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 }), 0, 0, -depth + 0.3);
}

function lathe(profile, segs = 32) {
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segs);
}

// Dome profile: radius r, height h, slight bell at the base.
function domeProfile(r, h, n = 18) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push([Math.max(r * Math.cos(a), 0.001), h * Math.sin(a)]);
  }
  return pts;
}

function cupola(part, x, y, z, r, h, { mat = 'copper', finial = true } = {}) {
  part.add(mat, lathe(domeProfile(r, h), 24).translate(x, y, z));
  if (finial) {
    part.add(mat, new THREE.CylinderGeometry(r * 0.08, r * 0.12, h * 0.5, 8).translate(x, y + h + h * 0.25, z));
    part.add(mat, new THREE.SphereGeometry(r * 0.13, 10, 8).translate(x, y + h + h * 0.55, z));
  }
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Station layout. Plan dimensions are measured from
// reference/12-satellite-north-up.jpg (~0.47 m/px); heights are estimated from
// the reference photographs. The model is aligned to the Hoddle grid: +X runs
// along Flinders St, which really bears about 71° (ENE), so the viewer and the
// Blender script rotate the sun by GRID_BEARING to keep shadows true.

export const GRID_BEARING = 71;

const ST = {
  west: -252,       // west end of the Flinders St building
  depth: 21,        // depth of the main block
  eave: 20,         // main cornice height
  block: 36,        // dome block footprint (square [-36,0] x [0,36]) ...
  chamfer: 24,      // ... minus the corner cut facing the intersection
  tower: -190,      // clock tower centre, on the Elizabeth St axis
  river: 118,       // north bank of the Yarra
};

// Segmental arch: straight jambs to `ys`, then an arc of the given rise.
function segArchShape(Cls, cx, y0, w, ys, rise) {
  const s = new Cls();
  const r = w / 2;
  const R = (rise * rise + r * r) / (2 * rise);
  const cy = ys + rise - R;
  const a0 = Math.atan2(ys - cy, r);
  s.moveTo(cx - r, y0);
  s.lineTo(cx + r, y0);
  s.lineTo(cx + r, ys);
  s.absarc(cx, cy, R, a0, Math.PI - a0, false);
  s.lineTo(cx - r, y0);
  return s;
}

// Balustrade in a Frame: plinth, balusters, rail.
function balustrade(f, a, b, y, z0 = 0, depth = 0.45, h = 1.15) {
  f.box('trim', a, b, y, y + 0.22, z0, z0 + depth);
  for (let x = a + 0.3; x < b - 0.15; x += 0.42) {
    f.add('trim', new THREE.CylinderGeometry(0.08, 0.11, h - 0.45, 6), x, y + 0.22 + (h - 0.45) / 2, z0 + depth / 2);
  }
  f.box('trim', a, b, y + h - 0.23, y + h, z0 - 0.03, z0 + depth + 0.03);
}

// Horizontal rustication grooves on a face strip (local x a..b, y0..y1).
function rusticate(f, a, b, y0, y1, z, step = 0.75) {
  for (let y = y0 + step; y < y1 - 0.1; y += step) f.box('groove', a, b, y - 0.035, y + 0.035, z - 0.02, z + 0.015);
}

// Bulbous copper dome with a small lantern, at a world position.
function onionDome(part, x, y, z, r, h) {
  const prof = [[r, 0], [r * 1.07, h * 0.18], [r * 1.02, h * 0.38], [r * 0.8, h * 0.62], [r * 0.45, h * 0.84], [r * 0.12, h * 0.97], [0.01, h]];
  part.add('copper', lathe(prof, 24).translate(x, y, z));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pts = prof.slice(0, 6).map(([pr, py]) => new THREE.Vector3(x + (pr + 0.04) * Math.cos(a), y + py, z + (pr + 0.04) * Math.sin(a)));
    part.add('copper', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, r * 0.035, 5, false));
  }
  part.add('copper', new THREE.CylinderGeometry(r * 0.22, r * 0.26, h * 0.35, 8).translate(x, y + h + h * 0.15, z));
  cupola(part, x, y + h + h * 0.32, z, r * 0.26, h * 0.22);
}

// ---------------------------------------------------------------------------
// Flinders St facade: arcade of segmental arches at street level, three
// floors of windows in red brick panels between rusticated buff pilasters,
// balustraded parapet, and projecting pavilions with shaped gables or paired
// copper domes.

const FEATURES = [
  { c: -60, w: 14, kind: 'gable' },
  { c: -110, w: 18, kind: 'centre' },
  { c: -160, w: 14, kind: 'twin' },
  { c: -190, w: 11, kind: 'tower' },   // clock tower, built separately
  { c: -220, w: 14, kind: 'gable' },
];

function bay(f, a, b) {
  const cx = (a + b) / 2;
  const bw = b - a;
  // Ground-floor arcade arch: shopfront below the transom, lunette above.
  const w = bw - 2.2;
  const ys = 4.3, rise = 2.1;
  f.add('glass', new THREE.ShapeGeometry(segArchShape(THREE.Shape, cx, 0.9, w, ys, rise), 10), 0, 0, 0.04);
  const outer = segArchShape(THREE.Shape, cx, 0.9, w + 1.2, ys, rise + 0.75);
  outer.holes.push(segArchShape(THREE.Path, cx, 0.9, w, ys, rise));
  f.add('render', new THREE.ExtrudeGeometry(outer, { depth: 0.4, bevelEnabled: false, curveSegments: 12 }));
  f.box('trim', cx - 0.45, cx + 0.45, ys + rise - 0.3, ys + rise + 1.0, 0, 0.55);
  f.box('mullion', cx - w / 2, cx + w / 2, ys - 0.08, ys + 0.08, 0, 0.12);
  for (let i = 1; i < 4; i++) f.box('mullion', cx - w / 2 + (w * i) / 4 - 0.06, cx - w / 2 + (w * i) / 4 + 0.06, 0.9, ys + rise * 0.8, 0, 0.1);
  // Brick panel windows: two floors of rectangular windows, arched on top.
  const n = 3;
  const sp = (bw - 2.4) / n;
  for (let i = 0; i < n; i++) {
    const x = a + 1.2 + sp * (i + 0.5);
    f.rectWindow(x, 8.5, 1.25, 2.5, { t: 0.22, depth: 0.22 });
    f.rectWindow(x, 12.6, 1.25, 2.4, { t: 0.22, depth: 0.22 });
    f.arch(x, 16.4, 1.15, 2.3, { t: 0.22, transom: false });
  }
}

function pilaster(f, x, y0, y1, w = 1.5, d = 0.4) {
  f.box('render', x - w / 2, x + w / 2, y0, y1, 0, d);
  rusticate(f, x - w / 2, x + w / 2, y0, y1, d);
}

function pavilion(f, pv, a, b) {
  const E = ST.eave;
  const w = b - a, mid = (a + b) / 2, P = 1.2;
  const top = pv.kind === 'centre' ? E + 4 : E + 2.5;
  f.box('brick', a, b, 0, top, 0, P);
  // Corner pilasters and a central pair.
  for (const x of [a + 0.9, b - 0.9]) { f.box('render', x - 0.9, x + 0.9, 0, top, 0, P + 0.4); rusticate(f, x - 0.9, x + 0.9, 0, top, P + 0.4); }
  f.box('trim', a - 0.3, b + 0.3, 7.2, 7.8, 0, P + 0.55);
  f.box('trim', a - 0.2, b + 0.2, 11.6, 12.0, 0, P + 0.4);
  f.box('trim', a - 0.2, b + 0.2, 15.6, 16.0, 0, P + 0.4);
  f.box('trim', a - 0.5, b + 0.5, top - 0.7, top, 0, P + 0.8);
  const g = f.offset(P);
  if (pv.kind === 'centre') {
    // Degraves St entrance: tall round arch, windows grouped above.
    g.box('stone', mid - 5.5, mid + 5.5, 0, 0.45, 0, 3.2);
    g.arch(mid, 0.45, 6.4, 8.6, { t: 0.8, depth: 0.6, mat: 'render', transom: true, mullions: 2, sill: false });
    for (const dx of [-5, 5]) g.arch(mid + dx, 1.0, 1.6, 4.2, { t: 0.3, sill: false });
    for (const dx of [-3.4, 0, 3.4]) g.arch(mid + dx, 12.4, 1.4, 3.2, { t: 0.25 });
    for (const dx of [-3.4, 0, 3.4]) g.arch(mid + dx, 16.8, 1.3, 2.6, { t: 0.22 });
  } else {
    g.arch(mid, 0.9, w - 5, 5.6, { t: 0.5, depth: 0.4, mat: 'render', mullions: 2, sill: false });
    for (const dx of [-2.6, 0, 2.6]) g.rectWindow(mid + dx, 8.5, 1.3, 2.5);
    for (const dx of [-2.6, 2.6]) g.rectWindow(mid + dx, 12.6, 1.3, 2.4);
    g.arch(mid, 12.4, 2.0, 3.2, { t: 0.3, mullions: 1 });
    for (const dx of [-2.6, 0, 2.6]) g.arch(mid + dx, 16.6, 1.2, 2.4, { t: 0.22, transom: false });
  }
  // Top: shaped gable, or a pair of turrets with copper domes.
  if (pv.kind === 'gable' || pv.kind === 'centre') {
    curvedGable(f, mid, top, w * 0.72, w * 0.36, 'render', 1.2);
    f.add('trim', new THREE.CircleGeometry(1.15, 24), mid, top + w * 0.14, 1.31);
    f.add('glass', new THREE.CircleGeometry(0.85, 24), mid, top + w * 0.14, 1.33);
    for (const x of [mid - w * 0.36, mid + w * 0.36]) f.add('trim', new THREE.ConeGeometry(0.35, 2.2, 6), x, top + 1.1, 0.6);
  }
  if (pv.kind === 'twin' || pv.kind === 'centre') {
    for (const x of [a + 1.6, b - 1.6]) {
      f.box('render', x - 1.5, x + 1.5, top, top + 2.4, -1.6, 1.4);
      f.box('trim', x - 1.7, x + 1.7, top + 2.4, top + 2.8, -1.8, 1.6);
      const v = new THREE.Vector3(x, 0, -0.1).applyMatrix4(f.mat);
      onionDome(f.part, v.x, top + 2.8, v.z, 1.55, 3.0);
    }
  }
  balustrade(f, a + 1.8, b - 1.8, top, 0.3);
}

function buildFacade(parts) {
  const P = parts.facade;
  const E = ST.eave;
  const x1 = -ST.block;          // east end of the long facade
  const x0 = ST.west + 16;        // west end pavilion begins here
  P.box('brick', x0 - 0.01, x1, 0, E, 0, ST.depth);
  hippedRoof(P, x0 + 1, x1 - 1, E + 1.2, 4.2, 1, ST.depth - 1);
  for (const y of [7.2, 11.6, 15.6]) P.box('render', x0, x1, y, y + 0.4, ST.depth - 0.01, ST.depth + 0.15);

  const lx = (wx) => x1 - wx;
  const L = lx(x0);
  const f = new Frame(P, x1, 0, 'north');
  const fc = new Frame(parts.centre, x1, 0, 'north');

  // Continuous horizontal elements.
  f.box('stone', 0, L, 0, 0.9, 0, 0.45);
  f.box('trim', 0, L, 7.2, 7.8, 0, 0.55);
  f.box('trim', 0, L, 11.6, 12.0, 0, 0.35);
  f.box('trim', 0, L, 15.6, 16.0, 0, 0.35);
  f.box('render', 0, L, E - 1.2, E - 0.6, 0, 0.3);
  f.box('trim', 0, L, E - 0.6, E, 0, 0.85);
  balustrade(f, 0, L, E, 0.1);

  // Gaps between features are filled with ~10 m bays.
  const feats = FEATURES.map((p) => ({ ...p, a: lx(p.c + p.w / 2), b: lx(p.c - p.w / 2) })).sort((p, q) => p.a - q.a);
  let cur = 0;
  const gaps = [];
  for (const p of feats) { gaps.push([cur, p.a]); cur = p.b; }
  gaps.push([cur, L]);
  for (const [g0, g1] of gaps) {
    const n = Math.max(1, Math.round((g1 - g0) / 10));
    const bw = (g1 - g0) / n;
    for (let i = 0; i < n; i++) bay(f, g0 + i * bw, g0 + (i + 1) * bw);
    for (let i = 0; i <= n; i++) pilaster(f, g0 + i * bw, 0.9, E - 1.2);
  }
  for (const p of feats) if (p.kind !== 'tower') pavilion(p.kind === 'centre' ? fc : f, p, p.a, p.b);

  // Street verandah on the shopfronts.
  for (const [g0, g1] of gaps) {
    f.box('canopy', g0 + 0.3, g1 - 0.3, 4.55, 4.75, 0.5, 3.6);
    f.box('render', g0 + 0.3, g1 - 0.3, 4.75, 5.05, 3.4, 3.6);
  }

  buildWestEnd(parts, x0);
}

function hippedRoof(part, x0, x1, y, h, z0, z1) {
  const g = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1).rotateY(Math.PI / 4);
  // After the 45° turn the base is a square of half-size SQRT1_2.
  g.scale((x1 - x0) / 2 / Math.SQRT1_2, h, (z1 - z0) / 2 / Math.SQRT1_2);
  g.translate((x0 + x1) / 2, y + h / 2, (z0 + z1) / 2);
  part.add('slate', g);
}

// West end: corner pavilion with a copper dome on an octagonal drum.
function buildWestEnd(parts, xe) {
  const P = parts.facade;
  const E = ST.eave;
  const x0 = ST.west, z1 = ST.depth + 4;
  P.box('brick', x0, xe, 0, E + 1, 0, z1);
  hippedRoof(P, x0 + 1, xe - 1, E + 1.6, 3.5, 1, z1 - 1);
  for (const [ox, oz, facing, w] of [[xe, 0, 'north', xe - x0], [x0, 0, 'west', z1]]) {
    const f = new Frame(P, ox, oz, facing);
    f.box('stone', 0, w, 0, 0.9, 0, 0.45);
    f.box('trim', 0, w, 7.2, 7.8, 0, 0.55);
    f.box('trim', 0, w, E + 0.4, E + 1.0, 0, 0.85);
    const n = Math.round(w / 8);
    for (let i = 0; i < n; i++) bay(f, (w * i) / n, (w * (i + 1)) / n);
    for (let i = 0; i <= n; i++) pilaster(f, (w * i) / n, 0.9, E + 0.4);
    balustrade(f, 0, w, E + 1.0, 0.1);
  }
  // Corner tower and dome at the north-west corner.
  const cx = x0 + 4, cz = 4;
  P.box('render', cx - 4.6, cx + 4.6, 0, E + 4, cz - 4.6, cz + 4.6);
  for (const [ox, oz, facing] of [[cx + 4.6, cz - 4.6, 'north'], [cx - 4.6, cz - 4.6, 'west']]) {
    const f = new Frame(P, ox, oz, facing);
    rusticate(f, 0, 9.2, 0, E + 4, 0.02);
    f.arch(4.6, 1.0, 2.6, 5.0, { t: 0.4, sill: false });
    f.arch(4.6, 8.4, 1.8, 3.4, { t: 0.3 });
    f.arch(4.6, 12.6, 1.8, 3.2, { t: 0.3 });
    f.arch(4.6, 16.8, 1.6, 2.8, { t: 0.28 });
  }
  P.box('trim', cx - 5, cx + 5, E + 4, E + 4.6, cz - 5, cz + 5);
  P.add('render', new THREE.CylinderGeometry(3.9, 4.1, 2.6, 8).rotateY(Math.PI / 8).translate(cx, E + 5.9, cz));
  P.add('trim', new THREE.CylinderGeometry(4.3, 4.3, 0.35, 8).rotateY(Math.PI / 8).translate(cx, E + 7.35, cz));
  onionDome(P, cx, E + 7.5, cz, 3.9, 5.6);
}

// ---------------------------------------------------------------------------
// Dome block: a chamfered corner facing the Flinders/Swanston intersection.

function buildDome(parts) {
  const P = parts.dome;
  const B = ST.block, K = ST.chamfer, H = 21;

  // Plan as an extruded shape (shape y = -world z).
  const plan = new THREE.Shape();
  plan.moveTo(-B, 0); plan.lineTo(-K, 0); plan.lineTo(0, -K); plan.lineTo(0, -B); plan.lineTo(-B, -B); plan.lineTo(-B, 0);
  P.add('render', new THREE.ExtrudeGeometry(plan, { depth: H, bevelEnabled: false }).rotateX(-Math.PI / 2));
  P.add('roof', new THREE.ExtrudeGeometry(plan, { depth: 0.3, bevelEnabled: false }).rotateX(-Math.PI / 2).scale(0.96, 1, 0.96).translate(-0.7, H, 0.7));

  // Entrance face, seen from the intersection: local x runs from the
  // Swanston St end (0, K) to the Flinders St end (-K, 0).
  const Wf = K * Math.SQRT2;
  const mid = Wf / 2;
  const f = new Frame(P, 0, K, (3 * Math.PI) / 4);

  // Corner towers with copper domes.
  for (const [a, b] of [[0, 6.2], [Wf - 6.2, Wf]]) {
    const c = (a + b) / 2;
    f.box('render', a, b, 0, H + 1.6, -6, 1.0);
    rusticate(f, a, b, 0.9, H + 1.6, 1.0);
    f.box('stone', a - 0.2, b + 0.2, 0, 0.9, -6, 1.3);
    const tf = f.offset(1.0);
    tf.arch(c, 0.9, 2.4, 4.4, { t: 0.4, sill: false });
    tf.arch(c, 8.4, 1.7, 3.6, { t: 0.32 });
    tf.rectWindow(c, 13.2, 1.6, 2.4, { t: 0.26 });
    tf.arch(c, 17.0, 1.4, 2.4, { t: 0.26 });
    f.box('trim', a - 0.4, b + 0.4, H + 1.6, H + 2.2, -6.4, 1.5);
    f.box('render', a + 0.5, b - 0.5, H + 2.2, H + 4.2, -5.5, 0.6);
    f.box('trim', a + 0.3, b - 0.3, H + 4.2, H + 4.6, -5.7, 0.8);
    const v = new THREE.Vector3(c, 0, -2.5).applyMatrix4(f.mat);
    onionDome(P, v.x, H + 4.6, v.z, 2.6, 4.4);
  }

  // Central frontispiece between the towers.
  const c0 = 6.2, c1 = Wf - 6.2;
  // Side bays: brick panels with doors and arched windows.
  for (const [a, b] of [[c0, c0 + 5.2], [c1 - 5.2, c1]]) {
    const c = (a + b) / 2;
    f.box('brick', a + 0.6, b - 0.6, 6.8, 16.2, 0, 0.06);
    f.arch(c, 0.9, 2.6, 4.6, { t: 0.42, depth: 0.45, sill: false });
    f.arch(c, 7.6, 2.2, 4.0, { t: 0.36, depth: 0.4 });
    f.rectWindow(c, 13.0, 2.0, 2.6, { t: 0.3, depth: 0.35 });
    f.box('render', a, a + 0.6, 0, 17.6, 0, 0.3);
    f.box('render', b - 0.6, b, 0, 17.6, 0, 0.3);
  }
  rusticate(f, c0, c1, 0.9, 16.2, 0.02, 0.7);

  // Steps up to the entrance.
  for (let s = 0; s < 5; s++) f.box('stone', mid - 9 + s * 0.25, mid + 9 - s * 0.25, s * 0.18, (s + 1) * 0.18, 0.6, 5.0 - s * 0.8);

  // The great arch: glazed lunette, sign, row of clocks, line boards.
  const aw = 11.6, ay = 0.9, spring = 6.0;
  const ah = spring - ay + aw / 2;
  f.add('glass', new THREE.ShapeGeometry(archShape(THREE.Shape, mid, ay, aw, ah), 16), 0, 0, 0.1);
  const arch = archShape(THREE.Shape, mid, ay, aw + 2.8, ah + 1.4);
  arch.holes.push(archShape(THREE.Path, mid, ay, aw, ah));
  f.add('render', new THREE.ExtrudeGeometry(arch, { depth: 1.1, bevelEnabled: false, curveSegments: 20 }));
  for (let i = 0; i <= 14; i++) {
    const t = (i / 14) * Math.PI;
    const g = new THREE.BoxGeometry(0.07, 1.4, 0.06).translate(0, aw / 2 + 0.7, 0).rotateZ(t - Math.PI / 2);
    f.add('groove', g, mid, spring, 1.11);
  }
  f.box('trim', mid - 0.8, mid + 0.8, spring + aw / 2 - 0.2, spring + aw / 2 + 1.6, 0, 1.4);
  f.box('clockdark', mid - aw / 2, mid + aw / 2, ay, 3.2, -0.6, 0.12);
  f.box('board', mid - aw / 2 + 0.2, mid + aw / 2 - 0.2, 3.2, 3.85, 0.1, 0.3);
  for (let k = 0; k < 9; k++) {
    const x = mid - 4.8 + k * 1.2;
    f.box('board', x - 0.42, x + 0.42, 3.3, 3.75, 0.3, 0.33);
    f.clock(x, 4.35, 0.34, 0.2);
  }
  f.box('signboard', mid - aw / 2, mid + aw / 2, 4.85, 5.65, 0.1, 0.35);
  for (let k = 0; k < 21; k++) {
    if (k === 7 || k === 14) continue;
    const x = mid - 4.4 + k * 0.44;
    f.box('board', x - 0.13, x + 0.13, 5.0, 5.5, 0.35, 0.38);
  }
  f.box('mullion', mid - aw / 2, mid + aw / 2, spring - 0.1, spring + 0.1, 0.1, 0.25);
  for (let k = 1; k < 8; k++) {
    const x = mid - aw / 2 + (aw * k) / 8;
    const top = spring + Math.sqrt(Math.max(0, (aw / 2) ** 2 - (x - mid) ** 2));
    f.add('trim', new THREE.CylinderGeometry(0.11, 0.14, top - spring, 8), x, (spring + top) / 2, 0.3);
  }
  for (let k = 1; k < 4; k++) {
    const y = spring + (k * aw) / 2 / 4;
    const hw = Math.sqrt(Math.max(0, (aw / 2) ** 2 - (y - spring) ** 2));
    f.box('mullion', mid - hw, mid + hw, y - 0.05, y + 0.05, 0.1, 0.18);
  }

  // Above the arch: a row of six windows between columns, cornice, pediment.
  f.box('trim', c0, c1, 12.2, 12.8, 0, 1.0);
  for (let k = 0; k < 6; k++) {
    const x = mid - 4.5 + k * 1.8;
    f.box('glass', x - 0.55, x + 0.55, 13.2, 15.8, 0.02, 0.08);
    f.box('mullion', x - 0.04, x + 0.04, 13.2, 15.8, 0.02, 0.12);
  }
  for (let k = 0; k <= 6; k++) {
    const x = mid - 5.4 + k * 1.8;
    f.add('columns', new THREE.CylinderGeometry(0.24, 0.27, 2.8, 12), x, 14.6, 0.95);
  }
  f.box('render', c0, c1, 16.2, 17.6, 0, 1.1);
  f.box('trim', c0 - 0.3, c1 + 0.3, 17.6, 18.2, -0.2, 1.4);
  const ped = new THREE.Shape();
  ped.moveTo(mid - 8.6, 0); ped.lineTo(mid + 8.6, 0); ped.lineTo(mid, 5.0); ped.lineTo(mid - 8.6, 0);
  f.add('render', new THREE.ExtrudeGeometry(ped, { depth: 1.0, bevelEnabled: false }), 0, 18.2, 0);
  const slope = Math.atan2(5.0, 8.6), rl = Math.hypot(8.6, 5.0) + 0.9;
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(rl, 0.55, 1.5).rotateZ(-s * slope);
    f.add('trim', g, mid + s * 4.3, 18.2 + 2.5 + 0.3, 0.5);
  }
  f.add('trim', new THREE.CircleGeometry(1.55, 32), mid, 19.9, 1.02);
  f.clock(mid, 19.9, 1.05, 1.03);
  balustrade(f, c0, c0 + 4.5, 18.2, 0);
  balustrade(f, c1 - 4.5, c1, 18.2, 0);

  // Short return faces on Flinders St and Swanston St.
  for (const [ox, oz, facing] of [[-K, 0, 'north'], [0, B, 'east']]) {
    const r = new Frame(P, ox, oz, facing);
    const w = B - K;
    r.box('stone', 0, w, 0, 0.9, 0, 0.4);
    rusticate(r, 0, w, 0.9, H, 0.02);
    r.box('brick', 1.4, w - 1.4, 6.6, 17.6, 0.02, 0.08);
    r.arch(w / 2, 0.9, 3.0, 4.8, { t: 0.45, sill: false });
    r.arch(w / 2, 7.4, 2.6, 4.4, { t: 0.4 });
    r.arch(w / 2, 13.0, 2.4, 3.8, { t: 0.36 });
    r.box('trim', 0, w, H - 0.6, H, 0, 0.8);
    balustrade(r, 0, w, H, 0.1);
  }

  // Drum with oculi, ribbed copper dome with dormers, lantern and flagpole.
  const cx = -18, cz = 18, y0 = H + 0.3;
  P.add('render', new THREE.CylinderGeometry(9.4, 9.7, 1.0, 48).translate(cx, y0 + 0.5, cz));
  P.add('render', new THREE.CylinderGeometry(8.8, 8.8, 2.6, 48).translate(cx, y0 + 2.3, cz));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const ry = -a + Math.PI / 2;
    P.add('trim', new THREE.TorusGeometry(0.7, 0.18, 6, 20).translate(0, 0, 8.85).rotateY(ry).translate(cx, y0 + 2.3, cz));
    P.add('glass', new THREE.CircleGeometry(0.7, 20).translate(0, 0, 8.83).rotateY(ry).translate(cx, y0 + 2.3, cz));
    const pa = a + Math.PI / 8;
    P.add('trim', new THREE.BoxGeometry(0.8, 2.6, 0.5).translate(0, 0, 8.9).rotateY(-pa + Math.PI / 2).translate(cx, y0 + 2.3, cz));
  }
  P.add('trim', new THREE.CylinderGeometry(9.5, 9.3, 0.6, 48).translate(cx, y0 + 3.9, cz));
  const dY = y0 + 4.2;
  const R = 9.2, DH = 11.2;
  const prof = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * (Math.PI / 2);
    prof.push([Math.max(R * Math.cos(t) ** 0.85, 0.01), DH * Math.sin(t)]);
  }
  P.add('copper', lathe(prof, 64).translate(cx, dY, cz));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pts = prof.slice(0, 22).map(([pr, py]) => new THREE.Vector3(cx + (pr + 0.1) * Math.cos(a), dY + py, cz + (pr + 0.1) * Math.sin(a)));
    P.add('copper', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.17, 6, false));
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const ry = -a + Math.PI / 2;
    P.add('copper', new THREE.CylinderGeometry(1.25, 1.25, 1.4, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).translate(0, 0, 8.4).rotateY(ry).translate(cx, dY + 2.2, cz));
    P.add('trim', new THREE.TorusGeometry(0.75, 0.16, 6, 18).translate(0, 0, 9.15).rotateY(ry).translate(cx, dY + 2.0, cz));
    P.add('glass', new THREE.CircleGeometry(0.75, 18).translate(0, 0, 9.1).rotateY(ry).translate(cx, dY + 2.0, cz));
  }
  const lY = dY + DH - 0.4;
  P.add('copper', new THREE.CylinderGeometry(1.9, 2.2, 0.5, 16).translate(cx, lY + 0.25, cz));
  P.add('copper', new THREE.CylinderGeometry(1.45, 1.45, 2.6, 8).rotateY(Math.PI / 8).translate(cx, lY + 1.8, cz));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    P.add('glass', new THREE.ShapeGeometry(archShape(THREE.Shape, 0, 0, 0.6, 1.7), 6).translate(0, 0, 1.37).rotateY(-a + Math.PI / 2).translate(cx, lY + 0.8, cz));
  }
  P.add('copper', new THREE.CylinderGeometry(1.75, 1.75, 0.3, 16).translate(cx, lY + 3.25, cz));
  cupola(P, cx, lY + 3.4, cz, 1.5, 1.9, { finial: false });
  P.add('rail', new THREE.CylinderGeometry(0.06, 0.09, 7, 6).translate(cx, lY + 8.6, cz));
}

// ---------------------------------------------------------------------------
// Clock tower: banded red brick and cream render, clock stage, open
// belvedere with obelisk pinnacles, small dome.

function buildClockTower(parts) {
  const P = parts.clocktower;
  const w = 9.6, cx = ST.tower, x0 = cx - w / 2, x1 = cx + w / 2, z0 = -1.2, z1 = z0 + w;
  const cz = (z0 + z1) / 2;
  const shaft = 34;

  P.box('brick', x0, x1, 0, shaft, z0, z1);
  for (let y = 1.3; y < shaft - 0.5; y += 1.35) P.box('render', x0 - 0.05, x1 + 0.05, y, y + 0.55, z0 - 0.05, z1 + 0.05);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    P.box('render', x - 0.75, x + 0.75, 0, shaft, z - 0.75, z + 0.75);
  }
  P.box('stone', x0 - 0.9, x1 + 0.9, 0, 1.0, z0 - 0.9, z1 + 0.9);

  for (const [ox, oz, facing] of [[x1, z0, 'north'], [x0, z0, 'west'], [x0, z1, 'south'], [x1, z1, 'east']]) {
    const f = new Frame(P, ox, oz, facing);
    if (facing === 'north') f.arch(w / 2, 1.0, 4.6, 7.0, { t: 0.7, depth: 0.6, mat: 'render', transom: true, mullions: 2, sill: false });
    for (const y of [22.2, 26.4]) { f.arch(w / 2 - 1.1, y, 1.0, 2.8, { t: 0.22, transom: false }); f.arch(w / 2 + 1.1, y, 1.0, 2.8, { t: 0.22, transom: false }); }
    f.box('trim', -0.9, w + 0.9, 20.0, 20.6, 0, 0.7);
    f.box('trim', -0.9, w + 0.9, 30.4, 30.9, 0, 0.6);
    for (let k = 0; k < 4; k++) f.arch(w / 2 - 2.4 + k * 1.6, 31.2, 0.7, 2.2, { t: 0.15, transom: false, sill: false });
  }
  P.box('trim', x0 - 1.0, x1 + 1.0, shaft, shaft + 0.7, z0 - 1.0, z1 + 1.0);

  // Clock stage.
  const c0 = shaft + 0.7;
  P.box('render', x0 + 0.2, x1 - 0.2, c0, c0 + 6.6, z0 + 0.2, z1 - 0.2);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) P.box('trim', x - 0.15, x + 0.75, c0, c0 + 6.6, z - 0.15, z + 0.75);
  for (const [ox, oz, facing] of [[x1 - 0.2, z0 + 0.2, 'north'], [x0 + 0.2, z0 + 0.2, 'west'], [x0 + 0.2, z1 - 0.2, 'south'], [x1 - 0.2, z1 - 0.2, 'east']]) {
    const f = new Frame(P, ox, oz, facing);
    f.add('trim', new THREE.CircleGeometry(2.55, 40), (w - 0.4) / 2, c0 + 3.3, 0.02);
    f.clock((w - 0.4) / 2, c0 + 3.3, 1.95, 0.04);
    curvedGable(f, (w - 0.4) / 2, c0 + 6.6, 6.4, 1.8, 'render', 0.8);
  }
  P.box('trim', x0 - 0.7, x1 + 0.7, c0 + 6.6, c0 + 7.3, z0 - 0.7, z1 + 0.7);

  // Open belvedere.
  const b0 = c0 + 7.3, bh = 5.2;
  P.box('clockdark', x0 + 1.6, x1 - 1.6, b0, b0 + bh - 0.6, z0 + 1.6, z1 - 1.6);
  for (const [ox, oz, facing] of [[x1 - 0.6, z0 + 0.6, 'north'], [x0 + 0.6, z0 + 0.6, 'west'], [x0 + 0.6, z1 - 0.6, 'south'], [x1 - 0.6, z1 - 0.6, 'east']]) {
    const f = new Frame(P, ox, oz, facing);
    const ww = w - 1.2;
    for (const x of [0.5, ww / 3, (2 * ww) / 3, ww - 0.5]) f.box('render', x - 0.45, x + 0.45, b0, b0 + bh, -0.9, 0.1);
    for (let k = 0; k < 3; k++) {
      const s = new THREE.Shape();
      const a = k * (ww / 3) + 0.45, b = (k + 1) * (ww / 3) - 0.45;
      s.moveTo(a, b0 + bh); s.lineTo(b, b0 + bh); s.lineTo(b, b0 + bh - 1.2);
      s.absarc((a + b) / 2, b0 + bh - 1.2, (b - a) / 2, 0, Math.PI, false);
      s.lineTo(a, b0 + bh);
      f.add('render', new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false, curveSegments: 8 }), 0, 0, -0.75);
    }
    balustrade(f, 0.2, ww - 0.2, b0, -0.6, 0.5, 1.0);
  }
  P.box('trim', x0 + 0.2, x1 - 0.2, b0 + bh, b0 + bh + 0.6, z0 + 0.2, z1 - 0.2);
  for (const [x, z] of [[x0 + 0.5, z0 + 0.5], [x1 - 0.5, z0 + 0.5], [x0 + 0.5, z1 - 0.5], [x1 - 0.5, z1 - 0.5]]) {
    P.box('render', x - 0.55, x + 0.55, b0 + bh + 0.6, b0 + bh + 1.4, z - 0.55, z + 0.55);
    P.add('render', new THREE.CylinderGeometry(0.05, 0.42, 3.0, 4).rotateY(Math.PI / 4).translate(x, b0 + bh + 2.9, z));
    P.add('trim', new THREE.SphereGeometry(0.2, 8, 6).translate(x, b0 + bh + 4.5, z));
  }
  const tY = b0 + bh + 0.6;
  P.add('render', new THREE.CylinderGeometry(2.5, 2.8, 1.6, 8).rotateY(Math.PI / 8).translate(cx, tY + 0.8, cz));
  P.add('render', lathe(domeProfile(2.6, 3.0), 8).rotateY(Math.PI / 8).translate(cx, tY + 1.6, cz));
  P.add('render', new THREE.CylinderGeometry(0.55, 0.65, 1.5, 8).translate(cx, tY + 5.2, cz));
  cupola(P, cx, tY + 5.95, cz, 0.7, 1.1, { mat: 'render' });
}

// ---------------------------------------------------------------------------
// Concourse, Swanston St arcade, platforms and the yards west of them.

function buildPlatforms(parts) {
  const P = parts.platforms;
  const D = parts.dome;
  const zA = ST.block, zB = ST.river - 6;

  // Swanston St arcade: low glazed shopfronts under a hipped slate roof.
  D.box('glass', -12, -0.4, 0, 4.0, zA, zB);
  D.box('render', -12, 0.3, 4.0, 5.0, zA, zB);
  D.box('trim', -12, 0.5, 5.0, 5.3, zA, zB);
  hippedRoof(D, -12, 0.5, 5.3, 3.6, zA, zB);
  for (let z = zA + 4; z < zB; z += 6) D.box('render', -0.6, 0.2, 0, 4.0, z - 0.25, z + 0.25);

  // Concourse deck over the platform ends.
  P.box('concrete', -74, -12, 0, 8.6, zA + 2, zB);
  P.box('glass', -74.05, -12, 3.0, 7.0, zA + 2, zB);
  P.box('roof', -74.5, -11.5, 8.6, 9.2, zA + 1.5, zB + 0.5);
  for (let z = zA + 8; z < zB - 4; z += 11) {
    const g = new THREE.CylinderGeometry(1.6, 1.6, 58, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2);
    P.add('canopy', g.translate(-43, 9.2, z));
  }

  // Island platforms with long canopies (east half), open tracks to the west.
  const xa = -236, xb = -74;
  const zs = [42, 56, 70, 84, 98];
  P.box('ballast', -520, xb, 0.02, 0.2, ST.depth, zB + 2);
  for (const pz of zs) {
    P.box('concrete', xa, xb, 0, 1.05, pz - 3.4, pz + 3.4);
    P.box('marking', xa, xb, 1.05, 1.07, pz - 3.4, pz - 3.1);
    P.box('marking', xa, xb, 1.05, 1.07, pz + 3.1, pz + 3.4);
    // Butterfly canopy: two shallow slopes on a central spine.
    for (const s of [-1, 1]) {
      const g = new THREE.BoxGeometry(xb - xa - 6, 0.18, 4.4).rotateX(s * 0.08).translate((xa + xb) / 2, 5.8, pz + s * 2.1);
      P.add('canopy', g);
    }
    P.box('roof', xa + 3, xb - 3, 5.5, 5.75, pz - 0.3, pz + 0.3);
    for (let x = xa + 6; x < xb - 3; x += 12) P.box('canopy', x - 0.2, x + 0.2, 1.05, 5.6, pz - 0.2, pz + 0.2);
  }
  // Tracks: two per gap, through the platforms and out across the yards.
  const tracks = [ST.depth + 6, 49, 63, 77, 91, 105];
  for (const tz of tracks) {
    for (const d of [-1.9, 1.9]) {
      if (tz + d > zB) continue;
      for (const r of [-0.72, 0.72]) P.box('rail', -520, xb, 0.2, 0.36, tz + d + r - 0.04, tz + d + r + 0.04);
      for (let x = xa; x < xb; x += 1.2) P.box('concrete', x - 0.12, x + 0.12, 0.16, 0.24, tz + d - 1.25, tz + d + 1.25);
    }
  }
  // Overhead gantries across the yards.
  for (let x = -500; x < xa; x += 36) {
    for (const z of [ST.depth + 2, zB]) P.box('canopy', x - 0.2, x + 0.2, 0.2, 7.2, z - 0.2, z + 0.2);
    P.box('canopy', x - 0.25, x + 0.25, 6.9, 7.3, ST.depth + 2, zB);
  }
}

// ---------------------------------------------------------------------------
// Streets, river and context buildings

function buildGround(parts) {
  const G = parts.ground;
  const curb = 0.15;
  const R0 = ST.river, R1 = ST.river + 105;
  // Roads are the asphalt base at y = 0; footpaths and blocks are raised slabs.
  // Flinders St: z -27..-4.5; Swanston St: x 4.5..23.5; Elizabeth St (north
  // of Flinders St only, ending at the clock tower): x -200..-180.
  G.box('asphalt', -600, 400, -0.3, 0, -500, R0);
  G.box('asphalt', 4.5, 23.5, -0.3, 0, R0, R1);                 // Princes Bridge deck
  G.box('concrete', 3.5, 4.5, -2.5, 1.1, R0, R1);
  G.box('concrete', 23.5, 24.5, -2.5, 1.1, R0, R1);
  const slab = (x0, x1, z0, z1, mat = 'pavement') => G.box(mat, x0, x1, 0, curb, z0, z1);
  slab(-600, 4.5, -4.5, R0);        // station block
  slab(23.5, 400, -4.5, R0);        // Fed Square block
  slab(-600, -200, -500, -27);
  slab(-180, 4.5, -500, -27);
  slab(23.5, 400, -500, -27);
  G.box('fedsq', 28, 160, curb, curb + 0.05, 0, 110);

  // Tram tracks and lane markings.
  const rail = (x0, x1, z0, z1) => G.box('rail', x0, x1, 0, 0.02, z0, z1);
  for (const d of [-0.72, 0.72]) {
    rail(-600, 400, -18.5 + d - 0.05, -18.5 + d + 0.05);
    rail(-600, 400, -13.0 + d - 0.05, -13.0 + d + 0.05);
    rail(11.5 + d - 0.05, 11.5 + d + 0.05, -500, R1);
    rail(17.0 + d - 0.05, 17.0 + d + 0.05, -500, R1);
    rail(-193.5 + d - 0.05, -193.5 + d + 0.05, -500, -18.5);
    rail(-186.5 + d - 0.05, -186.5 + d + 0.05, -500, -13.0);
  }
  for (let x = -590; x < 390; x += 9) {
    if (x > -204 && x < -176) continue;
    if (x > 0 && x < 28) continue;
    G.box('marking', x, x + 4, 0, 0.012, -22.6, -22.4);
    G.box('marking', x, x + 4, 0, 0.012, -9.1, -8.9);
  }
  // Pedestrian crossings at the Swanston intersection, including the diagonal.
  for (let k = 0; k < 9; k++) {
    G.box('marking', 5.5 + k * 2, 6.5 + k * 2, 0, 0.012, -3.9, -0.6);
    G.box('marking', 5.5 + k * 2, 6.5 + k * 2, 0, 0.012, -30.9, -27.6);
    G.box('marking', 0.6, 3.9, 0, 0.012, -26 + k * 2.4, -25 + k * 2.4);
    G.box('marking', 24.1, 27.4, 0, 0.012, -26 + k * 2.4, -25 + k * 2.4);
    G.box('marking', -199 + k * 2.1, -198 + k * 2.1, 0, 0.012, -30.9, -27.6);
    G.box('marking', -203.9, -200.6, 0, 0.012, -26 + k * 2.4, -25 + k * 2.4);
  }
  for (let k = 0; k < 12; k++) {
    const g = new THREE.BoxGeometry(1.0, 0.012, 4).translate(0, 0.006, 0).rotateY(Math.PI / 4);
    G.add('marking', g.translate(6 + k * 1.75, 0, -6 - k * 1.75));
  }

  // Yarra River with its banks.
  G.box('water', -600, 400, -2.5, -1.6, R0, R1);
  G.box('concrete', -600, 400, -2.5, curb, R0 - 2, R0);
  G.box('concrete', -600, 400, -2.5, curb, R1, R1 + 2);
  G.box('pavement', -600, 400, 0, curb, R1 + 2, 420);
}

// Street life: trams, cars and tram overhead poles. Vehicles run along x
// (Flinders St) or z (Swanston St); `dir` is +1/-1 along that axis.
function tram(part, x, z, alongX, length = 24) {
  const L = length / 2, W = 1.35;
  const bx = (a0, a1, y0, y1, b0, b1, m) =>
    alongX ? part.box(m, x + a0, x + a1, y0, y1, z + b0, z + b1) : part.box(m, x + b0, x + b1, y0, y1, z + a0, z + a1);
  bx(-L, L, 0.35, 3.2, -W, W, 'tram');
  bx(-L + 0.4, L - 0.4, 1.3, 2.6, -W - 0.02, W + 0.02, 'glass');
  bx(-L, L, 0.35, 0.95, -W - 0.03, W + 0.03, 'tramgreen');
  bx(-L - 0.05, -L + 0.3, 1.2, 2.7, -W + 0.2, W - 0.2, 'glass');
  bx(L - 0.3, L + 0.05, 1.2, 2.7, -W + 0.2, W - 0.2, 'glass');
  bx(-L + 2, L - 2, 3.2, 3.5, -0.9, 0.9, 'canopy');
  bx(-0.6, 0.6, 3.5, 5.6, -0.05, 0.05, 'clockdark');
  bx(-1, 1, 5.6, 5.7, -0.05, 0.05, 'clockdark');
  for (const k of [-L + 2, -L / 3, L / 3, L - 2]) bx(k - 0.05, k + 0.05, 0.4, 3.2, -W - 0.04, W + 0.04, 'tram');
}

function car(part, rnd, x, z, alongX) {
  const m = ['paint1', 'paint2', 'paint3', 'tram', 'paint2'][Math.floor(rnd() * 5)];
  const L = 2.25, W = 0.9;
  const bx = (a0, a1, y0, y1, b0, b1, mm) =>
    alongX ? part.box(mm, x + a0, x + a1, y0, y1, z + b0, z + b1) : part.box(mm, x + b0, x + b1, y0, y1, z + a0, z + a1);
  bx(-L, L, 0.3, 0.95, -W, W, m);
  bx(-L * 0.55, L * 0.45, 0.95, 1.45, -W * 0.92, W * 0.92, 'glass');
  bx(-L * 0.5, L * 0.4, 1.45, 1.5, -W * 0.85, W * 0.85, m);
  for (const a of [-L * 0.62, L * 0.62]) for (const s2 of [-W, W - 0.2]) bx(a - 0.33, a + 0.33, 0, 0.6, s2, s2 + 0.2, 'tyre');
}

function buildStreetLife(parts) {
  const C = parts.city;
  const rnd = mulberry32(7);
  tram(C, -60, -18.5, true);
  tram(C, -172, -13.0, true);
  tram(C, 11.5, -62, false);
  tram(C, 17.0, 46, false, 30);
  for (const [x0, x1, z] of [[-200, -30, -21], [-200, -30, -10.5], [-420, -240, -21], [30, 200, -10.5], [30, 200, -21]]) {
    for (let x = x0 + rnd() * 10; x < x1; x += 9 + rnd() * 22) {
      if (Math.abs(x + 60) < 16 && z === -21) continue;
      if (Math.abs(x + 172) < 16 && z === -10.5) continue;
      car(C, rnd, x, z, true);
    }
  }
  for (const [z0, z1, x] of [[-200, -35, 7.5], [-200, -35, 20.5], [60, 130, 20.5]]) {
    for (let z = z0 + rnd() * 10; z < z1; z += 10 + rnd() * 20) {
      if (x === 7.5 && Math.abs(z + 62) < 16) continue;
      car(C, rnd, x, z, false);
    }
  }
  // Tram overhead: poles along both footpaths with span wires and contact wires.
  const wire = (x0, x1, y, z0, z1) => C.box('clockdark', x0, x1, y - 0.015, y + 0.015, z0, z1);
  for (let x = -420; x < 220; x += 32) {
    if (x > -205 && x < -175) continue;
    if (x > -2 && x < 30) continue;
    for (const z of [-26.3, -5.2]) C.add('canopy', new THREE.CylinderGeometry(0.12, 0.16, 8, 8).translate(x, 4, z));
    wire(x - 0.02, x + 0.02, 7.2, -26.3, -5.2);
  }
  for (const z of [-18.5, -13.0]) wire(-420, 220, 6.0, z - 0.015, z + 0.015);
  for (let z = -200; z < 140; z += 30) {
    if (z > -32 && z < 0) continue;
    for (const x of [5.2, 22.8]) C.add('canopy', new THREE.CylinderGeometry(0.12, 0.16, 8, 8).translate(x, 4, z));
    C.box('clockdark', 5.2, 22.8, 7.18, 7.22, z - 0.02, z + 0.02);
  }
  for (const x of [11.5, 17.0]) wire(x - 0.015, x + 0.015, 6.0, -200, 140);
}

function tree(part, x, z, s = 1) {
  part.add('bark', new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 3 * s, 6).translate(x, 1.5 * s, z));
  part.add('foliage', new THREE.IcosahedronGeometry(2.4 * s, 1).scale(1, 0.85, 1).translate(x, 4.2 * s, z));
}

function genericBuilding(part, rnd, x0, x1, z0, z1, h, facing) {
  const old = h < 26;
  const mat = old ? ['bldg1', 'bldg2', 'bldg4', 'bldg2'][Math.floor(rnd() * 4)] : ['bldg3', 'bldg5', 'bldg1'][Math.floor(rnd() * 3)];
  if (!old && rnd() < 0.35) {
    // Glass tower on a podium.
    part.box(mat, x0, x1, 0, 14, z0, z1);
    part.box('glass', x0 + 0.2, x1 - 0.2, 0.4, 4.2, z0 - 0.05, z1 + 0.05);
    part.box('curtain', x0 + 1.5, x1 - 1.5, 14, h, z0 + 1.5, z1 - 1.5);
    for (let y = 17.5; y < h - 1; y += 3.6) part.box('bldg5', x0 + 1.45, x1 - 1.45, y, y + 0.25, z0 + 1.45, z1 - 1.45);
    part.box('roof', x0 + 2, x1 - 2, h, h + 2.5, z0 + 2, z1 - 2);
    return;
  }
  part.box(mat, x0, x1, 0, h, z0, z1);
  part.box('glass', x0 + 0.2, x1 - 0.2, 0.4, 4.0, z0 - 0.05, z1 + 0.05);
  if (old) {
    // Punched windows on the street face plus a parapet cornice.
    const f = new Frame(part, facing === 'north' ? x1 : x0, facing === 'north' ? z0 : z1, facing);
    const w = x1 - x0;
    const n = Math.max(2, Math.round(w / 3.4));
    for (let y = 5.2; y < h - 2.5; y += 3.6)
      for (let i = 0; i < n; i++) f.rectWindow(((i + 0.5) * w) / n, y, 1.3, 2.1, { t: 0.18, depth: 0.15 });
    part.box('trim', x0 - 0.3, x1 + 0.3, h - 0.5, h, z0 - 0.3, z1 + 0.3);
    part.box(mat, x0, x1, h, h + 1.0, z0, z0 + 0.4);
  } else {
    // Ribbon windows wrap the whole building.
    for (let y = 5.5; y < h - 2; y += 3.5) part.box('curtain', x0 - 0.05, x1 + 0.05, y, y + 1.5, z0 - 0.05, z1 + 0.05);
    part.box('roof', x0 + 1, x1 - 1, h, h + 2, z0 + 1, z1 - 1);
  }
}

function buildContext(parts) {
  const C = parts.city;
  const rnd = mulberry32(1910);

  // North of Flinders St: the CBD blocks between Elizabeth and Swanston,
  // plus the block west of Elizabeth. Flinders Lane at z ≈ -95.
  const fill = (xa, xb, zFront, depth, facing, hMin, hMax) => {
    let x = xa;
    while (x < xb - 6) {
      const w = Math.min(10 + rnd() * 22, xb - x);
      const h = hMin + rnd() * (hMax - hMin);
      const z0 = facing === 'north' ? zFront - depth : zFront;
      const z1 = facing === 'north' ? zFront : zFront + depth;
      genericBuilding(C, rnd, x + 0.3, x + w - 0.3, z0, z1, h, facing === 'north' ? 'south' : 'north');
      x += w;
    }
  };
  // Flinders St frontage (facing south toward the station).
  fill(-176, -22, -31, 30, 'north', 12, 34);
  fill(-420, -204, -31, 30, 'north', 12, 34);
  fill(32, 220, -105, 30, 'north', 12, 40);
  // Behind them, taller towers.
  fill(-176, 0, -61, 32, 'north', 25, 90);
  fill(-420, -204, -61, 32, 'north', 25, 80);
  fill(-176, 0, -125, 40, 'north', 30, 120);
  fill(-420, -204, -125, 40, 'north', 30, 110);
  fill(32, 240, -170, 50, 'north', 30, 130);
  fill(-176, 0, -230, 60, 'north', 40, 150);
  fill(-420, -204, -230, 60, 'north', 40, 140);
  fill(32, 240, -260, 60, 'north', 40, 150);
  // West of the station along Flinders St, south side (low railway buildings).
  C.box('bldg4', -400, -256, 0, 8, 0, 18);
  C.box('roof', -399, -257, 8, 9, 1, 17);

  // Southbank skyline across the river.
  fill(-480, 360, ST.river + 122, 40, 'south', 30, 120);

  // Trees along Swanston St and the river.
  for (let z = 42; z < ST.river - 4; z += 12) tree(C, 2.6, z, 1.0);
  for (let x = -590; x < 380; x += 16) tree(C, x, ST.river + 113, 1.1);

  // Young & Jackson hotel (NW corner of the intersection).
  const Y = parts.youngjackson;
  Y.box('bldg2', -21, -0.3, 0, 13.5, -50, -31);
  const yjS = new Frame(Y, -21, -31, 'south');
  const yjE = new Frame(Y, -0.3, -31, 'east');
  for (const y of [5.0, 9.0]) {
    for (let i = 0; i < 5; i++) yjS.rectWindow(((i + 0.5) * 20.7) / 5, y, 1.4, 2.4, { t: 0.2 });
    for (let i = 0; i < 5; i++) yjE.rectWindow(((i + 0.5) * 19) / 5, y, 1.4, 2.4, { t: 0.2 });
  }
  Y.box('trim', -21.3, 0, 13.0, 13.6, -50.3, -30.7);
  Y.box('bldg2', -21, -0.3, 13.6, 15.0, -31.4, -31);
  Y.box('bldg2', -0.7, -0.3, 13.6, 15.0, -50, -31);
  Y.box('glass', -20.8, -0.5, 0.4, 3.8, -31.1, -31);
  Y.box('canopy', -21, 0.4, 3.9, 4.1, -30.9, -28.5);
  Y.box('roof', -20.5, -0.8, 13.6, 14.4, -49.5, -31.5);

  // St Paul's Cathedral (NE corner): west front on Swanston St.
  const S = parts.stpauls;
  const nave = { x0: 34, x1: 110, z0: -78, z1: -52 };
  S.box('sandstone', nave.x0, nave.x1, 0, 21, nave.z0, nave.z1);
  // Pitched roof.
  {
    const s = new THREE.Shape();
    s.moveTo(-14, 0); s.lineTo(14, 0); s.lineTo(0, 10); s.lineTo(-14, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: nave.x1 - nave.x0 - 2, bevelEnabled: false }).rotateY(Math.PI / 2);
    S.add('slate', g.translate(nave.x0 + 1, 21, (nave.z0 + nave.z1) / 2));
  }
  // Transept.
  S.box('sandstone', 66, 84, 0, 21, -96, -34);
  {
    const s = new THREE.Shape();
    s.moveTo(-10, 0); s.lineTo(10, 0); s.lineTo(0, 9); s.lineTo(-10, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 62, bevelEnabled: false });
    S.add('slate', g.translate(75, 21, -96));
  }
  // Aisles.
  S.box('sandstone', nave.x0 + 6, nave.x1, 0, 12, nave.z0 - 7, nave.z0);
  S.box('sandstone', nave.x0 + 6, nave.x1, 0, 12, nave.z1, nave.z1 + 7);
  S.box('slate', nave.x0 + 6, nave.x1, 12, 13, nave.z0 - 7, nave.z0);
  S.box('slate', nave.x0 + 6, nave.x1, 12, 13, nave.z1, nave.z1 + 7);
  // Lancet windows on the aisles.
  for (const [oz, facing] of [[nave.z0 - 7, 'north'], [nave.z1 + 7, 'south']]) {
    const f = new Frame(S, facing === 'north' ? nave.x1 : nave.x0 + 6, oz, facing);
    for (let i = 0; i < 9; i++) f.arch(3 + i * 7.6, 3, 1.6, 6.5, { t: 0.3, mat: 'sandstone', transom: false });
  }
  // West front with two spires, central spire over the crossing.
  const spire = (x, z, base, hTower, hSpire) => {
    S.box('sandstone', x - base / 2, x + base / 2, 0, hTower, z - base / 2, z + base / 2);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
      S.box('sandstone', x + dx * base / 2 - 0.9, x + dx * base / 2 + 0.9, 0, hTower + 3, z + dz * base / 2 - 0.9, z + dz * base / 2 + 0.9);
    S.add('slate', new THREE.ConeGeometry(base * 0.62, hSpire, 8).rotateY(Math.PI / 8).translate(x, hTower + hSpire / 2, z));
    const f = new Frame(S, x - base / 2, z + base / 2, 'west');
    f.arch(base / 2, hTower - 9, base * 0.25, 6, { t: 0.3, mat: 'sandstone', transom: false });
  };
  spire(37, nave.z0 - 3, 11, 38, 30);
  spire(37, nave.z1 + 3, 11, 38, 30);
  spire(75, (nave.z0 + nave.z1) / 2, 13, 45, 46);
  const wf = new Frame(S, nave.x0, nave.z1 - 2, 'west');
  wf.arch(11, 5, 5, 12, { t: 0.6, mat: 'sandstone', mullions: 2 });
  wf.arch(11, 0.3, 3.4, 4.8, { t: 0.5, mat: 'sandstone', transom: false, sill: false });

  // Federation Square (SE corner): fractured volumes on a sloping plaza.
  const F = parts.fedsq;
  const shard = (x, z, w, d, h, rot, mat, tilt = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) + tilt * (pos.getX(i) / w));
    g.computeVertexNormals();
    F.add(mat, g.translate(0, h / 2, 0).rotateY(rot).translate(x, 0, z));
  };
  shard(48, 18, 30, 22, 17, 0.05, 'fedsq', 3);
  shard(52, 18.5, 26, 18, 17.3, 0.05, 'zinc', 3);
  shard(48, 60, 34, 26, 22, -0.08, 'fedsq', -4);
  shard(95, 30, 40, 24, 14, 0.12, 'zinc', 2);
  shard(120, 75, 44, 30, 18, -0.1, 'fedsq', 3);
  shard(85, 92, 30, 20, 12, 0.2, 'glass', 0);
  // Atrium: glass roof between volumes.
  F.box('glass', 64, 76, 12, 12.3, 10, 70);
  // Tower (the "shard" on Swanston St).
  shard(40, 6, 7, 7, 30, 0.1, 'zinc', 0);
  for (let x = 70; x < 150; x += 14) tree(F, x, 5, 1.1);

  // Eureka Tower (Southbank) and a couple of other tall landmarks for skyline.
  const E = parts.eureka;
  E.box('curtain', -175, -147, 0, 268, 285, 315);
  E.box('gold', -175.2, -146.8, 256, 286, 284.8, 315.2);
  E.box('bldg5', -173, -149, 286, 297, 287, 313);
  E.box('bldg3', -178, -143, 0, 20, 280, 320);
}

// ---------------------------------------------------------------------------

export function buildStation({ materials = createMaterials() } = {}) {
  const keys = ['dome', 'clocktower', 'facade', 'centre', 'platforms', 'stpauls', 'fedsq', 'youngjackson', 'eureka', 'city', 'ground'];
  const parts = Object.fromEntries(keys.map((k) => [k, new Part(k)]));

  buildFacade(parts);
  buildDome(parts);
  buildClockTower(parts);
  buildPlatforms(parts);
  buildGround(parts);
  buildContext(parts);
  buildStreetLife(parts);

  const root = new THREE.Group();
  root.name = 'FlindersStreetStation';
  for (const p of Object.values(parts)) root.add(p.build(materials));
  root.traverse((o) => {
    if (o.isMesh && o.userData.part === 'ground') o.castShadow = false;
  });
  return root;
}
