# Vue Lynx -- Transition / TransitionGroup Support

## Context

Vue's `<Transition>` and `<TransitionGroup>` are among the most commonly used built-in components. Architecturally they are split into two layers:

1. **`BaseTransition`** (`@vue/runtime-core`) -- A platform-agnostic state machine that manages the enter/leave lifecycle, `mode` (in-out / out-in), `appear`, `persisted`, etc. It produces `TransitionHooks` objects via `resolveTransitionHooks()` and attaches them to VNodes. **We get this layer for free -- no modifications needed.**

2. **`Transition` / `TransitionGroup`** (`@vue/runtime-dom`) -- DOM-specific implementation. Inside hooks it toggles CSS classes (`-enter-from` -> `-enter-active` -> `-enter-to`), listens for `transitionend` / `animationend` events, and calls `forceReflow()`. **This layer needs to be rewritten for Lynx.**

### Lynx's CSS Animation Capabilities

Lynx natively supports the full set of CSS animation/transition properties:

| Type                  | Supported Properties                                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CSS Transition**    | `transition-property`, `transition-duration`, `transition-delay`, `transition-timing-function`                                                                                            |
| **CSS Animation**     | `animation-name`, `animation-duration`, `animation-timing-function`, `animation-delay`, `animation-iteration-count`, `animation-direction`, `animation-fill-mode`, `animation-play-state` |
| **@keyframes**        | Fully supported                                                                                                                                                                           |
| **Animation Events**  | `animationstart`, `animationend`, `animationiteration`, `animationcancel`                                                                                                                 |
| **Transition Events** | `transitionstart`, `transitionend`, `transitioncancel`                                                                                                                                    |
| **Animatable Properties** | `opacity`, `transform`, `background-color`, `color`, `width`, `height`, `border-*`, `padding`, `margin`, `top/right/bottom/left`, etc.                                                |
| **JS Animation API**  | `element.animate(keyframes, options)` -- Imperative animation on the Main Thread                                                                                                          |

**Key Finding**: Lynx's CSS transition and animation capabilities are essentially identical to the browser's, including event callbacks. This means we can follow the Vue DOM version's **CSS class toggling approach** rather than using the JS animation API.

### Core Challenge: Animation Coordination Under Dual Threads

The workflow of the Vue DOM version's `<Transition>`:

```
beforeEnter: addClass('enter-from', 'enter-active')
  -> insert element into DOM
  -> nextFrame: removeClass('enter-from'), addClass('enter-to')
  -> transitionend event: removeClass('enter-active', 'enter-to'), call afterEnter
```

Under our dual-thread architecture:

- **BG Thread**: `BaseTransition` state machine triggers hooks -> hooks generate SET_CLASS ops -> ops flush to Main Thread
- **Main Thread**: Applies classes -> Lynx engine executes CSS transition -> produces `transitionend` event -> callback to BG

**Problem 1: `nextFrame` Semantics**
The DOM version uses `requestAnimationFrame` + `requestAnimationFrame` (double rAF) to ensure the browser has laid out the enter-from class before switching to enter-to. Under the dual-thread model, the ops flush itself introduces an asynchronous boundary (cross-thread communication), which **naturally satisfies the nextFrame requirement** -- when BG receives the flush completion ack, the Main Thread has already applied the enter-from class and completed at least one layout pass.

**Problem 2: `transitionend` Event Routing**
`transitionend` is a DOM event. In Lynx, we need to route it back to the BG Thread handler via the existing event system (`bindtransitionend` / `bindanimationend`). The existing `SET_EVENT` ops and `publishEvent` mechanism already support this path.

**Problem 3: `forceReflow()`**
In the DOM version, after setting classes in `beforeEnter`, it calls `el.offsetHeight` to force a reflow, ensuring the initial state of enter-from is applied. Under the dual-thread model, ops executing across threads and returning inherently have a reflow effect. However, if we SET_CLASS('enter-from enter-active') and then SET_CLASS('enter-to enter-active') within the **same ops batch**, Lynx may merge away the intermediate state. Therefore we need to **send them in two separate batches**.

---

## Goals

1. Implement the `<Transition>` component, supporting CSS class-based animations and JS hooks
2. Implement the `<TransitionGroup>` component, supporting enter/leave/move animations for lists
3. Reuse `@vue/runtime-core`'s `BaseTransition` state machine with zero modifications
4. Adapt to Lynx's CSS transition/animation capabilities and event system
5. Export from `vue-lynx`, with a user experience consistent with the Vue DOM version

