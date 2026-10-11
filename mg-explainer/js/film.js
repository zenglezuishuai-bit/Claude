// 「Clawd 的 15 种画法」— the whole film is drawn by renderAt(t) on one canvas, like the films it explains.
import {
  W, H, C, clamp, lerp, prog, env, easeOutCubic, easeInOutCubic, easeOutExpo, easeOutBack, spring, hash, noise1,
  text, typed, para, wrap, rrect, withAlpha, img, clawdPixels, blinkAt, outlinePts, pathPoly, gx, gy, CELLS, EYES,
  SANS, MONO, FUN, TEXT,
} from './lib.js';
import { VARIANTS } from './clawd.js';
import { STYLES } from './styles.js';

export const T = { hook: 0, pipe: 10, tour: 35, slot: 5, review: 110, outro: 122, end: 131, dur: 140 };
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');

// ---------------------------------------------------------------- shared pieces
function bgInk(t, tint) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  if (tint) {
    const g = ctx.createRadialGradient(W * 0.75, H * 0.3, 50, W * 0.75, H * 0.3, 1100);
    g.addColorStop(0, tint); g.addColorStop(1, 'rgba(20,20,19,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // dot grid
  ctx.fillStyle = 'rgba(250,249,245,0.045)';
  for (let y = 30; y < H; y += 48) for (let x = 30; x < W; x += 48) ctx.fillRect(x, y, 2, 2);
}
function grain(t) {
  // light film grain so the flat colours don't band after H.264
  const f = Math.floor(t * 30);
  ctx.save(); ctx.globalAlpha = 0.035;
  for (let i = 0; i < 700; i++) { const x = hash(f * 7 + i) * W, y = hash(f * 13 + i * 3) * H; ctx.fillStyle = i % 2 ? '#fff' : '#000'; ctx.fillRect(x, y, 2, 2); }
  ctx.restore();
}
function clawdBob(x, y, u, t, o = {}) {
  const b = Math.round(Math.sin(t * Math.PI * 2 * (o.hz || 0.9)) * 1.5) * (u / 4);
  clawdPixels(ctx, x, y + b, u, { blink: blinkAt(t % 4, [1.3, 3.1]), ...o });
}
function chip(s, x, y, o = {}) {
  font(o.size || 22, 700, o.font || MONO);
  const w = ctx.measureText(s).width + 32;
  ctx.fillStyle = o.bg || C.clay; rrect(ctx, x, y, w, (o.size || 22) + 20, 8); ctx.fill();
  text(ctx, s, x + 16, y + (o.size || 22) + 4, { size: o.size || 22, weight: 700, font: o.font || MONO, color: o.color || C.ink });
  return w;
}
function font(size, weight = 400, fam = SANS) { ctx.font = `${weight} ${size}px ${fam}`; }

// ---------------------------------------------------------------- 0–10 s hook
async function hook(t) {
  bgInk(t, 'rgba(217,119,87,0.10)');
  // terminal prompt
  const termA = 1 - easeInOutCubic(prog(t, 2.7, 3.2));
  if (termA > 0) withAlpha(ctx, termA * prog(t, 0.15, 0.5), () => {
    ctx.save(); ctx.translate(W / 2, H / 2 - 40 * (1 - termA)); ctx.scale(lerp(0.94, 1, termA), lerp(0.94, 1, termA));
    ctx.fillStyle = C.ink2; ctx.strokeStyle = C.slate; ctx.lineWidth = 2; rrect(ctx, -620, -120, 1240, 240, 18); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.clay; ctx.lineWidth = 2; rrect(ctx, -590, -90, 1180, 70, 10); ctx.stroke();
    clawdPixels(ctx, -545, -55, 3.2, { blink: blinkAt(t, [0.9]) });
    text(ctx, 'Claude Code', -500, -44, { size: 24, weight: 700, font: MONO, color: C.ivory });
    text(ctx, '~/mg-styles-15', 560, -44, { size: 22, font: MONO, color: C.muted, align: 'right' });
    const s = '做 15 种 MG 动态设计风格，每种一支 10 秒成片';
    const ty = typed(s, prog(t, 0.7, 2.3));
    text(ctx, '>', -580, 60, { size: 34, weight: 700, font: MONO, color: C.clay });
    const w = text(ctx, ty, -540, 60, { size: 34, weight: 500, color: C.ivory });
    if (Math.floor(t * 2.5) % 2 === 0 || (t > 0.7 && t < 2.3)) { ctx.fillStyle = C.ivory; ctx.fillRect(-540 + w + 6, 30, 16, 36); }
    TEXT.add(s);
    ctx.restore();
  });
  // wall of 15 films
  if (t > 2.7) {
    const gi = Math.min(299, Math.floor((t - 2.7) * 30) + 75);
    const im = await img(`out/frames/grid/${String(gi).padStart(3, '0')}.jpg`);
    const tw = 336, th = 189, gap = 16, X0 = (W - (5 * tw + 4 * gap)) / 2, Y0 = 150;
    const out = easeInOutCubic(prog(t, 7.2, 8.0));
    for (let k = 0; k < 15; k++) {
      const c = k % 5, r = Math.floor(k / 5);
      const s = spring(prog(t, 2.8 + (c + r) * 0.07, 3.55 + (c + r) * 0.07));
      if (s <= 0) continue;
      const cx = X0 + c * (tw + gap) + tw / 2, cy = Y0 + r * (th + gap) + th / 2;
      ctx.save(); ctx.translate(lerp(cx, W / 2, out * 0.35), lerp(cy, H / 2, out * 0.35)); ctx.scale(s * (1 - out * 0.4), s * (1 - out * 0.4)); ctx.globalAlpha = 1 - out;
      rrect(ctx, -tw / 2, -th / 2, tw, th, 10); ctx.save(); ctx.clip();
      if (im) ctx.drawImage(im, c * 384, r * 216, 384, 216, -tw / 2, -th / 2, tw, th);
      ctx.restore();
      ctx.strokeStyle = 'rgba(250,249,245,.12)'; ctx.lineWidth = 1.5; rrect(ctx, -tw / 2, -th / 2, tw, th, 10); ctx.stroke();
      ctx.restore();
    }
    const cap = (s, a, b, y) => withAlpha(ctx, env(t, a, b, 0.25, 0.25), () => {
      const k = easeOutCubic(prog(t, a, a + 0.4));
      text(ctx, s, W / 2, y + 20 * (1 - k), { size: 50, weight: 900, color: C.ivory, align: 'center' });
    });
    cap('这 15 支 MG 动画，没用任何生图、生视频模型', 3.7, 5.7, 900);
    cap('每一帧画面、每一个音符，都是 Claude 写代码"算"出来的', 5.75, 7.6, 900);
    withAlpha(ctx, env(t, 5.75, 7.6, 0.25, 0.25), () => { ctx.fillStyle = C.clay; ctx.fillRect(W / 2 - 60, 930, 120 * easeOutCubic(prog(t, 5.9, 6.5)), 5); });
  }
  // title card
  if (t > 7.6) {
    const s = spring(prog(t, 7.7, 8.5));
    const u = 24 * s;
    if (u > 0.3) clawdBob(W / 2, 400 - 30 * (1 - s), u, t, { blink: blinkAt(t, [9.2]) });
    const k = easeOutExpo(prog(t, 8.15, 8.6));
    withAlpha(ctx, k, () => {
      ctx.save(); ctx.translate(W / 2, 640); ctx.scale(lerp(1.25, 1, k), lerp(1.25, 1, k));
      text(ctx, 'Clawd 的 15 种画法', 0, 0, { size: 116, weight: 900, color: C.ivory, align: 'center', ls: 4 });
      ctx.restore();
    });
    withAlpha(ctx, prog(t, 8.6, 9.0), () => {
      text(ctx, 'AI 用代码做 MG 动画，是怎么一回事？', W / 2, 740, { size: 40, weight: 500, color: C.oat, align: 'center', ls: 2 });
      ctx.fillStyle = C.clay; const w = 360 * easeOutCubic(prog(t, 8.6, 9.3)); ctx.fillRect(W / 2 - w / 2, 785, w, 4);
    });
  }
}

// ---------------------------------------------------------------- 10–35 s pipeline
const STEPS = ['提示词', '网页代码', '逐帧截图', '代码配乐', '合成成片'];
function pipeBar(t, cur) {
  const x0 = 260, x1 = 1660, y = 92;
  ctx.strokeStyle = C.slate; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  const pk = (cur + clamp(prog(t, 10 + cur * 5 + 0.0, 10 + cur * 5 + 0.6))) / 4;
  ctx.strokeStyle = C.clay; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, clamp((cur) / 4)), y); ctx.stroke();
  void pk;
  STEPS.forEach((s, i) => {
    const x = lerp(x0, x1, i / 4), on = i === cur, done = i < cur;
    font(24, 700); const w = ctx.measureText(s).width + 56;
    const pop = on ? 1 + 0.08 * (1 - easeOutCubic(prog(t, 10 + cur * 5, 10 + cur * 5 + 0.4))) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
    ctx.fillStyle = on ? C.clay : C.ink; ctx.strokeStyle = on || done ? C.clay : C.slate; ctx.lineWidth = 2.5;
    rrect(ctx, -w / 2, -26, w, 52, 26); ctx.fill(); ctx.stroke();
    text(ctx, `${i + 1} ${s}`, 0, 9, { size: 24, weight: 700, color: on ? C.ink : done ? C.clay : C.muted, align: 'center' });
    ctx.restore();
  });
}
function stepHead(t, a, n, title, sub, extra) {
  const k = easeOutCubic(prog(t, a + 0.1, a + 0.6));
  withAlpha(ctx, k, () => {
    text(ctx, `STEP ${n}/5`, 120, 230 - 10 * (1 - k), { size: 24, weight: 700, font: MONO, color: C.clay, ls: 3 });
    text(ctx, title, 116, 320 - 16 * (1 - k), { size: 76, weight: 900, color: C.ivory });
  });
  withAlpha(ctx, prog(t, a + 0.5, a + 1.0), () => para(ctx, sub, 120, 410, 700, { size: 36, weight: 400, color: C.oat, lh: 60 }));
  if (extra) withAlpha(ctx, prog(t, a + 1.6, a + 2.1), () => para(ctx, extra, 120, 760, 700, { size: 26, weight: 400, color: C.muted, lh: 42, font: SANS }));
}
const bounceY = (tt) => { const p = (tt * 0.9) % 1; return -4 * p * (1 - p) * 120; };
function miniFrame(x, y, w, h, tt, o = {}) {
  ctx.fillStyle = o.bg || '#2B3FE0'; rrect(ctx, x, y, w, h, o.r ?? 6); ctx.fill();
  ctx.save(); rrect(ctx, x, y, w, h, o.r ?? 6); ctx.clip();
  const u = h / 24;
  ctx.fillStyle = 'rgba(20,20,60,.25)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.82, w * 0.22, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  clawdPixels(ctx, x + w / 2, y + h * 0.82 - 5 * u + bounceY(tt) * (h / 330), u, { color: '#FF6B4A', eye: '#1D1D5C' });
  ctx.restore();
}

