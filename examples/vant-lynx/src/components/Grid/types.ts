import type { InjectionKey } from 'vue-lynx';

export type GridDirection = 'horizontal' | 'vertical';

export interface GridProvide {
  props: {
    square?: boolean;
    center?: boolean;
    border?: boolean;
    gutter?: number | string;
    reverse?: boolean;
    iconSize?: number | string;
    direction?: GridDirection;
    clickable?: boolean;
    columnNum: number | string;
  };
  registerChild: () => number;
}

export const GRID_KEY: InjectionKey<GridProvide> = Symbol('van-grid');

export type GridItemThemeVars = {
  gridItemContentPadding?: string;
  gridItemContentBackground?: string;
  gridItemContentActiveColor?: string;
  gridItemIconSize?: string;
  gridItemTextColor?: string;
  gridItemTextFontSize?: string;
};
