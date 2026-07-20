# Study + Design: Native Element Templates

**Date**: 2026-07-20
**Status**: Design / RFC 📐
**Prereqs**: `0711-1-ifr-instant-first-frame.md`, `0711-2-element-templates.md`
(the framework-level ET we ship today), `website/docs/guide/ifr.mdx#element-templates`

> Two-part document. **Part I** is a learning report on how ReactLynx
> (`lynx-family/lynx-stack`) evolved its rendering backend from **Snapshot** to
> the Lynx engine's **native Element Template**. **Part II** designs how Vue
> Lynx's own IFR + ET can adopt the same native Element Template, replacing the
> JS-`create()` backend our framework-level ET uses today.

---

# Part I — Learning report: Snapshot → Element Template (ReactLynx)

## 0. The headline: two mutually-exclusive backends

ReactLynx has **two parallel rendering backends**, chosen at compile time and
named literally in `packages/react/runtime/src/core/lynx/runtime-backend.ts`:

```ts
export const RUNTIME_BACKEND_SNAPSHOT = 'Snapshot';
export const RUNTIME_BACKEND_ELEMENT_TEMPLATE = 'Element Template';
export const sRuntimeBackend = Symbol.for('__REACT_LYNX_RUNTIME_BACKEND__');
// registerRuntimeBackend() throws if a lazy bundle's backend != the main card's:
//   "Snapshot and Element Template templates cannot share lazy bundles."
```

- **Snapshot** — `packages/react/runtime/src/snapshot/**` + SWC crate
  `swc_plugin_snapshot`. Static structure is built by a **JS `create()` closure
  running one PAPI call per node**.
- **Element Template** — `packages/react/runtime/src/element-template/**` + SWC
  crate `swc_plugin_element_template`. Static structure is a **serialized JSON
  template baked into the bundle** and instantiated by **one native call**.

The two are exclusive; when both are enabled ET wins (`transform/src/lib.rs`:
`use_snapshot_plugin = snapshot_enabled && !use_element_template_plugin`). ET is
still gated behind `experimental_useElementTemplate` (default `false`).

## 1. Snapshot (the "before")

### 1.1 Compiler output

For each static host-element subtree, `swc_plugin_snapshot` emits a **snapshot
definition** and rewrites the JSX site to a synthetic tag. Golden fixture
`swc_plugin_snapshot/tests/__swc_snapshots__/lib.rs/basic_full_static_snapshot_extract.js`:

```js
const __snapshot_da39a_test_1 = "__snapshot_da39a_test_1";
ReactLynx.snapshotCreatorMap[__snapshot_da39a_test_1] = (id) => ReactLynx.createSnapshot(
    id,
    function() {                          // ← JS create()
        const pageId = ReactLynx.__pageId;
        const el  = __CreateView(pageId);
        const el1 = __CreateText(pageId);
        __AppendElement(el, el1);
        const el2 = __CreateRawText("!!!");
        __AppendElement(el1, el2);
        return [ el, el1, el2 ];         // ← flat FiberElement[]
    },
    null,   // update[]  (per-value updater closures)
    null,   // slot[]    (dynamic-child descriptors)
    undefined, globDynamicComponentEntry, null, true);
let s = __SNAPSHOT__(<__snapshot_da39a_test_1/>);
```

`createSnapshot(uniqID, create, update, slot, cssId, entryName,
refAndSpreadIndexes, isLazySnapshotSupported)`
(`snapshot/snapshot/definition.ts`). **The static structure is JS** — a `create`
closure of raw PAPI calls returning a flat element array.

### 1.2 Dynamic parts — holes, slots, updates

Three artifacts encode dynamism:

- **`slot`**: `[DynamicPartType, elementIndex][]` — where dynamic children graft
  in. `DynamicPartType = { Attr:0, Spread:1, Slot:2, Children:3, ListChildren:4,
  MultiChildren:5, SlotV2:6, ListSlotV2:7 }`.
- **`update`**: per-value-index closures, each closing over the target
  `elementIndex` inside the `create()`-returned array, e.g.
  `(snap, i, old) => ReactLynx.updateEvent(snap, i, old, 3, "bindEvent", "tap", '')`.
