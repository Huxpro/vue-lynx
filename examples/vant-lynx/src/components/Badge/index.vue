<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface BadgeProps {
  content?: string | number;
  color?: string;
  dot?: boolean;
  max?: number;
  showZero?: boolean;
  offset?: [number, number];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const props = withDefaults(defineProps<BadgeProps>(), {
  color: '#ee0a24',
  dot: false,
  showZero: true,
  position: 'top-right',
});

const hasContent = computed(() => {
  if (props.dot) return false;
  if (props.content === undefined || props.content === '') return false;
  if (typeof props.content === 'number' && props.content === 0 && !props.showZero) return false;
  return true;
});

const displayContent = computed(() => {
  if (typeof props.content === 'number' && props.max !== undefined && props.content > props.max) {
    return `${props.max}+`;
  }
  return String(props.content);
});

const badgeStyle = computed(() => {
  const offset = props.offset || [0, 0];
  const posStyle: Record<string, any> = {
    position: 'absolute',
  };

  if (props.position.includes('top')) posStyle.top = -4 + offset[1];
  if (props.position.includes('bottom')) posStyle.bottom = -4 + offset[1];
  if (props.position.includes('right')) posStyle.right = -8 + offset[0];
  if (props.position.includes('left')) posStyle.left = -8 + offset[0];

  return {
    ...posStyle,
    minWidth: props.dot ? 8 : 16,
    height: props.dot ? 8 : 16,
    borderRadius: props.dot ? 4 : 8,
    backgroundColor: props.color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: props.dot ? 0 : 3,
    paddingRight: props.dot ? 0 : 3,
  };
});
</script>

<template>
  <view :style="{ position: 'relative', display: 'inline-flex' }">
    <slot />
    <view v-if="dot || hasContent" :style="badgeStyle">
      <text v-if="hasContent" :style="{ fontSize: 10, color: '#fff', lineHeight: 16 }">{{ displayContent }}</text>
    </view>
  </view>
</template>