async function pipeline(t) {
  bgInk(t, 'rgba(217,119,87,0.07)');
  const i = clamp(Math.floor((t - T.pipe) / 5), 0, 4), a = T.pipe + i * 5, lt = t - a;
  pipeBar(t, i);
  // the presenter
  const look = i === 0 ? 1 : 0;
  clawdBob(300, 960, 9, t, { look });
  const fade = env(t, a, a + 5, 0.35, i === 4 ? 0.01 : 0.3);
  withAlpha(ctx, fade, () => [step1, step2, step3, step4, step5][i](t, lt, a));
}
function card(x, y, w, h, o = {}) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = o.bg || C.ink2; rrect(ctx, x, y, w, h, o.r || 18); ctx.fill(); ctx.restore();
  if (o.stroke !== false) { ctx.strokeStyle = o.stroke || C.ink3; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, o.r || 18); ctx.stroke(); }
}
function windowBar(x, y, w, title, o = {}) {
  ctx.fillStyle = o.bg || '#2A2926'; ctx.beginPath(); ctx.roundRect(x, y, w, 44, [18, 18, 0, 0]); ctx.fill();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 26 + k * 24, y + 22, 7, 0, Math.PI * 2); ctx.fill(); });
  text(ctx, title, x + 110, y + 30, { size: 20, font: MONO, color: C.muted });
}

