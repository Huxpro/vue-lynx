# Elk Sheet Gesture Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Elk navigation Sheet feel native on iOS by porting the current `lynx-ui` direction lock, velocity projection, rubber resistance, progress-linked backdrop, and spring settle behavior into Vue Lynx.

**Architecture:** Keep gesture state and rendering mutations in main-thread worklets inside `Sheet.vue`. Keep angle, physics, progress, and dismissal decisions as pure functions in `gesture.ts` so Node tests exercise the same calculations. Use a hybrid input policy: the dedicated handle always owns vertical drags, while the scrollable panel claims only downward drags that begin at `scrollTop === 0`.

**Tech Stack:** Vue Lynx SFCs, Main Thread Script worklets, `useMainThreadRef`, requestAnimationFrame, Node test runner, Rspeedy, Lynx DevTool.

---

## File map

- `examples/elk/src/components/sheet/gesture.ts`: pure gesture ownership, rubber resistance, velocity projection, progress, and spring-step calculations.
- `examples/elk/src/components/sheet/Sheet.vue`: hybrid touch surfaces, main-thread state machine, direct manipulation, spring settle, and visual structure.
- `examples/elk/src/components/NavBottom.vue`: spacing adjustment for the new grabber without changing navigation behavior.
- `examples/elk/scripts/native-compat.test.mjs`: behavioral and source-contract regression coverage.

### Task 1: Specify gesture physics with failing tests

**Files:**

- Modify: `examples/elk/scripts/native-compat.test.mjs`
- Test: `examples/elk/scripts/native-compat.test.mjs`

- [ ] **Step 1: Replace the legacy fixed-distance test with behavior tests**

Add assertions that demonstrate the desired pure API:

```js
test('sheet claims handle drags vertically and content drags only downward at scroll top', () => {
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('handle', 2, -12, 40), true);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('handle', 20, 10, 0), false);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('content', 2, 12, 0), true);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('content', 2, -12, 0), false);
  assert.equal(sheetGesture.shouldClaimSheetGesture?.('content', 2, 12, 1), false);
});

test('sheet uses bounded rubber resistance above the open position', () => {
  assert.equal(sheetGesture.resolveSheetDrag?.(30), 30);
  assert.equal(sheetGesture.resolveSheetDrag?.(-40, 80, 0.5), -16);
  assert.ok(sheetGesture.resolveSheetDrag?.(-10000, 80, 0.5) > -80);
});

test('sheet release uses distance or projected fling travel to dismiss', () => {
  assert.equal(sheetGesture.shouldDismissSheet?.(120, 0, 120), true);
  assert.equal(sheetGesture.shouldDismissSheet?.(119, 0, 120), false);
  assert.equal(sheetGesture.shouldDismissSheet?.(24, 900, 120), true);
  assert.equal(sheetGesture.shouldDismissSheet?.(10, 1200, 120), false);
  assert.equal(sheetGesture.shouldDismissSheet?.(60, -900, 120), false);
});

test('sheet backdrop progress follows downward travel', () => {
  assert.equal(sheetGesture.sheetOpenProgress?.(-20, 600), 1);
  assert.equal(sheetGesture.sheetOpenProgress?.(150, 600), 0.75);
  assert.equal(sheetGesture.sheetOpenProgress?.(800, 600), 0);
});

test('sheet filters noisy velocity samples and integrates a stable spring step', () => {
  assert.equal(sheetGesture.smoothSheetVelocity?.(0, 9, 10, 0.25), 225);
  const next = sheetGesture.stepSheetSpring?.(100, 0, 0, 1 / 60);
  assert.ok(next.value < 100);
  assert.ok(next.velocity < 0);
});
```

- [ ] **Step 2: Add a source-contract test for the hybrid surfaces**

Require `.sheet-handle`, separate handle/content start handlers, backdrop and surface refs, layout measurement, and requestAnimationFrame settling. Also require that drag mutation remains main-thread-bound and does not use `transition: all`.

