<!--
  Vant Feature Parity Report:
  - Props: 5/6 supported (content, rows, expandText, collapseText, dots; missing: position)
  - Events: 1/1 supported (clickAction)
  - Slots: 0/1 supported (missing: action)
  - Gaps: no position prop (middle truncation), no action slot, no DOM-based text measurement (uses fixed char-per-row estimate), no toggle() expose
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

export interface TextEllipsisProps {
  content?: string;
  rows?: number;
  expandText?: string;
  collapseText?: string;
  dots?: string;
}

const props = withDefaults(defineProps<TextEllipsisProps>(), {
  content: '',
  rows: 1,
  expandText: '',
  collapseText: '',
  dots: '...',
});

const emit = defineEmits<{
  clickAction: [expanded: boolean];
}>();

const expanded = ref(false);
const hasAction = computed(() => !!props.expandText || !!props.collapseText);

const displayText = computed(() => {
  if (expanded.value) {
    return props.content;
  }
  if (!props.content) return '';

  // Simple character-based truncation as a fallback
  // In a real Lynx environment, text measurement would be used
  const avgCharsPerRow = 30;
  const maxChars = props.rows * avgCharsPerRow;

  if (props.content.length <= maxChars) {
    return props.content;
  }

  const actionText = props.expandText ? ` ${props.expandText}` : '';
  const truncLen = maxChars - props.dots.length - actionText.length;
  if (truncLen <= 0) return props.dots;

  return props.content.slice(0, truncLen) + props.dots;
});

const shouldShowAction = computed(() => {
  if (!hasAction.value) return false;
  if (expanded.value && props.collapseText) return true;
  if (!expanded.value && props.expandText) {
    const avgCharsPerRow = 30;
    const maxChars = props.rows * avgCharsPerRow;
    return props.content.length > maxChars;
  }
  return false;
});

const actionText = computed(() => {
  return expanded.value ? props.collapseText : props.expandText;
});

function toggleAction() {
  expanded.value = !expanded.value;
  emit('clickAction', expanded.value);
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
