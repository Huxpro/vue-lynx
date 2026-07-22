// Unified bundle sizing — raw + gzip of the web bundle and its main-thread
// (lepus) / background (app-service) sections. Consolidates the sizing logic
// scattered across benchmark/harness/build.mjs and ifr-bench's
// build-matrix / build-scale-matrix / examples-sweep.

import fs from 'node:fs';
import zlib from 'node:zlib';

const GZIP_LEVEL = 9;

export function gzipBytes(buf) {
  return zlib.gzipSync(buf, { level: GZIP_LEVEL }).length;
}

/** Raw + gzip size of a file on disk (null if absent). */
export function fileSizes(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return { raw: buf.length, gz: gzipBytes(buf) };
}

/**
 * Decompose a Lynx `.web.bundle` (JSON) into section sizes:
 *   web  — the whole bundle file
 *   mt   — main-thread lepus section (lepusCode.root)
 *   bg   — background section (manifest['/app-service.js'])
 * Each as { raw, gz }. Robust to shape drift: missing sections → null.
 */
export function webBundleSections(bundlePath) {
  if (!fs.existsSync(bundlePath)) return null;
  const raw = fs.readFileSync(bundlePath);
  const out = { web: { raw: raw.length, gz: gzipBytes(raw) }, mt: null, bg: null };
  try {
    const json = JSON.parse(raw.toString('utf8'));
    const mtSrc = json?.lepusCode?.root;
    if (typeof mtSrc === 'string') {
      const b = Buffer.from(mtSrc, 'utf8');
      out.mt = { raw: b.length, gz: gzipBytes(b) };
    }
    const bgSrc = json?.manifest?.['/app-service.js'];
    if (typeof bgSrc === 'string') {
      const b = Buffer.from(bgSrc, 'utf8');
      out.bg = { raw: b.length, gz: gzipBytes(b) };
    }
  } catch {
    // non-JSON or unexpected shape — web size still valid
  }
  return out;
}