- **`values`**: the runtime values array carried on the JSX site;
  `refAndSpreadIndexes` marks which entries are refs/spreads.

### 1.3 Runtime — `SnapshotInstance`

`snapshot/snapshot/snapshot.ts`. A Preact-`ContainerNode`-compatible node whose
`ensureElements()` calls `create!(this)`, stores `__elements` /
`__element_root`, applies `__SetCSSId`, replays `values`, and stitches children
via `slot[index]` using `__ReplaceElement` / `__AppendElement` /
`__InsertElementBefore`. `setAttribute('values', …)` runs
`update[i](this, i, old)` only when not deep-equal. A background mirror
`BackgroundSnapshotInstance` serializes (`toJSON` → `snapshotPatch`) to ship
first-screen/patch data to the main thread.

**Cost:** one JS call per node, executed serially on the main thread; the whole
subtree is built in JS via N PAPI calls. This is the cost ET removes.

## 2. Native Element Template (the "after")

### 2.1 The native PAPI family (`element-template/types.d.ts`)

```ts
function __CreateElementTemplate(
  templateKey: string,
  bundleUrl: string | null | undefined,
  attributeSlots: SerializableValue[] | null | undefined,  // dynamic attrs, by attrSlotIndex
  elementSlots: RuntimeElementSlots | null | undefined,     // dynamic children ElementRef[] per elementSlotIndex
  uid: number | string,
  options?: RuntimeOptions | null,
): ElementRef;                                              // returns the instantiated subtree ROOT

function __CreateTypedElementTemplate(type, attributes, elementSlots, uid, options?): ElementRef; // page/list
function __SetAttributeOfElementTemplate(element, attrSlotIndex, value, options?): void;  // update ONE attr slot
function __InsertNodeToElementTemplate(parent, elementSlotIndex, child, reference): void; // insert into a child slot
function __RemoveNodeFromElementTemplate(parent, elementSlotIndex, child): void;
function __SerializeElementTemplate(templateInstance, options?): SerializedEtNode;         // debug/SSR
```

The engine looks up the compiled template by `(bundleUrl, templateKey)` in the
bundle's `elementTemplate` map and materializes the **entire static subtree in
one call**, wiring the passed `attributeSlots` / `elementSlots`.

> **Correction to a common misconception.** ReactLynx does **not** use
> `__CreateElementFromBinary` / `__GetTemplateParts` / a returned part-map — those
> names do not exist in its ET runtime. There is **no "instantiate then look up
> the parts"** step. Instead the runtime **supplies the dynamic parts
> positionally at instantiation** (`attributeSlots` / `elementSlots`) and
> afterwards addresses them by `(rootRef, slotIndex)`. If the C++ engine uses a
> binary/parts representation internally, it is hidden behind
> `__CreateElementTemplate`. (Our own docs `ifr.mdx:143` currently name
> `__ElementFromBinary`/`__GetTemplateParts` as the native target — that framing
> should be updated to the `__CreateElementTemplate` family.)

### 2.2 Instantiation from the runtime

`element-template/runtime/template/handle.ts`:

```ts
export function createElementTemplateWithReservedHandle(handleId, key, url, attrSlots, elemSlots) {
  const nativeRef = __CreateElementTemplate(key, url, attrSlots, elemSlots, handleId);
  if (nativeRef) {
    setElementTemplateNativeRef(handleId, nativeRef);
    initializeMainThreadDynamicAttrSlots(handleId, elementTemplateTypeTag(key, url), attrSlots);
  }
  return nativeRef;
}
let nextId = -1;                                    // main-thread IFR handle ids:
export function reserveElementTemplateId() { return nextId--; }  // consecutive NEGATIVE ints
```

