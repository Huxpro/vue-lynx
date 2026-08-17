import { ref, watch } from 'vue-lynx';
import type {
  ToastType,
  ToastOptions,
  ToastWrapperInstance,
} from './types';

// Default options
const defaultOptions: ToastOptions = {
  icon: '',
  type: 'text',
  message: '',
  className: '',
  overlay: false,
  onClose: undefined,
  onOpened: undefined,
  duration: 2000,
  iconSize: undefined,
  iconPrefix: undefined,
  position: 'middle',
  transition: 'van-fade',
  forbidClick: false,
  loadingType: undefined,
  overlayClass: '',
  overlayStyle: undefined,
  closeOnClick: false,
  closeOnClickOverlay: false,
  wordBreak: undefined,
  teleport: undefined,
  zIndex: 2000,
};

// Per-type default overrides
const defaultOptionsByType: Partial<Record<ToastType, ToastOptions>> = {};

let currentOptions = { ...defaultOptions };

// Toast queue for multiple mode
let allowMultiple = false;
const toastQueue: Array<{
  state: ReturnType<typeof ref<Record<string, any>>>;
  timer: ReturnType<typeof setTimeout> | null;
  onClose?: () => void;
  onOpened?: () => void;
}> = [];

// Single toast state (default mode)
export const toastState = ref<Record<string, any>>({
  show: false,
  type: 'text' as ToastType,
  message: '' as string | number,
  position: 'middle',
  overlay: false,
  icon: '',
  iconSize: undefined as string | number | undefined,
  iconPrefix: undefined as string | undefined,
  duration: 2000,
  forbidClick: false,
  closeOnClick: false,
  closeOnClickOverlay: false,
  wordBreak: undefined as string | undefined,
  loadingType: 'circular',
  zIndex: 2000,
});

let currentTimer: ReturnType<typeof setTimeout> | null = null;
let currentOnClose: (() => void) | undefined;
let currentOnOpened: (() => void) | undefined;

function resolveOptions(options: string | ToastOptions): ToastOptions {
  if (typeof options === 'string') {
    return { message: options };
  }
  return options;
}

function getDefaultOptions(type?: ToastType): ToastOptions {
  const typeDefaults = type ? defaultOptionsByType[type] : undefined;
  return { ...currentOptions, ...typeDefaults };
}

export function showToast(
  options: string | ToastOptions,
): ToastWrapperInstance {
  const opts = resolveOptions(options);
  const merged = { ...getDefaultOptions(opts.type), ...opts };

  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }

  // Store callbacks
  currentOnClose = merged.onClose;
  currentOnOpened = merged.onOpened;

  toastState.value = {
    show: true,
    type: merged.type || 'text',
    message: merged.message ?? '',
    position: merged.position || 'middle',
    overlay: merged.overlay || false,
    icon: merged.icon || '',
    iconSize: merged.iconSize,
    iconPrefix: merged.iconPrefix,
    duration: merged.duration ?? 2000,
    forbidClick: merged.forbidClick || false,
    closeOnClick: merged.closeOnClick || false,
    closeOnClickOverlay: merged.closeOnClickOverlay || false,
    wordBreak: merged.wordBreak,
    loadingType: merged.loadingType || 'circular',
    zIndex: merged.zIndex ?? 2000,
  };

  // Fire onOpened callback
  if (currentOnOpened) {
    currentOnOpened();
  }

  const duration = toastState.value.duration as number;
  if (duration > 0) {
    currentTimer = setTimeout(() => {
      closeToast();
    }, duration);
  }

  // Return instance with message getter/setter and close
  const instance: ToastWrapperInstance = {
    get message() {
      return toastState.value.message as string | number;
    },
    set message(val: string | number) {
      toastState.value.message = val;
    },
    close: () => closeToast(),
  };

  return instance;
}

export function showLoadingToast(
  options: string | ToastOptions,
): ToastWrapperInstance {
  const opts = resolveOptions(options);
  return showToast({
    ...opts,
    type: 'loading',
    duration: opts.duration ?? 0,
  });
}

export function showSuccessToast(
  options: string | ToastOptions,
): ToastWrapperInstance {
  const opts = resolveOptions(options);
  return showToast({ ...opts, type: 'success' });
}

export function showFailToast(
  options: string | ToastOptions,
): ToastWrapperInstance {
  const opts = resolveOptions(options);
  return showToast({ ...opts, type: 'fail' });
}

export function closeToast(closeAll?: boolean) {
  toastState.value.show = false;
  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }
  if (currentOnClose) {
    currentOnClose();
    currentOnClose = undefined;
  }
}

export function allowMultipleToast(value = true) {
  allowMultiple = value;
}

export function setToastDefaultOptions(
  typeOrOptions: ToastType | ToastOptions,
  options?: ToastOptions,
) {
  if (typeof typeOrOptions === 'string' && options) {
    defaultOptionsByType[typeOrOptions] = options;
  } else if (typeof typeOrOptions === 'object') {
    Object.assign(currentOptions, typeOrOptions);
  }
}

export function resetToastDefaultOptions(type?: ToastType) {
  if (type) {
    delete defaultOptionsByType[type];
  } else {
    currentOptions = { ...defaultOptions };
  }
}
