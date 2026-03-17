# Lynx Core Bug: Viewport Units (vh/vw) Race Condition in Fiber Architecture

**Status**: Analysis Complete — Handover to Lynx Core Team
**Date**: 2026-03-14 (updated)
**Affects**: Any Fiber-based app using `vh`/`vw` CSS units

## Problem

CSS properties using viewport units (`vh`, `vw`) resolve to `auto`/`0` on the **first render** and never self-correct. For example, `min-height: 100vh` on a flex container means `flex-grow` on children has no space to distribute.

**Repro**: Any Lynx Fiber app with `min-height: 100vh` on a flex container — children with `flex-grow: 1` collapse to zero height. Re-applying any style via DevTool fixes it (proving the values are correct, but the timing is wrong).

## Root Cause

### Race condition: `UpdateViewport()` vs element creation

`UpdateViewport()` and `vuePatchUpdate` (element creation) are both posted to the engine thread asynchronously. Their order is nondeterministic:

```
Platform thread                    BG JS thread                     Engine thread
─────────────────────────────────────────────────────────────────────────────────
LynxView created                   Vue runtime starts
  │                                  │
  ├─ layoutSubviews ──────────────── ──────── ──→ UpdateViewport()
  │                                  │                    │ (posts to engine actor)
  │                                  ├─ first patch ──→ vuePatchUpdate()
  │                                  │                    │ (posts to engine actor)
  │                                  │                    ▼
  │                                  │             Engine thread processes
  │                                  │             messages in FIFO order
  │                                  │             — race: which arrives first?
```

**If `vuePatchUpdate` arrives before `UpdateViewport`:**
1. Elements are created with indefinite `viewport_height_` in `LynxEnvConfig`
2. `FlushActionsAsRoot()` → `MergeInlineStyles()` → `UnitHandler::Process()` stores raw `CSSValue(VH, 100)` in `parsed_styles_map_`
3. `ConsumeStyleInternal` → `SetStyleInternal` → `UpdateLayoutNodeStyle` sends raw CSSValue to layout thread
4. Layout thread: `LayoutNode::ConsumeStyle` → `ComputedCSSStyle::SetMinHeight(CSSValue(VH, 100))` → `CSSStyleUtils::ToLength()`:
   ```cpp
   // css_style_utils.cc:401-405
   } else if (pattern == tasm::CSSValuePattern::VH) {
     return context.viewport_height_.IsDefinite()
                ? ToLengthHelper(value, context.viewport_height_.ToFloat() / 100.f)
                : std::pair<NLength, bool>(NLength::MakeAutoNLength(), false);
                                           // ^^^ viewport indefinite → parse FAILS
   }
   ```
5. `ComputeLengthStyle` (css_style_utils.cc:690-691) checks `!parse_result.second` → returns `false` without setting `min_height_`
6. `min_height_` stays at default (`auto`) → no flex space to distribute

### Self-correction mechanism exists but may have timing issues

When `UpdateViewport()` finally arrives, it runs:
```cpp
// element_manager.cc:678-694
void ElementManager::UpdateViewport(...) {
  GetLynxEnvConfig().UpdateViewport(width, width_mode, height, height_mode);
  delegate_->UpdateLynxEnvForLayoutThread(config);                    // (A) updates layout nodes' viewport
  root()->UpdateDynamicElementStyle(kUpdateViewport, false);          // (B) re-resolves CSS on element tree
  OnUpdateViewport(width, width_mode, height, height_mode, need_layout); // (C) triggers layout
}
```

**Step A**: `LayoutContext::UpdateLynxEnvForLayoutThread` → `root()->UpdateLynxEnv()` recursively updates all LayoutNodes' `ComputedCSSStyle` with definite viewport dimensions.

**Step B**: `UpdateDynamicElementStyleRecursively` should re-resolve vh styles:
- `dynamic_style_flags_` IS set correctly: `Element::SetStyleInternal` (element.cc:325) calls `CheckDynamicUnit()` for ALL properties, not just font-size
- `viewport_changed` check should detect the change
- `ConsumeStyleInternal(parsed_styles_map_)` re-processes all CSS values
- `UpdateLayoutNodeByBundle` sends corrected values to layout thread

**Step C**: `LayoutContext::UpdateViewport` sets `has_viewport_ready_ = true`, marks root dirty, calls `RequestLayout()`

**In theory this should self-correct.** However, the user observes that it does NOT self-correct on first render. Possible explanations:
1. Timing between step B's enqueued layout tasks and step C's layout execution
2. The `has_viewport_ready_` gate on `LayoutContext::Layout()` (line 760) may cause the first layout to be deferred, and the deferred layout may not pick up the re-resolved styles
3. Thread synchronization between element tree and layout tree updates

### What DevTool does differently

