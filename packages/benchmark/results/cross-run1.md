# Cross-framework black-box benchmark — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T06:54:06.115Z
- git: 5a8605c
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- loads per mode: 2; samples per op per load: 10 (heavy: 5)
- method: real clicks → composed-DOM end-state polled per animation frame; latency = pointerdown → first frame at end state (resolution ≈ one frame, ~17 ms)

## Interaction latency (ms, median ±CI95, lower is better)

| op | react | vdom | vapor | vdom/react | vapor/react | vapor/vdom |
|---|---|---|---|---|---|---|
| create1k | 130.0 ±34.8 | 112.3 ±6.2 | 119.5 ±4.1 | 0.86× | 0.92× | 1.06× |
| update10th | 60.0 ±10.2 | 16.3 ±1.8 | 16.4 ±1.6 | 0.27× | 0.27× | 1.01× |
| select | 158.8 ±19.9 | 25.6 ±2.1 | 26.0 ±0.2 | 0.16× | 0.16× | 1.02× |
| swap | 293.3 ±18.0 | 19.4 ±2.8 | 20.4 ±3.2 | 0.07× | 0.07× | 1.05× |
| remove | 409.4 ±24.2 | 19.4 ±1.1 | 19.0 ±0.7 | 0.05× | 0.05× | 0.98× |
| append1k | 2917.8 ±149.2 | 115.7 ±2.8 | 127.1 ±5.6 | 0.04× | 0.04× | 1.10× |
| create10k | 26815.8 ±963.8 | 1327.3 ±97.0 | 1269.6 ±40.6 | 0.05× | 0.05× | 0.96× |
| clear10k | 337.8 ±27.7 | 235.6 ±26.2 | 249.3 ±10.1 | 0.70× | 0.74× | 1.06× |

## Startup (first screen: lynx-view attach → first content, ms)

| mode | median | mean | std | n |
|---|---|---|---|---|
| react | 64.2 | 63.3 | 7.7 | 5 |
| vdom | 97.3 | 98.3 | 5.6 | 5 |
| vapor | 98.4 | 100.0 | 11.1 | 5 |

## Memory (JS heap, MB — indicative, no forced GC)

| phase | react page | vdom page | vapor page |
|---|---|---|---|
| mounted | 3.9 | 3.9 | 3.9 |
| after10k | 69.8 | 45.2 | 148.4 |
| afterClear | 77.1 | 51.1 | 40.8 |

## Bundle size (bytes)

| bundle | react raw | react gzip | vdom raw | vdom gzip | vapor raw | vapor gzip |
|---|---|---|---|---|---|---|
| main.lynx.bundle | 93793 | 39467 | 94722 | 38165 | 118710 | 46051 |
| main.web.bundle | 91853 | 31152 | 93032 | 32961 | 117425 | 40480 |
