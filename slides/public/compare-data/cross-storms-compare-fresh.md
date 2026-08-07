# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-08-05T21:50:40.402Z
- git: 02376ec
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 3; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vapor | vapor-ifr | react | octane |
|---|---|---|---|---|---|---|
| create | 264.7 ±14.8 | 272.0 ±29.3 | 269.7 ±11.3 | 265.8 ±7.0 | 232.3 ±15.8 | 551.2 ±12.4 |
| update10th | 22.8 ±4.6 | 28.8 ±3.5 | 21.7 ±3.4 | 18.0 ±3.2 | 36.3 ±4.9 | 147.1 ±13.4 |
| select | 22.4 ±0.9 | 22.4 ±0.8 | 19.7 ±3.3 | 23.3 ±3.7 | 21.8 ±3.6 | 130.8 ±10.5 |
| updateStorm | 195.7 ±29.9 | 185.3 ±30.3 | 121.0 ±14.6 | 136.4 ±13.1 | 661.5 ±64.7 | 276.8 ±32.2 |
| selectStorm | 81.6 ±11.4 | 85.1 ±16.0 | 23.7 ±3.7 | 18.7 ±1.9 | 268.3 ±9.9 | 160.3 ±9.1 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vapor | vapor-ifr | react | octane |
|---|---|---|---|---|---|---|
| create | 2142.8 ±84.1 | 2308.7 ±122.5 | 2266.6 ±456.9 | 2224.1 ±23.3 | 1744.6 ±65.5 | 4700.2 ±234.2 |
| update10th | 189.9 ±166.5 | 176.0 ±18.6 | 132.5 ±6.0 | 129.1 ±13.9 | 261.0 ±19.0 | 1412.7 ±197.2 |
| select | 151.5 ±72.7 | 109.9 ±8.4 | 95.8 ±14.1 | 125.8 ±12.8 | 150.9 ±5.9 | 1226.3 ±264.5 |
| updateStorm | 3144.7 ±874.0 | 2904.9 ±148.9 | 1493.1 ±335.1 | 1408.1 ±152.8 | 7839.4 ±990.3 | 2183.3 ±854.3 |
| selectStorm | 1465.1 ±68.1 | 1508.0 ±51.1 | 150.4 ±9.6 | 161.4 ±13.5 | 6357.2 ±1836.3 | 2025.1 ±319.0 |

## Table size: 30k rows (ms, median ±CI95, lower is better)

| op | vdom | vdom-ifr | vapor | vapor-ifr | react | octane |
|---|---|---|---|---|---|---|
| create | 6444.6 ±778.9 | 7062.4 ±118.1 | 6992.8 ±68.9 | 7214.5 ±355.2 | 4823.2 ±149.3 | 14053.6 ±385.2 |
| update10th | 633.7 ±100.1 | 671.0 ±102.9 | 385.1 ±234.2 | 353.1 ±12.6 | 887.3 ±40.5 | 4858.1 ±353.2 |
| select | 464.3 ±56.6 | 613.9 ±135.2 | 342.9 ±53.4 | 281.9 ±75.1 | 434.6 ±33.9 | 4687.5 ±509.8 |
| updateStorm | 14899.3 ±1509.2 | 13528.3 ±1279.7 | 12393.1 ±477.4 | 11905.1 ±622.6 | 26451.3 ±2734.6 | 7101.8 ±1013.5 |
| selectStorm | 5366.6 ±160.1 | 5320.5 ±282.2 | 429.2 ±9.1 | 422.1 ±12.4 | 12957.5 ±899.8 | 7701.8 ±784.4 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
