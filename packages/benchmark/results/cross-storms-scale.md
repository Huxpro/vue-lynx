# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx

- date: 2026-07-11T12:37:15.623Z
- git: ac7e63e
- node: v22.22.2, chromium (playwright-core 1.61.1)
- host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz
- versions: @lynx-js/react 0.122.1, vue 3.6.0-beta.17, @lynx-js/web-core 0.22.1
- fresh app per (mode, size, rep); reps: 2; one-shot ops ×3 and storms ×2 per rep
- storms: one click triggers N sequential state→render→DOM ticks (update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state

## Table size: 1k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 181.3 ±9.1 | 180.6 ±14.3 | 209.3 ±3.9 | 205.3 ±9.4 | 213.3 ±16.0 |
| update10th | 32.8 ±6.3 | 43.7 ±6.9 | 41.3 ±5.4 | 27.8 ±6.5 | 21.8 ±3.9 |
| select | 25.9 ±0.6 | 33.9 ±6.6 | 23.5 ±0.8 | 25.0 ±5.5 | 21.8 ±6.6 |
| updateStorm | 540.7 ±48.4 | 850.4 ±34.9 | 823.2 ±74.6 | 118.7 ±6.6 | 84.1 ±12.3 |
| selectStorm | 226.9 ±15.5 | 409.4 ±15.0 | 352.0 ±29.2 | 61.6 ±1.2 | 17.0 ±4.9 |

## Table size: 3k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 491.8 ±4.2 | 487.0 ±27.0 | 570.1 ±19.8 | 588.0 ±34.6 | 610.9 ±19.8 |
| update10th | 78.7 ±7.2 | 102.4 ±7.6 | 101.2 ±3.6 | 53.7 ±4.0 | 41.3 ±4.0 |
| select | 46.8 ±6.0 | 78.8 ±11.4 | 65.2 ±5.4 | 37.3 ±7.6 | 34.6 ±4.2 |
| updateStorm | 1546.9 ±59.9 | 2417.1 ±54.9 | 2217.1 ±20.6 | 543.4 ±29.4 | 234.5 ±10.4 |
| selectStorm | 771.3 ±21.6 | 1337.6 ±29.9 | 1103.6 ±32.0 | 221.9 ±19.7 | 48.0 ±5.7 |

## Table size: 5k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 905.4 ±18.7 | 851.5 ±69.8 | 988.6 ±1.8 | 948.0 ±49.8 | 966.3 ±81.5 |
| update10th | 120.1 ±6.6 | 134.2 ±18.5 | 142.5 ±3.4 | 72.4 ±3.7 | 59.9 ±4.7 |
| select | 75.8 ±3.5 | 111.7 ±9.1 | 98.5 ±9.3 | 51.7 ±5.7 | 64.7 ±9.9 |
| updateStorm | 2710.4 ±80.8 | 3944.9 ±190.4 | 3661.5 ±217.7 | 761.8 ±64.3 | 399.4 ±54.8 |
| selectStorm | 1292.4 ±11.7 | 2099.4 ±210.3 | 1881.0 ±91.0 | 388.9 ±21.4 | 78.3 ±21.7 |

## Table size: 10k rows (ms, median ±CI95, lower is better)

| op | react | react-naive | react-compiler | vdom | vapor |
|---|---|---|---|---|---|
| create | 1610.9 ±43.9 | 1598.5 ±46.5 | 1854.9 ±118.1 | 1910.5 ±37.1 | 1905.2 ±19.2 |
| update10th | 256.2 ±15.8 | 297.2 ±22.4 | 275.9 ±36.9 | 160.0 ±22.3 | 115.8 ±10.7 |
| select | 149.6 ±5.9 | 225.4 ±12.8 | 163.2 ±6.5 | 97.0 ±6.0 | 110.0 ±18.0 |
| updateStorm | 5866.4 ±1015.7 | 8554.9 ±123.0 | 7569.3 ±164.2 | 2131.8 ±187.2 | 1199.2 ±214.6 |
| selectStorm | 3270.2 ±700.7 | 4597.8 ±825.9 | 3679.8 ±644.1 | 1009.1 ±46.7 | 160.9 ±21.2 |

Per-tick cost: divide storm medians by 50 (update) / 30 (select).
