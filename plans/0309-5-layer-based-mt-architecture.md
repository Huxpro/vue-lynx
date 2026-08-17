# Plan: Layer-Based Main Thread Architecture

## Context

**Problem**: Vue Lynx's current main-thread architecture has two fundamental limitations:

1. **All entries share the same MT bundle**: `VueMainThreadPlugin` reads ONE pre-built flat bundle (`main-thread-bundled.js`) via `fs.readFileSync`, appends ALL worklet registrations from a globalThis Map, and replaces ALL entries' `main-thread.js` assets with the same content. Multi-entry apps (e.g. gallery with 6 entries) get identical MT bundles containing registrations from all entries.

2. **globalThis Map hack**: `worklet-registry.ts` uses `globalThis.__vue_worklet_lepus_registrations__` as a shared channel between the BG worklet-loader (writer) and `VueMainThreadPlugin` (reader). This is fragile, breaks module isolation, and is the root cause of problem 1.

**Root cause**: The MT entry only imports bootstrap code (`vue-lynx/main-thread`), not user code. Webpack has no knowledge of per-entry worklet dependencies, so all registrations get pooled.

**React Lynx's approach**: Both BG and MT layers import the SAME user code. webpack `issuerLayer` routes files to different loaders per layer (BG: `worklet.target: 'JS'`, MT: `worklet.target: 'LEPUS'`). webpack's dependency graph naturally scopes each entry to its own registrations.

**Target**: Adopt React's layer-based approach -- both layers import user code, MT-specific loaders extract only worklet registrations, webpack handles per-entry isolation naturally.

## Architecture Overview

```
Current:                                    Target:

BG entry: [entry-bg, ...user-imports]       BG entry: [entry-bg, ...user-imports]  (unchanged)
MT entry: [entry-main]  <- bootstrap only    MT entry: [entry-main, ...user-imports] <- includes user code

BG: vue-loader + worklet-loader(JS+LEPUS)   BG: vue-loader + worklet-loader(JS only)
MT: VueMainThreadPlugin replaces asset      MT: sfc-script-extractor(.vue) + worklet-loader-mt(LEPUS)

Registrations: globalThis Map (shared)      Registrations: webpack modules (per-entry)
```

## Detailed Architecture Diagrams

### Old Vue Architecture (flat bundle replacement)

"Flat bundle" refers to a self-contained JS file pre-compiled from `vue-lynx/main-thread` via rslib
(`main-thread-bundled.js`). It bundles `entry-main.ts` + `ops-apply.ts` + `element-registry.ts`
and all other main-thread code into a single piece of pure JS -- no webpack `__webpack_require__`, no module wrapper.
`VueMainThreadPlugin` reads this file via `fs.readFileSync()` during the webpack compilation phase, concatenates worklet
registration code, and replaces the webpack-generated `main-thread.js` asset with `new RawSource(combined)`.
Webpack's own MT compilation result is discarded entirely.

```
rslib pre-build (independent of webpack):
  entry-main.ts --- rslib bundle --> main-thread-bundled.js
  ops-apply.ts  ---+                 (self-contained, ~5kB flat JS)
                                        |
                                        | fs.readFileSync()
                                        v
+------------------ webpack / rspack ----------------------------+
|                                                                |
|  BG entry: [entry-bg, App.vue, ...]                            |
|    +- worklet-loader (JS pass + LEPUS pass)                    |
|         |                                                      |
|         +- JS output --> background.js (normal BG bundle)      |
|         |                                                      |
|         +- LEPUS output --> globalThis.__vue_worklet_...        |
|                              (registrations from all entries    |
|                               mixed together)        shared Map|
|                                                                |
|  MT entry: [entry-main]   <- only bootstrap, no user code      |
|    +- webpack normal compile --> main-thread.js                |
|         |                                                      |
|         +- VueMainThreadPlugin:                                |
|              1. Read flat bundle                               |
|              2. Get ALL registrations from globalThis Map      |
|              3. Concatenate, replace webpack asset with        |
|                 RawSource                           <- discard |
|              4. Mark 'lynx:main-thread': true                  |
|                                                                |
|  Problem:                                                      |
|  +----------------------------------------------+             |
|  | entry-A's MT bundle == entry-B's MT bundle    |             |
|  | (all entries share the same flat bundle +     |             |
|  |  all registrations)                           |             |
|  +----------------------------------------------+             |
+----------------------------------------------------------------+
```

