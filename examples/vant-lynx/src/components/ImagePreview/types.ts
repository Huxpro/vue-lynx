import type { CSSProperties } from 'vue-lynx';

export type Interceptor = (...args: any[]) => Promise<boolean> | boolean | void;

export type PopupCloseIconPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface ImagePreviewScaleEventParams {
  scale: number;
  index: number;
}

export interface ImagePreviewProps {
  show?: boolean;
  images?: string[];
  loop?: boolean;
  minZoom?: number | string;
  maxZoom?: number | string;
  overlay?: boolean;
  vertical?: boolean;
  closeable?: boolean;
  showIndex?: boolean;
  className?: string | string[] | Record<string, boolean>;
  closeIcon?: string;
  transition?: string;
  beforeClose?: Interceptor;
  doubleScale?: boolean;
  overlayClass?: string | string[] | Record<string, boolean>;
  overlayStyle?: CSSProperties;
  swipeDuration?: number | string;
  startPosition?: number | string;
  showIndicators?: boolean;
  closeOnPopstate?: boolean;
  closeOnClickImage?: boolean;
  closeOnClickOverlay?: boolean;
  closeIconPosition?: PopupCloseIconPosition;
  teleport?: string | object;
}

export interface ImagePreviewItemProps {
  src?: string;
  show?: boolean;
  active?: number;
  minZoom: number | string;
  maxZoom: number | string;
  rootWidth: number;
  rootHeight: number;
  disableZoom?: boolean;
  doubleScale?: boolean;
  closeOnClickImage?: boolean;
  closeOnClickOverlay?: boolean;
  vertical?: boolean;
}

export type ImagePreviewThemeVars = {
  imagePreviewIndexTextColor?: string;
  imagePreviewIndexFontSize?: string;
  imagePreviewIndexLineHeight?: string;
  imagePreviewIndexTextShadow?: string;
  imagePreviewOverlayBackground?: string;
  imagePreviewCloseIconSize?: string;
  imagePreviewCloseIconColor?: string;
  imagePreviewCloseIconMargin?: string;
  imagePreviewCloseIconZIndex?: number | string;
};
