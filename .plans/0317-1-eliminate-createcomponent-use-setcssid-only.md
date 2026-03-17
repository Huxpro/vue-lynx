# Plan: Eliminate `__CreateComponent`, Use `__SetCSSId` Only (Align with ReactLynx 3.0)

**Date**: 2025-03-17
**Status**: Implemented ✅ (DevTool CSS panel gap acknowledged — pending engine fix)

---

## Background: Why `__CreateComponent` Was Added

### Symptom (prior fix)

- Lynx elements rendered correctly on screen
- DevTool CLI/MCP CDP returned correct CSS data
- But DevTool **Panel did not show CSS selectors** for any element

Feedback from DevTool team:
> `parent_component_unique_id_` 传成了 1，应该传 10 的。这个错误会导致 devtool
> 找 element 的 parent component 的时候找不到，而 parent component 与存样式表
> 相关，找不到 parent component 会导致无法获取到样式

### Two separate CSS pipelines

There are **two independent pipelines** that use `parent_component_unique_id_`:

#### Pipeline 1: CSS Rendering (element → style application)

```
FiberElement::GetRelatedCSSFragment()          // fiber_element.cc:326-350
  if (css_id_ != kInvalidCssId) {              // kInvalidCssId = -1
    if (!css_style_sheet_manager_) {
      // FALLBACK: inherit from parent component
      css_style_sheet_manager_ = GetParentComponentElement()->style_sheet_manager();
    }
    return css_style_sheet_manager_->GetCSSStyleSheetForComponent(css_id_);
  }
```

**`__SetCSSId` is sufficient here.** `FiberSetCSSId` sets BOTH `css_style_sheet_manager_`
AND `css_id_` directly. The `GetParentComponentElement()` fallback is never reached.
**CSS rendering works without `__CreateComponent`.**

#### Pipeline 2: DevTool CSS Inspector (element → panel display)

```
CDP: getMatchedStylesForNode(nodeId)
  → ElementHelper::GetMatchedCSSRulesOfNode()       // element_helper.cc:459
    → ElementInspector::GetMatchedStyleSheet(el)     // element_inspector.cc:581
      → inspector_attribute->style_root_             // ← MUST be non-null
        → GetStyleSheetMap(style_root)               // retrieves CSS rules for display
```

`style_root_` is populated in `InitStyleRoot()` (`element_inspector.cc:499-505`):

```cpp
// InitStyleRoot explicitly excludes page elements:
if (element->GetTag() == "page") {
  return;  // style_root_ stays null
}
auto comp = GetCSSStyleComponentElement(element);
if (comp != nullptr && Type(comp) == InspectorElementType::COMPONENT) {
  inspector_attribute->style_root_ = StyleValueElement(comp);
}
```

**This requires a ComponentElement ancestor.** `PageElement` has `GetTag() == "page"`,
so it is explicitly excluded. Without a ComponentElement in the ancestor chain,
`style_root_` stays null → no CSS in DevTool panel.

Note: `GetInspectorTagElementTypeMap()` maps `"page"` to `InspectorElementType::COMPONENT`
(not `DOCUMENT`), but `InitStyleRoot` still returns early for page tag regardless of type.

| Pipeline | Needs ComponentElement? | `__SetCSSId` sufficient? |
|----------|------------------------|-------------------------|
| CSS Rendering | No | **Yes** |
| DevTool CSS Panel | **Yes** (for `style_root_`) | No |

---

## Goal

Remove the `__CreateComponent` workaround and rely solely on `__SetCSSId` for CSS,
matching ReactLynx 3.0's architecture — while acknowledging the DevTool CSS panel
gap until the engine is fixed.

---

## Context: How ReactLynx 3.0 Does CSS Without `__CreateComponent`

### ReactLynx snapshot runtime (`~/github/lynx-stack/packages/react/runtime/src/snapshot.ts`)

ReactLynx 3.0 **never calls `__CreateComponent`**. Its CSS setup is:

1. Snapshot `create()` creates elements via `__CreateView(parentComponentUniqueId)` etc.
2. After creation, calls `__SetCSSId(this.__elements, cssId, entryName)` (lines 310-325)
3. That's it — no ComponentElement, no component hierarchy

The `FiberSetCSSId` code has a comment confirming this architecture shift:
> Since this API is currently only in RL3.0, and **RL3.0 does not depend on
> `ComponentElement`** before this, a break will be introduced in versions >= 2.17.

### What `__SetCSSId` does on native (`~/github/lynx/core/runtime/bindings/lepus/renderer_functions.cc:4172-4217`)

```cpp
// FiberSetCSSId implementation:
std::string entry_name = tasm::DEFAULT_ENTRY_NAME;  // "__Card__" if not passed
if (argc > 2) entry_name = arg2->StdString();

std::shared_ptr<CSSStyleSheetManager> style_sheet_manager =
    self->style_sheet_manager(entry_name);

// For each element:
element->set_style_sheet_manager(style_sheet_manager);  // sets css_style_sheet_manager_
element->SetCSSID(static_cast<int32_t>(css_id));        // sets css_id_
```

Key: it sets **both** `css_style_sheet_manager_` and `css_id_` on the element directly.