The Preact render output is flattened to a linear **opcode array**
(`render-to-opcodes.ts`: `__OpBegin/__OpEnd/__OpAttr/__OpText/__OpSlot`) and
`renderOpcodesIntoElementTemplate()` walks it with a stack, calling
`createElementTemplateWithReservedHandle(...)` per template node — passing the
accumulated `attributeSlots` and each `elementSlots[slotId]` array of
already-built child refs. Registry `runtime/template/registry.ts` maps
`handleId → nativeRef` (negative ids in a dense `negativeRefs` array; id `0` =
`__page`). **Handles come from the create call — there is no part lookup.**

## 3. The evolution: what changed

### 3.1 Compiler output changed from *code* to *data*

`swc_plugin_element_template` emits, instead of a JS `create()` closure:

1. an out-of-band serialized **Template Definition** (JSON tree), and
2. a rewritten JSX site referencing a `_et_<hash>` tag with `$N` element-slot
   props and an `attributeSlots={[…]}` array.

Golden `swc_plugin_element_template/tests/__combined_snapshots__/
should_handle_nested_structure_and_dynamic_content.snap` — the **code**:

```js
const _et_9a26fdfe48b4 = `${globDynamicComponentEntry}:${"_et_9a26fdfe48b4"}`;
<_et_9a26fdfe48b4 $0={items.map((i)=><_et_dd10eca65d68 $0={i}/>)} $1={show && <_et_f2aabcaaedd9/>}/>;
```

and the **template** (data, not code):

```jsonc
{ "template_id": "_et_9a26fdfe48b4",
  "template": { "kind": "element", "type": "view",
    "attributesArray": [ { "kind": "static", "key": "class", "value": "wrapper" } ],
    "children": [
      { "kind": "element", "type": "view",
        "attributesArray": [ { "kind": "static", "key": "class", "value": "content" } ],
        "children": [ { "kind": "elementSlot", "type": "slot", "elementSlotIndex": 0 } ] },
      { "kind": "element", "type": "view",
        "attributesArray": [ { "kind": "static", "key": "class", "value": "footer" } ],
        "children": [ /* static <text>Footer</text> */, { "kind": "elementSlot", "elementSlotIndex": 1 } ] }
    ] } }
```

Node kinds (`template_definition.rs`): `element{type, attributesArray, children}`,
`elementSlot{elementSlotIndex}`. Attr descriptor kinds: `{kind:"static",key,value}`,
`{kind:"slot",key,attrSlotIndex}`, `{kind:"spread",attrSlotIndex}`. Text
optimization: `<text>static</text>` collapses to a `text` static attr; a dynamic
text child becomes the built-in `_et_builtin_raw_text` template (a `raw-text`
with one `text` attr slot). Asset struct: `ElementTemplateAsset { template_id,
compiled_template: serde_json::Value, source_file }`.

### 3.2 Dynamic parts map to two positional slot spaces

Assigned by the extractor's counters (`extractor.rs`: `attr_slot_counter`,
`element_slot_counter`):

- **Element slots** — `elementSlotIndex`, surfaced as `$0/$1/…` props and
  `{kind:"elementSlot"}` nodes. Supplied as `elementSlots[i] = [childRef,…]` at
  create; mutated later via `__InsertNodeToElementTemplate` /
  `__RemoveNodeFromElementTemplate`.
- **Attribute slots** — `attrSlotIndex`, surfaced as the `attributeSlots={[…]}`
  array and `{kind:"slot"|"spread"}` descriptors. Updated via
  `__SetAttributeOfElementTemplate(rootRef, attrSlotIndex, value)`.

Events/refs/spreads/worklet-events are attr slots post-processed by an **attr
plan** (`runtime/template/attr-slot-plan.ts`, `__etAttrPlanMap`, keyed by
`${bundleUrl}:${templateKey}`): the compiler records the plan
(`AttrPlanAdapter::{Event,MTEvent,Ref,Spread}`), the runtime swaps the compiled
sentinel (`"1"` for events, `null` for worklet refs) for a real
handler/ref/closure at instantiation.

### 3.3 Cross-thread update protocol changed too

Snapshot shipped a serialized instance patch (`snapshotPatch`). ET instead emits
an **update-command stream** (`element-template/protocol/opcodes.ts`):

