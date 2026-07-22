# Graph-eng four-axis factors (generated)

## Per-cell

| cell | coordinate | web gz | FCP ×1 | FCP ×4 |
|---|---|--:|--:|--:|
| content-vdom | OpStream/Dense/intrinsic/Split·Durable | 36943 | 249.7 | 955.9 |
| content-vdom-ifr | OpStream/Dense/intrinsic/Split·Durable+Ephemeral | 66010 | 212.1 | 825.2 |
| content-vdom-ifr-et | Code/Sparse/intrinsic/Split·Durable+Ephemeral | 108660 | 173.3 | 793.3 |
| content-vdom-et | Code/Sparse/intrinsic/Split·Durable | 77535 | 213.5 | 808.9 |
| content-vapor | Data/Sparse/recovered/Split·Durable | 46933 | 239.3 | 876.0 |
| content-vapor-dense | Data/Dense/—/Split·Durable | 46794 | 313.3 | 863.4 |
| content-vapor-ifr | Data/Sparse/recovered/Split·Durable+Ephemeral | 90079 | 208.3 | 941.0 |
| content-vapor-ifr-dense | Data/Dense/—/Split·Durable+Ephemeral | 89791 | 211.7 | 967.9 |
| content-vapor-ifr-sparse | Data/Sparse/recovered/Split·Durable+Ephemeral | 90079 | 209.4 | 894.0 |
| content-vapor-engine | Engine/Sparse/recovered/Split·Durable (stub-capable) | 47641 | 261.3 | 831.1 |
| content-vapor-ifr-engine-et | Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et paint) | 90813 | 222.3 | 909.0 |

## Main effects (marginal Δ, one axis at a time)

| factor | ×1 Δms | ×1 Δ% | ×4 Δms | ×4 Δ% |
|---|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | -10.4 | -4.2 | -79.9 | -8.4 |
| naming dense→sparse (vapor+IFR) | -2.3 | -1.1 | -73.9 | -7.6 |
| naming dense→sparse (vapor no-IFR) | -74 | -23.6 | 12.6 | 1.5 |
| staging opstream→code (vdom no-IFR) | -36.2 | -14.5 | -147 | -15.4 |
| staging opstream→code (vdom+IFR) | -38.8 | -18.3 | -31.9 | -3.9 |
| staging data→engine (vapor, STUB on web) | 22 | 9.2 | -44.9 | -5.1 |
| ifr off→on (vdom) | -37.6 | -15.1 | -130.7 | -13.7 |
| ifr off→on (vapor sparse) | -31 | -13 | 65 | 7.4 |
| ifrPaint plain→engine-et (vapor, STUB on web) | 12.9 | 6.2 | 15 | 1.7 |

> Engine/engine-et cells run with the native ET PAPI family ABSENT on Lynx-for-Web: __VUE_LYNX_ENGINE_ET_STATUS__ = stub, interpretation fallback. Their deltas measure probe/flag overhead only — NOT an engine win. Ops-level create/update factorial: see graph-eng-create-update.json.
