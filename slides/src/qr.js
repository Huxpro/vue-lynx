// =============================================================================
// Tiny QR → inline-SVG helper (wraps qrcode-generator). Always renders dark
// modules on a white quiet-zone so it scans reliably regardless of deck theme.
// =============================================================================
import qrcode from 'qrcode-generator';

/**
 * @param {string} text  the payload to encode (an absolute URL)
 * @param {{ cell?: number, margin?: number }} [opts]
 * @returns {string} an <svg> string (crisp at any size; scale via CSS)
 */
export function qrSvg(text, { cell = 4, margin = 4 } = {}) {
  const qr = qrcode(0, 'M'); // type 0 = auto-fit, error-correction level M
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const size = (n + margin * 2) * cell;

  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) {
        d += `M${(c + margin) * cell} ${(r + margin) * cell}h${cell}v${cell}h-${cell}z`;
      }
    }
  }
  return (
    `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" ` +
    `role="img" aria-label="QR code" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<path fill="#000" d="${d}"/></svg>`
  );
}
