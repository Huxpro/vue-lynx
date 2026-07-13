import './styles.css';
import { mountMeteors } from './meteors.js';
import { initArch } from './arch.js';
import { ZH, ZH_VERBS, ZH_NOTES, normalizeKey } from './i18n.js';
import { readFlags, expandChrome } from './systems/flags.js';
import { initCommand } from './systems/command.js';
import { initDevtool } from './systems/devtool.js';

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

// =========================================================
// Fixed-stage fit — slides are authored against a 1280x720
// canvas (the .frame, a CSS size container). We scale the
// frame to fit the viewport, preserving 16:9 on any screen.
// stageScale is read by the magic-move engine so FLIP deltas
// (measured in scaled viewport px) map back to local space.
// =========================================================
const STAGE_W = 1280;
const STAGE_H = 720;
let stageScale = 1;
function fitStage() {
  if (!frame) return;
  stageScale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  frame.style.transform = `translate(-50%, -50%) scale(${stageScale})`;
}
fitStage();
window.addEventListener('resize', fitStage);

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
// Magic move (FLIP) — elements tagged with the same
// data-flip id on two adjacent slides morph between their
// positions/sizes, Keynote-style. Everything else uses the
// normal slide transition.
// =========================================================
const REDUCED_MOTION =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const FLIP_MS = 640;
const FLIP_EASE = 'cubic-bezier(0.34, 0.9, 0.25, 1)';
let flipCleanup = null;

function collectFlips(slide) {
  const map = new Map();
  slide.querySelectorAll('[data-flip]').forEach((el) => {
    map.set(el.getAttribute('data-flip'), el);
  });
  return map;
}

function magicMove(fromSlide, toSlide) {
  if (REDUCED_MOTION || embedMode || !fromSlide || !toSlide) return false;
  if (deck.classList.contains('overview')) return false;

  const fromMap = collectFlips(fromSlide);
  const pairs = [];
  toSlide.querySelectorAll('[data-flip]').forEach((toEl) => {
    const fromEl = fromMap.get(toEl.getAttribute('data-flip'));
    if (fromEl) pairs.push({ fromEl, toEl });
  });
  if (!pairs.length) return false;

  // Finish any in-flight morph before starting a new one.
  if (flipCleanup) flipCleanup();

  // 1. Source rects (fromSlide is still at rest this frame).
  pairs.forEach((p) => { p.fromRect = p.fromEl.getBoundingClientRect(); });

  // 2. Pin both slides so geometry is final (no enter/exit transform drift).
  fromSlide.classList.add('is-morphing-out');
  toSlide.classList.add('is-morphing-in');

  // 3. Destination rects (toSlide now pinned to its final layout).
  pairs.forEach((p) => { p.toRect = p.toEl.getBoundingClientRect(); });

  // 4. Invert — place each target element over its source, no transition.
  //    Rects are in scaled viewport px; divide the translation by the stage
  //    scale so it maps to the element's own (unscaled) coordinate space.
  const s = stageScale || 1;
  pairs.forEach(({ fromRect, toRect, toEl }) => {
    const dx = (fromRect.left - toRect.left) / s;
    const dy = (fromRect.top - toRect.top) / s;
    const sx = toRect.width ? fromRect.width / toRect.width : 1;
    const sy = toRect.height ? fromRect.height / toRect.height : 1;
    toEl.classList.add('is-flipping');
    toEl.style.transformOrigin = 'top left';
    toEl.style.transition = 'none';
    toEl.style.transform =
      `translate(${dx}px, ${dy}px) scale(${sx || 1}, ${sy || 1})`;
  });

  // 5. Play — release to the identity transform on the next frame.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pairs.forEach(({ toEl }) => {
        toEl.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
        toEl.style.transform = 'translate(0, 0) scale(1, 1)';
      });
    });
  });

  // 6. Cleanup.
  const cleanup = () => {
    clearTimeout(timer);
    pairs.forEach(({ toEl }) => {
      toEl.classList.remove('is-flipping');
      toEl.style.transform = '';
      toEl.style.transition = '';
      toEl.style.transformOrigin = '';
    });
    fromSlide.classList.remove('is-morphing-out');
    toSlide.classList.remove('is-morphing-in');
    flipCleanup = null;
  };
  const timer = setTimeout(cleanup, FLIP_MS + 120);
  flipCleanup = cleanup;
  return true;
}

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
  if (flipCleanup) flipCleanup();
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
    magicMove(slides[prev], slides[current]);
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

