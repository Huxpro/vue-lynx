# Unified benchmark — five-axis per-cell create/update + factors (generated)

source: `cross-storms-graph-eng-4axis-full.json` (2026-07-22T19:01:59.794Z, reps=2)

## Per-cell @1k (median ms)

| cell | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|--:|--:|--:|--:|--:|
| vdom | ops/node/random-access/BTS/persistent | 256.8 | 26.4 | 171.4 | 23.6 | 77.8 |
| vdom-et | code/block/random-access/BTS/persistent | 216.1 | 24.5 | 132.6 | 25.1 | 73.9 |
| vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral | 228.4 | 24.2 | 147.3 | 25.5 | 74.9 |
| vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral | 234.3 | 23.4 | 139.3 | 24.3 | 74.5 |
| vapor | tree/block/traversal+recover/BTS/persistent | 236.8 | 24.7 | 83.1 | 24.4 | 25.7 |
| vapor-dense | tree/node/traversal/BTS/persistent | 225.9 | 25.3 | 80.2 | 24.8 | 24.3 |
| vapor-engine | native/block/traversal+recover/Engine/persistent (N/A on web) | 250.9 | 22.4 | 95.2 | 25.2 | 23.6 |
| vapor-ifr | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 241.6 | 23.6 | 89.5 | 25.6 | 24.7 |
| vapor-ifr-dense | tree/node/traversal/BTS+MTS/persistent+ephemeral | 250 | 24.5 | 93.8 | 25 | 25.5 |
| vapor-ifr-sparse | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 245.6 | 25.1 | 92.4 | 24.4 | 25.1 |
| vapor-ifr-engine-et | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral(native-paint) (N/A on web) | 252.8 | 24.3 | 109.1 | 22.9 | 19.9 |

## Per-cell @10k (median ms)

| cell | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|--:|--:|--:|--:|--:|
| vdom | ops/node/random-access/BTS/persistent | 2017.2 | 173.5 | 2585.2 | 107.2 | 1329.6 |
| vdom-et | code/block/random-access/BTS/persistent | 2161.3 | 194.7 | 2885.3 | 123.1 | 1508.7 |
| vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral | 2042.7 | 167.8 | 2653.2 | 107.9 | 1370.9 |
| vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral | 2059.7 | 187.1 | 2816 | 119.5 | 1448.9 |
| vapor | tree/block/traversal+recover/BTS/persistent | 2145.7 | 126.8 | 1225.5 | 124.1 | 161.2 |
| vapor-dense | tree/node/traversal/BTS/persistent | 2257.9 | 133.6 | 1186.7 | 89.9 | 167.8 |
| vapor-engine | native/block/traversal+recover/Engine/persistent (N/A on web) | 2138.3 | 125.6 | 1191 | 103.9 | 162.9 |
| vapor-ifr | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 2244 | 133.1 | 1078.4 | 120 | 162.2 |
| vapor-ifr-dense | tree/node/traversal/BTS+MTS/persistent+ephemeral | 2315.9 | 136.5 | 1278.1 | 105 | 173.8 |
| vapor-ifr-sparse | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 2176.5 | 131.9 | 1252.2 | 105.6 | 167.6 |
| vapor-ifr-engine-et | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral(native-paint) (N/A on web) | 2260.5 | 132.2 | 1221 | 112.5 | 175.9 |

## Per-cell @30k (median ms)

