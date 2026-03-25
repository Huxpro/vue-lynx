# Vue Lynx 主线程脚本 (MTS) 设计方案

## 范围

**本 PR**: 设计文档 + **Phase 1 运行时基础**（新 ops、patchProp 检测、`MainThreadRef` composable、MT 执行器变更）。暂无 SWC 构建转换 -- Phase 1 使用手工构建的 worklet context 对象进行测试。

**模板语法**: `:main-thread-bindscroll="onScroll"`（v-bind 前缀，无需修改 Vue 编译器）。

## 背景

Vue Lynx 当前将所有事件处理路由到后台线程：原生事件 -> `publishEvent(sign, data)` 到 BG -> Vue handler -> 响应式更新 -> ops buffer -> `callLepusMethod` -> 主线程 PAPI。每次交互需要 2 次跨线程通信，导致手势驱动动画产生可感知的延迟，并且使 `<input>` 上的 `v-model` 无法实现（Lynx 的 `getValue()`/`setValue()` 是同步的、仅限主线程的 API）。

React Lynx 通过 **Main Thread Script** 解决此问题：标记了 `'main thread'` 指令的函数在主线程上同步执行，无需跨线程通信。我们将此模式适配到 Vue，复用 Lynx 现有的 worklet 基础设施。

## 架构概览

```
构建时                                              运行时
─────────────────────────────────────────────────────────────────────────────
.vue 文件                                           BG 线程
  │                                                 ┌─────────────────────┐
  ├─ <script setup>  → BG bundle (vue-loader)      │ Vue 渲染器           │
  │                                                 │ patchProp 检测       │
  ├─ <script main-thread>  → MT bundle             │ "main-thread-bind*" │
  │  (编译为 Lepus，通过                              │ → pushOp(SET_WORK- │
  │   registerWorkletInternal 注册)                  │   LET_EVENT, ctx)   │
  │                                                 │ → callLepusMethod  │
  └─ webpack 打包                                   └────────┬────────────┘
     ├─ BG: Vue + 用户代码 (worklet context objs)            │
     └─ MT: PAPI 执行器 + worklet-runtime                    ▼
           + registerWorkletInternal 调用            MT 线程
                                                    ┌─────────────────────┐
                                                    │ applyOps 接收       │
                                                    │ SET_WORKLET_EVENT   │
                                                    │ → __AddEvent(el,   │
                                                    │   type, name,       │
                                                    │   {type:'worklet',  │
                                                    │    value: ctx})     │
                                                    │                     │
                                                    │ 用户点击元素:        │
                                                    │ → runWorklet(ctx,  │
                                                    │   [event]) -- 零    │
                                                    │   跨线程通信         │
                                                    └─────────────────────┘
```

## 面向用户的 API

### SFC 语法: `<script main-thread>`

主线程函数放在**独立的 `<script>` 块**中 -- 符合 Vue 风格，清晰分离：

```vue
<script setup>
import { ref } from 'vue';
import { useMainThreadRef } from 'vue-lynx';

const count = ref(0);
const elRef = useMainThreadRef(null);
</script>

<script main-thread>
// 整个块编译为主线程代码。
// 导出的函数成为模板中可用的 worklet context 对象。
export function onScroll(event) {
  event.currentTarget.setStyleProperty('opacity', '0.5');
}

export function onTap(event) {
  event.currentTarget.setStyleProperty('background-color', 'blue');
}
</script>

<template>
  <scroll-view
    :main-thread-ref="elRef"
    :main-thread-bindscroll="onScroll"
    :main-thread-bindtap="onTap"
    :style="{ width: 300, height: 300 }"
  >
    <text>Scroll me</text>
  </scroll-view>
</template>
```

**为什么用 `<script main-thread>` 而不是 React 的 `'main thread'` 指令？**

