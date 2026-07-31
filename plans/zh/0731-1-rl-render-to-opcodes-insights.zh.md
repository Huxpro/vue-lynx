# 分析：ReactLynx `renderToOpcodes` 对 Vue Lynx 的启示

**日期**：2026-07-31
**状态**：分析（不含代码改动）
**阅读源**：`lynx-family/lynx-stack@main`
`packages/react/runtime/src/snapshot/renderToOpcodes/{index,opcodes,hydrate}.ts`、
`packages/react/runtime/src/snapshot/lifecycle/render.ts`

---

## 1. `renderToOpcodes` 到底是什么

它是 **`preact-render-to-string@6.0.3` 的 fork**（文件头自述），只是 sink 不是字符串
buffer。三个容易被名字误导的事实：

1. **它的主输出是树，不是 opcodes。** `renderToString(vnode, context, into)` 单遍走
   JSX，直接调用 `into.insertBefore(...)` / `instance.setAttribute(...)` 构造
   `SnapshotInstance` —— 它**就是**主线程首屏渲染器。`snapshot/lifecycle/render.ts`
   的 `renderMainThread` 用 `__root` 调它，返回值在非 SSR 构建里直接丢弃。
2. **opcode 数组是 build flag 门控的第二输出。** 每一处 `opcodes.push(...)` 都在
   `if (__ENABLE_SSR__)` 里；纯 IFR 构建中整套 opcode 机制是 dead code。
   **一个渲染器、两种部署**：**IFR**（进程内，产物 = MT 侧 store 树）与
   **SSR**（进程外，产物 = 可搬运的数组）。
3. **它是框架的退化模式，不是框架本身。** 无 diff、无 commit、无调度器、无 effect
   （`options[SKIP_EFFECTS] = true`），`setState`/`forceUpdate` 换成 `markAsDirty`
   （更新静默丢弃，仅为 memo hook 保留 ≤25 次 settle 循环），无 unmount 记账，子树
   完成即 `vnode[CHILDREN] = undefined` 释放内存。而且**元素就是 vnode**：
   `if (vnode.__parent) vnode = new SnapshotInstance(type)` —— 否则 JSX vnode 对象
   *本身*成为 instance，没有逐节点的平行分配。

opcode 编码本身（`opcodes.ts`）是四个码的栈机：

```
Begin [type, __id, elements[]] slotIndex   End   Attr key value   Text [[type,__id,elements],text] slotIndex
```

注意里面**没有**：父 id、anchor、逐节点 element id、结构。父子关系隐含在 Begin/End
嵌套里，位置靠 `slotIndex`，静态骨架根本不编码——它早已作为 Snapshot `create()` 躺在
bundle 里。接收端 `ssrHydrateByOpcodes(opcodes, into, refMap)` 重建 instance 树，并把
每个 instance 绑到 `refMap[ssrID]` 查出的**已存在**元素上。元素身份是**通过外部映射
移植**的，从不靠假设。

## 2. 它落在我们矩阵的哪里 —— 以及我们缺的那一列

`packages/vue-lynx/internal/src/matrix.ts` 有六列（Staging / Naming / Addressing /
Provider / Lifetime / Delivery），六列描述的都是 **`λ holes. tree` 的 residual 怎么
物化**。`renderToOpcodes` 与这六列全部正交：Snapshot `create()` 是 residual 机制
（`GRAPH-ENG-REPORT.md` §1.4 已定位为 Code-Template ≡ 我们的 VDOM JS ET）；
`renderToOpcodes` 是**调用它的驱动器**。

这就是缺的一列：

| **Driver（驱动）** | 谁、以什么形态执行首屏渲染 |
|---|---|
| `bts-runtime` | BG 完整运行时，ops 过线（我们的非 IFR 默认） |
| `mts-runtime` | MT 跑**完整**框架（我们今天的 IFR） |
| `mts-oneshot` | MT 跑裁剪过的单遍渲染器（**RL 的格子**） |
| `server` / `build` | 渲染发生在设备外，产物是可搬运数组 |

