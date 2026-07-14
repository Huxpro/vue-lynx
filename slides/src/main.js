import './styles.css';
import { mountMeteors } from './meteors.js';
import { initArch } from './arch.js';
import { ZH, ZH_VERBS, ZH_NOTES, normalizeKey } from './i18n.js';
import { readFlags, expandChrome } from './framework/flags.js';
import { initCommand } from './framework/command.js';
import { initDevtool } from './framework/devtool.js';
import { createStage } from './framework/stage.js';
import { createMagicMove } from './framework/magic-move.js';
import { ICONS } from './framework/icons.js';

// =========================================================
// URL flags — ?embed=1 locks the deck to a single slide and
// strips all chrome so the speaker view can iframe it.
// =========================================================
const params = new URLSearchParams(location.search);
const embedMode = params.has('embed');
if (embedMode) {
  document.documentElement.classList.add('is-embed');
}

// =========================================================
// Lynx runtime — lazy, single-flight
// =========================================================
let lynxRuntimeReady = null;
function ensureLynxRuntime() {
  if (!lynxRuntimeReady) {
    lynxRuntimeReady = import('@lynx-js/web-core/client');
  }
  return lynxRuntimeReady;
}

// Rewrite the webpack publicPath baked into the bundle at build time so image
// URLs resolve against the bundle location, not the (unreachable) dev-machine
// address that was captured when the example was built. Both spacing variants
// occur across bundles: `.p="x"` and `.p = "x"`.
const WEBPACK_PUBLIC_PATH_RE = /\.p\s*=\s*\\"[^"]*\\"/g;

// Shared group keeps multiple lynx-views on a single worker
const LYNX_GROUP_ID = 7;

// =========================================================
// <vl-demo bundle="todomvc/dist/main.web.bundle">
// =========================================================
class VlDemo extends HTMLElement {
  static get observedAttributes() { return ['bundle']; }

  constructor() {
    super();
    this._mounted = false;
    this._loadStarted = false;
  }

  connectedCallback() {
    if (this._mounted) return;
    this._mounted = true;
    if (embedMode) {
      // Speaker preview: skip the live demo, show a calm placeholder.
      this.innerHTML = `
        <div class="vl-demo__loading vl-demo__loading--embed">
          <div class="vl-demo__bullet"></div>
          <div>Live on audience screen</div>
        </div>
      `;
      this.dataset.ready = 'embed';
      return;
    }
    this.innerHTML = `
      <div class="vl-demo__loading">
        <div class="spinner"></div>
        <div>Loading Lynx for Web</div>
      </div>
    `;
  }

  attributeChangedCallback() {
    if (this._loadStarted) this.load();
  }

