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
  brick:     { color: 0xa8482c, roughness: 0.9 },
  render:    { color: 0xe9cf8e, roughness: 0.8 },
  trim:      { color: 0xf3e6c4, roughness: 0.75 },
  copper:    { color: 0x5f9e86, roughness: 0.55, metalness: 0.3 },
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
    text: '车站最具标志性的部分：巨大的拱形窗上方是绿色铜穹顶。入口台阶上方挂着一排时钟，"Under the clocks"（钟下见）是墨尔本人最常用的碰头暗号。',
    view: { pos: [34, 20, -38], target: [-12, 16, 10] },
  },
  clocktower: {
    title: '钟楼',
    subtitle: 'Elizabeth St 转角',
    text: '位于车站西端的方形钟楼，四面都有钟面，顶部是铜质小穹顶，从 Elizabeth Street 一带远远就能看到。',
    view: { pos: [-250, 40, -60], target: [-202, 34, 5] },
  },
  facade: {
    title: 'Flinders Street 立面',
    subtitle: '红砖 + 奶油色抹灰带',
    text: '主楼沿 Flinders Street 延伸约两百米，红砖墙面配奶油色水平抹灰带，底层是拱廊商铺，上层是成排的拱窗。顶层曾有一间舞厅，后来长期空置。',
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
    view: { pos: [-40, 45, 170], target: [-110, 2, 60] },
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
    view: { pos: [-60, 120, 60], target: [-160, 150, 330] },
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
      .multiply(new THREE.Matrix4().makeRotationY(FACING[facing]));
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
// Station constants

const ST = {
  west: -207,      // west face (Elizabeth St)
  domeW: 26,       // dome block footprint (square, NE corner at 0,0)
  depth: 22,       // main block depth (south from facade)
  eave: 15.2,      // main cornice height
  bay: 4.3,
};

// ---------------------------------------------------------------------------
// Main Flinders St facade (between clock tower and dome block)

function buildFacade(parts) {
  const P = parts.facade;
  const C = parts.centre;
  const x0 = ST.west + 10;      // east face of clock tower
  const x1 = -ST.domeW;         // west face of dome block
  const L = x1 - x0;

  // Core massing and roof.
  P.box('brick', x0, x1, 0, ST.eave, 0, ST.depth);
  P.box('roof', x0 + 0.5, x1 - 0.5, ST.eave, ST.eave + 0.2, 0.5, ST.depth - 0.5);
  {
    // Hipped roof behind the parapet.
    const g = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1).rotateY(Math.PI / 4);
    // After the 45° turn the base is a square of half-size SQRT1_2.
    g.scale((L * 0.98) / 2 / Math.SQRT1_2, 4, (ST.depth - 2) / 2 / Math.SQRT1_2);
    g.translate((x0 + x1) / 2, ST.eave + 2.2, ST.depth / 2);
    P.add('roof', g);
  }
  // Rear wall gets a few banding lines too.
  for (const y of [5.5, 10.4]) P.box('render', x0, x1, y, y + 0.45, ST.depth - 0.01, ST.depth + 0.15);

  // Facade along north face: local x runs west from x1, so lx = x1 - worldX.
  const f = new Frame(P, x1, 0, 'north');
  const fc = new Frame(C, x1, 0, 'north');

  // Pavilions (local x ranges); the central one is the Degraves St entrance.
  const centreMid = x1 - -110;           // world x = -110
  const pavilions = [
    { a: 26, b: 38, h: 19.5 },
    { a: centreMid - 9, b: centreMid + 9, h: 22, centre: true },
    { a: L - 40, b: L - 28, h: 19.5 },
  ];
  const inPav = (lx) => pavilions.find((p) => lx > p.a - 0.6 && lx < p.b + 0.6);

  // Horizontal render banding over the brick (the "striped" look).
  const bands = [];
  for (let y = 1.2; y < ST.eave - 0.5; y += 1.25) bands.push(y);
  for (const y of bands) f.box('render', 0, L, y, y + 0.32, 0, 0.06);

  // Plinth, string courses, cornice, parapet.
  f.box('stone', 0, L, 0, 0.9, 0, 0.35);
  f.box('trim', 0, L, 5.4, 5.95, 0, 0.45);
  f.box('trim', 0, L, 10.3, 10.75, 0, 0.35);
  f.box('trim', 0, L, ST.eave - 0.5, ST.eave, 0, 0.55);
  f.box('trim', 0, L, ST.eave, ST.eave + 0.35, 0, 0.8);
  f.box('render', 0, L, ST.eave + 0.35, ST.eave + 1.5, 0, 0.3);
  f.box('trim', 0, L, ST.eave + 1.5, ST.eave + 1.75, 0, 0.42);

  // Bays.
  const nb = Math.floor(L / ST.bay);
  const bay = L / nb;
  for (let i = 0; i < nb; i++) {
    const cx = (i + 0.5) * bay;
    const pav = inPav(cx);
    // Pilaster between bays.
    if (i > 0) {
      const px = i * bay;
      f.box('render', px - 0.35, px + 0.35, 0.9, ST.eave - 0.5, 0, 0.25);
    }
    if (pav && pav.centre) continue; // central pavilion drawn separately
    // Ground floor shop arches.
    f.arch(cx, 0.9, bay - 1.3, 4.1, { t: 0.3, mullions: 1, sill: false });
    // First floor: tall round-headed windows.
    f.arch(cx, 6.5, 1.5, 3.2, { t: 0.28 });
    // Second floor: shorter round-headed windows, paired.
    f.arch(cx - 0.55, 11.3, 0.8, 2.4, { t: 0.2, transom: false });
    f.arch(cx + 0.55, 11.3, 0.8, 2.4, { t: 0.2, transom: false });
    // Parapet piers above pilasters.
    f.box('trim', i * bay - 0.4, i * bay + 0.4, ST.eave + 0.35, ST.eave + 2.2, 0, 0.45);
  }

  // Pavilions.
  for (const pv of pavilions) {
    const ff = pv.centre ? fc : f;
    const w = pv.b - pv.a;
    const mid = (pv.a + pv.b) / 2;
    ff.box('brick', pv.a, pv.b, 0, pv.h, 0, 1.2);
    for (let y = 1.2; y < pv.h - 1; y += 1.25) ff.box('render', pv.a, pv.b, y, y + 0.32, 1.2, 1.26);
    ff.box('render', pv.a - 0.6, pv.a + 0.6, 0, pv.h, 0, 1.5);
    ff.box('render', pv.b - 0.6, pv.b + 0.6, 0, pv.h, 0, 1.5);
    ff.box('trim', pv.a - 0.7, pv.b + 0.7, pv.h - 0.6, pv.h, 0, 1.9);
    ff.box('trim', pv.a - 0.4, pv.b + 0.4, 5.4, 5.95, 1.2, 1.7);
    ff.box('trim', pv.a - 0.4, pv.b + 0.4, 10.3, 10.75, 1.2, 1.6);
    curvedGable(ff, mid, pv.h, w * 0.75, w * 0.32, 'render', 1.2);
    ff.add('trim', new THREE.CircleGeometry(1.1, 24), mid, pv.h + w * 0.13, 1.31);
    ff.add('clockdark', new THREE.CircleGeometry(0.85, 24), mid, pv.h + w * 0.13, 1.33);
    // Turrets flanking the gable.
    for (const tx of [pv.a, pv.b]) {
      ff.box('render', tx - 0.9, tx + 0.9, pv.h, pv.h + 2.6, -0.3, 1.5);
      ff.box('trim', tx - 1.05, tx + 1.05, pv.h + 2.6, pv.h + 2.9, -0.45, 1.65);
    }
    if (pv.centre) {
      // Big arched entrance and a tall arched window over it.
      ff.box('stone', mid - 6, mid + 6, 0, 0.5, 1.2, 3.5);
      ff.box('stone', mid - 5.5, mid + 5.5, 0.5, 0.9, 1.2, 2.6);
      ff.arch(mid, 0.9, 7, 8.2, { t: 0.7, depth: 0.5, mullions: 0, mat: 'render', transom: false, sill: false });
      ff.box('clockdark', mid - 3.5, mid + 3.5, 0.9, 5.2, 1.21, 1.3);
      ff.arch(mid - 4.2, 11, 1.4, 3.6, { t: 0.25 });
      ff.arch(mid + 4.2, 11, 1.4, 3.6, { t: 0.25 });
      ff.arch(mid, 11, 2.6, 5.4, { t: 0.4, mullions: 1 });
      ff.arch(mid - 4.2, 1.2, 1.4, 3.4, { t: 0.25 });
      ff.arch(mid + 4.2, 1.2, 1.4, 3.4, { t: 0.25 });
    } else {
      ff.arch(mid, 0.9, 3.2, 4.2, { t: 0.35, mullions: 1, sill: false });
      ff.arch(mid - 2.9, 6.5, 1.4, 3.2, { t: 0.25 });
      ff.arch(mid, 6.5, 2.2, 3.6, { t: 0.3, mullions: 1 });
      ff.arch(mid + 2.9, 6.5, 1.4, 3.2, { t: 0.25 });
      ff.arch(mid - 2.5, 11.3, 1.1, 2.6, { t: 0.22 });
      ff.arch(mid, 11.3, 1.6, 3.0, { t: 0.25 });
      ff.arch(mid + 2.5, 11.3, 1.1, 2.6, { t: 0.22 });
      ff.arch(mid, 15.8, 2.0, 2.4, { t: 0.25 });
    }
    // Copper caps on turrets (world coordinates).
    for (const tx of [pv.a, pv.b]) {
      const v = new THREE.Vector3(tx, 0, 0.6).applyMatrix4(ff.mat);
      cupola(ff.part, v.x, pv.h + 2.9, v.z, 1.1, 1.8);
    }
  }

  // Street verandah (cantilevered awning over the shops).
  f.box('canopy', 0.5, L - 0.5, 4.75, 4.95, 0.45, 3.2);
  f.box('trim', 0.5, L - 0.5, 4.95, 5.25, 3.0, 3.2);
}

