// Clawd redrawn in each of the 15 styles. Every variant draws around (0,0) at cell size u; lt = seconds into its slot.
import {
  C, clamp, lerp, prog, easeOutCubic, easeInOutCubic, easeOutBack, spring, hash, noise1, text, rrect,
  CELLS, EYES, GW, GH, gx, gy, outlinePts, resample, pathPoly, clawdPixels, blinkAt, FUN, MONO, SANS,
} from './lib.js';

const OUT = (u) => outlinePts(u);
function eyesRect(ctx, u, color, inset = 0) {
  ctx.fillStyle = color;
  for (const [x, y] of EYES) ctx.fillRect(gx(x, u) + inset, gy(y, u) + inset, u - 2 * inset, 2 * u - 2 * inset);
}
function silhouette(ctx, u) { pathPoly(ctx, OUT(u)); }

// 01 逐帧手绘 · line boil: outline redrawn with fresh jitter every 2 frames (12 fps on 24), misregistered fill
function cel(ctx, lt, u) {
  const seed = Math.floor(lt * 12);
  const pts = resample(OUT(u), 140);
  const j = (i, k) => (hash(seed * 977 + i * 13 + k) - 0.5) * 3.6;
  // paper disc
  ctx.fillStyle = '#F3E3B5'; ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, r = 190 + (hash(seed * 31 + i) - 0.5) * 6; ctx.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 0.9); }
  ctx.fill();
  const bob = Math.round(Math.sin(lt * Math.PI * 2 * 0.8) * 3) * 2;
  ctx.translate(0, bob);
  ctx.save(); ctx.translate(4, 3); ctx.fillStyle = '#F5B730'; pathPoly(ctx, pts.map(([x, y], i) => [x + j(i, 1), y + j(i, 2)])); ctx.fill(); ctx.restore();
  ctx.fillStyle = C.clawd; pathPoly(ctx, pts.map(([x, y], i) => [x + j(i, 3) * 0.4, y + j(i, 4) * 0.4])); ctx.fill();
  ctx.strokeStyle = '#3B2417'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.lineWidth = pass ? 2.2 : 5;
    ctx.beginPath(); pts.forEach(([x, y], i) => { const X = x + j(i, 5 + pass * 9), Y = y + j(i, 6 + pass * 9); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = '#3B2417';
  for (const [x, y] of EYES) { ctx.beginPath(); ctx.ellipse(gx(x, u) + u / 2 + j(x, 7), gy(y, u) + u + j(x, 8), u * 0.55, u * 1.05, 0, 0, Math.PI * 2); ctx.fill(); }
  // hand-drawn sparkle strokes (cel FX layer)
  ctx.lineWidth = 4; ctx.strokeStyle = '#3B2417';
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k - 1) * 0.55, r0 = 115 + j(k, 9), r1 = 150 + j(k, 10) * 2;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0 * 1.3, Math.sin(a) * r0 * 0.9 - 10); ctx.lineTo(Math.cos(a) * r1 * 1.3 + j(k, 11), Math.sin(a) * r1 * 0.9 - 10); ctx.stroke();
  }
}

