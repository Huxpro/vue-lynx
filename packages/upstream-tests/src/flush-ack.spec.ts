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

  it('never times out with a null timeout (healthy-engine strict mode)', async () => {
    vi.useFakeTimers();
    const ack = createFlushAck(null);
    let resolved = false;
    void ack.promise.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(resolved).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    ack.resolve();
    await ack.promise;
    expect(resolved).toBe(true);
  });

  it('invokes onTimeout only when the fallback timer wins', async () => {
    vi.useFakeTimers();
    const timedOut = vi.fn();

    const fallback = createFlushAck(50, timedOut);
    await vi.advanceTimersByTimeAsync(50);
    await fallback.promise;
    expect(timedOut).toHaveBeenCalledTimes(1);

    const acked = createFlushAck(50, timedOut);
    acked.resolve();
    await vi.advanceTimersByTimeAsync(100);
    await acked.promise;
    expect(timedOut).toHaveBeenCalledTimes(1);
  });
});
