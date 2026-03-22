export type ToastType = 'text' | 'loading' | 'success' | 'fail' | 'html';

export type ToastPosition = 'top' | 'middle' | 'bottom';

export type ToastWordBreak = 'normal' | 'break-all' | 'break-word';

export interface ToastProps {
  show?: boolean;
  type?: ToastType;
  message?: string | number;
  position?: ToastPosition;
  overlay?: boolean;
  icon?: string;
  iconSize?: string | number;
  iconPrefix?: string;
  duration?: number;
  forbidClick?: boolean;
  closeOnClick?: boolean;
  closeOnClickOverlay?: boolean;
  wordBreak?: ToastWordBreak;
  className?: string | string[] | Record<string, any>;
  overlayClass?: string | string[] | Record<string, any>;
  overlayStyle?: Record<string, any>;
  transition?: string;
  teleport?: string | Element;
  zIndex?: number | string;
  loadingType?: 'circular' | 'spinner';
}

export interface ToastOptions extends Partial<Omit<ToastProps, 'show'>> {
  message?: string | number;
  onClose?: () => void;
  onOpened?: () => void;
}

export interface ToastWrapperInstance {
  close: () => void;
  message: string | number;
}

export interface ToastThemeVars {
  toastMaxWidth?: string;
  toastFontSize?: string;
  toastTextColor?: string;
  toastLoadingIconColor?: string;
  toastLineHeight?: number | string;
  toastRadius?: string;
  toastBackground?: string;
  toastIconSize?: string;
  toastTextMinWidth?: string;
  toastTextPadding?: string;
  toastDefaultPadding?: string;
  toastDefaultWidth?: string;
  toastDefaultMinHeight?: string;
  toastPositionTopDistance?: string;
  toastPositionBottomDistance?: string;
}