// 02 等轴 2.5D: voxels on a 30° isometric grid, rows "grow" up from the ground
function iso(ctx, lt, u) {
  const s = u * 0.8, D = 3, c30 = Math.cos(Math.PI / 6);
  const P = (X, Y, Z) => [(X - Z - 7.5) * c30 * s, (X + Z - 10.5) * 0.5 * s - (Y - 5) * s];
  // ground: a lavender slab with a 2:1 isometric grid
  ctx.fillStyle = '#CFC6FF'; pathPoly(ctx, [P(-2, 0, -4), P(20, 0, -4), P(20, 0, 8), P(-2, 0, 8)]); ctx.fill();
  ctx.fillStyle = '#9C8CF0'; pathPoly(ctx, [P(-2, 0, 8), P(20, 0, 8), P(20, -1.2, 8), P(-2, -1.2, 8)]); ctx.fill();
  ctx.fillStyle = '#7F6EDB'; pathPoly(ctx, [P(20, 0, 8), P(20, 0, -4), P(20, -1.2, -4), P(20, -1.2, 8)]); ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,200,.35)'; ctx.lineWidth = 1;
  for (let X = -2; X <= 20; X += 2) { ctx.beginPath(); ctx.moveTo(...P(X, 0, -4)); ctx.lineTo(...P(X, 0, 8)); ctx.stroke(); }
  for (let Z = -4; Z <= 8; Z += 2) { ctx.beginPath(); ctx.moveTo(...P(-2, 0, Z)); ctx.lineTo(...P(20, 0, Z)); ctx.stroke(); }
  const has = new Set([...CELLS, ...EYES].map(([x, y]) => x + ',' + y));
  const eye = new Set(EYES.map(([x, y]) => x + ',' + y));
  const all = [...CELLS, ...EYES].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  for (const [x, y] of all) {
    const row = GH - 1 - y, grow = clamp(easeOutBack(prog(lt, 0.15 + row * 0.16, 0.55 + row * 0.16)), 0, 1.08);
    if (grow <= 0) continue;
    const x0 = x, x1 = x + 1, y0 = row * 2, y1 = y0 + 2 * grow, z0 = 0, z1 = D;
    ctx.fillStyle = eye.has(x + ',' + y) ? '#2B2140' : C.clawd; pathPoly(ctx, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]); ctx.fill();
    if (!has.has(x + 1 + ',' + y)) { ctx.fillStyle = C.clawdDark; pathPoly(ctx, [P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1)]); ctx.fill(); }
    if (!has.has(x + ',' + (y - 1)) || grow < 1) { ctx.fillStyle = '#F4A988'; pathPoly(ctx, [P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)]); ctx.fill(); }
  }
}