  /** Begin loading the runtime + bundle. Called by the deck on slide reveal. */
  async load() {
    if (this._loadStarted) return;
    this._loadStarted = true;

    const bundle = this.getAttribute('bundle');
    if (!bundle) return;
    const url = `/examples/${bundle}`;

    try {
      await ensureLynxRuntime();

      const view = document.createElement('lynx-view');
      view.setAttribute('lynx-group-id', String(LYNX_GROUP_ID));
      view.setAttribute('transform-vh', '');
      view.setAttribute('transform-vw', '');

      view.customTemplateLoader = async (templateUrl) => {
        const res = await fetch(templateUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const baseUrl = templateUrl.substring(0, templateUrl.lastIndexOf('/') + 1);
        const rewritten = text.replace(
          WEBPACK_PUBLIC_PATH_RE,
          `.p=\\"${baseUrl}\\"`,
        );
        const template = JSON.parse(rewritten);

        if (template.lepusCode?.root) {
          const root = template.lepusCode.root;
          if (
            typeof root === 'string' &&
            root.includes('__webpack_require__') &&
            !root.includes('function __webpack_require__')
          ) {
            template.lepusCode.root =
              `var __webpack_require__={p:"${baseUrl}"};` + root;
          }
        }
        return template;
      };

      this.insertBefore(view, this.firstChild);

      const t0 = performance.now();
      const markReady = () => {
        this.dataset.ready = 'true';
      };

      const pollShadow = () => {
        const sr = view.shadowRoot;
        if (sr) {
          if (sr.childElementCount > 0) {
            markReady();
            return;
          }
          const mo = new MutationObserver(() => {
            if (sr.childElementCount > 0) {
              mo.disconnect();
              markReady();
            }
          });
          mo.observe(sr, { childList: true, subtree: true });
        } else if (performance.now() - t0 < 5000) {
          requestAnimationFrame(pollShadow);
        }
      };

      view.url = url;
      pollShadow();

      const updateDims = () => {
        const r = this.getBoundingClientRect();
        view.browserConfig = {
          pixelWidth: Math.round(r.width * window.devicePixelRatio),
          pixelHeight: Math.round(r.height * window.devicePixelRatio),
        };
      };
      requestAnimationFrame(updateDims);
      const ro = new ResizeObserver(updateDims);
      ro.observe(this);
    } catch (err) {
      console.error('[demo] load failed', err);
      const loading = this.querySelector('.vl-demo__loading');
      if (loading) {
        loading.innerHTML = `<div style="color:#ff8a8a;text-align:center;">
          Failed to load demo<br><small style="opacity:.6">${err.message ?? err}</small>
        </div>`;
      }
    }
  }
}

customElements.define('vl-demo', VlDemo);

// =========================================================
// Deck navigation
// =========================================================
const deck = document.querySelector('.deck');
const frame = document.querySelector('.frame');
const slides = Array.from(document.querySelectorAll('.slide'));
const progressBar = document.querySelector('.progress__bar');
const counter = document.querySelector('[data-counter]');

// Framework engine: fixed 16:9 stage + magic-move (see framework/).
const stage = createStage(frame);
const REDUCED_MOTION =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const mm = createMagicMove({
  deck,
  getScale: stage.getScale,
  reducedMotion: REDUCED_MOTION,
  embed: embedMode,
});

let current = 0;
let speakerWindow = null;
let blackedOut = false;

// =========================================================
// Slide metadata — title + sanitized notes — shared with the
// speaker view via BroadcastChannel so it can render notes
// without parsing the live DOM.
// =========================================================
// Rebuilt after a language switch so the speaker view gets translated
// titles + notes over the channel.
let slideMeta = [];
function buildSlideMeta() {
  slideMeta = slides.map((slide) => {
    const titleEl = slide.querySelector(
      '.h-cover, .h-section, .demo__title, .divider__title, .cta__title, .combine__result .result-text, .thankyou h1',
    );
    const eyebrowEl = slide.querySelector('.eyebrow');
    const title = (titleEl?.textContent || eyebrowEl?.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    const notesEl = slide.querySelector('aside.notes');
    const notes = notesEl ? notesEl.innerHTML : '';

    return { title, notes };
  });
}
buildSlideMeta();

// =========================================================
// Slide flags — background / transition / chrome per slide.
// Overrides (from the DevTool) merge over the slide's data-*.
// =========================================================
const flagOverrides = new Map(); // index -> { bg?, transition?, chrome? }
const CHROME_EL = {
  brand: document.querySelector('.chrome--top'),
  controls: document.querySelector('.chrome--top-right'),
  counter: document.querySelector('.chrome--bottom'),
  link: document.querySelector('.chrome--bottom-right'),
  progress: document.querySelector('.progress'),
};

function resolveFlags(index) {
  return { ...readFlags(slides[index]), ...(flagOverrides.get(index) || {}) };
}

function applyChromeAndBg(flags) {
  deck.dataset.bg = flags.bg;
  const visible = expandChrome(flags.chrome);
  for (const [piece, elx] of Object.entries(CHROME_EL)) {
    if (elx) elx.classList.toggle('is-chrome-hidden', !visible.has(piece));
  }
}

function setFlagOverride(index, key, value) {
  const cur = flagOverrides.get(index) || {};
  if (value == null) delete cur[key];
  else cur[key] = value;
  if (Object.keys(cur).length) flagOverrides.set(index, cur);
  else flagOverrides.delete(index);
  if (index === current) applyChromeAndBg(resolveFlags(current));
}

function hasFlagOverride(index, key) {
  return flagOverrides.get(index)?.[key] !== undefined;
}

function clearFlags(index) {
  flagOverrides.delete(index);
  if (index === current) applyChromeAndBg(resolveFlags(current));
}

function setSlide(index, opts = {}) {
  // Finalize any in-flight magic move before changing slides, so a fast
  // navigation can't leave a morphing slide pinned visible (is-morphing-in).
  mm.finish();
  const prev = current;
  current = Math.max(0, Math.min(slides.length - 1, index));
  const adjacent = Math.abs(current - prev) === 1;
  const flags = resolveFlags(current);
  const cut = flags.transition === 'cut';
  if (cut) deck.classList.add('is-cut'); // disables .slide transition for this change

  slides.forEach((s, i) => {
    s.classList.toggle('is-active', i === current);
    s.classList.toggle('is-prev', i < current);
  });
  applyChromeAndBg(flags);

  if (flags.transition === 'magic' && adjacent && !opts.jump) {
    mm.magicMove(slides[prev], slides[current]);
  }
  if (cut) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => deck.classList.remove('is-cut')));
  }

  if (progressBar) {
    progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  }
  if (counter) {
    counter.textContent = String(current + 1).padStart(2, '0') +
      ' / ' + String(slides.length).padStart(2, '0');
  }
  if (!opts.skipHash) {
    history.replaceState(null, '', `#${current + 1}`);
  }
  preloadDemosNear(current);

  if (!opts.fromChannel) {
    broadcastState();
  }
  document.dispatchEvent(new CustomEvent('deck:change', {
    detail: { index: current, total: slides.length },
  }));
}

