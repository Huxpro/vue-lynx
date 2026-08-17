export type Numeric = string | number;

export type TreeSelectChild = {
  id: Numeric;
  text: string;
  disabled?: boolean;
};

export type TreeSelectItem = {
  dot?: boolean;
  text: string;
  badge?: Numeric;
  children?: TreeSelectChild[];
  disabled?: boolean;
  className?: unknown;
};

export type TreeSelectThemeVars = {
  treeSelectFontSize?: string;
  treeSelectNavBackground?: string;
  treeSelectContentBackground?: string;
  treeSelectNavItemPadding?: string;
  treeSelectItemHeight?: string;
  treeSelectItemActiveColor?: string;
  treeSelectItemDisabledColor?: string;
  treeSelectItemSelectedSize?: string;
};