### New Vue Architecture (layer-based)

```
+------------------ webpack / rspack ----------------------------+
|                                                                |
|  BG entry: [entry-bg, App.vue, ...]  layer: vue:background    |
|    |                                                           |
|    +- vue-loader --> template + style + script normal compile  |
|    +- worklet-loader (JS pass only, no longer does LEPUS)      |
|         +--> background.js                                     |
|                                                                |
|  MT entry: [entry-main, App.vue, ...]  layer: vue:main-thread |
|    |         ^ same user code                                  |
|    |                                                           |
|    +- .vue files:                                              |
|    |    vue-sfc-script-extractor (regex extracts <script>)      |
|    |    +- worklet-loader-mt (LEPUS pass)                       |
|    |       +- Has 'main thread' directive? ->                  |
|    |          registerWorkletInternal()                         |
|    |       +- Doesn't have one?          -> '' (empty module)  |
|    |                                                           |
|    +- .js/.ts files:                                           |
|    |    worklet-loader-mt (same logic)                          |
|    |                                                           |
|    +- bootstrap packages (entry-main.ts, ops-apply.ts):        |
|    |    excluded from MT loader -> pass through as-is,         |
|    |    executes normally                                      |
|    |                                                           |
|    +--> main-thread.js (webpack normal compile,                |
|         has module wrappers)                                   |
|                                                                |
|  VueMarkMainThreadPlugin:                                      |
|    1. Force RuntimeGlobals.startup                             |
|       (fix chunkLoading: 'lynx')                               |
|    2. Mark 'lynx:main-thread': true                            |
|                                                                |
|  Advantages:                                                   |
|  +----------------------------------------------+             |
|  | entry-A's MT bundle contains ONLY entry-A's   |             |
|  |   worklet registrations                       |             |
|  | entry-B's MT bundle contains ONLY entry-B's   |             |
|  |   worklet registrations                       |             |
|  | webpack dependency graph provides automatic   |             |
|  |   isolation, no globalThis hack needed        |             |
|  +----------------------------------------------+             |
+----------------------------------------------------------------+
```

### React Lynx Architecture (reference)

```
+------------------ webpack / rspack ----------------------------+
|                                                                |
|  BG entry: [entry-bg, App.tsx, ...]  layer: react:background  |
|    |                                                           |
|    +- worklet-loader (JS pass)                                 |
|       +- 'main thread' functions -> replaced with context     |
|          objects                                               |
|          (function body sent to MT, BG only keeps              |
|           sign/call interface)                                 |
|       +--> background.js (React runtime + vDOM diffing)        |
|                                                                |
|  MT entry: [snapshot-entry, App.tsx, ...]                      |
|    |         ^ same user code       layer: react:main-thread   |
|    |                                                           |
|    +- SWC snapshot compilation:                                |
|    |    JSX -> direct PAPI calls (generated at compile time)   |
|    |    <view style={{color:'red'}}>                            |
|    |      -> __CreateView(0,0); __SetInlineStyle(el,'color:red')|
|    |    Entire component tree compiled into imperative          |
|    |    PAPI code                                              |
|    |                                                           |
|    +- worklet-loader (LEPUS pass)                              |
|    |    -> registerWorkletInternal() registrations              |
|    |                                                           |
|    +--> main-thread.js                                         |
|         Contains: snapshot code + worklet registrations         |
|         MT first-screen rendered directly by snapshot          |
|         (no need to wait for BG)                               |
|                                                                |
|  Key Differences:                                              |
|  +----------------------------------------------+             |
|  | React MT = snapshot compilation               |             |
|  |   (JSX -> PAPI) + worklets                    |             |
|  | Vue   MT = worklets only (no snapshot          |             |
|  |   compilation)                                |             |
|  |                                               |             |
|  | React first-screen: MT snapshot renders        |             |
|  |   directly -> BG hydrates                     |             |
|  | Vue   first-screen: MT only creates empty      |             |
|  |   page -> BG renders -> ops -> MT executes     |             |
|  +----------------------------------------------+             |
+----------------------------------------------------------------+
```

