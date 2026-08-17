# Vue 模板 Ref -> NodesRef 实现

## 实现结果

**状态**: 已实现并在 LynxExplorer 上验证。

### 完成内容

1. **MT: `vue-ref-{id}` 选择器属性** (`ops-apply.ts`)
   - 每个非注释元素在 CREATE 和 CREATE_TEXT 处理器中获得 `__SetAttribute(el, 'vue-ref-${id}', 1)`
   - 零传输开销 -- 纯 MT 端操作，无额外 ops

2. **BG: ShadowElement 上的 NodesRef 方法** (`shadow-element.ts`)
   - 8 个方法: `invoke`, `setNativeProps`, `fields`, `path`, `animate`, `playAnimation`, `pauseAnimation`, `cancelAnimation`
   - `_selector` getter: `[vue-ref-{id}]` -- 每个元素的唯一属性选择器
   - `_select()`: `lynx.createSelectorQuery().select(this._selector)`
   - 在 `shims.d.ts` 中定义最小化的 `LynxNodesRef` / `LynxSelectorQuery` 接口（与 `@lynx-js/types` 结构兼容）

3. **从 `@vue/runtime-core` 重新导出 `useTemplateRef`**，通过 `index.ts`

4. **Gallery 端到端迁移** -- 所有 4 个 gallery 入口从手动 `lynx.createSelectorQuery().select('[custom-list-name="..."]')` 迁移到 `useTemplateRef<ShadowElement>('listRef')` + `listRef.value?.invoke(...)`:
   - `GalleryAutoScroll` -- 移除 `declare const lynx`，移除 `custom-list-name` 属性
   - `GalleryScrollbar` -- 同上
   - `GalleryScrollbarCompare` -- 同上
   - `GalleryComplete` -- 同上

5. **测试** -- `ops-coverage.test.ts` 中新增 3 个测试:
   - MT 元素上设置了 `vue-ref-{id}` 属性
   - `ShadowElement` 拥有所有 NodesRef 方法
   - `_selector` 返回正确的属性选择器格式

### 测试结果

- testing-library: 31/31 通过（28 个已有 + 3 个新增）
- vue-upstream-tests: 778/875 通过，97 跳过，0 失败
- LynxExplorer: gallery-autoscroll 的 autoScroll 通过模板 ref 确认可用

### 关键设计决策

- **方法直接放在 ShadowElement 上**（不像 React 那样使用 Proxy 包装器）: Vue 的 `createRenderer` 没有暴露 `setRef` 钩子，因此 ref 赋值返回的就是 `createElement()` 的返回值。将方法添加到 `ShadowElement` 上是惯用做法 -- 就像浏览器 Vue 中 `HTMLElement` 携带 DOM 方法一样。
- **每个元素都设置属性**（不仅仅是被 ref 引用的元素）: 更简单，不需要额外的 BG->MT 信号传递。`vue-ref-{id}` 属性很小，元素本身已经存在。React Lynx 通过按 ref 懒设置 `react-ref-{id}-{idx}`，但 Vue 没有相同的基于快照的 ref 控制机制。
- **Swiper 文件未修改**: 它们使用 `useMainThreadRef` 进行 60fps 的 MT 端操作（对其使用场景来说是正确的模式）。

---

## 背景

目前，Vue Lynx 的模板 ref (`ref="x"`) 返回原始的 `ShadowElement` 对象 -- 轻量级 BG 线程树节点，没有平台 API。用户无法在其上调用 `invoke()`、`setNativeProps()` 等方法。

React Lynx 通过 `RefProxy` 解决此问题 -- 一个 JS Proxy，拦截方法调用并懒代理到 `lynx.createSelectorQuery().select('[react-ref-{id}-{idx}]')`。这之所以可行，是因为 React 通过其快照系统控制 ref 赋值。

Vue 的 `createRenderer` **没有**暴露 `setRef` 钩子 -- ref 赋值发生在 Vue 核心内部，直接赋值 `createElement()` 的返回值。因此我们无法拦截它。取而代之，我们将 `NodesRef` 方法直接添加到 `ShadowElement` 上，使其与 `@lynx-js/types` 的 `NodesRef` 接口结构兼容。