function step1(t, lt) {
  stepHead(t, T.pipe, 1, '一份提示词', '每种风格只给 AI 一份提示词。AI 当导演，照着它构思、写代码。',
    '提示词都在仓库的 prompts/ 文件夹里，可以直接复制');
  const X = 940, Y = 200, Wd = 860, Hd = 720;
  const k = easeOutCubic(prog(lt, 0.2, 0.8));
  ctx.save(); ctx.translate(0, 40 * (1 - k)); ctx.globalAlpha *= k;
  card(X, Y, Wd, Hd, { bg: C.ivory, stroke: false });
  windowBar(X, Y, Wd, 'prompts/01-flat-vector.md', { bg: C.oat });
  const L = [
    ['# Style', 'h', 0], ['扁平矢量 Flat / Vector 2D Motion Graphics', 'b', 0], ['', '', 0],
    ['# Output (fixed)', 'h', 1], ['1920×1080, 30 fps, exactly 10.000 s, H.264 MP4', 'b', 1], ['', '', 1],
    ['# Creative seed', 'h', 2], ['0–2 s 钩子 → 升级 → 高潮 → 结尾画面', 'b', 2], ['配色 3–6 个色值 · 字体气质 · 配乐', 'b', 2], ['', '', 2],
    ['# Signature features', 'h', 3], ['弹性缓动 cubic-bezier(0.34,1.56,0.64,1)', 'b', 3], ['元素错峰入场 stagger 2–4 帧', 'b', 3],
  ];
  const tags = [['风格', C.slate], ['输出规格', C.blue], ['创意种子 · 可以改', C.green], ['标志特征 · 别删', C.clay]];
  let y = Y + 110;
  const sec = clamp(Math.floor((lt - 0.9) / 0.85), -1, 3);
  L.forEach(([s, kind, g], j) => {
    const ap = prog(lt, 0.5 + j * 0.12, 0.7 + j * 0.12);
    if (ap > 0) withAlpha(ctx, ap, () => {
      if (kind === 'h') {
        const on = g === sec;
        if (g <= sec) { ctx.fillStyle = tags[g][1]; ctx.fillRect(X + 34, y - 30, 6, (g === 2 ? 3 : g === 3 ? 3 : 2) * 50 - 12); }
        text(ctx, s, X + 60, y, { size: 30, weight: 700, font: MONO, color: C.ink });
        if (g <= sec) {
          const kk = easeOutBack(prog(lt, 0.9 + g * 0.85, 1.3 + g * 0.85));
          ctx.save(); ctx.translate(X + Wd - 40, y - 12); ctx.scale(kk, kk);
          font(22, 700); const w = ctx.measureText(tags[g][0]).width + 28;
          ctx.fillStyle = tags[g][1]; rrect(ctx, -w, -20, w, 40, 20); ctx.fill();
          text(ctx, tags[g][0], -w / 2, 8, { size: 22, weight: 700, color: '#fff', align: 'center' });
          ctx.restore();
        }
        void on;
      } else if (s) text(ctx, s, X + 60, y, { size: 27, weight: 500, font: /[一-鿿]/.test(s) ? SANS : MONO, color: C.slate });
    });
    y += s ? 50 : 26;
  });
  ctx.restore();
}

function step2(t, lt) {
  stepHead(t, T.pipe + 5, 2, '写成一个网页', '画面就是一个网页。它只认一个函数 renderAt(t)：给它任意时刻 t，就画出那一帧。',
    '同一个 t 永远画出同一帧，所以渲染多少遍结果都一样');
  const X = 940, Y = 200, Wd = 860;
  card(X, Y, Wd, 380);
  windowBar(X, Y, Wd, 'demos/01-flat-vector/index.html');
  const code = [
    [['window', C.ivory], ['.renderAt', C.gold], [' = (t) => {', C.ivory]],
    [['  const ', C.blue], ['y = bounce(t);', C.ivory], ['      // 弹性缓动', C.muted]],
    [['  drawClawd', C.gold], ['(ctx, 960, y);', C.ivory], ['  // 画出这一帧', C.muted]],
    [['};', C.ivory]],
  ];
  const total = code.flat().reduce((s, [p]) => s + p.length, 0);
  let budget = Math.floor(total * prog(lt, 0.4, 2.2));
  code.forEach((ln, r) => {
    let x = X + 40;
    text(ctx, String(r + 1), X + 22, Y + 110 + r * 62, { size: 22, font: MONO, color: C.slate, align: 'right' });
    for (const [p, col] of ln) {
      if (budget <= 0) break;
      const s = p.slice(0, budget); budget -= p.length;
      x += text(ctx, s, x + 14, Y + 110 + r * 62, { size: 28, font: /[一-鿿]/.test(s) ? SANS : MONO, color: col, weight: 500 });
    }
  });
  // preview with scrubber
  const PY = 610, PH = 330;
  card(X, PY, Wd, PH, { bg: '#2B3FE0', stroke: false });
  const tt = 10 * (0.5 - 0.5 * Math.cos(clamp((lt - 1.2) / 3.6) * Math.PI * 1.5));
  ctx.save(); rrect(ctx, X, PY, Wd, PH, 18); ctx.clip();
  miniFrame(X, PY, Wd, PH, tt, { r: 0 });
  ctx.restore();
  // scrubber
  const sx0 = X + 40, sx1 = X + Wd - 40, sy = PY + PH - 34;
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(sx0, sy, sx1 - sx0, 4);
  ctx.fillStyle = '#fff'; ctx.fillRect(sx0, sy, (sx1 - sx0) * tt / 10, 4);
  ctx.beginPath(); ctx.arc(sx0 + (sx1 - sx0) * tt / 10, sy + 2, 11, 0, Math.PI * 2); ctx.fill();
  chip(`renderAt(${tt.toFixed(2)})`, X + 30, PY + 26, { bg: '#fff', color: '#1D1D5C', size: 24 });
}

