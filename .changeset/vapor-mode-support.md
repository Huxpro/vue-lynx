---
"vue-lynx": minor
---

Experimental Vue Vapor mode support (requires Vue 3.6 beta).

Vapor is Vue's compilation-based, Virtual-DOM-free rendering mode that ships
in the Vue 3.6 beta line. vue-lynx now runs Vapor components on Lynx's
dual-thread architecture:

- Opt in with `pluginVueLynx({ vapor: true })` and write components with
  `<script setup vapor>`. Pure-Vapor apps mount via `createApp()` from
  `'vue'` (or `createVaporApp` from `vue-lynx/with-vapor`).
- The Background Thread ShadowElement tree now exposes the DOM-compatible
  surface `@vue/runtime-vapor` drives directly (traversal, cloneNode,
  attributes/class/style facades, addEventListener), emitting the same
  flat ops stream — the Main Thread protocol is unchanged.
- Vapor template HTML is parsed by a built-in parser into inert prototypes;
  events compile to per-element listeners (`eventDelegation: false`);
  `.stop` maps to Lynx `catchEvent`; `v-model` uses Lynx `input`/`confirm`
  events; scoped CSS `data-v-*` attributes map to Lynx cssIds.
- Dev builds compile Vapor SFC templates correctly through a vapor-aware
  fork of rspack-vue-loader's templateLoader (upstream predates Vapor).

Not yet supported: mixing vdom and vapor components in one app
(`vaporInteropPlugin`), v-html, SSR/hydration.

The workspace Vue dependency moves to `3.6.0-beta.17` (Vapor is not
published in any stable Vue release yet).
