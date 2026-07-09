# VDOM vs Vapor on Lynx — Quantitative Benchmark Plan

**Goal:** Answer, with confidence and numbers, how Vue VDOM mode and Vue Vapor
mode differ in performance on Lynx.

**Approach:** Port Vue's official benchmark (`vuejs/core
packages-private/benchmark`, itself derived from
[js-framework-benchmark](https://github.com/krausest/js-framework-benchmark))
to Lynx, following the same porting philosophy as `packages/upstream-tests`:
same workload, same measurement shape, adapted to Lynx's dual-thread reality.
No mobile device is available in this environment, so the harness renders the
built `.web.bundle` through **Lynx for Web** (`@lynx-js/web-core`
`<lynx-view>`) in headless Chromium via Playwright.

## What the official benchmark measures

`client/App.vue` / `client/AppVapor.vue` are identical apart from the `vapor`
attribute. Operations (krausest set): create 1k rows (`run`), create 10k
(`runLots`), append 1k (`add`), update every 10th row (`update`), `select`,
`swapRows`, `remove`, `clear`. `profiling.ts#wrap` measures
`performance.now()` around `fn()` + `await nextTick()` and reports
min/max/median/mean/std per op.

## Lynx port (`packages/benchmark`)

- `apps/vdom/` and `apps/vapor/` — two rspeedy apps. `apps/vdom/src/App.vue`
  is the single source of truth; the vapor variant is **generated** at build
  time by inserting the `vapor` attribute, guaranteeing identical workloads.
  Template ported to Lynx tags (`view`/`text`, `@tap`), keyed `v-for` over
  plain views (no native `<list>` — it virtualizes and would not measure raw
  element throughput). Row structure mirrors krausest: id cell, label cell
  with select handler, remove cell with handler.
- `shared/data.ts` — verbatim port of upstream `buildData` (shallowRef labels).
- `shared/bench-core.ts` — the Lynx `wrap`:
  - `bg` time: `performance.now` around `fn()` + **runtime-core `nextTick`**
    → BG-thread cost: reactivity + render/patch (vdom) or renderEffects
    (vapor) + ShadowElement ops + JSON serialization + `callLepusMethod` post.
  - `e2e` time: same start → **vue-lynx `nextTick`** (waits the
    `vuePatchUpdate` MT acknowledgement) → BG cost + cross-thread transfer +
    MT `applyOps` → real DOM application on the web platform.
  - Ops-stream stats per operation (unique to Lynx): number of flushes, ops
    count, serialized payload bytes — via wrapping
    `lynx.getNativeApp().callLepusMethod` from app code (no core changes).
- Scenario auto-runs on mount (no interaction needed → also runnable in
  LynxExplorer later); results stream out as `__BENCH__`-prefixed console
  lines and a final DOM node containing the JSON (dual channel).
- Event dispatch cost is identical between modes (same event-registry), so
  driving operations in-app instead of via synthetic taps does not bias the
  comparison; startup is measured from the harness side instead.

## Metrics (per Web Performance practice + lynxjs.org performance guide)

| Metric | Source |
|---|---|
| create1k / create10k / append1k / update10th / select / swap / remove / clear — `bg` + `e2e`, median/mean/std over N runs | in-app wrap |
| ops count / payload bytes / flush batches per op | BG instrumentation |
| First screen (lynx-view attach → first row text visible) ≈ FCP/ActualFMP analog | harness, fresh page ×N |
| Bundle size (lynx + web, raw + gzip) | dist files |
| JS heap (BG worker & page) after mount / after 10k rows / after clear | CDP best-effort |

Caveats to document: web platform ≠ native Lynx engine (PrimJS, native
layout); results characterize BG-thread + ops-pipeline + web-MT costs.
BG-thread cost (`bg`) is engine-agnostic in structure and is the component
Vapor primarily targets.

## Tasks
- [ ] B1: `packages/benchmark` scaffolding, shared data/bench-core, vdom app
- [ ] B2: vapor app generation + both apps build (dev smoke: prod bundles contain expected codegen)
- [ ] B3: harness — static server + Playwright + lynx-view page, console/DOM collection, startup timing, memory, bundle sizes
- [ ] B4: statistics (median/mean/std/CI), JSON + markdown report emission
- [ ] B5: run full suite, sanity-check variance, write findings into `plans/0709-3-vdom-vapor-benchmark-results.md`
