<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as view/text (Lynx has no HTML tags)
  - classPrefix: accepted for API compat but unused (no @font-face / icon font support in Lynx)
  - No @font-face / icon font rendering — icons are mapped to unicode/emoji fallbacks
  - ConfigProvider iconPrefix injection: not yet supported
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
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
  classPrefix: 'van-icon',
  tag: 'i',
});

const emit = defineEmits<{
  click: [event: any];
}>();

const slots = useSlots();

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
  'cart-o': '\uD83D\uDED2',
  'cart': '\uD83D\uDED2',
};

const iconChar = computed(() => {
  if (isImageIcon.value) return '';
  return iconMap[props.name || ''] || props.name || '';
});

const addUnit = (value?: string | number): string | undefined => {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

const iconStyle = computed(() => {
  const style: Record<string, any> = {};
  if (props.color) style.color = props.color;
  if (props.size !== undefined) style.fontSize = addUnit(props.size);
  return style;
});

const imageStyle = computed(() => {
  const style: Record<string, any> = {};
  if (props.size !== undefined) {
    const s = addUnit(props.size);
    style.width = s;
    style.height = s;
  }
  return style;
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
  <Badge
    v-bind="mergedBadgeProps"
    @tap="onTap"
  >
    <!-- Image icon (name contains '/') -->
    <image v-if="isImageIcon" :src="name" :style="imageStyle" class="van-icon__image" />
    <!-- Unicode/text icon -->
    <text v-else :style="iconStyle">{{ iconChar }}</text>
    <slot />
  </Badge>
</template>