```ts
export const ElementTemplateUpdateOps = {
  createTemplate:1, setAttribute:2, insertNode:3, removeNode:4,
  createTypedElement:5, insertTypedListItem:6, removeTypedListItem:7, updateTypedListItem:8,
};
```

`applyElementTemplateUpdateCommands()` (`runtime/patch.ts`) is the reducer that
turns each op into the matching native PAPI call, resolving `handleId`s through
the registry.

### 3.4 Eligibility (`swc_plugin_element_template/lib.rs`, `extractor.rs`)

- **Host (lowercase) elements** lower into templates; **components (uppercase)**
  do not — the visitor recurses into their children so a component stays a call
  and its subtree is slotted in.
- `<page>` / `<component>` tags → **hard compile error**.
- `<list>` → a **typed** template (`__CreateTypedElementTemplate('list', …)`);
  only logical slot `$0`, items travel in `options.listChildren`.
- A contiguous run of static host elements collapses into **one** template; the
  tree is cut at every dynamic child / component boundary. Complex static values
  (objects/arrays/template literals) aren't inlined yet (fall back to a slot).

### 3.5 Bundle / build pipeline

Templates ride the `.lynx.bundle` as a map `{ template_id → compiled_template }`:

1. **SWC transform** emits `elementTemplates: ElementTemplateAsset[]`
   (`transform/src/lib.rs`).
2. **react loader** stashes them per-module:
   `buildInfo[ELEMENT_TEMPLATE_BUILD_INFO]` (`loaders/main-thread.ts`).
3. **ReactWebpackPlugin** merges across an entry and on the **`beforeEncode`**
   hook sets `args.encodeData.elementTemplate = elementTemplates` (+
   `config.enableUnifyFixedBehavior = true`).
4. **Encode step** (`template-webpack-plugin`) bakes `encodeData.elementTemplate`
   into the binary TASM bundle; the web target (`WebEncodePlugin`) writes it into
   the JSON manifest as `tasmJSONInfo['elementTemplate']`.

Scoping: main card uses the `__Card__` sentinel (`protocol/template-type.ts`);
lazy bundles keep `${bundleUrl}:${templateKey}`.

### 3.6 Snapshot vs Element Template — at a glance

| Concern | Snapshot (before) | Element Template (after) |
|---|---|---|
| Static structure | JS `create()`, N PAPI calls | one `__CreateElementTemplate(key,…)` native call |
| Compiler output | `snapshotCreatorMap[id]=()=>createSnapshot(create,update,slot,…)` | `_et_<hash>` tag + JSON template asset |
| Carried in bundle | **code** (create/update fns) | **data** (`{id → JSON tree}`) |
| Dynamic children | `slot:[DynamicPartType,elementIndex][]` + `$N` | `elementSlotIndex` (`$N`) + `elementSlots[]` |
| Dynamic attrs | `values[]` + `update[]` closures | `attrSlotIndex` + `attributeSlots[]` + `__SetAttributeOfElementTemplate` |
| Part handle | index into `create()`-returned array | registry `handleId(neg) → nativeRef` (root only) |
| Cross-thread | `snapshotPatch` | `ElementTemplateUpdateOps` command stream |
| Enable flag | default | `experimental_useElementTemplate` → `elementTemplate` → `__USE_ELEMENT_TEMPLATE__` |

---

# Part II — Design: Vue Lynx ET on the native Element Template

## 4. Where Vue Lynx is today (recap)

Our framework-level ET (`0711-2`) lowers maximal plain-element subtrees into a
**JS `create(P)`** of straight-line typed-PAPI calls plus **holes** (interior
dynamic prop / text bindings):

- **Compile** (`plugin/src/compiler/element-template-transform.ts`): hoist
  `(globalThis.__vueLynxRegisterElementTemplate||noop)(id, holeKeys, create)`;
  rewrite the `VNodeCall` to tag `__vlx-tpl:<id>` with hole props `__h0…__hN`.
- **BG** (`runtime/src/{element-template,node-ops}.ts`): one root ShadowElement +
  N detached hole shadows with **contiguous ids after the root**; push
  `INSTANTIATE_TEMPLATE [15, rootId, tplId, holeCount]`; `patchProp('__hN',…)`
  delegates to the hole shadow → ordinary `SET_*` ops.
