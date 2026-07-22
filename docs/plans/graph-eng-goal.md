# GOAL — Element-Template 统一形式化、全排列基准、直至 Engine ET

> One-shot goal doc. 自包含：无需前置对话即可执行。
> 开发分支 `claude/vapor-element-template-optimization-imxlm1`，PR base → `vapor`。
> 用 issue 记录每个里程碑的设计与验收（见 §7）。

## 0. 使命

把本条线（element templates / addressing / sparse / native ET / IFR）**一路实现到 Engine ET**，用一套**第一性术语**统一命名，通过 **flag 排列组合**在 unified benchmark 上量化 **create/update** 每个 cell，并**分解出每个 factor 的性能贡献**，最后形成技术报告。

零回归、诚实标注 stub、每条优化都有 fail-safe 回退。

## 1. Ground truth：第一性形式化（代码与报告的唯一术语）

一棵有动态部分的 UI 子树 = 函数 **`λ holes. tree`**。编译器做 partial evaluation：静态部分折成 residual（骨架），动态部分留成参数（holes）。四根正交轴：

| 轴 | 含义 | levels |
|---|---|---|
| **A. Staging（绑定时机）** | residual 以什么形态存在 | `OpStream`(逐指令) → `Data`(惰性 AST + 通用解释器) → `Code`(编译的专属闭包，无解释器) → `Engine`(宿主常驻、native clone) |
| **B. Naming（跨界身份集）** | 哪些子项被 let-命名以便跨线程改 | `Dense`(全命名) / `Sparse`(只命名 holes = 自由变量/突变前沿) |
| **C. Provenance（洞从哪来）** | 自由变量集怎么得知 | `Intrinsic`(自描述 render/vnode 点名) / `Recovered`(编译期分析找回) / `—`(dense 不适用) |
| **D. Deployment（线程 × 寿命）** | reducer/store 是否分离、这份物化是本体还是抢跑副本 | `Split`(BG=reducer/MT=store) vs `Fused`；`Durable`(本体) vs `Ephemeral`(IFR 抢跑副本) |

**Data vs Code**：Data = 惰性 AST + 一个通用解释器（`materialize = interp(⟨tree⟩, holes)`，所有模板共用一个解释器）；Code = 编译器为每个模板吐出的专属函数（`materialize = create(holes)`，无解释）。二者是同一 residual 的两种 staging，**Code = 把解释器对该模板偏特化后的产物（第一 Futamura projection）**。阶梯 `Data → Code → Engine` = 逐层把运行时工作编译掉：先干掉 JS 解释、再干掉 JS 本身。

**术语约定（代码与报告统一）**：
- **Named Tree**（dense）／**Template**（sparse）。
- Template 按 staging 修饰：**Data-Template / Code-Template / Engine-Template**。
- Provenance：`intrinsic | recovered`；Deployment：`durable | ephemeral`、`split | fused`。
- `disposable` **不是机制名**，是轴 D 的取值（ephemeral）。

**落位表（现状 → 术语）**：

