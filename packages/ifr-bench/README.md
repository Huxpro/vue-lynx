# vue-lynx-ifr-bench

First-frame rendering benchmark comparing IFR implementation strategies for
Vue Lynx, from the shipped pipeline down to compile-time snapshot lowering
(ReactLynx-style) and a Vapor-style no-vdom floor.

**Results and analysis: [REPORT.md](./REPORT.md)**  
**Post-#216 independent reevaluation (flag matrix fix + large apps on Lynx for Web): [reeval/REEVALUATION.md](./reeval/REEVALUATION.md)**

## Layout

| file | purpose |
|---|---|
| `src/scene.mjs` | Scene DSL + per-variant code generators (Vue template, `<sta-N>`/`<tpl-N>` rewrites, straight-line PAPI codegen) |
| `src/scenes.mjs` | The three benchmark scenes (static-heavy / content / list), size-parameterized |
| `src/variants.mjs` | The seven strategies under test (two are the real shipped modules; four are lowering prototypes; one is the floor) |
| `src/papi-backends.mjs` | Counting-stub PAPI (timing) and jsdom PAPI (correctness oracle) |
| `src/harness.mjs` | One-configuration subprocess (fresh module state, genuine cold first run) |
| `src/correctness.mjs` | Renders every variant against jsdom and requires identical output |
| `run.mjs` | Orchestrator: V8 + `--jitless` matrix → `results/results.json` + tables |
| `reeval/` | Focused 4-config rebuild + Lynx-for-Web FCP reevaluation (includes Elk / AI Chat) |

## Run

```bash
pnpm --filter vue-lynx-ifr-bench run check   # correctness (must print 21 ✓)
pnpm --filter vue-lynx-ifr-bench run bench   # full matrix (~2 min)
node run.mjs --quick                         # small sizes, fewer iterations
```

Node-only; no build step. `register-hooks.mjs` provides the module aliases
(`vue-lynx`, `vue-lynx/internal/ops`) and build-time defines that the rspeedy
plugin/vitest configs normally supply.
