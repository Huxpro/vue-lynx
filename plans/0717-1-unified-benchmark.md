# Unified benchmark体系: 重构、分析、AT-SCALE 重新验证

**Date**: 2026-07-17
**Branch**: `huxcc/funny-clarke-0p6zny`
**Status**: design (phase 0)

## 0. 动机

今天有三套彼此独立的 benchmark，它们不是三个重复的 benchmark，而是**被切成三块的同一个测量矩阵**——每块只覆盖了完整变量空间的一个投影，坐标轴还互不对齐：

| system | 主轴 | workload | 环境 | 指标 | scale |
|---|---|---|---|---|---|
| `packages/ifr-bench` | IFR off/ifr/ifr-et × {VDOM,Vapor} | 3 合成场景 + 生成 content-SFC + 24 example | Node counting-stub / jsdom 双 realm / Lynx-for-Web / 纯 web | FCP, settled, bundle(web/MT/BG gz), ops bytes, α | 200–1400 el；1004 el；1k→30k **cards** |
| `packages/benchmark` | framework(react×3/vdom/vapor) × env(Lynx-Web/纯DOM) | krausest 表格 | Lynx-for-Web / 纯 DOM | bg/e2e, 逐 op 延迟, storms, startup, mem, bundle, α, Lynx-tax | 固定 1k/10k **行**；storms 1k→30k **行** |
| `website/bench-playground` | 复用 benchmark 的 5 个 bundle | 同上 | Lynx-for-Web | 单次 tap→settled | 无 N 控制 |

三个诉求，逐条对应：

1. **重复建设** — 见 §2。
2. **覆盖缺口** — 见 §3。
3. **不在一个 scale 上** — 见 §4（含一个会误导人的真 bug）。

目标：**一套 benchmark 体系，测出所有变种的所有数据，同一 scale（以元素计），可切换环境（裸跑 / Lynx for Web / 纯 DOM），并在此标尺上 AT SCALE 重新验证所有已发表的数据假设。**

## 1. 完整变量空间（矩阵定义）

正交轴：

- **renderer**: `vdom` | `vapor`
- **ifr**: `off` | `ifr` | `ifr-et`（Vapor 无 ET → 仅 `off` | `ifr`）
- **framework**: `vue`（renderer 决定 vdom/vapor）| `reactlynx`（`react` | `react-naive` | `react-compiler`）
- **environment**: `lynx-web`（真浏览器 Lynx for Web）| `plain-dom`（非 Lynx 单线程参照）| `node-stub`（counting-stub，仅框架 JS 成本）| `jsdom-realm`（双 realm，首帧时间线分解）
- **workload**: `table`（krausest）| `content`（生成 SFC）| `examples`（真实 app）
- **N**: 以**元素**为单位统一（见 §4）
- **cpu**: `x1` | `x4`（浏览器 CDP throttle）

产品配置单元（build cell），声明式唯一来源，取代现有 3 处硬编码的 `off/ifr/ifr-et`：

```
VDOM:  {off, ifr, ifr-et}
Vapor: {off, ifr}
React: {react, react-naive, react-compiler}   # 无 IFR 维度 (ReactLynx 架构自带)
```

## 2. 重复建设清单（要消除的）

| 重复项 | 现状（分散在） | 归并到 |
|---|---|---|
| page-side DOM 工具（穿透 shadow 遍历、`arm/until/settle`、FCP 探测） | `cross.mjs` BENCH_HTML、`cold-select-probe.mjs`、`web-baseline.mjs`、ifr-bench `web-harness/index.html` | `core/driver.js`（一份，FCP 定义统一） |
| `stats()/aggregate()`（min/max/median/ci95） | `run.mjs`、`cross.mjs`、`web-baseline.mjs`、ifr-bench `harness.mjs` | `core/stats.js` |
| 数据生成器 | `shared/data.ts`(ref)、`ui-react/data.ts`(string)、`web-baseline/shared.js` | `core/data.js`（单一词表，label 策略参数化 ref/string） |
| Vapor SFC 生成 | `build.mjs` marker 替换、web esbuild `@vue/compiler-sfc` 插件、sfc-probe env flag | `core/matrix.js` 驱动的构建配置 |
| scale sweep（1k→30k） | `cross.mjs STORM_SIZES` + `sfc-probe SCALES`（零共享、workload 不同） | `core/scale.js`（同一 N-in-elements 轴） |
| `lynx.profile` 中和 patch | `cross.mjs` + playground 各写一份 | `core/neutralize.js` |
| α 拟合、gzip sizing | `report-table.mjs` + ifr `report-scale-trends.mjs` | `core/stats.js` / `core/bundle.js` |
| FCP 定义 | ifr = `<lynx-view>`插入→≥5 Lynx 元素；benchmark = attach→特定文字 | 统一：attach → 首个 ≥K content 元素帧（可配 predicate） |

