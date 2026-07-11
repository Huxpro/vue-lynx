# Feature: Element Templates (Route b — Block-Level Template Lowering)

**Date**: 2026-07-11
**Status**: Completed ✅
**Prereqs**: `0711-1-ifr-instant-first-frame.md` (protocol seam + IFR), `packages/ifr-bench/REPORT.md` (why: 7–15× first-frame win, 3–1000× protocol shrink)

---

## Background

The IFR strategy benchmark showed that the per-static-node cost — vdom
construction, ShadowElement allocation, ~5 ops frames, interpreter dispatch —
dominates first-frame JS time, and that lowering static structure to
straight-line PAPI at compile time (ReactLynx's snapshot insight) removes it
across every scene shape. The key architectural observation: **Vue's block
tree already is the snapshot vnode layer** — `patchFlags` + `dynamicChildren`
make the update path skip static parts; only *mount* still walks every node.
Element templates teach mount to materialize static structure from a
compile-time template.

## Design

**Lowering unit**: maximal *plain-element* subtrees — every descendant is an
element (no components, v-if/v-for hosts, slots, `<template>`, comments,
`list`/`list-item`/`page`); interior nodes carry only v-bind/v-on props (no
`ref`/`key`/`id`/vnode hooks/runtime directives). Dynamic props/text become
**holes**. The subtree **root keeps all of its own props and directives on
the vnode**, so Transition classes, v-show, ref, key on template roots behave
exactly like normal elements. Structural spines stay on the vdom path;
lowering is purely an optimization and can never change semantics —
ineligible shapes just don't lower.

**Compile time** (`plugin/src/compiler/element-template-transform.ts`, a
`nodeTransform` running at ROOT exit after all built-in transforms):

- analyzes each candidate against its `codegenNode` (compiled props preserve
  exact keys — `onTapOnce`, `withModifiers` wrappers, cache handles)
- generates a straight-line `create(P)` source (`__CreateView` /
  `__SetClasses` / `__AppendElement` …) returning `[root, hole0, …]`, with
  static props baked (attribute strings and `CAN_STRINGIFY` expressions) and
  the scoped-CSS cssId baked per node (`scopeIdToCssId(scopeId)`)
- hoists `(globalThis.__vueLynxRegisterElementTemplate || function(){})(id,
  holes, create)` — a **global, not a compiler helper**: helper symbols
  resolve against whichever compiler-core copy performs codegen, and
  @vue/compiler-sfc bundles its own copy (symbols registered against the
  standalone package codegen as `undefined` for script-setup inline
  templates)
- rewrites the element's `VNodeCall` in place: tag `"__vlx-tpl:<id>"`
  (content-hashed, cross-file dedup), hole props `__h0…` appended (values
  are the original compiled expressions, moved verbatim; text holes pass the
  INTERPOLATION node so codegen stringifies with *its own* toDisplayString
  helper), children cleared, patchFlag recomposed (TEXT stripped,
  PROPS+dynamicProps extended with hole keys)

**Runtime, background thread** (`runtime/src/element-template.ts`,
`node-ops.ts`):

- `registerElementTemplate(id, holes, create)` stores hole meta and forwards
  `create` to the main-thread registry global; installed on
  `globalThis.__vueLynxRegisterElementTemplate` at module evaluation (before
  any render module — they import 'vue-lynx' first)
- `createElement('__vlx-tpl:…')` allocates the root ShadowElement plus one
  detached ShadowElement per hole — **ids are contiguous after the root**, so
  both threads agree without shipping them — and pushes a single
  `INSTANTIATE_TEMPLATE [15, rootId, tplId, holeCount]` op
- `patchProp(el, '__hN', …)` delegates to the hole's ShadowElement with the
  original prop key, reusing the full event/class/style logic; `'#text'`
  holes push `SET_TEXT`. All updates flow through ordinary SET_* ops — the
  interpreter needed exactly one new case.

**Runtime, main thread** (`main-thread/src/element-templates.ts`,
`ops-apply.ts`, `entry-main.ts`):

- `INSTANTIATE_TEMPLATE` looks up create(), maps `rootId…rootId+holeCount` to
  the returned handles, sets the root's `vue-ref` attr (NodesRef parity);
  unregistered ids degrade to a placeholder view + error (tree survives)
- registration arrives via three routes: IFR bundles evaluate the render
  module directly (runtime forwards); interpreter-only bundles get the
  hoisted statements re-emitted by worklet-loader-mt
  (`extractTemplateRegistrations`, self-contained calls resolved against the
  entry-main adapter installed before user code); the duplicate-batch guard
  now also recognizes INSTANTIATE as a batch head
- IFR hydration: `OP_ARITY` entry (structural op) + teardown accounts for
  `rootId..rootId+holeCount`; identical streams still hit the strcmp fast
  path — **IFR × element templates compose with zero extra machinery**

**Build pipeline** (`plugin/src/index.ts`, `entry.ts`,
`loaders/worklet-loader-mt.ts`): opt-in `enableElementTemplates` (default
`false` — flag off is byte-identical behavior). When on: the transform joins
`compilerOptions.nodeTransforms`, MT loader rules receive
`elementTemplates: true` (keep `?vue&type=template` dependency edges,
extract registrations in both the script-sub-module and regular branches).

## Verification

- **Unit/integration** (testing-library, 128 tests total):
  - protocol layer (`element-template.test.ts`, 6): mount/update/events via
    holes, keyed v-for reorder of template roots, unregistered-template
    degradation, single-REMOVE unmount
  - compiler (`element-template-transform.test.ts`, 9): every template
    compiled twice (with/without transform) and rendered through the full
    dual-thread pipeline with **identical documents** asserted (plus
    assertions that lowering actually happened); updates, interior events,
    v-for bodies, structural-feature exclusion (v-if/ref/v-show), mixed
    static text, style/attr holes, scoped-CSS cssId baking, thresholds
  - IFR composition (`ifr.test.ts`): INSTANTIATE batches hydrate via the
    fast path without re-instantiation; hole events route to BG handlers
- **Real in-website examples**, built with the flag and executed headlessly
  (actual `.web.bundle` halves in a PAPI-over-jsdom env):
  - `hello-world` (IFR + templates): first frame from `renderPage` and the
    final document after full dual-thread run are **structurally identical**
    to the templates-off build (attr-order-insensitive DOM comparison); no
    element duplication (hydration skip confirmed on real bundles)
  - `gallery` `GalleryComplete` (non-IFR, native `<list>` + waterfall +
    worklets + MTS refs): full MT→renderPage→BG→vuePatchUpdate→interpreter
    run produces a document **identical** to the templates-off build;
    MT bundle carries extracted registrations, BG bundle carries lowered
    vnodes
- **Regression**: upstream runtime-core 854 / dom-pipeline 59 / local 23,
  ifr-bench correctness 21/21, all examples build (`event-modifiers` failure
  pre-exists on the base branch), dev-smoke, biome — all green with the flag
  off everywhere except the two showcase examples.

## Notes / follow-ups

- Attribute order on elements with both baked-static and hole props differs
  from the unlowered build (skeleton sets static props before patchProp sets
  holes) — semantically meaningless; verification uses structural DOM
  comparison.
- `elements` map entries for removed template instances leak like all
  removed elements do today (REMOVE never deletes map entries) — pre-existing
  pipeline behavior, tracked as a general fix.
- Future: emit skeletons into the bundle's native `elementTemplates` section
  (`__ElementFromBinary`) for engine-side instantiation; measure on-device;
  consider enabling by default after a release of bake time.
