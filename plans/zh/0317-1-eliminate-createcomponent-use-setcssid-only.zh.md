# 方案：移除 `__CreateComponent`，仅使用 `__SetCSSId`（对齐 ReactLynx 3.0）

**日期**: 2025-03-17
**状态**: 已完成

---

## 背景：为什么添加了 `__CreateComponent`

### 症状（之前的修复）

- Lynx 元素在屏幕上正确渲染
- DevTool CLI/MCP CDP 返回了正确的 CSS 数据
- 但 DevTool **面板不显示任何元素的 CSS 选择器**

DevTool 团队的反馈：
> `parent_component_unique_id_` 传成了 1，应该传 10 的。这个错误会导致 DevTool 找 element 的 parent component 的时候找不到，而 parent component 与存样式表相关，找不到 parent component 会导致无法获取到样式数据。

### 两条独立的 CSS 管线

有**两条独立的管线**使用 `parent_component_unique_id_`：

#### 管线 1：CSS 渲染（元素 -> 样式应用）

```
FiberElement::GetRelatedCSSFragment()          // fiber_element.cc:326-350
  if (css_id_ != kInvalidCssId) {              // kInvalidCssId = -1
    if (!css_style_sheet_manager_) {
      // 回退：从父组件继承
      css_style_sheet_manager_ = GetParentComponentElement()->style_sheet_manager();
    }
    return css_style_sheet_manager_->GetCSSStyleSheetForComponent(css_id_);
  }
```

**`__SetCSSId` 在这里就足够了。** `FiberSetCSSId` 直接设置 `css_style_sheet_manager_` 和 `css_id_`。`GetParentComponentElement()` 回退永远不会触达。
**CSS 渲染不需要 `__CreateComponent` 即可工作。**

#### 管线 2：DevTool CSS 检查器（元素 -> 面板展示）

```
CDP: getMatchedStylesForNode(nodeId)
  -> ElementHelper::GetMatchedCSSRulesOfNode()       // element_helper.cc:459
    -> ElementInspector::GetMatchedStyleSheet(el)     // element_inspector.cc:581
      -> inspector_attribute->style_root_             // <- 必须非空
        -> GetStyleSheetMap(style_root)               // 获取 CSS 规则用于展示
```

`style_root_` 在 `InitStyleRoot()`（`element_inspector.cc:499-505`）中填充：

```cpp
// InitStyleRoot 显式排除 page 元素：
if (element->GetTag() == "page") {
  return;  // style_root_ 保持 null
}
auto comp = GetCSSStyleComponentElement(element);
if (comp != nullptr && Type(comp) == InspectorElementType::COMPONENT) {
  inspector_attribute->style_root_ = StyleValueElement(comp);
}
```

**`InitStyleRoot()` 对 `tag == "page"` 有一个提前返回**，但这不是完整的图景。`PrepareComponentNodeForInspector()`（`element_manager.cc:441`）在检查器设置路径中单独处理 PageElement：

```cpp
// element_manager.cc
RunDevToolFunction(SetStyleValueElement, std::make_tuple(style_value, component));
RunDevToolFunction(SetStyleRoot, std::make_tuple(component, style_value));
if (component->GetTag() == kElementPageTag) {
  // 通过 PrepareComponentNodeForInspector 也为 page 设置 style_root_
  RunDevToolFunction(SetStyleRoot, std::make_tuple(component, style_value));
}
```

**关键**：**PageElement 是 ComponentElement 的子类**（继承链：
`PageElement -> ComponentElement -> WrapperElement -> FiberElement -> Element`）。
`GetInspectorTagElementTypeMap()` 将 `"page"` 映射到 `InspectorElementType::COMPONENT`
（而非 `DOCUMENT`）。因此 `PrepareComponentNodeForInspector()` 对 PageElement 的处理与对任何 ComponentElement 相同，创建 stylevalue 子节点并设置 `style_root_`。