## 3. 覆盖缺口（矩阵里从没被交叉的格子）

- **IFR × 跨框架 从未相交**。ifr-bench 只在 Vue(VDOM/Vapor) 上扫 IFR，React 仅一个 rl-probe 对照；`packages/benchmark` 比框架时 IFR 锁死为单一配置。→ "React vs Vapor(off/ifr/ifr-et)，同一 workload" 空白。
- **IFR 对交互/更新延迟的影响未测**。ifr-bench 只测首帧；benchmark 只在固定 IFR 下测更新。"开 ET 后 update10th 变快/变慢" 无数据。
- **首帧与交互测在不同 workload 上**（content-SFC vs krausest）→ 两数字无法归到同一屏幕。
- **Vapor 的 IFR/ET 在 krausest workload 上**、**跨框架 FCP 在 IFR 维度上** — 缺。

统一后要新覆盖的最小格子集合（§5 Phase 4 排期）：
- `table` workload 上跑 {VDOM,Vapor}×{off,ifr,ifr-et} 的首帧 + 逐 op 延迟（同一屏幕关联首帧与交互）。
- `content` workload 上跑 React 三变体的首帧（补 IFR×跨框架的对照缺口）。

## 4. Scale / 指标不可比（要 challenge 的假设）

**核心问题：N 轴单位不一致，跨系统并排即失真。**

- ifr-bench `SIZE_N = 4 + nCards*8 = 1004/3004/…/30004`（单位：**元素**）。
- `packages/benchmark` `STORM_SIZES` 的 `1k→30k` 单位是**行**，每行 ~4–5 元素 → "1k" 实际 ~5000 元素。
- 两图 x 轴都写 "1k→30k"，量的不是一回事。各自内部自洽，一旦对比 α 曲线就是**直接错误**。
- **修复**: 统一 harness 一律以元素计 N（`core/scale.js` 暴露 `elementsToRows()`/`elementsToCards()`），report 的 x 轴标注 "elements (N)"，行/卡数作为次要注解。

**三种时间学给"同一次渲染"三个数量级**：counting-stub ms（仅框架 JS）/ jsdom 双 realm ms / 真浏览器 FCP ms。已发表文档里 campaign 1 的 0.74ms 与 campaign 3 的 75ms 是不同宇宙的毫秒，仅靠散文解释。
- **修复**: 每个指标记录带 `env` 标签，report 永不跨 env 混排一条曲线；同一 env 内才比。counting-stub 只作"框架 JS 成本"专列，明确非 wall-clock。

**FCP 定义各家不同** → 统一为单一 `core/driver.js` 定义，所有 env 复用。

## 5. 统一设计 + 分阶段执行

落地位置：**就地重构 `packages/benchmark`** 成统一体系（保留 git 历史与 results 血缘），`ifr-bench` 的 strategy microbench 作为 `env: node-stub` 的一个 workload 并入；旧 `ifr-bench` 结果目录暂留，迁移完成后归档。

目录（`packages/benchmark`）：

```
core/
  data.js         # 单一数据生成器 (label: ref|string)
  driver.js       # page-side toolkit: 穿透 shadow, arm/until/settle, 统一 FCP
  stats.js        # median/ci95/geomean/α-fit
  bundle.js       # raw+gzip sizing (web/MT/BG section)
  neutralize.js   # lynx.profile 中和
  scale.js        # N-in-elements ↔ rows/cards, SCALE ladder
  matrix.js       # 声明式 variant matrix → build configs (唯一 off/ifr/ifr-et 来源)
workloads/
  table.js        # krausest, 参数化 N(elements)
  content.js      # 生成 SFC (并入 sfc-probe/generate)
  examples.js     # 真实 app 清单
env/
  lynx-web.js     # 真浏览器 Lynx for Web (playwright + web-core)
  plain-dom.js    # 非 Lynx 单线程参照
  node-stub.js    # counting-stub (并入 ifr-bench src/harness)
  jsdom-realm.js  # 双 realm 首帧分解 (并入 ifr-bench examples-sweep/measure-run)
harness/run.js    # 统一编排: 读 matrix × workload × env × N × cpu → results
report/           # 统一 results schema + 一个 HTML 生成器 (playground + scale-trends 都读它)
```

