# 方案：基于 Layer 的主线程架构

## 背景

**问题**: Vue Lynx 当前的主线程架构有两个根本性局限：

1. **所有 entry 共享同一个 MT bundle**: `VueMainThreadPlugin` 通过 `fs.readFileSync` 读取一个预构建的 flat bundle（`main-thread-bundled.js`），追加来自 globalThis Map 的所有 worklet 注册，然后将所有 entry 的 `main-thread.js` 资产替换为相同内容。多 entry 应用（如含 6 个 entry 的 gallery）会得到包含所有 entry 注册的相同 MT bundle。

2. **globalThis Map hack**: `worklet-registry.ts` 使用 `globalThis.__vue_worklet_lepus_registrations__` 作为 BG worklet-loader（写入方）和 `VueMainThreadPlugin`（读取方）之间的共享通道。这种方式脆弱，破坏了模块隔离，是问题 1 的根本原因。

**根本原因**: MT entry 只导入引导代码（`vue-lynx/main-thread`），不导入用户代码。Webpack 无法感知每个 entry 的 worklet 依赖，所以所有注册被汇集在一起。

**React Lynx 的做法**: BG 和 MT 层都导入相同的用户代码。webpack `issuerLayer` 按层将文件路由到不同的 loader（BG: `worklet.target: 'JS'`，MT: `worklet.target: 'LEPUS'`）。webpack 的依赖图天然地将每个 entry 限定在自己的注册范围内。

**目标**: 采用 React 的基于 layer 的方案 -- 两个层都导入用户代码，MT 专用 loader 仅提取 worklet 注册，webpack 自然处理每个 entry 的隔离。

## 架构概览

```
当前:                                       目标:

BG entry: [entry-bg, ...user-imports]       BG entry: [entry-bg, ...user-imports]  (不变)
MT entry: [entry-main]  <- 仅引导代码        MT entry: [entry-main, ...user-imports] <- 包含用户代码

BG: vue-loader + worklet-loader(JS+LEPUS)   BG: vue-loader + worklet-loader(仅 JS)
MT: VueMainThreadPlugin 替换资产            MT: sfc-script-extractor(.vue) + worklet-loader-mt(LEPUS)

注册: globalThis Map (共享)                 注册: webpack 模块 (按 entry 隔离)
```

## 详细架构图

### 旧 Vue 架构（flat bundle 替换）

"Flat bundle"是指 `vue-lynx/main-thread` 通过 rslib 预编译成的一个自包含 JS 文件
（`main-thread-bundled.js`）。它把 `entry-main.ts` + `ops-apply.ts` + `element-registry.ts`
等所有主线程代码打包成一坨纯 JS -- 没有 webpack `__webpack_require__`，没有 module wrapper。
`VueMainThreadPlugin` 在 webpack 编译阶段用 `fs.readFileSync()` 读这个文件，拼接 worklet
注册代码后用 `new RawSource(combined)` 整体替换 webpack 生成的 `main-thread.js` 产物。
Webpack 自己的 MT 编译结果被直接丢弃。

```
rslib 预构建（独立于 webpack）:
  entry-main.ts --- rslib bundle --> main-thread-bundled.js
  ops-apply.ts  ---+                 (自包含, ~5kB flat JS)
                                        |
                                        | fs.readFileSync()
                                        v
+------------------ webpack / rspack ----------------------------+
|                                                                |
|  BG entry: [entry-bg, App.vue, ...]                            |
|    +- worklet-loader (JS pass + LEPUS pass)                    |
|         |                                                      |
|         +- JS 输出 --> background.js（正常 BG bundle）          |
|         |                                                      |
|         +- LEPUS 输出 --> globalThis.__vue_worklet_...          |
|                              (所有 entry 的注册混在一起    共享 Map|
|                               )                                |
|                                                                |
|  MT entry: [entry-main]   <- 仅引导代码，无用户代码              |
|    +- webpack 正常编译 --> main-thread.js                       |
|         |                                                      |
|         +- VueMainThreadPlugin:                                |
|              1. 读取 flat bundle                               |
|              2. 从 globalThis Map 获取所有注册                  |
|              3. 拼接，用 RawSource 替换 webpack 产物   <- 丢弃  |
|              4. 标记 'lynx:main-thread': true                  |
|                                                                |
|  问题:                                                          |
|  +----------------------------------------------+             |
|  | entry-A 的 MT bundle == entry-B 的 MT bundle   |             |
|  | (所有 entry 共享同一份 flat bundle +            |             |
|  |  全部注册)                                     |             |
|  +----------------------------------------------+             |
+----------------------------------------------------------------+
```