function step3(t, lt) {
  stepHead(t, T.pipe + 10, 3, '逐帧拍下来', '无头 Chrome 打开这个网页，t 每前进 1/30 秒就截一张图。',
    '10 秒 × 30 帧 = 300 张 PNG');
  const X = 940, Wd = 860;
  const fr = Math.min(300, Math.floor(easeInOutCubic(prog(lt, 0.4, 4.3)) * 300));
  // counter
  text(ctx, String(fr).padStart(3, '0'), X, 330, { size: 150, weight: 700, font: MONO, color: C.ivory });
  text(ctx, '/ 300 帧', X + 290, 330, { size: 40, weight: 700, color: C.muted });
  text(ctx, `t = ${(fr / 30).toFixed(3)} s`, X + Wd, 330, { size: 32, weight: 500, font: MONO, color: C.clay, align: 'right' });
  // film strip scrolling through the camera gate
  const SY = 420, FH = 200, FW = 356, gap = 24;
  ctx.fillStyle = '#0B0B0A'; ctx.fillRect(X - 40, SY - 40, Wd + 80, FH + 80);
  ctx.save(); ctx.beginPath(); ctx.rect(X - 40, SY - 40, Wd + 80, FH + 80); ctx.clip();
  ctx.fillStyle = '#3A3936';
  const scroll = (fr * (FW + gap) / 6) % 40;
  for (let x = X - 40 - scroll; x < X + Wd + 80; x += 40) { ctx.fillRect(x, SY - 28, 20, 14); ctx.fillRect(x, SY + FH + 14, 20, 14); }
  const pos = fr / 6;   // strip advances one thumbnail every 6 frames
  for (let k = -1; k < 4; k++) {
    const idx = Math.floor(pos) + k; if (idx < 0) continue;
    const x = X + (k - (pos % 1)) * (FW + gap);
    miniFrame(x, SY, FW, FH, idx * 6 / 30, { r: 4 });
    text(ctx, `#${String(idx * 6).padStart(3, '0')}`, x + 12, SY + 30, { size: 18, font: MONO, color: 'rgba(255,255,255,.7)' });
  }
  ctx.restore();
  // shutter flash on the gate
  const fl = 1 - ((lt * 6) % 1);
  ctx.strokeStyle = `rgba(250,249,245,${0.5 + 0.5 * fl})`; ctx.lineWidth = 4; rrect(ctx, X - 8, SY - 8, FW + 16, FH + 16, 8); ctx.stroke();
  withAlpha(ctx, fl * 0.25 * (fr < 300 ? 1 : 0), () => { ctx.fillStyle = '#fff'; rrect(ctx, X, SY, FW, FH, 4); ctx.fill(); });
  text(ctx, 'headless Chrome  ·  page.screenshot()', X, SY + FH + 100, { size: 26, font: MONO, color: C.muted });
}

