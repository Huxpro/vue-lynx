# Example Benchmark Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Elk under the website Benchmark section after AI Chat and relocate both examples' AI design context into their owning example directories.

**Architecture:** Integrate current `origin/main` into the published PR #196 branch with a merge commit, preserving AI Chat while keeping the PR history stable. A small Node source-contract test owns the bilingual sidebar ordering and example-local `.impeccable.md` invariants; Rspress and Elk production builds provide integration coverage.

**Tech Stack:** Git, Node.js test runner, TypeScript Rspress config, pnpm, Rspeedy.

---

## File Map

- `website/scripts/benchmark-navigation.test.mjs`: regression contract for bilingual ordering, Showcase removal, and example-local design files.
- `website/package.json`: exposes the focused navigation test command.
- `website/rspress.config.ts`: bilingual Benchmark sidebar entries.
- `examples/elk/.impeccable.md`: Elk-specific design context moved from the repository root.
- `examples/ai-chat/.impeccable.md`: AI Chat-specific design context moved from the repository root after merging `main`.
- `docs/superpowers/plans/2026-07-14-example-benchmark-navigation.md`: this execution record.

### Task 1: Lock the ownership and navigation contract

**Files:**
- Create: `website/scripts/benchmark-navigation.test.mjs`
- Modify: `website/package.json`

- [ ] **Step 1: Add the focused test command**

Add `"test:navigation": "node --test scripts/benchmark-navigation.test.mjs"` to `website/package.json`.

- [ ] **Step 2: Write the failing source-contract test**

The test reads `website/rspress.config.ts`, asserts the English and Chinese sequences contain `HackerNews`, `AI Chat`, then Elk; asserts no Showcase section remains; and verifies `examples/elk/.impeccable.md` plus `examples/ai-chat/.impeccable.md` exist while the root `.impeccable.md` does not.

- [ ] **Step 3: Run the test and verify RED**

Run: `pnpm --dir website test:navigation`

Expected: FAIL because both example-local context paths and the merged AI Chat + Elk sidebar order do not yet exist.

### Task 2: Move Elk context before integrating main

**Files:**
- Delete: `.impeccable.md`
- Create: `examples/elk/.impeccable.md`

- [ ] **Step 1: Move the Elk design context without changing its contents**

Use `apply_patch` to add the existing content at `examples/elk/.impeccable.md` and delete the root file.

- [ ] **Step 2: Commit the conflict-prevention move and test harness**

```bash
git add website/package.json website/scripts/benchmark-navigation.test.mjs .impeccable.md examples/elk/.impeccable.md docs/superpowers/plans/2026-07-14-example-benchmark-navigation.md
git commit -m "test(website): lock benchmark navigation ownership"
```

### Task 3: Integrate main and localize AI Chat context

**Files:**
- Merge: `origin/main`
- Delete: `.impeccable.md`
- Create: `examples/ai-chat/.impeccable.md`

- [ ] **Step 1: Merge the current main branch**

Run: `git merge --no-edit origin/main`

Expected: merge succeeds because Elk's conflicting root context was moved first; AI Chat and current website dependencies enter the PR branch.

- [ ] **Step 2: Move AI Chat's design context without changing its contents**

Use `apply_patch` to add the merged root content at `examples/ai-chat/.impeccable.md` and delete the root file.

### Task 4: Put Elk after AI Chat in both sidebars

**Files:**
- Modify: `website/rspress.config.ts`

- [ ] **Step 1: Update the English Benchmark list**

Keep `AI Chat` and add `{ text: 'Elk (Mastodon Client)', link: '/guide/elk' }` immediately after it. Remove the Showcase divider/header block.

- [ ] **Step 2: Update the Chinese Benchmark list**

Keep `AI Chat` and add `{ text: 'Elk（Mastodon 客户端）', link: '/zh/guide/elk' }` immediately after it. Remove the 案例展示 divider/header block.

- [ ] **Step 3: Run the focused test and verify GREEN**

Run: `pnpm --dir website test:navigation`

Expected: all navigation and ownership assertions pass.

- [ ] **Step 4: Commit the integrated result**

```bash
git add . website/rspress.config.ts examples/ai-chat/.impeccable.md
git commit -m "feat(website): classify Elk as a benchmark"
```

### Task 5: Verify and publish PR #196

**Files:**
- Verify: `website/dist/`
- Verify: `examples/elk/dist/main.lynx.bundle`

- [ ] **Step 1: Run focused and production verification**

```bash
pnpm --dir website test:navigation
pnpm --dir website build
pnpm --dir examples/elk test:native-compat
pnpm --dir examples/elk build
git diff --check
```

Expected: all commands exit 0; the website and Lynx bundle build successfully.

- [ ] **Step 2: Push the existing PR head**

Run: `git push origin HEAD:claude/elk-vue-lynx-port-rh9gpd`

- [ ] **Step 3: Verify remote deployment**

Wait for `gh pr checks 196 --repo Huxpro/vue-lynx --watch --interval 10`, then request the Vercel `/guide/elk` page and `/examples/elk/dist/main.lynx.bundle`. Confirm both return HTTP 200 and the PR is mergeable against `main`.
