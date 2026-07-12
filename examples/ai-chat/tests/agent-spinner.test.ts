import { readFile } from 'node:fs/promises';

import { effectScope, type ComputedRef } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSpinnerFrame } from '../src/composables/useSpinnerFrame';
import { dots2 } from '../src/lib/agent-spinner';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('agent spinner', () => {
  it('vendors the upstream dots2 definition exactly', () => {
    expect(dots2).toEqual({
      name: 'dots2',
      frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
      interval: 80,
      category: 'braille',
    });
  });

  it('advances in order and wraps', () => {
    vi.useFakeTimers();
    const scope = effectScope();
    let frame!: ComputedRef<string>;

    scope.run(() => {
      frame = useSpinnerFrame(dots2.frames, dots2.interval, false);
    });

    expect(frame.value).toBe('⣾');
    vi.advanceTimersByTime(80);
    expect(frame.value).toBe('⣽');
    vi.advanceTimersByTime(80 * 7);
    expect(frame.value).toBe('⣾');
    scope.stop();
  });

  it('clears the timer when its component scope is disposed', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const scope = effectScope();

    scope.run(() => useSpinnerFrame(dots2.frames, dots2.interval, false));
    scope.stop();

    expect(clearIntervalSpy).toHaveBeenCalledOnce();
  });

  it('uses a stable frame without scheduling motion when reduced motion is requested', () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const scope = effectScope();
    let frame!: ComputedRef<string>;

    scope.run(() => {
      frame = useSpinnerFrame(dots2.frames, dots2.interval, true);
    });

    vi.advanceTimersByTime(800);
    expect(frame.value).toBe('⣾');
    expect(setIntervalSpy).not.toHaveBeenCalled();
    scope.stop();
  });

  it('keeps Indicator as a compatibility wrapper around AgentSpinner', async () => {
    const [indicator, spinner] = await Promise.all([
      readFile(new URL('../src/components/chat/Indicator.vue', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/chat/AgentSpinner.vue', import.meta.url), 'utf8'),
    ]);

    expect(indicator).toContain("import AgentSpinner from './AgentSpinner.vue'");
    expect(indicator).toContain('<AgentSpinner />');
    expect(indicator).not.toContain('patterns');
    expect(spinner).toContain('useSpinnerFrame(dots2.frames, dots2.interval)');
    expect(spinner).toContain('width: 16px');
    expect(spinner).toContain('height: 16px');
  });
});
