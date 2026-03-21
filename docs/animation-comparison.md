# Vant 4 vs vant-lynx Animation Comparison Report

## Architecture Overview

### Vant 4 (Web)
- **Mechanism:** CSS `transition` / CSS `@keyframes` animation + Vue `<Transition>` component
- **CSS Variables:** `--van-duration-base: 0.3s`, `--van-duration-fast: 0.2s`, `--van-ease-out: ease-out`, `--van-ease-in: ease-in`
- **Two-tier system:**
  - Center-positioned popups use CSS `@keyframes` animation (fade/bounce), duration overridden via `animationDuration`
  - Edge-positioned popups use CSS `transition` on `transform`, duration overridden via `transitionDuration`
- **Lifecycle:** Vue `<Transition>` provides `onAfterEnter` / `onAfterLeave` callbacks

### vant-lynx (Lynx)
- **Mechanism:** `element.animate()` API on main thread (Web Animations API-like), invoked via worklet functions
- **No CSS transitions/keyframes:** Lynx does not support CSS `transition`, `animation`, or `@keyframes`
- **No Vue `<Transition>`:** Enter/leave animations are manually orchestrated via `watch()` + `setTimeout()`
- **Core composable:** `useAnimate()` provides `fadeIn`, `fadeOut`, `slideIn`, `slideOut`, `zoomIn`, `zoomOut`, `bounceIn`
- **Thread model:** Animations run on the main (UI) thread; Vue reactivity runs on the background thread; `runOnMainThread()` bridges them
- **`fill: 'forwards'`** on all animations to persist final state

---

## Component-by-Component Comparison

### 1. Overlay

| Aspect | Vant 4 (Web) | vant-lynx | Diff / Notes |
|---|---|---|---|
| **Mechanism** | Vue `<Transition name="van-fade" appear>` | `useAnimate()` fadeIn/fadeOut | Lynx uses imperative API instead of declarative CSS |
| **Enter animation** | CSS `@keyframes van-fade-in`: opacity 0→1 | `element.animate()`: opacity 0→1 | Equivalent effect |
| **Leave animation** | CSS `@keyframes van-fade-out`: opacity 1→0 | `element.animate()`: opacity 1→0 | Equivalent effect |
| **Duration** | `0.3s` (`--van-duration-base`) | `0.3s` (default `props.duration`) | Match |
| **Enter easing** | `ease-out` | `ease-out` | Match |
| **Leave easing** | `ease-in` | `ease-in` | Match |
| **`appear` animation** | Yes (`appear` prop on `<Transition>`) | No — first show triggers via `watch` | Vant animates on initial mount; vant-lynx does not |
| **Lazy render** | Yes (`useLazyRender`) | No lazy render | Vant delays initial DOM creation |

### 2. Popup

| Aspect | Vant 4 (Web) | vant-lynx | Diff / Notes |
|---|---|---|---|
| **Mechanism** | Vue `<Transition>` with position-dependent name | `useAnimate()` with position-dependent function | Same logic, different API |
| **Center enter** | `van-fade`: opacity 0→1 via `@keyframes` | `zoomIn`: scale(0.9)→scale(1) + opacity, centered | **Different**: Vant fades; vant-lynx zooms+fades |
| **Center leave** | `van-fade`: opacity 1→0 via `@keyframes` | `zoomOut`: scale(1)→scale(0.9) + opacity, centered | **Different**: Vant fades; vant-lynx zooms+fades |
| **Top enter** | `van-popup-slide-top`: translate3d(0,-100%,0)→origin | `slideIn('down')`: translateY -100%→0% | Equivalent |
| **Top leave** | translate3d(0,-100%,0) | `slideOut('down')`: translateY 0%→-100% | Equivalent |
| **Bottom enter** | `van-popup-slide-bottom`: translate3d(0,100%,0)→origin | `slideIn('up')`: translateY 100%→0% | Equivalent |
| **Bottom leave** | translate3d(0,100%,0) | `slideOut('up')`: translateY 0%→100% | Equivalent |
| **Left enter** | translate3d(-100%,-50%,0)→origin | `slideIn('left')`: translateX -100%→0% | **Different**: Vant includes Y:-50%; vant-lynx does not |
| **Right enter** | translate3d(100%,-50%,0)→origin | `slideIn('right')`: translateX 100%→0% | **Different**: Vant includes Y:-50%; vant-lynx does not |
| **Duration** | `0.3s` (overridable via `duration` prop) | `0.3s` (overridable via `duration` prop) | Match |
| **Enter easing** | `ease-out` | `ease-out` | Match |
| **Leave easing** | `ease-in` | `ease-in` | Match |
| **Custom transition name** | Supported via `transition` prop | Not supported | vant-lynx has no concept of named transitions |
| **Lazy render** | Yes (`useLazyRender`) | No | vant-lynx always renders |
| **Lifecycle events** | `opened`/`closed` via `<Transition>` callbacks | `opened`/`closed` via `setTimeout` | vant-lynx uses timer approximation |

