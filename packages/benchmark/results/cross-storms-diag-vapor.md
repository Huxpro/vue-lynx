# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-22T13:27:35.461Z
- git: 484d49e
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.10GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 1; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | vapor | vapor-dense | vapor-engine | vapor-ifr-engine-et |
|---|---|---|---|---|
| create | 197.1 ±0.0 | 156.1 ±0.0 | 187.8 ±0.0 | 176.4 ±0.0 |
| update10th | 19.5 ±10.6 | 17.0 ±2.9 | 19.6 ±2.9 | 20.6 ±22.5 |
| select | 29.4 ±0.8 | 28.7 ±0.4 | 29.1 ±0.9 | 29.6 ±0.9 |
| updateStorm | 40.7 ±0.0 | 56.5 ±2.4 | 47.8 ±9.1 | 47.9 ±10.7 |
| selectStorm | 17.7 ±0.9 | 43.5 ±33.5 | 19.4 ±1.7 | 19.2 ±0.3 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
