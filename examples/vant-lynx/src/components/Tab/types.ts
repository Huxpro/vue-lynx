import type { CSSProperties } from 'vue-lynx';

export type Numeric = number | string;

export interface TabProps {
  title?: string;
  disabled?: boolean;
  dot?: boolean;
  badge?: Numeric;
  name?: Numeric;
  titleClass?: unknown;
  titleStyle?: string | CSSProperties;
  showZeroBadge?: boolean;
  url?: string;
  to?: string | Record<string, unknown>;
  replace?: boolean;
}

export type TabThemeVars = {
  tabTextColor?: string;
  tabActiveTextColor?: string;
  tabDisabledTextColor?: string;
  tabFontSize?: string;
  tabLineHeight?: number | string;
};
