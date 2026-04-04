# 计划：阶段 3 -- Vue runtime-dom 流水线测试

## 背景

我们已完成两个测试层：

- **阶段 1** ✅ -- `packages/vue/testing-library/`（20/20 E2E 流水线测试）
- **阶段 2** ✅ -- `packages/vue/vue-upstream-tests/`（322/391 runtime-core 测试，69 个被跳过）

阶段 2 验证了**渲染器契约**（ShadowElement 链表满足 Vue 的 VDOM diff），但**没有**测试 **PAPI 输出层** -- 即 `patchProp → ops → applyOps → PAPI → jsdom` 是否对样式、类名、属性、事件等产生正确的 DOM。

React 的 `preact-upstream-tests` 通过完整的 BG→MT→PAPI→jsdom 流水线运行 438 个 Preact 测试来解决这个问题。我们需要 Vue 的等价方案：通过我们的流水线运行 Vue 的 `runtime-dom` 上游测试来验证 DOM 补丁层。

### 问题

Vue 的 `runtime-dom` 测试直接调用内部函数（在原始 DOM 元素上调用 `patchProp(el, 'style', ...)`），而非 `render()` API。我们需要一个适配器来：

1. 拦截 `patchProp` / `document.createElement` 调用
2. 通过我们的 ops 流水线（BG → MT → PAPI → jsdom）路由它们
3. 返回真实的 jsdom 元素，使测试断言（`el.className`、`el.style.color`）无需修改即可工作

---

## 方案：同步刷新流水线桥接

**包**：`packages/vue/vue-upstream-tests/`（扩展，添加第二个 vitest 项目）

### 核心适配器：`src/lynx-runtime-dom-bridge.ts`

一个桥接模块，使 Vue runtime-dom 的测试模式能够针对我们的流水线工作。两个关键机制：

#### 机制 1：元素创建桥接

```
测试调用：document.createElement('div')
  → 桥接器在 BG 线程创建 ShadowElement('div')
  → 推送 OP.CREATE + OP.INSERT（到临时根节点）
  → 同步刷新：applyOps → __CreateElement → jsdom 元素
  → 返回 jsdom 元素
  → 存储映射：jsdomEl → shadowEl.id
```

实现：

- 在测试 setup 中覆盖 `document.createElement`
- 维护一个 `WeakMap<Element, number>`（jsdom 元素 → shadow 元素 ID）
- CREATE + INSERT 之后，通过 ID 在 PAPI 的 `elements` Map 中查找元素
- 直接返回 jsdom 元素 -- 测试可以断言 `.className`、`.style` 等

#### 机制 2：patchProp 桥接

```
测试调用：patchProp(el, 'class', null, 'foo')
  → 桥接器从 jsdom el 查找 shadow 元素 ID
  → 调用我们真实的 nodeOps.patchProp(shadowEl, 'class', null, 'foo')
  → 推送 OP.SET_CLASS
  → 同步刷新：applyOps → __SetClasses → el.className = 'foo'
  → 测试断言：el.className === 'foo' ✓
```

实现：

- 导出 `patchProp(el, key, prev, next)`，该函数：
  1. 通过 `elToIdMap.get(el)` 查找 shadow 元素 ID
  2. 从 `Map<number, ShadowElement>` 获取 ShadowElement
  3. 调用我们的 `nodeOps.patchProp(shadowEl, key, prev, next)`
  4. 调用 `syncFlush()` -- 取出 ops，通过 `applyOps` 同步应用

#### `syncFlush()` -- 为单元测试绕过 callLepusMethod

由于这些是单元测试（不是完整的组件渲染），我们绕过调度器：

```ts
function syncFlush(): void {
  const ops = takeOps();
  if (ops.length === 0) return;
  env.switchToMainThread();
  applyOps(ops); // PAPI → jsdom
  env.switchToBackgroundThread();
}
```

这比完整的 `queuePostFlushCb → callLepusMethod` 路径更简单，但测试的是相同的 ops → PAPI → jsdom 流水线。

### 需要创建/修改的文件

#### `src/lynx-runtime-dom-bridge.ts`（新建）

核心桥接，包含：

- `createBridgedElement(tag)` -- 创建 ShadowElement + 刷新 CREATE → 返回 jsdom 元素
- `bridgedPatchProp(el, key, prev, next)` -- 通过我们的 nodeOps.patchProp + syncFlush 路由
- `syncFlush()` -- 取出 ops，在 MT 上调用 applyOps
- `resetBridge()` -- 清除所有映射，重置 ShadowElement.nextId
- 元素映射：`jsdomToShadowId: WeakMap<Element, number>`、`idToShadow: Map<number, ShadowElement>`

关键细节：对于 patchProp，桥接器必须处理键格式差异：

