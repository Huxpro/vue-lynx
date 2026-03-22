import type { Interceptor } from '../Popup/types';

export type DialogTheme = 'default' | 'round-button';
export type DialogAction = 'confirm' | 'cancel';
export type DialogMessage = string | (() => string);
export type DialogMessageAlign = 'left' | 'center' | 'right' | 'justify';

export type DialogOptions = {
  title?: string;
  width?: string | number;
  theme?: DialogTheme;
  message?: DialogMessage;
  overlay?: boolean;
  className?: string;
  allowHtml?: boolean;
  lockScroll?: boolean;
  transition?: string;
  beforeClose?: Interceptor;
  messageAlign?: DialogMessageAlign;
  overlayClass?: string;
  overlayStyle?: Record<string, any>;
  closeOnPopstate?: boolean;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  cancelButtonText?: string;
  cancelButtonColor?: string;
  cancelButtonDisabled?: boolean;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  confirmButtonDisabled?: boolean;
  closeOnClickOverlay?: boolean;
  destroyOnClose?: boolean;
  keyboardEnabled?: boolean;
};

export type DialogThemeVars = {
  dialogWidth?: string;
  dialogSmallScreenWidth?: string;
  dialogFontSize?: string;
  dialogTransition?: string;
  dialogRadius?: string;
  dialogBackground?: string;
  dialogHeaderFontWeight?: string;
  dialogHeaderLineHeight?: number | string;
  dialogHeaderPaddingTop?: string;
  dialogHeaderIsolatedPadding?: string;
  dialogMessagePadding?: string;
  dialogMessageFontSize?: string;
  dialogMessageLineHeight?: number | string;
  dialogMessageMaxHeight?: string;
  dialogHasTitleMessageTextColor?: string;
  dialogHasTitleMessagePaddingTop?: string;
  dialogButtonHeight?: string;
  dialogRoundButtonHeight?: string;
  dialogConfirmButtonTextColor?: string;
};
