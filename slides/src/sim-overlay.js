// =============================================================================
// Local iOS Simulator overlay — optional localhost presenter tool.
//
// Streams Evan Bacon's serve-sim preview (Vite mounts /.sim in `pnpm dev`) as a
// floating, draggable frame above any slide. Cloud / non-localhost hosts never
// see the command or the overlay — examples and the deck stay cloud-safe.
// Toggle from the command palette (⌘K / `/` → `m`).
// =============================================================================

import { icon } from './framework/icons.js';

const STORAGE_KEY = 'deck-sim-float';
const DEFAULT = { x: null, y: null, w: 320, h: 640 };

/** True only on loopback — cloud previews and LAN shares stay clean. */
export function isLocalHost(hostname = location.hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'
  );
}

function loadGeom() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

function saveGeom(g) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(g));
  } catch { /* ignore */ }
}

/**
 * @returns {{ available: () => boolean, isOpen: () => boolean, toggle: () => void, open: () => void, close: () => void } | null}
 */
export function initSimOverlay({ embed = false } = {}) {
  if (embed || !isLocalHost()) return null;

  let root = null;
  let geom = loadGeom();

  function applyGeom() {
    if (!root) return;
    const maxW = Math.min(window.innerWidth - 24, 560);
    const maxH = Math.min(window.innerHeight - 24, 900);
    const w = Math.max(200, Math.min(geom.w, maxW));
    const h = Math.max(320, Math.min(geom.h, maxH));
    let x = geom.x;
    let y = geom.y;
    if (x == null || y == null) {
      x = Math.max(12, window.innerWidth - w - 28);
      y = Math.max(12, Math.round((window.innerHeight - h) / 2));
    }
    x = Math.max(0, Math.min(x, window.innerWidth - 48));
    y = Math.max(0, Math.min(y, window.innerHeight - 48));
    geom = { x, y, w, h };
    root.style.width = `${w}px`;
    root.style.height = `${h}px`;
    root.style.left = `${x}px`;
    root.style.top = `${y}px`;
  }

  function mount() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'sim-float no-deck-scroll';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Local iOS Simulator');
    root.innerHTML =
      `<div class="sim-float__chrome" data-drag>` +
        `<span class="sim-float__title">${icon('smartphone')}<span>Simulator</span></span>` +
        `<div class="sim-float__actions">` +
          `<a class="sim-float__btn" data-ext href="/.sim" target="_blank" rel="noreferrer" ` +
            `title="Open /.sim in a new tab">${icon('external')}</a>` +
          `<button type="button" class="sim-float__btn" data-close title="Close">${icon('x')}</button>` +
        `</div>` +
      `</div>` +
      `<div class="sim-float__body">` +
        `<iframe class="sim-float__frame" src="/.sim" title="serve-sim preview" ` +
          `allow="autoplay; fullscreen"></iframe>` +
        `<div class="sim-float__hint">` +
          `<span>Need a booted sim?</span>` +
          `<code>npx serve-sim --detach</code>` +
        `</div>` +
      `</div>` +
      `<div class="sim-float__resize" data-resize title="Drag to resize"></div>`;

    document.body.appendChild(root);
    applyGeom();
    wireChrome(root);

    // Soft hint for "run serve-sim --detach" — hide once the preview loads so
    // it doesn't sit on top of a live stream.
    const frame = root.querySelector('.sim-float__frame');
    const hint = root.querySelector('.sim-float__hint');
    frame?.addEventListener('load', () => hint?.classList.add('is-hidden'));
    frame?.addEventListener('error', () => hint?.classList.remove('is-hidden'));
  }

  function wireChrome(el) {
    el.querySelector('[data-close]')?.addEventListener('click', close);

    // Drag by the chrome bar (viewport pixels — overlay lives outside .frame).
    const bar = el.querySelector('[data-drag]');
    bar?.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('a, button')) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = geom.x ?? el.offsetLeft;
      const origY = geom.y ?? el.offsetTop;
      bar.setPointerCapture?.(e.pointerId);
      const onMove = (ev) => {
        geom.x = origX + (ev.clientX - startX);
        geom.y = origY + (ev.clientY - startY);
        applyGeom();
      };
      const onUp = () => {
        bar.releasePointerCapture?.(e.pointerId);
        bar.removeEventListener('pointermove', onMove);
        bar.removeEventListener('pointerup', onUp);
        saveGeom(geom);
      };
      bar.addEventListener('pointermove', onMove);
      bar.addEventListener('pointerup', onUp);
    });

    // SE resize grip.
    const grip = el.querySelector('[data-resize]');
    grip?.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const origW = geom.w;
      const origH = geom.h;
      grip.setPointerCapture?.(e.pointerId);
      const onMove = (ev) => {
        geom.w = origW + (ev.clientX - startX);
        geom.h = origH + (ev.clientY - startY);
        applyGeom();
      };
      const onUp = () => {
        grip.releasePointerCapture?.(e.pointerId);
        grip.removeEventListener('pointermove', onMove);
        grip.removeEventListener('pointerup', onUp);
        saveGeom(geom);
      };
      grip.addEventListener('pointermove', onMove);
      grip.addEventListener('pointerup', onUp);
    });

    window.addEventListener('resize', applyGeom);
  }

  function open() {
    mount();
  }

  function close() {
    if (!root) return;
    saveGeom(geom);
    root.remove();
    root = null;
  }

  function toggle() {
    if (root) close();
    else open();
  }

  return {
    available: () => true,
    isOpen: () => !!root,
    toggle,
    open,
    close,
  };
}