- Vue runtime-dom 测试使用标准 DOM 事件名：`onClick`、`onUpdate:modelValue`
- 我们的 nodeOps.patchProp 期望：`bindtap`、`onTap`、`bindEvent:click`
- 桥接器会将键原样传递给我们的 patchProp（后者已经处理了 `on[A-Z]` 模式）

#### `src/runtime-dom-setup.ts`（新建）

runtime-dom 测试的 Vitest setup 文件：

1. 使用 jsdom 创建 `LynxTestingEnv`
2. 注入 MT 全局变量（导入 `vue-lynx/main-thread`）
3. 注入 BG 全局变量（导入 `vue-lynx/entry-background`）
4. 覆盖 `document.createElement` → `createBridgedElement`
5. 设置 `globalThis.patchProp` → `bridgedPatchProp`
6. `beforeEach`：resetBridge + 清空 jsdom body + 重新创建 page 根节点

#### `vitest.config.ts`（修改）

使用工作区项目添加第二个 vitest 项目：

```ts
export default defineConfig({
  // 已有的 runtime-core 项目配置...
  test: {
    // 使用 vitest workspace 运行两个项目
    projects: [
      {/* 已有的 runtime-core 配置 */},
      {
        test: {
          name: 'runtime-dom',
          globals: true,
          include: runtimeDomTests,
          alias: [
            // 将 runtime-dom 内部导入别名指向我们的桥接器
            { find: '../patchProp', replacement: bridgePath },
            { find: /^@vue\/runtime-dom$/, replacement: bridgePath },
            // ... 其他 runtime-dom 源码导入
          ],
          setupFiles: ['./src/runtime-dom-setup.ts'],
        },
      },
    ],
  },
});
```

如果工作区项目过于复杂，也可以创建单独的 `vitest.dom.config.ts`。

#### `skiplist-dom.json`（新建）

runtime-dom 测试的独立跳过列表。

### 要包含的测试文件

来自 `core/packages/runtime-dom/__tests__/`：

**第 1 梯队 -- 完全可适配**（约 49 个测试）：

| 文件                           | 测试数 | 验证内容                                                     |
| ------------------------------ | ------ | ------------------------------------------------------------ |
| `patchStyle.spec.ts`           | 12     | 样式对象/字符串 → `__SetInlineStyles` → `el.style.*`        |
| `patchEvents.spec.ts`          | 11     | 事件绑定 → `__AddEvent` → 监听器注册                        |
| `directives/vShow.spec.ts`     | 11     | `display: none` 切换 → `__SetInlineStyles`                  |
| `patchClass.spec.ts`           | 3      | 类名字符串 → `__SetClasses` → `el.className`                |
| `directives/vCloak.spec.ts`    | 1      | 挂载时移除属性                                               |
| `rendererStaticNode.spec.ts`   | 5      | 静态内容插入                                                 |
| `helpers/useCssModule.spec.ts` | 5      | CSS 模块注入（纯 JS）                                       |

**第 2 梯队 -- 部分可适配**（约 40 个测试，需要跳过列表）：

| 文件                     | 可适配/总数 | 跳过原因                         |
| ------------------------ | ----------- | -------------------------------- |
| `patchProps.spec.ts`     | ~20/29      | 跳过：innerHTML、SVG、embed 标签 |
| `patchAttrs.spec.ts`     | ~5/7        | 跳过：xlink、SVG 命名空间       |
| `directives/vOn.spec.ts` | ~15/20+     | 跳过：捕获阶段、WebComponents   |

**完全跳过**（与 Lynx 不兼容）：

- `createApp.spec.ts`（SVG 容器）
- `customizedBuiltIn.spec.ts`（Web Components `is`）
- `customElement.spec.ts`（Shadow DOM，20+ 个测试）
- `directives/vModel.spec.ts`（表单输入 -- Lynx 没有 `<input>`）

