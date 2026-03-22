export type NotifyMessage = string | number;

export type NotifyType = 'primary' | 'success' | 'danger' | 'warning';

export type NotifyPosition = 'top' | 'bottom';

export type NotifyOptions = {
  type?: NotifyType;
  color?: string;
  message?: NotifyMessage;
  duration?: number;
  zIndex?: number;
  position?: NotifyPosition;
  className?: unknown;
  background?: string;
  lockScroll?: boolean;
  onClick?: (event: any) => void;
  onClose?: () => void;
  onOpened?: () => void;
};
