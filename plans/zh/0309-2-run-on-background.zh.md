# MTS Phase 3: `runOnBackground`

## 背景

Vue Lynx 的 Swiper demo 当前在 BG 线程上重复了所有触摸追踪逻辑（约 60 行 `onBGTouchStart/Move/End`），因为没有 MT->BG 的函数调用机制。React Lynx 通过 `runOnBackground(fn)` 解决此问题 -- 允许 `'main thread'` 函数异步调用 BG 函数。这也阻碍了 Vue 和 React swiper 实现之间的代码共享。

**目标**: 为 Vue Lynx 实现 `runOnBackground`，与 React Lynx 的 API 对齐。

## 已有功能（无需修改）

| 层                                                                                                                                                                                                        | 状态                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **SWC 转换** -- 通过标识符名检测 `runOnBackground(fn)`，提取为 `_jsFn` handle（JS pass）并生成包含裸 `runOnBackground(_jsFnK)` 调用的 `registerWorkletInternal`（LEPUS pass） | 已可用 -- 同一个 `@lynx-js/react/transform` SWC 插件 |
| **worklet-loader** -- `extractRegistrations()` 捕获 `registerWorkletInternal(...)` 内容，包括其中的任何 `runOnBackground(...)` 调用                                                               | 已可用                                              |
| **MT 上的 worklet-runtime** -- `transformWorkletInner` 将父 ctx 的 `_execId` 标记到 `_jsFnId` 子对象上；`_runOnBackgroundDelayImpl` 已初始化                                                  | 已可用 -- 通过 `__LoadLepusChunk` 加载              |
| **`FunctionCallRet` BG 监听器** -- `function-call.ts` 解析 `runOnMainThread` 调用的返回值                                                                                                   | 已可用（可复用模式）                           |

## 实现

### 步骤 1: 类型 -- 扩展 `worklet-types.ts`

**文件**: `packages/vue/runtime/src/worklet-types.ts`

添加 `JsFnHandle` 接口并扩展 `Worklet`：

```ts
export interface JsFnHandle {
  _jsFnId?: number;
  _fn?: (...args: unknown[]) => unknown;
  _execId?: number;
  _error?: string;
  _isFirstScreen?: boolean;
}

// 添加到现有 Worklet 接口：
export interface Worklet {
  // ...现有字段...
  _execId?: number;
  _jsFn?: Record<string, unknown>;
}
```

### 步骤 2: `transformToWorklet` -- BG 函数包装器

**新文件**: `packages/vue/runtime/src/transform-to-worklet.ts`（约 15 行）

从 React 的 `packages/react/runtime/src/worklet/call/transformToWorklet.ts` 移植：

```ts
let lastId = 0;

export function transformToWorklet(obj: (...args: any[]) => any): JsFnHandle {
  const id = ++lastId;
  if (typeof obj !== 'function') {
    return {
      _jsFnId: id,
      _error:
        `Argument of runOnBackground should be a function, got [${typeof obj}]`,
    };
  }
  obj.toJSON ??= () => '[BackgroundFunction]';
  return { _jsFnId: id, _fn: obj };
}
```

SWC JS pass 生成 `import { transformToWorklet } from "vue-lynx"` -- 因此必须从 `index.ts` 导出。

### 步骤 3: BG 侧 worklet 注册 + 事件监听器

**新文件**: `packages/vue/runtime/src/run-on-background.ts`（约 100 行）

从 React 的 `runOnBackground.ts` + `execMap.ts` + `indexMap.ts` 移植并简化：

