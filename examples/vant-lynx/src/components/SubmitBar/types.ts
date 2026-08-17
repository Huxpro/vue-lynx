export type SubmitBarTextAlign = 'left' | 'right';

export interface SubmitBarProps {
  tip?: string;
  label?: string;
  price?: number;
  tipIcon?: string;
  loading?: boolean;
  currency?: string;
  disabled?: boolean;
  textAlign?: SubmitBarTextAlign;
  buttonText?: string;
  buttonType?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  buttonColor?: string;
  suffixLabel?: string;
  placeholder?: boolean;
  decimalLength?: number | string;
  safeAreaInsetBottom?: boolean;
}

export type SubmitBarThemeVars = {
  submitBarHeight?: string;
  submitBarZIndex?: number | string;
  submitBarBackground?: string;
  submitBarButtonWidth?: string;
  submitBarPriceColor?: string;
  submitBarPriceFontSize?: string;
  submitBarPriceIntegerFontSize?: string;
  submitBarPriceFont?: string;
  submitBarTextColor?: string;
  submitBarTextFontSize?: string;
  submitBarTipPadding?: string;
  submitBarTipFontSize?: string;
  submitBarTipLineHeight?: number | string;
  submitBarTipColor?: string;
  submitBarTipBackground?: string;
  submitBarTipIconSize?: string;
  submitBarButtonHeight?: string;
  submitBarPadding?: string;
};