以及第二列，正是上面代码真正在讲的事：

| **Handover（交接）** | 两次渲染如何对齐 |
|---|---|
| `replay-compare` | 对录制的 op 流做流等价比较（我们） |
| `tree-adopt` | 树遍历移植 element ref + id swap 表（RL） |

我们整条 `+b` / `+b!` / `+b:c` / `+b:e` 阶梯动的是 *Staging/Delivery*；`+ifr:c` 动的是
ephemeral 副本的 Staging —— 而 b2 sweep 的结论是 **a wash**（`matrix.ts:316-329`：
"create is PAPI-bound, not interpretation-bound"）。这个结果正是本文的意义所在：既然
JS staging 阶梯推不动首屏，剩下的杠杆就在上面这两列——**谁渲染**，以及**多少工作被
白白丢掉**。

## 3. 六条启示（按杠杆大小排序）

### I1 — 在树层而不是流层做 reconcile（其余各条的前置）

`main-thread/src/ifr.ts:241-353` 是把 `recordedOps` 和进来的 BG batch **按顺序逐帧**
比对，任何偏差走 `fallbackToBackground()` —— 整树 teardown + 重放全部缓存的 BG 历史。
**流等价严格强于树等价**：它对 op *顺序*和 flush 粒度敏感，而不只对结果树敏感。
prop 遍历顺序不同、子节点 flush 交错不同、style 排在 class 之前——结果树一模一样，
代价却是整页重建。

RL 的 `hydrate(before, after)`（`renderToOpcodes/hydrate.ts:223`）比的是**树**：移交
`__elements`，逐项 diff `__values`，然后每个 slot 要么走 pairwise-same 快路径，要么走
`diffArrayLepus` + `diffArrayAction`，退化成局部 `__InsertElementBefore` /
`__RemoveElement`。分歧的代价是子树 patch，永远不是整页重建。Vue 自己的 DOM SSR
hydration 也是这个形状（逐节点 adopt、逐子树 bail 到 client render）——我们的流比较，
比 Vue 给自己用的那套还弱。

两级修法，范围都可控：

- **便宜的一半（数天）。** 把帧分成 *structural*（`CREATE`、`CREATE_TEXT`、`INSERT`、
  `REMOVE`、`CLONE_TREE`、`INSTANTIATE_*`）与 *value*（`SET_*`）两类：结构仍需按序匹配，
  value op 在 batch 窗口内按 `(id, key)` 匹配、不看顺序。这一刀砍掉整类"只是顺序不同"
  的 teardown，且零协议成本。
- **真修。** 在 `sealIfrRender()` 时把 `recordedOps` 折成一棵规范树
  （`parentId → 有序 children` + 逐节点 value map），BG batch 与它对齐。这样分歧可定位：
  只移除发散子树的元素、只对该子树套用 BG ops，首屏其余部分保持已绘制。

也要诚实说反方向的取舍：happy path 上我们的 JSON 全等快路径**比** RL 的树遍历更便宜，
而且我们的 BG 完全不知道 IFR 存在（RL 为此付出了 BG 侧 `hydrate` 和 swap 表）。树层
reconcile 会让出一部分这种简洁性。

**为什么它排第一**：后面每一条都在增加"两次渲染不一致"的概率。hydration 的健壮性是
前置条件，不是收益。

### I2 — MT 的驱动器不必是整个框架

我们的 IFR 把 Vue 运行时 + 用户代码打进 MT bundle：hello-world 从 **83 kB → 169 kB**
（`plans/0711-1-ifr-instant-first-frame.md` §Verification）。这是 IFR 的头号负债，而
RL 根本不付：一个单遍递归渲染器 + 本来就在 bundle 里的 Snapshot `create()`。

两种 render model 在这里**并不对称**，这个不对称应该主导排期：