// ---------------------------------------------------------------------------
// Dome block at the Flinders / Swanston corner

function buildDome(parts) {
  const P = parts.dome;
  const W = ST.domeW;
  const H = 23;
  const cx = -W / 2, cz = W / 2;

  P.box('brick', -W, 0, 0, H, 0, W);
  // Corner piers (render), cornice, parapet.
  for (const [x, z] of [[-W, 0], [0, 0], [-W, W], [0, W]]) {
    P.box('render', x - 2.2, x + 2.2, 0, H + 1, z - 2.2, z + 2.2);
    for (let y = 1.2; y < H; y += 1.25) P.box('trim', x - 2.3, x + 2.3, y, y + 0.32, z - 2.3, z + 2.3);
    P.box('trim', x - 2.6, x + 2.6, H + 1, H + 1.5, z - 2.6, z + 2.6);
    P.box('render', x - 1.8, x + 1.8, H + 1.5, H + 4.5, z - 1.8, z + 1.8);
    P.box('trim', x - 2.0, x + 2.0, H + 4.5, H + 4.9, z - 2.0, z + 2.0);
    cupola(P, x, H + 4.9, z, 1.7, 2.6);
  }
  P.box('trim', -W - 0.4, 0.4, H - 0.6, H, -0.4, W + 0.4);
  P.box('render', -W, 0, H, H + 1.4, 0, W);
  P.box('trim', -W - 0.3, 0.3, H + 1.4, H + 1.7, -0.3, W + 0.3);
  P.box('roof', -W + 1, -1, H + 1.4, H + 2.2, 1, W - 1);

  // The two street faces: north (Flinders) and east (Swanston).
  const faces = [new Frame(P, 0, 0, 'north'), new Frame(P, 0, W, 'east')];
  for (const f of faces) {
    const mid = W / 2;
    for (let y = 1.2; y < H - 1; y += 1.25) f.box('render', 2.2, W - 2.2, y, y + 0.32, 0, 0.06);
    f.box('stone', 0, W, 0, 1.0, 0, 0.4);
    // Steps up to the entrance.
    for (let s = 0; s < 4; s++) f.box('stone', mid - 9 + s * 0.3, mid + 9 - s * 0.3, s * 0.2, (s + 1) * 0.2, 0, 3.4 - s * 0.6);
    // Giant arched window with radiating glazing bars.
    const aw = 14, ay = 6.2, ah = 15.6;
    f.arch(mid, ay, aw, ah, { t: 1.3, depth: 0.9, mat: 'render', mullions: 5, transom: true, sill: false });
    f.box('trim', mid - aw / 2, mid + aw / 2, ay + 3.4, ay + 3.6, 0, 0.14);
    // Archivolt keystone.
    f.box('trim', mid - 0.8, mid + 0.8, ay + ah - 0.2, ay + ah + 1.6, 0, 1.2);
    // Entrance openings below the arch.
    for (const dx of [-4.7, 0, 4.7]) f.arch(mid + dx, 0.8, 3.4, 4.6, { t: 0.4, depth: 0.5, mat: 'render', transom: false, sill: false });
    // The famous row of clocks above the entrance.
    for (let k = 0; k < 9; k++) {
      const x = mid - 5.6 + k * 1.4;
      f.box('clockdark', x - 0.62, x + 0.62, 5.55, 6.0, 0.35, 0.55);
      f.clock(x, 5.2, 0.42, 0.5);
    }
    // Side windows beside the arch.
    for (const dx of [-9.6, 9.6]) {
      f.arch(mid + dx, 7, 1.6, 3.6, { t: 0.3 });
      f.arch(mid + dx, 13, 1.6, 3.6, { t: 0.3 });
      f.rectWindow(mid + dx, 18.6, 1.6, 2.2);
      f.arch(mid + dx, 1.4, 1.8, 3.2, { t: 0.3, sill: false });
    }
    f.box('trim', 0, W, H - 3, H - 2.6, 0, 0.4);
  }

  // Drum, dome and lantern.
  const y0 = H + 1.4;
  P.add('render', new THREE.CylinderGeometry(10.2, 10.6, 2.2, 48).translate(cx, y0 + 1.1, cz));
  P.add('trim', new THREE.CylinderGeometry(10.9, 10.9, 0.4, 48).translate(cx, y0 + 2.4, cz));
  P.add('render', new THREE.CylinderGeometry(9.3, 9.3, 5.4, 48).translate(cx, y0 + 5.1, cz));
  // Drum windows and pilasters.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const ry = -a + Math.PI / 2;
    const win = archShape(THREE.Shape, 0, 0, 1.7, 3.3);
    const g = new THREE.ShapeGeometry(win, 8).translate(0, 0, 9.33).rotateY(ry);
    P.add('glass', g.translate(cx, y0 + 3.4, cz));
    const pa = a + Math.PI / 12;
    P.add('trim', new THREE.BoxGeometry(0.7, 5.4, 0.5).translate(0, 0, 9.4).rotateY(-pa + Math.PI / 2).translate(cx, y0 + 5.1, cz));
  }
  P.add('trim', new THREE.CylinderGeometry(9.9, 9.9, 0.6, 48).translate(cx, y0 + 8.1, cz));
  const dY = y0 + 8.4;
  P.add('copper', lathe(domeProfile(9.4, 11.5, 24), 64).translate(cx, dY, cz));
  // Ribs.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = (k / 12) * (Math.PI / 2) * 0.93;
      const r = 9.4 * Math.cos(t) + 0.12;
      pts.push(new THREE.Vector3(cx + r * Math.cos(a), dY + 11.5 * Math.sin(t) + 0.05, cz + r * Math.sin(a)));
    }
    P.add('copper', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.16, 6, false));
  }
  // Lantern.
  const lY = dY + 11.2;
  P.add('trim', new THREE.CylinderGeometry(2.2, 2.4, 0.5, 24).translate(cx, lY + 0.25, cz));
  P.add('render', new THREE.CylinderGeometry(1.8, 1.8, 3.2, 24).translate(cx, lY + 2.1, cz));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const g = new THREE.ShapeGeometry(archShape(THREE.Shape, 0, 0, 0.7, 2.0), 6).translate(0, 0, 1.82).rotateY(-a + Math.PI / 2);
    P.add('glass', g.translate(cx, lY + 0.9, cz));
  }
  P.add('trim', new THREE.CylinderGeometry(2.1, 2.1, 0.35, 24).translate(cx, lY + 3.8, cz));
  cupola(P, cx, lY + 3.95, cz, 1.9, 2.4);
}

