# Vue Lynx 原生 `<list>` 元素支持

## 范围

在 Vue Lynx 的主线程 ops 执行器（`ops-apply.ts`）中支持原生 `<list>` 元素。启用瀑布流、流式和单列列表布局，使用 Lynx 的原生回收和懒加载基础设施。

## 背景

Lynx 的 `<list>` 不是一个普通的 DOM 元素 -- 它使用回调驱动的渲染模型，原生列表引擎通过 `componentAtIndex` 按需请求条目。React Lynx 通过 `__CreateList()` PAPI（而非 `__CreateElement('list', 0)`）创建列表元素，并通过 `__SetAttribute(list, 'update-list-info', ...)` 通知原生引擎条目变化。

Vue Lynx 必须在主线程侧复制这个模式，因为 BG 线程的 Vue 渲染器将 `<list>` 当作普通元素处理（创建 ShadowElement、插入子元素、设置 props）。

## 问题

Vue 的 `mountElement` 顺序是：createElement → mountChildren → patchProp → insert。这意味着：

1. `<list>` 元素被创建
2. 所有 `<list-item>` 子元素被创建并插入到列表中
3. `list-type`、`span-count` 等 props 被设置在列表上
4. 列表被插入到其父元素中

如果我们直接使用 `__CreateElement('list', 0)` 和 `__AppendElement`，条目会以错误的尺寸渲染（全宽而非列宽），因为原生布局引擎不知道这是一个托管列表。

## 架构

```
BG 线程（Vue 渲染器）                         MT 线程（ops-apply.ts）
┌────────────────────────────┐                ┌─────────────────────────────────┐
│ ShadowElement 树：          │                │ 1. CREATE 'list'                │
│   <list>                   │                │    → __CreateList(0, callbacks) │
│     <list-item key="0"/>   │   ops 缓冲区   │    → 记录到 listElementIds     │
│     <list-item key="1"/>   │ ─────────────► │                                │
│     ...                    │                │ 2. INSERT 子元素到 list         │
│   </list>                  │                │    → 收集到 listItems[]        │
│                            │                │    （不调用 __AppendElement）   │
│ Props: list-type, span-    │                │                                │
│ count, item-key 作为       │                │ 3. SET_PROP 'item-key'          │
│ SET_PROP ops 发送          │                │    → 记录到 itemKeyMap         │
└────────────────────────────┘                │                                │
                                              │ 4. 所有 ops 处理完毕后：        │
                                              │    → 构建 insertAction[]       │
                                              │    → __SetAttribute(list,       │
                                              │      'update-list-info', {...}) │
                                              │    → __FlushElementTree()       │
                                              │                                │
                                              │ 5. 原生列表回调：               │
                                              │    componentAtIndex(list, ID,   │
                                              │      cellIndex, opID)           │
                                              │    → __AppendElement(list,item) │
                                              │    → __GetElementUniqueID(item) │
                                              │    → __FlushElementTree(item,   │
                                              │        {triggerLayout:true,...}) │
                                              │    → return sign                │
                                              └─────────────────────────────────┘
```

## 实现细节

### 模块级状态（`ops-apply.ts`）

```typescript
/** 每个列表：用于 componentAtIndex 的有序子元素 */
interface ListItemEntry {
  el: LynxElement;
  bgId: number;
}
const listItems = new Map<number, ListItemEntry[]>();

/** 是 <list> 元素的 BG 元素 ID */
const listElementIds = new Set<number>();

/** 每个 BG 元素 ID 的 item-key 值（用于 list-item 子元素） */
const itemKeyMap = new Map<number, string>();
```

### CREATE op：检测 `type === 'list'`

```typescript
case OP.CREATE: {
  if (type === 'list') {
    listElementIds.add(id);
    listItems.set(id, []);
    const cbs = createListCallbacks(id);
    el = __CreateList(0, cbs.componentAtIndex, cbs.enqueueComponent, {}, cbs.componentAtIndexes);
    __SetCSSId([el], 0);
  }
}
```

关键：`__CreateList` 接受 3 个回调（componentAtIndex、enqueueComponent、componentAtIndexes）。这些是闭包，捕获 `bgId` 以在 `listItems` 中查找条目。

### INSERT op：收集而非追加

```typescript
case OP.INSERT: {
  if (listElementIds.has(parentId)) {
    // 收集条目 -- 原生列表会通过 componentAtIndex 请求
    const items = listItems.get(parentId);
    if (items) items.push({ el: child, bgId: childId });
  } else {
    // 普通元素：直接追加
    __AppendElement(parent, child);
  }
}
```

### SET_PROP op：跟踪 item-key

```typescript
case OP.SET_PROP: {
  if (el) __SetAttribute(el, key, value);
  if (key === 'item-key') itemKeyMap.set(id, String(value));
}
```

### 后处理 ops：设置 `update-list-info`

在主 switch 循环之后、`__FlushElementTree()` 之前：

```typescript
for (const [bgId, items] of listItems) {
  if (items.length === 0) continue;
  const listEl = elements.get(bgId);
  if (!listEl) continue;
  const insertAction = items.map((entry, j) => ({
    position: j,
    type: 'list-item',
    'item-key': itemKeyMap.get(entry.bgId) ?? String(j),
  }));
  __SetAttribute(listEl, 'update-list-info', {
    insertAction,
    removeAction: [],
    updateAction: [],
  });
}
__FlushElementTree();
```

`update-list-info` 属性告诉原生列表引擎：