```ts
// IndexMap -- 自增 Map（从 React 的 indexMap.ts 移植）
class IndexMap<T> {
  private lastIndex = 0;
  private map = new Map<number, T>();
  add(value: T): number {
    const id = ++this.lastIndex;
    this.map.set(id, value);
    return id;
  }
  get(index: number): T | undefined {
    return this.map.get(index);
  }
  remove(index: number): void {
    this.map.delete(index);
  }
}

// WorkletExecIdMap -- 在 worklet 上标记 _execId，通过 (execId, fnId) 查找 JsFnHandle
class WorkletExecIdMap extends IndexMap<Worklet> {
  add(worklet: Worklet): number {
    const execId = super.add(worklet);
    worklet._execId = execId;
    return execId;
  }
  findJsFnHandle(execId: number, fnId: number): JsFnHandle | undefined {
    const worklet = this.get(execId);
    if (!worklet) return undefined;
    // 在 worklet 对象中递归搜索 { _jsFnId: fnId }
    // （与 React 的 execMap.ts 算法相同）
  }
}

let execIdMap: WorkletExecIdMap | undefined;

// registerWorkletCtx -- 在 worklet ctx 通过 ops 发送到 MT 之前调用
export function registerWorkletCtx(ctx: Worklet): void {
  if (!execIdMap) init();
  execIdMap!.add(ctx);
}

function init(): void {
  execIdMap = new WorkletExecIdMap();
  lynx.getCoreContext().addEventListener(
    'Lynx.Worklet.runOnBackground',
    runJSFunction,
  );
}

// runJSFunction -- 接收 MT 的 dispatch，查找 _fn，调用后发送返回值
function runJSFunction(event: { data?: unknown }): void {
  const data = JSON.parse(event.data as string);
  const handle = execIdMap!.findJsFnHandle(data.obj._execId, data.obj._jsFnId);
  if (!handle?._fn) throw new Error('runOnBackground: JS function not found');
  const returnValue = handle._fn(...data.params);
  lynx.getCoreContext().dispatchEvent({
    type: 'Lynx.Worklet.FunctionCallRet',
    data: JSON.stringify({ resolveId: data.resolveId, returnValue }),
  });
}
```

### 步骤 4: 将 `registerWorkletCtx` 接入 patchProp + runOnMainThread

**文件**: `packages/vue/runtime/src/node-ops.ts`

在 `patchProp` 中处理 `main-thread-*` worklet 事件时，在推入 ops 之前标记 `_execId`：

```ts
// 之前：pushOp(OP.SET_WORKLET_EVENT, el.id, event.type, event.name, nextValue);
// 之后：
registerWorkletCtx(nextValue as Worklet); // 标记 _execId
pushOp(OP.SET_WORKLET_EVENT, el.id, event.type, event.name, nextValue);
```

**文件**: `packages/vue/runtime/src/cross-thread.ts`

在 `runOnMainThread(fn)` 中，dispatch 之前标记：

```ts
export function runOnMainThread<R, Fn extends (...args: unknown[]) => R>(
  fn: Fn,
) {
  registerWorkletCtx(fn as unknown as Worklet); // 标记 _execId
  return async (...params) => {/* 现有 dispatch 逻辑 */};
}
```

### 步骤 5: MT 侧 `runOnBackground` 函数

**新文件**: `packages/vue/main-thread/src/run-on-background-mt.ts`（约 50 行）

这是在 MT 上 worklet 函数体内调用的函数。通过 `lynx.getJSContext()` 分发到 BG：

```ts
// 返回值解析器（MT 侧，镜像 BG 的 function-call.ts 但使用 getJSContext）
let resolveMap: Map<number, (v: unknown) => void> | undefined;
let nextResolveId = 1;

function initReturnListener(): void {
  resolveMap = new Map();
  lynx.getJSContext().addEventListener(
    'Lynx.Worklet.FunctionCallRet',
    (event) => {
      const { resolveId, returnValue } = JSON.parse(event.data as string);
      const resolve = resolveMap!.get(resolveId);
      if (resolve) {
        resolveMap!.delete(resolveId);
        resolve(returnValue);
      }
    },
  );
}

export function runOnBackground(handle: JsFnHandle) {
  return async (...params: unknown[]): Promise<unknown> => {
    return new Promise((resolve) => {
      if (!resolveMap) initReturnListener();
      const resolveId = nextResolveId++;
      resolveMap!.set(resolveId, resolve);

      // 首屏延迟（worklet-runtime 在需要时处理）
      if (handle._isFirstScreen) {
        globalThis.lynxWorkletImpl?._runOnBackgroundDelayImpl
          .delayRunOnBackground(handle, (fnId, execId) => {
            dispatch(fnId, params, execId, resolveId);
          });
        return;
      }
      dispatch(handle._jsFnId!, params, handle._execId!, resolveId);
    });
  };
}

function dispatch(
  fnId: number,
  params: unknown[],
  execId: number,
  resolveId: number,
) {
  lynx.getJSContext().dispatchEvent({
    type: 'Lynx.Worklet.runOnBackground',
    data: JSON.stringify({
      obj: { _jsFnId: fnId, _execId: execId },
      params,
      resolveId,
    }),
  });
}
```