// ---------------------------------------------------------------------------
// Clock tower at the Elizabeth St end

function buildClockTower(parts) {
  const P = parts.clocktower;
  const x0 = ST.west, x1 = ST.west + 10, z0 = -0.8, z1 = 9.2;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const shaft = 40;

  P.box('brick', x0, x1, 0, shaft, z0, z1);
  // Quoins at the corners and render banding.
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) P.box('render', x - 0.7, x + 0.7, 0, shaft, z - 0.7, z + 0.7);
  for (let y = 1.2; y < shaft; y += 1.25) P.box('render', x0 - 0.05, x1 + 0.05, y, y + 0.32, z0 - 0.05, z1 + 0.05);
  P.box('stone', x0 - 0.8, x1 + 0.8, 0, 1.0, z0 - 0.8, z1 + 0.8);

  for (const [ox, oz, facing] of [[x1, z0, 'north'], [x0, z0, 'west'], [x0, z1, 'south'], [x1, z1, 'east']]) {
    const f = new Frame(P, ox, oz, facing);
    // Entrance arch on the north and west faces, windows above.
    if (facing === 'north' || facing === 'west') f.arch(5, 1.0, 4.2, 6.2, { t: 0.6, depth: 0.5, mat: 'render', transom: false, sill: false });
    else f.arch(5, 2.5, 1.8, 3.6, { t: 0.3 });
    for (const y of [9, 15, 21, 27]) f.arch(5, y, 1.6, 3.8, { t: 0.3 });
    f.box('trim', -0.8, 10.8, 5.6, 6.1, 0, 0.5);
    f.box('trim', -0.8, 10.8, 32, 32.5, 0, 0.5);
    f.arch(3.2, 33.6, 1.1, 3.4, { t: 0.25, transom: false });
    f.arch(6.8, 33.6, 1.1, 3.4, { t: 0.25, transom: false });
  }
  P.box('trim', x0 - 1.0, x1 + 1.0, shaft, shaft + 0.8, z0 - 1.0, z1 + 1.0);

  // Clock stage.
  const cy0 = shaft + 0.8;
  P.box('render', x0 + 0.3, x1 - 0.3, cy0, cy0 + 7, z0 + 0.3, z1 - 0.3);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    P.box('trim', x - 0.3, x + 0.3, cy0, cy0 + 7, z - 0.3, z + 0.3);
  }
  for (const [ox, oz, facing] of [[x1 - 0.3, z0 + 0.3, 'north'], [x0 + 0.3, z0 + 0.3, 'west'], [x0 + 0.3, z1 - 0.3, 'south'], [x1 - 0.3, z1 - 0.3, 'east']]) {
    const f = new Frame(P, ox, oz, facing);
    f.clock(4.7, cy0 + 3.5, 2.6, 0.05);
    curvedGable(f, 4.7, cy0 + 7, 7.4, 2.4, 'render', 0.9);
  }
  P.box('trim', x0 - 0.6, x1 + 0.6, cy0 + 7, cy0 + 7.6, z0 - 0.6, z1 + 0.6);
  // Copper cupola and lantern.
  const tY = cy0 + 7.6;
  P.add('render', new THREE.CylinderGeometry(3.8, 4.2, 1.6, 8).rotateY(Math.PI / 8).translate(cx, tY + 0.8, cz));
  P.add('copper', lathe(domeProfile(4.0, 5.2), 8).rotateY(Math.PI / 8).translate(cx, tY + 1.6, cz));
  P.add('render', new THREE.CylinderGeometry(1.0, 1.0, 2.0, 12).translate(cx, tY + 7.4, cz));
  cupola(P, cx, tY + 8.4, cz, 1.2, 1.8);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) cupola(P, x, cy0 + 7.6, z, 0.9, 1.4);
}

