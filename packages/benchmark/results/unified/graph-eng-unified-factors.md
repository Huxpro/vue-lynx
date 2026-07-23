# Unified benchmark — six-column per-cell create/update + factors (generated)

source: `cross-storms-graph-eng-b2.json` (2026-07-23T00:05:26.333Z, reps=2)

## Per-cell @1k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent/— | 202.3 | 24.7 | 127.4 | 26.6 | 70.9 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent/bundle | 201.9 | 24.8 | 126.1 | 26.1 | 64.6 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral/— | 199.7 | 23.2 | 124.6 | 26.5 | 67.5 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral/bundle | 217 | 26.9 | 132.6 | 26 | 65.1 |
| vapor | vapor-dense | data/node/traversal/BTS/persistent/runtime | 190.8 | 26.3 | 66.5 | 27 | 19.5 |
| vapor +b | vapor | data/block/traversal+recover/BTS/persistent/runtime | 213.5 | 26.9 | 67.4 | 27 | 20.5 |
| vapor +b! | vapor-bang | data/block/traversal+recover/BTS/persistent/bundle | 201.2 | 24.5 | 66.4 | 26.1 | 20.1 |
| vapor +b:c | vapor-code | code/block/traversal+recover/BTS/persistent/bundle | 196.8 | 25.5 | 61.7 | 27.1 | 13.2 |
| vapor +ifr | vapor-ifr-dense | data/node/traversal/BTS+MTS/persistent+ephemeral/runtime | 210.3 | 21.3 | 68.3 | 25.8 | 13.8 |
| vapor +b +ifr | vapor-ifr | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 201.9 | 27 | 68.8 | 17 | 19.2 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent/runtime (N/A on web) | 205.5 | 15.3 | 68.8 | 9.5 | 15.6 |
| vapor +b +ifr:e | vapor-ifr-engine-et | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(native-paint) (N/A on web) | 210.1 | 20.6 | 70 | 26.2 | 13.7 |

## Per-cell @10k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent/— | 1736.1 | 114.8 | 1857.7 | 79.5 | 984.1 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent/bundle | 1598.9 | 115.4 | 1941.9 | 77.7 | 1040.3 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral/— | 1661.5 | 117.1 | 1970.3 | 81.7 | 994.6 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral/bundle | 1683.1 | 117.2 | 1894.1 | 81.1 | 967.9 |
| vapor | vapor-dense | data/node/traversal/BTS/persistent/runtime | 1645.2 | 91.6 | 729.8 | 57.8 | 106 |
| vapor +b | vapor | data/block/traversal+recover/BTS/persistent/runtime | 1731.9 | 88.8 | 887.6 | 66.7 | 118.6 |
| vapor +b! | vapor-bang | data/block/traversal+recover/BTS/persistent/bundle | 1768.1 | 87.4 | 918.2 | 72.9 | 106.8 |
| vapor +b:c | vapor-code | code/block/traversal+recover/BTS/persistent/bundle | 1758.3 | 95.1 | 759.7 | 57.7 | 115.7 |
| vapor +ifr | vapor-ifr-dense | data/node/traversal/BTS+MTS/persistent+ephemeral/runtime | 1651.2 | 89.6 | 699.6 | 48.4 | 92.9 |
| vapor +b +ifr | vapor-ifr | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 1726 | 95.3 | 740.5 | 56.9 | 124.7 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent/runtime (N/A on web) | 1735.2 | 92.9 | 678.3 | 55.6 | 96.8 |
| vapor +b +ifr:e | vapor-ifr-engine-et | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(native-paint) (N/A on web) | 1697.7 | 92 | 795 | 67.5 | 107.7 |

## Per-cell @30k (median ms)

| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|---|--:|--:|--:|--:|--:|
| vdom | vdom | ops/node/random-access/BTS/persistent/— | 5278.8 | 478.3 | 10937.1 | 308.4 | 3569.8 |
| vdom +b | vdom-et | code/block/random-access/BTS/persistent/bundle | 4849.5 | 355.9 | 7205.4 | 248.6 | 3227.2 |
| vdom +ifr | vdom-ifr | ops/node/random-access/BTS+MTS/persistent+ephemeral/— | 4834.1 | 370 | 7336.3 | 306.8 | 3329.1 |
| vdom +b +ifr | vdom-ifr-et | code/block/random-access/BTS+MTS/persistent+ephemeral/bundle | 5402 | 369.9 | 7512.7 | 242.3 | 3173.6 |
| vapor | vapor-dense | data/node/traversal/BTS/persistent/runtime | 5132 | 253.8 | 6737.2 | 268.7 | 306.1 |
| vapor +b | vapor | data/block/traversal+recover/BTS/persistent/runtime | 5363.1 | 266.2 | 7220.6 | 236.8 | 275.2 |
| vapor +b! | vapor-bang | data/block/traversal+recover/BTS/persistent/bundle | 5054.1 | 250.4 | 6114.2 | 275.4 | 332.6 |
| vapor +b:c | vapor-code | code/block/traversal+recover/BTS/persistent/bundle | 5040.8 | 257.2 | 7294.5 | 291.3 | 309.7 |
| vapor +ifr | vapor-ifr-dense | data/node/traversal/BTS+MTS/persistent+ephemeral/runtime | 5133.9 | 242.9 | 6325.8 | 272.1 | 322.3 |
| vapor +b +ifr | vapor-ifr | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime | 5180.4 | 250.6 | 7069.6 | 288.9 | 362.9 |
| vapor +b:e | vapor-engine | native/block/traversal+recover/Engine/persistent/runtime (N/A on web) | 5146.7 | 246.6 | 6830.6 | 275.6 | 333.8 |
| vapor +b +ifr:e | vapor-ifr-engine-et | data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(native-paint) (N/A on web) | 5381.8 | 252.1 | 7075.9 | 279.9 | 340.1 |

