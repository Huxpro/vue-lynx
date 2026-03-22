import type { Ref } from 'vue-lynx';

export type PopupPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | '';

export type PopupCloseIconPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type Interceptor = (
  ...args: any[]
) => Promise<boolean> | boolean | undefined | void;

export interface PopupProps {
  show?: boolean;
  position?: PopupPosition;
  round?: boolean;
  closeable?: boolean;
  closeIcon?: string;
  closeIconPosition?: PopupCloseIconPosition;
  duration?: number | string;
  overlay?: boolean;
  overlayClass?: string | string[] | Record<string, boolean>;
  overlayStyle?: Record<string, any>;
  overlayProps?: Record<string, any>;
  closeOnClickOverlay?: boolean;
  zIndex?: number | string;
  safeAreaInsetTop?: boolean;
  safeAreaInsetBottom?: boolean;
  beforeClose?: Interceptor;
  lockScroll?: boolean;
  lazyRender?: boolean;
  destroyOnClose?: boolean;
  closeOnPopstate?: boolean;
  iconPrefix?: string;
  transition?: string;
  transitionAppear?: boolean;
  teleport?: string | object;
}

export interface PopupExpose {
  popupRef: Ref;
}

export interface PopupThemeVars {
  popupBackground?: string;
  popupTransition?: string;
  popupRoundRadius?: string;
  popupCloseIconSize?: string;
  popupCloseIconColor?: string;
  popupCloseIconMargin?: string;
  popupCloseIconZIndex?: number | string;
}
