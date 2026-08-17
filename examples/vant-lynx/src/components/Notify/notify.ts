import { ref } from 'vue-lynx';

export interface NotifyOptions {
  type?: 'primary' | 'success' | 'warning' | 'danger';
  message: string;
  duration?: number;
  color?: string;
  background?: string;
}

export interface NotifyState {
  show: boolean;
  type: 'primary' | 'success' | 'warning' | 'danger';
  message: string;
  duration: number;
  color?: string;
  background?: string;
}

export const notifyState = ref<NotifyState>({
  show: false,
  type: 'danger',
  message: '',
  duration: 3000,
});

let _timer: ReturnType<typeof setTimeout> | null = null;

export function showNotify(options: NotifyOptions | string) {
  const opts: NotifyOptions =
    typeof options === 'string' ? { message: options } : options;

  if (_timer !== null) {
    clearTimeout(_timer);
    _timer = null;
  }

  notifyState.value = {
    show: true,
    type: opts.type ?? 'danger',
    message: opts.message,
    duration: opts.duration ?? 3000,
    color: opts.color,
    background: opts.background,
  };

  if (notifyState.value.duration > 0) {
    _timer = setTimeout(() => {
      notifyState.value.show = false;
      _timer = null;
    }, notifyState.value.duration);
  }
}

export function closeNotify() {
  if (_timer !== null) {
    clearTimeout(_timer);
    _timer = null;
  }
  notifyState.value.show = false;
}
