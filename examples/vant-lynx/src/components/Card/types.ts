import type { Numeric } from '../../utils/format';

export interface CardProps {
  tag?: string;
  num?: Numeric;
  desc?: string;
  thumb?: string;
  title?: string;
  price?: Numeric;
  centered?: boolean;
  lazyLoad?: boolean;
  currency?: string;
  thumbLink?: string;
  originPrice?: Numeric;
}

export type CardThemeVars = {
  cardPadding?: string;
  cardFontSize?: string;
  cardTextColor?: string;
  cardBackground?: string;
  cardThumbSize?: string;
  cardThumbRadius?: string;
  cardTitleLineHeight?: number | string;
  cardDescColor?: string;
  cardDescLineHeight?: number | string;
  cardPriceColor?: string;
  cardOriginPriceColor?: string;
  cardNumColor?: string;
  cardOriginPriceFontSize?: string;
  cardPriceFontSize?: string;
  cardPriceIntegerFontSize?: string;
  cardPriceFont?: string;
};
