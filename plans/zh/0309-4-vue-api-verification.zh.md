# 后续工作: Vue API 导出验证计划

**创建时间**: 2026-03-09
**背景**: `vue-lynx` 重新导出了约 80 个 Vue 3 公共 API。大多数是纯 JS
（响应式、作用域、工具函数），天然安全。本计划追踪那些需要
针对性验证的 API，因为它们与渲染器、双线程模型或
Lynx 的原生元素生命周期存在交互。

---

## 1. 当前标记为 @deprecated（确认不可用）

这些已作为 stub 函数/常量导出，并附带开发警告。它们需要
Vue Lynx 未实现的渲染器选项。

| API                     | 根本原因                                                                                                             | 解除阻塞所需                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `createStaticVNode`     | 需要 `insertStaticContent` 渲染器选项                                                                              | 在 node-ops 中实现 `insertStaticContent`（解析 HTML 字符串 -> 多个 CREATE ops）             |
| `Static`（VNode 符号）  | 同上                                                                                                                     | 同上                                                                                        |
| `KeepAlive`             | 创建 `createElement('div')` 存储容器 -> MT 上的孤立元素；`move` 语义未经测试                                       | 实现隐藏存储容器（对离树容器跳过 CREATE op）                                               |
| `onActivated`           | 依赖 KeepAlive                                                                                                           | 随 KeepAlive 解除阻塞                                                                      |
| `onDeactivated`         | 依赖 KeepAlive                                                                                                           | 随 KeepAlive 解除阻塞                                                                      |
| `Teleport`              | 字符串目标需要 `querySelector` 渲染器选项；直接元素引用不适用（原生元素不在 BG 线程上） | 通过 SelectorQuery 桥实现 `querySelector`，或支持 Lynx 原生的"portal"模式 |

### 如果要实现它们，如何验证

#### KeepAlive + onActivated/onDeactivated

```
测试计划:
1. 创建一个组件，使用 KeepAlive 包裹两个子组件（A、B）
2. 通过 v-if 在 A 和 B 之间切换
3. 断言切换回 A 时保留了其响应式状态（计数器值）
4. 断言组件变为活跃时触发 onActivated
5. 断言组件变为非活跃时触发 onDeactivated
6. 断言主线程上不会积累孤立元素

关键挑战: 存储容器的 createElement('div') 会推送一个 CREATE op
到 MT。选项:
  a) 拦截: 在 node-ops 中检测离树容器并跳过 CREATE op
  b) 接受: 让孤立元素存在（它永远不会被插入可视树）
  c) 覆盖: 修补 KeepAlive，使用仅在 BG 端的 ShadowElement 作为存储
```

#### Teleport

```
测试计划:
1. Teleport 到直接的 ShadowElement 引用（非字符串选择器）
2. 断言内容渲染在目标元素内
3. 断言传送内容中的响应式正常工作
4. 断言卸载时清理传送内容

关键挑战: Lynx 没有 DOM querySelector。选项:
  a) 通过 PAPI __QuerySelector 桥实现 querySelector
  b) 仅支持直接元素引用（文档限制）
  c) 支持 Lynx 特定的选择器语法（例如基于 css-id）
```

#### 静态 VNode

```
测试计划:
1. 带有 createStaticVNode('<view>...</view>', 1) 的组件
2. 断言静态内容在 MT 上正确渲染

关键挑战: insertStaticContent 必须将类 HTML 字符串解析为
CREATE/INSERT ops。选项:
  a) 为 Lynx 元素语法编写简单解析器
  b) 以不同方式复用 Vue 编译器输出（避免静态提升）
  c) 标记为永久不支持（静态 VNodes 是优化，
     不是功能性需求）
```

---

## 2. 需要验证（按原样导出，可能可用）

这些 API 没有明显的不兼容性，但尚未在 Lynx 的
双线程管道中进行测试。每个至少需要一个针对性测试。

### 优先级 1 -- 实际应用中使用

