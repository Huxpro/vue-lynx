export type CalendarSwitchMode = 'none' | 'month' | 'year-month';

export type CalendarType = 'single' | 'range' | 'multiple';

export type CalendarDayType =
  | ''
  | 'start'
  | 'start-end'
  | 'middle'
  | 'end'
  | 'selected'
  | 'multiple-middle'
  | 'multiple-selected'
  | 'disabled'
  | 'placeholder';

export type CalendarDayItem = {
  date?: Date;
  text?: number | string;
  type?: CalendarDayType;
  topInfo?: string;
  className?: unknown;
  bottomInfo?: string;
};

export type CalendarExpose = {
  reset: (date?: Date | Date[] | null) => void;
  scrollToDate: (targetDate: Date) => void;
  getSelectedDate: () => Date | Date[] | null;
};

export interface CalendarProps {
  show?: boolean;
  type?: CalendarType;
  switchMode?: CalendarSwitchMode;
  title?: string;
  color?: string;
  round?: boolean;
  readonly?: boolean;
  poppable?: boolean;
  maxRange?: number | string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  teleport?: string | object;
  showMark?: boolean;
  showTitle?: boolean;
  formatter?: (item: CalendarDayItem) => CalendarDayItem;
  rowHeight?: number | string;
  confirmText?: string;
  rangePrompt?: string;
  lazyRender?: boolean;
  showConfirm?: boolean;
  defaultDate?: Date | Date[] | null;
  allowSameDay?: boolean;
  showSubtitle?: boolean;
  showRangePrompt?: boolean;
  confirmDisabledText?: string;
  closeOnClickOverlay?: boolean;
  closeOnPopstate?: boolean;
  safeAreaInsetTop?: boolean;
  safeAreaInsetBottom?: boolean;
  minDate?: Date;
  maxDate?: Date;
  firstDayOfWeek?: number;
}
