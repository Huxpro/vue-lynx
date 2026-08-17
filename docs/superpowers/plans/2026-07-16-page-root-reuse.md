# Explicit Page Root Reuse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an explicit outermost `<page>` reuse Vue Lynx's automatically-created Lynx page root, including its attributes and events, without creating a second native page element.

**Architecture:** Treat `<page>` as a Vue Lynx built-in component at compile time. The component renders its slot transparently into the existing `ShadowElement` root and diffs its attributes through the existing `nodeOps.patchProp` pipeline, matching ReactLynx's compiler-plus-runtime approach. Keep `h('page')` consistent by routing it to the same built-in component.

**Tech Stack:** Vue 3 custom renderer, `@vue/compiler-core`, Rsbuild Vue plugin, Vitest, Lynx Element PAPI.

---

### Task 1: Add regression coverage

**Files:**
- Create: `packages/upstream-tests/src/page-root.spec.ts`
- Modify: `packages/upstream-tests/package.json`
- Modify: `packages/upstream-tests/vitest.local.config.ts`

- [x] **Step 1: Write the failing runtime test**

Render `h('page', { class, style, onTap }, children)` through `createApp`, then assert the flushed ops target reserved root id `1`, contain no `OP.CREATE` for type `page`, and insert the children directly into id `1`.

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter vue-lynx-upstream-tests exec vitest run --config vitest.local.config.ts src/page-root.spec.ts`

Expected: FAIL because the current `h('page')` path emits `OP.CREATE` for a second page element.

- [x] **Step 3: Write the failing compiler test**

Compile `<page class="app"><view /></page>` with the exported Vue Lynx compiler options and assert the generated render function imports and uses the `Page` built-in instead of calling `createElementBlock("page", ...)`.

- [x] **Step 4: Run the compiler test to verify it fails**

Run the same targeted Vitest command.

Expected: FAIL because `pluginVueLynx` currently sets `isNativeTag: () => true` and has no page built-in helper.

### Task 2: Implement the Page built-in

**Files:**
- Create: `packages/vue-lynx/runtime/src/Page.ts`
- Modify: `packages/vue-lynx/runtime/src/index.ts`
- Modify: `packages/vue-lynx/plugin/src/index.ts`

- [x] **Step 1: Add the runtime component**

Create an internal `Page` component with `inheritAttrs: false`. Inject the current page root, diff current and previous attributes through `nodeOps.patchProp`, expose the root for refs, report multiple mounted page wrappers in development, clear attributes on unmount, and return only `slots.default?.()`.

- [x] **Step 2: Provide the reserved root and route render-function calls**

Provide the page root before `internalApp.mount(root)`, export `Page`, and wrap the exported `h` so string type `page` becomes the `Page` component.

- [x] **Step 3: Add compiler recognition**

Export the compiler options used by `pluginVueLynx` and rewrite lowercase `page` AST nodes to the registered `VueLynxPage` component before code generation.

- [x] **Step 4: Run targeted tests to green**

Run: `pnpm --filter vue-lynx-upstream-tests exec vitest run --config vitest.local.config.ts src/page-root.spec.ts`

Expected: all explicit-page tests pass with no `CREATE page` op.

### Task 3: Cover updates and invalid usage

**Files:**
- Modify: `packages/upstream-tests/src/page-root.spec.ts`

- [x] **Step 1: Add failing update/removal tests**

Assert reactive class/style/event changes target id `1`, removed attributes are cleared, switching from `<page>` to another root clears page props, and unmount removes page event registrations.

- [x] **Step 2: Add failing multiple-page test**

Render nested page wrappers and assert Vue Lynx reports the one-page-only contract while never emitting a native page creation op.

- [x] **Step 3: Implement only the lifecycle behavior required by those tests**

Keep page ownership in app-scoped state so separate apps/tests do not share a module-global mounted flag.

- [x] **Step 4: Run the targeted suite to green**

Run the same targeted Vitest command and confirm zero failures and warnings other than the explicitly captured multiple-page diagnostic.

### Task 4: Document explicit and implicit page roots

**Files:**
- Modify: `website/docs/guide/vue-compatibility.mdx`
- Modify: `website/docs/zh/guide/vue-compatibility.mdx`
- Modify: `website/docs/guide/hackernews.mdx`
- Modify: `website/docs/zh/guide/hackernews.mdx`

- [x] **Step 1: Add bilingual page-root documentation**

Document that the page wrapper is optional, explicit `<page>` must be outermost and unique, attributes/events are forwarded to the native root, `page`/`:root` selectors work when omitted, and Lynx controls page dimensions.

- [x] **Step 2: Add the HackerNews regression note**

Explain that both HackerNews variants intentionally keep an explicit `<page>` so root-level styling is applied without creating a second native element.

### Task 5: Verify the complete change

**Files:**
- Verify all modified files.

- [x] **Step 1: Run local Vue Lynx tests**

Run: `pnpm --filter vue-lynx-upstream-tests run test:local`

- [x] **Step 2: Run the full BG-to-MT DOM pipeline tests**

Run: `pnpm --filter vue-lynx-upstream-tests run test:dom`

- [x] **Step 3: Build packages and affected examples**

Run: `pnpm build`

Run: `pnpm --filter @vue-lynx-example/hackernews-css run build`

Run: `pnpm --filter @vue-lynx-example/hackernews run build`

- [x] **Step 4: Inspect generated bundles**

Verify the HackerNews bundles contain exactly the framework-created `__CreatePage` path and no ordinary `__CreateElement('page', ...)` path for the app root.

- [x] **Step 5: Run Lynx Explorer regression**

Restart the dev server and LynxExplorer after clearing caches, load both HackerNews variants, and confirm there is no error code `9901` and the root styling/rendering is correct.

- [x] **Step 6: Run formatting/lint checks and review the diff**

Run focused formatting/lint commands, inspect `git diff --check`, and verify every requirement above has authoritative evidence.
