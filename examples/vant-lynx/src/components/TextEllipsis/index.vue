<!--
  Lynx Limitations:
  - No DOM text measurement APIs (getComputedStyle, offsetHeight, cloneNode)
  - Uses character-count approximation instead of Vant's pixel-based binary search
  - No window resize recalculation (Vant watches windowWidth)
  - No onActivated recalculation for keep-alive scenarios
  - action slot: supported but scoped slot renders inline (no custom HTML element wrapping)
-->
<script setup lang="ts">
import { computed, ref, watch, useSlots } from 'vue-lynx';

const slots = useSlots();

export interface TextEllipsisProps {
  rows?: number | string;
  dots?: string;
  content?: string;
  expandText?: string;
  collapseText?: string;
  position?: 'start' | 'middle' | 'end';
}

export interface TextEllipsisExpose {
  toggle: (expanded?: boolean) => void;
}

const props = withDefaults(defineProps<TextEllipsisProps>(), {
  rows: 1,
  dots: '...',
  content: '',
  expandText: '',
  collapseText: '',
  position: 'end',
});

const emit = defineEmits<{
  clickAction: [event: Event];
}>();

const expanded = ref(false);

// Approximate chars-per-row heuristic (Lynx has no DOM text measurement)
const AVG_CHARS_PER_ROW = 30;

const rowCount = computed(() => Number(props.rows));
const maxChars = computed(() => rowCount.value * AVG_CHARS_PER_ROW);
const isExceeded = computed(() => props.content.length > maxChars.value);

const hasAction = computed(() => {
  if (!isExceeded.value) return false;
  return !!(props.expandText || props.collapseText || slots.action);
});

const actionText = computed(() =>
  expanded.value ? props.collapseText : props.expandText,
);

const truncatedText = computed(() => {
  if (!props.content) return '';
  if (!isExceeded.value) return props.content;

  const { dots, position, content, expandText } = props;
  const actionSuffix = expandText ? ` ${expandText}` : '';
  const reservedLen = dots.length + actionSuffix.length;
  const availableLen = maxChars.value - reservedLen;

  if (availableLen <= 0) return dots;

  if (position === 'start') {
    return dots + content.slice(content.length - availableLen);
  }
  if (position === 'middle') {
    const half = Math.floor(availableLen / 2);
    return content.slice(0, half) + dots + content.slice(content.length - half);
  }

  // Default: 'end' truncation
  return content.slice(0, availableLen) + dots;
});

const displayText = computed(() => {
  if (expanded.value) return props.content;
  return truncatedText.value;
});

function toggle(isExpanded?: boolean) {
  expanded.value = isExpanded ?? !expanded.value;
}

function onClickAction(event: Event) {
  toggle();
  emit('clickAction', event);
}

// Reset expanded state when content, rows, or position changes
watch(
  () => [props.content, props.rows, props.position],
  () => {
    expanded.value = false;
  },
);

defineExpose({ toggle });
</script>

<template>
  <view class="van-text-ellipsis">
    <text class="van-text-ellipsis__text">{{ displayText }}</text>
    <text
      v-if="hasAction && !$slots.action"
      class="van-text-ellipsis__action"
      @tap="onClickAction"
    >{{ actionText }}</text>
    <text
      v-if="hasAction && $slots.action"
      class="van-text-ellipsis__action"
      @tap="onClickAction"
    ><slot name="action" :expanded="expanded" /></text>
  </view>
</template>

<style src="./index.less" />
