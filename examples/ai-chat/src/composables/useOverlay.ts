import { ref } from 'vue-lynx';

import { uid } from '../lib/uid';

export interface OverlayInstance {
  id: string;
  /** key into OverlayHost.vue's component map (no dynamic <component :is> needed) */
  name: string;
  props: Record<string, unknown>;
  resolve: (result: unknown) => void;
}

const stack = ref<OverlayInstance[]>([]);

/**
 * Replaces Nuxt UI's useOverlay() modal manager. open() resolves with the
 * value the overlay component emits via close — the same
 * `const result = await instance.result` flow the original uses.
 */
export function useOverlay() {
  function open<T = unknown>(name: string, props: Record<string, unknown> = {}) {
    let resolve!: (result: T) => void;
    const result = new Promise<T>((r) => {
      resolve = r;
    });
    const id = uid();
    stack.value = [...stack.value, {
      id,
      name,
      props,
      resolve: resolve as (result: unknown) => void,
    }];
    return { id, result };
  }

  function close(id: string, result: unknown) {
    const instance = stack.value.find((o) => o.id === id);
    stack.value = stack.value.filter((o) => o.id !== id);
    instance?.resolve(result);
  }

  return { stack, open, close };
}
