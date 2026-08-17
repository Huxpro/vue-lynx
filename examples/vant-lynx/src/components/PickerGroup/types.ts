import type { InjectionKey } from 'vue-lynx';

export interface PickerGroupChild {
  confirm: () => {
    selectedValues: (string | number)[];
    selectedOptions: (Record<string, unknown> | undefined)[];
    selectedIndexes: number[];
  };
  getSelectedOptions: () => (Record<string, unknown> | undefined)[];
}

export interface PickerGroupProvide {
  register: (child: PickerGroupChild) => void;
  unregister: (child: PickerGroupChild) => void;
}

export const PICKER_GROUP_KEY: InjectionKey<PickerGroupProvide> =
  Symbol('picker-group');

export type PickerGroupThemeVars = {
  pickerGroupBackground?: string;
};
