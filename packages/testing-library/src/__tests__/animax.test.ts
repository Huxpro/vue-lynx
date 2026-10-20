/**
 * useAnimaX — the controller turns `<animax-view>` UI methods into Promises
 * through the template ref's NodesRef.invoke, and rejects when unmounted.
 */

import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, useAnimaX } from 'vue-lynx';
import type { ShadowElement } from '../../../vue-lynx/runtime/src/shadow-element.js';
import { render } from '../index.js';

interface InvokeCall {
  method: string;
  params?: Record<string, unknown>;
  success?: (res: unknown) => void;
  fail?: (res: { code: number }) => void;
}

function mountPlayer() {
  const player = ref<ShadowElement | null>(null);
  const calls: InvokeCall[] = [];
  const Comp = defineComponent({
    setup() {
      return () =>
        h('animax-view', { ref: player, src: 'gift.json', autoplay: false });
    },
  });
  render(Comp);
  const el = player.value!;
  vi.spyOn(el, 'invoke').mockImplementation((options: unknown) => {
    const call = options as InvokeCall;
    calls.push(call);
    return {
      exec: () => {
        if (call.method === 'getDuration') call.success?.({ data: 1200 });
        else if (call.method === 'isAnimating') call.success?.({ data: true });
        else if (call.method === 'seek' && call.params?.['frame'] === -1) {
          call.fail?.({ code: 4 });
        } else call.success?.(undefined);
      },
    } as never;
  });
  return { player, calls };
}

describe('useAnimaX', () => {
  it('invokes playback methods with their params', async () => {
    const { player, calls } = mountPlayer();
    const animax = useAnimaX(player);
    await animax.play();
    await animax.seek(12);
    await animax.playSegment(0, 30);
    await animax.subscribeUpdateEvents([5, 10]);
    expect(calls.map((c) => [c.method, c.params])).toEqual([
      ['play', undefined],
      ['seek', { frame: 12 }],
      ['playSegment', { startFrame: 0, endFrame: 30 }],
      ['subscribeUpdateEvents', { frames: [5, 10] }],
    ]);
  });

  it('unwraps the data of a reading method', async () => {
    const { player } = mountPlayer();
    const animax = useAnimaX(player);
    await expect(animax.getDuration()).resolves.toBe(1200);
    await expect(animax.isAnimating()).resolves.toBe(true);
  });

  it('rejects with the native code when the method fails', async () => {
    const { player } = mountPlayer();
    const animax = useAnimaX(player);
    await expect(animax.seek(-1)).rejects.toThrow('code 4');
  });

  it('rejects when the element is not mounted', async () => {
    const animax = useAnimaX(ref<ShadowElement | null>(null));
    await expect(animax.play()).rejects.toThrow('no <animax-view> mounted');
  });

  it('accepts a getter as the target', async () => {
    const { player, calls } = mountPlayer();
    const animax = useAnimaX(() => player.value);
    await animax.pause();
    expect(calls[0]!.method).toBe('pause');
  });
});