### 新 Vue 架构（基于 layer）

```
+------------------ webpack / rspack ----------------------------+
|                                                                |
|  BG entry: [entry-bg, App.vue, ...]  layer: vue:background     |
|    |                                                           |
|    +- vue-loader --> template + style + script 正常编译         |
|    +- worklet-loader (仅 JS pass，不再做 LEPUS)                 |
|         +--> background.js                                     |
|                                                                |
|  MT entry: [entry-main, App.vue, ...]  layer: vue:main-thread  |
|    |         ^ 同样的用户代码                                    |
|    |                                                           |
|    +- .vue 文件:                                                |
|    |    vue-sfc-script-extractor（正则提取 <script>）            |
|    |    +- worklet-loader-mt (LEPUS pass)                       |
|    |       +- 有 'main thread' 指令? ->                        |
|    |          registerWorkletInternal()                         |
|    |       +- 没有?                  -> ''（空模块）             |
|    |                                                           |
|    +- .js/.ts 文件:                                             |
|    |    worklet-loader-mt（同上逻辑）                            |
|    |                                                           |
|    +- bootstrap 包 (entry-main.ts, ops-apply.ts):              |
|    |    排除 MT loader -> 原样通过，正常执行                     |
|    |                                                           |
|    +--> main-thread.js（webpack 正常编译，                      |
|         有 module wrapper）                                    |
|                                                                |
|  VueMarkMainThreadPlugin:                                      |
|    1. 强制 RuntimeGlobals.startup                              |
|       （修复 chunkLoading: 'lynx'）                             |
|    2. 标记 'lynx:main-thread': true                            |
|                                                                |
|  优势:                                                          |
|  +----------------------------------------------+             |
|  | entry-A 的 MT bundle 只含 entry-A 的           |             |
|  |   worklet 注册                                |             |
|  | entry-B 的 MT bundle 只含 entry-B 的           |             |
|  |   worklet 注册                                |             |
|  | webpack 依赖图自动隔离，无需 globalThis hack    |             |
|  +----------------------------------------------+             |
+----------------------------------------------------------------+
```

### React Lynx 架构（参考）

```
+------------------ webpack / rspack ----------------------------+
|                                                                |
|  BG entry: [entry-bg, App.tsx, ...]  layer: react:background   |
|    |                                                           |
|    +- worklet-loader (JS pass)                                 |
|       +- 'main thread' 函数 -> 替换为 context 对象              |
|          (函数体发送到 MT，BG 只保留                             |
|           sign/调用接口)                                        |
|       +--> background.js（React runtime + vDOM diffing）        |
|                                                                |
|  MT entry: [snapshot-entry, App.tsx, ...]                      |
|    |         ^ 同样的用户代码       layer: react:main-thread    |
|    |                                                           |
|    +- SWC snapshot 编译:                                        |
|    |    JSX -> 直接 PAPI 调用（编译时生成）                       |
|    |    <view style={{color:'red'}}>                            |
|    |      -> __CreateView(0,0); __SetInlineStyle(el,'color:red')|
|    |    整个组件树编译为命令式 PAPI 代码                           |
|    |                                                           |
|    +- worklet-loader (LEPUS pass)                              |
|    |    -> registerWorkletInternal() 注册                       |
|    |                                                           |
|    +--> main-thread.js                                         |
|         包含: snapshot 代码 + worklet 注册                      |
|         MT 首屏由 snapshot 直接创建（无需等 BG）                  |
|                                                                |
|  关键区别:                                                      |
|  +----------------------------------------------+             |
|  | React MT = snapshot 编译                       |             |
|  |   (JSX -> PAPI) + worklets                    |             |
|  | Vue   MT = 仅 worklets（无 snapshot             |             |
|  |   编译）                                       |             |
|  |                                               |             |
|  | React 首屏: MT snapshot 直接渲染                |             |
|  |   -> BG hydrate                               |             |
|  | Vue   首屏: MT 只建空 page -> BG 渲染            |             |
|  |   -> ops -> MT 执行                            |             |
|  +----------------------------------------------+             |
+----------------------------------------------------------------+
```