**统一 metric schema**（每 cell 产出，缺项留空）：
```jsonc
{
  "env": "lynx-web", "cpu": "x1",
  "framework": "vue", "renderer": "vapor", "ifr": "ifr",
  "workload": "table", "N_elements": 5000, "N_rows": 1000,
  "fcp": 78.4, "settled": 95.2,                     // ms, median
  "ops": { "create1k": {"bg":.., "e2e":.., "latency":.., "opsCount":.., "bytes":..}, ... },
  "storms": { "updateStorm@N": .., "selectStorm@N": .. },
  "bundle": { "webGz":.., "mtGz":.., "bgGz":.. },
  "mem": { "mounted":.., "after10k":.., "afterClear":.. },
  "alpha": { "fcp":.., "webGz":.. },
  "meta": { "runs":.., "ci95":.., "git":"..", "host":".." }
}
```

### Phase 0 — 设计文档（本文件）✅
### Phase 1 — shared core（`core/*`）: 抽取去重，small-N smoke 验证数值与旧 harness 吻合。
### Phase 2 — env backends（`env/*`）: 4 后端同 schema 产出；先 `lynx-web` + `plain-dom`，再并 `node-stub` + `jsdom-realm`。
### Phase 3 — results schema + report generator: playground 与 scale-trends 改读统一产物。
### Phase 4 — AT SCALE 重跑 + 重新验证。

## 6. 重新验证清单（challenge 哪些 headline）

在统一元素轴、按 env 分列上重跑，逐条压这些已发表结论并记录 pass/adjust/refute：

| # | 已发表假设 | 出处 | 重验方式 |
|---|---|---|---|
| A | IFR 首帧 −19%（1×，content 1k） | UNIFIED-RERUN §2 | lynx-web x1, content, VDOM off vs ifr |
| B | "ET 是 scale hedge"：IFR-无-ET α=0.80（10k 起反超 plain VDOM），ET α=0.72 | UNIFIED-RERUN §4 | lynx-web x1/x4, content, 元素轴 1k→30k, 5 arch |
| C | IFR 无 ET 在 30k MT 栈溢出回退 BG | UNIFIED-RERUN §4 | 复现并记录 |
| D | Vapor update **5.8–9.8× bg / 2.1–6.3× e2e**，create 打平 | benchmark-vapor.mdx | lynx-web, table, VDOM vs Vapor, bg/e2e |
| E | 跨线程 ops **−59%** / JSON bytes **−51%** | benchmark-vapor.mdx | ops schema 直接读 |
| F | selectStorm Vapor 在 10k **~7×**、30k **~8×** vs VDOM；vs React **~20×+** | cross-storms-latest | lynx-web storms, 元素轴 |
| G | create 路径 e2e parity（vapor 0.87–1.13×） | benchmark-vapor.mdx | lynx-web, table create |
| H | Vapor bundle gzip **+26%** | benchmark-vapor.mdx | bundle.js |
| I | "Lynx tax"（Lynx ÷ 纯 DOM per framework） | report-table.mjs | lynx-web vs plain-dom 同 workload |
| J | 首帧与交互能否归到同一屏幕（新覆盖） | §3 gap | table workload 同时测 fcp + 逐 op |

产出：`results/unified-*.json` + 一个 report HTML，website 文档数字按统一轴改写；每条假设标注 **重验结论**。

## 7. 风险 / 注意

- rspeedy 构建慢 + 磁盘配额有限：scale sweep 分批构建，构建产物用完即删（AGENTS.md 缓存陷阱：跨 cell 清 `node_modules/.cache` + `dist`）。
- `--stack-size=65536`：大 N content SFC 需要（sfc-probe 已知）。
- x4 scale run 历史只到 10k；统一后目标补到 30k（视时间/资源）。
- 迁移期保留旧 harness 与 results，直到统一产物交叉核对通过，再删除/归档。
