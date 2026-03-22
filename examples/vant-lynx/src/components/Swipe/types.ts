import type { InjectionKey, ComputedRef } from 'vue-lynx';

export type Numeric = number | string;

export type SwipeState = {
  rect: { width: number; height: number } | null;
  width: number;
  height: number;
  offset: number;
  active: number;
  swiping: boolean;
};

export type SwipeToOptions = {
  immediate?: boolean;
};

export type SwipeExpose = {
  prev: () => void;
  next: () => void;
  resize: () => void;
  swipeTo: (index: number, options?: SwipeToOptions) => void;
  state: SwipeState;
};

export interface SwipeProvide {
  props: {
    loop: boolean;
    vertical: boolean;
    lazyRender: boolean;
    width: Numeric;
    height: Numeric;
  };
  size: ComputedRef<number>;
  count: ComputedRef<number>;
  activeIndicator: ComputedRef<number>;
  registerChild: (child: SwipeItemExpose) => number;
  unregisterChild: (child: SwipeItemExpose) => void;
}

export interface SwipeItemExpose {
  setOffset: (offset: number) => void;
}

export const SWIPE_KEY: InjectionKey<SwipeProvide> = Symbol('van-swipe');

export type SwipeThemeVars = {
  swipeIndicatorSize?: string;
  swipeIndicatorMargin?: string;
  swipeIndicatorActiveOpacity?: number | string;
  swipeIndicatorInactiveOpacity?: number | string;
  swipeIndicatorActiveBackground?: string;
  swipeIndicatorInactiveBackground?: string;
};
