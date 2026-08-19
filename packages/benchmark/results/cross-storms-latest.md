# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T13:25:49.429Z
- git: 68fdfe8
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 199.4 ±10.9 | 207.8 ±1.6 | 249.4 ±0.9 | 241.1 ±37.0 | 230.1 ±19.6 |
| update10th | 33.3 ±4.1 | 45.9 ±9.5 | 44.7 ±9.2 | 21.5 ±5.0 | 22.4 ±6.8 |
| select | 23.1 ±2.5 | 26.5 ±10.2 | 24.6 ±5.0 | 22.9 ±0.9 | 22.9 ±1.0 |
| updateStorm | 670.4 ±77.8 | 980.6 ±48.1 | 891.1 ±117.9 | 134.3 ±16.3 | 115.6 ±3.1 |
| selectStorm | 289.3 ±25.3 | 448.7 ±30.0 | 400.7 ±48.1 | 59.9 ±5.4 | 23.6 ±1.9 |

## Table size: 3k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 532.6 ±0.2 | 497.0 ±27.8 | 649.9 ±5.5 | 612.3 ±27.7 | 622.1 ±20.2 |
| update10th | 87.2 ±8.5 | 108.6 ±5.6 | 107.2 ±2.9 | 57.3 ±5.5 | 49.6 ±5.5 |
| select | 52.8 ±7.3 | 70.3 ±10.9 | 66.1 ±4.0 | 37.4 ±6.5 | 36.8 ±13.0 |
| updateStorm | 1750.8 ±28.1 | 2550.1 ±22.0 | 2262.4 ±75.8 | 549.1 ±6.7 | 254.3 ±9.6 |
| selectStorm | 750.6 ±34.4 | 1405.7 ±25.4 | 1192.5 ±43.9 | 242.9 ±7.4 | 55.8 ±12.7 |

## Table size: 5k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 905.1 ±11.2 | 839.3 ±55.9 | 947.5 ±52.8 | 1021.7 ±67.2 | 1033.0 ±40.9 |
| update10th | 125.3 ±4.0 | 152.2 ±17.4 | 148.2 ±11.5 | 86.2 ±8.4 | 70.4 ±4.2 |
| select | 76.0 ±5.1 | 116.7 ±20.1 | 96.4 ±7.8 | 57.1 ±3.5 | 50.1 ±4.3 |
| updateStorm | 2690.6 ±66.3 | 4250.5 ±169.7 | 3848.0 ±86.4 | 851.4 ±51.3 | 476.8 ±26.9 |
| selectStorm | 1287.9 ±26.2 | 2315.3 ±45.5 | 1827.1 ±38.9 | 438.8 ±42.5 | 84.5 ±23.6 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 1588.6 ±40.5 | 1658.7 ±61.5 | 1834.7 ±177.9 | 1941.5 ±64.6 | 1982.5 ±78.8 |
| update10th | 235.3 ±24.7 | 296.8 ±20.7 | 286.7 ±52.4 | 160.1 ±16.8 | 142.4 ±11.5 |
| select | 155.1 ±6.7 | 215.3 ±13.6 | 171.7 ±9.5 | 106.5 ±4.8 | 110.5 ±22.7 |
| updateStorm | 5442.6 ±236.8 | 8199.8 ±56.6 | 7875.3 ±351.3 | 2229.6 ±134.4 | 1223.9 ±75.4 |
| selectStorm | 2544.5 ±108.1 | 4289.3 ±21.0 | 3733.4 ±81.4 | 1072.4 ±47.5 | 146.2 ±21.2 |

## Table size: 20k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 3203.8 ±124.5 | 2991.6 ±50.4 | 3529.6 ±115.7 | 3878.2 ±165.8 | 3895.1 ±114.5 |
| update10th | 520.4 ±43.4 | 598.3 ±42.4 | 585.9 ±42.4 | 334.1 ±39.4 | 325.8 ±54.0 |
| select | 304.5 ±21.2 | 391.8 ±44.5 | 369.3 ±63.3 | 241.3 ±48.8 | 276.4 ±58.8 |
| updateStorm | 12649.6 ±454.5 | 17197.6 ±714.6 | 16384.0 ±280.7 | 5615.8 ±757.8 | 5092.3 ±640.9 |
| selectStorm | 5150.3 ±212.0 | 9551.1 ±151.4 | 8180.9 ±545.8 | 2199.6 ±77.0 | 350.2 ±55.1 |

## Table size: 30k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 4556.2 ±65.8 | 4414.6 ±210.0 | 5060.0 ±83.8 | 5952.4 ±68.0 | 6150.9 ±65.1 |
| update10th | 851.2 ±12.6 | 891.2 ±22.0 | 905.5 ±40.8 | 511.3 ±107.9 | 366.0 ±7.1 |
| select | 502.4 ±47.4 | 630.1 ±75.7 | 524.6 ±127.7 | 295.4 ±6.0 | 302.0 ±54.3 |
| updateStorm | 19335.4 ±732.1 | 25875.6 ±585.6 | 24166.8 ±272.4 | 12237.8 ±766.5 | 11333.3 ±329.1 |
| selectStorm | 9744.1 ±2030.2 | 14774.1 ±745.1 | 11712.2 ±3102.2 | 3631.2 ±151.8 | 434.1 ±2.6 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