// ---------------------------------------------------------------------------
// Swanston St wing (behind the dome block) and the platforms

function buildPlatforms(parts) {
  const P = parts.platforms;
  const zs = 34;
  // Swanston St wing: lower two-storey building beside the platforms.
  const D = parts.dome;
  D.box('brick', -16, 0, 0, 10, ST.domeW, ST.domeW + 18);
  for (let y = 1.2; y < 10; y += 1.25) D.box('render', -0.05, 0.06, y, y + 0.32, ST.domeW, ST.domeW + 18);
  const fw = new Frame(D, 0, ST.domeW + 18, 'east');
  for (let i = 0; i < 4; i++) {
    fw.arch(2.2 + i * 4.4, 1.0, 2.6, 3.8, { t: 0.3, sill: false });
    fw.arch(2.2 + i * 4.4, 5.6, 1.4, 2.8, { t: 0.25 });
  }
  D.box('trim', -16, 0.5, 10, 10.6, ST.domeW, ST.domeW + 18);
  D.box('roof', -15.5, -0.5, 10.6, 11.0, ST.domeW + 0.5, ST.domeW + 17.5);

  // Platforms run east-west south of the main building.
  const xa = -330, xb = -22;
  P.box('ballast', xa, xb + 20, 0.1, 0.25, ST.depth, zs + 95);
  const platforms = [];
  for (let i = 0; i < 6; i++) platforms.push(zs + 4 + i * 15.5);
  for (const pz of platforms) {
    P.box('concrete', xa + 20, xb, 0, 1.05, pz - 3.2, pz + 3.2);
    P.box('marking', xa + 20, xb, 1.05, 1.07, pz - 3.2, pz - 2.9);
    P.box('marking', xa + 20, xb, 1.05, 1.07, pz + 2.9, pz + 3.2);
    // Canopy with columns.
    P.box('canopy', xa + 40, xb - 10, 5.6, 5.9, pz - 4.2, pz + 4.2);
    P.box('canopy', xa + 40, xb - 10, 5.9, 6.6, pz - 0.6, pz + 0.6);
    for (let x = xa + 44; x < xb - 10; x += 12) P.box('canopy', x - 0.18, x + 0.18, 1.05, 5.6, pz - 0.18, pz + 0.18);
  }
  // Tracks between platforms.
  for (let i = 0; i < 6; i++) {
    const tz = platforms[i] + 7.75;
    for (const dz of [-0.72, 0.72]) P.box('rail', xa, xb + 20, 0.25, 0.42, tz + dz - 0.04, tz + dz + 0.04);
    for (let x = xa; x < xb + 20; x += 0.9) P.box('concrete', x - 0.12, x + 0.12, 0.2, 0.3, tz - 1.25, tz + 1.25);
  }
}

