# Vapor Example Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 45 configured example entries a conclusive, evidence-backed Vapor status after real Lynx-for-Web verification, while preserving VDOM/Vapor feature parity.

**Architecture:** A checked-in JSON manifest describes every entry and its expected Vapor disposition. A focused `vue-lynx-example-harness` package validates inventory, generates isolated Vapor source overlays and builds, starts a hidden website harness route backed by `@lynx-js/web-core`, and drives each entry in Chromium. The generated result matrix feeds CI and the website's local VDOM/Vapor control.

**Tech Stack:** Node.js ESM, Vitest, Rspeedy/Rsbuild, Vue SFC compiler, Playwright Chromium, React/Rspress, `@lynx-js/web-core`.

---

## File Structure

- `examples/vapor-support.json`: checked-in entry manifest and final status evidence.
- `packages/example-harness/package.json`: package commands and harness dependencies.
- `packages/example-harness/src/manifest.mjs`: schema validation and manifest loading.
- `packages/example-harness/src/inventory.mjs`: parse all example configs and enforce 45-entry coverage.
- `packages/example-harness/src/source-graph.mjs`: reachable-source hashing and static capability checks.
- `packages/example-harness/src/vapor-overlay.mjs`: transform SFCs/imports and generate per-directory Vapor overlays/configs.
- `packages/example-harness/src/build-vapor.mjs`: build candidate and adapter entries into `dist-vapor`.
- `packages/example-harness/src/scenarios.mjs`: all 45 entry scenarios and parity checkpoints.
- `packages/example-harness/src/web-server.mjs`: prepare examples and start/stop the Rspress harness server.
- `packages/example-harness/src/verify-web.mjs`: Playwright runner, diagnostics, and result generation.
- `packages/example-harness/src/verify-status.mjs`: completion/staleness gate.
- `packages/example-harness/tests/*.spec.mjs`: inventory, transform, manifest, and result tests.
- `examples/gallery/src/vapor-adapters/{ImageCard,LikeCard}.{vue,ts}`: parity-preserving template bootstraps.
- `examples/swiper/src/vapor-adapters/{Swiper,SwiperEmpty,SwiperMTS}.{vue,ts}`: parity-preserving template bootstraps.
- `examples/networking/src/styles.ts`: shared static style object compatible with both modes.
- `website/src/components/example-harness/ExampleHarness.tsx`: hidden single-entry Lynx-for-Web host.
- `website/docs/__example-harness.mdx`: automation route.
- `website/src/components/go/Go.tsx`: entry-aware Vapor status and local mode control.
- `website/scripts/prepare-examples.mjs`: publish VDOM/Vapor bundles and matrix metadata.
- `.github/workflows/ci.yml`: Web verification job.

### Task 1: Establish the typed 45-entry inventory

**Files:**

- Create: `examples/vapor-support.json`
- Create: `packages/example-harness/package.json`
- Create: `packages/example-harness/src/manifest.mjs`
- Create: `packages/example-harness/src/inventory.mjs`
- Create: `packages/example-harness/tests/inventory.spec.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing inventory test**

The test must assert exactly 26 directories and 45 entry IDs, require one
manifest row per configured entry, reject duplicates, and reject manifest-only
entries. It must explicitly assert these multi-entry counts:

```js
expect(counts).toMatchObject({
  "7guis": 7,
  basic: 2,
  gallery: 7,
  "main-thread": 5,
  swiper: 3,
});
expect(entries).toHaveLength(45);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter vue-lynx-example-harness test -- inventory.spec.mjs`

Expected: FAIL because the harness package and manifest loader do not exist.

- [ ] **Step 3: Add the manifest schema and every entry**

Use this record shape in `examples/vapor-support.json`:

```json
{
  "version": 1,
  "entries": [
    {
      "id": "7guis/counter",
      "entry": "./src/counter/index.ts",
      "vapor": { "disposition": "candidate" },
      "scenario": "7guis-counter"
    },
    {
      "id": "basic/h-counter",
      "entry": "./src/h-counter.ts",
      "vapor": {
        "disposition": "unsupported",
        "reasonCode": "render-function",
        "evidence": ["examples/basic/src/h-counter.ts"]
      },
      "scenario": "basic-h-counter"
    }
  ],
  "results": {}
}
```

Include all 45 IDs from the design spec. Mark the 30 direct rows as
`candidate`, the six overlay rows as `adapter` with `vaporEntry`, and the nine
known gaps as `unsupported` with `reasonCode` and evidence paths.

- [ ] **Step 4: Implement config parsing and bidirectional drift checks**

`inventory.mjs` must parse `source.entry` from every `lynx.config.ts`, return
stable sorted `{id, entry}` rows, and compare both directions with the
manifest. Diagnostics must list missing, extra, and mismatched entry paths.

- [ ] **Step 5: Add root commands and run GREEN**

Add:

```json
"examples:inventory": "pnpm --filter vue-lynx-example-harness inventory"
```

Run:

```bash
pnpm install
pnpm examples:inventory
pnpm --filter vue-lynx-example-harness test
```

Expected: 26 directories, 45 entries, no drift; tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml examples/vapor-support.json packages/example-harness
git commit -m "test(examples): add entry-level Vapor inventory"
```

