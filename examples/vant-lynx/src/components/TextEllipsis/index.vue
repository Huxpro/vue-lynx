<!--
  Vant Feature Parity Report:
  - Props: 6/6 supported
    - rows: Numeric (default 1) - number of visible rows before truncation
    - dots: string (default '...') - ellipsis characters
    - content: string (default '') - text content to display
    - expandText: string (default '') - text for expand action
    - collapseText: string (default '') - text for collapse action
    - position: 'start' | 'middle' | 'end' (default 'end') - truncation position
  - Events: 1/1 supported
    - clickAction: (expanded: boolean) - emitted when expand/collapse is clicked
  - Slots: 0/1 supported
    - action: NOT supported (Vant allows custom action slot with { expanded } scope)
  - Exposed Methods: 1/1 supported
    - toggle(expanded?: boolean): toggle expanded state
  - Lynx Adaptations:
    - No DOM text measurement APIs (getComputedStyle, offsetHeight)
    - Uses character-count approximation instead of pixel-based binary search
    - AVG_CHARS_PER_ROW is a heuristic; Vant measures actual rendered line height
    - No window resize recalculation (Vant watches windowWidth)
  - Gaps:
    - action slot not supported (only expandText/collapseText strings)
    - Text measurement is approximate (character-count heuristic, not pixel-based)
    - No recalculation on content/prop changes via DOM measurement
    - No onActivated recalculation for keep-alive scenarios
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

export interface TextEllipsisProps {
  content?: string;
  rows?: number;
  expandText?: string;
  collapseText?: string;
  dots?: string;
  position?: 'start' | 'middle' | 'end';
}

const props = withDefaults(defineProps<TextEllipsisProps>(), {
  content: '',
  rows: 1,
  expandText: '',
  collapseText: '',
  dots: '...',
  position: 'end',
});

const emit = defineEmits<{
  clickAction: [expanded: boolean];
}>();

const expanded = ref(false);
const hasAction = computed(() => !!props.expandText || !!props.collapseText);

// Approximate chars-per-row heuristic (Lynx has no DOM text measurement)
const AVG_CHARS_PER_ROW = 30;

const maxChars = computed(() => props.rows * AVG_CHARS_PER_ROW);

const isExceeded = computed(() => props.content.length > maxChars.value);

const displayText = computed(() => {
  if (expanded.value) {
    return props.content;
  }
  if (!props.content) return '';

  if (!isExceeded.value) {
    return props.content;
  }

  const actionSuffix = props.expandText ? ` ${props.expandText}` : '';
  const reservedLen = props.dots.length + actionSuffix.length;
  const availableLen = maxChars.value - reservedLen;

  if (availableLen <= 0) return props.dots;

  // Support position-based truncation (Vant parity)
  if (props.position === 'start') {
    return props.dots + props.content.slice(props.content.length - availableLen);
  }
  if (props.position === 'middle') {
    const half = Math.floor(availableLen / 2);
    return props.content.slice(0, half) + props.dots + props.content.slice(props.content.length - half);
  }

  // Default: 'end' truncation
  return props.content.slice(0, availableLen) + props.dots;
});

const shouldShowAction = computed(() => {
  if (!hasAction.value) return false;
  if (expanded.value && props.collapseText) return true;
  if (!expanded.value && props.expandText) {
    return isExceeded.value;
  }
  return false;
});

const actionText = computed(() => {
  return expanded.value ? props.collapseText : props.expandText;
});

function toggle(value?: boolean) {
  expanded.value = value ?? !expanded.value;
  emit('clickAction', expanded.value);
}

function toggleAction() {
  toggle();
}

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
}));

const textStyle = computed(() => ({
  fontSize: 14,
  color: '#323233',
  lineHeight: 20,
}));

const actionStyle = computed(() => ({
  fontSize: 14,
  color: '#1989fa',
}));

const textRowStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  flexWrap: 'wrap' as const,
}));

defineExpose({ toggle });
</script>

<template>
  <view :style="containerStyle">
    <view :style="textRowStyle">
      <text :style="textStyle">{{ displayText }}</text>
      <text
        v-if="shouldShowAction"
        :style="actionStyle"
        @tap="toggleAction"
      >{{ actionText }}</text>
    </view>
  </view>
</template>
