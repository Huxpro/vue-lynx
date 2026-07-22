# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-22T13:26:49.663Z
- git: 484d49e
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.10GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 1; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | vdom-et | vdom-ifr-et |
|---|---|---|
| create | 196.8 ±0.0 | 173.1 ±0.0 |
| update10th | 23.6 ±6.9 | 19.4 ±5.8 |
| select | 27.1 ±9.2 | 28.8 ±0.3 |
| updateStorm | 131.3 ±5.1 | 98.5 ±12.3 |
| selectStorm | 53.0 ±1.2 | 60.6 ±8.7 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
