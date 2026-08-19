# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-17T22:14:01.928Z
- git: 5a045d1a
- node: v22.14.0, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vdom-ifr-et | vapor | vapor-ifr |
|---|---|---|---|---|---|
| create | 92.8 ±2.7 | 90.0 ±0.0 | 81.0 ±0.9 | 93.1 ±2.6 | 93.2 ±1.3 |
| update10th | 25.3 ±2.4 | 25.8 ±2.7 | 24.8 ±3.0 | 26.2 ±1.2 | 24.2 ±4.7 |
| select | 23.3 ±6.2 | 31.7 ±0.1 | 15.5 ±4.6 | 23.8 ±6.4 | 26.9 ±5.9 |
| updateStorm | 69.6 ±8.1 | 62.9 ±6.3 | 53.3 ±7.8 | 26.0 ±0.6 | 24.5 ±0.3 |
| selectStorm | 42.9 ±6.8 | 27.0 ±6.3 | 25.7 ±0.8 | 25.8 ±1.2 | 25.4 ±1.3 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vdom-ifr-et | vapor | vapor-ifr |
|---|---|---|---|---|---|
| create | 797.6 ±1.2 | 841.9 ±23.9 | 729.4 ±33.1 | 853.3 ±15.6 | 870.0 ±37.1 |
| update10th | 51.3 ±3.5 | 55.1 ±2.9 | 48.4 ±6.0 | 30.1 ±3.5 | 32.5 ±1.8 |
| select | 33.2 ±5.5 | 37.1 ±4.1 | 31.8 ±2.2 | 22.0 ±6.1 | 19.6 ±5.6 |
| updateStorm | 746.9 ±22.2 | 734.0 ±21.0 | 540.5 ±13.1 | 349.8 ±23.7 | 355.6 ±23.4 |
| selectStorm | 367.2 ±4.7 | 371.9 ±10.3 | 263.9 ±3.2 | 44.6 ±5.8 | 36.3 ±3.4 |

## Table size: 30k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vdom-ifr-et | vapor | vapor-ifr |
|---|---|---|---|---|---|
| create | 2511.9 ±69.8 | 2469.4 ±26.4 | 2052.0 ±4.2 | 2683.8 ±115.2 | 2618.6 ±23.6 |
| update10th | 172.9 ±25.2 | 172.1 ±6.0 | 154.9 ±10.2 | 117.7 ±34.1 | 114.4 ±7.2 |
| select | 112.4 ±14.2 | 117.1 ±6.1 | 92.5 ±3.3 | 65.1 ±12.3 | 68.3 ±10.6 |
| updateStorm | 2865.8 ±194.5 | 2749.5 ±98.7 | 2177.3 ±86.5 | 1302.2 ±49.9 | 1299.3 ±77.4 |
| selectStorm | 1458.9 ±41.6 | 1456.3 ±49.9 | 1118.4 ±85.1 | 128.5 ±34.3 | 132.0 ±18.6 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
