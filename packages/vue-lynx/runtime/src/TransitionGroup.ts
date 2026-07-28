// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * <TransitionGroup> component for vue-lynx.
 *
 * Renders a real container element (default: 'view') and applies enter/leave
 * transition hooks to each child independently.  Move animations (FLIP) are
 * not supported in this phase because they require synchronous bounding-rect
 * queries which are not available from the Background Thread.
 */

import {
  type SetupContext,
  defineComponent,
  getCurrentInstance,
  h,
  resolveTransitionHooks,
  setTransitionHooks,
  useTransitionState,
  getTransitionRawChildren,
} from '@vue/runtime-core';

import type { ShadowElement } from './shadow-element.js';
import type { TransitionProps } from './Transition.js';
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
// TransitionGroup Props (extends TransitionProps with tag)
// ---------------------------------------------------------------------------

export interface TransitionGroupProps extends TransitionProps {
  tag?: string;
  moveClass?: string;
}

// ---------------------------------------------------------------------------
// <TransitionGroup>
// ---------------------------------------------------------------------------

export const TransitionGroup = defineComponent({
  name: 'TransitionGroup',

  props: {
    tag: { type: String, default: 'view' },
    name: { type: String, default: 'v' },
    type: { type: String as () => 'transition' | 'animation' },
    duration: {
      type: [Number, Object] as unknown as () =>
        | number
        | { enter: number; leave: number },
    },
    appear: Boolean,
    persisted: Boolean,
    enterFromClass: String,
    enterActiveClass: String,
    enterToClass: String,
    leaveFromClass: String,
    leaveActiveClass: String,
    leaveToClass: String,
    appearFromClass: String,
    appearActiveClass: String,
    appearToClass: String,
    moveClass: String,
  },

  setup(props: TransitionGroupProps, { slots }: SetupContext) {
    const instance = getCurrentInstance()!;
    const state = useTransitionState();

    return () => {
      const rawChildren = slots.default ? slots.default() : [];
      const children = getTransitionRawChildren(rawChildren);

      const name = props.name || 'v';
      const enterFromClass = props.enterFromClass || `${name}-enter-from`;
      const enterActiveClass = props.enterActiveClass || `${name}-enter-active`;
      const enterToClass = props.enterToClass || `${name}-enter-to`;
      const leaveFromClass = props.leaveFromClass || `${name}-leave-from`;
      const leaveActiveClass = props.leaveActiveClass || `${name}-leave-active`;
      const leaveToClass = props.leaveToClass || `${name}-leave-to`;

      for (const child of children) {
        if (child.key == null) continue;

        const hooks = resolveTransitionHooks(
          child,
          {
            mode: undefined, // TransitionGroup has no mode
            appear: state.isMounted ? false : !!props.appear,
            persisted: false,

            onBeforeEnter(el: ShadowElement) {
              callHook(props.onBeforeEnter, [el]);
              addTransitionClass(el, enterFromClass);
              addTransitionClass(el, enterActiveClass);
            },

            onEnter(el: ShadowElement, done: () => void) {
              nextFrame(() => {
                removeTransitionClass(el, enterFromClass);
                addTransitionClass(el, enterToClass);

                if (!hasExplicitDuration(props)) {
                  whenTransitionEnds(el, props.type, done);
                } else {
                  setTimeout(done, normalizeDuration(props.duration).enter);
                }
              });
              callHook(props.onEnter, [el, done]);
            },

            onAfterEnter(el: ShadowElement) {
              removeTransitionClass(el, enterActiveClass);
              removeTransitionClass(el, enterToClass);
              callHook(props.onAfterEnter, [el]);
            },

            onEnterCancelled(el: ShadowElement) {
              removeTransitionClass(el, enterFromClass);
              removeTransitionClass(el, enterActiveClass);
              removeTransitionClass(el, enterToClass);
              callHook(props.onEnterCancelled, [el]);
            },

            onBeforeLeave(el: ShadowElement) {
              callHook(props.onBeforeLeave, [el]);
              addTransitionClass(el, leaveFromClass);
              addTransitionClass(el, leaveActiveClass);
            },

            onLeave(el: ShadowElement, done: () => void) {
              nextFrame(() => {
                removeTransitionClass(el, leaveFromClass);
                addTransitionClass(el, leaveToClass);

                if (!hasExplicitDuration(props)) {
                  whenTransitionEnds(el, props.type, done);
                } else {
                  setTimeout(done, normalizeDuration(props.duration).leave);
                }
              });
              callHook(props.onLeave, [el, done]);
            },

            onAfterLeave(el: ShadowElement) {
              removeTransitionClass(el, leaveActiveClass);
              removeTransitionClass(el, leaveToClass);
              callHook(props.onAfterLeave, [el]);
            },

            onLeaveCancelled(el: ShadowElement) {
              removeTransitionClass(el, leaveFromClass);
              removeTransitionClass(el, leaveActiveClass);
              removeTransitionClass(el, leaveToClass);
              callHook(props.onLeaveCancelled, [el]);
            },
          },
          state,
          instance,
        );

        setTransitionHooks(child, hooks);
      }

      return h(props.tag!, null, children);
    };
  },
});