function preloadDemosNear(index) {
  // Embed iframes are speaker previews — no need to spin up Lynx workers there.
  // It would also steal keyboard focus from the speaker's outer window.
  if (embedMode) return;
  for (const offset of [0, 1]) {
    const slide = slides[index + offset];
    if (!slide) continue;
    slide.querySelectorAll('vl-demo').forEach((d) => d.load?.());
  }
}

function next() { setSlide(current + 1); }
function prev() { setSlide(current - 1); }
function first() { setSlide(0); }
function last() { setSlide(slides.length - 1); }

// =========================================================
// BroadcastChannel — speaker <-> deck sync.
// We use this in BOTH the main deck and the embed iframes so
// that "go to slide N" arrives in the right window.
// =========================================================
const channel = new BroadcastChannel('vue-lynx-deck');

function broadcastState() {
  if (embedMode) return;
  channel.postMessage({
    type: 'state',
    index: current,
    total: slides.length,
    slides: slideMeta,
  });
}

// BroadcastChannel: only the main deck (non-embed) reacts to nav/state requests.
// Embed iframes ignore it entirely — they're driven by direct postMessage from
// the speaker window, which targets a specific iframe instead of broadcasting.
if (!embedMode) {
  channel.addEventListener('message', (ev) => {
    const msg = ev.data;
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'request-state':
        broadcastState();
        break;
      case 'nav':
        if (msg.dir === 'next') next();
        else if (msg.dir === 'prev') prev();
        else if (msg.dir === 'first') first();
        else if (msg.dir === 'last') last();
        else if (msg.dir === 'goto' && typeof msg.index === 'number') setSlide(msg.index);
        break;
      case 'theme-toggle':
        document.documentElement.classList.toggle('light');
        break;
      case 'blackout':
        applyBlackout(!!msg.on);
        break;
      case 'speaker-closed':
        speakerWindow = null;
        break;
    }
  });
}

