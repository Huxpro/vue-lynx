<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as view/text (Lynx has no HTML tags)
  - ::before pseudo-element: Lynx has no ::before, so icon characters are rendered
    directly in a <text> element with font-family: 'vant-icon' instead
  - classPrefix: works for class naming but custom icon fonts need separate @font-face setup
  - ConfigProvider iconPrefix injection: not yet supported
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';
import { iconCharMap } from './icon-map';
import './index.less';

export interface IconProps {
  name?: string;
  size?: string | number;
  color?: string;
  dot?: boolean;
  badge?: string | number;
  classPrefix?: string;
  badgeProps?: Partial<BadgeProps>;
  tag?: string;
}

const [, bem] = createNamespace('icon');

const props = withDefaults(
  defineProps<{
    name?: string;
    size?: string | number;
    color?: string;
    dot?: boolean;
    badge?: string | number;
    classPrefix?: string;
    badgeProps?: Partial<BadgeProps>;
    tag?: string;
  }>(),
  {
    name: '',
    classPrefix: 'van-icon',
    tag: 'i',
  },
);

const emit = defineEmits<{
  click: [event: any];
}>();

const slots = useSlots();

// Detect image URL icons (same heuristic as Vant: name contains '/')
const isImageIcon = computed(() => props.name?.includes('/') ?? false);

// Get the Unicode character for the icon from the font map.
// For known icons: returns the @font-face glyph character.
// For unknown icons: falls back to the name itself (backward compat).
const iconChar = computed(() => {
  if (isImageIcon.value || !props.name) return '';
  return iconCharMap[props.name] || props.name;
});

// Whether the icon name is a known glyph in the vant-icon font
const isKnownIcon = computed(() => {
  return !isImageIcon.value && !!props.name && props.name in iconCharMap;
});

// Root element classes matching Vant's pattern:
// ['van-icon', 'van-icon-{name}'] or ['van-icon'] for image icons
const rootClasses = computed(() => {
  const { classPrefix, name } = props;
  const prefix = classPrefix || 'van-icon';
  return [
    prefix,
    isImageIcon.value ? '' : name ? `${prefix}-${name}` : '',
  ].filter(Boolean);
});

// Inline styles for dynamic color/size props (matching Vant).
// Applied to the <text>/<image> element directly since Lynx
// does not inherit CSS properties from parent to child by default.
const iconStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.color) style.color = props.color;
  if (props.size !== undefined) {
    const s = addUnit(props.size);
    if (s) style.fontSize = s;
  }
  return Object.keys(style).length > 0 ? style : undefined;
});

const imageStyle = computed(() => {
  if (props.size === undefined) return undefined;
  const s = addUnit(props.size);
  return s ? { width: s, height: s } : undefined;
});

// Merge badgeProps with dot/badge from icon props
const mergedBadgeProps = computed(() => ({
  dot: props.dot,
  content: props.badge,
  ...(props.badgeProps || {}),
}));

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <Badge v-bind="mergedBadgeProps">
    <view :class="rootClasses" :style="iconStyle" @tap="onTap">
      <!-- Image icon (name contains '/') -->
      <image
        v-if="isImageIcon"
        :src="name"
        :class="bem('image')"
        :style="imageStyle"
      />
      <!-- Font icon: render Unicode character with vant-icon font -->
      <text
        v-else
        :class="isKnownIcon ? 'van-icon__font' : undefined"
        :style="iconStyle"
      >{{ iconChar }}</text>
      <slot />
    </view>
  </Badge>
</template>
