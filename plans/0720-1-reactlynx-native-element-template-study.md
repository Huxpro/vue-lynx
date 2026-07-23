# Study: ReactLynx Snapshot → Native Element Template, and Vue Lynx IFR+ET Path

**Date**: 2026-07-20 (addendum 2026-07-23 vs `origin/vapor`)
**Status**: Learning / design notes — §§1–7 written against main-line ET; **§8 rebases the Vue picture onto vapor head**
**Sources**:
- `lynx-family/lynx-stack` `main` (sparse clone): `packages/react/runtime/src/{snapshot,element-template}`, `packages/react/transform/crates/swc_plugin_{snapshot,element_template}`, `packages/webpack/react-webpack-plugin`
- Vue Lynx (main-era): `plans/0711-2-element-templates.md`, `website/docs/guide/ifr.mdx`
- Vue Lynx (**vapor head**, 793f4cc7): `docs/plans/graph-eng-goal.md`, `packages/vue-lynx/internal/src/matrix.ts`, `main-thread/src/engine-template.ts`, `packages/ifr-bench/GRAPH-ENG-{MATRIX,REPORT}.md`

---

## 1. Executive summary

ReactLynx treated **Snapshot** and **Element Template (ET)** as two mutually exclusive **runtime backends** that share the same dual-thread product shape (MT Instant First Render → serialize → BG hydrate → patch). The evolution is not “add templates on top of Snapshot”; it is **replace the JS-authored PAPI create/update surface with Lynx engine Element Template PAPIs**, while moving the static tree out of LEPUS source into a **declarative Template Definition** packed into the Lynx template binary.

Vue Lynx’s shipping “Element Templates” are closer to **Snapshot’s insight** (compile-time bake of static structure into straight-line PAPI) than to ReactLynx’s **native ET backend**. On **vapor**, that insight is now formalized as a **staging ladder** (`ops → data → code → native`) with orthogonal naming/addressing/deployment axes; Engine-Template is scaffolded as a **probe + stub fallback** on the Vapor `CLONE_TREE` path, but **does not yet** match ReactLynx’s real PAPI signatures or `encodeData.elementTemplate` packaging. Closing that gap still requires migrating hole updates toward slot-indexed native APIs (and aligning the probe contract with RL).

**Important API naming note.** Vue Lynx docs/plans mention a future `__ElementFromBinary` / binary `elementTemplates` section. ReactLynx’s current ET path on `main` uses a **different, higher-level PAPI family**: `__CreateElementTemplate`, `__SetAttributeOfElementTemplate`, `__InsertNodeToElementTemplate`, `__RemoveNodeFromElementTemplate`, `__SerializeElementTemplate`, plus `__CreateTypedElementTemplate` for hosts like `page` / `list`. `__ElementFromBinary` / `__GetTemplateParts` do **not** appear in the ET runtime; `__GetTemplateParts` remains Snapshot SSR-only. Any Vue migration should target the **ReactLynx-era APIs**, not the older binary-loader names alone — and vapor’s current engine probe must be **re-signed** to match (see §8.3).

---

## 2. Snapshot: what it was solving

### 2.1 Problem

Naive dual-thread UI pays for every static node twice (or more):

1. Framework VDOM / instance tree construction
2. Cross-thread protocol (create + set props + append)
3. Main-thread interpreter / PAPI dispatch

ReactLynx’s Snapshot insight: **the static JSX host subtree is known at compile time**. Emit one template definition with:

- a `create(ctx)` that builds the whole FiberElement array with typed PAPI
- an `update[]` of per–dynamic-part closures
- a `slot` table describing where dynamic children attach

### 2.2 Core types

```ts
// packages/react/runtime/src/snapshot/snapshot/definition.ts
interface Snapshot {
  create: null | ((ctx: SnapshotInstance) => FiberElement[]);
  update: null | ((ctx: SnapshotInstance, index: number, oldValue: any) => void)[];
  slot: [DynamicPartType, number][];
  cssId?: number;
  // list / SlotV2 / ref-spread metadata…
}
```

`SnapshotInstance` (MT) owns `__elements: FiberElement[]` and `__element_root`.
`BackgroundSnapshotInstance` (BG) owns the same logical tree **without** native elements and records `SnapshotOperation` patches.

### 2.3 Compile → runtime flow

