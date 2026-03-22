import type { PickerOption, PickerColumn, PickerFieldNames } from './types';
import type { Numeric } from '../../utils/format';

export function assignDefaultFields(
  fields?: PickerFieldNames,
): Required<PickerFieldNames> {
  return {
    text: fields?.text || 'text',
    value: fields?.value || 'value',
    children: fields?.children || 'children',
  };
}

export function getColumnsType(
  columns: (PickerOption | PickerColumn)[],
  fields: Required<PickerFieldNames>,
): 'default' | 'multiple' | 'cascade' {
  const firstColumn = columns[0];
  if (firstColumn) {
    if (Array.isArray(firstColumn)) {
      return 'multiple';
    }
    if (fields.children in firstColumn) {
      return 'cascade';
    }
  }
  return 'default';
}

export function findOptionByValue(
  options: PickerOption[],
  value: Numeric,
  fields: Required<PickerFieldNames>,
): PickerOption | undefined {
  return options.find(
    (option) => option[fields.value] === value && !option.disabled,
  );
}

export function isOptionExist(
  options: PickerOption[],
  value: Numeric,
  fields: Required<PickerFieldNames>,
): boolean {
  return !!findOptionByValue(options, value, fields);
}

export function getFirstEnabledOption(
  options: PickerOption[],
): PickerOption | undefined {
  return options.find((option) => !option.disabled);
}

export function findIndexOfEnabledOption(
  options: PickerOption[],
  index: number,
): number {
  index = Math.max(0, Math.min(index, options.length - 1));
  // Search forward from index
  for (let i = index; i < options.length; i++) {
    if (!options[i].disabled) return i;
  }
  // Search backward from index
  for (let i = index - 1; i >= 0; i--) {
    if (!options[i].disabled) return i;
  }
  return 0;
}

export function formatCascadeColumns(
  columns: PickerOption[],
  fields: Required<PickerFieldNames>,
  selectedValues: Numeric[],
): PickerColumn[] {
  const formatted: PickerColumn[] = [];
  let cursor: PickerOption[] | undefined = columns;
  let columnIndex = 0;

  while (cursor && cursor.length) {
    formatted.push(cursor);

    const value = selectedValues[columnIndex];
    let selectedOption: PickerOption | undefined;

    if (value !== undefined) {
      selectedOption = findOptionByValue(cursor, value, fields);
    }

    if (!selectedOption) {
      selectedOption = getFirstEnabledOption(cursor);
    }

    cursor = selectedOption
      ? (selectedOption[fields.children] as PickerOption[] | undefined)
      : undefined;
    columnIndex++;
  }

  return formatted;
}
