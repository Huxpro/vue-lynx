# Vue Lynx — Talk Deck

HTML slide deck for the Vue Lynx talk. Live `<lynx-view>` embeds render
real Vue Lynx apps inline; design language mirrors `vue.lynxjs.org`.

## Narrative

Six chapters, ~75 slides:

1. **The Pitch** — apps upgrading web → native; the three pillars (Speed /
   Experience / Capabilities) with four live demos.
2. **It's really Vue** — the moved-forward intro plus a code gallery proving
   real Vue features on Lynx (reactivity, Options API, slots, `v-model`,
   provide/inject, Pinia, Router, TanStack Query, Suspense, Transition,
   KeepAlive, event modifiers, styling, `v-for` over native `<list>`), backed
   by the 882 / 1013 upstream `vue/core` test count.
3. **From web app to native** — two real ports (the Nuxt AI Chatbot template
   and Elk, the Mastodon client) with a "kept vs rebuilt" fork contrast and the
   key deltas (native streaming, the content pipeline, runtime landmines).
4. **The story** — how it was built (solo, ~2 weeks).
5. **The Lynx platform** — the layers-&-seams landscape, then the architecture
   deep-dive: the **build** pipeline (one source → `pluginVueLynx` →
   `issuerLayer` split → one `.lynx.bundle`) and the **runtime** pipeline
   (`nodeOps` → `ShadowElement` tree → ops buffer → `callLepusMethod` →
   `applyOps` → Element PAPI → native), each revealed step-by-step via magic
   move.
6. **Close** — the ask, what's there / open, and the CTA.

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

Only **slide movement** is bound to bare keys. Every discrete command lives
behind the command palette (`⌘K` / `Ctrl-K` to search, or `/` for slash mode),
so stray keystrokes — e.g. typing in a live demo — can't fire a command.

| Key                        | Action              |
| -------------------------- | ------------------- |
| `→` `↓` `Space` `PageDown` | Next slide          |
| `←` `↑` `PageUp`           | Previous slide      |
| `Home`                     | First slide         |
| `End`                      | Last slide          |
| `⌘K` / `Ctrl-K`            | Command palette     |
| `/`                        | Palette (slash mode)|

Inside the palette (`⌘K` search or `/` then the key):

| Key | Action              | Key | Action                   |
| --- | ------------------- | --- | ------------------------ |
| `n` | Next slide          | `t` | Toggle theme (light/dark)|
| `p` | Previous slide      | `l` | Toggle 中文 / English    |
| `[` | First slide         | `g` | Background beam / clean  |
| `]` | Last slide          | `d` | DevTool panel            |
| `s` | Open speaker view   | `f` | Toggle fullscreen        |
| `o` | Overview grid       | `b` | Blackout audience screen |

Jump to any slide by title from the palette's **Slides** section (type to
filter, `↑`/`↓` or `←`/`→` to move, `Enter` to go).

URL hash reflects the current slide (e.g. `#7`), so you can deep-link.

## Theme

The deck ships **dark by default** (near-black Keynote-style stage) with the
Vue Lynx green/teal accents intact. Flip to the light theme from the command
palette (`⌘K` → Theme, or `/` then `t`); it adds `.light` on `:root`.

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
fullscreen), and settings (theme, language, background, devtool). Move the
selection with `↑`/`↓` **or** `←`/`→`; `Enter` runs it. In slash mode a single
key runs an action (the hint shown on the right).

A persistent **command launcher** sits in the top-right corner (the `/` button)
and opens the palette in slash mode — this is the entry point on **touch
devices**, where there's no keyboard: the palette list is fully tappable, so
every command is reachable by finger. The launcher lives outside the flag-gated
chrome, so it's present on every slide (hidden only in embed / overview).

**DevTool** (palette → `d`). A foldable inspector (top-right) showing the deck's global
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
The Pillars, the opening logo build-up, and the Architecture chapter's **build
and runtime pipeline** diagrams (`.pipe` steps that carry a `data-flip` id so
each stage morphs into place as the next one washes in) are the worked
examples. One `<section class="slide">` = one step (no in-slide
fragments), which keeps speaker-view sync and deep-links simple.

## Deploy

Two deploy shapes, chosen per branch by `website/vercel.json`:

- **`main` (production docs site)** — the website build runs
  `website/scripts/prepare-deck.mjs`, which builds this deck with `base=/deck/`
  and copies it into `website/docs/public/deck/`, so the deck is served at
  `<url>/deck` *alongside* the docs. The live embeds resolve their bundles from
  `/examples` at the site root.
- **`vueconf-2026` (deck-first preview)** — the branch's `website/vercel.json`
  instead runs `pnpm build:deck-root` (`website/scripts/build-deck-root.mjs`),
  which builds the deck with `base=/` and outputs it (plus `/examples`) as the
  **site root**. Opening the domain root *is* the deck, and the deck's
  root-absolute links (`/speaker.html`, `/examples/*`) resolve correctly. This
  is a branch-only config — **do not merge `vueconf-2026` into `main`**, or the
  production docs site would be replaced by the deck.