### ReactLynx root snapshot: also calls `__SetCSSId` on the page

```ts
['root', {
  create() { return [__page!]; },
  cssId: 0,  // ← cssId=0, so __SetCSSId([__page], 0) is called
}]
```

ReactLynx explicitly sets CSS scope on the page element itself. vue-lynx now mirrors this.

---

## Implementation (Done)

### What changed

| File | Change |
|------|--------|
| `main-thread/src/entry-main.ts` | Removed `__CreateComponent`; added `__SetCSSId([page], 0)`; stores page (not component) as `elements[1]` |
| `main-thread/src/element-registry.ts` | Renamed `rootComponentUniqueId` → `pageUniqueId` |
| `main-thread/src/ops-apply.ts` | Uses `pageUniqueId` for element creation |
| `main-thread/src/list-apply.ts` | Uses `pageUniqueId` for `__CreateList` |
| `main-thread/src/shims.d.ts` | Removed `__CreateComponent` type declaration |
| `testing-library/setup.ts` | Removed `__CreateComponent` stub |

### Resulting DOM structure

```
page (with css_style_sheet_manager_ set by __SetCSSId)
  └─ [vue elements] (each with css_style_sheet_manager_ set by __SetCSSId)
```

### Unexpected benefit: CSS `%` units now work in Lynx for Web

Removing `__CreateComponent` fixed a layout bug where `height: 100%` / `width: 100%`
didn't work. Previously the intermediate `<x-view>` ComponentElement had `height: auto`,
breaking the `%` resolution chain:

```
Before:  page (height:100%) → <x-view component> (height:auto) → content (height:100% → 0)
After:   page (height:100%) → content (height:100% → works ✅)
```

---

## DevTool CSS Panel Gap (Pending Engine Fix)

**Status**: DevTool CSS selectors are not shown without a ComponentElement ancestor.
This is the same gap RL3.0 has with the current engine.

### Research findings

- `InitStyleRoot()` explicitly excludes `tag == "page"` elements (early return)
- `GetCSSStyleComponentElement()` returns `nullptr` for PageElements (no parent component)
- `__SetCSSId` does NOT set `style_root_` — it only sets `css_style_sheet_manager_`
- No path exists for PageElement to establish the `style_root_ → StyleValueElement` chain

### Options for fixing DevTool

**Option A (short-term)**: Restore `__CreateComponent` as a workaround.
DOM structure: `page → component → [vue elements]`. DevTool works because
`ResolveParentComponentElement()` finds the component as DOM ancestor.

**Option B (long-term, engine fix)**: Update `InitStyleRoot()` to fall back to
element's own `css_style_sheet_manager_` (set by `__SetCSSId`) when no ComponentElement exists:
```cpp
// In element_inspector.cc InitStyleRoot():
auto comp = GetCSSStyleComponentElement(element);
if (comp != nullptr && Type(comp) == InspectorElementType::COMPONENT) {
  inspector_attribute->style_root_ = StyleValueElement(comp);
} else if (element->GetRelatedCSSFragment() != nullptr) {
  // NEW: Fiber element with css_style_sheet_manager_ set via __SetCSSId
  inspector_attribute->style_root_ = /* element's own style_root */;
}
```

**Option C**: Remove the `tag == "page"` early return + use page as style_root for its subtree.

Current decision: **Accept the DevTool gap** (align with RL3.0). Coordinate with
DevTool/engine team to fix `InitStyleRoot` at the engine level.

---

## Key Constants and Values

| Constant | Value | Location |
|----------|-------|----------|
| `kInvalidCssId` | `-1` | `core/renderer/utils/base/tasm_constants.h:55` |
| `DEFAULT_ENTRY_NAME` | `"__Card__"` | Used by `FiberSetCSSId` when no entryName passed |
| `InspectorElementType::DOCUMENT` | `0` | default for unknown tags |
| `InspectorElementType::COMPONENT` | `3` | "page" and "component" tags |
| `PAGE_ROOT_ID` | `1` | vue-lynx shadow element ID for page root |

## Key Files

| File | Purpose |
|------|---------|
| `~/github/lynx/core/runtime/bindings/lepus/renderer_functions.cc:4172` | `FiberSetCSSId` — sets `css_style_sheet_manager_` + `css_id_` |
| `~/github/lynx/core/renderer/dom/fiber/fiber_element.cc:326` | `GetRelatedCSSFragment()` — CSS rendering pipeline |
| `~/github/lynx/devtool/lynx_devtool/element/element_inspector.cc:499` | `InitStyleRoot()` — **the DevTool break point** |
| `~/github/lynx/devtool/lynx_devtool/element/element_inspector.cc:798` | `GetCSSStyleComponentElement()` |
| `~/github/lynx/devtool/lynx_devtool/element/element_inspector.cc:581` | `GetMatchedStyleSheet()` — depends on `style_root_` |
| `~/github/lynx/core/inspector/style_sheet.h:83` | `InspectorElementType` enum |
| `~/github/lynx-stack/packages/react/runtime/src/snapshot.ts:310` | ReactLynx `__SetCSSId` usage |
| `~/github/lynx/core/renderer/dom/element_manager.cc:441` | `PrepareComponentNodeForInspector()` |
