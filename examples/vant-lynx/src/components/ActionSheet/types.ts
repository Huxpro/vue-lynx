export type ActionSheetAction = {
  icon?: string;
  name?: string;
  color?: string;
  subname?: string;
  loading?: boolean;
  disabled?: boolean;
  callback?: (action: ActionSheetAction) => void;
  className?: unknown;
};

export type ActionSheetProps = {
  show?: boolean;
  title?: string;
  round?: boolean;
  actions?: ActionSheetAction[];
  closeIcon?: string;
  closeable?: boolean;
  cancelText?: string;
  description?: string;
  closeOnPopstate?: boolean;
  closeOnClickAction?: boolean;
  safeAreaInsetBottom?: boolean;
  // Popup shared props
  zIndex?: number | string;
  overlay?: boolean;
  duration?: number | string;
  lockScroll?: boolean;
  lazyRender?: boolean;
  beforeClose?: (...args: any[]) => boolean | Promise<boolean>;
  overlayProps?: Record<string, any>;
  overlayStyle?: Record<string, any>;
  overlayClass?: string | string[] | Record<string, boolean>;
  transitionAppear?: boolean;
  closeOnClickOverlay?: boolean;
  teleport?: string | object;
};
