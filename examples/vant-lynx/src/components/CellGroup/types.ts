export interface CellGroupProps {
  title?: string;
  inset?: boolean;
  border?: boolean;
}

export type CellGroupThemeVars = {
  cellGroupBackground?: string;
  cellGroupTitleColor?: string;
  cellGroupTitlePadding?: string;
  cellGroupTitleFontSize?: string;
  cellGroupTitleLineHeight?: number | string;
  cellGroupInsetPadding?: string;
  cellGroupInsetRadius?: string;
  cellGroupInsetTitlePadding?: string;
};
