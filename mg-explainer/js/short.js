// 竖屏短版 1080×1920 · 32 s: hook → 15 styles on the beat (120 BPM, 3 beats each) → "完整版" end card
import {
  C, clamp, lerp, prog, env, easeOutCubic, easeInOutCubic, easeOutExpo, easeOutBack, spring, hash, text, rrect, withAlpha,
  img, clawdPixels, blinkAt, outlinePts, pathPoly, boot, SANS, MONO,
} from './lib.js';
import { VARIANTS } from './clawd.js';
import { STYLES } from './styles.js';

const W = 1080, H = 1920;
export const S = { tour: 5.0, slot: 1.5, end: 27.5, dur: 32 };
const cv = document.getElementById('c'); cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const ctx = cv.getContext('2d');
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

function bg(tint) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  if (tint) { const g = ctx.createRadialGradient(W / 2, 500, 50, W / 2, 500, 1300); g.addColorStop(0, tint); g.addColorStop(1, 'rgba(20,20,19,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(250,249,245,0.045)'; for (let y = 30; y < H; y += 48) for (let x = 30; x < W; x += 48) ctx.fillRect(x, y, 2, 2);
}
function stamp(s, x, y, size, k, o = {}) {
  const sc = lerp(1.5, 1, easeOutExpo(k)), sh = k < 0.35 ? (hash(Math.floor(k * 40)) - 0.5) * 14 : 0;
  withAlpha(ctx, clamp(k * 4), () => {
    ctx.save(); ctx.translate(x + sh, y); ctx.scale(sc, sc); ctx.rotate(o.rot || 0);
    text(ctx, s, 0, 0, { size, weight: 900, color: o.color || C.ivory, align: 'center', stroke: C.ink, strokeW: size * 0.16, ls: 2 });
    ctx.restore();
  });
}

async function hook(t) {
  bg('rgba(217,119,87,0.12)');
  const gi = Math.min(299, Math.floor(t * 30) + 80);
  const im = await img(`out/frames/grid/${String(gi).padStart(3, '0')}.jpg`);
  const tw = 330, th = 186, gap = 15, X0 = (W - (3 * tw + 2 * gap)) / 2, Y0 = 470;
  const out = easeInOutCubic(prog(t, 4.6, 5.0));
  for (let k = 0; k < 15; k++) {
    const c = k % 3, r = Math.floor(k / 3), gc = k % 5, gr = Math.floor(k / 5);
    const s = lerp(1.3, 1, easeOutExpo(prog(t, (c + r) * 0.03, 0.35 + (c + r) * 0.03)));
    const cx = X0 + c * (tw + gap) + tw / 2, cy = Y0 + r * (th + gap) + th / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s * (1 - out * 0.3), s * (1 - out * 0.3)); ctx.globalAlpha = (1 - out) * clamp((t - (c + r) * 0.03) * 8);
    rrect(ctx, -tw / 2, -th / 2, tw, th, 10); ctx.save(); ctx.clip();
    if (im) ctx.drawImage(im, gc * 384, gr * 216, 384, 216, -tw / 2, -th / 2, tw, th);
    ctx.restore(); ctx.restore();
  }
  withAlpha(ctx, 1 - out, () => {
    stamp('没用一张', W / 2, 220, 120, prog(t, 0.0, 0.3));
    stamp('AI 生图', W / 2, 380, 150, prog(t, 0.25, 0.55), { color: '#FFD23F' });
    stamp('15 种动画风格', W / 2, 1610, 96, prog(t, 2.0, 2.3));
    const k = easeOutBack(prog(t, 2.5, 2.9));
    withAlpha(ctx, clamp(k * 3), () => {
      ctx.save(); ctx.translate(W / 2, 1750); ctx.scale(lerp(0.7, 1, k), lerp(0.7, 1, k));
      ctx.fillStyle = C.clay; rrect(ctx, -400, -70, 800, 100, 50); ctx.fill();
      text(ctx, '全是 Claude 写代码做的', 0, 2, { size: 56, weight: 900, color: C.ink, align: 'center' });
      ctx.restore();
    });
  });
}

