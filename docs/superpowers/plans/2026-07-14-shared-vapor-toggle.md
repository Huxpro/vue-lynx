# Shared VDOM/Vapor Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Share VDOM/Vapor mode across all supported `<Go>` previews and switch bundles without refreshing the documentation page.

**Architecture:** A focused external store owns the requested browser mode and URL synchronization. Each `<Go>` subscribes with `useSyncExternalStore`, derives an entry-specific effective mode, and passes swapped metadata into the already reactive `GoBase` preview.

**Tech Stack:** React 19, TypeScript, Node test runner, tsx, Rspress, `@lynx-js/go-web`

---

### Task 1: Add the shared render-mode store

**Files:**
- Create: `website/src/components/go/render-mode-store.ts`
- Create: `website/src/components/go/render-mode-store.test.ts`
- Modify: `website/package.json`

- [ ] **Step 1: Write failing store tests**

Create tests that instantiate a store with a fake browser adapter and assert that two subscribers observe the same mode, `setMode('vapor', 'example/main')` calls `history.replaceState` rather than navigation, unrelated search/hash data survives, invalid URL modes resolve to VDOM, and a synthetic popstate updates subscribers.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm --dir website test:go-mode`

Expected: FAIL because `render-mode-store.ts` and the test script do not exist.

- [ ] **Step 3: Implement the minimal store**

Export `RenderMode`, `createRenderModeStore(browser)`, and a browser singleton. The store must implement `getSnapshot`, `getServerSnapshot`, `subscribe`, `setMode`, and `destroy`; parse only `vdom`/`vapor`; write `go-mode` and optional `go-entry` with `replaceState`; and resync on `popstate`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `pnpm --dir website test:go-mode`

Expected: all render-mode store tests pass.

### Task 2: Subscribe every `<Go>` to the shared mode

**Files:**
- Modify: `website/src/components/go/Go.tsx`
- Modify: `website/src/components/go/render-mode-store.test.ts`

- [ ] **Step 1: Add failing effective-mode tests**

Add pure tests demonstrating that a requested Vapor mode maps a supported entry to Vapor and an unsupported or incomplete entry to VDOM without mutating the shared preference.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm --dir website test:go-mode`

Expected: FAIL because the effective-mode helper does not exist.

- [ ] **Step 3: Integrate the store**

Replace local `mode` state and `window.location.assign` with `useSyncExternalStore(renderModeStore.subscribe, renderModeStore.getSnapshot, renderModeStore.getServerSnapshot)`. Initialize only the entry from `go-entry`, derive the current effective mode from entry support and bundle availability, call `renderModeStore.setMode(nextMode, exampleEntry)` from the toggle, and continue passing transformed metadata to `GoBase`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm --dir website test:go-mode`

Expected: all store and effective-mode tests pass.

### Task 3: Verify the website behavior

**Files:**
- No production file changes expected

- [ ] **Step 1: Run formatting and type-aware checks**

Run: `pnpm exec biome check website/src/components/go website/package.json docs/superpowers/specs/2026-07-14-shared-vapor-toggle-design.md docs/superpowers/plans/2026-07-14-shared-vapor-toggle.md`

Expected: exit code 0.

- [ ] **Step 2: Build the website**

Run: `pnpm --dir website build`

Expected: Rspress build completes with exit code 0.

- [ ] **Step 3: Verify Lynx for Web interaction**

Start the built website preview, open a page containing at least two supported `<Go>` previews, switch one control to Vapor, and assert that both controls show Vapor, each preview requests its `dist-vapor` bundle, the page URL changes through `replaceState`, and a document-level sentinel plus scroll position remain unchanged. Switch back to VDOM and assert both previews request `dist` bundles.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check && git diff -- website/src/components/go website/package.json docs/superpowers`

Expected: no whitespace errors and only scoped implementation, tests, scripts, and design documentation are present.
