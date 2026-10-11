// Shared helpers: easing, seeded noise, text, images, and Clawd's geometry.
export const W = 1920, H = 1080, FPS = 30;

export const C = {
  ink: '#141413', ink2: '#1F1E1C', ink3: '#2A2926', slate: '#3D3D3A', muted: '#87867F', oat: '#E3DACC',
  cream: '#F0EEE6', ivory: '#FAF9F5', clay: '#D97757', clawd: '#D77757', clawdDark: '#B65E42', clawdLight: '#EE9A7C',
  green: '#7FB069', blue: '#6A9BCC', gold: '#E6B85C',
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
export const easeInCubic = (k) => k * k * k;
export const easeInOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOutExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const easeInOutQuad = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
export const easeOutBack = (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
// overshoot spring 0 → 1 (≈ cubic-bezier(0.34,1.56,0.64,1) feel), settles by k = 1
export const spring = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.exp(-6.5 * k) * Math.cos(10.5 * k));
// in/out envelope: 0 before a, ramps to 1 over fi, holds, ramps down over fo ending at b
export const env = (t, a, b, fi = 0.3, fo = 0.3) => Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b));

export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }

// ---------- text ----------
export const SANS = '"Noto Sans SC", sans-serif', MONO = '"JetBrains Mono", "Noto Sans SC", monospace', FUN = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';
export const TEXT = new Set();   // every string drawn, so the font chunks can be preloaded
export function font(ctx, size, weight = 400, fam = SANS) { ctx.font = `${weight} ${size}px ${fam}`; }
export function text(ctx, s, x, y, o = {}) {
  TEXT.add(s);
  font(ctx, o.size || 32, o.weight || 400, o.font || SANS);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.letterSpacing = (o.ls || 0) + 'px';
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW || 8; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = o.color || C.ivory;
  ctx.fillText(s, x, y);
  ctx.letterSpacing = '0px';
  return ctx.measureText(s).width;
}
// type-on: show the first n characters (n may be fractional → progress)
export const typed = (s, k) => [...s].slice(0, Math.floor([...s].length * clamp(k))).join('');
// line wrap for mixed CJK / latin text; words in latin are kept together
export function wrap(ctx, s, maxW, o = {}) {
  TEXT.add(s);
  font(ctx, o.size || 32, o.weight || 400, o.font || SANS);
  const tokens = s.match(/[A-Za-z0-9_.\-()'=×/:%+→<>]+|\s|./gu) || [];
  const lines = []; let cur = '';
  for (const tk of tokens) {
    const nx = cur + tk;
    if (ctx.measureText(nx).width > maxW && cur.trim()) { lines.push(cur.trimEnd()); cur = tk.trimStart(); }
    else cur = nx;
  }
  if (cur) lines.push(cur);
  return lines;
}
export function para(ctx, s, x, y, maxW, o = {}) {
  const lines = wrap(ctx, s, maxW, o), lh = o.lh || (o.size || 32) * 1.5;
  lines.forEach((l, i) => text(ctx, l, x, y + i * lh, o));
  return lines.length * lh;
}

export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
export function withAlpha(ctx, a, fn) { const p = ctx.globalAlpha; ctx.globalAlpha = p * clamp(a); if (a > 0.001) fn(); ctx.globalAlpha = p; }

// ---------- images (frames extracted by tools/prep_frames.sh) ----------
const cache = new Map();
export function img(src) {
  if (cache.has(src)) return cache.get(src);
  const im = new Image(); im.src = src;
  const p = im.decode().then(() => im).catch(() => null);
  cache.set(src, p);
  if (cache.size > 120) cache.delete(cache.keys().next().value);
  return p;
}

// ---------- Clawd ----------
// Clawd as the terminal draws it, in quarter-block "pixels" (each cell is 1 wide × 2 tall).
//   ▐▛███▜▌
//  ▝▜█████▛▘
//    ▘▘ ▝▝
const ART = [
  '...############...',
  '...##e######e##...',
  '.################.',
  '...############...',
  '....#.#....#.#....',
];
export const GW = 18, GH = 5;
export const CELLS = [], EYES = [];
ART.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') CELLS.push([x, y]); if (c === 'e') EYES.push([x, y]); }));
const FILLED = new Set([...CELLS, ...EYES].map(([x, y]) => x + ',' + y));
const isF = (x, y) => FILLED.has(x + ',' + y);
// outline of the silhouette (eyes filled) as one closed loop of grid corners, clockwise in screen space
export const OUTLINE = (() => {
  const next = new Map();
  for (const k of FILLED) {
    const [x, y] = k.split(',').map(Number);
    if (!isF(x, y - 1)) next.set(`${x},${y}`, [x + 1, y]);
    if (!isF(x + 1, y)) next.set(`${x + 1},${y}`, [x + 1, y + 1]);
    if (!isF(x, y + 1)) next.set(`${x + 1},${y + 1}`, [x, y + 1]);
    if (!isF(x - 1, y)) next.set(`${x},${y + 1}`, [x, y]);
  }
  const start = [...next.keys()][0]; const pts = []; let cur = start;
  do { const [x, y] = cur.split(',').map(Number); pts.push([x, y]); const n = next.get(cur); cur = n[0] + ',' + n[1]; } while (cur !== start && pts.length < 500);
  // drop collinear points
  return pts.filter((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    return !((a[0] === p[0] && p[0] === b[0]) || (a[1] === p[1] && p[1] === b[1]));
  });
})();
// grid → local px: centre of the figure at (0,0), cell u wide and 2u tall
export const gx = (x, u) => (x - GW / 2) * u;
export const gy = (y, u) => (y - GH / 2) * 2 * u;
export function outlinePts(u) { return OUTLINE.map(([x, y]) => [gx(x, u), gy(y, u)]); }
// resample a closed polygon to n points evenly by arc length
export function resample(pts, n) {
  const seg = []; let L = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, L, l]); L += l; }
  const out = [];
  for (let k = 0; k < n; k++) {
    const d = (k / n) * L; const s = seg.find((q) => d >= q[2] && d <= q[2] + q[3] + 1e-9) || seg[seg.length - 1];
    const f = (d - s[2]) / (s[3] || 1); out.push([lerp(s[0][0], s[1][0], f), lerp(s[0][1], s[1][1], f)]);
  }
  return out;
}
export function pathPoly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }

