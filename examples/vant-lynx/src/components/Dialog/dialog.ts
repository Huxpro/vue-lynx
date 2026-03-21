import { ref } from 'vue-lynx';
import type { DialogProps } from './index.vue';

type DialogOptions = Partial<Omit<DialogProps, 'show'>>;

const dialogState = ref<DialogProps & { show: boolean }>({
  show: false,
  title: '',
  message: '',
  showConfirmButton: true,
  showCancelButton: false,
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  overlay: true,
});

export function showDialog(options: DialogOptions) {
  dialogState.value = {
    show: true,
    title: options.title ?? '',
    message: options.message ?? '',
    showConfirmButton: options.showConfirmButton ?? true,
    showCancelButton: options.showCancelButton ?? false,
    confirmButtonText: options.confirmButtonText ?? 'Confirm',
    cancelButtonText: options.cancelButtonText ?? 'Cancel',
    overlay: options.overlay ?? true,
  };
}

export function showConfirmDialog(options: DialogOptions) {
  showDialog({
    ...options,
    showConfirmButton: true,
    showCancelButton: true,
  });
}

export function closeDialog() {
  dialogState.value.show = false;
}

export { dialogState };
