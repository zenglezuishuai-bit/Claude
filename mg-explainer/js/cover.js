// B 站封面 1920×1080: the 15 films as a wall, one big claim, Clawd. Key content stays inside the centre 4:3 (x 240–1680).
import { C, text, rrect, img, clawdPixels, outlinePts, pathPoly, boot, SANS } from './lib.js';
import { STYLES } from './styles.js';

const W = 1920, H = 1080;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');

window.DEMO = { width: W, height: H, fps: 30, duration: 1 };
window.renderAt = async () => {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const ims = await Promise.all(STYLES.map((s) => img(`out/frames/${s.slug}/100.jpg`)));
  const tw = 384, th = 360;
  STYLES.forEach((s, k) => {
    const im = ims[k]; if (!im) return;
    const x = (k % 5) * tw, y = Math.floor(k / 5) * th;
    ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, tw - 6, th - 6); ctx.clip();
    const sc = Math.max(tw / im.width, th / im.height), w = im.width * sc, h = im.height * sc;
    ctx.drawImage(im, x + (tw - w) / 2, y + (th - h) / 2, w, h);
    ctx.restore();
  });
  const g = ctx.createRadialGradient(W / 2, H * 0.5, 200, W / 2, H * 0.5, 1100);
  g.addColorStop(0, 'rgba(20,20,19,.72)'); g.addColorStop(1, 'rgba(20,20,19,.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // claim
  ctx.save(); ctx.translate(W / 2 - 60, 470); ctx.rotate(-0.035);
  text(ctx, '0 张生图', 0, 0, { size: 270, weight: 900, color: '#FFD23F', align: 'center', stroke: '#141413', strokeW: 46, ls: 6 });
  ctx.restore();
  text(ctx, '15 种动画风格  全是代码写的', W / 2 - 60, 650, { size: 92, weight: 900, color: '#fff', align: 'center', stroke: '#141413', strokeW: 22, ls: 2 });
  // tag
  ctx.fillStyle = C.clay; rrect(ctx, 330, 735, 560, 76, 38); ctx.fill();
  text(ctx, 'Claude 写代码 · 逐帧渲染', 610, 787, { size: 40, weight: 900, color: C.ink, align: 'center' });
  // Clawd sticker
  const u = 17;
  ctx.save(); ctx.translate(1430, 860); ctx.rotate(0.08);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  pathPoly(ctx, outlinePts(u)); ctx.lineJoin = 'round'; ctx.lineWidth = 30; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.shadowColor = 'transparent';
  clawdPixels(ctx, 0, 0, u, { eye: C.ink });
  ctx.restore();
  text(ctx, 'Clawd', 1430, 1010, { size: 40, weight: 900, color: '#fff', align: 'center', stroke: C.ink, strokeW: 10, font: SANS });
};
boot(window.renderAt, [0]);
