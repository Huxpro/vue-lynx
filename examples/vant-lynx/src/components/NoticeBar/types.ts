export type NoticeBarMode = 'closeable' | 'link';

export type NoticeBarExpose = {
  reset: () => void;
};

export type NoticeBarThemeVars = {
  noticeBarHeight?: string;
  noticeBarPadding?: string;
  noticeBarWrapablePadding?: string;
  noticeBarTextColor?: string;
  noticeBarFontSize?: string;
  noticeBarLineHeight?: number | string;
  noticeBarBackground?: string;
  noticeBarIconSize?: string;
  noticeBarIconMinWidth?: string;
};
