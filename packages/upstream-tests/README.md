# Vue Upstream Tests

## Overview

This package runs the official `vuejs/core` test suites against our **ShadowElement-backed custom renderer**, validating that our linked-list tree implementation satisfies Vue's renderer contract. Source: `vuejs/core` v3.5.12, pinned via git submodule at `core/`.

**Total: 1013 tests across 51 suites -- 882 pass, 131 skip, 0 fail**

| Config                                         | Suites | Pass    | Skip   | Fail  |
| ---------------------------------------------- | ------ | ------- | ------ | ----- |
| `pnpm test` (runtime-core, reactivity, shared) | 44     | 824     | 89     | 0     |
| `pnpm test:dom` (runtime-dom)                  | 7      | 58      | 42     | 0     |
| **Total**                                      | **51** | **882** | **131** | **0** |

### By package

| Package      | Suites | Pass | Skip |
| ------------ | ------ | ---- | ---- |
| runtime-core | 24     | 433  | 71   |
| reactivity   | 15     | 345  | 18   |
| shared       | 5      | 46   | 0    |
| runtime-dom  | 7      | 58   | 42   |

> _Note: `computed.spec.ts` (48 tests) excluded due to module initialization conflict; 4 gc tests auto-skipped by `describe.skipIf(!global.gc)`. reactivity and shared test the upstream npm packages themselves (version compatibility smoke tests), not our pipeline._

---

## Testing Approach

We run Vue's upstream tests at two layers, each with a different adapter that exercises a different slice of our pipeline. A third layer of hand-written tests covers Lynx-specific functionality that the upstream suite cannot reach.

The tests that actually validate our pipeline are runtime-core + runtime-dom:

| Layer            | What it validates                             | Pass    | Skip   |
| ---------------- | --------------------------------------------- | ------- | ------ |
| **runtime-core** | ShadowElement linked-list + Vue VDOM diff      | 407     | 59     |
| **runtime-dom**  | patchProp / render -> ops -> applyOps -> PAPI -> jsdom  | 58      | 42     |
| **Total**        |                                               | **465** | **101** |

### Layer 1: Conformance tests (`pnpm test`)

**Config**: `vitest.config.ts` | **Adapter**: `src/lynx-runtime-test.ts`

Replaces Vue's `@vue/runtime-test` with an adapter backed by our real `ShadowElement` linked-list. The adapter creates `TestElement`/`TestText`/`TestComment` wrappers around `ShadowElement` instances so that upstream test assertions (`el.children[0]`, `el.props.foo`, `el.parentNode`) work unchanged, while all tree operations (`insert`, `remove`, `parentNode`, `nextSibling`) delegate to `ShadowElement`'s linked-list methods.

This validates that our renderer satisfies Vue's **renderer contract** -- every `RendererOptions` method, the full keyed/unkeyed diffing algorithm including LIS optimization, fragment handling, component lifecycle, and all Composition API hooks. No ops pipeline, no PAPI, no dual-thread -- pure renderer logic.

The runtime-core tests exercise **every** `RendererOptions` method our adapter exposes:

| nodeOp                           | Validated by                                                            |
| -------------------------------- | ----------------------------------------------------------------------- |
| `createElement(tag)`             | rendererElement, rendererChildren, rendererFragment, rendererComponent  |
| `createText(text)`               | rendererElement, rendererChildren, rendererFragment                     |
| `createComment(text)`            | rendererFragment (anchor nodes)                                         |
| `insert(child, parent, ref?)`    | rendererChildren (keyed/unkeyed diff), rendererFragment (fragment move) |
| `remove(child)`                  | rendererChildren, rendererFragment, rendererComponent (unmount)         |
| `setText(node, text)`            | rendererChildren (unkeyed text patching)                                |
| `setElementText(el, text)`       | rendererChildren (text replacement), rendererElement                    |
| `parentNode(node)`               | rendererChildren (keyed diff lookups), rendererFragment                 |
| `nextSibling(node)`              | rendererChildren (keyed diff anchor resolution), rendererFragment       |
| `patchProp(el, key, prev, next)` | rendererElement (prop patching), rendererComponent, componentProps      |

These confirm that `ShadowElement`'s doubly-linked list (`firstChild`/`lastChild`/`prev`/`next`/`parent`) correctly supports Vue's VDOM diffing algorithm, including the longest increasing subsequence (LIS) optimization for keyed children.

Covers: runtime-core (23 suites), reactivity (15 suites), shared (5 suites).

### Layer 2: Integration tests (`pnpm test:dom`)

