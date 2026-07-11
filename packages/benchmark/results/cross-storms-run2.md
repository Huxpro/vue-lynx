# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T08:28:07.844Z
- git: 9e680c4
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | react | vdom | vapor | vdom/react | vapor/vdom |
|---|---|---|---|---|---|
| update10th | 45.6 ±5.2 | 25.3 ±3.1 | 26.9 ±5.7 | 0.56× | 1.06× |
| select | 42.3 ±1.2 | 8.4 ±0.8 | 26.8 ±5.5 | 0.20× | 3.17× |
| updateStorm | 31436.8 ±13851.7 | 103.1 ±8.5 | 68.4 ±14.9 | 0.00× | 0.66× |
| selectStorm | 38978.4 ±6163.1 | 47.3 ±0.9 | 20.3 ±7.9 | 0.00× | 0.43× |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | react | vdom | vapor | vdom/react | vapor/vdom |
|---|---|---|---|---|---|
| update10th | 1607.6 ±846.7 | 107.1 ±16.2 | 90.3 ±5.6 | 0.07× | 0.84× |
| select | 5056.7 ±1025.3 | 73.2 ±17.6 | 57.1 ±2.8 | 0.01× | 0.78× |
| updateStorm | DNF ×2 (>240s) | 1417.0 ±64.0 | 797.8 ±87.3 | n/a | 0.56× |
| selectStorm | n/a | 687.0 ±29.8 | 97.4 ±24.3 | n/a | 0.14× |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
