export type PullRefreshStatus =
  | 'normal'
  | 'loading'
  | 'loosing'
  | 'pulling'
  | 'success';

export type PullRefreshThemeVars = {
  pullRefreshHeadHeight?: string;
  pullRefreshHeadFontSize?: string;
  pullRefreshHeadTextColor?: string;
  pullRefreshLoadingIconSize?: string;
};
