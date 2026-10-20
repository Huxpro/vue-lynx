// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * <TransitionGroup> component for vue-lynx.
 *
 * Renders a real container element (default: 'view') and applies enter/leave
 * transition hooks to each child independently.  Move animations (FLIP) are
 * opt-in through the `move` prop and run on the main thread (see
 * main-thread/src/flip-apply.ts): the background thread cannot measure, so it
 * only tracks children and marks an update.
 */

import {
  type SetupContext,
  type VNode,
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  resolveTransitionHooks,
  setTransitionHooks,
  useTransitionState,
  getTransitionRawChildren,
} from '@vue/runtime-core';

import { scheduleFlush } from './flush.js';
import { OP, pushOp } from './ops.js';
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
  /**
   * Animate children that change position (FLIP). `true` for 300ms, or the
   * duration in milliseconds. Runs on the main thread from each child's last
   * laid-out rect; `moveClass` is not used on Lynx.
   */
  move?: boolean | number;
  /** Timing function of the move animation. @defaultValue 'ease' */
  moveEasing?: string;
}

const DEFAULT_MOVE_MS = 300;

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
    move: { type: [Boolean, Number] as unknown as () => boolean | number },
    moveEasing: { type: String, default: 'ease' },
  },

  setup(props: TransitionGroupProps, { slots }: SetupContext) {
    const instance = getCurrentInstance()!;
    const state = useTransitionState();

    // FLIP bookkeeping: every keyed child is tracked on the main thread from
    // mount, and an update sends FLIP_MOVE for the children now on screen.
    let lastChildren: VNode[] = [];
    const tracked = new Set<number>();

    const childIds = (): number[] => {
      const ids: number[] = [];
      for (const child of lastChildren) {
        const id = (child.el as ShadowElement | null)?.id;
        if (typeof id === 'number') ids.push(id);
      }
      return ids;
    };

    const syncTracking = (ids: number[]): void => {
      const current = new Set(ids);
      for (const id of tracked) {
        if (!current.has(id)) {
          pushOp(OP.FLIP_UNTRACK, id);
          tracked.delete(id);
        }
      }
      for (const id of ids) {
        if (!tracked.has(id)) {
          pushOp(OP.FLIP_TRACK, id);
          tracked.add(id);
        }
      }
    };

    const moveDuration = (): number =>
      typeof props.move === 'number' ? props.move : DEFAULT_MOVE_MS;

    onMounted(() => {
      if (!props.move) return;
      syncTracking(childIds());
      scheduleFlush();
    });

    onUpdated(() => {
      if (!props.move) return;
      const ids = childIds();
      syncTracking(ids);
      if (ids.length > 0) {
        pushOp(OP.FLIP_MOVE, ids, moveDuration(), props.moveEasing ?? 'ease');
      }
      scheduleFlush();
    });

    onBeforeUnmount(() => {
      for (const id of tracked) pushOp(OP.FLIP_UNTRACK, id);
      tracked.clear();
      scheduleFlush();
    });

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

      lastChildren = children;
      return h(props.tag!, null, children);
    };
  },
});