- Vue 已经支持多个 `<script>` 块（`<script>` + `<script setup>`）
- 清晰分离：BG 逻辑在 `<script setup>` 中，MT handler 在 `<script main-thread>` 中
- 无需 SWC 闭包提取 -- 块边界本身就是线程分离的边界
- vue-loader 自定义块处理可以直接将块路由到 MT bundle
- `event.currentTarget` 提供元素访问；`useMainThreadRef` 桥接共享状态

### 模板绑定语法（v-bind 前缀）

```vue
<!-- 使用 :main-thread- 前缀绑定 worklet 事件/ref -->
<view :main-thread-bindtap="onTap" :main-thread-ref="elRef" />
```

Vue 的 `:` (v-bind) 计算表达式并将 JS 值传递给 `patchProp`。`main-thread-` 前缀在运行时检测 -- 无需修改 Vue 编译器。

### 跨线程引用

**方案 A: `useMainThreadRef`（显式、通用）**

```typescript
import { useMainThreadRef } from 'vue-lynx';

// 元素引用
const elRef = useMainThreadRef<ViewElement>(null);
// <view :main-thread-ref="elRef" />

// 在 <script main-thread> 中：
elRef.value?.setStyleProperty('transform', '...'); // .value 访问（Vue 约定）

// 通用 MT 状态（不限于元素）
const scrollY = useMainThreadRef(0);
// 在 <script main-thread> 中：
scrollY.value = event.detail.scrollTop; // 在 MT 上可写
```

**方案 B: `useMainThreadHandle`（从 template ref 派生，未来 Phase 2）**

```typescript
import { useTemplateRef } from 'vue';
import { useMainThreadHandle } from 'vue-lynx';

const el = useTemplateRef<ShadowElement>('myEl');
const elHandle = useMainThreadHandle(el); // 自动从 template ref 派生
// <view ref="myEl" />  -- 标准 Vue ref 绑定

// 在 <script main-thread> 中：
elHandle.value?.setStyleProperty('color', 'red');
```

方案 A 是 Phase 1（通用方案）。方案 B 后续通过在 MT 上解析 ShadowElement id -> PAPI 元素映射来实现。

### 其他 Composable API（未来）

```typescript
// runOnMainThread -- 异步 BG → MT 调用（未来 Phase 2）
const result = await runOnMainThread(fn)(arg1, arg2);

// runOnBackground -- 异步 MT → BG 调用（未来 Phase 2）
await runOnBackground(() => {
  count.value++;
})();
```

## 编译时转换（Phase 2 -- 非本 PR 范围）

### 考虑的两种方案：

**A. `<script main-thread>` 块**（Vue 风格，推荐）

- vue-loader 自定义块 handler 将块路由到 MT bundle
- 块中的导出映射为 BG 侧的 worklet context 对象
- 无需 SWC 闭包提取

**B. `'main thread'` 指令**（兼容 React Lynx，备选）

- 在 vue-loader JS 输出上复用 `@lynx-js/swc-plugin-reactlynx` worklet visitor
- `target: 'JS'` 用于 BG（将函数替换为 `{ _c, _wkltId }`），`target: 'LEPUS'` 用于 MT（生成 `registerWorkletInternal`）
- 通过 `@lynx-js/react/transform` 的 `transformReactLynxSync()` 调用（napi binding）

### 构建流水线变更（Phase 2）

**当前**: MT bundle = 仅 `entry-main.ts`（PAPI 执行器，无用户代码）

**目标**: MT bundle = `entry-main.ts` + `worklet-runtime` + `<script main-thread>` 块（或 LEPUS 转换后的用户代码）

## 运行时变更

### 新 Op 码（`packages/vue/runtime/src/ops.ts`）

```typescript
export const OP = {
  // ... 现有 0-10 ...
  SET_WORKLET_EVENT: 11, // [11, id, eventType, eventName, workletCtx]
  SET_MT_REF: 12, // [12, id, { _wvid }]
} as const;
```

### patchProp 扩展（`packages/vue/runtime/src/node-ops.ts`）

