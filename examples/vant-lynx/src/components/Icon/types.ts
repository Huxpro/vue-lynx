import { makeStringProp, numericProp } from '../../utils';
import type { ExtractPropTypes, PropType } from 'vue-lynx';
import type { BadgeProps } from '../badge/types';

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

export type IconProps = ExtractPropTypes<typeof iconProps>;