## 关键文件

| 文件                                                                  | 操作                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/vue/rspeedy-plugin/src/entry.ts`                            | 重大重构：entry 拆分 + 移除 VueMainThreadPlugin              |
| `packages/vue/rspeedy-plugin/src/loaders/worklet-loader.ts`           | 简化：移除 LEPUS pass                                        |
| `packages/vue/rspeedy-plugin/src/loaders/worklet-loader-mt.ts`        | **新建**: MT 仅 LEPUS 的 loader                              |
| `packages/vue/rspeedy-plugin/src/loaders/vue-sfc-script-extractor.ts` | **新建**: 从 .vue 为 MT 提取 `<script>`                      |
| `packages/vue/rspeedy-plugin/src/worklet-registry.ts`                 | **删除**                                                     |
| `packages/vue/rspeedy-plugin/src/index.ts`                            | 更新：通过 extractor 允许 MT 处理 .vue                        |
| `packages/vue/main-thread/rslib.config.ts`                            | 移除 flat-bundle 构建配置                                     |

## 实现步骤

### 步骤 1: 创建 `worklet-loader-mt.ts`

新 loader 应用于 MT 层的 `.js/.ts` 文件。仅做 LEPUS pass：

```typescript
// packages/vue/rspeedy-plugin/src/loaders/worklet-loader-mt.ts
export default function workletLoaderMT(
  this: LoaderContext,
  source: string,
): string {
  if (
    !source.includes('\'main thread\'') && !source.includes('"main thread"')
  ) {
    return ''; // 无 worklet -> 空模块（被 tree-shake 掉）
  }

  const lepusResult = transformReactLynxSync(source, {
    ...sharedOpts,
    worklet: { target: 'LEPUS', filename, runtimePkg: 'vue-lynx' },
  });

  // 仅返回 registerWorkletInternal(...) 调用（从 LEPUS 输出中提取）
  return extractRegistrations(lepusResult.code);
}
```

与 BG `worklet-loader.ts` 的关键区别：

- 仅 LEPUS pass（无 JS pass）
- 将提取的注册作为模块内容返回（而非存储在全局 Map 中）
- 没有 `'main thread'` 指令的文件返回空字符串

### 步骤 2: 创建 `vue-sfc-script-extractor.ts`

MT 层的 `.vue` 文件新 loader。仅提取 `<script>` 内容：

```typescript
// packages/vue/rspeedy-plugin/src/loaders/vue-sfc-script-extractor.ts
import { parse } from '@vue/compiler-sfc';

export default function vueSfcScriptExtractor(
  this: LoaderContext,
  source: string,
): string {
  const { descriptor } = parse(source, { pad: false });

  // 返回 script 内容 -- worklet-loader-mt 接下来处理
  if (descriptor.scriptSetup) return descriptor.scriptSetup.content;
  if (descriptor.script) return descriptor.script.content;
  return ''; // 无 script -> 空模块
}
```

这在 MT 层替代了 vue-loader。无模板编译，无样式处理 -- 只有 `'main thread'` 指令所在的原始 `<script>` 内容。

`@vue/compiler-sfc` 已经是 `@rsbuild/plugin-vue` 的传递依赖。

### 步骤 3: 简化 `worklet-loader.ts`（BG 层）

移除 LEPUS pass 和 worklet-registry 依赖：

```diff
- import { addLepusRegistration } from '../worklet-registry.js';

  export default function workletLoader(source: string): string {
    // Pass 1: JS target（不变）
    const jsResult = transformReactLynxSync(source, { worklet: { target: 'JS', ... } });

-   // Pass 2: LEPUS target -- 已移除
-   const lepusResult = transformReactLynxSync(source, { worklet: { target: 'LEPUS', ... } });
-   const registrations = extractRegistrations(lepusResult.code);
-   if (registrations) addLepusRegistration(resourcePath, registrations);

    return jsResult.code;
  }
