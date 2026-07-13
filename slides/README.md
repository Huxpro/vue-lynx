# Vue Lynx — Talk Deck

HTML slide deck for the Vue Lynx talk. Live `<lynx-view>` embeds render
real Vue Lynx apps inline; design language mirrors `vue.lynxjs.org`.

## Run

```bash
cd slides
pnpm install
pnpm dev
# open http://localhost:4321
```

Vite serves example bundles via a symlink to `../website/docs/public/examples`.
Run `cd ../website && pnpm prepare:docs` once if those bundles are missing.

## Navigation

| Key                       | Action                  |
| ------------------------- | ----------------------- |
| `→` `↓` `Space` `PageDown`| Next slide              |
| `←` `↑` `PageUp`          | Previous slide          |
| `Home`                    | First slide             |
| `End`                     | Last slide              |
| `f`                       | Toggle fullscreen       |
| `o`                       | Toggle overview grid    |
| `1`..`9`                  | Jump to slide N         |
| `.`                       | Toggle light mode       |
| `l`                       | Toggle 中文 / English   |
| `⌘K` / `Ctrl-K`           | Command palette         |
| `/`                       | Palette (slash mode)    |
| `d`                       | DevTool panel           |
| **`s`**                   | **Open speaker view**   |
| `b`                       | Blackout audience screen|

URL hash reflects the current slide (e.g. `#7`), so you can deep-link.

## Theme

The deck ships **dark by default** (near-black Keynote-style stage) with the
Vue Lynx green/teal accents intact. Press `.` to flip to the light theme
(adds `.light` on `:root`).

## Layout — fixed 16:9 stage

Slides are authored against a fixed **1280×720** canvas (`.frame`, a CSS size
container). `main.js` scales that frame to fit the viewport (`fitStage`), so the
deck keeps a true 16:9 aspect on any screen — on a portrait phone it letterboxes
and the whole slide scales down as one piece instead of reflowing. The corner
`.chrome` and the meteors background live outside the frame and stay full-bleed.

Because the frame is a size container, size everything **in `cqw` / `cqh`**
(1cqw = 12.8px, 1cqh = 7.2px), not `vw` / `vh` — those resolve to the design
canvas, not the raw viewport.

## Systems — palette, devtool, slide flags

