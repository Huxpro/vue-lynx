// =============================================================================
// Slide flags — standardized per-slide config read from data-* attributes on
// each <section class="slide">. This is the shared vocabulary the DevTool
// inspects and the Command Palette can override. Kept framework-agnostic
// (pure parsing) so it can converge with hux.pro's route-config later.
// =============================================================================

// Chrome is a set of named pieces; keywords expand to piece sets.
export const CHROME_PIECES = ['brand', 'controls', 'counter', 'link', 'progress'];
const CHROME_KEYWORDS = {
  full: ['brand', 'controls', 'counter', 'link', 'progress'],
  none: [],
  minimal: ['counter', 'progress'],
  // edge aliases (上下左右)
  top: ['brand', 'controls'],
  bottom: ['counter', 'link', 'progress'],
  left: ['brand', 'counter'],
  right: ['controls', 'link'],
};

// Declarative description of every flag — powers the DevTool UI + validation.
export const FLAG_SPEC = {
  bg: {
    label: 'Background',
    values: ['clean', 'beam'],
    default: 'clean',
    desc: 'clean = flat stage · beam = meteor field',
  },
  transition: {
    label: 'Enter',
    values: ['magic', 'fade', 'cut'],
    default: 'magic',
    desc: 'how this slide enters from the previous one',
  },
  chrome: {
    label: 'Chrome',
    values: ['minimal', 'full', 'none'],
    default: 'minimal',
    desc: 'corner chrome + progress bar visibility',
  },
};

export const FLAG_DEFAULTS = Object.fromEntries(
  Object.entries(FLAG_SPEC).map(([k, v]) => [k, v.default]),
);

/** Expand a `data-chrome` string into a Set of visible piece names. */
export function expandChrome(value) {
  const tokens = String(value || 'full').trim().split(/\s+/);
  const out = new Set();
  for (const tok of tokens) {
    if (CHROME_KEYWORDS[tok]) CHROME_KEYWORDS[tok].forEach((p) => out.add(p));
    else if (CHROME_PIECES.includes(tok)) out.add(tok);
  }
  return out;
}

/** Read the resolved flags for a slide (data-* with defaults applied). */
export function readFlags(slide) {
  if (!slide) return { ...FLAG_DEFAULTS };
  return {
    bg: slide.dataset.bg || FLAG_DEFAULTS.bg,
    transition: slide.dataset.transition || FLAG_DEFAULTS.transition,
    chrome: slide.dataset.chrome || FLAG_DEFAULTS.chrome,
  };
}
