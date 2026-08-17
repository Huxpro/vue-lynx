export type RollingTextDirection = 'up' | 'down';
export type RollingTextStopOrder = 'ltr' | 'rtl';

export type RollingTextExpose = {
  start: () => void;
  reset: () => void;
};

export type RollingTextThemeVars = {
  rollingTextBackground?: string;
  rollingTextColor?: string;
  rollingTextFontSize?: string;
  rollingTextGap?: string;
  rollingTextItemWidth?: string;
  rollingTextItemBorderRadius?: string;
};
