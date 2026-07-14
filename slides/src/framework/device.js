// =============================================================================
// Device frame controls — a preset switcher (phone / vertical tablet / desktop)
// plus a free drag-to-resize grip, attached to any `.phone`-styled element.
// Shared by the deck's demo mockups (scaled stage) and the fullscreen play page
// so both behave identically. Presets are injected so each context can size for
// its own coordinate space (cqw on the scaled stage, vh/vw on the play page).
// =============================================================================
import { ICONS } from './icons.js';

// Canonical presets for the deck's scaled 1280×720 stage (authored in cqw/cqh).
export const DECK_PRESETS = {
  phone:   { ar: '270 / 590', w: 'auto',              h: 'min(78cqh, 620px)' },
  tablet:  { ar: '3 / 4',     w: 'auto',              h: 'min(82cqh, 640px)' },
  desktop: { ar: '16 / 10',   w: 'min(36cqw, 460px)', h: 'auto' },
};

const DEVICE_ICON = { phone: 'smartphone', tablet: 'tablet', desktop: 'monitor' };

/** Snap an element to a named preset. `fullscreen` presets fill the viewport. */
export function applyDevicePreset(el, name, presets = DECK_PRESETS) {
  const p = presets[name] || presets.phone || {};
  el.dataset.device = name;
  el.style.width = '';   // clear any free-drag size
  el.style.height = '';
  el.classList.toggle('is-fullscreen', !!p.fullscreen);
  if (p.fullscreen) {
    el.style.removeProperty('--phone-ar');
    el.style.removeProperty('--phone-w');
    el.style.removeProperty('--phone-h');
  } else {
    el.style.setProperty('--phone-ar', p.ar);
    el.style.setProperty('--phone-w', p.w);
    el.style.setProperty('--phone-h', p.h);
  }
  el.querySelectorAll('.phone__preset').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.device === name));
}

/**
 * Wire preset buttons + a drag grip onto `el`.
 * @param {HTMLElement} el  a `.phone`-styled frame
 * @param {object} [opts]
 * @param {() => number} [opts.getScale]  stage scale for pointer deltas (default 1)
 * @param {object} [opts.presets]         preset map (default DECK_PRESETS)
 * @param {string[]} [opts.devices]       which presets to show
 * @param {string} [opts.initial]         starting preset
 * @param {[number, number]} [opts.clamp] min/max px for free drag
 */
export function attachDeviceControls(el, {
  getScale = () => 1,
  presets = DECK_PRESETS,
  devices = ['phone', 'tablet', 'desktop'],
  initial,
  clamp = [140, 1100],
} = {}) {
  if (el.querySelector('.phone__resize')) return; // already wired

  // Preset switcher.
  const bar = document.createElement('div');
  bar.className = 'phone__presets';
  bar.setAttribute('aria-label', 'Device size');
  bar.innerHTML = devices.map((d) =>
    `<button type="button" class="phone__preset" data-device="${d}" ` +
    `title="${d}">${ICONS[DEVICE_ICON[d]] || d}</button>`).join('');
  el.appendChild(bar);
  bar.addEventListener('pointerdown', (e) => e.stopPropagation());
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.phone__preset');
    if (!btn) return;
    e.stopPropagation();
    applyDevicePreset(el, btn.dataset.device, presets);
  });

  // Free drag-to-resize grip.
  const handle = document.createElement('div');
  handle.className = 'phone__resize';
  handle.setAttribute('aria-hidden', 'true');
  handle.title = 'Drag to resize · double-click to reset';
  el.appendChild(handle);

  applyDevicePreset(el, initial || el.dataset.device || 'phone', presets);
  if (el.dataset.ar) el.style.setProperty('--phone-ar', el.dataset.ar);

  let startX = 0, startY = 0, startW = 0, startH = 0, dragging = false;
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    const s = getScale() || 1;
    const r = el.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startW = r.width / s;
    startH = r.height / s;
    el.classList.remove('is-fullscreen'); // a free drag leaves fullscreen
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const s = getScale() || 1;
    const dx = (e.clientX - startX) / s;
    const dy = (e.clientY - startY) / s;
    // Independent axes — no aspect lock. Pin both dimensions inline so the CSS
    // aspect-ratio no longer constrains the frame.
    el.style.width = `${Math.max(clamp[0], Math.min(clamp[1], startW + dx))}px`;
    el.style.height = `${Math.max(clamp[0], Math.min(clamp[1], startH + dy))}px`;
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    try { handle.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  handle.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  handle.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    applyDevicePreset(el, el.dataset.device || 'phone', presets);
  });
}
