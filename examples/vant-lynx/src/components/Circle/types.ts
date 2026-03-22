export type Numeric = string | number;

export type CircleStartPosition = 'top' | 'right' | 'bottom' | 'left';

export interface CircleProps {
  text?: string;
  size?: Numeric;
  fill?: string;
  rate?: Numeric;
  speed?: Numeric;
  color?: string | Record<string, string>;
  clockwise?: boolean;
  layerColor?: string;
  currentRate?: number;
  strokeWidth?: Numeric;
  strokeLinecap?: string;
  startPosition?: CircleStartPosition;
}

export type CircleThemeVars = {
  circleSize?: string;
  circleColor?: string;
  circleLayerColor?: string;
  circleTextColor?: string;
  circleTextFontWeight?: string;
  circleTextFontSize?: string;
  circleTextLineHeight?: number | string;
};
