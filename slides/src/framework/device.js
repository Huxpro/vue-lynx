// =============================================================================
// Device frame controls — a preset switcher (phone / vertical tablet / desktop)
// plus a free drag-to-resize grip, attached to any `.phone`-styled element.
// Shared by the deck's demo mockups (scaled stage) and the fullscreen play page
// so both behave identically. Presets are injected so each context can size for
// its own coordinate space (cqw on the scaled stage, vh/vw on the play page).
// =============================================================================
import { ICONS } from './icons.js';

// Canonical presets for the deck's scaled 1280×720 stage (authored in cqw/cqh).
// Phone is sized ~125% of the prior handset footprint so demos read larger on
// stage; tablet keeps the previous height so the two shapes stay distinct.
// The desktop preset is deliberately wider than its column — the frame floats
// over the copy (see .demo__stage).
export const DECK_PRESETS = {
  phone:   { ar: '9 / 19.5',  w: 'auto',              h: 'min(115cqh, 812px)' },
  tablet:  { ar: '3 / 4',     w: 'auto',              h: 'min(92cqh, 650px)' },
  desktop: { ar: '16 / 10',   w: 'min(52cqw, 620px)', h: 'auto' },
};

const DEVICE_ICON = { phone: 'smartphone', tablet: 'tablet', desktop: 'monitor' };

/**
 * When a device frame would spill past the stage / play viewport, shift it so
 * growth runs toward the empty side of the screen instead of scaling from the
 * center (which pushes equal overflow off both edges).
 *
 * Offsets are written to `--phone-ox` / `--phone-oy` and consumed by the
 * centering `transform` on `.demo__stage .phone` / `.phone--play`.
 */
export function containDeviceFrame(el, getScale = () => 1) {
  if (!el || el.classList.contains('is-fullscreen')) {
    el?.style.setProperty('--phone-ox', '0px');
    el?.style.setProperty('--phone-oy', '0px');
    return;
  }
  // Embed frames carry inline transforms for magic-move; leave them alone.
  if (el.classList.contains('phone--embed')) {
    el.style.setProperty('--phone-ox', '0px');
    el.style.setProperty('--phone-oy', '0px');
    return;
  }
  // Inactive slides aren't visible — skip (keeps offsets neutral until arrival).
  const slide = el.closest('.slide');
  if (slide && !slide.classList.contains('is-active')) {
    el.style.setProperty('--phone-ox', '0px');
    el.style.setProperty('--phone-oy', '0px');
    return;
  }

  // Measure the natural (uncompensated) position first.
  el.style.setProperty('--phone-ox', '0px');
  el.style.setProperty('--phone-oy', '0px');

  const boundsEl =
    el.closest('.frame') ||
    el.closest('.play') ||
    document.documentElement;
  const bounds = boundsEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const s = getScale() || 1;

  // Slides animate translateY(±20px) on enter/exit. getBoundingClientRect
  // includes that interpolated offset, which would bias vertical containment
  // for the whole transition. Strip the slide's own translate so we measure
  // against the stage as if the slide were at rest.
  let slideTX = 0;
  let slideTY = 0;
  if (slide) {
    const tf = getComputedStyle(slide).transform;
    if (tf && tf !== 'none') {
      const m = new DOMMatrix(tf);
      slideTX = m.m41;
      slideTY = m.m42;
    }
  }
  const left = rect.left - slideTX;
  const right = rect.right - slideTX;
  const top = rect.top - slideTY;
  const bottom = rect.bottom - slideTY;

  // Positive ⇒ that edge is past the clip bounds.
  const overL = bounds.left - left;
  const overR = right - bounds.right;
  const overT = bounds.top - top;
  const overB = bottom - bounds.bottom;

  let ox = 0;
  let oy = 0;

  // Threshold for "clearly nearer one edge" vs "essentially centered". A few
  // px of layout noise (slide padding, stage alignment) shouldn't flip a
  // taller-than-stage phone into edge-pinning — that throws more of it off
  // screen. Only pin when the home position is meaningfully off-center
  // (e.g. a right-column demo), so overflow runs into the empty interior.
  const BIAS = 24;

  if (overL > 0 && overR > 0) {
    const bias = (left + right) / 2 - (bounds.left + bounds.right) / 2;
    if (Math.abs(bias) >= BIAS) ox = (bias > 0 ? -overR : overL) / s;
    else ox = (overL - overR) / (2 * s); // equalize
  } else if (overL > 0) {
    ox = overL / s;
  } else if (overR > 0) {
    ox = -overR / s;
  }

  if (overT > 0 && overB > 0) {
    const bias = (top + bottom) / 2 - (bounds.top + bounds.bottom) / 2;
    if (Math.abs(bias) >= BIAS) oy = (bias > 0 ? -overB : overT) / s;
    else oy = (overT - overB) / (2 * s); // equalize
  } else if (overT > 0) {
    oy = overT / s;
  } else if (overB > 0) {
    oy = -overB / s;
  }

  el.style.setProperty('--phone-ox', `${ox}px`);
  el.style.setProperty('--phone-oy', `${oy}px`);
}

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
 * Apply authoring seeds from `data-ar` / `data-w` / `data-h` after a preset.
 *
 * Phone presets size by height. A landscape `data-ar` (e.g. `480 / 400`) kept
 * on that tall height explodes the width — and `.demo__stage .phone` lifts
 * `max-width` so the frame can float over copy. For wide/square custom
 * aspects, switch to width-constrained sizing instead.
 */
