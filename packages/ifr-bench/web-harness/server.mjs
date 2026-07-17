/**
 * Static server for the real-browser (Lynx for Web) FCP experiment.
 *
 *   node web-harness/server.mjs <port> <bundlesDir>
 *
 * Maps:
 *   /core/*      → @lynx-js/web-core prod client build (js/css/wasm/async)
 *   /elements/*  → @lynx-js/web-elements dist (pure relative-import ESM)
 *   /bundles/*   → the .web.bundle files under <bundlesDir>
 *   /            → the measurement page
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(_dirname, '../../..');
const port = Number(process.argv[2] ?? 8321);
const bundlesDir = process.argv[3];

const CORE = path.join(
  repoRoot,
  'website/node_modules/@lynx-js/web-core/dist/client_prod',
);
const ELEMENTS = path.join(
  repoRoot,
  'website/node_modules/@lynx-js/web-elements',
);
const TSLIB = path.join(
  repoRoot,
  'node_modules/.pnpm/tslib@2.8.1/node_modules/tslib/tslib.es6.js',
);

const TYPES = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.bundle': 'application/json',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let file = null;
  if (url.pathname === '/' || url.pathname === '/index.html') {
    file = path.join(_dirname, 'index.html');
  } else if (url.pathname.startsWith('/core/')) {
    file = path.join(CORE, url.pathname.slice('/core/'.length));
  } else if (url.pathname.startsWith('/elements/')) {
    file = path.join(ELEMENTS, url.pathname.slice('/elements/'.length));
  } else if (url.pathname === '/tslib.mjs') {
    file = TSLIB;
  } else if (url.pathname.startsWith('/plain/')) {
    file = path.join(_dirname, 'plain', url.pathname.slice('/plain/'.length));
  } else if (url.pathname.startsWith('/bundles/')) {
    file = path.join(bundlesDir, url.pathname.slice('/bundles/'.length));
  }
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    res.end('not found: ' + url.pathname);
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`listening on http://127.0.0.1:${port}`);
});
