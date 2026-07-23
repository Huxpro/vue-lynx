# Unified benchmark — six-column per-cell create/update + factors (generated)

source: `cross-storms-graph-eng-flags-full.json` (2026-07-23T20:44:49.969Z, reps=2)

## Per-cell @1k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent/— | 105.9 | 22.6 | 69.9 | 15.5 | 43.2 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent/bundle | 107.5 | 24.3 | 69.7 | 31.4 | 42.5 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral/— | 116.1 | 24.9 | 69.5 | 15.5 | 42.9 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral/bundle | 106 | 23.6 | 70.6 | 15.7 | 43.2 |
| vapor +b | vapor | data/block/traversal+recover/BTS/persistent/runtime | 114.9 | 21.4 | 26.1 | 15.2 | 15.4 |
| vapor | vapor-dense | data/node/traversal/BTS/persistent/runtime | 105.8 | 22.3 | 24.2 | 15.4 | 15.3 |
| vapor +b! | vapor-bang | data/block/traversal+recover/BTS/persistent/bundle | 112 | 24.1 | 23.8 | 15.4 | 15 |
| vapor +b:c | vapor-code | code/block/traversal+recover/BTS/persistent/bundle | 107.4 | 21.3 | 24.8 | 15 | 25.3 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent/runtime (N/A on web) | 108 | 23.3 | 38.4 | 15.4 | 15.2 |
| vapor +b +ifr | vapor-ifr | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 113.7 | 17.1 | 33.3 | 22.6 | 15.2 |
| vapor +ifr | vapor-ifr-dense | data/node/traversal/BTS+MTS/persistent+ephemeral/runtime | 110.6 | 20.7 | 33.6 | 15.3 | 15.5 |
| vapor +b +ifr (alias) | vapor-ifr-sparse | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 114.5 | 24.4 | 40.8 | 15.6 | 23.5 |
| vapor +b +ifr:e | vapor-ifr-engine-et | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(native-paint) (N/A on web) | 111.3 | 20.6 | 25.5 | 15.4 | 22.6 |

## Per-cell @10k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent/— | 925.2 | 61.3 | 842.9 | 42.6 | 380.1 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent/bundle | 952.6 | 62.4 | 810 | 36.4 | 410.7 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral/— | 929.8 | 52.1 | 812.8 | 39.2 | 408.6 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral/bundle | 916.1 | 56.8 | 831.4 | 43.5 | 427.5 |
| vapor +b | vapor | data/block/traversal+recover/BTS/persistent/runtime | 975.3 | 37.8 | 361.8 | 28.1 | 50.8 |
| vapor | vapor-dense | data/node/traversal/BTS/persistent/runtime | 952.8 | 37.5 | 346.1 | 29.2 | 42.9 |
| vapor +b! | vapor-bang | data/block/traversal+recover/BTS/persistent/bundle | 1014.6 | 39.4 | 357 | 26.7 | 45.1 |
| vapor +b:c | vapor-code | code/block/traversal+recover/BTS/persistent/bundle | 988.4 | 36.1 | 361 | 26.6 | 42.8 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent/runtime (N/A on web) | 1052.1 | 36.6 | 378 | 26.2 | 44.5 |
| vapor +b +ifr | vapor-ifr | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 1023.5 | 36.5 | 379.4 | 23.8 | 43.7 |
| vapor +ifr | vapor-ifr-dense | data/node/traversal/BTS+MTS/persistent+ephemeral/runtime | 1039 | 35.9 | 348.1 | 31.2 | 40.2 |
| vapor +b +ifr (alias) | vapor-ifr-sparse | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 1031.4 | 42.9 | 378.9 | 23.8 | 48.4 |
| vapor +b +ifr:e | vapor-ifr-engine-et | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(native-paint) (N/A on web) | 977 | 37.3 | 356.1 | 28 | 41.9 |

## Per-cell @30k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent/— | 3146.8 | 224.3 | 3078.1 | 134.5 | 1609.5 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent/bundle | 2957.4 | 214.3 | 3286.9 | 140.3 | 1585.9 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral/— | 3059.9 | 198.7 | 3127.8 | 125.8 | 1643.6 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral/bundle | 3045.6 | 226.4 | 3155.6 | 131 | 1551.5 |
| vapor +b | vapor | data/block/traversal+recover/BTS/persistent/runtime | 3008.9 | 126.1 | 1457.5 | 76.8 | 133.5 |
| vapor | vapor-dense | data/node/traversal/BTS/persistent/runtime | 2858.1 | 139.9 | 1547.4 | 65.8 | 129.6 |
| vapor +b! | vapor-bang | data/block/traversal+recover/BTS/persistent/bundle | 3179 | 133 | 1629.5 | 71.5 | 133.2 |
| vapor +b:c | vapor-code | code/block/traversal+recover/BTS/persistent/bundle | 3056.9 | 125.5 | 1599.3 | 68.8 | 142.1 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent/runtime (N/A on web) | 3135.6 | 131.5 | 1646.9 | 75.9 | 132 |
| vapor +b +ifr | vapor-ifr | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 3257 | 131.3 | 1670.2 | 74.9 | 131.1 |
| vapor +ifr | vapor-ifr-dense | data/node/traversal/BTS+MTS/persistent+ephemeral/runtime | 2951.9 | 131.8 | 1662.3 | 72.5 | 164 |
| vapor +b +ifr (alias) | vapor-ifr-sparse | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 3168 | 129.6 | 1850.8 | 74.8 | 137.4 |
| vapor +b +ifr:e | vapor-ifr-engine-et | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(native-paint) (N/A on web) | 3219.1 | 127.2 | 1735.9 | 67.7 | 137.7 |

