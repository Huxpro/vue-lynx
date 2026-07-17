# ReactLynx content-probe (FCP scale ladder)

Parallel to [`../sfc-probe`](../sfc-probe): same card density
(`nCards` → ~1k / 3k / 5k / 10k / 20k / 30k elements), but as an unrolled
ReactLynx Snapshot+IFR app.

```bash
pnpm install
node build-scale-matrix.mjs ../web-bundles-scale --force
# then measure with the shared web harness:
node ../web-harness/run-browser.mjs ../web-bundles-scale 5 1 scale-react-x1
node ../web-harness/run-browser.mjs ../web-bundles-scale 5 4 scale-react-x4
```

Bundles land as `react@1k.web.bundle` … `react@30k.web.bundle`.
Results: `../results/browser-results-scale-react-x{1,4}.json`.
