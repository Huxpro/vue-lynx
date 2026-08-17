// Transparent HTTPS relay: Chromium resolves every host to 127.0.0.1
// (--host-resolver-rules), this server accepts the TLS connection with a
// self-signed cert (ignoreHTTPSErrors) and forwards the request to the
// real host via Node fetch (which does honor the sandbox egress proxy).
// Lets the browser load real sites (elk.zone) for screenshot comparison.
import https from 'node:https';
import fs from 'node:fs';

const cert = fs.readFileSync(new URL('./mitm-cert.pem', import.meta.url));
const key = fs.readFileSync(new URL('./mitm-key.pem', import.meta.url));

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
  'content-length', 'accept-encoding',
]);

https.createServer({ cert, key }, async (req, res) => {
  const host = req.headers.host;
  if (!host) {
    res.writeHead(400);
    res.end();
    return;
  }
  const target = `https://${host}${req.url}`;
  try {
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!HOP_BY_HOP.has(k.toLowerCase()) && typeof v === 'string')
        headers[k] = v;
    }

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      body = Buffer.concat(chunks);
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    const outHeaders = {};
    upstream.headers.forEach((v, k) => {
      if (!HOP_BY_HOP.has(k) && k !== 'content-encoding')
        outHeaders[k] = v;
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    outHeaders['content-length'] = String(buf.length);
    res.writeHead(upstream.status, outHeaders);
    res.end(buf);
  }
  catch (err) {
    console.error('[mitm]', req.method, target, err.message);
    res.writeHead(502);
    res.end();
  }
}).listen(443, () => console.log('mitm relay on :443'));
