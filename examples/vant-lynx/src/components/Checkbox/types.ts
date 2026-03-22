export type CheckboxShape = 'square' | 'round';
export type CheckboxLabelPosition = 'left' | 'right';

export type CheckboxExpose = {
  toggle: (newValue?: boolean) => void;
  checked: boolean;
};

export type CheckboxThemeVars = {
  checkboxSize?: string;
  checkboxBorderColor?: string;
  checkboxDuration?: string;
  checkboxLabelMargin?: string;
  checkboxLabelColor?: string;
  checkboxCheckedIconColor?: string;
  checkboxDisabledIconColor?: string;
  checkboxDisabledLabelColor?: string;
  checkboxDisabledBackground?: string;
};

export type {
  CheckboxGroupDirection,
  CheckboxGroupToggleAllOptions,
  CheckboxGroupExpose,
  CheckboxGroupProvide,
} from '../CheckboxGroup/types';
