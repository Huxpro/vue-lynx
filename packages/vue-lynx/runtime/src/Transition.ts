// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * <Transition> component for vue-lynx.
 *
 * Wraps Vue's platform-agnostic BaseTransition with Lynx-specific CSS class
 * management and transition-end detection.  The approach mirrors @vue/runtime-dom's
 * Transition but replaces DOM APIs (rAF, getComputedStyle, classList) with
 * vue-lynx's ops-based class management and flush-ack timing.
 */

import {
  BaseTransition,
  type BaseTransitionProps,
  type FunctionalComponent,
  h,
  queuePostFlushCb,
} from '@vue/runtime-core';

import { waitForFlush } from './flush.js';
import { resolveClass } from './node-ops.js';
import { OP, pushOp } from './ops.js';
import { register, unregister } from './event-registry.js';
import { scheduleFlush } from './flush.js';
import type { ShadowElement } from './shadow-element.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  // User JS hooks (passed through to BaseTransition)
  onBeforeEnter?: (el: ShadowElement) => void;
  onEnter?: (el: ShadowElement, done: () => void) => void;
  onAfterEnter?: (el: ShadowElement) => void;
  onEnterCancelled?: (el: ShadowElement) => void;
  onBeforeLeave?: (el: ShadowElement) => void;
  onLeave?: (el: ShadowElement, done: () => void) => void;
  onAfterLeave?: (el: ShadowElement) => void;
  onLeaveCancelled?: (el: ShadowElement) => void;
  onBeforeAppear?: (el: ShadowElement) => void;
  onAppear?: (el: ShadowElement, done: () => void) => void;
  onAfterAppear?: (el: ShadowElement) => void;
  onAppearCancelled?: (el: ShadowElement) => void;
}

// ---------------------------------------------------------------------------
// Transition class helpers
// ---------------------------------------------------------------------------

function addTransitionClass(el: ShadowElement, cls: string): void {
  el._transitionClasses.add(cls);
  pushOp(OP.SET_CLASS, el.id, resolveClass(el));
  scheduleFlush();
}

function removeTransitionClass(el: ShadowElement, cls: string): void {
  el._transitionClasses.delete(cls);
  pushOp(OP.SET_CLASS, el.id, resolveClass(el));
  scheduleFlush();
}

// ---------------------------------------------------------------------------
// nextFrame — waits for MT to apply the current ops batch before proceeding.
//
// In DOM land, Vue uses double-rAF to ensure the browser has rendered the
// enter-from state before switching to enter-to.  In our dual-thread model
// we need two things:
//
// 1. Wait for doFlush() to run (it's a post-flush callback queued by
//    scheduleFlush).  We use queuePostFlushCb so our callback runs AFTER
//    doFlush in the same post-flush cycle.
//
// 2. Wait for the MT ack (waitForFlush) — ensures the first batch of ops
//    (enter-from / leave-from classes) has been applied on the Main Thread.
//
// 3. On web/dev, requestAnimationFrame provides a real frame boundary so
//    the browser has painted the initial state before we apply the next.
//    On native BG thread, the cross-thread round-trip already provides this.
// ---------------------------------------------------------------------------

