import { describe, expect, it, vi } from 'vitest';

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
});
