# VDOM vs Vapor on Lynx — benchmark results

- date: 2026-07-09T09:18:53.088Z
- git: c2d2102
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- scenario loads per mode: 2; in-app samples per op per load: 10 (heavy ops: 5)

## Interaction operations (ms, lower is better)

bg = Background-Thread cost (reactivity + render + ops serialization). e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).

| op | vdom bg median | vapor bg median | Δbg | vdom e2e median | vapor e2e median | Δe2e |
|---|---|---|---|---|---|---|
| create1k | 13.90 ±1.31 | 19.35 ±3.11 | 0.72× vdom/vapor | 92.30 ±2.79 | 176.15 ±4.57 | 0.52× vdom/vapor |
| update10th | 2.20 ±0.26 | 0.40 ±0.06 | 5.50× vdom/vapor | 3.60 ±9.01 | 2.10 ±24.59 | 1.71× vdom/vapor |
| select | 1.60 ±0.23 | 0.20 ±0.06 | 8.00× vdom/vapor | 2.10 ±0.33 | 0.55 ±0.76 | 3.82× vdom/vapor |
| swap | 1.90 ±0.27 | 0.50 ±0.09 | 3.80× vdom/vapor | 2.45 ±0.29 | 1.10 ±1.33 | 2.23× vdom/vapor |
| remove | 1.65 ±0.08 | 0.40 ±0.06 | 4.13× vdom/vapor | 2.05 ±0.37 | 0.80 ±0.42 | 2.56× vdom/vapor |
| append1k | 17.10 ±1.20 | 21.85 ±1.06 | 0.78× vdom/vapor | 156.95 ±6.70 | 367.70 ±12.11 | 0.43× vdom/vapor |
| create10k | 155.90 ±22.84 | 229.00 ±24.93 | 0.68× vdom/vapor | 1159.35 ±34.41 | 2036.60 ±51.24 | 0.57× vdom/vapor |
| clear10k | 6.50 ±1.19 | 8.95 ±1.80 | 0.73× vdom/vapor | 1286.65 ±54.03 | 3126.00 ±142.20 | 0.41× vdom/vapor |

## Ops-stream shape (median per operation)

| op | vdom ops | vapor ops | vdom bytes | vapor bytes |
|---|---|---|---|---|
| create1k | 17000 | 25000 | 327548 | 428472 |
| update10th | 100 | 100 | 5072 | 5223 |
| select | 2 | 2 | 36 | 39 |
| swap | 2 | 2 | 33 | 39 |
| remove | 1 | 1 | 11 | 13 |
| append1k | 17000 | 25000 | 347911 | 463990 |
| create10k | 170000 | 250000 | 3499632 | 4619585 |
| clear10k | 10000 | 10003 | 110001 | 120028 |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| vdom | 86.00 | 85.38 | 6.20 | 5 |
| vapor | 111.40 | 103.04 | 16.11 | 5 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | vdom page | vdom worker | vapor page | vapor worker |
|---|---|---|---|---|
| mounted | 3.7 | n/a | 3.6 | n/a |
| after10k | 103.0 | n/a | 76.0 | n/a |
| afterClear | 115.9 | n/a | 86.3 | n/a |

## Bundle size (bytes)

| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|
| main.lynx.bundle | 93669 | 37776 | 147196 | 55992 |
| main.web.bundle | 92155 | 32872 | 146374 | 51648 |
