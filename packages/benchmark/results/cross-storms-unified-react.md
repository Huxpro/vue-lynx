# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-17T22:17:03.138Z
- git: 5a045d1a
- node: v22.14.0, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | react |
|---|---|
| create | 81.7 ±0.3 |
| update10th | 24.8 ±2.1 |
| select | 31.1 ±4.8 |
| updateStorm | 234.8 ±23.8 |
| selectStorm | 92.1 ±7.6 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | react |
|---|---|
| create | 688.9 ±7.8 |
| update10th | 88.7 ±9.6 |
| select | 51.4 ±5.4 |
| updateStorm | 2135.2 ±20.0 |
| selectStorm | 1018.0 ±18.8 |

## Table size: 30k rows (ms, median ±CI95, lower is better)

| op | react |
|---|---|
| create | 1984.7 ±1.9 |
| update10th | 258.9 ±8.5 |
| select | 157.7 ±6.4 |
| updateStorm | 8377.0 ±355.7 |
| selectStorm | 3744.4 ±201.3 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
