# Shared VDOM/Vapor Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Share VDOM/Vapor mode across all supported `<Go>` previews and switch bundles without refreshing the documentation page.

**Architecture:** A focused external store owns the requested browser mode and URL synchronization. Each `<Go>` subscribes with `useSyncExternalStore`, derives an entry-specific effective mode, and passes swapped metadata into the already reactive `GoBase` preview. One control in the Rspress navigation changes the preference; individual previews expose only their effective renderer and fallback reason.

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

- [ ] **Step 3: Integrate the store and global navigation control**

Replace local `mode` state and `window.location.assign` with `useSyncExternalStore(renderModeStore.subscribe, renderModeStore.getSnapshot, renderModeStore.getServerSnapshot)`. Initialize only the entry from `go-entry`, derive the current effective mode from entry support and bundle availability, and continue passing transformed metadata to `GoBase`. Mount the only VDOM/Vapor control in the Rspress navigation and call `renderModeStore.setMode(nextMode)` there. Each preview reports its actual `VDOM` or `Vapor` renderer; unsupported entries report localized `VDOM only` reasons and never render another switch.

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

Start the built website preview, open a page containing at least two supported `<Go>` previews, and assert that the navigation contains the only renderer control and no page/entry-level mode buttons exist. Increment an example, switch the global control to Vapor, and assert that every supported status changes to `Vapor`, each `<lynx-view>.url` changes from `dist` to `dist-vapor`, and the example runtime resets while the document sentinel, `<Go>` shell, scroll position, and history length remain unchanged. Confirm the keyed inner `<lynx-view>` is replaced without disposal errors, switch back to VDOM, and verify the reverse URL change. Verify an unsupported entry remains on `dist` with `VDOM only`, then inspect English/Chinese, light/dark, desktop/mobile presentation.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check && git diff -- website/src/components/go website/package.json docs/superpowers`

Expected: no whitespace errors and only scoped implementation, tests, scripts, and design documentation are present.
