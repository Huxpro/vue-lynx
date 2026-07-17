# VDOM vs Vapor on Lynx — benchmark results

- date: 2026-07-17T20:34:16.468Z
- git: 3387a09
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- modes: vdom, vapor, vapor-bt
- scenario loads per mode: 2; in-app samples per op per load: 10 (heavy ops: 5)

## Interaction — Background-Thread cost (ms median, lower is better)

bg = reactivity + render + ops serialization on the Background Thread.

| op | vdom bg | vapor bg | vapor-bt bg |
|---|---|---|---|
| create1k | 28.10 ±16.29 | 37.20 ±4.75 | 36.40 ±3.42 |
| update10th | 4.30 ±0.32 | 0.60 ±0.06 | 0.70 ±0.04 |
| select | 3.25 ±0.24 | 0.30 ±0.12 | 0.30 ±0.07 |
| swap | 3.90 ±0.39 | 0.90 ±0.11 | 0.90 ±0.11 |
| remove | 3.40 ±0.13 | 0.70 ±0.07 | 0.70 ±0.16 |
| append1k | 31.00 ±7.26 | 33.85 ±3.57 | 34.20 ±2.69 |
| create10k | 285.85 ±56.45 | 349.30 ±14.98 | 361.15 ±21.93 |
| clear10k | 18.10 ±1.83 | 41.95 ±2.60 | 46.00 ±2.76 |
| create30k | 1037.65 ±102.42 | 1260.75 ±268.31 | 1134.30 ±105.27 |
| clear30k | 58.80 ±13.36 | 150.75 ±26.70 | 153.45 ±8.67 |

## Interaction — end-to-end cost (ms median, lower is better)

e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).

| op | vdom e2e | vapor e2e | vapor-bt e2e |
|---|---|---|---|
| create1k | 122.90 ±21.17 | 131.15 ±6.60 | 136.55 ±5.10 |
| update10th | 6.35 ±13.99 | 2.55 ±10.78 | 2.60 ±11.66 |
| select | 3.85 ±0.78 | 1.65 ±0.78 | 1.75 ±0.73 |
| swap | 4.65 ±0.64 | 1.60 ±0.14 | 1.65 ±0.13 |
| remove | 4.00 ±0.48 | 1.30 ±0.11 | 1.25 ±0.73 |
| append1k | 220.70 ±55.45 | 181.45 ±12.73 | 198.05 ±8.32 |
| create10k | 1593.20 ±376.57 | 1562.15 ±56.92 | 1645.10 ±32.09 |
| clear10k | 1664.65 ±545.79 | 1371.30 ±128.87 | 1500.85 ±79.64 |
| create30k | 5196.80 ±3100.53 | 6273.40 ±4352.55 | 5191.85 ±4354.90 |
| clear30k | 4699.35 ±559.49 | 4975.70 ±2137.30 | 5295.25 ±353.36 |

## Ops-stream shape (median per operation)

| op | vdom ops | vapor ops | vapor-bt ops | vdom bytes | vapor bytes | vapor-bt bytes |
|---|---|---|---|---|---|---|
| create1k | 17000 | 7000 | 7000 | 328417 | 159445 | 159559 |
| update10th | 100 | 100 | 100 | 5088 | 5217 | 5189 |
| select | 2 | 2 | 2 | 36 | 39 | 39 |
| swap | 2 | 2 | 2 | 33 | 39 | 39 |
| remove | 1 | 1 | 1 | 11 | 13 | 13 |
| append1k | 17000 | 7000 | 7000 | 348959 | 170960 | 171016 |
| create10k | 170000 | 70000 | 70000 | 3509283 | 1689555 | 1689413 |
| clear10k | 10000 | 10001 | 10001 | 110001 | 120009 | 120009 |
| create30k | 510000 | 210000 | 210000 | 10559173 | 5122063 | 5121847 |
| clear30k | 30000 | 30001 | 30001 | 330001 | 363156 | 363155 |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| vdom | 121.55 | 132.67 | 27.48 | 8 |
| vapor | 125.10 | 122.75 | 9.73 | 8 |
| vapor-bt | 117.90 | 132.19 | 28.49 | 8 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | vdom page | vdom worker | vapor page | vapor worker | vapor-bt page | vapor-bt worker |
|---|---|---|---|---|---|---|
| mounted | 3.8 | n/a | 3.8 | n/a | 3.8 | n/a |
| after10k | 49.3 | n/a | 128.6 | n/a | 71.4 | n/a |
| afterClear | 54.5 | n/a | 136.8 | n/a | 78.5 | n/a |
| after30k | 157.9 | n/a | 102.6 | n/a | 132.8 | n/a |
| after30kClear | 173.3 | n/a | 116.8 | n/a | 130.9 | n/a |

## Bundle size (bytes)

| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip | vapor-bt raw | vapor-bt gzip |
|---|---|---|---|---|---|---|
| main.lynx.bundle | 110289 | 45094 | 142659 | 54902 | 142848 | 54940 |
| main.web.bundle | 107884 | 38243 | 140804 | 48442 | 141073 | 48490 |

## Issue #234 Part A — build-time structured templates (vapor → vapor-bt)

Positive % = vapor-bt is that much larger/slower; negative = smaller/faster.

**Startup** median: vapor 125.10ms → vapor-bt 117.90ms (-5.8%).

**main.lynx.bundle** raw: 142659 → 142848 (0.1%); gzip: 54902 → 54940 (0.1%).

**main.web.bundle** raw: 140804 → 141073 (0.2%); gzip: 48442 → 48490 (0.1%).

**Per-op bg median delta** (vapor-bt vs vapor):

| op | vapor bg | vapor-bt bg | Δ |
|---|---|---|---|
| create1k | 37.20 | 36.40 | -2.2% |
| update10th | 0.60 | 0.70 | 16.7% |
| select | 0.30 | 0.30 | 0.0% |
| swap | 0.90 | 0.90 | 0.0% |
| remove | 0.70 | 0.70 | 0.0% |
| append1k | 33.85 | 34.20 | 1.0% |
| create10k | 349.30 | 361.15 | 3.4% |
| clear10k | 41.95 | 46.00 | 9.7% |
| create30k | 1260.75 | 1134.30 | -10.0% |
| clear30k | 150.75 | 153.45 | 1.8% |
