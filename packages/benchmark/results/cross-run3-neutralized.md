# Cross-framework black-box benchmark — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T11:28:32.761Z
- git: 9d517db
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- loads per mode: 2; samples per op per load: 10 (heavy: 5)
- method: real clicks → composed-DOM end-state polled per animation frame; latency = pointerdown → first frame at end state (resolution ≈ one frame, ~17 ms)

## Interaction latency (ms, median ±CI95, lower is better)

| op | react | vdom | vapor | vdom/react | vapor/react | vapor/vdom |
|---|---|---|---|---|---|---|
| create1k | 87.8 ±5.6 | 107.6 ±5.6 | 119.1 ±6.0 | 1.23× | 1.36× | 1.11× |
| update10th | 18.9 ±2.7 | 18.4 ±1.3 | 17.9 ±1.3 | 0.97× | 0.95× | 0.98× |
| select | 27.4 ±2.5 | 26.8 ±2.6 | 27.5 ±2.3 | 0.98× | 1.00× | 1.02× |
| swap | 16.4 ±3.1 | 16.0 ±1.6 | 16.0 ±2.3 | 0.98× | 0.98× | 1.00× |
| remove | 23.8 ±1.1 | 17.3 ±0.6 | 16.1 ±0.4 | 0.72× | 0.68× | 0.94× |
| append1k | 98.7 ±6.0 | 108.9 ±4.3 | 117.3 ±3.2 | 1.10× | 1.19× | 1.08× |
| create10k | 984.4 ±63.2 | 1271.7 ±61.2 | 1214.8 ±44.5 | 1.29× | 1.23× | 0.96× |
| clear10k | 304.3 ±13.4 | 235.1 ±9.2 | 229.7 ±8.8 | 0.77× | 0.75× | 0.98× |

## Cold single-shot latency (FRESH app per sample — no prior operations, ms)

Separates intrinsic op cost from degradation accumulated over the sustained scenario above.

| op | react | vdom | vapor |
|---|---|---|---|
| create1k | 150.8 ±11.1 | 162.0 ±7.9 | 170.1 ±21.2 |
| create10k | 1225.4 ±20.8 | 1387.1 ±42.3 | 1430.1 ±9.9 |

## Within-scenario drift (median of last 3 samples ÷ first 3; ~1.0 = stable)

| op | react | vdom | vapor |
|---|---|---|---|
| create1k | 0.90× | 0.86× | 0.87× |
| update10th | 1.08× | 1.14× | 0.93× |
| select | 0.99× | 1.03× | 1.01× |
| swap | 0.57× | 1.04× | 1.02× |
| remove | 0.98× | 1.01× | 1.00× |
| append1k | 0.94× | 0.92× | 1.00× |
| create10k | n/a | n/a | n/a |
| clear10k | n/a | n/a | n/a |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| react | 72.0 | 67.2 | 11.2 | 5 |
| vdom | 99.8 | 96.7 | 7.4 | 5 |
| vapor | 95.4 | 97.9 | 16.2 | 5 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | react page | vdom page | vapor page |
|---|---|---|---|
| mounted | 3.9 | 3.9 | 3.9 |
| after10k | 88.4 | 94.2 | 72.9 |
| afterClear | 98.8 | 95.7 | 75.5 |

## Bundle size (bytes)

| bundle | react raw | react gzip | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|---|---|
| main.lynx.bundle | 95962 | 40313 | 95286 | 38353 | 119251 | 46253 |
| main.web.bundle | 93818 | 31838 | 93618 | 33159 | 117972 | 40670 |
