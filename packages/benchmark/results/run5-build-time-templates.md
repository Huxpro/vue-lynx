# VDOM vs Vapor on Lynx — benchmark results

- date: 2026-07-16T15:15:09.108Z
- git: 59cea28
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- modes: vdom, vapor, vapor-bt
- scenario loads per mode: 2; in-app samples per op per load: 10 (heavy ops: 5)

## Interaction — Background-Thread cost (ms median, lower is better)

bg = reactivity + render + ops serialization on the Background Thread.

| op | vdom bg | vapor bg | vapor-bt bg |
|---|---|---|---|
| create1k | 21.90 ±1.86 | 31.65 ±2.91 | 32.40 ±2.53 |
| update10th | 3.35 ±0.22 | 0.50 ±0.10 | 0.60 ±0.05 |
| select | 2.70 ±0.18 | 0.20 ±0.06 | 0.20 ±0.07 |
| swap | 2.95 ±0.27 | 0.70 ±0.14 | 0.80 ±0.11 |
| remove | 2.80 ±0.11 | 0.50 ±0.05 | 0.60 ±0.08 |
| append1k | 24.40 ±1.71 | 27.05 ±2.18 | 27.90 ±2.88 |
| create10k | 237.85 ±9.48 | 305.95 ±12.32 | 309.10 ±15.86 |
| clear10k | 14.55 ±1.31 | 29.80 ±2.44 | 36.75 ±3.18 |

## Interaction — end-to-end cost (ms median, lower is better)

e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).

| op | vdom e2e | vapor e2e | vapor-bt e2e |
|---|---|---|---|
| create1k | 103.50 ±5.13 | 117.85 ±5.31 | 121.70 ±4.75 |
| update10th | 4.60 ±7.88 | 1.85 ±9.15 | 2.20 ±10.46 |
| select | 3.10 ±0.60 | 0.50 ±0.08 | 0.70 ±0.09 |
| swap | 3.55 ±0.29 | 1.15 ±0.16 | 1.30 ±0.13 |
| remove | 3.20 ±0.79 | 0.90 ±0.06 | 1.00 ±0.10 |
| append1k | 156.60 ±6.07 | 160.65 ±10.87 | 164.10 ±8.69 |
| create10k | 1263.95 ±37.96 | 1376.45 ±74.31 | 1388.85 ±54.10 |
| clear10k | 1199.60 ±175.88 | 1281.45 ±110.44 | 1250.15 ±90.67 |

## Ops-stream shape (median per operation)

| op | vdom ops | vapor ops | vapor-bt ops | vdom bytes | vapor bytes | vapor-bt bytes |
|---|---|---|---|---|---|---|
| create1k | 17000 | 7000 | 7000 | 328535 | 159534 | 159486 |
| update10th | 100 | 100 | 100 | 5112 | 5216 | 5187 |
| select | 2 | 2 | 2 | 36 | 39 | 39 |
| swap | 2 | 2 | 2 | 33 | 39 | 39 |
| remove | 1 | 1 | 1 | 11 | 13 | 13 |
| append1k | 17000 | 7000 | 7000 | 348948 | 170940 | 170956 |
| create10k | 170000 | 70000 | 70000 | 3509502 | 1689526 | 1689575 |
| clear10k | 10000 | 10001 | 10001 | 110001 | 120009 | 120009 |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| vdom | 97.60 | 97.34 | 10.34 | 5 |
| vapor | 112.00 | 116.04 | 17.89 | 5 |
| vapor-bt | 102.60 | 103.88 | 10.61 | 5 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | vdom page | vdom worker | vapor page | vapor worker | vapor-bt page | vapor-bt worker |
|---|---|---|---|---|---|---|
| mounted | 4.0 | n/a | 4.2 | n/a | 4.2 | n/a |
| after10k | 138.0 | n/a | 128.3 | n/a | 113.8 | n/a |
| afterClear | 66.2 | n/a | 138.5 | n/a | 110.6 | n/a |

## Bundle size (bytes)

| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip | vapor-bt raw | vapor-bt gzip |
|---|---|---|---|---|---|---|
| main.lynx.bundle | 159668 | 69042 | 241230 | 103075 | 241421 | 103123 |
| main.web.bundle | 146508 | 50822 | 217787 | 73595 | 218056 | 73649 |

## Issue #234 Part A — build-time structured templates (vapor → vapor-bt)

Positive % = vapor-bt is that much larger/slower; negative = smaller/faster.

**Startup** median: vapor 112.00ms → vapor-bt 102.60ms (-8.4%).

**main.lynx.bundle** raw: 241230 → 241421 (0.1%); gzip: 103075 → 103123 (0.0%).

**main.web.bundle** raw: 217787 → 218056 (0.1%); gzip: 73595 → 73649 (0.1%).

**Per-op bg median delta** (vapor-bt vs vapor):

| op | vapor bg | vapor-bt bg | Δ |
|---|---|---|---|
| create1k | 31.65 | 32.40 | 2.4% |
| update10th | 0.50 | 0.60 | 20.0% |
| select | 0.20 | 0.20 | 0.0% |
| swap | 0.70 | 0.80 | 14.3% |
| remove | 0.50 | 0.60 | 20.0% |
| append1k | 27.05 | 27.90 | 3.1% |
| create10k | 305.95 | 309.10 | 1.0% |
| clear10k | 29.80 | 36.75 | 23.3% |