## Critical Files

| File                                                                  | Action                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/vue/rspeedy-plugin/src/entry.ts`                            | Major refactor: entry splitting + remove VueMainThreadPlugin |
| `packages/vue/rspeedy-plugin/src/loaders/worklet-loader.ts`           | Simplify: remove LEPUS pass                                  |
| `packages/vue/rspeedy-plugin/src/loaders/worklet-loader-mt.ts`        | **New**: MT LEPUS-only loader                                |
| `packages/vue/rspeedy-plugin/src/loaders/vue-sfc-script-extractor.ts` | **New**: extract `<script>` from .vue for MT                 |
| `packages/vue/rspeedy-plugin/src/worklet-registry.ts`                 | **Delete**                                                   |
| `packages/vue/rspeedy-plugin/src/index.ts`                            | Update: allow .vue on MT via extractor                       |
| `packages/vue/main-thread/rslib.config.ts`                            | Remove flat-bundle build config                              |

## Implementation Steps

### Step 1: Create `worklet-loader-mt.ts`

New loader applied to `.js/.ts` files on the MT layer. Does LEPUS pass only:

```typescript
// packages/vue/rspeedy-plugin/src/loaders/worklet-loader-mt.ts
export default function workletLoaderMT(
  this: LoaderContext,
  source: string,
): string {
  if (
    !source.includes('\'main thread\'') && !source.includes('"main thread"')
  ) {
    return ''; // No worklets -> empty module (tree-shaken away)
  }

  const lepusResult = transformReactLynxSync(source, {
    ...sharedOpts,
    worklet: { target: 'LEPUS', filename, runtimePkg: 'vue-lynx' },
  });

  // Return ONLY registerWorkletInternal(...) calls (extracted from LEPUS output)
  return extractRegistrations(lepusResult.code);
}
```

Key differences from BG `worklet-loader.ts`:

- Only LEPUS pass (no JS pass)
- Returns extracted registrations as module content (not stored in global Map)
- Files without `'main thread'` directives return empty string

### Step 2: Create `vue-sfc-script-extractor.ts`

New loader for `.vue` files on MT layer. Extracts only `<script>` content:

```typescript
// packages/vue/rspeedy-plugin/src/loaders/vue-sfc-script-extractor.ts
import { parse } from '@vue/compiler-sfc';

export default function vueSfcScriptExtractor(
  this: LoaderContext,
  source: string,
): string {
  const { descriptor } = parse(source, { pad: false });

  // Return script content -- worklet-loader-mt processes it next
  if (descriptor.scriptSetup) return descriptor.scriptSetup.content;
  if (descriptor.script) return descriptor.script.content;
  return ''; // No script -> empty module
}
```

This replaces vue-loader on the MT layer. No template compilation, no style processing -- just the raw `<script>` content where `'main thread'` directives live.

`@vue/compiler-sfc` is already a transitive dependency via `@rsbuild/plugin-vue`.

### Step 3: Simplify `worklet-loader.ts` (BG layer)

Remove LEPUS pass and worklet-registry dependency:

```diff
- import { addLepusRegistration } from '../worklet-registry.js';

  export default function workletLoader(source: string): string {
    // Pass 1: JS target (unchanged)
    const jsResult = transformReactLynxSync(source, { worklet: { target: 'JS', ... } });

-   // Pass 2: LEPUS target -- REMOVED
-   const lepusResult = transformReactLynxSync(source, { worklet: { target: 'LEPUS', ... } });
-   const registrations = extractRegistrations(lepusResult.code);
-   if (registrations) addLepusRegistration(resourcePath, registrations);

    return jsResult.code;
  }
