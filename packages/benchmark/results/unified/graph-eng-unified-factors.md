# Unified benchmark — five-axis per-cell create/update + factors (generated)

source: `cross-storms-graph-eng-4axis-full.json` (2026-07-22T19:01:59.794Z, reps=2)

## Per-cell @1k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent | 256.8 | 26.4 | 171.4 | 23.6 | 77.8 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent | 216.1 | 24.5 | 132.6 | 25.1 | 73.9 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral | 228.4 | 24.2 | 147.3 | 25.5 | 74.9 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral | 234.3 | 23.4 | 139.3 | 24.3 | 74.5 |
| vapor +b | vapor | tree/block/traversal+recover/BTS/persistent | 236.8 | 24.7 | 83.1 | 24.4 | 25.7 |
| vapor | vapor-dense | tree/node/traversal/BTS/persistent | 225.9 | 25.3 | 80.2 | 24.8 | 24.3 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent (N/A on web) | 250.9 | 22.4 | 95.2 | 25.2 | 23.6 |
| vapor +b +ifr | vapor-ifr | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 241.6 | 23.6 | 89.5 | 25.6 | 24.7 |
| vapor +ifr | vapor-ifr-dense | tree/node/traversal/BTS+MTS/persistent+ephemeral | 250 | 24.5 | 93.8 | 25 | 25.5 |
| vapor +b +ifr (alias) | vapor-ifr-sparse | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 245.6 | 25.1 | 92.4 | 24.4 | 25.1 |
| vapor +b +ifr:e | vapor-ifr-engine-et | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral(native-paint) (N/A on web) | 252.8 | 24.3 | 109.1 | 22.9 | 19.9 |

## Per-cell @10k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent | 2017.2 | 173.5 | 2585.2 | 107.2 | 1329.6 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent | 2161.3 | 194.7 | 2885.3 | 123.1 | 1508.7 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral | 2042.7 | 167.8 | 2653.2 | 107.9 | 1370.9 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral | 2059.7 | 187.1 | 2816 | 119.5 | 1448.9 |
| vapor +b | vapor | tree/block/traversal+recover/BTS/persistent | 2145.7 | 126.8 | 1225.5 | 124.1 | 161.2 |
| vapor | vapor-dense | tree/node/traversal/BTS/persistent | 2257.9 | 133.6 | 1186.7 | 89.9 | 167.8 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent (N/A on web) | 2138.3 | 125.6 | 1191 | 103.9 | 162.9 |
| vapor +b +ifr | vapor-ifr | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 2244 | 133.1 | 1078.4 | 120 | 162.2 |
| vapor +ifr | vapor-ifr-dense | tree/node/traversal/BTS+MTS/persistent+ephemeral | 2315.9 | 136.5 | 1278.1 | 105 | 173.8 |
| vapor +b +ifr (alias) | vapor-ifr-sparse | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 2176.5 | 131.9 | 1252.2 | 105.6 | 167.6 |
| vapor +b +ifr:e | vapor-ifr-engine-et | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral(native-paint) (N/A on web) | 2260.5 | 132.2 | 1221 | 112.5 | 175.9 |

## Per-cell @30k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent | 6428 | 532 | 12452 | 543.5 | 4786.3 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent | 6316.8 | 547.5 | 12495.5 | 559.1 | 5188.3 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral | 6476.6 | 524 | 12963.4 | 499.7 | 5128.6 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral | 6709 | 563.8 | 14629.6 | 496.9 | 4893.9 |
| vapor +b | vapor | tree/block/traversal+recover/BTS/persistent | 6759.3 | 370.2 | 11999 | 324.6 | 451.4 |
| vapor | vapor-dense | tree/node/traversal/BTS/persistent | 6849 | 380.3 | 12113.9 | 321 | 408.6 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent (N/A on web) | 7247.5 | 362.2 | 12137.5 | 276.6 | 435.3 |
| vapor +b +ifr | vapor-ifr | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 7041.7 | 361.1 | 11175.9 | 337 | 431.7 |
| vapor +ifr | vapor-ifr-dense | tree/node/traversal/BTS+MTS/persistent+ephemeral | 6590.9 | 360.3 | 13178.3 | 359.2 | 427.6 |
| vapor +b +ifr (alias) | vapor-ifr-sparse | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral | 6813.4 | 354.7 | 10912.4 | 372 | 431.5 |
| vapor +b +ifr:e | vapor-ifr-engine-et | tree/block/traversal+recover/BTS+MTS/persistent+ephemeral(native-paint) (N/A on web) | 6685.1 | 346.9 | 9983.1 | 306.2 | 400.8 |

