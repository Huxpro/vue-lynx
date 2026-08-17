# 计划: 将 vOn 指令测试添加到 upstream-tests

## 背景

upstream-tests 目前仅包含 10 个 runtime-dom 测试文件中的 5 个,全部聚焦于 `patchProp` 变体。`directives/vOn.spec.ts` 测试非常适合添加,因为:
- `withModifiers` 和 `withKeys` 已在 `@vue/runtime-dom` 中实现,可以从 bridge 中重新导出
- 测试使用 `patchEvent()`(事件版 patchProp 的薄封装) + `dispatchEvent` -- 与 patchEvents 测试相同的模式
- 不需要完整的渲染流水线

`vShow` **不在范围内** -- 其所有测试都使用 `render(h(component), root)`,这需要 bridge 不支持的完整组件渲染流水线。

## 当前 forwarder 的问题

当前的 bridge forwarder 分发 `new Event(papiKey)` -- 一个没有任何属性的裸事件。vOn 测试依赖原始事件属性进行修饰符检查(`withModifiers(['ctrl'])` 检查 `e.ctrlKey`,`withModifiers(['stop'])` 调用 `e.stopPropagation()` 等)。

## 变更

### 1. 修复 forwarder 以保留原始事件属性

**文件:** `upstream-tests/src/lynx-runtime-dom-bridge.ts` (第 275 行)

修改 forwarder,使其用原始事件直接调用 `eventMap` 中的 PAPI 监听器:

```typescript
const forwarder = ((evt: Event) => {
  const papiListener = (el as any).eventMap?.[targetPapiKey];
  if (typeof papiListener === 'function') {
    papiListener(evt);
  }
}) as EventListener;
```

这会保留所有事件属性(ctrlKey、button、key、target/currentTarget、stopPropagation、preventDefault),同时仍然走 ops 流水线: SET_EVENT/REMOVE_EVENT 通过 `__AddEvent` 在 eventMap 中注册监听器,forwarder 调用该监听器 → `publishEvent(sign, evt)` → 事件注册表 → 用户处理函数。

现有的 patchEvents 测试不受影响 -- 它们只检查调用次数,不检查事件属性。

### 2. 在 bridge 中添加 `patchEvent` 导出

**文件:** `upstream-tests/src/lynx-runtime-dom-bridge.ts`

vOn 测试从 `../../src/modules/events` 导入 `patchEvent`。在其他导出旁边添加一个薄封装:

```typescript
export function patchEvent(
  el: Element,
  rawName: string,
  prevValue: unknown,
  nextValue: unknown,
  _instance?: unknown,
): void {
  patchProp(el, rawName, prevValue, nextValue);
}
```

### 3. 使用 `@vue/runtime-dom` 中的真实 `withModifiers`/`withKeys`

**文件:** `upstream-tests/src/lynx-runtime-dom-bridge.ts`

vue-lynx 的 `withModifiers`/`withKeys` 是桩实现,直接返回 `fn` 而不应用任何修饰符。bridge 必须从 `@vue/runtime-dom` 导入真实实现:

```typescript
export { withModifiers, withKeys } from '@vue/runtime-dom';
```

### 4. 添加 `../../src/modules/events` 的导入重写

**文件:** `upstream-tests/vitest.dom.config.ts`

vOn 测试位于 `__tests__/directives/` 目录下,因此导入路径为 `../../src/modules/events`(向上两级)。在 `rewriteRuntimeDomImportsPlugin` 中添加重写规则:

```typescript
// '../../src/modules/events' → bridge (tests in __tests__/directives/)
result = result.replace(
  /from\s+['"]\.\.\/\.\.\/src\/modules\/events['"]/g,
  `from '${bridgePath}'`,
);
```

### 5. 将 vOn 添加到包含的测试列表

**文件:** `upstream-tests/vitest.dom.config.ts`

将 `'directives/vOn'` 添加到 `includedTests` 数组中。

## 修改的文件

| 文件 | 变更 |
|------|--------|
| `upstream-tests/src/lynx-runtime-dom-bridge.ts` | 修复 forwarder; 添加 `patchEvent` 导出; 使用 `@vue/runtime-dom` 中的真实 `withModifiers`/`withKeys` |
| `upstream-tests/vitest.dom.config.ts` | 添加 `../../src/modules/events` 重写; 将 `directives/vOn` 添加到 includedTests |

## 验证

1. `cd upstream-tests && pnpm test:dom` -- 所有现有 21 个测试 + 8 个新 vOn 测试通过(共 29 个)
2. `cd testing-library && pnpm test` -- 不受影响(32 个测试通过)
3. 无需 skiplist 条目 -- 所有 8 个 vOn 测试通过
