import type { CurrentTime } from '../../composables/useCountDown';

export type CountDownExpose = {
  start: () => void;
  pause: () => void;
  reset: () => void;
};

export type CountDownCurrentTime = CurrentTime;

export type CountDownThemeVars = {
  countDownTextColor?: string;
  countDownFontSize?: string;
  countDownLineHeight?: number | string;
};