- **Vapor 几乎是白送的。** 编译产物本身就是单遍 creator；要阉的只有
  `renderEffect` → 一次性立即调用（正是 #290 的原型，见 `docs/plans/graph-eng-goal.md`
  §2）。MT bundle 于是只需要编译后的模板 + create/setText/insert 薄壳——没有响应式、
  没有调度器、没有 patch/unmount、没有 Transition/KeepAlive。这就是
  `mts-oneshot × vapor` 格子，是全盘最便宜的实打实收益。
- **VDOM 需要第二个渲染器。** 但我们**不该**像 RL fork preact-render-to-string 那样
  fork runtime-core（见 §4）。Vue 已经把这个退化模式作为维护中的包发出来了：
  `@vue/server-renderer` 单遍、无 effect，其编译产物 `ssrRender(ctx, push)` 收一个
  *sink*。把字符串 sink 换成 ops/PAPI sink，就是 RL 做的同一步，但不用 fork。附带一条：
  `compiler-ssr` 的静态字符串 hoist 与 Code-Template 是同构的想法——被 hoist 的静态
  markup ≡ residual，`push` 的插值 ≡ holes。

可测量为新因子行：`ifrDriver: 'runtime' | 'oneshot'`，对 MT bundle size（已按 flag 记录）
与 FCP 出数。

### I3 — Ephemeral 首屏不该分配一棵持久树

IFR 窗口里 MT 会建一棵完整 `ShadowElement` 树，而 hydration 把它丢掉。RL 完全避免了这
份平行分配（vnode 即 instance），并在子树完成时即时释放。我们的 ephemeral 副本需要的是
**元素**，不是可 patch 的 shadow 树——因为 `finishHydration()` 之后所有权归 BG，它永远
不会被 patch。

在 `+ifr:c` 得出 "a wash" 之后，这是 MT 侧剩下的最大杠杆，而且它**不是 PAPI-bound**：
它是分配与属性写 bound，恰恰是 staging 阶梯碰不到的那部分。ShadowElement 分配数已经是
我们在测的指标，所以这个因子今天就可测。

### I4 — Rollback 应该是组件级，而不是页面级

`runIfrRender()`（`ifr.ts:196-217`）在最外层 catch 并 teardown **整个**首屏；RL 的
`renderMainThread` 外层同样如此——**但** `_renderToString` 额外在**每个组件递归子节点
之前**记录水位（`opcodes.length`、`into.__lastChild`），遇到 thrown promise（Suspense）
时只回滚那棵子树、渲染 fallback，其余部分继续画
（`renderToOpcodes/index.ts:272-320`）。

同一水位思路可直接搬：在组件边界记录 `(recordedOps.length, lastChildOfParent)`，让一个
抛错组件退化成"那棵子树没画"，而不是"整屏空白"。这也是 `defineAsyncComponent` /
`<Suspense>` 的正解——目前 `recordAndApply` 是靠**丢弃** seal 之后的 ops 来防守
（`ifr.ts:145-165`），而 RL 有明确语义：首屏画的就是 fallback。

### I4b — settle 语义必须一致，否则两帧必然分歧

RL 容忍渲染期写 state：最多重渲 25 次（`index.ts:250-258`），静默丢弃更新。我们的做法
是文档上"别这么写" + seal 后丢弃。两种策略都行——但 MT 驱动器和 BG 运行时必须实现**同
一种**；而 MT 驱动器越小（I2），语义漂移的空间越大。这也是 I1 必须排在前面的又一理由。

### I5 — opcode 的形状是 SSR / 预渲染的前置条件

我们录的是 **op 流**：带 id、PAPI 级、位置相关。它只能在 id 计数器处于同一状态的 realm
里重放——这正是设计说明里"id 对齐靠确定性免费获得"的含义
（`plans/0711-1-ifr-instant-first-frame.md` §Design 2）。推论是：我们的录制**永远**不可能
在服务端、构建期或第二个进程里产生。RL 的 opcodes 无 id、栈式编码、只含 holes，身份在
hydration 时由 `refMap[ssrID]` 提供。就是这一个设计选择，让**同一个渲染器**能服务 SSR。

