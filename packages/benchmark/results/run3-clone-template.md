# VDOM vs Vapor on Lynx — benchmark results

- date: 2026-07-09T17:58:30.474Z
- git: 21e92ac
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- scenario loads per mode: 2; in-app samples per op per load: 10 (heavy ops: 5)

## Interaction operations (ms, lower is better)

bg = Background-Thread cost (reactivity + render + ops serialization). e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).

| op | vdom bg median | vapor bg median | Δbg | vdom e2e median | vapor e2e median | Δe2e |
|---|---|---|---|---|---|---|
| create1k | 19.20 ±1.42 | 23.65 ±3.92 | 0.81× vdom/vapor | 125.70 ±4.82 | 141.35 ±8.91 | 0.89× vdom/vapor |
| update10th | 3.65 ±0.48 | 0.60 ±0.07 | 6.08× vdom/vapor | 6.15 ±12.19 | 2.60 ±13.71 | 2.37× vdom/vapor |
| select | 3.70 ±0.31 | 0.20 ±0.08 | 18.50× vdom/vapor | 4.35 ±0.40 | 0.60 ±0.13 | 7.25× vdom/vapor |
| swap | 4.55 ±0.38 | 0.80 ±0.15 | 5.69× vdom/vapor | 5.35 ±0.42 | 1.45 ±0.31 | 3.69× vdom/vapor |
| remove | 3.20 ±0.31 | 0.60 ±0.24 | 5.33× vdom/vapor | 3.85 ±0.70 | 1.15 ±0.61 | 3.35× vdom/vapor |
| append1k | 24.05 ±1.21 | 24.30 ±1.71 | 0.99× vdom/vapor | 224.75 ±12.27 | 257.55 ±14.60 | 0.87× vdom/vapor |
| create10k | 221.35 ±18.37 | 276.15 ±17.60 | 0.80× vdom/vapor | 1537.15 ±177.85 | 1664.80 ±54.57 | 0.92× vdom/vapor |
| clear10k | 7.95 ±4.16 | 13.60 ±1.60 | 0.58× vdom/vapor | 1766.20 ±698.22 | 1759.80 ±126.65 | 1.00× vdom/vapor |

## Ops-stream shape (median per operation)

| op | vdom ops | vapor ops | vdom bytes | vapor bytes |
|---|---|---|---|---|
| create1k | 17000 | 7000 | 327453 | 159503 |
| update10th | 100 | 100 | 5140 | 5199 |
| select | 2 | 2 | 36 | 39 |
| swap | 2 | 2 | 33 | 39 |
| remove | 1 | 1 | 11 | 13 |
| append1k | 17000 | 7000 | 347884 | 170999 |
| create10k | 170000 | 70000 | 3499389 | 1689678 |
| clear10k | 10000 | 10003 | 110001 | 120028 |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| vdom | 103.90 | 106.68 | 10.79 | 5 |
| vapor | 136.90 | 129.40 | 22.60 | 5 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | vdom page | vdom worker | vapor page | vapor worker |
|---|---|---|---|---|
| mounted | 3.6 | n/a | 3.6 | n/a |
| after10k | 135.7 | n/a | 105.3 | n/a |
| afterClear | 143.4 | n/a | 94.3 | n/a |

## Bundle size (bytes)

| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|
| main.lynx.bundle | 97114 | 39166 | 150641 | 57334 |
| main.web.bundle | 95438 | 33943 | 149657 | 52686 |
