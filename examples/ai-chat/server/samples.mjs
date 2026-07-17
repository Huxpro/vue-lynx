/**
 * Bundled demo attachment images, generated at import time with a minimal
 * PNG encoder (zero deps). These stand in for the original's NuxtHub Blob
 * uploads: Lynx has no file picker or drag-and-drop, so the client offers
 * these samples from a picker instead (see PRD F8.2).
 */
import { deflateSync } from 'node:zlib';

// --- minimal PNG encoder (truecolor, no filters) ---------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** pixelFn(x, y) -> [r, g, b] */
function encodePng(width, height, pixelFn) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

function gradient(w, h, from, to, accent) {
  return encodePng(w, h, (x, y) => {
    const t = (x / w + y / h) / 2;
    let px = mix(from, to, t);
    // a soft "sun" disc for visual interest
    const dx = x - w * 0.72;
    const dy = y - h * 0.3;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < h * 0.18) px = mix(accent, px, d / (h * 0.18));
    return px;
  });
}

function avatar(size) {
  const bg = [37, 99, 235]; // blue-600
  const fg = [255, 255, 255];
  return encodePng(size, size, (x, y) => {
    const cx = size / 2;
    // head
    let dx = x - cx;
    let dy = y - size * 0.38;
    if (Math.sqrt(dx * dx + dy * dy) < size * 0.18) return fg;
    // body
    dx = x - cx;
    dy = y - size * 0.85;
    if (Math.sqrt((dx * dx) / 2.2 + dy * dy) < size * 0.28) return fg;
    return bg;
  });
}

export const SAMPLE_IMAGES = {
  'sunset.png': {
    contentType: 'image/png',
    body: gradient(320, 240, [251, 146, 60], [147, 51, 234], [254, 240, 138]),
  },
  'ocean.png': {
    contentType: 'image/png',
    body: gradient(320, 240, [56, 189, 248], [30, 64, 175], [224, 242, 254]),
  },
  'forest.png': {
    contentType: 'image/png',
    body: gradient(320, 240, [134, 239, 172], [20, 83, 45], [253, 224, 71]),
  },
  'avatar.png': {
    contentType: 'image/png',
    body: avatar(96),
    listed: false,
  },
};