## Main effects (marginal Δ%, one axis at a time)

### @1k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | -0.1% | -1.3% | -65.4% | -0.6% | -64.6% |
| +b effect (vdom, no ifr) | 1.5% | 7.5% | -0.3% | 102.6% | -1.6% |
| +b effect (vdom, with +ifr) | -8.7% | -5.2% | 1.6% | 1.3% | 0.7% |
| +b effect (vapor, no ifr) | 8.6% | -4% | 7.9% | -1.3% | 0.7% |
| +b effect (vapor, with +ifr) | 2.8% | -17.4% | -0.9% | 47.7% | -1.9% |
| +b! delivery effect (vapor) | -2.5% | 12.6% | -8.8% | 1.3% | -2.6% |
| +b:d→c effect (vapor) | -6.5% | -0.5% | -5% | -1.3% | 64.3% |
| +b:d→e effect (vapor, N/A on web) | -6% | 8.9% | 47.1% | 1.3% | -1.3% |
| +ifr effect (vdom) | 9.6% | 10.2% | -0.6% | 0% | -0.7% |
| +ifr effect (vapor +b) | -1% | -20.1% | 27.6% | 48.7% | -1.3% |
| +ifr:e paint effect (N/A on web) | -2.1% | 20.5% | -23.4% | -31.9% | 48.7% |

### @10k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | 3% | -38.8% | -58.9% | -31.5% | -88.7% |
| +b effect (vdom, no ifr) | 3% | 1.8% | -3.9% | -14.6% | 8.1% |
| +b effect (vdom, with +ifr) | -1.5% | 9% | 2.3% | 11% | 4.6% |
| +b effect (vapor, no ifr) | 2.4% | 0.8% | 4.5% | -3.8% | 18.4% |
| +b effect (vapor, with +ifr) | -1.5% | 1.7% | 9% | -23.7% | 8.7% |
| +b! delivery effect (vapor) | 4% | 4.2% | -1.3% | -5% | -11.2% |
| +b:d→c effect (vapor) | 1.3% | -4.5% | -0.2% | -5.3% | -15.7% |
| +b:d→e effect (vapor, N/A on web) | 7.9% | -3.2% | 4.5% | -6.8% | -12.4% |
| +ifr effect (vdom) | 0.5% | -15% | -3.6% | -8% | 7.5% |
| +ifr effect (vapor +b) | 4.9% | -3.4% | 4.9% | -15.3% | -14% |
| +ifr:e paint effect (N/A on web) | -4.5% | 2.2% | -6.1% | 17.6% | -4.1% |

### @30k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | -9.2% | -37.6% | -49.7% | -51.1% | -91.9% |
| +b effect (vdom, no ifr) | -6% | -4.5% | 6.8% | 4.3% | -1.5% |
| +b effect (vdom, with +ifr) | -0.5% | 13.9% | 0.9% | 4.1% | -5.6% |
| +b effect (vapor, no ifr) | 5.3% | -9.9% | -5.8% | 16.7% | 3% |
| +b effect (vapor, with +ifr) | 10.3% | -0.4% | 0.5% | 3.3% | -20.1% |
| +b! delivery effect (vapor) | 5.7% | 5.5% | 11.8% | -6.9% | -0.2% |
| +b:d→c effect (vapor) | 1.6% | -0.5% | 9.7% | -10.4% | 6.4% |
| +b:d→e effect (vapor, N/A on web) | 4.2% | 4.3% | 13% | -1.2% | -1.1% |
| +ifr effect (vdom) | -2.8% | -11.4% | 1.6% | -6.5% | 2.1% |
| +ifr effect (vapor +b) | 8.2% | 4.1% | 14.6% | -2.5% | -1.8% |
| +ifr:e paint effect (N/A on web) | -1.2% | -3.1% | 3.9% | -9.6% | 5% |

> Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. create = Create N rows; update = update10th / updateStorm (50 ticks); engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family absent on web) — their deltas are probe overhead, not engine wins.
