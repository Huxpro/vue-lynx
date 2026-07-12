import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
});

describe('in-app backend chat identity', () => {
  it('rejects duplicate client-supplied chat ids', async () => {
    vi.resetModules();
    const { localApi } = await import('../src/lib/local-backend');
    const id = `local-collision-${Date.now()}`;

    localApi('/api/chats', 'POST', { id });

    expect(() => localApi('/api/chats', 'POST', { id })).toThrowError(
      'Chat id already exists',
    );
  });

  it('keeps the submitted indicator visible before the first assistant part', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { localApi, localStream } = await import('../src/lib/local-backend');
    const id = `local-thinking-${Date.now()}`;
    const controller = new AbortController();
    const chunkTypes: string[] = [];

    localApi('/api/chats', 'POST', { id });
    const stream = localStream(
      id,
      {
        messages: [
          {
            id: `${id}-message`,
            role: 'user',
            parts: [{ type: 'text', text: 'Explain Vue composables' }],
          },
        ],
      },
      controller.signal,
      (chunk) => chunkTypes.push(chunk.type),
    );

    expect(chunkTypes).toEqual(['start', 'start-step']);
    await vi.advanceTimersByTimeAsync(599);
    expect(chunkTypes).not.toContain('reasoning-start');
    await vi.advanceTimersByTimeAsync(1);
    expect(chunkTypes).toContain('reasoning-start');

    controller.abort();
    await vi.runAllTimersAsync();
    await stream;
  });
});