```

`extractRegistrations()` moves to `worklet-loader-mt.ts` (or shared util).

### Step 4: Modify `entry.ts` -- entry splitting

**MT entry now includes user imports:**

```diff
  chain
    .entry(mainThreadEntry)
    .add({
      layer: LAYERS.MAIN_THREAD,
-     import: [require.resolve('vue-lynx/main-thread')],
+     import: [require.resolve('vue-lynx/main-thread'), ...imports],
      filename: mainThreadName,
    })
```

**Remove `VueMainThreadPlugin` class entirely** (lines 90-147). No more flat-bundle replacement.

**Remove `clearLepusRegistrations`/`getAllLepusRegistrations` imports.**

**Keep `VueWorkletRuntimePlugin`** (unchanged -- still needed to inject worklet-runtime Lepus chunk).

### Step 5: Add loader rules for MT layer

In `applyEntry()`, register MT-specific loaders:

```typescript
// Vue SFC on MT: extract script only (no template/style)
chain.module
  .rule('vue:mt-sfc')
  .issuerLayer(LAYERS.MAIN_THREAD)
  .test(/\.vue$/)
  .use('vue-sfc-script-extractor')
  .loader(path.resolve(_dirname, './loaders/vue-sfc-script-extractor'))
  .end();

// JS/TS on MT: LEPUS worklet transform
chain.module
  .rule('vue:worklet-mt')
  .issuerLayer(LAYERS.MAIN_THREAD)
  .test(/\.(?:[cm]?[jt]sx?)$/)
  .exclude.add(/node_modules/).end()
  .use('worklet-loader-mt')
  .loader(path.resolve(_dirname, './loaders/worklet-loader-mt'))
  .end();
```

Update `index.ts` to remove `.vue` constraint to BG-only (MT now has its own `.vue` processing via `vue-sfc-script-extractor`):

```diff
- if (chain.module.rules.has(CHAIN_ID.RULE.VUE)) {
-   chain.module.rule(CHAIN_ID.RULE.VUE).issuerLayer(LAYERS.BACKGROUND);
- }
+ // vue-loader still only runs on BG (template compilation, style processing).
+ // MT uses vue-sfc-script-extractor instead (Step 2).
+ if (chain.module.rules.has(CHAIN_ID.RULE.VUE)) {
+   chain.module.rule(CHAIN_ID.RULE.VUE).issuerLayer(LAYERS.BACKGROUND);
+ }
```

Actually vue-loader stays BG-only. The new `vue:mt-sfc` rule handles `.vue` on MT before vue-loader would match.

### Step 6: Fix `chunkLoading: 'lynx'` startup issue

**Problem**: rspeedy's `chunkLoading: 'lynx'` (via `StartupChunkDependenciesPlugin`) only generates startup code when `hasChunkEntryDependentChunks(chunk)` is true. For MT entries without async chunk dependencies, this is false -- module factories never execute.

**Solution**: `VueMTStartupPlugin` -- a webpack plugin that injects entry execution into MT bundles:

```typescript
class VueMTStartupPlugin {
  constructor(private readonly mainThreadFilenames: string[]) {}

