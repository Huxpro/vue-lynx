---
"vue-lynx": patch
---

feat(graph-eng): four-axis template matrix — terminology, flags, Engine-Template (#321–#324)

- Axis flags: `templateNaming: 'dense'|'sparse'` (deprecates `enableSparseNaming`), `templateStaging: 'opstream'|'data'|'code'|'engine'`, `ifrPaint: 'plain'|'disposable-et'|'engine-et'`. All defaults preserve current behavior.
- `vue-lynx/internal/matrix`: four-axis types + `legalCells()` cell generator shared by benchmarks and reports.
- Engine-Template (M3b): `__CreateElementTemplate` family probe on the main thread with fail-safe interpretation fallback; status published via `__VUE_LYNX_ENGINE_ET_STATUS__` (`'native'|'stub'`) so benchmark cells stay honest.
- IFR × sparse (M3c): pinned by tests — hydration compares op frames structurally and accepts sparse uid blocks without densifying; divergent addressing falls back to the full background replay.
- Guard hardening (M1): randomized BG↔MT naming-parity tests on top of the per-slot tag-fingerprint validation.
