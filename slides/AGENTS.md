# Slides — Agent Guide

HTML deck, zero runtime deps. One `<section class="slide">` in `index.html` =
one step (no in-slide fragments). Everything is authored against a fixed
1280×720 stage — **size in `cqw`/`cqh`, never `vw`/`vh`**. Depth: `README.md`.

## Vocabulary

| Term | Meaning |
| ---- | ------- |
| **stage slide** | `class="slide stage"` — centered one-idea slide (h-section / mega / chips) |
| **divider** | chapter break: eyebrow + big serif numeral + title + tag |
| **overlay** | `class="slide overlay"` — floats above its **base** (nearest previous non-overlay slide, kept visible via `is-under`); inherits the base's weave scene |
| **magic move** | FLIP morph between **adjacent** slides: same `data-flip="id"` on both sides |
| **`data-mm-fade`** | transient content that washes in behind a morph (first-appearance elements) |
| **weave** | the epilogue's canvas thread field; a slide opts in with `data-weave="<scene>"` (`src/weave.js`) |
| **`<vl-media>`** | universal embed: video / image / iframe with missing-file placeholders (`src/embeds.js`) |
| **embed frame** | `.phone.phone--embed.no-deck-scroll` wrapper → drag-resize + preset chrome |
| **flags** | per-slide `data-bg` (clean/beam) · `data-transition` (magic/fade/cut) · `data-chrome` (minimal/full/none) · `data-media` (keep/skip — overrides the global Media embeds palette toggle) |

## Adding a slide — the invariants

1. Add the `<section>` **and** an `<aside class="notes">` (every slide has one).
2. Add a ZH speaker note in `src/i18n.js` `ZH_NOTES` **at the same position** —
   the array is indexed by document order. Check: `grep -c '<section class="slide'`
   = `grep -c '<aside class="notes">'` = `ZH_NOTES.length`.
3. Visible English text is translated by **normalized `textContent` lookup** in
   the `ZH` map — new/changed on-screen text needs a matching key (exact
   punctuation: `“ ” — · …`). Untranslated text silently stays English.
   Only classes in `main.js` `I18N_SELECTOR` are swapped.
4. Update the `data-counter` total in `index.html`.

## Magic move rules

- Same `data-flip` id on two **consecutive** slides = morph; ids are global, so
  reuse across non-adjacent slides is fine but adjacent reuse must be intended.
- FLIP preserves the element's own positioning scheme and transform (inline
  transforms included) — don't change an element's `position` type between the
  two sides of a pair.
- `pnpm test:morph` drives every adjacent pair and fails on off-path or
  landing-snap regressions. Run it after touching flips or `framework/magic-move.js`.
- Morphing elements are elevated to `z-index: 4` (`.is-flipping`) so they ride
  above slide content. When overlapping elements have a meaningful stacking
  order (a cascade: later on top), give each an explicit inline `z-index`
  (1, 2, 3…) on **every** slide of the sequence — inline wins over the
  elevation, so stacking stays stable mid-morph.

## Overlays

- Overlay slides keep the base rendered beneath — use them for media layers
  that shouldn't interrupt a page's rhythm. Consecutive overlays share one base.
- To "dismiss" back to the base look, follow the overlay run with a **verbatim
  duplicate of the base slide** (this deck's normal idiom) — that also restores
  the morph into the next slide.
- Overlays default to `data-bg="clean" data-chrome="none"` and inherit the
  base's `data-weave` unless they set their own.

## `<vl-media>` embeds

- `src` under `/media/embeds/` (drop-ins listed in `public/media/embeds/README.md`);
  kind inferred from extension, `kind="iframe"` for URLs.
- Videos: muted+loop+autoplay-on-arrival by default; reset (pause+rewind) on
  every slide change. Opt-outs: `data-autoplay="false"`, `unmuted`, `no-loop`,
  `controls`.
- Iframes mount at distance ≤ 1, unload at ≥ 2 — never keep one always-live.
- Missing files show a labeled placeholder (set `--ph-ar` for its aspect).
- Resizable: wrap in `.phone.phone--embed.no-deck-scroll` with
  `data-embed="wide|portrait|browser"`; seed size with `data-w`/`data-h`
  (not inline `--phone-w`, which the preset would clobber).
- **Global skip:** palette `m` / `?nomedia=1` turns Media embeds off — auto-skips
  overlay (and title-less) slides that contain `<vl-media>`, and unmounts media.
  Override per slide with `data-media="keep"` (never skip) or `data-media="skip"`
  (always skippable).
- **Overview editor (`o`):** bar toggles Media embeds (eye); each media tile has
  its own eye to open/hide (`keep` ↔ `skip`). Dimmed tiles = hidden under the
  current global setting; click the tile (not the eye) to jump there.

## Weave scenes

Scene names: `fabric · fabric-dense · loom · loom-dim · compress ·
panorama-left · panorama · finale`. Lane Y-fractions in `weave.js` are
mirrored by `.wlab` label positions in HTML (`0.16` ↔ `top:16cqh`) — change
them together. New scenes: add a builder to `SCENES`; keep geometry
deterministic (seeded `rnd(i, salt)`, never `Math.random`).

## Keyboard & focus (don't fight these)

- Only slide navigation is on bare keys; every command lives in the palette
  (`⌘K` / `/`). Never add global keydown shortcuts.
- Demos only get the keyboard after a **deliberate click inside** them;
  autofocus grabs are blurred (`demoEngaged` in `main.js`). Scroll/swipe
  inside `.phone` / `.no-deck-scroll` / `.sim-float` never advances the deck.
- **Local simulator** (`src/sim-overlay.js`): optional floating serve-sim frame,
  toggled from the palette (`m`). The palette always lists `m`; off localhost
  it renders disabled with a “localhost only” note. Do not wire it into
  individual slides — keep cloud-hosted decks free of simulator coupling.

## Verify

```bash
pnpm build        # must stay green
pnpm test:morph   # after touching data-flip usage or the framework
```

Plus a Playwright keyboard-walk over any slides you added (assert zero
`pageerror`s) — see `README.md` for the deploy/preview URLs.
