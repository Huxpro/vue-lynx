import { ref } from 'vue-lynx';
import type { NotifyMessage, NotifyOptions } from './types';

export interface NotifyState {
  show: boolean;
  type: 'primary' | 'success' | 'danger' | 'warning';
  message: string | number;
  color?: string;
  background?: string;
  position?: 'top' | 'bottom';
  className?: unknown;
  lockScroll: boolean;
  zIndex?: number;
}

const getDefaultOptions = (): NotifyOptions => ({
  type: 'danger',
  color: undefined,
  message: '',
  onClose: undefined,
  onClick: undefined,
  onOpened: undefined,
  duration: 3000,
  position: undefined,
  className: '',
  lockScroll: false,
  background: undefined,
});

let currentOptions = getDefaultOptions();
let timer: ReturnType<typeof setTimeout> | null = null;
let currentOnClose: (() => void) | undefined;
let currentOnOpened: (() => void) | undefined;
let currentOnClick: ((event: any) => void) | undefined;

export const notifyState = ref<NotifyState>({
  show: false,
  type: 'danger',
  message: '',
  lockScroll: false,
});

function parseOptions(message: NotifyMessage | NotifyOptions): NotifyOptions {
  if (typeof message === 'object' && message !== null) {
    return message as NotifyOptions;
  }
  return { message };
}

export function closeNotify() {
  notifyState.value.show = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (currentOnClose) {
    currentOnClose();
    currentOnClose = undefined;
  }
}

export function showNotify(options: NotifyMessage | NotifyOptions) {
  const opts = { ...currentOptions, ...parseOptions(options) };

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  currentOnClose = opts.onClose;
  currentOnOpened = opts.onOpened;
  currentOnClick = opts.onClick;

  notifyState.value = {
    show: true,
    type: opts.type || 'danger',
    message: opts.message ?? '',
    color: opts.color,
    background: opts.background,
    position: opts.position,
    className: opts.className,
    lockScroll: opts.lockScroll || false,
    zIndex: opts.zIndex,
  };

  if (currentOnOpened) {
    currentOnOpened();
    currentOnOpened = undefined;
  }

  const duration = opts.duration ?? 3000;
  if (duration > 0) {
    timer = setTimeout(closeNotify, duration);
  }
}

export function setNotifyDefaultOptions(options: NotifyOptions) {
  Object.assign(currentOptions, options);
}

export function resetNotifyDefaultOptions() {
  currentOptions = getDefaultOptions();
}

export function getNotifyOnClick() {
  return currentOnClick;
}