- **MT** (`main-thread/src/{ops-apply,element-templates}.ts`):
  `INSTANTIATE_TEMPLATE` → `getTemplate(tplId)` → `create(pageUniqueId)` →
  `[root, hole0…]` → map `rootId..rootId+holeCount`. Registration reaches MT via
  IFR module eval **or** `worklet-loader-mt` re-emitting the hoisted statements
  (`extractTemplateRegistrations`).

This is the **Snapshot model, re-implemented at the framework level**: JS
`create()`, one PAPI call per node, holes updated by targeting interior element
ids. `website/docs/guide/ifr.mdx:141` says so and flags the native backend as
future work; `0711-2` Notes list it as the follow-up. **This document is that
follow-up.**

## 5. The core insight that makes this easy

**Vue's block/`patchFlag`/`dynamicChildren` model already is the snapshot vdom
layer.** Because our eligibility (`0711-2`) *breaks the subtree at every
component / `v-if` / `v-for` / comment / mixed-dynamic-text boundary*, a lowered
Vue Lynx subtree is **pure static structure whose only dynamic parts are
attribute / class / style / text / event bindings on interior nodes**. It has
**no dynamic children**.

Mapped onto ReactLynx's two native slot spaces:

- **element slots** (`elementSlotIndex`, dynamic children) → **not needed**. The
  template root is a normal element to the surrounding vdom; it is inserted /
  moved / removed by ordinary `INSERT`/`REMOVE` ops exactly as today.
- **attribute slots** (`attrSlotIndex`) → **our holes, one-to-one.**

So Vue Lynx targets the **simplest, purely-attribute-slot subset** of native ET:
`__CreateElementTemplate(key, url, attributeSlots, /*elementSlots*/ null, uid)` +
`__SetAttributeOfElementTemplate` for updates. No element slots, no
`__InsertNodeToElementTemplate`, no `ElementTemplateUpdateOps` command stream —
the existing ops pipeline already carries all structural mutation.

### The seam is tiny

The `__vlx-tpl:<id>` vnode contract, the `__hN` props, the
`INSTANTIATE_TEMPLATE` op, the BG shadow/hole allocation, and the IFR hydration
reconciler are **all backend-agnostic**. Exactly **one** thing is
`create()`-specific: *how the MT executor materializes the subtree and how it
resolves a hole for a `SET_*`.* Native ET changes only:

1. **compile**: additionally emit a **JSON template** (not just a JS `create()`);
2. **build**: inject it into `encodeData.elementTemplate`;
3. **MT executor**: instantiate via `__CreateElementTemplate`; resolve a hole to
   `(rootRef, attrSlotIndex)` and route `SET_*` through
   `__SetAttributeOfElementTemplate`.

Everything else — BG renderer, wire protocol, IFR reconciliation — is untouched.
Native ET even **deletes** code (see §6.4).

## 6. Concrete changes

### 6.1 Compiler — emit a JSON template alongside (or instead of) `create()`

`analyzeSubtree()` already walks the subtree and knows, per node, its tag, baked
static props (class/style/attr/text), scoped cssId, and which props are holes,
**in deterministic traversal order**. Add a second emitter that produces the
ReactLynx-shaped JSON node tree:

```jsonc
{ "kind":"element", "type":"view", "attributesArray":[
    {"kind":"static","key":"class","value":"card"},
    {"kind":"static","key":"__lynx_css_id","value": <bakedCssId> } ],
  "children":[
    {"kind":"element","type":"image","attributesArray":[
        {"kind":"static","key":"class","value":"icon"},
        {"kind":"static","key":"src","value":"a.png"} ]},
    {"kind":"element","type":"text","attributesArray":[
        {"kind":"static","key":"class","value":"title"},
        {"kind":"slot","key":"text","attrSlotIndex":0} ]},   // '#text' hole → text attr slot
    {"kind":"element","type":"view","attributesArray":[
        {"kind":"slot","key":"class","attrSlotIndex":1} ]} ] } // dynamic :class hole
```

