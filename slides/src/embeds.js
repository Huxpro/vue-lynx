// =========================================================
// Media embeds — <vl-media> + the embed device frames.
//
// A universal way to drop a video / image / iframe onto a
// slide (usually an *overlay* slide — see main.js). The
// element owns its media lifecycle around deck navigation:
//
//   · videos reset on every slide change (pause + rewind, so
//     audio can never leak across pages) and autoplay when
//     their slide becomes current — opt out per element with
//     data-autoplay="false".
//   · images / videos / iframes are mounted only when their
//     slide is at most one step away and unloaded again two
//     steps out. Eager decode of every embed used to blow
//     past iOS Safari's WebContent memory budget (a single
//     4032×3024 PNG is ~49MB RGBA once decoded).
//   · a missing file renders as a labeled placeholder frame
//     showing the exact path to drop the asset at — author
//     slides first, add media later.
//
// Sizing: a bare <vl-media> is laid out by the slide (width
// in, height from the media). For a resizable frame, wrap it
// in `.phone.phone--embed` — the same chrome as the demo
// mockups, de-phoned — and it gets the drag grips + preset
// switcher from framework/device.js.
// =========================================================
import { attachDeviceControls } from './framework/device.js';

const EXT_VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const EXT_IMAGE = /\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/i;

// Images/videos: 2-slide neighborhood so FLIP neighbors are already
// decoded before we arrive. Iframes stay at 1 — nested pages are heavier
// than a bitmap and don't participate in FLIP sizing the same way.
const MEDIA_NEAR = 2;
const MEDIA_FAR = 3;
const IFRAME_NEAR = 1;
const IFRAME_FAR = 2;

// Presets for embed frames, per data-embed kind. Named after the
// stock device icons (monitor / tablet / smartphone) so the preset
// switcher stays legible.
const EMBED_PRESETS = {
  desktop: { ar: '16 / 9', w: 'min(62cqw, 800px)', h: 'auto' },
  tablet: { ar: '4 / 3', w: 'min(46cqw, 560px)', h: 'auto' },
  phone: { ar: '9 / 16', w: 'auto', h: 'min(78cqh, 580px)' },
};
const EMBED_DEVICES = {
  wide: { devices: ['desktop', 'tablet'], initial: 'desktop' },
  portrait: { devices: ['phone', 'tablet'], initial: 'phone' },
  browser: { devices: ['desktop', 'tablet', 'phone'], initial: 'desktop' },
};

function inferKind(src) {
  if (EXT_VIDEO.test(src)) return 'video';
  if (EXT_IMAGE.test(src)) return 'image';
  return 'iframe';
}

class VlMedia extends HTMLElement {
  connectedCallback() {
    if (this._wired) return;
    this._wired = true;
    this.src = this.getAttribute('src') || '';
    this.kind = this.getAttribute('kind') || inferKind(this.src);
    this.autoplay = this.dataset.autoplay !== 'false';
    this._live = false;

    const ph = document.createElement('div');
    ph.className = 'vl-ph';
    ph.innerHTML =
      `<span class="vl-ph__kind">${this.kind}</span>` +
      `<span>${this.getAttribute('label') || this.src}</span>`;
    this.appendChild(ph);

    if (this.kind === 'image') {
      const img = document.createElement('img');
      img.alt = this.getAttribute('alt') || '';
      img.addEventListener('error', () => this.classList.add('is-missing'));
      img.addEventListener('load', () => this.classList.remove('is-missing'));
      // Don't set src yet — wait for setDistance(). Placeholder stays up
      // until the first successful load (and returns if we unload).
      this.classList.add('is-missing');
      this.appendChild(img);
      this._img = img;
    } else if (this.kind === 'video') {
      const v = document.createElement('video');
      v.playsInline = true;
      v.muted = !this.hasAttribute('unmuted');
      v.loop = !this.hasAttribute('no-loop');
      if (this.hasAttribute('controls')) v.controls = true;
      v.preload = 'metadata';
      v.addEventListener('error', () => this.classList.add('is-missing'));
      v.addEventListener('loadedmetadata', () => this.classList.remove('is-missing'));
      this.classList.add('is-missing');
      this.appendChild(v);
      this._video = v;
    }
    // iframes mount lazily in setDistance().
  }

  _mountImage() {
    if (!this._img || this._live) return;
    this._img.src = this.src;
    this._live = true;
    // Show the element immediately so layout (and FLIP rects) match the
    // loaded state; is-missing returns only on error or unload.
    this.classList.remove('is-missing');
  }

  _unmountImage() {
    if (!this._img || !this._live) return;
    this._img.removeAttribute('src');
    // Force the decoder to drop the bitmap (removeAttribute alone can leave
    // a decoded frame in Safari's image cache for the element).
    try { this._img.src = ''; } catch { /* ignore */ }
    this._live = false;
    this.classList.add('is-missing');
  }

  _mountVideo() {
    if (!this._video || this._live) return;
    this._video.src = this.src;
    this._live = true;
    this.classList.remove('is-missing');
  }