```

`extractRegistrations()` 移到 `worklet-loader-mt.ts`（或共享工具模块）。

### 步骤 4: 修改 `entry.ts` -- entry 拆分

**MT entry 现在包含用户导入：**

```diff
  chain
    .entry(mainThreadEntry)
    .add({
      layer: LAYERS.MAIN_THREAD,
-     import: [require.resolve('vue-lynx/main-thread')],
+     import: [require.resolve('vue-lynx/main-thread'), ...imports],
      filename: mainThreadName,
    })
```

**完全移除 `VueMainThreadPlugin` 类**（第 90-147 行）。不再需要 flat-bundle 替换。

**移除 `clearLepusRegistrations`/`getAllLepusRegistrations` 导入。**

**保留 `VueWorkletRuntimePlugin`**（不变 -- 仍需注入 worklet-runtime Lepus chunk）。

### 步骤 5: 为 MT 层添加 loader 规则

在 `applyEntry()` 中注册 MT 专用 loader：

```typescript
// MT 上的 Vue SFC：仅提取 script（无 template/style）
chain.module
  .rule('vue:mt-sfc')
  .issuerLayer(LAYERS.MAIN_THREAD)
  .test(/\.vue$/)
  .use('vue-sfc-script-extractor')
  .loader(path.resolve(_dirname, './loaders/vue-sfc-script-extractor'))
  .end();

// MT 上的 JS/TS：LEPUS worklet 转换
chain.module
  .rule('vue:worklet-mt')
  .issuerLayer(LAYERS.MAIN_THREAD)
  .test(/\.(?:[cm]?[jt]sx?)$/)
  .exclude.add(/node_modules/).end()
  .use('worklet-loader-mt')
  .loader(path.resolve(_dirname, './loaders/worklet-loader-mt'))
  .end();
```

更新 `index.ts`，移除 `.vue` 仅限 BG 的约束（MT 现在通过 `vue-sfc-script-extractor` 有自己的 `.vue` 处理）：

```diff
- if (chain.module.rules.has(CHAIN_ID.RULE.VUE)) {
-   chain.module.rule(CHAIN_ID.RULE.VUE).issuerLayer(LAYERS.BACKGROUND);
- }
+ // vue-loader 仍然只在 BG 上运行（模板编译、样式处理）。
+ // MT 改用 vue-sfc-script-extractor（步骤 2）。
+ if (chain.module.rules.has(CHAIN_ID.RULE.VUE)) {
+   chain.module.rule(CHAIN_ID.RULE.VUE).issuerLayer(LAYERS.BACKGROUND);
+ }
```

实际上 vue-loader 保持仅 BG。新的 `vue:mt-sfc` 规则在 vue-loader 匹配之前处理 MT 上的 `.vue`。

### 步骤 6: 修复 `chunkLoading: 'lynx'` 启动问题

**问题**: rspeedy 的 `chunkLoading: 'lynx'`（通过 `StartupChunkDependenciesPlugin`）仅在 `hasChunkEntryDependentChunks(chunk)` 为 true 时生成启动代码。对于没有异步 chunk 依赖的 MT entry，这是 false -- module factory 永远不会执行。

**方案**: `VueMTStartupPlugin` -- 一个将 entry 执行注入 MT bundle 的 webpack 插件：

```typescript
class VueMTStartupPlugin {
  constructor(private readonly mainThreadFilenames: string[]) {}