| 现状 | A/B/C/D | 术语 |
|---|---|---|
| VDOM ops | OpStream / Dense / intrinsic / Split·Durable | Op Stream |
| VDOM Block（openBlock/patchFlag） | —（intrinsic sparse 的 provenance 源，非物化机制） | — |
| Vapor A1 (dense CLONE_TREE) | Data / Dense / — / Split·Durable | **Named Tree** |
| Vapor A2 (#309) | Data / Sparse / recovered / Split·Durable | **recovered Data-Template** |
| VDOM JS ET (INSTANTIATE_TEMPLATE) | Code / Sparse / intrinsic / Split·Durable或Ephemeral(IFR) | **intrinsic Code-Template** |
| ReactLynx Snapshot | Code / Sparse / intrinsic / Split·Durable | **intrinsic Code-Template**（≡ JS ET，差 deployment） |
| Native ET (`__CreateElementTemplate`) | Engine / Sparse / intrinsic(slots) / Split·Durable | **Engine-Template** |
| Vapor-Web cloneNode | Engine / Sparse / navigated / Fused·Durable | 浏览器 Engine-Template |

**三条硬结论**（须体现在报告）：RL Snapshot ≡ VDOM JS ET（同坐标，差 deployment）；Sparse Tree/JS ET/Snapshot/Native ET 是同族，只差 staging；Vapor-Web `cloneNode` 早是 Engine-Template，Lynx 因 Split 拓扑被迫先走 Data，Native ET 是在 Split 下把 staging 推回 Engine。

## 2. 现有基建映射（复用，勿重造）

已在 `vapor`（已验证）：
- **#304** `plugin/src/compiler/vapor-addressing.ts` — `__vlxAddressing`（holes/addressed/slotCount）= recovered provenance。
- **#308** element slots — `INSERT/REMOVE_TEMPLATE_SLOT` (ops 18/19)，`main-thread/src/element-templates.ts` slot 绑定。
- **#309** Vapor sparse A2 — `internal/src/ops.ts`（`REGISTER_TREE addressedOr0`、ops 15–19）、`runtime/src/shadow-element.ts`（`buildShadowCloneSparse`、稀疏 uid=`base+indexInAddressed`）、`main-thread/src/ops-apply.ts`（`instantiateTemplateSparse`）。
- IFR：`main-thread/src/ifr.ts`、`entry-ifr.ts`。
- 基准 harness：`packages/ifr-bench/`（`sfc-probe/build-matrix.mjs`、`UNIFIED-RERUN.md`）、`packages/benchmark/apps/{ui-vapor,ui-vdom}`。

需并入的（见 §6 前置）：
- **#313**（矩阵基建：`enableSparseNaming` kill-switch、prod `__vlxAddressing` script-loader stamp、sfc-probe dense/sparse cells、microbench、`GRAPH-ENG-MATRIX.md`）——**报告/命名视为 provisional，M0 改写为四轴词汇**。
- **#290**（参考实现，勿整体 merge）：IFR-paint 层（`__VUE_LYNX_VAPOR_IFR_ET__`、one-shot renderEffect、paint-registry densify）+ unified sfc-probe/x1/x4 harness + 已测结论（dense-IFR ×4 +13% → sparse+ET +1%）。

## 3. 交付物（对应四个目标）

1. **实现直至 Engine ET**：Data-Template（已有）→ Code-Template（Vapor，可选）→ Engine-Template（native `__CreateElementTemplate`，flag+引擎探测，缺失则 stub 并记录）+ IFR ephemeral 部署集成（compiler-direct 方向）。
2. **全排列可跑**：四轴 flag 化，unified benchmark 跑 create/update 每个合法 cell，因子分解出每轴主效应。
3. **术语落地**：代码关键定义按 §1 术语重命名。
4. **技术报告**：形式化 + 矩阵数据 + 每因子结论 + RL 定位与反向 inspiration。

## 4. 里程碑（顺序 + 验收）

### M0 — 术语落地 & flag 规范化
- 把 §1 术语实现进代码关键定义：flag `enableSparseNaming` → `templateNaming: 'dense'|'sparse'`；cell/arch id、`GRAPH-ENG-MATRIX.md` 全改四轴词汇（Named Tree / Data|Code|Engine-Template / intrinsic|recovered / durable|ephemeral）。核心符号加 doc 注释标注四轴坐标（`cloneTemplatePrototype`、`buildShadowCloneSparse`、`REGISTER_TREE`、`INSTANTIATE_TEMPLATE`、`instantiateTemplateSparse`）。
- **验收**：旧机制词（"dense tree"/"JS ET"/"disposable" 作机制名）清零或注为别名；报告含一张「术语 ↔ 文件/符号」索引表。

### M1 — 守卫加固（合并闸，来自 review）
- #304：`vapor-addressing.ts` 的 `isTextLike` fold 对齐 runtime 的"仅 `#text`"（注释/动态插值别多折）；发**逐 slot tag 指纹**。
- #309：`shadow-element.ts` 的 `isValidAddressing` 从 `slotCount` 弱校验升级为**逐 slot tag 指纹校验**，不一致 fail-safe 回退 dense；跑绿 `pnpm --filter vue-lynx-upstream-tests test:dom`；加 **BG uid 集 == MT named 集** 的结构随机 parity 测试；补 v-if/v-for 注释锚点顺序用例。
- **验收**：parity 与 `test:dom` 绿；构造同-count 结构偏移用例证明会安全回退 dense。

### M2 — flag 矩阵完整（四轴可切）
- 轴 A staging：`templateStaging: 'opstream'|'data'|'code'|'engine'`。
- 轴 B naming：`templateNaming: 'dense'|'sparse'`（#313 基础）。
- 轴 C provenance：随 render model 隐含（VDOM=intrinsic、Vapor=recovered），作 cell 标签记录。
- 轴 D deployment：`ifr: on|off` × `ifrPaint: 'plain'|'disposable-et'|'engine-et'`。
- **验收**：单一配置对象生成所有 §6 合法 cell；每个 flag 默认值 = 现产品行为（零回归）。

### M3 — 沿 staging 阶梯实现到 Engine ET
- **M3a Code-Template for Vapor（可选，推荐）**：编译器把 Vapor 模板 baked 成 MT `create()`（Data→Code），复用 #304 recovered holes。成本高可跳过并在报告注明。
- **M3b Engine-Template（Native ET）**：引擎 `__CreateElementTemplate` 家族探测 + `templateStaging:'engine'` 发射（VDOM/Vapor 共用 descriptor：序列化模板 + attrSlot/elementSlot 索引）。**引擎 PAPI 不可用则该 cell 标 stub 并在报告说明**，不阻塞其余。
- **M3c IFR ephemeral 部署（salvage #290）**：把 IFR-paint 层接到 #309 稀疏契约上；核心 = **让 IFR hydration 认稀疏 uid 块**（`ifr.ts` 的 `recordedOps`/`interceptPatchUpdate` 是否假设 dense 连续 uid，若是则按稀疏契约 densify）。指向 compiler-direct IFR（MT 用 Code/Engine-Template + 初始值建首屏，不在 MT 跑整份 runtime）。
- **验收**：每个 staging 值在至少一个 render model 上画出正确树并通过 IFR 套件；Engine cell 要么真跑要么显式 stub。

### M4 — Unified benchmark：全 cell × create/update + 因子分解
- 复用 `packages/ifr-bench` 的 sfc-probe/x1/x4，跑 §6 每个合法 cell，两场景 **create（挂载）/ update（打洞）**，指标：FCP、op 数、native 调用数、`elements` 表大小、ShadowElement 分配数、bundle 大小。
- **因子设计**：单轴变动的 factorial 设计（从 baseline 每次只动一根轴），使每轴主效应可分解（marginal Δ）。至少覆盖 naming、staging、ifr、ifrPaint、render 五轴。
- **验收**：per-cell 表 + **per-factor 主效应表**；复现 #290 的 "dense-IFR ×4 +13% → sparse+ET +1%"。

### M5 — 技术报告
- `packages/ifr-bench/` 下一份报告：§1 形式化（λ + 四轴 + Data/Code/Engine + Futamura）、落位表、术语↔代码索引、M4 数据、每因子结论、RL 定位（Snapshot ≡ intrinsic Code-Template；Snapshot→Native ET = 我们 Data/Code→Engine）、反向 inspiration（dense→sparse 的 recovered-provenance 方法 + 统一矩阵是 RL 没有的）、create 受益于 ET / update 不受益 的验证。
- **验收**：可独立读懂；每条性能结论有 M4 数据支撑；非-claim 明确（Engine stub、sparse 仍建全量 native 骨架故非 FCP-win 的地方）。

## 5. 守卫 & 非目标
- **零回归**：所有 flag 默认 = 现产品行为；稀疏/native 均有 fail-safe 回退。
- **诚实标注**：任何未真跑的 cell（尤其 Engine）标 stub，不得伪造收益。
- **非目标**：不把 update 也模板化（ET 收益在 create）；不整体合并 #290 分支；不动与本线无关的产品行为。

## 6. 合法 cell 集（矩阵）

以 `render × naming × staging × ifr × ifrPaint` 生成，剪掉无意义组合。至少含：
- VDOM：`ops`(dense) ｜ `ops+IFR{plain|disposable-et|engine-et}` ｜ **`code-template`(JS ET) no-IFR**（create 受益格）。
- Vapor：`named-tree`(dense) ｜ `named-tree+IFR{plain|disposable-et}` ｜ **`data-template`(sparse) no-IFR**（=A1→A2 本体） ｜ `data-template+IFR{self|engine-et}` ｜（可选）`code-template`、`engine-et`。
- 每 cell 打四轴坐标标签，报告按坐标而非实现名索引。

## 7. Issue 计划（checkpoints，见 GitHub #296–#301 及新建 GE-M*）
- GE-M0 术语落地（依赖 #313 并入 vapor）
- GE-M1 守卫加固（#304 tag 指纹 + #309 parity/test:dom）— 合并闸
- GE-M3b Engine-Template（Native ET，引擎 PAPI 探测）= #299/#300 重写
- GE-M3c Vapor IFR × 稀疏 paint 集成（salvage #290；核心 = IFR hydration 认稀疏 uid）
- GE-M4 全 cell create/update 基准 + 因子分解（扩 #301）
- GE-M5 技术报告

## 8. 前置状态（执行前确认）
- base = `vapor`，含 #304/#308/#309（已验证）。
- **#313 必须并入 `vapor`**（其 PR base 曾是 stack 分支）；若 `enableSparseNaming` / `GRAPH-ENG-MATRIX.md` 不在 `vapor` 树上，先把 #313 落到 `vapor` 再执行 M0。
- 引擎 `__CreateElementTemplate` 家族可用性未知 → M3b 以"探测 + stub 回退"实现，不作硬前提。
