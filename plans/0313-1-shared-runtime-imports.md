# Support `with { runtime: 'shared' }` Import Attributes

## Context

The SWC worklet transform (`@lynx-js/react/transform`) already supports `with { runtime: 'shared' }` import attributes — it preserves the import in LEPUS output and skips capturing shared identifiers as closure variables. However, Vue Lynx's MT loader strips too aggressively, discarding both the shared import statement and the shared module's code.

**Root cause**: `worklet-loader-mt.ts` extracts only `registerWorkletInternal(...)` calls from the LEPUS output and converts all imports to bare side-effect imports. This loses:
1. Named specifiers from shared imports (the importing file)
2. Module code from shared module files (since they have no `'main thread'` directive)

**ReactLynx comparison**: ReactLynx's MT loader simply returns the full LEPUS output — no aggressive stripping. Vue Lynx strips to avoid pulling Vue component code into the MT bundle, which is necessary but over-broad.

## What already works (no changes needed)

| Layer | Status |
|-------|--------|
| **SWC transform** — `is_shared_runtime_import()` detects `with { runtime: 'shared' }`, adds identifiers to `shared_identifiers` HashSet, skips them during variable extraction | Already works — same `@lynx-js/react/transform` SWC plugin |
| **LEPUS output** — preserves `import { fn } from './utils' with { runtime: 'shared' }` and `registerWorkletInternal(...)` body references shared identifiers directly | Already works |
| **JS output** — shared identifiers NOT captured in `_c` closure object, import preserved | Already works |

## Implementation

### Step 1: `plugin/src/loaders/worklet-utils.ts` — Extract shared imports

Add `extractSharedImports(source: string): string` that:
- Finds import statements containing `with { runtime: 'shared' }` or `with { runtime: "shared" }`
- Preserves them in full (with named specifiers and attributes)
- Returns the concatenated shared import statements

Update `extractLocalImports()` to **skip** imports that have `with { runtime: ... }` — these are handled by `extractSharedImports()` and should not be converted to bare side-effect imports.

### Step 2: `plugin/src/loaders/worklet-loader-mt.ts` — Include shared imports in output

In both code paths (vue sub-modules and regular JS/TS):
- After LEPUS transform, call `extractSharedImports()` on the **LEPUS output**
- Final output = shared imports + local imports + registrations (+ dummy export for vue sub-modules)

### Step 3: `plugin/src/entry.ts` — Pass through shared modules on MT layer

Add a module rule **before** `vue:worklet-mt` that matches files imported with `{ runtime: 'shared' }` on the MT layer and skips the worklet-loader-mt. This allows the shared module's code (plain functions) to be available on the MT side.

Approach: use rspack's `module.rule` with a `with` condition:
```ts
chain.module
  .rule('vue:shared-runtime-mt')
  .issuerLayer(LAYERS.MAIN_THREAD)
  .test(/\.[cm]?[jt]sx?$/)
  .merge({ with: { runtime: 'shared' } })
  // No loader → file passes through as regular JS
```

If rspack doesn't support `rule.with`, fallback: check `this._module?.resourceResolveData` in the loader, or use a custom condition.

### Step 4: Rebuild plugin, add example + docs

- Rebuild vue-lynx plugin
- Add `examples/main-thread/src/shared-module/` with `color-utils.ts` (plain functions, no `'main thread'`) and `App.vue` using `import ... with { runtime: 'shared' }`
- Add "Cross-Thread Shared Modules" section to `website/docs/guide/main-thread-script.mdx`

## Verification

1. `pnpm build` — Rebuild vue-lynx (plugin + runtime)
2. `pnpm --filter vue-lynx-example-main-thread build` — All examples must build
3. Test in web preview or LynxExplorer: tap the shared-module box, verify color cycling works
4. Verify existing examples still work