  apply(compiler: WebpackCompiler): void {
    compiler.hooks.thisCompilation.tap('VueMTStartup', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'VueMTStartup', stage: PROCESS_ASSETS_STAGE_ADDITIONS },
        () => {
          for (const filename of this.mainThreadFilenames) {
            const asset = compilation.getAsset(filename);
            if (!asset) continue;

            const originalSource = asset.source.source();
            // Append self-executing startup: find __webpack_require__ and
            // trigger entry module evaluation.
            // Alternative: use ConcatSource to append startup call.
            const startupCode = '\n// Vue MT startup\n'
              + 'var __webpack_exports__ = __webpack_require__(__webpack_require__.s);\n';

            compilation.updateAsset(
              filename,
              new compiler.webpack.sources.ConcatSource(
                asset.source,
                new compiler.webpack.sources.RawSource(startupCode),
              ),
              { ...asset.info, 'lynx:main-thread': true },
            );
          }
        },
      );
    });
  }
}
```

> **Investigation needed**: Verify that `__webpack_require__.s` (startup module ID) is available in the generated bundle. If not, use the `entrypoints` API to find the entry module ID for each MT chunk. This may require a different approach -- e.g., tapping into `additionalTreeRuntimeRequirements` to force `RuntimeGlobals.startupEntrypoint`.

**Fallback**: If the startup injection approach proves fragile, keep `VueMainThreadPlugin`'s flat-bundle replacement for `entry-main.ts` only, while letting webpack handle the user-code modules normally. This hybrid approach fixes per-entry isolation while preserving the proven startup mechanism.

### Step 7: Delete `worklet-registry.ts`

```bash
rm packages/vue/rspeedy-plugin/src/worklet-registry.ts
```

Remove all references in `entry.ts` (`clearLepusRegistrations`, `getAllLepusRegistrations` imports).

### Step 8: Update `vue-lynx/main-thread` build

Currently rslib builds `entry-main.ts` twice:

- Normal build -> `dist/entry-main.js` (used by webpack as module)
- Flat bundle build -> `dist/main-thread-bundled.js` (used by `VueMainThreadPlugin`)

**Remove the flat-bundle build** from `rslib.config.ts`. Only the normal module build is needed now (webpack imports it as a regular dependency).

Also remove `dist/dev-worklet-registrations.js` build -- dev worklet registrations are no longer appended by the plugin. Gallery demos that still use hand-crafted registrations should be migrated to `'main thread'` directives (or import registrations as a dev-only module).

### Step 9: Handle `dev-worklet-registrations.ts`

Currently `VueMainThreadPlugin` appends `dev-worklet-registrations.js` in dev mode for gallery demos with hand-crafted worklet functions.

Options:

- **Preferred**: Migrate remaining demos to `'main thread'` directive (most already done)
- **Fallback**: Import as a dev-only side-effect module in each gallery entry that needs it

## Risks & Mitigations

| Risk                                                                                             | Mitigation                                                                                           |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `chunkLoading: 'lynx'` startup: `__webpack_require__.s` may not exist                            | Investigate webpack internals; fallback to hybrid approach (Step 6 fallback)                         |
| `vue-sfc-script-extractor` may miss edge cases (`<script>` with src attribute, multiple scripts) | Use `@vue/compiler-sfc` parse which handles all SFC variants; add tests                              |
| webpack module wrapping overhead in MT bundle                                                    | Acceptable -- a few KB of runtime; Lepus bytecode compilation handles it                              |
| `@vue/compiler-sfc` version mismatch with vue-loader                                             | Use the same version already installed by `@rsbuild/plugin-vue`                                      |
| Watch mode: MT loader must re-run when user files change                                         | webpack's dependency tracking handles this naturally since user files are now in MT dependency graph |

## Verification

1. **Build**: `pnpm build` in `packages/vue/rspeedy-plugin`, `packages/vue/main-thread`, `packages/vue/runtime` -- no errors
2. **Testing-library**: `pnpm test` in `packages/vue/testing-library` -- all tests pass
3. **Vue upstream**: `pnpm test` in `packages/vue/vue-upstream-tests` -- no regressions
4. **Multi-entry isolation**: Build gallery example, verify each entry's `main-thread.js` contains ONLY its own worklet registrations (not all entries')
5. **LynxExplorer**: gallery-autoscroll, mts-draggable -- worklet events fire correctly
6. **Watch mode**: modify a worklet function in dev mode, verify hot rebuild picks up the change

---

## Post-Implementation Notes

### Implementation commit

`b7120bbb` -- `refactor(vue): adopt layer-based main thread architecture`

### Bundle size impact (`examples/vue`, production build, single-entry counter app)

| Bundle             | Before             | After              | Delta               |
| ------------------ | ------------------ | ------------------ | ------------------- |
| `main.lynx.bundle` | 73,167 B (73.2 kB) | 73,812 B (73.8 kB) | **+645 B (+0.88%)** |
| `main.web.bundle`  | 71,189 B (71.2 kB) | 71,724 B (71.7 kB) | **+535 B (+0.75%)** |

For a single-entry scenario without worklets, there is a slight increase of ~0.6 kB, coming from the webpack module wrapper overhead added to MT layer empty modules.

#### Why the benchmark doesn't show the advantage

`examples/vue` is a single-entry counter app with no `'main thread'` directives.

In this scenario:

- **Old architecture**: 1 flat bundle (pre-compiled entry-main.ts) + 0 worklet registrations
- **New architecture**: webpack compiles entry-main.ts + user code (all cleared to `''` by worklet-loader-mt) + webpack module wrappers

The extra 645B is purely the wrapper overhead webpack adds to these empty modules. There are no worklets to "split apart," so no benefit is visible.

#### The real benefit scenario is multi-entry

Suppose the gallery has 6 entries, 3 of which have worklet events:

```
Old architecture (flat bundle + globalThis Map):
+---------------------------------------------+
| entry-A's MT bundle = flat bundle            |
|   + entry-A's worklet registrations          |
|   + entry-B's worklet registrations  <- unnecessary |
|   + entry-C's worklet registrations  <- unnecessary |
+---------------------------------------------+
| entry-B's MT bundle = exactly the same content |
+---------------------------------------------+
| entry-C's MT bundle = exactly the same content |
+---------------------------------------------+
| entry-D/E/F's MT bundle = still the same     |
|   (don't need any worklet registrations,      |
|    but includes all of them anyway)           |
+---------------------------------------------+
6 entries x the same (bootstrap + all registrations)

