# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T09:37:22.372Z
- git: c204c51
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler |
|---|---|---|---|
| update10th | 42.6 ±9.1 | 46.1 ±7.2 | 62.4 ±10.8 |
| select | 41.0 ±4.8 | 65.4 ±6.0 | 76.6 ±5.2 |
| updateStorm | 31761.4 ±14150.2 | 59984.7 ±27826.3 | 63859.9 ±28849.6 |
| selectStorm | 39460.3 ±6222.6 | 94614.9 ±11006.2 | 94979.9 ±10662.6 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler |
|---|---|---|---|
| update10th | 1911.0 ±895.6 | 3726.8 ±1685.8 | 2977.1 ±1526.4 |
| select | 5196.8 ±922.2 | 11339.0 ±1741.9 | 10291.7 ±1770.6 |
| updateStorm | DNF ×2 (>240s) | DNF ×2 (>240s) | DNF ×2 (>240s) |
| selectStorm | n/a | n/a | n/a |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
