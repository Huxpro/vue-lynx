---
"vue-lynx": patch
---

Fix ReactLynx-style event props (`:bindtap`, `:catchtap`, `:global-bind*`,
`onTap`) being silently dropped in Vapor mode. The Vapor template compiler
emits these as plain attribute writes (`setAttr`), so handlers were
serialized into a SET_PROP op the Main Thread can't act on — buttons in
`examples/css-features` did nothing, which also made CSS `v-bind()` look
broken (variables applied on mount but never updated). Function-valued
event-shaped keys are now routed through `ShadowElement.setAttribute` to the
same event registration the vdom renderer's `patchProp` uses, covering the
compiled `setAttr`/`setProp` sites and runtime-vapor's internal paths
(attribute fallthrough onto a child component's root, `v-bind` spreads).
