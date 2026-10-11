// Renders mv/index.html frame by frame in headless Chromium and pipes the frames to ffmpeg.
// Usage: node mv/render.mjs [out.mp4] [fps] [audio-file]
//        node mv/render.mjs --stills out-dir t1 t2 ...   (PNG stills at the given seconds)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const W = 1440, H = 1080;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(join(here, 'index.html')).href + '?capture');

if (args[0] === '--stills') {
  const [, dir, ...times] = args;
  mkdirSync(dir, { recursive: true });
  for (const t of times) {
    await page.evaluate(t => window.renderAt(t), Number(t));
    await page.screenshot({ path: join(dir, `t${t}.png`) });
  }
} else {
  const [out = join(here, 'out', 'sample.mp4'), fps = '30', audioFile] = args;
  mkdirSync(dirname(resolve(out)), { recursive: true });
  const duration = await page.evaluate(() => window.DURATION);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', fps, '-i', '-',
    ...(audioFile ? ['-i', audioFile, '-shortest', '-c:a', 'aac', '-b:a', '192k'] : []),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(duration * fps);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.renderAt(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\rframe ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`\nwrote ${out}`);
}
await browser.close();
