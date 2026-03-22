export type ShareSheetOption = {
  name: string;
  icon: string;
  className?: string;
  description?: string;
};

export type ShareSheetOptions = ShareSheetOption[] | ShareSheetOption[][];

export type ShareSheetProps = {
  show?: boolean;
  title?: string;
  round?: boolean;
  options?: ShareSheetOption[] | ShareSheetOption[][];
  cancelText?: string;
  description?: string;
  closeOnPopstate?: boolean;
  safeAreaInsetBottom?: boolean;
  // Popup shared props
  zIndex?: number | string;
  overlay?: boolean;
  duration?: number | string;
  lockScroll?: boolean;
  lazyRender?: boolean;
  beforeClose?: (...args: any[]) => boolean | Promise<boolean>;
  overlayProps?: Record<string, any>;
  overlayStyle?: Record<string, any>;
  overlayClass?: string | string[] | Record<string, boolean>;
  transitionAppear?: boolean;
  closeOnClickOverlay?: boolean;
  teleport?: string | object;
};

export type ShareSheetThemeVars = {
  shareSheetHeaderPadding?: string;
  shareSheetTitleColor?: string;
  shareSheetTitleFontSize?: string;
  shareSheetTitleLineHeight?: number | string;
  shareSheetDescriptionColor?: string;
  shareSheetDescriptionFontSize?: string;
  shareSheetDescriptionLineHeight?: number | string;
  shareSheetIconSize?: string;
  shareSheetOptionNameColor?: string;
  shareSheetOptionNameFontSize?: string;
  shareSheetOptionDescriptionColor?: string;
  shareSheetOptionDescriptionFontSize?: string;
  shareSheetCancelButtonFontSize?: string;
  shareSheetCancelButtonHeight?: string;
  shareSheetCancelButtonBackground?: string;
};