## Non-Goals

1. **JS animation API integration**: Not directly calling `element.animate()` inside `<Transition>`. Users can call it themselves via JS hooks
2. **FLIP move animation**: `<TransitionGroup>`'s move animation requires reading elements' bounding rects (`getBoundingClientRect()`), which requires synchronous cross-thread queries under dual threads. Not doing move in Phase 1; will consider in Phase 2
3. **`<Transition>` with `<KeepAlive>` integration**: Combined usage will not be verified for now
4. **Performance optimization**: Correctness first, speed later

---

## Architecture

### Layer Relationships

```
+----------------------------------------------------------+
|  User code:  <Transition name="fade">                    |
|                <div v-if="show">Hello</div>              |
|              </Transition>                               |
+----------------------------------------------------------+
|  LynxTransition (our code)                               |
|  +- wraps BaseTransition (from runtime-core)             |
|  +- resolveTransitionProps() -> converts name/props      |
|  |   into BaseTransitionProps with hooks                 |
|  +- hooks do: pushOp(SET_CLASS, ...) + event binding     |
+----------------------------------------------------------+
|  BaseTransition (runtime-core, unmodified)               |
|  +- state machine: isMounted, isLeaving, leavingVNodes   |
|  +- calls hooks.beforeEnter() / hooks.enter() /          |
|  |   hooks.leave() at the right moments                  |
|  +- manages mode (in-out / out-in) and delayLeave        |
+----------------------------------------------------------+
|  nodeOps (existing) -> pushOp -> ops buffer -> flush     |
+----------------------------------------------------------+
|  Main Thread: applyOps() -> __SetClasses / __AddEvent    |
|  Lynx Engine: CSS transition/animation -> transitionend  |
|  -> publishEvent -> BG handler -> done() callback        |
+----------------------------------------------------------+
```

### Enter Animation Timing (Dual-Thread)

```
BG Thread                          Main Thread
---------                          -----------
BaseTransition.beforeEnter(el)
  -> SET_CLASS(id, 'fade-enter-from fade-enter-active')
  -> SET_EVENT(id, 'bind', 'transitionend', sign)

BaseTransition calls insert(el)
  -> INSERT(parent, child, anchor)

-- ops flush ----------------------> applyOps():
                                     __SetClasses(el, 'fade-enter-from fade-enter-active')
                                     __AddEvent(el, 'bind', 'transitionend', sign)
                                     __AppendElement(parent, child)
                                     __FlushElementTree()
                                     // Lynx layout & paint: el starts at enter-from state

-- ack callback ------------------> (flush complete)

BG: onFlushAck()
  -> SET_CLASS(id, 'fade-enter-active fade-enter-to')
  -> scheduleFlush()

-- ops flush ----------------------> applyOps():
                                     __SetClasses(el, 'fade-enter-active fade-enter-to')
                                     // CSS transition kicks in: animates from enter-from -> enter-to

                                   ... animation plays ...

                                   transitionend event fires
                                   -> publishEvent(sign, eventData) ----> BG

BG: transitionend handler
  -> SET_CLASS(id, '')  // remove all transition classes
  -> call afterEnter hook
```

### Leave Animation Timing

```
BG Thread                          Main Thread
---------                          -----------
BaseTransition.leave(el, remove)
  -> SET_CLASS(id, 'fade-leave-from fade-leave-active')
  -> SET_EVENT(id, 'bind', 'transitionend', sign)

-- ops flush ----------------------> applyOps():
                                     __SetClasses(el, 'fade-leave-from fade-leave-active')
                                     // Lynx layout: captures leave-from state

-- ack ------------------------------>

BG: onFlushAck()
  -> SET_CLASS(id, 'fade-leave-active fade-leave-to')

-- ops flush ----------------------> CSS transition: leave-from -> leave-to

                                   transitionend -> publishEvent -> BG

BG: transitionend handler
  -> remove()    // BaseTransition calls remove, triggering nodeOps.remove()
  -> afterLeave hook
```

---

## Implementation Plan

### Phase 1: `<Transition>` -- CSS Class-Based Animation

#### Step 1.1: `LynxTransition` Component Skeleton

**File**: `packages/vue/runtime/src/components/Transition.ts`

```typescript
import { BaseTransition, type BaseTransitionProps, h } from '@vue/runtime-core';
import type { ShadowElement } from '../shadow-element.js';

export interface TransitionProps extends BaseTransitionProps<ShadowElement> {
  name?: string;
  type?: 'transition' | 'animation';
  duration?: number | { enter: number; leave: number };
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
  appearFromClass?: string;
  appearActiveClass?: string;
  appearToClass?: string;
}

export const Transition = /*#__PURE__*/ (props, { slots }) => {
  return h(BaseTransition, resolveTransitionProps(props), slots);
};
```

