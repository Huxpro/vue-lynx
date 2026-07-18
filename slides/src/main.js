import './styles.css';
import { mountMeteors } from './meteors.js';
import { initArch } from './arch.js';
import { initWeave } from './weave.js';
import { ZH, ZH_NOTES, normalizeKey } from './i18n.js';
import { readFlags, expandChrome } from './framework/flags.js';
import { initCommand } from './framework/command.js';
import { initDevtool } from './framework/devtool.js';
import { createStage } from './framework/stage.js';
import { createMagicMove } from './framework/magic-move.js';
import { attachDeviceControls, DECK_PRESETS } from './framework/device.js';
import { registerVlDemo } from './demo.js';
import { initEmbeds } from './embeds.js';
import { initQRCodes } from './qrcodes.js';

// =========================================================
// URL flags — ?embed=1 locks the deck to a single slide and
// strips all chrome so the speaker view can iframe it.
// =========================================================
const params = new URLSearchParams(location.search);
const embedMode = params.has('embed');
if (embedMode) {
  document.documentElement.classList.add('is-embed');
}

// <vl-demo> custom element lives in ./demo.js (shared with the play page).
registerVlDemo();

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

// Overview grid fit — each thumbnail renders at the full 1280×720 design size
// and is shrunk uniformly via CSS `zoom` (see .deck.overview in styles.css).
// Compute the zoom so a row of OV_COLS tiles exactly fills the deck width; the
// literals here must stay in sync with the grid's columns / gap / padding.
const OV_COLS = 4, OV_GAP = 14, OV_PAD = 32, OV_BASE_W = 1280;
function fitOverview() {
  if (!deck.classList.contains('overview')) return;
  const inner = deck.clientWidth - OV_PAD * 2 - OV_GAP * (OV_COLS - 1);
  const zoom = Math.max(0.05, inner / OV_COLS / OV_BASE_W);
  deck.style.setProperty('--ov-zoom', String(zoom));
}
window.addEventListener('resize', fitOverview);
const REDUCED_MOTION =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const mm = createMagicMove({
  deck,
  getScale: stage.getScale,
  reducedMotion: REDUCED_MOTION,
  embed: embedMode,
});

// The epilogue's "fabrics" canvas — one persistent layer under the
// slides; scenes are declared per-slide via data-weave and tweened
// across navigations (see src/weave.js). Embed iframes render a
// single static frame so speaker previews stay cheap.
const weave = initWeave(frame, {
  getScale: stage.getScale,
  reducedMotion: REDUCED_MOTION,
  embed: embedMode,
});
document.addEventListener('deck:change', (e) => {
  // Overlay slides float above their base slide (see setSlide) — unless
  // they declare their own scene, they inherit the base's weave so the
  // canvas doesn't blink out under a media layer.
  let i = e.detail.index;
  while (i > 0 && slides[i].classList.contains('overlay') && !slides[i].dataset.weave) i--;
  weave.setScene(slides[i]?.dataset.weave || null);
});

