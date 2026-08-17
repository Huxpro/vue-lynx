export type RadioShape = 'square' | 'round' | 'dot';
export type RadioLabelPosition = 'left' | 'right';

export type RadioThemeVars = {
  radioSize?: string;
  radioDotSize?: string;
  radioBorderColor?: string;
  radioDuration?: string;
  radioLabelMargin?: string;
  radioLabelColor?: string;
  radioCheckedIconColor?: string;
  radioDisabledIconColor?: string;
  radioDisabledLabelColor?: string;
  radioDisabledBackground?: string;
};

export type RadioGroupDirection = 'horizontal' | 'vertical';

export type RadioGroupProvide = {
  props: {
    disabled?: boolean;
    iconSize?: number | string;
    direction?: RadioGroupDirection;
    modelValue?: unknown;
    checkedColor?: string;
    shape?: RadioShape;
  };
  updateValue: (value: unknown) => void;
};