```
JSX
  ── swc_plugin_snapshot ──► snapshotCreatorMap[id] = createSnapshot(id, create, update[], slot, …)
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
          LEPUS / MT                                  JS / BG
   SnapshotInstance.ensureElements()            BackgroundSnapshotInstance
   create() → __CreateView / __AppendElement…   CreateElement / SetAttribute patches
   update[i](ctx) on value change               values / events / refs as serializable signs
                 │                                         │
                 └──── firstScreen JSON.stringify(root) ───┘
                              hydrate → snapshotPatchApply
```

Dynamic attrs become `values: […]` on a synthetic snapshot component; each index maps to one updater that typically does `__SetAttribute(ctx.__elements[elIndex], name, ctx.__values[i])` (or `updateEvent` / spread helpers).

### 2.4 Strengths and costs that motivated replacement

| Strength | Cost |
|----------|------|
| Huge cut in per-node framework work vs naive VDOM | `create()` is still **JS/LEPUS imperative PAPI** — engine cannot share/optimize template instantiation |
| Precise element indexing via `__elements[]` | Dual instance trees (MT + BG) + full first-screen JSON serialize |
| Mature SlotV2 / list / worklet / ref story | Long compatibility surface (`Slot`, `Children`, `ListSlotV2`, legacy wrappers) |
| Same code shape on MT IFR and BG | BG/MT definition asymmetry (JS emits `create: null`; LEPUS ships full factories; HMR ships creator strings) |

Snapshot already *was* “framework element templates.” Native ET moves the static skeleton **into the engine**.

---

## 3. Native Element Template: what replaced Snapshot

### 3.1 Backend switch (not a layer)

```ts
// packages/react/runtime/src/core/lynx/runtime-backend.ts
RUNTIME_BACKEND_SNAPSHOT = 'Snapshot'
RUNTIME_BACKEND_ELEMENT_TEMPLATE = 'Element Template'
```

Mismatch across lazy bundles throws. Instantiating `SnapshotInstance` under ET throws by design.

### 3.2 Compile-time: Template Definition JSON + slot lowering

`swc_plugin_element_template` peels dynamic parts out of JSX and emits:

1. **Out-of-band assets** `{ templateId, compiledTemplate, sourceFile }` — **not** inlined into JS
2. **JS transport**: synthetic tag + dense `attributeSlots` + `$N` child props

Canonical Template Definition shape (from golden snapshots):

```json
{
  "kind": "element",
  "type": "view",
  "attributesArray": [
    { "kind": "static", "key": "class", "value": "static" },
    { "kind": "slot", "key": "id", "attrSlotIndex": 0 },
    { "kind": "spread", "attrSlotIndex": 1 }
  ],
  "children": [
    { "kind": "element", "type": "text", "attributesArray": […], "children": [] },
    { "kind": "elementSlot", "type": "slot", "elementSlotIndex": 0 }
  ]
}
```

Identity: content hash → `_et_<12 hex>`. Builtin `_et_builtin_raw_text` is always appended when any user templates exist (dynamic text as element-slot content).

JS side keeps expression lowering in React/SWC:

```js
const _et_d5a51fb4f19d = `${globDynamicComponentEntry}:"_et_d5a51fb4f19d"`;
<_et_d5a51fb4f19d attributeSlots={[dynamicId, value]} $0={child} />;
```

Special events/refs/spreads register into `__etAttrPlanMap[templateId]` so BG can prepare serializable slot values before crossing the bridge.

### 3.3 Bundle packaging

Transform returns `elementTemplates?: ElementTemplateAsset[]`.
`ReactWebpackPlugin` (flag `experimental_useElementTemplate`) collects per-module buildInfo, merges by `templateId` (collision = hard error if content differs), and on `beforeEncode`:

```ts
args.encodeData.elementTemplate = elementTemplates; // Record<templateId, compiledTemplate>
```

The Lynx template encoder packs that map into the template’s **ElementTemplates** section. At runtime `__CreateElementTemplate(templateKey, bundleUrl, …)` resolves against that native registry (`bundleUrl === null` for the main card).

Web-platform note: JSON artifacts currently **reject** non-empty `elementTemplates` (“not supported yet” in decode worker) — native ET is oriented at the real Lynx template binary path first.

### 3.4 Native PAPI surface (authoritative)

From `element-template/types.d.ts`:

| API | Role |
|-----|------|
| `__CreateElementTemplate(templateKey, bundleUrl, attributeSlots, elementSlots, uid, options?)` | Instantiate a **compiled** template; returns root `ElementRef` |
| `__CreateTypedElementTemplate(type, attributes, elementSlots, uid, options?)` | Hosts not compiled as assets (`page`, `list`, …) |
| `__SetAttributeOfElementTemplate(element, attrSlotIndex, value, options?)` | Update one dynamic attr by **slot index** |
| `__InsertNodeToElementTemplate(parent, elementSlotIndex, child, reference)` | Insert into a structural hole |
| `__RemoveNodeFromElementTemplate(parent, elementSlotIndex, child)` | Remove from a structural hole |
| `__SerializeElementTemplate(templateInstance, options?)` | IFR → BG hydrate payload (`SerializedEtNode`) |
| `__FlushElementTree` | Shared commit flush |

ReactLynx no longer runs per-template `__CreateView` / `__AppendElement` factories for lowered trees.

### 3.5 Runtime protocol

Flat update ops (`protocol/opcodes.ts`):

```ts
createTemplate: 1,
setAttribute: 2,      // (handleId, attrSlotIndex, value)
insertNode: 3,        // (parentId, elementSlotIndex, childId, refId)
removeNode: 4,        // (+ removedSubtreeHandleIds for registry GC)
createTypedElement: 5,
insertTypedListItem / removeTypedListItem / updateTypedListItem: 6–8,
```

Lifecycle events: `rLynxElementTemplateHydrate` / `rLynxElementTemplateUpdate` (separate from Snapshot’s first-screen / snapshot patch events).

IFR path: MT opcode render → native creates → `__SerializeElementTemplate` → BG hydrate rebinds uids and emits catch-up ops → later commits are flat ET ops applied on MT.

### 3.6 What moved into the engine vs what stayed in JS

| Moved into native engine | Still in JS/framework |
|--------------------------|------------------------|
| Static tree materialization | Preact reconcile + BG shadow instances |
| Static attr application at create | Attr adapters (events, refs, spreads, worklets) |
| Attr updates by slot index | Hydrate diff + commit timing |
| Element-slot insert/remove | List platform-info bookkeeping |
| Template registry by key | Opcode / IFR orchestration |

### 3.7 Evolution in one picture

```
Snapshot era                         Native ET era
────────────                         ─────────────
Compiler emits create()/update[]     Compiler emits Template Definition JSON
  as LEPUS source                      + JS attributeSlots / $N transport
JS registry: snapshotManager         Native registry: templateKey in template binary
MT create = many leaf PAPIs          MT create = one __CreateElementTemplate
MT update = update[i](ctx)           MT update = __SetAttributeOfElementTemplate
  indexing ctx.__elements[j]           indexing attrSlotIndex
Children = slot table + Append/      Children = elementSlots at create
  Replace on FiberElements             + Insert/RemoveNodeToElementTemplate
Hydrate = JSON SnapshotInstance      Hydrate = __SerializeElementTemplate tree
```

---

## 4. Where Vue Lynx IFR + ET stands today

### 4.1 What we built (framework ET ≈ Snapshot insight)

From `0711-2-element-templates.md` / `ifr.mdx`:

```
Without ET: vnode → ShadowElement → per-node ops → interpreter → PAPI
With ET:    one vnode → INSTANTIATE_TEMPLATE → JS create() of typed PAPI
```

| Layer | Mechanism |
|-------|-----------|
| Compiler | `element-template-transform.ts` lowers maximal plain-element subtrees; holes `__hN`; tag `__vlx-tpl:<id>` |
| BG | `registerElementTemplate`; contiguous ShadowElements for root+holes; one `INSTANTIATE_TEMPLATE [15, rootId, tplId, holeCount]` |
| MT | `Map<id, create(P) => [root, hole0,…]>`; executor maps ids and sets `vue-ref` on root only |
| Updates | Ordinary `SET_*` / events on **hole element ids** (`rootId+k`) |
| IFR | Same ops stream recorded/hydrated; ET shrinks MT sync work; no special IFR↔ET protocol |

This matches Snapshot’s **compile-time bake + hole updates via element handles**, not ReactLynx’s **native Template Definition + attr slots**.

### 4.2 Explicit non-goals (so far)