async function tour(t) {
  const i = clamp(Math.floor((t - S.tour) / S.slot), 0, 14), St = STYLES[i], lt = t - S.tour - i * S.slot;
  const im = await img(`out/frames/${St.slug}/${String(Math.min(149, 40 + Math.floor(lt * 30))).padStart(3, '0')}.jpg`);
  bg(hexA(St.accent, 0.22));
  const k = easeOutExpo(prog(lt, 0, 0.3));
  // header
  text(ctx, `${String(i + 1).padStart(2, '0')} / 15`, W / 2, 190, { size: 40, weight: 700, font: MONO, color: St.accent, align: 'center', ls: 4 });
  ctx.save(); ctx.translate(W / 2, 340); ctx.scale(lerp(1.3, 1, k), lerp(1.3, 1, k));
  text(ctx, St.name, 0, 0, { size: 136, weight: 900, color: C.ivory, align: 'center', stroke: C.ink, strokeW: 8 });
  ctx.restore();
  text(ctx, St.en, W / 2, 410, { size: 30, weight: 500, font: MONO, color: C.muted, align: 'center' });
  // clip, full width
  const Y = 470, CH = 608;
  ctx.save(); ctx.translate(lerp(W * 0.12, 0, k) * (i % 2 ? 1 : -1), 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, Y, W, CH);
  if (im) {
    if (St.portrait) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, Y, W, CH); ctx.clip(); ctx.filter = 'blur(30px) brightness(0.55)'; ctx.drawImage(im, 0, Y - 400, W, W * 16 / 9); ctx.restore();
      ctx.drawImage(im, W / 2 - 171, Y, 342, CH);
    } else ctx.drawImage(im, 0, Y, W, CH);
  }
  ctx.restore();
  // Clawd in this style
  const CY = 1170, CHt = 560, CWd = 900, CX = (W - CWd) / 2, pk = spring(prog(lt, 0.08, 0.6));
  ctx.save(); ctx.translate(W / 2, CY + CHt / 2); ctx.scale(pk, pk); ctx.translate(-W / 2, -(CY + CHt / 2));
  ctx.fillStyle = St.bg; rrect(ctx, CX, CY, CWd, CHt, 28); ctx.fill();
  ctx.save(); rrect(ctx, CX, CY, CWd, CHt, 28); ctx.clip(); ctx.translate(W / 2, CY + CHt / 2 + 6); ctx.scale(1.5, 1.5);
  VARIANTS[St.slug](ctx, lt + 1.6, 13);
  ctx.restore(); ctx.restore();
  text(ctx, `Clawd 版「${St.name}」`, W / 2, 1810, { size: 40, weight: 700, color: C.oat, align: 'center' });
  // progress
  for (let q = 0; q < 15; q++) { ctx.fillStyle = q < i ? hexA(C.ivory, 0.5) : q === i ? St.accent : C.slate; ctx.fillRect(90 + q * 61, 1860, 52, 8); }
  const w1 = prog(lt, 0, 0.2); if (w1 < 1) { ctx.fillStyle = St.accent; const e = easeInOutCubic(w1); ctx.fillRect(0, lerp(0, H, e), W, H * (1 - e) * 0.5); }
}

function end(t) {
  const e = t - S.end;
  bg('rgba(217,119,87,0.14)');
  const s = spring(prog(e, 0, 0.7));
  if (s > 0.02) clawdPixels(ctx, W / 2, 560, 30 * s, { blink: blinkAt(e, [2.2]) });
  stamp('完整版 2 分钟拆解', W / 2, 950, 92, prog(e, 0.35, 0.65));
  withAlpha(ctx, prog(e, 0.8, 1.2), () => text(ctx, 'AI 到底是怎么用代码做动画的？', W / 2, 1080, { size: 50, weight: 700, color: C.oat, align: 'center' }));
  const k = easeOutBack(prog(e, 1.3, 1.7));
  withAlpha(ctx, clamp(k * 3), () => {
    ctx.save(); ctx.translate(W / 2, 1260); ctx.scale(lerp(0.7, 1, k), lerp(0.7, 1, k));
    ctx.fillStyle = C.clay; rrect(ctx, -330, -75, 660, 110, 55); ctx.fill();
    text(ctx, '去主页看正片 →', 0, 2, { size: 60, weight: 900, color: C.ink, align: 'center' });
    ctx.restore();
  });
  withAlpha(ctx, prog(e, 2.0, 2.5), () => {
    text(ctx, '原作开源：github.com/Vincentwei1021/mg-styles-15', W / 2, 1640, { size: 30, font: MONO, color: C.muted, align: 'center' });
    text(ctx, 'MIT 协议 · 本视频由代码逐帧渲染', W / 2, 1700, { size: 30, color: C.muted, align: 'center' });
  });
}

window.DEMO = { width: W, height: H, fps: 30, duration: S.dur };
window.renderAt = async (t) => {
  ctx.save();
  if (t < S.tour) await hook(t); else if (t < S.end) await tour(t); else end(t);
  ctx.restore();
  for (const j of [S.tour, S.end]) { const d = Math.abs(t - j); if (d < 0.12) withAlpha(ctx, 1 - d / 0.12, () => { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); }); }
  withAlpha(ctx, prog(t, S.dur - 0.6, S.dur - 0.05), () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); });
};
boot(window.renderAt, Array.from({ length: S.dur * 2 }, (_, i) => i / 2));
