# Lynx `<list>`: stack review and framework contract report

Date: 2026-07-22
Reviewed stack: [#293](https://github.com/Huxpro/vue-lynx/pull/293) → [#307](https://github.com/Huxpro/vue-lynx/pull/307) (fixes #302) → [#311](https://github.com/Huxpro/vue-lynx/pull/311) (fixes #303)

## English

### Executive conclusion

The original stack established a useful Vue-side list diff and callback protocol but was not ready as a complete recycling implementation: it created one main-thread tree per logical item and #307 only swapped already-created trees. The follow-up implementation in this report adds the missing compiler blueprint and `ListDataSource` shim. Eligible template-defined rows are now lazily materialized and viewport-bounded; complex cross-component/structurally dynamic rows remain a correct eager fallback and are the explicit remaining optimization boundary.

The review gates were:

1. Correct #293's performance and documentation claims before merging it.
2. Do not merge #307 until recycling uses opaque Element PAPI handles, generates structural reuse identifiers, and materializes a bounded number of cells.
3. Do not merge #311 until teardown recursively covers lists beneath a removed ancestor.

Reviews posted:

- [PR #293 review](https://github.com/Huxpro/vue-lynx/pull/293#pullrequestreview-4747173741): unconditional re-diffing and an unsupported flat-memory claim.
- [PR #307 review](https://github.com/Huxpro/vue-lynx/pull/307#pullrequestreview-4747190270): DOM-only traversal, unsafe implicit reuse grouping, and no actual memory bound.
- [PR #311 review](https://github.com/Huxpro/vue-lynx/pull/311#pullrequestreview-4747193997): callbacks survive ancestor removal.

### Post-review implementation result

The review findings were then implemented on top of the latest stacked head. The resulting design is a real shim of the proposed `ListDataSource` over the legacy List Element PAPI:

1. The Vue Lynx template compiler lowers an eligible `<list-item>` into a structural blueprint plus dynamic root/hole values. This is a Vue Lynx compiler transform; **no change to Vue core, `runtime-dom`, or a browser implementation is required**.
2. The background renderer emits a cheap logical `DEFINE_LIST_ITEM_TEMPLATE` record. It no longer emits `CREATE` for every native node in every row.
3. The main-thread shim translates logical order and metadata back into the existing `update-list-info`, `componentAtIndex`, `componentAtIndexes`, `enqueueComponent`, `__UpdateListCallbacks`, and correlated flush APIs.
4. `componentAtIndex` creates or acquires a compiler-compatible cell, replays the latest text/prop/style/class/event/worklet/ref/scope mutations, and binds the logical ids to the physical handles. `enqueueComponent` clears those bindings and returns the physical cell to a template-keyed pool.
5. Complex cells that cannot yet be represented by the local static-shape blueprint (for example an arbitrary child component or an inner structural directive) retain the old eager renderer as a correctness fallback. They do not receive the new native-memory bound. A future cross-component snapshot or deferred-render transform is needed to remove this remaining performance fallback.

This means the earlier stack work is still needed, but its role is narrower and clearer:

- #293 supplies stable keyed transactions, dirty-list scheduling, and platform metadata.
- #307 supplies the lease/pool lifecycle, now replaced for compiler-backed rows by actual deferred creation and hydration rather than swapping two eager trees.
- #311 supplies callback refresh and recursive destruction.
- The new compiler/data-source layer is the missing mechanism that makes those three pieces memory-effective.

ReactLynx does perform analogous compiler work. Its SWC list transform rewrites deferred list items into `DeferredListItem` render closures; its snapshot/element-template transforms extract list platform information and compile structural templates. The runtime then materializes or hydrates snapshot elements in the native callbacks. Vue Lynx should follow this architecture in its own SFC/compiler plugin, not by modifying upstream Vue's browser/runtime-dom renderer.

#### Verification after the fixes

- Full Vue Lynx testing-library suite: **24 files, 240 tests passed**.
- Internal, runtime, main-thread, and plugin builds: passed.
- Scrolling example production build: both web and Lynx bundles passed for all ten entries.
- iOS Simulator / LynxExplorer, 10k benchmark after all mutations: **9,250 logical rows, 18 native cells created, 9 active, 9 pooled, 72 hydrations**.
- Native memory inspection for the benchmark page: **18 `list-item` views, 82 element nodes, 87,904 element bytes**. The native DOM inspection independently reported the same 18 physical list-item children.
- Existing device cases also used the lazy path without console errors: basic 80→9 cells; waterfall 40→12; infinite 16→8; recycle 40→7.

The device benchmark includes five dynamic row heights, paced high-velocity jumps, prepend 250, middle removal 1,000, rotation of 2,000 items, and roughly 1,000 reactive field updates. An intentionally unpaced burst of several distant jumps was also tested: native queued thousands of materialization requests before returning leases. That is a host scheduling/benchmark-shape limit, not something a framework may solve by stealing still-active cells. The stable benchmark therefore paces independent native relayout transactions and records the burst result as a separate stress finding.

### Sources and verification

This report cross-checked:

- The official [Lynx `<list>` reference](https://lynxjs.org/next/api/elements/built-in/list.html).
- Vue Lynx's dual-thread runtime, ops interpreter, tests, and the three stacked diffs.
- ReactLynx's snapshot list implementation, update-info generation, platform metadata, and destruction lifecycle in the local `lynx-stack` checkout.
- The Lynx REPL's `list-virtualization` and element-creation samples and its Element PAPI typings.

Before the fixes, 44 existing targeted tests passed while two added review regressions failed:

- A one-child cell recycled into a two-child cell rendered `B`, not `BEXTRA`.
- After removing a view containing a list, the old list callback returned element sign `3`, not the inert value `-1`.

Both regressions are fixed in the current implementation. The later full testing-library run passed 240/240 tests. Runtime, main-thread, plugin, and example builds succeeded. The aggregate package build still stops in the unrelated types package because that package's environment cannot resolve `vue`.

### The contract, from basics to recycling

The key distinction is between a **logical item** and a **materialized cell**. `update-list-info` describes logical items. `componentAtIndex` is the native list asking the framework to materialize a cell. `enqueueComponent` returns a materialized cell to framework ownership. Recycling is bounded only when the number of materialized cells tracks the viewport, not the data size.

#### Level 0 — visual list basics

A `<list>` must have a fixed viewport and direct list-item children at the declarative layer. Important attributes are:

| Attribute | Type / values | Contract |
| --- | --- | --- |
| `list-type` | `'single' \| 'flow' \| 'waterfall'` | Required layout algorithm. |
| `scroll-orientation` | `'vertical' \| 'horizontal'` | Main axis. |
| `span-count` | positive number | Column/row span count where supported. |
| `item-key` | string | Stable logical identity; framework key and native key must agree. |
| `recyclable` | boolean, default `true` | Allows cell reuse; it does not itself make an eager framework memory-efficient. |
| `reuse-identifier` | string | Structural compatibility class. Equal identifiers promise that one cell can safely hydrate another. |
| `estimated-main-axis-size-px` | positive number | Size estimate used to plan lazy layout; accuracy reduces jumps and corrections. |
| `preload-buffer-count` | non-negative number | Extra off-screen materialization; trades memory for scroll smoothness. |

Application-facing events include `scroll`, `scrolltoupper`, `scrolltolower`, `scrollstatechange`, `layoutcomplete`, and snap events. Imperative methods include `scrollToPosition`, `scrollBy`, `autoScroll`, and visible-cell queries. These are the public element surface; the callbacks below are a lower-level framework/runtime contract.

#### Level 1 — Element PAPI tree construction

```ts
type ElementRef = Record<string, unknown> // opaque native handle

declare function __CreatePage(tag: string, parentId: number): ElementRef
declare function __CreateList(
  parentId: number,
  componentAtIndex: ComponentAtIndex,
  enqueueComponent: EnqueueComponent,
  info?: unknown,
  componentAtIndexes?: ComponentAtIndexes,
): ElementRef
declare function __CreateView(parentId: number): ElementRef
declare function __CreateText(parentId: number): ElementRef
declare function __CreateRawText(text: string): ElementRef
declare function __AppendElement(parent: ElementRef, child: ElementRef): void
declare function __SetAttribute(el: ElementRef, name: string, value: unknown): void
declare function __SetInlineStyles(el: ElementRef, styles: Record<string, string>): void
declare function __GetElementUniqueID(el: ElementRef): number
declare function __FlushElementTree(root?: ElementRef, options?: FlushOptions): void
```

`ElementRef` is deliberately opaque. Framework code must use PAPI traversal and attribute functions such as `__GetChildren`, `__FirstElement`, `__NextElement`, `__GetAttributeNames`, `__GetAttributeByName`, and `__SetAttribute`; DOM properties such as `.firstChild`, `.textContent`, and `.setAttribute()` are not portable to native Lynx.

Construction and publication are separate. Create and append nodes, then flush. When responding to a list request, flush with the list's operation metadata so native can correlate the produced element with its request.

#### Level 2 — lazy materialization callbacks

```ts
type ComponentAtIndex = (
  listRef: ElementRef,
  listElementId: number,
  cellIndex: number,
  operationId: number,
  enableReuseNotification?: boolean,
  enableBatchRender?: boolean,
  asyncFlush?: boolean,
) => number | undefined

type EnqueueComponent = (
  listRef: ElementRef,
  listElementId: number,
  elementId: number,
) => void

interface FlushOptions {
  triggerLayout?: boolean
  operationID?: number
  elementID?: number
  listID?: number
  operationIDs?: number[]
  elementIDs?: number[]
  asyncFlush?: boolean
}
```

`componentAtIndex` must materialize or rehydrate the requested logical index, publish it with the matching `operationId`, and return its unique element sign. It must read the current committed data snapshot. `enqueueComponent` is a lifecycle transfer: the element is no longer active for that index and may be pooled, unrendered, or destroyed.

#### Level 3 — dynamic data transactions

```ts
interface ListItemPlatformInfo {
  position: number
  type?: string
  'item-key'?: string
  'reuse-identifier'?: string
  'estimated-main-axis-size-px'?: number
}

interface ListUpdateInfo {
  insertAction: ListItemPlatformInfo[]
  removeAction: number[]
  updateAction: Array<
    ListItemPlatformInfo & { from: number; to: number; flush?: boolean }
  >
}
```

Set this object through `__SetAttribute(list, 'update-list-info', info)` and flush it as one transaction. Removal and `from` positions address the old list; insertion and `to` positions address the new list. Stable `item-key` values distinguish movement from replacement. The framework must compute the transaction once per dirty list, not on every unrelated ops flush.

#### Level 4 — callback freshness and destruction

```ts
declare function __UpdateListCallbacks(
  list: ElementRef,
  componentAtIndex: ComponentAtIndex,
  enqueueComponent: EnqueueComponent,
  componentAtIndexes?: ComponentAtIndexes,
): void
```

Callbacks close over render state. Refresh them when the committed data snapshot changes, before native can request the new indices. Destruction must replace or clear them and release every per-list map. Cleanup follows ownership recursively: removing an ancestor destroys every descendant list, not just a directly removed list.

#### Level 5 — batching and asynchronous delivery

```ts
type ComponentAtIndexes = (
  listRef: ElementRef,
  listElementId: number,
  cellIndexes: number[],
  operationIds: number[],
  enableReuseNotification: boolean,
  asyncFlush: boolean,
) => void
```

The batch callback preserves index/operation-ID pairing and may need two phases: fulfill already-materialized or immediately reusable cells first, then create deferred cells and flush their parallel `elementIDs` and `operationIDs`. `asyncFlush` and reuse notification are protocol flags, not optional decoration; an adapter must either implement them or negotiate that it cannot.

#### Level 6 — correct recycling

Recycling requires all of the following:

1. **Stable logical identity:** `item-key` tracks data identity across moves.
2. **Structural compatibility:** `reuse-identifier` is compiler-generated or explicitly supplied and changes when the cell skeleton changes.
3. **Deferred materialization:** logical items do not each own a native tree.
4. **Hydration:** all dynamic text, attributes, styles, events, refs, and descendant ownership are retargeted through PAPI or a framework snapshot.
5. **Bounded pools:** active plus pooled materialized cells are bounded relative to viewport/preload needs.
6. **Lifecycle completion:** the displaced snapshot is unrendered/cleaned; list destruction clears callbacks and pools.

ReactLynx implements this with snapshot instances, a sign-to-snapshot map, pools keyed by structural reuse type, real snapshot hydration, teardown of the displaced snapshot, batched operation correlation, and lifetime cleanup. This is the relevant architectural reference—not merely swapping two native root handles.

### Vanilla MTS composition

The complete control flow is:

```text
create page/list → register callbacks → append + structural flush
        ↓
publish update-list-info transaction
        ↓
native requests index + operation ID
        ↓
reuse compatible cell or create one → hydrate → correlated flush → return sign
        ↓
native enqueues off-screen sign → framework pools/unrenders it
        ↓
data commit → refresh callbacks → publish one new update transaction
        ↓
ancestor/list destruction → clear callbacks, active maps, and pools
```

The typed MTS composition and three executable REPL examples are:

- [`vanilla-list-contract.mts`](./vanilla-list-contract.mts): a typed, framework-free protocol composition.
- [`01-basics/main-thread.js`](./repl-examples/01-basics/main-thread.js): lazy creation and correlated flush.
- [`02-mutations/main-thread.js`](./repl-examples/02-mutations/main-thread.js): insertion/removal transactions and callback refresh.
- [`03-recycling/main-thread.js`](./repl-examples/03-recycling/main-thread.js): explicit structural class and a bounded reusable-cell pool.

They intentionally use only Element PAPI, not DOM APIs. The examples are educational protocol samples; production adapters must also handle batch/async requests, errors, event/ref rebinding, and destruction.

### Framework analysis

| Framework pattern | Benefits | Main challenges with the current low-level API | Fit today |
| --- | --- | --- | --- |
| ReactLynx snapshot/compiled JSX | Snapshot shape naturally supplies a reuse class; hydration and unrendering already exist; logical and materialized ownership are separate. | Snapshot lifecycle, async batching, and ref/event transfer remain complex. | Best current fit. |
| Vue custom renderer + VNodes | Vue keys, patching, effects, and component lifecycle provide rich logical identity and updates. | The renderer eagerly creates host nodes; native later asks for lazy cells. Swapping opaque roots bypasses Vue's ownership graph, refs, effects, Teleports, events, and shape changes. | Good list API ergonomics, poor recycling fit until a list-specific lazy renderer/blueprint layer exists. |
| Svelte/compiler-first | Compiler can emit static skeletons, dynamic slots, and deterministic structural reuse IDs with little runtime overhead. | Each-block lifecycle and keyed state must be suspended/rehydrated correctly; native requests are out-of-band. | Potentially excellent. |
| Solid/fine-grained ownership | Dynamic fields can update cheaply; stable computations map well to hydration slots. | Reactive owners and cleanup must follow recycled logical ownership rather than persistent native nodes. | Strong if ownership transfer is explicit. |
| DOM-oriented VDOM renderers | Mature keyed diff and component lifecycle. | Assume host trees are framework-owned and materialized; opaque PAPI handles and native-driven creation violate those assumptions. | Weak without an adapter-specific virtual data source. |

#### What kind of framework best fits today's API?

A compiler-assisted, snapshot-oriented framework fits best. It can represent every item as a cheap logical snapshot, emit a stable structural type, instantiate only on demand, hydrate compatible materialized cells, and dispose displaced ownership. ReactLynx is currently the clearest fit because these mechanisms were designed together. A compiler-first system such as Svelte could fit equally well with an explicit ownership-transfer runtime. Conventional eager host renderers are the least natural match.

#### How should the low-level API better support frameworks?

The API should promote its implicit callback convention into a versioned, capability-negotiated data-source contract:

```ts
interface ListDataSource<Key, Blueprint, Cell> {
  getCount(): number
  getKey(index: number): Key
  getReuseType(index: number): string
  getBlueprint(index: number): Blueprint
  create(type: string): Cell
  hydrate(cell: Cell, blueprint: Blueprint, context: RequestContext): void
  recycle(cell: Cell, reason: 'offscreen' | 'replace' | 'destroy'): void
}
```

Recommended API evolution:

- Make logical count/key/reuse type first-class so frameworks do not encode them in loosely typed attribute objects.
- Accept immutable, versioned transactions keyed by identity; define old/new positional coordinates explicitly.
- Return an opaque cell lease/token from creation and require an explicit ownership transition on recycle.
- Provide native PAPI traversal/copy primitives or, preferably, framework-neutral templates with named dynamic slots so adapters never inspect DOM structure.
- Make batching, async completion, cancellation, and errors explicit (`Promise`/acknowledgement plus operation version), and define stale-request behavior.
- Add capability discovery for batch render, reuse notifications, async flush, and cleanup callbacks.
- Define recursive lifetime ownership in the protocol so removing a subtree automatically unregisters contained lists.
- Supply diagnostics for duplicate keys, reuse-shape mismatch, stale operation IDs, pool size, and materialized-cell count.
- Align the published TypeScript declarations with runtime reality, including `updateAction`, batch callbacks, teardown/nullability, and flush fields.

For Vue specifically, the most viable design is a compile-time list-item blueprint plus a list-scoped renderer. Vue keeps logical VNodes/component instances, but host nodes are created only when Lynx requests an index. Generated slot metadata drives hydration; `reuse-identifier` derives from the static skeleton; reactive effects and refs attach to a logical lease and detach on enqueue. This preserves Vue semantics while meeting Lynx's memory model.

### Stack-specific findings

| PR | Finding | Severity | Required direction |
| --- | --- | --- | --- |
| #293 | Every ops flush recomputes every list diff/LIS, including unrelated style or text updates. | P1 | Track dirty list IDs and diff only those on a committed list change. |
| #293 | Documentation says native recycling keeps memory flat before Vue implements bounded materialization. | P1 | Describe native capability and current adapter limitation precisely. |
| #307 | Hydration uses DOM traversal/mutation on opaque native handles. | P1 | Use PAPI or snapshot/template hydration and test opaque handles. |
| #307 | Missing reuse identifiers collapse to one pool; differing shapes lose descendants. | P1 | Generate structural identifiers or require explicit compatible IDs; support structural edits. |
| #307 | Tree swapping retains one pre-created tree per data item. | P1 | Defer creation and bound active/pool materialization. |
| #311 | Removing an ancestor does not clear callbacks for descendant lists. | P1 | Recursively destroy registered descendant lists. |

Additional hardening should cover batch flags (`enableReuseNotification`, `asyncFlush`), teardown ordering in `resetMainThreadState`, cross-list moves, duplicate keys, stale operation IDs, mixed shapes, nested lists, and production builds without debug probes.

### Report iteration record

- Pass 1: extracted public API, Element PAPI types, ReactLynx behavior, and REPL conventions.
- Pass 2: mapped those contracts to the Vue stack and added framework trade-off analysis.
- Pass 3: ran targeted tests/builds, added two focused regressions, reconciled conclusions with observed failures, checked examples syntactically, and mirrored terminology in Chinese.
- Pass 4: implemented the compiler blueprint and legacy-PAPI data-source shim, then reran the complete local suite and package/example builds.
- Pass 5: exercised the old cases and a LegendList-inspired 10k stress workload through Lynx DevTool on iOS, inspected the native DOM and memory counters, separated an invalid overlapping-relayout burst from the stable benchmark, and updated both languages from measured evidence.

---

## 中文翻译

### 结论摘要

原始 stack 建立了有价值的 Vue 侧 list diff 和回调协议，但还不是完整回收实现：它会为每个逻辑项创建主线程树，#307 只交换已经创建的树。本报告后续实现补上了编译期 blueprint 与 `ListDataSource` shim。符合条件的模板行现在真正延迟物化，并且物理 cell 数量跟随视口；跨任意组件或内部结构动态的复杂行仍保留正确的 eager fallback，这是明确的剩余优化边界。

评审时的合并门槛如下：

1. #293 合并前修正性能问题与文档表述。
2. #307 在做到“只操作不透明 Element PAPI handle、生成结构化复用标识、只物化有限数量 cell”之前不要合并。
3. #311 在 teardown 能递归覆盖被删除祖先之下的 list 之前不要合并。

已发布的评审：

- [PR #293](https://github.com/Huxpro/vue-lynx/pull/293#pullrequestreview-4747173741)：无条件重复 diff，以及没有实现依据的“内存恒定”承诺。
- [PR #307](https://github.com/Huxpro/vue-lynx/pull/307#pullrequestreview-4747190270)：仅 DOM 可用的遍历、错误的默认复用分组、并未真正限制内存。
- [PR #311](https://github.com/Huxpro/vue-lynx/pull/311#pullrequestreview-4747193997)：删除祖先后回调仍存活。

### 评审后实现结果

上述问题随后已在最新 stack 顶端实现。最终方案确实是把建议的 `ListDataSource` 作为 shim 架在旧 List Element PAPI 上：

1. Vue Lynx 模板编译器把符合条件的 `<list-item>` 降低为“结构 blueprint + 根/动态 hole 值”。这是 Vue Lynx 自己的编译器转换，**不需要修改 Vue core、`runtime-dom` 或所谓的 Vue upstream 浏览器实现**。
2. 后台 renderer 只发送廉价的逻辑 `DEFINE_LIST_ITEM_TEMPLATE` 记录，不再为每一行的每个原生节点发送 `CREATE`。
3. 主线程 shim 把逻辑顺序与元数据翻译回已有的 `update-list-info`、`componentAtIndex`、`componentAtIndexes`、`enqueueComponent`、`__UpdateListCallbacks` 和带 operation ID 的 flush。
4. `componentAtIndex` 创建或取得编译器判定为兼容的 cell，重放最新文本、属性、样式、class、事件、worklet、ref 与 scope 状态，并把逻辑 id 绑定到物理 handle；`enqueueComponent` 解除绑定并把物理 cell 放回按模板分类的池。
5. 当前本地静态形状 blueprint 无法表达的复杂 cell（例如任意子组件或内部结构指令）仍走旧 eager renderer，以保证正确性；这条 fallback 不具备新的原生内存上界。要消除它，后续需要跨组件 snapshot 或 deferred-render 编译转换。

所以此前 stack 的工作仍然需要，但职责已更清楚：

- #293 提供稳定 key 事务、dirty-list 调度和平台元数据；
- #307 提供 lease/池生命周期，但 compiler-backed 行不再交换两棵 eager 树，而是真正延迟创建并 hydrate；
- #311 提供回调刷新与递归销毁；
- 新增的编译器/data-source 层补上了让三者真正获得内存收益的缺失机制。

ReactLynx 的确做了同类编译器处理：SWC list transform 会把 deferred list-item 改写为 `DeferredListItem` render closure；snapshot/element-template transform 会抽取 list 平台信息并生成结构模板；运行时再在原生回调内物化或 hydrate snapshot element。Vue Lynx 应在自己的 SFC/compiler plugin 中采用这一架构，而不是修改 upstream Vue 的浏览器/`runtime-dom` renderer。

#### 修复后的验证

- Vue Lynx testing-library 全量：**24 个文件、240 个测试通过**。
- internal、runtime、main-thread、plugin 构建通过。
- scrolling 示例生产构建：十个入口的 web 与 Lynx bundle 全部通过。
- iOS Simulator / LynxExplorer 的 10k benchmark 完成所有 mutation 后：**9,250 个逻辑行，只创建 18 个 native cell；9 active、9 pooled、72 次 hydration**。
- 原生内存检查：benchmark 页面只有 **18 个 `list-item` view、82 个 element node、87,904 element bytes**；DOM 检查也独立确认只有 18 个物理 list-item 子节点。
- 旧设备案例均进入 lazy path 且无 console error：basic 80→9、waterfall 40→12、infinite 16→8、recycle 40→7。

设备 benchmark 覆盖五档动态高度、带节奏的高速跳转、prepend 250、删除中间 1,000、移动 2,000 项，以及约 1,000 个响应式字段更新。另行测试了多个远距离跳转完全不让出事件循环的 burst：原生端会在归还 lease 前排队请求数千个 cell。框架不能通过抢占仍在使用的 cell 安全解决这种 host 调度情况，因此稳定 benchmark 会让相互独立的原生 relayout 事务之间有间隔，同时把 burst 结果作为单独压力结论保留。

### 信息来源与验证

本报告交叉检查了 [Lynx `<list>` 官方文档](https://lynxjs.org/next/api/elements/built-in/list.html)、Vue Lynx 双线程运行时与三组 diff、ReactLynx 的 snapshot list 实现，以及 Lynx REPL 的 `list-virtualization`/元素创建示例和 Element PAPI 类型。

修复前，完整堆栈上的 44 个既有定向测试通过，但新增的两个评审回归用例失败：

- 单子节点 cell 回收到双子节点 cell 后只渲染 `B`，缺少 `EXTRA`。
- 删除包含 list 的 view 后，旧 list 回调仍返回元素 sign `3`，而不是失效值 `-1`。

当前实现已修复这两个回归，后续 testing-library 全量为 240/240 通过；runtime、main-thread、plugin 与示例构建均成功。聚合构建仍会在无关的 types 包中因为环境无法解析 `vue` 而停止。

### 从基础到回收的契约分层

最重要的区分是**逻辑数据项**与**已物化 cell**。`update-list-info` 描述逻辑数据；`componentAtIndex` 表示原生 list 要求框架物化某个 cell；`enqueueComponent` 把已物化 cell 的所有权交还框架。只有当已物化 cell 数量跟随视口而不是数据规模增长时，回收才真正有内存上界。

#### 第 0 层——可视 list 基础

声明式 `<list>` 需要固定视口，直接子节点应是 list-item。核心属性如下：

| 属性 | 类型/取值 | 契约 |
| --- | --- | --- |
| `list-type` | `'single' \| 'flow' \| 'waterfall'` | 必需的布局算法。 |
| `scroll-orientation` | `'vertical' \| 'horizontal'` | 主轴方向。 |
| `span-count` | 正数 | 支持场景下的行/列跨度数。 |
| `item-key` | string | 稳定逻辑身份；框架 key 必须与原生 key 一致。 |
| `recyclable` | boolean，默认 `true` | 允许复用；它不会自动让 eager 框架获得内存优势。 |
| `reuse-identifier` | string | 结构兼容类别；相同值意味着两个 cell 可以安全互相 hydrate。 |
| `estimated-main-axis-size-px` | 正数 | 延迟布局尺寸估计；越准确，跳动与修正越少。 |
| `preload-buffer-count` | 非负数 | 额外的屏外物化量，以内存换滚动平滑度。 |

应用层事件包括 `scroll`、`scrolltoupper`、`scrolltolower`、`scrollstatechange`、`layoutcomplete` 和吸附事件；命令式方法包括 `scrollToPosition`、`scrollBy`、`autoScroll` 及可见 cell 查询。它们属于公开元素 API；下面的回调是更底层的框架/运行时契约。

#### 第 1 层——Element PAPI 树构建

核心类型与函数见英文部分的 `ElementRef`、`__CreateList`、创建/追加/属性/样式/唯一 ID/flush 声明。`ElementRef` 是不透明原生 handle。框架必须使用 `__GetChildren`、`__FirstElement`、`__NextElement`、`__GetAttributeNames`、`__GetAttributeByName` 和 `__SetAttribute` 等 PAPI；`.firstChild`、`.textContent`、`.setAttribute()` 等 DOM 能力不能移植到 Lynx 原生端。

创建与发布是两个阶段：先创建、追加，再 flush。响应 list 请求时，flush 必须携带该请求的 `operationID`、`elementID` 和 `listID`，使原生端能正确关联结果。

#### 第 2 层——延迟物化回调

英文部分的 `ComponentAtIndex`、`EnqueueComponent` 和 `FlushOptions` 给出了完整签名。`componentAtIndex` 必须按当前已提交数据快照创建或 hydrate 指定 index，用匹配的 operation ID 发布，并返回唯一元素 sign。`enqueueComponent` 是一次生命周期所有权转移：该元素不再服务原 index，可以进入池、unrender 或销毁。

#### 第 3 层——动态数据事务

`ListUpdateInfo` 包含 `insertAction`、`removeAction` 和 `updateAction`；单项元数据包括位置、类型、`item-key`、`reuse-identifier` 和主轴尺寸估计。通过 `__SetAttribute(list, 'update-list-info', info)` 设置，再作为一个事务 flush。

删除位置和 `from` 指向旧列表坐标；插入位置和 `to` 指向新列表坐标。稳定 `item-key` 用于区分移动与替换。框架只能为发生变化的 list 计算一次事务，不应在任意无关 ops flush 中对所有 list 重算 LIS/diff。

#### 第 4 层——回调新鲜度与销毁

使用 `__UpdateListCallbacks` 在提交新数据快照后、原生请求新 index 前刷新闭包。销毁时必须清除或替换回调，并释放每个 list 的映射。清理遵循递归所有权：删除一个祖先必须销毁其所有后代 list，而不仅仅处理直接被删除的 list。

#### 第 5 层——批处理与异步交付

批量回调同时接收 `cellIndexes`、一一对应的 `operationIds`、`enableReuseNotification` 和 `asyncFlush`。实现可能需要两阶段 flush：先交付已经物化/可以立即复用的 cell，再创建延迟 cell，并保持 `elementIDs` 与 `operationIDs` 平行对应。异步与复用通知是协议能力；适配器必须实现它们，或明确协商为不支持。

#### 第 6 层——正确回收

完整回收必须同时满足：

1. `item-key` 在移动中保持数据身份。
2. `reuse-identifier` 由编译器生成或显式提供，结构骨架变化时必须变化。
3. 逻辑数据项不各自拥有一棵原生树，只按需物化。
4. 通过 PAPI 或框架 snapshot 重绑定所有动态文本、属性、样式、事件、ref 和后代所有权。
5. 活跃 cell 与池中 cell 总量相对视口/预加载需求有界。
6. 被替换 snapshot 完成 unrender/清理；list 销毁时清空回调和池。

ReactLynx 使用 snapshot instance、sign-to-snapshot 映射、按结构类型分组的池、真实 snapshot hydration、被替换 snapshot teardown、批量 operation 关联和 lifetime cleanup。真正值得参考的是这套架构，而不只是交换两个原生根 handle。

### Vanilla MTS 组合方式与 REPL

完整流程是：创建 page/list 并注册回调 → 追加并结构 flush → 发布 `update-list-info` → 原生携带 index/operation ID 请求 cell → 复用兼容 cell 或新建、hydrate、关联 flush、返回 sign → 屏外 sign 被 enqueue 后进入框架池/unrender → 数据提交时刷新回调并发布新事务 → list/祖先销毁时清除回调、活跃映射和池。

带类型的 MTS 组合示意与三个遵循 `globalThis.renderPage`/“Demonstrates” 风格的 REPL 可执行样例是：

- [`vanilla-list-contract.mts`](./vanilla-list-contract.mts)：带完整类型的无框架协议组合示意。
- [`01-basics/main-thread.js`](./repl-examples/01-basics/main-thread.js)：延迟创建与关联 flush。
- [`02-mutations/main-thread.js`](./repl-examples/02-mutations/main-thread.js)：插入/删除事务和回调刷新。
- [`03-recycling/main-thread.js`](./repl-examples/03-recycling/main-thread.js)：显式结构类别和有界复用池。

样例只使用 Element PAPI，不使用 DOM API。它们用于讲解协议；生产适配器还必须处理批量/异步请求、错误、事件/ref 重绑定和销毁。

### 框架适配分析

| 框架模式 | 收益 | 当前底层 API 的主要挑战 | 当前适配度 |
| --- | --- | --- | --- |
| ReactLynx snapshot/编译 JSX | snapshot 形状天然提供复用类别；已有 hydration/unrender；逻辑与物化所有权分离。 | snapshot 生命周期、异步批量以及 ref/event 转移仍然复杂。 | 当前最佳。 |
| Vue custom renderer + VNode | Vue key、patch、effect 和组件生命周期提供丰富的逻辑身份与更新能力。 | renderer eager 创建 host node；原生随后才按需索取。交换不透明根节点会绕开 Vue 所有权图、ref、effect、Teleport、事件和结构变化。 | list 使用体验好；建立 list 专用 lazy renderer/blueprint 层之前，回收适配差。 |
| Svelte/编译优先 | 编译器可低成本生成静态骨架、动态 slot 和确定性结构复用 ID。 | each-block 生命周期和 keyed state 必须正确挂起/恢复；原生请求在框架正常流程之外。 | 潜力极佳。 |
| Solid/细粒度所有权 | 动态字段更新便宜；稳定 computation 很适合 hydration slot。 | reactive owner 与 cleanup 必须跟随被回收的逻辑所有权，而非持久原生节点。 | 所有权转移显式时较强。 |
| 面向 DOM 的 VDOM renderer | keyed diff 与组件生命周期成熟。 | 默认 host 树由框架所有且始终物化；不透明 PAPI 和原生驱动创建违背假设。 | 没有专用虚拟 data source 时较弱。 |

#### 什么样的框架更适合当前 `<list>` 底层 API？

编译器辅助、snapshot 导向的框架最合适：它能把每个数据项表示为廉价逻辑 snapshot，生成稳定结构类型，只按需实例化，hydrate 兼容 cell，并清理被替换的所有权。ReactLynx 当前最契合，因为这些机制是协同设计的。只要具备显式所有权转移运行时，Svelte 一类编译优先系统也可能同样合适。传统 eager host renderer 最不自然。

#### 底层 API 如何更好支持框架？

应把隐式回调惯例升级为带版本、可协商能力的 data-source 契约。英文部分的 `ListDataSource<Key, Blueprint, Cell>` 展示了建议形态：显式提供 count、key、reuse type、blueprint、create、hydrate 和 recycle。

建议演进：

- 把逻辑 count/key/reuse type 变成一等 API，不再塞入弱类型 attribute object。
- 接收按 identity 表达、不可变且带版本的事务，明确旧/新位置坐标。
- create 返回不透明 cell lease/token，回收时要求显式所有权转移。
- 提供原生 PAPI 遍历/复制原语；更理想的是框架无关、带命名动态 slot 的模板，让适配器无需探查 DOM 结构。
- 明确批量、异步完成、取消、错误与 stale request 语义，可使用 Promise/ack + operation version。
- 为 batch render、reuse notification、async flush 和 cleanup callback 增加能力发现。
- 在协议中定义递归生命周期所有权，使删除子树自动注销其中所有 list。
- 提供重复 key、复用形状不匹配、过期 operation ID、池大小和物化 cell 数量诊断。
- 让公开 TypeScript 声明与实际运行时一致，包括 `updateAction`、批量回调、teardown/nullability 与 flush 字段。

对 Vue，最可行的是“编译期 list-item blueprint + list-scoped renderer”。Vue 保留逻辑 VNode/组件实例，但只在 Lynx 请求 index 时创建 host node；编译生成的 slot 元数据驱动 hydration，静态骨架生成 `reuse-identifier`，reactive effect 与 ref 绑定逻辑 lease 并在 enqueue 时解除。这样既保留 Vue 语义，也符合 Lynx 内存模型。

### 逐 PR 结论

| PR | 问题 | 严重度 | 必要方向 |
| --- | --- | --- | --- |
| #293 | 任意 ops flush 都会重算所有 list 的 diff/LIS，包括无关样式/文本更新。 | P1 | 记录 dirty list ID，只在 list 提交变化时计算。 |
| #293 | 文档在 Vue 有界物化尚未实现前宣称回收使内存恒定。 | P1 | 准确区分原生能力和当前适配器限制。 |
| #307 | 在不透明原生 handle 上使用 DOM 遍历与修改。 | P1 | 使用 PAPI 或 snapshot/template hydration，并测试不透明 handle。 |
| #307 | 缺少 reuse ID 时全部落入同一池；不同结构会丢后代。 | P1 | 生成结构 ID 或只允许显式兼容 ID，并支持结构增删。 |
| #307 | 交换树仍保留每个数据项一棵预创建树。 | P1 | 延迟创建，并限制活跃/池中物化量。 |
| #311 | 删除祖先不会清理后代 list 回调。 | P1 | 递归销毁所有已注册后代 list。 |

还应补充 batch flag（`enableReuseNotification`、`asyncFlush`）、`resetMainThreadState` teardown 顺序、跨 list 移动、重复 key、过期 operation ID、混合形状、嵌套 list，以及生产构建不携带 debug probe 等覆盖。

### 报告迭代记录

- 第 1 轮：提取公开 API、Element PAPI 类型、ReactLynx 行为与 REPL 约定。
- 第 2 轮：把契约映射到 Vue 堆栈，加入框架收益/挑战分析。
- 第 3 轮：运行定向测试与构建，增加两个聚焦回归，用实测结果校正结论，检查样例语法，并统一中英文术语。
- 第 4 轮：实现编译期 blueprint 与旧 PAPI data-source shim，并重新运行本地全量测试、包构建和示例构建。
- 第 5 轮：通过 Lynx DevTool 在 iOS 上运行旧案例与参考 LegendList 的 10k 压力场景，检查原生 DOM 与内存指标，将不合理的重叠 relayout burst 与稳定 benchmark 分开记录，再用实测结果同步更新中英文结论。