| API                    | 需要验证的原因                                                                                                       | 测试方法                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `watchSyncEffect`      | 在响应式刷新期间同步运行。需要确认 ops 仍然正确批处理（不会在更新中途刷新）。 | 创建修改元素属性的 watchSyncEffect。断言 MT 上只有一个 ops 批次，而非两个。                                  |
| `getCurrentInstance`   | 返回组件内部实例。应该可用，但属于逃生舱口。                                            | 在 setup() 内调用，断言非空。在 setup() 外调用，断言为空。                                                       |
| `useId`                | 为每个应用生成连续 ID。应该是纯 JS。                                                                | 挂载两个使用 useId() 的组件，断言返回唯一 ID。                                                                |
| `useModel`             | defineModel() 的运行时配套。依赖 props/emit。                                                         | 使用 defineModel() 的 SFC，父组件传递 v-model。断言双向绑定正常工作。                                                   |
| `onErrorCaptured`      | 错误边界钩子。                                                                                                | 父组件使用 onErrorCaptured，子组件在 setup() 中抛出异常。断言错误被捕获且组件仍然渲染。                         |
| `defineAsyncComponent` | 异步组件加载。                                                                                            | defineAsyncComponent(() => import('./Foo.vue'))。断言 resolve 后渲染。（可能需要 webpack/rspeedy 测试，非单元测试。） |

### 优先级 2 -- 边缘情况 / 开发工具

| API                 | 需要验证的原因                                           | 测试方法                                                                                                                |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `onRenderTracked`   | 仅开发模式的响应式调试钩子。                          | 在 **DEV** 模式下，挂载带有响应式数据的组件。断言首次渲染时回调触发且 DebuggerEvent 正确。       |
| `onRenderTriggered` | 仅开发模式的响应式调试钩子。                          | 同上设置，修改响应式数据。断言重新渲染时回调触发。                                                        |
| `effectScope`       | 手动响应式作用域管理。                        | 创建 scope，在其中运行 effects。停止 scope，断言 effects 被清理。                                                     |
| `onScopeDispose`    | effectScope 内的清理。                              | 通过 onScopeDispose 注册回调，停止 scope，断言回调触发。                                                     |
| `onWatcherCleanup`  | Watcher 清理（Vue 3.5+）。                              | 创建注册 onWatcherCleanup 的 watch()。触发重新求值。断言下次运行前清理函数触发。                 |
| `Suspense`          | 异步组件边界。变更前已导出。 | 用 Suspense 包裹 defineAsyncComponent，并带有 #fallback 插槽。断言加载期间显示 fallback，resolve 后显示内容。 |

### 优先级 3 -- 编译器输出（任何 SFC 都会间接测试到）

这些由 Vue 模板编译器输出调用。如果任何 SFC 正确渲染，
则这些已被隐式验证。

| API                                          | 说明                                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `withMemo`                                   | 由 v-memo 指令使用。测试: 带有 v-memo 的组件，断言依赖未变时跳过重新渲染。 |
| `setBlockTracking`                           | 编译器块树输出内部使用。                                                       |
| `pushScopeId` / `popScopeId` / `withScopeId` | 作用域 CSS (`<style scoped>`)。如果 CSS 作用域可用则已正常工作。                                   |
| `toHandlerKey` / `toHandlers`                | 事件处理器规范化。                                                                         |
| `createSlots`                                | 动态插槽编译输出。测试: 带有动态插槽名的组件。                            |
| `withDefaults`                               | `<script setup>` + 带默认值的 defineProps。测试: 任何使用 withDefaults 的 SFC。                      |

---

## 3. 已确认安全（无需验证）

纯 JavaScript，零渲染器依赖。为完整性而列出。

**响应式**: `customRef`, `triggerRef`, `toValue`, `isRef`, `isReactive`,
`isReadonly`, `isProxy`, `isShallow`, `markRaw`, `shallowReadonly`

**工具函数**: `version`, `camelize`, `capitalize`, `cloneVNode`, `isVNode`,
`hasInjectionContext`, `toHandlerKey`, `toHandlers`

**VNode 符号**: `Text`, `Comment`, `Fragment`

**已通过现有测试套件测试**: `computed`, `ref`, `reactive`,
`watch`, `watchEffect`, `onMounted`, `onUnmounted`, `h`, `createVNode`,
`v-if`, `v-for`, `renderList` 等（由 63 个已有测试覆盖）

---

## 4. 建议实现顺序

1. **编写优先级 1 测试**（约 6 个测试）-- 验证实际应用代码中最常用的 API
2. **编写优先级 2 测试**（约 6 个测试）-- 覆盖边缘情况
3. **评估 KeepAlive 可行性** -- 原型化上述选项 (b) 或 (c)
4. **评估 Teleport 可行性** -- 决定 Lynx 是否需要原生 portal 模式
5. **跳过静态 VNode** -- 它是编译器优化，非面向用户的功能；
   `createStaticVNode` 的废弃没有实际影响
