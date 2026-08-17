import type { InjectionKey } from 'vue-lynx';

export interface SidebarProvide {
  getActive: () => number;
  setActive: (value: number) => void;
  getNextIndex: () => number;
}

export const SIDEBAR_KEY: InjectionKey<SidebarProvide> = Symbol('van-sidebar');

export type SidebarThemeVars = {
  sidebarWidth?: string;
};
