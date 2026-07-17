---
"vue-lynx": minor
---

feat: element templates (compile-time template lowering, route b)

With `pluginVueLynx({ enableElementTemplates: true })`, eligible template subtrees — plain elements with compile-time-known structure — are lowered into element templates: the static skeleton compiles to a straight-line element-creation function executed on the main thread via a single `INSTANTIATE_TEMPLATE` op, while interior dynamic parts ("holes") receive deterministic ids updated through the ordinary SET ops. One vnode and one op replace per-node vdom/ops/interpreter work.

Structural features (components, v-if/v-for hosts, slots, refs, runtime directives, `<list>`) always stay on the normal vdom path; template roots keep all their props/directives on the vnode, so Transition/v-show/ref on lowered roots behave unchanged. Scoped-CSS ids are baked into skeletons at compile time. Lowered and unlowered renders produce identical documents, and lowered ops streams hydrate through IFR's fast path unchanged — the two features compose.

In the interpreter-proxy benchmark this renders typical ~1000-element first screens 7–15× faster and shrinks the cross-thread ops payload 3–1000× (see packages/ifr-bench/REPORT.md). Defaults to following `enableIFR` (element templates attack exactly the cost IFR adds — the synchronous main-thread render); pass `enableElementTemplates: false` to opt out while keeping IFR, or `true` to enable them for the ordinary background pipeline alone. Zero behavior change when off.
