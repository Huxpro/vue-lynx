<!--
  Vant Feature Parity Report:
  - Props: 8/8 supported (name, dot, badge, badgeProps, color, size, classPrefix, tag)
  - Events: 1/1 supported (click)
  - Slots: 1/1 supported (default)
  - Sub-components: Badge integrated for dot/badge display
  - Image URL Icons: name containing '/' rendered as <image>
  - Unicode Fallback Icons: mapped common Vant icon names to unicode chars
  - Lynx Limitations:
    - tag prop: accepted for API compat but always renders as view/text (Lynx has no HTML tags)
    - classPrefix: accepted for API compat but unused (no icon font in Lynx)
    - No @font-face / icon font support in Lynx
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Badge from '../Badge/index.vue';
import type { BadgeProps } from '../Badge/index.vue';

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

const props = withDefaults(defineProps<IconProps>(), {
  name: '',
  size: 16,
  color: '#323233',
  dot: false,
  classPrefix: 'van-icon',
  tag: 'i',
});

const emit = defineEmits<{
  click: [event: any];
}>();

// Detect image URL icons (same heuristic as Vant: name contains '/')
const isImageIcon = computed(() => props.name?.includes('/') ?? false);

// Unicode/emoji mappings for common Vant icons
const iconMap: Record<string, string> = {
  'arrow': '\u203A',
  'arrow-left': '\u2039',
  'arrow-up': '\u2303',
  'arrow-down': '\u2304',
  'success': '\u2713',
  'cross': '\u2717',
  'plus': '+',
  'minus': '\u2212',
  'fail': '\u2717',
  'close': '\u00D7',
  'checked': '\u2713',
  'clear': '\u2715',
  'search': '\uD83D\uDD0D',
  'star': '\u2605',
  'star-o': '\u2606',
  'like': '\u2764',
  'like-o': '\u2661',
  'warning': '\u26A0',
  'warning-o': '\u26A0',
  'info': '\u2139',
  'info-o': '\u24D8',
  'question': '?',
  'question-o': '\u2753',
  'chat': '\uD83D\uDCAC',
  'chat-o': '\uD83D\uDCAC',
  'setting': '\u2699',
  'setting-o': '\u2699',
  'fire': '\uD83D\uDD25',
  'fire-o': '\uD83D\uDD25',
  'location': '\uD83D\uDCCD',
  'location-o': '\uD83D\uDCCD',
  'phone': '\uD83D\uDCDE',
  'phone-o': '\uD83D\uDCDE',
  'photo': '\uD83D\uDCF7',
  'photo-o': '\uD83D\uDCF7',
};

const iconChar = computed(() => {
  if (isImageIcon.value) return '';
  return iconMap[props.name || ''] || props.name || '';
});

const iconSize = computed(() => {
  if (typeof props.size === 'string') {
    return parseInt(props.size, 10) || 16;
  }
  return props.size;
});

const iconStyle = computed(() => ({
  fontSize: iconSize.value,
  color: props.color,
  lineHeight: iconSize.value,
}));

const imageStyle = computed(() => ({
  width: iconSize.value,
  height: iconSize.value,
}));

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
  <Badge
    :dot="mergedBadgeProps.dot"
    :content="mergedBadgeProps.content"
    :color="mergedBadgeProps.color"
    :max="mergedBadgeProps.max"
    :show-zero="mergedBadgeProps.showZero"
    :offset="mergedBadgeProps.offset"
    :position="mergedBadgeProps.position"
    @tap="onTap"
  >
    <!-- Image icon (name contains '/') -->
    <image v-if="isImageIcon" :src="name" :style="imageStyle" />
    <!-- Unicode/text icon -->
    <text v-else :style="iconStyle">{{ iconChar }}</text>
    <slot />
  </Badge>
</template>
