# Cross-framework black-box benchmark — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T07:08:49.277Z
- git: 409b20a
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- loads per mode: 2; samples per op per load: 10 (heavy: 5)
- method: real clicks → composed-DOM end-state polled per animation frame; latency = pointerdown → first frame at end state (resolution ≈ one frame, ~17 ms)

## Interaction latency (ms, median ±CI95, lower is better)

| op | react | vdom | vapor | vdom/react | vapor/react | vapor/vdom |
|---|---|---|---|---|---|---|
| create1k | 115.2 ±5.9 | 111.2 ±5.1 | 120.1 ±4.8 | 0.97× | 1.04× | 1.08× |
| update10th | 49.4 ±6.1 | 16.3 ±1.9 | 17.6 ±2.0 | 0.33× | 0.36× | 1.08× |
| select | 160.3 ±21.9 | 26.6 ±0.3 | 26.1 ±2.8 | 0.17× | 0.16× | 0.98× |
| swap | 314.2 ±18.3 | 15.6 ±3.0 | 28.2 ±3.0 | 0.05× | 0.09× | 1.80× |
| remove | 445.2 ±20.5 | 19.7 ±2.1 | 18.1 ±1.5 | 0.04× | 0.04× | 0.92× |
| append1k | 3028.3 ±141.3 | 115.5 ±3.9 | 126.3 ±4.2 | 0.04× | 0.04× | 1.09× |
| create10k | 28633.8 ±728.9 | 1273.9 ±44.9 | 1290.2 ±34.9 | 0.04× | 0.05× | 1.01× |
| clear10k | 332.1 ±27.3 | 248.6 ±18.8 | 237.1 ±14.4 | 0.75× | 0.71× | 0.95× |

## Cold single-shot latency (FRESH app per sample — no prior operations, ms)

Separates intrinsic op cost from degradation accumulated over the sustained scenario above.

| op | react | vdom | vapor |
|---|---|---|---|
| create1k | 188.9 ±4.2 | 179.3 ±15.8 | 171.6 ±3.4 |
| create10k | 1496.0 ±39.8 | 1460.4 ±53.9 | 1482.7 ±55.9 |

## Within-scenario drift (median of last 3 samples ÷ first 3; ~1.0 = stable)

| op | react | vdom | vapor |
|---|---|---|---|
| create1k | 0.85× | 0.88× | 1.04× |
| update10th | 1.94× | 1.09× | 0.73× |
| select | 2.12× | 1.00× | 1.25× |
| swap | 1.36× | 1.47× | 1.52× |
| remove | 1.25× | 0.91× | 0.92× |
| append1k | 1.23× | 1.05× | 1.06× |
| create10k | n/a | n/a | n/a |
| clear10k | n/a | n/a | n/a |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| react | 68.2 | 70.1 | 10.0 | 5 |
| vdom | 84.3 | 87.8 | 6.6 | 5 |
| vapor | 95.6 | 97.0 | 4.6 | 5 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | react page | vdom page | vapor page |
|---|---|---|---|
| mounted | 3.9 | 3.9 | 3.9 |
| after10k | 61.4 | 38.1 | 89.9 |
| afterClear | 73.3 | 40.4 | 91.0 |

## Bundle size (bytes)

| bundle | react raw | react gzip | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|---|---|
| main.lynx.bundle | 93793 | 39467 | 94722 | 38165 | 118710 | 46051 |
| main.web.bundle | 91853 | 31152 | 93032 | 32961 | 117425 | 40480 |