export function applyPhoneSeeds(el) {
  const raw = el.dataset.ar;
  if (raw) {
    el.style.setProperty('--phone-ar', raw);
    const [aw, ah] = raw.split('/').map((s) => parseFloat(String(s).trim()));
    if (aw > 0 && ah > 0 && aw / ah >= 1) {
      el.style.setProperty('--phone-w', el.dataset.w || 'min(40cqw, 480px)');
      el.style.setProperty('--phone-h', el.dataset.h || 'auto');
      return;
    }
  }
  if (el.dataset.w) el.style.setProperty('--phone-w', el.dataset.w);
  if (el.dataset.h) el.style.setProperty('--phone-h', el.dataset.h);
}

// Corner geometry for the drag grips. sx/sy are the growth signs: dragging a
// corner in its outward direction enlarges the frame. `center` anchoring grows
// symmetrically about the middle (so the grabbed corner tracks the cursor at 2×
// the half-delta); `corner` anchoring keeps the top-left pinned (the play page).
const CORNERS = {
  se: { sx: 1, sy: 1, cursor: 'nwse-resize' },
  sw: { sx: -1, sy: 1, cursor: 'nesw-resize' },
  ne: { sx: 1, sy: -1, cursor: 'nesw-resize' },
  nw: { sx: -1, sy: -1, cursor: 'nwse-resize' },
};

/**
 * Wire preset buttons + drag grips onto `el`.
 * @param {HTMLElement} el  a `.phone`-styled frame
 * @param {object} [opts]
 * @param {() => number} [opts.getScale]  stage scale for pointer deltas (default 1)
 * @param {object} [opts.presets]         preset map (default DECK_PRESETS)
 * @param {string[]} [opts.devices]       which presets to show
 * @param {string} [opts.initial]         starting preset
 * @param {[number, number]} [opts.clamp] min/max px for free drag
 * @param {string[]} [opts.corners]       resize grips to render (default ['se'])
 * @param {'corner'|'center'} [opts.anchor]  how a free drag grows the frame
 * @param {(el: HTMLElement) => (string|null)} [opts.externalUrl]  if it returns a
 *        URL, an "open externally" button is added to the switcher.
 */
