import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  private readonly data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  vi.resetModules();
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useColorMode', () => {
  it('restores a persisted dark preference', async () => {
    storage.setItem('ai-chat:color-mode', 'dark');

    const { useColorMode } = await import('../src/composables/useColorMode');

    expect(useColorMode().colorMode.value).toBe('dark');
  });

  it('persists changes through the storage abstraction', async () => {
    const { nextTick } = await import('vue');
    const { useColorMode } = await import('../src/composables/useColorMode');

    useColorMode().colorMode.value = 'dark';
    await nextTick();

    expect(storage.getItem('ai-chat:color-mode')).toBe('dark');
  });

  it('falls back to light for an invalid stored value', async () => {
    storage.setItem('ai-chat:color-mode', 'sepia');

    const { useColorMode } = await import('../src/composables/useColorMode');

    expect(useColorMode().colorMode.value).toBe('light');
  });
});
