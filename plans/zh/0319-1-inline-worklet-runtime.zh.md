# 重构: 将 worklet-runtime 内联到 main-thread.js

**日期**: 2026-03-19
**状态**: 已完成

---

## 背景

此前,worklet-runtime(来自 `@lynx-js/react/worklet-runtime`)作为一个名为 `'worklet-runtime'` 的**独立 Lepus chunk** 注入:

1. `VueWorkletRuntimePlugin` 通过 `LynxTemplatePlugin.beforeEncode` 钩子将 chunk 推入 `lepusCode.chunks`
2. `entry-main.ts` 在启动时调用 `__LoadLepusChunk('worklet-runtime', { chunkType: 0 })` 来加载它
3. 原生 Lynx 加载该 chunk,使 `globalThis.runWorklet` / `registerWorkletInternal` / `lynxWorkletImpl` 变为可用

基于层的架构方案(`0309-5`)明确保留了此设计:
> **保留 `VueWorkletRuntimePlugin`**(不变 -- 仍需要用于注入 worklet-runtime Lepus chunk)。

## 动机

独立 chunk 方案增加了不必要的复杂性:

- 一个专用的 webpack 插件(`VueWorkletRuntimePlugin`,约 50 行)通过 `beforeEncode` 注入 chunk
- 编译时使用 `fs.readFileSync` 读取 worklet-runtime 源码
- 运行时调用 `__LoadLepusChunk` 并带有加载失败的兜底错误处理
- 存在"半初始化"的失败模式: 主线程启动了但 worklet 分发功能异常

既然基于层的重构已经让 webpack 原生处理主线程入口,worklet-runtime 可以简单地作为该入口中的另一个模块 -- 无需特殊的 chunk 机制。

## 变更

1. **`plugin/src/entry.ts`**: 将 `workletRuntimePath` 作为 webpack entry import 添加到主线程 bundle 中(在 `entry-main.js` 之后,用户 import 之前)。移除 `VueWorkletRuntimePlugin` 类及其使用。移除未使用的 `fs` import。

2. **`main-thread/src/entry-main.ts`**: 移除 `__LoadLepusChunk('worklet-runtime', ...)` 代码块(约 30 行)。

## 关键风险: 原生 Lynx 是否需要 `__LoadLepusChunk` 作为信号?

原始代码中有注释:
> 原生 Lynx 需要通过 __LoadLepusChunk 加载此 chunk,这样它才知道在 worklet 事件触发时调用 runWorklet()。

**已在 LynxExplorer(iOS 模拟器)上验证**: `examples/main-thread` 的拖拽演示正常工作 -- worklet 事件正常触发,MT 拖拽响应触摸操作且零延迟。原生 Lynx 基于全局函数的存在性来分发到 `runWorklet()`,而非基于 chunk 加载信号。

## 权衡

### 优点
- 更简洁的插件代码(-80 行)
- vue-lynx 中不再有独立 Lepus chunk 的概念
- 原子化加载: worklet-runtime 与整个主线程入口一起成功或失败
- 更可预测的 bundle 结构: 只有一个 `lepusCode.root`,没有 `lepusCode.chunks`

### 缺点
- 无法跨入口独立缓存 worklet-runtime(影响较小 -- 仅约 10 kB)
- 执行顺序依赖 webpack 模块调度(已缓解: entry-main.js 被排在首位)
