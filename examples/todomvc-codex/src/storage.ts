import type { Todo } from './todo';

export const STORAGE_KEY = 'vue-lynx:todomvc-codex';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryStorage = new Map<string, string>();

const fallbackStorage: StorageLike = {
  getItem(key) {
    return memoryStorage.get(key) ?? null;
  },
  setItem(key, value) {
    memoryStorage.set(key, value);
  },
  removeItem(key) {
    memoryStorage.delete(key);
  },
};

function resolveStorage(): StorageLike {
  const scope = globalThis as typeof globalThis & {
    localStorage?: StorageLike;
  };

  if (!scope.localStorage) {
    return fallbackStorage;
  }

  try {
    const probeKey = '__vue_lynx_todomvc_codex_probe__';
    scope.localStorage.setItem(probeKey, probeKey);
    scope.localStorage.removeItem(probeKey);
    return scope.localStorage;
  } catch {
    return fallbackStorage;
  }
}

const storage = resolveStorage();

function normalizeTodo(value: unknown): Todo | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawId = record.id;
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  const id =
    typeof rawId === 'number' ? rawId : typeof rawId === 'string' ? Number(rawId) : Number.NaN;

  if (!title || !Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    title,
    completed: Boolean(record.completed),
  };
}

export function loadTodos(): Todo[] {
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.reduce<Todo[]>((todos, item) => {
      const normalized = normalizeTodo(item);
      if (normalized) {
        todos.push(normalized);
      }
      return todos;
    }, []);
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
