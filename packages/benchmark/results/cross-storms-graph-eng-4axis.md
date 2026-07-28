# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-22T13:31:54.554Z
- git: 1fa35bf
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.10GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vdom-ifr-et | vdom-et | vapor | vapor-dense | vapor-engine | vapor-ifr | vapor-ifr-dense | vapor-ifr-sparse | vapor-ifr-engine-et |
|---|---|---|---|---|---|---|---|---|---|---|---|
| create | 144.8 ±5.3 | 160.0 ±19.1 | 149.8 ±2.8 | 152.7 ±9.9 | 161.1 ±2.4 | 166.6 ±17.3 | 165.0 ±5.9 | 176.0 ±12.8 | 172.7 ±7.3 | 168.2 ±7.5 | 173.3 ±2.5 |
| update10th | 20.3 ±2.3 | 23.9 ±4.1 | 18.8 ±3.3 | 19.8 ±3.7 | 17.2 ±4.4 | 20.3 ±5.7 | 17.3 ±4.5 | 19.9 ±4.5 | 20.0 ±6.6 | 16.8 ±4.2 | 17.1 ±4.9 |
| select | 30.3 ±0.3 | 30.3 ±0.4 | 29.6 ±0.5 | 30.0 ±0.4 | 29.5 ±0.2 | 30.1 ±1.1 | 20.7 ±7.9 | 28.5 ±1.3 | 29.4 ±0.4 | 29.8 ±5.9 | 30.0 ±0.2 |
| updateStorm | 117.1 ±16.9 | 108.4 ±15.2 | 112.1 ±13.6 | 114.8 ±15.8 | 53.8 ±20.1 | 40.7 ±6.1 | 46.8 ±12.6 | 40.9 ±6.1 | 41.4 ±1.2 | 41.6 ±6.0 | 41.3 ±7.3 |
| selectStorm | 54.9 ±0.9 | 62.8 ±13.4 | 60.7 ±7.0 | 62.2 ±6.8 | 21.5 ±3.2 | 24.5 ±5.3 | 18.4 ±0.3 | 20.5 ±3.3 | 20.0 ±1.6 | 18.2 ±1.7 | 19.8 ±1.5 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vdom-ifr-et | vdom-et | vapor | vapor-dense | vapor-engine | vapor-ifr | vapor-ifr-dense | vapor-ifr-sparse | vapor-ifr-engine-et |
|---|---|---|---|---|---|---|---|---|---|---|---|
| create | 1472.7 ±14.7 | 1477.5 ±143.0 | 1460.0 ±8.6 | 1555.6 ±127.7 | 1441.5 ±25.2 | 1498.1 ±81.8 | 1415.9 ±8.7 | 1500.8 ±69.6 | 1422.6 ±83.5 | 1572.3 ±175.4 | 1488.2 ±42.0 |
| update10th | 93.4 ±19.4 | 99.0 ±11.6 | 103.3 ±9.2 | 88.9 ±13.3 | 64.2 ±13.3 | 62.0 ±8.0 | 57.2 ±7.1 | 62.6 ±8.0 | 61.8 ±16.8 | 69.8 ±8.5 | 67.6 ±14.0 |
| select | 68.4 ±7.2 | 60.5 ±6.3 | 62.1 ±5.8 | 66.7 ±7.4 | 38.2 ±5.8 | 34.8 ±6.3 | 36.6 ±8.2 | 35.1 ±7.1 | 41.0 ±13.3 | 45.1 ±6.6 | 33.4 ±8.6 |
| updateStorm | 1463.7 ±129.1 | 1403.2 ±31.4 | 1405.4 ±61.9 | 1340.4 ±61.9 | 663.6 ±20.9 | 739.5 ±47.6 | 658.2 ±43.4 | 701.4 ±49.2 | 729.9 ±39.2 | 798.6 ±75.8 | 765.4 ±37.4 |
| selectStorm | 743.4 ±93.6 | 643.4 ±14.0 | 674.5 ±17.1 | 712.9 ±25.1 | 59.2 ±6.8 | 70.6 ±25.9 | 57.7 ±10.5 | 57.1 ±9.8 | 74.7 ±28.4 | 68.2 ±13.6 | 69.1 ±6.9 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