  apply(compiler: WebpackCompiler): void {
    compiler.hooks.thisCompilation.tap('VueMTStartup', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'VueMTStartup', stage: PROCESS_ASSETS_STAGE_ADDITIONS },
        () => {
          for (const filename of this.mainThreadFilenames) {
            const asset = compilation.getAsset(filename);
            if (!asset) continue;

            const originalSource = asset.source.source();
            // 追加自执行启动代码：找到 __webpack_require__ 并
            // 触发 entry 模块求值。
            // 备选方案：使用 ConcatSource 追加启动调用。
            const startupCode = '\n// Vue MT startup\n'
              + 'var __webpack_exports__ = __webpack_require__(__webpack_require__.s);\n';

            compilation.updateAsset(
              filename,
              new compiler.webpack.sources.ConcatSource(
                asset.source,
                new compiler.webpack.sources.RawSource(startupCode),
              ),
              { ...asset.info, 'lynx:main-thread': true },
            );
          }
        },
      );
    });
  }
}
```

> **需要调查**：验证生成的 bundle 中 `__webpack_require__.s`（启动模块 ID）是否可用。如果不可用，使用 `entrypoints` API 为每个 MT chunk 查找 entry 模块 ID。这可能需要不同的方案 -- 例如 tap `additionalTreeRuntimeRequirements` 以强制启用 `RuntimeGlobals.startupEntrypoint`。

**回退方案**: 如果启动注入方案过于脆弱，仅对 `entry-main.ts` 保留 `VueMainThreadPlugin` 的 flat-bundle 替换，同时让 webpack 正常处理用户代码模块。这种混合方案修复了按 entry 隔离的问题，同时保留了经过验证的启动机制。

### 步骤 7: 删除 `worklet-registry.ts`

```bash
rm packages/vue/rspeedy-plugin/src/worklet-registry.ts
```

移除 `entry.ts` 中的所有引用（`clearLepusRegistrations`、`getAllLepusRegistrations` 导入）。

### 步骤 8: 更新 `vue-lynx/main-thread` 构建

当前 rslib 对 `entry-main.ts` 构建两次：

- 普通构建 -> `dist/entry-main.js`（webpack 作为模块使用）
- Flat bundle 构建 -> `dist/main-thread-bundled.js`（`VueMainThreadPlugin` 使用）

**从 `rslib.config.ts` 移除 flat-bundle 构建**。现在只需要普通模块构建（webpack 将其作为常规依赖导入）。

同时移除 `dist/dev-worklet-registrations.js` 构建 -- 开发环境 worklet 注册不再由插件追加。仍使用手工构建注册的 Gallery demo 应迁移到 `'main thread'` 指令（或作为仅开发环境的 side-effect 模块导入）。

### 步骤 9: 处理 `dev-worklet-registrations.ts`

当前 `VueMainThreadPlugin` 在开发模式下为使用手工 worklet 函数的 gallery demo 追加 `dev-worklet-registrations.js`。

选项：

- **推荐**: 将剩余 demo 迁移到 `'main thread'` 指令（大部分已完成）
- **回退**: 在每个需要的 gallery entry 中作为仅开发环境的 side-effect 模块导入

## 风险与缓解

| 风险                                                                                             | 缓解措施                                                                                         |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `chunkLoading: 'lynx'` 启动：`__webpack_require__.s` 可能不存在                                   | 调查 webpack 内部机制；回退到混合方案（步骤 6 回退方案）                                              |
| `vue-sfc-script-extractor` 可能遗漏边界情况（带 src 属性的 `<script>`、多个 script）                 | 使用 `@vue/compiler-sfc` parse，它处理所有 SFC 变体；添加测试                                        |
| MT bundle 中的 webpack module wrapper 开销                                                         | 可接受 -- 几 KB 的运行时开销；Lepus 字节码编译会处理                                                  |
| `@vue/compiler-sfc` 与 vue-loader 版本不匹配                                                      | 使用 `@rsbuild/plugin-vue` 已安装的同一版本                                                          |
| Watch 模式：用户文件变更时 MT loader 必须重新运行                                                    | webpack 的依赖追踪自然处理，因为用户文件现在在 MT 依赖图中                                             |

## 验证

1. **构建**: 在 `packages/vue/rspeedy-plugin`、`packages/vue/main-thread`、`packages/vue/runtime` 中运行 `pnpm build` -- 无错误
2. **Testing-library**: 在 `packages/vue/testing-library` 中运行 `pnpm test` -- 所有测试通过
3. **Vue 上游**: 在 `packages/vue/vue-upstream-tests` 中运行 `pnpm test` -- 无回归
4. **多 entry 隔离**: 构建 gallery 示例，验证每个 entry 的 `main-thread.js` 仅包含自己的 worklet 注册（而非所有 entry 的）
5. **LynxExplorer**: gallery-autoscroll、mts-draggable -- worklet 事件正确触发
6. **Watch 模式**: 在开发模式下修改 worklet 函数，验证热重建能捕获变更

---

## 实现后说明

### 实现 commit

`b7120bbb` -- `refactor(vue): adopt layer-based main thread architecture`

### Bundle 大小影响（`examples/vue`，生产构建，单 entry counter 应用）

| Bundle             | 之前               | 之后               | 差异                |
| ------------------ | ------------------ | ------------------ | ------------------- |
| `main.lynx.bundle` | 73,167 B (73.2 kB) | 73,812 B (73.8 kB) | **+645 B (+0.88%)** |
| `main.web.bundle`  | 71,189 B (71.2 kB) | 71,724 B (71.7 kB) | **+535 B (+0.75%)** |

单 entry 无 worklet 场景下略增约 0.6 kB，来自 webpack 给 MT 层空模块加的 module wrapper 开销。

#### 为什么 benchmark 没体现出优势

`examples/vue` 是单 entry 的 counter 应用，没有任何 `'main thread'` 指令。

在这个场景下：

- **旧架构**: 1 个 flat bundle（entry-main.ts 预编译）+ 0 条 worklet 注册
- **新架构**: webpack 编译 entry-main.ts + 用户代码（全部被 worklet-loader-mt 清空为 `''`）+ webpack module wrapper

多出的 645B 纯粹是 webpack 给这些空模块加的 wrapper 开销。没有任何 worklet 可以"拆开"，所以看不到收益。

#### 真正的收益场景是多 entry

假设 gallery 有 6 个 entry，其中 3 个有 worklet 事件：

```
旧架构 (flat bundle + globalThis Map):
+---------------------------------------------+
| entry-A 的 MT bundle = flat bundle            |
|   + entry-A 的 worklet 注册                    |
|   + entry-B 的 worklet 注册  <- 不需要的       |
|   + entry-C 的 worklet 注册  <- 不需要的       |
+---------------------------------------------+
| entry-B 的 MT bundle = 完全一样的内容          |
+---------------------------------------------+
| entry-C 的 MT bundle = 完全一样的内容          |
+---------------------------------------------+
| entry-D/E/F 的 MT bundle = 还是一样的          |
|   (不需要任何 worklet 注册，                    |
|    但也全部包含了)                              |
+---------------------------------------------+
6 个 entry x 同一份 (bootstrap + 全部注册)

