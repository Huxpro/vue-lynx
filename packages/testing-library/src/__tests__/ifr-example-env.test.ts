import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('IFR example module evaluation', () => {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');

  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  afterEach(() => {
    if (originalFetch) {
      Object.defineProperty(globalThis, 'fetch', originalFetch);
    } else {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    }
  });

  it.each([
    ['hackernews-css', '../../../../examples/hackernews-css/src/api.ts'],
    [
      'hackernews-tailwind',
      '../../../../examples/hackernews-tailwind/src/api.ts',
    ],
  ])('%s loads without fetch and rejects only on request', async (_name, path) => {
    const api = (await import(/* @vite-ignore */ path)) as {
      fetchFeed(feed: string, page: number): Promise<unknown>;
      hasFetch(): boolean;
      validFeeds: Record<string, unknown>;
    };

    expect(api.validFeeds.news).toBeDefined();
    expect(api.hasFetch()).toBe(false);
    const state = await Promise.race([
      api.fetchFeed('news', 1).then(
        () => 'resolved',
        () => 'rejected',
      ),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('pending'), 0);
      }),
    ]);
    expect(state).toBe('rejected');
  });
});
