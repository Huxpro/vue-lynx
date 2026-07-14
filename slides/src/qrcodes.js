// =============================================================================
// QR pair for the heavy-demo slides:
//   • Web    → the deck's own fullscreen play page (?bundle=…). Also clickable.
//   • Native → the hosted .lynx.bundle URL, for the Lynx Explorer app to scan.
// Both are built from location.origin at runtime, so they resolve on whatever
// domain the deck is served from (preview or final) with no hard-coding.
// =============================================================================
import { qrSvg } from './qr.js';

const LABELS = { web: 'Web', native: 'Lynx App' };

function buildUrls(webBundle) {
  const origin = location.origin;
  const base = import.meta.env.BASE_URL || '/';
  // Fullscreen web player lives inside the deck build (respects the base path).
  const web = `${origin}${base}play.html?bundle=${encodeURIComponent(webBundle)}`;
  // Example bundles are always served from the site root at /examples (see
  // <vl-demo>); the native bundle is the .lynx.bundle sibling of the web one.
  const native = `${origin}/examples/${webBundle.replace('.web.bundle', '.lynx.bundle')}`;
  return { web, native };
}

export function initQRCodes() {
  // Speaker-preview iframes don't need the codes (and shouldn't duplicate them).
  if (new URLSearchParams(location.search).has('embed')) return;

  document.querySelectorAll('.slide').forEach((slide) => {
    const demo = slide.querySelector('vl-demo[bundle]');
    const body = slide.querySelector('.demo__body');
    if (!demo || !body || slide.querySelector('.qr-pair')) return;

    const { web, native } = buildUrls(demo.getAttribute('bundle'));
    const pair = document.createElement('div');
    pair.className = 'qr-pair';
    pair.innerHTML =
      `<a class="qr" href="${web}" target="_blank" rel="noreferrer" ` +
        `title="Open the live web version">` +
        `<span class="qr__code">${qrSvg(web)}</span>` +
        `<span class="qr__label">${LABELS.web} <span class="qr__arrow">↗</span></span>` +
      `</a>` +
      `<div class="qr" title="Scan with the Lynx Explorer app">` +
        `<span class="qr__code">${qrSvg(native)}</span>` +
        `<span class="qr__label">${LABELS.native}</span>` +
      `</div>`;
    body.appendChild(pair);
  });
}
