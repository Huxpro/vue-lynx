import type { ComponentPublicInstance } from 'vue-lynx';
import type { CellArrowDirection } from '../Cell/types';

export interface CollapseItemProps {
  name?: string | number;
  title?: string | number;
  value?: string | number;
  label?: string | number;
  icon?: string;
  size?: 'normal' | 'large';
  border?: boolean;
  isLink?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  lazyRender?: boolean;
  center?: boolean;
  clickable?: boolean | null;
  titleClass?: unknown;
  titleStyle?: string | Record<string, any>;
  valueClass?: unknown;
  labelClass?: unknown;
  arrowDirection?: CellArrowDirection;
  iconPrefix?: string;
  required?: boolean | 'auto' | null;
}

export type CollapseItemExpose = {
  toggle: (newValue?: boolean) => void;
};

export type CollapseItemInstance = ComponentPublicInstance<
  CollapseItemProps,
  CollapseItemExpose
>;

export type CollapseItemThemeVars = {
  collapseItemDuration?: string;
  collapseItemContentPadding?: string;
  collapseItemContentFontSize?: string;
  collapseItemContentLineHeight?: number | string;
  collapseItemContentTextColor?: string;
  collapseItemContentBackground?: string;
  collapseItemTitleDisabledColor?: string;
};