// 03 扁平矢量: flat colour, elastic bounce with squash & stretch, flat long shadow
function flat(ctx, lt, u) {
  ctx.fillStyle = '#FFC93C'; ctx.beginPath(); ctx.arc(110, -95, 62 * spring(prog(lt, 0.1, 0.9)), 0, Math.PI * 2); ctx.fill();
  const p = (lt * 1.25) % 1, hgt = 4 * p * (1 - p) * 110;
  const sq = p < 0.12 ? 1 - Math.sin((p / 0.12) * Math.PI) * 0.22 : 1 + Math.sin(((p - 0.12) / 0.88) * Math.PI) * 0.07;
  ctx.fillStyle = 'rgba(20,20,60,.22)'; ctx.beginPath(); ctx.ellipse(0, 6 * u + 8, 130 * (1 - hgt / 300), 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(0, 5 * u - hgt); ctx.scale(1 / Math.sqrt(sq), sq); ctx.translate(0, -5 * u);
  clawdPixels(ctx, 0, 0, u, { color: '#FF6B4A', eye: '#1D1D5C', blink: blinkAt(lt, [2.2]) });
  ctx.restore();
}

// 04 线条动画: one continuous gold stroke drawn on (trim path), then a spark travels it
function line(ctx, lt, u) {
  const pts = resample(OUT(u), 240); const L = pts.length;
  const k = easeInOutCubic(prog(lt, 0.1, 2.0));
  ctx.strokeStyle = '#E6CB8E'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // lead-in line from the left edge (the line that "becomes" Clawd)
  ctx.beginPath(); ctx.moveTo(-260, pts[0][1]); ctx.lineTo(lerp(-260, pts[0][0], clamp(k * 4)), pts[0][1]); ctx.stroke();
  const n = Math.floor(clamp(k * 1.25 - 0.25) * L);
  if (n > 1) { ctx.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = pts[i % L]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  const e = prog(lt, 2.0, 2.4);
  if (e > 0) { ctx.lineWidth = 3; for (const [x, y] of EYES) { ctx.beginPath(); ctx.moveTo(gx(x, u) + u / 2, gy(y, u) + u * 0.2); ctx.lineTo(gx(x, u) + u / 2, gy(y, u) + u * 0.2 + 1.6 * u * easeOutCubic(e)); ctx.stroke(); } }
  const sp = lt > 2.0 ? pts[Math.floor(((lt - 2.0) * 90) % L)] : pts[Math.max(0, n) % L];
  ctx.fillStyle = '#FFF4D6'; ctx.shadowColor = '#FFE2A0'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(sp[0], sp[1], 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
}

// 05 3D 渲染: soft-rubber voxels with studio shading, long-tail float
function render3d(ctx, lt, u) {
  const fl = Math.sin(lt * 1.6) * 8, rot = Math.sin(lt * 1.1) * 0.04;
  ctx.save(); ctx.filter = 'blur(14px)'; ctx.fillStyle = 'rgba(150,60,90,.35)'; ctx.beginPath(); ctx.ellipse(0, 6 * u + 26, 150 - fl, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(0, fl - 6); ctx.rotate(rot);
  const drop = easeOutCubic(prog(lt, 0, 0.9)); ctx.translate(0, (1 - drop) * -260);
  for (const [x, y] of CELLS) {
    const X = gx(x, u), Y = gy(y, u), r = u * 0.45;
    const g = ctx.createLinearGradient(X, Y, X + u, Y + 2 * u); g.addColorStop(0, '#FFC2B0'); g.addColorStop(0.45, '#FF8E78'); g.addColorStop(1, '#C9564A');
    ctx.fillStyle = g; rrect(ctx, X - 1, Y - 1, u + 2, 2 * u + 2, r); ctx.fill();
  }
  // specular highlight band + eyes as glossy dark beads
  ctx.save(); silhouette(ctx, u); ctx.clip();
  const hl = ctx.createLinearGradient(0, -5 * u, 0, -2 * u); hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl; ctx.fillRect(-9 * u, -5 * u, 18 * u, 3 * u); ctx.restore();
  for (const [x, y] of EYES) {
    const g = ctx.createRadialGradient(gx(x, u) + u * 0.35, gy(y, u) + u * 0.5, 1, gx(x, u) + u / 2, gy(y, u) + u, u * 1.2);
    g.addColorStop(0, '#6B4D5C'); g.addColorStop(1, '#1E1218'); ctx.fillStyle = g; rrect(ctx, gx(x, u) + 1, gy(y, u) + 1, u - 2, 2 * u - 2, u * 0.45); ctx.fill();
  }
  ctx.restore();
}

// 06 形变动画: circle → capsule → Clawd, with squash & stretch over the morph
function morph(ctx, lt, u) {
  const N = 160, cl = resample(OUT(u), N);
  // start point alignment: rotate the circle so vertex 0 sits at the same angle as Clawd's vertex 0
  const a0 = Math.atan2(cl[0][1], cl[0][0]);
  const circ = Array.from({ length: N }, (_, i) => { const a = a0 + (i / N) * Math.PI * 2; return [Math.cos(a) * 80, Math.sin(a) * 80]; });
  const caps = circ.map(([x, y]) => [clamp(x * 1.9, -150, 150), y * 0.75]);
  const cyc = lt % 4.6;
  let k1 = easeInOutCubic(prog(cyc, 0.3, 0.75)), k2 = easeInOutCubic(prog(cyc, 0.75, 1.25));
  const back = easeInOutCubic(prog(cyc, 3.6, 4.3)); k1 *= 1 - back; k2 *= 1 - back;
  const pts = circ.map((c, i) => { const a = [lerp(c[0], caps[i][0], k1), lerp(c[1], caps[i][1], k1)]; return [lerp(a[0], cl[i][0], k2), lerp(a[1], cl[i][1], k2)]; });
  const v = Math.sin(clamp(k1 + k2, 0, 2) * Math.PI / 2 * 2) * 0.12;
  ctx.save(); ctx.scale(1 + v, 1 - v); ctx.rotate((k1 - k2) * 0.2);
  ctx.fillStyle = '#3D5BFF'; pathPoly(ctx, pts); ctx.fill();
  if (k2 > 0.92) eyesRect(ctx, u, '#F4F1EA');
  ctx.restore();
}

// 07 贴纸科普: photo-sticker Clawd (fat white outline + shadow) with a counting bar chart
function sticker(ctx, lt, u) {
  const pop = spring(prog(lt, 0.05, 0.75));
  ctx.save(); ctx.translate(-40, 0); ctx.rotate(-0.07); ctx.scale(pop, pop);
  ctx.shadowColor = 'rgba(30,40,60,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  silhouette(ctx, u); ctx.lineJoin = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.shadowColor = 'transparent';
  clawdPixels(ctx, 0, 0, u, { color: '#FF8A1F', eye: '#22252B' });
  ctx.restore();
  // mini chart
  const vals = [0.45, 0.7, 1.0];
  vals.forEach((v, i) => {
    const g = easeOutCubic(prog(lt, 0.8 + i * 0.25, 1.6 + i * 0.25));
    ctx.fillStyle = i === 2 ? '#FF8A1F' : '#5B6B80'; ctx.fillRect(150 + i * 34, 90 - 150 * v * g, 22, 150 * v * g);
  });
  ctx.fillStyle = '#5B6B80'; ctx.fillRect(140, 90, 120, 3);
  const n = Math.round(15 * easeOutCubic(prog(lt, 0.8, 2.4)));
  text(ctx, String(n), 150, -80, { size: 64, weight: 900, color: '#FF8A1F', font: SANS });
  text(ctx, '/15 种风格', 150 + (n >= 10 ? 76 : 40), -80, { size: 22, weight: 700, color: '#5B6B80' });
}

// 08 赛博 HUD: wireframe outline with glow, closing lock brackets, rotating reticle, scrambling digits
function hud(ctx, lt, u) {
  const lock = lt > 2.2, col = lock ? '#FF9A3D' : '#45E0FF';
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = 14;
  const pts = OUT(u), k = prog(lt, 0, 1.2);
  // dashed draw-on
  const per = pts.reduce((s, p, i) => s + Math.hypot(pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1]), 0);
  ctx.setLineDash([per * k, per]); pathPoly(ctx, pts); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 0.18; ctx.fillStyle = col; pathPoly(ctx, pts); ctx.fill(); ctx.globalAlpha = 1;
  eyesRect(ctx, u, col, 2);
  // reticle
  const R = 170, rot = lt * 0.9;
  ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, R, rot + i * 2.1, rot + i * 2.1 + 1.3); ctx.stroke(); }
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2 - rot * 0.5, r0 = R + 10, r1 = R + (i % 4 ? 16 : 26); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); }
  ctx.globalAlpha = 1;
  // brackets close in
  const b = lerp(230, 150, easeOutCubic(prog(lt, 1.0, 2.2))), bh = lerp(150, 95, easeOutCubic(prog(lt, 1.0, 2.2))), l = 30;
  ctx.lineWidth = 3;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(sx * b, sy * bh + -sy * l); ctx.lineTo(sx * b, sy * bh); ctx.lineTo(sx * b + -sx * l, sy * bh); ctx.stroke(); }
  ctx.restore();
  const sc = (n) => (lt < 2.2 ? String(Math.floor(hash(Math.floor(lt * 20) + n) * 1000)).padStart(3, '0') : null);
  text(ctx, 'TARGET  CLAWD', -235, 205, { size: 20, weight: 700, color: col, font: MONO, ls: 2 });
  text(ctx, lock ? 'LOCK 99.7%' : `SCAN ${sc(1)}.${sc(2)}`, 235, 205, { size: 20, weight: 700, color: col, font: MONO, align: 'right' });
  if (lock) text(ctx, '目标锁定', 0, 160, { size: 30, weight: 900, color: col, align: 'center', ls: 6 });
}

