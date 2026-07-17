# IFR + Element Templates — Independent Reevaluation (post-#216)

**Date**: 2026-07-17  
**Host**: 4× Intel Xeon @ 2.4 GHz, headless Chromium (Playwright), Lynx for Web  
**Android emulator**: not available in this environment  
**Branch artifacts**: `results/` (builds + browser x1/x4 + strategy ladder)

This note challenges the claims on
[vue.lynxjs.org/guide/ifr](https://vue.lynxjs.org/guide/ifr) and
[ifr-benchmarks](https://vue.lynxjs.org/guide/ifr-benchmarks) with a
corrected flag matrix and a focus set that includes the large apps the
published campaign skipped (AI Chat, Elk).

## 1. Methodology corrections (do not trust the old harness as-is)

### 1a. Flag matrix was wrong after #216

`enableIFR: true` now **defaults** `enableElementTemplates` to `true`.
The checked-in `examples-sweep/orchestrate.mjs` still injected:

```js
ifr: 'enableIFR: true',           // ← also enables ET
'ifr-et': 'enableIFR: true, enableElementTemplates: true',
```

So **`ifr` and `ifr-et` were identical builds**. Any published table that
relied on that script after the defaulting change cannot isolate ET's
contribution. This reevaluation uses explicit flags for every cell:

| config | flags |
|---|---|
| `off` | `enableIFR: false`, `enableElementTemplates: false` |
| `et` | IFR off, ET on (advanced composition) |
| `ifr` | IFR on, **`enableElementTemplates: false`** |
| `ifr-et` | IFR on, ET on (product default) |

### 1b. ET-without-IFR was broken in the monorepo

With `enableElementTemplates: true` and IFR off, `worklet-loader-mt`
strips the runtime and re-emits template registrations via a source scan.
Examples that inherit the repo root `tsconfig` path aliases resolve
`vue-lynx` → `runtime/src`. The scanner matched a **JSDoc example** inside
`element-template.ts` and emitted broken code — 5/7 focus apps failed to
build until the extractor skipped comments.

Implication for the API docs: “ET can be enabled independently” was not
true for the default example setup. Fixed in this branch; still a
footgun if documentation examples look like real registrations.

### 1c. Published real-thread matrix omitted the large apps

Campaign 3 measured hello-world / todomvc-day1 / swiper / … / hackernews.
It did **not** include `ai-chat` or `elk`. Those are the apps where the
“enable IFR” recommendation is most likely to be wrong — and they are.

## 2. Implementation & API design (code review)

### What holds up

- **Dual-thread IFR architecture** matches ReactLynx’s shape: MT mount
  during `loadTemplate`, record ops, BG hydrate with skip/patch/teardown.
  Hydration reconciliation is careful (value ops vs structural; worklet
  events always re-applied for `_execId`).
- **Composition-API lifecycle inertness** on the IFR MT path (`onMounted`
  etc. no-op) is the right default; it is documented.
- **Element Templates as framework-level PAPI `create()`** (not Lynx
  binary `elementTemplates`) is a pragmatic choice: keeps the ops/
  hydration protocol, shrinks payload, avoids engine coupling.
- **Semantic fallback** (ineligible subtrees stay on vdom) is correct —
  lowering is an optimization, not a mode.

### API / product issues

| issue | severity | notes |
|---|---|---|
| ET defaults on with IFR, but opt-out is easy to forget in benches | high | caused the harness bug above; docs must always show both flags in matrices |
| `isIfrMainThread()` mount opt-out still pays the MT Vue copy | high | hackernews-css does this; FCP gets worse, gzip still ≈×2.5 |
| Options API `mounted()` not suppressed on IFR MT | medium | documented footgun; asymmetric with Composition API |
| ET-only path depends on comment-safe source scanning | medium | fixed; still fragile vs stringly protocol |
| No build-time guidance for fetch-driven apps | medium | elk/ai-chat correctly leave IFR off; hackernews enables IFR then opts out of mount — worst of both worlds |
| “Advanced” ET-without-IFR undermeasured / broken | medium | size ≈ free, FCP ≈ flat; not a performance lever on web |

## 3. Strategy ladder (render cost) — mostly confirmed

Jitless, large scenes, this host (warm median ms):

| variant | static-heavy | content | list |
|---|---:|---:|---:|
| bg-baseline | 7.75 | 5.76 | 4.51 |
| ifr-replay (IFR w/o ET) | 7.14 | 5.44 | 4.17 |
| **ifr-block-tpl (IFR+ET)** | **0.50** | **0.84** | **0.98** |
| ifr-vapor (bound) | 0.34 | 0.35 | 0.33 |
| papi-floor | 0.32 | 0.24 | 0.22 |

**Verdict:** Campaign 1’s core claim stands. Plain IFR relocates work; ET
cuts synchronous render cost ~6–14× on these scenes. Absolute ms are
lower than the published table (different machine) but ratios agree.
This is the strongest evidence for defaulting ET on with IFR — as a
**main-thread render-cost** hedge, not as a web-FCP lever.

## 4. Lynx for Web — fresh FCP matrix (challenge campaign 3)

Medians of 7 fresh browser contexts. FCP = `<lynx-view>` insert → ≥5
Lynx elements. Bundle gzip is `*.lynx.bundle`.

### Bundle size

| example | off | ifr+et | × |
|---|---:|---:|---:|
| hello-world | 36.1 | 79.4 | 2.20 |
| todomvc | 37.7 | 83.7 | 2.22 |
| gallery | 38.2 | 82.5 | 2.16 |
| hackernews-css | 73.4 | 184.5 | 2.51 |
| ai-chat | 97.9 | 231.1 | 2.36 |
| elk | 91.2 | 217.7 | 2.39 |
| **median** | | | **×2.23** |

Close to the published ×2.26. ET adds ~1% on top of IFR. **Claim holds.**

### FCP — no CPU throttle

| example | nodes† | off | et | ifr | ifr+et | ifr+et Δ |
|---|---:|---:|---:|---:|---:|---:|
| hello-world | 16 | 63.6 | 60.0 | 48.6 | **47.0** | **−26%** |
| todomvc-day1 | 7 | 55.4 | 56.9 | 53.1 | **50.3** | **−9%** |
| todomvc | 11 | 63.2 | 71.6 | **49.1** | 55.9 | −12% |
| gallery | 304 | 74.7 | 75.8 | **61.3** | 62.3 | −17% |
| hackernews-css | 347 | **62.9** | 69.1 | 90.7 | 87.1 | **+38%** |
| ai-chat | 104 | 90.4 | 90.3 | **74.9** | **74.9** | **−17%** |
| elk | 956 | 100.3 | 99.6 | 96.8 | 100.2 | **−0%** |

† Settled node count (after hydration / fetch). Hacker News / Elk / AI Chat
keep growing after first paint.

- Content-first subset (hello / todomvcs / gallery) median ifr+et: **−12%**
  (published −19% on a friendlier set).
- All seven median: **−12%**, but the mean is pulled by HN’s +38%.
- **ET alone** is noise or slightly worse on FCP (todomvc +13%).
- **ifr vs ifr+et** is not always “within noise”: todomvc +14% with ET
  at x1; several others ±0–5%.

### FCP — 4× CPU throttle (mobile-class proxy)

| example | off | ifr | ifr+et | ifr+et Δ |
|---|---:|---:|---:|---:|
| hello-world | 163.6 | 158.1 | **141.1** | **−14%** |
| todomvc-day1 | 157.3 | 160.5 | **147.2** | **−6%** |
| todomvc | 168.4 | 157.9 | 159.0 | −6% |
| gallery | 206.6 | 206.0 | 213.0 | **+3%** |
| hackernews-css | 168.9 | 186.8 | 183.2 | **+8%** |
| ai-chat | 200.9 | 239.6 | 251.1 | **+25%** |
| elk | 235.6 | 338.6 | 340.0 | **+44%** |

**This is the headline contradiction.**

Under throttle, the all-seven median for ifr+et vs off is **+3%**
(IFR *hurts*). Content-first median is only **−6%**. Elk and AI Chat —
real product-sized apps — regress **+44% / +25%** on FCP and much more
on settled time (Elk 633 → 940 ms; AI Chat 266 → 413 ms).

The published narrative (“content-first screens keep their win under
throttling; only fetch-driven skeletons invert”) understates how large
the inversion set is once you leave the demo suite. On the web, **bundle
parse sits on the FCP path**; big apps amplify that term until it
dominates the thread-boundary win IFR removes.

### Settled time (hydration / first meaningful tree)

IFR can win FCP and still lose “time to stable tree”:

| example | settled off → ifr+et @x1 |
|---|---|
| hello-world | 63.7 → 47.1 (win) |
| gallery | 74.9 → 62.5 (win) |
| ai-chat | 94.8 → **137.4** (lose) |
| elk | 380.6 → **431.0** (lose) |
| hackernews-css | 103.7 → **134.7** (lose) |

## 5. Claim-by-claim scorecard

| published claim | reevaluation |
|---|---|
| IFR wins ~−19% FCP median on Lynx for Web | **Overstated for a realistic app mix.** Content-first ~−12% here; with Elk/HN/AI Chat included, throttle median flips positive. |
| IFR matches ReactLynx’s class of win | Plausible for tiny content-first screens; not re-measured vs RL probe this round. |
| ET is “never worse than noise” on web FCP | **False as a blanket statement.** todomvc +14% (x1); under x4 ET sometimes helps (hello −11% vs ifr-only) and sometimes not. |
| ET’s value is render cost / native, not web FCP | **Confirmed** by strategy ladder + flat/noisy web FCP. |
| Bundle gzip ~×2.26 | **Confirmed** (~×2.23 median on this set; large apps ×2.3–2.5). |
| Fetch-driven screens should not enable IFR | **Confirmed and stronger than documented** — Elk/AI Chat @x4 are severe regressions; HN’s mount opt-out still pays size. |
| Single-process harness cannot show IFR’s win | Still true; not re-litigated. |
| ET defaults on with IFR is justified | **Justified by MT render cost**, not by web FCP. Keep the default; stop selling it as an FCP win. |

## 6. Recommendations

### For the product / docs

1. **Keep `enableIFR` → ET default**, but describe ET as “cheap insurance
   for the sync MT render,” not as a web-FCP optimization.
2. **Change the enable guidance** from “content-first → enable” to a
   decision tree that treats **bundle size × device CPU** as first-class:
   - small sync shell, content-first → enable
   - large app or fetch-first → measure; default **off** on web
   - if you call `isIfrMainThread()` to skip mount, **turn `enableIFR`
     off** — otherwise you pay gzip for nothing
3. **Publish Elk + AI Chat** (or similarly large apps) in the benchmark
   page; the demo-median −19% is misleading without them.
4. **Fix the harness in-tree** (done here): explicit flags; never rely on
   defaults inside a matrix.
5. Soften absolute-ms tables; ratios + profiles are the stable currency.

### For implementers

- Prefer Composition API for first-screen effects under IFR.
- Do not enable IFR on apps whose first paint is a loading shell unless
  that shell is intentionally designed as the IFR product surface.
- ET-only is fine after the comment-scan fix, but it is not a performance
  feature on Lynx for Web.

## 7. Reproduce

```bash
pnpm --filter vue-lynx run build
node packages/ifr-bench/reeval/orchestrate-focused.mjs /tmp/ifr-reeval-bundles
PLAYWRIGHT_CHROMIUM_PATH=... node packages/ifr-bench/web-harness/run-browser.mjs /tmp/ifr-reeval-bundles 7 1
PLAYWRIGHT_CHROMIUM_PATH=... node packages/ifr-bench/web-harness/run-browser.mjs /tmp/ifr-reeval-bundles 7 4
pnpm --filter vue-lynx-ifr-bench run bench
```

Raw JSON: `packages/ifr-bench/reeval/results/`.