新架构 (layer-based):
+-------------------------------+
| entry-A 的 MT bundle:          |
|   bootstrap + A 的注册 only    |
+-------------------------------+
| entry-B 的 MT bundle:          |
|   bootstrap + B 的注册 only    |
+-------------------------------+
| entry-D 的 MT bundle:          |
|   bootstrap + 空（无注册）      |
+-------------------------------+
每个 entry 只含自己的 worklet
```

所以：

- **单 entry 无 worklet**（当前 benchmark）：略增约 0.6kB（webpack wrapper 开销）
- **多 entry 有 worklet**（gallery 场景）：每个 entry 的 MT bundle 更小，因为不再包含其他 entry 的注册代码

要准确验证收益，需要等 gallery 拆成多 entry 后再 benchmark。

### 与计划的偏差

1. **步骤 2 -- `vue-sfc-script-extractor`**: 计划中指定使用 `@vue/compiler-sfc` 进行 SFC 解析。实际中 `@vue/compiler-sfc` 并未直接安装（仅作为 `@rsbuild/plugin-vue` 闭包内的传递依赖）。改用正则 `/<script[^>]*>([\s\S]*?)<\/script>/g` -- 对于提取 `<script>` 内容以检测 worklet 指令已经足够。

2. **步骤 3 -- `worklet-utils.ts`**: `extractRegistrations()` 被移到共享的 `worklet-utils.ts` 中，而非保留在 `worklet-loader-mt.ts` 内，因为旧的 BG loader 和新的 MT loader 都可能需要用到。

3. **步骤 6 -- 启动代码修复**: 计划提议通过 `processAssets` 注入启动代码（追加 `__webpack_require__(__webpack_require__.s)`）。实际方案更简单 -- tap `additionalTreeRuntimeRequirements` 为 MT entry chunk 添加 `RuntimeGlobals.startup`，使 webpack 自然生成自己的启动代码。无需手动操作源码。

4. **CSS 提取**: CSS 处理在同一个 commit 中从 `entry.ts` 提取到了专用的 `css.ts` 模块（`applyCSS()`）。这不在原始计划中，但是在 entry.ts 重写过程中的自然重构。

### 遇到的坑

#### 坑 1: `chunkLoading: 'lynx'` 阻止 MT entry 启动（步骤 6 已预见）

**症状**: `processData is not a function`、`renderPage is not a function`、`vuePatchUpdate is not a function`。

**根本原因**: rspeedy 全局设置 `chunkLoading: 'lynx'`。Lynx 的 `StartupChunkDependenciesPlugin` 仅在 `hasChunkEntryDependentChunks(chunk)` 为 true 时添加 `RuntimeGlobals.startup`。对于没有异步 chunk 依赖的 MT entry，这是 false -- webpack 永远不会生成 `__webpack_require__(entryModuleId)` 启动调用，因此 module factory（包括设置 `globalThis.renderPage` 等的 `entry-main.ts`）永远不会执行。

**修复**: `VueMarkMainThreadPlugin` tap `additionalTreeRuntimeRequirements`，为任何 entry layer 是 `LAYERS.MAIN_THREAD` 的 chunk 添加 `RuntimeGlobals.startup`。

#### 坑 2: pnpm workspace 符号链接绕过 `/node_modules/` 排除规则（未预见）

**症状**: 修复坑 1 后仍然出现 "processData is not a function" 错误。

**根本原因**: 查看构建的 `main-thread.js` 发现 `RuntimeGlobals.startup` 修复已生效（启动代码已生成），但 **module factory 是空的** -- `entry-main.js` 和 `ops-apply.ts` 的函数体都是空的 `function() {}`。

`vue:worklet-mt` loader 规则有 `.exclude.add(/node_modules/)` 来跳过 bootstrap 包。但在 pnpm workspace 中，`vue-lynx/main-thread` 通过符号链接解析到 `../../packages/vue/main-thread/dist/entry-main.js`（`packages/vue/` 下的真实路径），而非在 `node_modules/` 下。所以 exclude 没有匹配到它，`worklet-loader-mt` 对这些文件返回了 `''`（未找到 `'main thread'` 指令）。

同样，`vue-lynx/internal/ops`（`ops-apply.ts` 导入的 OP 枚举）解析到 `packages/vue/shared/src/ops.ts`。

**修复**: 显式解析并排除 bootstrap 包目录：

```typescript
const mainThreadPkgDir = path.dirname(
  require.resolve('vue-lynx/main-thread/package.json'),
);
let vueInternalPkgDir: string | undefined;
try {
  vueInternalPkgDir = path.dirname(
    require.resolve('vue-lynx/internal/ops/package.json'),
  );
} catch { /* optional */ }