**Key function**: `resolveTransitionProps(rawProps)` -- Converts `name="fade"` into `onBeforeEnter` / `onEnter` / `onLeave` and other hooks.

#### Step 1.2: Class Management Logic

**Core difficulty**: Operating on the ShadowElement's classes on the BG Thread.

Currently `nodeOps.patchProp`'s `class` branch directly calls `pushOp(OP.SET_CLASS, el.id, nextValue)`. But Transition needs to **append/remove** transition classes **on top of the existing classes**.

**Approach**: Maintain a `_classes: Set<string>` field on ShadowElement:

```typescript
// shadow-element.ts additions
_classes: Set<string> = new Set()
_baseClass: string = ''  // set by the user via :class

// helpers for transition
addTransitionClass(cls: string): void
removeTransitionClass(cls: string): void
```

When `patchProp(el, 'class', ...)` is called, update `_baseClass`. Transition hooks use `addTransitionClass` / `removeTransitionClass` to operate on `_classes`. The final class = `_baseClass + ' ' + [..._classes].join(' ')`.

Each class change calls `pushOp(OP.SET_CLASS, el.id, computedClassString)`.

#### Step 1.3: `nextFrame` -- Cross-Frame Timing via Flush Ack

The DOM version uses double rAF to ensure the browser has rendered the enter-from state before switching to enter-to. We leverage the **flush ack callback**:

```typescript
function nextFrame(cb: () => void): void {
  // Approach A: waitForFlush -- wait until the current ops batch has been executed by Main Thread
  // At this point the enter-from class has been applied and Lynx has completed at least one layout
  waitForFlush().then(cb);

  // Approach B: If waitForFlush granularity isn't sufficient, introduce a new OP:
  //   OP.REQUEST_FRAME -- Main Thread receives it, does rAF -> callback to BG
  //   But this increases protocol complexity, so validate with Approach A first
}
```

#### Step 1.4: `whenTransitionEnds` -- Animation End Detection

Two strategies, tried by priority:

**Strategy A: Event Listening (preferred)**

Bind `transitionend` / `animationend` via the existing event system:

```typescript
function onTransitionEnd(
  el: ShadowElement,
  expectedType: 'transition' | 'animation',
  cb: () => void,
) {
  const eventName = expectedType === 'transition'
    ? 'transitionend'
    : 'animationend';
  const sign = register((data) => {
    // Optional: check if data.propertyName matches
    unregister(sign); // one-time listener
    cb();
  });
  pushOp(OP.SET_EVENT, el.id, 'bindEvent', eventName, sign);
}
```

**Strategy B: Timeout Fallback**

If the event doesn't fire correctly (e.g., no actual CSS transition is defined), use the time specified by the `duration` prop as a `setTimeout` fallback:

```typescript
if (props.duration) {
  setTimeout(done, normalizedDuration);
}
```

The DOM version uses `getComputedStyle()` to detect whether an element has a transition/animation definition. Under dual threads we cannot synchronously call `getComputedStyle()`, so we **must rely on events or the duration prop**.

#### Step 1.5: Complete `resolveTransitionProps` Implementation