这是惯用做法: 在浏览器 Vue 中，`ref.value` 返回的 `HTMLElement` 携带所有 DOM 方法。`ShadowElement` 就是 Vue Lynx 的 `HTMLElement`。

## MT/BG Ref 对比

|            | BG 模板 Ref（本方案）                                    | MT Ref（已有的 `useMainThreadRef`）                      |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Vue API    | `useTemplateRef<NodesRef>('x')`                          | `useMainThreadRef<T>(init)`                              |
| 绑定方式   | `ref="x"`（Vue 内置）                                    | `:main-thread-ref="mtRef"`                               |
| 返回值     | `ShadowElement`（带 NodesRef 方法）                      | `MainThreadRef`（worklet ref）                           |
| 线程       | BG -> 通过 SelectorQuery 异步跨线程查询                  | MT -> worklet 上下文中同步访问                           |
| 方法       | `.invoke()`, `.setNativeProps()`, `.fields()`, `.path()` | `.current.setStyleProperty()`, `.current.setAttribute()` |
| 执行模型   | 延迟执行 -- 必须调用 `.exec()`                           | 在 worklet 上下文中立即执行                              |
| 使用场景   | 查询元素、触发原生方法、动画                             | 实时 60fps UI 操作                                       |

## React Lynx 与 Vue Lynx 对比

|                 | React Lynx                                                                    | Vue Lynx（本方案）                                          |
| --------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 用户类型        | `useRef<NodesRef>(null)`                                                      | `useTemplateRef<NodesRef>('x')` / `ref<NodesRef>()`         |
| 内部实现        | `RefProxy`（`lifecycle/ref/delay.ts` 中的 JS Proxy 类）                       | ShadowElement 上的 NodesRef 方法（直接添加）                |
| 选择器属性      | `react-ref-{snapshotId}-{expIndex}`（通过 `updateRef` 中的 `__SetAttribute` 设置） | `vue-ref-{elementId}`（在 MT `applyOps` CREATE 处理器中设置） |
| 属性设置时机    | ref 绑定到元素时（懒加载，按 ref）                                            | 每次元素创建时（始终，在 MT 端）                            |
| 延迟执行        | `RefProxy` 延迟任务直到 hydration 完成后                                      | 不需要 -- Vue 立即挂载，元素已就绪                          |
| NodesRef 来源   | `@lynx-js/types`（`NodesRef` 接口）                                           | 相同 -- `ShadowElement` 结构性实现 `NodesRef`               |

## 实现

### 1. 在 MT 元素创建时设置 `vue-ref-{id}` 属性

**文件**: `packages/vue/main-thread/src/ops-apply.ts`

在 `CREATE` 处理器中，创建元素后，为选择器查询设置唯一属性:

```typescript
case OP.CREATE: {
  const id = ops[i++] as number;
  const type = ops[i++] as string;
  let el: LynxElement;
  if (type === '__comment') {
    el = __CreateRawText('');
  } else if (type === 'list') {
    el = createListElement(id);
  } else {
    el = __CreateElement(type, 0);
    __SetCSSId([el], 0);
  }
  elements.set(id, el);
  // 为 BG 线程 NodesRef 查询设置选择器属性
  if (type !== '__comment') {
    __SetAttribute(el, `vue-ref-${id}`, 1);
  }
  break;
}
```

跳过注释节点（`__CreateRawText`）-- 它们不能有属性，用户也不会 ref 它们。
同样为 `CREATE_TEXT` 元素设置（虽然少见但可能发生）。

**无需额外 ops** -- 这纯粹是 MT 端操作，零传输开销。

### 2. 为 ShadowElement 添加 NodesRef 方法

**文件**: `packages/vue/runtime/src/shadow-element.ts`

添加 `declare var lynx` 以访问 `createSelectorQuery`，然后添加方法:

