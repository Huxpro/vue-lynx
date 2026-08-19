// One-off debug loader: node harness/debug.mjs <mode>
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const mode = process.argv[2] ?? 'vapor';

// reuse the server from run.mjs by importing its internals is overkill;
// tiny inline copy:
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webCoreRoot = path.resolve(
  path.dirname(require.resolve('@lynx-js/web-core/client.prod.js')),
  '../..',
);
const html = `<!doctype html><html><head><meta charset="utf-8">
<script type="module" src="/webcore/static/js/client.js"></script>
<link rel="stylesheet" href="/webcore/static/css/client.css"></head>
<body><lynx-view url="/${mode}/main.web.bundle" style="display:block;width:800px;height:640px;"></lynx-view></body></html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(html);
  }
  let p = null;
  if (url.pathname.startsWith('/webcore/')) p = path.join(webCoreRoot, url.pathname.slice(9));
  else if (url.pathname.startsWith('/vdom/')) p = path.join(root, 'apps/vdom/dist', url.pathname.slice(6));
  else if (url.pathname.startsWith('/vapor/')) p = path.join(root, 'apps/vapor/dist', url.pathname.slice(7));
  if (!p || !fs.existsSync(p) || !fs.statSync(p).isFile()) {
    console.log('[404]', url.pathname);
    res.writeHead(404);
    return res.end('nf');
  }
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }[path.extname(p)] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': mime });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(8321, r));

const { chromium } = require('playwright-core');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
page.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 500)));
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 1000)));
page.on('worker', (w) => console.log('[worker created]', w.url()));
await page.goto('http://127.0.0.1:8321/');
await page.waitForTimeout(Number(process.argv[3] ?? 8000));
const text = await page.evaluate(() => document.body.innerText.slice(0, 300));
console.log('[body text]', JSON.stringify(text));
await browser.close();
server.close();
process.exit(0);
