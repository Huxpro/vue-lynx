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

export type CheckboxGroupDirection = 'horizontal' | 'vertical';

export type CheckboxGroupToggleAllOptions =
  | boolean
  | {
      checked?: boolean;
      skipDisabled?: boolean;
    };

export type CheckboxGroupExpose = {
  toggleAll: (options?: CheckboxGroupToggleAllOptions) => void;
};

export type CheckboxGroupProvide = {
  props: {
    modelValue: unknown[];
    disabled: boolean;
    max: number | string;
    iconSize?: number | string;
    checkedColor?: string;
    shape: CheckboxShape;
    direction?: CheckboxGroupDirection;
  };
  updateValue: (value: unknown[]) => void;
};
