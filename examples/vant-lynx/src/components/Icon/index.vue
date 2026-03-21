<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface IconProps {
  name?: string;
  size?: string | number;
  color?: string;
  dot?: boolean;
  badge?: string | number;
}

const props = withDefaults(defineProps<IconProps>(), {
  size: 16,
  color: '#323233',
  dot: false,
});

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

const iconChar = computed(() => iconMap[props.name || ''] || props.name || '');

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
</script>

<template>
  <view :style="{ position: 'relative', display: 'inline-flex' }">
    <text :style="iconStyle">{{ iconChar }}</text>

    <!-- Dot badge -->
    <view
      v-if="dot"
      :style="{
        position: 'absolute',
        top: 0,
        right: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ee0a24',
      }"
    />

    <!-- Number badge -->
    <view
      v-if="badge !== undefined && !dot"
      :style="{
        position: 'absolute',
        top: -4,
        right: -8,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#ee0a24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 3,
        paddingRight: 3,
      }"
    >
      <text :style="{ fontSize: 10, color: '#fff', lineHeight: 16 }">{{ badge }}</text>
    </view>
  </view>
</template>