Docs state we do **not** use Lynx’s binary `elementTemplates` / `__ElementFromBinary` / `__GetTemplateParts`. Plan follow-up: emit skeletons into the native section for engine-side instantiation.

Given ReactLynx’s current APIs, that follow-up should be reframed toward `__CreateElementTemplate` + encode-time `elementTemplate` map, not only `__ElementFromBinary`.

### 4.3 Why the models diverge (the hard seam)

```
Vue hole model today                 ReactLynx native ET
────────────────────                 ───────────────────
Hole = real FiberElement             Dynamic attr = attrSlotIndex on template root
  registered at rootId+1…N
patchProp → SET_CLASS / SET_ATTR /   BG attributeSlots[] →
  SET_TEXT / AddEvent on that handle   __SetAttributeOfElementTemplate(root, i, v)
Structural children stay outside     Structural holes = elementSlotIndex
  the template (v-if/v-for hosts)      filled with child ElementRefs
```

Vue intentionally kept the **ops / hydration protocol unchanged** (one new op). Native ET’s win comes from changing the **update addressing** and **packaging** as well as create.

---

## 5. How Vue Lynx can use native Element Template

Goal: keep IFR + Vue semantics; swap the ET **backend** from JS `create()` to native PAPIs, ideally behind a flag.

### 5.1 Recommended target architecture

Keep Vue’s **eligibility / lowering unit** (maximal plain-element subtree, root props stay on vnode, structural spines on vdom). Change the **artifact and MT application**:

```
SFC template
  → element-template-transform (eligibility unchanged)
  → emit:
       (A) Template Definition JSON  (static tree + attrSlot / elementSlot descriptors)
       (B) lowered vnode __vlx-tpl:id with hole values as ordered attributeSlots
       (C) optional attr-plan metadata for events / MT worklets
  → rspeedy / encode hook:
       encodeData.elementTemplate[id] = compiledTemplate
  → MT INSTANTIATE_TEMPLATE (or renamed CREATE_NATIVE_TEMPLATE):
       __CreateElementTemplate(id, null, attributeSlots, elementSlots, rootId)
  → hole updates:
       SET_TEMPLATE_ATTR [rootId, attrSlotIndex, value]
       instead of SET_* on rootId+k
```

IFR continues to record the flat ops stream; hydrate strcmp / structural teardown stays valid as long as ops remain deterministic.

### 5.2 Work items (by subsystem)

#### A. Compiler — emit Template Definition instead of `create()` source

| Today | Native path |
|-------|-------------|
| Generate `function(P){ __CreateView…; return [root, holes] }` | Generate JSON tree with `kind: "static" \| "slot" \| "spread" \| "element" \| "elementSlot"` |
| Hole keys `['#text', 'class', …]` for patchProp routing | Assign dense `attrSlotIndex`; keep a hole→slot map for BG |
| Bake `__SetCSSId` into create | Prefer Template Definition static `css-id` attr (ReactLynx pattern) or options |
| Hoist `registerElementTemplate(id, holes, create)` | Hoist `registerElementTemplateMeta(id, holePlan)` only; **no create fn** in JS/LEPUS |

Reuse ReactLynx’s descriptor contract where possible so we ride the same encoder / engine path. Content-hash ids can stay (`__vlx-…` or switch to `_et_…` for tool sharing — preference: keep Vue prefix unless sharing assets with RL).

#### B. Bundle pipeline — pack `elementTemplate`

Mirror `ReactWebpackPlugin`’s `beforeEncode` tap:

1. Collect Template Definitions from SFC transform / MT loader buildInfo
2. Dedup by id; fail on content collision
3. Assign `encodeData.elementTemplate = { [id]: def }`
4. Ensure web encode path either supports the section or falls back to JS create (web currently rejects JSON ET)

Vue Lynx’s plugin (`plugin/src/entry.ts`) is the natural place; may need cooperation with `@lynx-js/template-webpack-plugin` encode hooks already used by rspeedy.

#### C. Ops protocol — slot-indexed updates

Minimal additive protocol (keeps IFR recording):

```
INSTANTIATE_TEMPLATE: [15, rootId, tplId, attrSlotCount, /* attributeSlots packed or follow-up */]
  or split:
CREATE_NATIVE_TEMPLATE: [N, rootId, tplId]
SET_TEMPLATE_SLOTS:     [N, rootId, attributeSlots[]]   // initial + full replace
SET_TEMPLATE_ATTR:      [N, rootId, attrSlotIndex, value]
```