When DevTool modifies any style, `ElementInspector::Flush()` (element_inspector.cc:426):
1. **Resets** all styles via `element->ResetStyle(reset_names)`
2. Re-applies ALL CSS rules via `SetPropsAccordingToStyleSheet()` → `element->ConsumeStyle(styles)`
3. Calls `OnPatchFinish()` → `RequestLayout()` — immediate synchronous layout

This is a full reset+reapply that bypasses the dynamic update mechanism entirely. By this time, viewport dimensions are always available, so VH resolves correctly.

## Key Files

| File | Lines | What |
|------|-------|------|
| `core/renderer/css/css_style_utils.cc` | 401-405, 689-691 | VH resolution + parse failure path |
| `core/renderer/css/computed_css_style.cc` | 486-492 | Default indefinite viewport dims |
| `core/renderer/dom/element.cc` | 316-325 | `SetStyleInternal` calls `CheckDynamicUnit` for ALL props |
| `core/renderer/dom/fiber/fiber_element.cc` | 3332-3430 | `UpdateDynamicElementStyleRecursively` |
| `core/renderer/dom/element_manager.cc` | 678-694 | `UpdateViewport()` — the re-resolution path |
| `core/renderer/ui_wrapper/layout/layout_context.cc` | 760, 1073-1094 | `has_viewport_ready_` gate + `UpdateViewport` |
| `core/renderer/ui_wrapper/layout/layout_node.cc` | 16-36, 280-285 | `UpdateStyleWithEnvConfig` + `UpdateLynxEnv` |
| `core/shell/lynx_shell.cc` | 653-672 | `LynxShell::UpdateViewport()` — async post to engine |
| `devtool/lynx_devtool/element/element_inspector.cc` | 426-488 | DevTool's `Flush()` — full reset+reapply |

## Proposed Fixes

### Fix A: Ensure viewport dimensions are available before first flush

Ensure `UpdateViewport()` is called **synchronously** during `LynxShell` initialization, before `LoadTemplate()` triggers JS execution. Viewport dimensions are known at view creation time.

**Where to change**: Platform-side initialization code (`LynxShellBuilder` or `LynxView`). Pass viewport dimensions in the builder before the shell starts.

**Evidence**: `LynxShellBuilder` (lynx_shell_builder.h:123) initializes `LynxEnvConfig` with `(0, 0, 1, 1)`. Viewport dims should be passed here.

### Fix B: Fallback — resolve indefinite VH to screen height

Instead of failing VH resolution when viewport is indefinite, fall back to the screen height which IS available at construction:

```cpp
// css_style_utils.cc:401-405 — proposed change
} else if (pattern == tasm::CSSValuePattern::VH) {
  if (context.viewport_height_.IsDefinite()) {
    return ToLengthHelper(value, context.viewport_height_.ToFloat() / 100.f);
  } else if (context.screen_height_ > 0) {
    return ToLengthHelper(value, context.screen_height_ / 100.f);
  } else {
    return std::pair<NLength, bool>(NLength::MakeAutoNLength(), false);
  }
}
```

### Fix C: Debug and fix the self-correction path

Add tracing/logging to `UpdateDynamicElementStyleRecursively` to verify:
1. Are the re-resolved styles actually reaching the layout thread?
2. Are the layout tasks executed before `RequestLayout()` in step C?
3. Is the layout marked dirty after the style update?

This would confirm whether the self-correction mechanism has a real bug or just a timing issue.

### Recommendation

**Fix A** is the most correct solution — viewport dimensions should be available before any rendering.

**Fix B** is a pragmatic safety net for cases where Fix A can't be applied.

## Verification

After fix, verify with:
1. App with `min-height: 100vh` on a flex column container, child with `flex-grow: 1` — child should take up space on first render
2. Orientation change — vh/vw styles should update
3. Trace `CSSStyleUtils::ToLength` for VH pattern — verify `viewport_height_.IsDefinite()` is true at first resolution

## Workaround (vue-lynx)

Three changes applied to avoid viewport units entirely:

1. **`main-thread/entry-main.ts`**: Pass `{ removeComponentElement: true }` to `__CreateComponent` — makes the root ComponentElement layout-transparent (wrapper), eliminating an extra node in the layout tree that was breaking the `%`-based height chain

2. **`examples/hello-world/src/App.css`**: Changed `.App` from `min-height: 100vh` to `flex: 1` — uses flex-grow to fill parent instead of viewport-dependent units

3. **`examples/hello-world/src/App.vue`**: Added `flex: 1` to outer `<view @tap="jump">` — ensures the outer wrapper fills the page height via flex-grow

Layout chain: `PageElement → [ComponentElement wrapper] → outer view (flex:1) → .App (flex:1) → Banner(flex:5) + Content + spacer(flex:1)`

No viewport units used. Pure flex-based layout that resolves correctly regardless of `UpdateViewport` timing.