## Main effects (marginal Δ%, one axis at a time)

### @1k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | -5.7% | 6.5% | -47.8% | 1.5% | -72.5% |
| +b effect (vdom, no ifr) | -0.2% | 0.4% | -1% | -1.9% | -8.9% |
| +b effect (vdom, with +ifr) | 8.7% | 15.9% | 6.4% | -1.9% | -3.6% |
| +b effect (vapor, no ifr) | 11.9% | 2.3% | 1.4% | 0% | 5.1% |
| +b effect (vapor, with +ifr) | -4% | 26.8% | 0.7% | -34.1% | 39.1% |
| +b! delivery effect (vapor) | -5.8% | -8.9% | -1.5% | -3.3% | -2% |
| +b:d→c effect (vapor) | -7.8% | -5.2% | -8.5% | 0.4% | -35.6% |
| +b:d→e effect (vapor, N/A on web) | -3.7% | -43.1% | 2.1% | -64.8% | -23.9% |
| +ifr effect (vdom) | -1.3% | -6.1% | -2.2% | -0.4% | -4.8% |
| +ifr effect (vapor +b) | -5.4% | 0.4% | 2.1% | -37% | -6.3% |
| +ifr:e paint effect (N/A on web) | 4.1% | -23.7% | 1.7% | 54.1% | -28.6% |

### @10k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | -5.2% | -20.2% | -60.7% | -27.3% | -89.2% |
| +b effect (vdom, no ifr) | -7.9% | 0.5% | 4.5% | -2.3% | 5.7% |
| +b effect (vdom, with +ifr) | 1.3% | 0.1% | -3.9% | -0.7% | -2.7% |
| +b effect (vapor, no ifr) | 5.3% | -3.1% | 21.6% | 15.4% | 11.9% |
| +b effect (vapor, with +ifr) | 4.5% | 6.4% | 5.8% | 17.6% | 34.2% |
| +b! delivery effect (vapor) | 2.1% | -1.6% | 3.4% | 9.3% | -9.9% |
| +b:d→c effect (vapor) | 1.5% | 7.1% | -14.4% | -13.5% | -2.4% |
| +b:d→e effect (vapor, N/A on web) | 0.2% | 4.6% | -23.6% | -16.6% | -18.4% |
| +ifr effect (vdom) | -4.3% | 2% | 6.1% | 2.8% | 1.1% |
| +ifr effect (vapor +b) | -0.3% | 7.3% | -16.6% | -14.7% | 5.1% |
| +ifr:e paint effect (N/A on web) | -1.6% | -3.5% | 7.4% | 18.6% | -13.6% |

### @30k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render effect (vdom → vapor, baselines) | -2.8% | -46.9% | -38.4% | -12.9% | -91.4% |
| +b effect (vdom, no ifr) | -8.1% | -25.6% | -34.1% | -19.4% | -9.6% |
| +b effect (vdom, with +ifr) | 11.7% | 0% | 2.4% | -21% | -4.7% |
| +b effect (vapor, no ifr) | 4.5% | 4.9% | 7.2% | -11.9% | -10.1% |
| +b effect (vapor, with +ifr) | 0.9% | 3.2% | 11.8% | 6.2% | 12.6% |
| +b! delivery effect (vapor) | -5.8% | -5.9% | -15.3% | 16.3% | 20.9% |
| +b:d→c effect (vapor) | -6% | -3.4% | 1% | 23% | 12.5% |
| +b:d→e effect (vapor, N/A on web) | -4% | -7.4% | -5.4% | 16.4% | 21.3% |
| +ifr effect (vdom) | -8.4% | -22.6% | -32.9% | -0.5% | -6.7% |
| +ifr effect (vapor +b) | -3.4% | -5.9% | -2.1% | 22% | 31.9% |
| +ifr:e paint effect (N/A on web) | 3.9% | 0.6% | 0.1% | -3.1% | -6.3% |

> Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. create = Create N rows; update = update10th / updateStorm (50 ticks); engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family absent on web) — their deltas are probe overhead, not engine wins.
