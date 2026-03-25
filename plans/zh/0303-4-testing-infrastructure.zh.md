# 计划：Vue Lynx 测试基础设施

## 背景

Vue 3 Lynx 实现（`packages/vue/`）目前没有自动化测试。我们需要两个测试层：

1. **E2E 流水线测试**（高优先级）-- 验证完整的双线程流水线：Vue 组件 → ShadowElement → ops → `callLepusMethod` → `applyOps` → PAPI → JSDOM。大多数 bug 出现在这里。
2. **Vue 上游测试**（中优先级）-- 针对基于 ShadowElement 的渲染器运行 `vuejs/core` 的 `runtime-core` 测试套件，验证我们的 `nodeOps` 实现是否满足 Vue 的渲染器契约。

---

## 阶段 1：E2E 流水线测试库

**包**：`packages/vue/testing-library/`（`vue-lynx/testing-library`，私有）

复用 `@lynx-js/testing-environment`（框架无关），外加一层 Vue 专用的薄封装。

### 1.1 `packages/vue/runtime/` 的必要改动

**`src/index.ts`** -- 为 `VueLynxApp` 添加 `unmount()`（调用 `internalApp.unmount()`）

**`src/event-registry.ts`** -- 导出 `resetRegistry()` 以清除 `handlers` Map 并重置 `signCounter`

**`src/node-ops.ts`** -- 导出 `resetNodeOpsState()` 以清除 `elementEventSigns` Map

**`src/flush.ts`** -- 导出 `resetFlushState()` 以重置 `scheduled` 标志

**`src/ops.ts`** -- `takeOps()` 已经会清空缓冲区（足以完成重置）

**`src/index.ts`** -- 重新导出一个组合的 `resetForTesting()` 函数，调用上述所有重置方法

### 1.2 `packages/vue/testing-library/` 中的新文件

**`package.json`** -- 私有包，devDeps：`@lynx-js/testing-environment`、`vue-lynx`、`vue-lynx/main-thread`、`@testing-library/dom`、`jsdom`、`vitest`、`vue`

**`vitest.config.ts`** -- 将 `vue-lynx` 别名指向 `../runtime/src/index.ts`（源码，这样 `declare var lynx` 就会解析到 LynxTestingEnv 设置在 `globalThis.lynx` 上的值）。`vue-lynx/main-thread` 同理，指向 `../main-thread/src/entry-main.ts`。环境：`jsdom`。Setup 文件：`./setup.ts`。

**`setup.ts`** -- 核心接线：

1. 使用 vitest 的 JSDOM 创建 `LynxTestingEnv`
2. 切换到 BG 线程，将 `publishEvent` 注入 `globalThis` 和 `lynxCoreInject.tt`
3. 注入主线程全局变量：`renderPage`（调用 `__CreatePage`，将 page 存储为 `elements.set(1, page)`）、`vuePatchUpdate`（解析 JSON ops，调用 `applyOps`）
4. 设置 `globalThis.lynxTestingEnv`
5. 参考：`packages/react/testing-library/src/vitest-global-setup.js` 和 `packages/react/preact-upstream-tests/setup-shared.js`

**`src/render.ts`** -- `render(rootComponent, options?)`：

1. 调用 `cleanup()`
2. 切换到 MT，调用 `renderPage({})`
3. 切换到 BG，重置 `ShadowElement.nextId = 2`，调用 `resetForTesting()`
4. `createApp(rootComponent, props).mount()` -- mount 是同步的；`queuePostFlushCb(doFlush)` 在同一个调度器刷新周期内触发；LynxTestingEnv 中的 `callLepusMethod` 是同步的 → ops 在 `mount()` 返回之前已经应用到 JSDOM
5. 返回 `{ container, unmount, ...getQueriesForElement(container) }`

**`src/fire-event.ts`** -- 分发事件前切换到 BG 线程（事件处理器在 BG 上运行），通过 `@testing-library/dom` 分发 DOM 事件，然后恢复线程。提供命名辅助方法：`fireEvent.tap`、`fireEvent.longtap` 等。事件类型格式：`"bindEvent:tap"`（匹配 `__AddEvent` 的注册方式）。参考：`packages/react/testing-library/src/fire-event.ts`

**`src/index.ts`** -- 导出 `render`、`cleanup`、`fireEvent`，重新导出 `@testing-library/dom`

### 1.3 初始测试文件

**`src/__tests__/render.test.ts`** -- 静态渲染、文本内容、嵌套元素
**`src/__tests__/reactivity.test.ts`** -- `ref` 更新 → 重新渲染 → 验证 JSDOM 变化
**`src/__tests__/events.test.ts`** -- `bindtap` 处理器触发、状态更新、重新渲染
**`src/__tests__/styles.test.ts`** -- 内联样式通过 `__SetInlineStyles` 应用
**`src/__tests__/v-if-v-for.test.ts`** -- 条件/列表渲染，使用注释锚点

### 1.4 关键技术风险