```typescript
// 检测 main-thread-* props（在现有 event/style/class 检查之前添加）：
if (key.startsWith('main-thread-')) {
  const suffix = key.slice('main-thread-'.length);
  if (suffix === 'ref') {
    pushOp(OP.SET_MT_REF, el.id, (nextValue as MainThreadRef).toJSON());
  } else {
    const event = parseEventProp(suffix);
    if (event && nextValue) {
      pushOp(OP.SET_WORKLET_EVENT, el.id, event.type, event.name, nextValue);
    }
  }
  scheduleFlush();
  return;
}
```

### 主线程执行器（`packages/vue/main-thread/src/ops-apply.ts`）

```typescript
case OP.SET_WORKLET_EVENT: {
  const id = ops[i++], eventType = ops[i++], eventName = ops[i++], ctx = ops[i++]
  const el = elements.get(id)
  if (el) __AddEvent(el, eventType, eventName, { type: 'worklet', value: ctx })
  break
}

case OP.SET_MT_REF: {
  const id = ops[i++], refImpl = ops[i++]
  const el = elements.get(id)
  // 如果 worklet-runtime 已加载则存入 worklet ref map
  if (el && typeof lynxWorkletImpl !== 'undefined') {
    lynxWorkletImpl._refImpl?.updateWorkletRef(refImpl, el)
  }
  break
}
```

### v-model 机制（Phase 3 -- 非本 PR 范围）

预注册的 MT worklet 处理同步输入值同步：

```
用户输入 → MT bindinput 触发 → MT worklet 读取 getValue()
  → MT: setValue()（立即视觉反馈，无闪烁）
  → MT: dispatchEvent('Lynx.Vue.inputUpdate', { elementId, value }) 到 BG
  → BG: 更新 Vue ref(value) → 响应式系统 → next tick
```

## 需要创建/修改的文件（Phase 1）

### 新文件

| 文件                                          | 用途                                                   |
| --------------------------------------------- | ------------------------------------------------------ |
| `packages/vue/runtime/src/main-thread-ref.ts` | `MainThreadRef` 类，`useMainThreadRef()` composable    |
| `packages/vue/runtime/src/cross-thread.ts`    | `runOnMainThread()` 桩函数，回调注册表                   |
| `packages/vue/e2e-lynx/src/mts-demo/index.ts` | Phase 1 E2E demo，使用手工构建的 worklet context        |

### 修改的文件

| 文件                                        | 变更                                                          |
| ------------------------------------------- | ------------------------------------------------------------- |
| `packages/vue/runtime/src/ops.ts`           | 添加 `SET_WORKLET_EVENT=11`、`SET_MT_REF=12`                  |
| `packages/vue/runtime/src/node-ops.ts`      | 在 `patchProp` 中检测 `main-thread-*` props                   |
| `packages/vue/runtime/src/index.ts`         | 导出 `useMainThreadRef`、`MainThreadRef`、`runOnMainThread`    |
| `packages/vue/main-thread/src/ops-apply.ts` | 处理新的 op 码                                                 |

### 从 React Lynx 复用（未来 phase，无需修改）

| 包                               | 内容                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `@lynx-js/react/transform`       | SWC worklet 转换（napi）                                                       |
| `@lynx-js/react/worklet-runtime` | `initWorklet()`、`registerWorkletInternal()`、`runWorklet()`、`Element` 类      |

## 实现步骤（Phase 1）

### 步骤 1: 新 Op 码

**文件**: `packages/vue/runtime/src/ops.ts`

- 添加 `SET_WORKLET_EVENT = 11` 和 `SET_MT_REF = 12`

### 步骤 2: MainThreadRef Composable

**文件（新建）**: `packages/vue/runtime/src/main-thread-ref.ts`

