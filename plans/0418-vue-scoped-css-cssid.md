# Vue Scoped CSS via Lynx cssId Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `<style scoped>` work in Vue SFCs by bridging Vue's scope hash to Lynx's native `cssId` system.

**Architecture:** Vue's scope hash (`data-v-{8hex}`) is converted to a numeric cssId used at both build-time (`@cssId` wrapping in extracted CSS) and runtime (`__SetCSSId` on elements). A strip loader removes `[data-v-xxx]` attribute selectors that Lynx cannot parse. A webpack plugin injects `?cssId=<N>` into vue scoped style module queries so `@lynx-js/css-extract-webpack-plugin` automatically wraps the CSS.

**Tech Stack:** rspack/webpack plugin API, custom loaders, `@lynx-js/css-extract-webpack-plugin` cssId mechanism, Vue `__scopeId` runtime API.

**Base branch:** `feat/vue-scoped-css` (PR #151). The PR already has correct runtime code (scope-bridge, SET_SCOPE_ID op, ops-apply handler). This plan fixes the build-time pipeline and cleans up.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `plugin/src/loaders/vue-scope-strip-loader.ts` | **Create** | Strip `[data-v-xxx]` from CSS source text |
| `plugin/src/plugins/vue-scoped-cssid-plugin.ts` | **Create** | Inject `?cssId=<N>` into vue scoped style module queries |
| `plugin/src/css.ts` | **Modify** | Wire strip loader into BG-layer CSS rules |
| `plugin/src/entry.ts` | **Modify** | Wire cssId plugin; remove stale `cssPlugins: []` |
| `plugin/rslib.config.ts` | **Modify** | Remove unused `@lynx-js/css-serializer` external |
| `plugin/src/postcss-plugins/vue-scope-selector-plugin.ts` | **Delete** | Replaced by strip loader |
| `package.json` | **Modify** | Remove unused deps (`postcss`, `@lynx-js/css-serializer`, `@types/css-tree`) |
| `plans/vue-scoped-css-implementation.md` | **Delete** | Stale design doc |
| `runtime/src/scope-bridge.ts` | Keep | Already correct on PR branch |
| `runtime/src/node-ops.ts` | Keep | Already correct on PR branch |
| `runtime/src/shadow-element.ts` | Keep | Already correct on PR branch |
| `internal/src/ops.ts` | Keep | Already correct on PR branch |
| `main-thread/src/ops-apply.ts` | Keep | Already correct on PR branch |

All paths below are relative to `packages/vue-lynx/`.

---

### Task 1: Create the strip loader

A minimal webpack loader that removes `[data-v-xxx]` attribute selectors from CSS text. This runs after `stylePostLoader` (which adds them) and before `css-loader`.

**Files:**
- Create: `plugin/src/loaders/vue-scope-strip-loader.ts`

- [ ] **Step 1: Create the strip loader**

```typescript
// plugin/src/loaders/vue-scope-strip-loader.ts

// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Webpack loader that strips Vue scoped CSS attribute selectors.
 *
 * Vue's `<style scoped>` compiles `.foo` → `.foo[data-v-8f634878]`.
 * Lynx's CSS engine does not support attribute selectors, so we strip
 * them here.  Scoping is handled by Lynx's native `cssId` mechanism
 * instead (see vue-scoped-cssid-plugin.ts).
 *
 * Runs in the loader chain between stylePostLoader and css-loader.
 */
export default function vueScopeStripLoader(source: string): string {
  if (!source.includes('[data-v-')) return source;
  return source.replace(/\[data-v-[a-f0-9]+\]/g, '');
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/src/loaders/vue-scope-strip-loader.ts
git commit -m "feat(scoped-css): add strip loader to remove [data-v-xxx] from CSS"
```

---

### Task 2: Create the cssId injection plugin

A webpack/rspack plugin that intercepts vue scoped style module resolution and appends `&cssId=<N>` to the resource query. The `@lynx-js/css-extract-webpack-plugin` loader reads this query param and wraps the CSS in `@cssId "<N>" "<file>" { ... }`.

**Files:**
- Create: `plugin/src/plugins/vue-scoped-cssid-plugin.ts`

**Reference:** The CssExtract loader reads cssId at `lib/loader.js:44`:
```js
const { cssId: rawCssId } = parseQuery(this.resourceQuery);
```

- [ ] **Step 1: Create the cssId injection plugin**

```typescript
// plugin/src/plugins/vue-scoped-cssid-plugin.ts

// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Webpack/Rspack plugin that injects `?cssId=<N>` into Vue scoped style
 * module queries.
 *
 * Vue-loader generates style imports with query:
 *   `?vue&type=style&index=0&id=8f634878&scoped=true&lang.css`
 *
 * This plugin intercepts module resolution and appends `&cssId=<N>` where
 * N = parseInt(id, 16).  The `@lynx-js/css-extract-webpack-plugin` loader
 * reads `cssId` from the query and wraps the CSS in `@cssId "<N>" { ... }`.
 *
 * At runtime, `scope-bridge.ts` computes the same N from the component's
 * `__scopeId` and calls `__SetCSSId([el], N)`, completing the bridge.
 */

const PLUGIN_NAME = 'lynx:vue-scoped-cssid';

/**
 * Parse the Vue scope hash from a resource query string.
 * Returns the numeric cssId, or null if not a Vue scoped style.
 */
function extractCssIdFromQuery(query: string): number | null {
  if (!query.includes('type=style') || !query.includes('scoped')) return null;
  if (query.includes('cssId=')) return null; // already injected
  const match = query.match(/[?&]id=([a-f0-9]+)/);
  if (!match) return null;
  return parseInt(match[1], 16);
}

/** Minimal compiler typing (avoids importing @rspack/core). */
interface MinimalCompiler {
  hooks: {
    normalModuleFactory: {
      tap(
        name: string,
        callback: (nmf: MinimalNMF) => void,
      ): void;
    };
  };
}

interface MinimalNMF {
  hooks: {
    afterResolve: {
      tap(
        name: string,
        callback: (resolveData: ResolveData) => void,
      ): void;
    };
  };
}

interface ResolveData {
  createData: {
    resource?: string;
    resourceQuery?: string;
    settings?: { sideEffects?: boolean };
  };
}

export class VueScopedCSSIdPlugin {
  apply(compiler: MinimalCompiler): void {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {
      nmf.hooks.afterResolve.tap(PLUGIN_NAME, (resolveData) => {
        const query = resolveData.createData?.resourceQuery ?? '';
        const cssId = extractCssIdFromQuery(query);
        if (cssId !== null) {
          resolveData.createData.resourceQuery = query + `&cssId=${cssId}`;
        }
      });
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add plugin/src/plugins/vue-scoped-cssid-plugin.ts
git commit -m "feat(scoped-css): add webpack plugin to inject cssId into vue style queries"
```

---

### Task 3: Wire strip loader into the CSS pipeline

Add the strip loader to all CSS rule chains for the BACKGROUND layer. The loader must run **after** `stylePostLoader` (which adds `[data-v-xxx]`) and **before** `css-loader` (which parses CSS).

In the webpack chain, loaders listed later execute earlier in normal (non-pitch) phase:
```
chain order:     CssExtract → css-loader → vue-scope-strip-loader
normal execution: vue-scope-strip-loader → css-loader → CssExtract
with pitcher:     stylePostLoader → vue-scope-strip-loader → css-loader → CssExtract
```

**Files:**
- Modify: `plugin/src/css.ts`

- [ ] **Step 1: Add strip loader to CSS rules**

In `plugin/src/css.ts`, inside the `cssRules.forEach` callback (around line 69), after the CssExtract loader setup for the BACKGROUND layer, add the strip loader:

```typescript
// At the top of the file, after existing imports:
// (no new imports needed — we use path.resolve which is already imported)

// Inside the forEach callback, after the CssExtract loader block:
//   rule
//     .issuerLayer(LAYERS.BACKGROUND)
//     .use(CHAIN_ID.USE.MINI_CSS_EXTRACT)
//     .loader(CssExtractPlugin.loader)
//     .end();
// ADD:

          // Strip [data-v-xxx] attribute selectors from Vue scoped CSS.
          // Lynx's CSS engine doesn't support attribute selectors; scoping
          // is handled by the cssId mechanism instead.
          rule
            .use('vue-scope-strip')
            .after(CHAIN_ID.USE.CSS)
            .loader(
              path.resolve(_dirname, './loaders/vue-scope-strip-loader'),
            )
            .end();
```

The `.after(CHAIN_ID.USE.CSS)` places this loader after `css-loader` in the chain definition, which means it executes **before** `css-loader` in normal phase.

- [ ] **Step 2: Verify the enableRemoveCSSScope change is present**

Confirm that the CssExtractPlugin `.tap()` block (around line 147) has `enableRemoveCSSScope: false` (already done on the PR branch). This preserves `@cssId` scope boundaries in the encoded template.

- [ ] **Step 3: Commit**

```bash
git add plugin/src/css.ts
git commit -m "feat(scoped-css): wire strip loader into BG-layer CSS rules"
```

---

### Task 4: Wire cssId plugin and clean up entry.ts

Add `VueScopedCSSIdPlugin` to the webpack chain and remove the stale `cssPlugins: []` override.

**Files:**
- Modify: `plugin/src/entry.ts`

- [ ] **Step 1: Import and register the plugin**

At the top of `entry.ts`, add the import:

```typescript
import { VueScopedCSSIdPlugin } from './plugins/vue-scoped-cssid-plugin.js';
```

In the `api.modifyBundlerChain` callback (around line 365), after the `VueMarkMainThreadPlugin` registration block (around line 521), add:

```typescript
    // ------------------------------------------------------------------
    // VueScopedCSSIdPlugin – inject ?cssId=<N> into vue scoped style
    // module queries so css-extract-webpack-plugin wraps CSS in @cssId.
    // ------------------------------------------------------------------
    if (isLynx || isWeb) {
      chain
        .plugin('lynx:vue-scoped-cssid')
        .use(VueScopedCSSIdPlugin, [])
        .end();
    }
```

- [ ] **Step 2: Verify enableRemoveCSSScope is false**

Confirm the LynxTemplatePlugin config (around line 503) has `enableRemoveCSSScope: false` (already done on the PR branch).

- [ ] **Step 3: Commit**

```bash
git add plugin/src/entry.ts
git commit -m "feat(scoped-css): register VueScopedCSSIdPlugin in entry pipeline"
```

---

### Task 5: Clean up unused code and dependencies

Remove files and dependencies that were leftover from the earlier class-rewrite approach.

**Files:**
- Delete: `plugin/src/postcss-plugins/vue-scope-selector-plugin.ts`
- Delete: `plans/vue-scoped-css-implementation.md`
- Modify: `plugin/rslib.config.ts` (remove `@lynx-js/css-serializer` external)
- Modify: `package.json` (remove `postcss`, `@lynx-js/css-serializer`, `@types/css-tree`)

- [ ] **Step 1: Delete dead PostCSS plugin**

```bash
rm plugin/src/postcss-plugins/vue-scope-selector-plugin.ts
# Remove parent dir if empty
rmdir plugin/src/postcss-plugins 2>/dev/null || true
```

- [ ] **Step 2: Delete stale plan file**

```bash
rm plans/vue-scoped-css-implementation.md
```

- [ ] **Step 3: Remove `@lynx-js/css-serializer` from rslib externals**

In `plugin/rslib.config.ts`, remove the line:
```
      '@lynx-js/css-serializer',
```

- [ ] **Step 4: Remove unused dependencies from package.json**

Remove from `dependencies`:
- `"@lynx-js/css-serializer": "^0.1.0"`
- `"postcss": "^8.4.0"`

Remove from `devDependencies`:
- `"@types/css-tree": "^2.3.11"`

- [ ] **Step 5: Reinstall to update lockfile**

```bash
pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(scoped-css): remove unused deps and dead code"
```

---

### Task 6: Build and verify end-to-end

Verify the complete data flow: build-time CSS wrapping and runtime cssId matching.

**Files:** None (verification only)

- [ ] **Step 1: Build the vue-lynx package**

```bash
cd packages/vue-lynx && pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run existing tests**

```bash
cd /Users/bytedance/github/vue-lynx && pnpm test
```

Expected: All 46 tests pass.

- [ ] **Step 3: Build the css-features example (if it exists with scoped styles)**

```bash
cd examples/css-features && pnpm build 2>&1 | head -50
```

If the example has a `<style scoped>` component, inspect the build output to verify:

1. **CSS output contains `@cssId` wrapping:**
   ```bash
   # In the build output directory, search for @cssId in CSS chunks
   grep -r '@cssId' examples/css-features/dist/ || echo "No @cssId found"
   ```
   Expected: `@cssId "<N>" "<file>" { ... }` appears for scoped styles, where N is a number derived from the Vue scope hash.

2. **CSS selectors do NOT contain `[data-v-xxx]`:**
   ```bash
   grep -r 'data-v-' examples/css-features/dist/ || echo "No data-v- found (good)"
   ```
   Expected: No `[data-v-xxx]` attribute selectors in the CSS output.

- [ ] **Step 4: Verify cssId alignment**

For a component with `<style scoped>`, check that the build-time and runtime cssId match:

1. Find the scope hash from the build output or vue-loader debug:
   ```
   # In a .vue file with <style scoped>, the vue-loader assigns id=XXXXXXXX
   # e.g., id=8f634878
   ```

2. Verify: `parseInt('8f634878', 16)` matches the number in `@cssId "<N>"` in the CSS output.

3. Verify: The same conversion happens at runtime in `scope-bridge.ts:scopeIdToCssId()`.

- [ ] **Step 5: Verify the NormalModuleFactory hook works**

If `@cssId` wrapping is missing from the build output, the `afterResolve` hook may not be firing correctly in rspack. Debug by adding a temporary `console.log` in `vue-scoped-cssid-plugin.ts`:

```typescript
nmf.hooks.afterResolve.tap(PLUGIN_NAME, (resolveData) => {
  const query = resolveData.createData?.resourceQuery ?? '';
  if (query.includes('type=style')) {
    console.log('[VueScopedCSSIdPlugin] query:', query);
  }
  // ... rest of handler
});
```

If the hook fires but `createData.resourceQuery` modification doesn't propagate, try alternative hooks:
- `nmf.hooks.createModule` — fires after `afterResolve`, receives `(createData, resolveData)`
- `compiler.hooks.compilation` → `NormalModule.getCompilationHooks(compilation).beforeLoaders` — fires right before loaders execute

---

## Data Flow Summary

```
Build-time:
  Component.vue (<style scoped>)
    ↓ vue-loader: generates style import with ?id=8f634878&scoped=true
    ↓ VueScopedCSSIdPlugin: appends &cssId=2405271672 to query
    ↓ stylePostLoader: adds [data-v-8f634878] to selectors
    ↓ vue-scope-strip-loader: strips [data-v-8f634878] from selectors
    ↓ css-loader: processes clean CSS
    ↓ CssExtract loader: reads ?cssId=2405271672, wraps in @cssId "2405271672"
    ↓ LynxTemplatePlugin (enableRemoveCSSScope: false): preserves @cssId scopes

Runtime:
  createElement('view')
    ↓ getCurrentScopeId() → "data-v-8f634878" (from component.__scopeId)
    ↓ scopeIdToCssId("data-v-8f634878") → parseInt('8f634878', 16) = 2405271672
    ↓ pushOp(SET_SCOPE_ID, el.id, 2405271672)
    ↓ ops-apply: __SetCSSId([el], 2405271672)
    ↓ Lynx engine: element sees CSS rules from @cssId "2405271672" scope
```

Both sides produce `2405271672`. Scoping works.

---

## Post-Implementation Notes (2026-04-20)

### Deviations from Plan

The final implementation diverges from the plan in two key areas:

1. **Strip mechanism**: Instead of a webpack loader (`vue-scope-strip-loader.ts`), we use a **CSS AST plugin** (`vue-scope-strip-css-plugin.ts`) passed via the `cssPlugins` option to both `CssExtractPlugin` and `LynxTemplatePlugin`. This operates on the css-tree AST during template encoding, which is more robust than regex replacement on source text.

2. **cssId injection hook**: Instead of `normalModuleFactory.hooks.afterResolve` (plan), the plugin uses `NormalModule.getCompilationHooks(compilation).loader` which fires when the loaderContext is created, before any loader/pitch runs. This lets us patch `this.resourceQuery` directly on the shared loaderContext object, which the CssExtract loader then reads via `parseQuery(this.resourceQuery)`.

### Removed: `css-extract-wrapper-loader.ts`

An intermediate iteration added a pitch-based wrapper loader (placed before CssExtract in the chain) as an alternative cssId injection mechanism. Debugging revealed it never saw scoped style module requests -- likely because vue-loader's pitcher constructs inline loader chains for scoped styles that bypass rule-based loader matching. The `VueScopedCSSIdPlugin` (which hooks at a lower level) is the working mechanism. The wrapper loader was removed as dead code.

### Verified Behavior

- `VueScopedCSSIdPlugin` fires for scoped style modules and injects `&cssId=<N>`
- CssExtract loader receives the patched `resourceQuery` and wraps CSS in `@cssId`
- Template encoder produces `styleInfo[<cssId>]` with imports referencing global + scoped CSS
- Runtime `scopeIdToCssId()` computes the same numeric cssId from `__scopeId`
- `[data-v-xxx]` attribute selectors are stripped from the final CSS output
