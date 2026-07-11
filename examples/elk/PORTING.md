# PORTING.md — how Elk became Elk on Lynx

This example ports [Elk](https://github.com/elk-zone/elk) (a Nuxt 3 Mastodon
web client, ~196 components / 55 pages / 50 composables) to **Vue Lynx**.
Elk was **not forked**: Vue Lynx has no Nuxt (no SSR, file routing, Nitro,
auto-imports), no DOM, and different primitives. Instead, Elk's
framework-agnostic layers were extracted and its UI rebuilt on Lynx
elements. The feature-level status lives in [PRD.md](./PRD.md); this file
explains *what* was reused vs rewritten and *why*.

## Architecture

```
Elk Shared (reused)                      Elk Lynx (rebuilt)
├── masto.js API client            ←→   src/composables/masto.ts (thin de-Nuxt wrapper)
├── content parse pipeline         ←→   src/composables/content-parse.ts (near-verbatim)
├── content render walk            ←→   src/composables/content-render.ts (Lynx retarget)
├── paginator state machine        ←→   src/composables/paginator.ts (Lynx trigger)
├── timeline filters/reorder       ←→   src/composables/timeline.ts (verbatim)
├── status action optimistic logic ←→   src/composables/status-actions.ts (verbatim)
├── search composable              ←→   src/composables/search.ts (near-verbatim)
├── LRU cache                      ←→   src/composables/cache.ts (Map-based LRU)
├── account helpers                ←→   src/composables/account.ts (verbatim)
└── theme palette (vars.css)       ←→   src/styles/theme.css (verbatim values)

Elk Web (Nuxt + DOM components)    →    not forked; templates rebuilt in src/components|pages
```

## Reused from Elk (and how much changed)

| Elk source | Ported to | Changes |
| --- | --- | --- |
| `masto` npm package (REST client) | dependency | none — same `createRestAPIClient` |
| `app/composables/content-parse.ts` | `src/composables/content-parse.ts` | ~95% verbatim: sanitizer allow-list, custom-emoji/markdown/named-mention/collapse-mention transforms, `treeToText`. Dropped: twemoji unicode-emoji transforms (native glyphs render already), `<bdi>`/`dir=auto` (no bidi element), `new URL` protocol check → regex (no URL in Lynx runtime) |
| `app/composables/content-render.ts` | `src/composables/content-render.ts` | same AST walk + mention/hashtag/code special-casing; **output retargeted** (see below) |
| `app/composables/paginator.ts` | `src/composables/paginator.ts` | masto `Paginator` iteration, buffering, state machine kept; DOM trigger (`useElementBounding` + `window.innerHeight` polling) → native `<list>` `scrolltolower`; streaming-prepend removed (no WebSocket) |
| `app/composables/timeline.ts` | `src/composables/timeline.ts` | verbatim (filters, `reorderTimeline`) |
| `app/composables/masto/status.ts` | `src/composables/status-actions.ts` | verbatim optimistic-update logic incl. the cancel-count API-quirk workaround; `navigateTo` → vue-router |
| `app/composables/masto/search.ts` | `src/composables/search.ts` | VueUse `debouncedWatch` inlined; `isHydrated` SSR guard dropped |
| `app/composables/cache.ts` | `src/composables/cache.ts` | `lru-cache` dep → 20-line Map LRU; same keys/API |
| `app/composables/masto/account.ts` | `src/composables/account.ts` | verbatim handle/display-name helpers |
| `app/composables/users.ts` | `src/composables/users.ts` | Elk's guest-mode (`publicServer`) design kept; multi-account persistence dropped (browser storage) |
| `app/styles/{vars,default-theme}.css` | `src/styles/theme.css` | same palette values as Lynx CSS vars on `page` |
| RemixIcon set (Elk's UnoCSS `i-ri:*`) | `src/composables/icons.ts` | same glyphs, inlined as SVG data-URIs for `<image>` (no icon-font/currentColor in Lynx) |

## Rebuilt for Lynx (and why)

### Templates: every one of them

DOM elements don't exist in Lynx. `<div>`→`<view>`, `<span>/<p>`→`<text>`,
`<img>`→`<image>`, `@click`→`@tap`, CSS via Lynx's subset (flexbox, no
`:hover`). ~20 components in `src/components` + 8 pages in `src/pages`
reimplement Elk's surfaces following the originals' layout
(`StatusCard` ≈ Elk `status/StatusCard.vue` + `StatusBody` + `StatusContent`,
`TimelinePaginator` ≈ `timeline/TimelinePaginator.vue` + `common/CommonPaginator.vue`, …).

