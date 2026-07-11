// Static file server for the Lynx-for-Web harness:
//   /            → harness/index.html
//   /static/*    → web-core client_prod assets
//   /dist/*      → examples/elk/dist (the built bundles)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HARNESS = path.dirname(fileURLToPath(import.meta.url));
const DIST = process.env.ELK_DIST || '/home/user/vue-lynx/examples/elk/dist';
const PORT = Number(process.env.PORT || 8975);

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

// Media/asset URL keys in Mastodon JSON that the app loads as images.
// Rewritten to route through this relay (browser TLS is blocked by the
// sandbox egress proxy; Node's env-proxy fetch is not).
const MEDIA_KEY_RE = /"(avatar|avatar_static|header|header_static|preview_url|static_url|image)":"(https:\\?\/\\?\/)([^"]+)"/g;
// "url" keys are rewritten only when they point at media file paths —
// status/account "url" values must stay intact (mention matching etc).
const MEDIA_URL_RE = /"url":"(https:\\?\/\\?\/)([^"]*(?:media_attachments|\/media\/|\/cache\/)[^"]*)"/g;

async function relay(req, res, url) {
  // /api-proxy/<host>/<path...>
  const rest = url.pathname.slice('/api-proxy/'.length);
  const slash = rest.indexOf('/');
  const host = slash === -1 ? rest : rest.slice(0, slash);
  const path = slash === -1 ? '' : rest.slice(slash);
  const target = `https://${host}${path}${url.search}`;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
  };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  try {
    const headers = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      body = Buffer.concat(chunks);
    }

    const upstream = await fetch(target, { method: req.method, headers, body });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const isJson = contentType.includes('json');
    const buf = Buffer.from(await upstream.arrayBuffer());

    let out = buf;
    if (isJson) {
      const text = buf.toString('utf8')
        .replace(
          MEDIA_KEY_RE,
          (_m, key, _proto, tail) => `"${key}":"http://localhost:${PORT}/api-proxy/${tail}"`,
        )
        .replace(
          MEDIA_URL_RE,
          (_m, _proto, tail) => `"url":"http://localhost:${PORT}/api-proxy/${tail}"`,
        );
      out = Buffer.from(text, 'utf8');
    }

    const passthrough = {};
    const link = upstream.headers.get('link');
    if (link) {
      // masto.js paginates via the Link header; rewrite next/prev URLs
      // through the relay too.
      passthrough.link = link.replaceAll(/https:\/\//g, `http://localhost:${PORT}/api-proxy/`);
    }
    res.writeHead(upstream.status, {
      ...cors,
      ...passthrough,
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    res.end(out);
  }
  catch (err) {
    console.error('[relay]', target, err.message);
    res.writeHead(502, cors);
    res.end(JSON.stringify({ error: String(err) }));
  }
}

// masto.js resolves API paths against the client base URL with
// `new URL(path, base)`, which drops any base path — so bare /api/* and
// friends arrive here without the /api-proxy/<host> prefix. Forward them
// to the default target instance.
const RELAY_TARGET = process.env.ELK_RELAY_TARGET || 'm.webtoo.ls';
const BARE_RELAY_PREFIXES = ['/api/', '/nodeinfo/', '/oauth/', '/.well-known/'];

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api-proxy/')) {
    relay(req, res, url);
    return;
  }
  if (BARE_RELAY_PREFIXES.some(p => url.pathname.startsWith(p))) {
    url.pathname = `/api-proxy/${RELAY_TARGET}${url.pathname}`;
    relay(req, res, url);
    return;
  }
  let filePath;
  if (url.pathname === '/' || url.pathname === '/index.html') {
    filePath = path.join(HARNESS, 'index.html');
  } else if (url.pathname.startsWith('/static/')) {
    filePath = path.join(HARNESS, url.pathname);
  } else if (url.pathname.startsWith('/dist/')) {
    filePath = path.join(DIST, url.pathname.slice('/dist/'.length));
  } else {
    filePath = path.join(HARNESS, url.pathname);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}).listen(PORT, () => console.log(`harness on http://localhost:${PORT}`));