Rules:

- **Keep hole order identical** to today's `holeVars` order, and assign
  `attrSlotIndex = hole index`. Then the MT side needs no per-template slot map:
  **hole `k` ⇒ `attrSlotIndex k`**. (Verify ReactLynx's engine numbers attr
  slots in the same document order the extractor uses; ours already is document
  order.)
- `'#text'` hole → `{kind:"slot", key:"text", attrSlotIndex:k}` on the text node
  (the `_et_builtin_raw_text` pattern, but Vue Lynx sets `text` on the element
  directly, matching our `__SetAttribute(el,'text',…)`).
- Static class/style/attr/text/cssId → `{kind:"static",…}` (already baked today).
- The **content hash `id`** stays the template key. Cross-file dedup unchanged.
- **Emit the JSON as a webpack `buildInfo` asset**, not as executable code (see
  §6.2). Keep the JS `create()` emitter too, behind the existing framework-ET
  flag, so we have a non-native fallback and an A/B oracle for tests.

`scope-adapter.ts` is the seam for cssId; the native JSON path bakes the same
`scopeIdToCssId(scopeId)` value into a static attr (engine key TBD — confirm
whether the encoder expects `__lynx_css_id`, a `cssId` field on the node, or a
`__SetCSSId`-equivalent template directive).

### 6.2 Build — `VueElementTemplatePlugin` taps `beforeEncode`

We already tap the exact hook: `VueCSSConfigPlugin` (`plugin/src/entry.ts:162`)
calls `LynxTemplatePlugin.getLynxTemplatePluginHooks(compilation).beforeEncode`
and mutates `encodeData.sourceContent.config`. Mirror ReactWebpackPlugin:

- a loader/transform stashes each module's `{ id → template }` in
  `module.buildInfo[VUE_ELEMENT_TEMPLATE]`;
- `VueElementTemplatePlugin` collects across the entry's modules, merges into
  `Record<templateId, compiledTemplate>`, and on `beforeEncode` sets
  `args.encodeData.elementTemplate = merged` (and any required
  `config.enableUnifyFixedBehavior`).

The encoder (`LynxEncodePlugin` for `.lynx.bundle`, `WebEncodePlugin` for
`.web.bundle`) then bakes it in — **the same encoders we already use**. For the
web/test target, confirm `WebEncodePlugin` writes `tasmJSONInfo.elementTemplate`
and that our jsdom PAPI harness (`@lynx-js/web-mainthread-apis`) implements the
`__CreateElementTemplate` family; if not, the test bridge
(`lynx-runtime-dom-bridge.ts`) needs a shim.

### 6.3 MT executor — instantiate natively, resolve holes to slots

`ops-apply.ts` `INSTANTIATE_TEMPLATE` becomes:

```ts
case OP.INSTANTIATE_TEMPLATE: {
  const rootId = ops[i++], tplId = ops[i++], holeCount = ops[i++];
  // native: engine builds the whole subtree in one call, no create() JS.
  const root = __CreateElementTemplate(tplId, BUNDLE_URL, /*attributeSlots*/ null, /*elementSlots*/ null, rootId);
  __SetAttribute(root, `vue-ref-${rootId}`, 1);
  elements.set(rootId, root);
  for (let k = 1; k <= holeCount; k++) {
    // hole k-1 ⇒ attrSlotIndex k-1, addressed against `root`
    holeSlots.set(rootId + k, { root, slot: k - 1 });
  }
  break;
}
```

Then teach the `SET_*` handlers to resolve a hole id: a small helper

```ts
function setOnTarget(id, key, value) {
  const slot = holeSlots.get(id);
  if (slot) __SetAttributeOfElementTemplate(slot.root, slot.slot, value);
  else { const el = elements.get(id); if (el) __SetAttribute(el, key, value); }
}
```

used by `SET_PROP` / `SET_TEXT` / `SET_STYLE` / `SET_CLASS` (and `SET_SCOPE_ID`).
Because the BG side already sends **final values** (style normalized,
class merged via `resolveClass`), the MT translation is pure delivery.

