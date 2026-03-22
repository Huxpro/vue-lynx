export type ListDirection = 'up' | 'down';

export type ListExpose = {
  check: () => void;
};

export type ListThemeVars = {
  listTextColor?: string;
  listTextFontSize?: string;
  listTextLineHeight?: number | string;
  listLoadingIconSize?: string;
};