// a deterministic "waveform" whose hits sit on the cue times
const CUES = [[0.5, 'impact'], [1.03, 'launch'], [2.2, 'ping'], [4.0, 'build'], [6.0, 'drop'], [8.5, 'logo']];
function wave(x) { // x in 0..10 s → amplitude 0..1
  let a = 0.12 + 0.08 * Math.abs(noise1(x * 9)) + (x > 6 && x < 8.5 ? 0.25 : x > 4 ? 0.12 * (x - 4) / 2 : 0);
  for (const [c] of CUES) if (x >= c) a += 0.75 * Math.exp(-(x - c) * 7);
  return clamp(a * (0.75 + 0.25 * Math.abs(Math.sin(x * 47.0))), 0, 1);
}
function step4(t, lt) {
  stepHead(t, T.pipe + 15, 4, '声音也是写出来的', '音乐和音效用 Python 代码合成。audio.py 和画面读同一张 cues 时间表，每个动作都卡在点上。',
    '合成器 + 103 个真实乐器采样，响度统一做到 −14 LUFS');
  const X = 940, Wd = 860, Y = 210;
  card(X, Y, Wd, 120);
  text(ctx, "m.sfx(sfx.pop(), at=T('impact'))", X + 36, Y + 72, { size: 30, font: MONO, color: C.gold, weight: 500 });
  // ruler
  const RY = 470, RX0 = X, RX1 = X + Wd, sx = (s) => lerp(RX0, RX1, s / 10);
  ctx.strokeStyle = C.slate; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(RX0, RY); ctx.lineTo(RX1, RY); ctx.stroke();
  for (let s = 0; s <= 10; s++) { ctx.beginPath(); ctx.moveTo(sx(s), RY - 8); ctx.lineTo(sx(s), RY + 8); ctx.stroke(); text(ctx, s + 's', sx(s), RY + 38, { size: 18, font: MONO, color: C.muted, align: 'center' }); }
  text(ctx, 'cues.json', RX0, RY - 100, { size: 24, font: MONO, color: C.muted });
  CUES.forEach(([c, name], k) => {
    const p = easeOutBack(prog(lt, 0.5 + k * 0.15, 0.9 + k * 0.15)); if (p <= 0) return;
    ctx.save(); ctx.translate(sx(c), RY); ctx.scale(p, p);
    ctx.fillStyle = C.clay; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(14, 0); ctx.lineTo(0, 14); ctx.lineTo(-14, 0); ctx.fill();
    text(ctx, name, 0, -30 - (k % 2) * 30, { size: 20, font: MONO, color: C.ivory, align: 'center' });
    ctx.restore();
  });
  // waveform drawing on
  const WY = 700, amp = 150, head = 10 * easeInOutCubic(prog(lt, 1.4, 4.4));
  ctx.fillStyle = C.clay;
  for (let s = 0; s < head; s += 0.05) { const a = wave(s) * amp; ctx.fillRect(sx(s), WY - a, Math.max(2, (RX1 - RX0) / 200 - 2), a * 2); }
  CUES.forEach(([c]) => { if (c < head) { ctx.strokeStyle = 'rgba(217,119,87,.45)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(c), RY + 14); ctx.lineTo(sx(c), WY - amp); ctx.stroke(); ctx.setLineDash([]); } });
  ctx.fillStyle = C.ivory; ctx.fillRect(sx(head) - 1, WY - amp - 10, 3, amp * 2 + 20);
  text(ctx, 'out/audio.wav', RX1, WY + amp + 50, { size: 22, font: MONO, color: C.muted, align: 'right' });
}

function step5(t, lt) {
  stepHead(t, T.pipe + 20, 5, '合成成片', '最后用 ffmpeg 把 300 帧画面和音轨合在一起，长度精确到 10.000 秒。',
    '3D 那支例外：画面先用 Blender 渲染，再交给网页叠字和颗粒');
  const X = 940, Wd = 860;
  const m = easeInOutCubic(prog(lt, 0.6, 1.8));
  // strip + wave converge into the file
  const fx = X + Wd / 2, fy = 600;
  for (let k = 0; k < 4; k++) {
    const x = lerp(X + k * 210, fx - 80, m), y = lerp(260, fy - 40, m), s = lerp(1, 0.2, m);
    withAlpha(ctx, 1 - m * 0.9, () => miniFrame(x, y, 190 * s, 107 * s, k * 0.3, { r: 4 }));
  }
  withAlpha(ctx, 1 - m, () => { ctx.fillStyle = C.clay; for (let s = 0; s < 10; s += 0.06) { const a = wave(s) * 60 * (1 - m * 0.8); ctx.fillRect(lerp(X + s * 86, fx, m), lerp(470, fy, m) - a, 3, a * 2); } });
  const p = spring(prog(lt, 1.6, 2.4));
  if (p > 0) {
    ctx.save(); ctx.translate(fx, fy); ctx.scale(p, p);
    card(-300, -170, 600, 340, { bg: C.ivory, stroke: false });
    ctx.fillStyle = C.clay; rrect(ctx, -260, -130, 150, 190, 14); ctx.fill();
    ctx.fillStyle = C.ivory; ctx.beginPath(); ctx.moveTo(-205, -70); ctx.lineTo(-150, -35); ctx.lineTo(-205, 0); ctx.fill();
    text(ctx, 'MP4', -185, 40, { size: 28, weight: 700, font: MONO, color: C.ivory, align: 'center' });
    text(ctx, 'video.mp4', -70, -80, { size: 44, weight: 700, font: MONO, color: C.ink });
    ['1920 × 1080 · 30 fps', '10.000 s · H.264', 'AAC 48 kHz · −14 LUFS'].forEach((s, k) => text(ctx, s, -70, -20 + k * 44, { size: 26, font: MONO, color: C.slate }));
    ctx.restore();
  }
  withAlpha(ctx, prog(lt, 3.4, 3.9), () => {
    const k = easeOutCubic(prog(lt, 3.4, 3.9));
    text(ctx, '下面，看 Clawd 换 15 种画法  →', X + Wd - 40 * (1 - k), 900, { size: 40, weight: 900, color: C.clay, align: 'right' });
  });
}

// ---------------------------------------------------------------- 35–110 s tour
async function tour(t) {
  const i = clamp(Math.floor((t - T.tour) / T.slot), 0, 14), S = STYLES[i], lt = t - T.tour - i * T.slot;
  const fi = clamp(Math.floor(lt * 30), 0, 149);
  const im = await img(`out/frames/${S.slug}/${String(fi).padStart(3, '0')}.jpg`);
  bgInk(t, hexA(S.accent, 0.16));
  // big ghost number
  withAlpha(ctx, 0.06, () => text(ctx, String(i + 1).padStart(2, '0'), W - 40, 1060, { size: 520, weight: 900, color: S.accent, align: 'right', font: MONO }));
  const kin = easeOutCubic(prog(lt, 0, 0.45));
  // clip window
  const X = 70, Y = 110, CW = 1120, CH = 630;
  ctx.save(); ctx.translate(X + CW / 2, Y + CH / 2); const sc = lerp(0.94, 1, kin); ctx.scale(sc, sc); ctx.translate(-(X + CW / 2), -(Y + CH / 2)); ctx.globalAlpha = kin;
  card(X, Y - 44, CW, CH + 44, { bg: '#000', stroke: false });
  windowBar(X, Y - 44, CW, `demos/${S.slug}/index.html`);
  const ft = S.start + lt;
  text(ctx, `renderAt(${ft.toFixed(2)})`, X + CW - 24, Y - 14, { size: 20, font: MONO, color: S.accent, align: 'right' });
  ctx.save(); ctx.beginPath(); ctx.roundRect(X, Y, CW, CH, [0, 0, 18, 18]); ctx.clip();
  if (im) {
    if (S.portrait) {
      ctx.save(); ctx.filter = 'blur(30px) brightness(0.55)'; ctx.drawImage(im, X - 40, Y - 400, CW + 80, (CW + 80) * 16 / 9); ctx.restore();
      ctx.fillStyle = '#111'; rrect(ctx, X + CW / 2 - 190, Y + 8, 380, CH - 16, 30); ctx.fill();
      ctx.save(); rrect(ctx, X + CW / 2 - 177, Y + 14, 354, CH - 28, 24); ctx.clip(); ctx.drawImage(im, X + CW / 2 - 177, Y + 14, 354, CH - 28); ctx.restore();
    } else ctx.drawImage(im, X, Y, CW, CH);
  }
  ctx.restore();
  ctx.restore();
  // route line under the clip
  withAlpha(ctx, prog(lt, 0.5, 0.9), () => {
    text(ctx, '代码路线', X, 840, { size: 24, weight: 700, color: C.muted, ls: 2 });
    text(ctx, S.route, X + 120, 840, { size: 30, weight: 700, color: C.ivory });
  });
  // progress dots
  for (let k = 0; k < 15; k++) {
    const on = k === i, x = X + k * 40;
    ctx.fillStyle = k < i ? hexA(C.ivory, 0.5) : on ? S.accent : C.slate;
    if (on) { rrect(ctx, x - 2, 912, 28, 12, 6); ctx.fill(); } else { ctx.beginPath(); ctx.arc(x + 6, 918, 6, 0, Math.PI * 2); ctx.fill(); }
  }
  text(ctx, '每支原片 10 秒 · 这里截取 5 秒 · 声音为原片音轨', X, 990, { size: 22, color: C.muted });
  // right panel
  const RX = 1260;
  const a1 = easeOutCubic(prog(lt, 0.1, 0.5)), a2 = easeOutCubic(prog(lt, 0.3, 0.75));
  withAlpha(ctx, a1, () => {
    text(ctx, `${String(i + 1).padStart(2, '0')} / 15`, RX, 112 + 20 * (1 - a1), { size: 28, weight: 700, font: MONO, color: S.accent, ls: 2 });
    text(ctx, S.name, RX - 4, 210 + 20 * (1 - a1), { size: 88, weight: 900, color: C.ivory });
    text(ctx, S.en, RX, 262 + 20 * (1 - a1), { size: 26, weight: 500, font: MONO, color: C.muted });
  });
  withAlpha(ctx, a2, () => {
    ctx.fillStyle = S.accent; ctx.fillRect(RX, 300, 64 * a2, 5);
    text(ctx, '标志技法', RX, 362, { size: 24, weight: 700, color: S.accent, ls: 2 });
    para(ctx, S.tech, RX, 412, 590, { size: 33, weight: 500, color: C.ivory, lh: 52 });
  });
  // Clawd's card: Clawd redrawn in this style
  const CX = RX, CY = 600, CWd = 600, CHt = 420;
  const pk = spring(prog(lt, 0.2, 0.9));
  ctx.save(); ctx.translate(CX + CWd / 2, CY + CHt / 2); ctx.scale(pk, pk); ctx.translate(-(CX + CWd / 2), -(CY + CHt / 2));
  card(CX, CY, CWd, CHt, { bg: S.bg, stroke: false, r: 22 });
  ctx.save(); rrect(ctx, CX, CY, CWd, CHt, 22); ctx.clip();
  ctx.translate(CX + CWd / 2, CY + CHt / 2 + 6); ctx.scale(1.12, 1.12);
  VARIANTS[S.slug](ctx, lt, 13);
  ctx.restore();
  const dark = ['#0F1626', '#06121A', '#120E2E', '#1A0B2E', '#2A0F3D', '#2B3FE0'].includes(S.bg);
  chip('Clawd · ' + S.name, CX + 18, CY + 18, { size: 18, bg: dark ? 'rgba(255,255,255,.14)' : 'rgba(20,20,19,.10)', color: dark ? C.ivory : C.ink, font: SANS });
  ctx.restore();
  // transition wipe at the slot boundary
  const w1 = prog(lt, 0, 0.32);
  if (w1 < 1) { ctx.fillStyle = S.accent; const e = easeInOutCubic(w1); ctx.fillRect(lerp(0, W, e), 0, W * (1 - e) * 0.6, H); }
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------------------------------------------------------------- 110–122 s review
const DIMS = [['风格还原度', 'style_fidelity'], ['创意与惊艳', 'concept_wow'], ['运动手感', 'motion_craft'], ['版式与字体', 'design_typography'],
  ['质感细节', 'finish_texture'], ['声画同步', 'sound_sync'], ['技术规格', 'technical']];
function review(t) {
  const lt = t - T.review;
  ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20,20,19,.05)'; for (let y = 30; y < H; y += 48) for (let x = 30; x < W; x += 48) ctx.fillRect(x, y, 2, 2);
  const k = easeOutCubic(prog(lt, 0.1, 0.6));
  withAlpha(ctx, k, () => {
    text(ctx, 'STEP +1', 120, 150, { size: 24, weight: 700, font: MONO, color: C.clay, ls: 3 });
    text(ctx, '做完不算完：AI 评委挑刺', 116, 240, { size: 76, weight: 900, color: C.ink });
  });
  const A = env(lt, 0, 6.2, 0.3, 0.4), B = env(lt, 6.0, 12.5, 0.4, 0.01);
  withAlpha(ctx, A, () => {
    para(ctx, '另开一个 AI 会话当评委：逐帧截图、7 个维度打分、列出修改清单，再交回去改。每支原片都这样改了两轮。', 120, 330, 760, { size: 34, color: C.slate, lh: 56 });
    // loop: make → review → revise
    const cx = 480, cy = 780, R = 170, nodes = [['制作', -Math.PI / 2], ['评审', Math.PI / 6], ['修改', Math.PI * 5 / 6]];
    ctx.strokeStyle = C.oat; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    const run = clamp((lt - 0.8) / 4.4) * 2;   // two laps
    ctx.strokeStyle = C.clay; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (run % 1 || (run >= 1 ? 1 : 0)) * Math.PI * 2); ctx.stroke();
    const a = -Math.PI / 2 + (run % 1) * Math.PI * 2;
    ctx.fillStyle = C.clay; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 12, 0, Math.PI * 2); ctx.fill();
    nodes.forEach(([s, an]) => {
      const x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R;
      ctx.fillStyle = C.ink; rrect(ctx, x - 70, y - 32, 140, 64, 32); ctx.fill();
      text(ctx, s, x, y + 12, { size: 32, weight: 700, color: C.ivory, align: 'center' });
    });
    text(ctx, `第 ${Math.min(2, Math.floor(run) + 1)} 轮`, cx, cy + 16, { size: 44, weight: 900, color: C.clay, align: 'center' });
    // rubric card
    const X = 1000, Y = 330;
    card(X, Y, 800, 640, { bg: C.ivory, stroke: false });
    windowBar(X, Y, 800, 'rubric.md', { bg: C.oat });
    DIMS.forEach(([zh, en], j) => {
      const p = easeOutCubic(prog(lt, 0.9 + j * 0.3, 1.3 + j * 0.3));
      withAlpha(ctx, p, () => {
        const y = Y + 120 + j * 70;
        text(ctx, zh, X + 50 + 20 * (1 - p), y, { size: 32, weight: 700, color: C.ink });
        text(ctx, en, X + 300, y, { size: 22, font: MONO, color: C.muted });
        const sc = Math.min(10, 4 + Math.floor(hash(j * 7) * 3) + (lt > 3.6 ? 2 : 0));
        const bw = 220 * sc / 10;
        ctx.fillStyle = C.oat; ctx.fillRect(X + 540, y - 16, 220, 14); ctx.fillStyle = lt > 3.6 ? C.green : C.clay; ctx.fillRect(X + 540, y - 16, bw * p, 14);
      });
    });
    clawdPixels(ctx, X + 690, Y + 600, 6, { blink: blinkAt(lt, [2.4]) });
    // judge glasses
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(X + 690 + gx(4, 6) - 2, Y + 600 + gy(1, 6) - 3, 3 * 6 + 4, 12 + 6); ctx.strokeRect(X + 690 + gx(11, 6) - 2, Y + 600 + gy(1, 6) - 3, 3 * 6 + 4, 12 + 6);
  });
  withAlpha(ctx, B, () => {
    para(ctx, '评分标准很严：5 分是学生作业，8 分是高端商业水准。', 120, 330, 1200, { size: 34, color: C.slate, lh: 56 });
    const X0 = 160, X1 = 1760, Y = 720, sx = (v) => lerp(X0, X1, (v - 1) / 9);
    ctx.fillStyle = C.oat; rrect(ctx, X0, Y - 14, X1 - X0, 28, 14); ctx.fill();
    const lab = { 5: '学生作业', 6: '模板水平', 7: '扎实专业', 8: '高端商业', 9: '获奖入围', 10: '世界顶尖' };
    for (let v = 1; v <= 10; v++) {
      ctx.fillStyle = C.ink; ctx.fillRect(sx(v) - 1.5, Y + 22, 3, 18);
      text(ctx, String(v), sx(v), Y + 80, { size: 30, weight: 700, font: MONO, color: C.ink, align: 'center' });
      if (lab[v]) text(ctx, lab[v], sx(v), Y + 124, { size: 24, color: C.muted, align: 'center' });
    }
    const g = easeInOutCubic(prog(lt, 7.2, 8.6));
    const a = sx(7.57), b = sx(lerp(7.57, 8.21, g));
    ctx.fillStyle = C.clay; rrect(ctx, a, Y - 14, Math.max(28, b - a), 28, 14); ctx.fill();
    const p = easeOutBack(prog(lt, 8.4, 9.0));
    if (p > 0) {
      ctx.save(); ctx.translate((a + sx(8.21)) / 2, Y - 60); ctx.scale(p, p);
      text(ctx, '7.57 – 8.21', 0, -60, { size: 110, weight: 900, font: MONO, color: C.clay, align: 'center' });
      text(ctx, '15 支成片的最终得分（满分 10）', 0, 0, { size: 30, weight: 700, color: C.ink, align: 'center' });
      ctx.restore();
    }
  });
}

// ---------------------------------------------------------------- 122–140 s outro
async function outro(t) {
  const lt = t - T.outro;
  bgInk(t, 'rgba(217,119,87,0.10)');
  if (t < T.end + 0.6) {
    const A = env(t, T.outro, T.end + 0.6, 0.3, 0.6);
    withAlpha(ctx, A, () => {
      text(ctx, 'DIY', 120, 160, { size: 24, weight: 700, font: MONO, color: C.clay, ls: 3 });
      text(ctx, '你也能让 AI 做一支', 116, 250, { size: 76, weight: 900, color: C.ivory });
      const cards = [
        ['开一个空文件夹', '用能写代码、能跑命令的 AI 助手打开它，比如 Claude Code。电脑上要有 Node、Chrome 和 ffmpeg。'],
        ['发一份提示词', '从仓库 prompts/ 里挑一种风格，把整段提示词原样发给它。'],
        ['改成你的故事', '只改 Creative seed 里的故事、品牌和配色；Signature features 别删，风格像不像全靠它。'],
      ];
      cards.forEach(([h, b], j) => {
        const p = spring(prog(lt, 0.5 + j * 0.6, 1.3 + j * 0.6)); if (p <= 0) return;
        const x = 120 + j * 570, y = 340;
        ctx.save(); ctx.translate(x + 260, y + 220); ctx.scale(p, p); ctx.translate(-(x + 260), -(y + 220));
        card(x, y, 520, 440);
        text(ctx, String(j + 1), x + 40, y + 120, { size: 96, weight: 900, font: MONO, color: C.clay });
        text(ctx, h, x + 40, y + 200, { size: 44, weight: 900, color: C.ivory });
        para(ctx, b, x + 40, y + 264, 440, { size: 28, color: C.oat, lh: 46 });
        ctx.restore();
      });
      withAlpha(ctx, prog(lt, 3.4, 3.9), () => {
        ctx.fillStyle = C.clay; ctx.fillRect(120, 862, 6, 44);
        text(ctx, '想更进一步：再开一个 AI，用 rubric.md 评审，把意见贴回去改一轮。', 146, 896, { size: 32, weight: 500, color: C.ivory });
      });
    });
  }
  if (t > T.end) {
    const e = t - T.end, A = prog(e, 0.2, 1.0);
    const gi = Math.min(299, Math.floor(e * 30) + 30);
    const im = await img(`out/frames/grid/${String(gi).padStart(3, '0')}.jpg`);
    if (im) withAlpha(ctx, A * 0.22, () => { ctx.save(); ctx.filter = 'blur(2px)'; ctx.drawImage(im, 0, (H - 648 * 1) / 2 - 0, W, 648 * 1); ctx.drawImage(im, 0, -300, W, 648); ctx.drawImage(im, 0, 732, W, 648); ctx.restore(); });
    withAlpha(ctx, A * 0.6, () => { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); });
    const s = spring(prog(e, 0.3, 1.1));
    if (s > 0.02) {
      const wave = Math.floor(e * 4) % 2 && e < 4.5;
      clawdBob(W / 2, 330, 20 * s, t, { blink: blinkAt(e, [2.6, 6.2]) });
      if (wave) { ctx.fillStyle = C.clawd; ctx.fillRect(W / 2 + gx(16, 20 * s), 330 + gy(1, 20 * s), 20 * s, 40 * s); }
    }
    withAlpha(ctx, prog(e, 0.9, 1.4), () => text(ctx, '15 种风格 · 成片 · 提示词 · 源码  全部开源', W / 2, 560, { size: 56, weight: 900, color: C.ivory, align: 'center' }));
    withAlpha(ctx, prog(e, 1.4, 1.9), () => {
      font(44, 700, MONO); const s2 = 'github.com/Vincentwei1021/mg-styles-15'; const w = ctx.measureText(s2).width + 70;
      ctx.fillStyle = C.ink2; ctx.strokeStyle = C.clay; ctx.lineWidth = 2.5; rrect(ctx, W / 2 - w / 2, 620, w, 92, 46); ctx.fill(); ctx.stroke();
      text(ctx, s2, W / 2, 682, { size: 44, weight: 700, font: MONO, color: C.clay, align: 'center' });
    });
    withAlpha(ctx, prog(e, 2.2, 2.7), () => {
      text(ctx, '原作：Vincentwei1021 · MIT 协议   |   这支科普视频也用同样的方法，由代码逐帧渲染', W / 2, 800, { size: 28, color: C.muted, align: 'center' });
    });
    withAlpha(ctx, prog(e, 3.2, 3.7), () => text(ctx, '觉得有意思，一键三连～', W / 2, 900, { size: 40, weight: 700, color: C.oat, align: 'center' }));
  }
}