Ported in spirit from [hux.pro](https://hux.pro)'s `systems/` (vanilla JS, in
this deck's design language) so the two can converge on one slide framework and
this deck can be embedded into hux.pro later. Lives in `src/systems/`.

**Command Palette** (`⌘K` / `Ctrl-K`, or `/` for slash mode). Search + run:
navigation (next/prev/first/last), presenter (speaker view, overview, blackout,
fullscreen), and settings (theme, language, background, devtool). In slash mode
a single key runs an action (the hint shown on the right).

**DevTool** (`d`). A foldable inspector (top-right) showing the deck's global
config (theme, language, slide, stage scale, reduced-motion) and the current
slide's flags + metadata (title, notes, `data-flip` ids). The flag chips are
clickable — click to cycle and live-override that slide's flag; "reset
overrides" clears them.

**Slide flags** — standardized `data-*` on each `<section class="slide">`
(vocabulary in `systems/flags.js`, applied in `main.js`):

| Flag              | Values                    | Default | Effect |
| ----------------- | ------------------------- | ------- | ------ |
| `data-bg`         | `beam` · `clean`          | `beam`  | meteor field vs flat stage |
| `data-transition` | `magic` · `fade` · `cut`  | `magic` | how the slide enters (magic move / fade / hard cut) |
| `data-chrome`     | `full` · `minimal` · `none` (or a piece list: `brand controls counter link progress`, or edge aliases `top bottom left right`) | `full` | which corner chrome + progress bar show |

Example: `<section class="slide thankyou" data-bg="clean" data-chrome="minimal">`.

## Magic move (Keynote-style)

Adjacent slides morph shared elements into place, FLIP-style. Give the same
`data-flip="some-id"` to an element on two consecutive slides and it animates
between its two positions/sizes when you advance. Tag transient supporting
content with `data-mm-fade` so it washes in behind the morph. The stack on the
Pillars slides and the two-thread build on the Architecture slides are the
worked examples. One `<section class="slide">` = one step (no in-slide
fragments), which keeps speaker-view sync and deep-links simple.

## Deploy

`pnpm --filter vue-lynx run` build (the website build) runs
`website/scripts/prepare-deck.mjs`, which builds this deck with `base=/deck/`
and copies it into `website/docs/public/deck/`. On Vercel the deck is then
served at `<preview-url>/deck` alongside the docs — the live embeds resolve
their bundles from `/examples` at the site root. Nothing about the standalone
`pnpm dev` / `pnpm build` flow changes (those stay at `base=/`).

## Speaker view (`s`)

Press `s` on the main deck and a popup window opens at `/speaker.html`. It
shows:

- The **current slide** rendered live (left)
- The **next slide** preview (right top)
- **Speaker notes** for the current slide (right bottom)
- An **elapsed talk timer** (auto-starts, with `Pause` / `Reset`)
- **Wall-clock time** beside it

The two windows sync via `BroadcastChannel('vue-lynx-deck')` — navigate in
either window, both move. Arrow keys + `b` (blackout) + `.` (dark mode)
work from the speaker view too.

### Recommended setup

1. Drag the main deck window onto the external display, press `f` to
   fullscreen it.
2. Press `s` — the speaker popup opens on the laptop screen.
3. Drag it to your preferred position (it auto-sizes to ~85% of screen).
4. Drive the talk from either side; the audience only ever sees the deck.

### URL flags

- `/?embed=1#3` — embed mode: strips chrome, jumps to slide 3, forbids
  internal navigation. Used internally by the speaker iframes.

## Writing speaker notes

Add an `<aside class="notes">…</aside>` inside any `<section class="slide">`.
HTML is allowed; the notes are automatically hidden in the audience view and
piped to the speaker view through the BroadcastChannel.

## Embedded demos

`<vl-demo bundle="todomvc/dist/main.web.bundle">` mounts a real Vue Lynx
app via `@lynx-js/web-core/client`. Each embed lazy-loads the runtime on
first reveal so the opening slides stay snappy.

## Code layout — framework vs content

There's a deliberate boundary between the **reusable slide engine** and this
deck's **content**:

- **`src/framework/`** — the content-agnostic engine (stage fit, magic move,
  slide flags, command palette, devtool). See `src/framework/README.md`. Driven
  entirely through the `deckApi` controller + a `deck:change` event, so it can
  converge with hux.pro and be embedded there later.
- **`src/` (everything else)** — the deck itself: the slides, design language,
  translations, the landscape diagram, and `main.js` (the app entry that builds
  the controller, owns navigation, and wires framework → content).

## Files

- `index.html` — every slide as a `<section class="slide">`
- `src/main.js` — deck app entry: `deckApi` controller, navigation, boot,
  `<vl-demo>` lazy loader, and framework wiring
- `src/framework/` — reusable slide engine (see its README)
- `src/arch.js` — data-driven "layers & seams" diagram for the cross-platform
  landscape chapter (rendered into each `.arch-mount`, one column per slide)
- `src/i18n.js` — Chinese translations. English is the inline source; visible
  text is matched by normalized English `textContent` and swapped in place (so
  magic-move `data-flip` identity is preserved). Speaker notes (`ZH_NOTES`,
  indexed by slide order) and the speaker-view chrome (`SPEAKER_LABELS`) are
  translated too and flow to the speaker window over the channel. The deck
  **defaults to 中文**; toggle with `l` or the chrome button (works from the
  speaker view as well), and `?lang=zh` / `?lang=en` deep-links.
- `src/styles.css` — design tokens + slide chrome
- `src/meteors.js` — canvas meteors background, same recipe as the site
- `public/examples` — symlink to the website's prebuilt example bundles