**Stop allocating contiguous hole ShadowElements as native-backed nodes.** Options:

1. **Preferred (align with RL):** BG hole shadows become **logical only** (no MT id). `patchProp('__hN')` emits `SET_TEMPLATE_ATTR(rootId, n, value)`. Events become attr-slot values (signs), applied natively or via a thin MT adapter — same idea as `__etAttrPlanMap`.
2. **Compatibility shim:** After `__CreateElementTemplate`, if engine exposes part lookup, map holes to FiberElements and keep `SET_*`. ReactLynx ET does **not** rely on this; do not design the primary path around `__GetTemplateParts` unless engine docs guarantee it for this API family.

Structural children that today sit *outside* templates stay on `CREATE` / `INSERT` / `REMOVE`. If we later lower element holes inside templates (RL `elementSlot`), add `INSERT_TEMPLATE_NODE` / `REMOVE_TEMPLATE_NODE` wrapping the native insert/remove APIs.

#### D. Main-thread executor

```ts
case OP.INSTANTIATE_TEMPLATE: {
  const root = __CreateElementTemplate(tplId, null, initialSlots, null, rootId);
  elements.set(rootId, root);
  __SetAttribute(root, `vue-ref-${rootId}`, 1); // if still required for NodesRef
  break;
}
case OP.SET_TEMPLATE_ATTR: {
  __SetAttributeOfElementTemplate(elements.get(rootId), slotIndex, value);
  break;
}
```

JS `create()` registry becomes a **fallback** when:

- encode did not pack templates (web / old engine)
- flag `nativeElementTemplates: false`
- unknown template key (placeholder behavior preserved)

#### E. IFR composition

| Concern | Approach |
|---------|----------|
| First paint | MT Vue render still calls the same nodeOps → ops → applyOps; native create just replaces JS create inside `INSTANTIATE_TEMPLATE` |
| Hydration skip | Ops must remain byte-comparable; packing initial `attributeSlots` into create op (like RL `createTemplate` carrying slots) helps |
| Teardown | Today tears down `rootId..rootId+holeCount`. With logical holes, teardown is **rootId only** (plus any element-slot child ids). Update `ifr.ts` accordingly |
| Suspense / post-seal | Unchanged: drop post-seal MT ops |
| Events | First-frame events must still resolve to BG handlers; either keep AddEvent via attr-plan on MT, or slot tokens identical to today’s signs |

ReactLynx additionally uses `__SerializeElementTemplate` for hydrate payloads. Vue does **not** need that for the current ops-stream IFR design. Optional later optimization: serialize native trees instead of replaying ops — a larger protocol change, not required for “use native create.”

#### F. Capability detection / flags

Suggested flags:

```ts
pluginVueLynx({
  enableIFR: true,
  enableElementTemplates: true,          // existing framework ET
  experimental_nativeElementTemplates: true, // pack defs + native PAPI
})
```

Default progression:

1. Keep today’s JS create (stable)
2. Emit Template Definitions in parallel (decode/validate only) — **shadow mode**
3. Flip native instantiate on lynx native; keep JS fallback
4. Measure on-device (FCP, create CPU, template size)
5. Consider making native the default when IFR+ET is on

### 5.3 Mapping Vue holes → native slots

| Vue hole kind today | Native descriptor | Update path |
|---------------------|-------------------|-------------|
| Dynamic text `#text` | `raw-text` child with `{ kind: "slot", key: "text", attrSlotIndex }` or text attr slot | `SET_TEMPLATE_ATTR` |
| Dynamic class/style/attr | `{ kind: "slot", key, attrSlotIndex }` | `SET_TEMPLATE_ATTR` |
| Event (`onTap`, …) | attr slot + MT/BG event plan (token / bind) | slot set (not BG ShadowElement AddEvent on hole id) |
| Spread / style object | `{ kind: "spread", attrSlotIndex }` if engine supports; else keep unlowered | as RL |
| Root vnode props (ref, key, Transition, v-show) | **Stay on vnode** (unchanged Vue rule) | ordinary patchProp on template root ElementRef |
| Interior ref/key/v-if | Still ineligible for lowering | n/a |

Eligibility rules from `0711-2` can remain; only the **emitted backend** changes.