如果我们要 SSR（明确列为未移植）、要 `firstScreenSyncTiming: 'jsReady'` 式的交接前重渲、
或者要容忍合法的非确定性渲染（A/B flag、`Date`、`Math.random`），就需要一层
**id 重映射** —— RL 的 `options.swap`（`hydrate.ts:231-234`）正是它。

而这里有一条给我们 Naming 轴的反向红利：在 **block naming**（`base + indexInAddressed`）
下，swap 表是**按模板实例**而不是按节点的——O(instances) 而非 O(nodes)。
`GRAPH-ENG-REPORT.md` §6 目前说"sparse naming 不是 FCP 特性，收益在 JS 内存/表常数与
使能"。可以加上第三条、站得住且是新的：**block naming 正是让 id 移植（因而 SSR 形状的
hydration）变便宜的那个因素。**

### I6 — 两级 residual 可以复合 → 构建期首屏

RL 保有两个 staged 产物并复合使用：*模板*级 residual（Snapshot `create()`，bundle 交付）
与*页面实例*级线性化（opcodes：只有类型 + slotIndex + 动态值）。我们的 IFR 录制没有这样
复合——`recordedOps` 什么都录，包括注册和逐节点结构，即使在结构早已进 MT bundle 的
`+b!` / `+b:c` 格子里也一样。

把录制缩减为 `(实例化, hole 值)`，就开出一个新格子：对于初始数据在构建期已知的首屏
（外壳、骨架屏、静态头部），opcode 数组可以**烘进 bundle**，以**零 MT JS 渲染**重放——
不执行用户模块、不跑组件 setup、不初始化响应式。这就是预渲染，也是唯一能攻击 staging
阶梯证明攻不动的那部分 FCP 的格子：Driver = `build`，Lifetime = ephemeral。

## 4. 不该照抄的

- **不要 fork。** `renderToOpcodes` 钉死 `preact-render-to-string@6.0.3`，并通过被压缩的
  名字常量（`__c`、`__s`、`DIRTY`、`NEXT_STATE`…）伸手进 Preact 内部，是永久的维护税。
  runtime-core 比 Preact 大得多；VDOM 走 `@vue/server-renderer` 的 sink，Vapor 直接用编译
  产物。零 fork。
- **不要照搬 opcode 格式。** 它是 Snapshot 形状的（SnapshotInstance 类型 + slotIndex +
  `ssrID` 引用）。要学的是它的**性质**——栈式编码、无 id、只含 holes、结构在 bundle——
  而不是编码本身。
- **不要整体照搬 BG 侧 hydration。** "BG 完全不知道 IFR 存在"是真实的架构资产（零协议
  面、单一 hydration 点）。I1 可以全部在 MT 侧完成；只有 I5（SSR / id 移植）才逼出 BG
  侧契约。

## 5. 建议顺序

1. **I1 便宜的一半** —— `ifr.ts` 里 structural/value 分帧，消除"只是顺序不同"的 teardown。
   是其余各条的前置。
2. **I1 真修** —— seal 时折成规范树 + 子树级局部回退。
3. **I2 Vapor `mts-oneshot`** —— 一次性 `renderEffect` 的 MT 驱动器；以新因子行
   `ifrDriver` 出 MT bundle size + FCP。
4. **I3** —— ephemeral 首屏跳过 ShadowElement 树；报分配数 + FCP。
5. **I4** —— 组件级 rollback 水位；顺带定义首屏的 Suspense/async 语义。
6. **I2 VDOM `mts-oneshot`** —— 给 `@vue/server-renderer` 接 ops sink。
7. **I5/I6** —— 无 id 录制 + swap 表；解锁 `build` driver 格子（预渲染首屏），进而是真 SSR。

第 3–6 步全部是 *Driver* 列的动作。我们自己的数据已经说明 Staging 列对首屏见底
（`+ifr:c` = a wash）；剩下的 FCP 在这一列里。