Note we pass `attributeSlots: null` and let the first `SET_*` ops populate slots.
Alternatively, carry initial hole values in the `INSTANTIATE_TEMPLATE` payload
and pass them as the `attributeSlots` array to save N ops on first paint — a nice
follow-up once correctness lands.

### 6.4 Registration machinery — **deleted** on the native path

Native templates live in the bundle; the engine owns them. So on the native
path we **no longer ship `create()` to the MT thread at all**:

- `main-thread/src/element-templates.ts` registry — gone (native lookup by key).
- `entry-main.ts` `TPL_*` registration adapters — gone.
- `worklet-loader-mt` `extractTemplateRegistrations` + the `?vue&type=template`
  edge-keeping in `worklet-utils.ts` — gone.
- `runtime/src/element-template.ts` create-forwarding — reduced to hole-key
  metadata only (BG still needs `holeKeys` to allocate hole shadows / delegate
  `patchProp`).

This is the pleasant inversion: **the native backend removes code** (a whole
cross-thread code-shipping path) rather than adding it.

### 6.5 Events / refs / worklet holes — the one real open question

Our holes today can be **events** (interior `v-on`), which `patchProp` turns into
`SET_EVENT [id, type, name, sign]` → `__AddEvent(holeEl, type, name, sign)`.
Native ET has no interior element handle; events are **attr slots wired by the
attr-plan** at instantiation, and ReactLynx swaps a compiled sentinel for a
handler closure — a model that assumes the handler is available on the thread
doing instantiation. Our cross-thread sign model differs.

Two options, pick per verification:

- **(A) Native event slots via sign.** If `__SetAttributeOfElementTemplate(root,
  eventSlotIndex, sign)` (or an ET event PAPI) accepts the same sign string
  `__AddEvent` does, route `SET_EVENT`/`REMOVE_EVENT`/`SET_WORKLET_EVENT` on a
  hole through it. Preferred — full coverage.
- **(B) Eligibility gate (safe default for Phase 1).** Exclude subtrees that have
  **interior event / worklet / MT-ref holes** from *native* lowering; they fall
  back to today's **framework ET** (still fast) or the vdom path. Pure
  attr/class/style/text holes — the bulk of static structure and the biggest
  first-paint wins — go native immediately. `analyzeSubtree` already classifies
  every hole, so this gate is a few lines.

Refs/ids/keys are already excluded from interior holes (they force the node onto
the vnode path), so only events/worklets/MT-refs are in question.

### 6.6 IFR composition

- **First frame**: the IFR MT render currently runs the JS `create()` inside
  `renderPage`. On the native path it calls `__CreateElementTemplate` directly —
  **even faster** (native instantiation, no interpreter, no JS create()).
  `runIfrRender` is unaffected; only the executor changed.
- **Hydration**: `ifr.ts` compares op streams. `INSTANTIATE_TEMPLATE` stays a
  structural op; holes still occupy `rootId+1..+holeCount` **as logical ids** in
  the stream (they resolve to slots on MT, not elements) so `reconcileBatch`,
  `VALUE_OP`, `OP_ARITY`, and `teardownIfrTree` need **no change** — the wire
  protocol is identical. `teardownIfrTree` removes the root by id; a native
  template instance is removed by `__RemoveElement(page, root)` like any element.
  (Confirm the engine allows `__RemoveElement` on a template-instance root; it
  should, since the root is a normal `ElementRef`.)

Net: **IFR × native ET composes with zero protocol change**, same as framework
ET did.

### 6.7 Scoping & keys

Use the `__Card__`-equivalent sentinel as `bundleUrl` for the main card; thread a
real `bundleUrl` only when we add lazy bundles. Our content-hash ids already
dedup cross-file; keep them as `templateKey`. One caveat from ReactLynx worth
inheriting: **backend consistency across lazy bundles** — but since we keep
framework ET as a fallback rather than a hard mode, a lazy bundle that can't go
native can still render (framework ET / vdom), which is **more forgiving than
ReactLynx's throw-on-mismatch**.