**文件**: `packages/vue/main-thread/src/entry-main.ts`

注册为全局变量（提取的 LEPUS 代码以裸标识符方式调用）：

```ts
import { runOnBackground } from './run-on-background-mt.js';
(globalThis as any).runOnBackground = runOnBackground;
```

### 步骤 6: 从 `index.ts` 导出

**文件**: `packages/vue/runtime/src/index.ts`

```ts
export { transformToWorklet } from './transform-to-worklet.js';
// runOnBackground: 作为类型级 API 导出供用户 import
// （SWC 在编译时替换调用点；运行时实际不会在 BG 上被调用）
export { runOnBackground } from './run-on-background.js';
// 重置
import { resetRunOnBackgroundState } from './run-on-background.js';
// 添加到 resetForTesting()：
//   resetRunOnBackgroundState();
```

对于 BG 包的 `runOnBackground` 导出：提供一个抛出明确错误信息的桩函数（"只能在 'main thread' 函数中使用"）。SWC 转换会替换所有调用点，因此此函数永远不会运行 -- 它仅用于 TypeScript import 解析。

### 步骤 7: 更新 Swiper demo

**文件**: `packages/vue/e2e-lynx/src/swiper/Swiper/Swiper.vue`

之前（约 196 行）：

```vue
<!-- 同一元素同时有 MT 和 BG touch handler -->
<view
  :main-thread-bindtouchstart="handleTouchStart"
  :main-thread-bindtouchmove="handleTouchMove"
  :main-thread-bindtouchend="handleTouchEnd"
  @touchstart="onBGTouchStart"
  @touchmove="onBGTouchMove"
  @touchend="onBGTouchEnd"
/>
```

之后（约 130 行）：

```vue
<!-- 仅 MT handler -- runOnBackground 同步 indicator -->
<view
  :main-thread-bindtouchstart="handleTouchStart"
  :main-thread-bindtouchmove="handleTouchMove"
  :main-thread-bindtouchend="handleTouchEnd"
/>
```

变更：

- 删除 `bgOffset`、`bgTouchStartX`、`bgTouchStartOffset` 变量
- 删除 `onBGTouchStart`、`onBGTouchMove`、`onBGTouchEnd` 函数
- 删除 `@touchstart/@touchmove/@touchend` 模板绑定
- 添加 `import { runOnBackground } from 'vue-lynx'`
- 在 MT 的 `mtUpdateOffset` 中添加：`runOnBackground(updateCurrentIndex)(index)` 来同步 indicator
- 添加 BG 函数：`function updateCurrentIndex(index: number) { currentIndex.value = index; }`

### 步骤 8: MT 类型声明

**文件**: `packages/vue/main-thread/src/entry-main.ts`（扩展现有 `lynx` 声明）

为 MT 侧添加 `lynx.getJSContext()` 声明：

```ts
declare const lynx: {
  getJSContext(): {
    dispatchEvent(event: { type: string; data: string }): void;
    addEventListener(
      type: string,
      handler: (event: { data?: unknown }) => void,
    ): void;
  };
  // ...现有声明...
};
```

## 明确不在范围内（未来工作）

| 功能                                        | 原因                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| GC 生命周期（`FinalizationRegistry`）       | 优化 -- worklet 数量少且长期存活，轻微泄漏可以接受                                                              |
| `releaseBackgroundWorkletCtx` 事件          | 需要 GC 生命周期                                                                                               |
| SDK 版本守卫（`isSdkVersionGt(2, 15)`）     | Vue 仅面向现代 Lynx SDK                                                                                       |
| 首屏延迟（`_isFirstScreen`）                | Vue 立即挂载，不需要 hydration 延迟。保留代码路径以确保安全但非测试重点。                                         |

## 验证

1. **构建**: 在 runtime、main-thread、rspeedy-plugin 中运行 `pnpm build` -- 无错误
2. **类型检查**: `pnpm tsc --noEmit` 通过
3. **现有测试**: 在 `packages/vue/testing-library/` 中运行 `pnpm test` -- 全部 20 个测试通过（无回归）
4. **LynxExplorer 上的 Swiper demo**:
   - 触摸拖动仍可移动 swiper（MT handler，零延迟）
   - 拖动过程中指示点更新（通过 `runOnBackground`）
   - 点击指示器仍可触发 swiper 动画（通过 `runOnMainThread`）
   - 代码中无重复的 BG 触摸 handler