// plain Clawd: solid pixels with the eye holes; o.color, o.eye (eye colour; null = transparent holes), o.blink 0..1
export function clawdPixels(ctx, cx, cy, u, o = {}) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = o.color || C.clawd;
  for (const [x, y] of CELLS) ctx.fillRect(gx(x, u) - 0.5, gy(y, u) - 0.5, u + 1, 2 * u + 1);
  const eye = o.eye === undefined ? C.ink : o.eye;
  if (eye) {
    const b = clamp(o.blink || 0), h = 2 * u * (1 - 0.85 * b);
    for (const [x, y] of EYES) {
      ctx.fillStyle = o.color || C.clawd; ctx.fillRect(gx(x, u) - 0.5, gy(y, u) - 0.5, u + 1, 2 * u + 1);
      ctx.fillStyle = eye; ctx.fillRect(gx(x, u), gy(y, u) + (2 * u - h) / 2, u, h);
    }
  }
  ctx.restore();
}
// blink curve: closes for ~4 frames at given times
export function blinkAt(t, times) { for (const b of times) { const d = Math.abs(t - b); if (d < 0.07) return 1 - d / 0.07; } return 0; }

// Render a pass over `times` so TEXT collects every string, load the font chunks those strings need, then flag ready.
export async function boot(renderAt, times) {
  for (const s of times) { try { await renderAt(s); } catch (e) { console.error(e); } }
  const all = [...TEXT].join('') + '0123456789';
  await Promise.all([
    ...[400, 700, 900].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, all)),
    ...[400, 700].map((w) => document.fonts.load(`${w} 40px "JetBrains Mono"`, 'abcdefghijklmnopqrstuvwxyz0123456789')),
    document.fonts.load('400 40px "ZCOOL KuaiLe"', all),
  ]);
  await document.fonts.ready;
  await renderAt(times[0] || 0);
  window.__ready = true;
}
