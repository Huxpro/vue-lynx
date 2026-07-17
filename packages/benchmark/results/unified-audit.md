# Unified benchmark audit

Generated: 2026-07-17T22:15:17.670Z

## Outcome

- Normalized records: **647**
- Strictly comparable groups (2+ variants): **136**
- Single-variant / non-comparable groups: **0**
- Historical revisions mixed in this import: **68fdfe8, 91652989, 9d517db**
- Missing cells in the core scale matrix: **0**

## Comparability contract

Ratios are valid only when environment (including throttle), workload, scale, metric, timing boundary, unit, and revision all match. Suite names and milliseconds alone do not establish comparability.

## Assumptions challenged

1. **All three suites run on Lynx for Web — false.** The IFR strategy ladder is a Node counting-PAPI cost model. Only its separate browser campaign is Lynx for Web.
2. **Startup/FCP numbers share one scale — false.** The Vue benchmark waits for a title predicate; IFR uses browser FCP and DOM-settled boundaries. They are retained as separate metrics.
3. **Internal e2e and black-box latency are interchangeable — false.** MT acknowledgement excludes input and frame alignment; pointerdown→predicate includes both.
4. **The historical corpus is one controlled run — false.** It mixes revisions (68fdfe8, 91652989, 9d517db) and results without recorded revisions. Revision is part of the comparison key; use `--run` for a fresh campaign.
5. **CPU ×1 and ×4 IFR runs can be pooled — false.** Throttle is now encoded in the environment dimension.
6. **Every mode is covered at scale — true for the imported core scale matrix.** The imported 1k/10k core cells are complete.
7. **A single aggregate score is meaningful — rejected.** Creation, sparse update, selection, sustained storms, first frame, bytes, and bundle size measure different resources and must remain separate axes.

## Coverage

| Dimension | Values |
|---|---:|
| suite | 5 |
| environment | 5 |
| variant | 18 |
| workload | 43 |
| scale | 9 |
| metric | 12 |
| boundary | 8 |
| revision | 4 |

## Reproduce

- Import and audit existing data: `pnpm --filter vue-lynx-benchmark bench:unified`
- Fresh quick campaign, then normalize: `pnpm --filter vue-lynx-benchmark bench:unified:quick`
- Fresh standard campaign: `pnpm --filter vue-lynx-benchmark bench:unified:all`