The standalone `pnpm dev` / `pnpm build` flow is unchanged (base `/`).

### Stable preview URL (`vueconf-2026`)

The conference deck lives on the `vueconf-2026` branch (built by Vercel, never
merged to `main`). Two kinds of preview URL exist:

- **Per-commit** — `…-<hash>.vercel.app` — changes on every push. Not stable.
- **Per-branch git alias** — **stable** as long as the branch name is unchanged
  (the deck is at the **root**, no `/deck` suffix on this branch):

  ```
  https://vue-lynx-git-vueconf-2026-huxpros-projects.vercel.app/
  ```

  (project `vue-lynx`, team `huxpros-projects`). The general form is
  `<project-slug>-git-<branch>-<team-scope>.vercel.app`; a long branch name gets
  truncated + hashed (and is then less stable), which is why the short
  `vueconf-2026` name is the one to link.

**Nicer fixed URL (optional).** To alias a real/short domain to this branch, do
it in the dashboard — this can *not* be set from `vercel.json` (its `alias`
field is deprecated and ignored by the Git integration):

> Project → **Settings → Domains** → add a domain (a custom domain you own, or a
> free/available `something.vercel.app`) → set **Git Branch = `vueconf-2026`** →
> Save.

Every future `vueconf-2026` deployment is then aliased to that domain, and the
deck is at `<that-domain>/deck`. Production (`vue.lynxjs.org`, the `main`
branch) is unaffected.

## Speaker view

Open it from the command palette (`⌘K` → *Open Speaker View*, or `/` then `s`)
and a popup window opens at `/speaker.html`. It shows:

- The **current slide** rendered live (left)
- The **next slide** preview (right top)
- **Speaker notes** for the current slide (right bottom)
- An **elapsed talk timer** (auto-starts, with `Pause` / `Reset`)
- **Wall-clock time** beside it

The two windows sync via `BroadcastChannel('vue-lynx-deck')` — navigate in
either window, both move. The **speaker window keeps its own bare-key
shortcuts** (arrows, `f`, `.`, `l`, `b`, `r`, `1`–`9`) — it's a presenter-only
surface with no typing, so those don't collide with anything. Only the *main
deck* moved its commands behind the palette.

### Recommended setup

1. Drag the main deck window onto the external display and fullscreen it
   (palette → *Toggle fullscreen*, or `/` then `f`).
2. Open the speaker view (palette → *Open Speaker View*, or `/` then `s`) — the
   popup opens on the laptop screen.
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
first reveal so the opening slides stay snappy. The element lives in
`src/demo.js` (shared with the play page below).

### Try-it QR codes (demo slides)

Each heavy-demo slide gets a small **Web** + **Lynx App** QR pair (`src/qrcodes.js`),
both built from `location.origin` at runtime so they resolve on whatever domain
the deck is served from:

- **Web** (also a clickable link) → `play.html?bundle=…`, a single-example
  player on the deck's own origin (`src/play.js`). It defaults to a phone frame
  and reuses the **same device controls** as the slide mockups — switch to
  tablet or **desktop (fullscreen)**, or drag to resize. Scan or click to run
  that example in a browser.
- **Lynx App** → the hosted `…/examples/<ex>/dist/<name>.lynx.bundle`, for the
  Lynx Explorer app to open natively. **Tap it to copy** the bundle URL (handy
  on mobile — paste it straight into the app).

On desktop, hovering either code zooms it up large so it's easy to scan from a
distance. On touch there's no zoom — tap the Web code to open it, or the Lynx
App code to copy its URL.

> The Web QR currently points at the deck's own play page. When the website's
> `Go` component gains a fullscreen deep-link param (a **separate PR to the
> website `main` branch**), swap the `web` URL in `buildUrls()` to that — it's
> the single seam.

The device mockup around a demo (`.phone`) is **resizable**: hover to reveal a
corner grip (drag to resize freely — width and height are independent, no aspect
lock) and a preset switcher (bottom-right) with three shapes — **phone**,
**vertical tablet**, and **desktop**. Double-click the grip to reset to the
current preset. Seed a non-default starting aspect with `data-ar` on the
`.phone` (e.g. the to-do list uses `data-ar="300 / 560"` to sit a touch wider).
The controls live in `src/framework/device.js` (`attachDeviceControls`) and are
shared with the fullscreen play page — presets are injected so each context
sizes for its own space (cqw/cqh on the scaled stage, vh/vw + a fullscreen
desktop on the play page).
Scrolling/swiping inside a mockup scrolls the live app — it no longer advances
the deck (the wheel/touch navigation ignores anything under `.phone` or an
element tagged `.no-deck-scroll`).

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