```typescript
function resolveTransitionProps(
  rawProps: TransitionProps,
): BaseTransitionProps<ShadowElement> {
  const name = rawProps.name || 'v';
  const {
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
  } = rawProps;

  return {
    ...rawProps, // mode, appear, persisted, user hooks passthrough

    onBeforeEnter(el) {
      callHook(rawProps.onBeforeEnter, [el]);
      addTransitionClass(el, enterFromClass);
      addTransitionClass(el, enterActiveClass);
    },

    onEnter(el, done) {
      // Next frame (after flush ack) toggle classes
      nextFrame(() => {
        removeTransitionClass(el, enterFromClass);
        addTransitionClass(el, enterToClass);

        if (!hasExplicitDuration(rawProps)) {
          // Listen for transitionend / animationend
          whenTransitionEnds(el, rawProps.type, done);
        } else {
          setTimeout(done, normalizeDuration(rawProps.duration).enter);
        }
      });
      callHook(rawProps.onEnter, [el, done]);
    },

    onAfterEnter(el) {
      removeTransitionClass(el, enterActiveClass);
      removeTransitionClass(el, enterToClass);
      callHook(rawProps.onAfterEnter, [el]);
    },

    onBeforeLeave(el) {
      callHook(rawProps.onBeforeLeave, [el]);
      addTransitionClass(el, leaveFromClass);
      addTransitionClass(el, leaveActiveClass);
    },

    onLeave(el, done) {
      nextFrame(() => {
        removeTransitionClass(el, leaveFromClass);
        addTransitionClass(el, leaveToClass);

        if (!hasExplicitDuration(rawProps)) {
          whenTransitionEnds(el, rawProps.type, done);
        } else {
          setTimeout(done, normalizeDuration(rawProps.duration).leave);
        }
      });
      callHook(rawProps.onLeave, [el, done]);
    },

    onAfterLeave(el) {
      removeTransitionClass(el, leaveActiveClass);
      removeTransitionClass(el, leaveToClass);
      callHook(rawProps.onAfterLeave, [el]);
    },

    onEnterCancelled(el) {
      removeTransitionClass(el, enterFromClass);
      removeTransitionClass(el, enterActiveClass);
      removeTransitionClass(el, enterToClass);
      callHook(rawProps.onEnterCancelled, [el]);
    },

    onLeaveCancelled(el) {
      removeTransitionClass(el, leaveFromClass);
      removeTransitionClass(el, leaveActiveClass);
      removeTransitionClass(el, leaveToClass);
      callHook(rawProps.onLeaveCancelled, [el]);
    },
  };
}
```

#### Step 1.6: Export and Registration

```typescript
// packages/vue/runtime/src/index.ts
export { Transition } from './components/Transition.js';
// Do not export BaseTransition (users use Transition directly)
```

Vue's SFC template compiler resolves `<Transition>` to `_component_Transition`. We need to ensure `Transition` is registered as a global component, or that the module alias points `vue` to our runtime (this configuration already exists).

---

### Phase 2: `<TransitionGroup>` -- List Animation

#### Step 2.1: Basic Enter/Leave Animation

`TransitionGroup` independently applies enter/leave transition hooks to **each child element**. Main differences from `Transition`:

- Renders as a real container element (default `<view>`, customizable via `tag` prop)
- All child elements must have a unique `key`
- Each child element gets its own `TransitionHooks`

```typescript
// packages/vue/runtime/src/components/TransitionGroup.ts
import { TransitionGroup as BaseTransitionGroup } from '@vue/runtime-core';

export const TransitionGroup = defineComponent({
  name: 'TransitionGroup',
  props: {
    tag: { type: String, default: 'view' },
    // ... same props as Transition (name, duration, classes, etc.)
  },
  setup(props, { slots }) {
    // Apply resolveTransitionHooks to each child VNode
    // Wrap in h(props.tag, ...) when rendering
  },
});
```

#### Step 2.2: Move Animation (Phase 2b -- Pending DOM Query API Readiness)

Move animation (FLIP animation when list items are reordered) requires:

1. Reading each element's bounding rect before the patch (`positionMap`)
2. Reading the new positions after the patch (`newPositionMap`)
3. Computing the delta and animating with `transform: translate(dx, dy)`

**Dual-thread challenge**: `getBoundingClientRect()` is on the Main Thread; BG cannot call it synchronously.

**Possible approaches**:

| Approach                  | Description                                                    | Complexity          |
| ------------------------- | -------------------------------------------------------------- | ------------------- |
| **A. New OP: QUERY_RECT** | BG sends QUERY_RECT ops to MT, MT reads rect and callbacks BG  | Medium -- requires async ops |
| **B. Main Thread Script** | Move the entire move computation to Main Thread, execute FLIP via worklet | High -- but best performance |
| **C. Skip move**          | Only support enter/leave, not move                             | Low -- but incomplete functionality |

**Recommendation**: Phase 1 goes with **Approach C** (skip move), Phase 2b implements **Approach A** (QUERY_RECT + async callback).

---

### Phase 3: Verification and Testing

#### Step 3.1: Unit Tests

**File**: `packages/vue/runtime/__tests__/transition.test.ts`

Can verify the ops sequence in a pure BG Thread environment:

