import type { InjectionKey, ComputedRef } from 'vue-lynx';

export type RowAlign = 'top' | 'center' | 'bottom';

export type RowJustify =
  | 'start'
  | 'end'
  | 'center'
  | 'space-around'
  | 'space-between';

export interface RowProvide {
  gutterH: ComputedRef<number>;
  gutterV: ComputedRef<number>;
}

export const ROW_KEY: InjectionKey<RowProvide> = Symbol('van-row');

export interface RowThemeVars {
  // Row has no CSS variables in Vant
}
