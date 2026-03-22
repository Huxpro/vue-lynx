import type { ComponentPublicInstance, ComputedRef, Ref } from 'vue-lynx';

export type Numeric = number | string;

export type TabsType = 'line' | 'card';

export type Interceptor = (...args: any[]) => Promise<boolean> | boolean | undefined | void;

export type TabsClickTabEventParams = {
  name: Numeric;
  title: string;
  event: Event;
  disabled: boolean;
};

export interface TabChild {
  name: Numeric;
  title: string;
  disabled: boolean;
  dot: boolean;
  badge: Numeric | undefined;
  showZeroBadge: boolean;
  titleSlot: boolean;
  titleStyle?: string | Record<string, any>;
  index: number;
}

export interface TabsProvide {
  active: Ref<Numeric>;
  type: Ref<TabsType>;
  color: Ref<string | undefined>;
  lazyRender: Ref<boolean>;
  scrollspy: Ref<boolean>;
  titleActiveColor: Ref<string | undefined>;
  titleInactiveColor: Ref<string | undefined>;
  shrink: Ref<boolean>;
  ellipsis: Ref<boolean>;
  scrollable: ComputedRef<boolean>;
  registerTab: (tab: TabChild) => void;
  unregisterTab: (name: Numeric) => void;
  updateTab: (name: Numeric, updates: Partial<TabChild>) => void;
  setActive: (name: Numeric, title: string, event: Event) => void;
  onRendered: (name: Numeric, title?: string) => void;
  getTabIndex: () => number;
}

export interface TabsExpose {
  resize: () => void;
  scrollTo: (name: Numeric) => void;
}

export type TabsInstance = ComponentPublicInstance<Record<string, unknown>, TabsExpose>;

export type TabsThemeVars = {
  tabTextColor?: string;
  tabActiveTextColor?: string;
  tabDisabledTextColor?: string;
  tabFontSize?: string;
  tabLineHeight?: number | string;
  tabsDefaultColor?: string;
  tabsLineHeight?: number | string;
  tabsCardHeight?: string;
  tabsNavBackground?: string;
  tabsBottomBarWidth?: string;
  tabsBottomBarHeight?: string;
  tabsBottomBarColor?: string;
};

export const TABS_KEY = Symbol('tabs');