### 5.4 What *not* to copy blindly from ReactLynx

1. **Whole runtime backend swap** — Vue already has ShadowElement + flat ops + IFR hydrate. Replacing that with Preact-style ET instances would be a rewrite, not a migration.
2. **`__SerializeElementTemplate` hydrate** — optional; our ops-stream hydrate already works with ET.
3. **Typed list hosts as `__CreateTypedElementTemplate('list')`** — Vue already has a dedicated list ops path; leave it unless list+ET is a measured bottleneck.
4. **Assuming web parity** — web encode may lag; always keep JS create fallback for `test:dom` / go-web.

### 5.5 Risk register

| Risk | Mitigation |
|------|------------|
| Engine / template-encoder version skew | Feature detect; fallback to JS create |
| Event / worklet / NodesRef parity | Port RL attr-plan patterns; keep root `vue-ref-*` |
| IFR teardown id ranges wrong after dropping hole ids | Update `ifr.ts` + tests first |
| Template size vs JS create size | Bench with `ifr-bench` ladder + on-device |
| css-id / scoped CSS baking differences | Golden DOM tests already compare lowered vs unlowered |
| Docs still saying `__ElementFromBinary` | Update ifr.mdx when implementing |

### 5.6 Suggested implementation phases

1. **Spike (read-only against engine):** Confirm `__CreateElementTemplate` availability in the Lynx versions Vue Lynx targets; encode a hand-written Template Definition through rspeedy and instantiate from a tiny MT harness.
2. **Compiler dual-emit:** Transform produces JSON defs + existing create() (create unused when native on).
3. **Encode hook:** Pack `elementTemplate`; unit-test merge/collision.
4. **Ops + executor:** `SET_TEMPLATE_ATTR`; native instantiate; JS fallback.
5. **BG hole model:** Logical holes; update `node-ops` / `patchProp`; fix IFR teardown.
6. **Events/worklets:** Attr-plan or equivalent.
7. **Correctness:** testing-library ET + IFR suites; hello-world / gallery bundle DOM parity.
8. **Perf:** ifr-bench + device; decide default.

---

## 6. Side-by-side cheat sheet

| Dimension | ReactLynx Snapshot | ReactLynx Native ET | Vue Lynx ET (today) | Vue Lynx native ET (proposed) |
|-----------|--------------------|---------------------|---------------------|-------------------------------|
| Static tree storage | LEPUS `create()` source | Template binary section | LEPUS/JS `create()` source | Template binary section |
| Instantiate | many leaf PAPIs | `__CreateElementTemplate` | many leaf PAPIs via `create()` | `__CreateElementTemplate` |
| Dynamic attrs | `update[i]` + `__elements[j]` | attrSlotIndex API | `SET_*` on hole ids | `SET_TEMPLATE_ATTR` / slot API |
| Dynamic children | slot table | elementSlots | outside template / vdom | same initially; elementSlots later |
| Cross-thread | SnapshotOperation patches | ET update opcodes | Vue flat ops | Vue flat ops (extended) |
| IFR hydrate | serialize instance tree | `__SerializeElementTemplate` | recorded ops stream | recorded ops stream |
| Relationship to Snapshot | — | full backend replace | inspired by Snapshot | keep Vue renderer; swap ET backend |

---

## 7. Conclusion

1. **Snapshot → Element Template in ReactLynx** is a backend replacement: static UI moves from **imperative JS/LEPUS PAPI factories** into **engine-registered Template Definitions**, updated through **slot-indexed native APIs**, with packaging via `encodeData.elementTemplate`.
2. **Vue Lynx ET** already captured Snapshot’s compile-time win and composed cleanly with IFR, but still instantiates with JS `create()` and updates holes like Snapshot’s `__elements[]`.
3. **Native ET for Vue** should be an **ET backend upgrade**, not an IFR redesign: emit Template Definitions, pack them at encode time, instantiate with `__CreateElementTemplate`, and migrate hole updates to attr slots — while retaining ShadowElement, flat ops, and ops-stream IFR hydration, with JS create as fallback.

Primary design hinge: **give up contiguous hole FiberElement ids** (or accept a permanent shim) so the update path matches what the native engine actually optimizes.

