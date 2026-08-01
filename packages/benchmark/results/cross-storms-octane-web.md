# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-08-01T09:12:01.606Z
- git: 2e348fd
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.10GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 3; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vapor | vapor-ifr | octane |
|---|---|---|---|---|---|
| create | 160.8 ±13.7 | 154.5 ±4.0 | 164.4 ±13.0 | 174.6 ±14.0 | 356.2 ±6.3 |
| update10th | 28.4 ±3.1 | 26.9 ±4.2 | 19.6 ±2.7 | 19.3 ±4.4 | 95.9 ±13.3 |
| select | 29.0 ±5.0 | 28.3 ±3.5 | 28.9 ±3.0 | 29.9 ±0.9 | 87.9 ±14.1 |
| updateStorm | 126.4 ±72.0 | 131.9 ±22.9 | 44.3 ±7.1 | 40.7 ±6.9 | 168.1 ±40.9 |
| selectStorm | 66.5 ±5.6 | 56.3 ±5.7 | 19.2 ±3.2 | 20.2 ±3.4 | 105.8 ±8.6 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vapor | vapor-ifr | octane |
|---|---|---|---|---|---|
| create | 1409.1 ±64.3 | 1337.7 ±98.3 | 1345.2 ±71.6 | 1356.6 ±43.2 | 2891.1 ±154.7 |
| update10th | 97.9 ±14.7 | 93.7 ±10.2 | 56.6 ±3.0 | 64.9 ±7.1 | 978.0 ±82.3 |
| select | 57.6 ±14.0 | 58.3 ±5.5 | 33.5 ±6.7 | 38.3 ±7.3 | 752.9 ±101.6 |
| updateStorm | 1422.2 ±225.5 | 1334.0 ±66.4 | 655.1 ±50.2 | 701.5 ±46.2 | 1574.9 ±242.4 |
| selectStorm | 628.3 ±29.1 | 627.8 ±46.2 | 65.2 ±16.1 | 59.9 ±10.4 | 1298.7 ±80.6 |

## Table size: 30k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vapor | vapor-ifr | octane |
|---|---|---|---|---|---|
| create | 4752.3 ±333.6 | 4613.7 ±417.2 | 4713.2 ±95.4 | 4138.4 ±525.1 | 9191.7 ±330.0 |
| update10th | 366.4 ±61.7 | 356.1 ±39.3 | 308.0 ±11.8 | 291.7 ±39.5 | 4243.0 ±295.3 |
| select | 196.2 ±35.4 | 214.1 ±12.0 | 145.7 ±36.3 | 143.5 ±38.6 | 3751.8 ±494.3 |
| updateStorm | 6801.0 ±619.6 | 6673.6 ±1323.4 | 5017.9 ±948.2 | 3871.5 ±867.1 | 5864.8 ±543.5 |
| selectStorm | 2714.8 ±148.2 | 2694.0 ±151.0 | 287.7 ±36.8 | 244.7 ±47.4 | 5363.2 ±342.5 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
