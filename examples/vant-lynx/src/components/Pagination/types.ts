export type PaginationMode = 'simple' | 'multi';

export type Numeric = string | number;

export type PageItem = {
  text: Numeric;
  number: number;
  active?: boolean;
};

export type PaginationThemeVars = {
  paginationHeight?: string;
  paginationFontSize?: string;
  paginationItemWidth?: string;
  paginationItemDefaultColor?: string;
  paginationItemDisabledColor?: string;
  paginationItemDisabledBackground?: string;
  paginationBackground?: string;
  paginationDescColor?: string;
  paginationDisabledOpacity?: number | string;
};