| 管线 | 需要 ComponentElement？ | `__SetCSSId` 是否足够？ |
|----------|------------------------|-------------------------|
| CSS 渲染 | 否 | **是** |
| DevTool CSS 面板 | 否（PageElement 是 ComponentElement 的子类；`PrepareComponentNodeForInspector` 已处理） | DevTool 不需要 |

---

## 目标

移除 `__CreateComponent` 的权宜之计，仅依赖 `__SetCSSId` 处理 CSS，
与 ReactLynx 3.0 的架构对齐。DevTool CSS 面板继续工作，因为
PageElement 是 ComponentElement 的子类 -- 无需权宜之计。

---

## 上下文：ReactLynx 3.0 如何在不用 `__CreateComponent` 的情况下处理 CSS

### ReactLynx snapshot runtime（`~/github/lynx-stack/packages/react/runtime/src/snapshot.ts`）

ReactLynx 3.0 **从不调用 `__CreateComponent`**。其 CSS 设置为：

1. Snapshot `create()` 通过 `__CreateView(parentComponentUniqueId)` 等创建元素
2. 创建后调用 `__SetCSSId(this.__elements, cssId, entryName)`（第 310-325 行）
3. 结束 -- 没有 ComponentElement，没有组件层级

`FiberSetCSSId` 代码中有一条注释确认了这一架构转变：
> 由于此 API 目前仅在 RL3.0 中使用，且 **RL3.0 在此之前不依赖 `ComponentElement`**，在 >= 2.17 版本中将引入不兼容变更。

### `__SetCSSId` 在原生端的行为（`~/github/lynx/core/runtime/bindings/lepus/renderer_functions.cc:4172-4217`）

```cpp
// FiberSetCSSId 实现：
std::string entry_name = tasm::DEFAULT_ENTRY_NAME;  // 未传时为 "__Card__"
if (argc > 2) entry_name = arg2->StdString();

std::shared_ptr<CSSStyleSheetManager> style_sheet_manager =
    self->style_sheet_manager(entry_name);

// 对每个元素：
element->set_style_sheet_manager(style_sheet_manager);  // 设置 css_style_sheet_manager_
element->SetCSSID(static_cast<int32_t>(css_id));        // 设置 css_id_
```

关键：它直接在元素上设置 `css_style_sheet_manager_` 和 `css_id_`**两者**。

### ReactLynx 根 snapshot：也在 page 上调用 `__SetCSSId`

```ts
['root', {
  create() { return [__page!]; },
  cssId: 0,  // <- cssId=0，所以调用 __SetCSSId([__page], 0)
}]
```

ReactLynx 显式地在 page 元素本身上设置 CSS 作用域。vue-lynx 现在也采用同样做法。

---

## 实现（已完成）

### 变更内容

| 文件 | 变更 |
|------|--------|
| `main-thread/src/entry-main.ts` | 移除 `__CreateComponent`；添加 `__SetCSSId([page], 0)`；将 page（而非 component）存储为 `elements[1]` |
| `main-thread/src/element-registry.ts` | 将 `rootComponentUniqueId` 重命名为 `pageUniqueId` |
| `main-thread/src/ops-apply.ts` | 使用 `pageUniqueId` 创建元素 |
| `main-thread/src/list-apply.ts` | 使用 `pageUniqueId` 创建 `__CreateList` |
| `main-thread/src/shims.d.ts` | 移除 `__CreateComponent` 类型声明 |
| `testing-library/setup.ts` | 移除 `__CreateComponent` 桩函数 |

### 结果 DOM 结构

```
page（通过 __SetCSSId 设置了 css_style_sheet_manager_）
  +- [vue 元素]（每个通过 __SetCSSId 设置了 css_style_sheet_manager_）
```

### 意外收益：CSS `%` 单位现在在 Lynx for Web 中可用了

移除 `__CreateComponent` 修复了一个 `height: 100%` / `width: 100%` 不生效的布局 bug。之前中间的 `<x-view>` ComponentElement 有 `height: auto`，破坏了 `%` 解析链：

