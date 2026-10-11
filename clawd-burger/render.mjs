// Renders index.html frame by frame into clawd-burger.mp4 (30 fps, 15 s) with sfx.wav as audio.
// Usage (from repo root): python3 clawd-burger/sfx.py && node clawd-burger/render.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const FPS = 30, DURATION = 15;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(pathToFileURL(join(dir, 'index.html')).href + '?export');
await page.evaluate(() => document.fonts.ready);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-i', join(dir, 'sfx.wav'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
  '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart',
  join(dir, 'clawd-burger.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < FPS * DURATION; i++) {
  const url = await page.evaluate(t => {
    window.renderFrame(t);
    return document.getElementById('c').toDataURL('image/png');
  }, i / FPS);
  if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg exit ' + c)) : res())));
await browser.close();
console.log('wrote', join(dir, 'clawd-burger.mp4'));