// Embed iframes navigate via window.postMessage from the speaker (per-iframe targeting).
// Also listen for hashchange as a safety net.
if (embedMode) {
  window.addEventListener('message', (ev) => {
    if (ev.origin !== location.origin) return;
    const msg = ev.data;
    if (!msg || msg.type !== 'go') return;
    if (typeof msg.index === 'number' && msg.index !== current) {
      setSlide(msg.index, { fromChannel: true });
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = Number.parseInt(location.hash.replace('#', ''), 10);
    if (!Number.isNaN(hash) && hash >= 1 && hash <= slides.length) {
      const idx = hash - 1;
      if (idx !== current) setSlide(idx, { skipHash: true, fromChannel: true });
    }
  });
}

// =========================================================
// Speaker window helpers
// =========================================================
function openSpeakerWindow() {
  if (speakerWindow && !speakerWindow.closed) {
    speakerWindow.focus();
    return;
  }
  const w = Math.min(1400, Math.round(screen.availWidth * 0.85));
  const h = Math.min(900, Math.round(screen.availHeight * 0.85));
  speakerWindow = window.open(
    '/speaker.html',
    'vue-lynx-speaker',
    `popup,width=${w},height=${h}`,
  );
  // First sync — give the popup a tick to register its channel listener
  setTimeout(broadcastState, 250);
}

function applyBlackout(on) {
  blackedOut = on;
  document.body.classList.toggle('is-blackout', on);
}

// While blacked out, any tap/click on the audience screen restores it. This is
// the only way back on touch devices (no keyboard), and the blackout overlay is
// pointer-events:none so the tap reaches here. Capture phase + stop so the same
// tap can't also navigate the deck.
if (!embedMode) {
  document.addEventListener('pointerdown', (e) => {
    if (!blackedOut) return;
    e.preventDefault();
    e.stopPropagation();
    applyBlackout(false);
    channel.postMessage({ type: 'blackout', on: false });
  }, true);
}

// =========================================================
// Keyboard
// =========================================================
// In embed mode the deck is read-only — the iframe is just a preview surface
// for the speaker view. Any local navigation would desync the speaker, then get
// stomped on the next heartbeat ("advances then reverts" bug).
if (!embedMode) {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches?.('input, textarea, [contenteditable]')) return;
    // Typing inside a live demo (native inputs live in the lynx-view shadow, so
    // the event retargets to the .phone host) must not drive the deck.
    if (e.target?.closest?.('.phone, .no-deck-scroll')) return;
    if (document.querySelector('.cmdk')) return; // command palette owns the keyboard

    // Only slide navigation is bound to bare keys. Every discrete action
    // (fullscreen, overview, theme, speaker view, blackout, language, devtool,
    // jump-to-slide) lives behind the command palette — press ⌘K / Ctrl-K to
    // search, or `/` for slash mode. This keeps stray keystrokes from firing
    // commands while you type.
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); first(); break;
      case 'End': e.preventDefault(); last(); break;
    }
  });
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen?.();
  }
}

// Click in overview mode jumps to slide
deck.addEventListener('click', (e) => {
  if (!deck.classList.contains('overview')) return;
  const slide = e.target.closest('.slide');
  if (!slide) return;
  const idx = slides.indexOf(slide);
  if (idx >= 0) {
    deck.classList.remove('overview');
    setSlide(idx);
  }
});

// Mouse wheel / touch swipe — disabled in embed mode (the iframes
// should never navigate themselves; the speaker is the controller).
if (!embedMode) {
  let wheelLock = false;
  deck.addEventListener('wheel', (e) => {
    if (deck.classList.contains('overview')) return;
    if (document.querySelector('.cmdk')) return;
    // Inner scrollable content (live demos in the device mockups, or anything
    // marked .no-deck-scroll) owns its own scroll — only advance the deck when
    // the wheel happens over the slide surface itself, not inside a demo.
    if (e.target?.closest?.('.phone, .no-deck-scroll')) return;
    if (wheelLock) return;
    const threshold = 30;
    if (Math.abs(e.deltaY) < threshold && Math.abs(e.deltaX) < threshold) return;
    wheelLock = true;
    setTimeout(() => (wheelLock = false), 600);
    if (e.deltaY > 0 || e.deltaX > 0) next();
    else prev();
  }, { passive: true });

  let touchStart = null;
  deck.addEventListener('touchstart', (e) => {
    // Let demos handle their own scroll/swipe (same rule as the wheel guard).
    if (e.target?.closest?.('.phone, .no-deck-scroll')) { touchStart = null; return; }
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const dx = (e.changedTouches[0].clientX - touchStart.x);
    const dy = (e.changedTouches[0].clientY - touchStart.y);
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
    } else if (Math.abs(dy) > 50) {
      dy < 0 ? next() : prev();
    }
    touchStart = null;
  }, { passive: true });
}