New architecture (layer-based):
+-------------------------------+
| entry-A's MT bundle:          |
|   bootstrap + A's registrations only |
+-------------------------------+
| entry-B's MT bundle:          |
|   bootstrap + B's registrations only |
+-------------------------------+
| entry-D's MT bundle:          |
|   bootstrap + empty (no registrations) |
+-------------------------------+
Each entry contains only its own worklets
```

Therefore:

- **Single-entry without worklets** (current benchmark): slight increase of ~0.6kB (webpack wrapper overhead)
- **Multi-entry with worklets** (gallery scenario): each entry's MT bundle is smaller, as it no longer includes other entries' registration code

To accurately verify the benefit, we need to wait until the gallery is split into multiple entries and then benchmark.

### Deviations from plan

1. **Step 2 -- `vue-sfc-script-extractor`**: Plan specified `@vue/compiler-sfc` for SFC parsing. In practice, `@vue/compiler-sfc` is NOT directly installed (only a transitive dep inside `@rsbuild/plugin-vue`'s closure). Used regex `/<script[^>]*>([\s\S]*?)<\/script>/g` instead -- sufficient for extracting `<script>` content for worklet directive detection.

2. **Step 3 -- `worklet-utils.ts`**: `extractRegistrations()` was moved to a shared `worklet-utils.ts` rather than kept inside `worklet-loader-mt.ts`, since both the old BG loader and the new MT loader may need it.

3. **Step 6 -- Startup code fix**: Plan proposed injecting startup code via `processAssets` (appending `__webpack_require__(__webpack_require__.s)`). Actual solution was simpler -- tapping `additionalTreeRuntimeRequirements` to add `RuntimeGlobals.startup` for MT entry chunks, which causes webpack to generate its own startup code naturally. No manual source manipulation needed.

4. **CSS extraction**: CSS handling was extracted from `entry.ts` into a dedicated `css.ts` module (`applyCSS()`) in the same commit. This was not part of the original plan but was a natural refactoring during the entry.ts rewrite.

### Pitfalls encountered

#### Pitfall 1: `chunkLoading: 'lynx'` prevents MT entry startup (predicted by Step 6)

**Symptom**: `processData is not a function`, `renderPage is not a function`, `vuePatchUpdate is not a function`.

**Root cause**: rspeedy sets `chunkLoading: 'lynx'` globally. Lynx's `StartupChunkDependenciesPlugin` only adds `RuntimeGlobals.startup` when `hasChunkEntryDependentChunks(chunk)` is true. For MT entries without async chunk dependencies, this is false -- webpack never generates the `__webpack_require__(entryModuleId)` startup call, so module factories (including `entry-main.ts` which sets `globalThis.renderPage` etc.) never execute.

**Fix**: `VueMarkMainThreadPlugin` taps `additionalTreeRuntimeRequirements` and adds `RuntimeGlobals.startup` for any chunk whose entry layer is `LAYERS.MAIN_THREAD`.

#### Pitfall 2: pnpm workspace symlinks bypass `/node_modules/` excludes (NOT predicted)

**Symptom**: Same "processData is not a function" error persisted after Pitfall 1 fix.

**Root cause**: Reading the built `main-thread.js` revealed that the `RuntimeGlobals.startup` fix worked (startup code was generated), but **module factories were EMPTY** -- both `entry-main.js` and `ops-apply.ts` had empty function bodies `function() {}`.

The `vue:worklet-mt` loader rule had `.exclude.add(/node_modules/)` to skip bootstrap packages. But in a pnpm workspace, `vue-lynx/main-thread` resolves via symlink to `../../packages/vue/main-thread/dist/entry-main.js` (a real path under `packages/vue/`), NOT under `node_modules/`. So the exclude didn't catch it, and `worklet-loader-mt` returned `''` for these files (no `'main thread'` directive found).

Similarly, `vue-lynx/internal/ops` (the OP enum imported by `ops-apply.ts`) resolves to `packages/vue/shared/src/ops.ts`.

**Fix**: Explicitly resolve and exclude bootstrap package directories:

```typescript
const mainThreadPkgDir = path.dirname(
  require.resolve('vue-lynx/main-thread/package.json'),
);
let vueInternalPkgDir: string | undefined;
try {
  vueInternalPkgDir = path.dirname(
    require.resolve('vue-lynx/internal/ops/package.json'),
  );
} catch { /* optional */ }

