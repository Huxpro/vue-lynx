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

// ---- Media-embed slides (global "Media embeds: off" skip list) ----
//
// `data-media` on a <section.slide>:
//   keep | on     — never skip (content slide that happens to include <vl-media>)
//   skip | off | embed — always skippable when the global media-embeds flag is off
//   (absent)      — auto: skip if the slide has <vl-media> and is an overlay, or
//                   has media but no title chrome (meme-style beats)
const MEDIA_TITLE_SEL =
  '.h-cover, .h-section, .demo__title, .divider__title, .cta__title, .mega, .thankyou h1';

/** True when this slide is a media-embed beat that the global off-switch skips. */
export function isMediaEmbedSlide(slide) {
  if (!slide) return false;
  const policy = String(slide.dataset.media || '').toLowerCase();
  if (policy === 'keep' || policy === 'on') return false;
  if (policy === 'skip' || policy === 'off' || policy === 'embed') return true;
  if (!slide.querySelector('vl-media')) return false;
  if (slide.classList.contains('overlay')) return true;
  return !slide.querySelector(MEDIA_TITLE_SEL);
}

/** True when the slide carries media (or an explicit media policy) — overview editor target. */
export function isMediaCandidate(slide) {
  if (!slide) return false;
  const policy = String(slide.dataset.media || '').toLowerCase();
  if (policy === 'keep' || policy === 'on' || policy === 'skip' ||
      policy === 'off' || policy === 'embed') return true;
  return !!slide.querySelector('vl-media');
}
