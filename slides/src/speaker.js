import './speaker.css';
import { SPEAKER_LABELS } from './i18n.js';

const CHANNEL_NAME = 'vue-lynx-deck';
const channel = new BroadcastChannel(CHANNEL_NAME);
const deckBase = import.meta.env.BASE_URL || '/';

// =========================================================
// Language — mirrors the main deck (default 中文). The main
// deck owns the toggle; `l` here requests it over the channel.
// =========================================================
let lang = (() => {
  const p = new URLSearchParams(location.search).get('lang');
  if (p === 'zh' || p === 'en') return p;
  try {
    const saved = localStorage.getItem('deck-lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch { /* ignore */ }
  return 'zh';
})();
let L = SPEAKER_LABELS[lang];

function applySpeakerLang(next) {
  lang = next === 'en' ? 'en' : 'zh';
  L = SPEAKER_LABELS[lang];
  document.documentElement.setAttribute('data-lang', lang);
  const set = (sel, text) => { const el = document.querySelector(sel); if (el) el.textContent = text; };
  set('.sv-id span:last-child', L.view);
  set('.sv-stage--current .sv-stage__label', L.now);
  set('.sv-stage--next .sv-stage__label', L.next);
  set('.sv-notes__label', L.notes);
  set('[data-nav="prev"]', L.prev);
  set('[data-nav="next"]', L.nextBtn);
  const tbtn = document.querySelector('[data-timer="toggle"]');
  if (tbtn) tbtn.textContent = pausedAt ? L.resume : L.pause;
  set('[data-timer="reset"]', L.reset);
  const bbtn = document.querySelector('[data-blackout]');
  if (bbtn) bbtn.textContent = blackedOut ? L.restore : L.blackout;
  const hints = document.querySelector('.sv-hints');
  if (hints) hints.innerHTML = L.hints;
  render();
}

// =========================================================
// DOM refs
// =========================================================
const frameNow = document.querySelector('iframe[data-frame="now"]');
const frameNext = document.querySelector('iframe[data-frame="next"]');
const titleNow = document.querySelector('[data-now-title]');
const titleNext = document.querySelector('[data-next-title]');
const notesEl = document.querySelector('[data-notes]');
const slideNowEl = document.querySelector('[data-slide-now]');
const slideTotalEl = document.querySelector('[data-slide-total]');
const elapsedEl = document.querySelector('[data-elapsed]');
const clockEl = document.querySelector('[data-clock]');

// =========================================================
// State
// =========================================================
let current = 0;
let total = 17; // updated as soon as deck reports
let slideMeta = []; // [{index, title, notes}]
let blackedOut = false;

// =========================================================
// Frame URL builder
// =========================================================
function frameSrcFor(index) {
  return `${deckBase}?embed=1#${index + 1}`;
}

/**
 * Drive an iframe to a target slide.
 *
 * - First load: assign src (cold boot the iframe).
 * - Subsequent: post a `go` message directly to its contentWindow.
 *   We deliberately do NOT reassign src for hash-only changes — that does
 *   not reliably reload the iframe across browsers, and the iframe's
 *   main.js only reads the hash once on boot.
 *
 * Direct postMessage gives us per-iframe targeting; using BroadcastChannel
 * here would navigate both Now and Next at once.
 */
function setFrameTo(frame, index) {
  if (!frame) return;
  if (index < 0 || index >= total) {
    if (frame.src !== 'about:blank') frame.src = 'about:blank';
    frame.dataset.slide = '';
    return;
  }
  const isFirstLoad = !frame.src || frame.src === 'about:blank' || !frame.dataset.slide;
  if (isFirstLoad) {
    frame.src = frameSrcFor(index);
    frame.dataset.slide = String(index);
    return;
  }
  const currentIdx = Number(frame.dataset.slide);
  if (currentIdx === index) return; // already there
  frame.dataset.slide = String(index);
  const sendGo = () => {
    try {
      frame.contentWindow?.postMessage({ type: 'go', index }, location.origin);
    } catch {
      // Hard fallback — cold reload the iframe.
      frame.src = frameSrcFor(index);
    }
  };
  // If the iframe doc isn't reachable yet, wait for load.
  if (frame.contentWindow && frame.contentDocument?.readyState === 'complete') {
    sendGo();
  } else {
    frame.addEventListener('load', sendGo, { once: true });
  }
}

// =========================================================
// Render
// =========================================================
function render() {
  if (slideNowEl) slideNowEl.textContent = String(current + 1).padStart(2, '0');
  if (slideTotalEl) slideTotalEl.textContent = String(total).padStart(2, '0');

  setFrameTo(frameNow, current);
  setFrameTo(frameNext, current + 1);

  const meta = slideMeta[current] || {};
  if (titleNow) titleNow.textContent = meta.title || '';
  const nextMeta = slideMeta[current + 1] || {};
  if (titleNext) {
    titleNext.textContent = current + 1 >= total ? L.end : (nextMeta.title || '');
  }

  if (notesEl) {
    if (meta.notes?.trim()) {
      notesEl.innerHTML = meta.notes;
    } else {
      notesEl.innerHTML = `<p class="sv-notes__empty">${L.empty}</p>`;
    }
  }
}

// =========================================================
// Channel — listen for state from the main deck
// =========================================================
channel.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'state') {
    current = msg.index;
    total = msg.total;
    if (Array.isArray(msg.slides)) slideMeta = msg.slides;
    document.documentElement.classList.toggle('light', msg.theme === 'light');
    blackedOut = !!msg.blackout;
    document.body.classList.toggle('sv-blackout-on', blackedOut);
    const blackoutButton = document.querySelector('[data-blackout]');
    if (blackoutButton) {
      blackoutButton.textContent = blackedOut ? L.restore : L.blackout;
    }
    render();
  } else if (msg.type === 'lang' && msg.lang !== lang) {
    applySpeakerLang(msg.lang);
  } else if (msg.type === 'theme-toggle-mirror') {
    document.documentElement.classList.toggle('light');
  } else if (msg.type === 'blackout') {
    // Keep the speaker's blackout state + button label in sync when the
    // audience screen toggles it (e.g. tap-to-restore on a phone).
    blackedOut = !!msg.on;
    document.body.classList.toggle('sv-blackout-on', blackedOut);
    const btn = document.querySelector('[data-blackout]');
    if (btn) btn.textContent = blackedOut ? L.restore : L.blackout;
  }
});

