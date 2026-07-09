# Vue Vapor Mode Support Implementation Plan

**Goal:** Make vue-lynx run Vapor-mode components (`<script setup vapor>`) on Lynx's dual-thread architecture, using the Vapor compiler/runtime shipped in `vue@3.6.0-beta.17` (Vapor lives in vuejs/core since 3.6; not the old vuejs/vue-vapor repo).

**Status of upstream (as of 2026-07-09):** Vapor is feature-complete but unstable, published only in the 3.6 beta/prerelease line (`vue@beta = 3.6.0-beta.17`). Compiled vapor components import ~40 helpers from `'vue'`. `@vue/runtime-vapor` is DOM-hard-wired ("runtime only runs in the browser") — there is **no custom-renderer hook** and none planned (roadmap vuejs/core#13687).

---

## Key research findings (verified against 3.6.0-beta.17 dist + local compile experiments)

1. **All compiled-code imports flow through `'vue'`** — which vue-lynx already aliases to itself (`chain.resolve.alias.set('vue', 'vue-lynx')`). We control the entire helper surface seen by compiled vapor components.
2. **runtime-vapor's DOM coupling is concentrated**:
   - `src/dom/node.ts`: `document.createElement/createTextNode/createComment/querySelector`
   - `src/dom/template.ts`: `document.createElement('template')` + `innerHTML` parsing + `cloneNode(true)`
   - `src/dom/event.ts`: `el.addEventListener`, `document.addEventListener` (delegation)
   - `src/dom/prop.ts`: `setAttribute/removeAttribute`, `className`, `classList`, `el.style` (via runtime-dom `patchStyle`), `textContent`, `nodeValue`, `key in el` dispatch, `$`-prefixed expando caches
   - `src/block.ts` etc.: `parent.insertBefore(node, anchor)`, `parent.removeChild(node)`, `node.remove()`, `parentNode`, `nextSibling`, `firstChild`, `childNodes[i]`, `nodeType`, `hasChildNodes`
   - `instanceof Node` (17×), `instanceof Element` (19×), `instanceof Comment` (10×) against **globals**
   - `optimizePropertyLookup()` patches `Element.prototype` / `Text.prototype` with `$`-expandos
   - `mountApp`: `container.nodeType`, `container.textContent = ''`, `setAttribute('data-v-app', '')`
3. **`eventDelegation: false` compiler option (verified)** makes all events compile to `_on(el, name, handler)` instead of `el.$evtclick = invoker` + document-level delegation. This removes the document-event dependency entirely.
4. **`compileScript` auto-detects vapor** (`sfc.vapor || options.vapor`) and inlines the vapor template when `inlineTemplate: true` (vue-loader enables that in prod). **`compileTemplate` does NOT auto-detect** — rspack-vue-loader 17.5.0 has zero vapor support, so the dev-mode separate-template path emits vdom code for a `__vapor: true` script → broken without a loader fix. Non-inline vapor templates compile to `export function render(_ctx, $props, $emit, $attrs, $slots)` which runtime-vapor accepts as a component `render` option.
5. **runtime-vapor imports shared infra from `@vue/runtime-dom`** (scheduler, `createAppAPI`, `patchStyle`, `callWithAsyncErrorHandling`, transition/teleport bases, `ensureRenderer` for interop). runtime-dom guards its module-scope `document` access, so importing it on the Lynx BG thread is safe.
6. **3.6's `runtime-core createRenderer` now returns `internals`** — the hook `vaporInteropPlugin` needs. Upstream's plugin hard-wires `ensureRenderer()` (runtime-dom's DOM renderer), so vdom↔vapor interop needs our own wiring (phase 2): alias `@vue/runtime-dom`'s `ensureRenderer` to return our ShadowElement renderer, or fork `vdomInterop.ts`.
7. Vapor constraints from the 3.6 changelog: `<script setup>` only, no Options API, `getCurrentInstance()` returns null in vapor components, no Suspense in vapor-only apps, `app.config.globalProperties` unsupported, custom directives use a new functional interface.
8. Template HTML strings are minimized (`"<view class=container><text> </text><!><input>"`): unquoted attrs, unclosed tags, `<!>` anchor comments, single-space text placeholders — our parser must handle exactly this dialect (compiler-generated, not arbitrary HTML).
9. `key in el` dispatch in `setProp` writes DOM props directly (`el[key] = v`) — collides with ShadowElement's internal `id`/`type` fields. Fields must be renamed (`id`→`uid`? — see Task R2) or shadowed with accessors.

## Architecture decision

**Reuse `@vue/runtime-vapor` unmodified; make the BG thread "DOM-compatible enough".** The MT side is untouched — vapor produces the exact same flat ops stream (CREATE / SET_* / INSERT / REMOVE / SET_EVENT) interpreted by `ops-apply.ts`.

Rejected alternatives:
- *Reimplement the 40-helper contract against ShadowElement* (via `runtimeModuleName`): loses createFor reconciliation, component system, slots, fallthrough — months of drift-prone porting. The helpers are overridable per-export anyway when Lynx semantics diverge.
- *Fork runtime-vapor*: maintenance burden across weekly betas.

Layering:

```
compiled vapor component
  → imports helpers from 'vue' (≡ vue-lynx)          [we re-export/override]
    → @vue/runtime-vapor internals                    [unmodified]
      → global document/Node/Element/Comment shims    [NEW: vapor/dom-shim.ts]
      → ShadowElement DOM-compat API                  [NEW: vapor/dom-compat.ts]
        → pushOp(...) + scheduleFlush()               [existing ops pipeline]
          → MT ops-apply → PAPI                       [untouched]
```

---

## File Structure

All paths relative to `packages/vue-lynx/`.

| File | Action | Responsibility |
|------|--------|----------------|
| `runtime/src/vapor/html-parser.ts` | **Create** | Parse compiler-emitted template HTML into detached ShadowElement prototypes (no ops) |
| `runtime/src/vapor/dom-shim.ts` | **Create** | Global `document`, `Node`/`Element`/`Comment`/`Text`/`HTMLElement`/`SVGElement`/`HTMLSlotElement` via `Symbol.hasInstance`; installed before runtime-vapor loads |
| `runtime/src/vapor/dom-compat.ts` | **Create** | ShadowElement DOM API: traversal getters, `cloneNode`, mutation methods (op-emitting), `setAttribute`/`className`/`classList`/`style`/`textContent`/`nodeValue`/`value`, `addEventListener`→event-registry |
| `runtime/src/vapor/index.ts` | **Create** | Vapor export surface: re-export runtime-vapor helpers; override `template`, `delegate`/`delegateEvents`, `withVaporModifiers`, `applyTextModel`, `setHtml` (warn), `createVaporApp` (page-root mount) |
| `runtime/src/shadow-element.ts` | **Modify** | Rename colliding fields (`id`→`uid`, `type`→`tag`), split raw link ops from op-emitting DOM methods |
| `runtime/src/node-ops.ts` | **Modify** | Share insert/remove/patch core with dom-compat; follow renames |
| `runtime/src/index.ts` | **Modify** | Re-export vapor surface; `createApp` routes `__vapor` roots to vapor mount |
| `plugin/src/index.ts` | **Modify** | `compilerOptions.eventDelegation: false`; wire vapor templateLoader; expose `vapor` plugin option if needed |
| `plugin/src/loaders/vapor-template-loader.ts` | **Create** | Fork of rspack-vue-loader templateLoader adding `vapor: descriptor.vapor` (dev/non-inline path) |
| `package.json` | **Modify** | `@vue/runtime-core` + `@vue/runtime-dom` + `@vue/runtime-vapor` @ 3.6.0-beta.17 |
| `packages/upstream-tests/…` | **Modify/Create** | Vapor test suite through in-memory adapter + ops assertions |
| `examples/vapor/` | **Create** | Minimal vapor example app |

## Tasks

### Phase A — baseline upgrade
- [ ] A1: Pin workspace Vue packages to `3.6.0-beta.17` (vue-lynx runtime deps, testing-library, upstream-tests, examples via catalog/overrides as appropriate).
- [ ] A2: `pnpm install`, build, run `pnpm test` + `pnpm test:upstream`; fix any 3.5→3.6 breakage (new alien-signals reactivity core) before adding vapor.

### Phase R — runtime (BG thread)
- [ ] R1: `html-parser.ts` — tokenizer for the compiler dialect: tags, quoted/unquoted/valueless attrs, text + entities (`&lt; &gt; &amp; &quot; &#39;`), `<!>`/`<!---->` comments, auto-close at EOF and on parent close. Unit-test against real compiler output samples.
- [ ] R2: shadow-element refactor — rename `id`→`uid`, `type`→`tag` (runtime-internal only; MT untouched); keep raw `_insertBefore`/`_removeChild` linking; grep-verify all sites.
- [ ] R3: `dom-compat.ts` — implement on ShadowElement: `nodeType`, `parentNode`, `nextSibling`, `previousSibling`, `firstChild`(exists), `lastChild`(exists), `childNodes`, `hasChildNodes`, `tagName`, `namespaceURI`, `textContent` get/set, `nodeValue` get/set, `cloneNode(deep)` (emits CREATE/SET_*/INSERT ops for the clone subtree), DOM-semantic `insertBefore`/`appendChild`/`removeChild`/`remove` (op-emitting, shares list-quirk logic with nodeOps), `setAttribute`/`removeAttribute`/`getAttribute` (class→SET_CLASS, style-string→SET_STYLE, id→SET_ID, data-v-*→SET_SCOPE_ID via scope-bridge, else SET_PROP), `className` get/set, `classList` (add/remove/toggle/contains over `_baseClass`), `style` facade (property assignment + `setProperty`/`removeProperty`/`getPropertyValue`/`cssText`/`item`/`length`, batched into SET_STYLE; interops with `_style`/vShow), `value` accessor, `addEventListener`/`removeEventListener` (event-registry register/unregister + SET_EVENT/REMOVE_EVENT, `_lynxCatch`→catchEvent, `once` option).
- [ ] R4: `dom-shim.ts` — `document` (`createElement` → op-emitting ShadowElement; `createTextNode`/`createComment` → op-emitting; `querySelector` → idRegistry; `createElement('template')` → template host whose `innerHTML` setter runs the parser into a detached `content` fragment with **op-less** prototype nodes), global ctor shims with `Symbol.hasInstance` mapping to ShadowElement node kinds. Prototype-patch tolerance for `optimizePropertyLookup`.
  - Op-less prototypes vs op-emitting clones: template prototypes are constructed by the parser directly (bypassing document.createElement), so MT never hears about them; `cloneNode(true)` emits the real ops.
- [ ] R5: `vapor/index.ts` — re-export full helper surface from `@vue/runtime-vapor`; overrides: `template` (defensive: route through shim; upstream impl works via template-host shim, verify then decide), `delegateEvents` (no-op + dev warn pointing at eventDelegation:false), `delegate` (register like `on`), `withVaporModifiers`/`withVaporKeys` (Lynx modifier semantics, `_lynxCatch`), `applyTextModel` (Lynx input protocol: `detail.value`, `confirm` for .lazy), `setHtml` (dev warn, unsupported), `createVaporApp` (wrap: `mount()` with no selector → page root, like existing createApp). `createApp` in index.ts: detect `rootComponent.__vapor` → vapor path.
- [ ] R6: import-order guarantee — dom-shim must install before `@vue/runtime-vapor` evaluates (side-effect import at top of vapor/index.ts; document.createElement etc. are called lazily so ordering is soft, but keep strict anyway).

### Phase C — compile pipeline (plugin)
- [ ] C1: add `eventDelegation: false` to `vueLoaderOptions.compilerOptions`.
- [ ] C2: `vapor-template-loader.ts` — replaces rspack-vue-loader's templateLoader in the chain (all layers); identical logic but passes `vapor: descriptor.vapor` (+ resolves descriptor via rspack-vue-loader's descriptorCache through `require` resolution from @rsbuild/plugin-vue). Covers the dev/non-inline path; prod inline path already works via compileScript auto-detection.
- [ ] C3: verify MT layer (worklet loaders) tolerate vapor compiled script output; `export default {};` sub-module invariant.
- [ ] C4: template-only vapor SFCs (`<template vapor>` without script) — synthesize `__vapor: true` component (mirror @vitejs/plugin-vue 6); low priority.

### Phase T — tests & example
- [ ] T1: parser unit tests (real compiler outputs incl. scoped `data-v-*`, `<!>`, nested unclosed tags).
- [ ] T2: runtime tests in `packages/upstream-tests` (node env, our shims): mount counter component (compiled-output style), assert shadow tree + ops stream; update/if/for/component/slots/fallthrough/v-show/template-refs; `nextTick` flush integration.
- [ ] T3: end-to-end: compile actual `.vue` vapor SFC via compiler-sfc in-test, evaluate module, mount, assert ops → optionally through dom-bridge (jsdom) — note global-ctor conflict: run vapor suite in node env, not jsdom.
- [ ] T4: `examples/vapor/` counter/todo app; `pnpm build` smoke.

### Phase 2 (follow-up, not this milestone)
- vdom↔vapor interop: alias `@vue/runtime-dom#ensureRenderer` → our renderer (3.6 exposes `internals` on custom renderers); or fork `vdomInterop.ts`.
- VaporTransition/VaporTeleport parity with our Transition/Teleport.
- HMR for vapor SFCs.
- Upstream a `vapor` option PR to rspack-vue-loader.

## Risks / open questions
- 3.6 beta churn: pin exact version; upstream-tests give regression cover.
- `patchStyle` fidelity: relies on our style facade behaving like CSSStyleDeclaration for the subset patchStyle touches (`cssText`, named props, `display`, `setProperty` for `--vars`/`!important`).
- `setProp`'s `key in el` dispatch can still hit prototype methods (`invoke`, `animate`, …) for exotic dynamic keys — accepted, documented.
- PrimJS (ES2019) compatibility: swc already transpiles node_modules; verify no `??=`-style leftovers in runtime-vapor after swc pass.
- Vapor uses `$`-prefixed expandos on nodes — ShadowElement must stay expando-tolerant (it is; plain class).
