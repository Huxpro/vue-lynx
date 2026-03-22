import type { Numeric } from '../../utils';

export interface WatermarkProps {
  gapX?: number;
  gapY?: number;
  image?: string;
  width?: number;
  height?: number;
  rotate?: Numeric;
  zIndex?: Numeric;
  content?: string;
  opacity?: Numeric;
  fullPage?: boolean;
  textColor?: string;
}

export type WatermarkThemeVars = {
  watermarkZIndex?: number | string;
};