```typescript
describe('Transition', () => {
  it('emits correct ops sequence for enter', async () => {
    const App = defineComponent({
      setup() {
        const show = ref(false)
        return { show }
      },
      render() {
        return h(Transition, { name: 'fade' }, {
          default: () => this.show ? h('view', { key: 'content' }, 'Hello') : null
        })
      }
    })

    const app = createApp(App)
    app.mount()
    let ops = takeOps()
    // Initial: nothing rendered (show=false)

    // Trigger enter
    app._instance.setupState.show = true
    await nextTick()
    ops = takeOps()

    // Expect: CREATE, SET_CLASS('fade-enter-from fade-enter-active'), INSERT
    expect(ops).toContainOp(OP.SET_CLASS, expect.any(Number), 'fade-enter-from fade-enter-active')
    expect(ops).toContainOp(OP.INSERT, ...)

    // After flush ack: SET_CLASS('fade-enter-active fade-enter-to')
    // After transitionend: SET_CLASS('') + afterEnter
  })

  it('emits correct ops for leave', ...)
  it('supports out-in mode', ...)
  it('supports appear', ...)
  it('cancels enter when leave starts', ...)
  it('explicit duration uses setTimeout', ...)
})
```

#### Step 3.2: E2E Demo

**File**: `packages/vue/e2e-lynx/src/transition-demo/`

```vue
<template>
  <view>
    <view bindtap="toggle">Toggle</view>
    <Transition name="fade">
      <view v-if="show" class="box">Hello Transition!</view>
    </Transition>
  </view>
</template>

<script setup>
import { ref } from 'vue-lynx';
const show = ref(true);
const toggle = () => {
  show.value = !show.value;
};
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition-property: opacity;
  transition-duration: 300ms;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

#### Step 3.3: TransitionGroup Demo

```vue
<template>
  <view>
    <view bindtap="add">Add Item</view>
    <TransitionGroup name="list" tag="view">
      <view v-for="item in items" :key="item" class="item">
        {{ item }}
      </view>
    </TransitionGroup>
  </view>
</template>

<style>
.list-enter-active, .list-leave-active {
  transition-property: opacity, transform;
  transition-duration: 300ms;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
```

---

## Risk Assessment

| Risk                                                                                                       | Impact                           | Mitigation                                                 |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| `waitForFlush` as `nextFrame` has insufficient granularity -- enter-from and enter-to may be merged in the same Lynx layout cycle | Animation does not play          | Introduce `OP.REQUEST_FRAME`, have MT do one rAF then callback |
| `transitionend` event does not fire (if the element has no CSS transition definition)                       | Element is not removed after leave animation | Always set the `duration` prop or implement a timeout fallback |
| `__SetClasses` behavior is replace (not add/remove)                                                        | Need to maintain full class state on BG | Maintain `_classes` + `_baseClass` on ShadowElement       |
| TransitionGroup's move animation requires bounding rect queries                                             | Cannot implement move in Phase 1 | Phase it: enter/leave first                                |

## Dependencies

- `@vue/runtime-core`'s `BaseTransition`, `resolveTransitionHooks` (already available)
- Existing ops protocol (`SET_CLASS`, `SET_EVENT`) -- no new op codes needed
- `waitForFlush()` -- already available
- `register()` / `unregister()` event registration -- already available
- Lynx CSS transition/animation engine -- platform capability

## Deliverables

| Phase        | Deliverables                                                            | Estimated Change Size |
| ------------ | ----------------------------------------------------------------------- | --------------------- |
| **Phase 1**  | `Transition` component + class management + nextFrame + whenTransitionEnds | ~300 lines new code   |
| **Phase 2a** | `TransitionGroup` (enter/leave only)                                    | ~150 lines new code   |
| **Phase 2b** | `TransitionGroup` move animation (QUERY_RECT)                          | ~200 lines + new OP   |
| **Phase 3**  | Unit tests + E2E demo                                                   | ~400 lines of tests   |

## Open Questions

1. **`__SetClasses` semantics**: Currently ops-apply.ts calls `__SetClasses(el, cls)` -- is this a full replacement or an append? If it's a replacement, BG must manage the full class string. -> From the code it's a replacement; BG must manage it.

2. **Lynx's `transitionend` event data format**: Does it include `propertyName`? This affects whether we can precisely determine which property's transition has completed. If not, we need a counter-based approach (counting how many properties are transitioning).

3. **CSS Scope and Transition Classes**: Lynx's `__SetCSSId` sets CSS scope 0. CSS rules for transition-related classes (such as `.fade-enter-active`) need to be defined in the global scope or scope 0; otherwise selectors won't match. Need to confirm the scope behavior of `<style>` in SFCs under Lynx.

4. **`appear` timing**: On first mount, BaseTransition checks `isMounted`. Under dual threads, does the ops flush for the initial mount and subsequent enter animation class toggling require special handling?