### The content renderer (the crown jewel)

Elk's pipeline is: Mastodon HTML → `ultrahtml` AST → sanitize → transforms →
Vue vnodes. The **parse half is reused intact**. The **render half changes
its output targets**:

| Elk emits | Lynx port emits |
| --- | --- |
| `h('p', …)` | `h('text', { class: 'content-p' })` block |
| `h('a', …)` / `RouterLink` | nested `<text>` run with `onTap` → router |
| `AccountHoverWrapper` (floating-vue hover card) | tap → profile navigation (no hover on touch) |
| `<picture><source><img></picture>` custom emoji | inline `<image>` (static variant) |
| `ContentCode` (Shiki highlight) | plain mono `<text>` block (Shiki's WASM/regex engine unsuited to the Lynx runtime) |
| `<bdi>`, `dir="auto"`, `<ruby>` | dropped (no equivalents) |

Inline styling (bold/italic/del/code…) becomes nested `<text>` runs with
classes — Lynx supports inline text nesting natively.

### Virtualized timeline

Elk uses `virtua`'s DOM `WindowVirtualizer`. Lynx's native `<list>` is
already a recycling virtualized scroller, so the port's timeline is a
`<list>` with `estimated-main-axis-size-px` hints and
`lower-threshold-item-count` + `scrolltolower` driving `loadNext()` —
*less* code than the DOM version.

### Navigation

Nuxt file routing → explicit `vue-router` table on `createMemoryHistory`
(no browser History API). Elk's route shapes are preserved
(`/:server/@:account`, `/:server/status/:id`, `/:server/tags/:tag`, …) so
the content renderer's mention/hashtag rewrites work unchanged.

### Sessions

Elk's OAuth needs its Nitro server (`server/api/[server]/login.ts`
registers an OAuth app, browser redirects to `/oauth/authorize`). A Lynx
app has neither a bundled server nor browser redirects, so the port
supports Elk's **anonymous guest mode** (default) plus **manual
access-token sign-in** in Settings. Multi-account storage
(localStorage/IndexedDB) is out — one session per launch.

## Lynx-specific landmines (worth knowing)

1. **Web globals are hidden from the BG eval scope.** masto.js references
   `fetch`, `Request`, `Headers`, `AbortSignal`… as free identifiers; the
   Lynx background-thread eval scope defines a broken bare `fetch` and
   lacks the rest, while `globalThis.*` has them. Fixed at compile time
   with `source.define` rewrites in `lynx.config.ts` (no masto patches).
2. **No DOMParser anywhere** (worker or native). Elk's `tiny-decode`
   entity decoder uses DOMParser in its browser build — replaced with a
   30-line table+numeric decoder (`html-entities.ts`), sufficient for
   Mastodon's sanitized output.
3. **No `URL` in the native Lynx runtime.** masto.js needs it
   (`resolvePath`); it exists in the web-platform worker, so Lynx-for-Web
   works today. A tiny URL polyfill would be needed for native PrimJS —
   tracked in PRD.
4. **Icons can't use `currentColor`.** SVG data-URIs are tinted by string
   replacement per color (`icons.ts`).
5. **`new URL(path, base)` drops base paths** — relevant to the
   verification relay (below), not the app itself.

## Verification setup

The sandbox this port was built in blocks browser TLS egress (its proxy
re-terminates TLS and resets Chromium's handshake), so verification uses
two small relays in [`harness/`](./harness/):

- `serve.mjs` — serves the harness page + `dist/`, and relays
  `/api/*` → `https://<target instance>` via Node fetch (which does honor
  the sandbox proxy). Media URLs in JSON responses are rewritten through
  the relay. The app opts in via the `ELK_API_PROXY` build define — empty
  in normal builds, where it talks to `https://<server>` directly.
- `mitm.mjs` + `--host-resolver-rules=MAP * 127.0.0.1` — a transparent
  HTTPS relay so the *original* elk.zone can load in the same sandbox for
  side-by-side screenshots against the same instance.
- `shot.mjs` / `shot-elk.mjs` — Playwright capture scripts
  (coordinate-based taps; the Lynx view is closed shadow DOM).

Results: [screenshots/README.md](./screenshots/README.md).

In an unrestricted environment none of this is needed: build with
`pnpm build`, serve `harness/index.html` + `dist/`, and the app fetches
Mastodon directly.
