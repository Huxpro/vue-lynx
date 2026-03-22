import { ref, reactive, watch } from 'vue-lynx';
import type { DialogAction, DialogOptions } from './types';

const DEFAULT_OPTIONS: DialogOptions = {
  title: '',
  width: '',
  theme: undefined,
  message: '',
  overlay: true,
  className: '',
  allowHtml: false,
  lockScroll: true,
  transition: undefined,
  beforeClose: undefined,
  overlayClass: '',
  overlayStyle: undefined,
  messageAlign: undefined,
  cancelButtonText: '',
  cancelButtonColor: undefined,
  cancelButtonDisabled: false,
  confirmButtonText: '',
  confirmButtonColor: undefined,
  confirmButtonDisabled: false,
  showConfirmButton: true,
  showCancelButton: false,
  closeOnPopstate: true,
  closeOnClickOverlay: false,
  destroyOnClose: false,
};

let currentOptions = { ...DEFAULT_OPTIONS };

export const dialogState = reactive<DialogOptions & { show: boolean; callback?: (action?: DialogAction) => void }>({
  show: false,
  ...DEFAULT_OPTIONS,
});

export function showDialog(
  options: DialogOptions,
): Promise<DialogAction | undefined> {
  return new Promise((resolve, reject) => {
    const merged = { ...currentOptions, ...options };
    Object.assign(dialogState, merged, {
      show: true,
      callback: (action?: DialogAction) => {
        (action === 'confirm' ? resolve : reject)(action);
      },
    });
  });
}

export function showConfirmDialog(
  options: DialogOptions,
): Promise<DialogAction | undefined> {
  return showDialog({ showCancelButton: true, ...options });
}

export function closeDialog() {
  dialogState.show = false;
}

export function setDialogDefaultOptions(options: DialogOptions) {
  Object.assign(currentOptions, options);
}

export function resetDialogDefaultOptions() {
  currentOptions = { ...DEFAULT_OPTIONS };
}
