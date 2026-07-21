# VDOM vs Vapor on Lynx — benchmark results

- date: 2026-07-09T17:15:42.393Z
- git: 3d43f88
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- scenario loads per mode: 2; in-app samples per op per load: 10 (heavy ops: 5)

## Interaction operations (ms, lower is better)

bg = Background-Thread cost (reactivity + render + ops serialization). e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).

| op | vdom bg median | vapor bg median | Δbg | vdom e2e median | vapor e2e median | Δe2e |
|---|---|---|---|---|---|---|
| create1k | 20.25 ±1.93 | 25.15 ±2.49 | 0.81× vdom/vapor | 129.90 ±7.35 | 143.10 ±7.33 | 0.91× vdom/vapor |
| update10th | 3.40 ±0.21 | 0.50 ±0.06 | 6.80× vdom/vapor | 5.10 ±12.96 | 2.40 ±14.40 | 2.13× vdom/vapor |
| select | 3.25 ±0.20 | 0.20 ±0.08 | 16.25× vdom/vapor | 3.70 ±0.21 | 0.50 ±0.10 | 7.40× vdom/vapor |
| swap | 3.90 ±0.35 | 0.90 ±0.13 | 4.33× vdom/vapor | 4.40 ±0.36 | 1.40 ±0.14 | 3.14× vdom/vapor |
| remove | 2.90 ±0.33 | 0.70 ±0.10 | 4.14× vdom/vapor | 3.45 ±0.44 | 1.15 ±0.42 | 3.00× vdom/vapor |
| append1k | 23.55 ±2.69 | 26.25 ±2.04 | 0.90× vdom/vapor | 219.20 ±15.32 | 218.80 ±12.31 | 1.00× vdom/vapor |
| create10k | 202.45 ±34.34 | 267.95 ±14.47 | 0.76× vdom/vapor | 1440.00 ±437.15 | 1595.55 ±67.86 | 0.90× vdom/vapor |
| clear10k | 7.20 ±5.68 | 7.55 ±0.50 | 0.95× vdom/vapor | 1736.10 ±454.98 | 1646.85 ±479.90 | 1.05× vdom/vapor |

## Ops-stream shape (median per operation)

| op | vdom ops | vapor ops | vdom bytes | vapor bytes |
|---|---|---|---|---|
| create1k | 17000 | 17000 | 327492 | 329459 |
| update10th | 100 | 100 | 5095 | 5176 |
| select | 2 | 2 | 36 | 39 |
| swap | 2 | 2 | 33 | 39 |
| remove | 1 | 1 | 11 | 13 |
| append1k | 17000 | 17000 | 347907 | 353999 |
| create10k | 170000 | 170000 | 3499430 | 3519528 |
| clear10k | 10000 | 10003 | 110001 | 120028 |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| vdom | 113.00 | 111.82 | 11.20 | 5 |
| vapor | 126.70 | 121.68 | 8.57 | 5 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | vdom page | vdom worker | vapor page | vapor worker |
|---|---|---|---|---|
| mounted | 3.6 | n/a | 3.6 | n/a |
| after10k | 103.3 | n/a | 108.4 | n/a |
| afterClear | 59.2 | n/a | 53.0 | n/a |

## Bundle size (bytes)

| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|
| main.lynx.bundle | 94497 | 37999 | 148024 | 56188 |
| main.web.bundle | 92997 | 33106 | 147216 | 51889 |