## 7. Why this is worth it

- **First paint**: replaces N per-node PAPI calls (JS `create()`) with **one
  native `__CreateElementTemplate`** — the engine builds the subtree in C++,
  off the JS critical path. This is the cost IFR's synchronous MT render still
  pays; ET already made it 6–15× cheaper (`ifr.mdx`), native ET attacks the
  residual.
- **Bundle size**: static structure becomes **data, not JS `create()` code**,
  and we **delete** the MT registration-shipping path (§6.4).
- **Fidelity**: uses Lynx's first-class element path (type-specific engine
  internals, future engine optimizations like pre-parsed/preloaded templates)
  instead of re-deriving them from typed PAPI.

## 8. Risks / open questions (verify before building)

1. **Attr-slot numbering** — does the engine number `attrSlotIndex` in the same
   document order our extractor emits holes? If not, emit an explicit
   per-template `holeIndex → attrSlotIndex` map and store it MT-side.
2. **cssId in the template JSON** — exact encoder key/shape for a baked CSS scope
   on a template node (`__lynx_css_id`? node `cssId`? a template directive?).
3. **Events** — §6.5 (A) vs (B). Determines Phase-1 coverage.
4. **Web/test PAPI** — does `@lynx-js/web-mainthread-apis` implement
   `__CreateElementTemplate` / `__SetAttributeOfElementTemplate`, and does
   `WebEncodePlugin` surface `elementTemplate` for the `test:dom` bridge?
5. **`__RemoveElement` on a template-instance root** during v-for reorder /
   unmount and IFR teardown.
6. **`enableUnifyFixedBehavior`** and any other `config` flags the encoder
   requires alongside `elementTemplate` (ReactLynx sets it in `beforeEncode`).
7. **Typed roots** — a lowered subtree rooted at `scroll-view` etc.: plain
   `__CreateElementTemplate` vs `__CreateTypedElementTemplate`. Our
   `EXCLUDED_TAGS` already keeps `list`/`page` out.

## 9. Phasing

- **Phase 0 — spike**: hand-write one template JSON + `__CreateElementTemplate`
  call in the `test:dom` bridge for a static `card`; confirm identical document
  vs framework ET. Answers Q1/Q2/Q4.
- **Phase 1 — attr-slot templates**: compiler JSON emitter + `beforeEncode`
  plugin + MT native executor, gated `enableNativeElementTemplates` (default
  off, defaults to following framework ET when on). Events/worklets excluded
  (§6.5 B). A/B every fixture (native vs framework vs unlowered) for identical
  documents, reusing the `0711-2` oracle harness.
- **Phase 2 — events**: §6.5 (A) if the sign path works; else keep the gate.
- **Phase 3 — initial `attributeSlots`** in the INSTANTIATE payload (drop N
  first-paint `SET_*` ops); on-device measurement; consider default-on.

## 10. Contract summary (delta only)

| Layer | Framework ET (today) | Native ET (proposed) |
|---|---|---|
| Compile emit | hoisted JS `create()` + `__hN` vnode | **JSON template asset** + `__hN` vnode (unchanged) |
| Bundle | JS in BG/MT bundles | **`encodeData.elementTemplate` map** (`beforeEncode`) |
| MT instantiate | `getTemplate(id)(pageId)` | **`__CreateElementTemplate(id,url,slots,null,rootId)`** |
| Hole update | `SET_*` → `__SetAttribute(holeEl,…)` | `SET_*` → **`__SetAttributeOfElementTemplate(root,slot,…)`** |
| MT registration | `extractTemplateRegistrations` / adapters | **deleted** |
| BG renderer | shadow + holes + `INSTANTIATE_TEMPLATE` | **unchanged** |
| Wire protocol | flat ops | **unchanged** |
| IFR reconcile | stream compare + teardown | **unchanged** |

The wire protocol, BG renderer, and IFR reconciler stay byte-identical; only
*compile emit*, *bundle injection*, and *MT materialization* change. That is the
whole point of the seam `0711-2` deliberately built.
