# VDOM vs Vapor on Lynx — benchmark results

- date: 2026-07-09T19:16:16.602Z
- git: 7a7158e
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- scenario loads per mode: 2; in-app samples per op per load: 10 (heavy ops: 5)

## Interaction operations (ms, lower is better)

bg = Background-Thread cost (reactivity + render + ops serialization). e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).

| op | vdom bg median | vapor bg median | Δbg | vdom e2e median | vapor e2e median | Δe2e |
|---|---|---|---|---|---|---|
| create1k | 19.90 ±1.59 | 23.75 ±3.58 | 0.84× vdom/vapor | 125.65 ±10.11 | 144.45 ±4.84 | 0.87× vdom/vapor |
| update10th | 3.20 ±0.41 | 0.55 ±0.06 | 5.82× vdom/vapor | 4.85 ±13.36 | 2.30 ±13.88 | 2.11× vdom/vapor |
| select | 2.95 ±0.40 | 0.30 ±0.24 | 9.83× vdom/vapor | 3.45 ±0.51 | 0.55 ±0.26 | 6.27× vdom/vapor |
| swap | 3.90 ±0.37 | 0.65 ±0.10 | 6.00× vdom/vapor | 4.65 ±0.39 | 1.20 ±0.13 | 3.88× vdom/vapor |
| remove | 2.85 ±0.15 | 0.40 ±0.07 | 7.12× vdom/vapor | 3.40 ±0.41 | 0.90 ±0.27 | 3.78× vdom/vapor |
| append1k | 22.80 ±1.39 | 22.85 ±2.07 | 1.00× vdom/vapor | 217.40 ±9.92 | 224.55 ±16.00 | 0.97× vdom/vapor |
| create10k | 227.45 ±34.34 | 259.45 ±36.97 | 0.88× vdom/vapor | 1499.80 ±350.62 | 1601.75 ±76.70 | 0.94× vdom/vapor |
| clear10k | 7.00 ±5.13 | 14.35 ±1.34 | 0.49× vdom/vapor | 1838.05 ±447.19 | 1620.80 ±278.32 | 1.13× vdom/vapor |

## Ops-stream shape (median per operation)

| op | vdom ops | vapor ops | vdom bytes | vapor bytes |
|---|---|---|---|---|
| create1k | 17000 | 7000 | 327488 | 159494 |
| update10th | 100 | 100 | 5083 | 5176 |
| select | 2 | 2 | 36 | 39 |
| swap | 2 | 2 | 33 | 39 |
| remove | 1 | 1 | 11 | 13 |
| append1k | 17000 | 7000 | 347918 | 170986 |
| create10k | 170000 | 70000 | 3499349 | 1689387 |
| clear10k | 10000 | 10003 | 110001 | 120028 |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| vdom | 121.70 | 119.43 | 8.51 | 6 |
| vapor | 125.75 | 127.38 | 7.73 | 6 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | vdom page | vdom worker | vapor page | vapor worker |
|---|---|---|---|---|
| mounted | 3.6 | n/a | 3.6 | n/a |
| after10k | 76.2 | n/a | 88.8 | n/a |
| afterClear | 82.6 | n/a | 71.7 | n/a |

## Bundle size (bytes)

| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|
| main.lynx.bundle | 97117 | 39159 | 128058 | 49294 |
| main.web.bundle | 95443 | 33951 | 126955 | 43799 |