- `MainThreadRef<T>` 类：`_wvid`、`_initValue`、`toJSON()`、`.value` getter/setter（BG 上在 dev 模式抛异常）
- 使用 `.value`（Vue 约定）而非 `.current`（React 约定）
- `useMainThreadRef<T>(initValue)` 带 `onScopeDispose` 清理
- 兼容 worklet-runtime 基于 `_wvid` 的 MT 端 ref 解析

### 步骤 3: patchProp 检测

**文件**: `packages/vue/runtime/src/node-ops.ts`

- 检测 `main-thread-*` 前缀，解析后缀，发射 `SET_WORKLET_EVENT` 或 `SET_MT_REF` ops

### 步骤 4: 主线程执行器

**文件**: `packages/vue/main-thread/src/ops-apply.ts`

- 处理 `SET_WORKLET_EVENT`：`__AddEvent(el, type, name, { type: 'worklet', value: ctx })`
- 处理 `SET_MT_REF`：存入 worklet ref map（如可用）

### 步骤 5: 跨线程桩函数

**文件（新建）**: `packages/vue/runtime/src/cross-thread.ts`

- `runOnMainThread(fn)` 桩函数（日志警告需要 SWC 转换）
- 回调注册表骨架，为未来异步返回做准备

### 步骤 6: 导出

**文件**: `packages/vue/runtime/src/index.ts`

- 导出新 API

### 步骤 7: E2E Demo

**文件（新建）**: `packages/vue/e2e-lynx/src/mts-demo/`

- 手工构建的 worklet context 对象（模拟编译器将产生的内容）
- 测试完整 ops 管道：BG -> ops -> MT -> `__AddEvent` 带 worklet context

## 测试策略（Phase 1）

由于 Phase 1 没有 SWC 转换，我们只测试**运行时管道**：

1. **构建检查**：在三个包中运行 `pnpm build` -- 现有 counter/todomvc demo 仍正常工作
2. **类型检查**：`pnpm tsc --noEmit` 在 runtime、main-thread、rspeedy-plugin 中通过
3. **Ops 流程测试**：mts-demo 发射 `SET_WORKLET_EVENT` ops。在 MT 上通过 `console.info` 日志验证 `__AddEvent` 被调用并带有 `{ type: 'worklet', value: { _wkltId: '...' } }`
4. **无回归**：现有 BG 线程事件（`@tap`、`@confirm`）通过基于 sign 的注册表继续正常工作
5. **DevTool 验证**：LynxExplorer 上的 `Runtime_listConsole` 显示 worklet 事件绑定日志

**注意**：worklet handler 实际上还不会触发（MT 上没有 worklet-runtime）。这需要 Phase 2。Phase 1 证明管道是正确的。

---

## 实现后总结

### 实际实现 vs 计划偏差

#### 1. `<script main-thread>` 方案被放弃，改用 `'main thread'` 指令

计划中推荐的 `<script main-thread>` 方案（Vue 风格，独立 SFC block）**未被采用**。实际使用了 React Lynx 的 `'main thread'` 字符串指令方案，原因：

- **复用 SWC 编译器**：`@lynx-js/react/transform` 的 worklet 编译器（SWC NAPI binding）开箱即用，支持 `target: 'JS'`（BG 侧替换为 worklet context object）和 `target: 'LEPUS'`（MT 侧生成 `registerWorkletInternal()` 调用）
- **零 vue-loader 修改**：不需要为自定义块增加新的 loader 配置
- **闭包自动捕获**：SWC 编译器自动分析 `'main thread'` 函数体的外部引用，序列化到 `_c`（closure values）中，包括 `MainThreadRef` 的 `_wvid` 标记
- **与 React Lynx 生态一致**：worklet-runtime、workletRefMap、runWorklet 等基础设施完全复用

**代价**：`'main thread'` 函数写在 `<script setup>` 中，不如独立 block 清晰。但实际使用发现这其实更灵活 -- 可以在同一 scope 混合 BG 和 MT 代码，共享 props/computed/ref。

#### 2. `.current` 和 `.value` 双协议

