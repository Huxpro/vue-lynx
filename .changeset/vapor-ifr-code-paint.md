---
"vue-lynx": patch
---

feat(graph-eng): wire `ifrPaint: 'code-paint'` (+ifr:c) at runtime (#340)

- Main thread now materializes the ephemeral IFR first-frame copy through a compiled Code-Template `create()` executor when `ifrPaint: 'code-paint'` (legacy `disposable-et`) is requested, while the persistent Vapor tree stays on the Data-Template interpreter. Unlike `native-paint`/`engine-et` (a web stub), this runs on Lynx for Web and is measurable.
- New `packages/vue-lynx/main-thread/src/code-template.ts`: compiles a REGISTER_TREE residual into a flat preorder plan once, then replays it per clone — the interpreter specialized away (first Futamura projection). Byte-for-byte parity with the dense/sparse interpreters (element registry, selector-attribute deferral, insert tracking) so BG hydration adopts/replays the ephemeral copy unchanged. Status published via `__VUE_LYNX_CODE_PAINT_STATUS__`.
- `legalCells()` gains `vapor-data-block-ifr-code-paint` (coordinate `data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(code-paint)`); it is NOT `engineNaOnWeb`.
- `plain` and `native-paint` behavior is unchanged.