- [ ] **Step 3: Run the native compatibility test and verify RED**

Run:

```bash
pnpm --dir examples/elk test:native-compat
```

Expected: the new gesture tests fail because the new pure helpers and hybrid Sheet structure do not exist.

### Task 2: Implement the pure gesture model

**Files:**

- Modify: `examples/elk/src/components/sheet/gesture.ts`
- Test: `examples/elk/scripts/native-compat.test.mjs`

- [ ] **Step 1: Implement angle and ownership classification**

Keep the 8 px lock threshold and use vertical angle ranges equivalent to `lynx-ui`:

```ts
export type SheetGestureSource = 'handle' | 'content';

export function shouldClaimSheetGesture(
  source: SheetGestureSource,
  deltaX: number,
  deltaY: number,
  scrollTop: number,
): boolean {
  'main thread';
  const displacement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  if (displacement < SHEET_GESTURE_LOCK_DISTANCE)
    return false;
  const vertical = Math.abs(deltaY) > Math.abs(deltaX);
  if (!vertical)
    return false;
  return source === 'handle' || (deltaY > 0 && scrollTop <= 0);
}
```

- [ ] **Step 2: Implement upstream-compatible rubber resistance**

```ts
export function rubberEffect(original: number, max: number, coeff = 0.5): number {
  'main thread';
  if (original === 0 || max === 0)
    return 0;
  return (1 - 1 / ((Math.abs(original) * coeff) / max + 1)) * max;
}

export function resolveSheetDrag(deltaY: number, rubberMax = 80, coeff = 0.5): number {
  'main thread';
  return deltaY >= 0 ? deltaY : -rubberEffect(-deltaY, rubberMax, coeff);
}
```

- [ ] **Step 3: Implement progress, velocity smoothing, projection, and release decisions**

Use `travel = velocity² / (2 × 2000)` from `lynx-ui`, require 24 px of intentional downward travel for a fling dismissal, and retain the existing 120 px distance threshold as the non-fling path.

- [ ] **Step 4: Implement one deterministic spring integration step**

Expose `stepSheetSpring(value, velocity, target, deltaSeconds, stiffness = 300, damping = 30)` returning the next `{ value, velocity }`. Clamp `deltaSeconds` to `1 / 30` so a delayed frame cannot explode the simulation.

- [ ] **Step 5: Run tests and verify the pure behavior is GREEN**

Run:

```bash
pnpm --dir examples/elk test:native-compat
```

Expected: physics assertions pass; the source-contract test remains red until `Sheet.vue` is updated.

### Task 3: Implement hybrid main-thread dragging and motion

**Files:**

- Modify: `examples/elk/src/components/sheet/Sheet.vue`
- Modify: `examples/elk/src/components/NavBottom.vue`
- Test: `examples/elk/scripts/native-compat.test.mjs`

- [ ] **Step 1: Replace the single panel ref with coordinated visual refs**

Create main-thread refs for the surface, backdrop, measured surface height, gesture source, direction state, last touch sample, smoothed velocity, animation frame, and current translation. Keep all writes inside `'main thread'` functions.

- [ ] **Step 2: Add the hybrid touch surfaces**

Render this structure:

```vue
<view class="sheet-backdrop" :main-thread-ref="backdropRef" @tap="requestClose" />
<view
  class="sheet-surface"
  :style="surfaceStyle"
  :main-thread-ref="surfaceRef"
  :main-thread-bindlayoutchange="handleSurfaceLayout"
>
  <view class="sheet-rubber-fill" />
  <view
    class="sheet-handle-hit-area"
    :main-thread-bindtouchstart="handleHandleTouchStart"
    :main-thread-bindtouchmove="handleTouchMove"
    :main-thread-bindtouchend="handleTouchEnd"
    :main-thread-bindtouchcancel="handleTouchCancel"
  >
    <view class="sheet-handle" />
  </view>
  <scroll-view
    class="sheet-panel"
    scroll-orientation="vertical"
    :main-thread-bindscroll="handlePanelScroll"
    :main-thread-bindtouchstart="handleContentTouchStart"
    :main-thread-bindtouchmove="handleTouchMove"
    :main-thread-bindtouchend="handleTouchEnd"
    :main-thread-bindtouchcancel="handleTouchCancel"
  >
    <slot />
  </scroll-view>
</view>
```