- **insertAction**：要添加的条目，包含 position + type + item-key
- **removeAction**：要移除的索引（初始渲染时为空）
- **updateAction**：要更新的条目（初始渲染时为空）

### componentAtIndex 回调

由原生列表在需要渲染 `cellIndex` 位置的条目时调用：

```typescript
const componentAtIndex = (
  list: LynxElement,
  listID: number,
  cellIndex: number,
  operationID: number,
): number | undefined => {
  const items = listItems.get(bgId);
  if (!items || cellIndex < 0 || cellIndex >= items.length) return undefined;
  const item = items[cellIndex]!.el;
  __AppendElement(list, item);
  const sign = __GetElementUniqueID(item);
  __FlushElementTree(item, {
    triggerLayout: true,
    operationID,
    elementID: sign,
    listID,
  });
  return sign;
};
```

### componentAtIndexes 回调（批量）

用于一次批量渲染多个条目：

```typescript
const componentAtIndexes = (
  list: LynxElement,
  listID: number,
  cellIndexes: number[],
  operationIDs: number[],
): void => {
  const items = listItems.get(bgId);
  if (!items) return;
  const elementIDs: number[] = [];
  for (let j = 0; j < cellIndexes.length; j++) {
    const item = items[cellIndexes[j]!]!.el;
    __AppendElement(list, item);
    elementIDs.push(__GetElementUniqueID(item));
  }
  __FlushElementTree(list, {
    triggerLayout: true,
    operationIDs,
    elementIDs,
    listID,
  });
};
```

### PAPI 声明新增（`shims.d.ts`）

```typescript
function __CreateList(
  parentComponentUniqueId: number,
  componentAtIndex: (...args: any[]) => any,
  enqueueComponent: (...args: any[]) => void,
  info?: object,
  componentAtIndexes?: (...args: any[]) => void,
): LynxElement;

function __GetElementUniqueID(e: LynxElement): number;
function __FlushElementTree(e?: LynxElement, options?: object): void;
```

## Vue 模板要求

Lynx `<list>` 中期望**数字类型**的属性必须在 Vue 模板中使用 `v-bind`：

```vue
<!-- 错误：传递字符串 "2" -->
<list span-count="2" list-type="waterfall">

<!-- 正确：传递数字 2 -->
<list :span-count="2" list-type="waterfall">
```

受影响的属性：`span-count`、`column-count`、`estimated-main-axis-size-px`、`preload-buffer-count`、`scroll-event-throttle`、`lower-threshold-item-count`、`upper-threshold-item-count`。

字符串类型的属性如 `list-type`、`scroll-orientation`、`item-key` 无需使用 v-bind。

## 与 React Lynx 的差异

| 方面                   | React Lynx                                                       | Vue Lynx                                                                     |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 列表创建               | 在 hydration 期间于 `snapshot/list.ts` 中调用 `__CreateList`     | 在 CREATE op 期间于 `ops-apply.ts` 中调用 `__CreateList`                     |
| 条目管理               | `ListUpdateInfoRecording` 跟踪插入/删除/更新                    | 在 INSERT ops 期间简单的数组收集                                             |
| 回调更新               | 每次刷新时调用 `__UpdateListCallbacks()`                         | 回调在 `__CreateList` 时设置一次（闭包引用共享的 `listItems`）               |
| 回收                   | 通过 `enqueueComponent` + `gSignMap`/`gRecycleMap` 完整回收      | 无回收（enqueueComponent 是空操作）                                          |
| 条目数量通知           | `update-list-info` 使用增量 diff                                 | `update-list-info` 使用完整插入列表（仅初始渲染）                            |

## 限制与未来工作

1. **无增量更新**：当前实现仅处理初始渲染。列表条目的动态添加/删除（例如无限滚动、过滤）需要带有 `removeAction`/`updateAction` 的增量 `update-list-info`。`listItems` 数组需要在列表父元素的 REMOVE ops 上进行更新。

2. **无回收**：`enqueueComponent` 是空操作。对于非常长的列表，这意味着所有条目都保留在内存中。React Lynx 通过 `gRecycleMap` 回收屏幕外的条目。

3. **无 `__UpdateListCallbacks`**：React 在每次数据更新时调用 `__UpdateListCallbacks` 来刷新回调闭包中的新条目数据。Vue 的闭包引用的是共享的 `listItems` Map，该 Map 是原地修改的，所以目前可以工作，但对于复杂的更新场景可能需要重新审视。

## 修改的文件

| 文件                                              | 变更                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/vue/main-thread/src/ops-apply.ts`       | 添加列表跟踪基础设施、`createListCallbacks()`，修改 CREATE/INSERT/SET_PROP 分支，添加后处理 `update-list-info` 步骤                         |
| `packages/vue/main-thread/src/shims.d.ts`         | 添加 `__CreateList`、`__GetElementUniqueID`，更新 `__FlushElementTree` 签名                                                                |
| `packages/vue/e2e-lynx/src/gallery/*/Gallery.vue` | 修复 `:span-count="2"` 以使用 v-bind 传递数字类型（3 个文件）                                                                              |

## 验证

全部 5 个 gallery 教程条目在 Mac LynxExplorer 模拟器上验证通过：

- `gallery-image-card` -- 单张图片卡片渲染正常
- `gallery-like-card` -- 点击心形 → 变红
- `gallery-list` -- 2 列瀑布流网格，可滚动
- `gallery-scrollbar` -- 滚动条跟踪滚动位置（BG 线程）
- `gallery-complete` -- MTS 滚动条在右边缘可见