  _unmountVideo() {
    if (!this._video || !this._live) return;
    const v = this._video;
    v.pause?.();
    v.removeAttribute('src');
    // Essential on iOS — releases the decoded frame buffer.
    try { v.load(); } catch { /* ignore */ }
    this._live = false;
    this.classList.add('is-missing');
  }

  _mountFrame() {
    if (this._iframe) return;
    const f = document.createElement('iframe');
    f.src = this.src;
    f.allow = 'autoplay; fullscreen';
    f.title = this.getAttribute('label') || this.src;
    this.appendChild(f);
    this._iframe = f;
    this.classList.add('is-live');
  }

  _unmountFrame() {
    if (!this._iframe) return;
    this._iframe.remove();
    this._iframe = null;
    this.classList.remove('is-live');
  }

  /** Called on every deck:change with (mySlide - currentSlide). */
  setDistance(d, { still = false } = {}) {
    if (this.kind === 'image') {
      if (Math.abs(d) <= MEDIA_NEAR) this._mountImage();
      else if (Math.abs(d) >= MEDIA_FAR) this._unmountImage();
      return;
    }

    if (this.kind === 'video' && this._video) {
      if (Math.abs(d) <= MEDIA_NEAR) this._mountVideo();
      else if (Math.abs(d) >= MEDIA_FAR) this._unmountVideo();

      if (!this._live) return;
      const v = this._video;
      if (d === 0 && this.autoplay && !still) {
        try { v.currentTime = 0; } catch { /* not seekable yet */ }
        const p = v.play?.();
        if (p?.catch) p.catch(() => {});
      } else {
        v.pause?.();
        if (d !== 0) {
          try { v.currentTime = 0; } catch { /* not seekable yet */ }
        }
      }
      return;
    }

    if (this.kind === 'iframe') {
      // Live only in the immediate neighborhood; embed previews (the
      // speaker view's iframes) never mount nested third-party pages.
      if (Math.abs(d) <= IFRAME_NEAR && !still) this._mountFrame();
      else if (Math.abs(d) >= IFRAME_FAR) this._unmountFrame();
    }
  }
}

export function registerVlMedia() {
  if (!customElements.get('vl-media')) customElements.define('vl-media', VlMedia);
}

export function initEmbeds({
  getScale,
  reducedMotion = false,
  embed = false,
  mediaEnabled = () => true,
} = {}) {
  registerVlMedia();
  const still = reducedMotion || embed;

  // Resizable embed frames — seed CSS vars now, wire grips lazily when the
  // slide enters the neighborhood (avoids injecting 4 grips × N frames into
  // every dormant overlay at boot).
  document.querySelectorAll('.phone--embed').forEach((frame) => {
    if (frame.dataset.w) frame.style.setProperty('--phone-w', frame.dataset.w);
    if (frame.dataset.h) frame.style.setProperty('--phone-h', frame.dataset.h);
  });

  function wireEmbedFrame(frame) {
    if (frame.dataset.controlsWired) return;
    frame.dataset.controlsWired = '1';
    const conf = EMBED_DEVICES[frame.dataset.embed] || EMBED_DEVICES.wide;
    const media = frame.querySelector('vl-media');
    attachDeviceControls(frame, {
      getScale,
      presets: EMBED_PRESETS,
      devices: conf.devices,
      initial: frame.dataset.device || conf.initial,
      corners: ['nw', 'ne', 'sw', 'se'],
      anchor: 'center',
      externalUrl: (el) =>
        el.dataset.open ||
        (media && (media.getAttribute('kind') === 'iframe' ||
          inferKind(media.getAttribute('src') || '') === 'iframe')
          ? media.getAttribute('src') : null),
    });
    // Preset apply clears free-drag size — re-seed authoring hints after.
    if (frame.dataset.w) frame.style.setProperty('--phone-w', frame.dataset.w);
    if (frame.dataset.h) frame.style.setProperty('--phone-h', frame.dataset.h);
  }

  // Drive media lifecycle from deck navigation. When the global media-embeds
  // flag is off, treat every element as far away so iframes unmount and
  // videos stay paused (skipped slides shouldn't keep playing in the background).
  const slides = Array.from(document.querySelectorAll('.slide'));
  const medias = Array.from(document.querySelectorAll('vl-media')).map((el) => ({
    el,
    idx: slides.indexOf(el.closest('.slide')),
  }));
  function sync(index) {
    const enabled = mediaEnabled();
    medias.forEach((m) => {
      const d = enabled ? m.idx - index : 99;
      m.el.setDistance?.(d, { still: still || !enabled });
      // Wire embed chrome once the slide is in the media neighborhood.
      if (enabled && Math.abs(d) <= 2) {
        m.el.closest('.phone--embed') && wireEmbedFrame(m.el.closest('.phone--embed'));
      }
    });
  }
  document.addEventListener('deck:media-sync', (e) => sync(e.detail.index));
  document.addEventListener('deck:change', (e) => sync(e.detail.index));
  document.addEventListener('deck:media-embeds', (e) => {
    sync(typeof e.detail?.index === 'number'
      ? e.detail.index
      : slides.findIndex((s) => s.classList.contains('is-active')));
  });
}