### 3. Dialog

| Aspect | Vant 4 (Web) | vant-lynx | Diff / Notes |
|---|---|---|---|
| **Mechanism** | Vue `<Transition name="van-dialog-bounce">` (via Popup) | `useAnimate()` zoomIn/zoomOut | Different animation names, similar concept |
| **Enter animation** | scale(0.7)→scale(1) + opacity 0→1 + translate3d(0,-50%,0) | scale(0.9)→scale(1) + opacity 0→1 + translate(-50%,-50%) | **Different**: Vant starts at 0.7x (more dramatic); vant-lynx at 0.9x |
| **Leave animation** | scale(1)→scale(0.9) + opacity 1→0 | scale(1)→scale(0.9) + opacity 1→0 | Match on leave |
| **Duration** | `0.3s` (`--van-duration-base`) | `0.3s` (default `props.duration`) | Match |
| **Easing** | Default (ease) | Enter: `ease-out`, Leave: `ease-in` | Slightly different |
| **Overlay** | Inherits Popup's overlay with `van-fade` | Uses Overlay component with fadeIn/fadeOut | Both fade the overlay |
| **`backface-visibility`** | `hidden` (prevents blur after scale) | Not applied | Could improve sharpness in vant-lynx |

### 4. ActionSheet

| Aspect | Vant 4 (Web) | vant-lynx | Diff / Notes |
|---|---|---|---|
| **Mechanism** | Inherits Popup `position="bottom"` → `van-popup-slide-bottom` | Inherits Popup `position="bottom"` → slideIn('up')/slideOut('up') | Both delegate to Popup |
| **Enter animation** | translate3d(0,100%,0)→origin | translateY 100%→0% | Equivalent |
| **Leave animation** | origin→translate3d(0,100%,0) | translateY 0%→100% | Equivalent |
| **Duration** | `0.3s` | `0.3s` | Match |
| **Enter easing** | `ease-out` | `ease-out` | Match |
| **Leave easing** | `ease-in` | `ease-in` | Match |

### 5. Toast

| Aspect | Vant 4 (Web) | vant-lynx | Diff / Notes |
|---|---|---|---|
| **Mechanism** | Vue `<Transition name="van-fade">` (via Popup) | `useAnimate()` zoomIn/zoomOut (middle), slideIn/slideOut (top/bottom) | **Different**: Vant always fades; vant-lynx zooms for middle |
| **Middle enter** | Fade only (opacity 0→1) | scale(0.9)→scale(1) + opacity 0→1 | **Different**: vant-lynx adds scale |
| **Middle leave** | Fade only (opacity 1→0) | scale(1)→scale(0.9) + opacity 1→0 | **Different**: vant-lynx adds scale |
| **Top/Bottom** | Fade only (opacity) | Slide (translateY) | **Different**: vant-lynx slides for edge positions |
| **Animation duration** | `0.3s` (from `van-fade` classes) | `0.2s` (hardcoded `ANIM_DURATION = 200`) | **Different**: vant-lynx is faster |
| **Element transition** | `all 0.2s` on `.van-toast` (for property changes) | N/A | Vant has extra transition for position changes |
| **Auto-close duration** | `2000ms` (display, not animation) | `2000ms` (display, not animation) | Match |

### 6. Notify

| Aspect | Vant 4 (Web) | vant-lynx | Diff / Notes |
|---|---|---|---|
| **Mechanism** | Vue `<Transition>` via Popup `position="top"` → `van-popup-slide-top` | `useAnimate()` slideIn/slideOut | Both slide |
| **Enter animation** | translate3d(0,-100%,0)→origin | translateY -100%→0% | Equivalent |
| **Leave animation** | origin→translate3d(0,-100%,0) | translateY 0%→-100% | Equivalent |
| **Duration** | `0.2s` (overridden via Popup `duration` prop) | `0.3s` (hardcoded `ANIM_DURATION = 300`) | **Different**: Vant 0.2s; vant-lynx 0.3s |
| **Bottom position** | Not supported (always top) | Supported (slideIn('up')/slideOut('up')) | vant-lynx has extra feature |
| **Enter easing** | `ease-out` | `ease-out` | Match |
| **Leave easing** | `ease-in` | `ease-in` | Match |
| **Auto-close duration** | `3000ms` | `3000ms` | Match |

---

## Components Only in vant-lynx (with animations)