// 09 拼贴剪贴: halftone cut-out with a white scissor edge, newsprint scrap, stop-motion jitter at 12 fps
function collage(ctx, lt, u) {
  const f = Math.floor(lt * 12), jx = (hash(f) - 0.5) * 4, jy = (hash(f + 50) - 0.5) * 4, jr = (hash(f + 99) - 0.5) * 0.03;
  ctx.fillStyle = '#D9342B'; ctx.beginPath(); ctx.arc(-30, -10, 170, 0, Math.PI * 2); ctx.fill();
  // newsprint scrap
  ctx.save(); ctx.rotate(0.08); ctx.fillStyle = '#E9E2D0';
  ctx.beginPath(); ctx.moveTo(40, -190); for (let i = 0; i <= 12; i++) ctx.lineTo(40 + i * 18, -190 + (hash(i) - 0.5) * 10); ctx.lineTo(260, 20); for (let i = 12; i >= 0; i--) ctx.lineTo(40 + i * 18, 20 + (hash(i + 7) - 0.5) * 12); ctx.fill();
  ctx.fillStyle = 'rgba(40,30,20,.55)'; for (let r = 0; r < 12; r++) for (let c = 0; c < 4; c++) ctx.fillRect(52 + c * 52, -170 + r * 15, 44 * (0.6 + hash(r * 9 + c) * 0.4), 4);
  ctx.restore();
  ctx.save(); ctx.translate(jx, jy); ctx.rotate(jr - 0.04);
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 8;
  silhouette(ctx, u); ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = '#F7F3EA'; ctx.stroke(); ctx.fillStyle = '#F7F3EA'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save(); silhouette(ctx, u); ctx.clip(); ctx.fillStyle = '#E8B86A'; ctx.fillRect(-200, -100, 400, 200);
  ctx.fillStyle = '#8A3B1C';
  for (let y = -80; y < 80; y += 9) for (let x = -170; x < 170; x += 9) { const r = 1 + 3.2 * clamp((y + 80) / 160); ctx.beginPath(); ctx.arc(x + ((y / 9) % 2 ? 4.5 : 0), y, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  eyesRect(ctx, u, '#1A1410');
  ctx.restore();
  // a stamp label
  ctx.save(); ctx.translate(-190, 120); ctx.rotate(-0.12); ctx.fillStyle = '#111'; ctx.fillRect(-10, -34, 190, 46);
  text(ctx, 'CUT & PASTE', 0, 0, { size: 24, weight: 900, color: '#F7F3EA', font: SANS, ls: 1 }); ctx.restore();
}

// 10 弥散玻璃: drifting blurred colour blobs behind a frosted-glass Clawd with a 1 px highlight edge
function aurora(ctx, lt, u) {
  const blobs = (ctx2, extra) => {
    const B = [['#7A5CFF', -110, -40, 120, 0], ['#3FA9FF', 90, 30, 130, 2], ['#FF7AD9', 30, -90, 90, 4], ['#38E1D0', -40, 80, 80, 1]];
    for (const [c, x, y, r, ph] of B) { ctx2.fillStyle = c; ctx2.beginPath(); ctx2.arc(x + Math.sin(lt * 0.7 + ph) * 50, y + Math.cos(lt * 0.6 + ph) * 30, r + extra, 0, Math.PI * 2); ctx2.fill(); }
  };
  ctx.save(); ctx.filter = 'blur(40px)'; blobs(ctx, 0); ctx.restore();
  const s = 1.25, k = easeOutCubic(prog(lt, 0.1, 1.0));
  ctx.save(); ctx.scale(s, s); ctx.globalAlpha = k;
  ctx.save(); silhouette(ctx, u); ctx.clip(); ctx.filter = 'blur(70px)'; ctx.scale(1 / s, 1 / s); blobs(ctx, 40); ctx.filter = 'none'; ctx.restore();
  silhouette(ctx, u); ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.2; ctx.stroke();
  const g = ctx.createLinearGradient(0, -5 * u, 0, 5 * u); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.save(); silhouette(ctx, u); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(-10 * u, -5 * u, 20 * u, 10 * u); ctx.restore();
  eyesRect(ctx, u, 'rgba(20,20,60,.55)', 1);
  ctx.restore();
}

// 11 包豪斯: built on a strict grid, one move per beat (0.5 s), red / yellow / blue / black, no overshoot
function bauhaus(ctx, lt, u) {
  const beat = Math.floor(lt / 0.5);
  ctx.strokeStyle = 'rgba(20,20,20,.12)'; ctx.lineWidth = 1;
  for (let x = -9; x <= 9; x++) { ctx.beginPath(); ctx.moveTo(x * u * 2, -6 * u * 2); ctx.lineTo(x * u * 2, 6 * u * 2); ctx.stroke(); }
  for (let y = -6; y <= 6; y++) { ctx.beginPath(); ctx.moveTo(-9 * u * 2, y * u * 2); ctx.lineTo(9 * u * 2, y * u * 2); ctx.stroke(); }
  if (beat >= 6) { ctx.fillStyle = '#F2C230'; ctx.beginPath(); ctx.moveTo(-9 * u * 2 + 20, 6 * 2 * u); ctx.lineTo(-9 * u * 2 + 20 + 120, 6 * 2 * u); ctx.lineTo(-9 * u * 2 + 80, 6 * 2 * u - 110); ctx.fill(); }
  if (beat >= 7) { ctx.fillStyle = '#1F4FB0'; ctx.beginPath(); ctx.arc(9 * u * 2 - 10, -6 * u * 2 + 10, 100, Math.PI / 2, Math.PI); ctx.lineTo(9 * u * 2 - 10, -6 * u * 2 + 10); ctx.fill(); }
  const rows = clamp(beat, 0, 5);
  ctx.fillStyle = '#E63B2E';
  for (const [x, y] of CELLS) if (GH - 1 - y < rows) ctx.fillRect(gx(x, u), gy(y, u), u, 2 * u);
  if (beat >= 5) eyesRect(ctx, u, '#141414');
  const a = beat >= 8 ? Math.PI / 2 * Math.min(beat - 7, 3) : 0;
  ctx.save(); ctx.translate(0, -6 * u * 2 + 20); ctx.rotate(a * 0); ctx.fillStyle = '#141414'; ctx.fillRect(-9 * u * 2 + (beat % 2 ? 0 : 2 * u * 2), -6, 12 * u, 12); ctx.restore();
}

// 12 80s 合成波: chrome Clawd with double neon glow over a scrolling perspective grid, RGB split + scanlines
function synth(ctx, lt, u) {
  // sun
  const sg = ctx.createLinearGradient(0, -220, 0, 20); sg.addColorStop(0, '#FFE45C'); sg.addColorStop(0.5, '#FF6B6B'); sg.addColorStop(1, '#C724B1');
  ctx.save(); ctx.beginPath(); ctx.arc(0, -40, 170, Math.PI, 0); ctx.closePath(); ctx.clip(); ctx.fillStyle = sg; ctx.fillRect(-180, -220, 360, 190);
  ctx.fillStyle = '#1A0B2E'; for (let i = 0; i < 6; i++) { const y = -90 + i * 10 + i * i * 1.5; ctx.fillRect(-180, y, 360, 2 + i * 1.3); }
  ctx.restore();
  // grid floor
  ctx.save(); ctx.beginPath(); ctx.rect(-320, -40, 640, 220); ctx.clip();
  ctx.strokeStyle = '#FF3DA8'; ctx.lineWidth = 2; ctx.shadowColor = '#FF3DA8'; ctx.shadowBlur = 8;
  for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(i * 14, -40); ctx.lineTo(i * 90, 180); ctx.stroke(); }
  const off = (lt * 1.2) % 1;
  for (let i = 0; i < 9; i++) { const z = (i + off) / 9, y = -40 + 220 * z * z; ctx.globalAlpha = z; ctx.beginPath(); ctx.moveTo(-320, y); ctx.lineTo(320, y); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.translate(0, 30);
  const chrome = () => { const g = ctx.createLinearGradient(0, -5 * u, 0, 5 * u); g.addColorStop(0, '#E8F7FF'); g.addColorStop(0.45, '#6FD3FF'); g.addColorStop(0.5, '#2A1650'); g.addColorStop(0.62, '#FF8BD8'); g.addColorStop(1, '#FFF1C9'); return g; };
  ctx.globalCompositeOperation = 'lighter';
  ctx.save(); ctx.translate(-3, 0); ctx.fillStyle = 'rgba(255,0,60,.5)'; silhouette(ctx, u); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(3, 0); ctx.fillStyle = 'rgba(0,120,255,.5)'; silhouette(ctx, u); ctx.fill(); ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = chrome(); silhouette(ctx, u); ctx.fill();
  ctx.strokeStyle = '#FF3DA8'; ctx.lineWidth = 3; ctx.shadowColor = '#FF3DA8'; ctx.shadowBlur = 30; ctx.stroke(); ctx.shadowBlur = 6; ctx.strokeStyle = '#FFD1F0'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.shadowBlur = 0;
  eyesRect(ctx, u, '#1A0B2E');
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = -230; y < 190; y += 4) ctx.fillRect(-330, y, 660, 2);
}

// 13 像素风: shaded sprite, steps() timing at 10 fps hops, nearest-neighbour coins
function pixel(ctx, lt, u) {
  const p = 4;  // art pixel
  ctx.fillStyle = '#4FB0FF'; ctx.fillRect(-300, -220, 600, 330);
  ctx.fillStyle = '#7BC8FF'; for (let i = 0; i < 5; i++) ctx.fillRect(-300 + i * 140 + ((Math.floor(lt * 4) * p) % 140) * 0, -180 + (i % 2) * 40, 64, 16);
  // ground tiles
  for (let i = -8; i < 8; i++) { ctx.fillStyle = '#5BBF3A'; ctx.fillRect(i * 40, 90, 40, 12); ctx.fillStyle = '#9A5B2E'; ctx.fillRect(i * 40, 102, 40, 30); ctx.fillStyle = '#7A4520'; ctx.fillRect(i * 40 + 6, 110, 8, 8); ctx.fillRect(i * 40 + 24, 120, 8, 8); }
  const f = Math.floor(lt * 10), ph = f % 12;
  const hop = ph < 6 ? [0, 12, 20, 24, 20, 12][ph] : 0;
  const y0 = 90 - 5 * u - hop - 2;
  ctx.save(); ctx.translate(0, y0 + 5 * u);
  clawdPixels(ctx, 0, 0, u, { color: '#E07A50', eye: '#1B1030' });
  ctx.fillStyle = '#F7A47C'; for (const [x, y] of CELLS) if (y === 0) ctx.fillRect(gx(x, u), gy(y, u), u, u * 0.6);
  ctx.fillStyle = '#A84B2E'; for (const [x, y] of CELLS) if (y === 3) ctx.fillRect(gx(x, u), gy(y, u) + u, u, u);
  ctx.restore();
  // coins (4-frame spin)
  for (let i = 0; i < 3; i++) {
    if (f > 30 + i * 6) continue;
    const w = [12, 8, 3, 8][(f + i) % 4], cx = -170 + i * 70, cy = -60 - (i % 2) * 20;
    ctx.fillStyle = '#FFD23F'; ctx.fillRect(cx - w, cy - 14, w * 2, 28); ctx.fillStyle = '#B8860B'; ctx.fillRect(cx - w, cy + 10, w * 2, 4);
  }
  text(ctx, 'SCORE ' + String(Math.min(1500, f * 50)).padStart(6, '0'), 250, -140, { size: 22, weight: 700, color: '#fff', font: MONO, align: 'right' });
}

// 14 液态流动: metaball field — scattered drops flow together and fuse into Clawd, a drip falls off
const mb = typeof document !== 'undefined' ? document.createElement('canvas') : null;
function liquid(ctx, lt, u) {
  const SW = 330, SH = 240, sc = 2;  // field resolution, upscaled 2×
  mb.width = SW; mb.height = SH; const m = mb.getContext('2d'); const id = m.createImageData(SW, SH); const d = id.data;
  const k = easeInOutCubic(prog(lt, 0.1, 1.8));
  const balls = CELLS.flatMap(([x, y]) => [[x, y, 0.5], [x, y, 1.5]]).map(([x, y, oy], i) => {
    const tx = gx(x, u) + u / 2, ty = gy(y, u) + u * oy, a = hash(i) * 6.28, r = 120 + hash(i + 9) * 120;
    const sx = Math.cos(a) * r * 1.4, sy = Math.sin(a) * r * 0.7;
    return [lerp(sx, tx, k) + Math.sin(lt * 3 + i) * 2, lerp(sy, ty, k) + Math.cos(lt * 2.6 + i) * 2, u * 0.5];
  });
  const dp = (lt - 2.2) % 1.6; if (lt > 2.2) balls.push([gx(9, u), 5 * u + dp * dp * 220, u * 0.8 * (1 - dp * 0.2)]);
  if (lt > 2.2 && dp < 0.4) balls.push([gx(9, u), 5 * u + 4, u * 0.55]);
  const eyes = EYES.map(([x, y]) => [gx(x, u) + u / 2, gy(y, u) + u]);
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) {
    const X = (i - SW / 2) * sc, Y = (j - SH / 2) * sc; let f = 0;
    for (const [bx, by, r] of balls) { const dx = X - bx, dy = Y - by; f += (r * r) / (dx * dx + dy * dy + 1); }
    const o = (j * SW + i) * 4, a = clamp((f - 1.0) * 6);
    let eye = 0; if (k > 0.95) for (const [ex, ey] of eyes) if (Math.abs(X - ex) < u * 0.45 && Math.abs(Y - ey) < u * 0.95) eye = 1;
    const tt = clamp((Y + 90) / 220), sh = clamp((f - 0.9) * 0.6);
    d[o] = eye ? 40 : lerp(255, 180, tt) + sh * 30; d[o + 1] = eye ? 10 : lerp(120, 70, tt) + sh * 40; d[o + 2] = eye ? 60 : lerp(120, 230, tt); d[o + 3] = a * 255;
  }
  m.putImageData(id, 0, 0);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(mb, -SW * sc / 2, -SH * sc / 2, SW * sc, SH * sc); ctx.restore();
}

