# VDOM vs Vapor on Lynx — benchmark results

- date: 2026-07-09T09:21:55.767Z
- git: c2d2102
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- scenario loads per mode: 1; in-app samples per op per load: 10 (heavy ops: 5)

## Interaction operations (ms, lower is better)

bg = Background-Thread cost (reactivity + render + ops serialization). e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).

| op | vdom bg median | vapor bg median | Δbg | vdom e2e median | vapor e2e median | Δe2e |
|---|---|---|---|---|---|---|
| create1k | 15.45 ±0.80 | 19.30 ±4.76 | 0.80× vdom/vapor | 94.10 ±6.10 | 172.35 ±5.53 | 0.55× vdom/vapor |
| update10th | 2.00 ±0.43 | 0.40 ±0.04 | 5.00× vdom/vapor | 3.60 ±12.82 | 2.10 ±36.31 | 1.71× vdom/vapor |
| select | 1.85 ±0.26 | 0.20 ±0.09 | 9.25× vdom/vapor | 2.30 ±0.29 | 0.50 ±0.12 | 4.60× vdom/vapor |
| swap | 2.10 ±0.30 | 0.50 ±0.12 | 4.20× vdom/vapor | 2.80 ±0.35 | 1.10 ±1.47 | 2.55× vdom/vapor |
| remove | 1.90 ±0.17 | 0.50 ±0.26 | 3.80× vdom/vapor | 2.40 ±0.25 | 0.80 ±1.11 | 3.00× vdom/vapor |
| append1k | 17.75 ±0.72 | 20.85 ±1.35 | 0.85× vdom/vapor | 155.30 ±8.92 | 373.55 ±19.05 | 0.42× vdom/vapor |
| create10k | 149.00 ±29.38 | 262.40 ±22.12 | 0.57× vdom/vapor | 1124.20 ±21.32 | 2076.00 ±147.49 | 0.54× vdom/vapor |
| clear10k | 5.40 ±0.77 | 8.60 ±3.35 | 0.63× vdom/vapor | 1255.60 ±75.39 | 3292.30 ±83.16 | 0.38× vdom/vapor |

## Ops-stream shape (median per operation)

| op | vdom ops | vapor ops | vdom bytes | vapor bytes |
|---|---|---|---|---|
| create1k | 17000 | 25000 | 327464 | 428561 |
| update10th | 100 | 100 | 5088 | 5154 |
| select | 2 | 2 | 36 | 39 |
| swap | 2 | 2 | 33 | 39 |
| remove | 1 | 1 | 11 | 13 |
| append1k | 17000 | 25000 | 347930 | 463936 |
| create10k | 170000 | 250000 | 3499654 | 4619843 |
| clear10k | 10000 | 10003 | 110001 | 120028 |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| vdom | 143.10 | 125.67 | 24.87 | 3 |
| vapor | 155.30 | 140.23 | 25.37 | 3 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | vdom page | vdom worker | vapor page | vapor worker |
|---|---|---|---|---|
| mounted | 3.6 | n/a | 3.6 | n/a |
| after10k | 104.2 | n/a | 69.5 | n/a |
| afterClear | 117.0 | n/a | 77.8 | n/a |

## Bundle size (bytes)

| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|
| main.lynx.bundle | 93669 | 37776 | 147196 | 55992 |
| main.web.bundle | 92155 | 32872 | 146374 | 51648 |