| Component | Animation | Duration | Easing | Properties |
|---|---|---|---|---|
| **ImagePreview** | fadeIn/fadeOut | 300ms | ease-out/ease-in | opacity |
| **DropdownItem** | slideIn/slideOut (direction-based) | 200ms | ease-out/ease-in | translateY |
| **ShareSheet** | Delegates to Popup bottom | 300ms | ease-out/ease-in | translateY |
| **FloatingPanel** | Custom `_animateHeight` worklet | 300ms | `cubic-bezier(0.18, 0.89, 0.32, 1.28)` | height |
| **FloatingBubble** | Custom `_bounceIn` (4-keyframe) + `_snapTo` | 200ms / 300ms | ease-out | scale, left, top |
| **SwipeCell** | Custom `_snapTranslate` worklet | 300ms | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | translateX |
| **NoticeBar** | Custom `_marqueeAnimate` worklet | Calculated from speed | linear | translateX |
| **Barrage** | `requestAnimationFrame` loop | 4000ms per item | linear | left |
| **RollingText** | `setTimeout` frame interpolation | 2000ms | cubic ease-out: `1 - (1-t)^3` | digit values |

---

## Animation Gaps in vant-lynx

Components that have animation in Vant 4 (via CSS transition/animation) but lack it in vant-lynx:

| Component | Vant 4 Animation | vant-lynx Status | Improvement Suggestion |
|---|---|---|---|
| **Loading (spinner)** | CSS `@keyframes van-rotate` (infinite spin) | Static icon, no rotation | Add `element.animate()` with infinite rotation |
| **Skeleton** | CSS shimmer/pulse animation | Static opacity 0.6 | Add fade pulse via `element.animate()` with iterations: Infinity |
| **Switch** | CSS `transition` on thumb position + background | Instant toggle, no transition | Add translateX + background color animation |
| **CollapseItem** | CSS `transition` on height (expand/collapse) | Instant show/hide via `v-if` | Add height animation via custom worklet |
| **Progress** | CSS `transition` on width | Instant width change | Add width animation |
| **NumberKeyboard** | Slide-up/down transition | No animation | Add slideIn/slideOut |
| **Popover** | Fade + scale transition | Instant show/hide via `v-if` | Add zoomIn/zoomOut |
| **PasswordInput** | CSS cursor blink `@keyframes` | No cursor blink | Add opacity toggle animation with iterations: Infinity |
| **Tabs (content swap)** | CSS `transition` on translateX | Instant swap | Add horizontal slide animation |

---

## Key Differences Summary

| Aspect | Vant 4 (Web) | vant-lynx |
|---|---|---|
| **Animation engine** | CSS transitions + CSS @keyframes + Vue `<Transition>` | Lynx `element.animate()` API (main-thread worklets) |
| **Declarative vs imperative** | Declarative (CSS classes + Vue transition names) | Imperative (JS function calls) |
| **Lifecycle callbacks** | Built-in via `<Transition>` events (`after-enter`, `after-leave`) | Approximated via `setTimeout(callback, duration)` |
| **Custom transitions** | Configurable via `transition` prop (any CSS transition name) | Not configurable — animation type hardcoded per position |
| **Duration override** | Via `animationDuration` or `transitionDuration` inline style | Via `element.animate()` options duration parameter |
| **Lazy rendering** | `useLazyRender` delays first render | Not implemented — always renders |
| **Thread model** | Single thread (browser main thread) | Dual thread (UI main thread + background JS thread) |
| **Center Popup animation** | Pure fade (opacity only) | Zoom + fade (scale + opacity) |
| **Dialog enter scale** | `scale(0.7)` — more dramatic bounce | `scale(0.9)` — subtler zoom |
| **Fill behavior** | CSS `animation-fill-mode: both` or transition end state | `fill: 'forwards'` on all animations |

---

## Recommendations

### High Priority
1. **Add `bounceIn` animation for Dialog**: Vant's `van-dialog-bounce` starts at `scale(0.7)` for a more satisfying entrance. Consider matching this or using `useAnimate().bounceIn()` which already has a 4-keyframe bounce sequence.
2. **Align Notify duration**: vant-lynx uses 300ms vs Vant's 200ms. Consider matching for consistency.
3. **Toast middle animation**: Vant uses pure fade; vant-lynx uses zoom+fade. Consider if the zoom adds value or if pure fade is more appropriate.

### Medium Priority
4. **Add Loading spinner animation**: This is visually important — a static loading icon looks broken. Implement infinite rotation via `element.animate()`.
5. **Add Switch transition**: Thumb sliding animation provides important tactile feedback.
6. **Add CollapseItem height animation**: The expand/collapse experience feels jarring without animation.
7. **Add NumberKeyboard slide animation**: Keyboard appearing without animation feels unpolished.

### Low Priority
8. **Add Skeleton shimmer**: Subtle pulse animation improves perceived loading quality.
9. **Add Progress bar transition**: Width changes should animate smoothly.
10. **Consider `appear` support**: Vant's Overlay animates on initial mount via `appear`; vant-lynx skips this.
11. **Popup left/right Y offset**: Vant includes `translate3d(x, -50%, 0)` for left/right positions; vant-lynx omits the Y component.