// =========================================================
// Keyboard
// =========================================================
// In embed mode the deck is read-only — the iframe is just a preview surface
// for the speaker view. Any local navigation would desync the speaker, then get
// stomped on the next heartbeat ("advances then reverts" bug).
if (!embedMode) {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches?.('input, textarea, [contenteditable]')) return;
    if (document.querySelector('.cmdk')) return; // command palette owns the keyboard

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
      case 'f': case 'F': toggleFullscreen(); break;
      case 'o': case 'O': deck.classList.toggle('overview'); break;
      case '.':
        document.documentElement.classList.toggle('light');
        channel.postMessage({ type: 'theme-toggle-mirror' });
        break;
      case 's': case 'S':
        e.preventDefault();
        openSpeakerWindow();
        break;
      case 'b': case 'B':
        applyBlackout(!blackedOut);
        channel.postMessage({ type: 'blackout', on: blackedOut });
        break;
      default:
        if (/^[1-9]$/.test(e.key)) {
          setSlide(Number(e.key) - 1);
        }
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
// Dark mode toggle button
// =========================================================
document.querySelector('.dark-toggle')?.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
});

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
// Drag-to-resize phone mockups. A corner grip adjusts the
// phone height (width follows the locked aspect ratio).
// Pointer deltas are divided by stageScale so the grip tracks
// the cursor inside the scaled .frame. Double-click resets.
// =========================================================
function initPhoneResize() {
  if (embedMode) return;
  const AR = 590 / 270; // height per unit width
  document.querySelectorAll('.phone').forEach((phone) => {
    if (phone.querySelector('.phone__resize')) return;
    const handle = document.createElement('div');
    handle.className = 'phone__resize';
    handle.setAttribute('aria-hidden', 'true');
    handle.title = 'Drag to resize · double-click to reset';
    phone.appendChild(handle);

    let startX = 0, startY = 0, startH = 0, dragging = false;

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startH = phone.getBoundingClientRect().height / (stageScale || 1);
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const s = stageScale || 1;
      const dx = (e.clientX - startX) / s;
      const dy = (e.clientY - startY) / s;
      // Corner drag: right and/or down both grow the phone.
      const h = Math.max(180, Math.min(1600, startH + (dy + dx * AR) / 2));
      phone.style.height = `${h}px`;
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
    handle.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      phone.style.height = '';
    });
  });
}
initPhoneResize();

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
  if (btn) btn.textContent = currentLang === 'zh' ? 'EN · l' : '中 · l';

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

document.querySelector('[data-lang-toggle]')?.addEventListener('click', toggleLang);
if (!embedMode) {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches?.('input, textarea, [contenteditable]')) return;
    if (document.querySelector('.cmdk')) return; // palette handles its own 'l'
    if (e.key === 'l' || e.key === 'L') toggleLang();
  });
}
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
  stageScale: () => stageScale,
  reducedMotion: () => REDUCED_MOTION,
  embed: () => embedMode,
};

const devtool = initDevtool(deckApi);
initCommand(deckApi, { devtool });

// Tell the world we're closing too (so the speaker can grey out if needed)
window.addEventListener('beforeunload', () => {
  try {
    channel.postMessage({ type: 'deck-closed' });
  } catch {
    // The channel may already be closed during page teardown.
  }
});
