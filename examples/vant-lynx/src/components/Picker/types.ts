import type { Numeric } from '../../utils/format';

export type PickerToolbarPosition = 'top' | 'bottom';

export type PickerFieldNames = {
  text?: string;
  value?: string;
  children?: string;
};

export type PickerOption = {
  text?: Numeric;
  value?: Numeric;
  disabled?: boolean;
  children?: PickerColumn;
  className?: unknown;
  [key: PropertyKey]: any;
};

export type PickerColumn = PickerOption[];

export type PickerExpose = {
  confirm: () => void;
  getSelectedOptions: () => Array<PickerOption | undefined>;
};

export type PickerColumnExpose = {
  stopMomentum: () => void;
};

export const PICKER_KEY = Symbol('picker') as symbol;

export type PickerProvide = {
  slots: Record<string, any>;
};