5. **控制台验证**: BG 日志显示触摸过程中 `runJSFunction` 接收到来自 MT 的调用

## 文件总结

| 文件                                      | 操作    | 约行数                |
| ----------------------------------------- | ------- | --------------------- |
| `runtime/src/worklet-types.ts`            | 修改    | +10                   |
| `runtime/src/transform-to-worklet.ts`     | **新建** | ~15                   |
| `runtime/src/run-on-background.ts`        | **新建** | ~100                  |
| `runtime/src/node-ops.ts`                 | 修改    | +3                    |
| `runtime/src/cross-thread.ts`             | 修改    | +3                    |
| `runtime/src/index.ts`                    | 修改    | +5                    |
| `main-thread/src/run-on-background-mt.ts` | **新建** | ~50                   |
| `main-thread/src/entry-main.ts`           | 修改    | +3                    |
| `e2e-lynx/src/swiper/Swiper/Swiper.vue`   | 修改    | -60                   |
| `main-thread/src/shims.d.ts`              | 修改    | +10                   |
| **总计**                                  |         | 新增约 200，删除约 60 |

## 实现后总结

### 构建 & 测试结果

- 3 个包（`runtime`、`main-thread`、`rspeedy-plugin`）全部构建成功
- Pipeline 测试 28/28 通过（无回归）
- 上游测试 778/875 通过，97 跳过（与之前一致）
- Swiper demo 在 LynxExplorer 上验证通过

### Vue Lynx <-> React Lynx MTS 代码复用分析

#### MTS 函数体复用率：~95%

`'main thread'` 函数在 SWC transform 后变成 worklet context，函数体完全与框架无关：

| MTS 函数                          | 差异                                                |
| --------------------------------- | --------------------------------------------------- |
| `handleTouchStart`                | 仅取消动画方式不同（React hook vs Vue ref）           |
| `handleTouchMove`                 | **0 差异**                                          |
| `handleTouchEnd`                  | 结构相同，Vue 内联了 animate                         |
| `updateOffset` / `mtUpdateOffset` | **0 差异** -- `Math.min/max` clamp 逻辑逐行一致      |
| `easeInOutQuad`                   | **逐字一致**                                        |
| `calcNearestPage`                 | Vue 内联在 `handleTouchEnd` 中，逻辑相同              |

#### Swiper Demo 变更前后对比

| 指标                                | 变更前（无 `runOnBackground`）                                              | 变更后                 |
| ----------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| Vue Swiper 总行数                   | ~196 行                                                                 | ~167 行（**-30 行**）  |
| BG 重复触摸逻辑                      | 3 个 handler x ~10 行 = ~30 行                                          | **0 行**（已删除）     |
| BG 状态变量                          | `bgOffset`、`bgTouchStartX`、`bgTouchStartOffset`                        | **0 个**              |
| MTS 函数体可从 React 直接复用         | ~70%（缺少 MT->BG 通道，indicator 逻辑不同）                               | **~95%**             |
| 跨框架 API 一致性                    | `useMainThreadRef` OK `runOnMainThread` OK `runOnBackground` 缺失         | **全部 OK**           |

#### 运行时基础设施复用

| 模块                   | 复用程度                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| `useMainThreadRef`     | API 一致，Vue 多了 `.value` alias                                          |
| `runOnMainThread`      | dispatch 协议一致                                                          |
| `runOnBackground`      | **实现后完全对齐**                                                          |
| `transformToWorklet`   | 逻辑一致                                                                   |
| worklet-runtime (MT)   | **100% 复用** -- 同一个 `__LoadLepusChunk('worklet-runtime')`               |
| SWC transform          | **100% 复用** -- 同一个 `@lynx-js/react/transform` 插件                     |
| 事件协议               | **100% 复用** -- `Lynx.Worklet.runOnBackground` / `FunctionCallRet`         |

#### 结论

实现 `runOnBackground` 后，Vue Lynx 与 React Lynx 的 MTS API 完全对齐（`useMainThreadRef`、`runOnMainThread`、`runOnBackground`、`transformToWorklet`）。Swiper 的 MTS 函数体可以几乎逐行搬运，仅需调整框架包装（Vue SFC composable vs React hook）。剩余约 5% 的差异来自 Vue 将 `useAnimate` 内联而非提取为独立 hook -- 属于代码组织风格差异，不影响功能。
