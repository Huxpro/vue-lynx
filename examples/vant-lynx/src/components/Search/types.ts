export type SearchShape = 'square' | 'round';

export type SearchExpose = {
  focus: () => void;
  blur: () => void;
};

export type SearchThemeVars = {
  searchPadding?: string;
  searchBackground?: string;
  searchContentBackground?: string;
  searchInputHeight?: string;
  searchLabelPadding?: string;
  searchLabelColor?: string;
  searchLabelFontSize?: string;
  searchLeftIconColor?: string;
  searchActionPadding?: string;
  searchActionTextColor?: string;
  searchActionFontSize?: string;
};
