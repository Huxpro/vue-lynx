import type { InjectionKey, ComputedRef } from 'vue-lynx';

export type RowAlign = 'top' | 'center' | 'bottom';

export type RowJustify =
  | 'start'
  | 'end'
  | 'center'
  | 'space-around'
  | 'space-between';

export type RowSpaces = { left?: number; right: number }[];
export type VerticalSpaces = { bottom?: number }[];

export interface RowProvide {
  spaces: ComputedRef<RowSpaces>;
  verticalSpaces: ComputedRef<VerticalSpaces>;
  register: (uid: number, span: number) => void;
  unregister: (uid: number) => void;
  updateSpan: (uid: number, span: number) => void;
  getIndex: (uid: number) => number;
}

export const ROW_KEY: InjectionKey<RowProvide> = Symbol('van-row');

export interface RowThemeVars {
  // Row has no CSS variables in Vant
}
