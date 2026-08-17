# Lynx Element PAPI: Vue 研究中的设计发现

**状态**: 后续计划 -- 记录发现以推动引擎/API 改进
**日期**: 2025-03-11
**背景**: 在 Vue 3 Lynx 实现过程中，我们发现了 Lynx Element PAPI
（平台 API）中的若干不一致性和未文档化的约束。这些发现影响所有 PAPI
消费者（React、Vue、未来的框架），应该在引擎/API 层面解决。

---

## 发现 1: `parentComponentUniqueId` -- 静默的语义陷阱

**严重性**: 严重（在 Web 上崩溃，在 Native 上可能存在静默的错误行为）
**提交**: `2a65fa57`（fix: pass parentComponentUniqueId=1）

### 问题

所有类型化的元素创建器（`__CreateView`、`__CreateText`、`__CreateImage`、
`__CreateScrollView`、`__CreateList`）都将 `parentComponentUniqueId` 作为
第一个（通常也是唯一的）参数。这个名称具有误导性 -- 它不是
父元素的 ID，而是用于事件路由的**组件作用域 ID**。

- **Native PAPI**: 静默容忍不正确的值（例如 `0`）。元素正常渲染，
  但组件作用域的事件分发可能路由到错误的组件。不崩溃，不警告。
- **Web PAPI**: 在事件分发时崩溃。实现将此值存储为 DOM 属性
  （`l-p-comp-uid`），然后在任何事件上使用它来索引
  `lynxUniqueIdToElement[uid]` 并使用非空断言:
  ```typescript
  // web-mainthread-apis/ts/createMainThreadGlobalThis.ts:231-232
  const parentComponent = lynxUniqueIdToElement[parentComponentUniqueId]! // uid=0 时为 undefined
    .deref()!; // TypeError: Cannot read properties of undefined
  ```

### 差异详情

| 行为                    | Native                            | Web                                                                       |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `__CreateView(0)`       | 创建元素，正常工作                | 创建元素，正常工作                                                        |
| 该元素上的事件          | 分发（可能是错误的作用域）        | **崩溃** -- `lynxUniqueIdToElement[0]` 为 `undefined`                     |
| `__CreatePage` 内部     | 推测内部处理了 uid               | 调用 `__CreateElement('page', 0)` 然后**覆写**属性为 `'1'`               |

### 根本原因

`lynxUniqueIdToElement` 数组从 1 开始索引:

- 索引 0: **从不填充**（空槽位）
- 索引 1: 页面根元素（由 `__CreatePage` 设置）
- 索引 2+: 常规元素

`__CreatePage` 知道这一点 -- 它内部传递 `0` 但立即覆写属性为 `'1'`。
但没有任何机制阻止外部调用者传递 `0`，也没有验证。

### 建议

1. **Web PAPI 应添加保护**而非使用非空断言:
   ```typescript
   const parentComponent = lynxUniqueIdToElement[parentComponentUniqueId]
     ?.deref();
   if (!parentComponent) {
     console.warn(
       `[PAPI] Invalid parentComponentUniqueId: ${parentComponentUniqueId}`,
     );
     // 回退到页面根元素或跳过组件作用域分发
   }
   ```

2. **类型声明应文档化约束**:
   ```typescript
   /**
    * @param parentComponentUniqueId - 用于事件路由的组件作用域 ID。
    *   必须 >= 1。页面根作用域使用 1。索引 0 是保留的/无效的。
    */
   function __CreateView(parentComponentUniqueId: number): ElementRef;
   ```

3. **考虑使用品牌类型**以防止意外误用:
   ```typescript
   type ComponentUniqueId = number & { __brand: 'ComponentUniqueId' };
   ```

---

## 发现 2: `__SetCSSId` -- 数组与单元素的类型不匹配

**严重性**: 中（类型错误，有变通方案）
**文件**: `packages/vue/main-thread/src/shims.d.ts`（包含 `TODO(huxpro)`）

### 问题

同一函数存在三种不同的类型声明:

| 来源                                   | 签名                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `@lynx-js/type-element-api`（上游）     | `__SetCSSId(node: ElementRef, cssId: number)` -- **单元素**                |
| Web PAPI（`web-mainthread-apis`）       | `__SetCSSId(elements: HTMLElement[], cssId: number)` -- **仅数组**         |
| React 运行时（`types.d.ts`）            | `__SetCSSId(e: FiberElement \| FiberElement[], cssId: number)` -- **联合类型** |

### 运行时行为

Web PAPI 实现无条件地进行迭代:

```typescript
// web-mainthread-apis/ts/pureElementPAPIs.ts:269-278
export const __SetCSSId: SetCSSIdPAPI = (elements, cssId, entryName) => {
  for (const element of elements) { // 如果不可迭代则崩溃
    element.setAttribute(cssIdAttribute, cssId + '');
  }
};
```

传递单个元素（如上游类型所示）在 native 上可以工作，但
**在 web 上崩溃**，因为裸的 `ElementRef` 不可迭代。

### 当前变通方案

Vue 包装在数组中并在 `shims.d.ts` 中覆盖类型:

```typescript
__SetCSSId([el], 0); // 在 native 和 web 上都能工作
```

### 建议

修复 `@lynx-js/type-element-api` 以匹配实际情况:

```typescript
function __SetCSSId(
  node: ElementRef | ElementRef[],
  cssId: number,
  entryName?: string,
): void;
```

