import type { Numeric } from '../../utils';

export type BadgePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface BadgeProps {
  dot?: boolean;
  max?: number | string;
  tag?: string;
  color?: string;
  offset?: [Numeric, Numeric];
  content?: string | number;
  showZero?: boolean;
  position?: BadgePosition;
}

export type BadgeThemeVars = {
  badgeSize?: string;
  badgeColor?: string;
  badgePadding?: string;
  badgeFontSize?: string;
  badgeFontWeight?: string;
  badgeBorderWidth?: string;
  badgeBackground?: string;
  badgeDotColor?: string;
  badgeDotSize?: string;
  badgeFont?: string;
};