```
之前:  page (height:100%) -> <x-view component> (height:auto) -> content (height:100% -> 0)
之后:  page (height:100%) -> content (height:100% -> 正常工作)
```

---

## 研究结论

### 任务 1：RL3.0 DevTool CSS 状态
RL3.0 DevTool 可以工作，因为 PageElement 是 ComponentElement 的子类。`PrepareComponentNodeForInspector()`
自动为 PageElement 创建 stylevalue 子节点并设置 `style_root_`。没有缺口。

### 任务 2：是否需要引擎端修复？
不需要。现有引擎已通过继承链正确处理 PageElement。
不需要修改 `InitStyleRoot` 或相关代码。

### 任务 3：PageElement 能否满足类型检查？
可以 -- 它已经满足了。`GetInspectorTagElementTypeMap()` 将 `"page"` 映射到
`InspectorElementType::COMPONENT`。`InitStyleRoot` 对 `tag == "page"` 的提前返回
无关紧要，因为 `PrepareComponentNodeForInspector` 通过单独路径处理 PageElement（而非 `InitStyleRoot`）。

### 方案 A/B/C：都不需要
原始方案 A/B/C 都建立在一个实际不存在的 DevTool 缺口前提之上。
`__CreateComponent` 解决的是一个虚构的问题。正确的解决方案就是
直接移除它。

### `__SetCSSId` 的 entryName
不带 `entryName` 的 `__SetCSSId([el], 0)` 使用 `DEFAULT_ENTRY_NAME = "__Card__"`。
对 vue-lynx 来说这是正确的，因为 CSS 在默认 entry 下加载。

---

## 验证

- **单元测试**: 32/32 通过（6 个测试文件）
- **包构建**: `pnpm build` -- 成功
- **示例构建**: `examples/basic` -- 成功，web 和 lynx 两个 bundle 都正常
- **附带效果**: CSS `%` 单位现在在 Lynx for Web 中可用了（见下文）

---

## 关键常量和值

| 常量 | 值 | 位置 |
|----------|-------|----------|
| `kInvalidCssId` | `-1` | `core/renderer/utils/base/tasm_constants.h:55` |
| `DEFAULT_ENTRY_NAME` | `"__Card__"` | `FiberSetCSSId` 未传 entryName 时使用 |
| `InspectorElementType::DOCUMENT` | `0` | 未知 tag 的默认值 |
| `InspectorElementType::COMPONENT` | `3` | "page" 和 "component" tag |
| `PAGE_ROOT_ID` | `1` | vue-lynx shadow element 的 page 根节点 ID |

## 关键文件

| 文件 | 用途 |
|------|---------|
| `~/github/lynx/core/runtime/bindings/lepus/renderer_functions.cc:4172` | `FiberSetCSSId` -- 设置 `css_style_sheet_manager_` + `css_id_` |
| `~/github/lynx/core/renderer/dom/fiber/fiber_element.cc:326` | `GetRelatedCSSFragment()` -- CSS 渲染管线 |
| `~/github/lynx/devtool/lynx_devtool/element/element_inspector.cc:499` | `InitStyleRoot()` -- **DevTool 的关键断点** |
| `~/github/lynx/devtool/lynx_devtool/element/element_inspector.cc:798` | `GetCSSStyleComponentElement()` |
| `~/github/lynx/devtool/lynx_devtool/element/element_inspector.cc:581` | `GetMatchedStyleSheet()` -- 依赖 `style_root_` |
| `~/github/lynx/core/inspector/style_sheet.h:83` | `InspectorElementType` 枚举 |
| `~/github/lynx-stack/packages/react/runtime/src/snapshot.ts:310` | ReactLynx `__SetCSSId` 用法 |
| `~/github/lynx/core/renderer/dom/element_manager.cc:441` | `PrepareComponentNodeForInspector()` |
