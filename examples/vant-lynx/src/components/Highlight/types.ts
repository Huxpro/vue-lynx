export interface HighlightProps {
  keywords?: string | string[];
  sourceString?: string;
  autoEscape?: boolean;
  caseSensitive?: boolean;
  highlightClass?: string;
  highlightTag?: string;
  unhighlightClass?: string;
  unhighlightTag?: string;
  tag?: string;
}

export type HighlightThemeVars = {
  highlightTagColor?: string;
};
