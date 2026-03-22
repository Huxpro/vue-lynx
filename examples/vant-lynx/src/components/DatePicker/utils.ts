import { padZero, clamp } from '../../utils/format';
import type { PickerOption } from '../Picker/types';
import type { DatePickerFilter, DatePickerFormatter } from './types';

export function times<T>(n: number, iteratee: (index: number) => T): T[] {
  if (n < 0 || !Number.isFinite(n)) return [];
  const result: T[] = Array(n);
  let index = -1;
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

export const getMonthEndDay = (year: number, month: number): number =>
  32 - new Date(year, month - 1, 32).getDate();

export const genOptions = <T extends string>(
  min: number,
  max: number,
  type: T,
  formatter: DatePickerFormatter,
  filter: DatePickerFilter | undefined,
  values: string[],
): PickerOption[] => {
  const options = times(max - min + 1, (index) => {
    const value = padZero(min + index);
    return formatter(type, {
      text: value,
      value,
    });
  });
  return filter ? filter(type, options, values) : options;
};

export const formatValueRange = (
  values: string[],
  columns: PickerOption[][],
): string[] =>
  values.map((value, index) => {
    const column = columns[index];
    if (column && column.length) {
      const minValue = +column[0].value!;
      const maxValue = +column[column.length - 1].value!;
      return padZero(clamp(+value, minValue, maxValue));
    }
    return value;
  });