// Media embeds — <vl-media> lifecycle (video reset/autoplay, iframe
// proximity mount/unload) + resizable .phone--embed frames.
initEmbeds({
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
  if (Object.keys(cur).length > 0) flagOverrides.set(index, cur);
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

  // Overlay slides keep their base slide visible beneath them: the
  // nearest previous non-overlay slide stays rendered (`is-under`), so
  // a media layer reads as "the same page, plus a layer" instead of a
  // hard cut. Consecutive overlays share one base.
  let under = -1;
  if (slides[current]?.classList.contains('overlay')) {
    under = current - 1;
    while (under >= 0 && slides[under].classList.contains('overlay')) under--;
  }
  slides.forEach((s, i) => {
    s.classList.toggle('is-active', i === current);
    s.classList.toggle('is-under', i === under);
    s.classList.toggle('is-prev', i < current && i !== under);
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
  syncSlideMedia(current);

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

// Native recording clips (<video>) only play on the current slide — every
// other clip is paused and rewound so the deck stays quiet and cheap. When
// reduced-motion is set we leave the poster frame up instead of autoplaying.
function syncSlideMedia(index) {
  document.querySelectorAll('video.native-clip').forEach((v) => {
    const onCurrent = slides[index] && slides[index].contains(v);
    if (onCurrent && !REDUCED_MOTION && !embedMode) {
      const p = v.play?.();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause?.();
      if (!onCurrent) {
        try { v.currentTime = 0; } catch { /* not seekable yet */ }
      }
    }
  });
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
// Demo focus containment — live demos are real apps, and some
// autofocus an input the moment they load (TodoMVC), which
// would silently swallow the arrow keys via the .phone guard
// below. Policy: only a deliberate pointer/touch INTO a demo
// hands it the keyboard. Programmatic focus grabs are blurred
// on the spot, navigation reclaims focus on every slide
// change, and clicking anywhere outside a demo takes the
// keyboard back.
// =========================================================
let demoEngaged = false;
const inDemo = (el) => !!el?.closest?.('.phone, .no-deck-scroll');

if (!embedMode) {
  document.addEventListener('pointerdown', (e) => {
    const inside = inDemo(e.target);
    // Clicking outside a demo also releases any focus it still holds,
    // so arrows never double-drive a demo input AND the deck.
    if (!inside && inDemo(document.activeElement)) {
      document.activeElement.blur?.();
    }
    demoEngaged = inside;
  }, true);

  document.addEventListener('focusin', (e) => {
    // Focus landed inside a demo without a user gesture → an autofocus
    // grab. Refuse it; the deck keeps the keyboard.
    if (inDemo(e.target) && !demoEngaged) e.target.blur?.();
  });

  document.addEventListener('deck:change', () => {
    demoEngaged = false;
    if (inDemo(document.activeElement)) document.activeElement.blur?.();
  });
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
    // the event retargets to the .phone host) must not drive the deck — but
    // only when the user deliberately clicked into the demo (demoEngaged).
    // An app that autofocused itself doesn't get to eat the arrow keys.
    if (demoEngaged && e.target?.closest?.('.phone, .no-deck-scroll')) return;
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

// Render the Web + Lynx-App QR pair onto each demo slide.
initQRCodes();

// =========================================================
// Device mockups — free drag-to-resize + preset switcher.
// A corner grip resizes width/height independently (no aspect
// lock). Three preset buttons (phone / vertical tablet / desktop)
// snap the frame to a canonical aspect ratio and size. Pointer
// deltas are divided by the stage scale so the grip tracks the
// cursor inside the scaled .frame. Double-click resets.
// =========================================================
// Shared device-frame controls (preset switcher + drag grip) — see
// framework/device.js. The play page reuses the same component.
function initPhoneControls() {
  if (embedMode) return;
  // (embed frames wire their own controls in initEmbeds, with
  // embed-shaped presets — skip them here)
  document.querySelectorAll('.phone:not(.phone--embed)').forEach((phone) =>
    attachDeviceControls(phone, {
      getScale: stage.getScale,
      presets: DECK_PRESETS,
      // Deck frames float over the slide (absolutely centred), so all four
      // corners resize symmetrically about the middle.
      corners: ['nw', 'ne', 'sw', 'se'],
      anchor: 'center',
      // Embedded in the deck: offer a jump to the standalone play page.
      externalUrl: (el) => {
        const bundle = el.querySelector('vl-demo')?.getAttribute('bundle');
        return bundle ? `${import.meta.env.BASE_URL}play.html?bundle=${bundle}` : null;
      },
    }));
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

function setVerbLang(_lang) {
  // Cover title stays English in both languages; only the tagline is bilingual.
  verbs = EN_VERBS;
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
  '.chip', '.pstack__item', '.cover__tagline',
  '.combine__name', '.result-label', '.tl-item__week', '.node__label',
  '.arrow', '.cta__link', '.agent', '.mega', '.label',
  '.flane__label', '.ifrlane__label', '.fcenter', '.lgtag',
  '.demo__caption', '.videopair figcaption',
  '.tile', '.wlab', '.wattr', '.wg b',
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
  toggleOverview: () => {
    const on = deck.classList.toggle('overview');
    if (on) requestAnimationFrame(fitOverview);
    return on;
  },
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
