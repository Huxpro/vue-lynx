/**
 * <TransitionGroup move>: children are tracked on the main thread from mount,
 * a reorder sends FLIP_MOVE in the same batch, and the next layoutchange of a
 * moved child animates it from its previous rect with __ElementAnimate.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick, TransitionGroup } from 'vue-lynx';
import { render } from '../index.js';
import {
  applyFlipMove,
  applyFlipTrack,
  onLayoutChange,
  resetFlipState,
  FLIP_WORKLET_ID,
} from '../../../vue-lynx/main-thread/src/flip-apply.js';
import { elements } from '../../../vue-lynx/main-thread/src/element-registry.js';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface WorkletCtx {
  _wkltId: string;
  id: number;
}

interface TestingEnv {
  mainThread: { globalThis: Record<string, unknown> };
  switchToMainThread(): void;
  switchToBackgroundThread(): void;
}

const env = (globalThis as { lynxTestingEnv: TestingEnv }).lynxTestingEnv;
const mt = env.mainThread.globalThis;

function installMainThreadStubs() {
  const animate = vi.fn();
  mt['__ElementAnimate'] = animate;
  // The real worklet runtime binds the registered function to its ctx; the
  // test environment has no runtime, so route the event the same way.
  mt['runWorklet'] = (ctx: WorkletCtx, params: unknown[]) => {
    onLayoutChange.call(ctx, params[0] as { detail?: Partial<Rect> });
  };
  return animate;
}

function layoutChange(el: Element, rect: Rect) {
  const evt = new (el.ownerDocument.defaultView as Window).Event('bindEvent:layoutchange');
  // The environment copies own properties of the event into the worklet
  // params; a CustomEvent's detail lives on the prototype and would be lost.
  Object.defineProperty(evt, 'detail', { value: rect, enumerable: true });
  el.dispatchEvent(evt);
}

async function flush() {
  await nextTick();
  await nextTick();
}

afterEach(() => {
  resetFlipState();
  delete mt['__ElementAnimate'];
  delete mt['runWorklet'];
});

describe('TransitionGroup move', () => {
  it('tracks every keyed child from mount', async () => {
    const Comp = defineComponent({
      render() {
        return h(TransitionGroup, { move: true }, {
          default: () => ['a', 'b'].map((k) => h('view', { key: k, id: `item-${k}` })),
        });
      },
    });
    const { container } = render(Comp);
    await flush();
    for (const k of ['a', 'b']) {
      const el = container.querySelector(`[id="item-${k}"]`) as Element & {
        eventMap?: Record<string, unknown>;
      };
      expect(el).not.toBeNull();
      expect(el.eventMap?.['bindEvent:layoutchange']).toBeTypeOf('function');
    }
  });

  it('does nothing without the move prop', async () => {
    const Comp = defineComponent({
      render() {
        return h(TransitionGroup, null, {
          default: () => [h('view', { key: 'a', id: 'plain' })],
        });
      },
    });
    const { container } = render(Comp);
    await flush();
    const el = container.querySelector('[id="plain"]') as Element & {
      eventMap?: Record<string, unknown>;
    };
    expect(el.eventMap?.['bindEvent:layoutchange']).toBeUndefined();
  });

  it('animates a reordered child from its previous rect', async () => {
    const animate = installMainThreadStubs();
    const order = ref(['a', 'b', 'c']);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TransitionGroup, { move: 200, moveEasing: 'ease-out' }, {
            default: () =>
              order.value.map((k) => h('view', { key: k, id: `item-${k}` })),
          });
      },
    });
    const { container } = render(Comp);
    await flush();
    const a = container.querySelector('[id="item-a"]')!;
    const c = container.querySelector('[id="item-c"]')!;

    // The first layout of each child only records its rect.
    layoutChange(a, { left: 0, top: 0, width: 100, height: 40 });
    layoutChange(c, { left: 0, top: 80, width: 100, height: 40 });
    expect(animate).not.toHaveBeenCalled();

    order.value = ['c', 'b', 'a'];
    await flush();

    layoutChange(a, { left: 0, top: 80, width: 100, height: 40 });
    layoutChange(c, { left: 0, top: 0, width: 100, height: 40 });

    expect(animate).toHaveBeenCalledTimes(2);
    const [, argsA] = animate.mock.calls[0]!;
    expect(argsA[2]).toEqual([
      { transform: 'translate(0px, -80px)' },
      { transform: 'translate(0px, 0px)' },
    ]);
    expect(argsA[3]).toMatchObject({ duration: 200, timingFunction: 'ease-out' });
    const [, argsC] = animate.mock.calls[1]!;
    expect(argsC[2][0]).toEqual({ transform: 'translate(0px, 80px)' });

    // A later layout change with no pending move animates nothing.
    layoutChange(a, { left: 0, top: 90, width: 100, height: 40 });
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it('ignores a child that did not move and a stale move', () => {
    const animate = installMainThreadStubs();
    const fake = {} as never;
    elements.set(999, fake);
    const ctx: WorkletCtx = { _wkltId: FLIP_WORKLET_ID, id: 999 };
    // Direct calls run on the thread the worklet runs on.
    env.switchToMainThread();
    try {
      onLayoutChange.call(ctx, { detail: { left: 10, top: 10, width: 1, height: 1 } });
      applyFlipMove([999, 1000], 300, 'ease');
      onLayoutChange.call(ctx, { detail: { left: 10, top: 10, width: 1, height: 1 } });
      expect(animate).not.toHaveBeenCalled();

      vi.useFakeTimers();
      applyFlipMove([999], 300, 'ease');
      vi.advanceTimersByTime(1000);
      onLayoutChange.call(ctx, { detail: { left: 50, top: 10, width: 1, height: 1 } });
      expect(animate).not.toHaveBeenCalled();
      vi.useRealTimers();

      applyFlipMove([999], 300, 'ease');
      onLayoutChange.call(ctx, { detail: { left: 70, top: 10, width: 1, height: 1 } });
      expect(animate).toHaveBeenCalledTimes(1);
      expect(animate.mock.calls[0]![1][2][0]).toEqual({ transform: 'translate(-20px, 0px)' });
    } finally {
      elements.delete(999);
      vi.useRealTimers();
      env.switchToBackgroundThread();
    }
  });

  it('applyFlipTrack needs the element and the worklet runtime', () => {
    expect(() => applyFlipTrack(123456)).not.toThrow();
  });
});
