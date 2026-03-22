export type CheckboxShape = 'square' | 'round';

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
    max?: number | string;
    iconSize?: number | string;
    checkedColor?: string;
    shape: CheckboxShape;
    direction?: CheckboxGroupDirection;
  };
  updateValue: (value: unknown[]) => void;
};