// ---------------------------------------------------------------------------
// Streets, river and context buildings

function buildGround(parts) {
  const G = parts.ground;
  const curb = 0.15;
  // Roads are the asphalt base at y = 0; footpaths and blocks are raised slabs.
  // Flinders St: z -27..-4.5; Swanston St: x 4.5..23.5; Elizabeth St: x -231..-211.5.
  G.box('asphalt', -600, 400, -0.3, 0, -500, 140);
  G.box('asphalt', 4.5, 23.5, -0.3, 0, 140, 238);               // Princes Bridge deck
  G.box('concrete', 3.5, 4.5, -2.5, 1.1, 140, 238);
  G.box('concrete', 23.5, 24.5, -2.5, 1.1, 140, 238);
  const slab = (x0, x1, z0, z1, mat = 'pavement') => G.box(mat, x0, x1, 0, curb, z0, z1);
  slab(-211.5, 4.5, -4.5, 140);     // station block
  slab(-600, -231, -4.5, 140);
  slab(23.5, 400, -4.5, 140);       // Fed Square block
  slab(-600, -231, -500, -27);
  slab(-211.5, 4.5, -500, -27);
  slab(23.5, 400, -500, -27);
  G.box('fedsq', 28, 160, curb, curb + 0.05, 0, 110);

  // Tram tracks and lane markings.
  const rail = (x0, x1, z0, z1) => G.box('rail', x0, x1, 0, 0.02, z0, z1);
  for (const d of [-0.72, 0.72]) {
    rail(-600, 400, -18.5 + d - 0.05, -18.5 + d + 0.05);
    rail(-600, 400, -13.0 + d - 0.05, -13.0 + d + 0.05);
    rail(11.5 + d - 0.05, 11.5 + d + 0.05, -500, 238);
    rail(17.0 + d - 0.05, 17.0 + d + 0.05, -500, 238);
  }
  for (let x = -590; x < 390; x += 9) {
    if (x > -235 && x < -207) continue;
    if (x > 0 && x < 28) continue;
    G.box('marking', x, x + 4, 0, 0.012, -22.6, -22.4);
    G.box('marking', x, x + 4, 0, 0.012, -9.1, -8.9);
  }
  // Pedestrian crossings at the Swanston intersection, including the diagonal.
  for (let k = 0; k < 9; k++) {
    G.box('marking', 5.5 + k * 2, 6.5 + k * 2, 0, 0.012, -3.9, -0.6);
    G.box('marking', 5.5 + k * 2, 6.5 + k * 2, 0, 0.012, -30.9, -27.6 + 0.0);
    G.box('marking', 0.6, 3.9, 0, 0.012, -26 + k * 2.4, -25 + k * 2.4);
    G.box('marking', 24.1, 27.4, 0, 0.012, -26 + k * 2.4, -25 + k * 2.4);
  }
  for (let k = 0; k < 12; k++) {
    const g = new THREE.BoxGeometry(1.0, 0.012, 4).translate(0, 0.006, 0).rotateY(Math.PI / 4);
    G.add('marking', g.translate(6 + k * 1.75, 0, -6 - k * 1.75));
  }

  // Yarra River with its banks.
  G.box('water', -600, 400, -2.5, -1.6, 140, 238);
  G.box('concrete', -600, 400, -2.5, curb, 138, 140);
  G.box('concrete', -600, 400, -2.5, curb, 238, 240);
  G.box('pavement', -600, 400, 0, curb, 240, 420);
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
    if (x > -236 && x < -206) continue;
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
    for (let y = 5.5; y < h - 2; y += 3.5) part.box('glass', x0 - 0.05, x1 + 0.05, y, y + 1.5, z0 - 0.05, z1 + 0.05);
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
  fill(-231, -22, -31, 30, 'north', 12, 34);
  fill(-420, -239, -31, 30, 'north', 12, 34);
  fill(32, 220, -105, 30, 'north', 12, 40);
  // Behind them, taller towers.
  fill(-231, 0, -61, 32, 'north', 25, 90);
  fill(-420, -239, -61, 32, 'north', 25, 80);
  fill(-231, 0, -125, 40, 'north', 30, 120);
  fill(-420, -239, -125, 40, 'north', 30, 110);
  fill(32, 240, -170, 50, 'north', 30, 130);
  fill(-231, 0, -230, 60, 'north', 40, 150);
  fill(-420, -239, -230, 60, 'north', 40, 140);
  fill(32, 240, -260, 60, 'north', 40, 150);
  // West of Elizabeth along Flinders St, south side (low railway buildings).
  C.box('bldg4', -330, -239, 0, 8, 0, 18);
  C.box('roof', -329, -240, 8, 9, 1, 17);

  // Southbank skyline across the river.
  fill(-480, 360, 250, 40, 'south', 30, 120);

  // Trees along Swanston St and the river.
  for (let z = 40; z < 140; z += 12) tree(C, 2.3, z, 1.0);
  for (let x = -590; x < 380; x += 16) tree(C, x, 244, 1.1);

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
  E.box('curtain', -175, -147, 0, 268, 315, 345);
  E.box('gold', -175.2, -146.8, 238, 286, 314.8, 345.2);
  E.box('bldg5', -173, -149, 286, 297, 317, 343);
  E.box('bldg3', -178, -143, 0, 20, 310, 350);
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
