# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T11:24:06.970Z
- git: 7d64aea
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler |
|---|---|---|---|
| update10th | 28.3 ±3.5 | 30.5 ±2.3 | 42.0 ±5.1 |
| select | 26.0 ±0.9 | 28.8 ±4.9 | 28.5 ±0.3 |
| updateStorm | 442.2 ±62.6 | 644.0 ±57.9 | 842.9 ±39.6 |
| selectStorm | 174.9 ±7.4 | 331.8 ±1.8 | 467.8 ±30.9 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler |
|---|---|---|---|
| update10th | 185.9 ±20.0 | 212.9 ±18.3 | 296.9 ±36.9 |
| select | 123.1 ±9.7 | 149.5 ±10.0 | 198.3 ±14.7 |
| updateStorm | 4310.7 ±156.5 | 6159.4 ±128.2 | 8650.8 ±144.3 |
| selectStorm | 1883.2 ±123.4 | 3442.3 ±127.1 | 4949.9 ±202.1 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