```typescript
declare var lynx: {
  createSelectorQuery(): SelectorQuery;
} | undefined;

export class ShadowElement {
  // ... 已有字段和方法 ...

  /** 唯一标识 MT 上此元素的 CSS 属性选择器 */
  get _selector(): string {
    return `[vue-ref-${this.id}]`;
  }

  private _select(): NodesRef {
    return lynx!.createSelectorQuery().select(this._selector);
  }

  invoke(options: uiMethodOptions): SelectorQuery {
    return this._select().invoke(options);
  }

  setNativeProps(nativeProps: Record<string, unknown>): SelectorQuery {
    return this._select().setNativeProps(nativeProps);
  }

  fields(fields: FieldsParams, callback: FieldsCallback): SelectorQuery {
    return this._select().fields(fields, callback);
  }

  path(callback: PathCallback): SelectorQuery {
    return this._select().path(callback);
  }

  animate(animations: unknown): SelectorQuery {
    return this._select().animate(animations);
  }

  playAnimation(ids: string[] | string): SelectorQuery {
    return this._select().playAnimation(ids);
  }

  pauseAnimation(ids: string[] | string): SelectorQuery {
    return this._select().pauseAnimation(ids);
  }

  cancelAnimation(ids: string[] | string): SelectorQuery {
    return this._select().cancelAnimation(ids);
  }
}
```

类型: 在同一文件（或共享类型文件）中定义最小兼容接口，以避免将 `@lynx-js/types` 作为硬依赖。接口只需匹配 `@lynx-js/types/types/background-thread/nodes-ref.d.ts` 中的方法签名。

### 3. 类型导出

**文件**: `packages/vue/runtime/src/index.ts`

`ShadowElement` 已经被导出。实现本身不需要新的导出。用户使用 `@lynx-js/types` 的 `NodesRef` 来标注 ref 类型（与 React 相同）:

```typescript
import { useTemplateRef } from 'vue-lynx';
import type { NodesRef } from '@lynx-js/types';

const scrollRef = useTemplateRef<NodesRef>('scroll');
```

这之所以可行，是因为 `ShadowElement` 结构性地满足 `NodesRef`（TypeScript 结构类型）。

### 4. 测试更新

**文件**: `packages/vue/testing-library/src/setup.ts`（或新测试文件）

添加测试验证:

- 已挂载元素的 `ref.value` 具有 `invoke`、`setNativeProps` 等方法
- MT 元素上设置了 `vue-ref-{id}` 选择器属性
- 调用 `invoke()` 产生有效的 SelectorQuery 链

在测试环境中，`lynx.createSelectorQuery()` 可能需要一个 stub。

## 修改的文件

| 文件                                         | 修改内容                                                       |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `packages/vue/main-thread/src/ops-apply.ts`  | 在 CREATE/CREATE_TEXT 中添加 `__SetAttribute(el, 'vue-ref-${id}', 1)` |
| `packages/vue/runtime/src/shadow-element.ts` | 添加 NodesRef 方法 + 最小类型接口                                |
| `packages/vue/runtime/src/index.ts`          | 无需修改（ShadowElement 已导出）                                  |

## 面向用户的 API

```vue
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue-lynx';
import { nextTick } from 'vue-lynx';
import type { NodesRef } from '@lynx-js/types';

const scrollRef = useTemplateRef<NodesRef>('scroll');

onMounted(() => {
  nextTick(() => {
    // 元素在 nextTick 后已在 MT 上完全实例化
    scrollRef.value?.invoke({
      method: 'autoScroll',
      params: { rate: 60, start: true },
    }).exec();
  });
});
</script>

<template>
  <scroll-view ref="scroll" class="my-list">
    <!-- 内容 -->
  </scroll-view>
</template>
```

## 验证

1. 在 `packages/vue/runtime` 和 `packages/vue/main-thread` 中执行 `pnpm build` -- 无类型错误
2. 已有测试通过: 在 `packages/vue/testing-library` 和 `packages/vue/vue-upstream-tests` 中执行 `pnpm test`
3. 端到端测试: 添加使用 `ref` + `invoke()` 实现 autoScroll 的 gallery 入口（替换当前的 `lynx.createSelectorQuery().select(...)` 模式）
4. LynxExplorer: 确认通过模板 ref 调用 `invoke({ method: 'autoScroll' })` 正常工作