| cell | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|--:|--:|--:|--:|--:|
| vdom | ops/node/random-access/BTS/persistent | 6428 | 532 | 12452 | 543.5 | 4786.3 |
| vdom-et | code/block/random-access/BTS/persistent | 6316.8 | 547.5 | 12495.5 | 559.1 | 5188.3 |
| vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral | 6476.6 | 524 | 12963.4 | 499.7 | 5128.6 |
| vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral | 6709 | 563.8 | 14629.6 | 496.9 | 4893.9 |
| vapor | tree/block/traversal+recover/BTS/persistent | 6759.3 | 370.2 | 11999 | 324.6 | 451.4 |
| vapor-dense | tree/node/traversal/BTS/persistent | 6849 | 380.3 | 12113.9 | 321 | 408.6 |
| vapor-engine | native/block/traversal+recover/Engine/persistent (N/A on web) | 7247.5 | 362.2 | 12137.5 | 276.6 | 435.3 |
| vapor-ifr | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 7041.7 | 361.1 | 11175.9 | 337 | 431.7 |
| vapor-ifr-dense | tree/node/traversal/BTS+MTS/persistent+ephemeral | 6590.9 | 360.3 | 13178.3 | 359.2 | 427.6 |
| vapor-ifr-sparse | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 6813.4 | 354.7 | 10912.4 | 372 | 431.5 |
| vapor-ifr-engine-et | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral(native-paint) (N/A on web) | 6685.1 | 346.9 | 9983.1 | 306.2 | 400.8 |

## Main effects (marginal Δ%, one axis at a time)

### @1k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | -7.8% | -6.4% | -51.5% | 3.4% | -67% |
| staging ops→code (vdom, no-IFR) | -15.8% | -7.2% | -22.6% | 6.4% | -5% |
| staging ops→code (vdom, +IFR) | 2.6% | -3.3% | -5.4% | -4.7% | -0.5% |
| naming node→block (vapor, no-IFR) | 4.8% | -2.4% | 3.6% | -1.6% | 5.8% |
| naming node→block (vapor, +IFR) | -1.8% | 2.4% | -1.5% | -2.4% | -1.6% |
| staging tree→native (vapor, N/A on web) | 6% | -9.3% | 14.6% | 3.3% | -8.2% |
| ifr off→on (vdom) | -11.1% | -8.3% | -14.1% | 8.1% | -3.7% |
| ifr off→on (vapor block) | 2% | -4.5% | 7.7% | 4.9% | -3.9% |
| ifrPaint plain→native-paint (N/A on web) | 2.9% | -3.2% | 18.1% | -6.1% | -20.7% |

### @10k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | 6.4% | -26.9% | -52.6% | 15.8% | -87.9% |
| staging ops→code (vdom, no-IFR) | 7.1% | 12.2% | 11.6% | 14.8% | 13.5% |
| staging ops→code (vdom, +IFR) | 0.8% | 11.5% | 6.1% | 10.8% | 5.7% |
| naming node→block (vapor, no-IFR) | -5% | -5.1% | 3.3% | 38% | -3.9% |
| naming node→block (vapor, +IFR) | -6% | -3.4% | -2% | 0.6% | -3.6% |
| staging tree→native (vapor, N/A on web) | -0.3% | -0.9% | -2.8% | -16.3% | 1.1% |
| ifr off→on (vdom) | 1.3% | -3.3% | 2.6% | 0.7% | 3.1% |
| ifr off→on (vapor block) | 4.6% | 5% | -12% | -3.3% | 0.6% |
| ifrPaint plain→native-paint (N/A on web) | 3.9% | 0.2% | -2.5% | 6.5% | 5% |

### @30k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | 5.2% | -30.4% | -3.6% | -40.3% | -90.6% |
| staging ops→code (vdom, no-IFR) | -1.7% | 2.9% | 0.3% | 2.9% | 8.4% |
| staging ops→code (vdom, +IFR) | 3.6% | 7.6% | 12.9% | -0.6% | -4.6% |
| naming node→block (vapor, no-IFR) | -1.3% | -2.7% | -0.9% | 1.1% | 10.5% |
| naming node→block (vapor, +IFR) | 3.4% | -1.6% | -17.2% | 3.6% | 0.9% |
| staging tree→native (vapor, N/A on web) | 7.2% | -2.2% | 1.2% | -14.8% | -3.6% |
| ifr off→on (vdom) | 0.8% | -1.5% | 4.1% | -8.1% | 7.2% |
| ifr off→on (vapor block) | 4.2% | -2.5% | -6.9% | 3.8% | -4.4% |
| ifrPaint plain→native-paint (N/A on web) | -1.9% | -2.2% | -8.5% | -17.7% | -7.1% |

> Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. create = Create N rows; update = update10th / updateStorm (50 ticks); engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family absent on web) — their deltas are probe overhead, not engine wins.