### Task 2: Build deterministic Vapor source overlays

**Files:**

- Create: `packages/example-harness/src/source-graph.mjs`
- Create: `packages/example-harness/src/vapor-overlay.mjs`
- Create: `packages/example-harness/tests/source-graph.spec.mjs`
- Create: `packages/example-harness/tests/vapor-overlay.spec.mjs`
- Modify: `.gitignore`

- [ ] **Step 1: Write failing graph and transform tests**

Cover:

```js
expect(graph("examples/basic/src/index.ts").files).toContain(
  "examples/basic/src/App.vue"
);
expect(transformSFC('<script setup lang="ts">')).toContain(
  '<script setup vapor lang="ts">'
);
expect(transformModule("from 'vue-lynx'")).toContain(
  "from 'vue-lynx/vapor-app'"
);
expect(() => transformSFC("<script>export default {}</script>")).toThrow(
  /Options API/
);
```

Also verify binary assets are copied byte-for-byte and `.js` specifiers resolve
to TypeScript sources where the repository uses TS-to-JS import notation.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm --filter vue-lynx-example-harness test -- source-graph.spec.mjs vapor-overlay.spec.mjs`

- [ ] **Step 3: Implement reachable graph hashing and static reason checks**

Hash file paths and bytes in stable order plus config, scenario ID, Vue version,
and Vue Lynx version. Detect `h()`, Options API, unsupported built-ins,
`v-html`, `getCurrentInstance()`, `app.config.globalProperties`, and known VDOM
component packages such as Vue Router.

- [ ] **Step 4: Implement overlay generation**

For one example directory, copy `src/` into `.vapor-generated/src`, transform
only text modules, preserve assets, and generate
`lynx.vapor.generated.config.ts` at the example root. The config must:

- include only candidate/adapter entries;
- add `vapor: true` to the existing `pluginVueLynx` options;
- write to `dist-vapor`;
- use `.vapor-generated` entry paths;
- rewrite the public asset prefix from `dist/` to `dist-vapor/`.

- [ ] **Step 5: Ignore generated work and run GREEN**

Add `.vapor-generated/`, `lynx.vapor.generated.config.ts`, and `dist-vapor/` to
the relevant root ignore rules. Run the focused tests and `git diff --check`.

- [ ] **Step 6: Commit**

```bash
git add .gitignore packages/example-harness
git commit -m "feat(examples): generate isolated Vapor build overlays"
```

### Task 3: Add parity-preserving adapters and build every candidate

**Files:**

- Create: `packages/example-harness/src/build-vapor.mjs`
- Create: `packages/example-harness/tests/build-vapor.spec.mjs`
- Create: `examples/gallery/src/vapor-adapters/*`
- Create: `examples/swiper/src/vapor-adapters/*`
- Create: `examples/networking/src/styles.ts`
- Modify: `examples/networking/src/App.vue`
- Modify: `package.json`

- [ ] **Step 1: Write the failing build-profile test**

The test builds `basic/main`, asserts both
`examples/basic/dist-vapor/main.web.bundle` and `.lynx.bundle`, and asserts
that `h-counter` is absent.

- [ ] **Step 2: Implement the six parity conversions**

Gallery adapters render the existing card component with
`furnituresPicturesSubArray[0]` inside the same wrapper classes. Swiper adapters
render the existing `Page` and corresponding `Swiper` component, pass the same
`picsArr`, duration, and main-thread easing, and preserve the same default
slot. Move networking's `styles` constant unchanged into `src/styles.ts` and
import it from the existing setup block.

- [ ] **Step 3: Implement candidate builds**

`build-vapor.mjs` accepts `--entry`, `--example`, and `--all`, generates one
overlay per directory, calls Rspeedy with the generated config, continues after
failures, and writes structured build diagnostics.

Add:

```json
"examples:build:vapor": "pnpm --filter vue-lynx-example-harness build:vapor"
```

- [ ] **Step 4: Run all Vapor builds and triage every failure**

Run: `pnpm examples:build:vapor -- --all`

For each failure, fix a real Vue Lynx Vapor defect when the API should work;
otherwise update the manifest to `unsupported` only with concrete compiler or
dependency evidence. Do not remove example behavior to obtain a pass.

- [ ] **Step 5: Re-run inventory, tests, and all builds**

Expected: every non-unsupported entry has both Vapor bundle variants; every
unsupported entry is skipped with a validated reason.

- [ ] **Step 6: Commit**

```bash
git add examples packages/example-harness package.json
git commit -m "feat(examples): build supported examples in Vapor mode"
```

### Task 4: Add the hidden Lynx-for-Web host

**Files:**

- Create: `website/src/components/example-harness/ExampleHarness.tsx`
- Create: `website/docs/__example-harness.mdx`
- Create: `website/src/components/example-harness/ExampleHarness.test.tsx`
- Modify: `website/rspress.config.ts`
- Modify: `website/scripts/prepare-examples.mjs`

- [ ] **Step 1: Write the failing host contract test**

Assert that query `bundle=/examples/basic/dist/main.web.bundle` creates one
`lynx-view`, sets its URL, installs the benchmark playground's template loader,
and publishes this browser contract:

```ts
window.__VUE_LYNX_EXAMPLE_HARNESS__ = {
  status: "loading" | "ready" | "error",
  bundle: string,
  error: string,
};
```

- [ ] **Step 2: Implement the host**

Reuse the tested public-path rewrite and missing webpack runtime shim from
`BenchPlayground`. Observe the open shadow root until it contains rendered Lynx
elements, then set status to `ready`. Capture window errors and unhandled
rejections as `error`.

- [ ] **Step 3: Publish both modes in example metadata**

Extend each template file to:

```json
{
  "name": "main",
  "file": "dist/main.lynx.bundle",
  "webFile": "dist/main.web.bundle",
  "vaporFile": "dist-vapor/main.lynx.bundle",
  "vaporWebFile": "dist-vapor/main.web.bundle",
  "vaporStatus": "candidate"
}
```

Copy `dist-vapor` and the generated result matrix into docs public assets.

- [ ] **Step 4: Run component tests and website build**

Run:

```bash
pnpm --dir website prepare-examples
pnpm --dir website build
```

Expected: hidden harness route and both bundle modes are present.

- [ ] **Step 5: Commit**

```bash
git add website
git commit -m "feat(website): add Lynx-for-Web example harness"
```

### Task 5: Drive all entries in Chromium

**Files:**

- Create: `packages/example-harness/src/scenarios.mjs`
- Create: `packages/example-harness/src/web-server.mjs`
- Create: `packages/example-harness/src/verify-web.mjs`
- Create: `packages/example-harness/tests/scenarios.spec.mjs`
- Modify: `packages/example-harness/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write failing scenario coverage tests**

Require exactly one scenario implementation for every manifest row. Require at
least one visible assertion for every scenario and at least one action for every
entry classified as interactive. Reject arbitrary sleeps; only condition-based
waits are allowed.

- [ ] **Step 2: Add Playwright and the harness server lifecycle**

Start the prepared Rspress site on a free localhost port, wait for the harness
route, launch Chromium, and always terminate browser/server in `finally`.

- [ ] **Step 3: Implement the 45 VDOM scenarios**

Cover all entries, including every `7guis`, gallery, main-thread, and swiper
sub-entry. Scenarios must exercise the feature named by the example: counters,
inputs, list mutations, slots, model updates, event modifiers, router
navigation, store mutation, query loading, transition triggers, and main-thread
interactions. Use deterministic request fixtures for JSONPlaceholder and
HackerNews API calls.

- [ ] **Step 4: Run all VDOM entries**

Run: `pnpm examples:verify:web -- --mode vdom --all`

Expected: 45 runtime/scenario passes. Fix every baseline regression before
continuing.

- [ ] **Step 5: Run all supported Vapor entries and parity checks**

Run: `pnpm examples:verify:web -- --mode vapor --all`

The runner reuses the same scenario, records normalized checkpoints for both
modes, and fails on differences. Save failure screenshots and JSON diagnostics
under ignored `artifacts/example-harness/`.

- [ ] **Step 6: Commit**

```bash
git add packages/example-harness package.json pnpm-lock.yaml
git commit -m "test(examples): verify every entry in Lynx for Web"
```

### Task 6: Finalize the matrix and website controls

**Files:**

- Create: `packages/example-harness/src/verify-status.mjs`
- Create: `packages/example-harness/tests/verify-status.spec.mjs`
- Modify: `examples/vapor-support.json`
- Modify: `website/src/components/go/Go.tsx`
- Create: `website/src/components/go/VaporStatus.tsx`
- Create: `website/src/components/go/vapor-status.scss`
- Modify: `website/docs/guide/vapor-mode.mdx`
- Modify: `website/docs/zh/guide/vapor-mode.mdx`

- [ ] **Step 1: Write the failing completion-gate test**

The gate must reject any `candidate`, missing VDOM Web result, missing supported
Vapor Web result, failed parity result, or mismatched source hash.

- [ ] **Step 2: Persist final supported/unsupported results**

Run the full harness, update all 45 rows to `supported` or `unsupported`, and
store compact evidence with source hashes. No `candidate`, `adapter`, `unknown`,
or unvisited result may remain.

- [ ] **Step 3: Add local mode controls to `<Go>`**

For supported entries show a local segmented `VDOM | Vapor` control and switch
bundle/source metadata without affecting other examples. For unsupported
entries show `Vapor unsupported` plus the manifest reason. Multi-entry examples
must update when their selected entry changes. Do not add a global site switch.

- [ ] **Step 4: Document the generated capability matrix**

Add the final counts and a generated entry table to both Vapor guides, linking
unsupported reasons to the limitations section.

- [ ] **Step 5: Run completion gates**

```bash
pnpm examples:inventory
pnpm examples:build:vapor -- --all
pnpm examples:verify:web -- --all
pnpm examples:verify:status
pnpm lint
pnpm test
pnpm test:upstream
pnpm build
pnpm build:examples
pnpm --dir website build
git diff --check
```

Expected: all commands PASS and the completion report accounts for exactly 45
entries.

- [ ] **Step 6: Commit**

```bash
git add examples/vapor-support.json website packages/example-harness
git commit -m "feat(website): expose verified Vapor example support"
```

### Task 7: Add required CI coverage

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the Web verification job**

Install Playwright Chromium, restore pnpm and browser caches, build Vue Lynx,
run inventory/build/profile tests, and shard `examples:verify:web` across the
CI matrix. A final status job downloads shard results and runs
`examples:verify:status`.

- [ ] **Step 2: Verify workflow syntax and local equivalents**

Run the exact non-sharded local commands from Task 6 and inspect the workflow
with the repository formatter/linter.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: require Lynx-for-Web example verification"
```
