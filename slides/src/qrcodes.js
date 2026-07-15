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

  // Standalone QR marks — any element tagged data-qr="<url>" renders a QR of
  // that URL (e.g. the write-up slide). Independent of the demo pair below.
  document.querySelectorAll('[data-qr]').forEach((el) => {
    if (!el.querySelector('svg')) el.innerHTML = qrSvg(el.dataset.qr);
  });

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
      // Native: scan with Lynx Explorer, or tap to copy the bundle URL (handy on
      // mobile — paste it straight into the app).
      // NB: use data-copy-url, not data-copy — the deck's global [data-copy]
      // handler overwrites textContent, which would wipe the QR + label.
      `<button type="button" class="qr qr--copy" data-copy-url="${native}" ` +
        `title="Scan with Lynx Explorer, or tap to copy the bundle URL">` +
        `<span class="qr__code">${qrSvg(native)}</span>` +
        `<span class="qr__label" data-label>${LABELS.native}</span>` +
      `</button>`;
    body.appendChild(pair);

    const copyBtn = pair.querySelector('.qr--copy');
    copyBtn.addEventListener('click', async () => {
      const url = copyBtn.dataset.copyUrl;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard blocked (insecure context / permissions) — fall back to a
        // hidden textarea so mobile still copies.
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { /* give up quietly */ }
        ta.remove();
      }
      const label = copyBtn.querySelector('[data-label]');
      const original = label.textContent;
      label.textContent = 'Copied ✓';
      copyBtn.classList.add('is-copied');
      clearTimeout(copyBtn._t);
      copyBtn._t = setTimeout(() => {
        label.textContent = original;
        copyBtn.classList.remove('is-copied');
      }, 1400);
    });
  });
}
