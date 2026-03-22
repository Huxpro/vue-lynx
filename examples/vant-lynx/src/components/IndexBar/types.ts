import type { ComponentPublicInstance, Ref } from 'vue-lynx';

export type Numeric = number | string;

export type IndexBarProvide = {
  props: {
    sticky: boolean;
    zIndex: Numeric | undefined;
    highlightColor: string | undefined;
    stickyOffsetTop: number;
    indexList: Numeric[];
  };
  activeAnchor: Ref<Numeric>;
};

export type IndexBarExpose = {
  scrollTo: (index: Numeric) => void;
};

export type IndexBarInstance = ComponentPublicInstance<
  Record<string, unknown>,
  IndexBarExpose
>;

export type IndexBarThemeVars = {
  indexBarSidebarZIndex?: number | string;
  indexBarIndexFontSize?: string;
  indexBarIndexLineHeight?: number | string;
  indexBarIndexActiveColor?: string;
};

export const INDEX_BAR_KEY = Symbol('indexBar');