> **§8 updates this conclusion against vapor head:** the hinge still holds for VDOM Code-Template → Engine; vapor already climbed Data-Template + Engine *stub*, but the stub’s invented signatures diverge from ReactLynx and must be reconciled before claiming a real Engine-Template cell.

---

## 8. Addendum — vapor head audit (2026-07-23)

Rebased this study branch onto `origin/vapor` (`793f4cc7`) and re-read the shipping graph-eng stack. §§4–6 above describe the **main-era** VDOM Code-Template. Vapor has since formalized the ladder and landed several rungs — **without yet closing the ReactLynx-native gap**.

### 8.1 What vapor actually ships

Ground truth (`docs/plans/graph-eng-goal.md`, `internal/src/matrix.ts`): a UI subtree is `λ holes. tree`. Five columns locate every materialization:

| Axis | Levels (normalized) |
|------|---------------------|
| **Staging** | `ops` → `data` (tree+interp) → `code` (per-template `create()`) → `native` (engine clone) |
| **Naming** | `node` (dense) / `block` (sparse: base + offset) |
| **Addressing** | `random-access` / `traversal` / `traversal+recover` |
| **Provider** | `bts` / `mts` / `engine` |
| **Lifetime** | `persistent` / `ephemeral` (+ delivery `runtime` \| `bundle`) |

Mechanism names on that ladder:

| Mechanism | Coordinate (typical) | Status on vapor |
|-----------|----------------------|-----------------|
| Op Stream | staging=`ops` | VDOM default without ET |
| Named Tree | staging=`data`, naming=`node` | Vapor dense `CLONE_TREE` |
| **Data-Template** | staging=`data`, naming=`block`, recovered | Vapor sparse A2 (**shipping**, default naming) |
| **Code-Template** | staging=`code`, naming=`block`, intrinsic | VDOM JS ET (`INSTANTIATE_TEMPLATE`) — **shipping**; Vapor Code path **skipped** (M3a) |
| **Engine-Template** | staging=`native` | **Probe + stub** on Vapor `REGISTER_TREE`/`CLONE_TREE` only; Lynx-for-Web always stub |

Also landed beyond the original study:

- **Element slots** (`#slot`, ops `INSERT/REMOVE_TEMPLATE_SLOT` 18/19) — structural hosts can live *inside* a Code-Template as wrapper holes (`element-template-transform.ts`, `element-templates.ts`).
- **Recovered sparse addressing** — `__vlxAddressing` + tag-fingerprint fail-safe densify (`vapor-addressing.ts`, `buildShadowCloneSparse`).
- **Four-axis flags** — `templateStaging`, `templateNaming`, `ifrPaint`; `legalCells` in `matrix.ts`.
- **GRAPH-ENG factor report** — engine cells honestly marked N/A/stub on web.

### 8.2 Create paths today (vapor)

```
VDOM + ET:   __vlx-tpl → INSTANTIATE_TEMPLATE → JS create() PAPIs
             holes = contiguous FiberElements at rootId+1…N (+ #slot wrappers)
             updates = ordinary SET_* / events on hole ids

Vapor:       template() → REGISTER_TREE → CLONE_TREE
             naming=block → sparse uid = base + indexInAddressed
             optional templateStaging=native → tryEngineCloneTree → else interpreter

Engine stub: runtime-build prototype from wire TemplateNode, then
             hoped-for native instantiate — Delivery still `runtime`, not `bundle`
```

**VDOM `INSTANTIATE_TEMPLATE` never calls `engine-template.ts`.** Engine staging is wired only into the Vapor Data residual.

### 8.3 Critical finding: probe signatures ≠ ReactLynx

`main-thread/src/engine-template.ts` documents an **invented / unconfirmed** family:

| Vue vapor probe | ReactLynx real ET (this study §3.4) |
|-----------------|--------------------------------------|
| `__CreateElementTemplate(tag, slot)` | `__CreateElementTemplate(templateKey, bundleUrl, attributeSlots, elementSlots, uid)` |
| `__InstantiateElementTemplate(handle, pageUniqueId, namedSlots)` | *(no separate instantiate — create returns root)* |
| `__SetAttributeOfElementTemplate(node, key, value)` | `__SetAttributeOfElementTemplate(element, attrSlotIndex, value)` |
| `__InsertNodeToElementTemplate(parent, child)` | `__InsertNodeToElementTemplate(parent, elementSlotIndex, child, reference)` |
| *(none)* | `__RemoveNodeFromElementTemplate`, `__SerializeElementTemplate` |
| *(none)* | `encodeData.elementTemplate` Template Definition JSON |

