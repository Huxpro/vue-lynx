# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T11:19:55.664Z
- git: 7d64aea
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | react | vdom | vapor |
|---|---|---|---|
| update10th | 25.5 ±5.1 | 28.1 ±4.5 | 23.2 ±4.2 |
| select | 27.8 ±0.4 | 29.0 ±0.6 | 28.3 ±0.5 |
| updateStorm | 405.6 ±51.8 | 88.4 ±1.1 | 53.6 ±1.6 |
| selectStorm | 175.5 ±9.0 | 51.0 ±1.2 | 16.9 ±5.5 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | react | vdom | vapor |
|---|---|---|---|
| update10th | 161.1 ±8.8 | 109.5 ±11.6 | 79.8 ±5.2 |
| select | 100.7 ±14.7 | 54.7 ±3.0 | 56.1 ±13.0 |
| updateStorm | 4310.7 ±1029.1 | 1213.4 ±62.2 | 624.4 ±15.6 |
| selectStorm | 2581.0 ±665.3 | 600.6 ±49.9 | 86.3 ±23.4 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