export function attachDeviceControls(el, {
  getScale = () => 1,
  presets = DECK_PRESETS,
  devices = ['phone', 'tablet', 'desktop'],
  initial,
  clamp = [140, 1100],
  corners = ['se'],
  anchor = 'corner',
  externalUrl = null,
} = {}) {
  if (el.querySelector('.phone__resize')) return; // already wired

  // Coalesce containment to one measure per frame — ResizeObserver + preset
  // apply + drag can otherwise thrash style ↔ layout in a tight loop.
  let containRaf = 0;
  const contain = () => {
    if (containRaf) cancelAnimationFrame(containRaf);
    containRaf = requestAnimationFrame(() => {
      containRaf = 0;
      containDeviceFrame(el, getScale);
    });
  };
  const containNow = () => {
    if (containRaf) { cancelAnimationFrame(containRaf); containRaf = 0; }
    containDeviceFrame(el, getScale);
  };
  const apply = (name) => {
    applyDevicePreset(el, name, presets);
    // Layout must flush before we can measure overflow.
    containNow();
  };

  // Preset switcher.
  const bar = document.createElement('div');
  bar.className = 'phone__presets';
  bar.setAttribute('aria-label', 'Device size');
  bar.innerHTML = devices.map((d) =>
    `<button type="button" class="phone__preset" data-device="${d}" ` +
    `title="${d}">${ICONS[DEVICE_ICON[d]] || d}</button>`).join('');

  // Open-externally button — only meaningful for an embedded frame (the deck),
  // where it launches the standalone play page for this demo. Sits after a
  // divider so it reads as a separate action from the size presets.
  const extUrl = externalUrl?.(el) || null;
  if (extUrl) {
    bar.insertAdjacentHTML('beforeend',
      `<span class="phone__presets-div" aria-hidden="true"></span>` +
      `<button type="button" class="phone__preset phone__preset--ext" data-ext ` +
      `title="Open in a new tab">${ICONS.external}</button>`);
  }

  el.appendChild(bar);
  bar.addEventListener('pointerdown', (e) => e.stopPropagation());
  bar.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.closest('[data-ext]')) {
      window.open(extUrl, '_blank', 'noopener');
      return;
    }
    const btn = e.target.closest('.phone__preset');
    if (btn) apply(btn.dataset.device);
  });

  const clampVal = (v) => Math.max(clamp[0], Math.min(clamp[1], v));
  const gain = anchor === 'center' ? 2 : 1;
  let startX = 0, startY = 0, startW = 0, startH = 0, dragging = false, sign = CORNERS.se;

  // Free drag-to-resize grips — one minimal corner grip per requested corner.
  corners.forEach((corner) => {
    const geo = CORNERS[corner];
    if (!geo) return;
    const handle = document.createElement('div');
    handle.className = 'phone__resize';
    handle.dataset.corner = corner;
    handle.setAttribute('aria-hidden', 'true');
    handle.title = 'Drag to resize · double-click to reset';
    handle.innerHTML = ICONS.resize;
    el.appendChild(handle);

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      sign = geo;
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
      el.style.width = `${clampVal(startW + gain * sign.sx * dx)}px`;
      el.style.height = `${clampVal(startH + gain * sign.sy * dy)}px`;
      // Re-contain on every move so growth runs into empty space once an edge
      // hits the stage — not continue scaling off-screen from the center.
      containNow();
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      containNow();
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    handle.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      apply(el.dataset.device || 'phone');
      // Restore authoring seeds after a preset snap (same as initial mount).
      applyPhoneSeeds(el);
      containNow();
    });
  });

  // Preset first, then authoring seeds (`data-ar` / `data-w` / `data-h`). Seeds
  // are initial-only — later preset clicks and free-drags replace them.
  applyDevicePreset(el, initial || el.dataset.device || 'phone', presets);
  applyPhoneSeeds(el);
  containNow();

  // Keep containment honest across viewport resizes, phone size changes, and
  // slide navigations (inactive slides are skipped — see containDeviceFrame).
  window.addEventListener('resize', contain);
  document.addEventListener('deck:change', contain);
  if (typeof ResizeObserver !== 'undefined') {
    // Observe only the phone itself. Observing the shared `.frame` made every
    // device on every slide re-contain on one resize, including inactive
    // slides whose enter/exit translateY poisoned the vertical offset.
    const ro = new ResizeObserver(() => contain());
    ro.observe(el);
  }
}
