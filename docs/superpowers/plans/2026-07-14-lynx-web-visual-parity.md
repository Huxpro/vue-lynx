# Lynx for Web Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pairwise VDOM/Vapor screenshot gating for all supported examples and correct Vapor static inline-style normalization.

**Architecture:** A pure PNG comparison module owns image decoding and diff generation while `verify-web.mjs` owns capture, stabilization, and result reporting. A shared runtime style-normalization module feeds both the VDOM patch path and Vapor template attribute parser so their `SET_STYLE` payloads match.

**Tech Stack:** Node.js ESM, Playwright, pixelmatch, pngjs, Vitest, Vue Vapor, Vue Lynx ShadowElement ops.

---

### Task 1: Specify PNG pair comparison

**Files:**
- Create: `packages/example-harness/src/visual-diff.mjs`
- Create: `packages/example-harness/tests/visual-diff.spec.mjs`
- Modify: `packages/example-harness/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Write failing unit tests**

Create two small in-memory PNGs with `pngjs`. Assert that identical images
return `matches: true`, while a changed rectangle returns `matches: false`, a
non-zero `diffPixels`, the expected ratio, and a PNG diff buffer.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter vue-lynx-example-harness test -- visual-diff.spec.mjs`

Expected: FAIL because `src/visual-diff.mjs` does not exist.

- [ ] **Step 3: Implement the minimal comparator**

Add `pixelmatch` and `pngjs` dependencies. Implement
`comparePngBuffers(vdom, vapor, { threshold, maxDiffRatio })`, reject unequal
dimensions, encode a diff PNG, and return pixel counts and ratio.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm --filter vue-lynx-example-harness test -- visual-diff.spec.mjs`

Expected: all visual-diff tests pass.

### Task 2: Prove and correct static inline-style normalization

**Files:**
- Create: `packages/vue-lynx/runtime/src/style-normalization.ts`
- Modify: `packages/vue-lynx/runtime/src/node-ops.ts`
- Modify: `packages/vue-lynx/runtime/src/tree-ops.ts`
- Modify: `packages/upstream-tests/src/vapor/vapor-sfc-e2e.spec.ts`
- Modify: `packages/testing-library/src/__tests__/styles.test.ts`

- [ ] **Step 1: Add failing runtime assertions**

Compile a Vapor SFC containing
`:style="{ padding: 16, marginBottom: 12, flex: 1, opacity: 0.5 }"` and assert
that its first `SET_STYLE` payload contains `padding: '16px'`,
`marginBottom: '12px'`, `flex: '1'`, and `opacity: '0.5'` with no kebab-case
keys.

- [ ] **Step 2: Run the focused runtime test and verify RED**

Run: `pnpm --filter vue-lynx-upstream-tests test:local -- vapor-sfc-e2e.spec.ts`

Expected: FAIL because static Vapor styles contain kebab-case keys and bare
dimension values.

- [ ] **Step 3: Implement shared normalization**

Move the dimensionless-property list and numeric conversion into
`style-normalization.ts`. Export object normalization for VDOM and declaration
normalization for parsed CSS text. Make `parseInlineStyle()` camelize property
names and apply the same numeric-unit policy before an inert Vapor template is
cloned.

- [ ] **Step 4: Verify GREEN and VDOM compatibility**

Run:

```bash
pnpm --filter vue-lynx-upstream-tests test:local -- vapor-sfc-e2e.spec.ts
pnpm --filter vue-lynx-testing-library test -- styles.test.ts
```

Expected: both focused suites pass.

### Task 3: Gate web parity with paired screenshots

**Files:**
- Modify: `packages/example-harness/src/verify-web.mjs`
- Modify: `packages/example-harness/src/scenarios.mjs`
- Modify: `packages/example-harness/tests/verify-web.spec.mjs`

- [ ] **Step 1: Add failing harness contract tests**

Assert that visual comparison metadata marks a result failed when its diff
ratio exceeds 0.001, keeps both functional checkpoints, and names the VDOM,
Vapor, and diff artifacts deterministically from the entry id.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter vue-lynx-example-harness test -- verify-web.spec.mjs`

Expected: FAIL because visual parity helpers are not exported.

- [ ] **Step 3: Implement capture and reporting**

Capture the `lynx-view` element after scenario actions, fonts, and images settle.
Write paired PNGs under `artifacts/example-harness/visual/`, compare supported
entries after both modes run, write the diff only on failure, attach
`visualParity` details to JSON results, and set the Vapor result to failed on
visual mismatch. Keep single-mode verification functional-only because it has
no comparison peer.

- [ ] **Step 4: Verify the original regression passes**

Run:

```bash
pnpm examples:build:vapor -- --example reactivity
pnpm examples:verify:web -- --entry reactivity/main
```

Expected: VDOM and Vapor functional checks pass and visual diff ratio is at or
below 0.001.

### Task 4: Full acceptance and publication

**Files:**
- Modify only files required by failures that demonstrate a VDOM/Vapor parity
  defect; do not weaken thresholds or skip entries.

- [ ] **Step 1: Run all unit and focused runtime suites**

Run:

```bash
pnpm --filter vue-lynx-example-harness test
pnpm --filter vue-lynx-testing-library test -- styles.test.ts
pnpm --filter vue-lynx-upstream-tests test:local -- vapor-sfc-e2e.spec.ts
```

Expected: zero failures.

- [ ] **Step 2: Rebuild all Vapor examples**

Run: `pnpm examples:build:vapor`

Expected: every supported example directory builds successfully.

- [ ] **Step 3: Run all web functional and visual pairs**

Run: `pnpm examples:verify:web`

Expected: all 45 VDOM functional scenarios, all 36 supported Vapor scenarios,
the 36 visual comparisons, and the website mode toggle pass.

- [ ] **Step 4: Audit artifacts and repository state**

Inspect `artifacts/example-harness/web-all.json`, confirm every supported row
contains passing `visualParity`, run `git diff --check`, and ensure generated
build artifacts remain ignored.

- [ ] **Step 5: Commit and push**

Stage only the design, plan, runtime correction, harness, tests, and dependency
metadata. Commit with an outcome-focused message and push
`codex/pr195-native-scoped-css`.
