# Stage 1 · Build a Bundle

Goal: your compiler's output becomes a `.lynx.bundle` that Lynx Explorer (and Lynx for
Web) loads. Nothing framework-shaped yet — just bytes in the right envelope.

## What a bundle is

A `.lynx.bundle` is an encoded template with named sections. The ones you care about:

| section | contents | thread |
|---|---|---|
| `lepusCode.root` | the **main-thread program** — evaluated before first paint | main |
| `manifest["/app-service.js"]` | the **background program** — your app + framework | background |
| `styleInfo` | the compiled CSS (see below) | engine |
| `pageConfig` | engine configuration (`defaultOverflowVisible`, CSS behavior flags…) | engine |
| `elementTemplates` | engine-instantiable element templates (advanced, see stage 3) | engine |

You do not write this format by hand. The framework-neutral toolchain does:

- **`@lynx-js/template-webpack-plugin`** (`LynxTemplatePlugin` + `LynxEncodePlugin`) —
  collects your emitted chunks into sections and encodes the bundle.
- **`@lynx-js/runtime-wrapper-webpack-plugin`** — wraps the background chunk in the
  runtime envelope the engine expects.
- **`@lynx-js/css-extract-webpack-plugin`** — turns your CSS into `styleInfo`.
- **`@lynx-js/rspeedy`** — the Rsbuild-based CLI that orchestrates all of the above,
  plus dev server and HMR. Framework plugins (`plugin-react`, Vue's, Octane's) are
  thin layers over it.

> **Case study — the minimal viable config.** miso-lynx ships a complete integration
> in a ~55-line `rspack.config.js`: one entry (the GHC-compiled JS), `LynxEncodePlugin`,
> `LynxTemplatePlugin`, and a five-line inline plugin that marks the single output chunk
> `"lynx:main-thread": true`. That is genuinely all it takes to get pixels on screen —
> a single main-thread chunk and no background program at all. Start here; you can
> graduate to two chunks later without throwing anything away.

## The two-layer build (when you're ready)

A full integration compiles **the same application entry twice** — once for each
thread — and packs both into one bundle. Every mature integration converged on the same
bundler technique: module *layers* (webpack/rspack `experiments.layers`), with
`issuerLayer`-routed loaders and per-layer defines.

- ReactLynx: layers `react:background` / `react:main-thread`; per-layer SWC options
  (`__MAIN_THREAD__`/`__JS__` defines, effect-hook shaking on the MT slice, directive
  DCE that empties `'background only'` function bodies in the MT slice and
  `'main thread'` bodies in the BG slice).
- Vue Lynx: layers `vue:background` / `vue:main-thread`; same idea, with worklet
  loaders doing the per-thread extraction.
- Octane: layers `octane:background` / `octane:main-thread`, plus a
  `NormalModuleReplacementPlugin` that swaps the whole framework package for a
  `first-screen` facade when imported from the MT layer — a clean trick if your MT
  slice is a different implementation of the same API rather than the same code.

Practical advice:

1. **Ship one chunk first.** Two-layer builds exist to serve a threading architecture
   you haven't chosen yet (stage 3). Don't pay for them on day one.
2. **Reserve your defines and directives early.** `'background only'` / `'main thread'`
   directive DCE and a `__MAIN_THREAD__`-style define are cheap to add and will be
   load-bearing later.
3. **Watch the cache.** Webpack persistent caching does not know your plugin changed;
   stale-bundle ghosts are the #1 source of phantom bugs during integration work.
   Clear `node_modules/.cache` reflexively.

## CSS

CSS compiles at build time into `styleInfo` — selectors, scoping (`cssId`), and the
engine applies it natively. Consequences for a framework author:

- Class changes at runtime are cheap **attribute writes** (`__SetClasses`), not style
  recomputation in JS. Prefer emitting class strings over inline style objects.
- Inline styles go through `__SetInlineStyles` (string or object). Fine for dynamic
  values; don't route your whole styling system through it.
- Scoping: if your framework has scoped styles (SFC-style), map them to `cssId` +
  `__SetCSSId` on created elements. If you skip this, everything lands in one global
  scope — workable for a demo, painful later.
- `pageConfig` changes CSS semantics (e.g. `defaultOverflowVisible`). Set it
  deliberately and read the next section's warning about *when* it becomes available.

## Polyfill reality

The background runtime is PrimJS (on device), not V8. Budget a small polyfill layer:
`TextEncoder`/`TextDecoder`, `BigInt` (JSBI), `requestAnimationFrame` (alias
`lynx.requestAnimationFrame`), and check your compiler's runtime assumptions —
miso-lynx's GHC output needed exactly those three. If your language runtime is large
(GHC's JS backend: ~1MB gzip for a counter), note it now: it becomes the dominant term
in your first-paint story, and stage 3's threading choice is how you'll manage it.

## Dev loop

- **Lynx Explorer** (device/simulator) loads a served bundle URL — your daily driver.
  Its error toast persists across reloads; restart it before trusting a red screen.
- **Lynx for Web** (`@lynx-js/web-core`) runs the same bundle in Chromium with real
  dual threads — your CI harness. Mount `<lynx-view url=…>`, drive it with Playwright.
  All benchmark numbers in this series come from this harness.

**Done when:** a hello-world bundle renders in Explorer and in a `<lynx-view>`.