So vapor’s “Engine-Template” cell currently proves **routing + honesty (stub fallback)**, not compatibility with the Lynx/ReactLynx native contract. On measured Lynx-for-Web hosts, status is always `'stub'`.

### 8.4 Hole / slot model vs study hinge

| Question | Vapor answer |
|----------|--------------|
| Contiguous hole FiberElement ids (`rootId+k`)? | **Yes, still** for VDOM Code-Template |
| Attr-slot indexed updates (`SET_TEMPLATE_ATTR`)? | **No** |
| Logical-only holes (no MT id)? | **Not started** |
| Structural element holes? | **Partial** — `#slot` + ops 18/19 on FiberElement wrappers (closer to RL elementSlots, still handle-based) |
| IFR × sparse densify? | **Not needed** — ops-stream hydrate; `ifr-sparse-hydration.test.ts` pins frame equality |
| IFR teardown of `rootId..+holeCount`? | Largely **superseded** — teardown walks recorded inserts under page root |

The study’s primary hinge (**give up contiguous hole ids for attr slots**) remains the open work for a true Engine-Template on the **VDOM Code** residual. Sparse naming on Vapor is a **bookkeeping** axis (fewer BG shells / named map entries); it does not by itself move staging to native.

### 8.5 Study phases (§5.6) vs graph-eng milestones

| Study phase | Vs vapor |
|-------------|----------|
| 1. Spike real `__CreateElementTemplate` + encode | **Partial / misaligned** — probe exists with non-RL signatures; no encode |
| 2. Compiler dual-emit JSON Template Definition | **Not started** |
| 3. Encode `elementTemplate` | **Not started** |
| 4. `SET_TEMPLATE_ATTR` + native instantiate on VDOM | **Not started** (have 18/19; engine only on Vapor CLONE) |
| 5. Logical holes + IFR teardown | Holes **not started**; IFR teardown already root-based |
| 6. Events/worklets attr-plan | **Not started** |
| 7. Correctness suites | **Done** for framework + stub paths |
| 8. Perf / defaults | **Done** as matrix; product defaults unchanged; engine = stub/N/A |

Parallel vapor work **beyond** the study (done): element slots, recovered sparse A2, flag matrix, engine stub ladder, factor report. M3a (Vapor Code-Template) explicitly skipped; M3c (compiler-direct IFR paint) is flag-only.

### 8.6 Revised recommendation (after rebase)

Keep the ReactLynx learning (§§2–3) and the Vue backend-upgrade framing (§5), but sequence against vapor’s matrix:

1. **Align Engine probe with ReactLynx PAPIs** before investing further in `engine-template.ts` inventiveness. Treat current signatures as placeholders; rebind to `templateKey` + attr/element slot arrays + uid.
2. **Prefer `bundle` delivery for native** (Template Definition JSON → `encodeData.elementTemplate`) as the RL-shaped optimum; keep today’s `runtime` REGISTER_TREE→engine path as a **proof** that staging=`native` need not wait on encode — useful for Vapor, insufficient for VDOM Code→Engine parity with RL.
3. **Climb VDOM Code → Engine** as the study originally proposed: dual-emit defs, pack at encode, `INSTANTIATE_TEMPLATE` → `__CreateElementTemplate(key,…)`, migrate hole `SET_*` → attr-slot ops. Element slots (#308) already give structural holes a home.
4. **Do not conflate sparse naming with Engine staging** — GRAPH-ENG-REPORT already shows naming is bookkeeping; FCP wins need staging moves (and real native, not stub).
5. **Keep ops-stream IFR** — vapor confirmed IFR×sparse needs no densify; `__SerializeElementTemplate` remains optional.
6. **Update docs** (`ifr.mdx` `__ElementFromBinary` wording; engine-template header) once signatures are RL-aligned.

### 8.7 One-line status after rebase

> On vapor we have **formalized** the Snapshot→ET ladder and **ship** Data-Template + Code-Template + an Engine **stub**; we still do **not** speak ReactLynx’s native Element Template dialect (key/bundleUrl/attrSlots/elementSlots + encode packing). That dialect alignment is the next concrete step if the goal is true Engine-Template, not another invented PAPI façade.
