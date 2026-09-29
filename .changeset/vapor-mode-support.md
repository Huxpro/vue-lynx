---
"vue-lynx": minor
---

Experimental Vue Vapor mode support (requires Vue 3.6 beta).

Vapor is Vue's compilation-based, Virtual-DOM-free rendering mode from the Vue 3.6 beta line. vue-lynx now runs Vapor components on Lynx's dual-thread architecture:

- Opt in with `pluginVueLynx({ vapor: true })` and write components with `<script setup vapor>`. `'vue'` then resolves to `vue-lynx/vapor`, a pure Vapor entry with no vdom renderer. Mount with `createApp()` from `'vue'`.
- The Background Thread `ShadowElement` tree exposes the DOM-compatible surface that `@vue/runtime-vapor` drives directly (traversal, `cloneNode`, attribute/class/style facades, `addEventListener`). It emits the same flat ops stream the vdom renderer uses, extended with template ops (below).
- Vapor template HTML is parsed into inert prototypes. Events compile to per-element listeners, `.stop` maps to Lynx `catchEvent`, and `v-model` uses Lynx `input`/`confirm` events.
- Dev builds compile Vapor SFC templates through a vapor-aware fork of rspack-vue-loader's templateLoader, because the upstream loader predates Vapor.

Not yet supported: mixing vdom and vapor components in one app (`vaporInteropPlugin`), `v-html`, SSR/hydration. See the Vapor Mode guide for the per-example support matrix.

**Vue version.** vue-lynx now depends on Vue `3.6.0-beta.17` (`@vue/runtime-core`, `@vue/compiler-core`, `@vue/runtime-dom`, `@vue/runtime-vapor`, `@vue/compiler-vapor`) for vdom apps too. Vapor is not published in any stable Vue release yet. Align your app's `vue` / `@vue/compiler-sfc` with this version.

**`ShadowElement.id` is now `ShadowElement.uid`.** The numeric element id moved to `uid`, freeing `id` for the DOM-style `id` attribute that runtime-vapor reads and writes. Code that read the numeric id from a template ref must switch to `uid`.
