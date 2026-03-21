import { ref, type App, createApp, h } from 'vue-lynx';
import ToastComponent from './index.vue';
import type { ToastProps } from './index.vue';

type ToastOptions = Partial<Omit<ToastProps, 'show'>> & { message: string };

let currentTimer: ReturnType<typeof setTimeout> | null = null;

const toastState = ref({
  show: false,
  type: 'text' as ToastProps['type'],
  message: '',
  position: 'middle' as ToastProps['position'],
  overlay: false,
  icon: '',
  duration: 2000,
});

export function showToast(options: string | ToastOptions) {
  const opts: ToastOptions =
    typeof options === 'string' ? { message: options } : options;

  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }

  toastState.value = {
    show: true,
    type: opts.type || 'text',
    message: opts.message,
    position: opts.position || 'middle',
    overlay: opts.overlay || false,
    icon: opts.icon || '',
    duration: opts.duration ?? 2000,
  };

  if (toastState.value.duration > 0) {
    currentTimer = setTimeout(() => {
      closeToast();
    }, toastState.value.duration);
  }
}

export function showLoadingToast(options: string | Omit<ToastOptions, 'type'>) {
  const opts = typeof options === 'string' ? { message: options } : options;
  showToast({ ...opts, type: 'loading', duration: opts.duration ?? 0 });
}

export function showSuccessToast(options: string | Omit<ToastOptions, 'type'>) {
  const opts = typeof options === 'string' ? { message: options } : options;
  showToast({ ...opts, type: 'success' });
}

export function showFailToast(options: string | Omit<ToastOptions, 'type'>) {
  const opts = typeof options === 'string' ? { message: options } : options;
  showToast({ ...opts, type: 'fail' });
}

export function closeToast() {
  toastState.value.show = false;
  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }
}

export { toastState };