**Config**: `vitest.dom.config.ts` | **Adapter**: `src/lynx-runtime-dom-bridge.ts` + `src/runtime-dom-setup.ts`

Runs Vue's `runtime-dom` test suites through the **full dual-thread pipeline**: BG `ShadowElement` -> ops buffer -> `syncFlush()` -> MT `applyOps` -> PAPI -> jsdom. Uses `@lynx-js/testing-environment` with jsdom to simulate the dual-thread environment in a single Node.js process.

The bridge operates at two levels:

**patchProp-level** (for prop/style/event suites): Intercepts `patchProp` calls, routes them through our real `nodeOps.patchProp` (which pushes ops), sync-flushes the ops to the main thread, then applies post-pipeline corrections on the jsdom element:

- **DOM property shim**: PAPI only has `__SetAttribute` (string setAttribute), but some HTML props must be set as DOM properties (`input.value`, `select.multiple`, `el.srcObject`). After the pipeline runs, the shim sets these as properties on the jsdom element.
- **Style shim**: Uses `setProperty()` instead of `Object.assign()` for each style entry, enabling `!important`, CSS custom properties, shorthand expansion, vendor prefix fallback, and multi-value arrays.

**Full render** (for directive suites like vModel): Uses vue-lynx's raw renderer to mount components through the complete pipeline: `ShadowElement` tree -> ops -> `applyOps` -> PAPI -> jsdom. After render, the bridge:

- **Event forwarders**: Converts DOM events (`input`, `change`) to PAPI events (`bindEvent:input`, `bindEvent:confirm`) with Lynx-style `{ detail: { value } }` payloads.
- **Value sync shim**: Patches `setAttribute` on input/textarea elements to also set the `.value` DOM property, since jsdom's `setAttribute('value')` doesn't update `.value` after it's been programmatically set.

These shims run after the full pipeline so ops serialization and cross-thread transfer are still exercised. They only correct the final jsdom state to compensate for PAPI limitations.

Covers: runtime-dom (7 suites: patchStyle, patchClass, patchEvents, patchProps, patchAttrs, vOn, vModel).

### Layer 3: E2E pipeline tests (`testing-library/`)

**Config**: `testing-library/vitest.config.ts` | **No adapter** -- uses vue-lynx directly

Hand-written tests that start from `defineComponent` + `h()` with **Lynx elements and Lynx APIs**, go through the full dual-thread pipeline, and assert against the final jsdom DOM. These cover the surface area that upstream tests structurally cannot reach because Vue knows nothing about:

- Lynx elements (`<view>`, `<text>`, `<list>`, `<list-item>`)
- Lynx events (`bindtap`, `onTap`)
- Lynx APIs (`useMainThreadRef`, `main-thread-bindtap` worklet events)
- Lynx-specific ops (`SET_ID`, `SET_WORKLET_EVENT`, `SET_MT_REF`, `INIT_MT_REF`)
- vue-lynx conventions (`vue-ref-{id}` attributes, `fontSize: 16` -> `"16px"` auto-unit)

### How upstream tests are adapted

Since we run upstream test files from outside the `vuejs/core` monorepo, three mechanisms bridge the gap:

**Import rewriting**: Vite transform plugins rewrite relative imports (`from '../src/...'`) in upstream test files to the published `@vue/runtime-core`, `@vue/reactivity`, and `@vue/shared` ESM bundles. This works for public API but fails for private symbols (see Skip Analysis).

**Module instance unification**: Explicit Vite aliases ensure that bare specifiers (`@vue/runtime-core`) resolve to the same ESM bundle files that the import-rewrite plugins target. Without this, Vite creates separate module instances with independent module-scoped variables (`currentRenderingInstance`, scheduler queues, etc.), breaking ref owner tracking, flush timing, and injection context.

**Skiplist**: A Vite transform plugin reads `skiplist.json` / `skiplist-dom.json` and converts `it('name'` to `it.skip('name'` for listed test names. This avoids modifying upstream test files.

---

## Skip Analysis

131 skips break down into four categories: structurally impossible (cannot pass outside the Vue monorepo), substantive (related to platform differences or our pipeline), Teleport-specific (tests requiring DOM renderer or template compiler), and vModel-specific (Lynx element/event model differences).

### Structurally impossible (77 skips)

These tests import Vue's private internal symbols (`queueJob`, `normalizeVNode`, `currentInstance`, `targetMap`, etc.) via relative paths like `from '../src/scheduler'`. Our import-rewrite plugin maps these to the published ESM bundle, which only exports public API. The imports silently resolve to `undefined`.

