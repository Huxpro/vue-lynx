# 修复: 后台事件注册表 -- rspack 作用域提升导致的单例重复

**状态**: 已实现
**日期**: 2026-03-12
**分支**: research/vue-lynx

## 问题

使用 rspack 1.7.8 的模块拼接（作用域提升）时，后台事件（`bindtap` 等）完全失效。monorepo 版本 `packages/vue/examples/basic` 仍然可用，因为它使用的 rspack 1.7.6 将模块保持为独立的 webpack 模块 ID。

### 根本原因

`event-registry.ts` 将事件处理器存储在模块作用域变量中:

```ts
let signCounter = 0;
const handlers = new Map<string, (data: unknown) => void>();
```

该模块被两个不同的消费者导入，它们最终落入不同的拼接组:

| 拼接组 | 消费者 | 操作 |
|---|---|---|
| 组 A（entry-background） | `entry-background.ts` -> `import { publishEvent }` | 从 handlers Map 中**读取** |
| 组 B（Vue 运行时） | `node-ops.ts` -> `import { register, unregister, updateHandler }` | 向 handlers Map 中**写入** |

rspack 1.7.8 将 `event-registry.ts` 内联到两个组中，创建了两个独立的 `handlers` Map。`patchProp` -> `register()` 写入 Map #2，但 `publishEvent()` 从 Map #1（空的）中读取 -- 事件被静默丢弃。

**为什么其他模块不受影响**: `ops.ts`、`flush.ts`、`shadow-element.ts` 仅在组 B 内被导入。`event-registry.ts` 是唯一跨组的。

**为什么之前能工作**: rspack 1.7.6 将 `event-registry.ts` 保持为独立的 webpack 模块（ID 805），通过 `i(805)` 引用 -- 同一个单例。

## 解决方案

将事件状态存储在 `globalThis[REGISTRY_STATE_KEY]` 上，而非模块作用域变量中。具体键名为 `__VUE_LYNX_EVENT_REGISTRY__`。`globalThis` 是单一的运行时对象 -- 同一 bundle 内所有内联副本共享它。

```ts
const REGISTRY_STATE_KEY = '__VUE_LYNX_EVENT_REGISTRY__';

function getRegistryState(): RegistryState {
  const g = globalThis as RegistryGlobal;
  let state = g[REGISTRY_STATE_KEY];
  if (!state) {
    state = { signCounter: 0, handlers: new Map() };
    Object.defineProperty(g, REGISTRY_STATE_KEY, {
      value: state,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  }
  return state;
}
```

每个导出的函数在每次调用时都调用 `getRegistryState()`（不缓存）-- 确保测试中的 `resetRegistry()` 始终有效，且单次属性查找的开销在用户交互频率下可忽略不计。

### 为什么选择 `globalThis` 而非 `lynxCoreInject`（有意为之的决策）

ReactLynx 使用 `lynxCoreInject` 来实现类似的跨模块共享状态。我们有意为 Vue Lynx 选择 `globalThis`，原因如下:

1. **`lynxCoreInject` 对此用例增加了不必要的复杂性**: `lynxCoreInject` 是由 `RuntimeWrapperWebpackPlugin` 注入的 AMD 闭包参数。从 `event-registry.ts` 访问它需要一个 `typeof lynxCoreInject !== 'undefined'` 保护（因为该模块也在没有 AMD 包装器的测试环境中运行），加上一个不可用时的回退。

2. **不需要按调用隔离**: `lynxCoreInject` 相对于 `globalThis` 的主要优势是按调用隔离 -- 每次 `__init_card_bundle__` 调用都有自己的 `lynxCoreInject`。如果我们需要两次双重调用（Lynx 调用 `__init_card_bundle__` 两次）拥有独立的处理器注册表，这很重要。但双重调用问题已经通过 MT 端的去重保护解决了（`applyOps` 中的 `elements.has(firstId)`）-- 只有第一次调用的处理器实际有效。

3. **`globalThis` 更简单，在所有环境中都可用**: 无需保护，无 AMD 包装器依赖。在生产 bundle、testing-library 和上游测试环境中行为一致。

4. **未来可重新审视**: 如果我们未来需要对事件处理器进行按调用隔离（例如，多卡片场景中每张卡片需要独立的事件路由），应重新审视并迁移到 `lynxCoreInject`。这需要将 `lynxCoreInject` 作为参数贯穿事件注册表 API，类似于 ReactLynx 的做法。

## 修改的文件

| 文件 | 修改 |
|---|---|
| `runtime/src/event-registry.ts` | 模块作用域 `signCounter`/`handlers` -> 通过 `getRegistryState()` 使用 `globalThis[REGISTRY_STATE_KEY]`。最终键名: `__VUE_LYNX_EVENT_REGISTRY__`。移除调试用 `console.info` 日志。 |
| `runtime/src/entry-background.ts` | 仅移除调试用 `console.info` 日志（无功能变更）。 |

## 实现说明

- 最终代码使用 `RegistryState`、`REGISTRY_STATE_KEY` 和 `getRegistryState()`，而非草案名称 `VueEventState`、`getState()` 和 `__vueEventState`。更长的键名使得在调试消费者输出时 bundle 检查更明确。
- 单例使用 `Object.defineProperty(..., enumerable: false)` 安装，因此不会污染正常的全局枚举，同时在测试中仍然可重置（`configurable: true`、`writable: true`）。
- 调试用 `console.info` 语句在 bundle 取证期间保留，确认作用域提升根本原因后移除。
- 同一 PR 还包含 `plugin/src/index.ts` 中一个仅工作区的解析器修复，用于 `vue-lynx/internal/ops`，这是使 `rspeedy dev` 在 pnpm 符号链接的工作区中正常工作所必需的。该修改是相邻的验证支撑，不属于作用域提升根本原因本身。

## 被拒绝的替代方案

| 方案 | 原因 |
|---|---|
| 锁定 rspack/rslib 版本 | 变通方案，非修复。未来任何版本升级都会失效。 |
| 禁用模块拼接 | 过于粗暴，整个 BG bundle 失去 tree-shaking。 |
| 将 event-registry 标记为有副作用 | 依赖 rspack 启发式规则，跨版本不保证。 |
| 使用 `lynxCoreInject` | 详见上文解释。对当前问题而言过度工程。 |
| 仅提交 rspack bug | 额外应该做，但我们需要不依赖上游的修复方案。 |

## 验证

- `runtime/`: `npx rslib build`
- `plugin/`: `npx rslib build`
- `examples/basic`: `pnpm run build`
- `examples/basic`: `pnpm run dev` 成功启动，不再报告 `Can't resolve 'vue-lynx/internal/ops'`
