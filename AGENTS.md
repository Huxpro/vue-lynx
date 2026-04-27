# Vue Lynx — Agent Guidelines

## Read in Advance

- Vue Lynx: [llms.txt](https://vue.lynxjs.org/llms.txt), **REQUIRED**.
  Read this before working on any Vue Lynx task — it covers the Vue Lynx API, dual-thread architecture, and Lynx-specific caveats from a Vue perspective.

## Debugging Checklist

When investigating runtime errors in Lynx bundles:

1. **Clear caches first** — Before doing any code analysis, always:
   - `rm -rf node_modules/.cache` in the example/app directory
   - Restart the dev server (`pnpm dev`)
   - Restart LynxExplorer (stale error toasts persist across navigations)

   rspeedy-plugin is built separately from example apps. After rebuilding the plugin, the webpack persistent cache in example apps still serves stale bundles. This is the #1 cause of "phantom" errors that don't reproduce after a clean rebuild.

2. **Verify hash matching** — For worklet-related errors (`TypeError: cannot read property 'bind' of undefined`), check that BG `_wkltId` hashes match MT `registerWorkletInternal` hashes. Inspect the `.web.bundle` (JSON format) to compare.

3. **Check LynxExplorer state** — The error toast is persistent across page navigations. A stale error from a previous page load can be mistaken for a current error. Restart the simulator app to clear.

## Architecture Notes

### Dual-Thread Build (rspeedy-plugin)

- **Background Thread**: Vue runtime + user app. Layer: `vue:background`.
- **Main Thread**: PAPI bootstrap + worklet registrations. Layer: `vue:main-thread`.
- Both layers import the same user code; webpack `issuerLayer` routes files to different loaders.
- BG: `worklet-loader` (SWC JS pass) — replaces `'main thread'` functions with context objects.
- MT: `worklet-loader-mt` (SWC LEPUS pass) — extracts `registerWorkletInternal()` calls.

### Key Files

| File                                              | Purpose                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/vue-lynx/plugin/src/entry.ts`                     | Dual-bundle entry splitting, loader rules, webpack plugins        |
| `packages/vue-lynx/plugin/src/index.ts`                     | `pluginVueLynx()` — Vue SFC + Lynx adaptation                     |
| `packages/vue-lynx/plugin/src/loaders/worklet-loader.ts`    | BG worklet transform (JS target)                                  |
| `packages/vue-lynx/plugin/src/loaders/worklet-loader-mt.ts` | MT worklet transform (LEPUS target)                               |
| `packages/vue-lynx/plugin/src/loaders/worklet-utils.ts`     | Shared: `extractLocalImports`, `extractRegistrations`             |
| `packages/vue-lynx/main-thread/src/entry-main.ts`           | MT bootstrap: renderPage, vuePatchUpdate, worklet-runtime loading |
| `packages/vue-lynx/main-thread/src/ops-apply.ts`            | MT ops interpreter: switch loop over flat ops array               |
| `packages/vue-lynx/runtime/src/index.ts`                    | BG custom renderer: createApp, ShadowElement tree, ops buffer     |

### Upstream Tests (`packages/upstream-tests/`)

The `packages/upstream-tests/` directory re-runs selected Vue core test suites against our custom renderer. It has **two** vitest configurations exercising different layers:

| Command | Config | Adapter | What it exercises |
|---------|--------|---------|-------------------|
| `pnpm test` | `vitest.config.ts` | `lynx-runtime-test.ts` (in-memory) | runtime-core logic only — no ops pipeline, no PAPI |
| `pnpm test:dom` | `vitest.dom.config.ts` | `lynx-runtime-dom-bridge.ts` (full pipeline) | BG→ops→MT→PAPI→jsdom dual-thread pipeline |

**`lynx-runtime-dom-bridge.ts`** is the key bridge file for `test:dom`. It:
- Creates a `ShadowElement` per jsdom element (lazy shadow mapping)
- Routes `patchProp` calls through `nodeOps.patchProp` → ops buffer → `syncFlush()` → `applyOps` → PAPI → jsdom
- Adds thin DOM event forwarders so `el.dispatchEvent(new Event('click'))` in tests invokes the PAPI-registered handler via `eventMap`

### Common Gotchas

- `worklet-loader-mt` must emit `export default {};` for vue script sub-modules (`?vue&type=script`) to satisfy the `experimentalInlineMatchResource` proxy re-export.
- Bootstrap packages (`vue-lynx/main-thread`, `vue-lynx/internal/ops`) must be excluded from MT loaders — in pnpm workspaces they resolve via symlinks (not under `node_modules/`), so `/node_modules/` exclude alone is insufficient.
- `VueMarkMainThreadPlugin` must add `RuntimeGlobals.startup` for MT entry chunks — without it, `chunkLoading: 'lynx'` prevents module factory execution.
