export type Numeric = string | number;

export interface ProgressProps {
  /** Current percentage (0-100) */
  percentage?: Numeric;
  /** Height of the progress bar */
  strokeWidth?: Numeric;
  /** Color of the progress portion (supports gradient) */
  color?: string;
  /** Background color of the track */
  trackColor?: string;
  /** Custom text displayed on the pivot */
  pivotText?: string;
  /** Background color of the pivot badge */
  pivotColor?: string;
  /** Text color of the pivot label */
  textColor?: string;
  /** Whether the progress bar is inactive (grey) */
  inactive?: boolean;
  /** Whether to show the pivot label */
  showPivot?: boolean;
}

export type ProgressThemeVars = {
  progressHeight?: string;
  progressColor?: string;
  progressInactiveColor?: string;
  progressBackground?: string;
  progressPivotPadding?: string;
  progressPivotTextColor?: string;
  progressPivotFontSize?: string;
  progressPivotLineHeight?: number | string;
  progressPivotBackground?: string;
};
