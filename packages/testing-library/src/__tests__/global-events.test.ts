import { describe, expect, it, vi } from 'vitest';
import { onLifecycleEvent } from '../../../vue-lynx/runtime/src/global-events';

describe('global events', () => {
  it('routes globalEventFromLepus to GlobalEventEmitter', () => {
    const trigger = vi.fn();
    const prevLynx = (globalThis as any).lynx;

    (globalThis as any).lynx = {
      getJSModule: vi.fn((name: string) => {
        if (name === 'GlobalEventEmitter') {
          return { trigger };
        }

        return undefined;
      }),
    };

    try {
      onLifecycleEvent([
        'globalEventFromLepus',
        ['keyboardstatuschanged', [{ height: 300 }]],
      ]);

      expect(trigger).toHaveBeenCalledWith('keyboardstatuschanged', [
        { height: 300 },
      ]);
    } finally {
      (globalThis as any).lynx = prevLynx;
    }
  });

  it('ignores other lifecycle events', () => {
    const trigger = vi.fn();
    const prevLynx = (globalThis as any).lynx;

    (globalThis as any).lynx = {
      getJSModule: vi.fn(() => ({ trigger })),
    };

    try {
      expect(() => {
        onLifecycleEvent(['updatePage', { data: true }]);
      }).not.toThrow();
      expect(trigger).not.toHaveBeenCalled();
    } finally {
      (globalThis as any).lynx = prevLynx;
    }
  });
});
