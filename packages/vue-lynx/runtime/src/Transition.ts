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
} from '@vue/runtime-core';

import type { ShadowElement } from './shadow-element.js';
import {
  addTransitionClass,
  callHook,
  hasExplicitDuration,
  nextFrame,
  normalizeDuration,
  removeTransitionClass,
  whenTransitionEnds,
} from './transition-shared.js';

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
