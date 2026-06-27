import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('entry-background lifecycle wrapper', () => {
  let prevLynx: unknown;
  let prevLynxCoreInject: unknown;

  beforeEach(() => {
    prevLynx = (globalThis as any).lynx;
    prevLynxCoreInject = (globalThis as any).lynxCoreInject;
    vi.resetModules();
  });

  afterEach(() => {
    (globalThis as any).lynx = prevLynx;
    (globalThis as any).lynxCoreInject = prevLynxCoreInject;
  });

  it('preserves the existing tt.OnLifecycleEvent handler when installing the wrapper', async () => {
    const trigger = vi.fn();
    (globalThis as any).lynx = {
      getJSModule: (name: string) =>
        name === 'GlobalEventEmitter' ? { trigger } : undefined,
    };

    const prevOnLifecycleEvent = vi.fn();
    const tt: { OnLifecycleEvent?: (event: [string, unknown]) => void } = {
      OnLifecycleEvent: prevOnLifecycleEvent,
    };
    (globalThis as any).lynxCoreInject = { tt };

    await import('../../../vue-lynx/runtime/src/entry-background');

    // The wrapper replaced the original handler.
    expect(tt.OnLifecycleEvent).not.toBe(prevOnLifecycleEvent);

    const event: [string, unknown] = [
      'globalEventFromLepus',
      ['keyboardstatuschanged', [{ height: 300 }]],
    ];
    tt.OnLifecycleEvent?.(event);

    // Our routing still runs...
    expect(trigger).toHaveBeenCalledWith('keyboardstatuschanged', [
      { height: 300 },
    ]);
    // ...and the previously-registered handler is preserved.
    expect(prevOnLifecycleEvent).toHaveBeenCalledWith(event);
  });
});
