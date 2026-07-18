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
//   · iframes are mounted only when their slide is at most
//     one step away and unloaded again two steps out, so a
//     heavy embedded page never taxes the rest of the talk.
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
      img.src = this.src;
      this.appendChild(img);
    } else if (this.kind === 'video') {
      const v = document.createElement('video');
      v.playsInline = true;
      v.muted = !this.hasAttribute('unmuted');
      v.loop = !this.hasAttribute('no-loop');
      if (this.hasAttribute('controls')) v.controls = true;
      v.preload = 'metadata';
      v.addEventListener('error', () => this.classList.add('is-missing'));
      v.addEventListener('loadedmetadata', () => this.classList.remove('is-missing'));
      v.src = this.src;
      this.appendChild(v);
      this._video = v;
    }
    // iframes mount lazily in setDistance().
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
    if (this.kind === 'video' && this._video) {
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
    } else if (this.kind === 'iframe') {
      // Live only in the immediate neighborhood; embed previews (the
      // speaker view's iframes) never mount nested third-party pages.
      if (Math.abs(d) <= 1 && !still) this._mountFrame();
      else if (Math.abs(d) >= 2) this._unmountFrame();
    }
  }
}

export function registerVlMedia() {
  if (!customElements.get('vl-media')) customElements.define('vl-media', VlMedia);
}

export function initEmbeds({ getScale, reducedMotion = false, embed = false } = {}) {
  registerVlMedia();
  const still = reducedMotion || embed;

  // Resizable embed frames — same chrome as the demo phones, with
  // embed-shaped presets. Inline data-w/data-h re-apply after the
  // initial preset so a slide can seed its own size (the cascade).
  document.querySelectorAll('.phone--embed').forEach((frame) => {
    const conf = EMBED_DEVICES[frame.dataset.embed] || EMBED_DEVICES.wide;
    const media = frame.querySelector('vl-media');
    attachDeviceControls(frame, {
      getScale,
      presets: EMBED_PRESETS,
      devices: conf.devices,
      initial: frame.dataset.device || conf.initial,
      corners: ['nw', 'ne', 'sw', 'se'],
      anchor: 'center',
      externalUrl: () =>
        frame.dataset.external ||
        (media && (media.getAttribute('kind') === 'iframe' ||
          inferKind(media.getAttribute('src') || '') === 'iframe')
          ? media.getAttribute('src') : null),
    });
    if (frame.dataset.w) frame.style.setProperty('--phone-w', frame.dataset.w);
    if (frame.dataset.h) frame.style.setProperty('--phone-h', frame.dataset.h);
  });

  // Drive media lifecycle from deck navigation.
  const slides = Array.from(document.querySelectorAll('.slide'));
  const medias = Array.from(document.querySelectorAll('vl-media')).map((el) => ({
    el,
    idx: slides.indexOf(el.closest('.slide')),
  }));
  document.addEventListener('deck:change', (e) => {
    medias.forEach((m) => m.el.setDistance?.(m.idx - e.detail.index, { still }));
  });
}