## Main effects (marginal Δ%, one axis at a time)

### @1k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | -12% | -4.2% | -53.2% | 5.1% | -68.8% |
| +b effect (vdom, no ifr) | -15.8% | -7.2% | -22.6% | 6.4% | -5% |
| +b effect (vdom, with +ifr) | 2.6% | -3.3% | -5.4% | -4.7% | -0.5% |
| +b effect (vapor, no ifr) | 4.8% | -2.4% | 3.6% | -1.6% | 5.8% |
| +b effect (vapor, with +ifr) | -3.4% | -3.7% | -4.6% | 2.4% | -3.1% |
| +b:t→e effect (vapor, N/A on web) | 6% | -9.3% | 14.6% | 3.3% | -8.2% |
| +ifr effect (vdom) | -11.1% | -8.3% | -14.1% | 8.1% | -3.7% |
| +ifr effect (vapor +b) | 2% | -4.5% | 7.7% | 4.9% | -3.9% |
| +ifr:e paint effect (N/A on web) | 4.6% | 3% | 21.9% | -10.5% | -19.4% |

### @10k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | 11.9% | -23% | -54.1% | -16.1% | -87.4% |
| +b effect (vdom, no ifr) | 7.1% | 12.2% | 11.6% | 14.8% | 13.5% |
| +b effect (vdom, with +ifr) | 0.8% | 11.5% | 6.1% | 10.8% | 5.7% |
| +b effect (vapor, no ifr) | -5% | -5.1% | 3.3% | 38% | -3.9% |
| +b effect (vapor, with +ifr) | -3.1% | -2.5% | -15.6% | 14.3% | -6.7% |
| +b:t→e effect (vapor, N/A on web) | -0.3% | -0.9% | -2.8% | -16.3% | 1.1% |
| +ifr effect (vdom) | 1.3% | -3.3% | 2.6% | 0.7% | 3.1% |
| +ifr effect (vapor +b) | 4.6% | 5% | -12% | -3.3% | 0.6% |
| +ifr:e paint effect (N/A on web) | 0.7% | -0.7% | 13.2% | -6.3% | 8.4% |

### @30k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | 6.5% | -28.5% | -2.7% | -40.9% | -91.5% |
| +b effect (vdom, no ifr) | -1.7% | 2.9% | 0.3% | 2.9% | 8.4% |
| +b effect (vdom, with +ifr) | 3.6% | 7.6% | 12.9% | -0.6% | -4.6% |
| +b effect (vapor, no ifr) | -1.3% | -2.7% | -0.9% | 1.1% | 10.5% |
| +b effect (vapor, with +ifr) | 6.8% | 0.2% | -15.2% | -6.2% | 1% |
| +b:t→e effect (vapor, N/A on web) | 7.2% | -2.2% | 1.2% | -14.8% | -3.6% |
| +ifr effect (vdom) | 0.8% | -1.5% | 4.1% | -8.1% | 7.2% |
| +ifr effect (vapor +b) | 4.2% | -2.5% | -6.9% | 3.8% | -4.4% |
| +ifr:e paint effect (N/A on web) | -5.1% | -3.9% | -10.7% | -9.1% | -7.2% |

> Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. create = Create N rows; update = update10th / updateStorm (50 ticks); engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family absent on web) — their deltas are probe overhead, not engine wins.
