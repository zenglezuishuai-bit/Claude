// Screenshots the viewer in headless Chromium for visual checks.
// Usage: node scripts/shoot.mjs out.png [view-json] [time] [width] [height]
//   view-json: '{"pos":[x,y,z],"target":[x,y,z]}' or a part key (e.g. dome)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const [out = 'shot.png', view = '', time = '', W = '1400', H = '800'] = process.argv.slice(2);
const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p.endsWith('/') ? p + 'index.html' : p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.route('https://cdn.jsdelivr.net/npm/three@0.186.0/**', async (route) => {
  const rel = route.request().url().split('three@0.186.0/')[1];
  route.fulfill({ body: await readFile(join(root, 'node_modules/three', rel)), contentType: 'text/javascript' });
});
await page.route('https://fonts.**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await page.evaluate(([view, time]) => {
  if (time) { const t = document.getElementById('time'); t.value = time; t.dispatchEvent(new Event('input')); }
  if (view.startsWith('{')) window.__setView?.(JSON.parse(view));
  else if (view) document.querySelector(`[data-part="${view}"]`)?.click();
}, [view, time]);
await page.waitForTimeout(view && !view.startsWith('{') ? 2500 : 800);
await page.screenshot({ path: out });
await browser.close();
server.close();
console.log('wrote', out);
