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

## Files

- `index.html` — every slide as a `<section>` (no framework)
- `src/main.js` — slide navigation, `<vl-demo>` lazy loader
- `src/styles.css` — design tokens + slide chrome
- `src/meteors.js` — canvas meteors background, same recipe as the site
- `public/examples` — symlink to the website's prebuilt example bundles