// Ask the main deck to broadcast its current state so we sync on open.
channel.postMessage({ type: 'request-state' });

// =========================================================
// Navigation buttons → send commands to deck
// =========================================================
document.querySelectorAll('[data-nav]').forEach((btn) => {
  btn.addEventListener('click', () => {
    channel.postMessage({ type: 'nav', dir: btn.dataset.nav });
  });
});

// Keyboard — same as main deck
document.addEventListener('keydown', (e) => {
  if (e.target.matches?.('input, textarea, [contenteditable]')) return;
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
      e.preventDefault();
      channel.postMessage({ type: 'nav', dir: 'next' });
      break;
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
      e.preventDefault();
      channel.postMessage({ type: 'nav', dir: 'prev' });
      break;
    case 'Home':
      e.preventDefault();
      channel.postMessage({ type: 'nav', dir: 'first' });
      break;
    case 'End':
      e.preventDefault();
      channel.postMessage({ type: 'nav', dir: 'last' });
      break;
    case 'f': case 'F':
      toggleFullscreen();
      break;
    case '.':
      document.documentElement.classList.toggle('light');
      channel.postMessage({ type: 'theme-toggle' });
      break;
    case 'r': case 'R':
      resetTimer();
      break;
    case 'l': case 'L':
      channel.postMessage({ type: 'lang-toggle' });
      break;
    case 'b': case 'B':
      toggleBlackout();
      break;
    default:
      if (/^[1-9]$/.test(e.key)) {
        channel.postMessage({ type: 'nav', dir: 'goto', index: Number(e.key) - 1 });
      }
  }
});

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

// =========================================================
// Timer
// =========================================================
let startedAt = Date.now();
let pausedAccum = 0;
let pausedAt = null;

function tickTimer() {
  // Elapsed (paused-aware)
  const baseline = pausedAt ?? Date.now();
  const elapsedMs = (baseline - startedAt) - pausedAccum;
  const s = Math.max(0, Math.floor(elapsedMs / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const fmt = hh
    ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  if (elapsedEl) {
    elapsedEl.textContent = fmt;
    elapsedEl.dataset.paused = pausedAt ? 'true' : 'false';
  }

  // Wall clock
  if (clockEl) {
    const now = new Date();
    clockEl.textContent =
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');
  }
}

function startTimerLoop() {
  tickTimer();
  setInterval(tickTimer, 1000);
}

function resetTimer() {
  startedAt = Date.now();
  pausedAccum = 0;
  pausedAt = null;
  tickTimer();
  const btn = document.querySelector('[data-timer="toggle"]');
  if (btn) btn.textContent = L.pause;
}

function toggleTimer() {
  const btn = document.querySelector('[data-timer="toggle"]');
  if (pausedAt) {
    // resume
    pausedAccum += Date.now() - pausedAt;
    pausedAt = null;
    if (btn) btn.textContent = L.pause;
  } else {
    pausedAt = Date.now();
    if (btn) btn.textContent = L.resume;
  }
  tickTimer();
}

document.querySelector('[data-timer="toggle"]')?.addEventListener('click', toggleTimer);
document.querySelector('[data-timer="reset"]')?.addEventListener('click', resetTimer);
startTimerLoop();

// =========================================================
// Blackout — broadcast to main deck
// =========================================================
function toggleBlackout() {
  blackedOut = !blackedOut;
  channel.postMessage({ type: 'blackout', on: blackedOut });
  document.body.classList.toggle('sv-blackout-on', blackedOut);
  const btn = document.querySelector('[data-blackout]');
  if (btn) btn.textContent = blackedOut ? L.restore : L.blackout;
}
document.querySelector('[data-blackout]')?.addEventListener('click', toggleBlackout);

// =========================================================
// Close cleanly
// =========================================================
window.addEventListener('beforeunload', () => {
  channel.postMessage({ type: 'speaker-closed' });
  channel.close();
});

// First paint — apply the initial language labels, then render.
applySpeakerLang(lang);