> **实现后注记（PR [#121](https://github.com/Huxpro/vue-lynx/pull/121))：** `vModelText` 现已支持 `<input>` 和 `<textarea>`。上游 `vModel.spec.ts` 仍然跳过（它测试的是 DOM 特有行为，如 `compositionstart`/`compositionend` 以及 `<select>`/`<checkbox>`/`<radio>`），但已在 `packages/testing-library/src/__tests__/v-model.test.ts` 中添加了 Lynx 专用的 v-model 测试。

### 导入重写策略

Vue runtime-dom 测试通过相对路径导入内部模块：

```ts
import { patchProp } from '../src/patchProp';
import { render, h, nextTick } from 'vue';
```

我们需要 vitest 插件来重写这些导入：

1. **`rewriteRuntimeDomImportsPlugin`**：
   - `from '../src/patchProp'` → `from './lynx-runtime-dom-bridge'`（我们的桥接器）
   - `from '../src/nodeOps'` → `from './lynx-runtime-dom-bridge'`
   - `from 'vue'` → `from '@vue/runtime-core'` + 桥接器导出

2. **指令测试**（vShow、vOn、vCloak）使用 Vue 的 `render()`。这些需要：
   - `from 'vue'` → 别名到一个模块，该模块导出通过我们流水线接线的 Vue `render` + `h` + `nextTick`
   - 已有的 `testing-library/src/render.ts` 已经做了这个 -- 我们可以复用其模式
   - 或者：使用 React preact-upstream-tests 中的 `__pipelineRender` 方案

### patchProp 键映射

Vue runtime-dom 测试使用标准 HTML prop 名称调用 `patchProp(el, key, prev, next)`。我们的 `nodeOps.patchProp` 处理以下映射：

| 测试键        | 我们的 patchProp 行为             | PAPI 调用                                    |
| ------------- | --------------------------------- | -------------------------------------------- |
| `'style'`     | → normalizeStyle → `OP.SET_STYLE` | `__SetInlineStyles(el, obj)`                 |
| `'class'`     | → `OP.SET_CLASS`                  | `__SetClasses(el, str)`                      |
| `'id'`        | → `OP.SET_ID`                     | `__SetID(el, str)`                           |
| `'onClick'`   | → parseEventProp → `OP.SET_EVENT` | `__AddEvent(el, 'bindEvent', 'click', sign)` |
| 其他任意键    | → `OP.SET_PROP`                   | `__SetAttribute(el, key, value)`             |

**差距**：Vue runtime-dom 的 `patchProp` 还处理：

- DOM 属性（`.value`、`.checked`），通过 `shouldSetAsProp()` -- 我们的流水线对所有属性使用 `__SetAttribute`
- 布尔属性（`disabled`、`readonly`）-- 需要 `__SetAttribute(el, key, '')` 表示 true，`null` 表示 false
- `innerHTML` / `textContent` -- Lynx 不支持

桥接器需要处理布尔属性转换并跳过不兼容的操作。

### 技术风险

1. **元素身份**：测试执行 `const el = document.createElement('div')` 然后对 `el` 进行断言。我们的桥接器必须确保返回的元素**是**真实的 jsdom 元素（不是代理）。由于 PAPI 的 `__CreateElement` 直接创建 jsdom 元素，我们可以返回这些元素。

2. **时序**：`syncFlush()` 必须是真正同步的。我们的 `takeOps` + `applyOps` 都是同步的，且 `LynxTestingEnv.switchToMainThread()` 也是同步的，所以可以正常工作。

3. **元素挂载**：PAPI 的 `__CreateElement` 创建的是分离的元素。测试可能期望元素不在 DOM 树中。我们应该在创建元素时不将它们插入到 page 根节点，只在显式的树操作时才插入。

4. **指令测试需要完整渲染**：vShow、vOn、vCloak 测试使用 `render(h(...), el)`。这些需要完整的组件渲染流水线，而不仅仅是桥接器。解决方案：提供一个通过我们的 testing-library 流水线运行的 `render` 函数。

---

## 实现顺序

1. 创建 `src/lynx-runtime-dom-bridge.ts`，包含 `createBridgedElement`、`bridgedPatchProp`、`syncFlush`
2. 创建 `src/runtime-dom-setup.ts`，包含 LynxTestingEnv 接线
3. 添加 runtime-dom vitest 项目配置（单独文件：`vitest.dom.config.ts`）
4. 添加 `rewriteRuntimeDomImportsPlugin` 处理导入重写
5. 从第 1 梯队测试开始（patchStyle、patchEvents、patchClass）
6. 分类失败用例，构建 `skiplist-dom.json`
7. 添加第 2 梯队测试 + 指令测试
8. 在 `package.json` 中添加 `test:dom` 脚本

## 验证

```bash
cd packages/vue/vue-upstream-tests
pnpm run vuejs:init        # 确保子模块已初始化
pnpm run test              # runtime-core：322 通过
pnpm run test:dom          # runtime-dom：目标 50+ 通过
```

## 关键参考文件

| 文件                                                                   | 用途                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `packages/vue/runtime/src/node-ops.ts`                                 | 我们的 patchProp 实现（事件解析、样式规范化）            |
| `packages/vue/main-thread/src/ops-apply.ts`                            | Ops → PAPI 执行                                         |
| `packages/vue/runtime/src/ops.ts`                                      | Op 码、pushOp、takeOps                                   |
| `packages/testing-library/testing-environment/src/lynx/ElementPAPI.ts` | PAPI → jsdom 映射                                        |
| `packages/react/preact-upstream-tests/setup-nocompile.js`              | React 的桥接模式（参考）                                 |
| `packages/vue/testing-library/setup.ts`                                | 已有的 LynxTestingEnv 接线（复用模式）                   |
| `packages/vue/vue-upstream-tests/vitest.config.ts`                     | 已有的 runtime-core 配置（扩展）                         |
