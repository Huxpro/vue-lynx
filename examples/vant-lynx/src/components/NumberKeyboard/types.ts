export type NumberKeyboardTheme = 'default' | 'custom';

export type KeyType = '' | 'delete' | 'extra' | 'close';

export interface KeyConfig {
  text?: string | number;
  type?: KeyType;
  color?: string;
  wider?: boolean;
}

export type NumberKeyboardThemeVars = {
  numberKeyboardBackground?: string;
  numberKeyboardKeyHeight?: string;
  numberKeyboardKeyFontSize?: string;
  numberKeyboardKeyActiveColor?: string;
  numberKeyboardKeyBackground?: string;
  numberKeyboardDeleteFontSize?: string;
  numberKeyboardTitleColor?: string;
  numberKeyboardTitleHeight?: string;
  numberKeyboardTitleFontSize?: string;
  numberKeyboardClosePadding?: string;
  numberKeyboardCloseColor?: string;
  numberKeyboardCloseFontSize?: string;
  numberKeyboardButtonTextColor?: string;
  numberKeyboardButtonBackground?: string;
  numberKeyboardZIndex?: number | string;
};