计划中说"使用 `.value`（Vue 约定）而非 `.current`（React 约定）"。实际实现后发现**必须同时支持 `.current`**：

- worklet-runtime hydration 后的 ref 对象只有 `.current`（`{ current: value, _wvid: id }`）
- SWC 编译器生成的 LEPUS 代码中，worklet 函数体内的 ref 访问编译为 `.current`
- BG 侧 `MainThreadRef` 类上新增了 `.current` getter/setter（只读，dev 模式给警告）

#### 3. 发现并修复 value-only ref 注册缺失 (INIT_MT_REF)

**这是最大的意外发现**。计划中只提到 `SET_MT_REF`（元素绑定 ref），完全没预见到 value-only ref 的问题。

**问题**：`useMainThreadRef<number>(0)` 创建的 ref 没有绑定到任何 DOM 元素，因此不会触发 `SET_MT_REF` op。当 worklet 函数在 MT 运行时，hydration 过程通过 `_wvid` 查找 `_workletRefMap`，找不到条目 -> 返回 `undefined` -> `undefined.current = value` 报 TypeError。

**React Lynx 的做法**：

1. `useMainThreadRef(initValue)` 内部调用 `addWorkletRefInitValue(wvid, initValue)`，累积到 patch buffer
2. commit 阶段调用 `sendMTRefInitValueToMainThread()`，通过 `callLepusMethod('rLynxChangeRefInitValue', { data })` 发送到 MT
3. MT 侧 `updateWorkletRefInitValueChanges(patch)` 在 `_workletRefMap` 中创建 `{ current: initValue, _wvid }`

**Vue 的修复**（更简洁的方案）：

- 新增 `INIT_MT_REF = 13` op 码
- `MainThreadRef` 构造函数中直接 `pushOp(OP.INIT_MT_REF, this._wvid, initValue)`
- ops 随初始渲染 batch 一起通过 `vuePatchUpdate` 发到 MT
- MT 侧 `applyOps` 中 `INIT_MT_REF` handler 在 `_workletRefMap` 创建条目

**优势**：利用已有 ops buffer 通道，无需新增 `callLepusMethod` 端点。INIT_MT_REF 在 CREATE/INSERT ops 之前入 buffer（因为 `useMainThreadRef` 在 setup 阶段调用），保证在任何 worklet 事件触发前就已注册。

#### 4. 构建流水线：worklet-loader + VueMainThreadPlugin

计划中 Phase 2 留了两个编译方案，实际选择了 **`'main thread'` 指令 + SWC dual-pass** 方案：

```
webpack loader chain (BG bundle):
  vue-loader → worklet-loader → webpack

worklet-loader 做两次 SWC transform:
  Pass 1 (target: 'JS')    → 替换 'main thread' 函数为 worklet context objects
  Pass 2 (target: 'LEPUS') → 生成 registerWorkletInternal() 调用

extractRegistrations() 从 LEPUS 输出中提取 registerWorkletInternal(...) 调用
→ 通过 worklet-registry (globalThis shared Map) 传给 VueMainThreadPlugin
→ VueMainThreadPlugin 将注册代码注入到 main-thread-bundled.js 中
```

**VueMainThreadPlugin 的 flat-bundle 策略**：

- rslib 预编译 `entry-main.ts` -> `dist/main-thread-bundled.js`（~17 kB，包含 ops-apply + worklet registrations）
- plugin 用 `fs.readFileSync` 读取该文件，替换 webpack 的 main-thread asset
- 标记 `'lynx:main-thread': true` asset info -> `LynxTemplatePlugin` 路由到 Lepus 字节码
- 这解决了 `chunkLoading: 'lynx'` 导致的 `StartupChunkDependenciesPlugin` 不执行 module factory 的问题

#### 5. `runOnMainThread` 已实现，`runOnBackground` 未实现