// ---------------------------------------------------------------- frame
window.DEMO = { width: W, height: H, fps: 30, duration: T.dur };
window.renderAt = async (t) => {
  ctx.save();
  if (t < T.pipe) await hook(t);
  else if (t < T.tour) await pipeline(t);
  else if (t < T.review) await tour(t);
  else if (t < T.outro) review(t);
  else await outro(t);
  ctx.restore();
  // section joins: quick dip so cuts read as cuts, not glitches
  const joins = [T.pipe, T.review, T.outro];
  for (const j of joins) { const d = Math.abs(t - j); if (d < 0.2) withAlpha(ctx, 1 - d / 0.2, () => { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); }); }
  withAlpha(ctx, prog(t, T.dur - 0.7, T.dur - 0.05), () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
  grain(t);
};

// preload fonts for every string the film draws: render one pass of key times so TEXT is complete, then load chunks
(async () => {
  const probe = [];
  for (let s = 0; s < T.dur; s += 0.5) probe.push(s);
  for (const s of probe) { try { await window.renderAt(s); } catch (e) { console.error(e); } }
  const all = [...TEXT].join('') + '0123456789';
  await Promise.all([
    ...[400, 500, 700, 900].map((w) => document.fonts.load(`${w} 40px "Noto Sans SC"`, all)),
    ...[400, 700].map((w) => document.fonts.load(`${w} 40px "JetBrains Mono"`, 'abcdefghijklmnopqrstuvwxyz0123456789')),
    document.fonts.load('400 40px "ZCOOL KuaiLe"', all),
  ]);
  await document.fonts.ready;
  await window.renderAt(0);
  window.__ready = true;
})();