function nextFrame(cb: () => void): void {
  // Step 1: run after doFlush has taken the current ops and sent them to MT
  queuePostFlushCb(() => {
    // Step 2: wait for MT to acknowledge it applied the ops
    waitForFlush().then(() => {
      // Step 3: ensure at least one frame so the initial state is rendered
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(cb);
      } else {
        cb();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// whenTransitionEnds — listens for transitionend/animationend on the element.
//
// Because we can't call getComputedStyle() from the BG thread, we rely on
// either the actual event or an explicit `duration` prop as a timeout fallback.
// ---------------------------------------------------------------------------

function whenTransitionEnds(
  el: ShadowElement,
  expectedType: 'transition' | 'animation' | undefined,
  done: () => void,
): void {
  const eventName =
    expectedType === 'animation' ? 'animationend' : 'transitionend';

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    unregister(sign);
    pushOp(OP.REMOVE_EVENT, el.id, 'bindEvent', eventName);
    scheduleFlush();
    done();
  };

  const sign = register((_data: unknown) => {
    finish();
  });

  pushOp(OP.SET_EVENT, el.id, 'bindEvent', eventName, sign);
  scheduleFlush();
}

// ---------------------------------------------------------------------------
// Duration normalization
// ---------------------------------------------------------------------------

interface NormalizedDuration {
  enter: number;
  leave: number;
}

function normalizeDuration(
  duration: TransitionProps['duration'],
): NormalizedDuration {
  if (typeof duration === 'number') {
    return { enter: duration, leave: duration };
  }
  if (duration && typeof duration === 'object') {
    return { enter: duration.enter, leave: duration.leave };
  }
  return { enter: 0, leave: 0 };
}

function hasExplicitDuration(props: TransitionProps): boolean {
  return props.duration != null;
}

// ---------------------------------------------------------------------------
// Hook helpers
// ---------------------------------------------------------------------------

// biome-ignore lint/suspicious/noExplicitAny: hooks have varying signatures
function callHook(hook: ((...args: any[]) => void) | undefined, args: unknown[]): void {
  if (hook) {
    hook(...args);
  }
}

// ---------------------------------------------------------------------------
// resolveTransitionProps — converts user-facing TransitionProps into
// BaseTransitionProps with concrete lifecycle hooks.
// ---------------------------------------------------------------------------

function resolveTransitionProps(
  rawProps: TransitionProps,
): BaseTransitionProps<ShadowElement> {
  const name = rawProps.name || 'v';
  const {
    type,
    duration,
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    appearFromClass = rawProps.appear ? enterFromClass : undefined,
    appearActiveClass = rawProps.appear ? enterActiveClass : undefined,
    appearToClass = rawProps.appear ? enterToClass : undefined,
  } = rawProps;

  // Pass through non-hook props (mode, appear, persisted, etc.)
  const baseProps: BaseTransitionProps<ShadowElement> = {
    mode: rawProps.mode,
    appear: rawProps.appear,
    persisted: rawProps.persisted,

    onBeforeEnter(el) {
      callHook(rawProps.onBeforeEnter, [el]);
      addTransitionClass(el, enterFromClass);
      addTransitionClass(el, enterActiveClass);
    },

    onEnter(el, done) {
      nextFrame(() => {
        removeTransitionClass(el, enterFromClass);
        addTransitionClass(el, enterToClass);

        if (!hasExplicitDuration(rawProps)) {
          whenTransitionEnds(el, type, done);
        } else {
          setTimeout(done, normalizeDuration(duration).enter);
        }
      });
      callHook(rawProps.onEnter, [el, done]);
    },

    onAfterEnter(el) {
      removeTransitionClass(el, enterActiveClass);
      removeTransitionClass(el, enterToClass);
      callHook(rawProps.onAfterEnter, [el]);
    },

    onEnterCancelled(el) {
      removeTransitionClass(el, enterFromClass);
      removeTransitionClass(el, enterActiveClass);
      removeTransitionClass(el, enterToClass);
      callHook(rawProps.onEnterCancelled, [el]);
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
          whenTransitionEnds(el, type, done);
        } else {
          setTimeout(done, normalizeDuration(duration).leave);
        }
      });
      callHook(rawProps.onLeave, [el, done]);
    },

    onAfterLeave(el) {
      removeTransitionClass(el, leaveActiveClass);
      removeTransitionClass(el, leaveToClass);
      callHook(rawProps.onAfterLeave, [el]);
    },

    onLeaveCancelled(el) {
      removeTransitionClass(el, leaveFromClass);
      removeTransitionClass(el, leaveActiveClass);
      removeTransitionClass(el, leaveToClass);
      callHook(rawProps.onLeaveCancelled, [el]);
    },
  };

  // Appear hooks — only if appear is enabled
  if (rawProps.appear && appearFromClass && appearActiveClass && appearToClass) {
    baseProps.onBeforeAppear = (el) => {
      callHook(rawProps.onBeforeAppear, [el]);
      addTransitionClass(el, appearFromClass);
      addTransitionClass(el, appearActiveClass);
    };

    baseProps.onAppear = (el, done) => {
      nextFrame(() => {
        removeTransitionClass(el, appearFromClass);
        addTransitionClass(el, appearToClass);

        if (!hasExplicitDuration(rawProps)) {
          whenTransitionEnds(el, type, done);
        } else {
          setTimeout(done, normalizeDuration(duration).enter);
        }
      });
      callHook(rawProps.onAppear, [el, done]);
    };

    baseProps.onAfterAppear = (el) => {
      removeTransitionClass(el, appearActiveClass);
      removeTransitionClass(el, appearToClass);
      callHook(rawProps.onAfterAppear, [el]);
    };

    baseProps.onAppearCancelled = (el) => {
      removeTransitionClass(el, appearFromClass);
      removeTransitionClass(el, appearActiveClass);
      removeTransitionClass(el, appearToClass);
      callHook(rawProps.onAppearCancelled, [el]);
    };
  }

  return baseProps;
}

// ---------------------------------------------------------------------------
// <Transition> — functional component wrapper around BaseTransition
// ---------------------------------------------------------------------------

export const Transition: FunctionalComponent<TransitionProps> = (
  props,
  { slots },
) => {
  return h(BaseTransition, resolveTransitionProps(props), slots);
};

Transition.displayName = 'Transition';
