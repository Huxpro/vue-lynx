import type { InjectionKey, Ref } from 'vue-lynx';

export type Numeric = number | string;

export type Interceptor = (...args: any[]) => Promise<boolean> | boolean | undefined | void;

export interface TabbarProvide {
  props: {
    modelValue: Numeric;
    fixed: boolean;
    border: boolean;
    zIndex: Numeric;
    activeColor?: string;
    inactiveColor?: string;
    placeholder: boolean;
    safeAreaInsetBottom: boolean | null;
    beforeChange?: Interceptor;
    route: boolean;
  };
  setActive: (active: Numeric, afterChange: () => void) => void;
  getNextIndex: () => number;
}

export const TABBAR_KEY: InjectionKey<TabbarProvide> = Symbol('van-tabbar');

export type TabbarThemeVars = {
  tabbarHeight?: string;
  tabbarZIndex?: number | string;
  tabbarBackground?: string;
};
