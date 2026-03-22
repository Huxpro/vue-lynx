export type StepsDirection = 'horizontal' | 'vertical';

export type StepsProps = {
  active: number | string;
  direction: StepsDirection;
  activeIcon: string;
  iconPrefix?: string;
  finishIcon?: string;
  activeColor?: string;
  inactiveIcon?: string;
  inactiveColor?: string;
};

export type StepsProvide = {
  props: StepsProps;
  onClickStep: (index: number) => void;
};

export const STEPS_KEY = Symbol('van-steps');

export type StepsThemeVars = {
  stepsBackground?: string;
};