或者更好的做法是 -- 规范化 web PAPI 以同时接受两种形式（内部处理单元素），
这样下游消费者就不需要包装。

---

## 发现 3: `__CreateList` -- 未文档化的回调契约

**严重性**: 中（无类型、无文档，必须从 React 逆向工程）

### 问题

`__CreateList` 需要具有非常特定签名的回调函数，
这些在 `@lynx-js/type-element-api` 中没有文档:

```typescript
__CreateList(
  parentComponentUniqueId: number,
  componentAtIndex: (list, listID, cellIndex, operationID) => number | undefined,
  enqueueComponent: (...args) => void,
  options: {},
  componentAtIndexes: (list, listID, cellIndexes[], operationIDs[]) => void,
)
```

这些回调在原生列表需要渲染单元格时被调用。
契约包括:

- 必须在回调内调用 `__AppendElement(list, item)`
- 必须调用 `__FlushElementTree(item, { triggerLayout, operationID, elementID, listID })`
- 必须从 `componentAtIndex` 返回 `__GetElementUniqueID(item)`

这是从 React 的快照编译输出中逆向工程得到的。没有类型定义，
没有文档，也没有违反契约时的错误消息。

### 建议

在 `@lynx-js/type-element-api` 中添加适当的 TypeScript 类型和 JSDoc。

---

## 发现 4: 平台信息属性 -- 静默的重复计数

**严重性**: 高（导致"duplicated item-key"错误）

### 问题

列表项属性如 `item-key`、`estimated-main-axis-size-px`、
`reuse-identifier`、`full-span`、`sticky-top`、`sticky-bottom`、`recyclable`
存在一个隐藏约束: 它们只能通过 `update-list-info` 的
`insertAction` 设置，**绝不能**通过直接在元素上调用 `__SetAttribute` 设置。

两种方式同时设置会导致原生列表重复计数项目，产生
`Error for duplicated list item-key` 错误。

这个约束在 PAPI 类型中没有任何文档。它是通过阅读 React 的
`snapshot/platformInfo.ts` 发现的，该文件维护了一个硬编码的
这些属性名集合。

### 建议

1. 在 PAPI 类型中文档化哪些属性是"仅平台信息"
2. 考虑让 `__SetAttribute` 对列表子元素上的这些键发出警告/空操作
3. 或提供专用的 `__SetListItemInfo` API，而不是用魔术键
   `update-list-info` 来重载 `__SetAttribute`

---

## 发现 5: 类型化与通用元素创建器

**严重性**: 中（功能降级但无错误）

### 问题

`__CreateElement("view", uid)` 创建的元素在功能上弱于
`__CreateView(uid)`。具体来说:

- `overflow: hidden` 在 `__CreateElement("view", ...)` 上不会裁剪子元素
- Native Lynx 仅通过类型化创建器设置类型特定的内部机制（Image 的硬件加速解码、
  ScrollView 的滚动物理引擎）

没有警告或错误。元素看起来能工作，但某些 CSS 属性或平台优化会静默失效。

React 完全避免了这个问题，因为快照编译始终生成类型化创建器调用。
但任何动态渲染器（Vue 或未来的框架）必须维护自己的标签名到类型化创建器的映射。

### 建议

1. `__CreateElement` 应该在内部对已知类型分发到类型化创建器，
   这样调用者不需要维护映射
2. 或至少文档化哪些元素类型需要类型化创建器
3. 考虑为已知类型废弃基于标签的 `__CreateElement`

---

## 发现 6: `__FlushElementTree` -- 重载的语义

**严重性**: 低（能工作，但 API 令人困惑）

### 问题

`__FlushElementTree` 承担双重职责:

- **无参数 / 页面参数**: 将所有待处理的变更刷新到原生层
- **带选项 `{ triggerLayout, operationID, elementID, listID }`**: 为原生列表的
  `componentAtIndex` 回调刷新特定列表项

这是语义上不同的操作共享同一个函数。选项对象的格式未文档化。

### 建议

考虑拆分为 `__FlushElementTree()` 和
`__FlushListItem(element, options)` 以提高清晰度。

---

## 汇总表

| # | 问题                          | Native         | Web                     | 修复位置                                   |
| - | ----------------------------- | -------------- | ----------------------- | ------------------------------------------ |
| 1 | `parentComponentUniqueId=0`   | 静默           | **崩溃**                | `web-mainthread-apis` + `type-element-api` |
| 2 | `__SetCSSId` 数组与单元素     | 可用（单元素） | **崩溃**（需要数组）    | `type-element-api` + `web-mainthread-apis` |
| 3 | `__CreateList` 回调           | 可用           | 可用                    | `type-element-api`（添加类型）             |
| 4 | 平台信息重复设置              | **错误**       | 未测试                  | `type-element-api`（文档化）               |
| 5 | `__CreateElement` 与类型化    | **降级**       | 可用                    | 引擎（`__CreateElement` 分发）             |
| 6 | `__FlushElementTree` 重载     | 可用           | 可用                    | API 设计（拆分函数）                       |

---

## 行动项

- [ ] 在 `@lynx-js/type-element-api` 上为发现 1、2、3 提交 issue
- [ ] 在 `@lynx-js/web-mainthread-apis` 上为发现 1 提交 issue（添加保护）
- [ ] 在引擎上为发现 5 提交 issue（`__CreateElement` 类型化分发）
- [ ] 在 PAPI 文档中文档化平台信息属性（发现 4）
- [ ] 考虑针对发现 3、5、6 的 API v2 设计
