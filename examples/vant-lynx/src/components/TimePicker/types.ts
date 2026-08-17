import type { PickerOption } from '../Picker/types';

export type TimePickerColumnType = 'hour' | 'minute' | 'second';

export type TimePickerFilter = (
  columnType: string,
  options: PickerOption[],
  values: string[],
) => PickerOption[];

export type TimePickerFormatter = (
  type: string,
  option: PickerOption,
) => PickerOption;

export type TimePickerExpose = {
  confirm: () => void;
  getSelectedTime: () => string[];
};
