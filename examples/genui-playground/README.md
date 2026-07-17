# Vue Lynx GenUI Playground

An IDE-style web playground for the GenUI protocols (A2UI v0.9 and OpenUI
Lang v0.5), ported from `lynx-family/lynx-stack`'s `genui/playground` and
embedded on the Vue Lynx website at `/genui`.

## Architecture

Two halves, talking through `lynx-view` on Lynx for Web:

- **`src/` — the web shell.** A React DOM app copied nearly verbatim from
  upstream (Create / Examples / Catalog / Bench tabs, JSON editor, phone
  preview, QR codes, playback controls). It is deliberately kept as React:
  it's website chrome, not Lynx UI — the Vue Lynx website itself is
  React-based (rspress), and a Vue rewrite of ~40 components would add
  maintenance cost with zero user-visible value. The shell drives whatever
  bundle sits at `./a2ui.web.bundle` / `./openui.web.bundle`.
- **`lynx-src/` — the Lynx preview apps, written in Vue.** These render the
  actual A2UI/OpenUI surfaces via `vue-lynx-genui` and implement the
  playground protocol: `globalProps` payload boot, mock-agent streaming,
  playback mode (`A2UI_PLAYBACK_CONTROL` / `A2UI_PLAYBACK_PROGRESS` global
  events), live pushes (`A2UI_REPLAY_MESSAGES`, `A2UI_LIVE_MESSAGES`,
  `A2UI_ACTION_RESPONSE`), and the `A2UI_PLAYBACK_SYNC` /
  `A2UI_USER_ACTION` NativeModules bridge calls.

## Commands

```bash
pnpm build:lynx   # rspeedy: lynx-src → www/*.{web,lynx}.bundle
pnpm build        # build:lynx + rsbuild: src → dist/ (static site)
pnpm dev          # build:lynx once, then rsbuild dev server
pnpm dev:lynx     # rspeedy dev server (for native preview via QR code)
```

The website copies `dist/` to `docs/public/genui-playground/` via
`website/scripts/prepare-playground.mjs` (built with
`ASSET_PREFIX=/genui-playground/` so hashed assets survive cleanUrls).

## Divergences from upstream

- `lynx-src` apps are Vue Lynx (upstream: ReactLynx). Bundle filenames are
  `*.{web,lynx}.bundle` (Vue Lynx plugin) instead of `*.{web,lynx}.js`.
- The `lazy-component` demo and the `LazyComponent` catalog entry are
  omitted: they require a separately-built Lynx *lazy bundle*
  (`experimental_isLazyBundle`), a ReactLynx toolchain feature Vue Lynx
  does not implement. See PORTING.md.
- `src/styles.css` additionally imports
  `vue-lynx-genui/a2ui/styles/material-icons.css` so icon glyphs render on
  the web: `@font-face` inside a Lynx bundle's shadow-root styles is
  ignored by browsers, so the host page must register the font.
- Dead upstream code dropped: `UsageSection.tsx` (never rendered,
  documented an unported HTTP-client API), rstest test files.
