export type DropdownItemOptionValue = string | number | boolean;

export interface DropdownItemOption {
  text: string;
  value: DropdownItemOptionValue;
  icon?: string;
  disabled?: boolean;
}

export type DropdownItemThemeVars = {
  dropdownItemZIndex?: number | string;
};