The surface height remains capped by `topInset`; the fixed layer remains inset above the bottom bar and Sparkling safe area.

- [ ] **Step 3: Implement direction locking and direct manipulation**

On touch start, record coordinates/source without stopping an existing animation. On the first move beyond 8 px, call `shouldClaimSheetGesture`; reject horizontal/content-scroll gestures permanently, or cancel the current spring and capture the valid vertical gesture. During captured moves, use `resolveSheetDrag`, set `translateY`, and update backdrop opacity from `sheetOpenProgress`.

- [ ] **Step 4: Implement spring settle and dismissal**

Drive requestAnimationFrame with `stepSheetSpring`. Snap-back targets `0`; dismissal targets the measured surface height plus 32 px. Stop when distance and velocity are both below `0.5`, then call `runOnBackground(requestClose)()` only for dismissal. Cancelled gestures always spring to `0`.

- [ ] **Step 5: Reset inline motion after leave**

Add an `after-leave` handler that invokes a main-thread reset, restoring translation `0`, backdrop opacity `1`, and idle gesture state so reopening never inherits an off-screen inline transform.

- [ ] **Step 6: Style the grabber and connected rubber fill**

Use a 28 px hit area, a centered 36 × 4 px pill, the existing themed surface color, and a surface-attached 80 px fill below the panel so upward rubber travel never reveals the backdrop between the Sheet and bottom bar. Reduce `nav-sheet-content` top padding to preserve the current first-row rhythm.

- [ ] **Step 7: Run the focused suite and verify GREEN**

Run:

```bash
pnpm --dir examples/elk test:native-compat
```

Expected: every native compatibility test passes.

### Task 4: Verify native behavior and publish the updated bundle

**Files:**

- Verify: `examples/elk/dist/main.lynx.bundle`
- Verify: PR #196 checks and Vercel artifacts

- [ ] **Step 1: Clear the Elk cache and restart the dev server**

Run:

```bash
rm -rf examples/elk/node_modules/.cache
pnpm --dir examples/elk dev
```

- [ ] **Step 2: Build both targets**

Run:

```bash
pnpm --dir examples/elk build
```

Expected: `dist/main.lynx.bundle` and `dist/main.web.bundle` both build successfully.

- [ ] **Step 3: Verify three native gesture paths**

Using Lynx DevTool on the Sparkling iOS simulator:

1. Slow downward drag under the threshold springs open and restores the backdrop.
2. Short fast downward fling closes the Sheet.
3. Upward handle pull resists asymptotically and returns without exposing a gap; upward content swipe still scrolls.

Capture the final open and post-settle states with `take-screenshot`.

- [ ] **Step 4: Run repository-level validation**

Run:

```bash
pnpm lint
pnpm test:dev-smoke
```

Expected: both commands exit successfully.

- [ ] **Step 5: Commit and push PR #196**

Stage only the Sheet refinement files, commit with `feat(examples/elk): refine native sheet gestures`, and push `HEAD` to `origin/claude/elk-vue-lynx-port-rh9gpd`.

- [ ] **Step 6: Confirm deployment artifacts**

Wait for every PR check and Vercel deployment to pass, then confirm HTTP 200 for:

```text
https://vue-lynx-git-claude-elk-vue-lynx-port-rh9gpd-huxpros-projects.vercel.app/examples/elk/dist/main.lynx.bundle
```