chain.module.rule('vue:worklet-mt')
  .exclude.add(/node_modules/)
  .add(mainThreadPkgDir);
if (vueInternalPkgDir) workletMtExclude.add(vueInternalPkgDir);
```

### Verification results

- **Build**: rspeedy-plugin + main-thread builds succeed
- **Testing-library**: 63/63 tests pass (7 test files)
- **Bundle verification**: `renderPage`, `processData`, `vuePatchUpdate` all present in encoded `.lynx.bundle`
- **LynxExplorer**: mts-draggable verified (hash match: BG `9177:69c82:1` = MT `9177:69c82:1`, zero runtime errors)
- **Multi-entry gallery**: gallery-scrollbar-compare and gallery-complete verified -- all hashes match, worklet events fire correctly

### Pitfall 3: Stale webpack cache after plugin rebuild (NOT predicted)

**Symptom**: After fixing Pitfall 1 & 2 and verifying mts-draggable works, gallery-scrollbar-compare still showed `TypeError: cannot read property 'bind' of undefined` from `worklet-runtime/main-thread.js`.

**Root cause**: The gallery example's webpack persistent cache (`node_modules/.cache`) was still serving MT bundles built BEFORE the rspeedy-plugin fix. The dev server was not restarted after the plugin rebuild.

**Fix**: `rm -rf node_modules/.cache` + restart dev server. Error disappeared -- hashes matched in both dev and prod builds.

**Lesson**: When debugging Lynx bundle errors, **always clear caches and restart the dev server first** before doing code analysis. rspeedy-plugin is built separately from example apps; after rebuilding the plugin, the downstream webpack cache is stale. This is documented in `packages/vue/AGENTS.md`.