- `runOnMainThread(fn)(args)` 通过 `lynx.getCoreContext().dispatchEvent({ type: 'Lynx.Worklet.runWorkletCtx', ... })` 实现
- `runOnBackground` 需要 MT->BG 回调通道，基础设施复杂，暂用 **BG 重复 touch 追踪**作为 workaround（swiper indicator 同步用）

#### 6. Swiper Demo 验证了完整 MTS 能力

Swiper demo（3 个渐进式 entry）是 MTS 的"终极测试"：

| Entry          | MTS 功能覆盖                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `swiper-empty` | 无 MTS，纯静态布局                                                                                                        |
| `swiper-mts`   | MT touch handler、element ref (`setStyleProperty`)、value-only ref（offset 状态）、MT 上的 `requestAnimationFrame`         |
| `swiper`       | 上述全部 + `runOnMainThread`（indicator 点击 -> 动画）、BG+MT 双 touch handler 模式、嵌套 MT 函数调用                       |

**关键技术模式**：

```vue
<!-- 同一元素同时绑定 MT 和 BG touch handler -->
<view
  :main-thread-bindtouchstart="handleTouchStart"   <!-- MT: 零延迟拖拽 -->
  :main-thread-bindtouchmove="handleTouchMove"
  :main-thread-bindtouchend="handleTouchEnd"
  @touchstart="onBGTouchStart"                      <!-- BG: indicator 状态同步 -->
  @touchmove="onBGTouchMove"
  @touchend="onBGTouchEnd"
/>
```

#### 7. E2E Demo 命名与演进：`mts-demo/` -> `mts-draggable-raw/` + `mts-draggable/`

计划步骤 7 中的 `mts-demo/` 在实际实现时命名为 **`mts-draggable-raw/`** -- 一个 scroll-view + draggable box 的对比 demo（MT smooth vs BG laggy），使用手工构建的 worklet context objects：

```typescript
// 手工 worklet context (Phase 1 -- 无 SWC transform)
const onMTScrollCtx = {
  _wkltId: 'mts-draggable-raw:onScroll',
  _workletType: 'main-thread',
  _c: {} as Record<string, unknown>,
};
onMTScrollCtx._c = { _mtRef: mtDraggableRef.toJSON() };
```

Phase 2 SWC transform 集成后，创建了 **`mts-draggable/`** 作为对照版本，使用 `'main thread'` 指令：

```typescript
// Phase 2 -- SWC 自动处理闭包捕获 + worklet 注册
const onMTScroll = (event: { detail?: { scrollTop?: number } }) => {
  'main thread'
  const el = (mtDraggableRef as ...).current
  el?.setStyleProperty('transform', `translate(...)`)
}
```

`mts-draggable-raw/` 保留作为 Phase 1 raw worklet 的参考实现，需配合 `dev-worklet-registrations.ts` 中手工的 `registerWorkletInternal()` 调用（现已清空，因所有 demo 迁移到指令方案）。

**Gallery 中的 raw worklet 迁移**：`GalleryComplete` 和 `GalleryScrollbarCompare` 最初也使用了 Phase 1 raw worklet context（`_wkltId`、`_workletType`、`_c`），后来迁移到 `'main thread'` 指令。其余 Gallery demo（GalleryList、GalleryAutoScroll、GalleryScrollbar）不涉及 MTS，无需迁移。

### 遗留问题 & 后续计划

1. **`runOnBackground` 未实现**：需要 MT->BG 通信通道。React Lynx 通过 `Lynx.Worklet.runOnBackground` 事件实现
2. **`<script main-thread>` SFC 块**：仍可作为未来的语法糖，编译到 `'main thread'` 指令
3. **首屏 MTS 优化**：当前 value-only ref 通过 ops buffer 在首次 flush 注册；首屏渲染前的 worklet 执行不受保护（实际上不会发生，因为首屏没有用户交互）
4. **worklet-runtime 错误边界**：MT 侧 worklet 函数报错时，错误信息只出现在 LynxExplorer toast（DevTool 看不到 Lepus 日志），调试体验差
