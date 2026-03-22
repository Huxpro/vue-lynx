export interface BackTopProps {
  right?: string | number;
  bottom?: string | number;
  zIndex?: string | number;
  target?: string;
  offset?: string | number;
  immediate?: boolean;
  teleport?: string;
}

export type BackTopThemeVars = {
  backTopSize?: string;
  backTopRight?: string;
  backTopBottom?: string;
  backTopZIndex?: number | string;
  backTopIconSize?: string;
  backTopTextColor?: string;
  backTopBackground?: string;
};
