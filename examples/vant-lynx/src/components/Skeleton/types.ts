import type { Numeric } from '../../utils';

export type SkeletonAvatarShape = 'round' | 'square';
export type SkeletonImageShape = 'square' | 'round';

export type SkeletonThemeVars = {
  skeletonParagraphHeight?: string;
  skeletonParagraphBackground?: string;
  skeletonParagraphMarginTop?: string;
  skeletonTitleWidth?: string;
  skeletonAvatarSize?: string;
  skeletonAvatarBackground?: string;
  skeletonImageSize?: string;
  skeletonImageRadius?: string;
  skeletonDuration?: string;
};

export interface SkeletonProps {
  row?: Numeric;
  rowWidth?: Numeric | Numeric[];
  round?: boolean;
  title?: boolean;
  titleWidth?: Numeric;
  avatar?: boolean;
  avatarSize?: Numeric;
  avatarShape?: SkeletonAvatarShape;
  loading?: boolean;
  animate?: boolean;
}

export interface SkeletonTitleProps {
  round?: boolean;
  titleWidth?: Numeric;
}

export interface SkeletonAvatarProps {
  avatarSize?: Numeric;
  avatarShape?: SkeletonAvatarShape;
}

export interface SkeletonParagraphProps {
  round?: boolean;
  rowWidth?: Numeric;
}

export interface SkeletonImageProps {
  imageSize?: Numeric;
  imageShape?: SkeletonImageShape;
}
