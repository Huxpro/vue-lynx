/**
 * Tiny persistent KV used where the original relied on cookies
 * (selected model, color mode, session id). Web preview has localStorage;
 * native Lynx falls back to in-memory (resets per launch).
 */
const memory = new Map<string, string>();

function localStorageOrNull(): Storage | null {
  try {
    const g = globalThis as { localStorage?: Storage };
    if (g.localStorage) {
      g.localStorage.setItem('__probe__', '1');
      g.localStorage.removeItem('__probe__');
      return g.localStorage;
    }
  } catch {
    /* not available */
  }
  return null;
}

const store = localStorageOrNull();

export function getItem(key: string): string | null {
  return store ? store.getItem(key) : (memory.get(key) ?? null);
}

export function setItem(key: string, value: string): void {
  if (store) store.setItem(key, value);
  else memory.set(key, value);
}