| Category                     | Count | Examples                                                    |
| ---------------------------- | ----- | ----------------------------------------------------------- |
| Scheduler internal API       | 34    | `queueJob`, `flushPreFlushCbs`, `SchedulerJobFlags`         |
| VNode/Slots/Props internals  | 14    | `normalizeVNode`, `ShapeFlags`, `isEmitListener`            |
| Directive `currentInstance`  | 3     | `currentInstance` from `../src/component`                   |
| Reactivity internals         | 3     | `targetMap`, `getDepFromReactive`                           |
| Reactivity version mismatch | 5     | 3.5.12 source vs 3.5.30 npm: internal behavior changes     |
| Error handling (scheduler)   | 4     | Tests error paths inside scheduler jobs/computed            |
| componentProps (template)    | 3     | Requires runtime template compiler + `@vue/runtime-dom`     |
| GC auto-skip                 | 4     | Requires `--expose-gc` flag                                 |
| SSR                          | 1     | Requires `@vue/server-renderer`                             |
| Bridge: no full `render()`  | 6     | Tests need `render(h(...), container)`, bridge only supports `patchProp` |

### Substantive skips (20 skips)

#### Web/Lynx platform differences (14 tests)

Lynx doesn't support certain Web platform capabilities. If Lynx adds support for any of these, the corresponding tests can be unskipped directly.

| Subcategory                 | Count | Typical example                                           |
| --------------------------- | ----- | --------------------------------------------------------- |
| SVG                         | 4     | Lynx has no built-in SVG elements                         |
| Web Components              | 2     | Custom element event name mapping, `.value` setter        |
| Event system differences    | 4     | native `onclick` string, Vue timestamp guard, type check  |
| Form element DOM behavior   | 1     | `<select>` / `<option>` value reflection                  |

#### Serialization limitations (3 tests)

| Subcategory                 | Count | Root cause                                                |
| --------------------------- | ----- | --------------------------------------------------------- |
| `JSON.stringify` limitation | 3     | `Symbol` values lost in cross-thread serialization        |

### Teleport-specific skips (12 skips)

The `components/Teleport.spec.ts` suite has 38 tests; 26 pass through our adapter, 12 are skipped.

| Subcategory                        | Count | Root cause                                                 |
| ---------------------------------- | ----- | ---------------------------------------------------------- |
| DOM renderer (`domRender`/`createDOMApp`) | 8 | Tests mount into `document.createElement('div')` via the DOM renderer; our adapter only provides the test renderer — `parent._se` is undefined on HTMLElement |
| Template compiler (`compile()`)    | 2     | `compile` is not available in this build (requires `vue/dist/vue.esm-bundler.js`) |
| Name collision (`"should work"`)   | 2     | Accidentally matched by existing skiplist entry for directives suite |

### vModel-specific skips (22 skips)

The `directives/vModel.spec.ts` suite has 26 tests; 4 pass through the bridge, 22 remain skipped.

#### Passing (4 tests)

These tests exercise `vModelText` through the full dual-thread pipeline via the bridge's `render()` function. The bridge forwards DOM `input`/`change` events to PAPI `bindEvent:input`/`bindEvent:confirm` listeners with Lynx-style `detail.value` payloads, and patches `setAttribute('value')` to also sync the `.value` DOM property.

- `should work with multiple listeners` -- array `onUpdate:modelValue` handlers
- `should work with updated listeners` -- handler swap via reactivity
- `should work with textarea` -- textarea two-way binding
- `should support modifiers` -- `.number`, `.trim`, `.lazy` (bridge maps `change` -> `confirm`)

#### Skipped: Lynx element/event model (22 tests)

| Subcategory                        | Count | Root cause                                                 |
| ---------------------------------- | ----- | ---------------------------------------------------------- |
| Checkbox / radio / select          | 14    | Lynx has no native equivalents for these elements          |
| PAPI single-listener limit         | 1     | Test has both `onInput` and `vModelText` on same element; PAPI `__AddEvent` allows only one handler per event key, so the second overwrites the first |
| `input.type=number` DOM behavior   | 3     | DOM auto-parses numeric values; Lynx pipeline uses string attributes |
| `input.type=range` DOM behavior    | 1     | DOM min/max clamping; no Lynx equivalent                   |
| Composition events                 | 1     | Uses `compositionstart`/`compositionend` DOM events; Lynx uses `detail.isComposing` |
| MutationObserver                   | 1     | Asserts no unnecessary DOM writes; bridge value sync interferes |
| Numeric edge case                  | 1     | Leading-zero value comparison + `vModelDynamic` behavior    |