// 15 综艺花字: fat-outlined sticker Clawd on a burst, three-layer caption popping in with overshoot
function hanazi(ctx, lt, u) {
  const sp = spring(prog(lt, 0.0, 0.7));
  ctx.save(); ctx.rotate(lt * 0.15); ctx.fillStyle = '#FFE14D';
  ctx.beginPath(); for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, r = i % 2 ? 150 : 215; ctx.lineTo(Math.cos(a) * r * sp, Math.sin(a) * r * sp); } ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(0, -10); ctx.scale(sp, sp); ctx.rotate(Math.sin(lt * 5) * 0.04);
  silhouette(ctx, u); ctx.lineJoin = 'round'; ctx.lineWidth = 34; ctx.strokeStyle = '#FF6FB5'; ctx.stroke(); ctx.lineWidth = 20; ctx.strokeStyle = '#fff'; ctx.stroke();
  clawdPixels(ctx, 0, 0, u, { color: C.clawd, eye: C.ink, blink: blinkAt(lt, [1.8, 3.6]) });
  ctx.restore();
  // sweat drop + sparkles
  const sd = prog(lt, 1.6, 2.2);
  if (sd > 0) { ctx.fillStyle = '#5BC8FF'; ctx.beginPath(); const x = 150, y = -110 + sd * 20; ctx.moveTo(x, y - 22); ctx.quadraticCurveTo(x + 16, y + 4, x, y + 10); ctx.quadraticCurveTo(x - 16, y + 4, x, y - 22); ctx.fill(); }
  for (let i = 0; i < 4; i++) { const tw = Math.abs(Math.sin(lt * 4 + i * 1.7)); const x = [-200, 190, -160, 210][i], y = [-130, -40, 90, 120][i]; ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(x, y); ctx.scale(tw, tw); ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(4, -4); ctx.lineTo(16, 0); ctx.lineTo(4, 4); ctx.lineTo(0, 16); ctx.lineTo(-4, 4); ctx.lineTo(-16, 0); ctx.lineTo(-4, -4); ctx.fill(); ctx.restore(); }
  const words = ['绝', '绝', '子', '！'];
  words.forEach((w, i) => {
    const s = easeOutBack(prog(lt, 0.6 + i * 0.07, 0.9 + i * 0.07), 2.4); if (s <= 0) return;
    ctx.save(); ctx.translate(-105 + i * 72, 140); ctx.rotate(-0.06 + (i % 2) * 0.1); ctx.scale(s, s);
    text(ctx, w, 0, 0, { size: 84, weight: 400, font: FUN, color: '#FF4F9A', align: 'center', stroke: '#7A1E52', strokeW: 30 });
    text(ctx, w, 0, 0, { size: 84, weight: 400, font: FUN, color: '#FF4F9A', align: 'center', stroke: '#fff', strokeW: 16 });
    ctx.restore();
  });
}

export const VARIANTS = {
  '05-cel-boil': cel, '03-isometric': iso, '01-flat-vector': flat, '02-line-art': line, '04-3d-render': render3d,
  '08-morph': morph, '19-paperclip': sticker, '22-hud': hud, '06-collage': collage, '12-aurora-glass': aurora,
  '09-bauhaus': bauhaus, '10-synthwave': synth, '20-pixel': pixel, '07-liquid': liquid, '18-hanazi': hanazi,
};
