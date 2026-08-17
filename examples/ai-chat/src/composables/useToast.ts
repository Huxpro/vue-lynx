import { ref } from 'vue-lynx';

import { uid } from '../lib/uid';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  icon?: string;
  color?: 'error' | 'success' | 'neutral';
  duration?: number;
}

const toasts = ref<Toast[]>([]);

/** Replaces Nuxt UI's useToast() + <UApp :toaster>. Rendered by Toaster.vue. */
export function useToast() {
  function add(toast: Omit<Toast, 'id'>) {
    const id = uid();
    toasts.value = [...toasts.value, { id, ...toast }];
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, add, remove };
}
