// Static file server for the Lynx-for-Web harness:
//   /            → harness/index.html
//   /static/*    → @lynx-js/web-core client_prod assets
//   /dist/*      → examples/touch-fx/dist (the built bundles)
import http from 'node:http';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HARNESS = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const WEB_CORE_STATIC = path.resolve(
  path.dirname(require.resolve('@lynx-js/web-core/client.prod.js')),
  '..',
);
const DIST = process.env.TOUCH_FX_DIST || path.resolve(HARNESS, '../dist');
const PORT = Number(process.env.PORT || 8976);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.bundle': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let file;
  if (url.pathname === '/' || url.pathname === '/index.html') {
    file = path.join(HARNESS, 'index.html');
  } else if (url.pathname.startsWith('/static/')) {
    file = path.join(WEB_CORE_STATIC, url.pathname.slice('/static/'.length));
  } else if (url.pathname.startsWith('/dist/')) {
    file = path.join(DIST, url.pathname.slice('/dist/'.length));
  }

  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end('not found: ' + url.pathname);
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[touch-fx harness] http://localhost:${PORT}/`);
});
