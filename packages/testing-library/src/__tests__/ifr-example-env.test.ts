import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Regression guard for the IFR main-thread environment: the hackernews API
// modules must EVALUATE in a context without fetch (a module-scope fetch
// reference would crash the whole MT bundle, taking worklet and
// element-template registrations down with it) and fail only when a request
// is actually made.
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
      validFeeds: Record<string, unknown>;
    };

    expect(api.validFeeds.news).toBeDefined();
    await expect(api.fetchFeed('news', 1)).rejects.toThrow(
      'fetch is not available',
    );
  });
});
