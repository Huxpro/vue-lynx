import { makeStringProp, numericProp } from '../../utils';
import type { PropType } from 'vue-lynx';
import type { BadgeProps } from '../Badge/types';

export interface IconProps {
  dot?: boolean;
  spin?: boolean;
  tag?: string;
  name?: string;
  size?: number | string;
  badge?: number | string;
  color?: string;
  badgeProps?: Partial<BadgeProps>;
  classPrefix?: string;
}

export const iconProps = {
  dot: Boolean,
  spin: Boolean,
  tag: makeStringProp<keyof HTMLElementTagNameMap>('i'),
  name: String,
  size: numericProp,
  badge: numericProp,
  color: String,
  badgeProps: Object as PropType<Partial<BadgeProps>>,
  classPrefix: String,
};
