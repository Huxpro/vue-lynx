# Unified benchmark — four-axis per-cell create/update + factors (generated)

source: `cross-storms-graph-eng-4axis.json` (2026-07-22T13:31:54.554Z, reps=2)

## Per-cell @1k (median ms)

| cell | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|--:|--:|--:|--:|--:|
| vdom | OpStream/Dense/intrinsic/Split·Durable | 144.8 | 20.3 | 117.1 | 30.3 | 54.9 |
| vdom-ifr | OpStream/Dense/intrinsic/Split·Durable+Ephemeral | 160 | 23.9 | 108.4 | 30.3 | 62.8 |
| vdom-ifr-et | Code/Sparse/intrinsic/Split·Durable+Ephemeral | 149.8 | 18.8 | 112.1 | 29.6 | 60.7 |
| vdom-et | Code/Sparse/intrinsic/Split·Durable | 152.7 | 19.8 | 114.8 | 30 | 62.2 |
| vapor | Data/Sparse/recovered/Split·Durable | 161.1 | 17.2 | 53.8 | 29.5 | 21.5 |
| vapor-dense | Data/Dense/—/Split·Durable | 166.6 | 20.3 | 40.7 | 30.1 | 24.5 |
| vapor-engine | Engine/Sparse/recovered/Split·Durable (STUB on web) | 165 | 17.3 | 46.8 | 20.7 | 18.4 |
| vapor-ifr | Data/Sparse/recovered/Split·Durable+Ephemeral | 176 | 19.9 | 40.9 | 28.5 | 20.5 |
| vapor-ifr-dense | Data/Dense/—/Split·Durable+Ephemeral | 172.7 | 20 | 41.4 | 29.4 | 20 |
| vapor-ifr-sparse | Data/Sparse/recovered/Split·Durable+Ephemeral | 168.2 | 16.8 | 41.6 | 29.8 | 18.2 |
| vapor-ifr-engine-et | Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et) | 173.3 | 17.1 | 41.3 | 30 | 19.8 |

## Per-cell @10k (median ms)

| cell | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|--:|--:|--:|--:|--:|
| vdom | OpStream/Dense/intrinsic/Split·Durable | 1472.7 | 93.4 | 1463.7 | 68.4 | 743.4 |
| vdom-ifr | OpStream/Dense/intrinsic/Split·Durable+Ephemeral | 1477.5 | 99 | 1403.2 | 60.5 | 643.4 |
| vdom-ifr-et | Code/Sparse/intrinsic/Split·Durable+Ephemeral | 1460 | 103.3 | 1405.4 | 62.1 | 674.5 |
| vdom-et | Code/Sparse/intrinsic/Split·Durable | 1555.6 | 88.9 | 1340.4 | 66.7 | 712.9 |
| vapor | Data/Sparse/recovered/Split·Durable | 1441.5 | 64.2 | 663.6 | 38.2 | 59.2 |
| vapor-dense | Data/Dense/—/Split·Durable | 1498.1 | 62 | 739.5 | 34.8 | 70.6 |
| vapor-engine | Engine/Sparse/recovered/Split·Durable (STUB on web) | 1415.9 | 57.2 | 658.2 | 36.6 | 57.7 |
| vapor-ifr | Data/Sparse/recovered/Split·Durable+Ephemeral | 1500.8 | 62.6 | 701.4 | 35.1 | 57.1 |
| vapor-ifr-dense | Data/Dense/—/Split·Durable+Ephemeral | 1422.6 | 61.8 | 729.9 | 41 | 74.7 |
| vapor-ifr-sparse | Data/Sparse/recovered/Split·Durable+Ephemeral | 1572.3 | 69.8 | 798.6 | 45.1 | 68.2 |
| vapor-ifr-engine-et | Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et) | 1488.2 | 67.6 | 765.4 | 33.4 | 69.1 |

## Main effects (marginal Δ%, one axis at a time)

### @1k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | 11.3% | -15.3% | -54.1% | -2.6% | -60.8% |
| staging opstream→code (vdom, no-IFR) | 5.5% | -2.5% | -2% | -1% | 13.3% |
| staging opstream→code (vdom, +IFR) | -6.4% | -21.3% | 3.4% | -2.3% | -3.3% |
| naming dense→sparse (vapor, no-IFR) | -3.3% | -15.3% | 32.2% | -2% | -12.2% |
| naming dense→sparse (vapor, +IFR) | -2.6% | -16% | 0.5% | 1.4% | -9% |
| staging data→engine (vapor, STUB on web) | 2.4% | 0.6% | -13% | -29.8% | -14.4% |
| ifr off→on (vdom) | 10.5% | 17.7% | -7.4% | 0% | 14.4% |
| ifr off→on (vapor sparse) | 9.2% | 15.7% | -24% | -3.4% | -4.7% |
| ifrPaint plain→engine-et (vapor, STUB on web) | 3% | 1.8% | -0.7% | 0.7% | 8.8% |

### @10k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | -2.1% | -31.3% | -54.7% | -44.2% | -92% |
| staging opstream→code (vdom, no-IFR) | 5.6% | -4.8% | -8.4% | -2.5% | -4.1% |
| staging opstream→code (vdom, +IFR) | -1.2% | 4.3% | 0.2% | 2.6% | 4.8% |
| naming dense→sparse (vapor, no-IFR) | -3.8% | 3.5% | -10.3% | 9.8% | -16.1% |
| naming dense→sparse (vapor, +IFR) | 10.5% | 12.9% | 9.4% | 10% | -8.7% |
| staging data→engine (vapor, STUB on web) | -1.8% | -10.9% | -0.8% | -4.2% | -2.5% |
| ifr off→on (vdom) | 0.3% | 6% | -4.1% | -11.5% | -13.5% |
| ifr off→on (vapor sparse) | 4.1% | -2.5% | 5.7% | -8.1% | -3.5% |
| ifrPaint plain→engine-et (vapor, STUB on web) | -5.3% | -3.2% | -4.2% | -25.9% | 1.3% |

> Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. create = Create N rows; update = update10th / updateStorm (50 ticks); engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family absent on web) — their deltas are probe overhead, not engine wins.
