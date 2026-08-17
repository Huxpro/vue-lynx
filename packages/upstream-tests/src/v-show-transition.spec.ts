import type {
  DirectiveBinding,
  TransitionHooks,
  VNode,
} from '@vue/runtime-core';
import {
  Transition,
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
  resetForTesting,
  vShow,
  withDirectives,
} from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import { ShadowElement } from '../../vue-lynx/runtime/src/shadow-element.js';
import { collectFlushedOps, resetCapturedOps } from './local-test-setup.js';

type VShowHook = (
  el: ShadowElement,
  binding: DirectiveBinding<unknown>,
  vnode: VNode<ShadowElement, ShadowElement>,
  prevVNode: VNode<ShadowElement, ShadowElement> | null,
) => void;

function binding(value: unknown, oldValue?: unknown): DirectiveBinding<unknown> {
  return {
    instance: null,
    value,
    oldValue,
    arg: undefined,
    modifiers: {},
    dir: vShow,
  };
}

function vnode(transition: TransitionHooks<ShadowElement> | null): VNode<ShadowElement, ShadowElement> {
  return { transition } as VNode<ShadowElement, ShadowElement>;
}

function invoke(
  hook: VShowHook | undefined,
  el: ShadowElement,
  value: unknown,
  oldValue: unknown,
  transition: TransitionHooks<ShadowElement> | null,
): void {
  expect(hook).toBeTypeOf('function');
  (hook as VShowHook)(el, binding(value, oldValue), vnode(transition), null);
}

function setStyleOps(ops: unknown[]): Array<Record<string, unknown>> {
  const styles: Array<Record<string, unknown>> = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === OP.SET_STYLE) {
      styles.push(ops[i + 2] as Record<string, unknown>);
      i += 2;
    }
  }
  return styles;
}

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
});

describe('vShow with persisted transitions', () => {
  it('keeps enter-from in place for a full painted web frame', async () => {
    const previousRaf = globalThis.requestAnimationFrame;
    const frames: FrameRequestCallback[] = [];
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    };

    try {
      const visible = ref(false);
      let element: ShadowElement | undefined;
      const App = defineComponent({
        setup() {
          return () => h(Transition, {
            persisted: true,
            duration: 0,
            onBeforeEnter(el: ShadowElement) {
              element = el;
            },
          }, {
            default: () => [withDirectives(h('view'), [[vShow, visible.value]])],
          });
        },
      });

      createApp(App).mount();
      await nextTick();
      collectFlushedOps();

      visible.value = true;
      await nextTick();
      await Promise.resolve();

      expect(element?._transitionClasses).toContain('v-enter-from');
      expect(frames).toHaveLength(1);

      frames.shift()!(0);
      expect(element?._transitionClasses).toContain('v-enter-from');
      expect(frames).toHaveLength(1);

      frames.shift()!(16);
      expect(element?._transitionClasses).not.toContain('v-enter-from');
      expect(element?._transitionClasses).toContain('v-enter-to');
    }
    finally {
      globalThis.requestAnimationFrame = previousRaf;
    }
  });

  it('runs enter hooks around the initial visible mount', async () => {
    const calls: string[] = [];
    const el = new ShadowElement('view');
    el._style = { display: 'flex', opacity: 1 };
    const transition = {
      beforeEnter: () => calls.push('beforeEnter'),
      enter: () => calls.push('enter'),
    } as TransitionHooks<ShadowElement>;

    invoke(vShow.beforeMount, el, true, undefined, transition);
    expect(calls).toEqual(['beforeEnter']);
    expect(el._vShowHidden).toBe(false);

    invoke(vShow.mounted, el, true, undefined, transition);
    expect(calls).toEqual(['beforeEnter', 'enter']);

    await nextTick();
    expect(setStyleOps(collectFlushedOps())).toEqual([]);
  });

  it('keeps the element visible until the leave hook finishes', async () => {
    const calls: string[] = [];
    const el = new ShadowElement('view');
    el._style = { display: 'flex', opacity: 1 };
    let finishLeave: (() => void) | undefined;
    const transition = {
      leave: (_el: ShadowElement, done: () => void) => {
        calls.push('leave');
        finishLeave = done;
      },
    } as TransitionHooks<ShadowElement>;

    invoke(vShow.updated, el, false, true, transition);
    expect(calls).toEqual(['leave']);
    expect(el._vShowHidden).toBe(false);

    await nextTick();
    expect(setStyleOps(collectFlushedOps())).toEqual([]);

    finishLeave?.();
    expect(el._vShowHidden).toBe(true);
    await nextTick();
    expect(setStyleOps(collectFlushedOps()).at(-1)).toEqual({
      display: 'none',
      opacity: 1,
    });
  });

  it('restores display before running the enter hook on updates', async () => {
    const calls: string[] = [];
    const el = new ShadowElement('view');
    el._style = { display: 'flex', opacity: 1 };
    el._vShowHidden = true;
    const transition = {
      beforeEnter: () => calls.push('beforeEnter'),
      enter: () => {
        calls.push(`enter:${el._vShowHidden ? 'hidden' : 'visible'}`);
      },
    } as TransitionHooks<ShadowElement>;

    invoke(vShow.updated, el, true, false, transition);

    expect(calls).toEqual(['beforeEnter', 'enter:visible']);
    expect(el._vShowHidden).toBe(false);
    await nextTick();
    expect(setStyleOps(collectFlushedOps()).at(-1)).toEqual({
      display: 'flex',
      opacity: 1,
    });
  });

  it('ignores updates whose boolean visibility did not change', async () => {
    const leave = vi.fn();
    const el = new ShadowElement('view');
    const transition = { leave } as unknown as TransitionHooks<ShadowElement>;

    invoke(vShow.updated, el, 0, null, transition);

    expect(leave).not.toHaveBeenCalled();
    await nextTick();
    expect(setStyleOps(collectFlushedOps())).toEqual([]);
  });

  it('applies the current display state before unmount', async () => {
    const el = new ShadowElement('view');
    el._style = { display: 'flex' };

    invoke(vShow.beforeUnmount, el, false, undefined, null);

    expect(el._vShowHidden).toBe(true);
    await nextTick();
    expect(setStyleOps(collectFlushedOps()).at(-1)).toEqual({ display: 'none' });
  });
});