// =========================================================
// Boot
// =========================================================
const startIndex = (() => {
  const hash = Number.parseInt(location.hash.replace('#', ''), 10);
  if (!Number.isNaN(hash) && hash >= 1 && hash <= slides.length) {
    return hash - 1;
  }
  return 0;
})();
setSlide(startIndex, { skipHash: true });

// Re-broadcast every few seconds in case the speaker connects late
if (!embedMode) {
  setInterval(broadcastState, 4000);
  // Tell other tabs we just woke up — they'll resync.
  channel.postMessage({ type: 'request-state' });
}

const canvas = document.querySelector('.meteors');
if (canvas) mountMeteors(canvas, { gridSize: 120, meteorCount: 3 });

// =========================================================
// Device mockups — free drag-to-resize + preset switcher.
// A corner grip resizes width/height independently (no aspect
// lock). Three preset buttons (phone / vertical tablet / desktop)
// snap the frame to a canonical aspect ratio and size. Pointer
// deltas are divided by the stage scale so the grip tracks the
// cursor inside the scaled .frame. Double-click resets.
// =========================================================
// device -> canonical aspect ratio + sizing. Phone/tablet are driven by
// height (portrait); desktop by width (landscape). A slide can seed a wider
// default with data-ar (e.g. the to-do list).
const DEVICE_PRESETS = {
  phone:   { ar: '270 / 590', w: 'auto',              h: 'min(78cqh, 620px)' },
  tablet:  { ar: '3 / 4',     w: 'auto',              h: 'min(82cqh, 640px)' },
  desktop: { ar: '16 / 10',   w: 'min(36cqw, 460px)', h: 'auto' },
};

function applyDevicePreset(phone, name) {
  const p = DEVICE_PRESETS[name] || DEVICE_PRESETS.phone;
  phone.dataset.device = name;
  phone.style.width = '';   // clear any free-drag size
  phone.style.height = '';
  phone.style.setProperty('--phone-ar', p.ar);
  phone.style.setProperty('--phone-w', p.w);
  phone.style.setProperty('--phone-h', p.h);
  phone.querySelectorAll('.phone__preset').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.device === name));
}

function initPhoneControls() {
  if (embedMode) return;
  const DEVICES = ['phone', 'tablet', 'desktop'];
  const DEVICE_ICON = { phone: 'smartphone', tablet: 'tablet', desktop: 'monitor' };

  document.querySelectorAll('.phone').forEach((phone) => {
    if (phone.querySelector('.phone__resize')) return;

    // Preset switcher (bottom-right).
    const bar = document.createElement('div');
    bar.className = 'phone__presets';
    bar.setAttribute('aria-label', 'Device size');
    bar.innerHTML = DEVICES.map((d) =>
      `<button type="button" class="phone__preset" data-device="${d}" ` +
      `title="${d}">${ICONS[DEVICE_ICON[d]]}</button>`).join('');
    phone.appendChild(bar);
    bar.addEventListener('pointerdown', (e) => e.stopPropagation());
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.phone__preset');
      if (!btn) return;
      e.stopPropagation();
      applyDevicePreset(phone, btn.dataset.device);
    });

    // Free drag-to-resize grip.
    const handle = document.createElement('div');
    handle.className = 'phone__resize';
    handle.setAttribute('aria-hidden', 'true');
    handle.title = 'Drag to resize · double-click to reset';
    phone.appendChild(handle);

    // Seed the initial preset (default phone), then honour a data-ar override.
    applyDevicePreset(phone, phone.dataset.device || 'phone');
    if (phone.dataset.ar) phone.style.setProperty('--phone-ar', phone.dataset.ar);

    let startX = 0, startY = 0, startW = 0, startH = 0, dragging = false;

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      const s = stage.getScale() || 1;
      const r = phone.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startW = r.width / s;
      startH = r.height / s;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const s = stage.getScale() || 1;
      const dx = (e.clientX - startX) / s;
      const dy = (e.clientY - startY) / s;
      // Independent axes — no aspect lock. Pin both dimensions inline so the
      // CSS aspect-ratio no longer constrains the frame.
      phone.style.width = `${Math.max(140, Math.min(1100, startW + dx))}px`;
      phone.style.height = `${Math.max(140, Math.min(1100, startH + dy))}px`;
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    // Keep touch drags from bubbling into the deck's swipe navigation.
    handle.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    // Double-click resets to the current preset's canonical size.
    handle.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      applyDevicePreset(phone, phone.dataset.device || 'phone');
    });
  });
}
initPhoneControls();

