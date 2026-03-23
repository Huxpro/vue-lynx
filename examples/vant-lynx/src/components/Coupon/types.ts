import type { Numeric } from '../../utils/format';

export type CouponInfo = {
  id: Numeric;
  name: string;
  endAt: number;
  value: number;
  startAt: number;
  reason?: string;
  discount?: number;
  unitDesc?: string;
  condition?: string;
  valueDesc?: string;
  description: string;
  denominations?: number;
  originCondition?: number;
};

export type CouponThemeVars = {
  couponMargin?: string;
  couponContentHeight?: string;
  couponContentPadding?: string;
  couponContentTextColor?: string;
  couponBackground?: string;
  couponActiveBackground?: string;
  couponRadius?: string;
  couponShadow?: string;
  couponHeadWidth?: string;
  couponAmountColor?: string;
  couponAmountFontSize?: string;
  couponCurrencyFontSize?: string;
  couponNameFontSize?: string;
  couponDisabledTextColor?: string;
  couponDescriptionPadding?: string;
  couponDescriptionBorderColor?: string;
  couponCheckboxColor?: string;
};
