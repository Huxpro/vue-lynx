# Fix: DevTool CSS Panel Not Showing Selectors (parent_component_unique_id_ Bug)

**Status**: Implemented
**Date**: 2026-03-13
**Branch**: Huxpro/fix-parent-comp-id

## Problem

- Lynx elements render correctly on screen
- DevTool CLI/MCP CDP returns correct data
- But DevTool **Panel does not show CSS selectors** for any element

### Root Cause (from native C++ source analysis)

The DevTool CSS inspection pipeline requires a valid **ComponentElement** ancestor for every element. The chain is:

```
element.parent_component_unique_id_
  → ResolveParentComponentElement() walks DOM tree upward
    → finds ComponentElement (created by __CreateComponent)
      → ComponentElement.style_sheet_manager()
        → GetCSSStyleSheetForComponent(css_id) → CSSFragment
          → StyleResolver::GetCSSMatchedRule() → matched selectors
            → DevTool panel displays CSS rules
```

**vue-lynx hardcodes `parentComponentUniqueId = 1`** (the page root) for all element creation. But the page root (created by `__CreatePage`) is a **PageElement**, not a **ComponentElement**. It lacks the `style_sheet_manager()` needed for CSS resolution. The C++ code in `FiberElement::GetRelatedCSSFragment()` (`fiber_element.cc:326-350`) does:

```cpp
css_style_sheet_manager_ =
    static_cast<ComponentElement*>(GetParentComponentElement())
        ->style_sheet_manager();
```

When `parent_component_unique_id_ = 1` resolves to the PageElement (which is not a ComponentElement in Fiber mode), this lookup fails → no CSS fragment → **no selectors in DevTool**.

### What ReactLynx Does Differently

ReactLynx's snapshot code calls `__CreateComponent(parentUniqueId, componentId, cssId, entryName, name, path, config, info)` for each React component. This creates a **ComponentElement** in the native C++ layer with:
- `component_id_`, `component_css_id_`, `entry_name_`
- `css_style_sheet_manager_` initialized from `entry_name` — **where CSS fragments live**
- Registered in `ElementManager::RecordComponent()`

Then all child elements are created with the component's unique ID (e.g., `10`) as `parentComponentUniqueId`, so DevTool can trace the chain.

### Key Native C++ Files (~/github/lynx)
- `core/renderer/dom/fiber/fiber_element.h` — `parent_component_unique_id_` field (line 990)
- `core/renderer/dom/fiber/fiber_element.cc` — `GetRelatedCSSFragment()` (line 326), `ResolveParentComponentElement()` (line 274)
- `core/runtime/bindings/lepus/renderer_functions.cc` — `FiberCreateComponent()` (line 2384)
- `core/renderer/dom/element_manager.cc` — `PrepareComponentNodeForInspector()` (line 441)

### Key lynx-stack Web PAPI Files (~/github/lynx-stack)
- `packages/web-platform/web-mainthread-apis/ts/createMainThreadGlobalThis.ts` — `__CreateComponent` impl (line 486)
- `packages/web-platform/web-constants/src/types/MainThreadGlobalThis.ts` — `CreateComponentPAPI` type

---

## Solution

### Design Decision: Component as DOM Ancestor

`ResolveParentComponentElement()` walks **up the DOM tree** to find an ancestor whose `impl_id()` matches `parent_component_unique_id_`. Therefore the ComponentElement must be a **DOM ancestor** of all Vue-rendered elements.

**Approach**: Create a root ComponentElement in `renderPage`, append it to the page, and store it as `elements[PAGE_ROOT_ID]` so all BG-thread INSERT ops that target the root actually insert into the component. This makes the component a DOM ancestor of every Vue element.

### Changes

#### Step 1: Add `__CreateComponent` type declaration

**File**: `main-thread/src/shims.d.ts`

Added `__CreateComponent` PAPI declaration inside `declare global {}`.

#### Step 2: Add root component unique ID to element-registry

**File**: `main-thread/src/element-registry.ts`

Exported a mutable `rootComponentUniqueId` variable (default `1`) with a `setRootComponentUniqueId()` setter.

#### Step 3: Create root ComponentElement in renderPage

**File**: `main-thread/src/entry-main.ts`

In `renderPage`, after creating the page:
1. Call `__CreateComponent` with page's unique ID as parent
2. Append the component to the page
3. Store the component (not the page) as `elements[PAGE_ROOT_ID]`
4. Set `rootComponentUniqueId` via the setter
5. Flush with the page element (the actual tree root)

#### Step 4: Use rootComponentUniqueId in element creation

**File**: `main-thread/src/ops-apply.ts`

Replaced hardcoded `1` with `rootComponentUniqueId` in `createTypedElement` and `CREATE_TEXT`. Added `setRootComponentUniqueId(1)` to `resetMainThreadState()` for clean test state.

#### Step 5: Use rootComponentUniqueId in list creation

**File**: `main-thread/src/list-apply.ts`

Replaced hardcoded `1` with `rootComponentUniqueId` in `__CreateList`.

#### Step 6: Test stub

**File**: `testing-library/setup.ts`

Added `__CreateComponent` stub (creates a `<component>` element) since `@lynx-js/testing-environment` doesn't implement this PAPI.

## Verification

1. **Build**: `pnpm build` — no type errors
2. **Unit tests**: `pnpm test` — all 31 tests pass
3. **Example app**: `examples/basic` builds successfully end-to-end
4. **DevTool**: Connect DevTool to running example, select an element, verify CSS selectors appear in Styles panel
5. **Events**: Verify tap/click events still dispatch correctly