- **`lynx` / `lynxCoreInject` 环境变量**：这些在 flush.ts / entry-background.ts 中是 `declare var` 声明。必须通过别名指向源码（而非 dist），并确保 LynxTestingEnv 在模块导入**之前**就在全局变量上设置好它们。Vitest 的延迟模块加载应该有帮助 -- 模块在测试运行时才加载，那时 setup.ts 已经执行完毕。
- **同步刷新假设**：如果 `queuePostFlushCb` 没有在 `mount()` 内触发，初始渲染中的响应式更新将不会反映出来。回退方案：让 `render()` 变为异步，使用 `await nextTick()`。
- **模块单例隔离**：ops 缓冲区、事件注册表、刷新状态都是模块级别的。`resetForTesting()` 必须在测试之间清除所有这些状态。

---

## 阶段 2：Vue 上游测试

**包**：`packages/vue/vue-upstream-tests/`（`vue-lynx/upstream-tests`，私有）

### 2.1 Git 子模块

将 `vuejs/core` 作为子模块添加到 `packages/vue/vue-upstream-tests/core`，固定到稳定标签（例如 `v3.5.13`）。

脚本：`vuejs:init`（`git submodule update --init ...`）、`vuejs:status`

### 2.2 适配器：`src/lynx-runtime-test.ts`

用一个适配器替换 `@vue/runtime-test`，该适配器使用我们**真实的 ShadowElement** 进行树操作，从而验证链表实现。

**树操作**：直接使用 `../../runtime/src/shadow-element.ts` 中的 `ShadowElement` 来实现 `createElement`、`createText`、`createComment`、`insert`、`remove`、`parentNode`、`nextSibling`、`setText`、`setElementText`。

**Props/文本存储**：由于 ShadowElement 不存储 props 或文本（它们进入 ops 缓冲区），适配器使用 `WeakMap<ShadowElement, Record<string, any>>` 存储 props，使用 `WeakMap<ShadowElement, string>` 存储文本内容。适配器的 `patchProp` 将数据存入 WeakMap **并且**调用我们真实的 `nodeOps.patchProp`（后者会推送 ops）。

**`serializeInner(el)`**：遍历 `el.firstChild` → `.next` 链表（而非 `.children[]` 数组）。从 WeakMap 读取 props。从 WeakMap 读取文本。输出 `<tag prop="val">children</tag>` 格式，与 `@vue/runtime-test` 的输出匹配。

**`triggerEvent(el, event, ...payload)`**：从 props WeakMap 中查找处理器（`onClick` → `click`），并调用它。

**`resetOps()` / `dumpOps()`**：封装 ops.ts 中的 `takeOps()`，并维护自己的已记录 ops 数组以兼容格式。

**`render` / `createApp`**：通过 `createRenderer({ patchProp: wrappedPatchProp, ...wrappedNodeOps })` 创建。

**重新导出**：`@vue/runtime-core` 的所有内容（h、ref、reactive、nextTick 等）

### 2.3 Vitest 配置

**`vitest.config.ts`**：

- 将 `@vue/runtime-test` 别名指向 `./src/lynx-runtime-test.ts`
- 包含来自 `core/packages/runtime-core/__tests__/` 的 18 个测试文件：rendererElement、rendererChildren、rendererFragment、rendererComponent、component、componentProps、componentSlots、componentEmits、apiLifecycle、apiWatch、apiInject、apiCreateApp、directives、errorHandling、h、vnode、vnodeHooks、scheduler
- 排除：hydration（SSR）、hmr（devtools）、rendererOptimizedMode（PatchFlags 内部实现）、scopeId（CSS 作用域）
- 跳过列表插件（基于 `skiplist.json` 将 `it(` 转换为 `it.skip(`）

**`skiplist.json`**：初始为空；在分类过程中填充。

### 2.4 验证范围

- ShadowElement 链表操作（`insertBefore`、`removeChild`）满足 Vue 的 VDOM diff 契约，涵盖有 key/无 key 的子节点、fragments、组件移动
- `parentNode()` / `nextSibling()` 在所有边界情况下返回正确值
- `createElement` / `createText` / `createComment` 行为正确
- 我们的 `patchProp` 事件解析能与 Vue 的事件模式配合工作

---

## 实现顺序

1. 在 `packages/vue/runtime/` 中添加 `unmount()` + `resetForTesting()` 导出
2. 创建 `packages/vue/testing-library/`，包含 setup、render、fireEvent
3. 编写 + 调试初始 E2E 测试（验证完整流水线正常工作）
4. 添加 vuejs/core 子模块，创建适配器 + vitest 配置
5. 运行上游测试，分类失败用例，构建跳过列表
6. 添加到 `pnpm-workspace.yaml`（已覆盖 `packages/vue/*`）

## 验证

- **E2E**：`cd packages/vue/testing-library && pnpm test` -- 所有流水线测试通过
- **上游**：`cd packages/vue/vue-upstream-tests && pnpm run vuejs:init && pnpm test` -- 目标通过率 80%+
