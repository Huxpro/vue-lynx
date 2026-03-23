export type DropdownMenuDirection = 'up' | 'down';

export interface DropdownChildExpose {
  state: {
    showPopup: boolean;
    transition: boolean;
    showWrapper: boolean;
  };
  toggle: (show?: boolean, options?: { immediate?: boolean }) => void;
}

export interface DropdownMenuProvide {
  props: {
    overlay: boolean;
    zIndex?: number | string;
    duration: number | string;
    direction: DropdownMenuDirection;
    activeColor?: string;
    closeOnClickOutside: boolean;
    closeOnClickOverlay: boolean;
  };
  offset: { value: number };
  opened: { readonly value: boolean };
  close: () => void;
  registerChild: (child: DropdownChildExpose) => void;
  unregisterChild: (child: DropdownChildExpose) => void;
  toggleItem: (child: DropdownChildExpose) => void;
}

export const DROPDOWN_KEY = Symbol('dropdownMenu');

export type DropdownMenuThemeVars = {
  dropdownMenuHeight?: string;
  dropdownMenuBackground?: string;
  dropdownMenuShadow?: string;
  dropdownMenuTitleFontSize?: string;
  dropdownMenuTitleTextColor?: string;
  dropdownMenuTitleActiveTextColor?: string;
  dropdownMenuTitleDisabledTextColor?: string;
  dropdownMenuTitlePadding?: string;
  dropdownMenuTitleLineHeight?: number | string;
  dropdownMenuOptionActiveColor?: string;
  dropdownMenuContentMaxHeight?: string;
};
