# 修复: DevTool CSS 面板不显示选择器 (parent_component_unique_id_ Bug)

**状态**: 已实现
**日期**: 2026-03-13
**分支**: Huxpro/fix-parent-comp-id

## 问题

- Lynx 元素在屏幕上正确渲染
- DevTool CLI/MCP CDP 返回正确的数据
- 但 DevTool **面板不显示任何元素的 CSS 选择器**

### 根因 (来自原生 C++ 源码分析)

DevTool CSS 检查流水线要求每个元素都有一个有效的 **ComponentElement** 祖先。调用链如下:

```
element.parent_component_unique_id_
  → ResolveParentComponentElement() 沿 DOM 树向上遍历
    → 找到 ComponentElement (由 __CreateComponent 创建)
      → ComponentElement.style_sheet_manager()
        → GetCSSStyleSheetForComponent(css_id) → CSSFragment
          → StyleResolver::GetCSSMatchedRule() → 匹配的选择器
            → DevTool 面板显示 CSS 规则
```

**vue-lynx 将所有元素创建时的 `parentComponentUniqueId` 硬编码为 `1`**(页面根节点)。但页面根节点(由 `__CreatePage` 创建)是一个 **PageElement**,而非 **ComponentElement**。它缺少 CSS 解析所需的 `style_sheet_manager()`。`FiberElement::GetRelatedCSSFragment()` 中的 C++ 代码(`fiber_element.cc:326-350`)如下:

```cpp
css_style_sheet_manager_ =
    static_cast<ComponentElement*>(GetParentComponentElement())
        ->style_sheet_manager();
```

当 `parent_component_unique_id_ = 1` 解析到 PageElement(在 Fiber 模式下它不是 ComponentElement)时,查找失败 → 没有 CSS fragment → **DevTool 中没有选择器**。

### ReactLynx 的不同做法

ReactLynx 的 snapshot 代码为每个 React 组件调用 `__CreateComponent(parentUniqueId, componentId, cssId, entryName, name, path, config, info)`。这会在原生 C++ 层创建一个 **ComponentElement**,包含:
- `component_id_`、`component_css_id_`、`entry_name_`
- 从 `entry_name` 初始化的 `css_style_sheet_manager_` -- **CSS fragment 存储的地方**
- 在 `ElementManager::RecordComponent()` 中注册

然后所有子元素使用该组件的 unique ID(例如 `10`)作为 `parentComponentUniqueId` 创建,这样 DevTool 就可以追踪整个调用链。

### 关键原生 C++ 文件 (~/github/lynx)
- `core/renderer/dom/fiber/fiber_element.h` -- `parent_component_unique_id_` 字段 (第 990 行)
- `core/renderer/dom/fiber/fiber_element.cc` -- `GetRelatedCSSFragment()` (第 326 行), `ResolveParentComponentElement()` (第 274 行)
- `core/runtime/bindings/lepus/renderer_functions.cc` -- `FiberCreateComponent()` (第 2384 行)
- `core/renderer/dom/element_manager.cc` -- `PrepareComponentNodeForInspector()` (第 441 行)

### 关键 lynx-stack Web PAPI 文件 (~/github/lynx-stack)
- `packages/web-platform/web-mainthread-apis/ts/createMainThreadGlobalThis.ts` -- `__CreateComponent` 实现 (第 486 行)
- `packages/web-platform/web-constants/src/types/MainThreadGlobalThis.ts` -- `CreateComponentPAPI` 类型

---

## 解决方案

### 设计决策: 组件作为 DOM 祖先

`ResolveParentComponentElement()` **沿 DOM 树向上**遍历,查找 `impl_id()` 与 `parent_component_unique_id_` 匹配的祖先。因此 ComponentElement 必须是所有 Vue 渲染元素的 **DOM 祖先**。

**方案**: 在 `renderPage` 中创建一个根 ComponentElement,将其追加到页面,并将其存储为 `elements[PAGE_ROOT_ID]`,这样所有后台线程的 INSERT 操作在以根节点为目标时实际上会插入到该组件中。这使得该组件成为每个 Vue 元素的 DOM 祖先。

### 变更

#### 步骤 1: 添加 `__CreateComponent` 类型声明

**文件**: `main-thread/src/shims.d.ts`

在 `declare global {}` 中添加了 `__CreateComponent` PAPI 声明。

#### 步骤 2: 在 element-registry 中添加根组件 unique ID

**文件**: `main-thread/src/element-registry.ts`

导出了一个可变的 `rootComponentUniqueId` 变量(默认值为 `1`),并提供了 `setRootComponentUniqueId()` setter。

#### 步骤 3: 在 renderPage 中创建根 ComponentElement

**文件**: `main-thread/src/entry-main.ts`

在 `renderPage` 中,创建页面之后:
1. 以页面的 unique ID 作为父节点调用 `__CreateComponent`
2. 将组件追加到页面
3. 将组件(而非页面)存储为 `elements[PAGE_ROOT_ID]`
4. 通过 setter 设置 `rootComponentUniqueId`
5. 以页面元素(实际的树根)进行 flush

#### 步骤 4: 在元素创建中使用 rootComponentUniqueId

**文件**: `main-thread/src/ops-apply.ts`

在 `createTypedElement` 和 `CREATE_TEXT` 中将硬编码的 `1` 替换为 `rootComponentUniqueId`。在 `resetMainThreadState()` 中添加 `setRootComponentUniqueId(1)` 以确保测试状态干净。

#### 步骤 5: 在列表创建中使用 rootComponentUniqueId

**文件**: `main-thread/src/list-apply.ts`

在 `__CreateList` 中将硬编码的 `1` 替换为 `rootComponentUniqueId`。

#### 步骤 6: 测试桩

**文件**: `testing-library/setup.ts`

添加了 `__CreateComponent` 桩(创建一个 `<component>` 元素),因为 `@lynx-js/testing-environment` 未实现此 PAPI。

## 验证

1. **构建**: `pnpm build` -- 无类型错误
2. **单元测试**: `pnpm test` -- 全部 31 个测试通过
3. **示例应用**: `examples/basic` 端到端构建成功
4. **DevTool**: 将 DevTool 连接到运行中的示例,选择一个元素,验证 CSS 选择器出现在 Styles 面板中
5. **事件**: 验证 tap/click 事件仍能正确分发
