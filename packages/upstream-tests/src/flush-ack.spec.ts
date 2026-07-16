import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFlushAck } from '../../vue-lynx/runtime/src/flush.js';

describe('main-thread flush acknowledgement', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('falls back when an older engine does not invoke the callback', async () => {
    vi.useFakeTimers();
    const ack = createFlushAck(50);
    let resolved = false;
    void ack.promise.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(49);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await ack.promise;
    expect(resolved).toBe(true);
  });

  it('settles immediately when the engine invokes the callback', async () => {
    vi.useFakeTimers();
    const ack = createFlushAck(50);
    ack.resolve();
    await ack.promise;

    expect(vi.getTimerCount()).toBe(0);
  });
});
