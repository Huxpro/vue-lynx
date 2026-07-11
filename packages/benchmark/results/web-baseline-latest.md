# Plain-DOM baseline — preact-hooks vs Vue vdom vs Vue vapor (no Lynx)

- date: 2026-07-11T13:34:33.157Z · preact 10.29.7 · vue 3.6.0-beta.17
- plain DOM, single-threaded (no Lynx); same click-driven storm protocol as cross.mjs

## 1k rows (ms, median ±CI95)

| op | preact-web | vue-web | vapor-web |
|---|---|---|---|
| create | 74.9 ±0.6 | 66.5 ±3.1 | 59.8 ±4.0 |
| update10th | 12.3 ±0.8 | 12.8 ±0.3 | 13.4 ±1.5 |
| select | 10.6 ±4.7 | 14.3 ±3.7 | 14.6 ±1.9 |
| updateStorm | 210.5 ±42.0 | 314.6 ±13.9 | 35.7 ±0.3 |
| selectStorm | 64.6 ±2.9 | 114.9 ±7.3 | 31.8 ±0.4 |

## 3k rows (ms, median ±CI95)

| op | preact-web | vue-web | vapor-web |
|---|---|---|---|
| create | 218.0 ±21.7 | 173.3 ±3.9 | 156.7 ±6.0 |
| update10th | 25.9 ±2.2 | 34.5 ±2.9 | 18.0 ±0.8 |
| select | 14.7 ±2.6 | 14.0 ±4.3 | 13.2 ±4.8 |
| updateStorm | 1032.9 ±52.4 | 1223.8 ±40.9 | 77.9 ±41.5 |
| selectStorm | 120.8 ±8.4 | 294.3 ±38.2 | 31.6 ±0.2 |

## 5k rows (ms, median ±CI95)

| op | preact-web | vue-web | vapor-web |
|---|---|---|---|
| create | 344.9 ±5.9 | 306.1 ±1.2 | 276.9 ±12.3 |
| update10th | 46.8 ±3.8 | 48.4 ±3.7 | 29.4 ±2.2 |
| select | 14.3 ±6.0 | 16.9 ±10.2 | 13.3 ±3.7 |
| updateStorm | 1961.2 ±114.8 | 2307.4 ±150.1 | 843.9 ±271.5 |
| selectStorm | 248.1 ±32.9 | 601.4 ±37.1 | 31.6 ±0.3 |

## 10k rows (ms, median ±CI95)

| op | preact-web | vue-web | vapor-web |
|---|---|---|---|
| create | 712.0 ±35.1 | 640.7 ±53.1 | 497.6 ±20.0 |
| update10th | 89.9 ±10.9 | 97.6 ±9.8 | 59.5 ±12.4 |
| select | 20.4 ±15.6 | 35.3 ±17.7 | 11.7 ±13.7 |
| updateStorm | 4218.7 ±87.6 | 5029.6 ±145.8 | 2600.4 ±408.7 |
| selectStorm | 650.7 ±30.2 | 1130.2 ±37.7 | 31.7 ±0.6 |

## 20k rows (ms, median ±CI95)

| op | preact-web | vue-web | vapor-web |
|---|---|---|---|
| create | 1309.4 ±59.5 | 1112.6 ±38.9 | 1052.6 ±10.3 |
| update10th | 173.4 ±20.7 | 215.1 ±4.0 | 120.6 ±3.8 |
| select | 51.1 ±26.7 | 97.6 ±30.8 | 8.0 ±30.0 |
| updateStorm | 9082.2 ±255.8 | 10016.6 ±278.2 | 6048.9 ±251.7 |
| selectStorm | 1541.3 ±50.8 | 2375.5 ±62.8 | 47.5 ±13.5 |

## 30k rows (ms, median ±CI95)

| op | preact-web | vue-web | vapor-web |
|---|---|---|---|
| create | 2157.6 ±24.5 | 1724.1 ±38.3 | 1547.2 ±54.3 |
| update10th | 285.8 ±11.2 | 306.9 ±4.6 | 188.0 ±9.3 |
| select | 61.8 ±46.6 | 126.6 ±73.7 | 6.7 ±63.6 |
| updateStorm | 14244.9 ±655.9 | 16406.1 ±886.6 | 9802.2 ±392.9 |
| selectStorm | 2392.7 ±43.9 | 3655.4 ±124.3 | 47.0 ±2.7 |