chain.module.rule('vue:worklet-mt')
  .exclude.add(/node_modules/)
  .add(mainThreadPkgDir);
if (vueInternalPkgDir) workletMtExclude.add(vueInternalPkgDir);
```

### 验证结果

- **构建**: rspeedy-plugin + main-thread 构建成功
- **Testing-library**: 63/63 测试通过（7 个测试文件）
- **Bundle 验证**: `renderPage`、`processData`、`vuePatchUpdate` 都存在于编码的 `.lynx.bundle` 中
- **LynxExplorer**: mts-draggable 验证通过（hash 匹配：BG `9177:69c82:1` = MT `9177:69c82:1`，零运行时错误）
- **多 entry gallery**: gallery-scrollbar-compare 和 gallery-complete 验证通过 -- 所有 hash 匹配，worklet 事件正确触发

### 坑 3: 插件重建后 webpack 缓存过期（未预见）

**症状**: 修复坑 1 & 2 并验证 mts-draggable 正常工作后，gallery-scrollbar-compare 仍然显示来自 `worklet-runtime/main-thread.js` 的 `TypeError: cannot read property 'bind' of undefined`。

**根本原因**: gallery 示例的 webpack 持久缓存（`node_modules/.cache`）仍在提供 rspeedy-plugin 修复之前构建的 MT bundle。插件重建后开发服务器未重启。

**修复**: `rm -rf node_modules/.cache` + 重启开发服务器。错误消失 -- 开发和生产构建中 hash 都匹配。

**教训**: 调试 Lynx bundle 错误时，**在进行代码分析之前，务必先清除缓存并重启开发服务器**。rspeedy-plugin 与示例应用是分开构建的；重建插件后，下游 webpack 缓存已过期。这已记录在 `packages/vue/AGENTS.md` 中。