// =========================================================
// Cycling cover verb — swaps word list with the language.
// =========================================================
const EN_VERBS = ['Unlock', 'Vibe', 'Render', 'Ship'];
let verbs = EN_VERBS;
const verbEl = document.querySelector('[data-cover-verb]');
let vi = 0;
let vtext = verbs[0];
let vdeleting = false;
let vpaused = false;

function setVerbLang(lang) {
  verbs = lang === 'zh' ? ZH_VERBS : EN_VERBS;
  vi = 0;
  vtext = '';
  vdeleting = false;
  vpaused = false;
  if (verbEl) verbEl.textContent = '';
}

if (verbEl) {
  const tick = () => {
    const word = verbs[vi % verbs.length];
    if (!vdeleting && vtext === word) {
      if (!vpaused) { vpaused = true; setTimeout(tick, 1500); return; }
      vpaused = false; vdeleting = true;
      setTimeout(tick, 120);
    } else if (vdeleting) {
      vtext = word.substring(0, vtext.length - 1);
      verbEl.textContent = vtext;
      if (vtext === '') {
        vdeleting = false;
        vi = (vi + 1) % verbs.length;
        setTimeout(tick, 180);
      } else setTimeout(tick, 80);
    } else {
      vtext = word.substring(0, vtext.length + 1);
      verbEl.textContent = vtext;
      setTimeout(tick, 160);
    }
  };
  setTimeout(tick, 1500);
}

// Copy buttons
document.querySelectorAll('[data-copy]').forEach((el) => {
  el.addEventListener('click', () => {
    const text = el.dataset.copy || el.textContent;
    navigator.clipboard.writeText(text);
    const old = el.textContent;
    el.textContent = 'copied!';
    setTimeout(() => { el.textContent = old; }, 1200);
  });
});

// =========================================================
// Language — English is inline; i18n.js supplies Chinese.
// Text is swapped in place (data-flip identity preserved).
// Toggle with `l` or the chrome button; ?lang=zh deep-links;
// choice is mirrored to the speaker view over the channel.
// =========================================================
const I18N_SELECTOR = [
  '.eyebrow', 'h1', 'h2', 'h3', 'p', 'li',
  '.chip', '.pstack__item', '.cover__tagline', '.cover__title-line',
  '.combine__name', '.result-label', '.tl-item__week', '.node__label',
  '.arrow', '.cta__link', '.agent', '.mega', '.label',
].map((s) => `.slide ${s}`).join(', ') + ', .gate-legend span';

let i18nEls = [];
let noteEls = [];
function initI18n() {
  i18nEls = [];
  document.querySelectorAll(I18N_SELECTOR).forEach((el) => {
    if (el.closest('.notes')) return;            // notes handled separately
    if (el.querySelector('[data-cover-verb]')) return; // cycling verb line
    i18nEls.push({ el, en: el.innerHTML, key: normalizeKey(el.textContent) });
  });
  // Speaker notes, keyed by slide order (ZH_NOTES[i]).
  noteEls = [...document.querySelectorAll('.slide aside.notes')].map((el) => ({
    el,
    en: el.innerHTML,
  }));
}

