import type { PickerOption } from '../Picker/types';

export type DatePickerColumnType = 'year' | 'month' | 'day';

export type DatePickerFilter = (
  columnType: string,
  options: PickerOption[],
  values: string[],
) => PickerOption[];

export type DatePickerFormatter = (
  type: string,
  option: PickerOption,
) => PickerOption;

export type DatePickerExpose = {
  confirm: () => void;
  getSelectedDate: () => string[];
};
