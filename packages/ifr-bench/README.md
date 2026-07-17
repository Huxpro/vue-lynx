# vue-lynx-ifr-bench

First-frame rendering benchmark comparing IFR implementation strategies for
Vue Lynx, from the shipped pipeline down to compile-time snapshot lowering
(ReactLynx-style) and a Vapor-style no-vdom floor.

**Results and analysis:**
- Strategy ladder / historical: [REPORT.md](./REPORT.md)
- **Unified lineage re-run (VDOM off/ifr/ifr-et + Vapor, corrected flags): [UNIFIED-RERUN.md](./UNIFIED-RERUN.md)**

## Layout

| file | purpose |
|---|---|
| `src/scene.mjs` | Scene DSL + per-variant code generators (Vue template, `<sta-N>`/`<tpl-N>` rewrites, straight-line PAPI codegen) |
| `src/scenes.mjs` | The three benchmark scenes (static-heavy / content / list), size-parameterized |
| `src/variants.mjs` | Eight strategies: shipped BG/replay paths, four lowering prototypes, the real Vapor IFR path, and the PAPI floor |
| `src/papi-backends.mjs` | Counting-stub PAPI (timing) and jsdom PAPI (correctness oracle) |
| `src/harness.mjs` | One-configuration subprocess (fresh module state, genuine cold first run) |
| `src/correctness.mjs` | Renders every variant against jsdom and requires identical output |
| `run.mjs` | Orchestrator: V8 + `--jitless` matrix → `results/results.json` + tables |
| `sfc-probe/` | Same-source generated SFC; `build-matrix.mjs` (fixed N) and `build-scale-matrix.mjs` (1k→30k × 5 architectures) |
| `report-scale-trends.mjs` | Playground-style cost-space + FCP/N charts (linear & log-log) + α fits |
| `UNIFIED-RERUN.md` | Post-merge re-measurement + scale-trend architecture read |
| `results/scale-trends-*.html` | Generated trend pages (also copied to `website/docs/public/benchmark/`) |
| `web-harness/run-browser.mjs` | Real dual-thread browser FCP runs over a directory of `.web.bundle` files |
| `web-harness/probe-ifr.mjs` | Single-bundle diagnostic: paint timeline + browser console (catches silent IFR fallbacks) |

## Run

```bash
pnpm --filter vue-lynx-ifr-bench run check   # correctness (must print 24 ✓)
pnpm --filter vue-lynx-ifr-bench run bench   # full matrix (~2 min)
node run.mjs --quick                         # small sizes, fewer iterations
```

Node-only; no build step. `register-hooks.mjs` provides the module aliases
(`vue-lynx`, `vue-lynx/internal/ops`) and build-time defines that the rspeedy
plugin/vitest configs normally supply.