let currentLang = 'en';
function applyLang(lang, opts = {}) {
  currentLang = lang === 'zh' ? 'zh' : 'en';
  document.documentElement.setAttribute('data-lang', currentLang);
  i18nEls.forEach(({ el, en, key }) => {
    const zh = ZH[key];
    el.innerHTML = currentLang === 'zh' && zh != null ? zh : en;
  });
  noteEls.forEach(({ el, en }, i) => {
    const zh = ZH_NOTES[i];
    el.innerHTML = currentLang === 'zh' && zh != null ? zh : en;
  });
  initArch(currentLang);
  setVerbLang(currentLang);

  // Refresh speaker-view metadata (titles + notes) in the new language.
  buildSlideMeta();
  if (!embedMode) broadcastState();

  const btn = document.querySelector('[data-lang-toggle]');
  if (btn) btn.textContent = currentLang === 'zh' ? 'EN' : '中';

  try { localStorage.setItem('deck-lang', currentLang); } catch { /* ignore */ }
  if (!embedMode) {
    const url = new URL(location.href);
    if (currentLang === 'zh') url.searchParams.set('lang', 'zh');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
  }
  if (!opts.fromChannel && !embedMode) {
    channel.postMessage({ type: 'lang', lang: currentLang });
  }
}

function toggleLang() {
  applyLang(currentLang === 'zh' ? 'en' : 'zh');
}

initI18n();

// Initial language: ?lang wins, then last saved choice, else 中文 (default).
const startLang = (() => {
  if (params.get('lang') === 'zh') return 'zh';
  if (params.get('lang') === 'en') return 'en';
  try {
    const saved = localStorage.getItem('deck-lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch { /* ignore */ }
  return 'zh';
})();
applyLang(startLang, { fromChannel: true });

// The chrome button still toggles language on click; the keyboard shortcut
// now lives only in the command palette (⌘K / `/` → `l`).
document.querySelector('[data-lang-toggle]')?.addEventListener('click', toggleLang);
channel.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg) return;
  if (msg.type === 'lang' && msg.lang !== currentLang) {
    applyLang(msg.lang, { fromChannel: true });
  } else if (msg.type === 'lang-toggle' && !embedMode) {
    // A speaker-view request — the main deck owns the toggle and rebroadcasts.
    toggleLang();
  }
});

// =========================================================
// Deck controller — the single API the Command Palette and
// DevTool read/drive. Mirrors hux.pro's provider surface so
// the two decks can converge on one slide framework.
// =========================================================
const deckApi = {
  next, prev, first, last,
  goto: (i) => setSlide(i, { jump: true }),
  current: () => current,
  total: () => slides.length,
  meta: () => slideMeta,
  slideEl: (i) => slides[i ?? current],
  flags: (i) => resolveFlags(i ?? current),
  setFlag: (key, value, i) => setFlagOverride(i ?? current, key, value),
  hasOverride: (i, key) => hasFlagOverride(i, key),
  clearFlags: (i) => clearFlags(i ?? current),
  lang: () => currentLang,
  toggleLang,
  theme: () => (document.documentElement.classList.contains('light') ? 'light' : 'dark'),
  toggleTheme: () => {
    document.documentElement.classList.toggle('light');
    channel.postMessage({ type: 'theme-toggle-mirror' });
  },
  overview: () => deck.classList.contains('overview'),
  toggleOverview: () => deck.classList.toggle('overview'),
  isBlackout: () => blackedOut,
  blackout: () => {
    applyBlackout(!blackedOut);
    channel.postMessage({ type: 'blackout', on: blackedOut });
  },
  fullscreen: toggleFullscreen,
  openSpeaker: openSpeakerWindow,
  stageScale: () => stage.getScale(),
  reducedMotion: () => REDUCED_MOTION,
  embed: () => embedMode,
};

const devtool = initDevtool(deckApi);
const command = initCommand(deckApi, { devtool });

// Persistent corner launcher — opens the palette in slash mode. This is the
// primary way to reach commands on touch devices (no keyboard). The palette's
// list is tappable, so slash mode works fine without any key presses.
document.querySelector('[data-palette]')?.addEventListener('click', () => {
  command?.open?.(true);
});

// Tell the world we're closing too (so the speaker can grey out if needed)
window.addEventListener('beforeunload', () => {
  try {
    channel.postMessage({ type: 'deck-closed' });
  } catch {
    // The channel may already be closed during page teardown.
  }
});
