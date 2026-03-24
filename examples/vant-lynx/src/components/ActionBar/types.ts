import type { InjectionKey } from 'vue';

export interface ActionBarChild {
  isButton?: boolean;
}

export interface ActionBarProvide {
  registerChild: (child: ActionBarChild) => number;
  children: ActionBarChild[];
}

export const ACTION_BAR_KEY: InjectionKey<ActionBarProvide> = Symbol('van-action-bar');

export type ActionBarThemeVars = {
  actionBarBackground?: string;
  actionBarHeight?: string;
};
